import { Link } from 'react-router-dom';
import { Game, getGameFacts, Team } from '@/lib/mockData';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, ChevronRight, TrendingUp, TrendingDown, Minus, Zap, Trophy } from 'lucide-react';
import { calculateBetQualification, BetSignal, BetQualification } from '@/lib/betQualification';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface GameCardProps {
  game: Game;
}

const BetSignalBadge = ({ qualification }: { qualification: BetQualification }) => {
  const { signal, reason, confidenceScore } = qualification;
  
  const variants: Record<BetSignal, { bg: string; text: string; label: string; icon: React.ReactNode }> = {
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

// Check if sport is individual (non-team) sport
const isIndividualSport = (sport: string): boolean => {
  const sportLower = sport.toLowerCase();
  const individualSports = [
    'tennis', 'table tennis', 'atp', 'wta', 'wtt',
    'golf', 'pga', 'lpga',
    'esports', 'darts', 'snooker', 'badminton', 'pool',
    'ufc', 'mma', 'boxing'
  ];
  return individualSports.some(s => sportLower.includes(s));
};

// Player ranking badge for individual sports
const PlayerRankingBadge = ({ team }: { team: Team }) => {
  const ranking = team.stats?.ranking;
  if (!ranking) return null;
  
  // Style based on ranking
  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-amber-400 bg-amber-500/20 border-amber-500/40';
    if (rank <= 3) return 'text-slate-300 bg-slate-500/20 border-slate-500/40';
    if (rank <= 10) return 'text-orange-400 bg-orange-500/20 border-orange-500/40';
    return 'text-muted-foreground bg-muted/30 border-border';
  };
  
  return (
    <Badge 
      variant="outline" 
      className={cn(
        "text-[10px] px-1.5 py-0 flex items-center gap-0.5 font-semibold",
        getRankColor(ranking)
      )}
    >
      <Trophy className="h-2.5 w-2.5" />
      #{ranking}
    </Badge>
  );
};

export const GameCard = ({ game }: GameCardProps) => {
  const qualification = useMemo(() => {
    // Try to get enriched game facts for mock games
    const facts = getGameFacts(game.id);
    
    // If we have enriched facts, use them
    if (facts) {
      return calculateBetQualification({
        game: facts.game,
        injuries: facts.injuries,
        risk: facts.risk,
        homeLast5: facts.recentForm.homeLast5,
        awayLast5: facts.recentForm.awayLast5,
      });
    }
    
    // Otherwise, calculate qualification from the game data directly
    // This ensures games from live data sources still get proper signals
    return calculateBetQualification({
      game,
      injuries: undefined,
      risk: undefined,
      homeLast5: undefined,
      awayLast5: undefined,
    });
  }, [game]);
  
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
  const homeLabel = getPositionLabel(game.sport, true);
  const awayLabel = getPositionLabel(game.sport, false);

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
            {/* Player/Team 1 */}
            <div className="flex-1 text-center">
              <div className={cn(
                "w-14 h-14 mx-auto mb-2 rounded-xl bg-gradient-to-br from-secondary to-muted flex items-center justify-center text-xl font-bold",
                qualification.pick === 'home' && qualification.signal === 'GOOD' && "ring-2 ring-emerald-500/50"
              )}>
                {game.homeTeam.abbreviation}
              </div>
              <p className="text-sm font-medium truncate">{game.homeTeam.name}</p>
              <div className="flex flex-col items-center gap-1 mt-1">
                {homeLabel && <p className="text-xs text-muted-foreground">{homeLabel}</p>}
                {isIndividualSport(game.sport) && <PlayerRankingBadge team={game.homeTeam} />}
              </div>
            </div>

            {/* VS */}
            <div className="shrink-0 text-center">
              <div className="text-lg font-bold text-muted-foreground">vs</div>
              <div className="text-sm font-mono text-primary mt-1">
                {formatTime(game.startTime)}
              </div>
            </div>

            {/* Player/Team 2 */}
            <div className="flex-1 text-center">
              <div className={cn(
                "w-14 h-14 mx-auto mb-2 rounded-xl bg-gradient-to-br from-secondary to-muted flex items-center justify-center text-xl font-bold",
                qualification.pick === 'away' && qualification.signal === 'GOOD' && "ring-2 ring-emerald-500/50"
              )}>
                {game.awayTeam.abbreviation}
              </div>
              <p className="text-sm font-medium truncate">{game.awayTeam.name}</p>
              <div className="flex flex-col items-center gap-1 mt-1">
                {awayLabel && <p className="text-xs text-muted-foreground">{awayLabel}</p>}
                {isIndividualSport(game.sport) && <PlayerRankingBadge team={game.awayTeam} />}
              </div>
            </div>
          </div>

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
