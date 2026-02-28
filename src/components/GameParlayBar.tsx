import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X, Layers, Trash2, ChevronUp, ChevronDown, Sparkles, Loader2, Flame, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { PopularGame } from '@/hooks/usePopularGames';
import { TeamLogo } from '@/components/TeamLogo';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GameParlayBarProps {
  selectedGames: PopularGame[];
  onRemoveGame: (gameId: string) => void;
  onClearAll: () => void;
}

interface ParlayLeg {
  sport: string;
  homeTeam: string;
  awayTeam: string;
  pick: string;
  pickType: string;
  pickDetail: string;
  reasoning: string;
}

interface ParlayResult {
  name: string;
  signal: 'STRONG' | 'DECENT' | 'RISKY';
  confidence: number;
  legs: ParlayLeg[];
  rationale: string;
  estimatedOdds: string;
}

const getAbbreviation = (name: string) => {
  if (name.length <= 4) return name.toUpperCase();
  const words = name.split(' ');
  if (words.length >= 2) {
    return words.slice(0, 3).map(w => w[0]).join('').toUpperCase();
  }
  return name.slice(0, 3).toUpperCase();
};

function getSignalStyle(signal: string) {
  switch (signal) {
    case 'STRONG':
      return { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/40', label: '🔥 STRONG' };
    case 'DECENT':
      return { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/40', label: '✅ DECENT' };
    case 'RISKY':
      return { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/40', label: '⚠️ RISKY' };
    default:
      return { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/40', label: '❌ AVOID' };
  }
}

export function GameParlayBar({ selectedGames, onRemoveGame, onClearAll }: GameParlayBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [parlayResults, setParlayResults] = useState<ParlayResult[]>([]);

  const analyzeGames = async () => {
    if (selectedGames.length < 2) {
      toast.error('Select at least 2 games to build a parlay');
      return;
    }

    setIsAnalyzing(true);
    setShowResults(true);

    try {
      const games = selectedGames.map(g => ({
        homeTeam: g.homeTeam,
        awayTeam: g.awayTeam,
        sport: g.sport,
        league: g.league,
        startTime: g.startTime,
        odds: g.odds,
      }));

      const { data, error } = await supabase.functions.invoke('generate-parlays', {
        body: { games, forceRefresh: true }
      });

      if (error) {
        console.error('Error generating parlays:', error);
        toast.error('Failed to analyze parlay');
        setShowResults(false);
        return;
      }

      if (data?.parlays && data.parlays.length > 0) {
        setParlayResults(data.parlays);
      } else {
        toast.error('No parlay suggestions generated');
        setShowResults(false);
      }
    } catch (err) {
      console.error('Error:', err);
      toast.error('Failed to analyze parlay');
      setShowResults(false);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (selectedGames.length === 0) return null;

  return (
    <>
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
                  <Button 
                    size="sm" 
                    className="h-9 gap-1.5 px-4 font-semibold"
                    onClick={analyzeGames}
                    disabled={isAnalyzing || selectedGames.length < 2}
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5" />
                        Analyze Parlay
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Results Dialog */}
      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Parlay Analysis
            </DialogTitle>
          </DialogHeader>

          {isAnalyzing ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-sm text-muted-foreground">Analyzing your {selectedGames.length} selected games...</p>
            </div>
          ) : parlayResults.length > 0 ? (
            <div className="space-y-4">
              {parlayResults.map((parlay, idx) => {
                const style = getSignalStyle(parlay.signal);
                return (
                  <Card key={idx} className="border-border overflow-hidden">
                    <CardContent className="p-4 space-y-3">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-sm">{parlay.name}</h3>
                        <Badge className={cn("px-2 py-0.5 text-xs", style.bg, style.text, style.border)}>
                          {style.label}
                        </Badge>
                      </div>

                      {/* Confidence & Odds */}
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">Confidence: <span className="font-semibold text-foreground">{parlay.confidence}%</span></span>
                        <span className="text-muted-foreground">Odds: <span className="font-semibold text-foreground">{parlay.estimatedOdds}</span></span>
                      </div>

                      {/* Legs */}
                      <div className="space-y-2">
                        {parlay.legs.map((leg, legIdx) => (
                          <div key={legIdx} className="p-2.5 bg-muted/30 rounded-lg">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium">{leg.homeTeam} vs {leg.awayTeam}</span>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">{leg.sport}</Badge>
                            </div>
                            <p className="text-xs text-primary font-medium">{leg.pickDetail}</p>
                            <p className="text-xs text-muted-foreground mt-1">{leg.reasoning}</p>
                          </div>
                        ))}
                      </div>

                      {/* Rationale */}
                      <p className="text-xs text-muted-foreground border-t border-border pt-2">{parlay.rationale}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No results available.</p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
