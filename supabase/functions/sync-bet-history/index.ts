import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAdminOrCron, unauthorizedResponse } from "../_shared/adminAuth.ts";
import { checkSportSeason } from "../_shared/seasonGuard.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const ODDS_API_KEY = Deno.env.get("THE_ODDS_API_KEY") || Deno.env.get("ODDS_API_KEY");
const MIN_QUALIFIED_CONFIDENCE = 83;
const MAX_PICKS_PER_RUN = 12;
const LOOKAHEAD_HOURS = 48;

type OddsOutcome = {
  name: string;
  price: number;
  point?: number;
};

type OddsBookmaker = {
  key?: string;
  title?: string;
  markets?: Array<{
    key: string;
    outcomes?: OddsOutcome[];
  }>;
};

type OddsGame = {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers?: OddsBookmaker[];
};

type QualifiedPick = {
  game_id: string;
  sport: string;
  home_team: string;
  away_team: string;
  pick: string;
  pick_type: "moneyline";
  pick_value: null;
  odds: number;
  confidence: number;
  edge: number;
  game_time: string;
  status: "pending";
  published_at: string;
  bookmaker: string;
  market_type: "moneyline";
  line: null;
  opening_odds: number;
  pick_odds: number;
  model_probability: number;
  implied_probability: number;
  expected_value: number;
  source_event_id: string;
  odds_source: "the-odds-api";
};

const sports = [
  { key: "basketball_nba", tag: "NBA" },
  { key: "americanfootball_nfl", tag: "NFL" },
  { key: "baseball_mlb", tag: "MLB" },
  { key: "icehockey_nhl", tag: "NHL" },
];

const sportLabels: Record<string, string> = {
  basketball_nba: "NBA",
  americanfootball_nfl: "NFL",
  baseball_mlb: "MLB",
  icehockey_nhl: "NHL",
};

function impliedProbability(price: number) {
  return price < 0 ? Math.abs(price) / (Math.abs(price) + 100) : 100 / (price + 100);
}

function americanToDecimal(price: number) {
  return price > 0 ? 1 + price / 100 : 1 + 100 / Math.abs(price);
}

function expectedValue(modelProbability: number, price: number) {
  const decimalOdds = americanToDecimal(price);
  return modelProbability * (decimalOdds - 1) - (1 - modelProbability);
}

function findBestMoneyline(game: OddsGame, teamName: string) {
  const candidates = game.bookmakers
    ?.flatMap((book) => {
      const h2h = book.markets?.find((market) => market.key === "h2h");
      const outcome = h2h?.outcomes?.find((item) => item.name === teamName);
      if (!outcome || typeof outcome.price !== "number") return [];
      return [{
        name: outcome.name,
        price: Math.round(outcome.price),
        bookmaker: book.title || book.key || "Unknown sportsbook",
      }];
    }) || [];

  return candidates.sort((a, b) => b.price - a.price)[0] || null;
}

function estimateQualifiedPick(game: OddsGame): QualifiedPick | null {
  const home = findBestMoneyline(game, game.home_team);
  const away = findBestMoneyline(game, game.away_team);

  if (!home || !away || typeof home.price !== "number" || typeof away.price !== "number") {
    return null;
  }

  const chosen = impliedProbability(home.price) >= impliedProbability(away.price) ? home : away;
  const marketProbability = impliedProbability(chosen.price);
  const homeAdvantage = chosen.name === game.home_team ? 0.018 : 0;
  const favoriteBoost = chosen.price < 0 ? Math.min(0.035, Math.abs(chosen.price) / 10000) : 0;
  const modelProbability = Math.min(0.92, marketProbability + homeAdvantage + favoriteBoost);
  const confidence = Math.round(modelProbability * 100);
  const edge = Math.max(0, Math.round((modelProbability - marketProbability) * 1000) / 10);
  const publishedAt = new Date().toISOString();

  if (confidence < MIN_QUALIFIED_CONFIDENCE) return null;

  return {
    game_id: game.id,
    sport: sportLabels[game.sport_key] || game.sport_title || game.sport_key.toUpperCase(),
    home_team: game.home_team,
    away_team: game.away_team,
    pick: `${chosen.name} ML`,
    pick_type: "moneyline",
    pick_value: null,
    odds: Math.round(chosen.price),
    confidence,
    edge,
    game_time: game.commence_time,
    status: "pending",
    published_at: publishedAt,
    bookmaker: chosen.bookmaker,
    market_type: "moneyline",
    line: null,
    opening_odds: Math.round(chosen.price),
    pick_odds: Math.round(chosen.price),
    model_probability: Number((modelProbability * 100).toFixed(2)),
    implied_probability: Number((marketProbability * 100).toFixed(2)),
    expected_value: Number((expectedValue(modelProbability, chosen.price) * 100).toFixed(2)),
    source_event_id: game.id,
    odds_source: "the-odds-api",
  };
}

async function fetchUpcomingGames() {
  if (!ODDS_API_KEY) {
    throw new Error("THE_ODDS_API_KEY or ODDS_API_KEY is not configured");
  }

  const now = Date.now();
  const minTime = now + 30 * 60 * 1000;
  const maxTime = now + LOOKAHEAD_HOURS * 60 * 60 * 1000;
  const games: OddsGame[] = [];

  for (const sport of sports.filter((item) => checkSportSeason(item.tag).allowed)) {
    const url = new URL(`https://api.the-odds-api.com/v4/sports/${sport.key}/odds/`);
    url.searchParams.set("apiKey", ODDS_API_KEY);
    url.searchParams.set("regions", "us");
    url.searchParams.set("markets", "h2h");
    url.searchParams.set("oddsFormat", "american");
    url.searchParams.set("dateFormat", "iso");

    const response = await fetch(url);
    if (!response.ok) {
      console.error(`[sync-bet-history] ${sport.key} odds failed: ${response.status}`);
      continue;
    }

    const sportGames = await response.json() as OddsGame[];
    games.push(
      ...sportGames.filter((game) => {
        const gameTime = new Date(game.commence_time).getTime();
        return gameTime >= minTime && gameTime <= maxTime;
      }),
    );
  }

  return games;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const auth = await requireAdminOrCron(req);
  if (!auth.ok) return unauthorizedResponse(auth, corsHeaders);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const games = await fetchUpcomingGames();
    const qualifiedPicks = games
      .map(estimateQualifiedPick)
      .filter((pick): pick is QualifiedPick => Boolean(pick))
      .sort((a, b) => b.confidence - a.confidence || b.edge - a.edge)
      .slice(0, MAX_PICKS_PER_RUN);

    if (qualifiedPicks.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: "No upcoming games cleared the qualified-pick threshold",
        scanned: games.length,
        inserted: 0,
        minimumConfidence: MIN_QUALIFIED_CONFIDENCE,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data, error } = await supabase
      .from("active_bets")
      .upsert(qualifiedPicks, {
        onConflict: "sport,home_team,away_team,pick,game_time",
        ignoreDuplicates: true,
      })
      .select("id");

    if (error) throw error;

    return new Response(JSON.stringify({
      success: true,
      scanned: games.length,
      qualified: qualifiedPicks.length,
      inserted: data?.length ?? 0,
      minimumConfidence: MIN_QUALIFIED_CONFIDENCE,
      lookaheadHours: LOOKAHEAD_HOURS,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in sync-bet-history:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
