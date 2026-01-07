import { useState, useMemo, useCallback } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { LiveDataBanner } from '@/components/LiveDataBanner';
import { LiveGameCard } from '@/components/LiveGameCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Calendar, Filter, X, TrendingUp, Info, RefreshCw, Wifi, Loader2 } from 'lucide-react';
import { useLiveGames } from '@/hooks/useLiveGames';
import { LiveGame, calculateLiveBetQualification } from '@/lib/liveTypes';
import { BettingChatBot } from '@/components/BettingChatBot';

type DateRange = 'today' | 'tomorrow' | 'next24h' | 'next7d' | 'nextMonth';
type BetSignal = 'GOOD' | 'BORDERLINE' | 'PASS';

const Games = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>('next7d');
  const [selectedSignal, setSelectedSignal] = useState<BetSignal | null>(null);

  // Fetch live games from API
  const { games, isLoading, error, lastUpdated, remainingRequests, refetch } = useLiveGames();

  const hasLiveData = games.length > 0 && !error;

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

  // Get unique sports from live data
  const availableSports = useMemo(() => {
    const sports = new Set(games.map(g => g.sport));
    return Array.from(sports).sort();
  }, [games]);

  // Filter games by date range
  const gamesInDateRange = useMemo(() => {
    const bounds = getDateBounds(dateRange);
    return games.filter(game => {
      const gameDate = new Date(game.startTime);
      return gameDate >= bounds.start && gameDate < bounds.end;
    });
  }, [games, dateRange, getDateBounds]);

  // Count games per sport
  const sportCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    availableSports.forEach(sport => {
      counts[sport] = gamesInDateRange.filter(g => g.sport === sport).length;
    });
    return counts;
  }, [gamesInDateRange, availableSports]);

  // Calculate stats
  const qualifiedStats = useMemo(() => {
    const gamesForStats = selectedSport 
      ? gamesInDateRange.filter(g => g.sport === selectedSport)
      : gamesInDateRange;
    
    const qualifications = gamesForStats.map(g => calculateLiveBetQualification(g));
    const good = qualifications.filter(q => q.signal === 'GOOD').length;
    const borderline = qualifications.filter(q => q.signal === 'BORDERLINE').length;
    const pass = qualifications.filter(q => q.signal === 'PASS').length;
    
    return { good, borderline, pass, total: gamesForStats.length };
  }, [gamesInDateRange, selectedSport]);

  // Filter and sort games
  const filteredAndSortedGames = useMemo(() => {
    const filtered = gamesInDateRange.filter(game => {
      const matchesSearch = searchQuery === '' || 
        game.homeTeam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.awayTeam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.homeTeam.abbreviation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.awayTeam.abbreviation.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSport = !selectedSport || game.sport === selectedSport;
      const matchesSignal = !selectedSignal || calculateLiveBetQualification(game).signal === selectedSignal;

      return matchesSearch && matchesSport && matchesSignal;
    });

    // Sort by bet signal priority, then by start time
    return filtered.sort((a, b) => {
      const qualA = calculateLiveBetQualification(a);
      const qualB = calculateLiveBetQualification(b);
      const signalOrder = { 'GOOD': 0, 'BORDERLINE': 1, 'PASS': 2 };
      const signalDiff = signalOrder[qualA.signal] - signalOrder[qualB.signal];
      if (signalDiff !== 0) return signalDiff;
      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    });
  }, [gamesInDateRange, searchQuery, selectedSport, selectedSignal]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedSport(null);
    setDateRange('next7d');
    setSelectedSignal(null);
  };

  const hasActiveFilters = searchQuery || selectedSport || selectedSignal || dateRange !== 'next7d';

  const dateRangeOptions: { value: DateRange; label: string }[] = [
    { value: 'today', label: 'Today' },
    { value: 'tomorrow', label: 'Tomorrow' },
    { value: 'next24h', label: 'Next 24h' },
    { value: 'next7d', label: 'Next 7 days' },
    { value: 'nextMonth', label: 'Next Month' },
  ];

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
      <LiveDataBanner 
        isLive={hasLiveData}
        lastUpdated={lastUpdated}
        remainingRequests={remainingRequests}
        isLoading={isLoading}
        onRefresh={refetch}
        error={error}
      />
      <Header />
      
      <main className="flex-1 py-8">
        <div className="container">
          {/* Live Data Indicator */}
          {hasLiveData && (
            <div className="mb-4 flex items-center gap-2 text-sm text-emerald-400">
              <Wifi className="h-4 w-4" />
              <span>Live data: {games.length} games from SportsGameOdds API</span>
            </div>
          )}
          
          {/* Page Header */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Live Games</h1>
              <p className="text-muted-foreground">
                Real-time odds and win rates. Games sorted by bet quality — GOOD bets shown first.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <span>Updated {formatLastUpdated(lastUpdated)}</span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => refetch(true)}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
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
              <span>Based on real win rates and live odds. Only GOOD and BORDERLINE are recommended bets.</span>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="space-y-4 mb-8">
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

            {/* Sport Filter */}
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mr-2">
                <Filter className="h-4 w-4" />
                <span>Sport:</span>
              </div>
              
              <Badge
                variant={selectedSport === null ? 'default' : 'outline'}
                className="cursor-pointer hover:bg-primary/20 transition-colors"
                onClick={() => setSelectedSport(null)}
              >
                All Sports ({gamesInDateRange.length})
              </Badge>

              {availableSports.map(sport => {
                const count = sportCounts[sport] || 0;
                return (
                  <Badge
                    key={sport}
                    variant={selectedSport === sport ? 'default' : 'outline'}
                    className="cursor-pointer hover:bg-primary/20 transition-colors"
                    onClick={() => setSelectedSport(selectedSport === sport ? null : sport)}
                  >
                    {sport} ({count})
                  </Badge>
                );
              })}

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 px-2 ml-2">
                  <X className="h-3 w-3 mr-1" />
                  Clear all
                </Button>
              )}
            </div>
          </div>

          {/* Loading State */}
          {isLoading && games.length === 0 && (
            <div className="text-center py-16">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Loading live games...</p>
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
              <Button onClick={() => refetch(true)}>Try Again</Button>
            </div>
          )}

          {/* Results */}
          {!isLoading && !error && filteredAndSortedGames.length === 0 && (
            <div className="text-center py-16">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No games found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your filters or expand the date range.
              </p>
              {hasActiveFilters && (
                <Button variant="outline" onClick={clearFilters}>
                  Clear all filters
                </Button>
              )}
            </div>
          )}

          {filteredAndSortedGames.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedGames.map((game, index) => (
                <div key={game.id} className="animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                  <LiveGameCard game={game} />
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
      <BettingChatBot />
    </div>
  );
};

export default Games;
