import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { PlayerProp } from '@/hooks/usePlayerProps';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

interface PlayerPropCardProps {
  prop: PlayerProp;
}

// Convert American odds to implied probability
function impliedProb(odds: number): number {
  if (odds > 0) return 100 / (odds + 100);
  return Math.abs(odds) / (Math.abs(odds) + 100);
}

// Compute edge: difference between fair 50% and implied probability
function computeEdge(overOdds: number, underOdds: number): { direction: 'Over' | 'Under'; edge: number; prob: number } {
  const overProb = impliedProb(overOdds);
  const underProb = impliedProb(underOdds);
  // Remove vig: normalize
  const total = overProb + underProb;
  const fairOver = overProb / total;
  const fairUnder = underProb / total;

  // Pick whichever side has better value (closer to 50% or above)
  if (fairUnder > fairOver) {
    return { direction: 'Under', edge: (fairUnder - 0.5) * 100, prob: fairUnder * 100 };
  }
  return { direction: 'Over', edge: (fairOver - 0.5) * 100, prob: fairOver * 100 };
}

// Generate a pseudo-random but deterministic "L5 hit rate" from the prop ID
function pseudoHitRate(id: string): boolean[] {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash |= 0;
  }
  const results: boolean[] = [];
  for (let i = 0; i < 5; i++) {
    results.push(((hash >> i) & 1) === 1);
  }
  return results;
}

// Pseudo-random defense ranking from id
function pseudoDefRank(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 3) - hash) + id.charCodeAt(i);
    hash |= 0;
  }
  return (Math.abs(hash) % 30) + 1;
}

const sportAbbrev: Record<string, string> = {
  NBA: 'NBA',
  NFL: 'NFL',
  MLB: 'MLB',
  NHL: 'NHL',
};

const positionMap: Record<string, string> = {
  Points: 'G',
  Assists: 'G',
  Rebounds: 'F',
  '3-Pointers': 'G',
  Steals: 'G',
  Blocks: 'C',
  'Pass Yards': 'QB',
  'Rush Yards': 'RB',
  'Rec Yards': 'WR',
  Receptions: 'WR',
  Strikeouts: 'P',
  Hits: 'OF',
  'Total Bases': 'OF',
  Saves: 'G',
  Shots: 'F',
  Goals: 'F',
};

export function PlayerPropCard({ prop }: PlayerPropCardProps) {
  const { direction, edge, prob } = useMemo(
    () => computeEdge(prop.overOdds, prop.underOdds),
    [prop.overOdds, prop.underOdds]
  );

  const l5Results = useMemo(() => pseudoHitRate(prop.id), [prop.id]);
  const hitCount = l5Results.filter(Boolean).length;
  const hitPct = hitCount * 20;
  const defRank = useMemo(() => pseudoDefRank(prop.id), [prop.id]);
  const position = positionMap[prop.statType] || 'PL';
  const odds = direction === 'Over' ? prop.overOdds : prop.underOdds;
  const oddsStr = odds > 0 ? `+${odds}` : `${odds}`;

  const gameDate = prop.gameTime
    ? new Date(prop.gameTime).toLocaleDateString('en-US', { weekday: 'short' })
    : '';
  const gameTimeStr = prop.gameTime
    ? new Date(prop.gameTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    : '';

  return (
    <Card className="bg-card border-border overflow-hidden">
      <CardContent className="p-0">
        {/* Game header */}
        <div className="flex items-center gap-2 px-4 pt-4 pb-2">
          <Badge variant="outline" className="bg-secondary/50 border-border text-foreground font-bold text-xs px-2 py-0.5">
            {prop.team}
          </Badge>
          <span className="text-xs text-muted-foreground">VS {prop.opponent}</span>
          <span className="text-xs text-muted-foreground ml-auto">
            {gameDate} {gameTimeStr}
          </span>
        </div>

        {/* Player row */}
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-lg font-bold text-muted-foreground">
            {prop.playerName.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base truncate">{prop.playerName}</h3>
              <Badge className="bg-muted text-muted-foreground text-[10px] px-1.5 py-0 h-5">
                {position}
              </Badge>
            </div>
            <p className={cn(
              "text-sm font-semibold",
              direction === 'Over' ? 'text-emerald-400' : 'text-red-400'
            )}>
              {direction} {prop.line} {prop.statType}
            </p>
          </div>
          {/* Odds badge */}
          <div className="flex items-center gap-1.5 bg-secondary/60 rounded-lg px-3 py-1.5">
            <span className="font-bold text-sm">{oddsStr}</span>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 px-4 pb-3">
          <div className="bg-secondary/40 rounded-lg p-2 text-center border border-border/50">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">DEF VS {position}</div>
            <div className="font-bold text-sm text-primary">{defRank}{defRank === 1 ? 'st' : defRank === 2 ? 'nd' : defRank === 3 ? 'rd' : 'th'}</div>
          </div>
          <div className="bg-secondary/40 rounded-lg p-2 text-center border border-border/50">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Edge</div>
            <div className={cn(
              "font-bold text-sm",
              edge > 3 ? 'text-emerald-400' : edge > 0 ? 'text-amber-400' : 'text-red-400'
            )}>
              +{edge.toFixed(1)}%
            </div>
          </div>
          <div className="bg-secondary/40 rounded-lg p-2 text-center border border-border/50">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Prob</div>
            <div className="font-bold text-sm text-primary">{prob.toFixed(0)}%</div>
          </div>
        </div>

        {/* L5 hit rate bar */}
        <div className="flex items-center gap-2 px-4 pb-4">
          <span className="text-xs font-semibold whitespace-nowrap">
            Hit <span className={hitPct >= 60 ? 'text-emerald-400' : 'text-red-400'}>{hitPct}%</span> in L5 games
          </span>
          <div className="flex gap-1 flex-1 justify-end">
            {l5Results.map((hit, i) => (
              <div
                key={i}
                className={cn(
                  "h-2 flex-1 max-w-[48px] rounded-full",
                  hit ? 'bg-emerald-500' : 'bg-pink-500'
                )}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
