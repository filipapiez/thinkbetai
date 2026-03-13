import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface OddsMovementChartProps {
  eventId?: string;
  sportKey?: string;
  homeTeam: string;
  awayTeam: string;
}

interface OddsSnapshot {
  timestamp: string;
  bookmaker: string;
  homeML: number;
  awayML: number;
  spread: number;
  total: number;
}

type MarketView = 'moneyline' | 'spread' | 'total';

export const OddsMovementChart = ({ eventId, sportKey, homeTeam, awayTeam }: OddsMovementChartProps) => {
  const [snapshots, setSnapshots] = useState<OddsSnapshot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [marketView, setMarketView] = useState<MarketView>('moneyline');

  const fetchHistory = useCallback(async () => {
    if (!eventId || !sportKey) {
      setIsLoading(false);
      return;
    }

    try {
      const { data } = await supabase.functions.invoke('get-odds-history', {
        body: { eventId, sportKey },
      });
      if (data?.snapshots) {
        setSnapshots(data.snapshots);
      }
    } catch (e) {
      console.error('[OddsMovement] Error:', e);
    } finally {
      setIsLoading(false);
    }
  }, [eventId, sportKey]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardContent className="p-6 flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Loading odds movement…</span>
        </CardContent>
      </Card>
    );
  }

  if (snapshots.length < 2) return null;

  const first = snapshots[0];
  const last = snapshots[snapshots.length - 1];

  // Calculate movement
  const mlMovement = last.homeML - first.homeML;
  const spreadMovement = last.spread - first.spread;
  const totalMovement = last.total - first.total;

  const MovementBadge = ({ value, suffix }: { value: number; suffix?: string }) => {
    if (value === 0) return <Badge variant="outline" className="text-xs"><Minus className="h-3 w-3 mr-1" />No change</Badge>;
    const isUp = value > 0;
    return (
      <Badge variant="outline" className={cn(
        "text-xs",
        isUp ? "text-emerald-400 border-emerald-500/40" : "text-red-400 border-red-500/40"
      )}>
        {isUp ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
        {isUp ? '+' : ''}{value.toFixed(1)}{suffix || ''}
      </Badge>
    );
  };

  const chartData = snapshots.map((s, i) => ({
    time: new Date(s.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
    index: i,
    homeML: s.homeML,
    awayML: s.awayML,
    spread: s.spread,
    total: s.total,
  }));

  const getLines = () => {
    switch (marketView) {
      case 'moneyline':
        return (
          <>
            <Line type="monotone" dataKey="homeML" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name={homeTeam} />
            <Line type="monotone" dataKey="awayML" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} name={awayTeam} />
          </>
        );
      case 'spread':
        return <Line type="monotone" dataKey="spread" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Spread" />;
      case 'total':
        return <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Total" />;
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5 text-primary" />
            Odds Movement
          </CardTitle>
          <div className="flex items-center gap-2">
            <MovementBadge value={marketView === 'moneyline' ? mlMovement : marketView === 'spread' ? spreadMovement : totalMovement} />
          </div>
        </div>
        <Tabs value={marketView} onValueChange={(v) => setMarketView(v as MarketView)} className="mt-2">
          <TabsList className="h-8">
            <TabsTrigger value="moneyline" className="text-xs h-7">Moneyline</TabsTrigger>
            <TabsTrigger value="spread" className="text-xs h-7">Spread</TabsTrigger>
            <TabsTrigger value="total" className="text-xs h-7">Total</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              {getLines()}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Opening vs Current summary */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="text-center p-2 rounded-lg bg-muted/30">
            <div className="text-[10px] text-muted-foreground mb-1">Opening ML</div>
            <div className="text-xs font-mono font-bold">
              {first.homeML > 0 ? '+' : ''}{first.homeML} / {first.awayML > 0 ? '+' : ''}{first.awayML}
            </div>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/30">
            <div className="text-[10px] text-muted-foreground mb-1">Opening Spread</div>
            <div className="text-xs font-mono font-bold">{first.spread > 0 ? '+' : ''}{first.spread}</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/30">
            <div className="text-[10px] text-muted-foreground mb-1">Opening Total</div>
            <div className="text-xs font-mono font-bold">{first.total}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
