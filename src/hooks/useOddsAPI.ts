import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface LiveOdds {
  moneyline: {
    home: number;
    away: number;
  };
  spread: {
    home: number;
    homeOdds: number;
    away: number;
    awayOdds: number;
  };
  total: {
    over: number;
    overOdds: number;
    under: number;
    underOdds: number;
  };
}

export interface LiveGame {
  id: string;
  sportKey: string;
  sportTitle: string;
  commenceTime: string;
  homeTeam: string;
  awayTeam: string;
  bookmaker: string;
  odds: LiveOdds;
  hasOdds: boolean;
}

interface OddsAPIResponse {
  games: LiveGame[];
  remainingRequests: number | null;
  lastUpdated: string;
}

export function useOddsAPI(sport: string = 'nba') {
  const [games, setGames] = useState<LiveGame[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [remainingRequests, setRemainingRequests] = useState<number | null>(null);

  const fetchOdds = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('get-odds', {
        body: {},
        headers: {},
      });

      // The invoke method doesn't support query params directly, so we use the URL
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-odds?sport=${sport}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch odds');
      }

      const result: OddsAPIResponse = await response.json();
      
      setGames(result.games);
      setLastUpdated(result.lastUpdated);
      setRemainingRequests(result.remainingRequests);

      if (result.games.length === 0) {
        toast.info(`No upcoming games found for ${sport.toUpperCase()}`);
      }

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch odds';
      setError(message);
      
      if (message.includes('Rate limit')) {
        toast.error('API rate limit exceeded. Please try again later.');
      } else if (message.includes('Invalid API key')) {
        toast.error('Invalid API key. Please check your configuration.');
      } else {
        toast.error(`Error fetching odds: ${message}`);
      }
    } finally {
      setIsLoading(false);
    }
  }, [sport]);

  useEffect(() => {
    fetchOdds();
  }, [fetchOdds]);

  return {
    games,
    isLoading,
    error,
    lastUpdated,
    remainingRequests,
    refetch: fetchOdds,
  };
}
