// =============================================================
// ProofPage.tsx (v2) — "The Board"
// Self-contained visual identity: ink-navy terminal, amber
// LED odds-board stat strip, condensed display type, mono data.
// Scoped styles — won't fight your Lovable theme.
// Drop into src/pages/, route at /proof. No new dependencies.
// =============================================================

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from "recharts";

// ---------- Types ----------
type PickRow = {
  id: string;
  posted_at: string;
  sport: string;
  event: string;
  market: string;
  selection: string;
  book: string | null;
  odds_decimal: number;
  fair_prob: number;
  stake_units: number;
  closing_odds_decimal: number | null;
  result: "pending" | "win" | "loss" | "push" | "void";
  ev_pct: number;
  clv_pct: number | null;
  pl_units: number;
};

type ProofStats = {
  graded_picks: number;
  wins: number;
  losses: number;
  win_rate_pct: number;
  net_units: number;
  roi_pct: number;
  avg_clv_pct: number;
  model_brier: number;
  closing_brier: number | null;
};

type SortKey = "posted_at" | "sport" | "odds_decimal" | "ev_pct" | "clv_pct" | "pl_units";
type SortDir = "asc" | "desc";

// ---------- Palette (scoped) ----------
const C = {
  bg: "#0B0F17",
  panel: "#121826",
  panelUp: "#161E30",
  line: "#1F2A3F",
  text: "#E8EDF5",
  muted: "#8B98AC",
  amber: "#F5B942",
  amberDim: "#8A6A2A",
  pos: "#3DDC84",
  neg: "#FF5C5C",
  pending: "#F5B942",
};

// ---------- Helpers ----------
const toAmerican = (dec: number) =>
  dec >= 2 ? `+${Math.round((dec - 1) * 100)}` : `${Math.round(-100 / (dec - 1))}`;

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

const signed = (n: number, digits = 2) => `${n > 0 ? "+" : ""}${n.toFixed(digits)}`;

// ---------- Page ----------
export default function ProofPage() {
  const [picks, setPicks] = useState<PickRow[]>([]);
  const [stats, setStats] = useState<ProofStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [sportFilter, setSportFilter] = useState("All");
  const [resultFilter, setResultFilter] = useState("All");
  const [sortKey, setSortKey] = useState<SortKey>("posted_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  useEffect(() => {
    (async () => {
      const [picksRes, statsRes] = await Promise.all([
        supabase.from("picks").select("*").order("posted_at", { ascending: false }).limit(500),
        supabase.from("proof_stats").select("*").single(),
      ]);
      if (picksRes.data) setPicks(picksRes.data as PickRow[]);
      if (statsRes.data) setStats(statsRes.data as ProofStats);
      setLoading(false);
    })();
  }, []);

  const sports = useMemo(
    () => ["All", ...Array.from(new Set(picks.map((p) => p.sport))).sort()],
    [picks]
  );

  const filtered = useMemo(() => {
    let rows = picks;
    if (sportFilter !== "All") rows = rows.filter((p) => p.sport === sportFilter);
    if (resultFilter !== "All") rows = rows.filter((p) => p.result === resultFilter);
    const dir = sortDir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = a[sortKey] ?? -Infinity;
      const bv = b[sortKey] ?? -Infinity;
      if (av === bv) return 0;
      return av > bv ? dir : -dir;
    });
  }, [picks, sportFilter, resultFilter, sortKey, sortDir]);

  const equityCurve = useMemo(() => {
    const settled = picks
      .filter((p) => p.result === "win" || p.result === "loss")
      .sort((a, b) => +new Date(a.posted_at) - +new Date(b.posted_at));
    let cum = 0;
    return settled.map((p, i) => {
      cum += Number(p.pl_units);
      return { i: i + 1, units: +cum.toFixed(2) };
    });
  }, [picks]);

  const lastGraded = useMemo(() => {
    const settled = picks.filter((p) => p.result !== "pending");
    if (!settled.length) return null;
    return settled.reduce((a, b) => (a.posted_at > b.posted_at ? a : b));
  }, [picks]);

  const onSort = (key: SortKey) => {
    if (key === sortKey) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const beatsClose = stats?.closing_brier != null && stats.model_brier < stats.closing_brier;

  return (
    <div className="proof-root" style={{ background: C.bg, color: C.text, minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        .proof-root { font-family: 'IBM Plex Mono', ui-monospace, monospace; }
        .proof-display { font-family: 'Barlow Condensed', sans-serif; letter-spacing: 0.02em; }
        .proof-eyebrow { font-family: 'Barlow Condensed', sans-serif; letter-spacing: 0.22em; text-transform: uppercase; font-weight: 600; }
        .board-value { text-shadow: 0 0 18px rgba(245,185,66,0.35); }
        .board-value.pos { text-shadow: 0 0 18px rgba(61,220,132,0.35); }
        .board-value.neg { text-shadow: 0 0 18px rgba(255,92,92,0.3); }
        .proof-row { transition: background 120ms ease; }
        .proof-row:hover { background: ${C.panelUp}; }
        .proof-th button:focus-visible, .proof-filter:focus-visible {
          outline: 2px solid ${C.amber}; outline-offset: 2px; border-radius: 2px;
        }
        @media (prefers-reduced-motion: reduce) { .proof-row { transition: none; } }
      `}</style>

      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "48px 20px 64px" }}>
        {/* Header */}
        <header style={{ marginBottom: 28 }}>
          <div className="proof-eyebrow" style={{ color: C.amber, fontSize: 13, marginBottom: 8 }}>
            Public Ledger · Timestamped · Graded vs Close
          </div>
          <h1 className="proof-display" style={{ fontSize: 52, fontWeight: 700, lineHeight: 1, margin: 0 }}>
            TRACK RECORD
          </h1>
          <p style={{ color: C.muted, fontSize: 13, maxWidth: 620, marginTop: 12, lineHeight: 1.7 }}>
            Every pick is timestamped at post and graded against the closing line.
            Nothing edited, nothing removed.
            {lastGraded && (
              <span style={{ color: C.text }}> Last graded: {fmtDate(lastGraded.posted_at)}.</span>
            )}
          </p>
        </header>

        {/* THE BOARD — signature stat strip */}
        {loading ? (
          <div style={{ color: C.muted, padding: "48px 0" }}>Loading ledger…</div>
        ) : (
          <>
            {stats && (
              <section
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                  background: C.panel,
                  border: `1px solid ${C.line}`,
                  borderRadius: 6,
                  overflow: "hidden",
                  marginBottom: 24,
                }}
              >
                <BoardCell label="Record" value={`${stats.wins}–${stats.losses}`} sub={`${stats.graded_picks} graded`} />
                <BoardCell label="Win Rate" value={`${stats.win_rate_pct}%`} />
                <BoardCell
                  label="Net Units"
                  value={signed(Number(stats.net_units))}
                  tone={Number(stats.net_units) >= 0 ? "pos" : "neg"}
                />
                <BoardCell
                  label="ROI"
                  value={`${signed(Number(stats.roi_pct))}%`}
                  tone={Number(stats.roi_pct) >= 0 ? "pos" : "neg"}
                />
                <BoardCell
                  label="Avg CLV"
                  value={`${signed(Number(stats.avg_clv_pct))}%`}
                  tone={Number(stats.avg_clv_pct) >= 0 ? "pos" : "neg"}
                  sub="vs closing line"
                />
                <BoardCell
                  label="Brier"
                  value={`${stats.model_brier}`}
                  sub={
                    stats.closing_brier != null
                      ? `close ${stats.closing_brier}${beatsClose ? " · BEAT" : ""}`
                      : "lower is better"
                  }
                  tone={beatsClose ? "pos" : undefined}
                />
              </section>
            )}

            {/* Equity curve */}
            {equityCurve.length > 1 && (
              <section
                style={{
                  background: C.panel,
                  border: `1px solid ${C.line}`,
                  borderRadius: 6,
                  padding: "18px 18px 8px",
                  marginBottom: 24,
                }}
              >
                <div className="proof-eyebrow" style={{ color: C.muted, fontSize: 11, marginBottom: 10 }}>
                  Cumulative Units — Flat 1u Staking
                </div>
                <div style={{ height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={equityCurve} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                      <defs>
                        <linearGradient id="plFillV2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={C.amber} stopOpacity={0.28} />
                          <stop offset="100%" stopColor={C.amber} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="i" tick={{ fontSize: 10, fill: C.muted }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: C.muted }} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          background: C.panelUp,
                          border: `1px solid ${C.line}`,
                          borderRadius: 4,
                          fontFamily: "'IBM Plex Mono', monospace",
                          fontSize: 12,
                          color: C.text,
                        }}
                        formatter={(v: number) => [`${signed(v)} u`, "Net units"]}
                        labelFormatter={(l) => `Pick #${l}`}
                      />
                      <ReferenceLine y={0} stroke={C.line} />
                      <Area
                        type="monotone"
                        dataKey="units"
                        stroke={C.amber}
                        strokeWidth={2}
                        fill="url(#plFillV2)"
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </section>
            )}

            {/* Filters */}
            <section style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 12 }}>
              <Filter label="Sport" value={sportFilter} options={sports} onChange={setSportFilter} />
              <Filter
                label="Result"
                value={resultFilter}
                options={["All", "win", "loss", "push", "void", "pending"]}
                onChange={setResultFilter}
              />
              <span style={{ marginLeft: "auto", fontSize: 11, color: C.muted }}>
                {filtered.length} PICKS
              </span>
            </section>

            {/* Ledger */}
            <section style={{ border: `1px solid ${C.line}`, borderRadius: 6, overflowX: "auto", background: C.panel }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, minWidth: 860 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${C.line}` }}>
                    <Th onClick={() => onSort("posted_at")} active={sortKey === "posted_at"} dir={sortDir}>Posted</Th>
                    <Th onClick={() => onSort("sport")} active={sortKey === "sport"} dir={sortDir}>Sport</Th>
                    <ThStatic>Event / Selection</ThStatic>
                    <ThStatic>Book</ThStatic>
                    <Th onClick={() => onSort("odds_decimal")} active={sortKey === "odds_decimal"} dir={sortDir}>Odds</Th>
                    <ThStatic>Close</ThStatic>
                    <Th onClick={() => onSort("ev_pct")} active={sortKey === "ev_pct"} dir={sortDir}>EV</Th>
                    <Th onClick={() => onSort("clv_pct")} active={sortKey === "clv_pct"} dir={sortDir}>CLV</Th>
                    <Th onClick={() => onSort("pl_units")} active={sortKey === "pl_units"} dir={sortDir}>P/L</Th>
                    <ThStatic>Result</ThStatic>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.id} className="proof-row" style={{ borderBottom: `1px solid ${C.line}` }}>
                      <Td muted nowrap>{fmtDate(p.posted_at)}</Td>
                      <Td>{p.sport}</Td>
                      <Td>
                        <div style={{ fontWeight: 600, color: C.text }}>{p.selection}</div>
                        <div style={{ fontSize: 11, color: C.muted }}>{p.event} · {p.market}</div>
                      </Td>
                      <Td muted>{p.book ?? "—"}</Td>
                      <Td nowrap>{toAmerican(Number(p.odds_decimal))}</Td>
                      <Td muted nowrap>
                        {p.closing_odds_decimal ? toAmerican(Number(p.closing_odds_decimal)) : "—"}
                      </Td>
                      <Td nowrap>{signed(Number(p.ev_pct), 1)}%</Td>
                      <Td
                        nowrap
                        color={
                          p.clv_pct == null ? C.muted : Number(p.clv_pct) >= 0 ? C.pos : C.neg
                        }
                      >
                        {p.clv_pct != null ? `${signed(Number(p.clv_pct), 1)}%` : "—"}
                      </Td>
                      <Td
                        nowrap
                        color={
                          p.result === "pending"
                            ? C.muted
                            : Number(p.pl_units) > 0
                            ? C.pos
                            : Number(p.pl_units) < 0
                            ? C.neg
                            : C.muted
                        }
                      >
                        {p.result === "pending" ? "—" : signed(Number(p.pl_units))}
                      </Td>
                      <Td nowrap>
                        <Badge result={p.result} />
                      </Td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={10} style={{ padding: "36px 12px", textAlign: "center", color: C.muted }}>
                        No picks match these filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </section>

            {/* Methodology */}
            <footer
              style={{
                marginTop: 24,
                border: `1px solid ${C.line}`,
                borderRadius: 6,
                background: C.panel,
                padding: 18,
                fontSize: 12,
                color: C.muted,
                lineHeight: 1.8,
              }}
            >
              <span className="proof-eyebrow" style={{ color: C.amber, fontSize: 11, display: "block", marginBottom: 6 }}>
                How grading works
              </span>
              EV is computed from our model probability at post time. CLV compares the posted
              price to the closing price — consistently positive CLV means the picks beat the
              market before results are known. The Brier score measures probability accuracy
              (lower is better); beating the closing-line Brier is the strongest evidence of
              real predictive edge. Flat 1-unit staking unless noted; pushes and voids are
              excluded from win rate and Brier.
            </footer>
          </>
        )}
      </div>
    </div>
  );
}

// ---------- Subcomponents ----------
function BoardCell({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "pos" | "neg";
}) {
  const color = tone === "pos" ? C.pos : tone === "neg" ? C.neg : C.amber;
  return (
    <div style={{ padding: "16px 18px", borderRight: `1px solid ${C.line}` }}>
      <div className="proof-eyebrow" style={{ fontSize: 10, color: C.muted, marginBottom: 6 }}>
        {label}
      </div>
      <div
        className={`board-value ${tone ?? ""}`}
        style={{ fontSize: 26, fontWeight: 600, color, fontVariantNumeric: "tabular-nums" }}
      >
        {value}
      </div>
      {sub && <div style={{ fontSize: 10, color: C.muted, marginTop: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>{sub}</div>}
    </div>
  );
}

function Filter({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 11, color: C.muted }}>
      <span className="proof-eyebrow" style={{ fontSize: 10 }}>{label}</span>
      <select
        className="proof-filter"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          background: C.panel,
          color: C.text,
          border: `1px solid ${C.line}`,
          borderRadius: 4,
          padding: "6px 10px",
          fontFamily: "inherit",
          fontSize: 12,
          textTransform: "capitalize",
        }}
      >
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}

function Th({
  children,
  onClick,
  active,
  dir,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active: boolean;
  dir: SortDir;
}) {
  return (
    <th className="proof-th" style={{ padding: "10px 12px", textAlign: "left" }}>
      <button
        onClick={onClick}
        className="proof-eyebrow"
        style={{
          background: "none",
          border: "none",
          color: active ? C.amber : C.muted,
          fontSize: 10,
          cursor: "pointer",
          display: "inline-flex",
          gap: 4,
          padding: 0,
        }}
      >
        {children}
        <span style={{ opacity: active ? 1 : 0 }}>{dir === "asc" ? "▲" : "▼"}</span>
      </button>
    </th>
  );
}

function ThStatic({ children }: { children: React.ReactNode }) {
  return (
    <th className="proof-eyebrow" style={{ padding: "10px 12px", textAlign: "left", color: C.muted, fontSize: 10 }}>
      {children}
    </th>
  );
}

function Td({
  children,
  muted,
  nowrap,
  color,
}: {
  children: React.ReactNode;
  muted?: boolean;
  nowrap?: boolean;
  color?: string;
}) {
  return (
    <td
      style={{
        padding: "10px 12px",
        color: color ?? (muted ? C.muted : C.text),
        whiteSpace: nowrap ? "nowrap" : undefined,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {children}
    </td>
  );
}

function Badge({ result }: { result: PickRow["result"] }) {
  const map: Record<PickRow["result"], { bg: string; fg: string; label: string }> = {
    win: { bg: "rgba(61,220,132,0.12)", fg: C.pos, label: "WIN" },
    loss: { bg: "rgba(255,92,92,0.12)", fg: C.neg, label: "LOSS" },
    push: { bg: "rgba(139,152,172,0.12)", fg: C.muted, label: "PUSH" },
    void: { bg: "rgba(139,152,172,0.12)", fg: C.muted, label: "VOID" },
    pending: { bg: "rgba(245,185,66,0.12)", fg: C.pending, label: "LIVE" },
  };
  const s = map[result];
  return (
    <span
      className="proof-eyebrow"
      style={{
        background: s.bg,
        color: s.fg,
        fontSize: 9,
        padding: "3px 8px",
        borderRadius: 3,
        display: "inline-block",
      }}
    >
      {s.label}
    </span>
  );
}
