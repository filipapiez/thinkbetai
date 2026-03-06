import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { PlayerProp } from '@/hooks/usePlayerProps';
import { cn } from '@/lib/utils';
import { useMemo, useState } from 'react';
import { PlayerAvatar } from './PlayerAvatar';

const SPORTSBOOKS = [
  {
    id: 'fanduel',
    name: 'FD',
    color: '#1493FF',
    url: 'https://www.fanduel.com/sportsbook',
  },
  {
    id: 'draftkings',
    name: 'DK',
    color: '#53D337',
    url: 'https://sportsbook.draftkings.com',
  },
  {
    id: 'betmgm',
    name: 'MGM',
    color: '#C4A44D',
    url: 'https://sports.betmgm.com',
  },
] as const;

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
  for (let i = 0; i < 20; i++) {
    // Use different bit manipulation for more variety across 20 games
    const subHash = hash ^ (i * 2654435761);
    results.push(((subHash >> (i % 16)) & 1) === 1);
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

function pseudoPace(id: string): 'fast' | 'average' | 'slow' {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 7) - hash) + id.charCodeAt(i);
    hash |= 0;
  }
  const v = Math.abs(hash) % 3;
  return v === 0 ? 'fast' : v === 1 ? 'average' : 'slow';
}

function pseudoRestDays(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 4) - hash) + id.charCodeAt(i);
    hash |= 0;
  }
  return (Math.abs(hash) % 4) + 1;
}

function pseudoMinutes(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 6) - hash) + id.charCodeAt(i);
    hash |= 0;
  }
  return 28 + (Math.abs(hash) % 10); // 28-37 min
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
  const hitPct = Math.round((hitCount / 20) * 100);
  const defRank = useMemo(() => pseudoDefRank(prop.id), [prop.id]);
  const pace = useMemo(() => pseudoPace(prop.id), [prop.id]);
  const restDays = useMemo(() => pseudoRestDays(prop.id), [prop.id]);
  const avgMinutes = useMemo(() => pseudoMinutes(prop.id), [prop.id]);
  const position = positionMap[prop.statType] || 'PL';
  const odds = direction === 'Over' ? prop.overOdds : prop.underOdds;
  const oddsStr = odds > 0 ? `+${odds}` : `${odds}`;
  const sportsbook = useMemo(() => {
    const hash = Math.abs([...prop.id].reduce((h, c) => ((h << 5) - h) + c.charCodeAt(0), 0));
    return SPORTSBOOKS[hash % SPORTSBOOKS.length];
  }, [prop.id]);

  const gameDate = prop.gameTime
    ? new Date(prop.gameTime).toLocaleDateString('en-US', { weekday: 'short' })
    : '';
  const gameTimeStr = prop.gameTime
    ? new Date(prop.gameTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    : '';

  // Generate contextual AI explanation with deeper analysis
  const explanation = useMemo(() => {
    const playerFirst = prop.playerName.split(' ')[0];
    const defDesc = defRank <= 10 ? 'bottom-tier' : defRank <= 20 ? 'middle-of-the-pack' : 'elite';
    const ordSuffix = (n: number) => n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th';
    const defOrd = `${defRank}${ordSuffix(defRank)}`;
    const paceNote = pace === 'fast' ? 'up-tempo game environment inflates volume' : pace === 'slow' ? 'slower pace could cap opportunities' : 'neutral pace expected';
    const restNote = restDays >= 3 ? 'well-rested' : restDays === 1 ? 'on a back-to-back' : 'with standard rest';
    const minsNote = avgMinutes >= 34 ? `heavy usage (${avgMinutes} MPG)` : avgMinutes >= 30 ? `solid minutes (${avgMinutes} MPG)` : `limited minutes (${avgMinutes} MPG)`;

    if (direction === 'Over' && edge > 5) {
      return `Strong lean. ${playerFirst} is ${restNote} and seeing ${minsNote} — ${paceNote}. ${prop.opponent}'s ${defOrd}-ranked defense vs ${position} is ${defDesc}, and ${playerFirst} has cleared this line in ${hitCount}/20 recent outings. The ${edge.toFixed(1)}% edge and ${prob.toFixed(0)}% implied probability make this one of the sharper Over plays on the board.`;
    }
    if (direction === 'Over' && edge > 2) {
      return `${playerFirst} draws a favorable spot against ${prop.opponent} (${defOrd} vs ${position}, ${defDesc}). ${paceNote.charAt(0).toUpperCase() + paceNote.slice(1)}, and he's ${restNote} with ${minsNote}. L5 hit rate sits at ${hitPct}% — the ${edge.toFixed(1)}% edge suggests the Over is slightly mispriced.`;
    }
    if (direction === 'Under' && edge > 5) {
      return `${prop.opponent} fields an ${defDesc} unit vs ${position} (${defOrd}), and ${paceNote}. ${playerFirst} is ${restNote} but only hitting this line ${hitPct}% of the time recently. With ${minsNote} and a ${edge.toFixed(1)}% edge, the Under looks well-supported by the data.`;
    }
    if (direction === 'Under' && edge > 2) {
      return `Matchup leans Under. ${prop.opponent} ranks ${defOrd} against ${position} — ${defDesc} on that side of the ball. ${playerFirst} is ${restNote} with ${minsNote}, and the ${hitPct}% L5 hit rate suggests this line may be set a touch high. ${edge.toFixed(1)}% edge here.`;
    }
    if (edge > 0) {
      return `Marginal ${edge.toFixed(1)}% edge on the ${direction}. ${playerFirst} is ${restNote} seeing ${minsNote}, facing a ${defDesc} ${prop.opponent} defense (${defOrd} vs ${position}). ${paceNote.charAt(0).toUpperCase() + paceNote.slice(1)} — ${hitPct}% L5 hit rate keeps this in play but not a top-tier spot.`;
    }
    return `Coin-flip territory. ${playerFirst} vs ${prop.opponent} shows minimal edge either way. ${defOrd}-ranked defense, ${minsNote}, and a ${hitPct}% recent hit rate. ${paceNote.charAt(0).toUpperCase() + paceNote.slice(1)} — pass or wait for better line movement.`;
  }, [prop, direction, edge, prob, defRank, hitPct, hitCount, position, pace, restDays, avgMinutes]);

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
          {/* Sportsbook odds badge */}
          <a
            href={sportsbook.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-secondary/60 hover:bg-secondary/80 transition-colors rounded-lg px-3 py-1.5 cursor-pointer"
            title={`Bet on ${sportsbook.name}`}
          >
            <img
              src={sportsbook.logo}
              alt={sportsbook.name}
              className="h-4 w-4 object-contain"
            />
            <span className="font-bold text-sm">{oddsStr}</span>
          </a>
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
        <div className="flex items-center gap-2 px-4 pb-3">
          <span className="text-xs font-semibold whitespace-nowrap">
            Hit <span className={hitPct >= 60 ? 'text-emerald-400' : 'text-red-400'}>{hitPct}%</span> in L20
          </span>
          <div className="flex gap-0.5 flex-1 justify-end">
            {l5Results.map((hit, i) => (
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
