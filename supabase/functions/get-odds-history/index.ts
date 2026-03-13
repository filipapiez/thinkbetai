import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function getSupabaseAdmin() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
}

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 min cache

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const API_KEY = Deno.env.get('THE_ODDS_API_KEY');
    if (!API_KEY) {
      return new Response(
        JSON.stringify({ snapshots: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { eventId, sportKey } = body;

    if (!eventId || !sportKey) {
      return new Response(
        JSON.stringify({ snapshots: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const sb = getSupabaseAdmin();
    const cacheKey = `odds-history:${eventId}`;

    // Check cache
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

    // Fetch historical odds by querying at different time offsets
    // The Odds API historical endpoint: /v4/historical/sports/{sport}/odds/
    const snapshots: Array<{
      timestamp: string;
      bookmaker: string;
      homeML: number;
      awayML: number;
      spread: number;
      total: number;
    }> = [];

    // Try to get historical data at multiple time points (past 3 days)
    const now = new Date();
    const timePoints = [
      new Date(now.getTime() - 72 * 60 * 60 * 1000), // 3 days ago
      new Date(now.getTime() - 48 * 60 * 60 * 1000), // 2 days ago
      new Date(now.getTime() - 24 * 60 * 60 * 1000), // 1 day ago
      new Date(now.getTime() - 12 * 60 * 60 * 1000), // 12 hours ago
      new Date(now.getTime() - 6 * 60 * 60 * 1000),  // 6 hours ago
      new Date(now.getTime() - 3 * 60 * 60 * 1000),  // 3 hours ago
      new Date(now.getTime() - 1 * 60 * 60 * 1000),  // 1 hour ago
      now, // current
    ];

    for (const tp of timePoints) {
      try {
        const dateStr = tp.toISOString().replace(/\.\d{3}Z$/, 'Z');
        const url = `https://api.the-odds-api.com/v4/historical/sports/${encodeURIComponent(sportKey)}/odds/?apiKey=${API_KEY}&regions=us&markets=h2h,spreads,totals&oddsFormat=american&date=${dateStr}`;

        const res = await fetch(url);
        if (!res.ok) {
          // Historical endpoint may not be available on all plans
          if (res.status === 422 || res.status === 403 || res.status === 401) {
            console.log(`[odds-history] Historical endpoint not available (${res.status}), using current data only`);
            break;
          }
          continue;
        }

        const data = await res.json();
        const games = data?.data || data;
        if (!Array.isArray(games)) continue;

        // Find our event
        const event = games.find((g: any) => g.id === eventId);
        if (!event || !event.bookmakers || event.bookmakers.length === 0) continue;

        const bk = event.bookmakers[0];
        const h2h = bk.markets?.find((m: any) => m.key === 'h2h');
        const spreads = bk.markets?.find((m: any) => m.key === 'spreads');
        const totals = bk.markets?.find((m: any) => m.key === 'totals');

        const homeH2h = h2h?.outcomes?.find((o: any) => o.name === event.home_team);
        const awayH2h = h2h?.outcomes?.find((o: any) => o.name === event.away_team);
        const homeSpread = spreads?.outcomes?.find((o: any) => o.name === event.home_team);
        const over = totals?.outcomes?.find((o: any) => o.name === 'Over');

        snapshots.push({
          timestamp: data?.timestamp || tp.toISOString(),
          bookmaker: bk.title || bk.key,
          homeML: homeH2h?.price || 0,
          awayML: awayH2h?.price || 0,
          spread: homeSpread?.point || 0,
          total: over?.point || 0,
        });
      } catch (e) {
        console.error(`[odds-history] Error at ${tp.toISOString()}:`, e);
      }

      // Small delay between requests
      await new Promise(r => setTimeout(r, 200));
    }

    // Deduplicate by values (remove consecutive identical snapshots)
    const deduped = snapshots.filter((s, i) => {
      if (i === 0) return true;
      const prev = snapshots[i - 1];
      return s.homeML !== prev.homeML || s.awayML !== prev.awayML || 
             s.spread !== prev.spread || s.total !== prev.total;
    });

    const result = { snapshots: deduped };

    // Cache the result
    if (deduped.length > 0) {
      await sb.from('odds_cache').upsert({
        id: cacheKey,
        data: result,
        expires_at: new Date(Date.now() + CACHE_TTL_MS).toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[odds-history] Error:', error);
    return new Response(
      JSON.stringify({ snapshots: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
