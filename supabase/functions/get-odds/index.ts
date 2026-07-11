import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// DB-backed cache helpers (survives cold starts)
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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting (per IP for public access)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 30; // 30 requests per minute
const RATE_WINDOW_MS = 60 * 1000;

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + RATE_WINDOW_MS });
    return true;
  }
  
  if (record.count >= RATE_LIMIT) {
    return false;
  }
  
  record.count++;
  return true;
}

// Get client IP for rate limiting
function getClientIP(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
         req.headers.get('x-real-ip') || 
         'unknown';
}

// Allowed sports (whitelist) - Comprehensive coverage
const leagueIdMap: Record<string, string> = {
  // Major US Sports
  'nba': 'NBA',
  'nfl': 'NFL',
  'mlb': 'MLB',
  'nhl': 'NHL',
  'ncaab': 'NCAAB',
  'ncaaf': 'NCAAF',
  'wnba': 'WNBA',
  'cfl': 'CFL',
  'xfl': 'XFL',
  'usfl': 'USFL',
  'nll': 'NLL',
  'pll': 'PLL',
  'mll': 'MLL',
  // Soccer Leagues
  'epl': 'EPL',
  'laliga': 'LALIGA',
  'bundesliga': 'BUNDESLIGA',
  'seriea': 'SERIEA',
  'mls': 'MLS',
  'ligue1': 'LIGUE1',
  'ucl': 'UCL',
  'uel': 'UEL',
  'uecl': 'UECL',
  'eredivisie': 'EREDIVISIE',
  'liga-mx': 'LIGA-MX',
  'ligamx': 'LIGA-MX',
  'primeira': 'PRIMEIRA',
  'scottish': 'SCOTTISH',
  'copa': 'COPA',
  'concacaf': 'CONCACAF',
  'worldcup': 'WORLDCUP',
  'euros': 'EUROS',
  'afcon': 'AFCON',
  'jleague': 'JLEAGUE',
  'kleague': 'KLEAGUE',
  'aleague': 'ALEAGUE',
  'csl': 'CSL',
  'isl': 'ISL',
  'soccer': 'EPL',
  'saudi': 'SAUDI',
  'brazil': 'BRAZIL',
  'argentina': 'ARGENTINA',
  'libertadores': 'LIBERTADORES',
  'sudamericana': 'SUDAMERICANA',
  // Combat Sports
  'ufc': 'UFC',
  'mma': 'UFC',
  'boxing': 'BOXING',
  'pfl': 'PFL',
  'bellator': 'BELLATOR',
  'one': 'ONE',
  'kickboxing': 'KICKBOXING',
  'muaythai': 'MUAYTHAI',
  'wrestling': 'WRESTLING',
  // Tennis
  'atp': 'ATP',
  'wta': 'WTA',
  'itf': 'ITF',
  'grandslam': 'GRANDSLAM',
  // Golf
  'pga': 'PGA',
  'lpga': 'LPGA',
  'liv': 'LIV',
  'dpworld': 'DPWORLD',
  'masters': 'MASTERS',
  // Racing
  'f1': 'F1',
  'nascar': 'NASCAR',
  'indycar': 'INDYCAR',
  'motogp': 'MOTOGP',
  'wrc': 'WRC',
  'supercars': 'SUPERCARS',
  'formulae': 'FORMULAE',
  // Australian Sports
  'afl': 'AFL',
  'nrl': 'NRL',
  'bbl': 'BBL',
  'wbbl': 'WBBL',
  // Cricket
  'cricket': 'CRICKET',
  'ipl': 'IPL',
  't20wc': 'T20WC',
  'odiwc': 'ODIWC',
  'ashes': 'ASHES',
  'psl': 'PSL',
  'cpl': 'CPL',
  // Rugby
  'rugby': 'RUGBY',
  'rugbyunion': 'RUGBYUNION',
  'rugbyleague': 'RUGBYLEAGUE',
  'sixnations': 'SIXNATIONS',
  'rwc': 'RWC',
  'superrugby': 'SUPERRUGBY',
  // Table Tennis & Other Racquet
  'tabletennis': 'TABLETENNIS',
  'badminton': 'BADMINTON',
  'squash': 'SQUASH',
  'pickleball': 'PICKLEBALL',
  // Esports
  'esports': 'ESPORTS',
  'csgo': 'CSGO',
  'cs2': 'CS2',
  'lol': 'LOL',
  'dota2': 'DOTA2',
  'valorant': 'VALORANT',
  'overwatch': 'OVERWATCH',
  'rocketleague': 'ROCKETLEAGUE',
  'fifa': 'FIFA',
  'starcraft': 'STARCRAFT',
  'cod': 'COD',
  'pubg': 'PUBG',
  'fortnite': 'FORTNITE',
  'apex': 'APEX',
  // Winter Sports
  'skiing': 'SKIING',
  'snowboard': 'SNOWBOARD',
  'biathlon': 'BIATHLON',
  'hockey': 'HOCKEY',
  'curling': 'CURLING',
  'figureskating': 'FIGURESKATING',
  // Other Sports
  'snooker': 'SNOOKER',
  'pool': 'POOL',
  'darts': 'DARTS',
  'handball': 'HANDBALL',
  'volleyball': 'VOLLEYBALL',
  'beachvolleyball': 'BEACHVOLLEYBALL',
  'waterpolo': 'WATERPOLO',
  'cycling': 'CYCLING',
  'lacrosse': 'LACROSSE',
  'fieldhockey': 'FIELDHOCKEY',
  'horseracing': 'HORSERACING',
  'greyhound': 'GREYHOUND',
  'olympics': 'OLYMPICS',
  'athletics': 'ATHLETICS',
  'swimming': 'SWIMMING',
  'gymnastics': 'GYMNASTICS',
  'bowling': 'BOWLING',
  'surfing': 'SURFING',
  'skateboard': 'SKATEBOARD',
  'archery': 'ARCHERY',
  'shooting': 'SHOOTING',
  'fencing': 'FENCING',
  'rowing': 'ROWING',
  'sailing': 'SAILING',
  'triathlon': 'TRIATHLON',
  'crossfit': 'CROSSFIT',
  'strongman': 'STRONGMAN',
  'poker': 'POKER',
  'chess': 'CHESS',
};

// Validate sport parameter
function validateSport(sport: string | null): string | null {
  if (!sport) return 'nba';
  const normalized = sport.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (normalized.length > 20) return null;
  return leagueIdMap[normalized] ? normalized : null;
}

// In-memory cache as L1, DB cache as L2
const oddsCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 60 minutes (was 30)

type BookmakerOdds = {
  key: string;
  title: string;
  moneyline: { home: number; away: number };
  spread: { home: number; homeOdds: number; away: number; awayOdds: number };
  total: { line: number; overOdds: number; underOdds: number };
};

const parseOddsValue = (oddsValue: unknown): number => {
  if (typeof oddsValue === 'number') return oddsValue;
  if (typeof oddsValue === 'string') {
    const cleaned = oddsValue.replace(/[^0-9+-]/g, '');
    return parseInt(cleaned) || 0;
  }
  return 0;
};

const createBookmakerOdds = (key: string, title: string): BookmakerOdds => {
  const safeTitle = title || key || 'Consensus';
  return {
    key: key || safeTitle.toLowerCase().replace(/[^a-z0-9]+/g, '_') || 'consensus',
    title: safeTitle,
    moneyline: { home: 0, away: 0 },
    spread: { home: 0, homeOdds: -110, away: 0, awayOdds: -110 },
    total: { line: 0, overOdds: -110, underOdds: -110 },
  };
};

function applySportsGameOdd(bookmaker: BookmakerOdds, oddId: string, odd: any) {
  const bookOdds = parseOddsValue(odd?.bookOdds ?? odd?.odds ?? odd?.price ?? odd?.americanOdds ?? odd?.fairOdds ?? 0);

  if (oddId === 'points-home-game-ml-home' || oddId.includes('-ml-home')) {
    bookmaker.moneyline.home = bookOdds;
  }
  if (oddId === 'points-away-game-ml-away' || oddId.includes('-ml-away')) {
    bookmaker.moneyline.away = bookOdds;
  }
  if (oddId === 'points-home-game-sp-home' || oddId.includes('-sp-home')) {
    bookmaker.spread.home = parseFloat(odd?.bookSpread ?? odd?.fairSpread ?? odd?.spread ?? odd?.line ?? odd?.point ?? 0);
    bookmaker.spread.homeOdds = bookOdds || -110;
  }
  if (oddId === 'points-away-game-sp-away' || oddId.includes('-sp-away')) {
    bookmaker.spread.away = parseFloat(odd?.bookSpread ?? odd?.fairSpread ?? odd?.spread ?? odd?.line ?? odd?.point ?? 0);
    bookmaker.spread.awayOdds = bookOdds || -110;
  }
  if (oddId === 'points-all-game-ou-over' || oddId.includes('-ou-over')) {
    bookmaker.total.line = parseFloat(odd?.bookOverUnder ?? odd?.fairOverUnder ?? odd?.overUnder ?? odd?.line ?? odd?.point ?? 0);
    bookmaker.total.overOdds = bookOdds || -110;
  }
  if (oddId === 'points-all-game-ou-under' || oddId.includes('-ou-under')) {
    bookmaker.total.line = bookmaker.total.line || parseFloat(odd?.bookOverUnder ?? odd?.fairOverUnder ?? odd?.overUnder ?? odd?.line ?? odd?.point ?? 0);
    bookmaker.total.underOdds = bookOdds || -110;
  }
}

function extractTheOddsApiBookmakers(event: any, homeTeamName: string, awayTeamName: string): BookmakerOdds[] {
  if (!Array.isArray(event?.bookmakers)) return [];

  return event.bookmakers.map((book: any) => {
    const bookmaker = createBookmakerOdds(book?.key || book?.id || book?.title, book?.title || book?.name || book?.key);
    const h2h = book?.markets?.find((market: any) => market?.key === 'h2h');
    const spreads = book?.markets?.find((market: any) => market?.key === 'spreads');
    const totals = book?.markets?.find((market: any) => market?.key === 'totals');

    const homeH2h = h2h?.outcomes?.find((outcome: any) => outcome?.name === homeTeamName);
    const awayH2h = h2h?.outcomes?.find((outcome: any) => outcome?.name === awayTeamName);
    const homeSpread = spreads?.outcomes?.find((outcome: any) => outcome?.name === homeTeamName);
    const awaySpread = spreads?.outcomes?.find((outcome: any) => outcome?.name === awayTeamName);
    const over = totals?.outcomes?.find((outcome: any) => outcome?.name === 'Over');
    const under = totals?.outcomes?.find((outcome: any) => outcome?.name === 'Under');

    bookmaker.moneyline.home = parseOddsValue(homeH2h?.price ?? 0);
    bookmaker.moneyline.away = parseOddsValue(awayH2h?.price ?? 0);
    bookmaker.spread.home = Number(homeSpread?.point ?? 0);
    bookmaker.spread.homeOdds = parseOddsValue(homeSpread?.price ?? -110) || -110;
    bookmaker.spread.away = Number(awaySpread?.point ?? 0);
    bookmaker.spread.awayOdds = parseOddsValue(awaySpread?.price ?? -110) || -110;
    bookmaker.total.line = Number(over?.point ?? under?.point ?? 0);
    bookmaker.total.overOdds = parseOddsValue(over?.price ?? -110) || -110;
    bookmaker.total.underOdds = parseOddsValue(under?.price ?? -110) || -110;

    return bookmaker;
  }).filter((book: BookmakerOdds) => (
    book.moneyline.home !== 0 ||
    book.moneyline.away !== 0 ||
    book.spread.home !== 0 ||
    book.spread.away !== 0 ||
    book.total.line !== 0
  ));
}

function extractSportsGameOddsBookmakers(event: any): BookmakerOdds[] {
  const odds = event?.odds || {};
  const bookmakers = new Map<string, BookmakerOdds>();

  for (const [oddId, oddData] of Object.entries(odds)) {
    const odd = oddData as any;
    const rawKey = odd?.sportsbookID ?? odd?.sportsbookId ?? odd?.sportsbook ?? odd?.bookmakerKey ?? odd?.bookmaker ?? odd?.book ?? odd?.source ?? 'consensus';
    const rawTitle = odd?.sportsbookName ?? odd?.bookmakerName ?? odd?.bookName ?? odd?.sportsbook ?? odd?.bookmaker ?? rawKey;
    const key = String(rawKey || 'consensus').toLowerCase().replace(/[^a-z0-9]+/g, '_');
    const title = String(rawTitle || rawKey || 'Consensus');
    const current = bookmakers.get(key) || createBookmakerOdds(key, title);

    applySportsGameOdd(current, oddId, odd);
    bookmakers.set(key, current);
  }

  return Array.from(bookmakers.values()).filter((book) => (
    book.moneyline.home !== 0 ||
    book.moneyline.away !== 0 ||
    book.spread.home !== 0 ||
    book.spread.away !== 0 ||
    book.total.line !== 0
  ));
}

function extractBookmakers(event: any, homeTeamName: string, awayTeamName: string): BookmakerOdds[] {
  const fromBookmakers = extractTheOddsApiBookmakers(event, homeTeamName, awayTeamName);
  if (fromBookmakers.length > 0) return fromBookmakers;
  return extractSportsGameOddsBookmakers(event);
}

function bestByPrice(items: Array<{ bookmaker: string; odds: number; line?: number }>) {
  return items.filter((item) => item.odds !== 0).sort((a, b) => b.odds - a.odds)[0] || null;
}

function findBestLines(bookmakers: BookmakerOdds[]) {
  return {
    moneyline: {
      home: bestByPrice(bookmakers.map((book) => ({ bookmaker: book.title, odds: book.moneyline.home }))),
      away: bestByPrice(bookmakers.map((book) => ({ bookmaker: book.title, odds: book.moneyline.away }))),
    },
    spread: {
      home: bestByPrice(bookmakers.map((book) => ({ bookmaker: book.title, odds: book.spread.homeOdds, line: book.spread.home }))),
      away: bestByPrice(bookmakers.map((book) => ({ bookmaker: book.title, odds: book.spread.awayOdds, line: book.spread.away }))),
    },
    total: {
      over: bestByPrice(bookmakers.map((book) => ({ bookmaker: book.title, odds: book.total.overOdds, line: book.total.line }))),
      under: bestByPrice(bookmakers.map((book) => ({ bookmaker: book.title, odds: book.total.underOdds, line: book.total.line }))),
    },
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting by IP (public endpoint)
    const clientIP = getClientIP(req);
    if (!checkRateLimit(clientIP)) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const API_KEY = Deno.env.get('SPORTSGAMEODDS_API_KEY');
    if (!API_KEY) {
      console.error('[Internal] SPORTSGAMEODDS_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Service temporarily unavailable' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const sportParam = url.searchParams.get('sport');
    const validatedSport = validateSport(sportParam);
    
    if (validatedSport === null) {
      return new Response(
        JSON.stringify({ error: 'Invalid sport parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const leagueId = leagueIdMap[validatedSport] || 'NBA';

    // L1: In-memory cache
    const cached = oddsCache.get(leagueId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return new Response(JSON.stringify(cached.data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // L2: DB cache (survives cold starts)
    const dbCached = await getDbCache(`get-odds:${leagueId}`);
    if (dbCached) {
      oddsCache.set(leagueId, { data: dbCached, timestamp: Date.now() });
      return new Response(JSON.stringify(dbCached), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Fetching odds for sport: ${validatedSport} (leagueID: ${leagueId})`);

    // Fetch events with odds from SportsGameOdds API v2
    const apiUrl = `https://api.sportsgameodds.com/v2/events?leagueID=${encodeURIComponent(leagueId)}&oddsAvailable=true&limit=50`;
    
    const response = await fetch(apiUrl, {
      headers: { 'x-api-key': API_KEY },
    });
    
    if (!response.ok) {
      console.error(`[Internal] SportsGameOdds API error: ${response.status}`);

      if (response.status === 401 || response.status === 403) {
        return new Response(
          JSON.stringify({ error: 'Service configuration error' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Return cached data if available
      if (cached) {
        return new Response(JSON.stringify(cached.data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Return empty payload with rateLimited flag for 429
      const emptyPayload = {
        games: [],
        remainingRequests: null,
        lastUpdated: new Date().toISOString(),
        error: 'Unable to fetch data at this time',
        rateLimited: response.status === 429,
        upstreamStatus: response.status,
      };

      return new Response(JSON.stringify(emptyPayload), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const events = data?.data || data?.events || data?.items || [];

    console.log(`Received ${events.length} events from SportsGameOdds for ${leagueId}`);

    // Transform events to our format
    const transformedGames = events.map((event: any) => {
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
      
      const homeAbbr = event.teams?.home?.names?.short || homeTeamName.substring(0, 3).toUpperCase();
      const awayAbbr = event.teams?.away?.names?.short || awayTeamName.substring(0, 3).toUpperCase();
      
      const startTime = event.status?.startsAt || event.startTime || event.startDate || new Date().toISOString();
      
      const isLive = event.status?.live === true;
      const isEnded = event.status?.ended === true;
      
      const odds = event.odds || {};
      const bookmakers = extractBookmakers(event, homeTeamName, awayTeamName);
      const bestLines = findBestLines(bookmakers);
      let moneylineHome = 0, moneylineAway = 0;
      let spreadHome = 0, spreadHomeOdds = -110;
      let spreadAway = 0, spreadAwayOdds = -110;
      let totalOver = 0, totalOverOdds = -110;
      let totalUnder = 0, totalUnderOdds = -110;

      for (const [oddId, oddData] of Object.entries(odds)) {
        const odd = oddData as any;
        const fairOdds = parseOddsValue(odd?.fairOdds || odd?.bookOdds || odd?.odds || 0);
        
        if (oddId === 'points-home-game-ml-home' || oddId.includes('-ml-home')) {
          moneylineHome = fairOdds;
        }
        if (oddId === 'points-away-game-ml-away' || oddId.includes('-ml-away')) {
          moneylineAway = fairOdds;
        }
        if (oddId === 'points-home-game-sp-home' || oddId.includes('-sp-home')) {
          spreadHome = parseFloat(odd?.fairSpread || odd?.bookSpread || odd?.spread || odd?.line || 0);
          spreadHomeOdds = fairOdds || -110;
        }
        if (oddId === 'points-away-game-sp-away' || oddId.includes('-sp-away')) {
          spreadAway = parseFloat(odd?.fairSpread || odd?.bookSpread || odd?.spread || odd?.line || 0);
          spreadAwayOdds = fairOdds || -110;
        }
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
        bookmakers,
        bestLines,
      };
    });

    const validGames = transformedGames.filter((g: any) => 
      g.homeTeam !== 'Home Team' && g.awayTeam !== 'Away Team'
    );

    console.log(`Returning ${validGames.length} valid games with odds for ${leagueId}`);

    const responsePayload = {
      games: validGames,
      remainingRequests: null,
      lastUpdated: new Date().toISOString(),
    };

    oddsCache.set(leagueId, { data: responsePayload, timestamp: Date.now() });
    // Persist to DB cache
    await setDbCache(`get-odds:${leagueId}`, responsePayload, CACHE_TTL_MS);

    return new Response(JSON.stringify(responsePayload), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[Internal] Error in get-odds function');
    return new Response(
      JSON.stringify({ error: 'Service temporarily unavailable' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
