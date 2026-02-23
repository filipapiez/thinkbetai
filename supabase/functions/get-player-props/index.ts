const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const API_KEY = Deno.env.get("SPORTSGAMEODDS_API_KEY");
  if (!API_KEY) {
    return new Response(
      JSON.stringify({ success: false, props: [], error: "API not configured" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const url = new URL(req.url);
  const sportFilter = (url.searchParams.get("sport") || "all").toLowerCase();

  const leagueMap: Record<string, string[]> = {
    all: ["NBA", "NFL", "MLB", "NHL"],
    basketball: ["NBA"],
    football: ["NFL"],
    baseball: ["MLB"],
    hockey: ["NHL"],
  };
  const leagues = leagueMap[sportFilter] || leagueMap["all"];

  const PATTERNS: Array<{ re: RegExp; stat: string }> = [
    { re: /^points-(.+)-game-ou-(over|under)$/, stat: "Points" },
    { re: /^rebounds-(.+)-game-ou-(over|under)$/, stat: "Rebounds" },
    { re: /^assists-(.+)-game-ou-(over|under)$/, stat: "Assists" },
    { re: /^threes-(.+)-game-ou-(over|under)$/, stat: "3-Pointers" },
    { re: /^steals-(.+)-game-ou-(over|under)$/, stat: "Steals" },
    { re: /^blocks-(.+)-game-ou-(over|under)$/, stat: "Blocks" },
    { re: /^strikeouts-(.+)-game-ou-(over|under)$/, stat: "Strikeouts" },
    { re: /^hits-(.+)-game-ou-(over|under)$/, stat: "Hits" },
    { re: /^totalbases-(.+)-game-ou-(over|under)$/, stat: "Total Bases" },
    { re: /^passingyards-(.+)-game-ou-(over|under)$/, stat: "Pass Yards" },
    { re: /^rushingyards-(.+)-game-ou-(over|under)$/, stat: "Rush Yards" },
    { re: /^receivingyards-(.+)-game-ou-(over|under)$/, stat: "Rec Yards" },
    { re: /^receptions-(.+)-game-ou-(over|under)$/, stat: "Receptions" },
    { re: /^saves-(.+)-game-ou-(over|under)$/, stat: "Saves" },
    { re: /^shots-(.+)-game-ou-(over|under)$/, stat: "Shots" },
    { re: /^goals-(.+)-game-ou-(over|under)$/, stat: "Goals" },
  ];

  function fmtName(id: string): string {
    return id
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  function toOdds(v: unknown): number {
    if (typeof v === "number") return v;
    if (typeof v === "string") {
      const n = parseInt(v.replace(/[^0-9+-]/g, ""));
      return isNaN(n) ? -110 : n;
    }
    return -110;
  }

  try {
    const allProps: Array<Record<string, unknown>> = [];

    for (const lid of leagues) {
      try {
        console.log("Fetching " + lid);
        const res = await fetch(
          "https://api.sportsgameodds.com/v2/events?leagueID=" + lid + "&oddsAvailable=true&limit=20",
          { headers: { "x-api-key": API_KEY } },
        );
        if (!res.ok) {
          const t = await res.text();
          console.error(lid + " error " + res.status + ": " + t.substring(0, 150));
          continue;
        }
        const json = await res.json();
        const events: Array<Record<string, unknown>> = json?.data || [];
        console.log(lid + ": " + events.length + " events");

        for (const ev of events) {
          const teams = ev.teams as Record<string, Record<string, Record<string, string>>> | undefined;
          const home = teams?.home?.names?.medium || "Home";
          const away = teams?.away?.names?.medium || "Away";
          const status = ev.status as Record<string, string> | undefined;
          const gt = status?.startsAt || "";
          const gid = (ev.eventID as string) || "";
          const odds = (ev.odds || {}) as Record<string, Record<string, unknown>>;

          const pmap = new Map<string, {
            stat: string;
            pid: string;
            ov?: { l: number; o: number };
            un?: { l: number; o: number };
          }>();

          for (const oid of Object.keys(odds)) {
            const o = odds[oid];
            for (const pat of PATTERNS) {
              const m = oid.match(pat.re);
              if (m) {
                const pid = m[1];
                const dir = m[2];
                const k = pid + ":" + pat.stat;
                if (!pmap.has(k)) pmap.set(k, { stat: pat.stat, pid });
                const entry = pmap.get(k)!;
                const ln = parseFloat(
                  String(o?.fairOverUnder || o?.bookOverUnder || o?.overUnder || o?.line || "0"),
                );
                const odds_val = toOdds(o?.fairOdds || o?.bookOdds || o?.odds);
                if (dir === "over") entry.ov = { l: ln, o: odds_val };
                else entry.un = { l: ln, o: odds_val };
              }
            }
          }

          for (const entry of pmap.values()) {
            const ln = entry.ov?.l || entry.un?.l || 0;
            if (ln === 0) continue;
            const isH = Object.keys(odds).some(
              (k) => k.includes(entry.pid) && k.includes("home"),
            );
            allProps.push({
              id: gid + "-" + entry.pid + "-" + entry.stat,
              playerName: fmtName(entry.pid),
              playerId: entry.pid,
              team: isH ? home : away,
              opponent: isH ? away : home,
              sport: lid,
              league: lid,
              statType: entry.stat,
              line: ln,
              overOdds: entry.ov?.o ?? -110,
              underOdds: entry.un?.o ?? -110,
              gameTime: gt,
              gameId: gid,
            });
          }
        }
      } catch (err) {
        console.error(lid + " fetch error:", err);
      }
    }

    console.log("Total props: " + allProps.length);

    return new Response(
      JSON.stringify({
        success: true,
        props: allProps,
        lastUpdated: new Date().toISOString(),
        count: allProps.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("get-player-props error:", error);
    return new Response(
      JSON.stringify({ success: false, props: [], error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
