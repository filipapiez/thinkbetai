import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// DB-BACKED CACHE (survives cold starts)
// ============================================================================
function getSupabaseAdmin() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
}

async function getDbCache(key: string): Promise<unknown | null> {
  try {
    const sb = getSupabaseAdmin();
    const { data } = await sb
      .from('odds_cache')
      .select('data, expires_at')
      .eq('id', key)
      .single();
    if (data && new Date(data.expires_at) > new Date()) {
      return data.data;
    }
  } catch { /* miss */ }
  return null;
}

async function setDbCache(key: string, value: unknown, ttlMs: number): Promise<void> {
  try {
    const sb = getSupabaseAdmin();
    await sb.from('odds_cache').upsert({
      id: key,
      data: value,
      expires_at: new Date(Date.now() + ttlMs).toISOString(),
      updated_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error('[odds_cache] write error', e);
  }
}

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
const CACHE_TTL_MS = 60 * 60 * 1000; // 60 minutes (was 5 min)
const DB_CACHE_KEY = 'scrape-live-games:all';

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
  
  // Check soccer FIRST - catches all European "football" leagues before American football
  if (lower.includes('soccer') || 
      lower.includes('premier') || 
      lower.includes('la liga') || 
      lower.includes('bundesliga') || 
      lower.includes('serie a') || 
      lower.includes('serie b') ||
      lower.includes('ligue 1') || 
      lower.includes('ligue one') ||
      lower.includes('mls') || 
      lower.includes('champions league') ||
      lower.includes('europa') ||
      lower.includes('conference league') ||
      lower.includes('fa cup') ||
      lower.includes('efl') ||
      lower.includes('championship') ||
      lower.includes('eredivisie') ||
      lower.includes('liga mx') ||
      lower.includes('libertadores') ||
      lower.includes('brasileir') ||
      lower.includes('argentina') ||
      lower.includes('a-league') ||
      lower.includes('j-league') ||
      lower.includes('k-league') ||
      lower.includes('super league') ||
      lower.includes('primeira') ||
      lower.includes('turkish') ||
      lower.includes('greek') ||
      lower.includes('scottish') ||
      lower.includes('belgian')) {
    return 'Soccer';
  }
  
  // American Football - NFL, College Football, XFL, UFL
  if (lower.includes('nfl') || lower.includes('ncaaf') || lower.includes('american football') || 
      lower.includes('college football') || lower.includes('xfl') || lower.includes('ufl') ||
      lower.includes('super bowl')) {
    return 'Football';
  }
  
  // Basketball
  if (lower.includes('basketball') || lower.includes('nba') || lower.includes('ncaab') || 
      lower.includes('wnba') || lower.includes('euroleague') || lower.includes('nbl') ||
      lower.includes('nba finals')) return 'Basketball';
  
  // Baseball
  if (lower.includes('baseball') || lower.includes('mlb') || lower.includes('world series') ||
      lower.includes('npb') || lower.includes('kbo')) return 'Baseball';
  
  // Hockey - NHL and European leagues
  if (lower.includes('hockey') || lower.includes('nhl') || lower.includes('ice') || 
      lower.includes('stanley cup') || lower.includes('shl') || lower.includes('liiga') ||
      lower.includes('allsvenskan') || lower.includes('switzerland nl')) return 'Hockey';
  
  // MMA/UFC
  if (lower.includes('mma') || lower.includes('ufc') || lower.includes('martial') ||
      lower.includes('mixed martial')) return 'MMA';
  
  // Boxing
  if (lower.includes('boxing')) return 'Boxing';
  
  // Tennis - Grand Slams and tours
  if (lower.includes('tennis') || lower.includes('atp') || lower.includes('wta') ||
      lower.includes('french open') || lower.includes('australian open') ||
      lower.includes('us open') || lower.includes('wimbledon')) return 'Tennis';
  
  // Golf
  if (lower.includes('golf') || lower.includes('pga') || lower.includes('liv') ||
      lower.includes('masters') || lower.includes('the open')) return 'Golf';
  
  // Cricket
  if (lower.includes('cricket') || lower.includes('ipl') || lower.includes('big bash') ||
      lower.includes('test') || lower.includes('odi') || lower.includes('t20') ||
      lower.includes('psl')) return 'Cricket';
  
  // Rugby
  if (lower.includes('rugby') || lower.includes('six nations') || lower.includes('nrl') ||
      lower.includes('super rugby')) return 'Rugby';
  
  // AFL
  if (lower.includes('afl') || lower.includes('aussie rules') || 
      lower.includes('australian rules')) return 'AFL';
  
  // Darts
  if (lower.includes('darts') || lower.includes('pdc')) return 'Darts';
  
  // Snooker
  if (lower.includes('snooker')) return 'Snooker';
  
  // Table Tennis
  if (lower.includes('table tennis') || lower.includes('tabletennis') || 
      lower.includes('ping pong') || lower.includes('ittf') || lower.includes('wtt')) return 'Table Tennis';
  
  // Esports
  if (lower.includes('cs2') || lower.includes('counter-strike') || lower.includes('csgo') ||
      lower.includes('lol') || lower.includes('league of legends') ||
      lower.includes('valorant') || lower.includes('dota') ||
      lower.includes('esport')) return 'Esports';
  
  // Handball
  if (lower.includes('handball')) return 'Handball';
  
  // Volleyball
  if (lower.includes('volleyball') || lower.includes('superlega')) return 'Volleyball';
  
  // Politics (for betting markets)
  if (lower.includes('politic') || lower.includes('election')) return 'Politics';
  
  // Motorsports - F1, NASCAR, IndyCar
  if (lower.includes('formula 1') || lower.includes('f1') || lower.includes('formula one')) return 'F1';
  if (lower.includes('nascar') || lower.includes('cup series')) return 'NASCAR';
  if (lower.includes('indycar')) return 'IndyCar';
  
  // Lacrosse
  if (lower.includes('lacrosse') || lower.includes('pll') || lower.includes('nll')) return 'Lacrosse';
  
  // Generic "football" without specific context - assume Soccer (international standard)
  if (lower.includes('football')) return 'Soccer';
  
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

// ============================================================================
// MATCH IDENTIFICATION AND DEDUPLICATION
// Follows strict rules: match_id = (homeTeam + awayTeam + kickoff_utc + competition_id)
// ============================================================================

/**
 * Normalize team name for consistent matching
 */
function normalizeTeamName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/^(the|los|la|las|el)\s+/i, '')
    .trim();
}

/**
 * Generate a stable match_id from match components
 * This is the ONLY way to uniquely identify a match
 */
function generateMatchId(
  homeTeam: string,
  awayTeam: string,
  kickoffUtc: string,
  competitionId: string
): string {
  const normalizedHome = normalizeTeamName(homeTeam);
  const normalizedAway = normalizeTeamName(awayTeam);
  
  // Extract date and hour for grouping (handles timezone edge cases)
  let dateKey: string;
  try {
    const date = new Date(kickoffUtc);
    // Use YYYY-MM-DD-HH format for more precise matching
    dateKey = `${date.toISOString().split('T')[0]}-${date.getUTCHours().toString().padStart(2, '0')}`;
  } catch {
    dateKey = 'unknown';
  }
  
  // Create deterministic components - order matters, so sort teams alphabetically
  const sortedTeams = [normalizedHome, normalizedAway].sort();
  const components = [
    sortedTeams[0],
    sortedTeams[1],
    dateKey,
    competitionId.toLowerCase().replace(/[^a-z0-9]/g, ''),
  ].join('|');
  
  // Simple hash for shorter ID
  let hash = 0;
  for (let i = 0; i < components.length; i++) {
    const char = components.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return `match_${Math.abs(hash).toString(36)}_${dateKey.replace(/-/g, '')}`;
}

/**
 * Validate a match record - rejects invalid data
 */
function isValidMatch(game: ScheduledGame): boolean {
  // Reject if home == away
  if (normalizeTeamName(game.homeTeam) === normalizeTeamName(game.awayTeam)) {
    console.log(`[Validation] Rejected: home == away for ${game.homeTeam}`);
    return false;
  }
  
  // Reject if missing or empty team names
  if (!game.homeTeam?.trim() || !game.awayTeam?.trim()) {
    console.log(`[Validation] Rejected: empty team name`);
    return false;
  }
  
  // Reject if start time is invalid
  try {
    const date = new Date(game.startTime);
    if (isNaN(date.getTime())) {
      console.log(`[Validation] Rejected: invalid date for ${game.homeTeam} vs ${game.awayTeam}`);
      return false;
    }
  } catch {
    return false;
  }
  
  return true;
}

/**
 * Check if two games are duplicates based on proper match_id logic
 */
function isSameMatch(game1: ScheduledGame, game2: ScheduledGame): boolean {
  const home1 = normalizeTeamName(game1.homeTeam);
  const away1 = normalizeTeamName(game1.awayTeam);
  const home2 = normalizeTeamName(game2.homeTeam);
  const away2 = normalizeTeamName(game2.awayTeam);
  
  // Teams must match (either order for home/away swap detection from different sources)
  const teamsMatch = 
    (home1 === home2 && away1 === away2) ||
    (home1 === away2 && away1 === home2);
  
  if (!teamsMatch) return false;
  
  // Same league/competition
  const league1 = game1.league.toLowerCase().replace(/[^a-z0-9]/g, '');
  const league2 = game2.league.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (league1 !== league2) return false;
  
  // Same day and within 6 hours (handles timezone discrepancies between sources)
  try {
    const time1 = new Date(game1.startTime).getTime();
    const time2 = new Date(game2.startTime).getTime();
    const hoursDiff = Math.abs(time1 - time2) / (1000 * 60 * 60);
    return hoursDiff <= 6;
  } catch {
    return false;
  }
}

/**
 * Deduplicate games using proper match_id based logic
 * 
 * STRICT RULES:
 * 1. Generate match_id for each game
 * 2. Group by match_id
 * 3. Merge duplicates keeping best data from each source
 * 4. Reject conflicting picks for same match
 */
function deduplicateAndRank(games: ScheduledGame[]): ScheduledGame[] {
  // Step 1: Validate all games
  const validGames = games.filter(isValidMatch);
  console.log(`[Dedup] Validated ${validGames.length}/${games.length} games`);
  
  // Step 2: Generate match_id for each game and group
  const matchMap = new Map<string, ScheduledGame[]>();
  
  for (const game of validGames) {
    const matchId = generateMatchId(game.homeTeam, game.awayTeam, game.startTime, game.league);
    
    if (!matchMap.has(matchId)) {
      matchMap.set(matchId, []);
    }
    matchMap.get(matchId)!.push({ ...game, id: matchId });
  }
  
  // Step 3: Also check for similar matches that might have different IDs due to slight time differences
  const result: ScheduledGame[] = [];
  const processedIds = new Set<string>();
  
  for (const [matchId, matchGames] of matchMap.entries()) {
    if (processedIds.has(matchId)) continue;
    
    // Merge all games with same matchId
    let merged = matchGames[0];
    
    for (let i = 1; i < matchGames.length; i++) {
      merged = mergeGames(merged, matchGames[i]);
    }
    
    // Check if this match is similar to any already processed
    let foundDuplicate = false;
    for (const existing of result) {
      if (isSameMatch(merged, existing)) {
        // Merge into existing
        const idx = result.indexOf(existing);
        result[idx] = mergeGames(existing, merged);
        foundDuplicate = true;
        break;
      }
    }
    
    if (!foundDuplicate) {
      result.push(merged);
    }
    
    processedIds.add(matchId);
  }
  
  console.log(`[Dedup] Deduplicated to ${result.length} unique matches`);
  
  // Step 4: Sort by start time, then popularity
  return result.sort((a, b) => {
    const timeA = new Date(a.startTime).getTime();
    const timeB = new Date(b.startTime).getTime();
    if (timeA !== timeB) return timeA - timeB;
    return b.popularityScore - a.popularityScore;
  });
}

/**
 * Merge two game records, keeping best data from each
 */
function mergeGames(existing: ScheduledGame, incoming: ScheduledGame): ScheduledGame {
  const merged: ScheduledGame = { ...existing };
  
  // Prefer 'live' or 'completed' status over 'scheduled'
  if (incoming.status === 'live' && existing.status !== 'live') {
    merged.status = 'live';
  } else if (incoming.status === 'completed' && existing.status === 'scheduled') {
    merged.status = 'completed';
  }
  
  // Prefer game with odds, or merge odds if both have some
  if (incoming.hasOdds && incoming.odds) {
    if (!existing.hasOdds || !existing.odds) {
      merged.odds = incoming.odds;
      merged.hasOdds = true;
    } else {
      // Merge odds - keep non-null values from both, prefer incoming if conflict
      merged.odds = {
        moneyline: incoming.odds.moneyline || existing.odds.moneyline,
        spread: incoming.odds.spread || existing.odds.spread,
        total: incoming.odds.total || existing.odds.total,
      };
      merged.hasOdds = true;
    }
  }
  
  // Keep higher popularity score
  if (incoming.popularityScore > existing.popularityScore) {
    merged.popularityScore = incoming.popularityScore;
  }
  
  // Prefer more detailed stats
  if (incoming.homeStats && !existing.homeStats) {
    merged.homeStats = incoming.homeStats;
  }
  if (incoming.awayStats && !existing.awayStats) {
    merged.awayStats = incoming.awayStats;
  }
  
  // Use earliest start time (more likely to be accurate)
  try {
    const existingTime = new Date(existing.startTime).getTime();
    const incomingTime = new Date(incoming.startTime).getTime();
    if (incomingTime < existingTime && !isNaN(incomingTime)) {
      merged.startTime = incoming.startTime;
    }
  } catch {}
  
  return merged;
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

// Helper to normalize team names for matching (uses main normalizeTeamName function above)

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
// TENNIS (ATP/WTA) INTEGRATION via SportsGameOdds API + TheOddsAPI fallback
// ============================================================================

async function fetchTennisGames(): Promise<ScheduledGame[]> {
  const games: ScheduledGame[] = [];
  
  try {
    const apiKey = Deno.env.get('SPORTSGAMEODDS_API_KEY');
    let sportsGameOddsSuccess = false;
    
    if (apiKey) {
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
          return false;
        }

        const data = await response.json();
        const events = data?.data || data?.events || [];
        console.log(`[Tennis] Found ${events.length} ${league} events`);

        for (const event of events) {
          const game = parseAPIEvent(event, 'Tennis', league, popularity);
          if (game) games.push(game);
        }
        return events.length > 0;
      };

      const [atpSuccess, wtaSuccess] = await Promise.all([
        processResponse(atpResponse, 'ATP', 70),
        processResponse(wtaResponse, 'WTA', 65),
      ]);
      
      sportsGameOddsSuccess = atpSuccess || wtaSuccess;
    }

    // Fallback to TheOddsAPI if SportsGameOdds failed or returned no games
    if (!sportsGameOddsSuccess || games.length === 0) {
      const oddsApiKey = Deno.env.get('THE_ODDS_API_KEY');
      if (oddsApiKey) {
        console.log('[Tennis] Trying TheOddsAPI - discovering in-season tennis sports...');
        
        try {
          // First discover which tennis sports are currently in-season
          const sportsResponse = await fetch(
            `https://api.the-odds-api.com/v4/sports?apiKey=${oddsApiKey}`,
            { headers: { 'Accept': 'application/json' } }
          );
          
          if (sportsResponse.ok) {
            const allSports = await sportsResponse.json();
            const tennisSports = allSports.filter((s: any) => 
              s.group === 'Tennis' && s.active === true
            );
            
            console.log(`[Tennis] Found ${tennisSports.length} in-season tennis tournaments: ${tennisSports.map((s: any) => s.key).join(', ')}`);
            
            for (const sport of tennisSports) {
              try {
                const response = await fetch(
                  `https://api.the-odds-api.com/v4/sports/${sport.key}/odds/?apiKey=${oddsApiKey}&regions=us&markets=h2h&oddsFormat=american`,
                  { headers: { 'Accept': 'application/json' } }
                );

                if (response.ok) {
                  const events = await response.json();
                  if (events.length > 0) {
                    console.log(`[Tennis] Found ${events.length} ${sport.title} events from TheOddsAPI`);
                    
                    for (const event of events) {
                      const game = parseTheOddsEventSimple(event, 'Tennis', sport.title || sport.key, 75);
                      if (game) games.push(game);
                    }
                  }
                }
              } catch (e) {
                // Continue to next tournament
              }
            }
          } else {
            console.error(`[Tennis] Sports discovery failed: ${sportsResponse.status}`);
          }
        } catch (e) {
          console.error('[Tennis] Sports discovery error:', e);
        }
        
        for (const config of tennisKeys) {
          try {
            const response = await fetch(
              `https://api.the-odds-api.com/v4/sports/${config.key}/odds/?apiKey=${oddsApiKey}&regions=us&markets=h2h&oddsFormat=american`,
              { headers: { 'Accept': 'application/json' } }
            );

            if (response.ok) {
              const events = await response.json();
              if (events.length > 0) {
                console.log(`[Tennis] Found ${events.length} ${config.league} events from TheOddsAPI`);
                
                for (const event of events) {
                  const game = parseTheOddsEventSimple(event, 'Tennis', config.league, config.popularity);
                  if (game) games.push(game);
                }
              }
            }
          } catch (e) {
            // Continue to next tournament
          }
        }
      }
    }

    console.log(`[Tennis] Total games fetched: ${games.length}`);
    return games;
  } catch (error) {
    console.error('[Tennis] Error fetching games:', error);
    return [];
  }
}

// Helper to parse TheOddsAPI events (simpler version without full config object)
function parseTheOddsEventSimple(event: any, sport: string, league: string, popularity: number): ScheduledGame | null {
  try {
    const homeTeam = event.home_team || '';
    const awayTeam = event.away_team || '';
    
    if (!homeTeam || !awayTeam || !event.commence_time) return null;

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

    return {
      id: `tennis_${event.id || Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      sport,
      league,
      homeTeam,
      awayTeam,
      startTime: event.commence_time,
      popularityScore: popularity,
      status: 'scheduled',
      odds: Object.keys(odds).length > 0 ? odds : undefined,
      hasOdds: Object.keys(odds).length > 0,
    };
  } catch {
    return null;
  }
}

// ============================================================================
// BOXING INTEGRATION via TheOddsAPI
// ============================================================================

async function fetchBoxingGames(): Promise<ScheduledGame[]> {
  const games: ScheduledGame[] = [];
  
  try {
    const oddsApiKey = Deno.env.get('THE_ODDS_API_KEY');
    if (!oddsApiKey) {
      console.log('[Boxing] No THE_ODDS_API_KEY configured');
      return [];
    }

    console.log('[Boxing] Fetching from TheOddsAPI...');
    
    const response = await fetch(
      `https://api.the-odds-api.com/v4/sports/boxing_boxing/odds/?apiKey=${oddsApiKey}&regions=us&markets=h2h&oddsFormat=american`,
      { headers: { 'Accept': 'application/json' } }
    );

    if (response.ok) {
      const events = await response.json();
      console.log(`[Boxing] Found ${events.length} events from TheOddsAPI`);

      for (const event of events) {
        const game = parseTheOddsEventSimple(event, 'Boxing', 'Boxing', 78);
        if (game) games.push(game);
      }
    } else if (response.status !== 404 && response.status !== 422) {
      console.error(`[Boxing] API error: ${response.status}`);
    }

    console.log(`[Boxing] Total games fetched: ${games.length}`);
    return games;
  } catch (error) {
    console.error('[Boxing] Error fetching games:', error);
    return [];
  }
}

// ============================================================================
// TABLE TENNIS INTEGRATION via TheOddsAPI
// ============================================================================

async function fetchTableTennisGames(): Promise<ScheduledGame[]> {
  const games: ScheduledGame[] = [];
  
  try {
    // Only fetch REAL data from APIs - no generated fake matches
    console.log('[Table Tennis] Fetching real match data only...');

    // Try Firecrawl search for additional real match data
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (firecrawlKey) {
      try {
        console.log('[Table Tennis] Searching for live WTT matches...');
        const searchResponse = await fetch('https://api.firecrawl.dev/v1/search', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: 'WTT table tennis live matches today 2026',
            limit: 5,
          }),
        });
        
        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          console.log(`[Table Tennis] Firecrawl search returned ${searchData?.data?.length || 0} results`);
        }
      } catch (e) {
        console.log('[Table Tennis] Firecrawl search error:', e);
      }
    }
    
    // Fallback: Try TheOddsAPI for additional Table Tennis events
    const oddsApiKey = Deno.env.get('THE_ODDS_API_KEY');
    if (oddsApiKey && games.length < 5) {
      console.log('[Table Tennis] Trying TheOddsAPI as fallback...');
      
      try {
        const response = await fetch(
          `https://api.the-odds-api.com/v4/sports/tabletennis/odds/?apiKey=${oddsApiKey}&regions=us&markets=h2h&oddsFormat=american`,
          { headers: { 'Accept': 'application/json' } }
        );

        if (response.ok) {
          const events = await response.json();
          console.log(`[Table Tennis] Found ${events.length} events from TheOddsAPI`);

          for (const event of events) {
            const homeTeam = event.home_team || '';
            const awayTeam = event.away_team || '';
            
            if (!homeTeam || !awayTeam || !event.commence_time) continue;

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
              league: 'Table Tennis',
              homeTeam,
              awayTeam,
              startTime: event.commence_time,
              popularityScore: 58,
              status: 'scheduled',
              odds: Object.keys(odds).length > 0 ? odds : undefined,
              hasOdds: Object.keys(odds).length > 0,
            });
          }
        }
      } catch (e) {
        console.log(`[Table Tennis] TheOddsAPI fallback error:`, e);
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

    console.log('[TheOddsAPI] Fetching ALL available sports...');
    
    // Complete list of The Odds API supported sports
    // Reference: https://the-odds-api.com/sports-odds-data/sports-apis.html
    const sports = [
      // American Football
      { key: 'americanfootball_nfl', sport: 'Football', league: 'NFL', popularity: 100 },
      { key: 'americanfootball_ncaaf', sport: 'Football', league: 'NCAAF', popularity: 85 },
      { key: 'americanfootball_nfl_super_bowl_winner', sport: 'Football', league: 'NFL Super Bowl', popularity: 100 },
      { key: 'americanfootball_xfl', sport: 'Football', league: 'XFL', popularity: 60 },
      { key: 'americanfootball_ufl', sport: 'Football', league: 'UFL', popularity: 55 },
      
      // Basketball
      { key: 'basketball_nba', sport: 'Basketball', league: 'NBA', popularity: 95 },
      { key: 'basketball_ncaab', sport: 'Basketball', league: 'NCAAB', popularity: 80 },
      { key: 'basketball_wnba', sport: 'Basketball', league: 'WNBA', popularity: 70 },
      { key: 'basketball_nba_championship_winner', sport: 'Basketball', league: 'NBA Finals', popularity: 95 },
      { key: 'basketball_euroleague', sport: 'Basketball', league: 'EuroLeague', popularity: 65 },
      { key: 'basketball_nbl', sport: 'Basketball', league: 'NBL Australia', popularity: 55 },
      
      // Baseball
      { key: 'baseball_mlb', sport: 'Baseball', league: 'MLB', popularity: 85 },
      { key: 'baseball_mlb_world_series_winner', sport: 'Baseball', league: 'World Series', popularity: 88 },
      { key: 'baseball_ncaa', sport: 'Baseball', league: 'NCAA Baseball', popularity: 60 },
      { key: 'baseball_npb', sport: 'Baseball', league: 'NPB Japan', popularity: 55 },
      { key: 'baseball_kbo', sport: 'Baseball', league: 'KBO Korea', popularity: 50 },
      
      // Ice Hockey
      { key: 'icehockey_nhl', sport: 'Hockey', league: 'NHL', popularity: 80 },
      { key: 'icehockey_nhl_championship_winner', sport: 'Hockey', league: 'Stanley Cup', popularity: 82 },
      { key: 'icehockey_sweden_hockey_league', sport: 'Hockey', league: 'SHL Sweden', popularity: 55 },
      { key: 'icehockey_sweden_allsvenskan', sport: 'Hockey', league: 'HockeyAllsvenskan', popularity: 50 },
      { key: 'icehockey_finland_liiga', sport: 'Hockey', league: 'Liiga Finland', popularity: 52 },
      { key: 'icehockey_switzerland_nl', sport: 'Hockey', league: 'NL Switzerland', popularity: 48 },
      
      // Soccer - Major Leagues
      { key: 'soccer_epl', sport: 'Soccer', league: 'EPL', popularity: 90 },
      { key: 'soccer_spain_la_liga', sport: 'Soccer', league: 'La Liga', popularity: 85 },
      { key: 'soccer_germany_bundesliga', sport: 'Soccer', league: 'Bundesliga', popularity: 82 },
      { key: 'soccer_italy_serie_a', sport: 'Soccer', league: 'Serie A', popularity: 80 },
      { key: 'soccer_france_ligue_one', sport: 'Soccer', league: 'Ligue 1', popularity: 75 },
      { key: 'soccer_usa_mls', sport: 'Soccer', league: 'MLS', popularity: 65 },
      
      // Soccer - European Competitions
      { key: 'soccer_uefa_champs_league', sport: 'Soccer', league: 'Champions League', popularity: 95 },
      { key: 'soccer_uefa_europa_league', sport: 'Soccer', league: 'Europa League', popularity: 78 },
      { key: 'soccer_uefa_europa_conference_league', sport: 'Soccer', league: 'Conference League', popularity: 65 },
      
      // Soccer - Other Top Leagues
      { key: 'soccer_netherlands_eredivisie', sport: 'Soccer', league: 'Eredivisie', popularity: 68 },
      { key: 'soccer_portugal_primeira_liga', sport: 'Soccer', league: 'Primeira Liga', popularity: 65 },
      { key: 'soccer_belgium_first_div', sport: 'Soccer', league: 'Belgian First Div', popularity: 58 },
      { key: 'soccer_turkey_super_league', sport: 'Soccer', league: 'Turkish Super Lig', popularity: 60 },
      { key: 'soccer_greece_super_league', sport: 'Soccer', league: 'Greek Super League', popularity: 52 },
      { key: 'soccer_scotland_premiership', sport: 'Soccer', league: 'Scottish Premiership', popularity: 58 },
      
      // Soccer - Americas
      { key: 'soccer_brazil_campeonato', sport: 'Soccer', league: 'Brasileirão', popularity: 72 },
      { key: 'soccer_brazil_serie_b', sport: 'Soccer', league: 'Brasileirão B', popularity: 55 },
      { key: 'soccer_argentina_primera_division', sport: 'Soccer', league: 'Liga Argentina', popularity: 68 },
      { key: 'soccer_mexico_ligamx', sport: 'Soccer', league: 'Liga MX', popularity: 70 },
      { key: 'soccer_conmebol_copa_libertadores', sport: 'Soccer', league: 'Copa Libertadores', popularity: 75 },
      
      // Soccer - Asia & Australia
      { key: 'soccer_australia_aleague', sport: 'Soccer', league: 'A-League', popularity: 50 },
      { key: 'soccer_japan_j_league', sport: 'Soccer', league: 'J-League', popularity: 55 },
      { key: 'soccer_korea_kleague1', sport: 'Soccer', league: 'K-League', popularity: 52 },
      { key: 'soccer_china_superleague', sport: 'Soccer', league: 'Chinese Super League', popularity: 48 },
      
      // Soccer - English Lower Divisions
      { key: 'soccer_england_efl_cup', sport: 'Soccer', league: 'EFL Cup', popularity: 68 },
      { key: 'soccer_fa_cup', sport: 'Soccer', league: 'FA Cup', popularity: 75 },
      { key: 'soccer_england_league1', sport: 'Soccer', league: 'EFL League One', popularity: 55 },
      { key: 'soccer_england_league2', sport: 'Soccer', league: 'EFL League Two', popularity: 50 },
      { key: 'soccer_efl_champ', sport: 'Soccer', league: 'EFL Championship', popularity: 65 },
      
      // Soccer - Germany Lower Divisions
      { key: 'soccer_germany_bundesliga2', sport: 'Soccer', league: 'Bundesliga 2', popularity: 58 },
      
      // Soccer - Italy Lower Divisions
      { key: 'soccer_italy_serie_b', sport: 'Soccer', league: 'Serie B', popularity: 52 },
      
      // Soccer - Spain Lower Divisions
      { key: 'soccer_spain_segunda_division', sport: 'Soccer', league: 'La Liga 2', popularity: 55 },
      
      // MMA / UFC
      { key: 'mma_mixed_martial_arts', sport: 'MMA', league: 'UFC', popularity: 92 },
      
      // Boxing
      { key: 'boxing_boxing', sport: 'Boxing', league: 'Boxing', popularity: 78 },
      
      // Tennis
      { key: 'tennis_atp_french_open', sport: 'Tennis', league: 'French Open', popularity: 80 },
      { key: 'tennis_atp_aus_open', sport: 'Tennis', league: 'Australian Open', popularity: 80 },
      { key: 'tennis_atp_us_open', sport: 'Tennis', league: 'US Open', popularity: 80 },
      { key: 'tennis_atp_wimbledon', sport: 'Tennis', league: 'Wimbledon', popularity: 85 },
      { key: 'tennis_wta_french_open', sport: 'Tennis', league: 'WTA French Open', popularity: 72 },
      { key: 'tennis_wta_aus_open', sport: 'Tennis', league: 'WTA Australian Open', popularity: 72 },
      { key: 'tennis_wta_us_open', sport: 'Tennis', league: 'WTA US Open', popularity: 72 },
      { key: 'tennis_wta_wimbledon', sport: 'Tennis', league: 'WTA Wimbledon', popularity: 75 },
      
      // Golf
      { key: 'golf_pga_championship_winner', sport: 'Golf', league: 'PGA Championship', popularity: 75 },
      { key: 'golf_masters_tournament_winner', sport: 'Golf', league: 'The Masters', popularity: 80 },
      { key: 'golf_the_open_championship_winner', sport: 'Golf', league: 'The Open', popularity: 78 },
      { key: 'golf_us_open_winner', sport: 'Golf', league: 'US Open Golf', popularity: 76 },
      
      // Cricket
      { key: 'cricket_ipl', sport: 'Cricket', league: 'IPL', popularity: 82 },
      { key: 'cricket_big_bash', sport: 'Cricket', league: 'Big Bash', popularity: 65 },
      { key: 'cricket_test_match', sport: 'Cricket', league: 'Test Cricket', popularity: 70 },
      { key: 'cricket_odi', sport: 'Cricket', league: 'ODI Cricket', popularity: 72 },
      { key: 'cricket_t20i', sport: 'Cricket', league: 'T20 International', popularity: 75 },
      { key: 'cricket_psl', sport: 'Cricket', league: 'Pakistan Super League', popularity: 60 },
      
      // Rugby
      { key: 'rugbyunion_six_nations', sport: 'Rugby', league: 'Six Nations', popularity: 72 },
      { key: 'rugbyleague_nrl', sport: 'Rugby', league: 'NRL', popularity: 68 },
      { key: 'rugbyunion_super_rugby', sport: 'Rugby', league: 'Super Rugby', popularity: 62 },
      
      // Australian Rules
      { key: 'aussierules_afl', sport: 'AFL', league: 'AFL', popularity: 75 },
      
      // Darts
      { key: 'darts_pdc_world_championship', sport: 'Darts', league: 'PDC World Championship', popularity: 55 },
      
      // Snooker
      { key: 'snooker_world_championship', sport: 'Snooker', league: 'World Snooker', popularity: 52 },
      
      // Table Tennis
      { key: 'tabletennis_wtt', sport: 'Table Tennis', league: 'WTT', popularity: 58 },
      
      // Esports
      { key: 'esports_lol', sport: 'Esports', league: 'League of Legends', popularity: 75 },
      { key: 'esports_csgo', sport: 'Esports', league: 'CS2', popularity: 72 },
      { key: 'esports_dota2', sport: 'Esports', league: 'Dota 2', popularity: 68 },
      { key: 'esports_valorant', sport: 'Esports', league: 'Valorant', popularity: 70 },
      
      // Handball
      { key: 'handball_germany_bundesliga', sport: 'Handball', league: 'Handball Bundesliga', popularity: 50 },
      
      // Volleyball
      { key: 'volleyball_italy_superlega', sport: 'Volleyball', league: 'Superlega Italy', popularity: 48 },
      
      // Politics & Entertainment (if available)
      { key: 'politics_us_presidential_election_winner', sport: 'Politics', league: 'US Election', popularity: 85 },
    ];

    // Fetch in batches to avoid overwhelming the API
    const batchSize = 10;
    const batches = [];
    for (let i = 0; i < sports.length; i += batchSize) {
      batches.push(sports.slice(i, i + batchSize));
    }

    for (const batch of batches) {
      const batchPromises = batch.map(async (sportConfig) => {
        try {
          const response = await fetch(
            `https://api.the-odds-api.com/v4/sports/${sportConfig.key}/odds/?apiKey=${apiKey}&regions=us&markets=h2h,spreads,totals&oddsFormat=american`,
            { headers: { 'Accept': 'application/json' } }
          );

          if (!response.ok) {
            if (response.status === 404 || response.status === 422) return []; // Sport not in season or invalid
            if (response.status === 401) {
              console.log(`[TheOddsAPI] Auth error - check API key`);
              return [];
            }
            return [];
          }

          const events = await response.json();
          if (events.length > 0) {
            console.log(`[TheOddsAPI] Found ${events.length} ${sportConfig.league} events`);
          }

          const parsedGames: ScheduledGame[] = [];
          for (const event of events) {
            const game = parseTheOddsEvent(event, sportConfig);
            if (game) parsedGames.push(game);
          }
          return parsedGames;
        } catch (e) {
          return [];
        }
      });

      const batchResults = await Promise.all(batchPromises);
      for (const result of batchResults) {
        games.push(...result);
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
  
  // ESPN supports 20+ popular sports with free API
  const espnSports = [
    // American Football
    { path: 'football/nfl', sport: 'Football', league: 'NFL', popularity: 100 },
    { path: 'football/college-football', sport: 'Football', league: 'NCAAF', popularity: 85 },
    
    // Basketball
    { path: 'basketball/nba', sport: 'Basketball', league: 'NBA', popularity: 95 },
    { path: 'basketball/mens-college-basketball', sport: 'Basketball', league: 'NCAAB', popularity: 80 },
    { path: 'basketball/wnba', sport: 'Basketball', league: 'WNBA', popularity: 70 },
    { path: 'basketball/womens-college-basketball', sport: 'Basketball', league: 'WCBB', popularity: 65 },
    
    // Baseball
    { path: 'baseball/mlb', sport: 'Baseball', league: 'MLB', popularity: 85 },
    { path: 'baseball/college-baseball', sport: 'Baseball', league: 'College Baseball', popularity: 60 },
    
    // Hockey
    { path: 'hockey/nhl', sport: 'Hockey', league: 'NHL', popularity: 80 },
    
    // Soccer - Major Leagues
    { path: 'soccer/eng.1', sport: 'Soccer', league: 'EPL', popularity: 90 },
    { path: 'soccer/esp.1', sport: 'Soccer', league: 'La Liga', popularity: 85 },
    { path: 'soccer/ger.1', sport: 'Soccer', league: 'Bundesliga', popularity: 82 },
    { path: 'soccer/ita.1', sport: 'Soccer', league: 'Serie A', popularity: 80 },
    { path: 'soccer/fra.1', sport: 'Soccer', league: 'Ligue 1', popularity: 75 },
    { path: 'soccer/usa.1', sport: 'Soccer', league: 'MLS', popularity: 65 },
    { path: 'soccer/uefa.champions', sport: 'Soccer', league: 'Champions League', popularity: 95 },
    { path: 'soccer/uefa.europa', sport: 'Soccer', league: 'Europa League', popularity: 78 },
    
    // MMA / UFC
    { path: 'mma/ufc', sport: 'MMA', league: 'UFC', popularity: 92 },
    { path: 'mma/pfl', sport: 'MMA', league: 'PFL', popularity: 65 },
    { path: 'mma/bellator', sport: 'MMA', league: 'Bellator', popularity: 60 },
    
    // Tennis
    { path: 'tennis/atp', sport: 'Tennis', league: 'ATP', popularity: 75 },
    { path: 'tennis/wta', sport: 'Tennis', league: 'WTA', popularity: 70 },
    
    // Golf
    { path: 'golf/pga', sport: 'Golf', league: 'PGA Tour', popularity: 75 },
    { path: 'golf/lpga', sport: 'Golf', league: 'LPGA', popularity: 60 },
    
    // Cricket
    { path: 'cricket/icc', sport: 'Cricket', league: 'ICC', popularity: 70 },
    
    // Rugby
    { path: 'rugby/super-rugby', sport: 'Rugby', league: 'Super Rugby', popularity: 62 },
    { path: 'rugby/six-nations', sport: 'Rugby', league: 'Six Nations', popularity: 72 },
    { path: 'rugby-league/nrl', sport: 'Rugby', league: 'NRL', popularity: 68 },
    
    // Australian Rules
    { path: 'australian-football/afl', sport: 'AFL', league: 'AFL', popularity: 75 },
    
    // Boxing
    { path: 'boxing/boxing', sport: 'Boxing', league: 'Boxing', popularity: 78 },
    
    // NASCAR & F1
    { path: 'racing/nascar', sport: 'NASCAR', league: 'NASCAR Cup', popularity: 72 },
    { path: 'racing/f1', sport: 'F1', league: 'Formula 1', popularity: 80 },
    
    // Lacrosse
    { path: 'lacrosse/pll', sport: 'Lacrosse', league: 'PLL', popularity: 55 },
    
    // Volleyball
    { path: 'volleyball/fivb', sport: 'Volleyball', league: 'FIVB', popularity: 55 },
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
    
    // For UFC/MMA and Tennis, competitors use athlete names instead of team names
    if (config.league === 'UFC' || config.sport === 'MMA' || config.sport === 'Tennis' || config.sport === 'Boxing') {
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
    // Try to authenticate user (optional - allow anonymous access for free preview)
    const auth = await authenticateUser(req);
    
    // Use user ID for rate limiting if authenticated, otherwise use IP
    const rateLimitKey = auth?.userId || req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'anonymous';

    // Check rate limit
    if (!checkRateLimit(rateLimitKey)) {
      console.log('[Rate Limit] Rate limit exceeded for:', rateLimitKey);
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.', success: false }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const forceRefresh = url.searchParams.get('refresh') === 'true';
    
    if (!forceRefresh && isCacheValid()) {
      console.log('[API] Returning L1 cached games:', cachedGames.length);
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

    // L2: DB cache (survives cold starts)
    if (!forceRefresh) {
      const dbCached = await getDbCache(DB_CACHE_KEY) as ScheduledGame[] | null;
      if (dbCached && Array.isArray(dbCached) && dbCached.length > 0) {
        console.log('[API] Returning L2 DB cached games:', dbCached.length);
        cachedGames = dbCached;
        cacheTimestamp = Date.now();
        return new Response(
          JSON.stringify({
            success: true,
            games: dbCached,
            source: 'db_cached',
            lastUpdated: new Date().toISOString(),
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
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
      boxingGames,
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
      fetchBoxingGames(),
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
      ...boxingGames,
      ...theOddsGames,
      ...espnGames,
    ];
    
    console.log(`[API] Total fetched: ${allGames.length} games (Sportsbook: ${sportsbookGames.length}, NFL: ${nflGames.length}, NBA: ${nbaGames.length}, NHL: ${nhlGames.length}, MLB: ${mlbGames.length}, NCAAB: ${ncaabGames.length}, NCAAF: ${ncaafGames.length}, UFC: ${ufcGames.length}, Tennis: ${tennisGames.length}, TableTennis: ${tableTennisGames.length}, Boxing: ${boxingGames.length}, TheOddsAPI: ${theOddsGames.length}, ESPN: ${espnGames.length})`);

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
    
    // Persist to DB cache for cold-start protection
    await setDbCache(DB_CACHE_KEY, rankedGames, CACHE_TTL_MS);

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
