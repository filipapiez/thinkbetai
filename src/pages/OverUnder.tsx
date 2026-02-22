import { useState, useMemo } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SEO } from '@/components/SEO';
import {
  Activity, RefreshCw, Loader2,
  ArrowUp, ArrowDown, Target, Zap, BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLiveGames } from '@/hooks/useLiveGames';

const SPORTS = [
  { key: 'all', label: 'All' },
  { key: 'Basketball', label: 'Basketball' },
  { key: 'Baseball', label: 'Baseball' },
  { key: 'Soccer', label: 'Soccer' },
  { key: 'Hockey', label: 'Hockey' },
];

interface TotalOdds {
  over: number;
  overOdds: number;
  under: number;
  underOdds: number;
}

interface GameWithTotals {
  id: string;
  homeTeam: string;
  awayTeam: string;
  sport: string;
  league?: string;
  startTime: string;
  total: TotalOdds;
  spread?: { home: number; away: number };
  analysis: AITotalAnalysis;
}

interface AITotalAnalysis {
  recommendation: 'OVER' | 'UNDER' | 'SKIP';
  confidence: number;
  reasoning: string;
  factors: string[];
}

function analyzeTotal(total: TotalOdds, spread?: { home: number; away: number }): AITotalAnalysis {
  if (!total || total.over === 0) {
    return { recommendation: 'SKIP', confidence: 0, reasoning: 'No totals line available.', factors: [] };
  }

  const overOdds = total.overOdds ?? -110;
  const underOdds = total.underOdds ?? -110;
  const factors: string[] = [];
  let score = 0;

  const overJuice = overOdds > 0 ? 100 / (overOdds + 100) : Math.abs(overOdds) / (Math.abs(overOdds) + 100);
  const underJuice = underOdds > 0 ? 100 / (underOdds + 100) : Math.abs(underOdds) / (Math.abs(underOdds) + 100);

  if (overJuice < underJuice - 0.02) {
    score += 15;
    factors.push('Over is getting better odds value');
  } else if (underJuice < overJuice - 0.02) {
    score -= 15;
    factors.push('Under is getting better odds value');
  }

  if (total.over >= 230) {
    score -= 10;
    factors.push('Very high total — lean under in high lines');
  } else if (total.over <= 200) {
    score += 10;
    factors.push('Lower total — potential for over in tight games');
  }

  if (spread) {
    const absSpread = Math.abs(spread.home);
    if (absSpread >= 10) {
      score += 8;
      factors.push('Large spread suggests blowout — favors over');
    } else if (absSpread <= 2) {
      score -= 5;
      factors.push('Tight spread — defensive game possible');
    }
  }

  const confidence = Math.min(85, 50 + Math.abs(score));
  const recommendation = Math.abs(score) < 8 ? 'SKIP' : score > 0 ? 'OVER' : 'UNDER';
  const reasoning = recommendation === 'OVER'
    ? `Line value and matchup factors suggest the over at ${total.over}.`
    : recommendation === 'UNDER'
    ? `Odds movement and context favor the under at ${total.under}.`
    : 'No clear edge on either side — recommend passing.';

  return { recommendation, confidence, reasoning, factors };
}

const OverUnder = () => {
  const [sport, setSport] = useState('all');
  const { games, isLoading, refetch } = useLiveGames();

  const gamesWithTotals = useMemo(() => {
    const results: GameWithTotals[] = [];

    for (const g of games) {
      const odds = (g as any).odds;
      if (!odds?.total || !odds.total.over || odds.total.over === 0) continue;

      if (sport !== 'all' && g.sport !== sport) continue;

      const total: TotalOdds = {
        over: odds.total.over,
        overOdds: odds.total.overOdds ?? -110,
        under: odds.total.under ?? odds.total.over,
        underOdds: odds.total.underOdds ?? -110,
      };
      const spread = odds.spread ? { home: odds.spread.home, away: odds.spread.away } : undefined;

      results.push({
        id: g.id,
        homeTeam: typeof g.homeTeam === 'string' ? g.homeTeam : (g.homeTeam as any)?.name || 'Home',
        awayTeam: typeof g.awayTeam === 'string' ? g.awayTeam : (g.awayTeam as any)?.name || 'Away',
        sport: g.sport,
        league: (g as any).league,
        startTime: (g as any).startTime || '',
        total,
        spread,
        analysis: analyzeTotal(total, spread),
      });
    }

    return results.sort((a, b) => b.analysis.confidence - a.analysis.confidence);
  }, [games, sport]);

  const overCount = gamesWithTotals.filter(g => g.analysis.recommendation === 'OVER').length;
  const underCount = gamesWithTotals.filter(g => g.analysis.recommendation === 'UNDER').length;

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Over/Under Picks — AI Totals Analysis"
        description="AI-powered over/under predictions for NFL, NBA, MLB, NHL. Get live totals lines with confidence scores and reasoning."
        url="/over-under"
        keywords="over under picks, totals picks, AI over under, sports betting totals, over under predictions"
      />
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Over/Under AI Picks</h1>
          <p className="text-muted-foreground max-w-2xl">
            Live totals lines combined with AI analysis to find the best over/under bets across all sports.
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

        {gamesWithTotals.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Games w/ Lines</p>
                  <p className="text-xl font-bold text-foreground">{gamesWithTotals.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <ArrowUp className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Over Leans</p>
                  <p className="text-xl font-bold text-foreground">{overCount}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <ArrowDown className="h-5 w-5 text-accent" />
                <div>
                  <p className="text-sm text-muted-foreground">Under Leans</p>
                  <p className="text-xl font-bold text-foreground">{underCount}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
            <span className="text-muted-foreground">Loading lines…</span>
          </div>
        )}

        {!isLoading && gamesWithTotals.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Activity className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">
                No over/under lines available{sport !== 'all' ? ` for ${sport}` : ''} right now.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {gamesWithTotals.map(({ id, homeTeam, awayTeam, league, startTime, total, analysis }) => (
            <Card key={id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">
                    {awayTeam} @ {homeTeam}
                  </CardTitle>
                  <Badge
                    variant={analysis.recommendation === 'OVER' ? 'default' : analysis.recommendation === 'UNDER' ? 'secondary' : 'outline'}
                    className={cn(
                      analysis.recommendation === 'OVER' && 'bg-primary text-primary-foreground',
                      analysis.recommendation === 'UNDER' && 'bg-accent text-accent-foreground',
                    )}
                  >
                    {analysis.recommendation === 'OVER' && <ArrowUp className="h-3 w-3 mr-1" />}
                    {analysis.recommendation === 'UNDER' && <ArrowDown className="h-3 w-3 mr-1" />}
                    {analysis.recommendation}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {league && <span className="mr-2">{league}</span>}
                  {startTime && new Date(startTime).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
                  <div className="text-center flex-1">
                    <p className="text-xs text-muted-foreground">Over</p>
                    <p className="text-lg font-bold text-foreground">{total.over}</p>
                    <p className="text-xs text-muted-foreground">({total.overOdds > 0 ? '+' : ''}{total.overOdds})</p>
                  </div>
                  <div className="h-10 w-px bg-border" />
                  <div className="text-center flex-1">
                    <p className="text-xs text-muted-foreground">Under</p>
                    <p className="text-lg font-bold text-foreground">{total.under}</p>
                    <p className="text-xs text-muted-foreground">({total.underOdds > 0 ? '+' : ''}{total.underOdds})</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">AI Confidence: {analysis.confidence}%</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{analysis.reasoning}</p>
                  {analysis.factors.length > 0 && (
                    <ul className="space-y-1">
                      {analysis.factors.map((f, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                          <Target className="h-3 w-3 mt-0.5 shrink-0 text-primary" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default OverUnder;
