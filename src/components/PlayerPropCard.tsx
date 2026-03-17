import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';
import { toast } from 'sonner';
import type { PlayerProp, BookOdds } from '@/hooks/usePlayerProps';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';
import { PlayerAvatar } from './PlayerAvatar';
import { usePlayerGameLog, useLazyPlayerGameLog } from '@/hooks/usePlayerGameLog';

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
  {
    id: 'hardrockbet',
    name: 'Hard Rock',
    logo: '/images/hardrock-logo.png',
    url: 'https://www.hardrock.bet',
  },
] as const;

interface PlayerPropCardProps {
  prop: PlayerProp;
  selectedPlatform?: string | null;
  /** If true, auto-fetches L20 on render. If false, requires tap. */
  autoFetchL20?: boolean;
}

// Convert American odds to implied probability
export function impliedProb(odds: number): number {
  if (odds > 0) return 100 / (odds + 100);
  return Math.abs(odds) / (Math.abs(odds) + 100);
}

// Compute edge
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
  Points: 'G', Assists: 'G', Rebounds: 'F', '3-Pointers': 'G',
  Steals: 'G', Blocks: 'C', 'Pass Yards': 'QB', 'Rush Yards': 'RB',
  'Rec Yards': 'WR', Receptions: 'WR', Strikeouts: 'P', Hits: 'OF',
  'Total Bases': 'OF', Saves: 'G', Shots: 'F', Goals: 'F',
};

function AutoFetchCard({ prop, direction, edge, prob, selectedPlatform }: {
  prop: PlayerProp; direction: 'Over' | 'Under'; edge: number; prob: number; selectedPlatform?: string | null;
}) {
  const gameLog = usePlayerGameLog(prop.playerName, prop.sport, prop.statType, prop.line, direction);
  return (
    <CardInner
      prop={prop} direction={direction} edge={edge} prob={prob}
      selectedPlatform={selectedPlatform}
      results={gameLog.results} hitCount={gameLog.hitCount} hitTotal={gameLog.total}
      isLoading={gameLog.isLoading} hasRealData={gameLog.results.length >= 10}
    />
  );
}

function LazyFetchCard({ prop, direction, edge, prob, selectedPlatform }: {
  prop: PlayerProp; direction: 'Over' | 'Under'; edge: number; prob: number; selectedPlatform?: string | null;
}) {
  const lazy = useLazyPlayerGameLog(prop.playerName, prop.sport, prop.statType, prop.line, direction);
  return (
    <CardInner
      prop={prop} direction={direction} edge={edge} prob={prob}
      selectedPlatform={selectedPlatform}
      results={lazy.results} hitCount={lazy.hitCount} hitTotal={lazy.total}
      isLoading={lazy.isLoading} hasRealData={lazy.hasData}
      onLoadL20={lazy.hasData ? undefined : lazy.fetch}
    />
  );
}

export function PlayerPropCard({ prop, selectedPlatform, autoFetchL20 = true }: PlayerPropCardProps) {
  const { direction, edge, prob } = useMemo(
    () => computeEdge(prop.overOdds, prop.underOdds),
    [prop.overOdds, prop.underOdds]
  );

  return (
    <Card className="bg-card border-border overflow-hidden">
      <CardContent className="p-0">
        {autoFetchL20 ? (
          <AutoFetchCard prop={prop} direction={direction} edge={edge} prob={prob} selectedPlatform={selectedPlatform} />
        ) : (
          <LazyFetchCard prop={prop} direction={direction} edge={edge} prob={prob} selectedPlatform={selectedPlatform} />
        )}
      </CardContent>
    </Card>
  );
}

function CardInner({ prop, direction: oddsDirection, edge, prob, selectedPlatform, results, hitCount, hitTotal, isLoading, hasRealData, onLoadL20 }: {
  prop: PlayerProp; direction: 'Over' | 'Under'; edge: number; prob: number;
  selectedPlatform?: string | null;
  results: boolean[]; hitCount: number; hitTotal: number;
  isLoading: boolean; hasRealData: boolean;
  onLoadL20?: () => void;
}) {
  const hitPct = hitTotal > 0 ? Math.round((hitCount / hitTotal) * 100) : 0;
  const position = positionMap[prop.statType] || 'PL';

  // Override direction when L20 data strongly contradicts odds direction
  const direction = hasRealData && hitPct < 40
    ? (oddsDirection === 'Over' ? 'Under' : 'Over')
    : oddsDirection;

  const effectiveHitPct = direction !== oddsDirection ? (100 - hitPct) : hitPct;
  const effectiveHitCount = direction !== oddsDirection ? (hitTotal - hitCount) : hitCount;

  const odds = direction === 'Over' ? prop.overOdds : prop.underOdds;

  const blendedProb = hasRealData
    ? Math.min(Math.max(effectiveHitPct * 0.75 + prob * 0.25, 10), 95)
    : prob;
  const blendedEdge = hasRealData
    ? Math.min(Math.max(blendedProb - 50, 0), 45)
    : edge;

  // Determine which sportsbooks to show
  const visibleBooks = useMemo(() => {
    const booksWithData = prop.bookOdds && Object.keys(prop.bookOdds).length > 0
      ? SPORTSBOOKS.filter(s => prop.bookOdds?.[s.id])
      : [];

    if (selectedPlatform) {
      // Only show selected platform if it actually has this prop
      return booksWithData.filter(s => s.id === selectedPlatform);
    }
    return booksWithData;
  }, [selectedPlatform, prop.bookOdds]);

  const gameDate = prop.gameTime
    ? new Date(prop.gameTime).toLocaleDateString('en-US', { weekday: 'short' })
    : '';
  const gameTimeStr = prop.gameTime
    ? new Date(prop.gameTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    : '';

  const explanation = useMemo(() => {
    const playerFirst = prop.playerName.split(' ')[0];
    const displayEdge = blendedEdge;

    if (hasRealData) {
      const directionVerb = direction === 'Over' ? 'cleared' : 'stayed under';
      const hitPhrase = `${playerFirst} has ${directionVerb} this line in ${effectiveHitPct}% of his last ${hitTotal} games`;

      if (effectiveHitPct >= 70) {
        return `${hitPhrase} — a strong trend. Combined with a ${displayEdge.toFixed(1)}% blended edge, this is one of the sharper ${direction} plays on the board.`;
      }
      if (effectiveHitPct >= 55) {
        return `${hitPhrase} — a solid trend. Combined with a ${displayEdge.toFixed(1)}% blended edge, this is a reasonable ${direction} play.`;
      }
      if (effectiveHitPct >= 45) {
        return `Coin-flip territory. ${hitPhrase}. Minimal edge either way — consider passing or waiting for a better line.`;
      }
      if (effectiveHitPct >= 30) {
        return `${hitPhrase} — below average. Consider passing or waiting for a better line.`;
      }
      return `${hitPhrase} — a clear fade. The data strongly suggests avoiding this ${direction}.`;
    }

    if (displayEdge > 5) {
      return `Odds imply a ${displayEdge.toFixed(1)}% edge on the ${direction} for ${playerFirst} vs ${prop.opponent}. Tap to load game history.`;
    }
    if (displayEdge > 2) {
      return `${playerFirst} shows a ${displayEdge.toFixed(1)}% edge on the ${direction} based on current odds vs ${prop.opponent}. Tap to load L20 data.`;
    }
    return `${playerFirst} vs ${prop.opponent} — ${displayEdge.toFixed(1)}% edge on the ${direction} from odds alone. Tap to load game history.`;
  }, [prop, direction, blendedEdge, hasRealData, effectiveHitPct, hitTotal]);

  return (
    <>
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
        <div className="flex items-center gap-1.5">
          {visibleBooks.map(book => (
            <a
              key={book.id}
              href={book.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-secondary/60 hover:bg-secondary/80 transition-colors rounded-lg p-2 cursor-pointer"
              title={`Bet on ${book.name}`}
            >
              <img src={book.logo} alt={book.name} className="h-5 w-5 object-contain rounded-sm" />
            </a>
          ))}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title="Share prop"
            onClick={async () => {
              const oddsStr = odds > 0 ? `+${odds}` : `${odds}`;
              const gameLink = `${window.location.origin}/games/${encodeURIComponent(prop.gameId)}`;
              const text = `🎯 ${prop.playerName} (${prop.team}) — ${direction} ${prop.line} ${prop.statType}\n📊 Prob: ${blendedProb.toFixed(0)}% | Edge: +${blendedEdge.toFixed(1)}%${hasRealData ? ` | L${hitTotal} Hit: ${effectiveHitPct}%` : ''}\n🏟️ vs ${prop.opponent} · ${gameDate} ${gameTimeStr}\n\n🔗 ${gameLink}\n\nShared via ThinkBetAI`;
              if (navigator.share) {
                try { await navigator.share({ text, url: gameLink }); } catch {}
              } else {
                await navigator.clipboard.writeText(text);
                toast.success('Prop copied to clipboard!');
              }
            }}
          >
            <Share2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-2 px-4 pb-3">
        <div className="bg-secondary/40 rounded-lg p-2 text-center border border-border/50">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Edge</div>
          <div className={cn(
            "font-bold text-sm",
            blendedEdge > 3 ? 'text-emerald-400' : blendedEdge > 0 ? 'text-amber-400' : 'text-red-400'
          )}>
            +{blendedEdge.toFixed(1)}%
          </div>
        </div>
        <div className="bg-secondary/40 rounded-lg p-2 text-center border border-border/50">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Prob</div>
          <div className="font-bold text-sm text-primary">{blendedProb.toFixed(0)}%</div>
        </div>
      </div>

      {/* L20 hit rate bar */}
      {isLoading ? (
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
            Hit <span className={effectiveHitPct >= 60 ? 'text-emerald-400' : 'text-red-400'}>{effectiveHitPct}%</span> in L{hitTotal}
            <span className="text-[9px] text-muted-foreground ml-1">✓</span>
          </span>
          <div className="flex gap-0.5 flex-1 justify-end">
            {results.map((hit, i) => {
              const effectiveHit = direction !== oddsDirection ? !hit : hit;
              return (
                <div
                  key={i}
                  className={cn(
                    "h-2 flex-1 max-w-[16px] rounded-full",
                    effectiveHit ? 'bg-emerald-500' : 'bg-pink-500'
                  )}
                />
              );
            })}
          </div>
        </div>
      ) : onLoadL20 ? (
        <div className="px-4 pb-3">
          <button
            onClick={onLoadL20}
            className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
          >
            Tap to load L20 history →
          </button>
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
    </>
  );
}
