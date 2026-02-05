import { Link } from 'react-router-dom';
import { LiveGame, LiveBetQualification, calculateLiveBetQualification } from '@/lib/liveTypes';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, ChevronRight, TrendingUp, TrendingDown, Minus, Zap, Percent, Trophy, Award } from 'lucide-react';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { LiveTeam } from '@/lib/liveTypes';

interface LiveGameCardProps {
  game: LiveGame;
}

const BetSignalBadge = ({ qualification }: { qualification: LiveBetQualification }) => {
  const { signal, reason, confidenceScore } = qualification;
  
  const variants: Record<typeof signal, { bg: string; text: string; label: string; icon: React.ReactNode }> = {
    'GOOD': { 
      bg: 'bg-emerald-500/20 border-emerald-500/40', 
      text: 'text-emerald-400', 
      label: 'GOOD BET',
      icon: <TrendingUp className="h-3 w-3" />
    },
    'BORDERLINE': { 
      bg: 'bg-amber-500/20 border-amber-500/40', 
      text: 'text-amber-400', 
      label: 'BORDERLINE',
      icon: <Minus className="h-3 w-3" />
    },
    'PASS': { 
      bg: 'bg-red-500/20 border-red-500/40', 
      text: 'text-red-400', 
      label: 'PASS',
      icon: <TrendingDown className="h-3 w-3" />
    },
  };
  
  const variant = variants[signal];
  
  return (
    <div className="flex flex-col items-end gap-1">
      <Badge 
        variant="outline" 
        className={cn(
          "text-xs font-semibold px-2 py-0.5 flex items-center gap-1",
          variant.bg,
          variant.text
        )}
      >
        {variant.icon}
        {variant.label}
      </Badge>
      <div className="flex items-center gap-2 text-xs">
        <span className="text-muted-foreground truncate max-w-[120px]" title={reason}>
          {reason}
        </span>
        <span className={cn("font-mono font-medium", variant.text)}>
          {confidenceScore}%
        </span>
      </div>
    </div>
  );
};

const WinRateBadge = ({ winPct }: { winPct?: number }) => {
  if (winPct === undefined) return null;
  
  const pct = Math.round(winPct * 100);
  const color = pct >= 60 ? 'text-emerald-400' : pct >= 45 ? 'text-amber-400' : 'text-red-400';
  
  return (
    <div className={cn("flex items-center gap-0.5 text-xs font-mono", color)}>
      <Percent className="h-3 w-3" />
      {pct}
    </div>
  );
};

// Fighter stats component for UFC/MMA/Boxing
const FighterStatsBadge = ({ team, position }: { team: LiveTeam; position: 'red' | 'blue' }) => {
  const stats = team.stats;
  if (!stats?.record && !stats?.weightClass) return null;
  
  return (
    <div className="flex flex-col items-center gap-1 mt-1">
      {stats.weightClass && (
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-primary/10 border-primary/30">
          {stats.weightClass}
        </Badge>
      )}
      {stats.record && (
        <span className="text-[10px] font-mono text-muted-foreground">
          {stats.record}
        </span>
      )}
    </div>
  );
};

// Table Tennis / Tennis stats component
const PlayerStatsBadge = ({ team }: { team: LiveTeam }) => {
  const stats = team.stats;
  if (!stats?.worldRanking && !stats?.points) return null;
  
  return (
    <div className="flex items-center gap-2 mt-1">
      {stats.worldRanking && (
        <div className="flex items-center gap-0.5 text-[10px] text-amber-400">
          <Trophy className="h-3 w-3" />
          #{stats.worldRanking}
        </div>
      )}
      {stats.points && (
        <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
          <Award className="h-3 w-3" />
          {stats.points}pts
        </div>
      )}
    </div>
  );
};

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

// Check if sport is a combat sport
const isCombatSport = (sport: string): boolean => {
  return ['ufc', 'mma', 'boxing'].includes(sport.toLowerCase());
};

// Check if sport is a racket/individual sport (tennis/table tennis/golf/etc.)
const isIndividualSport = (sport: string): boolean => {
  const sportLower = sport.toLowerCase();
  const individualSports = [
    'tennis', 'table tennis', 'atp', 'wta', 'wtt',
    'golf', 'pga', 'lpga',
    'esports', 'darts', 'snooker', 'badminton', 'pool'
  ];
  return individualSports.some(s => sportLower.includes(s));
};

export const LiveGameCard = ({ game }: LiveGameCardProps) => {
  const qualification = useMemo(() => calculateLiveBetQualification(game), [game]);
  
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

  const isLive = game.status === 'live';

  return (
    <Link to={`/games/${game.id}`}>
      <Card variant="elevated" className="group hover:border-primary/30 cursor-pointer">
        <CardContent className="p-5">
          {/* Header with sport badge and bet signal */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <Badge variant="info">{game.sport}</Badge>
                {isLive && (
                  <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/40 animate-pulse">
                    <Zap className="h-3 w-3 mr-1" />
                    LIVE
                  </Badge>
                )}
              </div>
              <Badge variant="outline" className="font-normal text-xs">
                <Calendar className="h-3 w-3 mr-1" />
                {formatDate(game.startTime)}
              </Badge>
            </div>
            <BetSignalBadge qualification={qualification} />
          </div>

          <div className="flex items-center justify-between gap-4 mb-4">
            {/* Home/Red Corner Team */}
            <div className="flex-1 text-center">
              <div className={cn(
                "w-14 h-14 mx-auto mb-2 rounded-xl bg-gradient-to-br from-secondary to-muted flex items-center justify-center text-xl font-bold",
                qualification.pick === 'home' && qualification.signal === 'GOOD' && "ring-2 ring-emerald-500/50",
                isCombatSport(game.sport) && "border-2 border-red-500/50"
              )}>
                {game.homeTeam.abbreviation}
              </div>
              <p className="text-sm font-medium truncate">{game.homeTeam.name}</p>
              <div className="flex flex-col items-center gap-1">
                {getPositionLabel(game.sport, true) && (
                  <p className="text-xs text-muted-foreground">{getPositionLabel(game.sport, true)}</p>
                )}
                {isCombatSport(game.sport) ? (
                  <FighterStatsBadge team={game.homeTeam} position="red" />
                ) : isIndividualSport(game.sport) ? (
                  <PlayerStatsBadge team={game.homeTeam} />
                ) : (
                  <WinRateBadge winPct={game.homeTeam.stats?.winPct} />
                )}
              </div>
            </div>

            {/* VS */}
            <div className="shrink-0 text-center">
              <div className="text-lg font-bold text-muted-foreground">vs</div>
              <div className="text-sm font-mono text-primary mt-1">
                {formatTime(game.startTime)}
              </div>
            </div>

            {/* Away/Blue Corner Team */}
            <div className="flex-1 text-center">
              <div className={cn(
                "w-14 h-14 mx-auto mb-2 rounded-xl bg-gradient-to-br from-secondary to-muted flex items-center justify-center text-xl font-bold",
                qualification.pick === 'away' && qualification.signal === 'GOOD' && "ring-2 ring-emerald-500/50",
                isCombatSport(game.sport) && "border-2 border-blue-500/50"
              )}>
                {game.awayTeam.abbreviation}
              </div>
              <p className="text-sm font-medium truncate">{game.awayTeam.name}</p>
              <div className="flex flex-col items-center gap-1">
                {getPositionLabel(game.sport, false) && (
                  <p className="text-xs text-muted-foreground">{getPositionLabel(game.sport, false)}</p>
                )}
                {isCombatSport(game.sport) ? (
                  <FighterStatsBadge team={game.awayTeam} position="blue" />
                ) : isIndividualSport(game.sport) ? (
                  <PlayerStatsBadge team={game.awayTeam} />
                ) : (
                  <WinRateBadge winPct={game.awayTeam.stats?.winPct} />
                )}
              </div>
            </div>
          </div>

          {/* Odds Display */}
          {game.hasOdds && game.odds ? (
            <div className="grid grid-cols-3 gap-2 text-center text-xs mb-4 p-2 rounded-lg bg-muted/30">
              <div>
                <div className="text-muted-foreground">Moneyline</div>
                <div className="font-mono font-medium">
                  <span className={game.odds.moneyline.home < 0 ? 'text-emerald-400' : ''}>
                    {game.odds.moneyline.home > 0 ? '+' : ''}{game.odds.moneyline.home}
                  </span>
                  {' / '}
                  <span className={game.odds.moneyline.away < 0 ? 'text-emerald-400' : ''}>
                    {game.odds.moneyline.away > 0 ? '+' : ''}{game.odds.moneyline.away}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Spread</div>
                <div className="font-mono font-medium">
                  {game.odds.spread.home > 0 ? '+' : ''}{game.odds.spread.home}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Total</div>
                <div className="font-mono font-medium">
                  O/U {game.odds.total.over}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground mb-4">
              Odds not available
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-border">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span className="truncate max-w-[180px]">{game.venue}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-primary font-medium group-hover:gap-2 transition-all">
              View Details
              <ChevronRight className="h-4 w-4" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
