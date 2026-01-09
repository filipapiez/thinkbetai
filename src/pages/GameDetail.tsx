import { useParams, Link, useLocation } from 'react-router-dom';
import { useMemo, useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { LiveDataBanner } from '@/components/LiveDataBanner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2,
  Info,
  AlertTriangle,
  Shield,
  Activity,
  Target,
  Zap,
} from 'lucide-react';
import { LiveGame, calculateLiveBetQualification, LiveBetQualification } from '@/lib/liveTypes';
import { useLiveGames } from '@/hooks/useLiveGames';

import { cn } from '@/lib/utils';
import { fetchGameData, ScrapedGameData } from '@/lib/api/gameData';
import { ScrapedInjuryCard } from '@/components/ScrapedInjuryCard';
import { ScrapedFormCard } from '@/components/ScrapedFormCard';
import { AIAnalysisCard } from '@/components/AIAnalysisCard';
import { PerformanceChartLive } from '@/components/PerformanceChartLive';
import { QualifiedBetAccuracyChart } from '@/components/QualifiedBetAccuracyChart';
import { FullAIReport } from '@/components/FullAIReport';
import type { PopularGame } from '@/hooks/usePopularGames';

function popularGameToLiveGame(pg: PopularGame): LiveGame {
  const abbrev = (name: string) => {
    if (!name) return 'TBD';
    if (name.length <= 4) return name.toUpperCase();
    const words = name.split(' ').filter(Boolean);
    if (words.length >= 2) return words.slice(0, 3).map(w => w[0]).join('').toUpperCase();
    return name.slice(0, 3).toUpperCase();
  };

  return {
    id: pg.id,
    sport: pg.sport,
    sportKey: pg.sport.toLowerCase().replace(/\s+/g, '-'),
    homeTeam: {
      id: pg.homeTeam.toLowerCase().replace(/\s+/g, '-'),
      name: pg.homeTeam,
      abbreviation: abbrev(pg.homeTeam),
      stats: undefined,
    },
    awayTeam: {
      id: pg.awayTeam.toLowerCase().replace(/\s+/g, '-'),
      name: pg.awayTeam,
      abbreviation: abbrev(pg.awayTeam),
      stats: undefined,
    },
    startTime: pg.startTime,
    venue: `${pg.homeTeam} Arena`,
    status: pg.status === 'live' ? 'live' : pg.status === 'completed' ? 'final' : 'scheduled',
    odds: pg.odds
      ? {
          moneyline: pg.odds.moneyline || { home: 0, away: 0 },
          spread: pg.odds.spread || { home: 0, homeOdds: -110, away: 0, awayOdds: -110 },
          total: pg.odds.total || { over: 0, overOdds: -110, under: 0, underOdds: -110 },
        }
      : undefined,
    hasOdds: Boolean(pg.hasOdds && pg.odds),
    popularityScore: pg.popularityScore, // Pass popularity for signal fallback
  };
}

// Risk assessment based on odds analysis
interface RiskAnalysis {
  level: 'Low' | 'Medium' | 'High';
  score: number;
  factors: string[];
}

function analyzeRisk(game: LiveGame): RiskAnalysis {
  // Scraped games may not have odds - use popularity-based assessment
  if (!game.odds) {
    const popularity = game.popularityScore || 50;
    if (popularity >= 85) {
      return {
        level: 'Low',
        score: 35,
        factors: ['High-profile matchup with strong betting interest', 'Major market game with reliable trends'],
      };
    } else if (popularity >= 70) {
      return {
        level: 'Medium',
        score: 50,
        factors: ['Moderate betting interest', 'Standard matchup volatility'],
      };
    }
    return {
      level: 'Medium',
      score: 55,
      factors: ['Lower profile matchup', 'Consider waiting for more data'],
    };
  }

  const factors: string[] = [];
  let score = 30;

  const homeML = game.odds.moneyline.home;
  const awayML = game.odds.moneyline.away;
  const spread = Math.abs(game.odds.spread.home);

  // Heavy favorite risk
  if (homeML < -250 || awayML < -250) {
    score += 20;
    factors.push('Heavy favorite - low payout potential');
  }

  // Close spread = unpredictable
  if (spread > 0 && spread <= 2.5) {
    score += 15;
    factors.push('Very close spread - coin flip territory');
  }

  // Live game volatility
  if (game.status === 'live') {
    score += 25;
    factors.push('Live betting - high volatility');
  }

  // No meaningful odds
  if (!game.hasOdds || (homeML === 0 && awayML === 0)) {
    score += 20;
    factors.push('Limited odds data available');
  }

  // Large spread = blowout potential
  if (spread >= 10) {
    score += 10;
    factors.push('Large spread - blowout risk');
  }

  if (factors.length === 0) {
    factors.push('Standard risk profile');
  }

  score = Math.min(100, Math.max(0, score));
  const level = score <= 40 ? 'Low' : score <= 65 ? 'Medium' : 'High';

  return { level, score, factors };
}

// Value analysis based on implied probabilities
interface ValueAnalysis {
  homeValue: number;
  awayValue: number;
  recommendation: string;
  confidence: number;
  isPopularityBased?: boolean;
}

function analyzeValue(game: LiveGame): ValueAnalysis {
  // Use popularity-based value when odds aren't available
  if (!game.odds) {
    const popularity = game.popularityScore || 50;
    if (popularity >= 85) {
      return {
        homeValue: 55,
        awayValue: 45,
        recommendation: 'High-profile matchup - home team slight favorite based on market interest',
        confidence: 60,
        isPopularityBased: true,
      };
    } else if (popularity >= 70) {
      return {
        homeValue: 50,
        awayValue: 50,
        recommendation: 'Evenly matched based on betting interest - look for situational edges',
        confidence: 50,
        isPopularityBased: true,
      };
    }
    return {
      homeValue: 50,
      awayValue: 50,
      recommendation: 'Limited market data - wait for odds or use caution',
      confidence: 40,
      isPopularityBased: true,
    };
  }

  const homeML = game.odds.moneyline.home;
  const awayML = game.odds.moneyline.away;

  if (homeML === 0 || awayML === 0) {
    const popularity = game.popularityScore || 50;
    return {
      homeValue: popularity >= 70 ? 52 : 50,
      awayValue: popularity >= 70 ? 48 : 50,
      recommendation: popularity >= 70 ? 'Partial odds data - lean home based on interest' : 'Awaiting full odds data',
      confidence: popularity >= 70 ? 45 : 35,
      isPopularityBased: true,
    };
  }

  // Convert to implied probability
  const homeImplied = homeML > 0 ? 100 / (homeML + 100) : Math.abs(homeML) / (Math.abs(homeML) + 100);
  const awayImplied = awayML > 0 ? 100 / (awayML + 100) : Math.abs(awayML) / (Math.abs(awayML) + 100);

  // Value = 1 - implied (lower implied = more value)
  const homeValue = Math.round((1 - homeImplied) * 100);
  const awayValue = Math.round((1 - awayImplied) * 100);

  let recommendation = '';
  let confidence = 50;

  const diff = Math.abs(homeImplied - awayImplied);

  if (diff >= 0.25) {
    const underdog = homeImplied < awayImplied ? 'home' : 'away';
    recommendation = `Clear underdog value on ${underdog === 'home' ? game.homeTeam.name : game.awayTeam.name}`;
    confidence = 75;
  } else if (diff >= 0.10) {
    recommendation = 'Moderate edge available - proceed with caution';
    confidence = 60;
  } else {
    recommendation = 'Close matchup - consider spread or total bets instead';
    confidence = 45;
  }

  return { homeValue, awayValue, recommendation, confidence };
}

const GameDetail = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const location = useLocation();
  const { games, isLoading: isLoadingGames, error: gamesError } = useLiveGames();

  const stateGame = (location.state as { game?: PopularGame } | null)?.game;

  const cachedPopularGame = useMemo(() => {
    if (!gameId) return undefined;
    try {
      const raw = localStorage.getItem('popular_games_cache');
      if (!raw) return undefined;
      const parsed = JSON.parse(raw);
      const list = parsed?.games;
      if (!Array.isArray(list)) return undefined;
      return list.find((g: PopularGame) => g?.id === gameId);
    } catch {
      return undefined;
    }
  }, [gameId]);

  const game = useMemo(() => {
    if (!gameId) return undefined;
    const live = games.find((g) => g.id === gameId);
    if (live) return live;

    const popular = stateGame || cachedPopularGame;
    if (popular) return popularGameToLiveGame(popular);

    return undefined;
  }, [games, gameId, stateGame, cachedPopularGame]);

  const [scrapedData, setScrapedData] = useState<ScrapedGameData | null>(null);
  const [isLoadingScrapedData, setIsLoadingScrapedData] = useState(false);

  useEffect(() => {
    if (!game) return;

    setIsLoadingScrapedData(true);
    fetchGameData(game.homeTeam.name, game.awayTeam.name, game.sport)
      .then((response) => {
        if (response.success && response.data) {
          setScrapedData(response.data);
        }
      })
      .finally(() => setIsLoadingScrapedData(false));
  }, [game]);

  const qualification = useMemo(() => {
    if (!game) return null;
    return calculateLiveBetQualification(game);
  }, [game]);

  const risk = useMemo(() => {
    if (!game) return null;
    return analyzeRisk(game);
  }, [game]);

  const value = useMemo(() => {
    if (!game) return null;
    return analyzeValue(game);
  }, [game]);

  if (isLoadingGames && !game) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (gamesError && games.length === 0 && !game) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-xl px-6">
            <h1 className="text-2xl font-bold mb-3">Can’t load games right now</h1>
            <p className="text-muted-foreground mb-6">{gamesError}</p>
            <Button asChild>
              <Link to="/games">Back to Games</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-xl px-6">
            <h1 className="text-2xl font-bold mb-4">Game Not Found</h1>
            <p className="text-muted-foreground mb-6">
              This link may be stale (games refresh often). Go back to Games and open the matchup again.
            </p>
            <Button asChild>
              <Link to="/games">Back to Games</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }),
    };
  };

  const dateTime = formatDateTime(game.startTime);

  const SignalBadge = ({ qual }: { qual: LiveBetQualification }) => {
    const variants = {
      'GOOD': { bg: 'bg-emerald-500/20 border-emerald-500/40', text: 'text-emerald-400', icon: TrendingUp },
      'BORDERLINE': { bg: 'bg-amber-500/20 border-amber-500/40', text: 'text-amber-400', icon: Minus },
      'PASS': { bg: 'bg-red-500/20 border-red-500/40', text: 'text-red-400', icon: TrendingDown },
    };
    const v = variants[qual.signal];
    const Icon = v.icon;
    return (
      <Badge variant="outline" className={cn("text-sm px-3 py-1", v.bg, v.text)}>
        <Icon className="h-4 w-4 mr-1" />
        {qual.signal} - {qual.confidenceScore}%
      </Badge>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <LiveDataBanner 
        isLive={true}
        lastUpdated={new Date().toISOString()}
        remainingRequests={null}
        isLoading={false}
        onRefresh={() => {}}
      />
      <Header />
      
      <main className="flex-1 py-6 md:py-8">
        <div className="container">
          {/* Back Button */}
          <Link to="/games" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft className="h-4 w-4" />
            Back to Games
          </Link>

          {/* Game Header */}
          <Card variant="glass" className="mb-6 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                {/* Teams/Fighters */}
                <div className="flex-1">
                  <div className="flex items-center justify-center lg:justify-start gap-6">
                    {/* First Team/Fighter */}
                    <div className="text-center">
                      <div className={cn(
                        "w-20 h-20 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-2xl font-bold",
                        qualification?.pick === 'home' && qualification.signal === 'GOOD' && "ring-2 ring-emerald-500"
                      )}>
                        {game.homeTeam.abbreviation}
                      </div>
                      <p className="font-semibold">{game.homeTeam.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {['UFC', 'MMA', 'Boxing'].includes(game.sport) ? 'Red Corner' : 
                         ['Tennis', 'Table Tennis', 'ATP', 'WTA'].includes(game.sport) ? '' : 'Home'}
                      </p>
                    </div>

                    {/* VS */}
                    <div className="text-center px-4">
                      <div className="text-3xl font-bold text-muted-foreground">vs</div>
                    </div>

                    {/* Second Team/Fighter */}
                    <div className="text-center">
                      <div className={cn(
                        "w-20 h-20 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-secondary to-muted flex items-center justify-center text-2xl font-bold",
                        qualification?.pick === 'away' && qualification.signal === 'GOOD' && "ring-2 ring-emerald-500"
                      )}>
                        {game.awayTeam.abbreviation}
                      </div>
                      <p className="font-semibold">{game.awayTeam.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {['UFC', 'MMA', 'Boxing'].includes(game.sport) ? 'Blue Corner' : 
                         ['Tennis', 'Table Tennis', 'ATP', 'WTA'].includes(game.sport) ? '' : 'Away'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Game Info */}
                <div className="lg:border-l lg:border-border lg:pl-6 space-y-3">
                  <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                    <Badge variant="info">{game.sport}</Badge>
                    {qualification && <SignalBadge qual={qualification} />}
                    {game.status === 'live' && (
                      <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/40 animate-pulse">
                        LIVE
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{dateTime.date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{dateTime.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{game.venue}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Odds Cards */}
          {game.odds ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Moneyline */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Moneyline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground mb-1">{game.homeTeam.abbreviation}</div>
                      <div className={cn(
                        "text-2xl font-bold font-mono",
                        game.odds.moneyline.home < 0 ? "text-emerald-400" : "text-foreground"
                      )}>
                        {game.odds.moneyline.home > 0 ? '+' : ''}{game.odds.moneyline.home || 'N/A'}
                      </div>
                    </div>
                    <div className="text-muted-foreground">vs</div>
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground mb-1">{game.awayTeam.abbreviation}</div>
                      <div className={cn(
                        "text-2xl font-bold font-mono",
                        game.odds.moneyline.away < 0 ? "text-emerald-400" : "text-foreground"
                      )}>
                        {game.odds.moneyline.away > 0 ? '+' : ''}{game.odds.moneyline.away || 'N/A'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Spread */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Spread
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground mb-1">{game.homeTeam.abbreviation}</div>
                      <div className="text-2xl font-bold font-mono">
                        {game.odds.spread.home > 0 ? '+' : ''}{game.odds.spread.home || 'N/A'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ({game.odds.spread.homeOdds > 0 ? '+' : ''}{game.odds.spread.homeOdds})
                      </div>
                    </div>
                    <div className="text-muted-foreground">vs</div>
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground mb-1">{game.awayTeam.abbreviation}</div>
                      <div className="text-2xl font-bold font-mono">
                        {game.odds.spread.away > 0 ? '+' : ''}{game.odds.spread.away || 'N/A'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ({game.odds.spread.awayOdds > 0 ? '+' : ''}{game.odds.spread.awayOdds})
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Total */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Total (O/U)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground mb-1">Over</div>
                      <div className="text-2xl font-bold font-mono">
                        {game.odds.total.over || 'N/A'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ({game.odds.total.overOdds > 0 ? '+' : ''}{game.odds.total.overOdds})
                      </div>
                    </div>
                    <div className="text-muted-foreground">/</div>
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground mb-1">Under</div>
                      <div className="text-2xl font-bold font-mono">
                        {game.odds.total.under || 'N/A'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ({game.odds.total.underOdds > 0 ? '+' : ''}{game.odds.total.underOdds})
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="mb-6">
              <CardContent className="p-6 flex items-center gap-3 text-sm text-muted-foreground">
                <Info className="h-4 w-4" />
                Odds currently unavailable. Analysis based on schedule, form, and market interest.
              </CardContent>
            </Card>
          )}


          {/* === STRUCTURED GAME VIEW ORDER === */}
          
          {/* 3) Key Injuries & Availability */}
          {isLoadingScrapedData ? (
            <div className="flex items-center justify-center py-8 mb-6">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Loading injury data...</span>
            </div>
          ) : scrapedData && (
            <div className="mb-6">
              <ScrapedInjuryCard 
                injuries={scrapedData.injuries}
                homeTeam={game.homeTeam.name}
                awayTeam={game.awayTeam.name}
              />
            </div>
          )}
          
          {/* 4) AI Analysis - CRITICAL SECTION */}
          <div className="mb-6">
            <AIAnalysisCard 
              game={game}
              qualification={qualification}
              scrapedData={scrapedData}
            />
          </div>
          
          {/* 5) Supporting Stats / Chart (sport-specific) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Risk Assessment */}
            {risk && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className={cn(
                      "h-5 w-5",
                      risk.level === 'Low' ? 'text-emerald-400' :
                      risk.level === 'Medium' ? 'text-amber-400' : 'text-red-400'
                    )} />
                    Risk Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Risk Level: {risk.level}</span>
                      <span className="text-sm text-muted-foreground">{risk.score}/100</span>
                    </div>
                    <Progress 
                      value={risk.score} 
                      className={cn(
                        "h-3",
                        risk.level === 'Low' ? '[&>div]:bg-emerald-500' :
                        risk.level === 'Medium' ? '[&>div]:bg-amber-500' : '[&>div]:bg-red-500'
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    {risk.factors.map((factor, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <AlertTriangle className={cn(
                          "h-4 w-4 mt-0.5 shrink-0",
                          risk.level === 'Low' ? 'text-emerald-400' :
                          risk.level === 'Medium' ? 'text-amber-400' : 'text-red-400'
                        )} />
                        <span className="text-muted-foreground">{factor}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Market Interest Index */}
            {value && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Market Interest Index
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center p-3 rounded-lg bg-muted/30">
                      <div className="text-xs text-muted-foreground mb-1">{game.homeTeam.abbreviation}</div>
                      <div className="text-2xl font-bold">{value.homeValue}%</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/30">
                      <div className="text-xs text-muted-foreground mb-1">{game.awayTeam.abbreviation}</div>
                      <div className="text-2xl font-bold">{value.awayValue}%</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <Info className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{value.recommendation}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Derived from league importance, team popularity, and event timing.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          
          {/* Recent Form & Performance Chart */}
          {scrapedData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <ScrapedFormCard 
                recentForm={scrapedData.recentForm}
                headToHead={scrapedData.headToHead}
                homeTeam={game.homeTeam.name}
                awayTeam={game.awayTeam.name}
              />
              <PerformanceChartLive 
                recentForm={scrapedData.recentForm}
                homeTeam={game.homeTeam.name}
                awayTeam={game.awayTeam.name}
                sport={game.sport}
              />
            </div>
          )}


          {/* Qualified Bet Accuracy Chart */}
          <div className="mb-6">
            <QualifiedBetAccuracyChart sport={game.sport} />
          </div>

          {/* Full AI Report */}
          <div className="mb-6">
            <FullAIReport 
              game={game}
              scrapedData={scrapedData}
            />
          </div>

          {/* Soft Disclaimer */}
          <p className="text-xs text-muted-foreground text-center py-4">
            Informational analysis only. No guarantees. Bet responsibly.
          </p>
        </div>
      </main>

      <Footer />
      
    </div>
  );
};

export default GameDetail;
