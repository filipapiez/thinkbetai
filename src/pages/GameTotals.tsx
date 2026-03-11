import { useState, useMemo, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SEO } from '@/components/SEO';
import {
  RefreshCw, Loader2, ArrowUp, ArrowDown, Zap, Activity, Brain, Sparkles,
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

interface RecentGame {
  opponent: string;
  score: number;
  opponentScore: number;
  totalPoints: number;
  won: boolean;
  date: string;
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

async function fetchAIExplanations(games: GameTotal[], analyses: TotalAnalysis[]): Promise<Record<string, string>> {
  if (!games.length) return {};
  const baseUrl = import.meta.env.VITE_SUPABASE_URL;
  const payload = games.map((g, i) => ({
    id: g.id,
    homeTeam: g.homeTeam,
    awayTeam: g.awayTeam,
    total: g.total.over,
    overOdds: g.total.overOdds,
    underOdds: g.total.underOdds,
    mlHome: g.moneyline.home,
    mlAway: g.moneyline.away,
    lean: analyses[i].lean,
    confidence: analyses[i].confidence,
  }));

  const res = await fetch(`${baseUrl}/functions/v1/analyze-game-totals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ games: payload }),
  });
  if (!res.ok) return {};
  const data = await res.json();
  return data.explanations || {};
}

async function fetchRecentScores(teamNames: string[], sport: string): Promise<Record<string, RecentGame[]>> {
  if (!teamNames.length) return {};
  const baseUrl = import.meta.env.VITE_SUPABASE_URL;
  const res = await fetch(`${baseUrl}/functions/v1/get-recent-scores`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ teamNames, sport }),
  });
  if (!res.ok) return {};
  const data = await res.json();
  return data.scores || {};
}

const GameTotals = () => {
  const [sport, setSport] = useState('nba');
  const [explanations, setExplanations] = useState<Record<string, string>>({});
  const [loadingAI, setLoadingAI] = useState(false);
  const [recentScores, setRecentScores] = useState<Record<string, RecentGame[]>>({});
  const [loadingScores, setLoadingScores] = useState(false);

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

  // Fetch AI explanations when games load
  useEffect(() => {
    if (!analyzed.length) {
      setExplanations({});
      return;
    }
    let cancelled = false;
    setLoadingAI(true);
    setExplanations({});
    const analyses = analyzed.map(g => g.analysis);
    fetchAIExplanations(analyzed, analyses)
      .then(result => { if (!cancelled) setExplanations(result); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingAI(false); });
    return () => { cancelled = true; };
  }, [analyzed]);

  // Fetch recent scores when games load
  useEffect(() => {
    if (!analyzed.length) {
      setRecentScores({});
      return;
    }
    let cancelled = false;
    setLoadingScores(true);
    setRecentScores({});
    const allTeams = analyzed.flatMap(g => [g.homeTeam, g.awayTeam]);
    const sportKey = sport;
    fetchRecentScores(allTeams, sportKey)
      .then(result => { if (!cancelled) setRecentScores(result); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingScores(false); });
    return () => { cancelled = true; };
  }, [analyzed, sport]);

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

        {(loadingAI || loadingScores) && analyzed.length > 0 && (
          <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            <span>{loadingAI ? 'Generating AI analysis…' : 'Loading recent scores…'}</span>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {analyzed.map((game) => (
            <GameTotalCard
              key={game.id}
              game={game}
              analysis={game.analysis}
              explanation={explanations[game.id]}
              loadingAI={loadingAI}
              homeScores={recentScores[game.homeTeam.toLowerCase()]}
              awayScores={recentScores[game.awayTeam.toLowerCase()]}
              loadingScores={loadingScores}
              totalLine={game.total.over}
            />
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
};

function sportKeyToLogoSport(sportKey: string): string {
  const parts = sportKey.split('_');
  return parts[parts.length - 1] || 'nba';
}

function RecentScoresRow({
  label,
  games,
  totalLine,
  loading,
}: {
  label: string;
  games?: RecentGame[];
  totalLine: number;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-muted-foreground w-10 shrink-0">{label}</span>
        <div className="flex gap-1">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-7 h-5 rounded bg-muted/50 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!games?.length) return null;

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] text-muted-foreground w-10 shrink-0">{label}</span>
      <div className="flex gap-1">
        {games.slice(0, 5).map((g, i) => {
          const isOver = g.totalPoints > totalLine;
          return (
            <div
              key={i}
              className={cn(
                "w-7 h-5 rounded text-[10px] font-medium flex items-center justify-center",
                isOver
                  ? "bg-primary/15 text-primary"
                  : "bg-muted/60 text-muted-foreground"
              )}
              title={`vs ${g.opponent}: ${g.score}-${g.opponentScore} (${g.totalPoints} total)`}
            >
              {g.totalPoints}
            </div>
          );
        })}
      </div>
      <span className="text-[9px] text-muted-foreground ml-auto">
        avg {Math.round(games.slice(0, 5).reduce((s, g) => s + g.totalPoints, 0) / Math.min(games.length, 5))}
      </span>
    </div>
  );
}

function GameTotalCard({
  game,
  analysis,
  explanation,
  loadingAI,
  homeScores,
  awayScores,
  loadingScores,
  totalLine,
}: {
  game: GameTotal;
  analysis: TotalAnalysis;
  explanation?: string;
  loadingAI: boolean;
  homeScores?: RecentGame[];
  awayScores?: RecentGame[];
  loadingScores: boolean;
  totalLine: number;
}) {
  const { total } = game;
  const logoSport = sportKeyToLogoSport(game.sportKey);
  const gameDate = new Date(game.commenceTime);

  // Get short team names (last word of team name, e.g. "Trail Blazers" -> "Blazers")
  const awayShort = game.awayTeam.split(' ').pop() || game.awayTeam;
  const homeShort = game.homeTeam.split(' ').pop() || game.homeTeam;

  return (
    <Card className="overflow-hidden hover:ring-1 hover:ring-primary/30 transition-all">
      <CardContent className="p-4 space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <TeamLogo teamName={game.awayTeam} abbreviation="" sport={logoSport} className="!w-7 !h-7 !rounded-md" />
              <p className="font-semibold text-foreground truncate text-sm">{game.awayTeam}</p>
            </div>
            <Badge variant="outline" className="text-[10px] shrink-0 ml-2">{game.sportTitle}</Badge>
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <TeamLogo teamName={game.homeTeam} abbreviation="" sport={logoSport} className="!w-7 !h-7 !rounded-md" />
            <p className="font-semibold text-foreground truncate text-sm">@ {game.homeTeam}</p>
          </div>
        </div>

        <div className="text-center py-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Points</p>
          <p className="text-3xl font-bold text-foreground">{total.over}</p>
        </div>

        {/* Last 5 Games Scores */}
        {(loadingScores || awayScores?.length || homeScores?.length) && (
          <div className="space-y-1 border border-border/50 rounded-lg p-2 bg-muted/20">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-1">Last 5 Combined Scores</p>
            <RecentScoresRow label={awayShort} games={awayScores} totalLine={totalLine} loading={loadingScores} />
            <RecentScoresRow label={homeShort} games={homeScores} totalLine={totalLine} loading={loadingScores} />
          </div>
        )}

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

        {/* AI Explanation */}
        <div className="border-t border-border pt-2">
          {loadingAI && !explanation ? (
            <div className="flex items-center gap-1.5">
              <Brain className="h-3.5 w-3.5 text-primary animate-pulse" />
              <span className="text-[11px] text-muted-foreground italic">Analyzing…</span>
            </div>
          ) : explanation ? (
            <div className="flex gap-1.5">
              <Brain className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">{explanation}</p>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Brain className="h-3.5 w-3.5 text-muted-foreground/50" />
              <span className="text-[11px] text-muted-foreground/50 italic">No analysis available</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default GameTotals;
