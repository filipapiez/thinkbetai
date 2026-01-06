import { OddsData } from '@/lib/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';

interface OddsCardProps {
  odds: OddsData;
  homeTeam: string;
  awayTeam: string;
}

// Determine line movement cause based on magnitude and direction
const getLineMovementAnalysis = (odds: OddsData) => {
  if (!odds.lineMovement) return null;
  
  const change = odds.lineMovement.current.home - odds.lineMovement.opening.home;
  const magnitude = Math.abs(change);
  
  let cause: string;
  let icon: typeof TrendingUp;
  let colorClass: string;
  let severity: 'low' | 'medium' | 'high';
  
  // Determine cause based on magnitude
  if (magnitude >= 20) {
    cause = 'News-driven adjustment (injury/lineup)';
    severity = 'high';
  } else if (magnitude >= 15) {
    cause = 'Sharp money (professional bettors)';
    severity = 'high';
  } else if (magnitude >= 10) {
    cause = 'Moderate public action';
    severity = 'medium';
  } else if (magnitude >= 5) {
    cause = 'Early market adjustment';
    severity = 'low';
  } else {
    cause = 'Minimal movement';
    severity = 'low';
  }
  
  // Determine direction
  if (change < -5) {
    icon = TrendingDown;
    colorClass = 'text-destructive';
  } else if (change > 5) {
    icon = TrendingUp;
    colorClass = 'text-success';
  } else {
    icon = Minus;
    colorClass = 'text-muted-foreground';
  }
  
  return {
    change,
    magnitude,
    cause,
    icon,
    colorClass,
    severity,
    direction: change > 0 ? 'toward home' : change < 0 ? 'toward away' : 'stable',
  };
};

export const OddsCard = ({ odds, homeTeam, awayTeam }: OddsCardProps) => {
  const formatOdds = (value: number) => {
    if (value > 0) return `+${value}`;
    return value.toString();
  };

  const lineAnalysis = getLineMovementAnalysis(odds);
  const Icon = lineAnalysis?.icon || Minus;

  return (
    <Card variant="glass">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span>Current Odds</span>
          {lineAnalysis && lineAnalysis.magnitude >= 5 && (
            <Badge variant={lineAnalysis.severity === 'high' ? 'destructive' : lineAnalysis.severity === 'medium' ? 'warning' : 'secondary'} className="text-xs">
              <Icon className="h-3 w-3 mr-1" />
              {lineAnalysis.magnitude}¢ {lineAnalysis.direction}
            </Badge>
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

        {/* Line Movement with Explanation */}
        {odds.lineMovement && (
          <div className="pt-3 border-t border-border space-y-3">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Line Movement</h4>
            
            {/* Opening vs Current */}
            <div className="flex items-center justify-between text-sm">
              <div>
                <p className="text-muted-foreground">Opening</p>
                <p className="font-mono">{formatOdds(odds.lineMovement.opening.home)} / {formatOdds(odds.lineMovement.opening.away)}</p>
              </div>
              <div className="flex items-center gap-2">
                {lineAnalysis && <Icon className={`h-5 w-5 ${lineAnalysis.colorClass}`} />}
              </div>
              <div className="text-right">
                <p className="text-muted-foreground">Current</p>
                <p className="font-mono">{formatOdds(odds.lineMovement.current.home)} / {formatOdds(odds.lineMovement.current.away)}</p>
              </div>
            </div>

            {/* Movement Cause Explanation */}
            {lineAnalysis && lineAnalysis.magnitude >= 5 && (
              <div className={`flex items-start gap-2 p-2 rounded-lg ${
                lineAnalysis.severity === 'high' ? 'bg-destructive/10' : 
                lineAnalysis.severity === 'medium' ? 'bg-warning/10' : 'bg-muted/50'
              }`}>
                <Info className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div className="text-xs">
                  <p className="font-medium text-foreground">{lineAnalysis.cause}</p>
                  <p className="text-muted-foreground mt-0.5">
                    Line moved {lineAnalysis.magnitude} cents {lineAnalysis.direction} since open
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
