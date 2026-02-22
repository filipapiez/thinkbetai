import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface WinRateData {
  winRate: string;
  totalBets: number;
  wins: number;
  losses: number;
  currentStreak: number;
  isLoading: boolean;
}

export const useWinRate = (): WinRateData => {
  const { data, isLoading } = useQuery({
    queryKey: ['global-win-rate'],
    queryFn: async () => {
      // Fetch counts and recent bets for streak in parallel
      const [winsRes, lossesRes, recentRes] = await Promise.all([
        supabase
          .from('historical_bets')
          .select('id', { count: 'exact', head: true })
          .eq('result', 'win'),
        supabase
          .from('historical_bets')
          .select('id', { count: 'exact', head: true })
          .eq('result', 'loss'),
        supabase
          .from('historical_bets')
          .select('date, result')
          .in('result', ['win', 'loss'])
          .order('date', { ascending: false })
          .limit(500),
      ]);

      const wins = winsRes.count ?? 0;
      const losses = lossesRes.count ?? 0;
      const total = wins + losses;
      const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : '0';

      // Calculate current streak by day (a day is "win" if wins > losses that day)
      let currentStreak = 0;
      const recentBets = recentRes.data ?? [];
      const dayResults = new Map<string, { w: number; l: number }>();
      for (const bet of recentBets) {
        const entry = dayResults.get(bet.date) ?? { w: 0, l: 0 };
        if (bet.result === 'win') entry.w++;
        else entry.l++;
        dayResults.set(bet.date, entry);
      }
      // Sort dates descending and count consecutive winning days
      const sortedDays = [...dayResults.entries()].sort((a, b) => b[0].localeCompare(a[0]));
      for (const [, { w, l }] of sortedDays) {
        if (w > l) {
          currentStreak++;
        } else {
          break;
        }
      }

      return { winRate, totalBets: total, wins, losses, currentStreak };
    },
    staleTime: 5 * 60 * 1000,
  });

  return {
    winRate: data?.winRate ?? '—',
    totalBets: data?.totalBets ?? 0,
    wins: data?.wins ?? 0,
    losses: data?.losses ?? 0,
    currentStreak: data?.currentStreak ?? 0,
    isLoading,
  };
};
