import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SEO } from '@/components/SEO';
import { 
  Sparkles, Loader2, Flame, CheckCircle2, AlertTriangle, 
  RefreshCw, Trophy, Layers, Star, TrendingUp, Shield
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

const GRADE_CONFIG = {
  'A+': { color: 'from-emerald-500 to-green-400', text: 'text-emerald-300', bg: 'bg-emerald-500/20', border: 'border-emerald-500/40' },
  'A':  { color: 'from-emerald-500 to-teal-400', text: 'text-emerald-300', bg: 'bg-emerald-500/20', border: 'border-emerald-500/40' },
  'B+': { color: 'from-blue-500 to-cyan-400', text: 'text-blue-300', bg: 'bg-blue-500/20', border: 'border-blue-500/40' },
  'B':  { color: 'from-blue-500 to-indigo-400', text: 'text-blue-300', bg: 'bg-blue-500/20', border: 'border-blue-500/40' },
  'C+': { color: 'from-amber-500 to-yellow-400', text: 'text-amber-300', bg: 'bg-amber-500/20', border: 'border-amber-500/40' },
  'C':  { color: 'from-amber-500 to-orange-400', text: 'text-amber-300', bg: 'bg-amber-500/20', border: 'border-amber-500/40' },
  'D':  { color: 'from-red-500 to-orange-400', text: 'text-red-300', bg: 'bg-red-500/20', border: 'border-red-500/40' },
  'F':  { color: 'from-red-600 to-red-400', text: 'text-red-300', bg: 'bg-red-500/20', border: 'border-red-500/40' },
};

function getGrade(confidence: number): string {
  if (confidence >= 80) return 'A+';
  if (confidence >= 73) return 'A';
  if (confidence >= 66) return 'B+';
  if (confidence >= 60) return 'B';
  if (confidence >= 55) return 'C+';
  if (confidence >= 50) return 'C';
  if (confidence >= 40) return 'D';
  return 'F';
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

const CARD_ACCENTS = [
  'from-violet-600/30 via-fuchsia-500/20 to-pink-500/10',
  'from-blue-600/30 via-cyan-500/20 to-teal-500/10',
  'from-orange-600/30 via-amber-500/20 to-yellow-500/10',
  'from-emerald-600/30 via-green-500/20 to-lime-500/10',
  'from-rose-600/30 via-pink-500/20 to-red-500/10',
];

const Parlays = () => {
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO 
        title="AI Game Parlays - Smart Multi-Leg Bets"
        description="AI-generated game parlays graded by confidence. Browse 2-leg and 3-leg parlay suggestions built from today's best matchups."
        keywords="parlay builder, AI parlays, sports betting parlays, game parlays, 2 leg parlay, 3 leg parlay"
        url="/parlays"
      />
      <Header />
      
      <main className="flex-1 container py-8">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
                  <Layers className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">AI Game Parlays</h1>
                  <p className="text-muted-foreground">AI-curated parlay combos from today's best games</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchSuggestions}
                disabled={isLoading}
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Content */}
          {!user ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Sign in to see AI Parlays</h3>
                <p className="text-muted-foreground">Log in to access AI-generated parlay suggestions</p>
              </CardContent>
            </Card>
          ) : isLoading ? (
            <Card>
              <CardContent className="py-16">
                <div className="flex flex-col items-center justify-center gap-4">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <div className="text-center">
                    <p className="font-semibold">Building parlays from today's games...</p>
                    <p className="text-sm text-muted-foreground mt-1">Analyzing matchups, odds & correlations</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : parlays.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No parlays available yet</h3>
                <p className="text-muted-foreground mb-4">Check back when more games are scheduled</p>
                <Button variant="outline" onClick={fetchSuggestions}>
                  Generate Suggestions
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {parlays.map((parlay, index) => {
                const style = getSignalStyle(parlay.signal);
                const grade = getGrade(parlay.confidence);
                const gradeConfig = GRADE_CONFIG[grade as keyof typeof GRADE_CONFIG] || GRADE_CONFIG['C'];
                const accent = CARD_ACCENTS[index % CARD_ACCENTS.length];
                const legCount = parlay.legs.length;

                return (
                  <Card key={index} className="overflow-hidden border-0 shadow-lg">
                    {/* Colorful gradient top bar */}
                    <div className={cn("h-1.5 bg-gradient-to-r", accent.replace(/\/\d+/g, ''))} />
                    
                    <div className={cn("bg-gradient-to-br", accent)}>
                      {/* Header */}
                      <div className="p-5 pb-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              <Badge className="bg-background/80 text-foreground border-0 font-bold text-sm px-3 py-1">
                                {legCount} Leg Parlay
                              </Badge>
                              <Badge className={cn("px-2 py-0.5 text-xs border", style.bg, style.text, style.border)}>
                                {style.label}
                              </Badge>
                            </div>
                            <h3 className="text-lg font-bold">{parlay.name}</h3>
                          </div>
                          
                          {/* Grade Circle */}
                          <div className={cn(
                            "h-16 w-16 rounded-2xl flex flex-col items-center justify-center border-2 shrink-0",
                            gradeConfig.bg, gradeConfig.border
                          )}>
                            <span className={cn("text-2xl font-black leading-none", gradeConfig.text)}>{grade}</span>
                            <span className="text-[10px] text-muted-foreground mt-0.5">Grade</span>
                          </div>
                        </div>

                        {/* Stats Row */}
                        <div className="flex items-center gap-4 mt-3">
                          <div className="flex items-center gap-1.5 text-sm">
                            <TrendingUp className="h-4 w-4 text-primary" />
                            <span className="text-muted-foreground">Confidence:</span>
                            <span className="font-bold">{parlay.confidence}%</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-sm">
                            <Star className="h-4 w-4 text-amber-400" />
                            <span className="text-muted-foreground">Est. Odds:</span>
                            <span className="font-bold font-mono">{parlay.estimatedOdds}</span>
                          </div>
                        </div>
                      </div>

                      {/* Legs */}
                      <div className="px-5 pb-4">
                        <div className="space-y-2">
                          {parlay.legs.map((leg, legIdx) => (
                            <div 
                              key={legIdx} 
                              className="flex items-start gap-3 p-3 rounded-xl bg-background/60 backdrop-blur-sm border border-border/50"
                            >
                              <div className={cn(
                                "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 font-bold text-sm",
                                "bg-gradient-to-br", 
                                accent.replace(/\/\d+/g, '/40')
                              )}>
                                {legIdx + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
                                    {leg.sport}
                                  </Badge>
                                  <span className="font-semibold text-sm truncate">{leg.pickDetail}</span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {leg.homeTeam && leg.awayTeam ? `${leg.homeTeam} vs ${leg.awayTeam}` : ''}
                                </p>
                                <p className="text-xs text-muted-foreground/80 mt-1 italic">
                                  {leg.reasoning}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Rationale Footer */}
                      <div className="mx-5 mb-5 p-3 rounded-xl bg-primary/10 border border-primary/20">
                        <div className="flex items-start gap-2">
                          <Trophy className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {parlay.rationale}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}

              {/* Disclaimer */}
              <div className="flex items-start gap-2 p-4 rounded-xl bg-muted/30 border border-border">
                <Shield className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  AI-generated suggestions for entertainment purposes. Always bet responsibly and never wager more than you can afford to lose. Past performance does not guarantee future results.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Parlays;
