const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// POPULAR GAMES SCRAPER
// ============================================================================
// Fetches high-interest games twice daily (9 AM and 10 PM)
// Includes: NFL, NBA, NHL, MLB, UFC, Soccer, Table Tennis, and more
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
  injuries?: string[];
}

// In-memory cache with 12-hour TTL (twice daily refresh at 9 AM and 10 PM)
let cachedGames: ScheduledGame[] = [];
let cacheTimestamp: number = 0;
const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

// Sports to track (15 most popular + UFC + Table Tennis)
const SPORTS_CONFIG = [
  { sport: 'Football', path: 'nfl', league: 'NFL' },
  { sport: 'Football', path: 'college-football', league: 'NCAAF' },
  { sport: 'Basketball', path: 'nba', league: 'NBA' },
  { sport: 'Basketball', path: 'college-basketball', league: 'NCAAB' },
  { sport: 'Hockey', path: 'nhl', league: 'NHL' },
  { sport: 'Baseball', path: 'mlb', league: 'MLB' },
  { sport: 'Soccer', path: 'soccer/epl', league: 'EPL' },
  { sport: 'Soccer', path: 'soccer/champions-league', league: 'Champions League' },
  { sport: 'Soccer', path: 'soccer/la-liga', league: 'La Liga' },
  { sport: 'Soccer', path: 'soccer/mls', league: 'MLS' },
  { sport: 'MMA', path: 'mma/ufc', league: 'UFC' },
  { sport: 'MMA', path: 'mma', league: 'MMA' },
  { sport: 'Boxing', path: 'boxing', league: 'Boxing' },
  { sport: 'Table Tennis', path: 'table-tennis', league: 'Table Tennis' },
  { sport: 'Tennis', path: 'tennis', league: 'ATP/WTA' },
  { sport: 'Golf', path: 'golf/pga-tour', league: 'PGA' },
];

// Major leagues ranked by popularity
const LEAGUE_POPULARITY: Record<string, number> = {
  'NFL': 100,
  'NCAAF': 85,
  'NBA': 95,
  'NCAAB': 80,
  'WNBA': 60,
  'MLB': 85,
  'NHL': 80,
  'EPL': 90,
  'Premier League': 90,
  'La Liga': 85,
  'Bundesliga': 80,
  'Serie A': 80,
  'Ligue 1': 75,
  'Champions League': 95,
  'MLS': 65,
  'UFC': 92,
  'MMA': 75,
  'Boxing': 78,
  'Table Tennis': 55,
  'ATP/WTA': 60,
  'PGA': 55,
};

// Popular teams for scoring
const POPULAR_TEAMS = new Set([
  // NFL
  'cowboys', 'patriots', 'packers', '49ers', 'chiefs', 'eagles', 'ravens', 'bills', 'rams', 'broncos',
  'dolphins', 'giants', 'jets', 'bears', 'steelers', 'raiders',
  // NBA
  'lakers', 'celtics', 'warriors', 'bulls', 'heat', 'nets', 'knicks', 'mavericks', 'suns', 'bucks',
  'nuggets', 'clippers', 'spurs', 'rockets', 'sixers', '76ers',
  // MLB
  'yankees', 'dodgers', 'red sox', 'cubs', 'astros', 'braves', 'phillies', 'mets', 'cardinals', 'giants',
  // NHL
  'bruins', 'rangers', 'blackhawks', 'penguins', 'maple leafs', 'canadiens', 'red wings', 'oilers', 'knights',
  // Soccer
  'manchester united', 'real madrid', 'barcelona', 'liverpool', 'chelsea', 'arsenal', 'man city', 
  'bayern', 'juventus', 'psg', 'inter milan', 'ac milan', 'tottenham', 'dortmund',
  // UFC fighters
  'mcgregor', 'jones', 'adesanya', 'usman', 'volkanovski', 'makhachev', 'pereira', 'o\'malley',
  'chimaev', 'covington', 'poirier', 'chandler', 'strickland', 'topuria',
]);

// High-importance event keywords
const IMPORTANCE_KEYWORDS = [
  'playoff', 'playoffs', 'final', 'finals', 'championship', 'super bowl',
  'world series', 'stanley cup', 'conference', 'semi-final', 'semifinal',
  'derby', 'rivalry', 'prime time', 'primetime', 'main event', 'title fight',
  'main card', 'ppv', 'fight night', 'ufc', 'numbered'
];

function calculatePopularityScore(game: { sport: string; league: string; homeTeam: string; awayTeam: string; context?: string }): number {
  let score = 50;

  // League popularity bonus
  const leagueScore = LEAGUE_POPULARITY[game.league] || 40;
  score += leagueScore;

  // Team popularity bonus
  const homeLower = game.homeTeam.toLowerCase();
  const awayLower = game.awayTeam.toLowerCase();
  
  for (const team of POPULAR_TEAMS) {
    if (homeLower.includes(team)) score += 15;
    if (awayLower.includes(team)) score += 15;
  }

  // UFC/MMA gets extra boost
  if (game.sport === 'MMA' || game.league === 'UFC') {
    score += 10;
  }

  // Importance keywords
  const context = (game.context || '').toLowerCase();
  for (const keyword of IMPORTANCE_KEYWORDS) {
    if (context.includes(keyword)) {
      score += 20;
      break;
    }
  }

  return Math.min(score, 200);
}

function isCacheValid(): boolean {
  if (cachedGames.length === 0) return false;
  const now = Date.now();
  return (now - cacheTimestamp) < CACHE_TTL_MS;
}

async function scrapeSchedules(apiKey: string): Promise<ScheduledGame[]> {
  console.log('[Scraper] Fetching popular games schedules');
  
  const games: ScheduledGame[] = [];
  const baseUrl = 'https://sportsbook.fanduel.com/';

  for (const config of SPORTS_CONFIG) {
    try {
      const url = `${baseUrl}${config.path}`;
      console.log(`[Scraper] Scraping: ${config.sport} - ${config.league}`);
      
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
          waitFor: 3000,
        }),
      });

      if (!response.ok) {
        console.warn(`[Scraper] Failed ${config.league}: ${response.status}`);
        continue;
      }

      const data = await response.json();
      const markdown = data.data?.markdown || data.markdown || '';
      
      const extractedGames = extractScheduleData(markdown, config);
      games.push(...extractedGames);
      
      // Respectful delay between requests
      await new Promise(r => setTimeout(r, 1500));
      
    } catch (error) {
      console.warn(`[Scraper] Error with ${config.league}:`, error);
    }
  }

  return games;
}

function extractScheduleData(content: string, config: { sport: string; league: string }): ScheduledGame[] {
  const games: ScheduledGame[] = [];
  const lines = content.split('\n');
  
  // Pattern to match team vs team
  const teamPatterns = [
    /([A-Z][A-Za-z\s\.'\-]+?)\s+(?:vs\.?|v\.?|@|at)\s+([A-Z][A-Za-z\s\.'\-]+?)(?:\s|$)/gi,
    /([A-Z][A-Za-z\s\.'\-]{2,25})\s+[-–]\s+([A-Z][A-Za-z\s\.'\-]{2,25})/gi,
  ];

  // Date/time patterns
  const datePattern = /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2}/gi;
  const timePattern = /\d{1,2}:\d{2}\s*(?:AM|PM|ET|PT|CT|MT)?/gi;

  let currentDate = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip betting-related content
    if (looksLikeBettingData(line)) continue;
    
    // Detect dates
    const dateMatches = line.match(datePattern);
    if (dateMatches && dateMatches.length > 0) {
      currentDate = dateMatches[0];
    }
    
    // Extract games
    for (const pattern of teamPatterns) {
      pattern.lastIndex = 0;
      let match;
      
      while ((match = pattern.exec(line)) !== null) {
        const homeTeam = cleanTeamName(match[1]);
        const awayTeam = cleanTeamName(match[2]);
        
        if (homeTeam.length < 2 || awayTeam.length < 2) continue;
        if (homeTeam.toLowerCase() === awayTeam.toLowerCase()) continue;
        
        // Extract time
        let gameTime = '';
        const timeMatches = line.match(timePattern);
        if (timeMatches) {
          gameTime = timeMatches[0];
        }
        
        const startTime = parseGameDateTime(currentDate, gameTime);
        
        const game: ScheduledGame = {
          id: `game_${config.league}_${homeTeam}_${awayTeam}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`.replace(/\s/g, '_'),
          sport: config.sport,
          league: config.league,
          homeTeam,
          awayTeam,
          startTime,
          popularityScore: 0,
          status: 'scheduled',
        };
        
        game.popularityScore = calculatePopularityScore({
          sport: config.sport,
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

function cleanTeamName(name: string): string {
  return name
    .trim()
    .replace(/^\d+\s*/, '')
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s\.'\-]/g, '')
    .slice(0, 35);
}

function looksLikeBettingData(line: string): boolean {
  const lower = line.toLowerCase();
  
  const bettingKeywords = [
    'odds', 'spread', 'moneyline', 'over/under', 'o/u', 'total', 'prop',
    '+150', '-150', '+200', '-200', '+300', '-300', '+400', '-400',
    'payout', 'wager', 'bet now', 'place bet', 'parlay', 'teaser', 'line'
  ];
  
  for (const keyword of bettingKeywords) {
    if (lower.includes(keyword)) return true;
  }
  
  // Skip lines that are mostly numbers
  const numbersCount = (line.match(/\d/g) || []).length;
  const lettersCount = (line.match(/[a-zA-Z]/g) || []).length;
  
  if (numbersCount > lettersCount * 1.5) return true;
  
  return false;
}

function parseGameDateTime(dateStr: string, timeStr: string): string {
  const now = new Date();
  
  try {
    if (dateStr) {
      const parsedDate = new Date(dateStr + `, ${now.getFullYear()}`);
      
      if (!isNaN(parsedDate.getTime())) {
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
  
  return now.toISOString();
}

async function fetchInjuryInfo(apiKey: string, teams: string[]): Promise<Record<string, string[]>> {
  const injuries: Record<string, string[]> = {};
  
  try {
    // Search for injury news on top teams
    const topTeams = teams.slice(0, 5);
    
    for (const team of topTeams) {
      const query = `${team} injury report latest`;
      
      const response = await fetch('https://api.firecrawl.dev/v1/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          limit: 2,
          tbs: 'qdr:d', // Last 24 hours
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const results = data.data || [];
        
        const teamInjuries: string[] = [];
        for (const result of results) {
          const desc = result.description || '';
          // Extract player names mentioned with injury keywords
          const injuryMatch = desc.match(/([A-Z][a-z]+ [A-Z][a-z]+)\s+(out|questionable|doubtful|injured|injury)/gi);
          if (injuryMatch) {
            teamInjuries.push(...injuryMatch.slice(0, 2));
          }
        }
        
        if (teamInjuries.length > 0) {
          injuries[team] = teamInjuries;
        }
      }
      
      await new Promise(r => setTimeout(r, 500));
    }
  } catch (error) {
    console.warn('[Scraper] Error fetching injuries:', error);
  }
  
  return injuries;
}

function deduplicateAndRank(games: ScheduledGame[]): ScheduledGame[] {
  const seen = new Map<string, ScheduledGame>();
  
  for (const game of games) {
    const key = `${game.homeTeam.toLowerCase()}_${game.awayTeam.toLowerCase()}_${game.league}`;
    const reverseKey = `${game.awayTeam.toLowerCase()}_${game.homeTeam.toLowerCase()}_${game.league}`;
    
    if (!seen.has(key) && !seen.has(reverseKey)) {
      seen.set(key, game);
    } else {
      const existing = seen.get(key) || seen.get(reverseKey);
      if (existing && game.popularityScore > existing.popularityScore) {
        seen.delete(key);
        seen.delete(reverseKey);
        seen.set(key, game);
      }
    }
  }
  
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
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      console.error('[Scraper] FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Service not configured', 
          games: [] 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[Scraper] Fetching fresh data');
    
    // Scrape schedules
    const allGames = await scrapeSchedules(apiKey);
    
    // Get top 15 games
    let topGames = deduplicateAndRank(allGames);
    
    // Fetch injury info for top games
    const teamNames = topGames.flatMap(g => [g.homeTeam, g.awayTeam]);
    const injuries = await fetchInjuryInfo(apiKey, teamNames);
    
    // Attach injuries to games
    topGames = topGames.map(game => ({
      ...game,
      injuries: [
        ...(injuries[game.homeTeam] || []),
        ...(injuries[game.awayTeam] || []),
      ].slice(0, 4),
    }));
    
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
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('[Scraper] Error:', error);
    
    // Return stale cache if available
    if (cachedGames.length > 0) {
      return new Response(
        JSON.stringify({
          success: true,
          games: cachedGames,
          source: 'stale-cache',
          lastUpdated: new Date(cacheTimestamp).toISOString(),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to fetch games',
        games: [],
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
