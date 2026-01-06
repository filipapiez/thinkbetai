import { useState, useMemo } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { MockDataBanner } from '@/components/MockDataBanner';
import { GameCard } from '@/components/GameCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { mockGames } from '@/lib/mockData';
import { Search, Calendar, Filter, X } from 'lucide-react';

const Games = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const sports = ['NBA', 'NFL', 'Tennis', 'Table Tennis', 'Soccer', 'MLB', 'NHL'];
  
  const dates = useMemo(() => {
    const uniqueDates = [...new Set(mockGames.map(g => {
      const date = new Date(g.startTime);
      return date.toISOString().split('T')[0];
    }))];
    return uniqueDates.sort();
  }, []);

  const filteredGames = useMemo(() => {
    return mockGames.filter(game => {
      const matchesSearch = searchQuery === '' || 
        game.homeTeam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.awayTeam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.homeTeam.abbreviation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.awayTeam.abbreviation.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSport = !selectedSport || game.sport === selectedSport;

      const matchesDate = !selectedDate || 
        new Date(game.startTime).toISOString().split('T')[0] === selectedDate;

      return matchesSearch && matchesSport && matchesDate;
    });
  }, [searchQuery, selectedSport, selectedDate]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedSport(null);
    setSelectedDate(null);
  };

  const hasActiveFilters = searchQuery || selectedSport || selectedDate;

  const formatDateLabel = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <MockDataBanner />
      <Header />
      
      <main className="flex-1 py-8">
        <div className="container">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Upcoming Games</h1>
            <p className="text-muted-foreground">
              Search and explore matchups with detailed odds and injury information.
            </p>
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

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mr-2">
                <Filter className="h-4 w-4" />
                <span>Filter:</span>
              </div>

              {/* Sport Filter */}
              {sports.map(sport => (
                <Badge
                  key={sport}
                  variant={selectedSport === sport ? 'default' : 'outline'}
                  className="cursor-pointer hover:bg-primary/20 transition-colors"
                  onClick={() => setSelectedSport(selectedSport === sport ? null : sport)}
                >
                  {sport}
                </Badge>
              ))}

              <span className="text-border">|</span>

              {/* Date Filter */}
              {dates.map(date => (
                <Badge
                  key={date}
                  variant={selectedDate === date ? 'default' : 'outline'}
                  className="cursor-pointer hover:bg-primary/20 transition-colors"
                  onClick={() => setSelectedDate(selectedDate === date ? null : date)}
                >
                  <Calendar className="h-3 w-3 mr-1" />
                  {formatDateLabel(date)}
                </Badge>
              ))}

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 px-2">
                  <X className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Results */}
          {filteredGames.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No games found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search or filters.
              </p>
              {hasActiveFilters && (
                <Button variant="outline" onClick={clearFilters}>
                  Clear all filters
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGames.map((game, index) => (
                <div key={game.id} className="animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                  <GameCard game={game} />
                </div>
              ))}
            </div>
          )}

          {/* Results Count */}
          {filteredGames.length > 0 && (
            <p className="text-center text-sm text-muted-foreground mt-8">
              Showing {filteredGames.length} of {mockGames.length} games
            </p>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Games;
