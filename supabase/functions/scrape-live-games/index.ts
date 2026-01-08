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
    
    console.log('[Sportsbook API] Starting fresh fetch...');
    
    // Fetch from sportsbook API, UFC, and Table Tennis in parallel
    const [sportsbookGames, ufcGames, tableTennisGames] = await Promise.all([
      apiKey ? fetchSportsbookGames(apiKey) : Promise.resolve([]),
      fetchUFCGames(),
      fetchTableTennisGames(),
    ]);
    
    const allGames = [...sportsbookGames, ...ufcGames, ...tableTennisGames];
    
    console.log(`[Sportsbook API] Total games: ${allGames.length} (Sportsbook: ${sportsbookGames.length}, UFC: ${ufcGames.length}, Table Tennis: ${tableTennisGames.length})`);

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
