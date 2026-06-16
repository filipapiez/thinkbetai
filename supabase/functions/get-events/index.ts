import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting (per user, per minute)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 30; // 30 requests per minute
const RATE_WINDOW_MS = 60 * 1000;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(userId);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_WINDOW_MS });
    return true;
  }
  
  if (record.count >= RATE_LIMIT) {
    return false;
  }
  
  record.count++;
  return true;
}

// Authentication helper
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
  const { data, error } = await supabase.auth.getUser(token);
  
  if (error || !data?.user) {
    return null;
  }

  return { userId: data.user.id };
}

// Plan-based limits (Basic: 30, Pro: 90, Insider: unlimited)
const PLAN_LIMITS: Record<string, number> = {
  basic: 30,
  pro: 90,
  insider: 999999, // Unlimited
};

// Allowed date filters
const ALLOWED_DATE_FILTERS = ['today', 'tomorrow', 'next24h', 'next7d', 'nextMonth'];

// 15+ Sports whitelist
const sportKeyMap: Record<string, string[]> = {
  'nfl': ['americanfootball_nfl'],
  'nba': ['basketball_nba'],
  'mlb': ['baseball_mlb'],
  'nhl': ['icehockey_nhl'],
  'ncaaf': ['americanfootball_ncaaf'],
  'ncaab': ['basketball_ncaab'],
  'soccer': ['soccer_epl', 'soccer_usa_mls', 'soccer_uefa_champs_league', 'soccer_spain_la_liga', 'soccer_germany_bundesliga', 'soccer_italy_serie_a'],
  'mma': ['mma_mixed_martial_arts'],
  'tennis': ['tennis_atp_aus_open_singles', 'tennis_atp_french_open', 'tennis_atp_us_open', 'tennis_atp_wimbledon', 'tennis_wta_aus_open_singles', 'tennis_wta_french_open', 'tennis_wta_us_open', 'tennis_wta_wimbledon', 'tennis_atp_canadian_open', 'tennis_atp_china_open', 'tennis_atp_indian_wells', 'tennis_atp_miami_open', 'tennis_atp_madrid_open', 'tennis_atp_rome', 'tennis_atp_shanghai', 'tennis_atp_cincinnati_open', 'tennis_wta_canadian_open', 'tennis_wta_china_open', 'tennis_wta_indian_wells', 'tennis_wta_miami_open', 'tennis_wta_madrid_open', 'tennis_wta_rome', 'tennis_wta_wuhan_open'],
  'boxing': ['boxing_boxing'],
  'golf': ['golf_pga_championship', 'golf_masters_tournament'],
  'cricket': ['cricket_ipl', 'cricket_international_t20'],
  'rugby': ['rugbyleague_nrl', 'rugbyunion_six_nations'],
  'motorsport': ['motorsport_formula_one'],
  'esports': ['esports_lol', 'esports_csgo'],
  'handball': ['handball_ehf_champions_league'],
  'volleyball': ['volleyball_fivb'],
  'cycling': ['cycling_tour_de_france'],
};

// Validate inputs
function validateSport(sport: string | null): string {
  if (!sport || sport === 'all') return 'all';
  const normalized = sport.toLowerCase().replace(/[^a-z0-9-]/g, '');
  if (normalized.length > 20) return 'all';
  return sportKeyMap[normalized] ? normalized : 'all';
}

function validatePlan(plan: string | null): keyof typeof PLAN_LIMITS {
  if (!plan) return 'basic';
  const normalized = plan.toLowerCase().replace(/[^a-z]/g, '');
  return PLAN_LIMITS[normalized] ? normalized as keyof typeof PLAN_LIMITS : 'basic';
}

function validateDateFilter(dateFilter: string | null): string {
  if (!dateFilter) return 'next7d';
  const normalized = dateFilter.toLowerCase().replace(/[^a-z0-9]/g, '');
  return ALLOWED_DATE_FILTERS.includes(normalized) ? normalized : 'next7d';
}

// Cache for events (10 minute TTL)
const eventCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 10 * 60 * 1000;

interface EventResponse {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
}

interface TransformedGame {
  id: string;
  sport: string;
  sportKey: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string;
  status: 'scheduled' | 'live';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const auth = await authenticateUser(req);
    if (!auth) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limiting by user ID
    if (!checkRateLimit(auth.userId)) {
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

    const url = new URL(req.url);
    const sport = validateSport(url.searchParams.get('sport'));
    const plan = validatePlan(url.searchParams.get('plan'));
    const dateFilter = validateDateFilter(url.searchParams.get('date'));
    const forceRefresh = url.searchParams.get('refresh') === 'true';

    const planLimit = PLAN_LIMITS[plan] || PLAN_LIMITS.basic;
    const cacheKey = `${sport}-${dateFilter}`;

    // Check cache unless force refresh
    if (!forceRefresh) {
      const cached = eventCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log(`Returning cached events for ${cacheKey} (user: ${auth.userId})`);
        const limitedGames = cached.data.slice(0, planLimit);
        return new Response(
          JSON.stringify({
            games: limitedGames,
            total: cached.data.length,
            planLimit,
            cached: true,
            cacheAge: Math.round((Date.now() - cached.timestamp) / 1000),
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Determine which sports to fetch (15+ sports)
    let sportsToFetch: string[] = [];
    if (sport === 'all') {
      sportsToFetch = [
        // Major US Sports
        'americanfootball_nfl',
        'americanfootball_ncaaf',
        'basketball_nba',
        'basketball_ncaab',
        'baseball_mlb',
        'icehockey_nhl',
        // Combat Sports
        'mma_mixed_martial_arts',
        'boxing_boxing',
        // Soccer (expanded leagues + FIFA World Cup 2026)
        'soccer_fifa_world_cup',
        'soccer_fifa_world_cup_qualifiers_europe',
        'soccer_fifa_world_cup_qualifiers_south_america',
        'soccer_uefa_champs_league',
        'soccer_uefa_europa_league',
        'soccer_uefa_europa_conference_league',
        'soccer_epl',
        'soccer_efl_champ',
        'soccer_england_league1',
        'soccer_usa_mls',
        'soccer_spain_la_liga',
        'soccer_spain_segunda_division',
        'soccer_germany_bundesliga',
        'soccer_germany_bundesliga2',
        'soccer_italy_serie_a',
        'soccer_italy_serie_b',
        'soccer_france_ligue_one',
        'soccer_france_ligue_two',
        'soccer_portugal_primeira_liga',
        'soccer_netherlands_eredivisie',
        'soccer_turkey_super_league',
        'soccer_mexico_ligamx',
        'soccer_brazil_campeonato',
        'soccer_argentina_primera_division',
        // Tennis
        'tennis_atp_aus_open',
        'tennis_wta_aus_open',
        // Golf
        'golf_pga_championship',
        // Rugby
        'rugbyleague_nrl',
        // Cricket
        'cricket_ipl',
        // Motorsport
        'motorsport_formula_one',
        // Esports
        'esports_lol',
      ];
    } else {
      sportsToFetch = sportKeyMap[sport] || [];
    }

    if (sportsToFetch.length === 0) {
      return new Response(
        JSON.stringify({ games: [], total: 0, planLimit, error: 'No sports configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`User ${auth.userId} fetching events for sports: ${sportsToFetch.join(', ')}`);

    const allGames: TransformedGame[] = [];
    let remainingRequests: number | null = null;

    for (const sportKey of sportsToFetch) {
      // Only short-circuit fetching for short windows; for nextMonth we need everything.
      if (dateFilter !== 'nextMonth' && allGames.length >= planLimit * 1.5) break;

      try {
        const eventsUrl = `https://api.the-odds-api.com/v4/sports/${encodeURIComponent(sportKey)}/events?apiKey=${encodeURIComponent(API_KEY)}`;
        const response = await fetch(eventsUrl);

        if (!response.ok) {
          console.error(`Failed to fetch ${sportKey}: ${response.status}`);
          continue;
        }

        remainingRequests = parseInt(response.headers.get('x-requests-remaining') || '0');
        const events: EventResponse[] = await response.json();

        for (const event of events) {
          const now = new Date();
          const eventDate = new Date(event.commence_time);
          
          let includeEvent = false;
          const daysDiff = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
          
          switch (dateFilter) {
            case 'today':
              includeEvent = daysDiff >= 0 && daysDiff < 1;
              break;
            case 'tomorrow':
              includeEvent = daysDiff >= 1 && daysDiff < 2;
              break;
            case 'next24h':
              includeEvent = daysDiff >= 0 && daysDiff < 1;
              break;
            case 'next7d':
              includeEvent = daysDiff >= 0 && daysDiff < 7;
              break;
            case 'nextMonth':
              includeEvent = daysDiff >= 0 && daysDiff < 30;
              break;
            default:
              includeEvent = daysDiff >= 0 && daysDiff < 7;
          }

          if (includeEvent) {
            allGames.push({
              id: event.id,
              sport: sportKey.split('_')[0],
              sportKey: event.sport_key,
              homeTeam: event.home_team,
              awayTeam: event.away_team,
              startTime: event.commence_time,
              status: eventDate <= now ? 'live' : 'scheduled',
            });
          }
        }

        console.log(`Fetched ${events.length} events from ${sportKey}, total: ${allGames.length}`);
      } catch (err) {
        console.error(`[Internal] Error fetching ${sportKey}`);
      }
    }

    allGames.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    eventCache.set(cacheKey, { data: allGames, timestamp: Date.now() });

    const limitedGames = allGames.slice(0, planLimit);

    console.log(`Returning ${limitedGames.length} of ${allGames.length} games (plan limit: ${planLimit})`);

    return new Response(
      JSON.stringify({
        games: limitedGames,
        total: allGames.length,
        planLimit,
        remainingRequests,
        cached: false,
        lastUpdated: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Internal] Error in get-events function');
    return new Response(
      JSON.stringify({ error: 'Service temporarily unavailable' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});