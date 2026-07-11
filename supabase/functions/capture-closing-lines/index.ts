import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAdminOrCron, unauthorizedResponse } from "../_shared/adminAuth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const ODDS_API_KEY = Deno.env.get("THE_ODDS_API_KEY") || Deno.env.get("ODDS_API_KEY");
const LOOKAHEAD_MINUTES = 35;
const LOOKBACK_MINUTES = 20;
const MAX_BETS_PER_RUN = 80;

type ActiveBet = {
  id: string;
  game_id: string;
  sport: string;
  home_team: string;
  away_team: string;
  pick: string;
  pick_type: string;
  pick_value: number | null;
  odds: number;
  game_time: string;
  bookmaker?: string | null;
  market_type?: string | null;
  line?: number | null;
  pick_odds?: number | null;
  source_event_id?: string | null;
};

type OddsOutcome = {
  name: string;
  price: number;
  point?: number;
};

type OddsBookmaker = {
  key: string;
  title: string;
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

type ClosingCandidate = {
  bookmakerKey: string;
  bookmakerTitle: string;
  marketType: string;
  line: number | null;
  odds: number;
  raw: Record<string, unknown>;
};

const sportKeyMap: Record<string, string> = {
  nba: "basketball_nba",
  basketball: "basketball_nba",
  nfl: "americanfootball_nfl",
  football: "americanfootball_nfl",
  mlb: "baseball_mlb",
  baseball: "baseball_mlb",
  nhl: "icehockey_nhl",
  hockey: "icehockey_nhl",
  ncaab: "basketball_ncaab",
  ncaaf: "americanfootball_ncaaf",
  wnba: "basketball_wnba",
  ufc: "mma_mixed_martial_arts",
  mma: "mma_mixed_martial_arts",
  soccer: "soccer_epl",
  epl: "soccer_epl",
  mls: "soccer_usa_mls",
};

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function normalizeSport(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9_]+/g, "").trim();
}

function sportToApiKey(sport: string) {
  const normalized = normalizeSport(sport);
  return sportKeyMap[normalized] || (normalized.includes("_") ? normalized : null);
}

function impliedProbability(price: number) {
  return price < 0 ? Math.abs(price) / (Math.abs(price) + 100) : 100 / (price + 100);
}

function calculateClvPercent(pickOdds: number, closingOdds: number) {
  return Number(((impliedProbability(closingOdds) - impliedProbability(pickOdds)) * 100).toFixed(2));
}

function calculateClvCents(pickOdds: number, closingOdds: number) {
  return pickOdds - closingOdds;
}

function getMarketKey(bet: ActiveBet) {
  const type = (bet.market_type || bet.pick_type || "moneyline").toLowerCase();
  if (type.includes("spread")) return "spreads";
  if (type.includes("total") || type.includes("over") || type.includes("under")) return "totals";
  return "h2h";
}

function pickTeamName(bet: ActiveBet) {
  const pick = normalize(bet.pick);
  const home = normalize(bet.home_team);
  const away = normalize(bet.away_team);

  if (pick.includes(home) || home.includes(pick.replace(/\bml\b/g, "").trim())) return bet.home_team;
  if (pick.includes(away) || away.includes(pick.replace(/\bml\b/g, "").trim())) return bet.away_team;
  return null;
}

function outcomeMatchesBet(bet: ActiveBet, outcome: OddsOutcome, marketKey: string) {
  const pick = normalize(bet.pick);

  if (marketKey === "totals") {
    return pick.includes(normalize(outcome.name));
  }

  const pickedTeam = pickTeamName(bet);
  if (!pickedTeam) return false;
  return normalize(outcome.name) === normalize(pickedTeam);
}

function extractClosingCandidates(bet: ActiveBet, game: OddsGame): ClosingCandidate[] {
  const marketKey = getMarketKey(bet);
  const candidates: ClosingCandidate[] = [];

  for (const book of game.bookmakers || []) {
    const market = book.markets?.find((item) => item.key === marketKey);
    if (!market?.outcomes) continue;

    for (const outcome of market.outcomes) {
      if (!outcomeMatchesBet(bet, outcome, marketKey)) continue;
      if (typeof outcome.price !== "number") continue;

      candidates.push({
        bookmakerKey: book.key,
        bookmakerTitle: book.title || book.key,
        marketType: marketKey === "h2h" ? "moneyline" : marketKey,
        line: typeof outcome.point === "number" ? outcome.point : bet.line ?? bet.pick_value ?? null,
        odds: Math.round(outcome.price),
        raw: {
          bookKey: book.key,
          bookTitle: book.title,
          market: market.key,
          outcome,
        },
      });
    }
  }

  return candidates;
}

function selectClosingCandidate(bet: ActiveBet, candidates: ClosingCandidate[]) {
  if (candidates.length === 0) return null;

  const originalBook = normalize(bet.bookmaker || "");
  if (originalBook) {
    const sameBook = candidates.find((candidate) => {
      const title = normalize(candidate.bookmakerTitle);
      const key = normalize(candidate.bookmakerKey);
      return title === originalBook || key === originalBook || title.includes(originalBook) || originalBook.includes(title);
    });
    if (sameBook) return sameBook;
  }

  return [...candidates].sort((a, b) => b.odds - a.odds)[0];
}

async function fetchOddsBySport(sportKey: string, eventIds: string[]) {
  if (!ODDS_API_KEY) throw new Error("THE_ODDS_API_KEY or ODDS_API_KEY is not configured");

  const url = new URL(`https://api.the-odds-api.com/v4/sports/${sportKey}/odds/`);
  url.searchParams.set("apiKey", ODDS_API_KEY);
  url.searchParams.set("regions", "us");
  url.searchParams.set("markets", "h2h,spreads,totals");
  url.searchParams.set("oddsFormat", "american");
  url.searchParams.set("dateFormat", "iso");
  url.searchParams.set("eventIds", eventIds.join(","));

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`The Odds API returned ${response.status} for ${sportKey}`);
  }

  const games = await response.json();
  return Array.isArray(games) ? games as OddsGame[] : [];
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

    const now = Date.now();
    const windowStart = new Date(now - LOOKBACK_MINUTES * 60 * 1000).toISOString();
    const windowEnd = new Date(now + LOOKAHEAD_MINUTES * 60 * 1000).toISOString();

    const { data: bets, error } = await supabase
      .from("active_bets")
      .select("*")
      .eq("status", "pending")
      .is("closing_odds", null)
      .gte("game_time", windowStart)
      .lte("game_time", windowEnd)
      .order("game_time", { ascending: true })
      .limit(MAX_BETS_PER_RUN);

    if (error) throw error;

    const activeBets = (bets || []) as ActiveBet[];
    if (activeBets.length === 0) {
      return new Response(JSON.stringify({ success: true, scanned: 0, updated: 0, message: "No closing lines due" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const betsBySport = activeBets.reduce((groups, bet) => {
      const sportKey = sportToApiKey(bet.sport);
      if (!sportKey) return groups;
      if (!groups[sportKey]) groups[sportKey] = [];
      groups[sportKey].push(bet);
      return groups;
    }, {} as Record<string, ActiveBet[]>);

    let updated = 0;
    let snapshotsInserted = 0;
    const skipped: Array<{ betId: string; reason: string }> = [];

    for (const [sportKey, sportBets] of Object.entries(betsBySport)) {
      const eventIds = [...new Set(sportBets.map((bet) => bet.source_event_id || bet.game_id).filter(Boolean))];
      if (eventIds.length === 0) continue;

      let games: OddsGame[] = [];
      try {
        games = await fetchOddsBySport(sportKey, eventIds);
      } catch (fetchError) {
        console.error(`[capture-closing-lines] ${sportKey} failed`, fetchError);
        for (const bet of sportBets) skipped.push({ betId: bet.id, reason: "odds_fetch_failed" });
        continue;
      }

      const gamesById = new Map(games.map((game) => [game.id, game]));

      for (const bet of sportBets) {
        const game = gamesById.get(bet.source_event_id || bet.game_id);
        if (!game) {
          skipped.push({ betId: bet.id, reason: "event_not_found" });
          continue;
        }

        const candidates = extractClosingCandidates(bet, game);
        const selected = selectClosingCandidate(bet, candidates);
        if (!selected) {
          skipped.push({ betId: bet.id, reason: "matching_market_not_found" });
          continue;
        }

        if (candidates.length > 0) {
          const capturedAt = new Date().toISOString();
          const { error: snapshotError } = await supabase
            .from("odds_closing_snapshots")
            .insert(candidates.map((candidate) => ({
              active_bet_id: bet.id,
              game_id: bet.source_event_id || bet.game_id,
              sport: bet.sport,
              bookmaker: candidate.bookmakerTitle,
              market_type: candidate.marketType,
              line: candidate.line,
              odds: candidate.odds,
              captured_at: capturedAt,
              raw: candidate.raw,
            })));

          if (snapshotError) {
            console.error(`[capture-closing-lines] snapshot insert failed for ${bet.id}`, snapshotError);
          } else {
            snapshotsInserted += candidates.length;
          }
        }

        const pickOdds = bet.pick_odds ?? bet.odds;
        const clvPercent = calculateClvPercent(pickOdds, selected.odds);
        const clvCents = calculateClvCents(pickOdds, selected.odds);

        const { error: updateError } = await supabase
          .from("active_bets")
          .update({
            closing_odds: selected.odds,
            closing_line: selected.line,
            closing_bookmaker: selected.bookmakerTitle,
            closing_captured_at: new Date().toISOString(),
            clv_percent: clvPercent,
            clv_cents: clvCents,
          })
          .eq("id", bet.id);

        if (updateError) {
          console.error(`[capture-closing-lines] active bet update failed for ${bet.id}`, updateError);
          skipped.push({ betId: bet.id, reason: "update_failed" });
          continue;
        }

        updated++;
      }
    }

    return new Response(JSON.stringify({
      success: true,
      scanned: activeBets.length,
      updated,
      snapshotsInserted,
      skipped,
      windowStart,
      windowEnd,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in capture-closing-lines:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
