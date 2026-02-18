import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Layers, Trash2, ChevronUp, ChevronDown, ExternalLink } from 'lucide-react';
import { PopularGame } from '@/hooks/usePopularGames';
import { TeamLogo } from '@/components/TeamLogo';
import { cn } from '@/lib/utils';

interface GameParlayBarProps {
  selectedGames: PopularGame[];
  onRemoveGame: (gameId: string) => void;
  onClearAll: () => void;
}

const getAbbreviation = (name: string) => {
  if (name.length <= 4) return name.toUpperCase();
  const words = name.split(' ');
  if (words.length >= 2) {
    return words.slice(0, 3).map(w => w[0]).join('').toUpperCase();
  }
  return name.slice(0, 3).toUpperCase();
};

export function GameParlayBar({ selectedGames, onRemoveGame, onClearAll }: GameParlayBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (selectedGames.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pointer-events-none">
      <div className="max-w-3xl mx-auto pointer-events-auto">
        <Card className="bg-card border-border shadow-2xl overflow-hidden">
          {/* Expanded list */}
          {isExpanded && (
            <div className="border-b border-border">
              <div className="flex items-center justify-between px-4 pt-3 pb-2">
                <span className="text-sm font-semibold">Selected Games</span>
                <Button variant="ghost" size="sm" onClick={onClearAll} className="h-7 text-xs">
                  <Trash2 className="h-3 w-3 mr-1" />
                  Clear All
                </Button>
              </div>
              <ScrollArea className="max-h-56">
                <div className="px-4 pb-3 space-y-2">
                  {selectedGames.map((game) => (
                    <div
                      key={game.id}
                      className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg group"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <TeamLogo
                          teamName={game.homeTeam}
                          abbreviation={getAbbreviation(game.homeTeam)}
                          sport={game.league || game.sport}
                          className="h-8 w-8"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {game.homeTeam} vs {game.awayTeam}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">{game.sport}</Badge>
                            <span>{game.league}</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        onClick={() => onRemoveGame(game.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Bottom bar */}
          <CardContent className="p-3">
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <div className="h-9 w-9 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Layers className="h-4 w-4 text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold flex items-center gap-1.5">
                    Parlay Builder
                    <Badge className="bg-primary text-primary-foreground text-xs px-1.5 py-0">
                      {selectedGames.length}
                    </Badge>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedGames.length} game{selectedGames.length !== 1 ? 's' : ''} selected
                  </p>
                </div>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                )}
              </button>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={onClearAll} className="h-8">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" className="h-8 gap-1.5" asChild>
                  <Link to="/parlays">
                    <ExternalLink className="h-3.5 w-3.5" />
                    View Parlays
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
