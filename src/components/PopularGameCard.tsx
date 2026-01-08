import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, ChevronRight, Trophy, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PopularGame } from '@/hooks/usePopularGames';

interface PopularGameCardProps {
  game: PopularGame;
  rank?: number;
}

const PopularityBadge = ({ score }: { score: number }) => {
  let variant: { bg: string; text: string; label: string };
  
  if (score >= 150) {
    variant = { bg: 'bg-amber-500/20 border-amber-500/40', text: 'text-amber-400', label: 'HIGH INTEREST' };
  } else if (score >= 100) {
    variant = { bg: 'bg-blue-500/20 border-blue-500/40', text: 'text-blue-400', label: 'POPULAR' };
  } else {
    variant = { bg: 'bg-muted/50 border-border', text: 'text-muted-foreground', label: 'SCHEDULED' };
  }
  
  return (
    <Badge 
      variant="outline" 
      className={cn(
        "text-xs font-semibold px-2 py-0.5 flex items-center gap-1",
        variant.bg,
        variant.text
      )}
    >
      <Star className="h-3 w-3" />
      {variant.label}
    </Badge>
  );
};

export const PopularGameCard = ({ game, rank }: PopularGameCardProps) => {
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

  // Generate a unique game ID for linking (URL-safe)
  const gameLink = `/games/popular-${game.id}`;

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
      
      <Card variant="elevated" className="group hover:border-primary/30 cursor-default">
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
            <PopularityBadge score={game.popularityScore} />
          </div>

          <div className="flex items-center justify-between gap-4 mb-4">
            {/* Home Team */}
            <div className="flex-1 text-center">
              <div className="w-14 h-14 mx-auto mb-2 rounded-xl bg-gradient-to-br from-secondary to-muted flex items-center justify-center text-xl font-bold">
                {getAbbreviation(game.homeTeam)}
              </div>
              <p className="text-sm font-medium truncate" title={game.homeTeam}>
                {game.homeTeam}
              </p>
              <p className="text-xs text-muted-foreground">Home</p>
            </div>

            {/* VS */}
            <div className="shrink-0 text-center">
              <div className="text-lg font-bold text-muted-foreground">vs</div>
              <div className="text-xs text-muted-foreground mt-1">
                Scheduled
              </div>
            </div>

            {/* Away Team */}
            <div className="flex-1 text-center">
              <div className="w-14 h-14 mx-auto mb-2 rounded-xl bg-gradient-to-br from-secondary to-muted flex items-center justify-center text-xl font-bold">
                {getAbbreviation(game.awayTeam)}
              </div>
              <p className="text-sm font-medium truncate" title={game.awayTeam}>
                {game.awayTeam}
              </p>
              <p className="text-xs text-muted-foreground">Away</p>
            </div>
          </div>

          {/* Info notice - no odds shown */}
          <div className="text-center py-3 px-4 rounded-lg bg-muted/20 border border-border/50 mb-4">
            <p className="text-xs text-muted-foreground">
              Schedule information only • No betting data displayed
            </p>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-border">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Star className="h-3 w-3" />
              <span>Popularity: {game.popularityScore}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {rank !== undefined && `Rank #${rank} of 15`}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
