import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Pick {
  id: string;
  platform: string;
  sport: string;
  playerName: string;
  playerImage: string;
  team: string;
  opponent: string;
  gameDate: string;
  gameTime: string;
  propType: string;
  line: number;
  direction: 'MORE' | 'LESS';
  confidence: number;
  hitRate?: number;
  projection?: number;
}

interface PicksResponse {
  success: boolean;
  data: Pick[];
  source: 'cache' | 'scraped' | 'generated' | 'fallback';
  lastUpdated: string;
  platforms: string[];
  error?: string;
}

// Cache
const STORAGE_KEY = 'thinkbetai_picks_cache';
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

interface CachedData {
  picks: Pick[];
  platforms: string[];
  timestamp: number;
  source: string;
}

function loadFromStorage(): CachedData | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored) as CachedData;
      if (Date.now() - data.timestamp < CACHE_DURATION) {
        return data;
      }
    }
  } catch (e) {
    console.warn('Failed to load picks from storage:', e);
  }
  return null;
}

function saveToStorage(data: CachedData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save picks to storage:', e);
  }
}

export function usePicks() {
  const [picks, setPicks] = useState<Pick[]>([]);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [source, setSource] = useState<string>('');

  const fetchPicks = useCallback(async (forceRefresh = false) => {
    setIsLoading(true);
    setError(null);

    // Try cache first if not forcing refresh
    if (!forceRefresh) {
      const cached = loadFromStorage();
      if (cached) {
        console.log('Using cached picks data');
        setPicks(cached.picks);
        setPlatforms(cached.platforms);
        setLastUpdated(new Date(cached.timestamp).toISOString());
        setSource(cached.source);
        setIsLoading(false);
        return;
      }
    }

    try {
      console.log('Fetching picks from edge function...');
      
      const { data, error: fnError } = await supabase.functions.invoke<PicksResponse>('scrape-picks', {
        body: {},
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data?.success && data.data) {
        setPicks(data.data);
        setPlatforms(data.platforms || []);
        setLastUpdated(data.lastUpdated);
        setSource(data.source);

        // Save to cache
        saveToStorage({
          picks: data.data,
          platforms: data.platforms || [],
          timestamp: Date.now(),
          source: data.source,
        });
      } else {
        throw new Error(data?.error || 'Failed to fetch picks');
      }
    } catch (err) {
      console.error('Error fetching picks:', err);
      setError(err instanceof Error ? err.message : 'Failed to load picks');
      
      // Try to use stale cache on error
      const cached = loadFromStorage();
      if (cached) {
        setPicks(cached.picks);
        setPlatforms(cached.platforms);
        setLastUpdated(new Date(cached.timestamp).toISOString());
        setSource('stale-cache');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPicks();
  }, [fetchPicks]);

  const refetch = useCallback(() => {
    fetchPicks(true);
  }, [fetchPicks]);

  // Derived data
  const availableSports = [...new Set(picks.map(p => p.sport))].sort();
  const availablePropTypes = [...new Set(picks.map(p => p.propType))].sort();

  return {
    picks,
    platforms,
    availableSports,
    availablePropTypes,
    isLoading,
    error,
    lastUpdated,
    source,
    refetch,
  };
}
