// Edge Scanner — scans The Odds API for +EV opportunities across active sports.
// Fair price is computed from de-vigged consensus across all books offering the same line.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Default sport keys — in-season / typical US coverage. Override via ?sports=k1,k2
const DEFAULT_SPORTS = [
  "baseball_mlb",
  "americanfootball_nfl",
  "americanfootball_ncaaf",
  "basketball_nba",
  "basketball_wnba",
  "icehockey_nhl",
  "soccer_epl",
  "soccer_uefa_champs_league",
  "mma_mixed_martial_arts",
];

const MARKETS = "h2h,spreads,totals";
const REGIONS = "us,us2,eu,uk";
const MIN_EV = 2.0; // percent
const MIN_BOOKS = 4;

const americanToDecimal = (a: number) =>
  a >= 100 ? 1 + a / 100 : a <= -100 ? 1 + 100 / Math.abs(a) : 1;

const decimalToAmerican = (d: number) => {
  if (d <= 1) return 0;
  return d >= 2 ? Math.round((d - 1) * 100) : Math.round(-100 / (d - 1));
};

// De-vig a two-way market by normalizing implied probabilities
function devig(pA: number, pB: number): [number, number] {
  const s = pA + pB;
  if (s <= 0) return [pA, pB];
  return [pA / s, pB / s];
}

type Opp = {
  sport: string;
  sport_key: string;
  event: string;
  commence_time: string;
  market: string;
  selection: string;
  line: number | null;
  book: string;
  odds_decimal: number;
  odds_american: number;
  fair_prob: number;
  fair_odds_decimal: number;
  ev_pct: number;
  edge_type: string;
  book_count: number;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const API_KEY = Deno.env.get("THE_ODDS_API_KEY");
    if (!API_KEY) throw new Error("THE_ODDS_API_KEY not configured");

    const url = new URL(req.url);
    const sportsParam = url.searchParams.get("sports");
    const sports = sportsParam ? sportsParam.split(",").filter(Boolean) : DEFAULT_SPORTS;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } },
    );

    const all: Opp[] = [];
    const boardRows: Array<{
      dedup_key: string;
      odds_api_event_id: string;
      sport: string;
      event: string;
      commence_time: string;
      market: string;
      book: string;
      outcome: string;
      point: number | null;
      price: number;
      opening_point: number | null;
      opening_price: number;
    }> = [];
    const errors: string[] = [];

    for (const sport of sports) {
      const oddsUrl = `https://api.the-odds-api.com/v4/sports/${sport}/odds/?apiKey=${API_KEY}&regions=${REGIONS}&markets=${MARKETS}&oddsFormat=american`;
      const res = await fetch(oddsUrl);
      if (!res.ok) {
        errors.push(`${sport}: ${res.status}`);
        continue;
      }
      const events = await res.json();
      if (!Array.isArray(events)) continue;

      for (const ev of events) {
        const eventLabel = `${ev.away_team} @ ${ev.home_team}`;
        const commence = ev.commence_time;
        const sportTitle = ev.sport_title || sport;

        // Group prices by (market, selection, line) across books
        const groups = new Map<
          string,
          { market: string; selection: string; line: number | null; prices: Array<{ book: string; american: number; decimal: number }> }
        >();

        for (const bm of ev.bookmakers || []) {
          const bookKey = String(bm.key || bm.title || "").toLowerCase();
          for (const mkt of bm.markets || []) {
            for (const oc of mkt.outcomes || []) {
              const line = oc.point ?? null;
              const sel =
                mkt.key === "totals" ? `${oc.name} ${line}` :
                mkt.key === "spreads" ? `${oc.name} ${line > 0 ? "+" : ""}${line}` :
                oc.name;
              const key = `${mkt.key}::${oc.name}::${line ?? "-"}`;
              const american = Number(oc.price);
              const decimal = americanToDecimal(american);
              if (!Number.isFinite(american) || decimal <= 1) continue;
              if (!groups.has(key)) groups.set(key, { market: mkt.key, selection: sel, line, prices: [] });
              groups.get(key)!.prices.push({ book: bm.title, american, decimal });

              // Persist raw grid for /odds screen (zero extra API cost).
              if (ev.id && ["h2h", "spreads", "totals"].includes(mkt.key)) {
                boardRows.push({
                  dedup_key: `${ev.id}|${mkt.key}|${bookKey}|${oc.name}`,
                  odds_api_event_id: String(ev.id),
                  sport: sportTitle,
                  event: eventLabel,
                  commence_time: commence,
                  market: mkt.key,
                  book: bookKey,
                  outcome: String(oc.name),
                  point: line,
                  price: Number(decimal.toFixed(4)),
                  opening_point: line,
                  opening_price: Number(decimal.toFixed(4)),
                });
              }
            }
          }
        }

        // For each grouping, compute consensus fair probability and detect edges
        for (const g of groups.values()) {
          if (g.prices.length < MIN_BOOKS) continue;

          // Consensus implied prob = median of 1/decimal across books
          const implied = g.prices.map((p) => 1 / p.decimal).sort((a, b) => a - b);
          const mid = implied[Math.floor(implied.length / 2)];
          // Approx de-vig: assume market total overround averages the same across books.
          // Estimate market overround from a paired opposite selection if present.
          let fair = mid;
          // Try to find opposite selection in the same event for pairing
          const oppositeKey = [...groups.keys()].find((k) => {
            const [mk, sel] = k.split("::");
            if (mk !== g.market) return false;
            if (g.market === "h2h") return sel !== g.selection.split(" ")[0] && sel !== g.selection;
            if (g.market === "totals") return sel !== (g.selection.startsWith("Over") ? "Over" : "Under");
            if (g.market === "spreads") return true;
            return false;
          });
          if (oppositeKey) {
            const opp = groups.get(oppositeKey)!;
            const oppImplied = opp.prices.map((p) => 1 / p.decimal).sort((a, b) => a - b);
            const oppMid = oppImplied[Math.floor(oppImplied.length / 2)];
            [fair] = devig(mid, oppMid);
          }
          const fairDec = 1 / Math.max(0.01, Math.min(0.99, fair));

          for (const p of g.prices) {
            const ev_pct = (p.decimal * fair - 1) * 100;
            if (ev_pct < MIN_EV) continue;
            all.push({
              sport: sportTitle,
              sport_key: sport,
              event: eventLabel,
              commence_time: commence,
              market: g.market,
              selection: g.selection,
              line: g.line,
              book: p.book,
              odds_decimal: Number(p.decimal.toFixed(4)),
              odds_american: p.american,
              fair_prob: Number(fair.toFixed(4)),
              fair_odds_decimal: Number(fairDec.toFixed(4)),
              ev_pct: Number(ev_pct.toFixed(2)),
              edge_type: "value",
              book_count: g.prices.length,
            });
          }
        }
      }
    }

    // Purge expired
    await supabase.from("opportunities").delete().lt("expires_at", new Date().toISOString());

    // Upsert new
    let inserted = 0;
    if (all.length > 0) {
      const rows = all.map((o) => ({
        ...o,
        detected_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      }));
      const { error, count } = await supabase
        .from("opportunities")
        .upsert(rows, { onConflict: "sport_key,event,market,selection,book,line", count: "exact" });
      if (error) throw error;
      inserted = count ?? rows.length;
    }

    return new Response(
      JSON.stringify({ ok: true, scanned_sports: sports.length, opportunities: all.length, upserted: inserted, errors }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[edge-scanner] ERROR", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
