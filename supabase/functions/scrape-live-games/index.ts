import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// RATE LIMITING
// ============================================================================
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 30; // requests per window
const RATE_WINDOW_MS = 60 * 1000; // 1 minute window

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

interface PlayerStats {
  wins: number;
  losses: number;
  winPct: number;
  // Fighter-specific (UFC/MMA/Boxing)
  record?: string;
  weightClass?: string;
  knockouts?: number;
  submissions?: number;
  // Racket sports (Tennis/Table Tennis)
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
  // Player/fighter stats
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
  if (lower.includes('golf') || lower.includes('pga') || lower.includes('liv')) return 'Golf';
  if (lower.includes('cs2') || lower.includes('counter-strike') || lower.includes('csgo') || lower.includes('lol') || lower.includes('league of legends') || lower.includes('valorant') || lower.includes('esport') || lower.includes('dota')) return 'Esports';
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
  if (lower.includes('liv')) return 'LIV';
  if (lower.includes('cs2') || lower.includes('counter-strike') || lower.includes('csgo')) return 'CS2';
  if (lower.includes('lol') || lower.includes('league of legends') || lower.includes('lcs') || lower.includes('lec')) return 'LoL';
  if (lower.includes('valorant') || lower.includes('vct')) return 'Valorant';
  return input || 'Sports';
}

// ============================================================================
// ESTIMATED ODDS GENERATOR
// For games without live odds data, we generate reasonable estimates
// ============================================================================

function generateEstimatedOdds(ranking1?: number, ranking2?: number): {
  moneyline: { home: number; away: number };
  spread?: { home: number; homeOdds: number; away: number; awayOdds: number };
} {
  // Default to even matchup
  let homeAdvantage = 0;
  
  // Calculate advantage based on rankings (lower = better)
  if (ranking1 !== undefined && ranking2 !== undefined && ranking1 > 0 && ranking2 > 0) {
    const rankDiff = ranking2 - ranking1; // Positive means home is better
    homeAdvantage = Math.min(Math.max(rankDiff * 8, -150), 150); // Cap at +/- 150
  } else {
    // Random slight favorite for realism
    homeAdvantage = (Math.random() - 0.5) * 80;
  }
  
  // Convert advantage to moneyline odds
  let homeML: number, awayML: number;
  
  if (homeAdvantage >= 0) {
    // Home is favorite
    homeML = homeAdvantage > 50 ? Math.round(-100 - homeAdvantage) : Math.round(-110 - homeAdvantage * 0.5);
    awayML = homeAdvantage > 50 ? Math.round(100 + homeAdvantage * 0.9) : Math.round(100 + homeAdvantage * 0.7);
  } else {
    // Away is favorite
    homeML = Math.round(100 + Math.abs(homeAdvantage) * 0.9);
    awayML = Math.round(-100 - Math.abs(homeAdvantage));
  }
  
  // Ensure realistic odds ranges
  homeML = Math.max(Math.min(homeML, 350), -400);
  awayML = Math.max(Math.min(awayML, 350), -400);
  
  // Generate spread for team sports
  const spreadHome = homeAdvantage > 0 ? -Math.round(homeAdvantage / 30 * 2) / 2 : Math.round(Math.abs(homeAdvantage) / 30 * 2) / 2;
  
  return {
    moneyline: { home: homeML, away: awayML },
    spread: { home: spreadHome, homeOdds: -110, away: -spreadHome, awayOdds: -110 },
  };
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
// UFC EVENTS INTEGRATION
// ============================================================================

interface UFCFight {
  fighter1: string;
  fighter2: string;
  weightClass: string;
  isMainEvent: boolean;
  isTitleFight: boolean;
  fighter1Record?: string;
  fighter2Record?: string;
  fighter1Knockouts?: number;
  fighter2Knockouts?: number;
}

interface UFCEvent {
  id: string;
  name: string;
  date: string;
  location: string;
  mainEvent?: string;
  fights: UFCFight[];
}

function generateMockUFCEvents(): UFCEvent[] {
  const now = new Date();
  
  return [
    {
      id: 'ufc-event-1',
      name: 'UFC 312: du Plessis vs. Strickland 2',
      date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      location: 'Sydney, Australia',
      mainEvent: 'Dricus du Plessis vs Sean Strickland',
      fights: [
        { fighter1: 'Dricus du Plessis', fighter2: 'Sean Strickland', weightClass: 'Middleweight', isMainEvent: true, isTitleFight: true, fighter1Record: '22-2-0', fighter2Record: '29-6-0', fighter1Knockouts: 8, fighter2Knockouts: 11 },
        { fighter1: 'Tai Tuivasa', fighter2: 'Jairzinho Rozenstruik', weightClass: 'Heavyweight', isMainEvent: false, isTitleFight: false, fighter1Record: '15-8-0', fighter2Record: '14-5-0', fighter1Knockouts: 14, fighter2Knockouts: 13 },
        { fighter1: 'Jimmy Crute', fighter2: 'Alonzo Menifield', weightClass: 'Light Heavyweight', isMainEvent: false, isTitleFight: false, fighter1Record: '14-4-0', fighter2Record: '16-4-0', fighter1Knockouts: 9, fighter2Knockouts: 13 },
      ],
    },
    {
      id: 'ufc-event-2',
      name: 'UFC Fight Night: Moreno vs. Albazi',
      date: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      location: 'Las Vegas, NV',
      mainEvent: 'Brandon Moreno vs Amir Albazi',
      fights: [
        { fighter1: 'Brandon Moreno', fighter2: 'Amir Albazi', weightClass: 'Flyweight', isMainEvent: true, isTitleFight: false, fighter1Record: '21-8-2', fighter2Record: '17-1-0', fighter1Knockouts: 6, fighter2Knockouts: 3 },
        { fighter1: 'Cory Sandhagen', fighter2: 'Umar Nurmagomedov', weightClass: 'Bantamweight', isMainEvent: false, isTitleFight: false, fighter1Record: '17-5-0', fighter2Record: '18-0-0', fighter1Knockouts: 5, fighter2Knockouts: 3 },
        { fighter1: 'Mackenzie Dern', fighter2: 'Amanda Ribas', weightClass: "Women's Strawweight", isMainEvent: false, isTitleFight: false, fighter1Record: '14-5-0', fighter2Record: '13-5-0', fighter1Knockouts: 0, fighter2Knockouts: 1 },
      ],
    },
    {
      id: 'ufc-event-3',
      name: 'UFC 313: Pereira vs. Ankalaev',
      date: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      location: 'Las Vegas, NV',
      mainEvent: 'Alex Pereira vs Magomed Ankalaev',
      fights: [
        { fighter1: 'Alex Pereira', fighter2: 'Magomed Ankalaev', weightClass: 'Light Heavyweight', isMainEvent: true, isTitleFight: true, fighter1Record: '12-2-0', fighter2Record: '19-1-1', fighter1Knockouts: 11, fighter2Knockouts: 10 },
        { fighter1: 'Jailton Almeida', fighter2: 'Derrick Lewis', weightClass: 'Heavyweight', isMainEvent: false, isTitleFight: false, fighter1Record: '21-3-0', fighter2Record: '28-12-0', fighter1Knockouts: 5, fighter2Knockouts: 24 },
        { fighter1: 'Justin Gaethje', fighter2: 'Dan Hooker', weightClass: 'Lightweight', isMainEvent: false, isTitleFight: false, fighter1Record: '25-5-0', fighter2Record: '24-12-0', fighter1Knockouts: 20, fighter2Knockouts: 11 },
      ],
    },
    {
      id: 'ufc-event-4',
      name: 'UFC Fight Night: Holloway vs. Topuria 2',
      date: new Date(now.getTime() + 35 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      location: 'Miami, FL',
      mainEvent: 'Max Holloway vs Ilia Topuria',
      fights: [
        { fighter1: 'Max Holloway', fighter2: 'Ilia Topuria', weightClass: 'Featherweight', isMainEvent: true, isTitleFight: true, fighter1Record: '26-8-0', fighter2Record: '16-0-0', fighter1Knockouts: 12, fighter2Knockouts: 13 },
        { fighter1: 'Gilbert Burns', fighter2: 'Sean Brady', weightClass: 'Welterweight', isMainEvent: false, isTitleFight: false, fighter1Record: '22-7-0', fighter2Record: '17-1-0', fighter1Knockouts: 5, fighter2Knockouts: 5 },
      ],
    },
    {
      id: 'ufc-event-5',
      name: 'UFC 314: Makhachev vs. Oliveira 2',
      date: new Date(now.getTime() + 49 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      location: 'Abu Dhabi, UAE',
      mainEvent: 'Islam Makhachev vs Charles Oliveira',
      fights: [
        { fighter1: 'Islam Makhachev', fighter2: 'Charles Oliveira', weightClass: 'Lightweight', isMainEvent: true, isTitleFight: true, fighter1Record: '27-1-0', fighter2Record: '34-10-0', fighter1Knockouts: 5, fighter2Knockouts: 10 },
        { fighter1: 'Belal Muhammad', fighter2: 'Kamaru Usman', weightClass: 'Welterweight', isMainEvent: false, isTitleFight: false, fighter1Record: '24-3-0', fighter2Record: '20-4-0', fighter1Knockouts: 5, fighter2Knockouts: 9 },
        { fighter1: 'Merab Dvalishvili', fighter2: 'Sean OMalley', weightClass: 'Bantamweight', isMainEvent: false, isTitleFight: true, fighter1Record: '18-4-0', fighter2Record: '18-2-0', fighter1Knockouts: 2, fighter2Knockouts: 12 },
      ],
    },
  ];
}

function convertUFCEventsToGames(events: UFCEvent[]): ScheduledGame[] {
  const games: ScheduledGame[] = [];
  
  for (const event of events) {
    for (const fight of event.fights) {
      // Parse record to get wins/losses
      const parseRecord = (record?: string): { wins: number; losses: number } => {
        if (!record) return { wins: 0, losses: 0 };
        const parts = record.split('-').map(Number);
        return { wins: parts[0] || 0, losses: parts[1] || 0 };
      };
      
      const fighter1Stats = parseRecord(fight.fighter1Record);
      const fighter2Stats = parseRecord(fight.fighter2Record);
      
      games.push({
        id: `ufc_${event.id}_${fight.fighter1.replace(/\s+/g, '_')}_${fight.fighter2.replace(/\s+/g, '_')}`,
        sport: 'UFC',
        league: 'UFC',
        homeTeam: fight.fighter1,
        awayTeam: fight.fighter2,
        startTime: new Date(event.date).toISOString(),
        popularityScore: fight.isMainEvent ? 95 : (fight.isTitleFight ? 90 : 75),
        status: 'scheduled',
        hasOdds: false,
        homeStats: {
          wins: fighter1Stats.wins,
          losses: fighter1Stats.losses,
          winPct: fighter1Stats.wins / (fighter1Stats.wins + fighter1Stats.losses) || 0,
          record: fight.fighter1Record,
          weightClass: fight.weightClass,
          knockouts: fight.fighter1Knockouts,
        },
        awayStats: {
          wins: fighter2Stats.wins,
          losses: fighter2Stats.losses,
          winPct: fighter2Stats.wins / (fighter2Stats.wins + fighter2Stats.losses) || 0,
          record: fight.fighter2Record,
          weightClass: fight.weightClass,
          knockouts: fight.fighter2Knockouts,
        },
      });
    }
  }
  
  return games;
}

async function fetchUFCGames(): Promise<ScheduledGame[]> {
  try {
    console.log('[UFC] Fetching UFC events...');
    const events = generateMockUFCEvents();
    const games = convertUFCEventsToGames(events);
    console.log(`[UFC] Converted ${events.length} events to ${games.length} fights`);
    return games;
  } catch (error) {
    console.error('[UFC] Error fetching events:', error);
    return [];
  }
}

// ============================================================================
// TABLE TENNIS (WTT) INTEGRATION
// ============================================================================

interface TableTennisMatch {
  player1: string;
  player2: string;
  event: string;
  round: string;
  player1Ranking?: number;
  player2Ranking?: number;
  player1Points?: number;
  player2Points?: number;
}

function generateTableTennisMatches(): TableTennisMatch[] {
  return [
    { player1: 'Fan Zhendong', player2: 'Wang Chuqin', event: 'WTT Champions Frankfurt', round: 'Final', player1Ranking: 2, player2Ranking: 1, player1Points: 6450, player2Points: 7225 },
    { player1: 'Ma Long', player2: 'Lin Shidong', event: 'WTT Champions Frankfurt', round: 'Semi-Final', player1Ranking: 4, player2Ranking: 12, player1Points: 4850, player2Points: 2890 },
    { player1: 'Tomokazu Harimoto', player2: 'Hugo Calderano', event: 'WTT Champions Frankfurt', round: 'Semi-Final', player1Ranking: 6, player2Ranking: 5, player1Points: 4120, player2Points: 4350 },
    { player1: 'Lin Yun-Ju', player2: 'Truls Moregard', event: 'WTT Champions Frankfurt', round: 'Quarter-Final', player1Ranking: 7, player2Ranking: 8, player1Points: 3980, player2Points: 3750 },
    { player1: 'Liang Jingkun', player2: 'Dimitrij Ovtcharov', event: 'WTT Champions Frankfurt', round: 'Quarter-Final', player1Ranking: 3, player2Ranking: 15, player1Points: 5200, player2Points: 2450 },
    { player1: 'Sun Yingsha', player2: 'Chen Meng', event: 'WTT Champions Frankfurt', round: 'Final', player1Ranking: 1, player2Ranking: 2, player1Points: 8100, player2Points: 7650 },
    { player1: 'Wang Manyu', player2: 'Mima Ito', event: 'WTT Champions Frankfurt', round: 'Semi-Final', player1Ranking: 3, player2Ranking: 6, player1Points: 6200, player2Points: 4100 },
    { player1: 'Shin Yubin', player2: 'Hina Hayata', event: 'WTT Champions Frankfurt', round: 'Semi-Final', player1Ranking: 4, player2Ranking: 5, player1Points: 5800, player2Points: 5200 },
    { player1: 'Alexis Lebrun', player2: 'Felix Lebrun', event: 'WTT Contender Lagos', round: 'Final', player1Ranking: 9, player2Ranking: 10, player1Points: 3450, player2Points: 3380 },
    { player1: 'Quadri Aruna', player2: 'Dang Qiu', event: 'WTT Contender Lagos', round: 'Semi-Final', player1Ranking: 18, player2Ranking: 14, player1Points: 2280, player2Points: 2650 },
    { player1: 'Jang Woojin', player2: 'Cho Daeseong', event: 'WTT Star Contender Doha', round: 'Final', player1Ranking: 11, player2Ranking: 16, player1Points: 2980, player2Points: 2350 },
    { player1: 'Patrick Franziska', player2: 'Timo Boll', event: 'WTT Star Contender Doha', round: 'Quarter-Final', player1Ranking: 13, player2Ranking: 22, player1Points: 2720, player2Points: 1950 },
  ];
}

function convertTableTennisToGames(matches: TableTennisMatch[]): ScheduledGame[] {
  const now = new Date();
  
  return matches.map((match, index) => ({
    id: `wtt_${match.player1.replace(/\s+/g, '_')}_${match.player2.replace(/\s+/g, '_')}_${index}`,
    sport: 'Table Tennis',
    league: 'WTT',
    homeTeam: match.player1,
    awayTeam: match.player2,
    startTime: new Date(now.getTime() + (index * 3 + 1) * 24 * 60 * 60 * 1000).toISOString(),
    popularityScore: match.round === 'Final' ? 88 : match.round === 'Semi-Final' ? 80 : 72,
    status: 'scheduled' as const,
    hasOdds: false,
    homeStats: {
      wins: 0,
      losses: 0,
      winPct: 0,
      worldRanking: match.player1Ranking,
      points: match.player1Points,
    },
    awayStats: {
      wins: 0,
      losses: 0,
      winPct: 0,
      worldRanking: match.player2Ranking,
      points: match.player2Points,
    },
  }));
}

async function fetchTableTennisGames(): Promise<ScheduledGame[]> {
  try {
    console.log('[Table Tennis] Fetching WTT matches...');
    const matches = generateTableTennisMatches();
    const games = convertTableTennisToGames(matches);
    console.log(`[Table Tennis] Generated ${games.length} matches`);
    return games;
  } catch (error) {
    console.error('[Table Tennis] Error:', error);
    return [];
  }
}

// ============================================================================
// SOCCER GAMES via FIRECRAWL (ESPN)
// ============================================================================

interface SoccerMatch {
  homeTeam: string;
  awayTeam: string;
  league: string;
  date: string;
}

async function fetchSoccerGames(): Promise<ScheduledGame[]> {
  const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
  if (!firecrawlKey) {
    console.log('[Soccer] Firecrawl API key not configured, using fallback data');
    return generateFallbackSoccerGames();
  }

  try {
    console.log('[Soccer] Fetching ESPN Soccer schedule via Firecrawl...');
    
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://www.espn.com/soccer/schedule',
        formats: ['markdown'],
        onlyMainContent: true,
      }),
    });

    if (!response.ok) {
      console.error('[Soccer] Firecrawl API error:', response.status);
      return generateFallbackSoccerGames();
    }

    const data = await response.json();
    console.log('[Soccer] Firecrawl response received');

    // Parse game data from scraped content
    const games = parseSoccerGamesFromMarkdown(data);
    
    if (games.length === 0) {
      console.log('[Soccer] No games parsed from ESPN, using fallback');
      return generateFallbackSoccerGames();
    }

    console.log(`[Soccer] Parsed ${games.length} games from ESPN`);
    return games;
  } catch (error) {
    console.error('[Soccer] Error fetching soccer games:', error);
    return generateFallbackSoccerGames();
  }
}

function parseSoccerGamesFromMarkdown(data: any): ScheduledGame[] {
  const games: ScheduledGame[] = [];
  const now = new Date();
  
  // Common soccer team names for matching
  const soccerTeams = [
    'Manchester United', 'Manchester City', 'Liverpool', 'Chelsea', 'Arsenal', 'Tottenham',
    'Newcastle', 'Brighton', 'Aston Villa', 'West Ham', 'Everton', 'Fulham', 'Crystal Palace',
    'Wolves', 'Bournemouth', 'Brentford', 'Nottingham Forest', 'Burnley', 'Sheffield United', 'Luton',
    'Real Madrid', 'Barcelona', 'Atletico Madrid', 'Sevilla', 'Valencia', 'Athletic Bilbao',
    'Bayern Munich', 'Borussia Dortmund', 'RB Leipzig', 'Bayer Leverkusen', 'Eintracht Frankfurt',
    'PSG', 'Paris Saint-Germain', 'Marseille', 'Lyon', 'Monaco', 'Lille',
    'Juventus', 'AC Milan', 'Inter Milan', 'Napoli', 'Roma', 'Lazio', 'Atalanta',
    'Inter Miami', 'LA Galaxy', 'LAFC', 'Atlanta United', 'New York Red Bulls', 'Seattle Sounders'
  ];

  const leagueMapping: Record<string, string> = {
    'premier league': 'EPL',
    'english premier': 'EPL',
    'la liga': 'La Liga',
    'spain': 'La Liga',
    'bundesliga': 'Bundesliga',
    'germany': 'Bundesliga',
    'serie a': 'Serie A',
    'italy': 'Serie A',
    'ligue 1': 'Ligue 1',
    'france': 'Ligue 1',
    'champions league': 'Champions League',
    'ucl': 'Champions League',
    'mls': 'MLS',
  };

  try {
    const content = data.data?.markdown || data.markdown || '';
    
    // Look for patterns like "Team vs Team" or "Team @ Team"
    const matchPatterns = [
      /(\w+(?:\s+\w+)*)\s+(?:vs\.?|v\.?)\s+(\w+(?:\s+\w+)*)/gi,
      /(\w+(?:\s+\w+)*)\s+(?:at|@)\s+(\w+(?:\s+\w+)*)/gi,
    ];

    for (const pattern of matchPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const team1 = match[1].trim();
        const team2 = match[2].trim();
        
        // Check if both are soccer teams
        const isTeam1Soccer = soccerTeams.some(t => team1.toLowerCase().includes(t.toLowerCase()) || t.toLowerCase().includes(team1.toLowerCase()));
        const isTeam2Soccer = soccerTeams.some(t => team2.toLowerCase().includes(t.toLowerCase()) || t.toLowerCase().includes(team2.toLowerCase()));
        
        if (isTeam1Soccer && isTeam2Soccer) {
          const id = `soccer_${team2.replace(/\s+/g, '_')}_${team1.replace(/\s+/g, '_')}_${games.length}`;
          
          // Detect league from context
          let league = 'EPL';
          const lowerContent = content.toLowerCase();
          for (const [key, value] of Object.entries(leagueMapping)) {
            if (lowerContent.includes(key)) {
              league = value;
              break;
            }
          }
          
          // Avoid duplicates
          if (!games.some(g => g.homeTeam === team2 && g.awayTeam === team1)) {
            games.push({
              id,
              sport: 'Soccer',
              league,
              homeTeam: team2,
              awayTeam: team1,
              startTime: new Date(now.getTime() + (games.length * 24 + 12) * 60 * 60 * 1000).toISOString(),
              popularityScore: LEAGUE_POPULARITY[league] || 80,
              status: 'scheduled',
              hasOdds: false,
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('[Soccer] Error parsing markdown:', error);
  }

  return games.slice(0, 20);
}

function generateFallbackSoccerGames(): ScheduledGame[] {
  const now = new Date();
  
  const soccerMatchups = [
    { home: 'Manchester City', away: 'Liverpool', league: 'EPL' },
    { home: 'Arsenal', away: 'Chelsea', league: 'EPL' },
    { home: 'Manchester United', away: 'Tottenham', league: 'EPL' },
    { home: 'Newcastle', away: 'Aston Villa', league: 'EPL' },
    { home: 'Real Madrid', away: 'Barcelona', league: 'La Liga' },
    { home: 'Atletico Madrid', away: 'Sevilla', league: 'La Liga' },
    { home: 'Bayern Munich', away: 'Borussia Dortmund', league: 'Bundesliga' },
    { home: 'RB Leipzig', away: 'Bayer Leverkusen', league: 'Bundesliga' },
    { home: 'PSG', away: 'Marseille', league: 'Ligue 1' },
    { home: 'Lyon', away: 'Monaco', league: 'Ligue 1' },
    { home: 'Inter Milan', away: 'AC Milan', league: 'Serie A' },
    { home: 'Juventus', away: 'Napoli', league: 'Serie A' },
    { home: 'Real Madrid', away: 'Bayern Munich', league: 'Champions League' },
    { home: 'Manchester City', away: 'PSG', league: 'Champions League' },
    { home: 'Inter Miami', away: 'LA Galaxy', league: 'MLS' },
    { home: 'LAFC', away: 'Seattle Sounders', league: 'MLS' },
  ];

  return soccerMatchups.map((matchup, index) => ({
    id: `soccer_${matchup.home.replace(/\s+/g, '_')}_${matchup.away.replace(/\s+/g, '_')}_${index}`,
    sport: 'Soccer',
    league: matchup.league,
    homeTeam: matchup.home,
    awayTeam: matchup.away,
    startTime: new Date(now.getTime() + (index * 2 + 1) * 24 * 60 * 60 * 1000).toISOString(),
    popularityScore: LEAGUE_POPULARITY[matchup.league] || 80,
    status: 'scheduled' as const,
    hasOdds: false,
  }));
}

// ============================================================================
// NFL GAMES via FIRECRAWL
// ============================================================================

interface NFLGame {
  homeTeam: string;
  awayTeam: string;
  date: string;
  time: string;
  homeRecord?: string;
  awayRecord?: string;
}

async function fetchNFLGames(): Promise<ScheduledGame[]> {
  const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
  if (!firecrawlKey) {
    console.log('[NFL] Firecrawl API key not configured, using fallback data');
    return generateFallbackNFLGames();
  }

  try {
    console.log('[NFL] Fetching NFL schedule via Firecrawl...');
    
    const response = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: 'NFL schedule this week upcoming games 2025',
        limit: 5,
        scrapeOptions: {
          formats: ['markdown'],
        },
      }),
    });

    if (!response.ok) {
      console.error('[NFL] Firecrawl API error:', response.status);
      return generateFallbackNFLGames();
    }

    const data = await response.json();
    console.log('[NFL] Firecrawl response received');

    // Parse game data from search results
    const games = parseNFLGamesFromSearch(data);
    
    if (games.length === 0) {
      console.log('[NFL] No games parsed from Firecrawl, using fallback');
      return generateFallbackNFLGames();
    }

    console.log(`[NFL] Parsed ${games.length} games from search results`);
    return games;
  } catch (error) {
    console.error('[NFL] Error fetching NFL games:', error);
    return generateFallbackNFLGames();
  }
}

function parseNFLGamesFromSearch(data: any): ScheduledGame[] {
  const games: ScheduledGame[] = [];
  const now = new Date();
  
  // Common NFL team names for matching
  const nflTeams = [
    'Chiefs', 'Bills', 'Ravens', 'Bengals', 'Dolphins', 'Jets', 'Patriots', 'Steelers', 'Browns', 'Texans',
    'Colts', 'Jaguars', 'Titans', 'Broncos', 'Chargers', 'Raiders', 'Eagles', 'Cowboys', 'Giants', 'Commanders',
    '49ers', 'Seahawks', 'Rams', 'Cardinals', 'Packers', 'Lions', 'Vikings', 'Bears', 'Saints', 'Buccaneers',
    'Falcons', 'Panthers', 'Kansas City', 'Buffalo', 'Baltimore', 'Cincinnati', 'Miami', 'New York', 'New England',
    'Pittsburgh', 'Cleveland', 'Houston', 'Indianapolis', 'Jacksonville', 'Tennessee', 'Denver', 'Los Angeles',
    'Las Vegas', 'Philadelphia', 'Dallas', 'Washington', 'San Francisco', 'Seattle', 'Arizona', 'Green Bay',
    'Detroit', 'Minnesota', 'Chicago', 'New Orleans', 'Tampa Bay', 'Atlanta', 'Carolina'
  ];

  try {
    const results = data.data || data.results || [];
    
    for (const result of results) {
      const content = result.markdown || result.content || '';
      
      // Look for patterns like "Team vs Team" or "Team @ Team"
      const matchPatterns = [
        /(\w+(?:\s+\w+)?)\s+(?:vs\.?|@|at)\s+(\w+(?:\s+\w+)?)/gi,
        /(\w+)\s+(?:at|@)\s+(\w+)/gi,
      ];

      for (const pattern of matchPatterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          const team1 = match[1].trim();
          const team2 = match[2].trim();
          
          // Check if both are NFL teams
          const isTeam1NFL = nflTeams.some(t => team1.toLowerCase().includes(t.toLowerCase()));
          const isTeam2NFL = nflTeams.some(t => team2.toLowerCase().includes(t.toLowerCase()));
          
          if (isTeam1NFL && isTeam2NFL) {
            const id = `nfl_${team2.replace(/\s+/g, '_')}_${team1.replace(/\s+/g, '_')}_${games.length}`;
            
            // Avoid duplicates
            if (!games.some(g => g.homeTeam === team2 && g.awayTeam === team1)) {
              games.push({
                id,
                sport: 'NFL',
                league: 'NFL',
                homeTeam: team2, // Team after @ is home
                awayTeam: team1,
                startTime: new Date(now.getTime() + (games.length * 24 + 12) * 60 * 60 * 1000).toISOString(),
                popularityScore: 95,
                status: 'scheduled',
                hasOdds: false,
              });
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('[NFL] Error parsing search results:', error);
  }

  return games.slice(0, 16); // Limit to 16 games per week
}

function generateFallbackNFLGames(): ScheduledGame[] {
  const now = new Date();
  
  // Current NFL season games (realistic matchups)
  const nflMatchups = [
    { home: 'Kansas City Chiefs', away: 'Buffalo Bills', homeRecord: '15-2', awayRecord: '13-4' },
    { home: 'Philadelphia Eagles', away: 'Dallas Cowboys', homeRecord: '14-3', awayRecord: '12-5' },
    { home: 'San Francisco 49ers', away: 'Detroit Lions', homeRecord: '13-4', awayRecord: '14-3' },
    { home: 'Baltimore Ravens', away: 'Cincinnati Bengals', homeRecord: '13-4', awayRecord: '11-6' },
    { home: 'Miami Dolphins', away: 'New York Jets', homeRecord: '11-6', awayRecord: '7-10' },
    { home: 'Green Bay Packers', away: 'Minnesota Vikings', homeRecord: '10-7', awayRecord: '9-8' },
    { home: 'Houston Texans', away: 'Jacksonville Jaguars', homeRecord: '11-6', awayRecord: '9-8' },
    { home: 'Cleveland Browns', away: 'Pittsburgh Steelers', homeRecord: '11-6', awayRecord: '10-7' },
    { home: 'Los Angeles Rams', away: 'Seattle Seahawks', homeRecord: '10-7', awayRecord: '9-8' },
    { home: 'Tampa Bay Buccaneers', away: 'New Orleans Saints', homeRecord: '9-8', awayRecord: '9-8' },
    { home: 'Denver Broncos', away: 'Las Vegas Raiders', homeRecord: '8-9', awayRecord: '5-12' },
    { home: 'Atlanta Falcons', away: 'Carolina Panthers', homeRecord: '7-10', awayRecord: '2-15' },
  ];

  return nflMatchups.map((matchup, index) => {
    const parseRecord = (record: string) => {
      const [wins, losses] = record.split('-').map(Number);
      return { wins, losses, winPct: wins / (wins + losses) };
    };

    const homeStats = parseRecord(matchup.homeRecord);
    const awayStats = parseRecord(matchup.awayRecord);

    return {
      id: `nfl_${matchup.home.replace(/\s+/g, '_')}_${matchup.away.replace(/\s+/g, '_')}_${index}`,
      sport: 'NFL',
      league: 'NFL',
      homeTeam: matchup.home,
      awayTeam: matchup.away,
      startTime: new Date(now.getTime() + (index * 3 + 1) * 24 * 60 * 60 * 1000).toISOString(),
      popularityScore: 95 - index,
      status: 'scheduled' as const,
      hasOdds: false,
      homeStats: {
        wins: homeStats.wins,
        losses: homeStats.losses,
        winPct: homeStats.winPct,
      },
      awayStats: {
        wins: awayStats.wins,
        losses: awayStats.losses,
        winPct: awayStats.winPct,
      },
    };
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
      console.log('[NHL] No SPORTSGAMEODDS_API_KEY configured, using fallback data');
      return generateFallbackNHLGames();
    }

    console.log('[NHL] Fetching from SportsGameOdds API...');
    
    const response = await fetch(
      'https://api.sportsgameodds.com/v2/events?leagueID=NHL&oddsAvailable=true&limit=30',
      { headers: { 'x-api-key': apiKey } }
    );

    if (!response.ok) {
      console.error(`[NHL] API error: ${response.status}`);
      return generateFallbackNHLGames();
    }

    const data = await response.json();
    const events = data?.data || data?.events || [];
    
    console.log(`[NHL] Found ${events.length} events from API`);

    for (const event of events) {
      const homeTeam = event.teams?.home?.names?.long || 
                       event.teams?.home?.names?.medium || 
                       event.homeTeam || 'Home Team';
      const awayTeam = event.teams?.away?.names?.long || 
                       event.teams?.away?.names?.medium || 
                       event.awayTeam || 'Away Team';
      
      if (homeTeam === 'Home Team' && awayTeam === 'Away Team') continue;
      
      const startTime = event.status?.startsAt || event.startTime || new Date().toISOString();
      const isLive = event.status?.live === true;
      const isEnded = event.status?.ended === true;

      // Parse odds
      const odds = event.odds || {};
      let moneylineHome = 0, moneylineAway = 0;
      let totalOver = 0, totalOverOdds = -110;
      let totalUnder = 0, totalUnderOdds = -110;

      for (const [oddId, oddData] of Object.entries(odds)) {
        const odd = oddData as any;
        const fairOdds = typeof odd?.fairOdds === 'number' ? odd.fairOdds : 
                        (typeof odd?.bookOdds === 'number' ? odd.bookOdds : 0);
        
        if (oddId.includes('-ml-home')) moneylineHome = fairOdds;
        if (oddId.includes('-ml-away')) moneylineAway = fairOdds;
        if (oddId.includes('-ou-over')) {
          totalOver = parseFloat(odd?.fairOverUnder || odd?.line || 0);
          totalOverOdds = fairOdds || -110;
        }
        if (oddId.includes('-ou-under')) {
          totalUnder = parseFloat(odd?.fairOverUnder || odd?.line || 0);
          totalUnderOdds = fairOdds || -110;
        }
      }

      const hasValidOdds = moneylineHome !== 0 || moneylineAway !== 0 || totalOver !== 0;

      games.push({
        id: `nhl_${event.eventID || event.id || Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        sport: 'Hockey',
        league: 'NHL',
        homeTeam,
        awayTeam,
        startTime,
        popularityScore: 80,
        status: isEnded ? 'completed' : (isLive ? 'live' : 'scheduled'),
        odds: hasValidOdds ? {
          moneyline: { home: moneylineHome, away: moneylineAway },
          total: { over: totalOver, overOdds: totalOverOdds, under: totalUnder, underOdds: totalUnderOdds },
        } : undefined,
        hasOdds: hasValidOdds,
      });
    }

    console.log(`[NHL] Returning ${games.length} games with odds`);
    return games;
  } catch (error) {
    console.error('[NHL] Error fetching games:', error);
    return generateFallbackNHLGames();
  }
}

function generateFallbackNHLGames(): ScheduledGame[] {
  const now = new Date();
  
  const nhlMatchups = [
    { home: 'Toronto Maple Leafs', away: 'Boston Bruins', homeRecord: '34-18-5', awayRecord: '38-12-6' },
    { home: 'Edmonton Oilers', away: 'Calgary Flames', homeRecord: '35-16-4', awayRecord: '28-23-6' },
    { home: 'New York Rangers', away: 'New Jersey Devils', homeRecord: '37-15-5', awayRecord: '32-20-5' },
    { home: 'Colorado Avalanche', away: 'Vegas Golden Knights', homeRecord: '36-17-4', awayRecord: '35-18-4' },
    { home: 'Carolina Hurricanes', away: 'Tampa Bay Lightning', homeRecord: '38-11-7', awayRecord: '34-19-4' },
    { home: 'Dallas Stars', away: 'Minnesota Wild', homeRecord: '35-15-7', awayRecord: '33-19-5' },
    { home: 'Florida Panthers', away: 'Washington Capitals', homeRecord: '34-18-5', awayRecord: '30-22-5' },
    { home: 'Vancouver Canucks', away: 'Seattle Kraken', homeRecord: '32-20-5', awayRecord: '28-24-5' },
    { home: 'Los Angeles Kings', away: 'Anaheim Ducks', homeRecord: '33-18-6', awayRecord: '18-35-4' },
    { home: 'Detroit Red Wings', away: 'Chicago Blackhawks', homeRecord: '29-24-4', awayRecord: '20-32-5' },
    { home: 'Pittsburgh Penguins', away: 'Philadelphia Flyers', homeRecord: '28-25-4', awayRecord: '25-27-5' },
    { home: 'St. Louis Blues', away: 'Nashville Predators', homeRecord: '26-27-4', awayRecord: '28-24-5' },
  ];

  return nhlMatchups.map((matchup, index) => {
    const parseRecord = (record: string) => {
      const parts = record.split('-').map(Number);
      const wins = parts[0] || 0;
      const losses = parts[1] || 0;
      const otl = parts[2] || 0;
      return { wins, losses, winPct: wins / (wins + losses + otl) };
    };

    const homeStats = parseRecord(matchup.homeRecord);
    const awayStats = parseRecord(matchup.awayRecord);
    
    // Generate odds based on win percentages (higher winPct = favorite)
    const homeRank = Math.round((1 - homeStats.winPct) * 30) + 1;
    const awayRank = Math.round((1 - awayStats.winPct) * 30) + 1;
    const estimatedOdds = generateEstimatedOdds(homeRank, awayRank);

    return {
      id: `nhl_${matchup.home.replace(/\s+/g, '_')}_${matchup.away.replace(/\s+/g, '_')}_${index}`,
      sport: 'Hockey',
      league: 'NHL',
      homeTeam: matchup.home,
      awayTeam: matchup.away,
      startTime: new Date(now.getTime() + (index * 12 + 6) * 60 * 60 * 1000).toISOString(),
      popularityScore: 80 - index,
      status: 'scheduled' as const,
      odds: {
        moneyline: estimatedOdds.moneyline,
        total: { over: 6.5, overOdds: -110, under: 6.5, underOdds: -110 },
      },
      hasOdds: true,
      homeStats: {
        wins: homeStats.wins,
        losses: homeStats.losses,
        winPct: homeStats.winPct,
      },
      awayStats: {
        wins: awayStats.wins,
        losses: awayStats.losses,
        winPct: awayStats.winPct,
      },
    };
  });
}

// ============================================================================
// NBA INTEGRATION via SportsGameOdds API
// ============================================================================

async function fetchNBAGames(): Promise<ScheduledGame[]> {
  const games: ScheduledGame[] = [];
  
  try {
    const apiKey = Deno.env.get('SPORTSGAMEODDS_API_KEY');
    if (!apiKey) {
      console.log('[NBA] No SPORTSGAMEODDS_API_KEY configured');
      return [];
    }

    console.log('[NBA] Fetching from SportsGameOdds API...');
    
    const response = await fetch(
      'https://api.sportsgameodds.com/v2/events?leagueID=NBA&oddsAvailable=true&limit=30',
      { headers: { 'x-api-key': apiKey } }
    );

    if (!response.ok) {
      console.error(`[NBA] API error: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const events = data?.data || data?.events || [];
    
    console.log(`[NBA] Found ${events.length} events from API`);

    for (const event of events) {
      const homeTeam = event.teams?.home?.names?.long || 
                       event.teams?.home?.names?.medium || 
                       event.homeTeam || 'Home Team';
      const awayTeam = event.teams?.away?.names?.long || 
                       event.teams?.away?.names?.medium || 
                       event.awayTeam || 'Away Team';
      
      if (homeTeam === 'Home Team' && awayTeam === 'Away Team') continue;
      
      const startTime = event.status?.startsAt || event.startTime || new Date().toISOString();
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

      const hasValidOdds = moneylineHome !== 0 || moneylineAway !== 0 || spreadHome !== 0;

      games.push({
        id: `nba_${event.eventID || event.id || Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        sport: 'Basketball',
        league: 'NBA',
        homeTeam,
        awayTeam,
        startTime,
        popularityScore: 95,
        status: isEnded ? 'completed' : (isLive ? 'live' : 'scheduled'),
        odds: hasValidOdds ? {
          moneyline: { home: moneylineHome, away: moneylineAway },
          spread: { home: spreadHome, homeOdds: spreadHomeOdds, away: -spreadHome, awayOdds: -110 },
          total: { over: totalOver, overOdds: totalOverOdds, under: totalOver, underOdds: -110 },
        } : undefined,
        hasOdds: hasValidOdds,
      });
    }

    console.log(`[NBA] Returning ${games.length} games with odds`);
    return games;
  } catch (error) {
    console.error('[NBA] Error fetching games:', error);
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
      const homeTeam = event.teams?.home?.names?.long || 
                       event.teams?.home?.names?.medium || 
                       event.homeTeam || 'Home Team';
      const awayTeam = event.teams?.away?.names?.long || 
                       event.teams?.away?.names?.medium || 
                       event.awayTeam || 'Away Team';
      
      if (homeTeam === 'Home Team' && awayTeam === 'Away Team') continue;
      
      const startTime = event.status?.startsAt || event.startTime || new Date().toISOString();
      const isLive = event.status?.live === true;
      const isEnded = event.status?.ended === true;

      // Parse odds
      const odds = event.odds || {};
      let moneylineHome = 0, moneylineAway = 0;
      let totalOver = 0, totalOverOdds = -110;

      for (const [oddId, oddData] of Object.entries(odds)) {
        const odd = oddData as any;
        const fairOdds = typeof odd?.fairOdds === 'number' ? odd.fairOdds : 
                        (typeof odd?.bookOdds === 'number' ? odd.bookOdds : 0);
        
        if (oddId.includes('-ml-home')) moneylineHome = fairOdds;
        if (oddId.includes('-ml-away')) moneylineAway = fairOdds;
        if (oddId.includes('-ou-over')) {
          totalOver = parseFloat(odd?.fairOverUnder || odd?.line || 0);
          totalOverOdds = fairOdds || -110;
        }
      }

      const hasValidOdds = moneylineHome !== 0 || moneylineAway !== 0 || totalOver !== 0;

      games.push({
        id: `mlb_${event.eventID || event.id || Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        sport: 'Baseball',
        league: 'MLB',
        homeTeam,
        awayTeam,
        startTime,
        popularityScore: 85,
        status: isEnded ? 'completed' : (isLive ? 'live' : 'scheduled'),
        odds: hasValidOdds ? {
          moneyline: { home: moneylineHome, away: moneylineAway },
          total: { over: totalOver, overOdds: totalOverOdds, under: totalOver, underOdds: -110 },
        } : undefined,
        hasOdds: hasValidOdds,
      });
    }

    console.log(`[MLB] Returning ${games.length} games with odds`);
    return games;
  } catch (error) {
    console.error('[MLB] Error fetching games:', error);
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
      return generateFallbackTennisMatches();
    }

    console.log('[Tennis] Fetching ATP and WTA from SportsGameOdds API...');
    
    // Fetch both ATP and WTA
    const [atpResponse, wtaResponse] = await Promise.all([
      fetch('https://api.sportsgameodds.com/v2/events?leagueID=ATP&oddsAvailable=true&limit=20', 
        { headers: { 'x-api-key': apiKey } }),
      fetch('https://api.sportsgameodds.com/v2/events?leagueID=WTA&oddsAvailable=true&limit=20', 
        { headers: { 'x-api-key': apiKey } }),
    ]);

    const processResponse = async (response: Response, league: string) => {
      if (!response.ok) {
        console.error(`[Tennis] ${league} API error: ${response.status}`);
        return;
      }

      const data = await response.json();
      const events = data?.data || data?.events || [];
      console.log(`[Tennis] Found ${events.length} ${league} events`);

      for (const event of events) {
        const player1 = event.teams?.home?.names?.long || 
                        event.teams?.home?.names?.medium || 
                        event.homeTeam || '';
        const player2 = event.teams?.away?.names?.long || 
                        event.teams?.away?.names?.medium || 
                        event.awayTeam || '';
        
        if (!player1 || !player2) continue;
        
        const startTime = event.status?.startsAt || event.startTime || new Date().toISOString();
        const isLive = event.status?.live === true;
        const isEnded = event.status?.ended === true;

        // Parse odds
        const odds = event.odds || {};
        let moneylineHome = 0, moneylineAway = 0;

        for (const [oddId, oddData] of Object.entries(odds)) {
          const odd = oddData as any;
          const fairOdds = typeof odd?.fairOdds === 'number' ? odd.fairOdds : 
                          (typeof odd?.bookOdds === 'number' ? odd.bookOdds : 0);
          
          if (oddId.includes('-ml-home')) moneylineHome = fairOdds;
          if (oddId.includes('-ml-away')) moneylineAway = fairOdds;
        }

        const hasValidOdds = moneylineHome !== 0 || moneylineAway !== 0;

        games.push({
          id: `tennis_${event.eventID || event.id || Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          sport: 'Tennis',
          league,
          homeTeam: player1,
          awayTeam: player2,
          startTime,
          popularityScore: league === 'ATP' ? 70 : 65,
          status: isEnded ? 'completed' : (isLive ? 'live' : 'scheduled'),
          odds: hasValidOdds ? {
            moneyline: { home: moneylineHome, away: moneylineAway },
          } : undefined,
          hasOdds: hasValidOdds,
        });
      }
    };

    await Promise.all([
      processResponse(atpResponse, 'ATP'),
      processResponse(wtaResponse, 'WTA'),
    ]);

    console.log(`[Tennis] Returning ${games.length} total tennis matches`);
    return games.length > 0 ? games : generateFallbackTennisMatches();
  } catch (error) {
    console.error('[Tennis] Error fetching games:', error);
    return generateFallbackTennisMatches();
  }
}

function generateFallbackTennisMatches(): ScheduledGame[] {
  const now = new Date();
  
  const matches = [
    { player1: 'Jannik Sinner', player2: 'Carlos Alcaraz', league: 'ATP', ranking1: 1, ranking2: 2 },
    { player1: 'Novak Djokovic', player2: 'Daniil Medvedev', league: 'ATP', ranking1: 3, ranking2: 4 },
    { player1: 'Alexander Zverev', player2: 'Andrey Rublev', league: 'ATP', ranking1: 5, ranking2: 6 },
    { player1: 'Holger Rune', player2: 'Hubert Hurkacz', league: 'ATP', ranking1: 7, ranking2: 8 },
    { player1: 'Stefanos Tsitsipas', player2: 'Casper Ruud', league: 'ATP', ranking1: 9, ranking2: 10 },
    { player1: 'Taylor Fritz', player2: 'Tommy Paul', league: 'ATP', ranking1: 11, ranking2: 12 },
    { player1: 'Iga Swiatek', player2: 'Aryna Sabalenka', league: 'WTA', ranking1: 1, ranking2: 2 },
    { player1: 'Coco Gauff', player2: 'Elena Rybakina', league: 'WTA', ranking1: 3, ranking2: 4 },
    { player1: 'Jessica Pegula', player2: 'Ons Jabeur', league: 'WTA', ranking1: 5, ranking2: 6 },
    { player1: 'Maria Sakkari', player2: 'Qinwen Zheng', league: 'WTA', ranking1: 7, ranking2: 8 },
  ];

  return matches.map((match, index) => {
    const estimatedOdds = generateEstimatedOdds(match.ranking1, match.ranking2);
    return {
      id: `tennis_${match.player1.replace(/\s+/g, '_')}_${match.player2.replace(/\s+/g, '_')}_${index}`,
      sport: 'Tennis',
      league: match.league,
      homeTeam: match.player1,
      awayTeam: match.player2,
      startTime: new Date(now.getTime() + (index * 8 + 4) * 60 * 60 * 1000).toISOString(),
      popularityScore: match.league === 'ATP' ? 70 - index : 65 - index,
      status: 'scheduled' as const,
      odds: { moneyline: estimatedOdds.moneyline },
      hasOdds: true,
      homeStats: { wins: 0, losses: 0, winPct: 0, worldRanking: match.ranking1 },
      awayStats: { wins: 0, losses: 0, winPct: 0, worldRanking: match.ranking2 },
    };
  });
}

// ============================================================================
// COLLEGE BASKETBALL (NCAAB) INTEGRATION via SportsGameOdds API
// ============================================================================

async function fetchNCAABGames(): Promise<ScheduledGame[]> {
  const games: ScheduledGame[] = [];
  
  try {
    const apiKey = Deno.env.get('SPORTSGAMEODDS_API_KEY');
    if (!apiKey) {
      console.log('[NCAAB] No SPORTSGAMEODDS_API_KEY configured');
      return generateFallbackNCAABGames();
    }

    console.log('[NCAAB] Fetching from SportsGameOdds API...');
    
    const response = await fetch(
      'https://api.sportsgameodds.com/v2/events?leagueID=NCAAB&oddsAvailable=true&limit=30',
      { headers: { 'x-api-key': apiKey } }
    );

    if (!response.ok) {
      console.error(`[NCAAB] API error: ${response.status}`);
      return generateFallbackNCAABGames();
    }

    const data = await response.json();
    const events = data?.data || data?.events || [];
    
    console.log(`[NCAAB] Found ${events.length} events from API`);

    for (const event of events) {
      const homeTeam = event.teams?.home?.names?.long || 
                       event.teams?.home?.names?.medium || 
                       event.homeTeam || 'Home Team';
      const awayTeam = event.teams?.away?.names?.long || 
                       event.teams?.away?.names?.medium || 
                       event.awayTeam || 'Away Team';
      
      if (homeTeam === 'Home Team' && awayTeam === 'Away Team') continue;
      
      const startTime = event.status?.startsAt || event.startTime || new Date().toISOString();
      const isLive = event.status?.live === true;
      const isEnded = event.status?.ended === true;

      const odds = event.odds || {};
      let moneylineHome = 0, moneylineAway = 0;
      let spreadHome = 0, spreadHomeOdds = -110;

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
      }

      const hasValidOdds = moneylineHome !== 0 || moneylineAway !== 0 || spreadHome !== 0;

      games.push({
        id: `ncaab_${event.eventID || event.id || Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        sport: 'Basketball',
        league: 'NCAAB',
        homeTeam,
        awayTeam,
        startTime,
        popularityScore: 80,
        status: isEnded ? 'completed' : (isLive ? 'live' : 'scheduled'),
        odds: hasValidOdds ? {
          moneyline: { home: moneylineHome, away: moneylineAway },
          spread: { home: spreadHome, homeOdds: spreadHomeOdds, away: -spreadHome, awayOdds: -110 },
        } : undefined,
        hasOdds: hasValidOdds,
      });
    }

    console.log(`[NCAAB] Returning ${games.length} games`);
    return games.length > 0 ? games : generateFallbackNCAABGames();
  } catch (error) {
    console.error('[NCAAB] Error fetching games:', error);
    return generateFallbackNCAABGames();
  }
}

function generateFallbackNCAABGames(): ScheduledGame[] {
  const now = new Date();
  
  const matchups = [
    { home: 'Duke Blue Devils', away: 'North Carolina Tar Heels', homeRank: 5, awayRank: 8 },
    { home: 'Kansas Jayhawks', away: 'Kentucky Wildcats', homeRank: 3, awayRank: 12 },
    { home: 'Gonzaga Bulldogs', away: 'UCLA Bruins', homeRank: 6, awayRank: 10 },
    { home: 'UConn Huskies', away: 'Villanova Wildcats', homeRank: 1, awayRank: 15 },
    { home: 'Purdue Boilermakers', away: 'Michigan State Spartans', homeRank: 2, awayRank: 18 },
    { home: 'Arizona Wildcats', away: 'Creighton Bluejays', homeRank: 7, awayRank: 14 },
    { home: 'Houston Cougars', away: 'Baylor Bears', homeRank: 4, awayRank: 11 },
    { home: 'Tennessee Volunteers', away: 'Auburn Tigers', homeRank: 9, awayRank: 13 },
  ];

  return matchups.map((matchup, index) => {
    const estimatedOdds = generateEstimatedOdds(matchup.homeRank, matchup.awayRank);
    return {
      id: `ncaab_${matchup.home.replace(/\s+/g, '_')}_${matchup.away.replace(/\s+/g, '_')}_${index}`,
      sport: 'Basketball',
      league: 'NCAAB',
      homeTeam: matchup.home,
      awayTeam: matchup.away,
      startTime: new Date(now.getTime() + (index * 6 + 3) * 60 * 60 * 1000).toISOString(),
      popularityScore: 80 - index,
      status: 'scheduled' as const,
      odds: estimatedOdds,
      hasOdds: true,
    };
  });
}

// ============================================================================
// COLLEGE FOOTBALL (NCAAF) INTEGRATION via SportsGameOdds API
// ============================================================================

async function fetchNCAAFGames(): Promise<ScheduledGame[]> {
  const games: ScheduledGame[] = [];
  
  try {
    const apiKey = Deno.env.get('SPORTSGAMEODDS_API_KEY');
    if (!apiKey) {
      console.log('[NCAAF] No SPORTSGAMEODDS_API_KEY configured');
      return generateFallbackNCAAFGames();
    }

    console.log('[NCAAF] Fetching from SportsGameOdds API...');
    
    const response = await fetch(
      'https://api.sportsgameodds.com/v2/events?leagueID=NCAAF&oddsAvailable=true&limit=30',
      { headers: { 'x-api-key': apiKey } }
    );

    if (!response.ok) {
      console.error(`[NCAAF] API error: ${response.status}`);
      return generateFallbackNCAAFGames();
    }

    const data = await response.json();
    const events = data?.data || data?.events || [];
    
    console.log(`[NCAAF] Found ${events.length} events from API`);

    for (const event of events) {
      const homeTeam = event.teams?.home?.names?.long || 
                       event.teams?.home?.names?.medium || 
                       event.homeTeam || 'Home Team';
      const awayTeam = event.teams?.away?.names?.long || 
                       event.teams?.away?.names?.medium || 
                       event.awayTeam || 'Away Team';
      
      if (homeTeam === 'Home Team' && awayTeam === 'Away Team') continue;
      
      const startTime = event.status?.startsAt || event.startTime || new Date().toISOString();
      const isLive = event.status?.live === true;
      const isEnded = event.status?.ended === true;

      const odds = event.odds || {};
      let moneylineHome = 0, moneylineAway = 0;
      let spreadHome = 0, spreadHomeOdds = -110;
      let totalOver = 0;

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
        }
      }

      const hasValidOdds = moneylineHome !== 0 || moneylineAway !== 0 || spreadHome !== 0;

      games.push({
        id: `ncaaf_${event.eventID || event.id || Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        sport: 'Football',
        league: 'NCAAF',
        homeTeam,
        awayTeam,
        startTime,
        popularityScore: 85,
        status: isEnded ? 'completed' : (isLive ? 'live' : 'scheduled'),
        odds: hasValidOdds ? {
          moneyline: { home: moneylineHome, away: moneylineAway },
          spread: { home: spreadHome, homeOdds: spreadHomeOdds, away: -spreadHome, awayOdds: -110 },
          total: { over: totalOver, overOdds: -110, under: totalOver, underOdds: -110 },
        } : undefined,
        hasOdds: hasValidOdds,
      });
    }

    console.log(`[NCAAF] Returning ${games.length} games`);
    return games.length > 0 ? games : generateFallbackNCAAFGames();
  } catch (error) {
    console.error('[NCAAF] Error fetching games:', error);
    return generateFallbackNCAAFGames();
  }
}

function generateFallbackNCAAFGames(): ScheduledGame[] {
  const now = new Date();
  
  const matchups = [
    { home: 'Ohio State Buckeyes', away: 'Michigan Wolverines', homeRank: 2, awayRank: 1 },
    { home: 'Alabama Crimson Tide', away: 'Georgia Bulldogs', homeRank: 4, awayRank: 3 },
    { home: 'Texas Longhorns', away: 'Oklahoma Sooners', homeRank: 5, awayRank: 12 },
    { home: 'USC Trojans', away: 'Notre Dame Fighting Irish', homeRank: 15, awayRank: 8 },
    { home: 'Florida State Seminoles', away: 'Clemson Tigers', homeRank: 10, awayRank: 14 },
    { home: 'Oregon Ducks', away: 'Washington Huskies', homeRank: 6, awayRank: 11 },
    { home: 'Penn State Nittany Lions', away: 'Michigan State Spartans', homeRank: 7, awayRank: 20 },
    { home: 'LSU Tigers', away: 'Texas A&M Aggies', homeRank: 9, awayRank: 16 },
  ];

  return matchups.map((matchup, index) => {
    const estimatedOdds = generateEstimatedOdds(matchup.homeRank, matchup.awayRank);
    return {
      id: `ncaaf_${matchup.home.replace(/\s+/g, '_')}_${matchup.away.replace(/\s+/g, '_')}_${index}`,
      sport: 'Football',
      league: 'NCAAF',
      homeTeam: matchup.home,
      awayTeam: matchup.away,
      startTime: new Date(now.getTime() + (index * 24 + 12) * 60 * 60 * 1000).toISOString(),
      popularityScore: 85 - index,
      status: 'scheduled' as const,
      odds: estimatedOdds,
      hasOdds: true,
    };
  });
}

// ============================================================================
// GOLF (PGA/LIV) INTEGRATION
// ============================================================================

interface GolfTournament {
  name: string;
  course: string;
  tour: 'PGA' | 'LIV';
  players: { name: string; worldRanking?: number; wins?: number }[];
}

function generateGolfTournaments(): GolfTournament[] {
  return [
    {
      name: 'The Masters',
      course: 'Augusta National Golf Club',
      tour: 'PGA',
      players: [
        { name: 'Scottie Scheffler', worldRanking: 1, wins: 12 },
        { name: 'Rory McIlroy', worldRanking: 2, wins: 25 },
        { name: 'Jon Rahm', worldRanking: 3, wins: 14 },
        { name: 'Xander Schauffele', worldRanking: 4, wins: 9 },
        { name: 'Collin Morikawa', worldRanking: 5, wins: 7 },
        { name: 'Viktor Hovland', worldRanking: 6, wins: 8 },
        { name: 'Patrick Cantlay', worldRanking: 7, wins: 9 },
        { name: 'Ludvig Åberg', worldRanking: 8, wins: 3 },
      ],
    },
    {
      name: 'PGA Championship',
      course: 'Valhalla Golf Club',
      tour: 'PGA',
      players: [
        { name: 'Brooks Koepka', worldRanking: 15, wins: 10 },
        { name: 'Justin Thomas', worldRanking: 12, wins: 15 },
        { name: 'Jordan Spieth', worldRanking: 18, wins: 13 },
        { name: 'Tony Finau', worldRanking: 14, wins: 7 },
        { name: 'Wyndham Clark', worldRanking: 9, wins: 3 },
        { name: 'Max Homa', worldRanking: 11, wins: 6 },
      ],
    },
    {
      name: 'The Open Championship',
      course: 'Royal Troon',
      tour: 'PGA',
      players: [
        { name: 'Tommy Fleetwood', worldRanking: 16, wins: 6 },
        { name: 'Shane Lowry', worldRanking: 20, wins: 6 },
        { name: 'Cameron Smith', worldRanking: 22, wins: 8 },
        { name: 'Matt Fitzpatrick', worldRanking: 13, wins: 8 },
        { name: 'Tyrrell Hatton', worldRanking: 17, wins: 7 },
      ],
    },
    {
      name: 'LIV Golf Las Vegas',
      course: 'Las Vegas Country Club',
      tour: 'LIV',
      players: [
        { name: 'Bryson DeChambeau', worldRanking: 25, wins: 10 },
        { name: 'Dustin Johnson', worldRanking: 35, wins: 24 },
        { name: 'Phil Mickelson', worldRanking: 150, wins: 45 },
        { name: 'Sergio Garcia', worldRanking: 55, wins: 36 },
        { name: 'Patrick Reed', worldRanking: 75, wins: 9 },
        { name: 'Joaquín Niemann', worldRanking: 28, wins: 4 },
      ],
    },
    {
      name: 'LIV Golf Miami',
      course: 'Trump National Doral',
      tour: 'LIV',
      players: [
        { name: 'Talor Gooch', worldRanking: 45, wins: 5 },
        { name: 'Cameron Tringale', worldRanking: 90, wins: 1 },
        { name: 'Lee Westwood', worldRanking: 120, wins: 25 },
        { name: 'Ian Poulter', worldRanking: 200, wins: 13 },
        { name: 'Bubba Watson', worldRanking: 180, wins: 14 },
      ],
    },
  ];
}

function convertGolfToGames(tournaments: GolfTournament[]): ScheduledGame[] {
  const games: ScheduledGame[] = [];
  const now = new Date();
  let dayOffset = 0;

  for (const tournament of tournaments) {
    // Create matchups between top players
    const players = tournament.players;
    for (let i = 0; i < players.length - 1; i += 2) {
      const player1 = players[i];
      const player2 = players[i + 1];
      const estimatedOdds = generateEstimatedOdds(player1.worldRanking, player2.worldRanking);
      
      games.push({
        id: `golf_${tournament.tour}_${player1.name.replace(/\s+/g, '_')}_${player2.name.replace(/\s+/g, '_')}_${dayOffset}`,
        sport: 'Golf',
        league: tournament.tour,
        homeTeam: player1.name,
        awayTeam: player2.name,
        startTime: new Date(now.getTime() + (dayOffset * 24 + 8) * 60 * 60 * 1000).toISOString(),
        popularityScore: tournament.tour === 'PGA' ? 75 : 70,
        status: 'scheduled',
        odds: { moneyline: estimatedOdds.moneyline },
        hasOdds: true,
        homeStats: {
          wins: player1.wins || 0,
          losses: 0,
          winPct: 0,
          worldRanking: player1.worldRanking,
        },
        awayStats: {
          wins: player2.wins || 0,
          losses: 0,
          winPct: 0,
          worldRanking: player2.worldRanking,
        },
      });
      dayOffset++;
    }
  }

  return games;
}

async function fetchGolfGames(): Promise<ScheduledGame[]> {
  try {
    console.log('[Golf] Generating PGA/LIV tournaments...');
    const tournaments = generateGolfTournaments();
    const games = convertGolfToGames(tournaments);
    console.log(`[Golf] Generated ${games.length} golf matchups`);
    return games;
  } catch (error) {
    console.error('[Golf] Error:', error);
    return [];
  }
}

// ============================================================================
// ESPORTS (CS2, LoL, Valorant) INTEGRATION
// ============================================================================

interface EsportsMatch {
  team1: string;
  team2: string;
  game: 'CS2' | 'LoL' | 'Valorant';
  event: string;
  round: string;
  team1Ranking?: number;
  team2Ranking?: number;
}

function generateEsportsMatches(): EsportsMatch[] {
  return [
    // CS2 Matches
    { team1: 'Natus Vincere', team2: 'FaZe Clan', game: 'CS2', event: 'IEM Katowice 2025', round: 'Final', team1Ranking: 1, team2Ranking: 3 },
    { team1: 'G2 Esports', team2: 'Team Vitality', game: 'CS2', event: 'IEM Katowice 2025', round: 'Semi-Final', team1Ranking: 2, team2Ranking: 4 },
    { team1: 'Team Spirit', team2: 'MOUZ', game: 'CS2', event: 'IEM Katowice 2025', round: 'Semi-Final', team1Ranking: 5, team2Ranking: 6 },
    { team1: 'Heroic', team2: 'Cloud9', game: 'CS2', event: 'BLAST Premier Spring', round: 'Quarter-Final', team1Ranking: 7, team2Ranking: 9 },
    { team1: 'Astralis', team2: 'Complexity', game: 'CS2', event: 'BLAST Premier Spring', round: 'Quarter-Final', team1Ranking: 8, team2Ranking: 12 },
    { team1: 'ENCE', team2: 'BIG', game: 'CS2', event: 'ESL Pro League S21', round: 'Group Stage', team1Ranking: 10, team2Ranking: 11 },
    
    // League of Legends Matches
    { team1: 'T1', team2: 'Gen.G', game: 'LoL', event: 'LCK Spring 2025', round: 'Final', team1Ranking: 1, team2Ranking: 2 },
    { team1: 'Hanwha Life Esports', team2: 'DRX', game: 'LoL', event: 'LCK Spring 2025', round: 'Semi-Final', team1Ranking: 3, team2Ranking: 5 },
    { team1: 'G2 Esports', team2: 'Fnatic', game: 'LoL', event: 'LEC Winter 2025', round: 'Final', team1Ranking: 1, team2Ranking: 2 },
    { team1: 'Team BDS', team2: 'MAD Lions', game: 'LoL', event: 'LEC Winter 2025', round: 'Semi-Final', team1Ranking: 3, team2Ranking: 4 },
    { team1: 'Team Liquid', team2: 'Cloud9', game: 'LoL', event: 'LCS Spring 2025', round: 'Final', team1Ranking: 1, team2Ranking: 2 },
    { team1: 'FlyQuest', team2: '100 Thieves', game: 'LoL', event: 'LCS Spring 2025', round: 'Semi-Final', team1Ranking: 3, team2Ranking: 4 },
    { team1: 'JD Gaming', team2: 'Bilibili Gaming', game: 'LoL', event: 'LPL Spring 2025', round: 'Final', team1Ranking: 1, team2Ranking: 2 },
    { team1: 'Weibo Gaming', team2: 'Top Esports', game: 'LoL', event: 'LPL Spring 2025', round: 'Semi-Final', team1Ranking: 3, team2Ranking: 4 },
    
    // Valorant Matches
    { team1: 'Sentinels', team2: 'LOUD', game: 'Valorant', event: 'VCT Americas 2025', round: 'Final', team1Ranking: 1, team2Ranking: 2 },
    { team1: 'Cloud9', team2: 'NRG', game: 'Valorant', event: 'VCT Americas 2025', round: 'Semi-Final', team1Ranking: 3, team2Ranking: 4 },
    { team1: 'Fnatic', team2: 'Team Heretics', game: 'Valorant', event: 'VCT EMEA 2025', round: 'Final', team1Ranking: 1, team2Ranking: 2 },
    { team1: 'Karmine Corp', team2: 'Team Vitality', game: 'Valorant', event: 'VCT EMEA 2025', round: 'Semi-Final', team1Ranking: 3, team2Ranking: 4 },
    { team1: 'Paper Rex', team2: 'DRX', game: 'Valorant', event: 'VCT Pacific 2025', round: 'Final', team1Ranking: 1, team2Ranking: 2 },
    { team1: 'Gen.G', team2: 'T1', game: 'Valorant', event: 'VCT Pacific 2025', round: 'Semi-Final', team1Ranking: 3, team2Ranking: 4 },
    { team1: 'EDward Gaming', team2: 'FunPlus Phoenix', game: 'Valorant', event: 'VCT China 2025', round: 'Final', team1Ranking: 1, team2Ranking: 2 },
  ];
}

function convertEsportsToGames(matches: EsportsMatch[]): ScheduledGame[] {
  const now = new Date();
  
  return matches.map((match, index) => {
    const estimatedOdds = generateEstimatedOdds(match.team1Ranking, match.team2Ranking);
    return {
      id: `esports_${match.game}_${match.team1.replace(/\s+/g, '_')}_${match.team2.replace(/\s+/g, '_')}_${index}`,
      sport: 'Esports',
      league: match.game,
      homeTeam: match.team1,
      awayTeam: match.team2,
      startTime: new Date(now.getTime() + (index * 6 + 2) * 60 * 60 * 1000).toISOString(),
      popularityScore: match.round === 'Final' ? 78 : match.round === 'Semi-Final' ? 72 : 65,
      status: 'scheduled' as const,
      odds: { moneyline: estimatedOdds.moneyline },
      hasOdds: true,
      homeStats: {
        wins: 0,
        losses: 0,
        winPct: 0,
        worldRanking: match.team1Ranking,
      },
      awayStats: {
        wins: 0,
        losses: 0,
        winPct: 0,
        worldRanking: match.team2Ranking,
      },
    };
  });
}

async function fetchEsportsGames(): Promise<ScheduledGame[]> {
  try {
    console.log('[Esports] Generating CS2, LoL, Valorant matches...');
    const matches = generateEsportsMatches();
    const games = convertEsportsToGames(matches);
    console.log(`[Esports] Generated ${games.length} esports matches`);
    return games;
  } catch (error) {
    console.error('[Esports] Error:', error);
    return [];
  }
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
    
    console.log('[Sportsbook API] Starting fresh fetch...');
    
    // Fetch from all sources in parallel - comprehensive sports coverage
    const [sportsbookGames, ufcGames, tableTennisGames, nflGames, soccerGames, nhlGames, nbaGames, mlbGames, tennisGames, ncaabGames, ncaafGames, golfGames, esportsGames] = await Promise.all([
      apiKey ? fetchSportsbookGames(apiKey) : Promise.resolve([]),
      fetchUFCGames(),
      fetchTableTennisGames(),
      fetchNFLGames(),
      fetchSoccerGames(),
      fetchNHLGames(),
      fetchNBAGames(),
      fetchMLBGames(),
      fetchTennisGames(),
      fetchNCAABGames(),
      fetchNCAAFGames(),
      fetchGolfGames(),
      fetchEsportsGames(),
    ]);
    
    const allGames = [...sportsbookGames, ...ufcGames, ...tableTennisGames, ...nflGames, ...soccerGames, ...nhlGames, ...nbaGames, ...mlbGames, ...tennisGames, ...ncaabGames, ...ncaafGames, ...golfGames, ...esportsGames];
    
    console.log(`[Sportsbook API] Total: ${allGames.length} games (NHL: ${nhlGames.length}, NBA: ${nbaGames.length}, MLB: ${mlbGames.length}, NFL: ${nflGames.length}, Tennis: ${tennisGames.length}, NCAAB: ${ncaabGames.length}, NCAAF: ${ncaafGames.length}, UFC: ${ufcGames.length}, Soccer: ${soccerGames.length}, Table Tennis: ${tableTennisGames.length}, Golf: ${golfGames.length}, Esports: ${esportsGames.length})`);

    if (allGames.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          games: [],
          error: 'No games found. Check edge function logs for API responses.',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const rankedGames = deduplicateAndRank(allGames);
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
