import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const sportKeyMap: Record<string, string> = {
  nba: 'basketball_nba',
  nfl: 'americanfootball_nfl',
  mlb: 'baseball_mlb',
  nhl: 'icehockey_nhl',
  ncaab: 'basketball_ncaab',
  ncaaf: 'americanfootball_ncaaf',
  wnba: 'basketball_wnba',
  epl: 'soccer_epl',
  mls: 'soccer_usa_mls',
};

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
    console.error('[game-totals-cache] write error', e);
  }
}

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const API_KEY = Deno.env.get('THE_ODDS_API_KEY');
    if (!API_KEY) {
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const sport = (url.searchParams.get('sport') || 'nba').toLowerCase();
    const oddsApiSport = sportKeyMap[sport];

    if (!oddsApiSport) {
      return new Response(
        JSON.stringify({ error: 'Unsupported sport' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check DB cache
    const cacheKey = `game-totals:${sport}`;
    const cached = await getDbCache(cacheKey);
    if (cached) {
      console.log(`[game-totals] Cache hit for ${sport}`);
      return new Response(JSON.stringify(cached), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[game-totals] Fetching from The Odds API: ${oddsApiSport}`);

    const apiUrl = `https://api.the-odds-api.com/v4/sports/${oddsApiSport}/odds/?apiKey=${API_KEY}&regions=us&markets=totals,h2h&oddsFormat=american`;

    const response = await fetch(apiUrl);

    if (!response.ok) {
      console.error(`[game-totals] API error: ${response.status}`);
      return new Response(
        JSON.stringify({ games: [], error: `API error ${response.status}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const events = await response.json();
    const remaining = response.headers.get('x-requests-remaining');
    console.log(`[game-totals] Got ${events.length} events, remaining requests: ${remaining}`);

    const games = events.map((event: any) => {
      let totalOver = 0, totalOverOdds = 0, totalUnder = 0, totalUnderOdds = 0;
      let mlHome = 0, mlAway = 0;

      // Use first bookmaker with totals
      for (const bm of (event.bookmakers || [])) {
        for (const market of (bm.markets || [])) {
          if (market.key === 'totals' && totalOver === 0) {
            for (const outcome of (market.outcomes || [])) {
              if (outcome.name === 'Over') {
                totalOver = outcome.point || 0;
                totalOverOdds = outcome.price || -110;
              } else if (outcome.name === 'Under') {
                totalUnder = outcome.point || 0;
                totalUnderOdds = outcome.price || -110;
              }
            }
          }
          if (market.key === 'h2h' && mlHome === 0) {
            for (const outcome of (market.outcomes || [])) {
              if (outcome.name === event.home_team) mlHome = outcome.price || 0;
              else if (outcome.name === event.away_team) mlAway = outcome.price || 0;
            }
          }
        }
        if (totalOver > 0 && mlHome !== 0) break;
      }

      return {
        id: event.id,
        sportKey: event.sport_key,
        sportTitle: event.sport_title,
        commenceTime: event.commence_time,
        homeTeam: event.home_team,
        awayTeam: event.away_team,
        total: { over: totalOver, overOdds: totalOverOdds, under: totalUnder, underOdds: totalUnderOdds },
        moneyline: { home: mlHome, away: mlAway },
        hasTotals: totalOver > 0,
      };
    }).filter((g: any) => g.hasTotals);

    const payload = {
      games,
      remainingRequests: remaining ? parseInt(remaining) : null,
      lastUpdated: new Date().toISOString(),
    };

    // Cache result
    await setDbCache(cacheKey, payload, CACHE_TTL_MS);

    return new Response(JSON.stringify(payload), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[game-totals] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Service temporarily unavailable' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
