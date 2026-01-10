import { Link } from 'react-router-dom';
import { Game, getGameFacts } from '@/lib/mockData';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, ChevronRight, TrendingUp, TrendingDown, Minus, Zap } from 'lucide-react';
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

// Get position label based on sport - returns null for individual sports
const getPositionLabel = (sport: string, isHome: boolean): string | null => {
  const sportLower = sport.toLowerCase();
  
  // Combat sports use corners
  if (['ufc', 'mma', 'boxing'].includes(sportLower)) {
    return isHome ? 'Red Corner' : 'Blue Corner';
  }
  
  // Individual sports don't have home/away
  const individualSports = [
    'tennis', 'table tennis', 'atp', 'wta', 'wtt',
    'golf', 'pga', 'lpga',
    'esports', 'darts', 'snooker', 'badminton', 'pool'
  ];
  if (individualSports.some(s => sportLower.includes(s))) {
    return null;
  }
  
  // Team sports use home/away
  return isHome ? 'Home' : 'Away';
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
              {homeLabel && <p className="text-xs text-muted-foreground">{homeLabel}</p>}
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
              {awayLabel && <p className="text-xs text-muted-foreground">{awayLabel}</p>}
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
