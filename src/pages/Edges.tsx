import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, RefreshCw, TrendingUp, Zap, Clock } from 'lucide-react';
import BetButton from '@/components/BetButton';



type Opportunity = {
  id: string;
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
  ev_pct: number;
  edge_type: string;
  book_count: number;
  detected_at: string;
};

const FREE_PREVIEW_COUNT = 2;

const marketLabel = (m: string) =>
  m === 'h2h' ? 'Moneyline' : m === 'spreads' ? 'Spread' : m === 'totals' ? 'Total' : m;

const formatAmerican = (a: number) => (a > 0 ? `+${a}` : `${a}`);
const formatKickoff = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit', month: 'short', day: 'numeric' });
};

const EdgeRow = ({ o, locked }: { o: Opportunity; locked: boolean }) => (
  <Card className={`transition-all ${locked ? 'blur-sm select-none pointer-events-none' : 'hover:border-primary/50'}`}>
    <CardContent className="p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-xs">{o.sport}</Badge>
            <Badge variant="secondary" className="text-xs">{marketLabel(o.market)}</Badge>
          </div>
          <p className="text-sm font-semibold truncate">{o.event}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
            <Clock className="h-3 w-3" /> {formatKickoff(o.commence_time)}
          </p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-2xl font-bold text-success flex items-center gap-1">
            <TrendingUp className="h-4 w-4" />+{o.ev_pct.toFixed(1)}%
          </div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">EV</div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border/50">
        <div>
          <div className="text-[10px] uppercase text-muted-foreground">Pick</div>
          <div className="text-sm font-semibold truncate">{o.selection}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase text-muted-foreground">Book / Price</div>
          <div className="text-sm font-semibold">{o.book} <span className="text-primary">{formatAmerican(o.odds_american)}</span></div>
        </div>
        <div>
          <div className="text-[10px] uppercase text-muted-foreground">Fair prob</div>
          <div className="text-sm font-semibold">{(o.fair_prob * 100).toFixed(1)}%</div>
        </div>
      </div>
    </CardContent>
  </Card>
);

const Edges = () => {
  const navigate = useNavigate();
  const { user, isSubscribed } = useAuth();
  const [opps, setOpps] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('opportunities')
      .select('*')
      .gt('expires_at', new Date().toISOString())
      .order('ev_pct', { ascending: false })
      .limit(100);
    if (!error && data) {
      setOpps(data as Opportunity[]);
      if (data.length) setLastScan(data[0].detected_at);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const runScan = async () => {
    setScanning(true);
    try {
      await supabase.functions.invoke('edge-scanner');
      await load();
    } finally {
      setScanning(false);
    }
  };

  const visible = useMemo(() => opps.slice(0, isSubscribed ? opps.length : FREE_PREVIEW_COUNT), [opps, isSubscribed]);
  const locked = useMemo(() => (isSubscribed ? [] : opps.slice(FREE_PREVIEW_COUNT, FREE_PREVIEW_COUNT + 4)), [opps, isSubscribed]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO title="Live +EV Edges — Real-Time Sportsbook Scanner" description="AI-powered scanner surfacing +EV bets, arbitrage, and middles across US and international sportsbooks in real time." url="/edges" noIndex />
      <Header />
      <main className="flex-1 container py-8 md:py-12">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-6 w-6 text-primary" />
                <h1 className="text-3xl md:text-4xl font-bold">Live Edges</h1>
                <Badge className="bg-success/20 text-success border-success/30">LIVE</Badge>
              </div>
              <p className="text-muted-foreground text-sm">
                Real-time +EV opportunities across major sportsbooks. Consensus fair-value model with de-vig.
              </p>
              {lastScan && (
                <p className="text-xs text-muted-foreground mt-1">
                  Last scan: {new Date(lastScan).toLocaleTimeString()}
                </p>
              )}
            </div>
            <Button onClick={runScan} disabled={scanning} variant="outline" size="sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${scanning ? 'animate-spin' : ''}`} />
              {scanning ? 'Scanning…' : 'Refresh Scan'}
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-16 text-muted-foreground">Loading edges…</div>
          ) : opps.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <p className="text-muted-foreground mb-4">No live edges right now. Run a scan to check current markets.</p>
                <Button onClick={runScan} disabled={scanning} variant="hero">
                  <RefreshCw className={`h-4 w-4 mr-2 ${scanning ? 'animate-spin' : ''}`} />
                  Scan Now
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {visible.map((o) => <EdgeRow key={o.id} o={o} locked={false} />)}

              {!isSubscribed && opps.length > FREE_PREVIEW_COUNT && (
                <div className="relative">
                  <div className="space-y-3">
                    {locked.map((o) => <EdgeRow key={o.id} o={o} locked />)}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-background/40 via-background/80 to-background">
                    <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30 max-w-md mx-4">
                      <CardContent className="py-8 text-center">
                        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/20 mb-4">
                          <Lock className="h-7 w-7 text-primary" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Unlock {opps.length - FREE_PREVIEW_COUNT} more live edges</h3>
                        <p className="text-sm text-muted-foreground mb-5">
                          You're seeing the top {FREE_PREVIEW_COUNT}. Subscribers get every +EV opportunity as it appears.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-2 justify-center">
                          <Button variant="hero" onClick={() => navigate(user ? '/pricing' : '/login', { state: { from: { pathname: '/edges' } } })}>
                            {user ? 'Unlock Full Access' : 'Sign Up to Unlock'}
                          </Button>
                          <Button variant="outline" onClick={() => navigate('/pricing')}>View Pricing</Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Edges;
