import { useParams, Link } from 'react-router-dom';
import { useMemo, useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { LiveDataBanner } from '@/components/LiveDataBanner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Calendar, MapPin, Clock, TrendingUp, TrendingDown, Minus, Loader2, AlertTriangle, Shield, Activity, Target, Zap, Info } from 'lucide-react';
import { LiveGame, calculateLiveBetQualification, LiveBetQualification } from '@/lib/liveTypes';
import { getGameById } from '@/hooks/useLiveGames';
import { BettingChatBot } from '@/components/BettingChatBot';
import { cn } from '@/lib/utils';
import { fetchGameData, ScrapedGameData } from '@/lib/api/gameData';
import { ScrapedInjuryCard } from '@/components/ScrapedInjuryCard';
import { ScrapedFormCard } from '@/components/ScrapedFormCard';
import { AIAnalysisCard } from '@/components/AIAnalysisCard';
import { PerformanceChartLive } from '@/components/PerformanceChartLive';
import { QualifiedBetAccuracyChart } from '@/components/QualifiedBetAccuracyChart';

// Risk assessment based on odds analysis
interface RiskAnalysis {
  level: 'Low' | 'Medium' | 'High';
  score: number;
  factors: string[];
}

function analyzeRisk(game: LiveGame): RiskAnalysis {
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
}

function analyzeValue(game: LiveGame): ValueAnalysis {
  const homeML = game.odds.moneyline.home;
  const awayML = game.odds.moneyline.away;
  
  if (homeML === 0 || awayML === 0) {
    return {
      homeValue: 0,
      awayValue: 0,
      recommendation: 'Insufficient odds data for value analysis',
      confidence: 0,
    };
  }
  
  // Convert to implied probability
  const homeImplied = homeML > 0 
    ? 100 / (homeML + 100) 
    : Math.abs(homeML) / (Math.abs(homeML) + 100);
  const awayImplied = awayML > 0 
    ? 100 / (awayML + 100) 
    : Math.abs(awayML) / (Math.abs(awayML) + 100);
  
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
  const [game, setGame] = useState<LiveGame | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scrapedData, setScrapedData] = useState<ScrapedGameData | null>(null);
  const [isLoadingScrapedData, setIsLoadingScrapedData] = useState(false);

  useEffect(() => {
    const cachedGame = getGameById(gameId || '');
    if (cachedGame) {
      setGame(cachedGame);
      setIsLoading(false);
      
      // Fetch scraped data for the game
      setIsLoadingScrapedData(true);
      fetchGameData(cachedGame.homeTeam.name, cachedGame.awayTeam.name, cachedGame.sport)
        .then(response => {
          if (response.success && response.data) {
            setScrapedData(response.data);
          }
        })
        .finally(() => setIsLoadingScrapedData(false));
      
      return;
    }
    setError('Game not in cache - please go back to Games and click again');
    setIsLoading(false);
  }, [gameId]);

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

  if (isLoading) {
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

  if (!game || error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Game Not Found</h1>
            <p className="text-muted-foreground mb-6">
              {error || "The game you're looking for doesn't exist or has ended."}
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
                {/* Teams */}
                <div className="flex-1">
                  <div className="flex items-center justify-center lg:justify-start gap-6">
                    {/* Home Team */}
                    <div className="text-center">
                      <div className={cn(
                        "w-20 h-20 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-2xl font-bold",
                        qualification?.pick === 'home' && qualification.signal === 'GOOD' && "ring-2 ring-emerald-500"
                      )}>
                        {game.homeTeam.abbreviation}
                      </div>
                      <p className="font-semibold">{game.homeTeam.name}</p>
                      <p className="text-xs text-muted-foreground">Home</p>
                    </div>

                    {/* VS */}
                    <div className="text-center px-4">
                      <div className="text-3xl font-bold text-muted-foreground">vs</div>
                    </div>

                    {/* Away Team */}
                    <div className="text-center">
                      <div className={cn(
                        "w-20 h-20 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-secondary to-muted flex items-center justify-center text-2xl font-bold",
                        qualification?.pick === 'away' && qualification.signal === 'GOOD' && "ring-2 ring-emerald-500"
                      )}>
                        {game.awayTeam.abbreviation}
                      </div>
                      <p className="font-semibold">{game.awayTeam.name}</p>
                      <p className="text-xs text-muted-foreground">Away</p>
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

          {/* Analysis Grid */}
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

            {/* Value Analysis */}
            {value && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Value Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center p-3 rounded-lg bg-muted/30">
                      <div className="text-xs text-muted-foreground mb-1">{game.homeTeam.abbreviation} Value</div>
                      <div className="text-2xl font-bold">{value.homeValue}%</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/30">
                      <div className="text-xs text-muted-foreground mb-1">{game.awayTeam.abbreviation} Value</div>
                      <div className="text-2xl font-bold">{value.awayValue}%</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <Info className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{value.recommendation}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Confidence: {value.confidence}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Scraped Data Section */}
          {isLoadingScrapedData ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Loading game data...</span>
            </div>
          ) : scrapedData && (
            <>
              {/* Injuries and Form */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <ScrapedInjuryCard 
                  injuries={scrapedData.injuries}
                  homeTeam={game.homeTeam.name}
                  awayTeam={game.awayTeam.name}
                />
                <ScrapedFormCard 
                  recentForm={scrapedData.recentForm}
                  headToHead={scrapedData.headToHead}
                  homeTeam={game.homeTeam.name}
                  awayTeam={game.awayTeam.name}
                />
              </div>

              {/* Chart and AI Analysis */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <PerformanceChartLive 
                  recentForm={scrapedData.recentForm}
                  homeTeam={game.homeTeam.name}
                  awayTeam={game.awayTeam.name}
                  sport={game.sport}
                />
                <AIAnalysisCard 
                  game={game}
                  qualification={qualification}
                  scrapedData={scrapedData}
                />
              </div>
            </>
          )}

          {/* AI Summary Card */}
          {qualification && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  AI Bet Analysis Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center p-4 rounded-lg bg-muted/30">
                    <div className="text-sm text-muted-foreground mb-1">Signal</div>
                    <div className={cn(
                      "text-xl font-bold",
                      qualification.signal === 'GOOD' ? 'text-emerald-400' :
                      qualification.signal === 'BORDERLINE' ? 'text-amber-400' : 'text-red-400'
                    )}>
                      {qualification.signal}
                    </div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/30">
                    <div className="text-sm text-muted-foreground mb-1">Confidence</div>
                    <div className="text-xl font-bold">{qualification.confidenceScore}%</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/30">
                    <div className="text-sm text-muted-foreground mb-1">Risk Level</div>
                    <div className="text-xl font-bold">{qualification.volatility}</div>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-muted/30">
                    <div className="text-sm text-muted-foreground mb-1">Recommended Pick</div>
                    <div className="text-xl font-bold">
                      {qualification.pick === 'home' ? game.homeTeam.abbreviation : game.awayTeam.abbreviation}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground text-center p-3 bg-muted/20 rounded-lg">
                  {qualification.reason}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Qualified Bet Accuracy Chart */}
          <div className="mb-6">
            <QualifiedBetAccuracyChart sport={game.sport} />
          </div>

          {/* Disclaimer */}
          <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-400">Disclaimer</p>
                <p className="text-sm text-muted-foreground mt-1">
                  This analysis is for informational purposes only. Sports betting involves risk. 
                  Past performance does not guarantee future results. Please bet responsibly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <BettingChatBot />
    </div>
  );
};

export default GameDetail;
