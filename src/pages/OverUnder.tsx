import { useState, useMemo, useCallback } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SEO } from '@/components/SEO';
import {
  RefreshCw, Loader2, ArrowUp, ArrowDown, Zap, Activity, User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePlayerProps, PlayerProp } from '@/hooks/usePlayerProps';

const SPORTS = [
  { key: 'all', label: 'All' },
  { key: 'basketball', label: 'NBA' },
  { key: 'football', label: 'NFL' },
  { key: 'baseball', label: 'MLB' },
  { key: 'hockey', label: 'NHL' },
];

const STAT_FILTERS = ['All', 'Points', 'Rebounds', 'Assists', '3-Pointers', 'Pass Yards', 'Rush Yards', 'Rec Yards', 'Strikeouts', 'Goals', 'Shots'];

interface AIAnalysis {
  lean: 'OVER' | 'UNDER' | 'EVEN';
  confidence: number;
}

function analyzeProp(prop: PlayerProp): AIAnalysis {
  const overImpl = prop.overOdds > 0 ? 100 / (prop.overOdds + 100) : Math.abs(prop.overOdds) / (Math.abs(prop.overOdds) + 100);
  const underImpl = prop.underOdds > 0 ? 100 / (prop.underOdds + 100) : Math.abs(prop.underOdds) / (Math.abs(prop.underOdds) + 100);

  const diff = underImpl - overImpl;
  if (Math.abs(diff) < 0.015) {
    return { lean: 'EVEN', confidence: 50 };
  }

  const lean = diff > 0 ? 'OVER' : 'UNDER';
  const confidence = Math.min(85, Math.round(50 + Math.abs(diff) * 200));
  return { lean, confidence };
}

const OverUnder = () => {
  const [sport, setSport] = useState('all');
  const [statFilter, setStatFilter] = useState('All');
  const { props, isLoading, refetch } = usePlayerProps(sport);

  const filtered = useMemo(() => {
    let list = props;
    if (statFilter !== 'All') {
      list = list.filter(p => p.statType === statFilter);
    }
    return list.map(p => ({ ...p, analysis: analyzeProp(p) }))
      .sort((a, b) => b.analysis.confidence - a.analysis.confidence);
  }, [props, statFilter]);

  const availableStats = useMemo(() => {
    const stats = new Set(props.map(p => p.statType));
    return STAT_FILTERS.filter(s => s === 'All' || stats.has(s));
  }, [props]);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Player Props — Over/Under Picks"
        description="PrizePicks-style player prop predictions with AI confidence scores for NBA, NFL, MLB, NHL."
        url="/over-under"
        keywords="player props, over under picks, prizepicks, player predictions, sports betting props"
      />
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Player Props</h1>
          <p className="text-muted-foreground">
            AI-analyzed player over/unders. Pick MORE or LESS on each stat line.
          </p>
        </div>

        {/* Sport filter */}
        <div className="flex flex-wrap gap-2 mb-4">
          {SPORTS.map(s => (
            <Button
              key={s.key}
              size="sm"
              variant={sport === s.key ? 'default' : 'outline'}
              onClick={() => { setSport(s.key); setStatFilter('All'); }}
            >
              {s.label}
            </Button>
          ))}
          <Button size="sm" variant="ghost" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={cn("h-4 w-4 mr-1", isLoading && "animate-spin")} />
            Refresh
          </Button>
        </div>

        {/* Stat type filter */}
        {availableStats.length > 1 && (
          <div className="flex flex-wrap gap-1.5 mb-6">
            {availableStats.map(s => (
              <Badge
                key={s}
                variant={statFilter === s ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setStatFilter(s)}
              >
                {s}
              </Badge>
            ))}
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
            <span className="text-muted-foreground">Loading player props…</span>
          </div>
        )}

        {/* Empty */}
        {!isLoading && filtered.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Activity className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">
                No player props available{sport !== 'all' ? ` for ${SPORTS.find(s => s.key === sport)?.label}` : ''} right now. Check back closer to game time.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Player prop cards */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((prop) => (
            <PlayerPropCard key={prop.id} prop={prop} analysis={prop.analysis} />
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
};

function PlayerPropCard({ prop, analysis }: { prop: PlayerProp; analysis: AIAnalysis }) {
  return (
    <Card className="overflow-hidden hover:ring-1 hover:ring-primary/30 transition-all">
      <CardContent className="p-4 space-y-3">
        {/* Player header */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
            <User className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-foreground truncate">{prop.playerName}</p>
            <p className="text-xs text-muted-foreground truncate">
              {prop.team} vs {prop.opponent} · {prop.league}
            </p>
          </div>
        </div>

        {/* Stat line */}
        <div className="text-center py-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">{prop.statType}</p>
          <p className="text-3xl font-bold text-foreground">{prop.line}</p>
        </div>

        {/* Over / Under buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            className={cn(
              "rounded-lg p-2.5 text-center border transition-colors",
              analysis.lean === 'OVER'
                ? "bg-primary/10 border-primary text-primary"
                : "border-border text-muted-foreground hover:border-primary/50"
            )}
          >
            <ArrowUp className="h-4 w-4 mx-auto mb-0.5" />
            <span className="text-xs font-medium">MORE</span>
            <p className="text-xs text-muted-foreground">
              {prop.overOdds > 0 ? '+' : ''}{prop.overOdds}
            </p>
          </button>
          <button
            className={cn(
              "rounded-lg p-2.5 text-center border transition-colors",
              analysis.lean === 'UNDER'
                ? "bg-accent/10 border-accent text-accent-foreground"
                : "border-border text-muted-foreground hover:border-accent/50"
            )}
          >
            <ArrowDown className="h-4 w-4 mx-auto mb-0.5" />
            <span className="text-xs font-medium">LESS</span>
            <p className="text-xs text-muted-foreground">
              {prop.underOdds > 0 ? '+' : ''}{prop.underOdds}
            </p>
          </button>
        </div>

        {/* AI confidence */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-foreground">
              AI: {analysis.lean === 'EVEN' ? 'No edge' : `${analysis.lean} ${analysis.confidence}%`}
            </span>
          </div>
          {prop.gameTime && (
            <span className="text-[10px] text-muted-foreground">
              {new Date(prop.gameTime).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default OverUnder;
