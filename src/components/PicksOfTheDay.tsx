import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { supabase } from '@/integrations/supabase/client';
import {
  TrendingUp, RefreshCw, Loader2,
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
  const [allPicks, setAllPicks] = useState<DailyPick[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);

  const fetchPicks = useCallback(async (force = false) => {
    if (!force) {
      const cached = loadCache();
      if (cached) {
        const merged = [...(cached.games || []), ...(cached.props || []), ...(cached.overUnder || [])];
        setAllPicks(merged.sort((a, b) => b.confidence - a.confidence));
        setGeneratedAt(cached.generatedAt);
        setIsLoading(false);
        return;
      }
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-daily-picks');
      if (error) throw error;
      const merged = [...(data?.games || []), ...(data?.props || []), ...(data?.overUnder || [])];
      setAllPicks(merged.sort((a, b) => b.confidence - a.confidence));
      setGeneratedAt(data?.generatedAt || new Date().toISOString());
      saveCache(data);
    } catch (err) {
      console.error('Failed to fetch daily picks:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchPicks(); }, [fetchPicks]);

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Flame className="h-5 w-5 text-primary" />
            Today's Best Picks
          </h2>
          <Badge variant="outline" className="border-primary/30 text-primary text-[10px]">
            <Sparkles className="h-3 w-3 mr-1" />
            AI
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {generatedAt && (
            <span className="text-[10px] text-muted-foreground">
              {new Date(generatedAt).toLocaleTimeString()}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchPicks(true)}
            disabled={isLoading}
            className="text-muted-foreground hover:text-foreground h-8 w-8 p-0"
          >
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          </Button>
        </div>
      </div>

      <Card className="border-border/50 bg-card/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
            <TrendingUp className="h-3.5 w-3.5 text-primary" />
            <span>{allPicks.length} picks ranked by confidence</span>
          </div>
          <PicksList picks={allPicks} isLoading={isLoading} emptyText="No picks available yet — check back soon." />
        </CardContent>
      </Card>
    </div>
  );
}
