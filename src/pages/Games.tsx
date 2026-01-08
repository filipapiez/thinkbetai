import { useState, useMemo, useCallback } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { PopularGameCard, calculateBetSignal } from '@/components/PopularGameCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Calendar, Filter, X, TrendingUp, Info, RefreshCw, Loader2, Clock } from 'lucide-react';
import { usePopularGames, PopularGame } from '@/hooks/usePopularGames';


type BetSignal = 'GOOD' | 'BORDERLINE' | 'PASS';

const Games = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [selectedLeague, setSelectedLeague] = useState<string | null>(null);
  const [selectedSignal, setSelectedSignal] = useState<BetSignal | null>(null);

  // Fetch popular games from scraper
  const { games, isLoading, error, lastUpdated, source, refetch } = usePopularGames();

  // Calculate signals for all games
  const gamesWithSignals = useMemo(() => {
    return games.map(game => ({
      game,
      ...calculateBetSignal(game)
    }));
  }, [games]);

  // Signal counts
  const signalCounts = useMemo(() => {
    const counts = { GOOD: 0, BORDERLINE: 0, PASS: 0 };
    gamesWithSignals.forEach(g => counts[g.signal]++);
    return counts;
  }, [gamesWithSignals]);

  // Get unique sports from data
  const availableSports = useMemo(() => {
    const sports = new Set(games.map(g => g.sport));
    return Array.from(sports).sort();
  }, [games]);

  // Get unique leagues from data
  const availableLeagues = useMemo(() => {
    const filteredGames = selectedSport 
      ? games.filter(g => g.sport === selectedSport)
      : games;
    const leagues = new Set(filteredGames.map(g => g.league));
    return Array.from(leagues).sort();
  }, [games, selectedSport]);

  // Count games per sport
  const sportCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    availableSports.forEach(sport => {
      counts[sport] = games.filter(g => g.sport === sport).length;
    });
    return counts;
  }, [games, availableSports]);

  // Filter and sort games by signal (GOOD first, then BORDERLINE, then PASS)
  const filteredGames = useMemo(() => {
    const signalPriority: Record<BetSignal, number> = { GOOD: 0, BORDERLINE: 1, PASS: 2 };
    
    return gamesWithSignals
      .filter(({ game, signal }) => {
        const matchesSearch = searchQuery === '' || 
          game.homeTeam.toLowerCase().includes(searchQuery.toLowerCase()) ||
          game.awayTeam.toLowerCase().includes(searchQuery.toLowerCase()) ||
          game.league.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesSport = !selectedSport || game.sport === selectedSport;
        const matchesLeague = !selectedLeague || game.league === selectedLeague;
        const matchesSignal = !selectedSignal || signal === selectedSignal;

        return matchesSearch && matchesSport && matchesLeague && matchesSignal;
      })
      .sort((a, b) => {
        // Sort by signal priority first, then by confidence
        const priorityDiff = signalPriority[a.signal] - signalPriority[b.signal];
        if (priorityDiff !== 0) return priorityDiff;
        return b.confidence - a.confidence;
      })
      .map(({ game }) => game);
  }, [gamesWithSignals, searchQuery, selectedSport, selectedLeague, selectedSignal]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedSport(null);
    setSelectedLeague(null);
    setSelectedSignal(null);
  };

  const hasActiveFilters = searchQuery || selectedSport || selectedLeague || selectedSignal;

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

          {/* Bet Signal Summary Card */}
          <Card className="mb-6 bg-card border-border">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Bet Signal Summary</h3>
                </div>
                <span className="text-sm text-muted-foreground">
                  {selectedSport || 'All Sports'} • All Time
                </span>
              </div>
              
              <div className="grid grid-cols-4 gap-3 mb-4">
                {/* GOOD */}
                <button
                  onClick={() => setSelectedSignal(selectedSignal === 'GOOD' ? null : 'GOOD')}
                  className={`p-4 rounded-lg text-center transition-all ${
                    selectedSignal === 'GOOD' 
                      ? 'bg-emerald-500/30 border-2 border-emerald-500' 
                      : 'bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20'
                  }`}
                >
                  <div className="text-2xl font-bold text-emerald-400">{signalCounts.GOOD}</div>
                  <div className="text-xs text-emerald-400 font-medium">GOOD</div>
                </button>
                
                {/* BORDERLINE */}
                <button
                  onClick={() => setSelectedSignal(selectedSignal === 'BORDERLINE' ? null : 'BORDERLINE')}
                  className={`p-4 rounded-lg text-center transition-all ${
                    selectedSignal === 'BORDERLINE' 
                      ? 'bg-amber-500/30 border-2 border-amber-500' 
                      : 'bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20'
                  }`}
                >
                  <div className="text-2xl font-bold text-amber-400">{signalCounts.BORDERLINE}</div>
                  <div className="text-xs text-amber-400 font-medium">BORDERLINE</div>
                </button>
                
                {/* PASS */}
                <button
                  onClick={() => setSelectedSignal(selectedSignal === 'PASS' ? null : 'PASS')}
                  className={`p-4 rounded-lg text-center transition-all ${
                    selectedSignal === 'PASS' 
                      ? 'bg-red-500/30 border-2 border-red-500' 
                      : 'bg-red-500/10 border border-red-500/30 hover:bg-red-500/20'
                  }`}
                >
                  <div className="text-2xl font-bold text-red-400">{signalCounts.PASS}</div>
                  <div className="text-xs text-red-400 font-medium">PASS</div>
                </button>
                
                {/* TOTAL */}
                <div className="p-4 rounded-lg text-center bg-muted/30 border border-border">
                  <div className="text-2xl font-bold">{games.length}</div>
                  <div className="text-xs text-muted-foreground font-medium">TOTAL</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Info className="h-4 w-4" />
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
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mr-2">
                <Filter className="h-4 w-4" />
                <span>Sport:</span>
              </div>
              
              <Badge
                variant={selectedSport === null ? 'default' : 'outline'}
                className="cursor-pointer hover:bg-primary/20 transition-colors"
                onClick={() => { setSelectedSport(null); setSelectedLeague(null); }}
              >
                All Sports ({games.length})
              </Badge>

              {availableSports.map(sport => {
                const count = sportCounts[sport] || 0;
                return (
                  <Badge
                    key={sport}
                    variant={selectedSport === sport ? 'default' : 'outline'}
                    className="cursor-pointer hover:bg-primary/20 transition-colors"
                    onClick={() => { 
                      setSelectedSport(selectedSport === sport ? null : sport);
                      setSelectedLeague(null);
                    }}
                  >
                    {sport} ({count})
                  </Badge>
                );
              })}
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
            <div className="text-center py-16">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Loading popular games...</p>
              <p className="text-xs text-muted-foreground mt-2">Fetching schedule data (refreshed twice daily)</p>
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
              {filteredGames.map((game, index) => (
                <div key={game.id} className="animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                  <PopularGameCard game={game} rank={index + 1} />
                </div>
              ))}
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
      
    </div>
  );
};

export default Games;
