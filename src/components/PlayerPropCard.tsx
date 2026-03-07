import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { PlayerProp } from '@/hooks/usePlayerProps';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';
import { PlayerAvatar } from './PlayerAvatar';
import { usePlayerGameLog } from '@/hooks/usePlayerGameLog';

export const SPORTSBOOKS = [
  {
    id: 'fanduel',
    name: 'FanDuel',
    logo: '/images/fanduel-logo.png',
    url: 'https://www.fanduel.com/sportsbook',
  },
  {
    id: 'draftkings',
    name: 'DraftKings',
    logo: '/images/draftkings-logo.png',
    url: 'https://sportsbook.draftkings.com',
  },
  {
    id: 'betmgm',
    name: 'BetMGM',
    logo: '/images/betmgm-logo.png',
    url: 'https://sports.betmgm.com',
  },
] as const;

interface PlayerPropCardProps {
  prop: PlayerProp;
  selectedPlatform?: string | null;
}

// Convert American odds to implied probability
export function impliedProb(odds: number): number {
  if (odds > 0) return 100 / (odds + 100);
  return Math.abs(odds) / (Math.abs(odds) + 100);
}

// Compute edge: difference between fair 50% and implied probability
export function computeEdge(overOdds: number, underOdds: number): { direction: 'Over' | 'Under'; edge: number; prob: number } {
  const overProb = impliedProb(overOdds);
  const underProb = impliedProb(underOdds);
  const total = overProb + underProb;
  const fairOver = overProb / total;
  const fairUnder = underProb / total;

  let direction: 'Over' | 'Under';
  let rawProb: number;
  if (fairUnder > fairOver) {
    direction = 'Under';
    rawProb = fairUnder;
  } else {
    direction = 'Over';
    rawProb = fairOver;
  }

  const cappedProb = Math.min(Math.max(rawProb * 100, 52), 78);
  const edge = Math.min((rawProb - 0.5) * 100, 28);

  return { direction, edge, prob: cappedProb };
}

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

export function PlayerPropCard({ prop, selectedPlatform }: PlayerPropCardProps) {
  const { direction, edge, prob } = useMemo(
    () => computeEdge(prop.overOdds, prop.underOdds),
    [prop.overOdds, prop.underOdds]
  );

  // Real L20 game log data only
  const gameLog = usePlayerGameLog(prop.playerName, prop.sport, prop.statType, prop.line, direction);
  const hasRealData = gameLog.results.length > 0;
  const hitCount = hasRealData ? gameLog.results.filter(Boolean).length : 0;
  const hitTotal = hasRealData ? gameLog.results.length : 0;
  const hitPct = hitTotal > 0 ? Math.round((hitCount / hitTotal) * 100) : 0;

  const position = positionMap[prop.statType] || 'PL';
  const odds = direction === 'Over' ? prop.overOdds : prop.underOdds;
  const oddsStr = odds > 0 ? `+${odds}` : `${odds}`;
  const sportsbook = useMemo(() => {
    if (selectedPlatform) {
      return SPORTSBOOKS.find(s => s.id === selectedPlatform) || SPORTSBOOKS[0];
    }
    const hash = Math.abs([...prop.id].reduce((h, c) => ((h << 5) - h) + c.charCodeAt(0), 0));
    return SPORTSBOOKS[hash % SPORTSBOOKS.length];
  }, [prop.id, selectedPlatform]);

  const gameDate = prop.gameTime
    ? new Date(prop.gameTime).toLocaleDateString('en-US', { weekday: 'short' })
    : '';
  const gameTimeStr = prop.gameTime
    ? new Date(prop.gameTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    : '';

  // Generate AI explanation based on real data only
  const explanation = useMemo(() => {
    const playerFirst = prop.playerName.split(' ')[0];

    if (hasRealData) {
      const hitStrength = hitPct >= 70 ? 'strong' : hitPct >= 55 ? 'solid' : hitPct >= 40 ? 'moderate' : 'weak';
      const directionVerb = direction === 'Over' ? 'cleared' : 'stayed under';
      const hitPhrase = `${playerFirst} has ${directionVerb} this line in ${hitPct}% of his last ${hitTotal} games`;

      if (edge > 5) {
        return `${hitPhrase} — a ${hitStrength} trend. Combined with a ${edge.toFixed(1)}% edge from the odds, this is one of the sharper ${direction} plays on the board.`;
      }
      if (edge > 2) {
        return `${hitPhrase}. The ${edge.toFixed(1)}% edge suggests the ${direction} is slightly mispriced against ${prop.opponent}.`;
      }
      if (edge > 0) {
        return `Marginal ${edge.toFixed(1)}% edge on the ${direction}. ${hitPhrase}. Worth monitoring for line movement.`;
      }
      return `Coin-flip territory. ${hitPhrase}. Minimal edge either way — consider passing or waiting for a better line.`;
    }

    // No real data available — odds-only explanation
    if (edge > 5) {
      return `Odds imply a ${edge.toFixed(1)}% edge on the ${direction} for ${playerFirst} vs ${prop.opponent}. Historical game log data is currently unavailable.`;
    }
    if (edge > 2) {
      return `${playerFirst} shows a ${edge.toFixed(1)}% edge on the ${direction} based on current odds vs ${prop.opponent}. L20 data unavailable.`;
    }
    return `${playerFirst} vs ${prop.opponent} — ${edge.toFixed(1)}% edge on the ${direction} from odds alone. No game log data available to confirm the trend.`;
  }, [prop, direction, edge, hasRealData, hitPct, hitTotal]);

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
          <PlayerAvatar playerName={prop.playerName} sport={prop.sport} className="h-12 w-12" />
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
          {/* Sportsbook logo */}
          <a
            href={sportsbook.url}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-secondary/60 hover:bg-secondary/80 transition-colors rounded-lg p-2 cursor-pointer"
            title={`Bet on ${sportsbook.name}`}
          >
            <img
              src={sportsbook.logo}
              alt={sportsbook.name}
              className="h-5 w-5 object-contain rounded-sm"
            />
          </a>
        </div>

        {/* Stats row — only real data */}
        <div className="grid grid-cols-2 gap-2 px-4 pb-3">
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

        {/* L20 hit rate bar — only shown with real data */}
        {gameLog.isLoading ? (
          <div className="flex items-center gap-2 px-4 pb-3">
            <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">Loading L20…</span>
            <div className="flex gap-0.5 flex-1 justify-end">
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} className="h-2 flex-1 max-w-[16px] rounded-full bg-muted animate-pulse" />
              ))}
            </div>
          </div>
        ) : hasRealData ? (
          <div className="flex items-center gap-2 px-4 pb-3">
            <span className="text-xs font-semibold whitespace-nowrap">
              Hit <span className={hitPct >= 60 ? 'text-emerald-400' : 'text-red-400'}>{hitPct}%</span> in L{hitTotal}
              <span className="text-[9px] text-muted-foreground ml-1">✓</span>
            </span>
            <div className="flex gap-0.5 flex-1 justify-end">
              {gameLog.results.map((hit, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-2 flex-1 max-w-[16px] rounded-full",
                    hit ? 'bg-emerald-500' : 'bg-pink-500'
                  )}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="px-4 pb-3">
            <span className="text-xs text-muted-foreground">L20 data unavailable</span>
          </div>
        )}

        {/* AI Explanation */}
        <div className="px-4 pb-4">
          <div className="bg-secondary/30 rounded-lg p-3 border border-border/50">
            <div className="flex items-start gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 rounded px-1.5 py-0.5 shrink-0">AI</span>
              <p className="text-xs text-muted-foreground leading-relaxed">{explanation}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
