import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { PopularGameCard, calculateBetSignal } from '@/components/PopularGameCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SEO } from '@/components/SEO';
import { Search, Calendar, Filter, X, TrendingUp, Info, RefreshCw, Loader2, Clock, Radio, Lock, Crown } from 'lucide-react';
import { usePopularGames, PopularGame } from '@/hooks/usePopularGames';
import { useAuth } from '@/contexts/AuthContext';
import { getTeamLogoUrl, sportSupportsLogos, isIndividualSportForLogos } from '@/lib/teamLogos';
import { GameParlayBar } from '@/components/GameParlayBar';
import { LiveScoresBanner } from '@/components/LiveScoresBanner';



type BetSignal = 'GOOD' | 'BORDERLINE' | 'PASS';
type TimePeriod = 'live' | 'today' | 'week' | 'month';

// Keep sport filters stable and show the most popular options even when a given
// sport has 0 games in the selected time period.
const POPULAR_SPORT_FILTERS: string[] = [
  'Football',
  'Basketball',
  'Baseball',
  'Soccer',
  'Hockey',
  'MMA',
  'Boxing',
  'Tennis',
  'Golf',
  'Cricket',
  'Rugby',
  'AFL',
  'Esports',
  'NASCAR',
  'F1',
  'Volleyball',
  'Handball',
  // Keep Table Tennis available as its own category
  'Table Tennis',
];

const Games = () => {
  const navigate = useNavigate();
  const { isSubscribed, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [selectedLeague, setSelectedLeague] = useState<string | null>(null);
  const [selectedSignal, setSelectedSignal] = useState<BetSignal | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('today');
  const [parlayGames, setParlayGames] = useState<PopularGame[]>([]);

  const toggleParlayGame = useCallback((game: PopularGame) => {
    setParlayGames(prev => {
      const exists = prev.some(g => g.id === game.id);
      return exists ? prev.filter(g => g.id !== game.id) : [...prev, game];
    });
  }, []);

  const removeParlayGame = useCallback((gameId: string) => {
    setParlayGames(prev => prev.filter(g => g.id !== gameId));
  }, []);

  const clearParlayGames = useCallback(() => {
    setParlayGames([]);
  }, []);
  // Fetch popular games from scraper
  const { games, isLoading, error, lastUpdated, source, refetch } = usePopularGames();

  // Filter games by time period
  const filterByPeriod = useCallback((game: PopularGame, period: TimePeriod): boolean => {
    const now = new Date();
    const gameTime = new Date(game.startTime);
    
    // Skip invalid dates
    if (isNaN(gameTime.getTime())) return false;

    // Always hide finished games regardless of filter
    const finishedStatuses = ['completed', 'post', 'ended', 'final'];
    if (finishedStatuses.includes(game.status?.toLowerCase() ?? '')) return false;
    
    switch (period) {
      case 'live':
        const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
        const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
        return game.status === 'live' || 
               (gameTime >= twoHoursAgo && gameTime <= twoHoursFromNow);
      case 'today':
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
        return game.status === 'live' || (gameTime >= todayStart && gameTime < todayEnd);
      case 'week':
        const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        return game.status === 'live' || (gameTime >= now && gameTime < weekEnd);
      case 'month':
        const monthEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        return game.status === 'live' || (gameTime >= now && gameTime < monthEnd);
      default:
        return true;
    }
  }, []);

  // Games filtered by time period
  const periodFilteredGames = useMemo(() => {
    return games.filter(game => filterByPeriod(game, selectedPeriod));
  }, [games, selectedPeriod, filterByPeriod]);

  // Calculate signals for period-filtered games
  const gamesWithSignals = useMemo(() => {
    return periodFilteredGames.map(game => ({
      game,
      ...calculateBetSignal(game)
    }));
  }, [periodFilteredGames]);

  // Signal counts for current period
  const signalCounts = useMemo(() => {
    const counts = { GOOD: 0, BORDERLINE: 0, PASS: 0 };
    gamesWithSignals.forEach(g => counts[g.signal]++);
    return counts;
  }, [gamesWithSignals]);

  // Period counts
  const periodCounts = useMemo(() => {
    return {
      live: games.filter(g => filterByPeriod(g, 'live')).length,
      today: games.filter(g => filterByPeriod(g, 'today')).length,
      week: games.filter(g => filterByPeriod(g, 'week')).length,
      month: games.filter(g => filterByPeriod(g, 'month')).length,
    };
  }, [games, filterByPeriod]);

  // Get unique sports from data (for the selected time period), but also include
  // a stable set of popular sports so the filter list doesn't shrink unexpectedly.
  // Sports with available games appear FIRST, unavailable sports at the end.
  const availableSports = useMemo(() => {
    const periodSports = new Set(periodFilteredGames.map(g => g.sport).filter(Boolean));
    const merged = new Set<string>([...POPULAR_SPORT_FILTERS, ...periodSports]);

    return Array.from(merged).sort((a, b) => {
      const aHasGames = periodSports.has(a);
      const bHasGames = periodSports.has(b);
      
      // Sports with games come first
      if (aHasGames && !bHasGames) return -1;
      if (!aHasGames && bHasGames) return 1;
      
      // Within same availability, sort by popularity order
      const ai = POPULAR_SPORT_FILTERS.indexOf(a);
      const bi = POPULAR_SPORT_FILTERS.indexOf(b);
      const aIn = ai !== -1;
      const bIn = bi !== -1;
      if (aIn && bIn) return ai - bi;
      if (aIn) return -1;
      if (bIn) return 1;
      return a.localeCompare(b);
    });
  }, [periodFilteredGames]);

  // Get unique leagues from data
  const availableLeagues = useMemo(() => {
    const filteredGames = selectedSport 
      ? periodFilteredGames.filter(g => g.sport === selectedSport)
      : periodFilteredGames;
    const leagues = new Set(filteredGames.map(g => g.league));
    return Array.from(leagues).sort();
  }, [periodFilteredGames, selectedSport]);

  // Count games per sport
  const sportCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    availableSports.forEach(sport => {
      counts[sport] = periodFilteredGames.filter(g => g.sport === sport).length;
    });
    return counts;
  }, [periodFilteredGames, availableSports]);

  // Helper: check if a game has team logos available
  const gameHasLogos = useCallback((game: PopularGame): boolean => {
    const sport = game.league || game.sport;
    if (!sportSupportsLogos(sport) || isIndividualSportForLogos(sport)) return false;
    const homeLogo = getTeamLogoUrl(game.homeTeam, sport);
    const awayLogo = getTeamLogoUrl(game.awayTeam, sport);
    return !!(homeLogo && awayLogo);
  }, []);

  // Sort all games (unfiltered) so the 2 free preview games are stable regardless of search/filters
  const sortedGames = useMemo(() => {
    const signalPriority: Record<BetSignal, number> = { GOOD: 0, BORDERLINE: 1, PASS: 2 };
    return [...gamesWithSignals]
      .sort((a, b) => {
        if (!isSubscribed) {
          const aHasLogos = gameHasLogos(a.game);
          const bHasLogos = gameHasLogos(b.game);
          if (aHasLogos && !bHasLogos) return -1;
          if (!aHasLogos && bHasLogos) return 1;
        }
        const priorityDiff = signalPriority[a.signal] - signalPriority[b.signal];
        if (priorityDiff !== 0) return priorityDiff;
        return b.confidence - a.confidence;
      })
      .map(({ game }) => game);
  }, [gamesWithSignals, isSubscribed, gameHasLogos]);

  // IDs of the 2 free preview games — locked status follows the game, not the filtered index
  const freePreviewIds = useMemo(
    () => new Set(isSubscribed ? [] : sortedGames.slice(0, 2).map(g => g.id)),
    [sortedGames, isSubscribed]
  );

  // Filter games by search/sport/league/signal while preserving global sort order
  const filteredGames = useMemo(() => {
    const signalById = new Map(gamesWithSignals.map(gs => [gs.game.id, gs.signal]));
    return sortedGames.filter((game) => {
      const matchesSearch = searchQuery === '' ||
        game.homeTeam.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.awayTeam.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.league.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSport = !selectedSport || game.sport === selectedSport;
      const matchesLeague = !selectedLeague || game.league === selectedLeague;
      const matchesSignal = !selectedSignal || signalById.get(game.id) === selectedSignal;
      return matchesSearch && matchesSport && matchesLeague && matchesSignal;
    });
  }, [sortedGames, gamesWithSignals, searchQuery, selectedSport, selectedLeague, selectedSignal]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedSport(null);
    setSelectedLeague(null);
    setSelectedSignal(null);
  };

  const hasActiveFilters = searchQuery || selectedSport || selectedLeague || selectedSignal;

  const getPeriodLabel = (period: TimePeriod) => {
    switch (period) {
      case 'live': return 'Live Now';
      case 'today': return 'Today';
      case 'week': return 'This Week';
      case 'month': return 'This Month';
    }
  };

  const formatLastUpdated = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SEO 
        title="Games - AI Sports Betting Predictions"
        description="Browse upcoming games with AI-powered betting predictions. Get real-time odds analysis, injury reports, and smart picks for NFL, NBA, MLB, NHL and more."
        keywords="sports betting picks, AI game predictions, betting odds, sports analysis, today's games betting"
        url="/games"
      />
      <Header />
      
      <main className="flex-1 py-8">
        <div className="container">
          {/* Page Header */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Upcoming Games</h1>
              <p className="text-muted-foreground">
                Search and explore matchups. Games sorted by bet quality —<br className="hidden sm:block" />
                GOOD bets shown first.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Updated at {formatLastUpdated(lastUpdated)}</span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refetch}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Time Period Tabs */}
          <Tabs value={selectedPeriod} onValueChange={(v) => setSelectedPeriod(v as TimePeriod)} className="mb-6">
            <TabsList className="grid w-full grid-cols-4 h-12 bg-muted/50">
              <TabsTrigger value="live" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2">
                <Radio className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Live</span>
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {periodCounts.live}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="today" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2">
                <span>Today</span>
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {periodCounts.today}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="week" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2">
                <span className="hidden sm:inline">This </span>Week
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {periodCounts.week}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="month" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2">
                <span className="hidden sm:inline">This </span>Month
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {periodCounts.month}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Live Scores Banner */}
          <LiveScoresBanner sport={selectedSport || undefined} />

          {/* Bet Signal Summary Card */}
          <Card className="mb-6 bg-card border-border">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Bet Signal Summary</h3>
                </div>
                <span className="text-sm text-muted-foreground">
                  {selectedSport || 'All Sports'} • {getPeriodLabel(selectedPeriod)}
                </span>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4">
                {/* GOOD */}
                <button
                  onClick={() => setSelectedSignal(selectedSignal === 'GOOD' ? null : 'GOOD')}
                  className={`p-3 sm:p-4 rounded-lg text-center transition-all ${
                    selectedSignal === 'GOOD' 
                      ? 'bg-emerald-500/30 border-2 border-emerald-500' 
                      : 'bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20'
                  }`}
                >
                  <div className="text-xl sm:text-2xl font-bold text-emerald-400">{signalCounts.GOOD}</div>
                  <div className="text-xs text-emerald-400 font-medium">GOOD</div>
                </button>
                
                {/* BORDERLINE */}
                <button
                  onClick={() => setSelectedSignal(selectedSignal === 'BORDERLINE' ? null : 'BORDERLINE')}
                  className={`p-3 sm:p-4 rounded-lg text-center transition-all ${
                    selectedSignal === 'BORDERLINE' 
                      ? 'bg-amber-500/30 border-2 border-amber-500' 
                      : 'bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20'
                  }`}
                >
                  <div className="text-xl sm:text-2xl font-bold text-amber-400">{signalCounts.BORDERLINE}</div>
                  <div className="text-xs text-amber-400 font-medium">BORDERLINE</div>
                </button>
                
                {/* PASS */}
                <button
                  onClick={() => setSelectedSignal(selectedSignal === 'PASS' ? null : 'PASS')}
                  className={`p-3 sm:p-4 rounded-lg text-center transition-all ${
                    selectedSignal === 'PASS' 
                      ? 'bg-red-500/30 border-2 border-red-500' 
                      : 'bg-red-500/10 border border-red-500/30 hover:bg-red-500/20'
                  }`}
                >
                  <div className="text-xl sm:text-2xl font-bold text-red-400">{signalCounts.PASS}</div>
                  <div className="text-xs text-red-400 font-medium">PASS</div>
                </button>
                
                {/* TOTAL */}
                <div className="p-3 sm:p-4 rounded-lg text-center bg-muted/30 border border-border">
                  <div className="text-xl sm:text-2xl font-bold">{periodFilteredGames.length}</div>
                  <div className="text-xs text-muted-foreground font-medium">TOTAL</div>
                </div>
              </div>
              
              <div className="flex items-start gap-2 text-xs sm:text-sm text-muted-foreground">
                <Info className="h-4 w-4 shrink-0 mt-0.5" />
                <span>GOOD + BORDERLINE + PASS = TOTAL. Only GOOD and BORDERLINE are recommended bets.</span>
              </div>
            </CardContent>
          </Card>


          {/* Search & Filters */}
          <div className="space-y-4 mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by team or league..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 bg-card border-border"
              />
            </div>

            {/* Sport Filter */}
            <div className="overflow-x-auto -mx-4 px-4 pb-2">
              <div className="flex gap-2 min-w-max">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground mr-2 shrink-0">
                  <Filter className="h-4 w-4" />
                  <span>Sport:</span>
                </div>
                
                <Badge
                  variant={selectedSport === null ? 'default' : 'outline'}
                  className="cursor-pointer hover:bg-primary/20 transition-colors shrink-0"
                  onClick={() => { setSelectedSport(null); setSelectedLeague(null); }}
                >
                  All ({periodFilteredGames.length})
                </Badge>

                {availableSports.map(sport => {
                  const count = sportCounts[sport] || 0;
                  const isDisabled = count === 0;
                  return (
                    <Badge
                      key={sport}
                      variant={selectedSport === sport ? 'default' : 'outline'}
                      className={`shrink-0 ${
                        isDisabled
                          ? 'opacity-50 cursor-not-allowed'
                          : 'cursor-pointer hover:bg-primary/20 transition-colors'
                      }`}
                      onClick={() => {
                        if (isDisabled) return;
                        setSelectedSport(selectedSport === sport ? null : sport);
                        setSelectedLeague(null);
                      }}
                    >
                      {sport} ({count})
                    </Badge>
                  );
                })}
              </div>
            </div>

            {/* League Filter (shows when sport selected) */}
            {selectedSport && availableLeagues.length > 1 && (
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground mr-2">
                  <Calendar className="h-4 w-4" />
                  <span>League:</span>
                </div>
                
                <Badge
                  variant={selectedLeague === null ? 'default' : 'outline'}
                  className="cursor-pointer hover:bg-primary/20 transition-colors"
                  onClick={() => setSelectedLeague(null)}
                >
                  All Leagues
                </Badge>

                {availableLeagues.map(league => (
                  <Badge
                    key={league}
                    variant={selectedLeague === league ? 'default' : 'outline'}
                    className="cursor-pointer hover:bg-primary/20 transition-colors"
                    onClick={() => setSelectedLeague(selectedLeague === league ? null : league)}
                  >
                    {league}
                  </Badge>
                ))}
              </div>
            )}

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8">
                <X className="h-3 w-3 mr-1" />
                Clear all filters
              </Button>
            )}
          </div>

          {/* Loading State */}
          {isLoading && games.length === 0 && (
            <div className="text-center py-16 min-h-[400px] flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Loading popular games...</p>
              <p className="text-xs text-muted-foreground mt-2">Fetching Schedule Data</p>
            </div>
          )}

          {/* Error State */}
          {error && games.length === 0 && (
            <div className="text-center py-16">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 mb-4">
                <X className="h-8 w-8 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Failed to load games</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={refetch}>Try Again</Button>
            </div>
          )}

          {/* No Results */}
          {!isLoading && !error && filteredGames.length === 0 && games.length > 0 && (
            <div className="text-center py-16">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No games found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your filters.
              </p>
              {hasActiveFilters && (
                <Button variant="outline" onClick={clearFilters}>
                  Clear all filters
                </Button>
              )}
            </div>
          )}

          {/* No Games Available */}
          {!isLoading && !error && games.length === 0 && (
            <div className="text-center py-16">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No games available</h3>
              <p className="text-muted-foreground mb-4">
                Check back later for upcoming game schedules.
              </p>
              <Button onClick={refetch}>Check Again</Button>
            </div>
          )}

          {/* Games Grid */}
          {filteredGames.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGames.map((game, index) => {
                // For non-subscribers: unlock 2 best games, lock the rest
                const isFreePreview = !isSubscribed && index < 2;
                const isLocked = !isSubscribed && index >= 2;

                if (isLocked) {
                  return (
                    <div key={`${game.id}-${index}`} className="animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                      <div 
                        className="relative cursor-pointer group"
                        onClick={() => navigate(user ? '/pricing' : '/login', { state: { from: { pathname: '/games' } } })}
                      >
                        {/* Blurred card underneath */}
                        <div className="blur-[6px] opacity-50 pointer-events-none select-none">
                          <PopularGameCard game={game} rank={index + 1} />
                        </div>
                        {/* Lock overlay */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm rounded-xl border border-border/50 group-hover:border-primary/40 transition-colors">
                          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-3">
                            <Lock className="h-6 w-6 text-primary" />
                          </div>
                          <p className="text-sm font-semibold mb-1">Unlock This Game</p>
                          <p className="text-xs text-muted-foreground">Subscribe for full access</p>
                          <div className="mt-3 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-xs font-medium text-primary group-hover:bg-primary/20 transition-colors">
                            <Crown className="h-3 w-3 inline mr-1" />
                            View Plans
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={`${game.id}-${index}`} className="animate-slide-up relative" style={{ animationDelay: `${index * 50}ms` }}>
                    {isFreePreview && (
                      <div className="absolute -top-2 -right-2 z-10">
                        <Badge className="bg-primary text-primary-foreground text-[10px] px-2 py-0.5">
                          FREE PREVIEW
                        </Badge>
                      </div>
                    )}
                    <PopularGameCard
                      game={game}
                      rank={index + 1}
                      isSelected={parlayGames.some(g => g.id === game.id)}
                      onToggleSelect={toggleParlayGame}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* Results Count & Disclaimer */}
          {filteredGames.length > 0 && (
            <div className="text-center mt-8 space-y-2">
              <p className="text-sm text-muted-foreground">
                Showing {filteredGames.length} of {games.length} high-interest games
              </p>
              <p className="text-xs text-muted-foreground italic">
                Based on publicly available schedules and general popularity signals. Data refreshed twice daily.
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />

      <GameParlayBar
        selectedGames={parlayGames}
        onRemoveGame={removeParlayGame}
        onClearAll={clearParlayGames}
      />
    </div>
  );
};

export default Games;
