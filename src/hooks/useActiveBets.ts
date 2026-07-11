import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ActiveBet {
  id: string;
  game_id: string;
  sport: string;
  home_team: string;
  away_team: string;
  pick: string;
  pick_type: string;
  pick_value: number | null;
  odds: number;
  confidence: number;
  edge: number;
  game_time: string;
  status: string;
  result: string | null;
  home_score: number | null;
  away_score: number | null;
  created_at: string;
}

export function useActiveBets() {
  const queryClient = useQueryClient();
  const [isChecking, setIsChecking] = useState(false);

  const { data: activeBets = [], isLoading, error, refetch } = useQuery({
    queryKey: ['active-bets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('active_bets')
        .select('*')
        .order('game_time', { ascending: true });

      if (error) throw error;
      return data as ActiveBet[];
    },
  });

  const pendingBets = activeBets.filter(bet => bet.status === 'pending');
  const completedBets = activeBets.filter(bet => bet.status === 'completed');

  const checkResults = useCallback(async () => {
    setIsChecking(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-game-results');
      
      if (error) throw error;

      if (data?.updated > 0) {
        toast.success(`Updated ${data.updated} bet result(s)!`);
        queryClient.invalidateQueries({ queryKey: ['active-bets'] });
        queryClient.invalidateQueries({ queryKey: ['historical-bets'] });
      } else {
        toast.info('No completed games found yet');
      }

      return data;
    } catch (err) {
      console.error('Error checking results:', err);
      toast.error('Failed to check game results');
      throw err;
    } finally {
      setIsChecking(false);
    }
  }, [queryClient]);

  const addBetMutation = useMutation({
    mutationFn: async (bet: Omit<ActiveBet, 'id' | 'status' | 'result' | 'home_score' | 'away_score' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('active_bets')
        .insert({
          game_id: bet.game_id,
          sport: bet.sport,
          home_team: bet.home_team,
          away_team: bet.away_team,
          pick: bet.pick,
          pick_type: bet.pick_type,
          pick_value: bet.pick_value,
          odds: bet.odds,
          confidence: bet.confidence,
          edge: bet.edge,
          game_time: bet.game_time,
          published_at: new Date().toISOString(),
          market_type: bet.pick_type,
          line: bet.pick_value,
          opening_odds: bet.odds,
          pick_odds: bet.odds,
          source_event_id: bet.game_id,
          odds_source: 'manual',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Bet added to tracking!');
      queryClient.invalidateQueries({ queryKey: ['active-bets'] });
    },
    onError: (err) => {
      console.error('Error adding bet:', err);
      toast.error('Failed to add bet');
    },
  });

  const cancelBetMutation = useMutation({
    mutationFn: async (betId: string) => {
      const { error } = await supabase
        .from('active_bets')
        .update({ status: 'cancelled' })
        .eq('id', betId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Bet cancelled');
      queryClient.invalidateQueries({ queryKey: ['active-bets'] });
    },
    onError: (err) => {
      console.error('Error cancelling bet:', err);
      toast.error('Failed to cancel bet');
    },
  });

  return {
    activeBets,
    pendingBets,
    completedBets,
    isLoading,
    error,
    refetch,
    checkResults,
    isChecking,
    addBet: addBetMutation.mutate,
    cancelBet: cancelBetMutation.mutate,
    isAdding: addBetMutation.isPending,
  };
}
