import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Map our sport IDs to SportsGameOdds league IDs
const leagueIdMap: Record<string, string> = {
  'nba': 'NBA',
  'nfl': 'NFL',
  'mlb': 'MLB',
  'nhl': 'NHL',
  'ncaaf': 'NCAAF',
  'ncaab': 'NCAAB',
  'soccer': 'EPL',
  'mma': 'UFC',
  'tennis': 'ATP',
  'boxing': 'BOXING',
  'golf': 'PGA',
};

serve(async (req) => {
  // Handle CORS preflight
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

    console.log(`Fetching odds for sport: ${sport} (leagueID: ${leagueId})`);

    // Fetch events with odds from SportsGameOdds API
    // Note: SportsGameOdds v2 is required for most API keys.
    const apiUrl = `https://api.sportsgameodds.com/v2/events?leagueID=${leagueId}&oddsAvailable=true&limit=50`;
    
    const response = await fetch(apiUrl, {
      headers: {
        'x-api-key': API_KEY,
      },
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
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Failed to fetch odds data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    // v2 returns a paginated payload with `data`; keep fallbacks for safety.
    const events = data?.data || data?.events || data?.items || [];

    console.log(`Received ${events.length} events from SportsGameOdds`);

    // Transform the data to our format
    const transformedGames = events.map((event: any) => {
      const homeTeam = event.teams?.home?.name || event.homeTeam || 'Home';
      const awayTeam = event.teams?.away?.name || event.awayTeam || 'Away';
      
      // Extract odds from the event
      const odds = (event as any).odds ?? {};
      let moneylineHome = 0;
      let moneylineAway = 0;
      let spreadHome = 0;
      let spreadHomeOdds = -110;
      let spreadAway = 0;
      let spreadAwayOdds = -110;
      let totalOver = 0;
      let totalOverOdds = -110;
      let totalUnder = 0;
      let totalUnderOdds = -110;

      const getPrice = (o: any) =>
        o?.closeFairOdds ?? o?.closeOdds ?? o?.fairOdds ?? o?.odds ?? 0;

      const getLine = (o: any) =>
        o?.line ??
        o?.point ??
        o?.closeFairSpread ??
        o?.fairSpread ??
        o?.closeFairOverUnder ??
        o?.fairOverUnder ??
        0;

      const oddsEntries = odds && typeof odds === 'object' ? Object.entries(odds) : [];

      // Parse odds object - SportsGameOdds uses oddID format (varies by API version)
      for (const [oddId, oddData] of oddsEntries) {
        const odd = oddData as any;

        // Moneyline odds (h2h)
        if (oddId.includes('moneyline') || oddId.includes('h2h')) {
          if (oddId.includes('home')) {
            moneylineHome = getPrice(odd);
          } else if (oddId.includes('away')) {
            moneylineAway = getPrice(odd);
          }
        }

        // Spread/handicap odds
        if (oddId.includes('spread') || oddId.includes('handicap')) {
          if (oddId.includes('home')) {
            spreadHome = getLine(odd);
            spreadHomeOdds = getPrice(odd) || -110;
          } else if (oddId.includes('away')) {
            spreadAway = getLine(odd);
            spreadAwayOdds = getPrice(odd) || -110;
          }
        }

        // Total/over-under odds
        if (oddId.includes('total') || oddId.includes('over') || oddId.includes('under')) {
          if (oddId.includes('over')) {
            totalOver = getLine(odd);
            totalOverOdds = getPrice(odd) || -110;
          } else if (oddId.includes('under')) {
            totalUnder = getLine(odd);
            totalUnderOdds = getPrice(odd) || -110;
          }
        }
      }

      return {
        id: event.eventID || event.id,
        sportKey: leagueId.toLowerCase(),
        sportTitle: event.league || leagueId,
        commenceTime: event.startTime || event.startDate || new Date().toISOString(),
        homeTeam,
        awayTeam,
        bookmaker: 'Consensus',
        odds: {
          moneyline: {
            home: moneylineHome,
            away: moneylineAway,
          },
          spread: {
            home: spreadHome,
            homeOdds: spreadHomeOdds,
            away: spreadAway,
            awayOdds: spreadAwayOdds,
          },
          total: {
            over: totalOver,
            overOdds: totalOverOdds,
            under: totalUnder,
            underOdds: totalUnderOdds,
          },
        },
        hasOdds: Object.keys(odds).length > 0,
      };
    });

    console.log(`Returning ${transformedGames.length} games with odds`);

    return new Response(
      JSON.stringify({ 
        games: transformedGames,
        remainingRequests: null, // SportsGameOdds doesn't expose this in the same way
        lastUpdated: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-odds function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});