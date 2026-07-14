// =============================================================
// OddsScreen.tsx — Pro odds comparison screen
// Route: /odds. Same board identity as ProofPage/EdgeFeed.
// Reads odds_board_latest only (zero API cost). Shows:
//   - events × books grid per sport + market
//   - best price per outcome highlighted amber
//   - no-vig fair line devigged from Pinnacle/Circa
//   - movement vs opening line/price (▲▼ with delta)
// Realtime subscription + 60s polling fallback.
// =============================================================

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import BetButton from "@/components/BetButton";

// ---------- Types ----------
type BoardRow = {
  id: string;
  dedup_key: string;
  odds_api_event_id: string;
  sport: string;
  event: string;
  commence_time: string;
  market: "h2h" | "spreads" | "totals";
  book: string;
  outcome: string;
  point: number | null;
  price: number;
  opening_point: number | null;
  opening_price: number;
  updated_at: string;
  bet_link: string | null;
};

// ---------- Palette (board tokens) ----------
const C = {
  bg: "#0B0F17",
  panel: "#121826",
  panelUp: "#161E30",
  line: "#1F2A3F",
  text: "#E8EDF5",
  muted: "#8B98AC",
  amber: "#F5B942",
  pos: "#3DDC84",
  neg: "#FF5C5C",
};

const SHARP = ["pinnacle", "circasports"];
const BOOK_ORDER = ["pinnacle", "circasports", "draftkings", "fanduel", "betmgm", "caesars", "espnbet", "hardrockbet", "betrivers", "bovada"];
const BOOK_LABEL: Record<string, string> = {
  pinnacle: "PIN", circasports: "CIRCA", draftkings: "DK", fanduel: "FD",
  betmgm: "MGM", caesars: "CZR", espnbet: "ESPN", hardrockbet: "HR",
  betrivers: "BR", bovada: "BOV",
};

const MARKETS: { key: BoardRow["market"]; label: string }[] = [
  { key: "spreads", label: "SPREAD" },
  { key: "h2h", label: "MONEYLINE" },
  { key: "totals", label: "TOTAL" },
];

// ---------- Helpers ----------
const toAmerican = (dec: number) =>
  dec >= 2 ? `+${Math.round((dec - 1) * 100)}` : `${Math.round(-100 / (dec - 1))}`;

const fmtPoint = (p: number | null, market: string) =>
  p == null ? "" : market === "totals" ? `${p}` : `${p > 0 ? "+" : ""}${p}`;

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" });

// ---------- Page ----------
export default function OddsScreen() {
  const [rows, setRows] = useState<BoardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sport, setSport] = useState<string>("");
  const [market, setMarket] = useState<BoardRow["market"]>("spreads");

  const load = async () => {
    const { data } = await supabase
      .from("odds_board_latest")
      .select("*")
      .gt("commence_time", new Date().toISOString())
      .order("commence_time", { ascending: true })
      .limit(4000);
    if (data) {
      setRows(data as BoardRow[]);
      if (!sport && data.length) setSport((data[0] as BoardRow).sport);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel("odds-board")
      .on("postgres_changes", { event: "*", schema: "public", table: "odds_board_latest" }, load)
      .subscribe();
    const t = setInterval(load, 60_000);
    return () => {
      supabase.removeChannel(channel);
      clearInterval(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sports = useMemo(() => Array.from(new Set(rows.map((r) => r.sport))).sort(), [rows]);

  // Group current sport+market rows by event
  const events = useMemo(() => {
    const filtered = rows.filter((r) => r.sport === sport && r.market === market);
    const map = new Map<string, { event: string; commence_time: string; rows: BoardRow[] }>();
    for (const r of filtered) {
      if (!map.has(r.odds_api_event_id)) {
        map.set(r.odds_api_event_id, { event: r.event, commence_time: r.commence_time, rows: [] });
      }
      map.get(r.odds_api_event_id)!.rows.push(r);
    }
    return [...map.values()].sort((a, b) => +new Date(a.commence_time) - +new Date(b.commence_time));
  }, [rows, sport, market]);

  // Books present in this view, sharp-first order
  const books = useMemo(() => {
    const present = new Set(rows.filter((r) => r.sport === sport && r.market === market).map((r) => r.book));
    const ordered = BOOK_ORDER.filter((b) => present.has(b));
    const extra = [...present].filter((b) => !BOOK_ORDER.includes(b)).sort();
    return [...ordered, ...extra].slice(0, 10);
  }, [rows, sport, market]);

  return (
    <div className="odds-root" style={{ background: C.bg, color: C.text, minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        .odds-root { font-family: 'IBM Plex Mono', ui-monospace, monospace; }
        .odds-display { font-family: 'Barlow Condensed', sans-serif; letter-spacing: 0.02em; }
        .odds-eyebrow { font-family: 'Barlow Condensed', sans-serif; letter-spacing: 0.22em; text-transform: uppercase; font-weight: 600; }
        .odds-tab:focus-visible { outline: 2px solid ${C.amber}; outline-offset: 2px; }
        .best-cell { background: rgba(245,185,66,0.12); box-shadow: inset 0 0 0 1px rgba(245,185,66,0.45); border-radius: 3px; }
      `}</style>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 20px 64px" }}>
        {/* Header */}
        <header style={{ marginBottom: 24 }}>
          <div className="odds-eyebrow" style={{ color: C.amber, fontSize: 13, marginBottom: 8 }}>
            Multi-Book Screen · Best Price Highlighted · Movement vs Open
          </div>
          <h1 className="odds-display" style={{ fontSize: 52, fontWeight: 700, lineHeight: 1, margin: 0 }}>
            ODDS SCREEN
          </h1>
        </header>

        {/* Sport + market tabs */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
          {sports.map((s) => (
            <Tab key={s} label={s} active={sport === s} onClick={() => setSport(s)} />
          ))}
          <span style={{ width: 1, background: C.line, margin: "0 6px" }} />
          {MARKETS.map((m) => (
            <Tab key={m.key} label={m.label} active={market === m.key} onClick={() => setMarket(m.key)} />
          ))}
        </div>

        {loading ? (
          <div style={{ color: C.muted, padding: "48px 0" }}>Loading board…</div>
        ) : events.length === 0 ? (
          <div style={{ border: `1px solid ${C.line}`, borderRadius: 6, background: C.panel, padding: "48px 20px", textAlign: "center", color: C.muted, fontSize: 13 }}>
            No upcoming lines on the board for this view. The scanner refreshes every 5 minutes.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 14 }}>
            {events.map((ev) => (
              <EventBlock key={ev.event + ev.commence_time} ev={ev} books={books} market={market} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Event block: outcomes × books grid ----------
function EventBlock({
  ev,
  books,
  market,
}: {
  ev: { event: string; commence_time: string; rows: BoardRow[] };
  books: string[];
  market: BoardRow["market"];
}) {
  // Outcomes in stable order: away, home for teams; Over, Under for totals
  const outcomes = useMemo(() => {
    const names = Array.from(new Set(ev.rows.map((r) => r.outcome)));
    if (market === "totals") return names.sort((a) => (a === "Over" ? -1 : 1));
    const [away] = ev.event.split(" @ ");
    return names.sort((a) => (a === away ? -1 : 1));
  }, [ev, market]);

  // Cell lookup + best price per outcome
  const cell = (outcome: string, book: string) =>
    ev.rows.find((r) => r.outcome === outcome && r.book === book);

  const bestPrice = (outcome: string) =>
    Math.max(...ev.rows.filter((r) => r.outcome === outcome).map((r) => Number(r.price)));

  // No-vig fair from first sharp book present
  const fair = useMemo(() => {
    for (const sharp of SHARP) {
      const sharpRows = ev.rows.filter((r) => r.book === sharp);
      if (sharpRows.length >= 2) {
        const totalImplied = sharpRows.reduce((s, r) => s + 1 / Number(r.price), 0);
        const m = new Map<string, { prob: number; point: number | null }>();
        for (const r of sharpRows) {
          m.set(r.outcome, { prob: 1 / Number(r.price) / totalImplied, point: r.point });
        }
        return { map: m, source: sharp };
      }
    }
    return null;
  }, [ev]);

  return (
    <section style={{ border: `1px solid ${C.line}`, borderRadius: 6, background: C.panel, overflowX: "auto" }}>
      {/* Event header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "10px 14px", borderBottom: `1px solid ${C.line}` }}>
        <span className="odds-display" style={{ fontSize: 18, fontWeight: 600 }}>{ev.event}</span>
        <span className="odds-eyebrow" style={{ fontSize: 9, color: C.muted }}>{fmtTime(ev.commence_time)}</span>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 720 }}>
        <thead>
          <tr>
            <th className="odds-eyebrow" style={thStyle}>Outcome</th>
            <th className="odds-eyebrow" style={{ ...thStyle, color: C.amber }}>
              Fair{fair ? ` (${BOOK_LABEL[fair.source] ?? fair.source})` : ""}
            </th>
            {books.map((b) => (
              <th key={b} className="odds-eyebrow" style={thStyle}>{BOOK_LABEL[b] ?? b.toUpperCase().slice(0, 5)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {outcomes.map((outcome) => {
            const best = bestPrice(outcome);
            const f = fair?.map.get(outcome);
            return (
              <tr key={outcome} style={{ borderTop: `1px solid ${C.line}` }}>
                <td style={{ ...tdStyle, fontWeight: 600, whiteSpace: "nowrap" }}>{outcome}</td>
                <td style={{ ...tdStyle, color: C.amber, whiteSpace: "nowrap" }}>
                  {f ? `${Math.round(f.prob * 100)}%${f.point != null ? ` · ${fmtPoint(f.point, market)}` : ""}` : "—"}
                </td>
                {books.map((b) => {
                  const r = cell(outcome, b);
                  if (!r) return <td key={b} style={{ ...tdStyle, color: C.muted }}>—</td>;
                  const isBest = Number(r.price) === best;
                  return (
                    <td key={b} style={tdStyle}>
                      <div className={isBest ? "best-cell" : undefined} style={{ padding: "3px 6px", display: "inline-block" }}>
                        <div style={{ whiteSpace: "nowrap", color: isBest ? C.amber : C.text }}>
                          {r.point != null && <span style={{ marginRight: 5 }}>{fmtPoint(Number(r.point), market)}</span>}
                          <span style={{ fontWeight: 600 }}>{toAmerican(Number(r.price))}</span>
                        </div>
                        <Movement row={r} market={market} />
                        <div style={{ marginTop: 3 }}>
                          <BetButton book={r.book} apiLink={r.bet_link} compact />
                        </div>
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

// ---------- Movement vs open ----------
function Movement({ row, market }: { row: BoardRow; market: string }) {
  // Prefer line movement for spreads/totals; price movement for ML
  if (market !== "h2h" && row.point != null && row.opening_point != null && Number(row.point) !== Number(row.opening_point)) {
    const delta = Number(row.point) - Number(row.opening_point);
    return (
      <div style={{ fontSize: 9, color: delta > 0 ? C.pos : C.neg }}>
        {delta > 0 ? "▲" : "▼"} {Math.abs(delta)} <span style={{ color: C.muted }}>fr {fmtPoint(Number(row.opening_point), market)}</span>
      </div>
    );
  }
  if (Number(row.price) !== Number(row.opening_price)) {
    const up = Number(row.price) > Number(row.opening_price);
    return (
      <div style={{ fontSize: 9, color: up ? C.pos : C.neg }}>
        {up ? "▲" : "▼"} <span style={{ color: C.muted }}>fr {toAmerican(Number(row.opening_price))}</span>
      </div>
    );
  }
  return null;
}

// ---------- Small pieces ----------
function Tab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      className="odds-tab odds-eyebrow"
      onClick={onClick}
      style={{
        background: active ? C.amber : C.panel,
        color: active ? "#131313" : C.muted,
        border: `1px solid ${active ? C.amber : C.line}`,
        borderRadius: 4,
        padding: "8px 14px",
        fontSize: 11,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

const thStyle: React.CSSProperties = {
  padding: "8px 12px",
  textAlign: "left",
  fontSize: 9,
  color: C.muted,
};

const tdStyle: React.CSSProperties = {
  padding: "8px 12px",
  fontVariantNumeric: "tabular-nums",
  verticalAlign: "top",
};
