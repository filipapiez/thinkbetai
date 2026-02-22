import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface WinRateData {
  winRate: string;
  totalBets: number;
  wins: number;
  losses: number;
  isLoading: boolean;
}

export const useWinRate = (): WinRateData => {
  const { data, isLoading } = useQuery({
    queryKey: ['global-win-rate'],
    queryFn: async () => {
      // Fetch counts in two parallel queries for efficiency
      const [winsRes, lossesRes] = await Promise.all([
        supabase
          .from('historical_bets')
          .select('id', { count: 'exact', head: true })
          .eq('result', 'win'),
        supabase
          .from('historical_bets')
          .select('id', { count: 'exact', head: true })
          .eq('result', 'loss'),
      ]);

      const wins = winsRes.count ?? 0;
      const losses = lossesRes.count ?? 0;
      const total = wins + losses;
      const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : '0';

      return { winRate, totalBets: total, wins, losses };
    },
    staleTime: 5 * 60 * 1000, // cache 5 min
  });

  return {
    winRate: data?.winRate ?? '—',
    totalBets: data?.totalBets ?? 0,
    wins: data?.wins ?? 0,
    losses: data?.losses ?? 0,
    isLoading,
  };
};
