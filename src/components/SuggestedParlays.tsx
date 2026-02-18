import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, Loader2, Flame, CheckCircle2, AlertTriangle, 
  Plus, RefreshCw, ChevronRight, Trophy
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface ParlayLeg {
  gameIndex: number;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  pick: 'home' | 'away';
  pickType: string;
  pickDetail: string;
  reasoning: string;
}

interface SuggestedParlay {
  name: string;
  signal: 'STRONG' | 'DECENT' | 'RISKY';
  confidence: number;
  legs: ParlayLeg[];
  rationale: string;
  estimatedOdds: string;
}

function getSignalStyle(signal: string) {
  switch (signal) {
    case 'STRONG':
      return { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/40', icon: Flame, label: '🔥 STRONG' };
    case 'DECENT':
      return { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/40', icon: CheckCircle2, label: '✅ DECENT' };
    default:
      return { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/40', icon: AlertTriangle, label: '⚠️ RISKY' };
  }
}

export function SuggestedParlays() {
  const { user } = useAuth();
  const [parlays, setParlays] = useState<SuggestedParlay[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const fetchSuggestions = async () => {
    if (!user) {
      toast.error('Please log in to see AI parlay suggestions');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-parlays');

      if (error) {
        console.error('Error fetching parlay suggestions:', error);
        toast.error('Failed to load suggestions');
        return;
      }

      if (data?.success && data?.parlays) {
        setParlays(data.parlays);
      } else if (data?.message) {
        toast.info(data.message);
      }
    } catch (err) {
      console.error('Error:', err);
      toast.error('Failed to load suggestions');
    } finally {
      setIsLoading(false);
      setHasLoaded(true);
    }
  };

  useEffect(() => {
    if (user && !hasLoaded) {
      fetchSuggestions();
    }
  }, [user]);

  if (!user) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Suggested Parlays
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchSuggestions}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          AI-generated parlay combinations from today's games
        </p>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Analyzing games & building parlays...</p>
          </div>
        ) : parlays.length === 0 ? (
          <div className="text-center py-8">
            <Sparkles className="h-8 w-8 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground mb-3">No suggestions available yet</p>
            <Button variant="outline" size="sm" onClick={fetchSuggestions}>
              Generate Suggestions
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {parlays.map((parlay, index) => {
              const style = getSignalStyle(parlay.signal);
              return (
                <div
                  key={index}
                  className="p-4 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors space-y-3"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={cn("px-2 py-0.5 text-xs", style.bg, style.text, style.border)}>
                        {style.label}
                      </Badge>
                      <span className="font-semibold text-sm">{parlay.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{parlay.confidence}%</span>
                      <Badge variant="outline" className="text-xs">{parlay.estimatedOdds}</Badge>
                    </div>
                  </div>

                  {/* Legs */}
                  <div className="space-y-2">
                    {parlay.legs.map((leg, legIdx) => (
                      <div key={legIdx} className="flex items-center gap-3 text-sm">
                        <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-primary">{legIdx + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              {leg.sport}
                            </Badge>
                            <span className="font-medium truncate">{leg.pickDetail}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {leg.homeTeam && leg.awayTeam ? `${leg.homeTeam} vs ${leg.awayTeam} · ` : ''}{leg.reasoning}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Rationale */}
                  <div className="p-2.5 rounded bg-primary/5 border border-primary/10">
                    <p className="text-xs text-muted-foreground">
                      <Trophy className="h-3 w-3 inline mr-1 text-primary" />
                      {parlay.rationale}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
