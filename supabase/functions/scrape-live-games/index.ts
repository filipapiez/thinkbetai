import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// RATE LIMITING
// ============================================================================
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60 * 1000;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_WINDOW_MS });
    return true;
  }
  
  if (entry.count >= RATE_LIMIT) {
    return false;
  }
  
  entry.count++;
  return true;
}

// ============================================================================
// AUTHENTICATION
// ============================================================================
async function authenticateUser(req: Request): Promise<{ userId: string } | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const token = authHeader.replace('Bearer ', '');
  const { data, error } = await supabase.auth.getClaims(token);
  
  if (error || !data?.claims) {
    console.log('[Auth] Failed to validate token:', error?.message);
    return null;
  }

  return { userId: data.claims.sub as string };
}

// ============================================================================
// DATA STRUCTURES
// ============================================================================

interface PlayerStats {
  wins: number;
  losses: number;
  winPct: number;
  record?: string;
  weightClass?: string;
  knockouts?: number;
  submissions?: number;
  worldRanking?: number;
  points?: number;
  titlesWon?: number;
}

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
  homeStats?: PlayerStats;
  awayStats?: PlayerStats;
}

let cachedGames: ScheduledGame[] = [];
let cacheTimestamp: number = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

const LEAGUE_POPULARITY: Record<string, number> = {
  'NFL': 100, 'NBA': 95, 'MLB': 85, 'NHL': 80, 'NCAAF': 85, 'NCAAB': 80,
  'EPL': 90, 'La Liga': 85, 'Champions League': 95, 'Bundesliga': 82,
  'Serie A': 80, 'Ligue 1': 75, 'MLS': 65, 'UFC': 92, 'Boxing': 78,
  'ATP': 70, 'WTA': 65, 'PGA': 75, 'LIV': 70, 'WNBA': 70,
  'CS2': 72, 'LoL': 75, 'Valorant': 70, 'LCS': 68, 'LEC': 70, 'VCT': 68,
  'ITTF': 60, 'WTT': 62, 'Table Tennis': 58,
};

function isCacheValid(): boolean {
  if (cachedGames.length === 0) return false;
  return (Date.now() - cacheTimestamp) < CACHE_TTL_MS;
}

// ============================================================================
// SPORTSBOOK API via RapidAPI
// ============================================================================

async function fetchSportsbookGames(apiKey: string): Promise<ScheduledGame[]> {
  const allGames: ScheduledGame[] = [];
  const baseUrl = 'https://sportsbook-api2.p.rapidapi.com';
  
  const headers = {
    'X-RapidAPI-Key': apiKey,
    'X-RapidAPI-Host': 'sportsbook-api2.p.rapidapi.com',
  };

  // Fetch competitions
  try {
    console.log('[Sportsbook API] Fetching competitions...');
    const response = await fetch(`${baseUrl}/v0/competitions/`, { headers });
    
    if (response.ok) {
      const data = await response.json();
      const competitions = Array.isArray(data) ? data : data.competitions || data.data || [];
      console.log(`[Sportsbook API] Found ${competitions.length} competitions`);
      
      for (const comp of competitions.slice(0, 15)) {
        const compKey = comp.key || comp.competitionKey || comp.id;
        if (!compKey) continue;
        
        try {
          const eventsResponse = await fetch(`${baseUrl}/v0/competitions/${compKey}/events`, { headers });
          
          if (eventsResponse.ok) {
            const eventsData = await eventsResponse.json();
            const events = Array.isArray(eventsData) ? eventsData : eventsData.events || eventsData.data || [];
            
            for (const event of events.slice(0, 20)) {
              const game = parseEventToGame(event, comp);
              if (game) allGames.push(game);
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

  // Fetch arbitrage advantages
  try {
    console.log('[Sportsbook API] Fetching ARBITRAGE advantages...');
    const response = await fetch(`${baseUrl}/v0/advantages/?type=ARBITRAGE`, { headers });
    
    if (response.ok) {
      const data = await response.json();
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

  return allGames;
}

function parseEventToGame(event: any, competition: any): ScheduledGame | null {
  try {
    const homeTeam = event.homeTeam || event.home_team || event.homeName ||
                     event.participants?.[0]?.name || event.home?.name || '';
    const awayTeam = event.awayTeam || event.away_team || event.awayName ||
                     event.participants?.[1]?.name || event.away?.name || '';
    
    if (!homeTeam || !awayTeam) return null;
    
    // Require a valid start time - don't use current date as fallback
    const rawStartTime = event.startTime || event.commence_time || event.start || event.date;
    if (!rawStartTime) return null;
    
    const compName = competition?.name || competition?.key || '';
    const sport = mapSport(compName);
    const league = mapLeague(compName);
    
    return {
      id: `sb_${event.key || event.eventKey || event.id || Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      sport,
      league,
      homeTeam,
      awayTeam,
      startTime: rawStartTime,
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
    const event = advantage.event || {};
    const market = advantage.market || {};
    
    let homeTeam = event.homeTeam || event.homeName || advantage.homeTeam || '';
    let awayTeam = event.awayTeam || event.awayName || advantage.awayTeam || '';
    
    if ((!homeTeam || !awayTeam) && event.name) {
      const match = event.name.match(/(.+?)\s+(?:vs\.?|@)\s+(.+)/i);
      if (match) {
        homeTeam = match[2].trim();
        awayTeam = match[1].trim();
      }
    }
    
    if ((!homeTeam || !awayTeam) && advantage.outcomes && advantage.outcomes.length >= 2) {
      homeTeam = advantage.outcomes[0]?.participant?.name || advantage.outcomes[0]?.name || '';
      awayTeam = advantage.outcomes[1]?.participant?.name || advantage.outcomes[1]?.name || '';
    }
    
    if (!homeTeam || !awayTeam) return null;
    
    // Require a valid start time - don't use current date as fallback
    const rawStartTime = event.startTime || event.start || advantage.eventTime || event.date;
    if (!rawStartTime) return null;
    
    const compInstance = event.competitionInstance?.competition || {};
    const competition = compInstance.name || compInstance.shortName || '';
    const sport = mapSport(competition);
    const league = mapLeague(competition);
    
    const odds: ScheduledGame['odds'] = {};
    
    if (advantage.outcomes && advantage.outcomes.length >= 2) {
      const outcome1 = advantage.outcomes[0];
      const outcome2 = advantage.outcomes[1];
      
      const homeOdds = outcome1.payout ? Math.round((outcome1.payout - 1) * 100) : 0;
      const awayOdds = outcome2.payout ? Math.round((outcome2.payout - 1) * 100) : 0;
      
      if (homeOdds && awayOdds) {
        odds.moneyline = { home: homeOdds, away: awayOdds };
      }
    }
    
    return {
      id: `sb_adv_${advantage.key || event.key || Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      sport,
      league,
      homeTeam,
      awayTeam,
      startTime: rawStartTime,
      popularityScore: (LEAGUE_POPULARITY[league] || 60) + 10,
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
  if (lower.includes('golf') || lower.includes('pga') || lower.includes('liv')) return 'Golf';
  if (lower.includes('table tennis') || lower.includes('tabletennis') || lower.includes('ping pong') || lower.includes('ittf') || lower.includes('wtt')) return 'Table Tennis';
  if (lower.includes('cs2') || lower.includes('counter-strike') || lower.includes('lol') || lower.includes('valorant') || lower.includes('esport')) return 'Esports';
  return 'Sports';
}

function mapLeague(input: string): string {
  const lower = (input || '').toLowerCase();
  if (lower.includes('nfl')) return 'NFL';
  if (lower.includes('nba')) return 'NBA';
  if (lower.includes('mlb')) return 'MLB';
  if (lower.includes('nhl')) return 'NHL';
  if (lower.includes('ncaaf') || lower.includes('college football')) return 'NCAAF';
  if (lower.includes('ncaab') || lower.includes('ncaa') || lower.includes('college basketball')) return 'NCAAB';
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
  if (lower.includes('wtt')) return 'WTT';
  if (lower.includes('ittf')) return 'ITTF';
  if (lower.includes('table tennis') || lower.includes('tabletennis') || lower.includes('ping pong')) return 'Table Tennis';
  return input || 'Sports';
}

function deduplicateAndRank(games: ScheduledGame[]): ScheduledGame[] {
  const seen = new Map<string, ScheduledGame>();
  
  for (const game of games) {
    const key = `${game.homeTeam.toLowerCase()}_${game.awayTeam.toLowerCase()}_${game.league}`;
    const reverseKey = `${game.awayTeam.toLowerCase()}_${game.homeTeam.toLowerCase()}_${game.league}`;
    
    const existing = seen.get(key) || seen.get(reverseKey);
    if (!existing) {
      seen.set(key, game);
    } else {
      // Merge: prefer odds from one source, status from another
      // If existing has odds but new has better status info, merge them
      const merged = { ...existing };
      
      // Prefer 'live' or 'completed' status over 'scheduled'
      if (game.status === 'live' && existing.status === 'scheduled') {
        merged.status = 'live';
      } else if (game.status === 'completed' && existing.status === 'scheduled') {
        merged.status = 'completed';
      }
      
      // Prefer game with odds
      if (!existing.hasOdds && game.hasOdds) {
        merged.odds = game.odds;
        merged.hasOdds = true;
      }
      
      seen.set(key, merged);
    }
  }
  
  return Array.from(seen.values())
    .sort((a, b) => {
      // Sort by start time first
      const timeA = new Date(a.startTime).getTime();
      const timeB = new Date(b.startTime).getTime();
      if (timeA !== timeB) return timeA - timeB;
      // Then by popularity
      return b.popularityScore - a.popularityScore;
    });
}

// ============================================================================
// NHL INTEGRATION via SportsGameOdds API
// ============================================================================

async function fetchNHLGames(): Promise<ScheduledGame[]> {
  const games: ScheduledGame[] = [];
  
  try {
    const apiKey = Deno.env.get('SPORTSGAMEODDS_API_KEY');
    if (!apiKey) {
      console.log('[NHL] No SPORTSGAMEODDS_API_KEY configured');
      return [];
    }

    console.log('[NHL] Fetching from SportsGameOdds API...');
    
    const response = await fetch(
      'https://api.sportsgameodds.com/v2/events?leagueID=NHL&oddsAvailable=true&limit=30',
      { headers: { 'x-api-key': apiKey } }
    );

    if (!response.ok) {
      console.error(`[NHL] API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const events = data?.data || data?.events || [];
    console.log(`[NHL] Found ${events.length} events from API`);

    for (const event of events) {
      const game = parseAPIEvent(event, 'Hockey', 'NHL', 80);
      if (game) games.push(game);
    }

    return games;
  } catch (error) {
    console.error('[NHL] Error fetching games:', error);
    return [];
  }
}

// ============================================================================
// NBA INTEGRATION via NBA.com Official CDN API (No API key required)
// ============================================================================

async function fetchNBAGames(): Promise<ScheduledGame[]> {
  const games: ScheduledGame[] = [];
  
  try {
    console.log('[NBA] Fetching from NBA.com official schedule CDN...');
    
    // NBA.com provides a public CDN endpoint for schedule data
    const response = await fetch(
      'https://cdn.nba.com/static/json/staticData/scheduleLeagueV2.json',
      { 
        headers: { 
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; ThinkBetAI/1.0)'
        } 
      }
    );

    if (!response.ok) {
      console.error(`[NBA] CDN API error: ${response.status}`);
      // Fallback to SportsGameOdds API if CDN fails
      return fetchNBAGamesFromSportsGameOdds();
    }

    const data = await response.json();
    const leagueSchedule = data?.leagueSchedule;
    
    if (!leagueSchedule || !leagueSchedule.gameDates) {
      console.log('[NBA] No schedule data found in CDN response');
      return fetchNBAGamesFromSportsGameOdds();
    }

    const gameDates = leagueSchedule.gameDates || [];
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysFromNow = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    let gamesCount = 0;
    
    for (const dateEntry of gameDates) {
      const gameDate = new Date(dateEntry.gameDate);
      
      // Only include games from today to 7 days ahead
      if (gameDate < startOfToday || gameDate > sevenDaysFromNow) continue;
      
      const dayGames = dateEntry.games || [];
      
      for (const game of dayGames) {
        // Skip if no team data
        if (!game.homeTeam || !game.awayTeam) continue;
        
        const homeTeam = game.homeTeam.teamName 
          ? `${game.homeTeam.teamCity || ''} ${game.homeTeam.teamName}`.trim()
          : game.homeTeam.teamTricode || 'TBD';
        const awayTeam = game.awayTeam.teamName 
          ? `${game.awayTeam.teamCity || ''} ${game.awayTeam.teamName}`.trim()
          : game.awayTeam.teamTricode || 'TBD';
        
        // Parse game time
        const gameTimeUTC = game.gameDateTimeUTC || game.gameTimeUTC;
        const startTime = gameTimeUTC || dateEntry.gameDate;
        
        // Determine game status
        let status: 'scheduled' | 'live' | 'completed' = 'scheduled';
        const gameStatus = game.gameStatus;
        if (gameStatus === 2) status = 'live';
        else if (gameStatus === 3) status = 'completed';
        
        // Skip completed games
        if (status === 'completed') continue;
        
        games.push({
          id: `nba_${game.gameId || Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          sport: 'Basketball',
          league: 'NBA',
          homeTeam,
          awayTeam,
          startTime,
          popularityScore: 95,
          status,
          hasOdds: false,
        });
        
        gamesCount++;
        if (gamesCount >= 50) break;
      }
      
      if (gamesCount >= 50) break;
    }

    console.log(`[NBA] Found ${games.length} upcoming games from NBA.com CDN`);
    
    // If we got games from CDN, try to enhance with odds from SportsGameOdds
    if (games.length > 0) {
      const oddsGames = await fetchNBAGamesFromSportsGameOdds();
      // Merge odds into CDN games
      for (const cdnGame of games) {
        const matchingOddsGame = oddsGames.find(og => 
          normalizeTeamName(og.homeTeam) === normalizeTeamName(cdnGame.homeTeam) &&
          normalizeTeamName(og.awayTeam) === normalizeTeamName(cdnGame.awayTeam)
        );
        if (matchingOddsGame?.odds) {
          cdnGame.odds = matchingOddsGame.odds;
          cdnGame.hasOdds = true;
        }
      }
    }

    return games;
  } catch (error) {
    console.error('[NBA] Error fetching from CDN:', error);
    return fetchNBAGamesFromSportsGameOdds();
  }
}

// Helper to normalize team names for matching
function normalizeTeamName(name: string): string {
  return name.toLowerCase().replace(/[^a-z]/g, '');
}

// Fallback NBA fetcher using SportsGameOdds API
async function fetchNBAGamesFromSportsGameOdds(): Promise<ScheduledGame[]> {
  const games: ScheduledGame[] = [];
  
  try {
    const apiKey = Deno.env.get('SPORTSGAMEODDS_API_KEY');
    if (!apiKey) {
      console.log('[NBA Fallback] No SPORTSGAMEODDS_API_KEY configured');
      return [];
    }

    console.log('[NBA Fallback] Fetching from SportsGameOdds API...');
    
    const response = await fetch(
      'https://api.sportsgameodds.com/v2/events?leagueID=NBA&oddsAvailable=true&limit=30',
      { headers: { 'x-api-key': apiKey } }
    );

    if (!response.ok) {
      console.error(`[NBA Fallback] API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const events = data?.data || data?.events || [];
    console.log(`[NBA Fallback] Found ${events.length} events from API`);

    for (const event of events) {
      const game = parseAPIEvent(event, 'Basketball', 'NBA', 95);
      if (game) games.push(game);
    }

    return games;
  } catch (error) {
    console.error('[NBA Fallback] Error fetching games:', error);
    return [];
  }
}

// ============================================================================
// MLB INTEGRATION via SportsGameOdds API
// ============================================================================

async function fetchMLBGames(): Promise<ScheduledGame[]> {
  const games: ScheduledGame[] = [];
  
  try {
    const apiKey = Deno.env.get('SPORTSGAMEODDS_API_KEY');
    if (!apiKey) {
      console.log('[MLB] No SPORTSGAMEODDS_API_KEY configured');
      return [];
    }

    console.log('[MLB] Fetching from SportsGameOdds API...');
    
    const response = await fetch(
      'https://api.sportsgameodds.com/v2/events?leagueID=MLB&oddsAvailable=true&limit=30',
      { headers: { 'x-api-key': apiKey } }
    );

    if (!response.ok) {
      console.error(`[MLB] API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const events = data?.data || data?.events || [];
    console.log(`[MLB] Found ${events.length} events from API`);

    for (const event of events) {
      const game = parseAPIEvent(event, 'Baseball', 'MLB', 85);
      if (game) games.push(game);
    }

    return games;
  } catch (error) {
    console.error('[MLB] Error fetching games:', error);
    return [];
  }
}

// ============================================================================
// NCAAB INTEGRATION via SportsGameOdds API
// ============================================================================

async function fetchNCAABGames(): Promise<ScheduledGame[]> {
  const games: ScheduledGame[] = [];
  
  try {
    const apiKey = Deno.env.get('SPORTSGAMEODDS_API_KEY');
    if (!apiKey) {
      console.log('[NCAAB] No SPORTSGAMEODDS_API_KEY configured');
      return [];
    }

    console.log('[NCAAB] Fetching from SportsGameOdds API...');
    
    const response = await fetch(
      'https://api.sportsgameodds.com/v2/events?leagueID=NCAAB&oddsAvailable=true&limit=30',
      { headers: { 'x-api-key': apiKey } }
    );

    if (!response.ok) {
      console.error(`[NCAAB] API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const events = data?.data || data?.events || [];
    console.log(`[NCAAB] Found ${events.length} events from API`);

    for (const event of events) {
      const game = parseAPIEvent(event, 'Basketball', 'NCAAB', 80);
      if (game) games.push(game);
    }

    return games;
  } catch (error) {
    console.error('[NCAAB] Error fetching games:', error);
    return [];
  }
}

// ============================================================================
// NCAAF INTEGRATION via SportsGameOdds API
// ============================================================================

async function fetchNCAAFGames(): Promise<ScheduledGame[]> {
  const games: ScheduledGame[] = [];
  
  try {
    const apiKey = Deno.env.get('SPORTSGAMEODDS_API_KEY');
    if (!apiKey) {
      console.log('[NCAAF] No SPORTSGAMEODDS_API_KEY configured');
      return [];
    }

    console.log('[NCAAF] Fetching from SportsGameOdds API...');
    
    const response = await fetch(
      'https://api.sportsgameodds.com/v2/events?leagueID=NCAAF&oddsAvailable=true&limit=30',
      { headers: { 'x-api-key': apiKey } }
    );

    if (!response.ok) {
      console.error(`[NCAAF] API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const events = data?.data || data?.events || [];
    console.log(`[NCAAF] Found ${events.length} events from API`);

    for (const event of events) {
      const game = parseAPIEvent(event, 'Football', 'NCAAF', 85);
      if (game) games.push(game);
    }

    return games;
  } catch (error) {
    console.error('[NCAAF] Error fetching games:', error);
    return [];
  }
}

// ============================================================================
// NFL INTEGRATION via SportsGameOdds API
// ============================================================================

async function fetchNFLGames(): Promise<ScheduledGame[]> {
  const games: ScheduledGame[] = [];
  
  try {
    const apiKey = Deno.env.get('SPORTSGAMEODDS_API_KEY');
    if (!apiKey) {
      console.log('[NFL] No SPORTSGAMEODDS_API_KEY configured');
      return [];
    }

    console.log('[NFL] Fetching from SportsGameOdds API...');
    
    const response = await fetch(
      'https://api.sportsgameodds.com/v2/events?leagueID=NFL&oddsAvailable=true&limit=30',
      { headers: { 'x-api-key': apiKey } }
    );

    if (!response.ok) {
      console.error(`[NFL] API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const events = data?.data || data?.events || [];
    console.log(`[NFL] Found ${events.length} events from API`);

    for (const event of events) {
      const game = parseAPIEvent(event, 'Football', 'NFL', 100);
      if (game) games.push(game);
    }

    return games;
  } catch (error) {
    console.error('[NFL] Error fetching games:', error);
    return [];
  }
}

// ============================================================================
// UFC/MMA INTEGRATION via SportsGameOdds API
// ============================================================================

async function fetchUFCGames(): Promise<ScheduledGame[]> {
  const games: ScheduledGame[] = [];
  
  try {
    const apiKey = Deno.env.get('SPORTSGAMEODDS_API_KEY');
    if (!apiKey) {
      console.log('[UFC] No SPORTSGAMEODDS_API_KEY configured');
      return [];
    }

    console.log('[UFC] Fetching from SportsGameOdds API...');
    
    const response = await fetch(
      'https://api.sportsgameodds.com/v2/events?leagueID=UFC&oddsAvailable=true&limit=30',
      { headers: { 'x-api-key': apiKey } }
    );

    if (!response.ok) {
      console.error(`[UFC] API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const events = data?.data || data?.events || [];
    console.log(`[UFC] Found ${events.length} events from API`);

    for (const event of events) {
      const game = parseAPIEvent(event, 'MMA', 'UFC', 92);
      if (game) games.push(game);
    }

    return games;
  } catch (error) {
    console.error('[UFC] Error fetching games:', error);
    return [];
  }
}

// ============================================================================
// TENNIS (ATP/WTA) INTEGRATION via SportsGameOdds API
// ============================================================================

async function fetchTennisGames(): Promise<ScheduledGame[]> {
  const games: ScheduledGame[] = [];
  
  try {
    const apiKey = Deno.env.get('SPORTSGAMEODDS_API_KEY');
    if (!apiKey) {
      console.log('[Tennis] No SPORTSGAMEODDS_API_KEY configured');
      return [];
    }

    console.log('[Tennis] Fetching ATP and WTA from SportsGameOdds API...');
    
    const [atpResponse, wtaResponse] = await Promise.all([
      fetch('https://api.sportsgameodds.com/v2/events?leagueID=ATP&oddsAvailable=true&limit=20', 
        { headers: { 'x-api-key': apiKey } }),
      fetch('https://api.sportsgameodds.com/v2/events?leagueID=WTA&oddsAvailable=true&limit=20', 
        { headers: { 'x-api-key': apiKey } }),
    ]);

    const processResponse = async (response: Response, league: string, popularity: number) => {
      if (!response.ok) {
        console.error(`[Tennis] ${league} API error: ${response.status}`);
        return;
      }

      const data = await response.json();
      const events = data?.data || data?.events || [];
      console.log(`[Tennis] Found ${events.length} ${league} events`);

      for (const event of events) {
        const game = parseAPIEvent(event, 'Tennis', league, popularity);
        if (game) games.push(game);
      }
    };

    await Promise.all([
      processResponse(atpResponse, 'ATP', 70),
      processResponse(wtaResponse, 'WTA', 65),
    ]);

    return games;
  } catch (error) {
    console.error('[Tennis] Error fetching games:', error);
  return [];
  }
}

// ============================================================================
// TABLE TENNIS INTEGRATION via TheOddsAPI
// ============================================================================

async function fetchTableTennisGames(): Promise<ScheduledGame[]> {
  const games: ScheduledGame[] = [];
  
  try {
    const apiKey = Deno.env.get('THE_ODDS_API_KEY');
    if (!apiKey) {
      console.log('[Table Tennis] No THE_ODDS_API_KEY configured');
      return [];
    }

    console.log('[Table Tennis] Fetching from TheOddsAPI...');
    
    // TheOddsAPI supports table tennis with key 'tabletennis_wtt'
    const tableTennisSports = [
      { key: 'tabletennis', league: 'Table Tennis', popularity: 58 },
    ];

    for (const sportConfig of tableTennisSports) {
      try {
        const response = await fetch(
          `https://api.the-odds-api.com/v4/sports/${sportConfig.key}/odds/?apiKey=${apiKey}&regions=us&markets=h2h&oddsFormat=american`,
          { headers: { 'Accept': 'application/json' } }
        );

        if (!response.ok) {
          if (response.status === 404) {
            console.log(`[Table Tennis] Sport not available: ${response.status}`);
            continue;
          }
          console.log(`[Table Tennis] API error: ${response.status}`);
          continue;
        }

        const events = await response.json();
        console.log(`[Table Tennis] Found ${events.length} events from TheOddsAPI`);

        for (const event of events) {
          const homeTeam = event.home_team || '';
          const awayTeam = event.away_team || '';
          
          if (!homeTeam || !awayTeam) continue;
          if (!event.commence_time) continue;

          // Extract odds
          const odds: ScheduledGame['odds'] = {};
          const bookmakers = event.bookmakers || [];
          
          if (bookmakers.length > 0) {
            const primaryBook = bookmakers[0];
            const markets = primaryBook.markets || [];
            
            for (const market of markets) {
              if (market.key === 'h2h') {
                const homeOutcome = market.outcomes?.find((o: any) => o.name === homeTeam);
                const awayOutcome = market.outcomes?.find((o: any) => o.name === awayTeam);
                
                if (homeOutcome && awayOutcome) {
                  odds.moneyline = {
                    home: homeOutcome.price || 0,
                    away: awayOutcome.price || 0,
                  };
                }
              }
            }
          }

          games.push({
            id: `tt_${event.id || Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            sport: 'Table Tennis',
            league: sportConfig.league,
            homeTeam,
            awayTeam,
            startTime: event.commence_time,
            popularityScore: sportConfig.popularity,
            status: 'scheduled',
            odds: Object.keys(odds).length > 0 ? odds : undefined,
            hasOdds: Object.keys(odds).length > 0,
          });
        }
      } catch (e) {
        console.log(`[Table Tennis] Error fetching:`, e);
      }
    }

    console.log(`[Table Tennis] Total games fetched: ${games.length}`);
    return games;
  } catch (error) {
    console.error('[Table Tennis] Error fetching games:', error);
    return [];
  }
}

// ============================================================================
// THE ODDS API INTEGRATION (Free tier: 500 requests/month)
// ============================================================================

async function fetchTheOddsAPIGames(): Promise<ScheduledGame[]> {
  const games: ScheduledGame[] = [];
  
  try {
    const apiKey = Deno.env.get('THE_ODDS_API_KEY');
    if (!apiKey) {
      console.log('[TheOddsAPI] No THE_ODDS_API_KEY configured');
      return [];
    }

    console.log('[TheOddsAPI] Fetching live and upcoming games...');
    
    // Fetch multiple sports with odds
    const sports = [
      { key: 'americanfootball_nfl', sport: 'Football', league: 'NFL', popularity: 100 },
      { key: 'basketball_nba', sport: 'Basketball', league: 'NBA', popularity: 95 },
      { key: 'baseball_mlb', sport: 'Baseball', league: 'MLB', popularity: 85 },
      { key: 'icehockey_nhl', sport: 'Hockey', league: 'NHL', popularity: 80 },
      { key: 'americanfootball_ncaaf', sport: 'Football', league: 'NCAAF', popularity: 85 },
      { key: 'basketball_ncaab', sport: 'Basketball', league: 'NCAAB', popularity: 80 },
      { key: 'soccer_epl', sport: 'Soccer', league: 'EPL', popularity: 90 },
      { key: 'soccer_spain_la_liga', sport: 'Soccer', league: 'La Liga', popularity: 85 },
      { key: 'soccer_germany_bundesliga', sport: 'Soccer', league: 'Bundesliga', popularity: 82 },
      { key: 'soccer_italy_serie_a', sport: 'Soccer', league: 'Serie A', popularity: 80 },
      { key: 'soccer_usa_mls', sport: 'Soccer', league: 'MLS', popularity: 65 },
      { key: 'mma_mixed_martial_arts', sport: 'MMA', league: 'UFC', popularity: 92 },
      { key: 'tennis_atp_aus_open', sport: 'Tennis', league: 'ATP', popularity: 70 },
    ];

    for (const sportConfig of sports) {
      try {
        const response = await fetch(
          `https://api.the-odds-api.com/v4/sports/${sportConfig.key}/odds/?apiKey=${apiKey}&regions=us&markets=h2h,spreads,totals&oddsFormat=american`,
          { headers: { 'Accept': 'application/json' } }
        );

        if (!response.ok) {
          if (response.status === 404) continue; // Sport not in season
          console.log(`[TheOddsAPI] ${sportConfig.league} error: ${response.status}`);
          continue;
        }

        const events = await response.json();
        console.log(`[TheOddsAPI] Found ${events.length} ${sportConfig.league} events`);

        for (const event of events) {
          const game = parseTheOddsEvent(event, sportConfig);
          if (game) games.push(game);
        }
      } catch (e) {
        console.log(`[TheOddsAPI] Error fetching ${sportConfig.league}:`, e);
      }
    }

    console.log(`[TheOddsAPI] Total games fetched: ${games.length}`);
    return games;
  } catch (error) {
    console.error('[TheOddsAPI] Error:', error);
    return [];
  }
}

function parseTheOddsEvent(event: any, config: { sport: string; league: string; popularity: number }): ScheduledGame | null {
  try {
    const homeTeam = event.home_team || '';
    const awayTeam = event.away_team || '';
    
    if (!homeTeam || !awayTeam) return null;

    // Extract best odds from bookmakers
    const odds: ScheduledGame['odds'] = {};
    const bookmakers = event.bookmakers || [];
    
    if (bookmakers.length > 0) {
      const primaryBook = bookmakers[0];
      const markets = primaryBook.markets || [];
      
      for (const market of markets) {
        if (market.key === 'h2h') {
          const homeOutcome = market.outcomes?.find((o: any) => o.name === homeTeam);
          const awayOutcome = market.outcomes?.find((o: any) => o.name === awayTeam);
          const drawOutcome = market.outcomes?.find((o: any) => o.name === 'Draw');
          
          if (homeOutcome && awayOutcome) {
            odds.moneyline = {
              home: homeOutcome.price || 0,
              away: awayOutcome.price || 0,
              draw: drawOutcome?.price,
            };
          }
        }
        
        if (market.key === 'spreads') {
          const homeSpread = market.outcomes?.find((o: any) => o.name === homeTeam);
          const awaySpread = market.outcomes?.find((o: any) => o.name === awayTeam);
          
          if (homeSpread && awaySpread) {
            odds.spread = {
              home: parseFloat(homeSpread.point || 0),
              homeOdds: homeSpread.price || -110,
              away: parseFloat(awaySpread.point || 0),
              awayOdds: awaySpread.price || -110,
            };
          }
        }
        
        if (market.key === 'totals') {
          const over = market.outcomes?.find((o: any) => o.name === 'Over');
          const under = market.outcomes?.find((o: any) => o.name === 'Under');
          
          if (over && under) {
            odds.total = {
              over: parseFloat(over.point || 0),
              overOdds: over.price || -110,
              under: parseFloat(under.point || 0),
              underOdds: under.price || -110,
            };
          }
        }
      }
    }

    // Require a valid commence_time - don't use current date as fallback
    if (!event.commence_time) return null;
    
    return {
      id: `odds_${event.id || Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      sport: config.sport,
      league: config.league,
      homeTeam,
      awayTeam,
      startTime: event.commence_time,
      popularityScore: config.popularity,
      status: 'scheduled',
      odds: Object.keys(odds).length > 0 ? odds : undefined,
      hasOdds: Object.keys(odds).length > 0,
    };
  } catch {
    return null;
  }
}

// ============================================================================
// ESPN FREE PUBLIC API (No API key required)
// ============================================================================

async function fetchESPNGames(): Promise<ScheduledGame[]> {
  const games: ScheduledGame[] = [];
  
  const espnSports = [
    { path: 'football/nfl', sport: 'Football', league: 'NFL', popularity: 100 },
    { path: 'basketball/nba', sport: 'Basketball', league: 'NBA', popularity: 95 },
    { path: 'baseball/mlb', sport: 'Baseball', league: 'MLB', popularity: 85 },
    { path: 'hockey/nhl', sport: 'Hockey', league: 'NHL', popularity: 80 },
    { path: 'football/college-football', sport: 'Football', league: 'NCAAF', popularity: 85 },
    { path: 'basketball/mens-college-basketball', sport: 'Basketball', league: 'NCAAB', popularity: 80 },
    { path: 'basketball/wnba', sport: 'Basketball', league: 'WNBA', popularity: 70 },
    { path: 'soccer/eng.1', sport: 'Soccer', league: 'EPL', popularity: 90 },
    { path: 'soccer/esp.1', sport: 'Soccer', league: 'La Liga', popularity: 85 },
    { path: 'soccer/ger.1', sport: 'Soccer', league: 'Bundesliga', popularity: 82 },
    { path: 'soccer/ita.1', sport: 'Soccer', league: 'Serie A', popularity: 80 },
    { path: 'soccer/usa.1', sport: 'Soccer', league: 'MLS', popularity: 65 },
    { path: 'mma/ufc', sport: 'MMA', league: 'UFC', popularity: 92 },
  ];

  console.log('[ESPN] Fetching from free public API...');

  for (const sportConfig of espnSports) {
    try {
      const response = await fetch(
        `https://site.api.espn.com/apis/site/v2/sports/${sportConfig.path}/scoreboard`,
        { headers: { 'Accept': 'application/json' } }
      );

      if (!response.ok) continue;

      const data = await response.json();
      const events = data.events || [];
      
      if (events.length > 0) {
        console.log(`[ESPN] Found ${events.length} ${sportConfig.league} events`);
      }

      for (const event of events) {
        const game = parseESPNEvent(event, sportConfig);
        if (game) games.push(game);
      }
    } catch (e) {
      // Silently continue on errors
    }
  }

  console.log(`[ESPN] Total games fetched: ${games.length}`);
  return games;
}

function parseESPNEvent(event: any, config: { sport: string; league: string; popularity: number }): ScheduledGame | null {
  try {
    const competitions = event.competitions || [];
    if (competitions.length === 0) return null;
    
    const competition = competitions[0];
    const competitors = competition.competitors || [];
    
    if (competitors.length < 2) return null;
    
    let homeTeam = '';
    let awayTeam = '';
    
    // For UFC/MMA, competitors don't have homeAway, use athlete names or first two competitors
    if (config.league === 'UFC' || config.sport === 'MMA') {
      // UFC uses athlete property for fighters
      const fighter1 = competitors[0]?.athlete?.displayName || 
                       competitors[0]?.team?.displayName || 
                       competitors[0]?.team?.name ||
                       competitors[0]?.displayName || '';
      const fighter2 = competitors[1]?.athlete?.displayName || 
                       competitors[1]?.team?.displayName || 
                       competitors[1]?.team?.name ||
                       competitors[1]?.displayName || '';
      homeTeam = fighter1;
      awayTeam = fighter2;
    } else {
      // Standard home/away for team sports
      const homeComp = competitors.find((c: any) => c.homeAway === 'home') || competitors[0];
      const awayComp = competitors.find((c: any) => c.homeAway === 'away') || competitors[1];
      homeTeam = homeComp.team?.displayName || homeComp.team?.name || '';
      awayTeam = awayComp.team?.displayName || awayComp.team?.name || '';
    }
    
    if (!homeTeam || !awayTeam) return null;

    const status = event.status?.type?.name || '';
    const statusState = event.status?.type?.state || '';
    let gameStatus: 'scheduled' | 'live' | 'completed' = 'scheduled';
    
    // ESPN uses state: 'in', 'pre', 'post' for status
    if (statusState === 'in' || status === 'STATUS_IN_PROGRESS') {
      gameStatus = 'live';
    } else if (statusState === 'post' || status.toLowerCase().includes('final') || status === 'STATUS_FINAL') {
      gameStatus = 'completed';
    }

    // Require a valid date - don't use current date as fallback
    if (!event.date) return null;
    
    return {
      id: `espn_${event.id || Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      sport: config.sport,
      league: config.league,
      homeTeam,
      awayTeam,
      startTime: event.date,
      popularityScore: config.popularity,
      status: gameStatus,
      hasOdds: false,
    };
  } catch {
    return null;
  }
}

// ============================================================================
// SHARED API EVENT PARSER
// ============================================================================

function parseAPIEvent(event: any, sport: string, league: string, popularity: number): ScheduledGame | null {
  const homeTeam = event.teams?.home?.names?.long || 
                   event.teams?.home?.names?.medium || 
                   event.homeTeam || '';
  const awayTeam = event.teams?.away?.names?.long || 
                   event.teams?.away?.names?.medium || 
                   event.awayTeam || '';
  
  if (!homeTeam || !awayTeam) return null;
  
  // Require a valid start time - don't use current date as fallback
  const rawStartTime = event.status?.startsAt || event.startTime || event.date;
  if (!rawStartTime) return null;
  
  const isLive = event.status?.live === true;
  const isEnded = event.status?.ended === true;

  // Parse odds
  const odds = event.odds || {};
  let moneylineHome = 0, moneylineAway = 0;
  let spreadHome = 0, spreadHomeOdds = -110;
  let totalOver = 0, totalOverOdds = -110;

  for (const [oddId, oddData] of Object.entries(odds)) {
    const odd = oddData as any;
    const fairOdds = typeof odd?.fairOdds === 'number' ? odd.fairOdds : 
                    (typeof odd?.bookOdds === 'number' ? odd.bookOdds : 0);
    
    if (oddId.includes('-ml-home')) moneylineHome = fairOdds;
    if (oddId.includes('-ml-away')) moneylineAway = fairOdds;
    if (oddId.includes('-sp-home')) {
      spreadHome = parseFloat(odd?.fairSpread || odd?.line || 0);
      spreadHomeOdds = fairOdds || -110;
    }
    if (oddId.includes('-ou-over')) {
      totalOver = parseFloat(odd?.fairOverUnder || odd?.line || 0);
      totalOverOdds = fairOdds || -110;
    }
  }

  const hasValidOdds = moneylineHome !== 0 || moneylineAway !== 0;

  const gameOdds: ScheduledGame['odds'] = {};
  if (moneylineHome || moneylineAway) {
    gameOdds.moneyline = { home: moneylineHome, away: moneylineAway };
  }
  if (spreadHome) {
    gameOdds.spread = { home: spreadHome, homeOdds: spreadHomeOdds, away: -spreadHome, awayOdds: -110 };
  }
  if (totalOver) {
    gameOdds.total = { over: totalOver, overOdds: totalOverOdds, under: totalOver, underOdds: -110 };
  }

  return {
    id: `${league.toLowerCase()}_${event.eventID || event.id || Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    sport,
    league,
    homeTeam,
    awayTeam,
    startTime: rawStartTime,
    popularityScore: popularity,
    status: isEnded ? 'completed' : (isLive ? 'live' : 'scheduled'),
    odds: Object.keys(gameOdds).length > 0 ? gameOdds : undefined,
    hasOdds: hasValidOdds,
  };
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const auth = await authenticateUser(req);
    if (!auth) {
      console.log('[Auth] Unauthorized request - no valid token');
      return new Response(
        JSON.stringify({ error: 'Unauthorized', success: false }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check rate limit
    if (!checkRateLimit(auth.userId)) {
      console.log('[Rate Limit] User exceeded rate limit:', auth.userId);
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.', success: false }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const forceRefresh = url.searchParams.get('refresh') === 'true';
    
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

    const rapidApiKey = Deno.env.get('RAPIDAPI_KEY');
    
    console.log('[API] Starting fresh fetch from real APIs only...');
    
    // Fetch from all REAL API sources in parallel
    const [
      sportsbookGames, 
      nflGames, 
      nbaGames, 
      nhlGames, 
      mlbGames, 
      ncaabGames, 
      ncaafGames, 
      ufcGames, 
      tennisGames,
      tableTennisGames,
      theOddsGames,
      espnGames,
    ] = await Promise.all([
      rapidApiKey ? fetchSportsbookGames(rapidApiKey) : Promise.resolve([]),
      fetchNFLGames(),
      fetchNBAGames(),
      fetchNHLGames(),
      fetchMLBGames(),
      fetchNCAABGames(),
      fetchNCAAFGames(),
      fetchUFCGames(),
      fetchTennisGames(),
      fetchTableTennisGames(),
      fetchTheOddsAPIGames(),
      fetchESPNGames(),
    ]);
    
    const allGames = [
      ...sportsbookGames, 
      ...nflGames, 
      ...nbaGames, 
      ...nhlGames, 
      ...mlbGames, 
      ...ncaabGames, 
      ...ncaafGames, 
      ...ufcGames, 
      ...tennisGames,
      ...tableTennisGames,
      ...theOddsGames,
      ...espnGames,
    ];
    
    console.log(`[API] Total fetched: ${allGames.length} games (Sportsbook: ${sportsbookGames.length}, NFL: ${nflGames.length}, NBA: ${nbaGames.length}, NHL: ${nhlGames.length}, MLB: ${mlbGames.length}, NCAAB: ${ncaabGames.length}, NCAAF: ${ncaafGames.length}, UFC: ${ufcGames.length}, Tennis: ${tennisGames.length}, TableTennis: ${tableTennisGames.length}, TheOddsAPI: ${theOddsGames.length}, ESPN: ${espnGames.length})`);

    // Filter out completed games and games with past dates (allow games from today onwards or live games)
    const now = new Date();
    // Set to start of today to include all games from today
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const upcomingOrLiveGames = allGames.filter(game => {
      // Always keep live games
      if (game.status === 'live') return true;
      
      // Filter out completed games
      if (game.status === 'completed') return false;
      
      // Filter out games with past dates
      try {
        const gameDate = new Date(game.startTime);
        // Keep games that are today or in the future
        return gameDate >= startOfToday;
      } catch {
        // If date parsing fails, exclude the game
        return false;
      }
    });
    
    console.log(`[API] After date filtering: ${upcomingOrLiveGames.length} upcoming/live games (filtered out ${allGames.length - upcomingOrLiveGames.length} past/completed games)`);

    if (upcomingOrLiveGames.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          games: [],
          source: 'fresh',
          lastUpdated: new Date().toISOString(),
          message: 'No games currently available from live data sources.',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const rankedGames = deduplicateAndRank(upcomingOrLiveGames);
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
