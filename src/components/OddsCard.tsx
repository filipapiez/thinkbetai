import { OddsData } from '@/lib/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface OddsCardProps {
  odds: OddsData;
  homeTeam: string;
  awayTeam: string;
}

export const OddsCard = ({ odds, homeTeam, awayTeam }: OddsCardProps) => {
  const formatOdds = (value: number) => {
    if (value > 0) return `+${value}`;
    return value.toString();
  };

  const getLineMovementIcon = () => {
    if (!odds.lineMovement) return null;
    const change = odds.lineMovement.current.home - odds.lineMovement.opening.home;
    if (change < -5) return <TrendingDown className="h-4 w-4 text-destructive" />;
    if (change > 5) return <TrendingUp className="h-4 w-4 text-success" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <Card variant="glass">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span>Current Odds</span>
          {odds.lineMovement && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {getLineMovementIcon()}
              <span>Line moved</span>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Moneyline */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Moneyline</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">{homeTeam}</p>
              <p className="odds-number text-xl">{formatOdds(odds.moneyline.home)}</p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">{awayTeam}</p>
              <p className="odds-number text-xl">{formatOdds(odds.moneyline.away)}</p>
            </div>
          </div>
        </div>

        {/* Implied Probability */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Implied Probability</h4>
          <div className="relative h-8 rounded-full overflow-hidden bg-muted">
            <div 
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-accent rounded-l-full"
              style={{ width: `${odds.impliedProb.homePct}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-between px-3 text-xs font-semibold">
              <span className="text-primary-foreground drop-shadow">{odds.impliedProb.homePct}%</span>
              <span>{odds.impliedProb.awayPct}%</span>
            </div>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{homeTeam}</span>
            <span>{awayTeam}</span>
          </div>
        </div>

        {/* Spread */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Spread</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">{homeTeam}</p>
              <p className="odds-number text-lg">{formatOdds(odds.spread.home)}</p>
              <p className="text-xs text-muted-foreground">({formatOdds(odds.spread.line)})</p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">{awayTeam}</p>
              <p className="odds-number text-lg">{formatOdds(odds.spread.away)}</p>
              <p className="text-xs text-muted-foreground">({formatOdds(odds.spread.line)})</p>
            </div>
          </div>
        </div>

        {/* Total */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total (O/U)</h4>
          <div className="bg-secondary/50 rounded-lg p-3">
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Over</p>
                <p className="odds-number">{formatOdds(odds.total.over)}</p>
              </div>
              <div className="text-center px-4 border-x border-border">
                <p className="odds-number text-2xl text-primary">{odds.total.line}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Under</p>
                <p className="odds-number">{formatOdds(odds.total.under)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Line Movement */}
        {odds.lineMovement && (
          <div className="pt-3 border-t border-border">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Line Movement</h4>
            <div className="flex items-center justify-between text-sm">
              <div>
                <p className="text-muted-foreground">Opening</p>
                <p className="font-mono">{formatOdds(odds.lineMovement.opening.home)} / {formatOdds(odds.lineMovement.opening.away)}</p>
              </div>
              <div className="text-muted-foreground">→</div>
              <div className="text-right">
                <p className="text-muted-foreground">Current</p>
                <p className="font-mono">{formatOdds(odds.lineMovement.current.home)} / {formatOdds(odds.lineMovement.current.away)}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
