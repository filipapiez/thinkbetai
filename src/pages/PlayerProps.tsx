import { useState, useMemo } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { PlayerPropCard } from '@/components/PlayerPropCard';
import { usePlayerProps } from '@/hooks/usePlayerProps';
import { useWinRate } from '@/hooks/useWinRate';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Search, RefreshCw, Clock, Filter, TrendingUp, X, Loader2, TrendingDown } from 'lucide-react';
import { SEO } from '@/components/SEO';

const SPORT_FILTERS = [
  { value: 'all', label: 'All Sports' },
  { value: 'basketball', label: 'NBA' },
  { value: 'football', label: 'NFL' },
  { value: 'baseball', label: 'MLB' },
  { value: 'hockey', label: 'NHL' },
];

const PlayerProps = () => {
  const [sportFilter, setSportFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statFilter, setStatFilter] = useState<string | null>(null);

  const { props, isLoading, error, refetch } = usePlayerProps(sportFilter);
  const { winRate, totalBets, wins, losses, currentStreak } = useWinRate();

  const availableStats = useMemo(
    () => [...new Set(props.map(p => p.statType))].sort(),
    [props]
  );

  const filtered = useMemo(() => {
    return props.filter(p => {
      const matchesSearch =
        !searchQuery ||
        p.playerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.team.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStat = !statFilter || p.statType === statFilter;
      return matchesSearch && matchesStat;
    });
  }, [props, searchQuery, statFilter]);

  // Stats summary
  const totalProps = filtered.length;
  const sportBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach(p => {
      counts[p.league] = (counts[p.league] || 0) + 1;
    });
    return counts;
  }, [filtered]);

  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title="AI Player Props | ThinkBetAI"
        description="Real-time player prop lines with AI-powered edge detection and probability analysis across NBA, NFL, MLB, and NHL."
      />
      <Header />

      <main className="flex-1 py-8">
        <div className="container">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Player Props</h1>
            <p className="text-muted-foreground">
              Real-time prop lines with edge detection across all major sports.
            </p>
          </div>

          {/* Sport filter tabs */}
          <div className="flex flex-wrap gap-2 mb-4">
            {SPORT_FILTERS.map(sf => (
              <Button
                key={sf.value}
                variant={sportFilter === sf.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setSportFilter(sf.value);
                  setStatFilter(null);
                }}
              >
                {sf.label}
              </Button>
            ))}
            <div className="ml-auto flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={refetch} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Search + stat filter */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search player or team..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10 bg-card border-border"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {availableStats.map(stat => (
                <Badge
                  key={stat}
                  variant={statFilter === stat ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setStatFilter(statFilter === stat ? null : stat)}
                >
                  {stat}
                  {statFilter === stat && <X className="h-3 w-3 ml-1" />}
                </Badge>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <Badge variant="secondary" className="text-xs">
              {totalProps} props
            </Badge>
            {Object.entries(sportBreakdown).map(([league, count]) => (
              <Badge key={league} variant="outline" className="text-xs">
                {league}: {count}
              </Badge>
            ))}
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Loading player props...</span>
            </div>
          )}

          {/* Error */}
          {error && !isLoading && (
            <Card className="bg-destructive/10 border-destructive/30">
              <CardContent className="p-6 text-center">
                <p className="text-destructive font-medium">{error}</p>
                <Button variant="outline" size="sm" onClick={refetch} className="mt-3">
                  Try Again
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Props Grid */}
          {!isLoading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(prop => (
                <PlayerPropCard key={prop.id} prop={prop} />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !error && filtered.length === 0 && (
            <div className="text-center py-20 text-muted-foreground">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No player props available</p>
              <p className="text-sm">Try a different sport or check back later.</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PlayerProps;
