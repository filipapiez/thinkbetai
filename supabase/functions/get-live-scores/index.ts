import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// DB cache helpers
function getSupabaseAdmin() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
}

const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes for live scores

const sportLabelMap: Record<string, string> = {
  basketball_nba: 'NBA',
  americanfootball_nfl: 'NFL',
  baseball_mlb: 'MLB',
  icehockey_nhl: 'NHL',
  soccer_epl: 'EPL',
  mma_mixed_martial_arts: 'MMA',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const API_KEY = Deno.env.get('THE_ODDS_API_KEY');
    if (!API_KEY) {
      return new Response(
        JSON.stringify({ games: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const sport = body.sport || 'basketball_nba';

    // Check DB cache
    const cacheKey = `live-scores:${sport}`;
    const sb = getSupabaseAdmin();
    const { data: cached } = await sb
      .from('odds_cache')
      .select('data, expires_at')
      .eq('id', cacheKey)
      .single();

    if (cached && new Date(cached.expires_at) > new Date()) {
      return new Response(JSON.stringify(cached.data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch from The Odds API
    const url = `https://api.the-odds-api.com/v4/sports/${encodeURIComponent(sport)}/scores/?apiKey=${API_KEY}&daysFrom=1&dateFormat=iso`;
    const res = await fetch(url);

    if (!res.ok) {
      console.error(`[live-scores] API error: ${res.status}`);
      return new Response(
        JSON.stringify({ games: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await res.json();
    if (!Array.isArray(data)) {
      return new Response(
        JSON.stringify({ games: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const games = data.map((game: any) => {
      const homeScore = game.scores?.find((s: any) => s.name === game.home_team);
      const awayScore = game.scores?.find((s: any) => s.name === game.away_team);

      return {
        id: game.id,
        homeTeam: game.home_team,
        awayTeam: game.away_team,
        homeScore: homeScore ? parseInt(homeScore.score) : null,
        awayScore: awayScore ? parseInt(awayScore.score) : null,
        completed: game.completed || false,
        sport: sportLabelMap[sport] || sport,
        commenceTime: game.commence_time,
      };
    });

    const result = { games, lastUpdated: new Date().toISOString() };

    // Cache for 2 minutes
    await sb.from('odds_cache').upsert({
      id: cacheKey,
      data: result,
      expires_at: new Date(Date.now() + CACHE_TTL_MS).toISOString(),
      updated_at: new Date().toISOString(),
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[live-scores] Error:', error);
    return new Response(
      JSON.stringify({ games: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
