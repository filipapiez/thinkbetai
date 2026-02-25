import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export interface PrizePickPlayer {
  id: string;
  name: string;
  position: string;
  team: string;
  teamName: string;
  imageUrl: string | null;
}

export interface PrizePickProjection {
  id: string;
  lineScore: number;
  statType: string;
  description: string;
  gameTime: string | null;
  isPromo: boolean;
  flashSaleLine: number | null;
  oddsType: string | null;
  player: PrizePickPlayer;
  league: { id: string; name: string } | null;
  sport: string;
}

export interface PrizePickLeague {
  id: string;
  name: string;
  sport?: string;
}

interface PrizePicksResponse {
  projections: PrizePickProjection[];
  leagues: PrizePickLeague[];
  totalCount: number;
  lastUpdated: string;
  error?: string;
}

export function usePrizePicks(leagueId?: string) {
  const [projections, setProjections] = useState<PrizePickProjection[]>([]);
  const [leagues, setLeagues] = useState<PrizePickLeague[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = leagueId ? `?league_id=${leagueId}` : '';
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-prizepicks${params}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const result: PrizePicksResponse = await response.json();

      setProjections(result.projections || []);
      setLeagues(result.leagues || []);
      setLastUpdated(result.lastUpdated || null);

      if (result.error) {
        setError(result.error);
      }

      if ((result.projections || []).length === 0 && !result.error) {
        toast.info('No PrizePicks projections available right now');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch data';
      setError(message);
      toast.error(`Error: ${message}`);
    } finally {
      setIsLoading(false);
    }
  }, [leagueId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { projections, leagues, isLoading, error, lastUpdated, refetch: fetchData };
}
