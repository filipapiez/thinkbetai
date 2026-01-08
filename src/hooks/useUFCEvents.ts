import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface UFCFight {
  id: string;
  fighter1: string;
  fighter2: string;
  weightClass: string;
  isMainEvent: boolean;
  isTitleFight: boolean;
}

export interface UFCEvent {
  id: string;
  name: string;
  date: string;
  location: string;
  mainEvent?: string;
  fights: UFCFight[];
}

interface UseUFCEventsResult {
  events: UFCEvent[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useUFCEvents = (): UseUFCEventsResult => {
  const [events, setEvents] = useState<UFCEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('get-ufc-events');

      if (fnError) {
        console.error('Error fetching UFC events:', fnError);
        setError('Failed to load UFC events');
        return;
      }

      if (data?.success && data?.events) {
        setEvents(data.events);
      } else {
        setError(data?.error || 'Failed to load UFC events');
      }
    } catch (err) {
      console.error('Error fetching UFC events:', err);
      setError('Failed to load UFC events');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return {
    events,
    isLoading,
    error,
    refetch: fetchEvents,
  };
};
