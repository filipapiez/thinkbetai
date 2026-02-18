import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Layers, Trash2, ChevronUp, ChevronDown, ArrowRight } from 'lucide-react';
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
      <div className="max-w-2xl mx-auto pointer-events-auto">
        <Card className="bg-card/95 backdrop-blur-lg border-primary/30 shadow-2xl shadow-primary/10 overflow-hidden">
          {/* Expanded list */}
          {isExpanded && (
            <div className="border-b border-border">
              <div className="flex items-center justify-between px-4 pt-3 pb-2">
                <span className="text-sm font-semibold">Your Parlay Selections</span>
                <Button variant="ghost" size="sm" onClick={onClearAll} className="h-7 text-xs text-destructive hover:text-destructive">
                  <Trash2 className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              </div>
              <ScrollArea className="max-h-56">
                <div className="px-4 pb-3 space-y-2">
                  {selectedGames.map((game) => (
                    <div
                      key={game.id}
                      className="flex items-center gap-3 p-2.5 bg-muted/30 rounded-lg group hover:bg-muted/50 transition-colors"
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
                        className="h-7 w-7 shrink-0 opacity-60 hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
                        onClick={() => onRemoveGame(game.id)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Bottom bar */}
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              {/* Left: expand toggle */}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-2.5 flex-1 min-w-0 hover:opacity-80 transition-opacity"
              >
                <div className="relative h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                  <Layers className="h-5 w-5 text-primary" />
                  <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                    {selectedGames.length}
                  </div>
                </div>
                <div className="text-left min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {selectedGames.length} Game{selectedGames.length !== 1 ? 's' : ''} Selected
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {selectedGames.map(g => g.homeTeam).slice(0, 2).join(', ')}{selectedGames.length > 2 ? '...' : ''}
                  </p>
                </div>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
              </button>

              {/* Right: action buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClearAll}
                  className="h-9 w-9 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button size="sm" className="h-9 gap-1.5 px-4 font-semibold" asChild>
                  <Link to="/parlays">
                    Build Parlay
                    <ArrowRight className="h-3.5 w-3.5" />
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
