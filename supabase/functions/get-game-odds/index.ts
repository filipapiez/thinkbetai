import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Cache for odds (5 minute TTL)
const oddsCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Daily usage tracking (resets at midnight UTC)
const dailyUsage = new Map<string, { count: number; date: string }>();

const DAILY_LIMITS = {
  basic: 10,
  pro: 30,
  insider: 100,
};

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
    const API_KEY = Deno.env.get('THE_ODDS_API_KEY');
    if (!API_KEY) {
      console.error('THE_ODDS_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { eventId, sportKey, plan = 'basic', userId = 'anonymous' } = await req.json();

    if (!eventId || !sportKey) {
      return new Response(
        JSON.stringify({ error: 'eventId and sportKey are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check daily usage limit
    const today = new Date().toISOString().split('T')[0];
    const userUsage = dailyUsage.get(userId);
    const dailyLimit = DAILY_LIMITS[plan as keyof typeof DAILY_LIMITS] || DAILY_LIMITS.basic;

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
    const oddsUrl = `https://api.the-odds-api.com/v4/sports/${sportKey}/odds/?apiKey=${API_KEY}&regions=us&markets=h2h,spreads,totals&oddsFormat=american&eventIds=${eventId}`;
    
    const response = await fetch(oddsUrl);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`The Odds API error: ${response.status} - ${errorText}`);

      if (response.status === 401) {
        return new Response(
          JSON.stringify({ error: 'Invalid API key' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'API rate limit exceeded' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Failed to fetch odds' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const remainingRequests = response.headers.get('x-requests-remaining');
    const games: OddsResponse[] = await response.json();

    // Update daily usage
    if (userUsage && userUsage.date === today) {
      dailyUsage.set(userId, { count: userUsage.count + 1, date: today });
    } else {
      dailyUsage.set(userId, { count: 1, date: today });
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
        // Calculate implied probabilities
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

    console.log(`Returning odds for event ${eventId}, daily usage: ${dailyUsage.get(userId)?.count}/${dailyLimit}`);

    return new Response(
      JSON.stringify({
        ...result,
        cached: false,
        dailyUsage: {
          used: dailyUsage.get(userId)?.count || 1,
          limit: dailyLimit,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-game-odds function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
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
