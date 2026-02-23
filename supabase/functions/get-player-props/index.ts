Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('get-player-props called');

  const API_KEY = Deno.env.get('SPORTSGAMEODDS_API_KEY');

  const url = new URL(req.url);
  const sportFilter = url.searchParams.get('sport') || 'all';

  const sportLeagueMap: Record<string, string[]> = {
    all: ['NBA', 'NFL', 'MLB', 'NHL'],
    basketball: ['NBA'],
    football: ['NFL'],
    baseball: ['MLB'],
    hockey: ['NHL'],
  };

  const leagues = sportLeagueMap[sportFilter.toLowerCase()] || sportLeagueMap.all;

  if (!API_KEY) {
    return new Response(
      JSON.stringify({ success: false, props: [], error: 'API not configured' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const PROP_PATTERNS = [
    { re: /^points-(.+)-game-ou-(over|under)$/, stat: 'Points' },
    { re: /^rebounds-(.+)-game-ou-(over|under)$/, stat: 'Rebounds' },
    { re: /^assists-(.+)-game-ou-(over|under)$/, stat: 'Assists' },
    { re: /^threes-(.+)-game-ou-(over|under)$/, stat: '3-Pointers' },
    { re: /^steals-(.+)-game-ou-(over|under)$/, stat: 'Steals' },
    { re: /^blocks-(.+)-game-ou-(over|under)$/, stat: 'Blocks' },
    { re: /^strikeouts-(.+)-game-ou-(over|under)$/, stat: 'Strikeouts' },
    { re: /^hits-(.+)-game-ou-(over|under)$/, stat: 'Hits' },
    { re: /^totalbases-(.+)-game-ou-(over|under)$/, stat: 'Total Bases' },
    { re: /^passingyards-(.+)-game-ou-(over|under)$/, stat: 'Pass Yards' },
    { re: /^rushingyards-(.+)-game-ou-(over|under)$/, stat: 'Rush Yards' },
    { re: /^receivingyards-(.+)-game-ou-(over|under)$/, stat: 'Rec Yards' },
    { re: /^receptions-(.+)-game-ou-(over|under)$/, stat: 'Receptions' },
    { re: /^saves-(.+)-game-ou-(over|under)$/, stat: 'Saves' },
    { re: /^shots-(.+)-game-ou-(over|under)$/, stat: 'Shots' },
    { re: /^goals-(.+)-game-ou-(over|under)$/, stat: 'Goals' },
  ];

  function formatName(id: string): string {
    return id.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  function toOdds(v: unknown): number {
    if (typeof v === 'number') return v;
    if (typeof v === 'string') return parseInt(v.replace(/[^0-9+-]/g, '')) || -110;
    return -110;
  }

  try {
    const allProps: unknown[] = [];

    for (const lid of leagues) {
      try {
        const res = await fetch(
          `https://api.sportsgameodds.com/v2/events?leagueID=${lid}&oddsAvailable=true&limit=20`,
          { headers: { 'x-api-key': API_KEY } }
        );
        if (!res.ok) {
          const t = await res.text();
          console.error(`${lid} error ${res.status}: ${t.substring(0, 150)}`);
          continue;
        }
        const json = await res.json();
        const events = json?.data || [];
        console.log(`${lid}: ${events.length} events`);

        for (const ev of events) {
          const home = ev.teams?.home?.names?.medium || 'Home';
          const away = ev.teams?.away?.names?.medium || 'Away';
          const gt = ev.status?.startsAt || '';
          const gid = ev.eventID || '';
          const odds = ev.odds || {};

          const pmap = new Map<string, { stat: string; pid: string; ov?: { l: number; o: number }; un?: { l: number; o: number } }>();

          for (const [oid, od] of Object.entries(odds)) {
            const o = od as Record<string, unknown>;
            for (const { re, stat } of PROP_PATTERNS) {
              const m = oid.match(re);
              if (m) {
                const pid = m[1];
                const dir = m[2];
                const k = `${pid}:${stat}`;
                if (!pmap.has(k)) pmap.set(k, { stat, pid });
                const e = pmap.get(k)!;
                const ln = parseFloat(String(o?.fairOverUnder || o?.bookOverUnder || o?.overUnder || o?.line || '0'));
                const ov = toOdds(o?.fairOdds || o?.bookOdds || o?.odds);
                if (dir === 'over') e.ov = { l: ln, o: ov };
                else e.un = { l: ln, o: ov };
              }
            }
          }

          for (const [, e] of pmap) {
            const ln = e.ov?.l || e.un?.l || 0;
            if (ln === 0) continue;
            const isH = Object.keys(odds).some(k => k.includes(e.pid) && k.includes('home'));
            allProps.push({
              id: `${gid}-${e.pid}-${e.stat}`,
              playerName: formatName(e.pid),
              playerId: e.pid,
              team: isH ? home : away,
              opponent: isH ? away : home,
              sport: lid,
              league: lid,
              statType: e.stat,
              line: ln,
              overOdds: e.ov?.o ?? -110,
              underOdds: e.un?.o ?? -110,
              gameTime: gt,
              gameId: gid,
            });
          }
        }
      } catch (err) {
        console.error(`${lid} fetch error:`, err);
      }
    }

    console.log(`Total props: ${allProps.length}`);

    return new Response(JSON.stringify({
      success: true,
      props: allProps,
      lastUpdated: new Date().toISOString(),
      count: allProps.length,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('get-player-props error:', error);
    return new Response(
      JSON.stringify({ success: false, props: [], error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
