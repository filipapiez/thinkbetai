import { useState, useMemo } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SEO } from '@/components/SEO';
import {
  RefreshCw, Loader2, ArrowUp, ArrowDown, Zap, Activity,
} from 'lucide-react';
import { TeamLogo } from '@/components/TeamLogo';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';

const SPORTS = [
  { key: 'nba', label: 'NBA' },
  { key: 'nfl', label: 'NFL' },
  { key: 'mlb', label: 'MLB' },
  { key: 'nhl', label: 'NHL' },
  { key: 'ncaab', label: 'NCAAB' },
  { key: 'ncaaf', label: 'NCAAF' },
];

interface GameTotal {
  id: string;
  sportKey: string;
  sportTitle: string;
  commenceTime: string;
  homeTeam: string;
  awayTeam: string;
  total: { over: number; overOdds: number; under: number; underOdds: number };
  moneyline: { home: number; away: number };
  hasTotals: boolean;
}

interface TotalAnalysis {
  lean: 'OVER' | 'UNDER' | 'EVEN';
  confidence: number;
}

function analyzeTotal(game: GameTotal): TotalAnalysis {
  const { overOdds, underOdds } = game.total;
  if (!overOdds && !underOdds) return { lean: 'EVEN', confidence: 50 };

  const overImpl = overOdds > 0
    ? 100 / (overOdds + 100)
    : Math.abs(overOdds) / (Math.abs(overOdds) + 100);
  const underImpl = underOdds > 0
    ? 100 / (underOdds + 100)
    : Math.abs(underOdds) / (Math.abs(underOdds) + 100);

  const diff = underImpl - overImpl;
  if (Math.abs(diff) < 0.015) return { lean: 'EVEN', confidence: 50 };

  const lean = diff > 0 ? 'OVER' : 'UNDER';
  const confidence = Math.min(85, Math.round(50 + Math.abs(diff) * 200));
  return { lean, confidence };
}

async function fetchGameTotals(sport: string): Promise<GameTotal[]> {
  const baseUrl = import.meta.env.VITE_SUPABASE_URL;
  const res = await fetch(`${baseUrl}/functions/v1/get-game-totals?sport=${sport}`);
  if (!res.ok) throw new Error('Failed to fetch game totals');
  const data = await res.json();
  return data.games || [];
}

const GameTotals = () => {
  const [sport, setSport] = useState('nba');

  const { data: games = [], isLoading, refetch } = useQuery({
    queryKey: ['game-totals', sport],
    queryFn: () => fetchGameTotals(sport),
    staleTime: 5 * 60 * 1000,
  });

  const analyzed = useMemo(() => {
    return games
      .map(g => ({ ...g, analysis: analyzeTotal(g) }))
      .sort((a, b) => b.analysis.confidence - a.analysis.confidence);
  }, [games]);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Game Totals Over/Under — AI Score Predictions"
        description="AI-analyzed game totals over/under picks for NBA, NFL, MLB, NHL."
        url="/game-totals"
        keywords="over under picks, game totals, score predictions, over under betting"
      />
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Game Totals Over/Under</h1>
          <p className="text-muted-foreground">
            AI-analyzed game score totals. Pick OVER or UNDER on each matchup.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {SPORTS.map(s => (
            <Button
              key={s.key}
              size="sm"
              variant={sport === s.key ? 'default' : 'outline'}
              onClick={() => setSport(s.key)}
            >
              {s.label}
            </Button>
          ))}
          <Button size="sm" variant="ghost" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={cn("h-4 w-4 mr-1", isLoading && "animate-spin")} />
            Refresh
          </Button>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
            <span className="text-muted-foreground">Loading game totals…</span>
          </div>
        )}

        {!isLoading && analyzed.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Activity className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">
                No game totals available for {SPORTS.find(s => s.key === sport)?.label} right now. Check back closer to game time.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {analyzed.map((game) => (
            <GameTotalCard key={game.id} game={game} analysis={game.analysis} />
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
};

function GameTotalCard({ game, analysis }: { game: GameTotal; analysis: TotalAnalysis }) {
  const { total } = game;
  const gameDate = new Date(game.commenceTime);

  return (
    <Card className="overflow-hidden hover:ring-1 hover:ring-primary/30 transition-all">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
            <Trophy className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-foreground truncate text-sm">{game.awayTeam}</p>
            <p className="font-semibold text-foreground truncate text-sm">@ {game.homeTeam}</p>
          </div>
          <Badge variant="outline" className="text-[10px] shrink-0">{game.sportTitle}</Badge>
        </div>

        <div className="text-center py-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Points</p>
          <p className="text-3xl font-bold text-foreground">{total.over}</p>
        </div>

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
            <span className="text-xs font-medium">OVER</span>
            <p className="text-xs text-muted-foreground">
              {total.overOdds > 0 ? '+' : ''}{total.overOdds}
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
            <span className="text-xs font-medium">UNDER</span>
            <p className="text-xs text-muted-foreground">
              {total.underOdds > 0 ? '+' : ''}{total.underOdds}
            </p>
          </button>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-foreground">
              AI: {analysis.lean === 'EVEN' ? 'No edge' : `${analysis.lean} ${analysis.confidence}%`}
            </span>
          </div>
          <span className="text-[10px] text-muted-foreground">
            {gameDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export default GameTotals;
