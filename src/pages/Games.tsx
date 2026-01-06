import { useState, useMemo, useCallback, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { LiveDataBanner } from '@/components/LiveDataBanner';
import { GameCard } from '@/components/GameCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { mockGames, getGameFacts, Game } from '@/lib/mockData';
import { Search, Calendar, Filter, X, TrendingUp, Info, RefreshCw, Clock, Wifi } from 'lucide-react';
import { calculateBetQualification, sortGamesBySignal, BetSignal } from '@/lib/betQualification';
import { SPORT_CONFIGS, getSportConfig, formatSurfacedRange, getSportPriority } from '@/lib/sportConfig';
import { BettingChatBot } from '@/components/BettingChatBot';
import { useOddsAPI, LiveGame } from '@/hooks/useOddsAPI';

type DateRange = 'today' | 'tomorrow' | 'next24h' | 'next7d' | 'nextMonth';

const Games = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState<string | null>(null); // null = All Sports
  const [dateRange, setDateRange] = useState<DateRange>('next24h');
  const [selectedSignal, setSelectedSignal] = useState<BetSignal | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // All sports from config, sorted by priority (always show all)
  const allSports = useMemo(() => {
    return SPORT_CONFIGS.filter(s => s.active).sort((a, b) => a.priority - b.priority);
  }, []);

  // Get date range boundaries
  const getDateBounds = useCallback((range: DateRange) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
    const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const next7d = new Date(today);
    next7d.setDate(next7d.getDate() + 7);
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    switch (range) {
      case 'today':
        return { start: today, end: tomorrow };
      case 'tomorrow':
        return { start: tomorrow, end: dayAfterTomorrow };
      case 'next24h':
        return { start: now, end: next24h };
      case 'next7d':
        return { start: today, end: next7d };
      case 'nextMonth':
        return { start: today, end: nextMonth };
    }
  }, []);

  // Helper to get qualification for a game
  const getQualification = useMemo(() => {
    return (game: typeof mockGames[0]) => {
      const facts = getGameFacts(game.id);
      if (!facts) {
        return {
          signal: 'NEUTRAL' as BetSignal,
          edge: 0,
          confidence: 0,
          modelProbability: 50,
          impliedProbability: 50,
          volatility: 'Medium' as const,
          injuryUncertainty: 'Low' as const,
          reason: 'Data unavailable',
        };
      }
      return calculateBetQualification({
        game: facts.game,
        odds: facts.odds ?? undefined, // Pass undefined if null for proper NEUTRAL handling
        injuries: facts.injuries,
        risk: facts.risk,
        homeLast5: facts.recentForm.homeLast5,
        awayLast5: facts.recentForm.awayLast5,
      });
    };
  }, []);

  // Filter games by date range first
  const gamesInDateRange = useMemo(() => {
    const bounds = getDateBounds(dateRange);
    return mockGames.filter(game => {
      const gameDate = new Date(game.startTime);
      return gameDate >= bounds.start && gameDate < bounds.end;
    });
  }, [dateRange, getDateBounds]);

  // Count games per sport (within date range)
  const sportCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allSports.forEach(sport => {
      counts[sport.id] = gamesInDateRange.filter(g => g.sport === sport.id).length;
    });
    return counts;
  }, [gamesInDateRange, allSports]);

  // Calculate stats based on current filters (sport + date range)
  // TOTAL = GOOD + BORDERLINE + PASS (no NEUTRAL in UI)
  const qualifiedStats = useMemo(() => {
    const gamesForStats = selectedSport 
      ? gamesInDateRange.filter(g => g.sport === selectedSport)
      : gamesInDateRange;
    
    const qualifications = gamesForStats.map(g => getQualification(g));
    const good = qualifications.filter(q => q.signal === 'GOOD').length;
    const borderline = qualifications.filter(q => q.signal === 'BORDERLINE').length;
    const pass = qualifications.filter(q => q.signal === 'PASS' || q.signal === 'NEUTRAL').length;
    
    return { good, borderline, pass, total: gamesForStats.length };
  }, [gamesInDateRange, selectedSport, getQualification]);

  const filteredAndSortedGames = useMemo(() => {
    const filtered = gamesInDateRange.filter(game => {
      const matchesSearch = searchQuery === '' || 
        game.homeTeam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.awayTeam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.homeTeam.abbreviation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.awayTeam.abbreviation.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSport = !selectedSport || game.sport === selectedSport;
      const matchesSignal = !selectedSignal || getQualification(game).signal === selectedSignal;

      return matchesSearch && matchesSport && matchesSignal;
    });

    // Sort by bet signal priority (GOOD first, then BORDERLINE, then PASS/NEUTRAL)
    // Then by sport priority
    return filtered.sort((a, b) => {
      const qualA = getQualification(a);
      const qualB = getQualification(b);
      const signalOrder = { 'GOOD': 0, 'BORDERLINE': 1, 'PASS': 2, 'NEUTRAL': 3 };
      const signalDiff = signalOrder[qualA.signal] - signalOrder[qualB.signal];
      if (signalDiff !== 0) return signalDiff;
      return getSportPriority(a.sport) - getSportPriority(b.sport);
    });
  }, [gamesInDateRange, searchQuery, selectedSport, selectedSignal, getQualification]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    // Simulate refresh delay
    setTimeout(() => {
      setLastUpdated(new Date());
      setIsRefreshing(false);
    }, 500);
  }, []);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedSport(null);
    setDateRange('next24h');
    setSelectedSignal(null);
  };

  const hasActiveFilters = searchQuery || selectedSport || selectedSignal || dateRange !== 'next24h';

  const dateRangeOptions: { value: DateRange; label: string }[] = [
    { value: 'today', label: 'Today' },
    { value: 'tomorrow', label: 'Tomorrow' },
    { value: 'next24h', label: 'Next 24h' },
    { value: 'next7d', label: 'Next 7 days' },
    { value: 'nextMonth', label: 'Next Month' },
  ];

  const formatLastUpdated = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Fetch live odds data
  const { 
    games: liveGames, 
    isLoading: isLoadingOdds, 
    error: oddsError, 
    lastUpdated: oddsLastUpdated,
    remainingRequests,
    refetch: refetchOdds 
  } = useOddsAPI(selectedSport || 'nba');

  const hasLiveData = liveGames.length > 0 && !oddsError;

  return (
    <div className="min-h-screen flex flex-col">
      <LiveDataBanner 
        isLive={hasLiveData}
        lastUpdated={oddsLastUpdated}
        remainingRequests={remainingRequests}
        isLoading={isLoadingOdds}
        onRefresh={refetchOdds}
        error={oddsError}
      />
      <Header />
      
      <main className="flex-1 py-8">
        <div className="container">
          {/* Live Data Indicator */}
          {hasLiveData && (
            <div className="mb-4 flex items-center gap-2 text-sm text-emerald-400">
              <Wifi className="h-4 w-4" />
              <span>Showing {liveGames.length} live games from The Odds API</span>
            </div>
          )}
          
          {/* Page Header with Refresh */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Upcoming Games</h1>
              <p className="text-muted-foreground">
                Search and explore matchups. Games sorted by bet quality — GOOD bets shown first.
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
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Qualified Picks Summary */}
          <div className="mb-6 p-4 rounded-lg bg-card border border-border">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Bet Signal Summary</h2>
              <span className="text-xs text-muted-foreground ml-auto">
                {selectedSport || 'All Sports'} • {dateRangeOptions.find(d => d.value === dateRange)?.label}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              <button 
                onClick={() => setSelectedSignal(selectedSignal === 'GOOD' ? null : 'GOOD')}
                className={`p-3 rounded-lg transition-colors ${selectedSignal === 'GOOD' ? 'ring-2 ring-emerald-500' : ''} bg-emerald-500/10 hover:bg-emerald-500/20`}
              >
                <div className="text-2xl font-bold text-emerald-400">{qualifiedStats.good}</div>
                <div className="text-xs text-emerald-400/80">GOOD</div>
              </button>
              <button 
                onClick={() => setSelectedSignal(selectedSignal === 'BORDERLINE' ? null : 'BORDERLINE')}
                className={`p-3 rounded-lg transition-colors ${selectedSignal === 'BORDERLINE' ? 'ring-2 ring-amber-500' : ''} bg-amber-500/10 hover:bg-amber-500/20`}
              >
                <div className="text-2xl font-bold text-amber-400">{qualifiedStats.borderline}</div>
                <div className="text-xs text-amber-400/80">BORDERLINE</div>
              </button>
              <button 
                onClick={() => setSelectedSignal(selectedSignal === 'PASS' ? null : 'PASS')}
                className={`p-3 rounded-lg transition-colors ${selectedSignal === 'PASS' ? 'ring-2 ring-red-500' : ''} bg-red-500/10 hover:bg-red-500/20`}
              >
                <div className="text-2xl font-bold text-red-400">{qualifiedStats.pass}</div>
                <div className="text-xs text-red-400/80">PASS</div>
              </button>
              <div className="p-3 rounded-lg bg-muted/30">
                <div className="text-2xl font-bold text-muted-foreground">{qualifiedStats.total}</div>
                <div className="text-xs text-muted-foreground">TOTAL</div>
              </div>
            </div>
            <div className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
              <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>GOOD + BORDERLINE + PASS = TOTAL. Only GOOD and BORDERLINE are recommended bets.</span>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="space-y-4 mb-8">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by team name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 bg-card border-border"
              />
            </div>

            {/* Date Range Chips */}
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mr-2">
                <Calendar className="h-4 w-4" />
                <span>Date:</span>
              </div>
              {dateRangeOptions.map(option => (
                <Badge
                  key={option.value}
                  variant={dateRange === option.value ? 'default' : 'outline'}
                  className="cursor-pointer hover:bg-primary/20 transition-colors"
                  onClick={() => setDateRange(option.value)}
                >
                  {option.label}
                </Badge>
              ))}
            </div>

            {/* Sport Filter - ALL sports, sorted by priority */}
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mr-2">
                <Filter className="h-4 w-4" />
                <span>Sport:</span>
              </div>
              
              {/* All Sports option */}
              <Badge
                variant={selectedSport === null ? 'default' : 'outline'}
                className="cursor-pointer hover:bg-primary/20 transition-colors"
                onClick={() => setSelectedSport(null)}
              >
                All Sports ({gamesInDateRange.length})
              </Badge>

              {allSports.map(sport => {
                const count = sportCounts[sport.id] || 0;
                const isDisabled = count === 0;
                return (
                  <Badge
                    key={sport.id}
                    variant={selectedSport === sport.id ? 'default' : 'outline'}
                    className={`cursor-pointer transition-colors ${
                      isDisabled 
                        ? 'opacity-50 cursor-not-allowed hover:bg-transparent' 
                        : 'hover:bg-primary/20'
                    }`}
                    onClick={() => !isDisabled && setSelectedSport(selectedSport === sport.id ? null : sport.id)}
                    title={`${sport.coverage.description} • ${formatSurfacedRange(sport)}`}
                  >
                    {sport.shortName} ({count})
                  </Badge>
                );
              })}

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 px-2 ml-2">
                  <X className="h-3 w-3 mr-1" />
                  Clear all
                </Button>
              )}
            </div>
          </div>

          {/* Results */}
          {filteredAndSortedGames.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No games found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search or filters, or expand the date range.
              </p>
              {hasActiveFilters && (
                <Button variant="outline" onClick={clearFilters}>
                  Clear all filters
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedGames.map((game, index) => (
                <div key={game.id} className="animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                  <GameCard game={game} />
                </div>
              ))}
            </div>
          )}

          {/* Results Count */}
          {filteredAndSortedGames.length > 0 && (
            <p className="text-center text-sm text-muted-foreground mt-8">
              Showing {filteredAndSortedGames.length} of {qualifiedStats.total} games
              {selectedSignal && ` (filtered by ${selectedSignal})`}
            </p>
          )}
        </div>
      </main>

      <Footer />
      
      {/* AI Betting Chatbot - no game context for general questions */}
      <BettingChatBot />
    </div>
  );
};

export default Games;
