import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Pick } from '@/hooks/usePicks';

export function useUserParlays() {
  const { user } = useAuth();
  const [parlayPicks, setParlayPicks] = useState<Pick[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load parlays from database on mount
  useEffect(() => {
    if (!user) {
      setParlayPicks([]);
      setIsLoading(false);
      return;
    }

    const loadParlays = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('user_parlays')
          .select('picks')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error loading parlays:', error);
          return;
        }

        if (data?.picks && Array.isArray(data.picks)) {
          setParlayPicks(data.picks as unknown as Pick[]);
        }
      } catch (err) {
        console.error('Failed to load parlays:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadParlays();
  }, [user]);

  // Save parlays to database
  const saveParlays = useCallback(async (picks: Pick[]) => {
    if (!user) return;

    setIsSaving(true);
    try {
      // First check if record exists
      const { data: existing } = await supabase
        .from('user_parlays')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        // Update existing record
        const { error } = await supabase
          .from('user_parlays')
          .update({ picks: JSON.parse(JSON.stringify(picks)) })
          .eq('user_id', user.id);

        if (error) console.error('Error updating parlays:', error);
      } else {
        // Insert new record
        const { error } = await supabase
          .from('user_parlays')
          .insert({ 
            user_id: user.id, 
            picks: JSON.parse(JSON.stringify(picks)) 
          });

        if (error) console.error('Error inserting parlays:', error);
      }
    } catch (err) {
      console.error('Failed to save parlays:', err);
    } finally {
      setIsSaving(false);
    }
  }, [user]);

  // Select a pick (add to parlay)
  const selectPick = useCallback((pick: Pick) => {
    setParlayPicks(prev => {
      const exists = prev.some(p => p.id === pick.id);
      const newPicks = exists 
        ? prev.filter(p => p.id !== pick.id)
        : [...prev, pick];
      
      // Save to database
      saveParlays(newPicks);
      return newPicks;
    });
  }, [saveParlays]);

  // Remove a pick from parlay
  const removePick = useCallback((pickId: string) => {
    setParlayPicks(prev => {
      const newPicks = prev.filter(p => p.id !== pickId);
      saveParlays(newPicks);
      return newPicks;
    });
  }, [saveParlays]);

  // Clear all picks
  const clearParlay = useCallback(() => {
    setParlayPicks([]);
    saveParlays([]);
  }, [saveParlays]);

  return {
    parlayPicks,
    isLoading,
    isSaving,
    selectPick,
    removePick,
    clearParlay,
  };
}
