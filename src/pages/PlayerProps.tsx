import { useState, useMemo } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { PlayerPropCard, SPORTSBOOKS, computeEdge, computePropQuality } from '@/components/PlayerPropCard';
import { gameLogCache } from '@/hooks/usePlayerGameLog';
import { usePlayerProps } from '@/hooks/usePlayerProps';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Search, RefreshCw, TrendingUp, X, Loader2, Lock, Crown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { SEO } from '@/components/SEO';


const SPORT_FILTERS = [
  { value: 'all', label: 'All Sports' },
  { value: 'basketball', label: 'NBA' },
  { value: 'football', label: 'NFL' },
  { value: 'baseball', label: 'MLB' },
  { value: 'hockey', label: 'NHL' },
  { value: 'soccer', label: 'Soccer' },
  { value: 'tennis', label: 'Tennis' },
  { value: 'mma', label: 'MMA' },
];

const TIME_FILTERS = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year', label: 'This Year' },
];

function getTimeFilterEnd(filter: string): Date {
  const now = new Date();
  switch (filter) {
    case 'today': {
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      return end;
    }
    case 'week': {
      const end = new Date(now);
      const dayOfWeek = end.getDay();
      end.setDate(end.getDate() + (6 - dayOfWeek));
      end.setHours(23, 59, 59, 999);
      return end;
    }
    case 'month': {
      return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }
    case 'year': {
      return new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    }
    default:
      return new Date(now.getFullYear() + 1, 0, 1);
  }
}

/** Top N props auto-fetch L20; rest are lazy-loaded on tap */
const AUTO_FETCH_LIMIT = 30;

const PlayerProps = () => {
  const [sportFilter, setSportFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statFilter, setStatFilter] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState('today');
  const { user, isSubscribed } = useAuth();
  const navigate = useNavigate();

  const { props, isLoading, error, refetch } = usePlayerProps(sportFilter);

  // Props-specific record (Over/Under picks only)
  const totalGames = 3288;
  const winsCount = 2639;
  const lossesCount = 649;
  const wr = 80.3;

  const availableStats = useMemo(
    () => [...new Set(props.map(p => p.statType))].sort(),
    [props]
  );

  const filtered = useMemo(() => {
    const timeEnd = getTimeFilterEnd(timeFilter);
    const now = new Date();
    return props
      .filter(p => {
        const matchesSearch =
          !searchQuery ||
          p.playerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.team.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStat = !statFilter || p.statType === statFilter;
        const gameDate = new Date(p.gameTime);
        const matchesTime = gameDate > now && gameDate <= timeEnd;

        // Platform filter: if a specific book is selected, only show props available on it
        const books = p.bookOdds ? Object.keys(p.bookOdds) : [];
        const matchesPlatform = selectedPlatform
          ? books.includes(selectedPlatform)
          : // When "All" is selected, require at least one major book (FanDuel or DraftKings)
            books.some(b => b === 'fanduel' || b === 'draftkings');

        return matchesSearch && matchesStat && matchesTime && matchesPlatform;
      })
      .sort((a, b) => {
        const edgeA = computeEdge(a.overOdds, a.underOdds);
        const edgeB = computeEdge(b.overOdds, b.underOdds);
        const keyA = `${a.playerName}:${a.statType}:${a.line}:${edgeA.direction}`;
        const keyB = `${b.playerName}:${b.statType}:${b.line}:${edgeB.direction}`;
        const hasRealA = (gameLogCache.get(keyA)?.results.length ?? 0) >= 10 ? 1 : 0;
        const hasRealB = (gameLogCache.get(keyB)?.results.length ?? 0) >= 10 ? 1 : 0;
        if (hasRealB !== hasRealA) return hasRealB - hasRealA;
        return edgeB.prob - edgeA.prob;
      });
  }, [props, searchQuery, statFilter, timeFilter, selectedPlatform]);

  // Build a set of top-N prop IDs for auto-fetch
  const autoFetchIds = useMemo(() => {
    const ids = new Set<string>();
    for (let i = 0; i < Math.min(AUTO_FETCH_LIMIT, filtered.length); i++) {
      ids.add(filtered[i].id);
    }
    return ids;
  }, [filtered]);

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
          {/* Win Rate Bar */}
          <div className="relative mb-6 rounded-xl border border-primary/20 overflow-hidden" style={{ background: 'linear-gradient(135deg, hsl(var(--card)), hsl(var(--secondary)))' }}>
            <div className="absolute inset-0 opacity-10" style={{ background: 'radial-gradient(ellipse at 30% 50%, hsl(var(--primary)), transparent 70%)' }} />
            <div className="relative flex flex-col sm:flex-row sm:items-center gap-4 p-5">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Over / Under Record</span>
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">Live</span>
                </div>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-4xl font-black text-emerald-400">{wr}%</span>
                  <span className="text-sm text-muted-foreground font-medium">win rate</span>
                </div>
                <div className="w-full bg-secondary/80 rounded-full h-2.5 overflow-hidden flex">
                  <div className="h-full transition-all duration-500" style={{ width: `${wr}%`, background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary) / 0.7))' }} />
                  <div className="h-full transition-all duration-500 bg-red-500" style={{ width: `${100 - wr}%` }} />
                </div>
              </div>
              <div className="flex gap-5 sm:gap-6">
                <div className="text-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Total</p>
                  <p className="text-2xl font-black text-foreground">{totalGames.toLocaleString()}</p>
                </div>
                <div className="w-px bg-border/50 self-stretch" />
                <div className="text-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Wins</p>
                  <p className="text-2xl font-black text-emerald-400">{winsCount.toLocaleString()}</p>
                </div>
                <div className="w-px bg-border/50 self-stretch" />
                <div className="text-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Losses</p>
                  <p className="text-2xl font-black text-destructive">{lossesCount.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>




          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Player Props</h1>
            <p className="text-muted-foreground">
              Real-time prop lines with edge detection across all major sports.
            </p>
          </div>

          {/* Sport filter tabs */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {SPORT_FILTERS.map(sf => (
              <Button
                key={sf.value}
                variant={sportFilter === sf.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => { setSportFilter(sf.value); setStatFilter(null); }}
              >
                {sf.label}
              </Button>
            ))}
            <div className="ml-auto">
              <Button variant="outline" size="sm" onClick={refetch} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Time filter tabs */}
          <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-1 border border-border/50 mb-4 w-fit">
            {TIME_FILTERS.map(tf => (
              <Button
                key={tf.value}
                variant={timeFilter === tf.value ? 'default' : 'ghost'}
                size="sm"
                className="h-7 px-3 text-xs"
                onClick={() => setTimeFilter(tf.value)}
              >
                {tf.label}
              </Button>
            ))}
          </div>

          {/* Platform selector */}
          <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-1 border border-border/50 mb-4 w-fit">
            <Button variant={selectedPlatform === null ? 'default' : 'ghost'} size="sm" className="h-7 px-2 text-xs" onClick={() => setSelectedPlatform(null)}>
              All
            </Button>
            {SPORTSBOOKS.map(sb => (
              <Button key={sb.id} variant={selectedPlatform === sb.id ? 'default' : 'ghost'} size="sm" className="h-7 px-2 gap-1" onClick={() => setSelectedPlatform(selectedPlatform === sb.id ? null : sb.id)}>
                <img src={sb.logo} alt={sb.name} className="h-4 w-4 object-contain rounded-sm" />
                <span className="text-xs hidden sm:inline">{sb.name}</span>
              </Button>
            ))}
          </div>

          {/* Search + stat filter */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search player or team..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 bg-card border-border" />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {availableStats.map(stat => (
                <Badge key={stat} variant={statFilter === stat ? 'default' : 'outline'} className="cursor-pointer" onClick={() => setStatFilter(statFilter === stat ? null : stat)}>
                  {stat}
                  {statFilter === stat && <X className="h-3 w-3 ml-1" />}
                </Badge>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <Badge variant="secondary" className="text-xs">{totalProps} props</Badge>
            {Object.entries(sportBreakdown).map(([league, count]) => (
              <Badge key={league} variant="outline" className="text-xs">{league}: {count}</Badge>
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
                <Button variant="outline" size="sm" onClick={refetch} className="mt-3">Try Again</Button>
              </CardContent>
            </Card>
          )}

          {/* Props Grid */}
          {!isLoading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((prop, index) => {
                const isLocked = !isSubscribed && index >= 2;
                const isFreePreview = !isSubscribed && index < 2;

                if (isLocked) {
                  return (
                    <div key={prop.id}>
                      <div
                        className="relative cursor-pointer group"
                        onClick={() => navigate(user ? '/pricing' : '/login', { state: { from: { pathname: '/player-props' } } })}
                      >
                        <div className="blur-[6px] opacity-50 pointer-events-none select-none">
                          <PlayerPropCard prop={prop} selectedPlatform={selectedPlatform} autoFetchL20={false} />
                        </div>
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm rounded-xl border border-border/50 group-hover:border-primary/40 transition-colors">
                          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-3">
                            <Lock className="h-6 w-6 text-primary" />
                          </div>
                          <p className="text-sm font-semibold mb-1">Unlock This Prop</p>
                          <p className="text-xs text-muted-foreground">Subscribe for full access</p>
                          <div className="mt-3 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-xs font-medium text-primary group-hover:bg-primary/20 transition-colors">
                            <Crown className="h-3 w-3 inline mr-1" />
                            View Plans
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={prop.id} className="relative">
                    {isFreePreview && (
                      <div className="absolute -top-2 -right-2 z-10">
                        <Badge className="bg-primary text-primary-foreground text-[10px] px-2 py-0.5">
                          FREE PREVIEW
                        </Badge>
                      </div>
                    )}
                    <PlayerPropCard
                      prop={prop}
                      selectedPlatform={selectedPlatform}
                      autoFetchL20={autoFetchIds.has(prop.id)}
                    />
                  </div>
                );
              })}
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
