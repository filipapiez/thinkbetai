import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Radio, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface LiveScore {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  completed: boolean;
  sport: string;
  commenceTime: string;
}

interface LiveScoresBannerProps {
  sport?: string;
}

// Map sport filters to Odds API sport keys
const sportKeyMap: Record<string, string> = {
  basketball: 'basketball_nba',
  football: 'americanfootball_nfl',
  baseball: 'baseball_mlb',
  hockey: 'icehockey_nhl',
  soccer: 'soccer_epl',
  mma: 'mma_mixed_martial_arts',
};

export const LiveScoresBanner = ({ sport }: LiveScoresBannerProps) => {
  const [liveGames, setLiveGames] = useState<LiveScore[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchScores = useCallback(async () => {
    try {
      // Determine which sports to fetch
      const sportKey = sport ? sportKeyMap[sport.toLowerCase()] : null;
      const sportsToFetch = sportKey 
        ? [sportKey] 
        : ['basketball_nba', 'americanfootball_nfl', 'baseball_mlb', 'icehockey_nhl'];

      const allScores: LiveScore[] = [];

      for (const sk of sportsToFetch) {
        const { data } = await supabase.functions.invoke('get-live-scores', {
          body: { sport: sk },
        });
        if (data?.games) {
          allScores.push(...data.games);
        }
      }

      // Only show games that are in-progress (have scores but not completed)
      const inProgress = allScores.filter(g => 
        !g.completed && g.homeScore !== null && g.awayScore !== null
      );

      setLiveGames(inProgress);
    } catch (e) {
      console.error('[LiveScores] Error:', e);
    } finally {
      setIsLoading(false);
    }
  }, [sport]);

  useEffect(() => {
    fetchScores();
    // Refresh every 60 seconds
    const interval = setInterval(fetchScores, 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchScores]);

  if (isLoading || liveGames.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Radio className="h-4 w-4 text-red-400 animate-pulse" />
        <h3 className="font-semibold text-sm">Live Now</h3>
        <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/40 text-xs">
          {liveGames.length} game{liveGames.length !== 1 ? 's' : ''}
        </Badge>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
        {liveGames.map((game) => (
          <Link
            key={game.id}
            to={`/games/${game.id}`}
            className="shrink-0"
          >
            <Card className="w-[220px] hover:border-red-500/40 transition-colors cursor-pointer border-red-500/20 bg-red-500/5">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="text-[10px] bg-red-500/20 text-red-400 border-red-500/40 animate-pulse px-1.5">
                    LIVE
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">{game.sport}</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "text-xs font-medium truncate max-w-[130px]",
                      game.homeScore !== null && game.awayScore !== null && game.homeScore > game.awayScore && "text-emerald-400"
                    )}>
                      {game.homeTeam}
                    </span>
                    <span className="text-sm font-bold font-mono">{game.homeScore ?? '-'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "text-xs font-medium truncate max-w-[130px]",
                      game.homeScore !== null && game.awayScore !== null && game.awayScore > game.homeScore && "text-emerald-400"
                    )}>
                      {game.awayTeam}
                    </span>
                    <span className="text-sm font-bold font-mono">{game.awayScore ?? '-'}</span>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-1 mt-2 text-[10px] text-primary">
                  <span>Details</span>
                  <ChevronRight className="h-3 w-3" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};
