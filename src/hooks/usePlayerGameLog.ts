import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface GameLogResult {
  results: boolean[];
  statValues: number[];
  opponents: string[];
  hitCount: number;
  total: number;
  isLoading: boolean;
  error: string | null;
}

interface CachedData {
  results: boolean[];
  statValues: number[];
  opponents: string[];
  hitCount: number;
  total: number;
  date?: string; // legacy field
  timestamp: number; // ms since epoch
}

// Cache TTL: 12 hours in ms
const CACHE_TTL_MS = 12 * 60 * 60 * 1000;

// localStorage key for game log cache
const CACHE_VERSION = 'v2-statmuse';
const STORAGE_KEY = 'player-game-log-cache';
const VERSION_KEY = 'player-game-log-cache-version';

// Load cache from localStorage (invalidate if version mismatch)
function loadLocalCache(): Map<string, CachedData> {
  try {
    const storedVersion = localStorage.getItem(VERSION_KEY);
    if (storedVersion !== CACHE_VERSION) {
      // Version mismatch — wipe stale cache
      localStorage.removeItem(STORAGE_KEY);
      localStorage.setItem(VERSION_KEY, CACHE_VERSION);
      return new Map();
    }
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
let lastRequestTime = 0;
const pendingQueue: Array<() => void> = [];

// Safety: if no request has completed in 30s, reset the counter
function ensureQueueHealth() {
  if (activeRequests > 0 && Date.now() - lastRequestTime > 30000) {
    console.warn(`[GameLog] Queue stuck (activeRequests=${activeRequests}), resetting`);
    activeRequests = 0;
    // Drain pending queue
    while (pendingQueue.length > 0 && activeRequests < MAX_CONCURRENT) {
      const next = pendingQueue.shift();
      activeRequests++;
      next?.();
    }
  }
}

function enqueue(): Promise<void> {
  ensureQueueHealth();
  if (activeRequests < MAX_CONCURRENT) {
    activeRequests++;
    lastRequestTime = Date.now();
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    pendingQueue.push(() => {
      activeRequests++;
      lastRequestTime = Date.now();
      resolve();
    });
  });
}

function dequeue() {
  activeRequests--;
  lastRequestTime = Date.now();
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
  // Support legacy 'date' field and new 'timestamp' field
  const age = cached.timestamp ? Date.now() - cached.timestamp : Infinity;
  return age < CACHE_TTL_MS && cached.results.length >= 10;
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
    const opponents = resp.opponents || [];
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
      opponents,
      hitCount,
      total: results.length,
      timestamp: Date.now(),
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
      opponents: data.opponents,
      hitCount: data.hitCount,
      total: data.total,
      isLoading: false,
      error: null,
    };
  }

  return {
    results: [],
    statValues: [],
    opponents: [],
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
    opponents: data?.opponents ?? [],
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
