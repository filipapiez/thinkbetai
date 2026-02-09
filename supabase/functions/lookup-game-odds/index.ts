import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
"Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting (per IP) - more generous limits
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 60; // Increased from 30
const RATE_WINDOW_MS = 60 * 1000;

function getClientIP(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + RATE_WINDOW_MS });
    return true;
  }

  if (record.count >= RATE_LIMIT) return false;
  record.count++;
  return true;
}

// In-memory cache - match-level with longer TTL
const cache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes (increased from 5)

// Sport-level cache for API responses (reduces duplicate calls)
const sportCache = new Map<string, { games: TheOddsApiGame[]; ts: number }>();
const SPORT_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Track upstream rate limit state
let upstreamRateLimited = false;
let upstreamRateLimitUntil = 0;

function normalizeTeam(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizeSport(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "")
    .trim();
}

// Map user-facing sport names to The Odds API sport keys
const sportKeyMap: Record<string, string> = {
  // Basketball
  nba: "basketball_nba",
  basketball: "basketball_nba",
  ncaab: "basketball_ncaab",
  wnba: "basketball_wnba",
  euroleague: "basketball_euroleague",
  
  // American Football
  nfl: "americanfootball_nfl",
  football: "americanfootball_nfl",
  ncaaf: "americanfootball_ncaaf",
  
  // Baseball
  mlb: "baseball_mlb",
  baseball: "baseball_mlb",
  
  // Hockey
  nhl: "icehockey_nhl",
  hockey: "icehockey_nhl",
  
  // Soccer - Default to EPL, but also map specific leagues
  soccer: "soccer_epl",
  epl: "soccer_epl",
  premierleague: "soccer_epl",
  mls: "soccer_usa_mls",
  laliga: "soccer_spain_la_liga",
  bundesliga: "soccer_germany_bundesliga",
  seriea: "soccer_italy_serie_a",
  ligue1: "soccer_france_ligue_one",
  championsleague: "soccer_uefa_champs_league",
  ucl: "soccer_uefa_champs_league",
  europaleague: "soccer_uefa_europa_league",
  eflchampionship: "soccer_efl_champ",
  facup: "soccer_fa_cup",
  
  // MMA / UFC
  ufc: "mma_mixed_martial_arts",
  mma: "mma_mixed_martial_arts",
  
  // Boxing
  boxing: "boxing_boxing",
  
  // Tennis
  tennis: "tennis_atp_aus_open",
  atp: "tennis_atp_aus_open",
  wta: "tennis_wta_aus_open",
  
  // Golf
  golf: "golf_pga_championship_winner",
  pga: "golf_pga_championship_winner",
  
  // Rugby
  rugby: "rugbyleague_nrl",
  nrl: "rugbyleague_nrl",
  
  // AFL
  afl: "aussierules_afl",
  
  // Cricket
  cricket: "cricket_ipl",
  ipl: "cricket_ipl",
  
  // Table Tennis - map all WTT variants
  tabletennis: "tabletennis_wtt",
  wtt: "tabletennis_wtt",
  wttfeeder: "tabletennis_wtt",
};

// Extract base sport from complex sport names (e.g., "wttfeederantalya" -> "wtt")
function extractBaseSport(sportKey: string): string | null {
  const normalized = sportKey.toLowerCase();
  
  // Table tennis variants
  if (normalized.includes("wtt") || normalized.includes("tabletennis")) {
    return "tabletennis_wtt";
  }
  
  // Tennis variants
  if (normalized.includes("atp") || normalized.includes("wta") || normalized.includes("tennis")) {
    return "tennis_atp_aus_open";
  }
  
  // Soccer/football variants
  if (normalized.includes("soccer") || normalized.includes("football") && !normalized.includes("american")) {
    return "soccer_epl";
  }
  
  // Basketball variants
  if (normalized.includes("basketball") || normalized.includes("nba") || normalized.includes("ncaab")) {
    return "basketball_nba";
  }
  
  // Hockey variants
  if (normalized.includes("hockey") || normalized.includes("nhl")) {
    return "icehockey_nhl";
  }
  
  // Baseball variants
  if (normalized.includes("baseball") || normalized.includes("mlb")) {
    return "baseball_mlb";
  }
  
  // MMA/UFC variants
  if (normalized.includes("ufc") || normalized.includes("mma")) {
    return "mma_mixed_martial_arts";
  }
  
  return null;
}

// Helper to fetch with sport-level caching
async function fetchSportOdds(sportKey: string, apiKey: string): Promise<TheOddsApiGame[]> {
  const cached = sportCache.get(sportKey);
  if (cached && Date.now() - cached.ts < SPORT_CACHE_TTL_MS) {
    console.log(`[lookup-game-odds] Using cached data for ${sportKey}`);
    return cached.games;
  }

  // Check if we're rate limited upstream
  if (upstreamRateLimited && Date.now() < upstreamRateLimitUntil) {
    console.log(`[lookup-game-odds] Upstream rate limited, using stale cache if available`);
    return cached?.games || [];
  }

  const oddsUrl = `https://api.the-odds-api.com/v4/sports/${encodeURIComponent(
    sportKey
  )}/odds/?apiKey=${encodeURIComponent(apiKey)}&regions=us,uk&markets=h2h,spreads,totals&oddsFormat=american`;

  try {
    const resp = await fetch(oddsUrl);
    if (resp.ok) {
      const data = (await resp.json()) as TheOddsApiGame[];
      if (Array.isArray(data)) {
        sportCache.set(sportKey, { games: data, ts: Date.now() });
        upstreamRateLimited = false;
        return data;
      }
    } else if (resp.status === 429) {
      console.log(`[lookup-game-odds] Upstream rate limit hit for ${sportKey}`);
      upstreamRateLimited = true;
      upstreamRateLimitUntil = Date.now() + 60 * 1000; // Back off for 1 minute
      return cached?.games || [];
    } else {
      console.log(`[lookup-game-odds] API error ${resp.status} for ${sportKey}`);
    }
  } catch (e) {
    console.error(`[lookup-game-odds] Fetch error for ${sportKey}:`, e);
  }

  return cached?.games || [];
}

type TheOddsApiGame = {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Array<{
    key: string;
    title: string;
    markets: Array<{
      key: string;
      outcomes: Array<{ name: string; price: number; point?: number }>;
    }>;
  }>;
};

function pickBestMatch(params: {
  games: TheOddsApiGame[];
  homeTeam: string;
  awayTeam: string;
  commenceTime?: string;
}): TheOddsApiGame | null {
  const targetHome = normalizeTeam(params.homeTeam);
  const targetAway = normalizeTeam(params.awayTeam);
  const targetTs = params.commenceTime ? new Date(params.commenceTime).getTime() : NaN;
  const MAX_TIME_DIFF_MS = 36 * 60 * 60 * 1000;

  let best: { score: number; g: TheOddsApiGame } | null = null;

  for (const g of params.games) {
    const h = normalizeTeam(g.home_team);
    const a = normalizeTeam(g.away_team);
    const ts = new Date(g.commence_time).getTime();

    if (Number.isFinite(targetTs) && Number.isFinite(ts) && Math.abs(ts - targetTs) > MAX_TIME_DIFF_MS) {
      continue;
    }

    let score = 0;

    // Exact match
    if (h === targetHome) score += 4;
    if (a === targetAway) score += 4;
    // Swapped
    if (h === targetAway) score += 3;
    if (a === targetHome) score += 3;
    // Partial
    if (score === 0) {
      if (h.includes(targetHome) || targetHome.includes(h)) score += 2;
      if (a.includes(targetAway) || targetAway.includes(a)) score += 2;
      if (h.includes(targetAway) || targetAway.includes(h)) score += 1;
      if (a.includes(targetHome) || targetHome.includes(a)) score += 1;
    }

    if (score > 0 && (!best || score > best.score)) {
      best = { score, g };
    }
  }

  return best?.g ?? null;
}

function buildOdds(game: TheOddsApiGame) {
  const bookmaker = game.bookmakers?.[0];
  if (!bookmaker) return null;

  const h2h = bookmaker.markets?.find((m) => m.key === "h2h");
  const spreads = bookmaker.markets?.find((m) => m.key === "spreads");
  const totals = bookmaker.markets?.find((m) => m.key === "totals");

  const homeH2h = h2h?.outcomes.find((o) => o.name === game.home_team);
  const awayH2h = h2h?.outcomes.find((o) => o.name === game.away_team);
  const homeSpread = spreads?.outcomes.find((o) => o.name === game.home_team);
  const awaySpread = spreads?.outcomes.find((o) => o.name === game.away_team);
  const over = totals?.outcomes.find((o) => o.name === "Over");
  const under = totals?.outcomes.find((o) => o.name === "Under");

  return {
    bookmaker: bookmaker.title,
    moneyline: {
      home: homeH2h?.price ?? 0,
      away: awayH2h?.price ?? 0,
    },
    spread: {
      home: homeSpread?.point ?? 0,
      homeOdds: homeSpread?.price ?? -110,
      away: awaySpread?.point ?? 0,
      awayOdds: awaySpread?.price ?? -110,
    },
    total: {
      line: over?.point ?? 0,
      overOdds: over?.price ?? -110,
      underOdds: under?.price ?? -110,
    },
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientIP = getClientIP(req);
    if (!checkRateLimit(clientIP)) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const API_KEY = Deno.env.get("THE_ODDS_API_KEY");
    if (!API_KEY) {
      console.error("[Internal] THE_ODDS_API_KEY not configured");
      return new Response(JSON.stringify({ error: "Service temporarily unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => null);
    const sportRaw = typeof body?.sport === "string" ? body.sport : "";
    const homeTeam = typeof body?.homeTeam === "string" ? body.homeTeam : "";
    const awayTeam = typeof body?.awayTeam === "string" ? body.awayTeam : "";
    const commenceTime = typeof body?.commenceTime === "string" ? body.commenceTime : undefined;

    if (!homeTeam || !awayTeam) {
      return new Response(JSON.stringify({ error: "Invalid request parameters" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const normalizedSport = normalizeSport(sportRaw);
    // Try direct mapping first, then extract base sport for complex names
    let sportKey = sportKeyMap[normalizedSport] || extractBaseSport(normalizedSport) || normalizedSport;

    // Basic guardrail (avoid garbage inputs)
    if (!sportKey || sportKey.length > 60) {
      return new Response(JSON.stringify({ error: "Invalid sport parameter" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    console.log(`[lookup-game-odds] Sport mapping: "${sportRaw}" -> "${sportKey}"`);
    
    // Check if we have a valid API sport key format (should contain underscore for most sports)
    const isValidApiKey = sportKey.includes("_") || sportKeyMap[sportKey];
    if (!isValidApiKey) {
      // Try to extract base sport one more time
      const baseSport = extractBaseSport(sportRaw);
      if (baseSport) {
        sportKey = baseSport;
        console.log(`[lookup-game-odds] Fallback sport mapping: "${sportRaw}" -> "${sportKey}"`);
      }
    }

    const cacheKey = `${sportKey}:${normalizeTeam(homeTeam)}:${normalizeTeam(awayTeam)}:${commenceTime?.slice(0, 10) ?? ""}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      return new Response(JSON.stringify(cached.data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // For soccer, try multiple leagues as fallback since the exact league may not be known
    const soccerFallbacks = [
      "soccer_efl_champ", // EFL Championship (Southampton, Stoke, etc.)
      "soccer_epl",
      "soccer_spain_la_liga",
      "soccer_germany_bundesliga",
      "soccer_italy_serie_a",
      "soccer_france_ligue_one",
      "soccer_usa_mls",
      "soccer_uefa_champs_league",
      "soccer_uefa_europa_league",
      "soccer_fa_cup",
    ];
    
    const isSoccer = normalizedSport === "soccer" || sportKey.startsWith("soccer_");
    const keysToTry = isSoccer ? [sportKey, ...soccerFallbacks.filter(k => k !== sportKey)] : [sportKey];
    
    let games: TheOddsApiGame[] = [];
    
    // Use the cached sport fetch helper (handles rate limits gracefully)
    for (const key of keysToTry) {
      const sportGames = await fetchSportOdds(key, API_KEY);
      if (sportGames.length > 0) {
        games.push(...sportGames);
      }
      // If we found games with the primary key, no need to try fallbacks
      if (games.length > 0 && key === sportKey) break;
    }
    
    if (games.length === 0) {
      console.log(`[lookup-game-odds] No games found for ${sportKey}`);
      return new Response(JSON.stringify({ error: "No odds available", rateLimited: upstreamRateLimited }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const best = pickBestMatch({ games, homeTeam, awayTeam, commenceTime });
    if (!best) {
      return new Response(JSON.stringify({ error: "No odds available for this event" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const odds = buildOdds(best);
    if (!odds) {
      return new Response(JSON.stringify({ error: "No odds available for this event" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = {
      eventId: best.id,
      sportKey: best.sport_key,
      homeTeam: best.home_team,
      awayTeam: best.away_team,
      commenceTime: best.commence_time,
      odds,
      lastUpdated: new Date().toISOString(),
    };

    cache.set(cacheKey, { data: result, ts: Date.now() });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[Internal] Error in lookup-game-odds function", error);
    return new Response(JSON.stringify({ error: "Service temporarily unavailable" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
