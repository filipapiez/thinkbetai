const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// POPULAR GAMES API - RapidAPI Sports Data
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
  injuries?: string[];
}

// Short cache to prevent API spam (5 minutes)
let cachedGames: ScheduledGame[] = [];
let cacheTimestamp: number = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// League popularity scores for ranking
const LEAGUE_POPULARITY: Record<string, number> = {
  // NFL/Football
  'NFL': 100,
  'NCAAF': 85,
  // Basketball
  'NBA': 95,
  'NCAAB': 80,
  'WNBA': 70,
  'EuroLeague': 65,
  // Baseball
  'MLB': 85,
  // Hockey
  'NHL': 80,
  'KHL': 55,
  // Soccer
  'EPL': 90,
  'Premier League': 90,
  'La Liga': 85,
  'Champions League': 95,
  'UEFA Champions League': 95,
  'Bundesliga': 82,
  'Serie A': 80,
  'Ligue 1': 75,
  'MLS': 65,
  'Liga MX': 70,
  // Combat Sports
  'UFC': 92,
  'MMA': 75,
  'Boxing': 78,
  'Bellator': 60,
  // Tennis
  'ATP': 70,
  'WTA': 65,
  'Grand Slam': 85,
  // Golf
  'PGA': 65,
  'LPGA': 55,
  // Cricket
  'IPL': 80,
  'Test Cricket': 70,
  'T20': 75,
  // Rugby
  'Six Nations': 70,
  'Rugby World Cup': 85,
  'Super Rugby': 60,
  // Motorsport
  'F1': 88,
  'Formula 1': 88,
  'NASCAR': 75,
  'IndyCar': 60,
  // Esports
  'LoL': 65,
  'CS2': 60,
  'Dota 2': 55,
  'Valorant': 60,
};

function isCacheValid(): boolean {
  if (cachedGames.length === 0) return false;
  return (Date.now() - cacheTimestamp) < CACHE_TTL_MS;
}

// Fetch from RapidAPI - API-Football for soccer
async function fetchSoccerGames(apiKey: string): Promise<ScheduledGame[]> {
  const games: ScheduledGame[] = [];
  
  try {
    // Get today and tomorrow's date
    const today = new Date().toISOString().split('T')[0];
    
    // Top leagues: EPL(39), La Liga(140), Champions League(2), Bundesliga(78), Serie A(135), MLS(253)
    const leagueIds = [39, 140, 2, 78, 135, 253, 61, 94]; // Added Ligue 1(61), Liga Portugal(94)
    
    for (const leagueId of leagueIds) {
      try {
        const response = await fetch(
          `https://api-football-v1.p.rapidapi.com/v3/fixtures?date=${today}&league=${leagueId}&season=2024`,
          {
            headers: {
              'X-RapidAPI-Key': apiKey,
              'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com',
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const fixtures = data.response || [];
          
          for (const fixture of fixtures) {
            const leagueName = fixture.league?.name || 'Soccer';
            games.push({
              id: `soccer_${fixture.fixture?.id || Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              sport: 'Soccer',
              league: leagueName,
              homeTeam: fixture.teams?.home?.name || 'Home Team',
              awayTeam: fixture.teams?.away?.name || 'Away Team',
              startTime: fixture.fixture?.date || new Date().toISOString(),
              popularityScore: LEAGUE_POPULARITY[leagueName] || 70,
              status: fixture.fixture?.status?.short === 'NS' ? 'scheduled' : 
                      fixture.fixture?.status?.short === 'FT' ? 'completed' : 'live',
            });
          }
        }
        
        await new Promise(r => setTimeout(r, 200)); // Rate limiting
      } catch (e) {
        console.warn(`[API] Error fetching league ${leagueId}:`, e);
      }
    }
  } catch (error) {
    console.error('[API] Soccer fetch error:', error);
  }
  
  return games;
}

// Fetch NBA games
async function fetchNBAGames(apiKey: string): Promise<ScheduledGame[]> {
  const games: ScheduledGame[] = [];
  
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const response = await fetch(
      `https://api-nba-v1.p.rapidapi.com/games?date=${today}`,
      {
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'api-nba-v1.p.rapidapi.com',
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      const nbaGames = data.response || [];
      
      for (const game of nbaGames) {
        games.push({
          id: `nba_${game.id || Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          sport: 'Basketball',
          league: 'NBA',
          homeTeam: game.teams?.home?.name || 'Home Team',
          awayTeam: game.teams?.visitors?.name || 'Away Team',
          startTime: game.date?.start || new Date().toISOString(),
          popularityScore: LEAGUE_POPULARITY['NBA'],
          status: game.status?.short === 1 ? 'scheduled' : 
                  game.status?.short === 3 ? 'completed' : 'live',
        });
      }
    }
  } catch (error) {
    console.error('[API] NBA fetch error:', error);
  }
  
  return games;
}

// Fetch NFL games
async function fetchNFLGames(apiKey: string): Promise<ScheduledGame[]> {
  const games: ScheduledGame[] = [];
  
  try {
    const response = await fetch(
      `https://api-american-football.p.rapidapi.com/games?league=1&season=2024`,
      {
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'api-american-football.p.rapidapi.com',
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      const nflGames = data.response || [];
      
      // Filter to upcoming games only
      const now = new Date();
      const upcoming = nflGames.filter((g: any) => {
        const gameDate = new Date(g.game?.date?.date || g.date);
        return gameDate >= now;
      }).slice(0, 20);
      
      for (const game of upcoming) {
        games.push({
          id: `nfl_${game.game?.id || Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          sport: 'Football',
          league: 'NFL',
          homeTeam: game.teams?.home?.name || 'Home Team',
          awayTeam: game.teams?.away?.name || 'Away Team',
          startTime: game.game?.date?.date || new Date().toISOString(),
          popularityScore: LEAGUE_POPULARITY['NFL'],
          status: 'scheduled',
        });
      }
    }
  } catch (error) {
    console.error('[API] NFL fetch error:', error);
  }
  
  return games;
}

// Fetch NHL games
async function fetchNHLGames(apiKey: string): Promise<ScheduledGame[]> {
  const games: ScheduledGame[] = [];
  
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const response = await fetch(
      `https://api-hockey.p.rapidapi.com/games?date=${today}`,
      {
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'api-hockey.p.rapidapi.com',
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      const hockeyGames = data.response || [];
      
      // Filter for NHL (league id 57)
      const nhlGames = hockeyGames.filter((g: any) => g.league?.id === 57);
      
      for (const game of nhlGames) {
        games.push({
          id: `nhl_${game.id || Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          sport: 'Hockey',
          league: 'NHL',
          homeTeam: game.teams?.home?.name || 'Home Team',
          awayTeam: game.teams?.away?.name || 'Away Team',
          startTime: game.date || new Date().toISOString(),
          popularityScore: LEAGUE_POPULARITY['NHL'],
          status: game.status?.short === 'NS' ? 'scheduled' : 
                  game.status?.short === 'FT' ? 'completed' : 'live',
        });
      }
    }
  } catch (error) {
    console.error('[API] NHL fetch error:', error);
  }
  
  return games;
}

// Fetch MLB games
async function fetchMLBGames(apiKey: string): Promise<ScheduledGame[]> {
  const games: ScheduledGame[] = [];
  
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const response = await fetch(
      `https://api-baseball.p.rapidapi.com/games?date=${today}`,
      {
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'api-baseball.p.rapidapi.com',
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      const baseballGames = data.response || [];
      
      // Filter for MLB (league id 1)
      const mlbGames = baseballGames.filter((g: any) => g.league?.id === 1);
      
      for (const game of mlbGames) {
        games.push({
          id: `mlb_${game.id || Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          sport: 'Baseball',
          league: 'MLB',
          homeTeam: game.teams?.home?.name || 'Home Team',
          awayTeam: game.teams?.away?.name || 'Away Team',
          startTime: game.date || new Date().toISOString(),
          popularityScore: LEAGUE_POPULARITY['MLB'],
          status: game.status?.short === 'NS' ? 'scheduled' : 
                  game.status?.short === 'FT' ? 'completed' : 'live',
        });
      }
    }
  } catch (error) {
    console.error('[API] MLB fetch error:', error);
  }
  
  return games;
}

// Fetch UFC/MMA events
async function fetchMMAGames(apiKey: string): Promise<ScheduledGame[]> {
  const games: ScheduledGame[] = [];
  
  try {
    const response = await fetch(
      `https://api-mma.p.rapidapi.com/fights`,
      {
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'api-mma.p.rapidapi.com',
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      const fights = data.response || [];
      
      // Get upcoming fights
      const now = new Date();
      const upcoming = fights.filter((f: any) => {
        const fightDate = new Date(f.date || 0);
        return fightDate >= now;
      }).slice(0, 15);
      
      for (const fight of upcoming) {
        const league = fight.league?.name || 'UFC';
        games.push({
          id: `mma_${fight.id || Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          sport: 'MMA',
          league: league.includes('UFC') ? 'UFC' : league,
          homeTeam: fight.fighters?.first?.name || 'Fighter 1',
          awayTeam: fight.fighters?.second?.name || 'Fighter 2',
          startTime: fight.date || new Date().toISOString(),
          popularityScore: LEAGUE_POPULARITY[league.includes('UFC') ? 'UFC' : 'MMA'] || 75,
          status: 'scheduled',
        });
      }
    }
  } catch (error) {
    console.error('[API] MMA fetch error:', error);
  }
  
  return games;
}

// Fetch Tennis tournaments
async function fetchTennisGames(apiKey: string): Promise<ScheduledGame[]> {
  const games: ScheduledGame[] = [];
  
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const response = await fetch(
      `https://api-tennis.p.rapidapi.com/games?date=${today}`,
      {
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'api-tennis.p.rapidapi.com',
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      const matches = data.response || [];
      
      for (const match of matches.slice(0, 20)) {
        const tournament = match.league?.name || 'ATP/WTA';
        games.push({
          id: `tennis_${match.id || Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          sport: 'Tennis',
          league: tournament.includes('Grand Slam') ? 'Grand Slam' : 
                  tournament.includes('ATP') ? 'ATP' : 'WTA',
          homeTeam: match.players?.home?.name || 'Player 1',
          awayTeam: match.players?.away?.name || 'Player 2',
          startTime: match.date || new Date().toISOString(),
          popularityScore: LEAGUE_POPULARITY['ATP'] || 70,
          status: match.status?.short === 'NS' ? 'scheduled' : 
                  match.status?.short === 'FT' ? 'completed' : 'live',
        });
      }
    }
  } catch (error) {
    console.error('[API] Tennis fetch error:', error);
  }
  
  return games;
}

// Fetch Rugby games
async function fetchRugbyGames(apiKey: string): Promise<ScheduledGame[]> {
  const games: ScheduledGame[] = [];
  
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const response = await fetch(
      `https://api-rugby.p.rapidapi.com/games?date=${today}`,
      {
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'api-rugby.p.rapidapi.com',
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      const rugbyGames = data.response || [];
      
      for (const game of rugbyGames.slice(0, 15)) {
        const league = game.league?.name || 'Rugby Union';
        games.push({
          id: `rugby_${game.id || Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          sport: 'Rugby',
          league: league,
          homeTeam: game.teams?.home?.name || 'Home Team',
          awayTeam: game.teams?.away?.name || 'Away Team',
          startTime: game.date || new Date().toISOString(),
          popularityScore: LEAGUE_POPULARITY['Super Rugby'] || 60,
          status: game.status?.short === 'NS' ? 'scheduled' : 
                  game.status?.short === 'FT' ? 'completed' : 'live',
        });
      }
    }
  } catch (error) {
    console.error('[API] Rugby fetch error:', error);
  }
  
  return games;
}

// Fetch Formula 1 races
async function fetchF1Games(apiKey: string): Promise<ScheduledGame[]> {
  const games: ScheduledGame[] = [];
  
  try {
    const response = await fetch(
      `https://api-formula-1.p.rapidapi.com/races?season=2024`,
      {
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'api-formula-1.p.rapidapi.com',
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      const races = data.response || [];
      
      // Get upcoming races
      const now = new Date();
      const upcoming = races.filter((r: any) => {
        const raceDate = new Date(r.date || 0);
        return raceDate >= now;
      }).slice(0, 5);
      
      for (const race of upcoming) {
        games.push({
          id: `f1_${race.id || Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          sport: 'Motorsport',
          league: 'Formula 1',
          homeTeam: race.competition?.name || 'Grand Prix',
          awayTeam: race.circuit?.name || 'Circuit',
          startTime: race.date || new Date().toISOString(),
          popularityScore: LEAGUE_POPULARITY['F1'],
          status: 'scheduled',
        });
      }
    }
  } catch (error) {
    console.error('[API] F1 fetch error:', error);
  }
  
  return games;
}

// Fetch Cricket matches
async function fetchCricketGames(apiKey: string): Promise<ScheduledGame[]> {
  const games: ScheduledGame[] = [];
  
  try {
    const response = await fetch(
      `https://api-cricket.p.rapidapi.com/games`,
      {
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'api-cricket.p.rapidapi.com',
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      const matches = data.response || [];
      
      // Get upcoming matches
      const now = new Date();
      const upcoming = matches.filter((m: any) => {
        const matchDate = new Date(m.date || 0);
        return matchDate >= now;
      }).slice(0, 15);
      
      for (const match of upcoming) {
        const league = match.league?.name || 'International';
        games.push({
          id: `cricket_${match.id || Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          sport: 'Cricket',
          league: league.includes('IPL') ? 'IPL' : 
                  league.includes('T20') ? 'T20' : 'Test Cricket',
          homeTeam: match.teams?.home?.name || 'Team 1',
          awayTeam: match.teams?.away?.name || 'Team 2',
          startTime: match.date || new Date().toISOString(),
          popularityScore: LEAGUE_POPULARITY['IPL'] || 75,
          status: match.status?.short === 'NS' ? 'scheduled' : 
                  match.status?.short === 'FT' ? 'completed' : 'live',
        });
      }
    }
  } catch (error) {
    console.error('[API] Cricket fetch error:', error);
  }
  
  return games;
}

// Fetch Golf tournaments
async function fetchGolfGames(apiKey: string): Promise<ScheduledGame[]> {
  const games: ScheduledGame[] = [];
  
  try {
    const response = await fetch(
      `https://api-golf.p.rapidapi.com/tournaments?season=2024`,
      {
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'api-golf.p.rapidapi.com',
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      const tournaments = data.response || [];
      
      // Get upcoming tournaments
      const now = new Date();
      const upcoming = tournaments.filter((t: any) => {
        const startDate = new Date(t.start_date || 0);
        return startDate >= now;
      }).slice(0, 5);
      
      for (const tournament of upcoming) {
        games.push({
          id: `golf_${tournament.id || Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          sport: 'Golf',
          league: 'PGA',
          homeTeam: tournament.name || 'Tournament',
          awayTeam: tournament.venue?.name || 'Venue',
          startTime: tournament.start_date || new Date().toISOString(),
          popularityScore: LEAGUE_POPULARITY['PGA'],
          status: 'scheduled',
        });
      }
    }
  } catch (error) {
    console.error('[API] Golf fetch error:', error);
  }
  
  return games;
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
    // Check for force refresh parameter
    const url = new URL(req.url);
    const forceRefresh = url.searchParams.get('refresh') === 'true';
    
    // Check cache first (unless force refresh)
    if (!forceRefresh && isCacheValid()) {
      console.log('[API] Returning cached games:', cachedGames.length);
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
      console.log('[API] Force refresh requested - bypassing cache');
    }

    const apiKey = Deno.env.get('RAPIDAPI_KEY');
    if (!apiKey) {
      throw new Error('RAPIDAPI_KEY not configured');
    }

    console.log('[API] Fetching games from RapidAPI...');
    
    // Fetch from all sports APIs in parallel
    const [
      soccerGames,
      nbaGames,
      nflGames,
      nhlGames,
      mlbGames,
      mmaGames,
      tennisGames,
      rugbyGames,
      f1Games,
      cricketGames,
      golfGames,
    ] = await Promise.all([
      fetchSoccerGames(apiKey),
      fetchNBAGames(apiKey),
      fetchNFLGames(apiKey),
      fetchNHLGames(apiKey),
      fetchMLBGames(apiKey),
      fetchMMAGames(apiKey),
      fetchTennisGames(apiKey),
      fetchRugbyGames(apiKey),
      fetchF1Games(apiKey),
      fetchCricketGames(apiKey),
      fetchGolfGames(apiKey),
    ]);

    // Combine all games
    const allGames = [
      ...soccerGames,
      ...nbaGames,
      ...nflGames,
      ...nhlGames,
      ...mlbGames,
      ...mmaGames,
      ...tennisGames,
      ...rugbyGames,
      ...f1Games,
      ...cricketGames,
      ...golfGames,
    ];

    console.log(`[API] Total games fetched: ${allGames.length}`);
    console.log(`[API] By sport: Soccer=${soccerGames.length}, NBA=${nbaGames.length}, NFL=${nflGames.length}, NHL=${nhlGames.length}, MLB=${mlbGames.length}, MMA=${mmaGames.length}, Tennis=${tennisGames.length}, Rugby=${rugbyGames.length}, F1=${f1Games.length}, Cricket=${cricketGames.length}, Golf=${golfGames.length}`);

    // If everything is empty, it's almost always a RapidAPI subscription/host issue.
    if (allGames.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          games: [],
          error:
            'RapidAPI returned 0 games. This usually means your key is not subscribed to one or more of these APIs/hosts (api-football-v1, api-nba-v1, api-american-football, api-hockey, api-baseball, api-mma, api-tennis, api-rugby, api-formula-1, api-cricket, api-golf) or the endpoints differ. Tell me which RapidAPI API you subscribed to (its host), and I will wire it correctly.',
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Deduplicate and rank
    const rankedGames = deduplicateAndRank(allGames);

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
    console.error('[API] Error:', error);
    
    // Return cached data if available
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
