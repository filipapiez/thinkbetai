import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Map our sport IDs to SportsGameOdds league IDs
// 15 most popular sports
const leagueIdMap: Record<string, string> = {
  // Major US Sports
  'nba': 'NBA',
  'nfl': 'NFL',
  'mlb': 'MLB',
  'nhl': 'NHL',
  'ncaab': 'NCAAB',
  'ncaaf': 'NCAAF',
  // Soccer Leagues
  'epl': 'EPL',
  'laliga': 'LALIGA',
  'bundesliga': 'BUNDESLIGA',
  'seriea': 'SERIEA',
  'mls': 'MLS',
  // Other Popular Sports
  'ufc': 'UFC',
  'atp': 'ATP',
  'wta': 'WTA',
  'tabletennis': 'TABLETENNIS',
  'boxing': 'BOXING',
  'pga': 'PGA',
  'cricket': 'CRICKET',
  'esports': 'ESPORTS',
};

// In-memory cache to reduce external API calls and avoid rate limits
// Note: cache is per runtime instance (helps a lot even with occasional cold starts)
const oddsCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const API_KEY = Deno.env.get('SPORTSGAMEODDS_API_KEY');
    if (!API_KEY) {
      console.error('SPORTSGAMEODDS_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const sport = url.searchParams.get('sport') || 'nba';
    const leagueId = leagueIdMap[sport.toLowerCase()] || 'NBA';

    // Cache lookup
    const cached = oddsCache.get(leagueId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return new Response(JSON.stringify(cached.data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'x-cache': 'HIT' },
      });
    }

    console.log(`Fetching odds for sport: ${sport} (leagueID: ${leagueId})`);

    // Fetch events with odds from SportsGameOdds API v2
    // Use oddsAvailable=true to only get events with active odds
    const apiUrl = `https://api.sportsgameodds.com/v2/events?leagueID=${leagueId}&oddsAvailable=true&limit=50`;
    
    const response = await fetch(apiUrl, {
      headers: { 'x-api-key': API_KEY },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`SportsGameOdds API error: ${response.status} - ${errorText}`);
      
      if (response.status === 401 || response.status === 403) {
        return new Response(
          JSON.stringify({ error: 'Invalid API key' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 429) {
        // If we have *any* cached snapshot (even slightly stale), return it to keep the UI working.
        if (cached) {
          return new Response(JSON.stringify(cached.data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json', 'x-cache': 'STALE' },
          });
        }

        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Handle subscription tier limitations gracefully
      if (response.status === 400 && errorText.includes('unavailable at your current subscription')) {
        console.log(`League ${leagueId} not available in subscription - returning empty`);
        return new Response(
          JSON.stringify({ games: [], remainingRequests: null, lastUpdated: new Date().toISOString() }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Failed to fetch odds data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const events = data?.data || data?.events || data?.items || [];

    console.log(`Received ${events.length} events from SportsGameOdds for ${leagueId}`);

    // Transform events to our format using correct v2 API structure
    const transformedGames = events.map((event: any) => {
      // v2 API structure: teams.home.names.long/short, teams.away.names.long/short
      const homeTeamName = event.teams?.home?.names?.long || 
                           event.teams?.home?.names?.medium || 
                           event.teams?.home?.name || 
                           event.homeTeam || 
                           'Home Team';
      const awayTeamName = event.teams?.away?.names?.long || 
                           event.teams?.away?.names?.medium || 
                           event.teams?.away?.name || 
                           event.awayTeam || 
                           'Away Team';
      
      // Get abbreviations
      const homeAbbr = event.teams?.home?.names?.short || homeTeamName.substring(0, 3).toUpperCase();
      const awayAbbr = event.teams?.away?.names?.short || awayTeamName.substring(0, 3).toUpperCase();
      
      // Get start time from status.startsAt (v2 format)
      const startTime = event.status?.startsAt || event.startTime || event.startDate || new Date().toISOString();
      
      // Get status
      const isLive = event.status?.live === true;
      const isStarted = event.status?.started === true;
      const isEnded = event.status?.ended === true;
      
      // Parse odds from v2 format (oddID keys like "points-home-game-ml-home")
      const odds = event.odds || {};
      let moneylineHome = 0, moneylineAway = 0;
      let spreadHome = 0, spreadHomeOdds = -110;
      let spreadAway = 0, spreadAwayOdds = -110;
      let totalOver = 0, totalOverOdds = -110;
      let totalUnder = 0, totalUnderOdds = -110;

      // Helper to parse American odds string to number
      const parseOdds = (oddsStr: any): number => {
        if (typeof oddsStr === 'number') return oddsStr;
        if (typeof oddsStr === 'string') {
          const cleaned = oddsStr.replace(/[^0-9+-]/g, '');
          return parseInt(cleaned) || 0;
        }
        return 0;
      };

      // v2 uses oddID format: {statID}-{statEntityID}-{periodID}-{betTypeID}-{sideID}
      for (const [oddId, oddData] of Object.entries(odds)) {
        const odd = oddData as any;
        const fairOdds = parseOdds(odd?.fairOdds || odd?.bookOdds || odd?.odds || 0);
        
        // Moneyline: points-home-game-ml-home, points-away-game-ml-away
        if (oddId === 'points-home-game-ml-home' || oddId.includes('-ml-home')) {
          moneylineHome = fairOdds;
        }
        if (oddId === 'points-away-game-ml-away' || oddId.includes('-ml-away')) {
          moneylineAway = fairOdds;
        }
        
        // Spread: points-home-game-sp-home, points-away-game-sp-away
        if (oddId === 'points-home-game-sp-home' || oddId.includes('-sp-home')) {
          spreadHome = parseFloat(odd?.fairSpread || odd?.bookSpread || odd?.spread || odd?.line || 0);
          spreadHomeOdds = fairOdds || -110;
        }
        if (oddId === 'points-away-game-sp-away' || oddId.includes('-sp-away')) {
          spreadAway = parseFloat(odd?.fairSpread || odd?.bookSpread || odd?.spread || odd?.line || 0);
          spreadAwayOdds = fairOdds || -110;
        }
        
        // Over/Under: points-all-game-ou-over, points-all-game-ou-under
        if (oddId === 'points-all-game-ou-over' || oddId.includes('-ou-over')) {
          totalOver = parseFloat(odd?.fairOverUnder || odd?.bookOverUnder || odd?.overUnder || odd?.line || 0);
          totalOverOdds = fairOdds || -110;
        }
        if (oddId === 'points-all-game-ou-under' || oddId.includes('-ou-under')) {
          totalUnder = parseFloat(odd?.fairOverUnder || odd?.bookOverUnder || odd?.overUnder || odd?.line || 0);
          totalUnderOdds = fairOdds || -110;
        }
      }

      const hasValidOdds = moneylineHome !== 0 || moneylineAway !== 0 || spreadHome !== 0 || totalOver !== 0;

      return {
        id: event.eventID || event.id,
        sportKey: leagueId.toLowerCase(),
        sportTitle: event.leagueID || leagueId,
        commenceTime: startTime,
        homeTeam: homeTeamName,
        awayTeam: awayTeamName,
        homeAbbr,
        awayAbbr,
        status: isEnded ? 'final' : isLive ? 'live' : 'scheduled',
        bookmaker: 'Consensus',
        odds: {
          moneyline: { home: moneylineHome, away: moneylineAway },
          spread: { home: spreadHome, homeOdds: spreadHomeOdds, away: spreadAway, awayOdds: spreadAwayOdds },
          total: { over: totalOver, overOdds: totalOverOdds, under: totalUnder, underOdds: totalUnderOdds },
        },
        hasOdds: hasValidOdds,
      };
    });

    // Filter out games without team names
    const validGames = transformedGames.filter((g: any) => 
      g.homeTeam !== 'Home Team' && g.awayTeam !== 'Away Team'
    );

    console.log(`Returning ${validGames.length} valid games with odds for ${leagueId}`);

    const responsePayload = {
      games: validGames,
      remainingRequests: null,
      lastUpdated: new Date().toISOString(),
    };

    // Update cache
    oddsCache.set(leagueId, { data: responsePayload, timestamp: Date.now() });

    return new Response(JSON.stringify(responsePayload), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'x-cache': 'MISS' },
    });

  } catch (error) {
    console.error('Error in get-odds function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
