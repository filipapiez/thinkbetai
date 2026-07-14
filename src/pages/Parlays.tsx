import { useState, useEffect, useMemo } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { ParlayDetailDialog } from '@/components/ParlayDetailDialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface ParlayLeg {
  gameIndex: number;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  gameDate?: string;
  pick: 'home' | 'away';
  pickType: string;
  pickDetail: string;
  reasoning: string;
}

interface SuggestedParlay {
  name: string;
  signal: 'STRONG' | 'DECENT' | 'RISKY';
  confidence: number;
  legs: ParlayLeg[];
  rationale: string;
  estimatedOdds: string;
}

// ---------- Board palette ----------
const C = {
  bg: '#0B0F17',
  panel: '#121826',
  panelUp: '#161E30',
  line: '#1F2A3F',
  text: '#E8EDF5',
  muted: '#8B98AC',
  amber: '#F5B942',
  pos: '#3DDC84',
  neg: '#FF5C5C',
};

// ---------- Helpers ----------
const americanToDecimal = (s: string): number => {
  const n = parseInt(String(s).replace(/[^-+0-9]/g, ''), 10);
  if (!Number.isFinite(n) || n === 0) return 2;
  return n > 0 ? 1 + n / 100 : 1 + 100 / Math.abs(n);
};
const toAmerican = (dec: number) =>
  dec >= 2 ? `+${Math.round((dec - 1) * 100)}` : `${Math.round(-100 / (dec - 1))}`;
const impliedPct = (dec: number) => (1 / dec) * 100;
const evPct = (modelProb: number, dec: number) => (modelProb * dec - 1) * 100;
const signed = (n: number, d = 1) => `${n > 0 ? '+' : ''}${n.toFixed(d)}`;

function getGrade(confidence: number): string {
  if (confidence >= 80) return 'A+';
  if (confidence >= 73) return 'A';
  if (confidence >= 66) return 'B+';
  if (confidence >= 60) return 'B';
  if (confidence >= 55) return 'C+';
  if (confidence >= 50) return 'C';
  if (confidence >= 40) return 'D';
  return 'F';
}

const Parlays = () => {
  const { user } = useAuth();
  const [parlays, setParlays] = useState<SuggestedParlay[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [selectedParlay, setSelectedParlay] = useState<SuggestedParlay | null>(null);

  const fetchSuggestions = async (forceRefresh = false) => {
    if (!user) {
      toast.error('Please log in to see AI parlay suggestions');
      return;
    }
    if (forceRefresh) setRefreshing(true);
    else setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-parlays', {
        body: { forceRefresh },
      });
      if (error) {
        console.error('Error fetching parlay suggestions:', error);
        toast.error('Failed to load suggestions');
        return;
      }
      if (data?.success && data?.parlays) {
        setParlays(data.parlays);
      } else if (data?.message) {
        toast.info(data.message);
      }
    } catch (err) {
      console.error('Error:', err);
      toast.error('Failed to load suggestions');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
      setHasLoaded(true);
    }
  };

  useEffect(() => {
    if (user && !hasLoaded) fetchSuggestions();
  }, [user]);

  // Sort by EV descending (positive EV first)
  const sorted = useMemo(() => {
    return [...parlays]
      .map((p) => ({
        p,
        ev: evPct(p.confidence / 100, americanToDecimal(p.estimatedOdds)),
      }))
      .sort((a, b) => b.ev - a.ev)
      .map((x) => x.p);
  }, [parlays]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: C.bg, color: C.text }}>
      <SEO
        title="AI Game Parlays - Model vs Book EV Board"
        description="AI-built parlay combos graded by model probability vs the book's implied price. Positive-EV combos first, honest numbers on every card."
        keywords="parlay builder, AI parlays, sports betting parlays, EV parlays"
        url="/parlays"
      />
      <Header />

      <main className="flex-1 parlay-root">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
          .parlay-root { font-family: 'IBM Plex Mono', ui-monospace, monospace; }
          .parlay-display { font-family: 'Barlow Condensed', sans-serif; letter-spacing: 0.02em; }
          .parlay-eyebrow { font-family: 'Barlow Condensed', sans-serif; letter-spacing: 0.22em; text-transform: uppercase; font-weight: 600; }
          .parlay-card { transition: background 120ms ease, border-color 120ms ease; cursor: pointer; }
          .parlay-card:hover { background: ${C.panelUp}; border-color: ${C.amber}44; }
          .parlay-btn:focus-visible { outline: 2px solid ${C.amber}; outline-offset: 2px; }
          @media (prefers-reduced-motion: reduce) { .parlay-card { transition: none; } }
        `}</style>

        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '48px 20px 64px' }}>
          {/* Header */}
          <header
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 16,
              marginBottom: 28,
            }}
          >
            <div>
              <div className="parlay-eyebrow" style={{ color: C.amber, fontSize: 13, marginBottom: 8 }}>
                Model-Built Combos · Graded vs Book Implied · Tap Any Card
              </div>
              <h1 className="parlay-display" style={{ fontSize: 52, fontWeight: 700, lineHeight: 1, margin: 0 }}>
                AI PARLAYS
              </h1>
            </div>
            <button
              className="parlay-btn parlay-eyebrow"
              onClick={() => fetchSuggestions(true)}
              disabled={isLoading || refreshing}
              style={{
                background: 'transparent',
                border: `1px solid ${C.amber}`,
                color: C.amber,
                borderRadius: 4,
                padding: '10px 18px',
                fontSize: 11,
                cursor: 'pointer',
                opacity: isLoading || refreshing ? 0.6 : 1,
              }}
            >
              {refreshing ? 'Refreshing…' : '↻ Refresh'}
            </button>
          </header>

          {!user ? (
            <div style={{ color: C.muted, padding: '48px 0' }}>
              Sign in to see AI-generated parlay combos.
            </div>
          ) : isLoading ? (
            <div style={{ color: C.muted, padding: '48px 0' }}>Building parlays…</div>
          ) : sorted.length === 0 ? (
            <div style={{ color: C.muted, padding: '48px 0' }}>
              No parlays available yet. Check back when more games are scheduled.
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(480px, 100%), 1fr))',
                gap: 14,
              }}
            >
              {sorted.map((p, i) => (
                <ParlayCard key={i} p={p} onOpen={() => setSelectedParlay(p)} />
              ))}
            </div>
          )}

          <footer style={{ marginTop: 28, fontSize: 11, color: C.muted, lineHeight: 1.8 }}>
            Model probability is our estimate that every leg hits. Implied is what the book's combined
            price says. EV is the gap between them — positive means the payout is bigger than the risk
            justifies by our numbers.{' '}
            <a href="/track-record" style={{ color: C.amber, textDecoration: 'none' }}>
              How grades work & full track record →
            </a>
          </footer>
        </div>
      </main>

      <ParlayDetailDialog
        parlay={selectedParlay}
        open={!!selectedParlay}
        onOpenChange={(open) => !open && setSelectedParlay(null)}
      />

      <Footer />
    </div>
  );
};

// ---------- Card ----------
function ParlayCard({ p, onOpen }: { p: SuggestedParlay; onOpen: () => void }) {
  const combinedDec = americanToDecimal(p.estimatedOdds);
  const modelProb = Math.max(0, Math.min(1, p.confidence / 100));
  const implied = impliedPct(combinedDec);
  const model = modelProb * 100;
  const ev = evPct(modelProb, combinedDec);
  const evColor = ev >= 0 ? C.pos : C.neg;
  const grade = getGrade(p.confidence);
  const confidenceLabel = p.signal.toLowerCase();

  // Derive per-leg fair split (evenly distributed) when per-leg odds aren't provided
  const n = p.legs.length || 1;
  const perLegDec = Math.pow(combinedDec, 1 / n);
  const perLegModel = Math.pow(modelProb, 1 / n) * 100;
  const perLegImplied = impliedPct(perLegDec);

  return (
    <section
      className="parlay-card"
      onClick={onOpen}
      style={{
        border: `1px solid ${C.line}`,
        borderLeft: `3px solid ${evColor}`,
        borderRadius: 6,
        background: C.panel,
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {/* Top row: chips + grade */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Chip>{p.legs.length} LEG</Chip>
          <Chip tone={confidenceLabel === 'strong' ? 'amber' : confidenceLabel === 'risky' ? 'neg' : undefined}>
            {confidenceLabel}
          </Chip>
        </div>
        <div
          className="parlay-display"
          style={{
            border: `1.5px solid ${C.amber}`,
            color: C.amber,
            borderRadius: 5,
            minWidth: 44,
            textAlign: 'center',
            padding: '6px 8px',
            fontSize: 20,
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          {grade}
        </div>
      </div>

      {/* Title */}
      <h2 className="parlay-display" style={{ fontSize: 22, fontWeight: 600, margin: 0, lineHeight: 1.1 }}>
        {p.name}
      </h2>

      {/* Legs */}
      <div style={{ display: 'grid', gap: 8 }}>
        {p.legs.map((leg, i) => {
          const legEdge = perLegModel - perLegImplied;
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: 10,
                alignItems: 'baseline',
                borderTop: i > 0 ? `1px solid ${C.line}` : undefined,
                paddingTop: i > 0 ? 8 : 0,
              }}
            >
              <span className="parlay-eyebrow" style={{ fontSize: 9, color: C.muted, minWidth: 12 }}>
                {i + 1}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 12.5,
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {leg.pickDetail}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: C.muted,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {leg.awayTeam} vs {leg.homeTeam} · {leg.sport}
                  {leg.gameDate ? ` · ${leg.gameDate}` : ''}
                </div>
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: C.muted,
                  textAlign: 'right',
                  whiteSpace: 'nowrap',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                model {perLegModel.toFixed(0)}%{' '}
                <span style={{ color: legEdge >= 0 ? C.pos : C.neg }}>
                  vs {perLegImplied.toFixed(0)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Stats row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 8,
          borderTop: `1px solid ${C.line}`,
          paddingTop: 12,
          marginTop: 'auto',
        }}
      >
        <Stat label="Payout" value={toAmerican(combinedDec)} color={C.amber} />
        <Stat label="Model" value={`${model.toFixed(0)}%`} />
        <Stat label="Implied" value={`${implied.toFixed(0)}%`} />
        <Stat label="EV" value={`${signed(ev)}%`} color={evColor} />
      </div>

      <div className="parlay-eyebrow" style={{ fontSize: 10, color: C.muted, textAlign: 'right' }}>
        Details →
      </div>
    </section>
  );
}

function Chip({ children, tone }: { children: React.ReactNode; tone?: 'amber' | 'neg' }) {
  const color = tone === 'amber' ? C.amber : tone === 'neg' ? C.neg : C.muted;
  return (
    <span
      className="parlay-eyebrow"
      style={{
        border: `1px solid ${color}55`,
        color,
        borderRadius: 3,
        fontSize: 9,
        padding: '3px 8px',
        display: 'inline-block',
      }}
    >
      {children}
    </span>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div className="parlay-eyebrow" style={{ fontSize: 8.5, color: C.muted, marginBottom: 2 }}>
        {label}
      </div>
      <div
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: color ?? C.text,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </div>
    </div>
  );
}

export default Parlays;
