import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SEO } from '@/components/SEO';
import { ParlayDetailDialog } from '@/components/ParlayDetailDialog';
import { 
  Sparkles, Loader2, Flame, CheckCircle2, AlertTriangle, 
  RefreshCw, Layers, Star, TrendingUp, Shield, ChevronRight
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';

interface ParlayLeg {
  gameIndex: number;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  gameDate?: string;
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

const GRADE_STYLES: Record<string, { text: string; bg: string; border: string; glow: string }> = {
  'A+': { text: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', glow: 'shadow-emerald-500/20' },
  'A':  { text: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', glow: 'shadow-emerald-500/20' },
  'B+': { text: 'text-blue-400', bg: 'bg-blue-500/15', border: 'border-blue-500/30', glow: 'shadow-blue-500/20' },
  'B':  { text: 'text-blue-400', bg: 'bg-blue-500/15', border: 'border-blue-500/30', glow: 'shadow-blue-500/20' },
  'C+': { text: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/30', glow: 'shadow-amber-500/20' },
  'C':  { text: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/30', glow: 'shadow-amber-500/20' },
  'D':  { text: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/30', glow: 'shadow-red-500/20' },
  'F':  { text: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/30', glow: 'shadow-red-500/20' },
};

function getSignalStyle(signal: string) {
  switch (signal) {
    case 'STRONG': return { icon: Flame, label: '🔥 STRONG', color: 'text-orange-400', bg: 'bg-orange-500/15', border: 'border-orange-500/30' };
    case 'DECENT': return { icon: CheckCircle2, label: '✅ DECENT', color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30' };
    default: return { icon: AlertTriangle, label: '⚠️ RISKY', color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/30' };
  }
}

const ACCENT_BORDERS = [
  'border-l-violet-500',
  'border-l-blue-500',
  'border-l-orange-500',
  'border-l-emerald-500',
  'border-l-rose-500',
  'border-l-cyan-500',
  'border-l-fuchsia-500',
  'border-l-yellow-500',
];

const Parlays = () => {
  const { user } = useAuth();
  const [parlays, setParlays] = useState<SuggestedParlay[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [selectedParlay, setSelectedParlay] = useState<SuggestedParlay | null>(null);

  const fetchSuggestions = async (forceRefresh = false) => {
    if (!user) {
      toast.error('Please log in to see AI parlay suggestions');
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-parlays', {
        body: { forceRefresh },
      });
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
        keywords="parlay builder, AI parlays, sports betting parlays, game parlays"
        url="/parlays"
      />
      <Header />
      
      <main className="flex-1 container py-8">
        <div className="max-w-5xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
                  <Layers className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">AI Game Parlays</h1>
                  <p className="text-muted-foreground text-sm">AI-curated parlay combos • tap any card for full breakdown</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => fetchSuggestions(true)} disabled={isLoading}>
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
                <Button variant="outline" onClick={() => fetchSuggestions(true)}>Generate Suggestions</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {/* Grid of parlay cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {parlays.map((parlay, index) => {
                  const grade = getGrade(parlay.confidence);
                  const gs = GRADE_STYLES[grade] || GRADE_STYLES['C'];
                  const signal = getSignalStyle(parlay.signal);
                  const accentBorder = ACCENT_BORDERS[index % ACCENT_BORDERS.length];

                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.06 }}
                    >
                      <button
                        onClick={() => setSelectedParlay(parlay)}
                        className={cn(
                          "w-full text-left rounded-xl border border-border/60 bg-card p-0 overflow-hidden",
                          "hover:border-primary/40 hover:shadow-lg transition-all duration-200 group",
                          "border-l-4", accentBorder
                        )}
                      >
                        <div className="p-4">
                          {/* Top row: badges + grade */}
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Badge variant="secondary" className="text-[10px] px-2 py-0.5 font-bold">
                                {parlay.legs.length} LEG
                              </Badge>
                              <Badge className={cn("text-[10px] px-2 py-0.5 border", signal.bg, signal.color, signal.border)}>
                                {signal.label}
                              </Badge>
                            </div>
                            <div className={cn(
                              "h-11 w-11 rounded-xl flex items-center justify-center border font-black text-lg shrink-0 shadow-md",
                              gs.bg, gs.border, gs.text, gs.glow
                            )}>
                              {grade}
                            </div>
                          </div>

                          {/* Name */}
                          <h3 className="font-bold text-sm mb-3 line-clamp-1 group-hover:text-primary transition-colors">
                            {parlay.name}
                          </h3>

                          {/* Compact legs preview */}
                          <div className="space-y-2 mb-3">
                            {parlay.legs.map((leg, li) => (
                              <div key={li} className="flex items-center gap-2 text-xs">
                                <span className="h-5 w-5 rounded-md bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0">
                                  {li + 1}
                                </span>
                                <div className="flex flex-col flex-1 min-w-0">
                                  <span className="text-foreground font-medium truncate">{leg.awayTeam} vs {leg.homeTeam}</span>
                                  <span className="text-muted-foreground truncate">{leg.pickDetail}</span>
                                </div>
                                <div className="flex flex-col items-end gap-0.5 shrink-0">
                                  <Badge variant="outline" className="text-[9px] px-1 py-0">{leg.sport}</Badge>
                                  {leg.gameDate && <span className="text-[9px] text-muted-foreground">{leg.gameDate}</span>}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Bottom stats */}
                          <div className="flex items-center justify-between pt-2 border-t border-border/40">
                            <div className="flex items-center gap-3">
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <TrendingUp className="h-3 w-3" />
                                {parlay.confidence}%
                              </span>
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Star className="h-3 w-3 text-amber-400" />
                                <span className="font-mono font-bold">{parlay.estimatedOdds}</span>
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground flex items-center gap-0.5 group-hover:text-primary transition-colors">
                              Details <ChevronRight className="h-3 w-3" />
                            </span>
                          </div>
                        </div>
                      </button>
                    </motion.div>
                  );
                })}
              </div>

              {/* Disclaimer */}
              <div className="flex items-start gap-2 p-4 rounded-xl bg-muted/30 border border-border">
                <Shield className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  AI-generated suggestions for entertainment purposes. Always bet responsibly and never wager more than you can afford to lose.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      <ParlayDetailDialog
        parlay={selectedParlay}
        open={!!selectedParlay}
        onOpenChange={(open) => !open && setSelectedParlay(null)}
      />
      
      <Footer />
    </div>
  );
};

export default Parlays;
