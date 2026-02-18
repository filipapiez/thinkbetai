import { useState, useMemo, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { SEO } from '@/components/SEO';
import { 
  X, Trash2, Calculator, TrendingUp, TrendingDown, 
  DollarSign, Trophy, AlertCircle, User, Layers,
  Sparkles, Loader2, CheckCircle2, AlertTriangle, XCircle, Flame,
  Plus, RefreshCw, Target, Activity, Zap, Calendar, Clock, Minus, Shield
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useUserParlays } from '@/hooks/useUserParlays';
import { usePicks } from '@/hooks/usePicks';
import { Link, useLocation } from 'react-router-dom';
import type { Pick } from '@/hooks/usePicks';
import type { PopularGame } from '@/hooks/usePopularGames';
import { calculateLiveBetQualification } from '@/lib/liveTypes';
import type { LiveGame } from '@/lib/liveTypes';

interface ParlayAnalysis {
  signal: 'STRONG' | 'DECENT' | 'RISKY' | 'AVOID';
  overallConfidence: number;
  verdict: string;
  strengths: string[];
  risks: string[];
  correlations: string;
  suggestion: string;
  alternativeIdea?: string;
}

function getSignalStyle(signal: string) {
  switch (signal) {
    case 'STRONG':
      return { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/40', icon: Flame, label: '🔥 STRONG' };
    case 'DECENT':
      return { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/40', icon: CheckCircle2, label: '✅ DECENT' };
    case 'RISKY':
      return { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/40', icon: AlertTriangle, label: '⚠️ RISKY' };
    default:
      return { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/40', icon: XCircle, label: '❌ AVOID' };
  }
}

const Parlays = () => {
  const location = useLocation();
  const { parlayPicks, isLoading, isSaving, selectPick, removePick, clearParlay } = useUserParlays();
  const { picks: availablePicks, isLoading: picksLoading } = usePicks();
  
  const [betAmount, setBetAmount] = useState<string>('10');
  const [analysis, setAnalysis] = useState<ParlayAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [gameParlayLegs, setGameParlayLegs] = useState<PopularGame[]>([]);

  // Receive games from Games page navigation
  useEffect(() => {
    const state = location.state as { parlayGames?: PopularGame[] } | null;
    if (state?.parlayGames && state.parlayGames.length > 0) {
      setGameParlayLegs(state.parlayGames);
      // Clear the state so it doesn't persist on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const calculateLegOdds = (confidence: number): number => {
    const odds = 2.5 - ((confidence - 50) / 50) * 1.0;
    return Math.round(odds * 100) / 100;
  };

  const calculateParlayOdds = (): number => {
    if (parlayPicks.length === 0) return 1;
    return parlayPicks.reduce((acc, pick) => {
      return acc * calculateLegOdds(pick.confidence);
    }, 1);
  };

  const calculatePayout = (): number => {
    const amount = parseFloat(betAmount) || 0;
    return Math.round(amount * calculateParlayOdds() * 100) / 100;
  };

  const averageConfidence = parlayPicks.length > 0
    ? Math.round(parlayPicks.reduce((acc, p) => acc + p.confidence, 0) / parlayPicks.length)
    : 0;

  const combinedHitRate = parlayPicks.length > 0
    ? parlayPicks.reduce((acc, p) => acc * ((p.hitRate || p.confidence) / 100), 1) * 100
    : 0;

  const parlayOdds = calculateParlayOdds();
  const potentialPayout = calculatePayout();

  const totalLegs = parlayPicks.length + gameParlayLegs.length;

  // Calculate combined win probability including game legs
  const combinedParlayProbability = useMemo(() => {
    let prob = 1;
    // Player prop probabilities
    parlayPicks.forEach(p => {
      prob *= (p.hitRate || p.confidence) / 100;
    });
    // Game leg probabilities based on qualification analysis
    gameParlayLegs.forEach(game => {
      const liveGame: LiveGame = {
        id: game.id, sport: game.sport,
        sportKey: game.sport.toLowerCase().replace(/\s+/g, '-'),
        homeTeam: { id: '', name: game.homeTeam, abbreviation: '' },
        awayTeam: { id: '', name: game.awayTeam, abbreviation: '' },
        startTime: game.startTime, venue: '',
        status: game.status === 'live' ? 'live' : 'scheduled',
        odds: game.odds ? {
          moneyline: game.odds.moneyline || { home: 0, away: 0 },
          spread: game.odds.spread || { home: 0, homeOdds: -110, away: 0, awayOdds: -110 },
          total: game.odds.total || { over: 0, overOdds: -110, under: 0, underOdds: -110 },
        } : undefined,
        hasOdds: Boolean(game.hasOdds && game.odds),
        popularityScore: game.popularityScore,
      };
      const qual = calculateLiveBetQualification(liveGame);
      prob *= qual.confidenceScore / 100;
    });
    return prob * 100;
  }, [parlayPicks, gameParlayLegs]);

  const analyzeParlay = async () => {
    if (totalLegs < 2) {
      toast.error('Add at least 2 legs to analyze');
      return;
    }

    setIsAnalyzing(true);

    try {
      // Combine player props and game legs into a unified picks array
      const playerPicksData = parlayPicks.map(p => ({
        playerName: p.playerName,
        team: p.team,
        propType: p.propType,
        line: p.line,
        direction: p.direction,
        confidence: p.confidence,
        sport: p.sport,
        opponent: p.opponent
      }));

      const gamePicksData = gameParlayLegs.map(game => {
        const liveGame: LiveGame = {
          id: game.id, sport: game.sport,
          sportKey: game.sport.toLowerCase().replace(/\s+/g, '-'),
          homeTeam: { id: '', name: game.homeTeam, abbreviation: '' },
          awayTeam: { id: '', name: game.awayTeam, abbreviation: '' },
          startTime: game.startTime, venue: '',
          status: game.status === 'live' ? 'live' : 'scheduled',
          odds: game.odds ? {
            moneyline: game.odds.moneyline || { home: 0, away: 0 },
            spread: game.odds.spread || { home: 0, homeOdds: -110, away: 0, awayOdds: -110 },
            total: game.odds.total || { over: 0, overOdds: -110, under: 0, underOdds: -110 },
          } : undefined,
          hasOdds: Boolean(game.hasOdds && game.odds),
          popularityScore: game.popularityScore,
        };
        const qual = calculateLiveBetQualification(liveGame);
        const pick = qual.pick === 'home' ? game.homeTeam : game.awayTeam;
        return {
          playerName: `${game.homeTeam} vs ${game.awayTeam}`,
          team: pick,
          propType: 'Moneyline',
          line: game.odds?.moneyline?.[qual.pick || 'home'] || 0,
          direction: 'MORE' as const,
          confidence: qual.confidenceScore,
          sport: game.sport,
          opponent: qual.pick === 'home' ? game.awayTeam : game.homeTeam
        };
      });

      const picksData = [...playerPicksData, ...gamePicksData];

      const { data, error } = await supabase.functions.invoke('analyze-parlay', {
        body: { picks: picksData }
      });
      if (error) {
        console.error('Error analyzing parlay:', error);
        toast.error('Failed to analyze parlay');
        return;
      }

      if (data?.success && data?.analysis) {
        setAnalysis(data.analysis);
      } else if (data?.error) {
        toast.error(data.error);
      }
    } catch (err) {
      console.error('Error:', err);
      toast.error('Failed to analyze parlay');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRemovePick = (pickId: string) => {
    setAnalysis(null);
    removePick(pickId);
  };

  const handleClearAll = () => {
    setAnalysis(null);
    clearParlay();
    setGameParlayLegs([]);
  };

  const signalStyle = analysis ? getSignalStyle(analysis.signal) : null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO 
        title="My Parlays - Build & Analyze Your Bets"
        description="Build and analyze your parlay bets with AI-powered insights. Track your selections and calculate potential payouts."
        keywords="parlay builder, sports betting parlays, AI parlay analysis, bet calculator"
        url="/parlays"
      />
      <Header />
      
      <main className="flex-1 container py-8">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Layers className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">My Parlays</h1>
                <p className="text-muted-foreground">Build and analyze your parlay bets</p>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Parlay Builder */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-primary" />
                      Current Parlay
                      {isSaving && (
                        <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                    </CardTitle>
                    {(parlayPicks.length > 0 || gameParlayLegs.length > 0) && (
                      <Button variant="ghost" size="sm" onClick={handleClearAll}>
                        <Trash2 className="h-4 w-4 mr-1" />
                        Clear All
                      </Button>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent>
                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : parlayPicks.length === 0 && gameParlayLegs.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                        <Layers className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">No picks yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Add picks from the AI Picks page or select games to start building your parlay
                      </p>
                      <div className="flex items-center justify-center gap-3">
                        <Button asChild>
                          <Link to="/picks">
                            <Plus className="h-4 w-4 mr-2" />
                            Browse Picks
                          </Link>
                        </Button>
                        <Button asChild variant="outline">
                          <Link to="/games">
                            <Plus className="h-4 w-4 mr-2" />
                            Browse Games
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                       {/* Game-based parlay legs from Games page */}
                      {gameParlayLegs.map((game) => {
                        const abbrev = (name: string) => {
                          if (!name) return 'TBD';
                          if (name.length <= 4) return name.toUpperCase();
                          const words = name.split(' ').filter(Boolean);
                          if (words.length >= 2) return words.slice(0, 3).map(w => w[0]).join('').toUpperCase();
                          return name.slice(0, 3).toUpperCase();
                        };
                        const liveGame: LiveGame = {
                          id: game.id,
                          sport: game.sport,
                          sportKey: game.sport.toLowerCase().replace(/\s+/g, '-'),
                          homeTeam: { id: game.homeTeam.toLowerCase().replace(/\s+/g, '-'), name: game.homeTeam, abbreviation: abbrev(game.homeTeam) },
                          awayTeam: { id: game.awayTeam.toLowerCase().replace(/\s+/g, '-'), name: game.awayTeam, abbreviation: abbrev(game.awayTeam) },
                          startTime: game.startTime,
                          venue: '',
                          status: game.status === 'live' ? 'live' : game.status === 'completed' ? 'final' : 'scheduled',
                          odds: game.odds ? {
                            moneyline: game.odds.moneyline || { home: 0, away: 0 },
                            spread: game.odds.spread || { home: 0, homeOdds: -110, away: 0, awayOdds: -110 },
                            total: game.odds.total || { over: 0, overOdds: -110, under: 0, underOdds: -110 },
                          } : undefined,
                          hasOdds: Boolean(game.hasOdds && game.odds),
                          popularityScore: game.popularityScore,
                        };
                        const qual = calculateLiveBetQualification(liveGame);
                        const signalVariants = {
                          'GOOD': { bg: 'bg-emerald-500/20 border-emerald-500/40', text: 'text-emerald-400', icon: TrendingUp },
                          'BORDERLINE': { bg: 'bg-amber-500/20 border-amber-500/40', text: 'text-amber-400', icon: Minus },
                          'PASS': { bg: 'bg-red-500/20 border-red-500/40', text: 'text-red-400', icon: TrendingDown },
                        };
                        const sv = signalVariants[qual.signal];
                        const SignalIcon = sv.icon;
                        const gameDate = new Date(game.startTime);
                        const dateStr = gameDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                        const timeStr = gameDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

                        return (
                          <div key={game.id} className="rounded-xl border border-border bg-card overflow-hidden">
                            {/* Game Header */}
                            <div className="p-4 border-b border-border">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <Badge variant="info">{game.sport}</Badge>
                                  {game.league && <Badge variant="outline" className="text-xs">{game.league}</Badge>}
                                  <Badge variant="outline" className={cn("text-xs", sv.bg, sv.text)}>
                                    <SignalIcon className="h-3 w-3 mr-1" />
                                    {qual.signal} · {qual.confidenceScore}%
                                  </Badge>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => setGameParlayLegs(prev => prev.filter(g => g.id !== game.id))}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>

                              {/* Teams */}
                              <div className="flex items-center justify-center gap-6">
                                <div className="text-center">
                                  <div className={cn(
                                    "w-14 h-14 mx-auto mb-2 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-lg font-bold",
                                    qual.pick === 'home' && qual.signal === 'GOOD' && "ring-2 ring-emerald-500"
                                  )}>
                                    {abbrev(game.homeTeam)}
                                  </div>
                                  <p className="font-semibold text-sm">{game.homeTeam}</p>
                                  <p className="text-xs text-muted-foreground">Home</p>
                                </div>
                                <div className="text-xl font-bold text-muted-foreground">vs</div>
                                <div className="text-center">
                                  <div className={cn(
                                    "w-14 h-14 mx-auto mb-2 rounded-xl bg-gradient-to-br from-secondary to-muted flex items-center justify-center text-lg font-bold",
                                    qual.pick === 'away' && qual.signal === 'GOOD' && "ring-2 ring-emerald-500"
                                  )}>
                                    {abbrev(game.awayTeam)}
                                  </div>
                                  <p className="font-semibold text-sm">{game.awayTeam}</p>
                                  <p className="text-xs text-muted-foreground">Away</p>
                                </div>
                              </div>

                              {/* Date/Time */}
                              <div className="flex items-center justify-center gap-4 mt-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{dateStr}</span>
                                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{timeStr}</span>
                              </div>
                            </div>

                            {/* Odds Section */}
                            {game.odds && game.hasOdds && (
                              <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
                                {/* Moneyline */}
                                <div className="p-3 text-center">
                                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 flex items-center justify-center gap-1">
                                    <Target className="h-3 w-3" /> ML
                                  </div>
                                  {game.odds.moneyline ? (
                                    <div className="flex justify-between px-2">
                                      <div>
                                        <div className="text-xs text-muted-foreground">{abbrev(game.homeTeam)}</div>
                                        <div className={cn("font-bold font-mono text-sm", game.odds.moneyline.home < 0 ? "text-emerald-400" : "")}>
                                          {game.odds.moneyline.home > 0 ? '+' : ''}{game.odds.moneyline.home || 'N/A'}
                                        </div>
                                      </div>
                                      <div>
                                        <div className="text-xs text-muted-foreground">{abbrev(game.awayTeam)}</div>
                                        <div className={cn("font-bold font-mono text-sm", game.odds.moneyline.away < 0 ? "text-emerald-400" : "")}>
                                          {game.odds.moneyline.away > 0 ? '+' : ''}{game.odds.moneyline.away || 'N/A'}
                                        </div>
                                      </div>
                                    </div>
                                  ) : <div className="text-xs text-muted-foreground">N/A</div>}
                                </div>
                                {/* Spread */}
                                <div className="p-3 text-center">
                                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 flex items-center justify-center gap-1">
                                    <Activity className="h-3 w-3" /> Spread
                                  </div>
                                  {game.odds.spread ? (
                                    <>
                                      <div className="font-bold font-mono text-sm">
                                        {game.odds.spread.home > 0 ? '+' : ''}{game.odds.spread.home || 'N/A'}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        ({game.odds.spread.homeOdds > 0 ? '+' : ''}{game.odds.spread.homeOdds})
                                      </div>
                                    </>
                                  ) : <div className="text-xs text-muted-foreground">N/A</div>}
                                </div>
                                {/* Total */}
                                <div className="p-3 text-center">
                                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 flex items-center justify-center gap-1">
                                    <Zap className="h-3 w-3" /> O/U
                                  </div>
                                  {game.odds.total ? (
                                    <>
                                      <div className="font-bold font-mono text-sm">
                                        {game.odds.total.over || 'N/A'}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        ({game.odds.total.overOdds > 0 ? '+' : ''}{game.odds.total.overOdds})
                                      </div>
                                    </>
                                  ) : <div className="text-xs text-muted-foreground">N/A</div>}
                                </div>
                              </div>
                            )}

                            {/* Analysis Footer */}
                            <div className="p-3 bg-muted/20">
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-3">
                                  <span className="flex items-center gap-1">
                                    <Shield className="h-3 w-3 text-muted-foreground" />
                                    Risk: <span className={cn(
                                      qual.riskScore <= 40 ? "text-emerald-400" : qual.riskScore <= 55 ? "text-amber-400" : "text-red-400"
                                    )}>{qual.volatility}</span>
                                  </span>
                                  <span className="text-muted-foreground">{qual.reason}</span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 text-xs px-2"
                                  asChild
                                >
                                  <Link to={`/game/${game.id}`} state={{ game }}>
                                    Full Analysis →
                                  </Link>
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* Player prop picks */}
                      {parlayPicks.map((pick) => (
                        <div 
                          key={pick.id}
                          className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg group hover:bg-muted/50 transition-colors"
                        >
                          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                            {pick.playerImage ? (
                              <img src={pick.playerImage} alt={pick.playerName} className="h-full w-full object-cover" />
                            ) : (
                              <User className="h-6 w-6 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold">{pick.playerName}</span>
                              <Badge variant="outline" className="text-xs">{pick.sport}</Badge>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span>{pick.team} vs {pick.opponent}</span>
                              <span>•</span>
                              <div className={`flex items-center gap-1 ${
                                pick.direction === 'MORE' ? 'text-emerald-400' : 'text-red-400'
                              }`}>
                                {pick.direction === 'MORE' ? (
                                  <TrendingUp className="h-4 w-4" />
                                ) : (
                                  <TrendingDown className="h-4 w-4" />
                                )}
                                {pick.direction} {pick.line} {pick.propType}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">{calculateLegOdds(pick.confidence)}x</div>
                            <div className="text-sm text-muted-foreground">{pick.confidence}% conf</div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleRemovePick(pick.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* AI Analysis */}
              {totalLegs >= 2 && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        AI Analysis
                      </CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={analyzeParlay}
                        disabled={isAnalyzing}
                      >
                        {isAnalyzing ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            {analysis ? 'Re-analyze' : 'Analyze Parlay'}
                          </>
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    {analysis && signalStyle ? (
                      <div className="space-y-4">
                        {/* Signal Badge */}
                        <div className="flex items-center justify-between">
                          <Badge className={cn("px-4 py-2 text-base", signalStyle.bg, signalStyle.text, signalStyle.border)}>
                            {signalStyle.label}
                          </Badge>
                          <span className="text-lg font-semibold">{analysis.overallConfidence}% Confidence</span>
                        </div>

                        {/* Verdict */}
                        <p className="text-lg">{analysis.verdict}</p>

                        {/* Strengths & Risks */}
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <h4 className="font-semibold text-emerald-400 flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4" />
                              Strengths
                            </h4>
                            <ul className="space-y-1">
                              {analysis.strengths.map((s, i) => (
                                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                  <span className="text-emerald-400 mt-1">•</span>
                                  {s}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="space-y-2">
                            <h4 className="font-semibold text-amber-400 flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4" />
                              Risks
                            </h4>
                            <ul className="space-y-1">
                              {analysis.risks.map((r, i) => (
                                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                  <span className="text-amber-400 mt-1">•</span>
                                  {r}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Suggestion */}
                        <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                          <h4 className="font-semibold mb-2">💡 Suggestion</h4>
                          <p className="text-sm">{analysis.suggestion}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Sparkles className="h-8 w-8 mx-auto mb-3 opacity-50" />
                        <p>Click "Analyze Parlay" to get AI insights on your selections</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar - Stats & Calculator */}
            <div className="space-y-6">
              {/* Stats Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Parlay Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                      <div className="text-2xl font-bold text-primary">{totalLegs}</div>
                      <div className="text-xs text-muted-foreground">Total Legs</div>
                    </div>
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                      <div className="text-2xl font-bold">{averageConfidence}%</div>
                      <div className="text-xs text-muted-foreground">Avg Confidence</div>
                    </div>
                  </div>
                   <div className="text-center p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                    <div className="text-2xl font-bold text-amber-400">{combinedParlayProbability.toFixed(1)}%</div>
                    <div className="text-xs text-muted-foreground">Win Probability</div>
                  </div>
                  <div className="text-center p-3 bg-primary/10 rounded-lg border border-primary/20">
                    <div className="text-2xl font-bold text-primary">{parlayOdds.toFixed(2)}x</div>
                    <div className="text-xs text-muted-foreground">Combined Odds</div>
                  </div>
                </CardContent>
              </Card>

              {/* Payout Calculator */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    Payout Calculator
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      value={betAmount}
                      onChange={(e) => setBetAmount(e.target.value)}
                      className="pl-9"
                      placeholder="Bet amount"
                      min="1"
                    />
                  </div>
                  
                  <div className="p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Potential Payout</span>
                      <Trophy className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div className="text-3xl font-bold text-emerald-400">
                      ${potentialPayout.toFixed(2)}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Warning for large parlays */}
              {parlayPicks.length >= 5 && (
                <Card className="border-amber-500/30 bg-amber-500/5">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-amber-400 mb-1">Large Parlay Warning</h4>
                        <p className="text-sm text-muted-foreground">
                          Parlays with 5+ legs have significantly lower win probability. Consider splitting into smaller bets.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quick Add Link */}
              <Button asChild className="w-full" variant="outline">
                <Link to="/picks">
                  <Plus className="h-4 w-4 mr-2" />
                  Add More Picks
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Parlays;
