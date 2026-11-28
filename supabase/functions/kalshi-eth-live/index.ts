import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const KALSHI_BASE = "https://external-api.kalshi.com/trade-api/v2";
const ETH_SERIES = "KXETH15M";
const COINBASE_TICKER = "https://api.exchange.coinbase.com/products/ETH-USD/ticker";

let cachedTicker = "";
let cachedTickerUntil = 0;
let cachedSeries: Record<string, unknown> | null = null;
let cachedSeriesUntil = 0;

function num(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function targetFromMarket(market: Record<string, unknown>): number | null {
  const floor = num(market.floor_strike);
  if (floor && floor > 0) return floor;

  const functional = num(market.functional_strike);
  if (functional && functional > 0) return functional;

  const custom = market.custom_strike as Record<string, unknown> | undefined;
  if (custom) {
    for (const value of Object.values(custom)) {
      const parsed = num(value);
      if (parsed && parsed > 100) return parsed;
    }
  }

  const text = `${market.title ?? ""} ${market.subtitle ?? ""} ${market.rules_primary ?? ""}`;
  const match = text.match(/\$([0-9][0-9,]*(?:\.[0-9]+)?)/);
  if (!match) return null;
  const parsed = Number(match[1].replaceAll(",", ""));
  return Number.isFinite(parsed) ? parsed : null;
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
  if (cachedTicker && cachedTickerUntil > now) return cachedTicker;

  const data = await kalshiJson(`/markets?series_ticker=${ETH_SERIES}&status=open&limit=100`);
  const markets = Array.isArray(data?.markets) ? data.markets : [];
  if (!markets.length) throw new Error("No open KXETH15M market found");

  const current = markets
    .map((market: Record<string, unknown>) => ({
      market,
      closeMs: Date.parse(String(market.close_time ?? market.latest_expiration_time ?? "")),
      openMs: Date.parse(String(market.open_time ?? "")),
    }))
    .filter((item: { closeMs: number }) => Number.isFinite(item.closeMs) && item.closeMs > now - 15_000)
    .sort((a: { closeMs: number; openMs: number }, b: { closeMs: number; openMs: number }) => {
      const aOpen = Number.isFinite(a.openMs) && a.openMs <= now ? 0 : 1;
      const bOpen = Number.isFinite(b.openMs) && b.openMs <= now ? 0 : 1;
      return aOpen - bOpen || a.closeMs - b.closeMs;
    })[0];

  if (!current?.market?.ticker) throw new Error("Unable to select current KXETH15M market");
  cachedTicker = String(current.market.ticker);
  cachedTickerUntil = Math.min(now + 15_000, current.closeMs + 2_000);
  return cachedTicker;
}

async function getSeries() {
  const now = Date.now();
  if (cachedSeries && cachedSeriesUntil > now) return cachedSeries;
  const data = await kalshiJson(`/series/${ETH_SERIES}`);
  const series = data?.series ?? {};
  cachedSeries = {
    ticker: String(series.ticker ?? ETH_SERIES),
    title: String(series.title ?? "ETH Up or Down - 15 minutes"),
    frequency: String(series.frequency ?? ""),
    feeType: String(series.fee_type ?? ""),
    feeMultiplier: num(series.fee_multiplier),
    settlementSources: Array.isArray(series.settlement_sources) ? series.settlement_sources : [],
  };
  cachedSeriesUntil = now + 5 * 60_000;
  return cachedSeries;
}

function normalizeMarket(market: Record<string, unknown>) {
  const closeTime = String(market.close_time ?? market.latest_expiration_time ?? "");
  const closeMs = Date.parse(closeTime);
  return {
    ticker: String(market.ticker ?? ""),
    eventTicker: String(market.event_ticker ?? ""),
    title: String(market.title ?? "ETH Up or Down - 15 minutes"),
    subtitle: String(market.subtitle ?? ""),
    status: String(market.status ?? ""),
    result: String(market.result ?? "").toLowerCase(),
    target: targetFromMarket(market),
    openTime: String(market.open_time ?? ""),
    closeTime,
    secondsToClose: Number.isFinite(closeMs) ? Math.max(0, (closeMs - Date.now()) / 1000) : null,
    yes: {
      bid: num(market.yes_bid_dollars),
      ask: num(market.yes_ask_dollars),
      bidSize: num(market.yes_bid_size_fp),
      askSize: num(market.yes_ask_size_fp),
    },
    no: {
      bid: num(market.no_bid_dollars),
      ask: num(market.no_ask_dollars),
      bidSize: num(market.no_bid_size_fp),
      askSize: num(market.no_ask_size_fp),
    },
    last: num(market.last_price_dollars),
    volume: num(market.volume_fp),
    priceLevelStructure: String(market.price_level_structure ?? ""),
    rulesPrimary: String(market.rules_primary ?? ""),
  };
}

async function requestedTicker(req: Request): Promise<string | null> {
  const url = new URL(req.url);
  const queryTicker = url.searchParams.get("ticker")?.trim();
  if (queryTicker) return queryTicker;
  if (req.method !== "POST") return null;
  const body = await req.json().catch(() => ({}));
  return typeof body?.ticker === "string" && body.ticker.trim() ? body.ticker.trim() : null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "GET" && req.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const explicitTicker = await requestedTicker(req);
    const ticker = explicitTicker || await discoverCurrentTicker();

    const [marketData, coinbaseResponse, series] = await Promise.all([
      kalshiJson(`/markets/${encodeURIComponent(ticker)}`),
      fetch(COINBASE_TICKER, {
        headers: { Accept: "application/json", "Cache-Control": "no-cache" },
      }).catch(() => null),
      getSeries().catch(() => null),
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
    if (!explicitTicker && normalized.secondsToClose !== null && normalized.secondsToClose <= 0) {
      cachedTicker = "";
      cachedTickerUntil = 0;
    }

    return new Response(JSON.stringify({
      ok: true,
      source: {
        kalshi: "Kalshi public Trade API",
        signalReference: "Coinbase ETH-USD (monitoring only)",
        settlementReference: "Kalshi market result",
      },
      series,
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
