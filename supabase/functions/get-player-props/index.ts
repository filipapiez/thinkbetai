import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const sportFilter = (url.searchParams.get("sport") || "all").toLowerCase();

  // --- DB cache (30 min TTL) ---
  const CACHE_KEY = `player-props-v2-${sportFilter}`;
  const CACHE_TTL_MS = 15 * 60 * 1000; // 15 min to keep props fresh

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const sb = createClient(supabaseUrl, serviceKey);

  try {
    const { data: cached } = await sb
      .from("odds_cache")
      .select("data, expires_at")
      .eq("id", CACHE_KEY)
      .maybeSingle();

    if (cached && new Date(cached.expires_at) > new Date()) {
      console.log("Serving player props from cache");
      const cacheData = cached.data as Record<string, unknown>;
      return new Response(
        JSON.stringify({
          success: true,
          props: cacheData.props || [],
          lastUpdated: cacheData.lastUpdated || new Date().toISOString(),
          count: (cacheData.props as unknown[])?.length || 0,
          source: "cache",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
  } catch (e) {
    console.warn("Cache read failed:", e);
  }

  // --- Try The Odds API first (more reliable), fallback to SportsGameOdds ---
  const ODDS_API_KEY = Deno.env.get("THE_ODDS_API_KEY");
  const SGO_API_KEY = Deno.env.get("SPORTSGAMEODDS_API_KEY");

  let allProps: Array<Record<string, unknown>> = [];

  // The Odds API sport keys
  const oddsApiSportMap: Record<string, string[]> = {
    all: ["basketball_nba", "americanfootball_nfl", "baseball_mlb", "icehockey_nhl"],
    basketball: ["basketball_nba"],
    football: ["americanfootball_nfl"],
    baseball: ["baseball_mlb"],
    hockey: ["icehockey_nhl"],
  };

  const propMarkets: Record<string, string[]> = {
    basketball_nba: ["player_points", "player_rebounds", "player_assists", "player_threes"],
    americanfootball_nfl: ["player_pass_yds", "player_rush_yds", "player_reception_yds", "player_receptions"],
    baseball_mlb: ["pitcher_strikeouts", "batter_hits", "batter_total_bases"],
    icehockey_nhl: ["player_points", "player_goals", "player_assists", "player_shots_on_goal"],
  };

  const marketToStat: Record<string, string> = {
    player_points: "Points",
    player_rebounds: "Rebounds",
    player_assists: "Assists",
    player_threes: "3-Pointers",
    player_pass_yds: "Pass Yards",
    player_rush_yds: "Rush Yards",
    player_reception_yds: "Rec Yards",
    player_receptions: "Receptions",
    pitcher_strikeouts: "Strikeouts",
    batter_hits: "Hits",
    batter_total_bases: "Total Bases",
    player_goals: "Goals",
    player_shots_on_goal: "Shots",
  };

  const sportLabel: Record<string, string> = {
    basketball_nba: "NBA",
    americanfootball_nfl: "NFL",
    baseball_mlb: "MLB",
    icehockey_nhl: "NHL",
  };

  if (ODDS_API_KEY) {
    const sportKeys = oddsApiSportMap[sportFilter] || oddsApiSportMap["all"];

    for (const sportKey of sportKeys) {
      try {
        // Step 1: Get events for this sport
        console.log(`[OddsAPI] Fetching events for ${sportKey}`);
        const eventsRes = await fetch(
          `https://api.the-odds-api.com/v4/sports/${sportKey}/events?apiKey=${ODDS_API_KEY}&dateFormat=iso`,
        );

        if (!eventsRes.ok) {
          console.error(`[OddsAPI] Events ${sportKey}: ${eventsRes.status}`);
          continue;
        }

        const events = await eventsRes.json() as Array<{
          id: string;
          home_team: string;
          away_team: string;
          commence_time: string;
        }>;

        console.log(`[OddsAPI] ${sportKey}: ${events.length} events`);

        // Step 2: Fetch player props for up to 5 events (to stay within quota)
        const markets = propMarkets[sportKey] || [];
        const marketsStr = markets.join(",");
        const eventsToFetch = events.slice(0, 5);

        for (let i = 0; i < eventsToFetch.length; i++) {
          const ev = eventsToFetch[i];
          if (i > 0) await new Promise(r => setTimeout(r, 300));

          try {
            const propsRes = await fetch(
              `https://api.the-odds-api.com/v4/sports/${sportKey}/events/${ev.id}/odds?apiKey=${ODDS_API_KEY}&regions=us&markets=${marketsStr}&oddsFormat=american`,
            );

            if (!propsRes.ok) {
              console.error(`[OddsAPI] Props ${ev.id}: ${propsRes.status}`);
              continue;
            }

            const propsData = await propsRes.json() as {
              id: string;
              home_team: string;
              away_team: string;
              commence_time: string;
              bookmakers?: Array<{
                key: string;
                markets: Array<{
                  key: string;
                  outcomes: Array<{
                    name: string;
                    description: string;
                    price: number;
                    point?: number;
                  }>;
                }>;
              }>;
            };

            // Use first bookmaker that has props
            const bookmaker = propsData.bookmakers?.find(b => b.markets.length > 0);
            if (!bookmaker) continue;

            for (const market of bookmaker.markets) {
              const statType = marketToStat[market.key];
              if (!statType) continue;

              // Group outcomes by player (description field)
              const playerMap = new Map<string, { over?: { point: number; price: number }; under?: { point: number; price: number } }>();

              for (const outcome of market.outcomes) {
                const player = outcome.description;
                if (!player) continue;
                if (!playerMap.has(player)) playerMap.set(player, {});
                const entry = playerMap.get(player)!;
                if (outcome.name === "Over" && outcome.point !== undefined) {
                  entry.over = { point: outcome.point, price: outcome.price };
                } else if (outcome.name === "Under" && outcome.point !== undefined) {
                  entry.under = { point: outcome.point, price: outcome.price };
                }
              }

              for (const [playerName, data] of playerMap.entries()) {
                const line = data.over?.point || data.under?.point || 0;
                if (line <= 0) continue;

                allProps.push({
                  id: `${ev.id}-${playerName.replace(/\s/g, "")}-${statType}`,
                  playerName,
                  playerId: playerName.replace(/\s/g, "").toLowerCase(),
                  team: ev.home_team, // We don't know exact team from this endpoint
                  opponent: ev.away_team,
                  sport: sportLabel[sportKey] || sportKey,
                  league: sportLabel[sportKey] || sportKey,
                  statType,
                  line,
                  overOdds: data.over?.price ?? -110,
                  underOdds: data.under?.price ?? -110,
                  gameTime: ev.commence_time,
                  gameId: ev.id,
                });
              }
            }
          } catch (err) {
            console.error(`[OddsAPI] Event ${ev.id} error:`, err);
          }
        }
      } catch (err) {
        console.error(`[OddsAPI] ${sportKey} error:`, err);
      }
    }

    console.log(`[OddsAPI] Total props: ${allProps.length}`);
  }

  // --- Fallback to SportsGameOdds if The Odds API returned nothing ---
  if (allProps.length === 0 && SGO_API_KEY) {
    console.log("[SGO] Falling back to SportsGameOdds...");
    const sgoLeagueMap: Record<string, string[]> = {
      all: ["NBA", "NFL", "MLB", "NHL"],
      basketball: ["NBA"],
      football: ["NFL"],
      baseball: ["MLB"],
      hockey: ["NHL"],
    };
    const leagues = sgoLeagueMap[sportFilter] || sgoLeagueMap["all"];

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
      return id.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[-_]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    }
    function toOdds(v: unknown): number {
      if (typeof v === "number") return v;
      if (typeof v === "string") { const n = parseInt(v.replace(/[^0-9+-]/g, "")); return isNaN(n) ? -110 : n; }
      return -110;
    }

    for (let i = 0; i < leagues.length; i++) {
      const lid = leagues[i];
      if (i > 0) await new Promise(r => setTimeout(r, 1500));
      try {
        console.log("[SGO] Fetching " + lid);
        const res = await fetch(
          `https://api.sportsgameodds.com/v2/events?leagueID=${lid}&oddsAvailable=true&limit=20`,
          { headers: { "x-api-key": SGO_API_KEY } },
        );
        if (!res.ok) {
          console.error(`[SGO] ${lid} error ${res.status}`);
          continue;
        }
        const json = await res.json();
        const events = json?.data || [];

        for (const ev of events) {
          const teams = ev.teams as Record<string, Record<string, Record<string, string>>> | undefined;
          const home = teams?.home?.names?.medium || "Home";
          const away = teams?.away?.names?.medium || "Away";
          const gt = (ev.status as Record<string, string>)?.startsAt || "";
          const gid = (ev.eventID as string) || "";
          const odds = (ev.odds || {}) as Record<string, Record<string, unknown>>;

          const pmap = new Map<string, { stat: string; pid: string; ov?: { l: number; o: number }; un?: { l: number; o: number } }>();
          for (const oid of Object.keys(odds)) {
            const o = odds[oid];
            for (const pat of PATTERNS) {
              const m = oid.match(pat.re);
              if (!m) continue;
              const pid = m[1], dir = m[2], k = `${pid}:${pat.stat}`;
              if (!pmap.has(k)) pmap.set(k, { stat: pat.stat, pid });
              const entry = pmap.get(k)!;
              const rawLine = o?.overUnder ?? o?.bookOverUnder ?? o?.line ?? o?.fairOverUnder ?? "0";
              const ln = parseFloat(String(rawLine));
              if (isNaN(ln) || ln <= 0) continue;
              const ov = toOdds(o?.fairOdds || o?.bookOdds || o?.odds);
              if (dir === "over") entry.ov = { l: ln, o: ov }; else entry.un = { l: ln, o: ov };
            }
          }
          for (const entry of pmap.values()) {
            const ln = entry.ov?.l || entry.un?.l || 0;
            if (ln === 0) continue;
            const isH = Object.keys(odds).some(k => k.includes(entry.pid) && k.includes("home"));
            allProps.push({
              id: `${gid}-${entry.pid}-${entry.stat}`,
              playerName: fmtName(entry.pid),
              playerId: entry.pid,
              team: isH ? home : away,
              opponent: isH ? away : home,
              sport: lid, league: lid,
              statType: entry.stat, line: ln,
              overOdds: entry.ov?.o ?? -110,
              underOdds: entry.un?.o ?? -110,
              gameTime: gt, gameId: gid,
            });
          }
        }
      } catch (err) {
        console.error(`[SGO] ${lid} error:`, err);
      }
    }
    console.log(`[SGO] Total props: ${allProps.length}`);
  }

  // Save to cache if we got data
  const now = new Date();
  if (allProps.length > 0) {
    try {
      await sb.from("odds_cache").upsert({
        id: CACHE_KEY,
        data: { props: allProps, lastUpdated: now.toISOString() },
        expires_at: new Date(now.getTime() + CACHE_TTL_MS).toISOString(),
        updated_at: now.toISOString(),
      });
    } catch (e) {
      console.warn("Cache write failed:", e);
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      props: allProps,
      lastUpdated: now.toISOString(),
      count: allProps.length,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
