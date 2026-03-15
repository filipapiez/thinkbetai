import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import {
  Trophy, TrendingUp, ArrowUpDown, RefreshCw, Loader2,
  Flame, ChevronRight, Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface DailyPick {
  id: string;
  sport: string;
  sportLabel: string;
  homeTeam: string;
  awayTeam: string;
  gameTime: string;
  pick: string;
  pickDetail: string;
  confidence: number;
  reasoning: string;
  odds?: number;
}

const CACHE_KEY = 'thinkbetai_daily_picks';
const CACHE_TTL = 30 * 60 * 1000; // 30 min

function loadCache() {
  try {
    const stored = localStorage.getItem(CACHE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Date.now() - parsed.timestamp < CACHE_TTL) return parsed.data;
    }
  } catch {}
  return null;
}

function saveCache(data: any) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
  } catch {}
}

const sportEmoji: Record<string, string> = {
  NBA: '🏀', NFL: '🏈', MLB: '⚾', NHL: '🏒', NCAAB: '🏀', NCAAF: '🏈',
  UFC: '🥊', EPL: '⚽', MLS: '⚽',
};

function ConfidenceMeter({ value }: { value: number }) {
  const color = value >= 80 ? 'bg-success' : value >= 65 ? 'bg-warning' : 'bg-destructive';
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-mono font-bold text-foreground">{value}%</span>
    </div>
  );
}

function PickRow({ pick }: { pick: DailyPick }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      className="group border border-border/50 rounded-xl p-4 hover:border-primary/40 transition-all cursor-pointer bg-card/50"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-lg">{sportEmoji[pick.sport] || '🏅'}</span>
          <div className="min-w-0">
            <div className="font-semibold text-sm text-foreground truncate">{pick.pick}</div>
            <div className="text-xs text-muted-foreground truncate">
              {pick.awayTeam} @ {pick.homeTeam}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <ConfidenceMeter value={pick.confidence} />
          <ChevronRight className={cn('h-4 w-4 text-muted-foreground transition-transform', expanded && 'rotate-90')} />
        </div>
      </div>
      {expanded && (
        <div className="mt-3 pt-3 border-t border-border/30">
          <p className="text-sm text-muted-foreground leading-relaxed">{pick.reasoning}</p>
          {pick.pickDetail && (
            <p className="text-xs text-primary mt-2 font-medium">{pick.pickDetail}</p>
          )}
        </div>
      )}
    </div>
  );
}

function PicksList({ picks, isLoading, emptyText }: { picks: DailyPick[]; isLoading: boolean; emptyText: string }) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">AI is analyzing today's games...</span>
      </div>
    );
  }
  if (picks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-sm">{emptyText}</p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {picks.map(p => <PickRow key={p.id} pick={p} />)}
    </div>
  );
}

export default function PicksOfTheDay() {
  const [games, setGames] = useState<DailyPick[]>([]);
  const [props, setProps] = useState<DailyPick[]>([]);
  const [overUnder, setOverUnder] = useState<DailyPick[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);

  const fetchPicks = useCallback(async (force = false) => {
    if (!force) {
      const cached = loadCache();
      if (cached) {
        setGames(cached.games || []);
        setProps(cached.props || []);
        setOverUnder(cached.overUnder || []);
        setGeneratedAt(cached.generatedAt);
        setIsLoading(false);
        return;
      }
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-daily-picks');
      if (error) throw error;
      setGames(data?.games || []);
      setProps(data?.props || []);
      setOverUnder(data?.overUnder || []);
      setGeneratedAt(data?.generatedAt || new Date().toISOString());
      saveCache(data);
    } catch (err) {
      console.error('Failed to fetch daily picks:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchPicks(); }, [fetchPicks]);

  const totalPicks = games.length + props.length + overUnder.length;

  return (
    <section className="py-16 md:py-24 border-t border-border/40">
      <div className="container">
        <div className="text-center mb-10">
          <Badge variant="outline" className="px-4 py-1.5 mb-4 border-primary/30 text-primary">
            <Flame className="h-3.5 w-3.5 mr-2" />
            Updated Daily
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            Today's <span className="text-gradient">Top Picks</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            AI-analyzed picks across games, player props, and over/unders — refreshed every day.
          </p>
          {generatedAt && (
            <p className="text-xs text-muted-foreground mt-2">
              Last updated: {new Date(generatedAt).toLocaleTimeString()}
            </p>
          )}
        </div>

        <Card variant="glass" className="max-w-3xl mx-auto">
          <CardContent className="p-4 md:p-6">
            <Tabs defaultValue="games" className="w-full">
              <div className="flex items-center justify-between mb-4">
                <TabsList className="bg-muted/50">
                  <TabsTrigger value="games" className="gap-1.5 text-xs sm:text-sm">
                    <Trophy className="h-3.5 w-3.5" />
                    Games
                    {games.length > 0 && <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">{games.length}</Badge>}
                  </TabsTrigger>
                  <TabsTrigger value="props" className="gap-1.5 text-xs sm:text-sm">
                    <TrendingUp className="h-3.5 w-3.5" />
                    Props
                    {props.length > 0 && <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">{props.length}</Badge>}
                  </TabsTrigger>
                  <TabsTrigger value="overunder" className="gap-1.5 text-xs sm:text-sm">
                    <ArrowUpDown className="h-3.5 w-3.5" />
                    Over/Under
                    {overUnder.length > 0 && <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">{overUnder.length}</Badge>}
                  </TabsTrigger>
                </TabsList>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fetchPicks(true)}
                  disabled={isLoading}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
                </Button>
              </div>

              <TabsContent value="games">
                <PicksList picks={games} isLoading={isLoading} emptyText="No game picks available yet — check back soon." />
              </TabsContent>
              <TabsContent value="props">
                <PicksList picks={props} isLoading={isLoading} emptyText="No prop picks available yet — check back soon." />
              </TabsContent>
              <TabsContent value="overunder">
                <PicksList picks={overUnder} isLoading={isLoading} emptyText="No over/under picks available yet — check back soon." />
              </TabsContent>
            </Tabs>

            <div className="mt-6 text-center">
              <Button variant="hero" size="lg" asChild className="group">
                <Link to="/picks">
                  <Sparkles className="h-4 w-4 mr-2" />
                  View All Picks
                  <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
