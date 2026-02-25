import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

// Player prop markets available from The Odds API
const PROP_MARKETS = [
  "player_points",
  "player_rebounds",
  "player_assists",
  "player_threes",
  "player_points_rebounds_assists",
  "player_points_rebounds",
  "player_points_assists",
  "player_rebounds_assists",
  "player_steals",
  "player_blocks",
  "player_turnovers",
  "player_double_double",
  "player_triple_double",
];

// Sports that support player props
const PROP_SPORTS: Record<string, string> = {
  basketball_nba: "NBA",
  americanfootball_nfl: "NFL",
  baseball_mlb: "MLB",
  icehockey_nhl: "NHL",
};

// NFL-specific prop markets
const NFL_PROP_MARKETS = [
  "player_pass_tds",
  "player_pass_yds",
  "player_rush_yds",
  "player_reception_yds",
  "player_receptions",
  "player_anytime_td",
];

// MLB-specific prop markets
const MLB_PROP_MARKETS = [
  "pitcher_strikeouts",
  "batter_hits",
  "batter_total_bases",
  "batter_rbis",
  "batter_runs_scored",
  "batter_home_runs",
];

// NHL-specific prop markets
const NHL_PROP_MARKETS = [
  "player_points",
  "player_assists",
  "player_shots_on_goal",
];

function getMarketsForSport(sportKey: string): string[] {
  if (sportKey.startsWith("americanfootball")) return [...NFL_PROP_MARKETS];
  if (sportKey.startsWith("baseball")) return [...MLB_PROP_MARKETS];
  if (sportKey.startsWith("icehockey")) return [...NHL_PROP_MARKETS];
  return PROP_MARKETS.slice(0, 6); // Limit to conserve API quota
}

function formatMarketName(market: string): string {
  return market
    .replace("player_", "")
    .replace("pitcher_", "")
    .replace("batter_", "")
    .split("_")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" + ")
    .replace(" + ", " ")
    .replace("Tds", "TDs")
    .replace("Yds", "Yards")
    .replace("Rbis", "RBIs");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const sportFilter = url.searchParams.get("sport") || "";
    const cacheKey = `player_props_${sportFilter || "all"}`;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check cache
    const { data: cached } = await supabase
      .from("odds_cache")
      .select("data, expires_at")
      .eq("id", cacheKey)
      .single();

    if (cached && new Date(cached.expires_at) > new Date()) {
      console.log("Returning cached player props data");
      return new Response(JSON.stringify(cached.data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("THE_ODDS_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Odds API key not configured", projections: [], leagues: [] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine which sports to fetch
    const sportsToFetch = sportFilter
      ? Object.entries(PROP_SPORTS).filter(([k, v]) => v.toLowerCase() === sportFilter.toLowerCase()).map(([k]) => k)
      : Object.keys(PROP_SPORTS);

    const allProjections: any[] = [];
    const leagueSet = new Map<string, string>();

    // Fetch player props for each sport
    for (const sportKey of sportsToFetch) {
      const markets = getMarketsForSport(sportKey);
      const sportName = PROP_SPORTS[sportKey];
      leagueSet.set(sportKey, sportName);

      try {
        // Fetch props in batches of 3 markets to conserve API calls
        const marketBatches: string[][] = [];
        for (let i = 0; i < markets.length; i += 3) {
          marketBatches.push(markets.slice(i, i + 3));
        }

        for (const batch of marketBatches) {
          const marketsParam = batch.join(",");
          const apiUrl = `https://api.the-odds-api.com/v4/sports/${sportKey}/odds/?apiKey=${apiKey}&regions=us&markets=${marketsParam}&oddsFormat=american&bookmakers=draftkings,fanduel`;

          console.log(`Fetching ${sportName} props: ${marketsParam}`);
          const response = await fetch(apiUrl);

          if (!response.ok) {
            console.error(`Props API error for ${sportName}: ${response.status}`);
            continue;
          }

          const games = await response.json();

          for (const game of games) {
            const homeTeam = game.home_team;
            const awayTeam = game.away_team;
            const gameDesc = `${awayTeam} @ ${homeTeam}`;
            const gameTime = game.commence_time;

            for (const bookmaker of game.bookmakers || []) {
              for (const market of bookmaker.markets || []) {
                for (const outcome of market.outcomes || []) {
                  const playerName = outcome.description || outcome.name;
                  if (!playerName || playerName === "Over" || playerName === "Under") continue;

                  // Find the over/under pair
                  const isOver = outcome.name === "Over";
                  const line = outcome.point;

                  if (line == null) continue;

                  // Avoid duplicates - check if we already have this player+stat
                  const dupeKey = `${playerName}_${market.key}_${gameDesc}`;
                  if (allProjections.some(p => p._dupeKey === dupeKey)) continue;

                  allProjections.push({
                    _dupeKey: dupeKey,
                    id: `${game.id}_${market.key}_${playerName}`.replace(/\s/g, "_"),
                    lineScore: line,
                    statType: formatMarketName(market.key),
                    description: gameDesc,
                    gameTime: gameTime,
                    isPromo: false,
                    flashSaleLine: null,
                    oddsType: null,
                    player: {
                      id: playerName.replace(/\s/g, "_").toLowerCase(),
                      name: playerName,
                      position: "",
                      team: "",
                      teamName: "",
                      imageUrl: null,
                    },
                    league: { id: sportKey, name: sportName },
                    sport: sportName,
                    bookmaker: bookmaker.title,
                  });
                }
              }
            }
          }
        }
      } catch (e) {
        console.error(`Error fetching ${sportName} props:`, e);
      }
    }

    // Remove dupe key from output
    const cleanProjections = allProjections.map(({ _dupeKey, ...rest }) => rest);

    const uniqueLeagues = Array.from(leagueSet.entries()).map(([id, name]) => ({ id, name }));

    const result = {
      projections: cleanProjections,
      leagues: uniqueLeagues,
      totalCount: cleanProjections.length,
      lastUpdated: new Date().toISOString(),
    };

    // Cache
    const expiresAt = new Date(Date.now() + CACHE_TTL_MS).toISOString();
    await supabase.from("odds_cache").upsert({
      id: cacheKey,
      data: result,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    });

    console.log(`Returning ${cleanProjections.length} player prop projections`);
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Player props fetch error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch player props", projections: [], leagues: [] }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
