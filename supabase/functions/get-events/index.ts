import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Plan-based limits
const PLAN_LIMITS = {
  basic: 50,
  pro: 100,
  insider: 250,
};

// Cache for events (10 minute TTL)
const eventCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// Map sport IDs to The Odds API sport keys
const sportKeyMap: Record<string, string[]> = {
  'nfl': ['americanfootball_nfl'],
  'nba': ['basketball_nba'],
  'mlb': ['baseball_mlb'],
  'nhl': ['icehockey_nhl'],
  'ncaaf': ['americanfootball_ncaaf'],
  'ncaab': ['basketball_ncaab'],
  'soccer': ['soccer_epl', 'soccer_usa_mls', 'soccer_uefa_champs_league'],
  'mma': ['mma_mixed_martial_arts'],
  'tennis': ['tennis_atp_aus_open', 'tennis_wta_aus_open'],
  'boxing': ['boxing_boxing'],
  'golf': ['golf_pga_championship'],
  'nascar': [], // Not directly supported
  'esports': [], // Not directly supported
  'table-tennis': [], // Limited support
};

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
    const API_KEY = Deno.env.get('THE_ODDS_API_KEY');
    if (!API_KEY) {
      console.error('THE_ODDS_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const sport = url.searchParams.get('sport') || 'all';
    const plan = (url.searchParams.get('plan') || 'basic') as keyof typeof PLAN_LIMITS;
    const dateFilter = url.searchParams.get('date') || 'next7d';
    const forceRefresh = url.searchParams.get('refresh') === 'true';

    const planLimit = PLAN_LIMITS[plan] || PLAN_LIMITS.basic;
    const cacheKey = `${sport}-${dateFilter}`;

    // Check cache unless force refresh
    if (!forceRefresh) {
      const cached = eventCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log(`Returning cached events for ${cacheKey}`);
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

    // Determine which sports to fetch
    let sportsToFetch: string[] = [];
    if (sport === 'all') {
      // Fetch from major sports
      sportsToFetch = [
        'americanfootball_nfl',
        'basketball_nba',
        'baseball_mlb',
        'icehockey_nhl',
        'americanfootball_ncaaf',
        'basketball_ncaab',
        'soccer_epl',
        'mma_mixed_martial_arts',
      ];
    } else {
      sportsToFetch = sportKeyMap[sport.toLowerCase()] || [];
    }

    if (sportsToFetch.length === 0) {
      return new Response(
        JSON.stringify({ games: [], total: 0, planLimit, error: 'No sports configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching events for sports: ${sportsToFetch.join(', ')}`);

    const allGames: TransformedGame[] = [];
    let remainingRequests: number | null = null;

    // Fetch events from each sport until we hit the plan limit
    for (const sportKey of sportsToFetch) {
      if (allGames.length >= planLimit * 1.5) break; // Fetch a bit more than needed for filtering

      try {
        const eventsUrl = `https://api.the-odds-api.com/v4/sports/${sportKey}/events?apiKey=${API_KEY}`;
        const response = await fetch(eventsUrl);

        if (!response.ok) {
          console.error(`Failed to fetch ${sportKey}: ${response.status}`);
          continue;
        }

        remainingRequests = parseInt(response.headers.get('x-requests-remaining') || '0');
        const events: EventResponse[] = await response.json();

        // Transform events
        for (const event of events) {
          const now = new Date();
          const eventDate = new Date(event.commence_time);
          
          // Apply date filter
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
        console.error(`Error fetching ${sportKey}:`, err);
      }
    }

    // Sort by start time
    allGames.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    // Cache the full results
    eventCache.set(cacheKey, { data: allGames, timestamp: Date.now() });

    // Return limited by plan
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
    console.error('[Internal] Error in get-events function:', error);
    return new Response(
      JSON.stringify({ error: 'Service temporarily unavailable' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
