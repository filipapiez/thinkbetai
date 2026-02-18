import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, ChevronRight, Trophy, Star, Target, Activity, Zap, TrendingUp, TrendingDown, Minus, Check, Layers } from 'lucide-react';
import { TeamLogo } from '@/components/TeamLogo';

// Get position label based on sport - only show for combat sports
const getPositionLabel = (sport: string, isHome: boolean): string | null => {
  const sportLower = sport.toLowerCase();
  
  // Combat sports use corners
  if (['ufc', 'mma', 'boxing'].includes(sportLower)) {
    return isHome ? 'Red Corner' : 'Blue Corner';
  }
  
  // All other sports - no home/away labels (data doesn't reliably match)
  return null;
};
import { cn } from '@/lib/utils';
import { PopularGame } from '@/hooks/usePopularGames';

interface PopularGameCardProps {
  game: PopularGame;
  rank?: number;
  isSelected?: boolean;
  onToggleSelect?: (game: PopularGame) => void;
}

type BetSignal = 'GOOD' | 'BORDERLINE' | 'PASS';

// Calculate betting signal based on odds - exported for use in other components
export function calculateBetSignal(game: PopularGame): { signal: BetSignal; confidence: number } {
  // If no odds data, use popularity-based scoring instead
  if (!game.odds || !game.hasOdds) {
    // Without odds, never show as GOOD — not enough data for parlay value
    const popularity = game.popularityScore || 50;
    if (popularity >= 85) {
      return { signal: 'BORDERLINE', confidence: 55 };
    }
    return { signal: 'PASS', confidence: 40 };
  }

  let confidenceScore = 50;
  let riskScore = 30;

  const homeML = game.odds.moneyline?.home ?? 0;
  const awayML = game.odds.moneyline?.away ?? 0;
  const spread = game.odds.spread?.home ?? 0;

  const hasMoneyline = homeML !== 0 && awayML !== 0;
  const hasSpread = spread !== 0;

  if (!hasMoneyline && !hasSpread) {
    // Fallback to popularity when odds incomplete
    const popularity = game.popularityScore || 50;
    if (popularity >= 80) {
      return { signal: 'BORDERLINE', confidence: 50 };
    }
    return { signal: 'PASS', confidence: 35 };
  }

  if (hasMoneyline) {
    const homeImplied = homeML > 0 ? 100 / (homeML + 100) : Math.abs(homeML) / (Math.abs(homeML) + 100);
    const awayImplied = awayML > 0 ? 100 / (awayML + 100) : Math.abs(awayML) / (Math.abs(awayML) + 100);
    const impliedDiff = Math.abs(homeImplied - awayImplied);

    if (impliedDiff >= 0.25) {
      confidenceScore += 15;
    } else if (impliedDiff >= 0.10) {
      confidenceScore += 10;
    } else {
      riskScore += 10;
    }

    if (homeML < -300 || awayML < -300) {
      riskScore += 15;
      confidenceScore -= 10;
    }

    if ((homeML >= 150 && homeML <= 250) || (awayML >= 150 && awayML <= 250)) {
      confidenceScore += 12;
    }
  }

  if (hasSpread) {
    const absSpread = Math.abs(spread);
    if (absSpread <= 3) {
      confidenceScore += 8;
    } else if (absSpread >= 10) {
      riskScore += 8;
    }
  }

  confidenceScore = Math.min(100, Math.max(0, confidenceScore));
  riskScore = Math.min(100, Math.max(0, riskScore));

  let signal: BetSignal;
  if (confidenceScore >= 75 && riskScore <= 45) {
    signal = 'GOOD';
  } else if (riskScore > 60 || confidenceScore < 40) {
    signal = 'PASS';
  } else {
    signal = 'BORDERLINE';
  }

  return { signal, confidence: Math.round(confidenceScore) };
}

const BetSignalBadge = ({ signal, confidence }: { signal: BetSignal; confidence: number }) => {
  const variants = {
    'GOOD': { bg: 'bg-emerald-500/20 border-emerald-500/40', text: 'text-emerald-400', label: 'GOOD BET', icon: TrendingUp },
    'BORDERLINE': { bg: 'bg-amber-500/20 border-amber-500/40', text: 'text-amber-400', label: 'BORDERLINE', icon: Minus },
    'PASS': { bg: 'bg-red-500/20 border-red-500/40', text: 'text-red-400', label: 'PASS', icon: TrendingDown },
  };

  const v = variants[signal];
  const Icon = v.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs font-semibold px-2 py-0.5 flex items-center gap-1",
        v.bg,
        v.text
      )}
    >
      <Icon className="h-3 w-3" />
      {v.label}
    </Badge>
  );
};

// Format moneyline odds for display
const formatOdds = (odds: number | undefined): string => {
  if (odds === undefined || odds === 0) return 'N/A';
  return odds > 0 ? `+${odds}` : `${odds}`;
};

export const PopularGameCard = ({ game, rank, isSelected, onToggleSelect }: PopularGameCardProps) => {
  // Calculate betting signal
  const betSignal = useMemo(() => calculateBetSignal(game), [game]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Create abbreviation from team name (first letters of words)
  const getAbbreviation = (name: string) => {
    if (name.length <= 4) return name.toUpperCase();
    const words = name.split(' ');
    if (words.length >= 2) {
      return words.slice(0, 3).map(w => w[0]).join('').toUpperCase();
    }
    return name.slice(0, 3).toUpperCase();
  };

  // Generate a unique game ID for linking
  const gameLink = `/games/${game.id}`;
  const hasOdds = game.hasOdds && game.odds;

  return (
    <div className="relative">
      {rank !== undefined && rank <= 3 && (
        <div className="absolute -top-2 -left-2 z-10">
          <div className={cn(
            "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-lg",
            rank === 1 && "bg-amber-500 text-amber-950",
            rank === 2 && "bg-gray-400 text-gray-900",
            rank === 3 && "bg-amber-700 text-amber-100"
          )}>
            #{rank}
          </div>
        </div>
      )}
      
      <Link to={gameLink} state={{ game }} className="block">
        <Card variant="elevated" className="group hover:border-primary/30 transition-all duration-200 cursor-pointer">
          <CardContent className="p-5">
            {/* Header with sport/league and popularity */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5">
                  <Badge variant="info">{game.sport}</Badge>
                  <Badge variant="outline" className="font-normal text-xs">
                    <Trophy className="h-3 w-3 mr-1" />
                    {game.league}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(game.startTime)}</span>
                  <Clock className="h-3 w-3 ml-1" />
                  <span>{formatTime(game.startTime)}</span>
                </div>
              </div>
              <BetSignalBadge signal={betSignal.signal} confidence={betSignal.confidence} />
            </div>

            <div className="flex items-center justify-between gap-4 mb-4">
              {/* Home Team */}
              <div className="flex-1 text-center">
                <TeamLogo
                  teamName={game.homeTeam}
                  abbreviation={getAbbreviation(game.homeTeam)}
                  sport={game.league || game.sport}
                  className="mx-auto mb-2"
                />
                <p className="text-sm font-medium truncate" title={game.homeTeam}>
                  {game.homeTeam}
                </p>
                {getPositionLabel(game.sport, true) && (
                  <p className="text-xs text-muted-foreground">{getPositionLabel(game.sport, true)}</p>
                )}
                {hasOdds && game.odds?.moneyline && (
                  <p className={cn(
                    "text-lg font-bold font-mono mt-1",
                    game.odds.moneyline.home < 0 ? "text-emerald-400" : "text-foreground"
                  )}>
                    {formatOdds(game.odds.moneyline.home)}
                  </p>
                )}
              </div>

              {/* VS */}
              <div className="shrink-0 text-center">
                <div className="text-lg font-bold text-muted-foreground">vs</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {game.status === 'live' ? (
                    <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/40 animate-pulse">
                      LIVE
                    </Badge>
                  ) : 'Scheduled'}
                </div>
              </div>

              {/* Away Team */}
              <div className="flex-1 text-center">
                <TeamLogo
                  teamName={game.awayTeam}
                  abbreviation={getAbbreviation(game.awayTeam)}
                  sport={game.league || game.sport}
                  className="mx-auto mb-2"
                />
                <p className="text-sm font-medium truncate" title={game.awayTeam}>
                  {game.awayTeam}
                </p>
                {getPositionLabel(game.sport, false) && (
                  <p className="text-xs text-muted-foreground">{getPositionLabel(game.sport, false)}</p>
                )}
                {hasOdds && game.odds?.moneyline && (
                  <p className={cn(
                    "text-lg font-bold font-mono mt-1",
                    game.odds.moneyline.away < 0 ? "text-emerald-400" : "text-foreground"
                  )}>
                    {formatOdds(game.odds.moneyline.away)}
                  </p>
                )}
              </div>
            </div>

            {/* Odds Display Section */}
            {hasOdds ? (
              <div className="grid grid-cols-3 gap-2 mb-4">
                {/* Moneyline */}
                <div className="text-center p-2 rounded-lg bg-muted/30 border border-border/50">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Target className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground uppercase">ML</span>
                  </div>
                  <div className="text-xs font-mono">
                    {formatOdds(game.odds?.moneyline?.home)} / {formatOdds(game.odds?.moneyline?.away)}
                  </div>
                </div>

                {/* Spread */}
                <div className="text-center p-2 rounded-lg bg-muted/30 border border-border/50">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Activity className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground uppercase">Spread</span>
                  </div>
                  <div className="text-xs font-mono">
                    {game.odds?.spread ? (
                      <>
                        {game.odds.spread.home > 0 ? '+' : ''}{game.odds.spread.home} / {game.odds.spread.away > 0 ? '+' : ''}{game.odds.spread.away}
                      </>
                    ) : 'N/A'}
                  </div>
                </div>

                {/* Total */}
                <div className="text-center p-2 rounded-lg bg-muted/30 border border-border/50">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Zap className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground uppercase">O/U</span>
                  </div>
                  <div className="text-xs font-mono">
                    {game.odds?.total ? (
                      <>O {game.odds.total.over}</>
                    ) : 'N/A'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-3 px-4 rounded-lg bg-muted/20 border border-border/50 mb-4">
                <p className="text-xs text-muted-foreground">
                  Tap for odds, analysis, charts & AI predictions
                </p>
              </div>
            )}

            {/* Add to Parlay Button + Value Badge */}
            {onToggleSelect && (
              <div className="space-y-1.5 mb-3">
                {betSignal.signal === 'GOOD' && !isSelected && (
                  <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-400">
                    <TrendingUp className="h-3 w-3" />
                    Good Parlay Value
                  </div>
                )}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onToggleSelect(game);
                  }}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 text-sm font-semibold py-2.5 rounded-lg border transition-all",
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                      : betSignal.signal === 'GOOD'
                        ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/25 hover:border-emerald-500/60"
                        : "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20 hover:border-primary/50"
                  )}
                >
                  {isSelected ? (
                    <>
                      <Check className="h-4 w-4" />
                      Added to Parlay
                    </>
                  ) : (
                    <>
                      <Layers className="h-4 w-4" />
                      Add to Parlay
                    </>
                  )}
                </button>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-border">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Star className="h-3 w-3" />
                <span>Popularity: {game.popularityScore}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-primary group-hover:text-primary/80">
                <span>Details</span>
                <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
};
