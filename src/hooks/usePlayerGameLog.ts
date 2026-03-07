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

// In-memory cache to avoid re-fetching during same session
export const gameLogCache = new Map<string, { results: boolean[]; statValues: number[]; hitCount: number; total: number }>();

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

async function fetchGameLog(
  playerName: string,
  sport: string,
  statType: string,
  line: number,
  direction: 'Over' | 'Under'
): Promise<{ results: boolean[]; statValues: number[]; hitCount: number; total: number }> {
  const cacheKey = `${playerName}:${statType}:${line}:${direction}`;
  const cached = gameLogCache.get(cacheKey);
  if (cached) return cached;

  await enqueue();
  try {
    const { data: resp, error: fnError } = await supabase.functions.invoke('get-player-game-log', {
      body: { playerName, sport, statType, line },
    });

    if (fnError || !resp?.success) {
      throw new Error(resp?.error || fnError?.message || 'Failed to fetch game log');
    }

    let results: boolean[];
    if (direction === 'Under') {
      results = (resp.statValues || []).map((val: number) => val < line);
    } else {
      results = resp.results || [];
    }

    const hitCount = results.filter(Boolean).length;
    const result = {
      results,
      statValues: resp.statValues || [],
      hitCount,
      total: results.length,
    };

    gameLogCache.set(cacheKey, result);
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
  const [data, setData] = useState<{
    results: boolean[];
    statValues: number[];
    hitCount: number;
    total: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  const cacheKey = `${playerName}:${statType}:${line}:${direction}`;

  useEffect(() => {
    if (!enabled || fetchedRef.current) return;

    // Check memory cache
    const cached = gameLogCache.get(cacheKey);
    if (cached) {
      setData(cached);
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
    return { ...data, isLoading: false, error: null };
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
  const [data, setData] = useState<{
    results: boolean[];
    statValues: number[];
    hitCount: number;
    total: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cacheKey = `${playerName}:${statType}:${line}:${direction}`;

  // Check cache on mount
  useEffect(() => {
    const cached = gameLogCache.get(cacheKey);
    if (cached) setData(cached);
  }, [cacheKey]);

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
    hasData: !!data && data.results.length >= 20,
    fetch,
  };
}
