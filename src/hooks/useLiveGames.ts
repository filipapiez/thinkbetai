import { useState, useEffect, useCallback } from 'react';
import { LiveGame, LiveTeam } from '@/lib/liveTypes';
import { toast } from 'sonner';

interface APIGame {
  id: string;
  sportKey: string;
  sportTitle: string;
  commenceTime: string;
  homeTeam: string;
  awayTeam: string;
  homeAbbr?: string;
  awayAbbr?: string;
  status?: string;
  bookmaker: string;
  odds: {
    moneyline: { home: number; away: number };
    spread: { home: number; homeOdds: number; away: number; awayOdds: number };
    total: { over: number; overOdds: number; under: number; underOdds: number };
  };
  hasOdds: boolean;
}

interface APIResponse {
  games: APIGame[];
  remainingRequests: number | null;
  lastUpdated: string;
}

// Map sport keys to display names
const sportDisplayNames: Record<string, string> = {
  'nba': 'NBA',
  'nfl': 'NFL',
  'mlb': 'MLB',
  'nhl': 'NHL',
  'ncaab': 'NCAAB',
  'ncaaf': 'NCAAF',
  'epl': 'Soccer',
  'ufc': 'MMA',
  'atp': 'Tennis',
  'pga': 'Golf',
  'boxing': 'Boxing',
};

function transformGame(apiGame: APIGame): LiveGame {
  const homeTeam: LiveTeam = {
    id: apiGame.homeTeam.toLowerCase().replace(/\s+/g, '-'),
    name: apiGame.homeTeam,
    abbreviation: apiGame.homeAbbr || apiGame.homeTeam.substring(0, 3).toUpperCase(),
    stats: undefined, // Stats would need separate API call
  };
  
  const awayTeam: LiveTeam = {
    id: apiGame.awayTeam.toLowerCase().replace(/\s+/g, '-'),
    name: apiGame.awayTeam,
    abbreviation: apiGame.awayAbbr || apiGame.awayTeam.substring(0, 3).toUpperCase(),
    stats: undefined,
  };
  
  const sportKey = apiGame.sportKey.toLowerCase();
  const sport = sportDisplayNames[sportKey] || apiGame.sportTitle || sportKey.toUpperCase();
  
  const status = apiGame.status === 'live' ? 'live' : 
                 apiGame.status === 'final' ? 'final' : 'scheduled';
  
  return {
    id: apiGame.id,
    sport,
    sportKey,
    homeTeam,
    awayTeam,
    startTime: apiGame.commenceTime,
    venue: `${homeTeam.name} Arena`,
    status,
    odds: apiGame.odds,
    hasOdds: apiGame.hasOdds,
  };
}

// All sports to fetch - expanded list
const SPORTS_TO_FETCH = ['nba', 'nfl', 'nhl', 'ncaab', 'ncaaf', 'mlb', 'soccer', 'mma', 'tennis'];

// Store for game lookup by ID
let gamesCache: Map<string, LiveGame> = new Map();

export function getGameById(gameId: string): LiveGame | undefined {
  return gamesCache.get(gameId);
}

export function useLiveGames() {
  const [games, setGames] = useState<LiveGame[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [remainingRequests, setRemainingRequests] = useState<number | null>(null);

  const fetchGames = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const baseUrl = import.meta.env.VITE_SUPABASE_URL;
      const allGames: LiveGame[] = [];
      
      // Fetch from multiple sports in parallel
      const fetchPromises = SPORTS_TO_FETCH.map(async (sport) => {
        try {
          const response = await fetch(
            `${baseUrl}/functions/v1/get-odds?sport=${sport}`,
            {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' },
            }
          );

          if (!response.ok) {
            console.warn(`Failed to fetch ${sport}: ${response.status}`);
            return [];
          }

          const result: APIResponse = await response.json();
          return result.games.map(transformGame);
        } catch (err) {
          console.warn(`Error fetching ${sport}:`, err);
          return [];
        }
      });

      const results = await Promise.all(fetchPromises);
      results.forEach(sportGames => allGames.push(...sportGames));
      
      // Sort by start time
      allGames.sort((a, b) => 
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );
      
      // Update cache for game lookup
      gamesCache = new Map();
      allGames.forEach(game => gamesCache.set(game.id, game));
      
      setGames(allGames);
      setLastUpdated(new Date().toISOString());

      if (allGames.length === 0) {
        toast.info('No upcoming games found');
      } else {
        console.log(`Loaded ${allGames.length} games across ${SPORTS_TO_FETCH.length} sports`);
      }

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch games';
      setError(message);
      toast.error(`Error: ${message}`);
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
    remainingRequests,
    refetch: fetchGames,
  };
}
