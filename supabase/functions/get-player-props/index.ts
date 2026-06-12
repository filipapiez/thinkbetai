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
  const isRefresh = url.searchParams.get("_refresh") === "1";

  const CACHE_KEY = `player-props-v2-${sportFilter}`;
  const CACHE_TTL_MS = 15 * 60 * 1000;
  // Hard max age: if cache is older than this and has no future games, drop it
  const CACHE_HARD_MAX_AGE_MS = 6 * 60 * 60 * 1000; // 6 hours

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const sb = createClient(supabaseUrl, serviceKey);

  const filterFutureProps = (props: Array<Record<string, unknown>>) => {
    const now = Date.now();
    return props.filter(p => {
      const gt = p.gameTime as string | undefined;
      if (!gt) return false;
      const t = new Date(gt).getTime();
      return Number.isFinite(t) && t > now;
    });
  };

  // --- Check cache first (skip when explicitly refreshing) ---
  if (!isRefresh) {
    try {
      const { data: cached } = await sb
        .from("odds_cache")
        .select("data, expires_at, updated_at")
        .eq("id", CACHE_KEY)
        .maybeSingle();

      if (cached) {
        const cacheData = cached.data as Record<string, unknown>;
        const isExpired = new Date(cached.expires_at) <= new Date();
        const cachedProps = filterFutureProps((cacheData.props as Array<Record<string, unknown>>) || []);
        const updatedAt = new Date(cached.updated_at || (cacheData.lastUpdated as string) || 0).getTime();
        const tooOld = !updatedAt || (Date.now() - updatedAt) > CACHE_HARD_MAX_AGE_MS;

        if (!isExpired && cachedProps.length > 0) {
          console.log("Serving player props from fresh cache");
          return new Response(
            JSON.stringify({
              success: true,
              props: cachedProps,
              lastUpdated: cacheData.lastUpdated || new Date().toISOString(),
              count: cachedProps.length,
              source: "cache",
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }

        // Stale but still usable: serve and refresh in background
        if (!tooOld && cachedProps.length > 0) {
          console.log("Serving stale cache, will refresh in background");
          const bgUrl = `${supabaseUrl}/functions/v1/get-player-props?sport=${sportFilter}&_refresh=1`;
          fetch(bgUrl, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "apikey": Deno.env.get("SUPABASE_ANON_KEY") || "",
            },
          }).catch(() => {});

          return new Response(
            JSON.stringify({
              success: true,
              props: cachedProps,
              lastUpdated: cacheData.lastUpdated || new Date().toISOString(),
              count: cachedProps.length,
              source: "stale-cache",
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
        console.log("Cache too old or empty of future games, fetching fresh");
      }
    } catch (e) {
      console.warn("Cache read failed:", e);
    }
  }

  const ODDS_API_KEY = Deno.env.get("THE_ODDS_API_KEY");
  const SGO_API_KEY = Deno.env.get("SPORTSGAMEODDS_API_KEY");

  let allProps: Array<Record<string, unknown>> = [];

  const oddsApiSportMap: Record<string, string[]> = {
    all: [
      "basketball_nba", "basketball_ncaab",
      "americanfootball_nfl", "americanfootball_ncaaf",
      "baseball_mlb",
      "icehockey_nhl",
      "soccer_epl", "soccer_usa_mls",
      "tennis_atp_french_open", "tennis_atp_us_open", "tennis_atp_wimbledon", "tennis_atp_australian_open",
      "mma_mixed_martial_arts",
    ],
    basketball: ["basketball_nba", "basketball_ncaab"],
    football: ["americanfootball_nfl", "americanfootball_ncaaf"],
    baseball: ["baseball_mlb"],
    hockey: ["icehockey_nhl"],
    soccer: ["soccer_epl", "soccer_usa_mls"],
    tennis: ["tennis_atp_french_open", "tennis_atp_us_open", "tennis_atp_wimbledon", "tennis_atp_australian_open"],
    mma: ["mma_mixed_martial_arts"],
  };

  const propMarkets: Record<string, string[]> = {
    basketball_nba: ["player_points", "player_rebounds", "player_assists", "player_threes", "player_blocks", "player_steals", "player_turnovers", "player_points_rebounds_assists", "player_points_rebounds", "player_points_assists", "player_rebounds_assists", "player_double_double"],
    basketball_ncaab: ["player_points", "player_rebounds", "player_assists", "player_threes", "player_blocks", "player_steals", "player_points_rebounds_assists"],
    americanfootball_nfl: ["player_pass_yds", "player_rush_yds", "player_reception_yds", "player_receptions", "player_pass_tds", "player_rush_attempts", "player_pass_completions", "player_pass_attempts", "player_interceptions", "player_anytime_td", "player_first_td", "player_kicking_points"],
    americanfootball_ncaaf: ["player_pass_yds", "player_rush_yds", "player_reception_yds", "player_receptions", "player_pass_tds", "player_anytime_td"],
    baseball_mlb: ["pitcher_strikeouts", "batter_hits", "batter_total_bases", "batter_rbis", "batter_runs_scored", "batter_stolen_bases", "pitcher_outs", "batter_home_runs", "batter_walks"],
    icehockey_nhl: ["player_points", "player_goals", "player_assists", "player_shots_on_goal", "player_blocked_shots", "player_power_play_points"],
    soccer_epl: ["player_goals", "player_assists", "player_shots_on_goal"],
    soccer_usa_mls: ["player_goals", "player_assists", "player_shots_on_goal"],
    mma_mixed_martial_arts: ["player_points"],
  };

  const marketToStat: Record<string, string> = {
    player_points: "Points", player_rebounds: "Rebounds", player_assists: "Assists",
    player_threes: "3-Pointers", player_blocks: "Blocks", player_steals: "Steals",
    player_turnovers: "Turnovers", player_points_rebounds_assists: "Pts+Reb+Ast",
    player_points_rebounds: "Pts+Reb", player_points_assists: "Pts+Ast",
    player_rebounds_assists: "Reb+Ast", player_double_double: "Double-Double",
    player_pass_yds: "Pass Yards", player_rush_yds: "Rush Yards",
    player_reception_yds: "Rec Yards", player_receptions: "Receptions",
    player_pass_tds: "Pass TDs", player_rush_attempts: "Rush Attempts",
    player_pass_completions: "Completions", player_pass_attempts: "Pass Attempts",
    player_interceptions: "Interceptions", player_anytime_td: "Anytime TD",
    player_first_td: "First TD", player_kicking_points: "Kicking Pts",
    pitcher_strikeouts: "Strikeouts", batter_hits: "Hits", batter_total_bases: "Total Bases",
    batter_rbis: "RBIs", batter_runs_scored: "Runs", batter_stolen_bases: "Stolen Bases",
    pitcher_outs: "Outs Recorded", batter_home_runs: "Home Runs", batter_walks: "Walks",
    player_goals: "Goals", player_shots_on_goal: "Shots",
    player_blocked_shots: "Blocked Shots", player_power_play_points: "PP Points",
  };

  const sportLabel: Record<string, string> = {
    basketball_nba: "NBA", basketball_ncaab: "NCAAB",
    americanfootball_nfl: "NFL", americanfootball_ncaaf: "NCAAF",
    baseball_mlb: "MLB", icehockey_nhl: "NHL",
    soccer_epl: "EPL", soccer_usa_mls: "MLS",
    tennis_atp_french_open: "Tennis", tennis_atp_us_open: "Tennis",
    tennis_atp_wimbledon: "Tennis", tennis_atp_australian_open: "Tennis",
    mma_mixed_martial_arts: "MMA",
  };

  // --- Helper: fetch props for a single event ---
  function parseEventProps(
    sportKey: string,
    ev: { id: string; home_team: string; away_team: string; commence_time: string },
    propsData: { bookmakers?: Array<{ key: string; markets: Array<{ key: string; outcomes: Array<{ name: string; description: string; price: number; point?: number }> }> }> },
  ): Array<Record<string, unknown>> {
    const targetBooks = ['fanduel', 'draftkings', 'betmgm', 'hardrockbet'];
    const availableBooks = (propsData.bookmakers || []).filter(
      b => targetBooks.includes(b.key) && b.markets.length > 0,
    );
    if (availableBooks.length === 0) return [];

    const combinedMap = new Map<string, Map<string, Map<string, { over?: { point: number; price: number }; under?: { point: number; price: number } }>>>();

    for (const book of availableBooks) {
      for (const market of book.markets) {
        const statType = marketToStat[market.key];
        if (!statType) continue;
        for (const outcome of market.outcomes) {
          const player = outcome.description;
          if (!player) continue;
          if (!combinedMap.has(player)) combinedMap.set(player, new Map());
          const statMap = combinedMap.get(player)!;
          if (!statMap.has(statType)) statMap.set(statType, new Map());
          const bookMap = statMap.get(statType)!;
          if (!bookMap.has(book.key)) bookMap.set(book.key, {});
          const entry = bookMap.get(book.key)!;
          if (outcome.name === "Over" && outcome.point !== undefined) {
            entry.over = { point: outcome.point, price: outcome.price };
          } else if (outcome.name === "Under" && outcome.point !== undefined) {
            entry.under = { point: outcome.point, price: outcome.price };
          }
        }
      }
    }

    const results: Array<Record<string, unknown>> = [];
    for (const [playerName, statMap] of combinedMap.entries()) {
      for (const [statType, bookMap] of statMap.entries()) {
        const firstBook = bookMap.values().next().value;
        const line = firstBook?.over?.point || firstBook?.under?.point || 0;
        if (line <= 0) continue;

        const bookOdds: Record<string, { overOdds: number; underOdds: number; line: number }> = {};
        for (const [bookKey, data] of bookMap.entries()) {
          const bookLine = data.over?.point || data.under?.point || line;
          bookOdds[bookKey] = {
            overOdds: data.over?.price ?? -110,
            underOdds: data.under?.price ?? -110,
            line: bookLine,
          };
        }

        const primaryBook = bookOdds['fanduel'] || bookOdds['draftkings'] || bookOdds['betmgm'] || bookOdds['hardrockbet']!;
        results.push({
          id: `${ev.id}-${playerName.replace(/\s/g, "")}-${statType}`,
          playerName,
          playerId: playerName.replace(/\s/g, "").toLowerCase(),
          team: ev.home_team,
          opponent: ev.away_team,
          sport: sportLabel[sportKey] || sportKey,
          league: sportLabel[sportKey] || sportKey,
          statType, line,
          overOdds: primaryBook.overOdds,
          underOdds: primaryBook.underOdds,
          gameTime: ev.commence_time,
          gameId: ev.id,
          bookOdds,
        });
      }
    }
    return results;
  }

  // --- Concurrency limiter ---
  async function parallelLimit<T>(tasks: (() => Promise<T>)[], limit: number): Promise<T[]> {
    const results: T[] = [];
    let idx = 0;
    async function worker() {
      while (idx < tasks.length) {
        const i = idx++;
        results[i] = await tasks[i]();
      }
    }
    await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, () => worker()));
    return results;
  }

  if (ODDS_API_KEY) {
    const sportKeys = oddsApiSportMap[sportFilter] || oddsApiSportMap["all"];

    // Step 1: Fetch ALL sport events in PARALLEL (max 5 concurrent)
    const eventsPerSport = await parallelLimit(
      sportKeys.map((sportKey) => async () => {
        try {
          const res = await fetch(
            `https://api.the-odds-api.com/v4/sports/${sportKey}/events?apiKey=${ODDS_API_KEY}&dateFormat=iso`,
          );
          if (!res.ok) {
            console.error(`[OddsAPI] Events ${sportKey}: ${res.status}`);
            return { sportKey, events: [] as Array<{ id: string; home_team: string; away_team: string; commence_time: string }> };
          }
          const events = await res.json() as Array<{ id: string; home_team: string; away_team: string; commence_time: string }>;
          const nowMs = Date.now();
          const active = events.filter(ev => new Date(ev.commence_time).getTime() > nowMs);
          console.log(`[OddsAPI] ${sportKey}: ${active.length}/${events.length} active`);
          return { sportKey, events: active };
        } catch (err) {
          console.error(`[OddsAPI] ${sportKey} events error:`, err);
          return { sportKey, events: [] as Array<{ id: string; home_team: string; away_team: string; commence_time: string }> };
        }
      }),
      5,
    );

    // Step 2: Build flat list of all event prop fetch tasks
    type PropTask = () => Promise<Array<Record<string, unknown>>>;
    const propTasks: PropTask[] = [];

    for (const { sportKey, events } of eventsPerSport) {
      const markets = propMarkets[sportKey] || [];
      if (markets.length === 0) continue;
      const marketsStr = markets.join(",");

      for (const ev of events) {
        propTasks.push(async () => {
          try {
            const propsRes = await fetch(
              `https://api.the-odds-api.com/v4/sports/${sportKey}/events/${ev.id}/odds?apiKey=${ODDS_API_KEY}&regions=us,us2&bookmakers=fanduel,draftkings,betmgm,hardrockbet&markets=${marketsStr}&oddsFormat=american`,
            );
            if (!propsRes.ok) {
              console.error(`[OddsAPI] Props ${ev.id}: ${propsRes.status}`);
              return [];
            }
            const propsData = await propsRes.json();
            return parseEventProps(sportKey, ev, propsData);
          } catch (err) {
            console.error(`[OddsAPI] Event ${ev.id} error:`, err);
            return [];
          }
        });
      }
    }

    // Step 3: Fetch all event props in parallel (max 8 concurrent)
    console.log(`[OddsAPI] Fetching props for ${propTasks.length} events (8 concurrent)`);
    const propResults = await parallelLimit(propTasks, 8);
    for (const batch of propResults) {
      allProps.push(...batch);
    }

    console.log(`[OddsAPI] Total props: ${allProps.length}`);
  }

  // --- Fallback to SportsGameOdds if The Odds API returned nothing ---
  if (allProps.length === 0 && SGO_API_KEY) {
    console.log("[SGO] Falling back to SportsGameOdds...");
    const sgoLeagueMap: Record<string, string[]> = {
      all: ["NBA", "NFL", "MLB", "NHL"],
      basketball: ["NBA"], football: ["NFL"], baseball: ["MLB"], hockey: ["NHL"],
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
        const res = await fetch(
          `https://api.sportsgameodds.com/v2/events?leagueID=${lid}&oddsAvailable=true&limit=20`,
          { headers: { "x-api-key": SGO_API_KEY } },
        );
        if (!res.ok) continue;
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
              playerName: fmtName(entry.pid), playerId: entry.pid,
              team: isH ? home : away, opponent: isH ? away : home,
              sport: lid, league: lid, statType: entry.stat, line: ln,
              overOdds: entry.ov?.o ?? -110, underOdds: entry.un?.o ?? -110,
              gameTime: gt, gameId: gid,
            });
          }
        }
      } catch (err) {
        console.error(`[SGO] ${lid} error:`, err);
      }
    }
  }

  // Save to cache
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
