const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// SPORTSBOOK API - RapidAPI (sportsbook-api2.p.rapidapi.com)
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

// Short cache to prevent API spam (5 minutes)
let cachedGames: ScheduledGame[] = [];
let cacheTimestamp: number = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// League popularity scores
const LEAGUE_POPULARITY: Record<string, number> = {
  'NFL': 100,
  'NBA': 95,
  'MLB': 85,
  'NHL': 80,
  'NCAAF': 85,
  'NCAAB': 80,
  'EPL': 90,
  'La Liga': 85,
  'Champions League': 95,
  'Bundesliga': 82,
  'Serie A': 80,
  'Ligue 1': 75,
  'MLS': 65,
  'UFC': 92,
  'Boxing': 78,
  'ATP': 70,
  'WTA': 65,
  'PGA': 65,
  'WNBA': 70,
};

function isCacheValid(): boolean {
  if (cachedGames.length === 0) return false;
  return (Date.now() - cacheTimestamp) < CACHE_TTL_MS;
}

// Sportsbook API leagues to fetch
const SPORTSBOOK_LEAGUES = [
  // US Sports
  { id: 'nfl', sport: 'Football', league: 'NFL' },
  { id: 'nba', sport: 'Basketball', league: 'NBA' },
  { id: 'mlb', sport: 'Baseball', league: 'MLB' },
  { id: 'nhl', sport: 'Hockey', league: 'NHL' },
  { id: 'ncaaf', sport: 'Football', league: 'NCAAF' },
  { id: 'ncaab', sport: 'Basketball', league: 'NCAAB' },
  { id: 'wnba', sport: 'Basketball', league: 'WNBA' },
  // Soccer
  { id: 'epl', sport: 'Soccer', league: 'EPL' },
  { id: 'laliga', sport: 'Soccer', league: 'La Liga' },
  { id: 'bundesliga', sport: 'Soccer', league: 'Bundesliga' },
  { id: 'seriea', sport: 'Soccer', league: 'Serie A' },
  { id: 'ligue1', sport: 'Soccer', league: 'Ligue 1' },
  { id: 'mls', sport: 'Soccer', league: 'MLS' },
  { id: 'ucl', sport: 'Soccer', league: 'Champions League' },
  // Combat sports
  { id: 'ufc', sport: 'MMA', league: 'UFC' },
  { id: 'boxing', sport: 'Boxing', league: 'Boxing' },
  // Tennis
  { id: 'atp', sport: 'Tennis', league: 'ATP' },
  { id: 'wta', sport: 'Tennis', league: 'WTA' },
  // Golf
  { id: 'pga', sport: 'Golf', league: 'PGA' },
];

async function fetchSportsbookGames(apiKey: string): Promise<ScheduledGame[]> {
  const allGames: ScheduledGame[] = [];
  const baseUrl = 'https://sportsbook-api2.p.rapidapi.com';
  
  // First, try to get available leagues/sports
  try {
    console.log('[Sportsbook API] Fetching available sports...');
    
    const sportsResponse = await fetch(`${baseUrl}/v0/sports`, {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'sportsbook-api2.p.rapidapi.com',
      },
    });
    
    if (!sportsResponse.ok) {
      console.error(`[Sportsbook API] Sports endpoint error: ${sportsResponse.status}`);
      const errorText = await sportsResponse.text();
      console.error(`[Sportsbook API] Error details: ${errorText}`);
    } else {
      const sportsData = await sportsResponse.json();
      console.log('[Sportsbook API] Available sports:', JSON.stringify(sportsData).slice(0, 500));
    }
  } catch (e) {
    console.error('[Sportsbook API] Error fetching sports:', e);
  }

  // Try to fetch events/games
  try {
    console.log('[Sportsbook API] Fetching events...');
    
    const eventsResponse = await fetch(`${baseUrl}/v0/events`, {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'sportsbook-api2.p.rapidapi.com',
      },
    });
    
    if (!eventsResponse.ok) {
      console.error(`[Sportsbook API] Events endpoint error: ${eventsResponse.status}`);
      const errorText = await eventsResponse.text();
      console.error(`[Sportsbook API] Error details: ${errorText}`);
    } else {
      const eventsData = await eventsResponse.json();
      console.log('[Sportsbook API] Events response:', JSON.stringify(eventsData).slice(0, 1000));
      
      // Parse events based on API structure
      const events = Array.isArray(eventsData) ? eventsData : 
                     eventsData.events ? eventsData.events : 
                     eventsData.data ? eventsData.data : [];
      
      for (const event of events) {
        const game = parseEventToGame(event);
        if (game) {
          allGames.push(game);
        }
      }
    }
  } catch (e) {
    console.error('[Sportsbook API] Error fetching events:', e);
  }

  // Also try odds endpoint
  try {
    console.log('[Sportsbook API] Fetching odds...');
    
    const oddsResponse = await fetch(`${baseUrl}/v0/odds`, {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'sportsbook-api2.p.rapidapi.com',
      },
    });
    
    if (!oddsResponse.ok) {
      console.error(`[Sportsbook API] Odds endpoint error: ${oddsResponse.status}`);
    } else {
      const oddsData = await oddsResponse.json();
      console.log('[Sportsbook API] Odds response:', JSON.stringify(oddsData).slice(0, 1000));
      
      // Parse odds data
      const odds = Array.isArray(oddsData) ? oddsData : 
                   oddsData.odds ? oddsData.odds : 
                   oddsData.data ? oddsData.data : [];
      
      for (const odd of odds) {
        const game = parseOddsToGame(odd);
        if (game) {
          allGames.push(game);
        }
      }
    }
  } catch (e) {
    console.error('[Sportsbook API] Error fetching odds:', e);
  }

  // Try games endpoint
  try {
    console.log('[Sportsbook API] Fetching games...');
    
    const gamesResponse = await fetch(`${baseUrl}/v0/games`, {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'sportsbook-api2.p.rapidapi.com',
      },
    });
    
    if (!gamesResponse.ok) {
      console.error(`[Sportsbook API] Games endpoint error: ${gamesResponse.status}`);
    } else {
      const gamesData = await gamesResponse.json();
      console.log('[Sportsbook API] Games response:', JSON.stringify(gamesData).slice(0, 1000));
      
      const games = Array.isArray(gamesData) ? gamesData : 
                    gamesData.games ? gamesData.games : 
                    gamesData.data ? gamesData.data : [];
      
      for (const game of games) {
        const parsed = parseGameData(game);
        if (parsed) {
          allGames.push(parsed);
        }
      }
    }
  } catch (e) {
    console.error('[Sportsbook API] Error fetching games:', e);
  }

  return allGames;
}

function parseEventToGame(event: any): ScheduledGame | null {
  try {
    const homeTeam = event.home_team || event.homeTeam || event.team1 || event.home?.name || '';
    const awayTeam = event.away_team || event.awayTeam || event.team2 || event.away?.name || '';
    
    if (!homeTeam || !awayTeam) return null;
    
    const sport = event.sport || event.sport_key || 'Sports';
    const league = event.league || event.competition || event.sport_title || sport;
    
    // Parse odds from various API formats
    const odds = parseOddsFromEvent(event);
    
    return {
      id: `sb_${event.id || Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      sport: mapSport(sport),
      league: mapLeague(league),
      homeTeam: homeTeam,
      awayTeam: awayTeam,
      startTime: event.commence_time || event.start_time || event.date || new Date().toISOString(),
      popularityScore: LEAGUE_POPULARITY[mapLeague(league)] || 60,
      status: 'scheduled',
      odds: odds,
      hasOdds: odds !== undefined && (odds.moneyline !== undefined || odds.spread !== undefined || odds.total !== undefined),
    };
  } catch {
    return null;
  }
}

function parseOddsFromEvent(event: any): ScheduledGame['odds'] {
  const odds: ScheduledGame['odds'] = {};
  
  // Try to extract moneyline
  if (event.odds?.moneyline) {
    odds.moneyline = {
      home: event.odds.moneyline.home || event.odds.moneyline.h2h?.[0] || 0,
      away: event.odds.moneyline.away || event.odds.moneyline.h2h?.[1] || 0,
      draw: event.odds.moneyline.draw,
    };
  } else if (event.home_odds || event.away_odds) {
    odds.moneyline = {
      home: parseFloat(event.home_odds) || 0,
      away: parseFloat(event.away_odds) || 0,
      draw: event.draw_odds ? parseFloat(event.draw_odds) : undefined,
    };
  } else if (event.bookmakers && Array.isArray(event.bookmakers) && event.bookmakers.length > 0) {
    const bookmaker = event.bookmakers[0];
    const h2hMarket = bookmaker.markets?.find((m: any) => m.key === 'h2h');
    if (h2hMarket && h2hMarket.outcomes) {
      const homeOutcome = h2hMarket.outcomes.find((o: any) => o.name === event.home_team);
      const awayOutcome = h2hMarket.outcomes.find((o: any) => o.name === event.away_team);
      if (homeOutcome && awayOutcome) {
        odds.moneyline = {
          home: homeOutcome.price || 0,
          away: awayOutcome.price || 0,
        };
      }
    }
    
    // Spreads
    const spreadMarket = bookmaker.markets?.find((m: any) => m.key === 'spreads');
    if (spreadMarket && spreadMarket.outcomes) {
      const homeSpread = spreadMarket.outcomes.find((o: any) => o.name === event.home_team);
      const awaySpread = spreadMarket.outcomes.find((o: any) => o.name === event.away_team);
      if (homeSpread && awaySpread) {
        odds.spread = {
          home: homeSpread.point || 0,
          homeOdds: homeSpread.price || -110,
          away: awaySpread.point || 0,
          awayOdds: awaySpread.price || -110,
        };
      }
    }
    
    // Totals
    const totalsMarket = bookmaker.markets?.find((m: any) => m.key === 'totals');
    if (totalsMarket && totalsMarket.outcomes) {
      const overOutcome = totalsMarket.outcomes.find((o: any) => o.name === 'Over');
      const underOutcome = totalsMarket.outcomes.find((o: any) => o.name === 'Under');
      if (overOutcome && underOutcome) {
        odds.total = {
          over: overOutcome.point || 0,
          overOdds: overOutcome.price || -110,
          under: underOutcome.point || 0,
          underOdds: underOutcome.price || -110,
        };
      }
    }
  }
  
  // Check if we have any odds
  if (Object.keys(odds).length === 0) {
    return undefined;
  }
  
  return odds;
}

function parseOddsToGame(odd: any): ScheduledGame | null {
  try {
    const homeTeam = odd.home_team || odd.homeTeam || odd.team1 || '';
    const awayTeam = odd.away_team || odd.awayTeam || odd.team2 || '';
    
    if (!homeTeam || !awayTeam) return null;
    
    const sport = odd.sport || odd.sport_key || 'Sports';
    const league = odd.league || odd.competition || sport;
    const odds = parseOddsFromEvent(odd);
    
    return {
      id: `sb_odds_${odd.id || Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      sport: mapSport(sport),
      league: mapLeague(league),
      homeTeam: homeTeam,
      awayTeam: awayTeam,
      startTime: odd.commence_time || odd.start_time || odd.date || new Date().toISOString(),
      popularityScore: LEAGUE_POPULARITY[mapLeague(league)] || 60,
      status: 'scheduled',
      odds: odds,
      hasOdds: odds !== undefined,
    };
  } catch {
    return null;
  }
}

function parseGameData(game: any): ScheduledGame | null {
  try {
    const homeTeam = game.home_team || game.homeTeam || game.home?.name || game.team1 || '';
    const awayTeam = game.away_team || game.awayTeam || game.away?.name || game.team2 || '';
    
    if (!homeTeam || !awayTeam) return null;
    
    const sport = game.sport || game.sport_key || 'Sports';
    const league = game.league || game.competition || sport;
    const odds = parseOddsFromEvent(game);
    
    return {
      id: `sb_game_${game.id || Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      sport: mapSport(sport),
      league: mapLeague(league),
      homeTeam: homeTeam,
      awayTeam: awayTeam,
      startTime: game.commence_time || game.start_time || game.date || new Date().toISOString(),
      popularityScore: LEAGUE_POPULARITY[mapLeague(league)] || 60,
      status: game.status === 'live' ? 'live' : game.status === 'completed' ? 'completed' : 'scheduled',
      odds: odds,
      hasOdds: odds !== undefined,
    };
  } catch {
    return null;
  }
}

function mapSport(sport: string): string {
  const sportLower = (sport || '').toLowerCase();
  if (sportLower.includes('football') || sportLower.includes('nfl') || sportLower.includes('ncaaf')) return 'Football';
  if (sportLower.includes('basketball') || sportLower.includes('nba') || sportLower.includes('ncaab')) return 'Basketball';
  if (sportLower.includes('baseball') || sportLower.includes('mlb')) return 'Baseball';
  if (sportLower.includes('hockey') || sportLower.includes('nhl')) return 'Hockey';
  if (sportLower.includes('soccer') || sportLower.includes('football')) return 'Soccer';
  if (sportLower.includes('mma') || sportLower.includes('ufc')) return 'MMA';
  if (sportLower.includes('boxing')) return 'Boxing';
  if (sportLower.includes('tennis')) return 'Tennis';
  if (sportLower.includes('golf')) return 'Golf';
  return sport || 'Sports';
}

function mapLeague(league: string): string {
  const leagueLower = (league || '').toLowerCase();
  if (leagueLower.includes('nfl')) return 'NFL';
  if (leagueLower.includes('nba')) return 'NBA';
  if (leagueLower.includes('mlb')) return 'MLB';
  if (leagueLower.includes('nhl')) return 'NHL';
  if (leagueLower.includes('ncaaf') || leagueLower.includes('college football')) return 'NCAAF';
  if (leagueLower.includes('ncaab') || leagueLower.includes('college basketball')) return 'NCAAB';
  if (leagueLower.includes('premier league') || leagueLower.includes('epl')) return 'EPL';
  if (leagueLower.includes('la liga') || leagueLower.includes('laliga')) return 'La Liga';
  if (leagueLower.includes('champions league') || leagueLower.includes('ucl')) return 'Champions League';
  if (leagueLower.includes('bundesliga')) return 'Bundesliga';
  if (leagueLower.includes('serie a')) return 'Serie A';
  if (leagueLower.includes('ligue 1')) return 'Ligue 1';
  if (leagueLower.includes('mls')) return 'MLS';
  if (leagueLower.includes('ufc')) return 'UFC';
  if (leagueLower.includes('boxing')) return 'Boxing';
  if (leagueLower.includes('atp')) return 'ATP';
  if (leagueLower.includes('wta')) return 'WTA';
  if (leagueLower.includes('pga')) return 'PGA';
  if (leagueLower.includes('wnba')) return 'WNBA';
  return league || 'Sports';
}

function deduplicateAndRank(games: ScheduledGame[]): ScheduledGame[] {
  const seen = new Map<string, ScheduledGame>();
  
  for (const game of games) {
    const key = `${game.homeTeam.toLowerCase()}_${game.awayTeam.toLowerCase()}_${game.league}`;
    const reverseKey = `${game.awayTeam.toLowerCase()}_${game.homeTeam.toLowerCase()}_${game.league}`;
    
    if (!seen.has(key) && !seen.has(reverseKey)) {
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
    
    // Check cache first (unless force refresh)
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

    if (forceRefresh) {
      console.log('[Sportsbook API] Force refresh requested');
    }

    const apiKey = Deno.env.get('RAPIDAPI_KEY');
    if (!apiKey) {
      throw new Error('RAPIDAPI_KEY not configured');
    }

    console.log('[Sportsbook API] Fetching games...');
    
    const games = await fetchSportsbookGames(apiKey);
    
    console.log(`[Sportsbook API] Total games fetched: ${games.length}`);

    if (games.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          games: [],
          error: 'Sportsbook API returned 0 games. Check the edge function logs for API response details. You may need to check your RapidAPI subscription or the API endpoints.',
          debug: 'Check Supabase edge function logs for detailed API responses',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Deduplicate and rank
    const rankedGames = deduplicateAndRank(games);

    // Update cache
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
          source: 'stale-cache',
          lastUpdated: new Date(cacheTimestamp).toISOString(),
          error: 'Using cached data due to API error',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({
        success: false,
        games: [],
        error: error instanceof Error ? error.message : 'Failed to fetch games',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
