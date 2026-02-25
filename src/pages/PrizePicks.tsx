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
import { Skeleton } from '@/components/ui/skeleton';

const PrizePicks = () => {
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
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="PrizePicks Projections - AI Best Bets"
        description="Browse PrizePicks player projections with AI-powered analysis. Find the best More/Less picks across NBA, NFL, MLB, NHL and more."
        keywords="prizepicks, player props, over under, more less, AI picks, projections"
        url="/prizepicks"
      />
      <Header />

      <main className="flex-1 py-6">
        <div className="container">
          {/* Page Header */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold">PrizePicks Board</h1>
                <Badge variant="secondary" className="text-xs">
                  <Zap className="h-3 w-3 mr-1" /> Live
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Player projections — pick More or Less
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{formatLastUpdated(lastUpdated)}</span>
              </div>
              <Button variant="outline" size="sm" onClick={refetch} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Compact Summary */}
          <div className="flex items-center gap-4 mb-5 text-sm">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="font-semibold">{filteredProjections.length}</span>
              <span className="text-muted-foreground">props</span>
            </div>
            <div className="text-muted-foreground">•</div>
            <div>
              <span className="font-semibold">{availableSports.length}</span>
              <span className="text-muted-foreground ml-1">sports</span>
            </div>
          </div>

          {/* Search */}
          <div className="space-y-3 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search player, team, or stat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 bg-card border-border"
              />
            </div>

            {/* Sport Filter */}
            <div className="overflow-x-auto -mx-4 px-4 pb-1">
              <div className="flex gap-1.5 min-w-max">
                <Badge
                  variant={selectedSport === null ? 'default' : 'outline'}
                  className="cursor-pointer hover:bg-primary/20 transition-colors shrink-0 text-xs"
                  onClick={() => { setSelectedSport(null); setSelectedStat(null); }}
                >
                  All ({projections.length})
                </Badge>
                {availableSports.map(sport => (
                  <Badge
                    key={sport}
                    variant={selectedSport === sport ? 'default' : 'outline'}
                    className="cursor-pointer hover:bg-primary/20 transition-colors shrink-0 text-xs"
                    onClick={() => { setSelectedSport(sport === selectedSport ? null : sport); setSelectedStat(null); }}
                  >
                    {sport} ({sportCounts[sport] || 0})
                  </Badge>
                ))}
              </div>
            </div>

            {/* Stat Filter */}
            {availableStats.length > 1 && (
              <div className="overflow-x-auto -mx-4 px-4 pb-1">
                <div className="flex gap-1.5 min-w-max">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mr-1 shrink-0">
                    <Filter className="h-3 w-3" />
                    Stat:
                  </div>
                  <Badge
                    variant={selectedStat === null ? 'default' : 'outline'}
                    className="cursor-pointer hover:bg-primary/20 transition-colors shrink-0 text-xs"
                    onClick={() => setSelectedStat(null)}
                  >
                    All
                  </Badge>
                  {availableStats.map(stat => (
                    <Badge
                      key={stat}
                      variant={selectedStat === stat ? 'default' : 'outline'}
                      className="cursor-pointer hover:bg-primary/20 transition-colors shrink-0 text-xs"
                      onClick={() => setSelectedStat(stat === selectedStat ? null : stat)}
                    >
                      {stat}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs text-muted-foreground h-7">
                <X className="h-3 w-3 mr-1" /> Clear
              </Button>
            )}
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {Array.from({ length: 12 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-16 mb-3" />
                    <Skeleton className="h-12 w-12 rounded-full mx-auto mb-2" />
                    <Skeleton className="h-4 w-24 mx-auto mb-1" />
                    <Skeleton className="h-3 w-20 mx-auto mb-3" />
                    <Skeleton className="h-6 w-16 mx-auto mb-3" />
                    <Skeleton className="h-9 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && filteredProjections.length === 0 && (
            <Card className="border-border">
              <CardContent className="p-12 text-center">
                <Info className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-lg font-semibold mb-1">No Projections Available</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {hasActiveFilters
                    ? 'No projections match your filters.'
                    : 'PrizePicks projections may not be available right now. Try refreshing.'}
                </p>
                {hasActiveFilters ? (
                  <Button variant="outline" size="sm" onClick={clearFilters}>Clear Filters</Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={refetch}>
                    <RefreshCw className="h-4 w-4 mr-1.5" /> Retry
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Props Grid — PrizePicks style */}
          {!isLoading && filteredProjections.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredProjections.map((proj) => (
                <PropCard key={proj.id} projection={proj} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

function PropCard({ projection: p }: { projection: PrizePickProjection }) {
  return (
    <Card className="overflow-hidden border-border hover:border-primary/40 transition-all">
      <CardContent className="p-0">
        {/* Top bar — game status */}
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-muted/30">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {p.gameTime && (
              <>
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                <span>
                  {new Date(p.gameTime).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  })}
                </span>
              </>
            )}
          </div>
          {p.isPromo && (
            <Badge variant="secondary" className="text-[10px] h-4 px-1 bg-amber-500/20 text-amber-400">
              <Zap className="h-2.5 w-2.5 mr-0.5" />Promo
            </Badge>
          )}
        </div>

        {/* Player */}
        <div className="flex flex-col items-center pt-3 pb-2 px-3">
          {p.player.imageUrl ? (
            <img
              src={p.player.imageUrl}
              alt={p.player.name}
              className="h-14 w-14 rounded-full object-cover bg-muted mb-1.5"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '';
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="h-14 w-14 rounded-full bg-primary/15 flex items-center justify-center text-lg font-bold text-primary mb-1.5">
              {p.player.name.charAt(0)}
            </div>
          )}

          <div className="text-[11px] text-muted-foreground font-medium">
            {p.player.team}{p.player.position ? ` - ${p.player.position}` : ''}
          </div>
          <div className="text-sm font-semibold text-center leading-tight mt-0.5">{p.player.name}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">{p.description}</div>
        </div>

        {/* Line */}
        <div className="text-center pb-2 px-3">
          <div className="flex items-baseline justify-center gap-1">
            {p.flashSaleLine != null ? (
              <>
                <span className="text-sm line-through text-muted-foreground">{p.lineScore}</span>
                <span className="text-2xl font-bold text-amber-400">{p.flashSaleLine}</span>
              </>
            ) : (
              <span className="text-2xl font-bold">{p.lineScore}</span>
            )}
            <span className="text-xs text-muted-foreground ml-1">{p.statType}</span>
          </div>
        </div>

        {/* More / Less buttons */}
        <div className="grid grid-cols-2 border-t border-border">
          <button className="flex items-center justify-center gap-1 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-colors border-r border-border">
            <ChevronDown className="h-4 w-4" />
            Less
          </button>
          <button className="flex items-center justify-center gap-1 py-2.5 text-sm font-semibold text-emerald-400 hover:bg-emerald-500/10 transition-colors">
            <ChevronUp className="h-4 w-4" />
            More
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

export default PrizePicks;
