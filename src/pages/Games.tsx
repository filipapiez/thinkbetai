import { useState, useMemo } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { MockDataBanner } from '@/components/MockDataBanner';
import { GameCard } from '@/components/GameCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { mockGames, getGameFacts } from '@/lib/mockData';
import { Search, Calendar, Filter, X, TrendingUp, Info } from 'lucide-react';
import { calculateBetQualification, sortGamesBySignal, BetSignal } from '@/lib/betQualification';

const Games = () => {
  // Games page component
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSignal, setSelectedSignal] = useState<BetSignal | null>(null);

  const sports = ['NBA', 'NFL', 'Tennis', 'Table Tennis', 'Soccer', 'MLB', 'NHL'];
  
  const dates = useMemo(() => {
    const uniqueDates = [...new Set(mockGames.map(g => {
      const date = new Date(g.startTime);
      return date.toISOString().split('T')[0];
    }))];
    return uniqueDates.sort();
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
        odds: facts.odds,
        injuries: facts.injuries,
        risk: facts.risk,
        homeLast5: facts.recentForm.homeLast5,
        awayLast5: facts.recentForm.awayLast5,
      });
    };
  }, []);

  const filteredAndSortedGames = useMemo(() => {
    const filtered = mockGames.filter(game => {
      const matchesSearch = searchQuery === '' || 
        game.homeTeam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.awayTeam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.homeTeam.abbreviation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.awayTeam.abbreviation.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSport = !selectedSport || game.sport === selectedSport;

      const matchesDate = !selectedDate || 
        new Date(game.startTime).toISOString().split('T')[0] === selectedDate;

      const matchesSignal = !selectedSignal || getQualification(game).signal === selectedSignal;

      return matchesSearch && matchesSport && matchesDate && matchesSignal;
    });

    // Sort by bet signal priority (GOOD first, then BORDERLINE, then PASS/NEUTRAL)
    return sortGamesBySignal(filtered, getQualification);
  }, [searchQuery, selectedSport, selectedDate, selectedSignal, getQualification]);

  // Calculate stats for qualified picks
  const qualifiedStats = useMemo(() => {
    const all = mockGames.map(g => getQualification(g));
    const good = all.filter(q => q.signal === 'GOOD').length;
    const borderline = all.filter(q => q.signal === 'BORDERLINE').length;
    const pass = all.filter(q => q.signal === 'PASS').length;
    return { good, borderline, pass, total: mockGames.length };
  }, [getQualification]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedSport(null);
    setSelectedDate(null);
    setSelectedSignal(null);
  };

  const hasActiveFilters = searchQuery || selectedSport || selectedDate || selectedSignal;

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
              Search and explore matchups. Games sorted by bet quality — GOOD bets shown first.
            </p>
          </div>

          {/* Qualified Picks Summary */}
          <div className="mb-6 p-4 rounded-lg bg-card border border-border">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Bet Signal Summary</h2>
              <span className="text-xs text-muted-foreground ml-auto">
                Bet less, bet better
              </span>
            </div>
            <div className="grid grid-cols-4 gap-3 text-center">
              <button 
                onClick={() => setSelectedSignal(selectedSignal === 'GOOD' ? null : 'GOOD')}
                className={`p-3 rounded-lg transition-colors ${selectedSignal === 'GOOD' ? 'ring-2 ring-emerald-500' : ''} bg-emerald-500/10 hover:bg-emerald-500/20`}
              >
                <div className="text-2xl font-bold text-emerald-400">{qualifiedStats.good}</div>
                <div className="text-xs text-emerald-400/80">GOOD BETS</div>
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
              <span>Only GOOD bets meet confidence & edge thresholds. PASS = insufficient edge or high uncertainty.</span>
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
          {filteredAndSortedGames.length === 0 ? (
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
              Showing {filteredAndSortedGames.length} of {mockGames.length} games
              {selectedSignal && ` (filtered by ${selectedSignal})`}
            </p>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Games;
