import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  X, Trash2, Calculator, TrendingUp, TrendingDown, 
  DollarSign, Trophy, AlertCircle, User, Layers
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { Pick } from '@/hooks/usePicks';

interface ParlayBuilderProps {
  selectedPicks: Pick[];
  onRemovePick: (pickId: string) => void;
  onClearAll: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function ParlayBuilder({ 
  selectedPicks, 
  onRemovePick, 
  onClearAll,
  isOpen,
  onToggle
}: ParlayBuilderProps) {
  const [betAmount, setBetAmount] = useState<string>('10');

  // Convert confidence to decimal odds (higher confidence = lower odds)
  // Typical DFS multipliers: 1.8-2.2x per leg
  const calculateLegOdds = (confidence: number): number => {
    // Map confidence 50-100 to odds 2.5-1.5
    const odds = 2.5 - ((confidence - 50) / 50) * 1.0;
    return Math.round(odds * 100) / 100;
  };

  // Calculate combined parlay odds
  const calculateParlayOdds = (): number => {
    if (selectedPicks.length === 0) return 1;
    return selectedPicks.reduce((acc, pick) => {
      return acc * calculateLegOdds(pick.confidence);
    }, 1);
  };

  // Calculate potential payout
  const calculatePayout = (): number => {
    const amount = parseFloat(betAmount) || 0;
    return Math.round(amount * calculateParlayOdds() * 100) / 100;
  };

  // Calculate average confidence
  const averageConfidence = selectedPicks.length > 0
    ? Math.round(selectedPicks.reduce((acc, p) => acc + p.confidence, 0) / selectedPicks.length)
    : 0;

  // Calculate combined hit probability (multiplicative)
  const combinedHitRate = selectedPicks.length > 0
    ? selectedPicks.reduce((acc, p) => acc * ((p.hitRate || p.confidence) / 100), 1) * 100
    : 0;

  const parlayOdds = calculateParlayOdds();
  const potentialPayout = calculatePayout();

  // Floating button when closed
  if (!isOpen) {
    return (
      <Button
        onClick={onToggle}
        className="fixed bottom-6 right-6 z-50 h-14 px-5 rounded-full shadow-lg bg-primary hover:bg-primary/90 gap-2"
      >
        <Layers className="h-5 w-5" />
        <span>Parlay</span>
        {selectedPicks.length > 0 && (
          <Badge variant="secondary" className="ml-1 bg-white text-primary">
            {selectedPicks.length}
          </Badge>
        )}
      </Button>
    );
  }

  return (
    <div className="fixed bottom-0 right-0 z-50 w-full sm:w-96 sm:bottom-6 sm:right-6">
      <Card className="bg-card border-border shadow-2xl rounded-t-xl sm:rounded-xl overflow-hidden">
        <CardHeader className="pb-3 bg-primary/5 border-b border-border">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              Parlay Builder
            </CardTitle>
            <div className="flex items-center gap-2">
              {selectedPicks.length > 0 && (
                <Button variant="ghost" size="sm" onClick={onClearAll}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={onToggle}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          {selectedPicks.length === 0 ? (
            <div className="p-6 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
                <Trophy className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                Click picks to add them to your parlay
              </p>
            </div>
          ) : (
            <>
              {/* Selected Picks List */}
              <ScrollArea className="max-h-64">
                <div className="p-3 space-y-2">
                  {selectedPicks.map((pick) => (
                    <div 
                      key={pick.id}
                      className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg group"
                    >
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                        {pick.playerImage ? (
                          <img src={pick.playerImage} alt={pick.playerName} className="h-full w-full object-cover" />
                        ) : (
                          <User className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">{pick.playerName}</span>
                          <div className={`flex items-center gap-0.5 text-xs ${
                            pick.direction === 'MORE' ? 'text-emerald-400' : 'text-red-400'
                          }`}>
                            {pick.direction === 'MORE' ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingDown className="h-3 w-3" />
                            )}
                            {pick.direction}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {pick.propType} {pick.line} • {calculateLegOdds(pick.confidence)}x
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => onRemovePick(pick.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Stats Summary */}
              <div className="grid grid-cols-3 gap-2 p-3 border-t border-border">
                <div className="text-center">
                  <div className="text-lg font-bold text-primary">{selectedPicks.length}</div>
                  <div className="text-xs text-muted-foreground">Legs</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">{averageConfidence}%</div>
                  <div className="text-xs text-muted-foreground">Avg Conf</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-amber-400">{combinedHitRate.toFixed(1)}%</div>
                  <div className="text-xs text-muted-foreground">Win Prob</div>
                </div>
              </div>

              {/* Bet Calculator */}
              <div className="p-3 border-t border-border bg-muted/20">
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative flex-1">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      value={betAmount}
                      onChange={(e) => setBetAmount(e.target.value)}
                      className="pl-9 h-10"
                      placeholder="Bet amount"
                      min="1"
                    />
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <Calculator className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">{parlayOdds.toFixed(2)}x</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-emerald-400" />
                    <span className="text-sm font-medium">Potential Payout</span>
                  </div>
                  <span className="text-xl font-bold text-emerald-400">
                    ${potentialPayout.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Warning for large parlays */}
              {selectedPicks.length >= 5 && (
                <div className="p-3 border-t border-border">
                  <div className="flex items-start gap-2 text-xs text-amber-400">
                    <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span>
                      Large parlays have lower win probability. Consider splitting into smaller bets.
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
