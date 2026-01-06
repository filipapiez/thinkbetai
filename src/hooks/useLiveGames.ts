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
  bookmaker: string;
  odds: {
    moneyline: { home: number; away: number };
    spread: { home: number; homeOdds: number; away: number; awayOdds: number };
    total: { over: number; overOdds: number; under: number; underOdds: number };
  };
  hasOdds: boolean;
  homeRecord?: string;
  awayRecord?: string;
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

// Parse record string like "22-15" to stats
function parseRecord(record?: string): { wins: number; losses: number; winPct: number } | undefined {
  if (!record) return undefined;
  const match = record.match(/(\d+)-(\d+)/);
  if (!match) return undefined;
  const wins = parseInt(match[1]);
  const losses = parseInt(match[2]);
  const total = wins + losses;
  return {
    wins,
    losses,
    winPct: total > 0 ? wins / total : 0.5,
  };
}

// Generate abbreviation from team name
function generateAbbreviation(name: string): string {
  // Common team abbreviations
  const knownAbbrs: Record<string, string> = {
    'los angeles lakers': 'LAL',
    'boston celtics': 'BOS',
    'golden state warriors': 'GSW',
    'miami heat': 'MIA',
    'new york knicks': 'NYK',
    'chicago bulls': 'CHI',
    'denver nuggets': 'DEN',
    'phoenix suns': 'PHX',
    'milwaukee bucks': 'MIL',
    'cleveland cavaliers': 'CLE',
    'oklahoma city thunder': 'OKC',
    'dallas mavericks': 'DAL',
    'houston rockets': 'HOU',
    'memphis grizzlies': 'MEM',
    'minnesota timberwolves': 'MIN',
    'new orleans pelicans': 'NOP',
    'san antonio spurs': 'SAS',
    'sacramento kings': 'SAC',
    'portland trail blazers': 'POR',
    'utah jazz': 'UTA',
    'orlando magic': 'ORL',
    'atlanta hawks': 'ATL',
    'charlotte hornets': 'CHA',
    'detroit pistons': 'DET',
    'indiana pacers': 'IND',
    'toronto raptors': 'TOR',
    'brooklyn nets': 'BKN',
    'philadelphia 76ers': 'PHI',
    'washington wizards': 'WAS',
    'los angeles clippers': 'LAC',
  };
  
  const lower = name.toLowerCase();
  if (knownAbbrs[lower]) return knownAbbrs[lower];
  
  // Take first 3 letters of last word
  const words = name.split(' ');
  const lastWord = words[words.length - 1];
  return lastWord.substring(0, 3).toUpperCase();
}

function transformGame(apiGame: APIGame): LiveGame {
  const homeStats = parseRecord(apiGame.homeRecord);
  const awayStats = parseRecord(apiGame.awayRecord);
  
  const homeTeam: LiveTeam = {
    id: apiGame.homeTeam.toLowerCase().replace(/\s+/g, '-'),
    name: apiGame.homeTeam,
    abbreviation: generateAbbreviation(apiGame.homeTeam),
    stats: homeStats,
  };
  
  const awayTeam: LiveTeam = {
    id: apiGame.awayTeam.toLowerCase().replace(/\s+/g, '-'),
    name: apiGame.awayTeam,
    abbreviation: generateAbbreviation(apiGame.awayTeam),
    stats: awayStats,
  };
  
  const sportKey = apiGame.sportKey.toLowerCase();
  const sport = sportDisplayNames[sportKey] || apiGame.sportTitle || sportKey.toUpperCase();
  
  return {
    id: apiGame.id,
    sport,
    sportKey,
    homeTeam,
    awayTeam,
    startTime: apiGame.commenceTime,
    venue: `${apiGame.homeTeam} Arena`,
    status: 'scheduled',
    odds: apiGame.odds,
    hasOdds: apiGame.hasOdds,
  };
}

// Sports to fetch (in priority order)
const SPORTS_TO_FETCH = ['nba', 'nfl', 'nhl', 'mlb', 'ncaab'];

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
      
      setGames(allGames);
      setLastUpdated(new Date().toISOString());

      if (allGames.length === 0) {
        toast.info('No upcoming games found');
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
