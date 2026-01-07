import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting (per IP, per minute)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 30; // 30 requests per minute
const RATE_WINDOW_MS = 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW_MS });
    return true;
  }
  
  if (record.count >= RATE_LIMIT) {
    return false;
  }
  
  record.count++;
  return true;
}

// Cache for odds (5 minute TTL)
const oddsCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000;

// Daily usage tracking (resets at midnight UTC)
const dailyUsage = new Map<string, { count: number; date: string }>();

const DAILY_LIMITS: Record<string, number> = {
  basic: 10,
  pro: 30,
  insider: 100,
};

// Allowed plans whitelist
const ALLOWED_PLANS = ['basic', 'pro', 'insider'];

// Allowed sport keys (whitelist based on The Odds API)
const ALLOWED_SPORT_KEYS = [
  'americanfootball_nfl', 'americanfootball_ncaaf',
  'basketball_nba', 'basketball_ncaab',
  'baseball_mlb',
  'icehockey_nhl',
  'soccer_epl', 'soccer_usa_mls', 'soccer_uefa_champs_league',
  'mma_mixed_martial_arts',
  'tennis_atp_aus_open', 'tennis_wta_aus_open',
  'boxing_boxing',
  'golf_pga_championship',
];

// Input validation
function validateEventId(eventId: unknown): string | null {
  if (typeof eventId !== 'string') return null;
  // Event IDs are typically alphanumeric with possible dashes/underscores
  const sanitized = eventId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 100);
  if (sanitized.length < 2) return null;
  return sanitized;
}

function validateSportKey(sportKey: unknown): string | null {
  if (typeof sportKey !== 'string') return null;
  const normalized = sportKey.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 50);
  // Allow known sport keys or patterns matching the API format
  if (ALLOWED_SPORT_KEYS.includes(normalized) || /^[a-z]+_[a-z_]+$/.test(normalized)) {
    return normalized;
  }
  return null;
}

function validatePlan(plan: unknown): string {
  if (typeof plan !== 'string') return 'basic';
  const normalized = plan.toLowerCase().replace(/[^a-z]/g, '');
  return ALLOWED_PLANS.includes(normalized) ? normalized : 'basic';
}

function validateUserId(userId: unknown): string {
  if (typeof userId !== 'string') return 'anonymous';
  // Sanitize user ID, limit length
  return userId.replace(/[^a-zA-Z0-9_@.-]/g, '').slice(0, 100) || 'anonymous';
}

interface OddsResponse {
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
      outcomes: Array<{
        name: string;
        price: number;
        point?: number;
      }>;
    }>;
  }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('cf-connecting-ip') || 
                     'unknown';
    
    if (!checkRateLimit(clientIP)) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const API_KEY = Deno.env.get('THE_ODDS_API_KEY');
    if (!API_KEY) {
      console.error('[Internal] THE_ODDS_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Service temporarily unavailable' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    
    // Validate inputs
    const eventId = validateEventId(body.eventId);
    const sportKey = validateSportKey(body.sportKey);
    const plan = validatePlan(body.plan);
    const userId = validateUserId(body.userId);

    if (!eventId || !sportKey) {
      return new Response(
        JSON.stringify({ error: 'Invalid request parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check daily usage limit
    const today = new Date().toISOString().split('T')[0];
    const userKey = `${userId}_${clientIP}`;
    const userUsage = dailyUsage.get(userKey);
    const dailyLimit = DAILY_LIMITS[plan] || DAILY_LIMITS.basic;

    if (userUsage && userUsage.date === today && userUsage.count >= dailyLimit) {
      return new Response(
        JSON.stringify({ 
          error: 'Daily odds lookup limit reached',
          limit: dailyLimit,
          used: userUsage.count,
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check cache first
    const cacheKey = `${eventId}`;
    const cached = oddsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`Returning cached odds for event ${eventId}`);
      return new Response(
        JSON.stringify({
          ...cached.data,
          cached: true,
          cacheAge: Math.round((Date.now() - cached.timestamp) / 1000),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching odds for event ${eventId} in sport ${sportKey}`);

    // Fetch odds for this specific event
    const oddsUrl = `https://api.the-odds-api.com/v4/sports/${encodeURIComponent(sportKey)}/odds/?apiKey=${encodeURIComponent(API_KEY)}&regions=us&markets=h2h,spreads,totals&oddsFormat=american&eventIds=${encodeURIComponent(eventId)}`;
    
    const response = await fetch(oddsUrl);

    if (!response.ok) {
      console.error(`[Internal] The Odds API error: ${response.status}`);

      if (response.status === 401) {
        return new Response(
          JSON.stringify({ error: 'Service configuration error' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Service temporarily busy' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Service temporarily unavailable' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const remainingRequests = response.headers.get('x-requests-remaining');
    const games: OddsResponse[] = await response.json();

    // Update daily usage
    if (userUsage && userUsage.date === today) {
      dailyUsage.set(userKey, { count: userUsage.count + 1, date: today });
    } else {
      dailyUsage.set(userKey, { count: 1, date: today });
    }

    if (games.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'No odds available for this event',
          eventId,
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const game = games[0];
    const bookmaker = game.bookmakers[0];

    // Transform odds data
    let odds = null;
    if (bookmaker) {
      const h2hMarket = bookmaker.markets.find(m => m.key === 'h2h');
      const spreadsMarket = bookmaker.markets.find(m => m.key === 'spreads');
      const totalsMarket = bookmaker.markets.find(m => m.key === 'totals');

      const homeH2h = h2hMarket?.outcomes.find(o => o.name === game.home_team);
      const awayH2h = h2hMarket?.outcomes.find(o => o.name === game.away_team);
      const homeSpread = spreadsMarket?.outcomes.find(o => o.name === game.home_team);
      const awaySpread = spreadsMarket?.outcomes.find(o => o.name === game.away_team);
      const over = totalsMarket?.outcomes.find(o => o.name === 'Over');
      const under = totalsMarket?.outcomes.find(o => o.name === 'Under');

      odds = {
        bookmaker: bookmaker.title,
        moneyline: {
          home: homeH2h?.price || 0,
          away: awayH2h?.price || 0,
        },
        spread: {
          home: homeSpread?.point || 0,
          homeOdds: homeSpread?.price || -110,
          away: awaySpread?.point || 0,
          awayOdds: awaySpread?.price || -110,
        },
        total: {
          line: over?.point || 0,
          overOdds: over?.price || -110,
          underOdds: under?.price || -110,
        },
        impliedProb: {
          home: homeH2h ? calculateImpliedProb(homeH2h.price) : 50,
          away: awayH2h ? calculateImpliedProb(awayH2h.price) : 50,
        },
      };
    }

    const result = {
      eventId,
      homeTeam: game.home_team,
      awayTeam: game.away_team,
      commenceTime: game.commence_time,
      odds,
      availableBookmakers: game.bookmakers.map(b => b.title),
      remainingRequests: remainingRequests ? parseInt(remainingRequests) : null,
      lastUpdated: new Date().toISOString(),
    };

    // Cache the result
    oddsCache.set(cacheKey, { data: result, timestamp: Date.now() });

    const currentUsage = dailyUsage.get(userKey);
    console.log(`Returning odds for event ${eventId}, daily usage: ${currentUsage?.count}/${dailyLimit}`);

    return new Response(
      JSON.stringify({
        ...result,
        cached: false,
        dailyUsage: {
          used: currentUsage?.count || 1,
          limit: dailyLimit,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Internal] Error in get-game-odds function');
    return new Response(
      JSON.stringify({ error: 'Service temporarily unavailable' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Convert American odds to implied probability
function calculateImpliedProb(americanOdds: number): number {
  if (americanOdds > 0) {
    return (100 / (americanOdds + 100)) * 100;
  } else {
    return (Math.abs(americanOdds) / (Math.abs(americanOdds) + 100)) * 100;
  }
}
