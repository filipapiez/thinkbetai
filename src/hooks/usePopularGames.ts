import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export interface PopularGameOdds {
  moneyline?: { home: number; away: number; draw?: number };
  spread?: { home: number; homeOdds: number; away: number; awayOdds: number };
  total?: { over: number; overOdds: number; under: number; underOdds: number };
}

export interface PopularGame {
  id: string;
  sport: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string;
  popularityScore: number;
  status: 'scheduled' | 'live' | 'completed';
  injuries?: string[];
  odds?: PopularGameOdds;
  hasOdds?: boolean;
}

interface PopularGamesResponse {
  success: boolean;
  games: PopularGame[];
  source: 'cached' | 'fresh' | 'stale-cache';
  lastUpdated: string;
  error?: string;
}

// Local storage cache - short TTL to show fresh data on refresh
const CACHE_KEY = 'popular_games_cache';
const CLIENT_CACHE_TTL = 2 * 60 * 1000; // 2 minutes client-side

function getClientCache(): { games: PopularGame[]; timestamp: number } | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {}
  return null;
}

function setClientCache(games: PopularGame[]): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      games,
      timestamp: Date.now(),
    }));
  } catch {}
}

export function usePopularGames() {
  const [games, setGames] = useState<PopularGame[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [source, setSource] = useState<string>('');

  const fetchGames = useCallback(async (forceRefresh = false) => {
    setIsLoading(true);
    setError(null);

    // Check client-side cache first (unless forcing refresh)
    if (!forceRefresh) {
      const clientCache = getClientCache();
      if (clientCache && (Date.now() - clientCache.timestamp) < CLIENT_CACHE_TTL) {
        console.log('[PopularGames] Using client cache');
        setGames(clientCache.games);
        setLastUpdated(new Date(clientCache.timestamp).toISOString());
        setSource('client-cache');
        setIsLoading(false);
        return;
      }
    } else {
      // Clear client cache on force refresh
      try {
        localStorage.removeItem(CACHE_KEY);
      } catch {}
    }

    try {
      const baseUrl = import.meta.env.VITE_SUPABASE_URL;
      
      console.log('[PopularGames] Fetching from edge function', forceRefresh ? '(force refresh)' : '');
      
      const url = forceRefresh 
        ? `${baseUrl}/functions/v1/scrape-live-games?refresh=true`
        : `${baseUrl}/functions/v1/scrape-live-games`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data: PopularGamesResponse = await response.json();
      
      if (data.success && data.games) {
        setGames(data.games);
        setLastUpdated(data.lastUpdated);
        setSource(data.source);
        setClientCache(data.games);
        
        if (data.games.length === 0) {
          toast.info('No games available at this time');
        }
      } else {
        throw new Error(data.error || 'Failed to fetch games');
      }
      
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch games';
      console.error('[PopularGames] Error:', message);
      setError(message);
      
      // Fall back to client cache if available
      const clientCache = getClientCache();
      if (clientCache && clientCache.games.length > 0) {
        setGames(clientCache.games);
        setLastUpdated(new Date(clientCache.timestamp).toISOString());
        setSource('fallback-cache');
        toast.info('Using cached data');
      } else {
        toast.error('Failed to load games');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  return {
    games,
    isLoading,
    error,
    lastUpdated,
    source,
    refetch: () => fetchGames(true),
  };
}
