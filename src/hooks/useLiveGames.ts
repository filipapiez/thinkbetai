import { useState, useEffect, useCallback } from 'react';
import { LiveGame, LiveTeam } from '@/lib/liveTypes';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

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
  error?: string;
  rateLimited?: boolean;
  upstreamStatus?: number;
}

// Map sport keys to display names - 20+ popular sports
const sportDisplayNames: Record<string, string> = {
  // Major US Sports
  'nba': 'NBA',
  'nfl': 'NFL',
  'mlb': 'MLB',
  'nhl': 'NHL',
  'ncaab': 'NCAAB',
  'ncaaf': 'NCAAF',
  'wnba': 'WNBA',
  // Soccer Leagues
  'epl': 'Premier League',
  'laliga': 'La Liga',
  'bundesliga': 'Bundesliga',
  'seriea': 'Serie A',
  'mls': 'MLS',
  'ligue1': 'Ligue 1',
  'ucl': 'Champions League',
  // Combat Sports
  'ufc': 'UFC',
  'boxing': 'Boxing',
  // Tennis
  'atp': 'ATP Tennis',
  'wta': 'WTA Tennis',
  // Other Popular Sports
  'tabletennis': 'Table Tennis',
  'pga': 'Golf',
  'cricket': 'Cricket',
  'esports': 'Esports',
  'rugby': 'Rugby',
  'f1': 'Formula 1',
  'nascar': 'NASCAR',
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

// Sports to fetch from API (only valid SportsGameOdds league IDs)
// Reduced list to avoid rate limits - API supports: NBA, NFL, MLB, NHL, NCAAB, NCAAF, EPL, LALIGA, BUNDESLIGA, SERIEA, MLS, UFC, ATP, WTA
const SPORTS_TO_FETCH = [
  // Major US Sports (high priority)
  'nba', 'nfl', 'nhl', 'ncaab', 'ncaaf', 'mlb',
  // Soccer (top leagues)
  'epl', 'laliga', 'bundesliga', 'seriea', 'mls',
  // Combat & Tennis
  'ufc', 'atp', 'wta',
];

// Additional sports covered by scraping only (no API support)
// These are: boxing, tabletennis, pga, cricket, esports, rugby, f1, nascar, ligue1, ucl, wnba

// Store for game lookup by ID
let gamesCache: Map<string, LiveGame> = new Map();

// Cache for API responses - 10 min cache as per requirements
let apiCache: { data: LiveGame[]; timestamp: number } | null = null;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
const STORAGE_KEY = 'liveGamesCache_v1';

// Helper to delay between requests
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function getGameById(gameId: string): LiveGame | undefined {
  return gamesCache.get(gameId);
}

export function useLiveGames() {
  const [games, setGames] = useState<LiveGame[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [remainingRequests, setRemainingRequests] = useState<number | null>(null);

  const fetchGames = useCallback(async (forceRefresh = false) => {
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      // 1) In-memory cache
      if (apiCache && Date.now() - apiCache.timestamp < CACHE_DURATION) {
        setGames(apiCache.data);
        setLastUpdated(new Date(apiCache.timestamp).toISOString());
        setIsLoading(false);
        return;
      }

      // 2) Persisted cache (survives refresh)
      // Note: localStorage stores public game data (schedules/odds) - not sensitive
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          // Validate cache structure before using
          if (
            parsed &&
            typeof parsed === 'object' &&
            typeof parsed.timestamp === 'number' &&
            parsed.timestamp > 0 &&
            Array.isArray(parsed.data) &&
            Date.now() - parsed.timestamp < CACHE_DURATION
          ) {
            const validatedData = parsed.data as LiveGame[];
            apiCache = { data: validatedData, timestamp: parsed.timestamp };
            setGames(validatedData);
            setLastUpdated(new Date(parsed.timestamp).toISOString());
            setIsLoading(false);
            return;
          }
        }
      } catch {
        // Invalid cache data - clear it and continue to fetch fresh
        localStorage.removeItem(STORAGE_KEY);
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      const baseUrl = import.meta.env.VITE_SUPABASE_URL;
      const allGames: LiveGame[] = [];
      const seenIds = new Set<string>();
      
      // 1. Fetch from odds API (primary source)
      for (const sport of SPORTS_TO_FETCH) {
        try {
          const response = await fetch(`${baseUrl}/functions/v1/get-odds?sport=${sport}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          });

          if (!response.ok) {
            console.warn(`Failed to fetch ${sport}: ${response.status}`);
            // If auth/key issue, no point continuing
            if (response.status === 401) break;
            continue;
          }

          const result: APIResponse = await response.json();

          if (result.rateLimited) {
            console.warn(`Upstream rate limit hit on ${sport}; stopping API fetches for now.`);
            // Don't hammer the provider further
            break;
          }

          if (result.error) {
            console.warn(`API returned error for ${sport}: ${result.error}`);
            continue;
          }

          for (const game of result.games) {
            const transformed = transformGame(game);
            if (!seenIds.has(transformed.id)) {
              seenIds.add(transformed.id);
              allGames.push(transformed);
            }
          }

          await delay(1200);
        } catch (err) {
          console.warn(`Error fetching ${sport}:`, err);
        }
      }

      // 2. Supplement with scraped games from Google (via Firecrawl)
      try {
        console.log('Fetching scraped games from Google...');
        // Get user session for auth header
        const { data: { session } } = await supabase.auth.getSession();
        const authHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
        if (session?.access_token) {
          authHeaders['Authorization'] = `Bearer ${session.access_token}`;
        }
        const scrapedResponse = await fetch(
          `${baseUrl}/functions/v1/scrape-live-games?sport=all`,
          {
            method: 'GET',
            headers: authHeaders,
          }
        );

        if (scrapedResponse.ok) {
          const scrapedData = await scrapedResponse.json();
          if (scrapedData.success && scrapedData.games) {
            console.log(`Got ${scrapedData.games.length} scraped games`);
            for (const game of scrapedData.games) {
              const id = game.id || `scraped_${game.homeTeam}_${game.awayTeam}`;
              if (!seenIds.has(id)) {
                seenIds.add(id);
                // Transform scraped game to LiveGame format
                allGames.push({
                  id,
                  sport: sportDisplayNames[game.sport?.toLowerCase()] || game.league || game.sport || 'Unknown',
                  sportKey: game.sport?.toLowerCase() || 'unknown',
                  homeTeam: {
                    id: game.homeTeam.toLowerCase().replace(/\s+/g, '-'),
                    name: game.homeTeam,
                    abbreviation: game.homeTeam.substring(0, 3).toUpperCase(),
                    stats: undefined,
                  },
                  awayTeam: {
                    id: game.awayTeam.toLowerCase().replace(/\s+/g, '-'),
                    name: game.awayTeam,
                    abbreviation: game.awayTeam.substring(0, 3).toUpperCase(),
                    stats: undefined,
                  },
                  startTime: game.startTime,
                  venue: `${game.homeTeam} Arena`,
                  status: game.status || 'scheduled',
                  odds: undefined, // Scraped games don't have odds
                  hasOdds: false,
                });
              }
            }
          }
        }
      } catch (scrapeErr) {
        console.warn('Error fetching scraped games:', scrapeErr);
        // Non-fatal - continue with API games
      }
      
      // Sort by start time
      allGames.sort((a, b) => 
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );
      
      // Update caches
      gamesCache = new Map();
      allGames.forEach(game => gamesCache.set(game.id, game));
      apiCache = { data: allGames, timestamp: Date.now() };

      // Persist cache (so refresh doesn't re-hit the API)
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(apiCache));
      } catch {
        // ignore
      }
      
      setGames(allGames);
      setLastUpdated(new Date().toISOString());

      if (allGames.length === 0) {
        toast.info('No upcoming games found');
      } else {
        console.log(`Loaded ${allGames.length} total games`);
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
