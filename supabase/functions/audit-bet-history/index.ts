import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAdminOrCron, unauthorizedResponse } from "../_shared/adminAuth.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SOCCER_LEAGUES = [
  'eng.1', 'esp.1', 'uefa.champions', 'uefa.europa', 'usa.1', 'ger.1', 'ita.1', 'fra.1',
  'eng.2', 'esp.2', 'por.1', 'ned.1', 'tur.1', 'sco.1', 'bra.1', 'arg.1',
];

function normalizeTeam(name: string): string {
  return name.toLowerCase()
    .replace(/fc |cf |afc |sc |rc |ac |as |fk |bsc |sv |vfb |rb |tsv |1\. /g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function teamsMatch(t1: string, t2: string): boolean {
  const n1 = normalizeTeam(t1);
  const n2 = normalizeTeam(t2);
  if (n1 === n2) return true;
  if (n1.includes(n2) || n2.includes(n1)) return true;
  const last1 = n1.split(' ').pop() || '';
  const last2 = n2.split(' ').pop() || '';
  if (last1.length > 3 && last1 === last2) return true;
  return false;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const auth = await requireAdminOrCron(req);
  if (!auth.ok) return unauthorizedResponse(auth, corsHeaders);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { daysBack = 60 } = await req.json().catch(() => ({}));

    // Get soccer bets from the specified period
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);
    const cutoffStr = cutoffDate.toISOString().split('T')[0];

    const { data: soccerBets, error: fetchErr } = await supabase
      .from('historical_bets')
      .select('*')
      .eq('sport', 'Soccer')
      .gte('date', cutoffStr)
      .order('date', { ascending: false });

    if (fetchErr) throw fetchErr;
    console.log(`Found ${soccerBets?.length || 0} soccer bets in last ${daysBack} days`);

    if (!soccerBets || soccerBets.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No soccer bets to check', deleted: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch draws from ESPN - one call per league covering the date range
    const startStr = cutoffStr.replace(/-/g, '');
    const endStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    
    const draws: Array<{ homeTeam: string; awayTeam: string; date: string; score: string }> = [];

    for (const league of SOCCER_LEAGUES) {
      try {
        const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/${league}/scoreboard?dates=${startStr}-${endStr}&limit=200`;
        const resp = await fetch(url);
        if (!resp.ok) continue;
        const data = await resp.json();

        for (const event of (data.events || [])) {
          if (!event.status?.type?.completed) continue;
          const comp = event.competitions?.[0];
          if (!comp?.competitors?.length) continue;
          const home = comp.competitors.find((c: any) => c.homeAway === 'home');
          const away = comp.competitors.find((c: any) => c.homeAway === 'away');
          if (!home || !away) continue;
          const hs = parseInt(home.score) || 0;
          const as_ = parseInt(away.score) || 0;
          if (hs === as_) {
            draws.push({
              homeTeam: home.team.displayName,
              awayTeam: away.team.displayName,
              date: new Date(event.date).toISOString().split('T')[0],
              score: `${hs}-${as_}`,
            });
          }
        }
      } catch { /* skip */ }
    }

    console.log(`Found ${draws.length} draws from ESPN`);

    // Match bets to draws
    const betsToDelete: string[] = [];
    const details: any[] = [];

    for (const bet of soccerBets) {
      for (const draw of draws) {
        if (bet.date !== draw.date) continue;
        const hm = teamsMatch(bet.home_team, draw.homeTeam) || teamsMatch(bet.home_team, draw.awayTeam);
        const am = teamsMatch(bet.away_team, draw.homeTeam) || teamsMatch(bet.away_team, draw.awayTeam);
        if (hm && am) {
          betsToDelete.push(bet.id);
          details.push({
            matchup: `${bet.away_team} @ ${bet.home_team}`,
            date: bet.date,
            pick: bet.pick,
            result: bet.result,
            actualScore: draw.score,
          });
          break;
        }
      }
    }

    console.log(`Found ${betsToDelete.length} bets on drawn games`);

    // Delete them
    let deleted = 0;
    for (let i = 0; i < betsToDelete.length; i += 50) {
      const batch = betsToDelete.slice(i, i + 50);
      const { error } = await supabase.from('historical_bets').delete().in('id', batch);
      if (!error) deleted += batch.length;
    }

    return new Response(JSON.stringify({
      success: true,
      soccerBetsChecked: soccerBets.length,
      drawsFromESPN: draws.length,
      betsOnDraws: betsToDelete.length,
      deleted,
      details,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Audit error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
