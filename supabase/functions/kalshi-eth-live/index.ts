import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const KALSHI_BASE = "https://external-api.kalshi.com/trade-api/v2";
const ETH_SERIES = "KXETH15M";
const COINBASE_TICKER = "https://api.exchange.coinbase.com/products/ETH-USD/ticker";

let cachedTicker = "";
let cachedUntil = 0;

function num(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function targetFromMarket(market: Record<string, unknown>): number | null {
  const floor = num(market.floor_strike);
  if (floor && floor > 0) return floor;

  const functional = num(market.functional_strike);
  if (functional && functional > 0) return functional;

  const text = `${market.title ?? ""} ${market.subtitle ?? ""} ${market.rules_primary ?? ""}`;
  const match = text.match(/\$([0-9][0-9,]*(?:\.[0-9]+)?)\s*(?:target|to beat)?/i);
  if (!match) return null;
  return Number(match[1].replaceAll(",", ""));
}

async function kalshiJson(path: string) {
  const response = await fetch(`${KALSHI_BASE}${path}`, {
    headers: { Accept: "application/json", "Cache-Control": "no-cache" },
  });
  if (!response.ok) throw new Error(`Kalshi ${response.status}`);
  return await response.json();
}

async function discoverCurrentTicker(): Promise<string> {
  const now = Date.now();
  if (cachedTicker && cachedUntil > now) return cachedTicker;

  const data = await kalshiJson(`/markets?series_ticker=${ETH_SERIES}&status=open&limit=100`);
  const markets = Array.isArray(data?.markets) ? data.markets : [];
  if (!markets.length) throw new Error("No open KXETH15M market found");

  const current = markets
    .map((market: Record<string, unknown>) => ({
      market,
      closeMs: Date.parse(String(market.close_time ?? market.expected_expiration_time ?? "")),
      openMs: Date.parse(String(market.open_time ?? "")),
    }))
    .filter((item: { closeMs: number; openMs: number }) => Number.isFinite(item.closeMs) && item.closeMs > now - 15_000)
    .sort((a: { closeMs: number; openMs: number }, b: { closeMs: number; openMs: number }) => {
      const aOpen = Number.isFinite(a.openMs) && a.openMs <= now ? 0 : 1;
      const bOpen = Number.isFinite(b.openMs) && b.openMs <= now ? 0 : 1;
      return aOpen - bOpen || a.closeMs - b.closeMs;
    })[0];

  if (!current?.market?.ticker) throw new Error("Unable to select KXETH15M market");
  cachedTicker = String(current.market.ticker);
  cachedUntil = Math.min(now + 20_000, current.closeMs + 2_000);
  return cachedTicker;
}

function normalizeMarket(market: Record<string, unknown>) {
  const yesBid = num(market.yes_bid_dollars);
  const yesAsk = num(market.yes_ask_dollars);
  const noBid = num(market.no_bid_dollars);
  const noAsk = num(market.no_ask_dollars);
  const closeTime = String(market.close_time ?? market.expected_expiration_time ?? "");
  const closeMs = Date.parse(closeTime);

  return {
    ticker: String(market.ticker ?? ""),
    eventTicker: String(market.event_ticker ?? ""),
    title: String(market.title ?? "ETH Up or Down - 15 minutes"),
    subtitle: String(market.subtitle ?? ""),
    status: String(market.status ?? ""),
    result: String(market.result ?? ""),
    target: targetFromMarket(market),
    openTime: String(market.open_time ?? ""),
    closeTime,
    secondsToClose: Number.isFinite(closeMs) ? Math.max(0, (closeMs - Date.now()) / 1000) : null,
    yes: {
      bid: yesBid,
      ask: yesAsk,
      bidSize: num(market.yes_bid_size_fp),
      askSize: num(market.yes_ask_size_fp),
    },
    no: {
      bid: noBid,
      ask: noAsk,
      bidSize: num(market.no_bid_size_fp),
      askSize: num(market.no_ask_size_fp),
    },
    last: num(market.last_price_dollars),
    volume: num(market.volume_fp),
    rulesPrimary: String(market.rules_primary ?? ""),
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const requestedTicker = url.searchParams.get("ticker")?.trim();
    const ticker = requestedTicker || await discoverCurrentTicker();

    const [marketData, coinbaseResponse] = await Promise.all([
      kalshiJson(`/markets/${encodeURIComponent(ticker)}`),
      fetch(COINBASE_TICKER, {
        headers: { Accept: "application/json", "Cache-Control": "no-cache" },
      }).catch(() => null),
    ]);

    const market = marketData?.market;
    if (!market) throw new Error("Kalshi market payload missing market");

    let coinbase = null;
    if (coinbaseResponse?.ok) {
      const c = await coinbaseResponse.json();
      coinbase = {
        price: num(c?.price),
        bid: num(c?.bid),
        ask: num(c?.ask),
        time: c?.time ?? null,
      };
    }

    const normalized = normalizeMarket(market);
    if (!requestedTicker && normalized.secondsToClose !== null && normalized.secondsToClose <= 0) {
      cachedTicker = "";
      cachedUntil = 0;
    }

    return new Response(JSON.stringify({
      ok: true,
      source: {
        kalshi: "Kalshi public Trade API",
        signalReference: "Coinbase ETH-USD",
        settlementReference: "Kalshi result / CF Benchmarks rules",
      },
      market: normalized,
      coinbase,
      serverTime: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
      serverTime: new Date().toISOString(),
    }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }
});
