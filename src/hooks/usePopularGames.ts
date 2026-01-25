import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  generateMatchId, 
  normalizeTeamName, 
  isValidMatch,
  isKickoffInPast 
} from '@/lib/matchUtils';

export interface PopularGameOdds {
  moneyline?: { home: number; away: number; draw?: number };
  spread?: { home: number; homeOdds: number; away: number; awayOdds: number };
  total?: { over: number; overOdds: number; under: number; underOdds: number };
}

export interface PopularGame {
  id: string;
  sport: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string;
  popularityScore: number;
  status: 'scheduled' | 'live' | 'completed';
  injuries?: string[];
  odds?: PopularGameOdds;
  hasOdds?: boolean;
}

interface PopularGamesResponse {
  success: boolean;
  games: PopularGame[];
  source: 'cached' | 'fresh' | 'stale-cache';
  lastUpdated: string;
  error?: string;
}

// Local storage cache - reduced TTL to ensure fresh data
const CACHE_KEY = 'popular_games_cache_v2';
const CLIENT_CACHE_TTL = 30 * 1000; // 30 seconds client-side (reduced from 2 min)

function getClientCache(): { games: PopularGame[]; timestamp: number } | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {}
  return null;
}

function setClientCache(games: PopularGame[]): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      games,
      timestamp: Date.now(),
    }));
  } catch {}
}

/**
 * Validate and deduplicate games on client side
 * Uses proper match_id based logic to prevent duplicates
 */
function validateAndDeduplicateGames(games: PopularGame[]): PopularGame[] {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Step 1: Filter valid upcoming/live games
  const validGames = games.filter(game => {
    // Validate match data
    if (!isValidMatch({
      id: game.id,
      homeTeam: game.homeTeam,
      awayTeam: game.awayTeam,
      startTime: game.startTime,
    })) {
      return false;
    }
    
    // Always keep live games
    if (game.status === 'live') return true;
    
    // Filter out completed games
    if (game.status === 'completed') return false;
    
    // Filter out games with past kickoff times
    try {
      const gameDate = new Date(game.startTime);
      return gameDate >= startOfToday;
    } catch {
      return false;
    }
  });
  
  // Step 2: Deduplicate using match_id
  const matchMap = new Map<string, PopularGame>();
  
  for (const game of validGames) {
    const matchId = generateMatchId(game.homeTeam, game.awayTeam, game.startTime, game.league);
    
    if (!matchMap.has(matchId)) {
      // Store with consistent match_id
      matchMap.set(matchId, { ...game, id: matchId });
    } else {
      // Merge with existing - prefer odds, live status
      const existing = matchMap.get(matchId)!;
      const merged = { ...existing };
      
      if (game.status === 'live') merged.status = 'live';
      if (game.hasOdds && !existing.hasOdds) {
        merged.odds = game.odds;
        merged.hasOdds = true;
      }
      if (game.popularityScore > existing.popularityScore) {
        merged.popularityScore = game.popularityScore;
      }
      
      matchMap.set(matchId, merged);
    }
  }
  
  // Step 3: Return sorted by time then popularity
  return Array.from(matchMap.values()).sort((a, b) => {
    const timeA = new Date(a.startTime).getTime();
    const timeB = new Date(b.startTime).getTime();
    if (timeA !== timeB) return timeA - timeB;
    return b.popularityScore - a.popularityScore;
  });
}

export function usePopularGames() {
  const [games, setGames] = useState<PopularGame[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [source, setSource] = useState<string>('');

  const fetchGames = useCallback(async (forceRefresh = false) => {
    setIsLoading(true);
    setError(null);

    // Check client-side cache first (unless forcing refresh)
    if (!forceRefresh) {
      const clientCache = getClientCache();
      if (clientCache && (Date.now() - clientCache.timestamp) < CLIENT_CACHE_TTL) {
        console.log('[PopularGames] Using client cache');
        // Validate and deduplicate cached games
        const validGames = validateAndDeduplicateGames(clientCache.games);
        setGames(validGames);
        setLastUpdated(new Date(clientCache.timestamp).toISOString());
        setSource('client-cache');
        setIsLoading(false);
        return;
      }
    } else {
      // Clear client cache on force refresh
      try {
        localStorage.removeItem(CACHE_KEY);
      } catch {}
    }

    try {
      const baseUrl = import.meta.env.VITE_SUPABASE_URL;
      
      console.log('[PopularGames] Fetching from edge function', forceRefresh ? '(force refresh)' : '');
      
      // Get current session for auth token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log('[PopularGames] No active session, using cached data only');
        const clientCache = getClientCache();
        if (clientCache && clientCache.games.length > 0) {
          const validGames = validateAndDeduplicateGames(clientCache.games);
          setGames(validGames);
          setLastUpdated(new Date(clientCache.timestamp).toISOString());
          setSource('client-cache');
          setIsLoading(false);
          return;
        }
        throw new Error('Authentication required');
      }
      
      const url = forceRefresh 
        ? `${baseUrl}/functions/v1/scrape-live-games?refresh=true`
        : `${baseUrl}/functions/v1/scrape-live-games`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data: PopularGamesResponse = await response.json();
      
      if (data.success && data.games) {
        // Validate, deduplicate, and filter games client-side
        const validGames = validateAndDeduplicateGames(data.games);
        console.log(`[PopularGames] Received ${data.games.length} games, validated to ${validGames.length} unique matches`);
        
        setGames(validGames);
        setLastUpdated(data.lastUpdated);
        setSource(data.source);
        setClientCache(validGames);
        
        if (validGames.length === 0) {
          toast.info('No upcoming games available at this time');
        }
      } else {
        throw new Error(data.error || 'Failed to fetch games');
      }
      
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch games';
      console.error('[PopularGames] Error:', message);
      setError(message);
      
      // Fall back to client cache if available
      const clientCache = getClientCache();
      if (clientCache && clientCache.games.length > 0) {
        const validGames = validateAndDeduplicateGames(clientCache.games);
        setGames(validGames);
        setLastUpdated(new Date(clientCache.timestamp).toISOString());
        setSource('fallback-cache');
        toast.info('Using cached data');
      } else {
        toast.error('Failed to load games');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  return {
    games,
    isLoading,
    error,
    lastUpdated,
    source,
    refetch: () => fetchGames(true),
  };
}
