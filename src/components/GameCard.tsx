import { Link } from 'react-router-dom';
import { Game } from '@/lib/mockData';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, ChevronRight } from 'lucide-react';

interface GameCardProps {
  game: Game;
}

export const GameCard = ({ game }: GameCardProps) => {
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

  return (
    <Link to={`/games/${game.id}`}>
      <Card variant="elevated" className="group hover:border-primary/30 cursor-pointer">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <Badge variant="info">{game.sport}</Badge>
            <Badge variant="outline" className="font-normal">
              <Calendar className="h-3 w-3 mr-1" />
              {formatDate(game.startTime)}
            </Badge>
          </div>

          <div className="flex items-center justify-between gap-4 mb-4">
            {/* Home Team */}
            <div className="flex-1 text-center">
              <div className="w-14 h-14 mx-auto mb-2 rounded-xl bg-gradient-to-br from-secondary to-muted flex items-center justify-center text-xl font-bold">
                {game.homeTeam.abbreviation}
              </div>
              <p className="text-sm font-medium truncate">{game.homeTeam.name}</p>
              <p className="text-xs text-muted-foreground">Home</p>
            </div>

            {/* VS */}
            <div className="shrink-0 text-center">
              <div className="text-lg font-bold text-muted-foreground">vs</div>
              <div className="text-sm font-mono text-primary mt-1">
                {formatTime(game.startTime)}
              </div>
            </div>

            {/* Away Team */}
            <div className="flex-1 text-center">
              <div className="w-14 h-14 mx-auto mb-2 rounded-xl bg-gradient-to-br from-secondary to-muted flex items-center justify-center text-xl font-bold">
                {game.awayTeam.abbreviation}
              </div>
              <p className="text-sm font-medium truncate">{game.awayTeam.name}</p>
              <p className="text-xs text-muted-foreground">Away</p>
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
