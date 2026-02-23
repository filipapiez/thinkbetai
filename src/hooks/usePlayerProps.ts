import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export interface PlayerProp {
  id: string;
  playerName: string;
  playerId: string;
  team: string;
  opponent: string;
  sport: string;
  league: string;
  statType: string;
  line: number;
  overOdds: number;
  underOdds: number;
  gameTime: string;
  gameId: string;
}

export function usePlayerProps(sport: string = 'all') {
  const [props, setProps] = useState<PlayerProp[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProps = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-player-props?sport=${sport}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch player props');
      }

      const data = await response.json();
      setProps(data.props || []);

      if (data.props?.length === 0) {
        toast.info('No player props available right now');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
      toast.error('Failed to load player props');
    } finally {
      setIsLoading(false);
    }
  }, [sport]);

  useEffect(() => {
    fetchProps();
  }, [fetchProps]);

  return { props, isLoading, error, refetch: fetchProps };
}
