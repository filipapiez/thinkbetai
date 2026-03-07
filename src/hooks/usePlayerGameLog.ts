import { useState, useEffect, useRef } from 'react';
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
const memoryCache = gameLogCache;

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
    // Stagger next request by 500ms to avoid bursts
    setTimeout(() => {
      const next = pendingQueue.shift();
      next?.();
    }, 500);
  }
}

export function usePlayerGameLog(
  playerName: string,
  sport: string,
  statType: string,
  line: number,
  direction: 'Over' | 'Under'
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
    if (fetchedRef.current) return;

    // Check memory cache
    const cached = memoryCache.get(cacheKey);
    if (cached) {
      setData(cached);
      return;
    }

    fetchedRef.current = true;
    setIsLoading(true);

    const fetchLog = async () => {
      // Wait for our turn in the queue
      await enqueue();

      try {
        const { data: resp, error: fnError } = await supabase.functions.invoke('get-player-game-log', {
          body: { playerName, sport, statType, line },
        });

        if (fnError || !resp?.success) {
          setError(resp?.error || fnError?.message || 'Failed to fetch game log');
          return;
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

        memoryCache.set(cacheKey, result);
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        dequeue();
        setIsLoading(false);
      }
    };

    fetchLog();
  }, [cacheKey, playerName, sport, statType, line, direction]);

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
