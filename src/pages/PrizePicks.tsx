import { useState, useMemo } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Search, RefreshCw, Clock, Filter, TrendingUp, ChevronUp, ChevronDown, Zap, Info, X } from 'lucide-react';
import { usePrizePicks, PrizePickProjection } from '@/hooks/usePrizePicks';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

const PrizePicks = () => {
  const { isSubscribed } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [selectedStat, setSelectedStat] = useState<string | null>(null);

  const { projections, leagues, isLoading, lastUpdated, refetch } = usePrizePicks();

  // Get unique sports from projections
  const availableSports = useMemo(() => {
    const sports = new Set(projections.map(p => p.league?.name || p.sport).filter(Boolean));
    return Array.from(sports).sort();
  }, [projections]);

  // Get unique stat types
  const availableStats = useMemo(() => {
    const filtered = selectedSport
      ? projections.filter(p => (p.league?.name || p.sport) === selectedSport)
      : projections;
    const stats = new Set(filtered.map(p => p.statType).filter(Boolean));
    return Array.from(stats).sort();
  }, [projections, selectedSport]);

  // Sport counts
  const sportCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    availableSports.forEach(sport => {
      counts[sport] = projections.filter(p => (p.league?.name || p.sport) === sport).length;
    });
    return counts;
  }, [projections, availableSports]);

  // Filter projections
  const filteredProjections = useMemo(() => {
    return projections.filter(p => {
      const matchesSearch = searchQuery === '' ||
        p.player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.player.team.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.statType.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSport = !selectedSport || (p.league?.name || p.sport) === selectedSport;
      const matchesStat = !selectedStat || p.statType === selectedStat;
      return matchesSearch && matchesSport && matchesStat;
    });
  }, [projections, searchQuery, selectedSport, selectedStat]);

  // Group by game description
  const groupedProjections = useMemo(() => {
    const groups: Record<string, PrizePickProjection[]> = {};
    filteredProjections.forEach(p => {
      const key = p.description || 'Other';
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    });
    return groups;
  }, [filteredProjections]);

  const hasActiveFilters = searchQuery || selectedSport || selectedStat;

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedSport(null);
    setSelectedStat(null);
  };

  const formatLastUpdated = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title="PrizePicks Projections - AI Best Bets"
        description="Browse PrizePicks player projections with AI-powered analysis. Find the best More/Less picks across NBA, NFL, MLB, NHL and more."
        keywords="prizepicks, player props, over under, more less, AI picks, projections"
        url="/prizepicks"
      />
      <Header />

      <main className="flex-1 py-8">
        <div className="container">
          {/* Page Header */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">PrizePicks</h1>
                <Badge variant="secondary" className="text-xs">
                  <Zap className="h-3 w-3 mr-1" /> Live Projections
                </Badge>
              </div>
              <p className="text-muted-foreground">
                Browse player projections and find the best More/Less picks.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Updated {formatLastUpdated(lastUpdated)}</span>
              </div>
              <Button variant="outline" size="sm" onClick={refetch} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Summary Card */}
          <Card className="mb-6 bg-card border-border">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Projection Summary</h3>
                </div>
                <span className="text-sm text-muted-foreground">
                  {selectedSport || 'All Sports'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-lg text-center bg-primary/10 border border-primary/30">
                  <div className="text-2xl font-bold text-primary">{filteredProjections.length}</div>
                  <div className="text-xs text-muted-foreground">Props</div>
                </div>
                <div className="p-3 rounded-lg text-center bg-muted/30 border border-border">
                  <div className="text-2xl font-bold">{availableSports.length}</div>
                  <div className="text-xs text-muted-foreground">Sports</div>
                </div>
                <div className="p-3 rounded-lg text-center bg-muted/30 border border-border">
                  <div className="text-2xl font-bold">{Object.keys(groupedProjections).length}</div>
                  <div className="text-xs text-muted-foreground">Games</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Search & Filters */}
          <div className="space-y-4 mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by player, team, or stat..."
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
                  onClick={() => { setSelectedSport(null); setSelectedStat(null); }}
                >
                  All ({projections.length})
                </Badge>
                {availableSports.map(sport => (
                  <Badge
                    key={sport}
                    variant={selectedSport === sport ? 'default' : 'outline'}
                    className="cursor-pointer hover:bg-primary/20 transition-colors shrink-0"
                    onClick={() => { setSelectedSport(sport === selectedSport ? null : sport); setSelectedStat(null); }}
                  >
                    {sport} ({sportCounts[sport] || 0})
                  </Badge>
                ))}
              </div>
            </div>

            {/* Stat Type Filter */}
            {availableStats.length > 1 && (
              <div className="overflow-x-auto -mx-4 px-4 pb-2">
                <div className="flex gap-2 min-w-max">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground mr-2 shrink-0">
                    <Filter className="h-4 w-4" />
                    <span>Stat:</span>
                  </div>
                  <Badge
                    variant={selectedStat === null ? 'default' : 'outline'}
                    className="cursor-pointer hover:bg-primary/20 transition-colors shrink-0"
                    onClick={() => setSelectedStat(null)}
                  >
                    All
                  </Badge>
                  {availableStats.map(stat => (
                    <Badge
                      key={stat}
                      variant={selectedStat === stat ? 'default' : 'outline'}
                      className="cursor-pointer hover:bg-primary/20 transition-colors shrink-0"
                      onClick={() => setSelectedStat(stat === selectedStat ? null : stat)}
                    >
                      {stat}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                <X className="h-4 w-4 mr-1" /> Clear filters
              </Button>
            )}
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 9 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <CardContent className="p-4">
                    <Skeleton className="h-6 w-3/4 mb-3" />
                    <Skeleton className="h-10 w-1/2 mb-3" />
                    <Skeleton className="h-8 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* No Results */}
          {!isLoading && filteredProjections.length === 0 && (
            <Card className="border-border">
              <CardContent className="p-12 text-center">
                <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Projections Available</h3>
                <p className="text-muted-foreground mb-4">
                  {hasActiveFilters
                    ? 'No projections match your filters. Try adjusting your search.'
                    : 'PrizePicks projections may not be available right now. Check back later.'}
                </p>
                {hasActiveFilters && (
                  <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Projections Grid - Grouped by Game */}
          {!isLoading && Object.entries(groupedProjections).map(([game, props]) => (
            <div key={game} className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-lg font-semibold">{game}</h2>
                <Badge variant="outline" className="text-xs">{props.length} props</Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {props.map((proj) => (
                  <PropCard key={proj.id} projection={proj} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
};

function PropCard({ projection }: { projection: PrizePickProjection }) {
  const p = projection;

  return (
    <Card className="overflow-hidden border-border hover:border-primary/50 transition-all group">
      <CardContent className="p-4">
        {/* Player Info */}
        <div className="flex items-center gap-3 mb-3">
          {p.player.imageUrl ? (
            <img
              src={p.player.imageUrl}
              alt={p.player.name}
              className="h-10 w-10 rounded-full object-cover bg-muted"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
              {p.player.name.charAt(0)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm truncate">{p.player.name}</div>
            <div className="text-xs text-muted-foreground truncate">
              {p.player.position && `${p.player.position} • `}{p.player.team}
            </div>
          </div>
          {p.isPromo && (
            <Badge variant="secondary" className="text-xs bg-amber-500/20 text-amber-400 shrink-0">
              <Zap className="h-3 w-3 mr-0.5" /> Promo
            </Badge>
          )}
        </div>

        {/* Stat & Line */}
        <div className="mb-3">
          <div className="text-xs text-muted-foreground mb-1">{p.statType}</div>
          <div className="text-2xl font-bold">
            {p.flashSaleLine != null ? (
              <span>
                <span className="line-through text-muted-foreground text-lg mr-2">{p.lineScore}</span>
                <span className="text-amber-400">{p.flashSaleLine}</span>
              </span>
            ) : (
              p.lineScore
            )}
          </div>
        </div>

        {/* More / Less Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors text-emerald-400 font-semibold text-sm">
            <ChevronUp className="h-4 w-4" />
            More
          </button>
          <button className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 transition-colors text-red-400 font-semibold text-sm">
            <ChevronDown className="h-4 w-4" />
            Less
          </button>
        </div>

        {/* Game Time */}
        {p.gameTime && (
          <div className="mt-2 text-xs text-muted-foreground text-center">
            {new Date(p.gameTime).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default PrizePicks;
