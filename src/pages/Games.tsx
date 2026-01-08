import { useState, useMemo, useCallback } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { PopularGameCard } from '@/components/PopularGameCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Calendar, Filter, X, Star, Info, RefreshCw, Loader2 } from 'lucide-react';
import { usePopularGames, PopularGame } from '@/hooks/usePopularGames';
import { BettingChatBot } from '@/components/BettingChatBot';

const Games = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [selectedLeague, setSelectedLeague] = useState<string | null>(null);

  // Fetch popular games from scraper
  const { games, isLoading, error, lastUpdated, source, refetch } = usePopularGames();

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

  // Filter games
  const filteredGames = useMemo(() => {
    return games.filter(game => {
      const matchesSearch = searchQuery === '' || 
        game.homeTeam.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.awayTeam.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.league.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSport = !selectedSport || game.sport === selectedSport;
      const matchesLeague = !selectedLeague || game.league === selectedLeague;

      return matchesSearch && matchesSport && matchesLeague;
    });
  }, [games, searchQuery, selectedSport, selectedLeague]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedSport(null);
    setSelectedLeague(null);
  };

  const hasActiveFilters = searchQuery || selectedSport || selectedLeague;

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
              <div className="flex items-center gap-2 mb-2">
                <Star className="h-6 w-6 text-amber-400" />
                <h1 className="text-3xl font-bold">High-Interest Games</h1>
              </div>
              <p className="text-muted-foreground">
                Top 15 popular games based on publicly available schedules and general popularity signals.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <span>Updated {formatLastUpdated(lastUpdated)}</span>
                {source && <Badge variant="outline" className="text-xs">{source}</Badge>}
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

          {/* Disclaimer Banner */}
          <div className="mb-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-400 mb-1">Schedule Information Only</h3>
                <p className="text-sm text-muted-foreground">
                  This page displays game schedules based on publicly available information and general popularity signals. 
                  No odds, spreads, totals, or betting data is shown. Games are ranked by league importance, 
                  team prominence, and event significance.
                </p>
              </div>
            </div>
          </div>

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
      <BettingChatBot />
    </div>
  );
};

export default Games;
