const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// SPORTSBOOK API via RapidAPI
// Host: sportsbook-api2.p.rapidapi.com
// Base URL must go through RapidAPI proxy
// 
// Available endpoints (from Swagger docs):
// - GET /v0/competitions/ - List all competitions
// - GET /v0/competitions/{competitionKey}/events - Events for a competition
// - GET /v0/events/{eventKey}/markets - Markets for an event
// - GET /v0/advantages/?type=ARBITRAGE - Arbitrage opportunities
// - GET /v1/advantages/?type=PLUS_EV - Plus EV opportunities
// ============================================================================

interface ScheduledGame {
  id: string;
  sport: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string;
  popularityScore: number;
  status: 'scheduled' | 'live' | 'completed';
  odds?: {
    moneyline?: { home: number; away: number; draw?: number };
    spread?: { home: number; homeOdds: number; away: number; awayOdds: number };
    total?: { over: number; overOdds: number; under: number; underOdds: number };
  };
  hasOdds?: boolean;
}

let cachedGames: ScheduledGame[] = [];
let cacheTimestamp: number = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

const LEAGUE_POPULARITY: Record<string, number> = {
  'NFL': 100, 'NBA': 95, 'MLB': 85, 'NHL': 80, 'NCAAF': 85, 'NCAAB': 80,
  'EPL': 90, 'La Liga': 85, 'Champions League': 95, 'Bundesliga': 82,
  'Serie A': 80, 'Ligue 1': 75, 'MLS': 65, 'UFC': 92, 'Boxing': 78,
  'ATP': 70, 'WTA': 65, 'PGA': 65, 'WNBA': 70,
};

function isCacheValid(): boolean {
  if (cachedGames.length === 0) return false;
  return (Date.now() - cacheTimestamp) < CACHE_TTL_MS;
}

async function fetchSportsbookGames(apiKey: string): Promise<ScheduledGame[]> {
  const allGames: ScheduledGame[] = [];
  
  // Use RapidAPI proxy - this is the correct URL format
  const baseUrl = 'https://sportsbook-api2.p.rapidapi.com';
  
  const headers = {
    'X-RapidAPI-Key': apiKey,
    'X-RapidAPI-Host': 'sportsbook-api2.p.rapidapi.com',
  };

  // Step 1: Fetch competitions list
  try {
    console.log('[Sportsbook API] Fetching competitions from /v0/competitions/...');
    
    const response = await fetch(`${baseUrl}/v0/competitions/`, { headers });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Sportsbook API] Competitions error ${response.status}:`, errorText);
    } else {
      const data = await response.json();
      console.log('[Sportsbook API] Competitions response type:', typeof data);
      console.log('[Sportsbook API] Competitions:', JSON.stringify(data).slice(0, 1500));
      
      // Parse competitions
      const competitions = Array.isArray(data) ? data : 
                           data.competitions || data.data || [];
      
      console.log(`[Sportsbook API] Found ${competitions.length} competitions`);
      
      // Fetch events for top competitions
      for (const comp of competitions.slice(0, 15)) {
        const compKey = comp.key || comp.competitionKey || comp.id;
        if (!compKey) continue;
        
        try {
          console.log(`[Sportsbook API] Fetching events for ${compKey}...`);
          const eventsResponse = await fetch(`${baseUrl}/v0/competitions/${compKey}/events`, { headers });
          
          if (eventsResponse.ok) {
            const eventsData = await eventsResponse.json();
            const events = Array.isArray(eventsData) ? eventsData :
                          eventsData.events || eventsData.data || [];
            
            console.log(`[Sportsbook API] Found ${events.length} events for ${compKey}`);
            
            for (const event of events.slice(0, 20)) {
              const game = parseEventToGame(event, comp);
              if (game) {
                allGames.push(game);
              }
            }
          }
        } catch (e) {
          console.log(`[Sportsbook API] Error fetching events for ${compKey}:`, e);
        }
      }
    }
  } catch (e) {
    console.error('[Sportsbook API] Error fetching competitions:', e);
  }

  // Step 2: Fetch arbitrage advantages (these contain game data with odds)
  try {
    console.log('[Sportsbook API] Fetching ARBITRAGE advantages...');
    
    const response = await fetch(`${baseUrl}/v0/advantages/?type=ARBITRAGE`, { headers });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Sportsbook API] Arbitrage error ${response.status}:`, errorText);
    } else {
      const data = await response.json();
      console.log('[Sportsbook API] Arbitrage response:', JSON.stringify(data).slice(0, 1500));
      
      const advantages = Array.isArray(data) ? data : data.advantages || data.data || [];
      console.log(`[Sportsbook API] Found ${advantages.length} arbitrage opportunities`);
      
      for (const adv of advantages) {
        const game = parseAdvantageToGame(adv);
        if (game) allGames.push(game);
      }
    }
  } catch (e) {
    console.error('[Sportsbook API] Error fetching arbitrage:', e);
  }

  // Step 3: Fetch Plus EV advantages
  try {
    console.log('[Sportsbook API] Fetching PLUS_EV advantages...');
    
    const response = await fetch(`${baseUrl}/v1/advantages/?type=PLUS_EV`, { headers });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Sportsbook API] Plus EV error ${response.status}:`, errorText);
    } else {
      const data = await response.json();
      console.log('[Sportsbook API] Plus EV response:', JSON.stringify(data).slice(0, 1500));
      
      const advantages = Array.isArray(data) ? data : data.advantages || data.data || [];
      console.log(`[Sportsbook API] Found ${advantages.length} plus EV opportunities`);
      
      for (const adv of advantages) {
        const game = parseAdvantageToGame(adv);
        if (game) allGames.push(game);
      }
    }
  } catch (e) {
    console.error('[Sportsbook API] Error fetching plus EV:', e);
  }

  // Step 4: Try MIDDLES
  try {
    console.log('[Sportsbook API] Fetching MIDDLES...');
    
    const response = await fetch(`${baseUrl}/v0/advantages/?type=MIDDLES`, { headers });
    
    if (response.ok) {
      const data = await response.json();
      console.log('[Sportsbook API] Middles response:', JSON.stringify(data).slice(0, 500));
      
      const advantages = Array.isArray(data) ? data : data.advantages || data.data || [];
      for (const adv of advantages) {
        const game = parseAdvantageToGame(adv);
        if (game) allGames.push(game);
      }
    }
  } catch (e) {
    console.log('[Sportsbook API] Error fetching middles:', e);
  }

  return allGames;
}

function parseEventToGame(event: any, competition: any): ScheduledGame | null {
  try {
    const homeTeam = event.homeTeam || event.home_team || event.homeName ||
                     event.participants?.[0]?.name || event.home?.name || '';
    const awayTeam = event.awayTeam || event.away_team || event.awayName ||
                     event.participants?.[1]?.name || event.away?.name || '';
    
    if (!homeTeam || !awayTeam) return null;
    
    const compName = competition?.name || competition?.key || '';
    const sport = mapSport(compName);
    const league = mapLeague(compName);
    
    return {
      id: `sb_${event.key || event.eventKey || event.id || Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      sport,
      league,
      homeTeam,
      awayTeam,
      startTime: event.startTime || event.commence_time || event.start || new Date().toISOString(),
      popularityScore: LEAGUE_POPULARITY[league] || 60,
      status: getEventStatus(event),
      hasOdds: false,
    };
  } catch {
    return null;
  }
}

function parseAdvantageToGame(advantage: any): ScheduledGame | null {
  try {
    // Extract event info from advantage
    const event = advantage.event || {};
    const market = advantage.market || {};
    
    // Try multiple ways to get team names
    let homeTeam = event.homeTeam || event.homeName || advantage.homeTeam || '';
    let awayTeam = event.awayTeam || event.awayName || advantage.awayTeam || '';
    
    // Try to parse from event name like "Team A vs Team B"
    if ((!homeTeam || !awayTeam) && event.name) {
      const match = event.name.match(/(.+?)\s+(?:vs\.?|@)\s+(.+)/i);
      if (match) {
        homeTeam = match[2].trim(); // Team after 'vs' is usually home
        awayTeam = match[1].trim();
      }
    }
    
    // Try outcomes
    if ((!homeTeam || !awayTeam) && advantage.outcomes && advantage.outcomes.length >= 2) {
      homeTeam = advantage.outcomes[0]?.name || advantage.outcomes[0]?.team || 'Team 1';
      awayTeam = advantage.outcomes[1]?.name || advantage.outcomes[1]?.team || 'Team 2';
    }
    
    if (!homeTeam && !awayTeam) return null;
    
    const competition = event.competition || advantage.competition || '';
    const sport = mapSport(competition);
    const league = mapLeague(competition);
    
    // Extract odds
    const odds: ScheduledGame['odds'] = {};
    
    if (advantage.outcomes && advantage.outcomes.length >= 2) {
      const outcome1 = advantage.outcomes[0];
      const outcome2 = advantage.outcomes[1];
      
      // Get American odds
      const homeOdds = outcome1.americanOdds || outcome1.price || outcome1.odds || 0;
      const awayOdds = outcome2.americanOdds || outcome2.price || outcome2.odds || 0;
      
      if (homeOdds && awayOdds) {
        odds.moneyline = {
          home: typeof homeOdds === 'number' ? homeOdds : parseFloat(homeOdds),
          away: typeof awayOdds === 'number' ? awayOdds : parseFloat(awayOdds),
        };
      }
    }
    
    return {
      id: `sb_adv_${advantage.id || event.key || Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      sport,
      league,
      homeTeam: homeTeam || 'Home Team',
      awayTeam: awayTeam || 'Away Team',
      startTime: event.startTime || event.start || advantage.eventTime || new Date().toISOString(),
      popularityScore: (LEAGUE_POPULARITY[league] || 60) + 10, // Boost advantages
      status: 'scheduled',
      odds: Object.keys(odds).length > 0 ? odds : undefined,
      hasOdds: Object.keys(odds).length > 0,
    };
  } catch {
    return null;
  }
}

function getEventStatus(event: any): 'scheduled' | 'live' | 'completed' {
  const status = (event.status || '').toLowerCase();
  if (status.includes('live') || status.includes('progress') || status.includes('started')) return 'live';
  if (status.includes('complete') || status.includes('finish') || status.includes('ended')) return 'completed';
  return 'scheduled';
}

function mapSport(input: string): string {
  const lower = (input || '').toLowerCase();
  if (lower.includes('basketball') || lower.includes('nba') || lower.includes('ncaab') || lower.includes('wnba')) return 'Basketball';
  if (lower.includes('football') || lower.includes('nfl') || lower.includes('ncaaf')) return 'Football';
  if (lower.includes('baseball') || lower.includes('mlb')) return 'Baseball';
  if (lower.includes('hockey') || lower.includes('nhl') || lower.includes('ice')) return 'Hockey';
  if (lower.includes('soccer') || lower.includes('premier') || lower.includes('liga') || lower.includes('bundesliga') || lower.includes('serie') || lower.includes('ligue') || lower.includes('mls') || lower.includes('champions')) return 'Soccer';
  if (lower.includes('mma') || lower.includes('ufc') || lower.includes('martial')) return 'MMA';
  if (lower.includes('boxing')) return 'Boxing';
  if (lower.includes('tennis') || lower.includes('atp') || lower.includes('wta')) return 'Tennis';
  if (lower.includes('golf') || lower.includes('pga')) return 'Golf';
  return 'Sports';
}

function mapLeague(input: string): string {
  const lower = (input || '').toLowerCase();
  if (lower.includes('nfl')) return 'NFL';
  if (lower.includes('nba')) return 'NBA';
  if (lower.includes('mlb')) return 'MLB';
  if (lower.includes('nhl')) return 'NHL';
  if (lower.includes('ncaaf') || lower.includes('college football')) return 'NCAAF';
  if (lower.includes('ncaab') || lower.includes('college basketball')) return 'NCAAB';
  if (lower.includes('wnba')) return 'WNBA';
  if (lower.includes('premier') || lower.includes('epl')) return 'EPL';
  if (lower.includes('la liga') || lower.includes('spain')) return 'La Liga';
  if (lower.includes('bundesliga') || lower.includes('germany')) return 'Bundesliga';
  if (lower.includes('serie a') || lower.includes('italy')) return 'Serie A';
  if (lower.includes('ligue 1') || lower.includes('france')) return 'Ligue 1';
  if (lower.includes('mls')) return 'MLS';
  if (lower.includes('champions') || lower.includes('ucl')) return 'Champions League';
  if (lower.includes('ufc') || lower.includes('mma')) return 'UFC';
  if (lower.includes('boxing')) return 'Boxing';
  if (lower.includes('atp')) return 'ATP';
  if (lower.includes('wta')) return 'WTA';
  if (lower.includes('pga')) return 'PGA';
  return input || 'Sports';
}

function deduplicateAndRank(games: ScheduledGame[]): ScheduledGame[] {
  const seen = new Map<string, ScheduledGame>();
  
  for (const game of games) {
    const key = `${game.homeTeam.toLowerCase()}_${game.awayTeam.toLowerCase()}_${game.league}`;
    const reverseKey = `${game.awayTeam.toLowerCase()}_${game.homeTeam.toLowerCase()}_${game.league}`;
    
    const existing = seen.get(key) || seen.get(reverseKey);
    if (!existing || (!existing.hasOdds && game.hasOdds)) {
      seen.set(key, game);
    }
  }
  
  return Array.from(seen.values())
    .sort((a, b) => b.popularityScore - a.popularityScore);
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const forceRefresh = url.searchParams.get('refresh') === 'true';
    
    if (!forceRefresh && isCacheValid()) {
      console.log('[Sportsbook API] Returning cached games:', cachedGames.length);
      return new Response(
        JSON.stringify({
          success: true,
          games: cachedGames,
          source: 'cached',
          lastUpdated: new Date(cacheTimestamp).toISOString(),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('RAPIDAPI_KEY');
    if (!apiKey) {
      throw new Error('RAPIDAPI_KEY not configured');
    }

    console.log('[Sportsbook API] Starting fresh fetch...');
    
    const games = await fetchSportsbookGames(apiKey);
    
    console.log(`[Sportsbook API] Total games: ${games.length}`);

    if (games.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          games: [],
          error: 'No games found. Check edge function logs for API responses.',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const rankedGames = deduplicateAndRank(games);
    cachedGames = rankedGames;
    cacheTimestamp = Date.now();

    return new Response(
      JSON.stringify({
        success: true,
        games: rankedGames,
        source: 'fresh',
        lastUpdated: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Sportsbook API] Error:', error);
    
    if (cachedGames.length > 0) {
      return new Response(
        JSON.stringify({
          success: true,
          games: cachedGames,
          source: 'stale_cache',
          warning: 'API error, returned stale cache',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        games: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
