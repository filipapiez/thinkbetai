import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface GameLogResult {
  results: boolean[];
  statValues: number[];
  hitCount: number;
  total: number;
  isLoading: boolean;
  error: string | null;
}

interface CachedData {
  results: boolean[];
  statValues: number[];
  hitCount: number;
  total: number;
  date: string; // YYYY-MM-DD to track when cached
}

// Get today's date string for cache invalidation
function getTodayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

// localStorage key for game log cache
const STORAGE_KEY = 'player-game-log-cache';

// Load cache from localStorage
function loadLocalCache(): Map<string, CachedData> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return new Map(Object.entries(parsed));
    }
  } catch {
    // Ignore parse errors
  }
  return new Map();
}

// Save cache to localStorage
function saveLocalCache(cache: Map<string, CachedData>) {
  try {
    const obj = Object.fromEntries(cache);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  } catch {
    // Ignore storage errors (quota exceeded, etc.)
  }
}

// In-memory cache backed by localStorage
let gameLogCache: Map<string, CachedData> = loadLocalCache();

// Global request queue to prevent rate limiting
const MAX_CONCURRENT = 2;
let activeRequests = 0;
const pendingQueue: Array<() => void> = [];

function enqueue(): Promise<void> {
  if (activeRequests < MAX_CONCURRENT) {
    activeRequests++;
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    pendingQueue.push(() => {
      activeRequests++;
      resolve();
    });
  });
}

function dequeue() {
  activeRequests--;
  if (pendingQueue.length > 0) {
    setTimeout(() => {
      const next = pendingQueue.shift();
      next?.();
    }, 500);
  }
}

// Check if cached data is still valid (same day)
function isCacheValid(cached: CachedData | undefined): cached is CachedData {
  if (!cached) return false;
  return cached.date === getTodayStr() && cached.results.length >= 10;
}

async function fetchGameLog(
  playerName: string,
  sport: string,
  statType: string,
  line: number,
  direction: 'Over' | 'Under'
): Promise<CachedData> {
  const cacheKey = `${playerName}:${statType}:${direction}`;
  const cached = gameLogCache.get(cacheKey);
  
  // Return cached data if it's from today
  if (isCacheValid(cached)) {
    // Recalculate results based on current line
    const results = direction === 'Under'
      ? cached.statValues.map((val: number) => val < line)
      : cached.statValues.map((val: number) => val >= line);
    return {
      ...cached,
      results,
      hitCount: results.filter(Boolean).length,
    };
  }

  await enqueue();
  try {
    const { data: resp, error: fnError } = await supabase.functions.invoke('get-player-game-log', {
      body: { playerName, sport, statType, line },
    });

    if (fnError || !resp?.success) {
      throw new Error(resp?.error || fnError?.message || 'Failed to fetch game log');
    }

    const statValues = resp.statValues || [];
    let results: boolean[];
    if (direction === 'Under') {
      results = statValues.map((val: number) => val < line);
    } else {
      results = resp.results || [];
    }

    const hitCount = results.filter(Boolean).length;
    const result: CachedData = {
      results,
      statValues,
      hitCount,
      total: results.length,
      date: getTodayStr(),
    };

    // Cache by player+stat+direction (not line), so we can recalculate for different lines
    gameLogCache.set(cacheKey, result);
    saveLocalCache(gameLogCache);
    
    return result;
  } finally {
    dequeue();
  }
}

/**
 * Hook that auto-fetches L20 data (used for top N props)
 */
export function usePlayerGameLog(
  playerName: string,
  sport: string,
  statType: string,
  line: number,
  direction: 'Over' | 'Under',
  enabled: boolean = true
): GameLogResult {
  const [data, setData] = useState<CachedData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  const cacheKey = `${playerName}:${statType}:${direction}`;

  useEffect(() => {
    if (!enabled || fetchedRef.current) return;

    // Check localStorage-backed cache
    const cached = gameLogCache.get(cacheKey);
    if (isCacheValid(cached)) {
      // Recalculate results for current line
      const results = direction === 'Under'
        ? cached.statValues.map((val: number) => val < line)
        : cached.statValues.map((val: number) => val >= line);
      setData({
        ...cached,
        results,
        hitCount: results.filter(Boolean).length,
      });
      return;
    }

    fetchedRef.current = true;
    setIsLoading(true);

    fetchGameLog(playerName, sport, statType, line, direction)
      .then(result => setData(result))
      .catch(err => setError(err instanceof Error ? err.message : 'Unknown error'))
      .finally(() => setIsLoading(false));
  }, [cacheKey, playerName, sport, statType, line, direction, enabled]);

  if (data) {
    return {
      results: data.results,
      statValues: data.statValues,
      hitCount: data.hitCount,
      total: data.total,
      isLoading: false,
      error: null,
    };
  }

  return {
    results: [],
    statValues: [],
    hitCount: 0,
    total: 0,
    isLoading,
    error,
  };
}

/**
 * Hook for lazy-load on tap (doesn't fetch until triggered)
 */
export function useLazyPlayerGameLog(
  playerName: string,
  sport: string,
  statType: string,
  line: number,
  direction: 'Over' | 'Under'
) {
  const [data, setData] = useState<CachedData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cacheKey = `${playerName}:${statType}:${direction}`;

  // Check cache on mount
  useEffect(() => {
    const cached = gameLogCache.get(cacheKey);
    if (isCacheValid(cached)) {
      // Recalculate results for current line
      const results = direction === 'Under'
        ? cached.statValues.map((val: number) => val < line)
        : cached.statValues.map((val: number) => val >= line);
      setData({
        ...cached,
        results,
        hitCount: results.filter(Boolean).length,
      });
    }
  }, [cacheKey, line, direction]);

  const fetch = useCallback(async () => {
    if (data || isLoading) return;
    setIsLoading(true);
    try {
      const result = await fetchGameLog(playerName, sport, statType, line, direction);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [data, isLoading, playerName, sport, statType, line, direction]);

  return {
    results: data?.results ?? [],
    statValues: data?.statValues ?? [],
    hitCount: data?.hitCount ?? 0,
    total: data?.total ?? 0,
    isLoading,
    error,
    hasData: !!data && data.results.length >= 10,
    fetch,
  };
}

// Export for cache management
export { gameLogCache };
