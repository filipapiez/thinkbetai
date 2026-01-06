import { useParams, Link } from 'react-router-dom';
import { useMemo, useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { LiveDataBanner } from '@/components/LiveDataBanner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Calendar, MapPin, Clock, TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react';
import { LiveGame, calculateLiveBetQualification, LiveBetQualification } from '@/lib/liveTypes';
import { getGameById } from '@/hooks/useLiveGames';
import { BettingChatBot } from '@/components/BettingChatBot';
import { cn } from '@/lib/utils';

const GameDetail = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const [game, setGame] = useState<LiveGame | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Try to get game from cache first
    const cachedGame = getGameById(gameId || '');
    if (cachedGame) {
      setGame(cachedGame);
      setIsLoading(false);
      return;
    }

    // If not in cache, try fetching from API
    const fetchGame = async () => {
      setIsLoading(true);
      try {
        // For now, just show not found if not in cache
        // In a full implementation, we'd fetch the specific event
        setError('Game not in cache - please go back to Games and click again');
        setGame(null);
      } catch (err) {
        setError('Failed to load game');
      } finally {
        setIsLoading(false);
      }
    };

    fetchGame();
  }, [gameId]);

  const qualification = useMemo(() => {
    if (!game) return null;
    return calculateLiveBetQualification(game);
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
                <CardTitle className="text-sm font-medium text-muted-foreground">Moneyline</CardTitle>
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
                <CardTitle className="text-sm font-medium text-muted-foreground">Spread</CardTitle>
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
                <CardTitle className="text-sm font-medium text-muted-foreground">Total (O/U)</CardTitle>
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

          {/* Analysis Card */}
          {qualification && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>AI Bet Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                    <div className="text-sm text-muted-foreground mb-1">Pick</div>
                    <div className="text-xl font-bold">
                      {qualification.pick === 'home' ? game.homeTeam.abbreviation : game.awayTeam.abbreviation}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-4 text-center">
                  {qualification.reason}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
      <BettingChatBot />
    </div>
  );
};

export default GameDetail;
