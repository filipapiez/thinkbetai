import { useState, useMemo } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { PickCard } from '@/components/PickCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Search, Filter, X, TrendingUp, TrendingDown, Info, RefreshCw, 
  Loader2, Clock, Target, ChevronDown 
} from 'lucide-react';
import { usePicks } from '@/hooks/usePicks';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

const Picks = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [selectedPropType, setSelectedPropType] = useState<string | null>(null);
  const [selectedDirection, setSelectedDirection] = useState<'MORE' | 'LESS' | null>(null);

  const { 
    picks, 
    platforms, 
    availableSports, 
    availablePropTypes,
    isLoading, 
    error, 
    lastUpdated, 
    source,
    refetch 
  } = usePicks();

  // Calculate signal counts
  const signalCounts = useMemo(() => {
    const counts = { GOOD: 0, BORDERLINE: 0, PASS: 0, MORE: 0, LESS: 0 };
    picks.forEach(p => {
      const signal = p.confidence >= 75 ? 'GOOD' : p.confidence >= 60 ? 'BORDERLINE' : 'PASS';
      counts[signal]++;
      counts[p.direction]++;
    });
    return counts;
  }, [picks]);

  // Count picks per platform
  const platformCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    picks.forEach(p => {
      counts[p.platform] = (counts[p.platform] || 0) + 1;
    });
    return counts;
  }, [picks]);

  // Count picks per sport
  const sportCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    picks.forEach(p => {
      counts[p.sport] = (counts[p.sport] || 0) + 1;
    });
    return counts;
  }, [picks]);

  // Filter picks
  const filteredPicks = useMemo(() => {
    return picks
      .filter(pick => {
        const matchesSearch = searchQuery === '' ||
          pick.playerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          pick.team.toLowerCase().includes(searchQuery.toLowerCase()) ||
          pick.propType.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesPlatform = !selectedPlatform || pick.platform === selectedPlatform;
        const matchesSport = !selectedSport || pick.sport === selectedSport;
        const matchesPropType = !selectedPropType || pick.propType === selectedPropType;
        const matchesDirection = !selectedDirection || pick.direction === selectedDirection;
        
        return matchesSearch && matchesPlatform && matchesSport && matchesPropType && matchesDirection;
      })
      .sort((a, b) => b.confidence - a.confidence);
  }, [picks, searchQuery, selectedPlatform, selectedSport, selectedPropType, selectedDirection]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedPlatform(null);
    setSelectedSport(null);
    setSelectedPropType(null);
    setSelectedDirection(null);
  };

  const hasActiveFilters = searchQuery || selectedPlatform || selectedSport || selectedPropType || selectedDirection;

  const formatLastUpdated = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Available prop types for selected sport
  const availableProps = useMemo(() => {
    const filtered = selectedSport 
      ? picks.filter(p => p.sport === selectedSport)
      : picks;
    return [...new Set(filtered.map(p => p.propType))].sort();
  }, [picks, selectedSport]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-8">
        <div className="container">
          {/* Page Header */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Player Props & Picks</h1>
              <p className="text-muted-foreground">
                Best picks across PrizePicks, Underdog, and all major DFS platforms.<br className="hidden sm:block" />
                Sorted by confidence — highest first.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Updated {formatLastUpdated(lastUpdated)}</span>
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

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            <Card className="bg-card border-border">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-emerald-400">{signalCounts.GOOD}</div>
                <div className="text-xs text-muted-foreground">GOOD Picks</div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-amber-400">{signalCounts.BORDERLINE}</div>
                <div className="text-xs text-muted-foreground">BORDERLINE</div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-emerald-400">{signalCounts.MORE}</div>
                <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                  <TrendingUp className="h-3 w-3" /> MORE
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-400">{signalCounts.LESS}</div>
                <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                  <TrendingDown className="h-3 w-3" /> LESS
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">{picks.length}</div>
                <div className="text-xs text-muted-foreground">TOTAL</div>
              </CardContent>
            </Card>
          </div>

          {/* Search & Filters */}
          <div className="space-y-4 mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by player, team, or prop type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 bg-card border-border"
              />
            </div>

            {/* Platform Filter with Dropdown */}
            <div className="flex flex-wrap gap-2 items-center">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mr-2">
                <Target className="h-4 w-4" />
                <span>Platform:</span>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1">
                    {selectedPlatform || 'All Platforms'}
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48 bg-popover border-border z-50">
                  <DropdownMenuLabel>Select Platform</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSelectedPlatform(null)}>
                    All Platforms ({picks.length})
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {platforms.map(platform => (
                    <DropdownMenuItem 
                      key={platform}
                      onClick={() => setSelectedPlatform(platform)}
                    >
                      {platform} ({platformCounts[platform] || 0})
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {selectedPlatform && (
                <Badge 
                  variant="secondary" 
                  className="cursor-pointer"
                  onClick={() => setSelectedPlatform(null)}
                >
                  {selectedPlatform} <X className="h-3 w-3 ml-1" />
                </Badge>
              )}
            </div>

            {/* Sport Filter with Dropdown */}
            <div className="flex flex-wrap gap-2 items-center">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mr-2">
                <Filter className="h-4 w-4" />
                <span>Sport:</span>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1">
                    {selectedSport || 'All Sports'}
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-40 bg-popover border-border z-50">
                  <DropdownMenuLabel>Select Sport</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => { setSelectedSport(null); setSelectedPropType(null); }}>
                    All Sports ({picks.length})
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {availableSports.map(sport => (
                    <DropdownMenuItem 
                      key={sport}
                      onClick={() => { setSelectedSport(sport); setSelectedPropType(null); }}
                    >
                      {sport} ({sportCounts[sport] || 0})
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {selectedSport && (
                <Badge 
                  variant="secondary" 
                  className="cursor-pointer"
                  onClick={() => { setSelectedSport(null); setSelectedPropType(null); }}
                >
                  {selectedSport} <X className="h-3 w-3 ml-1" />
                </Badge>
              )}
            </div>

            {/* Prop Type Filter (shows when sport selected) */}
            {selectedSport && availableProps.length > 1 && (
              <div className="flex flex-wrap gap-2 items-center">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground mr-2 ml-6">
                  <span>Prop:</span>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1">
                      {selectedPropType || 'All Props'}
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48 bg-popover border-border z-50">
                    <DropdownMenuLabel>Select Prop Type</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setSelectedPropType(null)}>
                      All Props
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {availableProps.map(prop => (
                      <DropdownMenuItem 
                        key={prop}
                        onClick={() => setSelectedPropType(prop)}
                      >
                        {prop}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {selectedPropType && (
                  <Badge 
                    variant="secondary" 
                    className="cursor-pointer"
                    onClick={() => setSelectedPropType(null)}
                  >
                    {selectedPropType} <X className="h-3 w-3 ml-1" />
                  </Badge>
                )}
              </div>
            )}

            {/* Direction Filter */}
            <div className="flex flex-wrap gap-2 items-center">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mr-2">
                <TrendingUp className="h-4 w-4" />
                <span>Direction:</span>
              </div>
              
              <Badge
                variant={selectedDirection === null ? 'default' : 'outline'}
                className="cursor-pointer hover:bg-primary/20 transition-colors"
                onClick={() => setSelectedDirection(null)}
              >
                All
              </Badge>
              <Badge
                variant={selectedDirection === 'MORE' ? 'default' : 'outline'}
                className="cursor-pointer hover:bg-emerald-500/20 transition-colors"
                onClick={() => setSelectedDirection(selectedDirection === 'MORE' ? null : 'MORE')}
              >
                <TrendingUp className="h-3 w-3 mr-1" /> MORE ({signalCounts.MORE})
              </Badge>
              <Badge
                variant={selectedDirection === 'LESS' ? 'default' : 'outline'}
                className="cursor-pointer hover:bg-red-500/20 transition-colors"
                onClick={() => setSelectedDirection(selectedDirection === 'LESS' ? null : 'LESS')}
              >
                <TrendingDown className="h-3 w-3 mr-1" /> LESS ({signalCounts.LESS})
              </Badge>
            </div>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8">
                <X className="h-3 w-3 mr-1" />
                Clear all filters
              </Button>
            )}
          </div>

          {/* Loading State */}
          {isLoading && picks.length === 0 && (
            <div className="text-center py-16">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Loading picks...</p>
            </div>
          )}

          {/* Error State */}
          {error && picks.length === 0 && (
            <div className="text-center py-16">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 mb-4">
                <X className="h-8 w-8 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Failed to load picks</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={refetch}>Try Again</Button>
            </div>
          )}

          {/* No Results */}
          {!isLoading && !error && filteredPicks.length === 0 && picks.length > 0 && (
            <div className="text-center py-16">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No picks found</h3>
              <p className="text-muted-foreground mb-4">Try adjusting your filters.</p>
              {hasActiveFilters && (
                <Button variant="outline" onClick={clearFilters}>
                  Clear all filters
                </Button>
              )}
            </div>
          )}

          {/* Picks Grid */}
          {filteredPicks.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPicks.map((pick, index) => (
                <div key={pick.id} className="animate-slide-up" style={{ animationDelay: `${index * 30}ms` }}>
                  <PickCard pick={pick} />
                </div>
              ))}
            </div>
          )}

          {/* Results Count & Disclaimer */}
          {filteredPicks.length > 0 && (
            <div className="text-center mt-8 space-y-2">
              <p className="text-sm text-muted-foreground">
                Showing {filteredPicks.length} of {picks.length} picks
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Info className="h-3 w-3" />
                <span>Data sourced from RotoWire. Updated every 15 minutes. For entertainment purposes only.</span>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Picks;
