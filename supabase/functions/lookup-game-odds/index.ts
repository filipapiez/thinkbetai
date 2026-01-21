import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting (per IP)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 30;
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

// Simple in-memory cache to reduce upstream calls
const cache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

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

const sportKeyMap: Record<string, string> = {
  nba: "basketball_nba",
  nfl: "americanfootball_nfl",
  mlb: "baseball_mlb",
  nhl: "icehockey_nhl",
  ncaab: "basketball_ncaab",
  ncaaf: "americanfootball_ncaaf",
  wnba: "basketball_wnba",
  epl: "soccer_epl",
  mls: "soccer_usa_mls",
  ucl: "soccer_uefa_champs_league",
  ufc: "mma_mixed_martial_arts",
  mma: "mma_mixed_martial_arts",
};

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
    const sportKey = sportKeyMap[normalizedSport] || normalizedSport;

    // Basic guardrail (avoid garbage inputs)
    if (!sportKey || sportKey.length > 60) {
      return new Response(JSON.stringify({ error: "Invalid sport parameter" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cacheKey = `${sportKey}:${normalizeTeam(homeTeam)}:${normalizeTeam(awayTeam)}:${commenceTime?.slice(0, 10) ?? ""}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      return new Response(JSON.stringify(cached.data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const oddsUrl = `https://api.the-odds-api.com/v4/sports/${encodeURIComponent(
      sportKey,
    )}/odds/?apiKey=${encodeURIComponent(API_KEY)}&regions=us&markets=h2h,spreads,totals&oddsFormat=american`;

    const resp = await fetch(oddsUrl);
    if (!resp.ok) {
      console.error(`[Internal] The Odds API error: ${resp.status}`);
      return new Response(JSON.stringify({ error: "Service temporarily unavailable" }), {
        status: resp.status === 429 ? 429 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const games = (await resp.json()) as TheOddsApiGame[];
    if (!Array.isArray(games) || games.length === 0) {
      return new Response(JSON.stringify({ error: "No odds available" }), {
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
