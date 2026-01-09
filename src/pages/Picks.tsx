import { useState, useMemo, useCallback } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { PickCard } from '@/components/PickCard';
import { ParlayBuilder } from '@/components/ParlayBuilder';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Search, Filter, X, TrendingUp, TrendingDown, RefreshCw, 
  Loader2, Clock, Target, ChevronDown, Calendar, Flame
} from 'lucide-react';
import { usePicks, type Pick } from '@/hooks/usePicks';
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
  
  // Parlay builder state
  const [parlayPicks, setParlayPicks] = useState<Pick[]>([]);
  const [isParlayOpen, setIsParlayOpen] = useState(false);

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

  // Parlay handlers
  const handleSelectPick = useCallback((pick: Pick) => {
    setParlayPicks(prev => {
      const isAlreadySelected = prev.some(p => p.id === pick.id);
      if (isAlreadySelected) {
        return prev.filter(p => p.id !== pick.id);
      }
      // Max 10 picks in parlay
      if (prev.length >= 10) return prev;
      setIsParlayOpen(true);
      return [...prev, pick];
    });
  }, []);

  const handleRemovePick = useCallback((pickId: string) => {
    setParlayPicks(prev => prev.filter(p => p.id !== pickId));
  }, []);

  const handleClearParlay = useCallback(() => {
    setParlayPicks([]);
  }, []);

  const selectedPickIds = useMemo(() => new Set(parlayPicks.map(p => p.id)), [parlayPicks]);

  // Get today's picks
  const todaysPicks = useMemo(() => {
    return picks.filter(p => p.gameDate === 'Today').sort((a, b) => b.confidence - a.confidence);
  }, [picks]);

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

  // Count picks and win rates per platform
  const platformStats = useMemo(() => {
    const stats: Record<string, { count: number; totalHitRate: number; withHitRate: number }> = {};
    picks.forEach(p => {
      if (!stats[p.platform]) stats[p.platform] = { count: 0, totalHitRate: 0, withHitRate: 0 };
      stats[p.platform].count++;
      if (p.hitRate) {
        stats[p.platform].totalHitRate += p.hitRate;
        stats[p.platform].withHitRate++;
      }
    });
    return stats;
  }, [picks]);

  const platformCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.entries(platformStats).forEach(([platform, stats]) => {
      counts[platform] = stats.count;
    });
    return counts;
  }, [platformStats]);

  // Count picks and win rates per sport
  const sportStats = useMemo(() => {
    const stats: Record<string, { count: number; totalHitRate: number; withHitRate: number }> = {};
    picks.forEach(p => {
      if (!stats[p.sport]) stats[p.sport] = { count: 0, totalHitRate: 0, withHitRate: 0 };
      stats[p.sport].count++;
      if (p.hitRate) {
        stats[p.sport].totalHitRate += p.hitRate;
        stats[p.sport].withHitRate++;
      }
    });
    return stats;
  }, [picks]);

  const sportCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.entries(sportStats).forEach(([sport, stats]) => {
      counts[sport] = stats.count;
    });
    return counts;
  }, [sportStats]);

  const getWinRate = (stats: { totalHitRate: number; withHitRate: number }) => {
    if (stats.withHitRate === 0) return null;
    return Math.round(stats.totalHitRate / stats.withHitRate);
  };

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

          {/* Games Today Section */}
          {todaysPicks.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-2 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-lg px-3 py-1.5">
                  <Flame className="h-5 w-5 text-orange-400" />
                  <h2 className="text-lg font-bold">Games Today</h2>
                </div>
                <Badge variant="secondary" className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                  {todaysPicks.length} picks
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {todaysPicks.slice(0, 8).map((pick) => (
                  <Card 
                    key={pick.id} 
                    className="bg-gradient-to-br from-orange-500/5 to-red-500/5 border-orange-500/20 hover:border-orange-500/40 transition-colors cursor-pointer"
                    onClick={() => handleSelectPick(pick)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <img 
                          src={pick.playerImage} 
                          alt={pick.playerName}
                          className="h-10 w-10 rounded-full object-cover bg-muted"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder.svg';
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{pick.playerName}</p>
                          <p className="text-xs text-muted-foreground">{pick.team} {pick.opponent}</p>
                        </div>
                        {selectedPickIds.has(pick.id) && (
                          <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                            <span className="text-xs text-primary-foreground">✓</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Badge 
                            variant="outline" 
                            className={`text-xs px-1.5 py-0 ${
                              pick.direction === 'MORE' 
                                ? 'border-emerald-500/50 text-emerald-400' 
                                : 'border-red-500/50 text-red-400'
                            }`}
                          >
                            {pick.direction === 'MORE' ? <TrendingUp className="h-3 w-3 mr-0.5" /> : <TrendingDown className="h-3 w-3 mr-0.5" />}
                            {pick.direction}
                          </Badge>
                          <span className="text-xs font-medium">{pick.line} {pick.propType}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">{pick.gameTime}</span>
                          {pick.hitRate && (
                            <Badge variant="secondary" className="text-xs px-1.5 py-0 bg-emerald-500/20 text-emerald-400">
                              {pick.hitRate}%
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {todaysPicks.length > 8 && (
                <div className="text-center mt-3">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedPlatform(null);
                      setSelectedSport(null);
                      setSelectedPropType(null);
                      setSelectedDirection(null);
                    }}
                    className="text-orange-400 hover:text-orange-300"
                  >
                    View all {todaysPicks.length} picks for today
                  </Button>
                </div>
              )}
            </div>
          )}

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
                  {platforms.map(platform => {
                    const stats = platformStats[platform];
                    const winRate = stats ? getWinRate(stats) : null;
                    return (
                      <DropdownMenuItem 
                        key={platform}
                        onClick={() => setSelectedPlatform(platform)}
                        className="flex justify-between"
                      >
                        <span>{platform} ({platformCounts[platform] || 0})</span>
                        {winRate !== null && (
                          <span className="text-xs text-emerald-400 ml-2">{winRate}% WR</span>
                        )}
                      </DropdownMenuItem>
                    );
                  })}
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
                  {availableSports.map(sport => {
                    const stats = sportStats[sport];
                    const winRate = stats ? getWinRate(stats) : null;
                    return (
                      <DropdownMenuItem 
                        key={sport}
                        onClick={() => { setSelectedSport(sport); setSelectedPropType(null); }}
                        className="flex justify-between"
                      >
                        <span>{sport} ({sportCounts[sport] || 0})</span>
                        {winRate !== null && (
                          <span className="text-xs text-emerald-400 ml-2">{winRate}% WR</span>
                        )}
                      </DropdownMenuItem>
                    );
                  })}
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
                  <PickCard 
                    pick={pick} 
                    isSelected={selectedPickIds.has(pick.id)}
                    onSelect={handleSelectPick}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Results Count */}
          {filteredPicks.length > 0 && (
            <div className="text-center mt-8">
              <p className="text-sm text-muted-foreground">
                Showing {filteredPicks.length} of {picks.length} picks
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Parlay Builder */}
      <ParlayBuilder
        selectedPicks={parlayPicks}
        onRemovePick={handleRemovePick}
        onClearAll={handleClearParlay}
        isOpen={isParlayOpen}
        onToggle={() => setIsParlayOpen(!isParlayOpen)}
      />
    </div>
  );
};

export default Picks;
