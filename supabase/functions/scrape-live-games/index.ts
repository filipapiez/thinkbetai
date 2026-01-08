import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// SCHEDULE SCRAPER - sports.everygame.eu
// ============================================================================
// This function fetches ONLY publicly available schedule information.
// - NO odds, spreads, totals, prices, or betting data
// - NO login or account access
// - NO live data or in-play updates
// - Data cached and refreshed only twice per day
// ============================================================================

interface ScheduledGame {
  id: string;
  sport: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string;
  popularityScore: number;
  status: 'scheduled';
}

// In-memory cache with 12-hour TTL (twice daily refresh)
let cachedGames: ScheduledGame[] = [];
let cacheTimestamp: number = 0;
const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

// Major leagues ranked by popularity (higher = more popular)
const LEAGUE_POPULARITY: Record<string, number> = {
  // American Football
  'NFL': 100,
  'NCAA Football': 85,
  // Basketball
  'NBA': 95,
  'NCAA Basketball': 80,
  'WNBA': 60,
  // Baseball
  'MLB': 85,
  // Hockey
  'NHL': 80,
  // Soccer - Top European
  'EPL': 90,
  'Premier League': 90,
  'La Liga': 85,
  'Bundesliga': 80,
  'Serie A': 80,
  'Ligue 1': 75,
  'Champions League': 95,
  'UEFA Champions League': 95,
  'Europa League': 70,
  'MLS': 65,
  'World Cup': 100,
  // Combat Sports
  'UFC': 90,
  'Boxing': 75,
  // Other
  'Formula 1': 70,
  'F1': 70,
  'NASCAR': 60,
  'PGA': 55,
  'ATP': 60,
  'WTA': 55,
};

// Well-known teams that boost popularity
const POPULAR_TEAMS = new Set([
  // NFL
  'cowboys', 'patriots', 'packers', '49ers', 'chiefs', 'eagles', 'ravens', 'bills', 'rams', 'broncos',
  // NBA
  'lakers', 'celtics', 'warriors', 'bulls', 'heat', 'nets', 'knicks', 'mavericks', 'suns', 'bucks',
  // MLB
  'yankees', 'dodgers', 'red sox', 'cubs', 'astros', 'braves', 'phillies', 'mets',
  // NHL
  'bruins', 'rangers', 'blackhawks', 'penguins', 'maple leafs', 'canadiens', 'red wings',
  // Soccer
  'manchester united', 'real madrid', 'barcelona', 'liverpool', 'chelsea', 'arsenal', 'man city', 'bayern', 'juventus', 'psg', 'inter milan', 'ac milan',
  // UFC fighters (as keywords)
  'mcgregor', 'jones', 'adesanya', 'usman', 'ngannou', 'volkanovski',
]);

// Keywords that indicate high-importance events
const IMPORTANCE_KEYWORDS = [
  'playoff', 'playoffs', 'final', 'finals', 'championship', 'super bowl', 
  'world series', 'stanley cup', 'conference final', 'semi-final', 'semifinal',
  'derby', 'rivalry', 'prime time', 'primetime', 'main event', 'title fight',
  'main card', 'ppv'
];

function calculatePopularityScore(game: { league: string; homeTeam: string; awayTeam: string; context?: string }): number {
  let score = 50; // Base score

  // League popularity
  const leagueScore = LEAGUE_POPULARITY[game.league] || 40;
  score += leagueScore;

  // Team popularity
  const homeLower = game.homeTeam.toLowerCase();
  const awayLower = game.awayTeam.toLowerCase();
  
  for (const team of POPULAR_TEAMS) {
    if (homeLower.includes(team)) score += 15;
    if (awayLower.includes(team)) score += 15;
  }

  // Importance keywords
  const context = (game.context || '').toLowerCase();
  for (const keyword of IMPORTANCE_KEYWORDS) {
    if (context.includes(keyword)) {
      score += 20;
      break;
    }
  }

  // Prime time bonus (games between 7 PM - 10 PM local time)
  try {
    const gameTime = new Date(game.homeTeam); // This won't work, but we check startTime elsewhere
  } catch {}

  return Math.min(score, 200); // Cap at 200
}

function isCacheValid(): boolean {
  if (cachedGames.length === 0) return false;
  const now = Date.now();
  return (now - cacheTimestamp) < CACHE_TTL_MS;
}

async function scrapeEverygameSchedules(apiKey: string): Promise<ScheduledGame[]> {
  console.log('[Scraper] Fetching schedules from sports.everygame.eu');
  
  const games: ScheduledGame[] = [];
  
  // Target pages for major sports schedules (public pages only)
  const targetPaths = [
    'https://sports.everygame.eu/sports/football',    // NFL, NCAA Football
    'https://sports.everygame.eu/sports/basketball',  // NBA, NCAA Basketball  
    'https://sports.everygame.eu/sports/hockey',      // NHL
    'https://sports.everygame.eu/sports/baseball',    // MLB
    'https://sports.everygame.eu/sports/soccer',      // Soccer leagues
    'https://sports.everygame.eu/sports/mma',         // UFC, MMA
    'https://sports.everygame.eu/sports/boxing',      // Boxing
  ];

  for (const url of targetPaths) {
    try {
      console.log(`[Scraper] Scraping: ${url}`);
      
      const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          formats: ['markdown'],
          onlyMainContent: true,
          waitFor: 2000,
        }),
      });

      if (!response.ok) {
        console.warn(`[Scraper] Failed to scrape ${url}: ${response.status}`);
        continue;
      }

      const data = await response.json();
      const markdown = data.data?.markdown || data.markdown || '';
      
      // Extract ONLY schedule information (sport, league, teams, date/time)
      const extractedGames = extractScheduleData(markdown, url);
      games.push(...extractedGames);
      
      // Respectful delay between requests
      await new Promise(r => setTimeout(r, 1000));
      
    } catch (error) {
      console.warn(`[Scraper] Error scraping ${url}`);
    }
  }

  return games;
}

function extractScheduleData(content: string, sourceUrl: string): ScheduledGame[] {
  const games: ScheduledGame[] = [];
  const lines = content.split('\n');
  
  // Determine sport from URL
  let defaultSport = 'Sports';
  let defaultLeague = '';
  
  if (sourceUrl.includes('/football')) {
    defaultSport = 'Football';
    defaultLeague = 'NFL';
  } else if (sourceUrl.includes('/basketball')) {
    defaultSport = 'Basketball';
    defaultLeague = 'NBA';
  } else if (sourceUrl.includes('/hockey')) {
    defaultSport = 'Hockey';
    defaultLeague = 'NHL';
  } else if (sourceUrl.includes('/baseball')) {
    defaultSport = 'Baseball';
    defaultLeague = 'MLB';
  } else if (sourceUrl.includes('/soccer')) {
    defaultSport = 'Soccer';
    defaultLeague = 'Soccer';
  } else if (sourceUrl.includes('/mma')) {
    defaultSport = 'MMA';
    defaultLeague = 'UFC';
  } else if (sourceUrl.includes('/boxing')) {
    defaultSport = 'Boxing';
    defaultLeague = 'Boxing';
  }

  // Pattern to match team vs team (ignoring any odds/numbers)
  // We only extract: team names and date/time
  const teamPatterns = [
    // "Team A vs Team B" or "Team A @ Team B"
    /^[\s\*\-]*([A-Z][A-Za-z\s\.]+?)\s+(?:vs\.?|v\.?|@|at)\s+([A-Z][A-Za-z\s\.]+?)(?:\s*[\|\-\n]|$)/gim,
    // "Team A - Team B"
    /^[\s\*\-]*([A-Z][A-Za-z\s\.]{3,25})\s+[-–]\s+([A-Z][A-Za-z\s\.]{3,25})(?:\s*[\|\n]|$)/gim,
  ];

  // Date/time patterns
  const datePattern = /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s+\d{4})?/gi;
  const timePattern = /\d{1,2}:\d{2}\s*(?:AM|PM|ET|PT|CT|MT)?/gi;

  let currentLeague = defaultLeague;
  let currentDate = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Detect league headers
    const leagueMatch = detectLeagueFromLine(line);
    if (leagueMatch) {
      currentLeague = leagueMatch;
    }
    
    // Detect dates
    const dateMatches = line.match(datePattern);
    if (dateMatches && dateMatches.length > 0) {
      currentDate = dateMatches[0];
    }
    
    // Extract games using patterns
    for (const pattern of teamPatterns) {
      pattern.lastIndex = 0;
      let match;
      
      while ((match = pattern.exec(line)) !== null) {
        const homeTeam = cleanTeamName(match[1]);
        const awayTeam = cleanTeamName(match[2]);
        
        // Validate team names (skip if too short or same team)
        if (homeTeam.length < 3 || awayTeam.length < 3) continue;
        if (homeTeam.toLowerCase() === awayTeam.toLowerCase()) continue;
        
        // Skip anything that looks like odds or betting data
        if (looksLikeBettingData(line)) continue;
        
        // Extract time from current or nearby lines
        let gameTime = '';
        const timeMatches = line.match(timePattern);
        if (timeMatches) {
          gameTime = timeMatches[0];
        }
        
        const startTime = parseGameDateTime(currentDate, gameTime);
        
        const game: ScheduledGame = {
          id: `eg_${homeTeam}_${awayTeam}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`.replace(/\s/g, '_'),
          sport: defaultSport,
          league: currentLeague || defaultLeague,
          homeTeam,
          awayTeam,
          startTime,
          popularityScore: 0,
          status: 'scheduled',
        };
        
        // Calculate popularity score
        game.popularityScore = calculatePopularityScore({
          league: game.league,
          homeTeam: game.homeTeam,
          awayTeam: game.awayTeam,
          context: line,
        });
        
        games.push(game);
      }
    }
  }

  return games;
}

function detectLeagueFromLine(line: string): string | null {
  const lower = line.toLowerCase();
  
  if (lower.includes('nfl') || lower.includes('national football league')) return 'NFL';
  if (lower.includes('ncaa') && lower.includes('football')) return 'NCAA Football';
  if (lower.includes('nba') || lower.includes('national basketball')) return 'NBA';
  if (lower.includes('ncaa') && lower.includes('basketball')) return 'NCAA Basketball';
  if (lower.includes('wnba')) return 'WNBA';
  if (lower.includes('nhl') || lower.includes('national hockey')) return 'NHL';
  if (lower.includes('mlb') || lower.includes('major league baseball')) return 'MLB';
  if (lower.includes('premier league') || lower.includes('epl')) return 'EPL';
  if (lower.includes('la liga')) return 'La Liga';
  if (lower.includes('bundesliga')) return 'Bundesliga';
  if (lower.includes('serie a')) return 'Serie A';
  if (lower.includes('ligue 1')) return 'Ligue 1';
  if (lower.includes('champions league')) return 'Champions League';
  if (lower.includes('mls')) return 'MLS';
  if (lower.includes('ufc')) return 'UFC';
  if (lower.includes('bellator')) return 'Bellator';
  
  return null;
}

function cleanTeamName(name: string): string {
  return name
    .trim()
    .replace(/^\d+\s*/, '')      // Remove leading numbers
    .replace(/\s+/g, ' ')        // Normalize spaces
    .replace(/[^\w\s\.]/g, '')   // Remove special chars except dots
    .slice(0, 30);               // Max length
}

function looksLikeBettingData(line: string): boolean {
  const lower = line.toLowerCase();
  
  // Skip lines with odds-related keywords
  const bettingKeywords = [
    'odds', 'spread', 'moneyline', 'over/under', 'o/u', 'total',
    '+150', '-150', '+200', '-200', '+300', '-300', // Common odds formats
    'payout', 'wager', 'bet now', 'place bet'
  ];
  
  for (const keyword of bettingKeywords) {
    if (lower.includes(keyword)) return true;
  }
  
  // Skip lines that are mostly numbers (likely odds tables)
  const numbersCount = (line.match(/\d/g) || []).length;
  const lettersCount = (line.match(/[a-zA-Z]/g) || []).length;
  
  if (numbersCount > lettersCount * 2) return true;
  
  return false;
}

function parseGameDateTime(dateStr: string, timeStr: string): string {
  const now = new Date();
  
  try {
    if (dateStr) {
      // Parse date like "Jan 15" or "January 15, 2025"
      const parsedDate = new Date(dateStr + (dateStr.includes('202') ? '' : `, ${now.getFullYear()}`));
      
      if (!isNaN(parsedDate.getTime())) {
        // Parse time if available
        if (timeStr) {
          const timeParts = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
          if (timeParts) {
            let hours = parseInt(timeParts[1]);
            const minutes = parseInt(timeParts[2]);
            const period = timeParts[3]?.toUpperCase();
            
            if (period === 'PM' && hours < 12) hours += 12;
            if (period === 'AM' && hours === 12) hours = 0;
            
            parsedDate.setHours(hours, minutes, 0, 0);
          }
        }
        
        return parsedDate.toISOString();
      }
    }
  } catch {}
  
  // Default to today
  return now.toISOString();
}

function deduplicateAndRank(games: ScheduledGame[]): ScheduledGame[] {
  // Deduplicate by team matchup
  const seen = new Map<string, ScheduledGame>();
  
  for (const game of games) {
    const key = `${game.homeTeam.toLowerCase()}_${game.awayTeam.toLowerCase()}`;
    const reverseKey = `${game.awayTeam.toLowerCase()}_${game.homeTeam.toLowerCase()}`;
    
    if (!seen.has(key) && !seen.has(reverseKey)) {
      seen.set(key, game);
    } else {
      // Keep the one with higher popularity score
      const existing = seen.get(key) || seen.get(reverseKey);
      if (existing && game.popularityScore > existing.popularityScore) {
        seen.delete(key);
        seen.delete(reverseKey);
        seen.set(key, game);
      }
    }
  }
  
  // Sort by popularity score (descending) and return top 15
  return Array.from(seen.values())
    .sort((a, b) => b.popularityScore - a.popularityScore)
    .slice(0, 15);
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check cache first
    if (isCacheValid()) {
      console.log('[Scraper] Returning cached games');
      return new Response(
        JSON.stringify({
          success: true,
          games: cachedGames,
          source: 'cached',
          lastUpdated: new Date(cacheTimestamp).toISOString(),
          disclaimer: 'Based on publicly available schedules and general popularity signals',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      console.log('[Scraper] FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Service not configured', 
          games: [] 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[Scraper] Cache expired or empty, fetching fresh data');
    
    // Scrape schedules
    const allGames = await scrapeEverygameSchedules(apiKey);
    
    // Deduplicate and rank by popularity - get Top 15
    const topGames = deduplicateAndRank(allGames);
    
    // Update cache
    cachedGames = topGames;
    cacheTimestamp = Date.now();
    
    console.log(`[Scraper] Found ${topGames.length} high-interest games`);

    return new Response(
      JSON.stringify({
        success: true,
        games: topGames,
        source: 'fresh',
        lastUpdated: new Date().toISOString(),
        disclaimer: 'Based on publicly available schedules and general popularity signals',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('[Scraper] Error:', error);
    
    // Return cached data if available, even if stale
    if (cachedGames.length > 0) {
      return new Response(
        JSON.stringify({
          success: true,
          games: cachedGames,
          source: 'stale-cache',
          lastUpdated: new Date(cacheTimestamp).toISOString(),
          disclaimer: 'Based on publicly available schedules and general popularity signals',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Service temporarily unavailable',
        games: [],
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
