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
          .select('result')
          .in('result', ['win', 'loss'])
          .order('date', { ascending: false })
          .limit(200),
      ]);

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

  return {
    winRate: data?.winRate ?? '—',
    totalBets: data?.totalBets ?? 0,
    wins: data?.wins ?? 0,
    losses: data?.losses ?? 0,
    currentStreak: data?.currentStreak ?? 0,
    isLoading,
  };
};
