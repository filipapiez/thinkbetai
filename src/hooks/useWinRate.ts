import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { platformStats } from '@/lib/platformStats';

interface WinRateData {
  winRate: string;
  totalBets: number;
  wins: number;
  losses: number;
  currentStreak: number;
  isLoading: boolean;
}

interface UseWinRateOptions {
  pickType?: 'Over' | 'Under';
  useFallback?: boolean;
}

export const useWinRate = (options?: 'Over' | 'Under' | UseWinRateOptions): WinRateData => {
  const pickType = typeof options === 'string' ? options : options?.pickType;
  const useFallback = typeof options === 'object' ? options.useFallback ?? true : true;
  // Defer query to avoid extending the critical network dependency chain
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (typeof requestIdleCallback === 'function') {
      const id = requestIdleCallback(() => setReady(true));
      return () => cancelIdleCallback(id);
    } else {
      const id = setTimeout(() => setReady(true), 100);
      return () => clearTimeout(id);
    }
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['global-win-rate', pickType],
    enabled: ready,
    queryFn: async () => {
      // Fetch counts and recent bets for streak in parallel.
      const [winsRes, lossesRes, recentRes] = await Promise.all([
        pickType
          ? supabase
              .from('historical_bets')
              .select('id', { count: 'exact', head: true })
              .eq('result', 'win')
              .eq('pick', pickType)
          : supabase
              .from('historical_bets')
              .select('id', { count: 'exact', head: true })
              .eq('result', 'win'),
        pickType
          ? supabase
              .from('historical_bets')
              .select('id', { count: 'exact', head: true })
              .eq('result', 'loss')
              .eq('pick', pickType)
          : supabase
              .from('historical_bets')
              .select('id', { count: 'exact', head: true })
              .eq('result', 'loss'),
        pickType
          ? supabase
              .from('historical_bets')
              .select('result')
              .eq('pick', pickType)
              .in('result', ['win', 'loss'])
              .order('date', { ascending: false })
              .limit(200)
          : supabase
              .from('historical_bets')
              .select('result')
              .in('result', ['win', 'loss'])
              .order('date', { ascending: false })
              .limit(200),
      ]);

      const error = winsRes.error ?? lossesRes.error ?? recentRes.error;
      if (error) throw error;

      const wins = winsRes.count ?? 0;
      const losses = lossesRes.count ?? 0;
      const total = wins + losses;
      const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : '0';

      // Calculate current game win streak (matches bet history display order)
      let currentStreak = 0;
      const recentBets = recentRes.data ?? [];
      for (const bet of recentBets) {
        if (bet.result === 'win') {
          currentStreak++;
        } else {
          break;
        }
      }

      return { winRate, totalBets: total, wins, losses, currentStreak };
    },
    staleTime: 5 * 60 * 1000,
  });

  const fallbackData = !pickType
    ? {
        winRate: platformStats.qualifiedWinRate.toFixed(1),
        totalBets: platformStats.totalQualified,
        wins: platformStats.correctQualified,
        losses: platformStats.totalQualified - platformStats.correctQualified,
        currentStreak: platformStats.streakCurrent,
      }
    : undefined;
  const resolvedData = data ?? (useFallback ? fallbackData : undefined);

  return {
    winRate: resolvedData?.winRate ?? '—',
    totalBets: resolvedData?.totalBets ?? 0,
    wins: resolvedData?.wins ?? 0,
    losses: resolvedData?.losses ?? 0,
    currentStreak: resolvedData?.currentStreak ?? 0,
    isLoading: !ready || isLoading,
  };
};
