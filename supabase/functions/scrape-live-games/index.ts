const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// POPULAR GAMES SCRAPER - ESPN SCHEDULES
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

// Sports to track - using ESPN schedule URLs
const SPORTS_CONFIG = [
  { sport: 'Football', url: 'https://www.espn.com/nfl/schedule', league: 'NFL' },
  { sport: 'Football', url: 'https://www.espn.com/college-football/schedule', league: 'NCAAF' },
  { sport: 'Basketball', url: 'https://www.espn.com/nba/schedule', league: 'NBA' },
  { sport: 'Basketball', url: 'https://www.espn.com/mens-college-basketball/schedule', league: 'NCAAB' },
  { sport: 'Hockey', url: 'https://www.espn.com/nhl/schedule', league: 'NHL' },
  { sport: 'Baseball', url: 'https://www.espn.com/mlb/schedule', league: 'MLB' },
  { sport: 'Soccer', url: 'https://www.espn.com/soccer/schedule/_/league/eng.1', league: 'EPL' },
  { sport: 'Soccer', url: 'https://www.espn.com/soccer/schedule/_/league/uefa.champions', league: 'Champions League' },
  { sport: 'Soccer', url: 'https://www.espn.com/soccer/schedule/_/league/esp.1', league: 'La Liga' },
  { sport: 'Soccer', url: 'https://www.espn.com/soccer/schedule/_/league/usa.1', league: 'MLS' },
  { sport: 'MMA', url: 'https://www.espn.com/mma/schedule/_/league/ufc', league: 'UFC' },
  { sport: 'Boxing', url: 'https://www.espn.com/boxing/schedule', league: 'Boxing' },
  { sport: 'Tennis', url: 'https://www.espn.com/tennis/schedule', league: 'ATP/WTA' },
  { sport: 'Golf', url: 'https://www.espn.com/golf/schedule', league: 'PGA' },
  { sport: 'Table Tennis', url: 'https://www.espn.com/olympics/schedule', league: 'Table Tennis' },
];

// Major leagues ranked by popularity
const LEAGUE_POPULARITY: Record<string, number> = {
  'NFL': 100,
  'NCAAF': 85,
  'NBA': 95,
  'NCAAB': 80,
  'MLB': 85,
  'NHL': 80,
  'EPL': 90,
  'La Liga': 85,
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
  'cowboys', 'dallas cowboys', 'patriots', 'new england patriots', 'packers', 'green bay packers',
  '49ers', 'san francisco 49ers', 'chiefs', 'kansas city chiefs', 'eagles', 'philadelphia eagles',
  'ravens', 'baltimore ravens', 'bills', 'buffalo bills', 'rams', 'los angeles rams',
  'broncos', 'denver broncos', 'dolphins', 'miami dolphins', 'giants', 'new york giants',
  'jets', 'new york jets', 'bears', 'chicago bears', 'steelers', 'pittsburgh steelers',
  'raiders', 'las vegas raiders', 'lions', 'detroit lions', 'texans', 'houston texans',
  // NBA
  'lakers', 'los angeles lakers', 'celtics', 'boston celtics', 'warriors', 'golden state warriors',
  'bulls', 'chicago bulls', 'heat', 'miami heat', 'nets', 'brooklyn nets', 'knicks', 'new york knicks',
  'mavericks', 'dallas mavericks', 'suns', 'phoenix suns', 'bucks', 'milwaukee bucks',
  'nuggets', 'denver nuggets', 'clippers', 'la clippers', 'spurs', 'san antonio spurs',
  'rockets', 'houston rockets', 'sixers', '76ers', 'philadelphia 76ers',
  // MLB
  'yankees', 'new york yankees', 'dodgers', 'los angeles dodgers', 'red sox', 'boston red sox',
  'cubs', 'chicago cubs', 'astros', 'houston astros', 'braves', 'atlanta braves',
  'phillies', 'philadelphia phillies', 'mets', 'new york mets', 'cardinals', 'st. louis cardinals',
  // NHL
  'bruins', 'boston bruins', 'rangers', 'new york rangers', 'blackhawks', 'chicago blackhawks',
  'penguins', 'pittsburgh penguins', 'maple leafs', 'toronto maple leafs', 'canadiens', 'montreal canadiens',
  'red wings', 'detroit red wings', 'oilers', 'edmonton oilers', 'knights', 'vegas golden knights',
  // Soccer
  'manchester united', 'man united', 'real madrid', 'barcelona', 'liverpool', 'chelsea', 'arsenal',
  'man city', 'manchester city', 'bayern', 'bayern munich', 'juventus', 'psg', 'paris saint-germain',
  'inter milan', 'ac milan', 'tottenham', 'dortmund', 'borussia dortmund',
  // UFC fighters
  'mcgregor', 'conor mcgregor', 'jones', 'jon jones', 'adesanya', 'israel adesanya',
  'makhachev', 'islam makhachev', 'pereira', 'alex pereira', 'chimaev', 'khamzat chimaev',
]);

// High-importance event keywords
const IMPORTANCE_KEYWORDS = [
  'playoff', 'playoffs', 'final', 'finals', 'championship', 'super bowl',
  'world series', 'stanley cup', 'conference', 'semi-final', 'semifinal',
  'derby', 'rivalry', 'prime time', 'primetime', 'main event', 'title fight',
  'main card', 'ppv', 'fight night', 'ufc', 'wild card', 'division'
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
    if (homeLower.includes(team) || team.includes(homeLower.split(' ').pop() || '')) score += 15;
    if (awayLower.includes(team) || team.includes(awayLower.split(' ').pop() || '')) score += 15;
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

async function scrapeESPNSchedule(apiKey: string, config: { sport: string; url: string; league: string }): Promise<ScheduledGame[]> {
  const games: ScheduledGame[] = [];
  
  try {
    console.log(`[Scraper] Fetching: ${config.league} from ESPN`);
    
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: config.url,
        formats: ['markdown'],
        onlyMainContent: true,
        waitFor: 2000,
      }),
    });

    if (!response.ok) {
      console.warn(`[Scraper] Failed ${config.league}: HTTP ${response.status}`);
      return games;
    }

    const data = await response.json();
    const markdown = data.data?.markdown || data.markdown || '';
    
    if (!markdown || markdown.length < 100) {
      console.warn(`[Scraper] Empty content for ${config.league}`);
      return games;
    }
    
    // Parse ESPN schedule format
    const extractedGames = parseESPNSchedule(markdown, config);
    console.log(`[Scraper] Found ${extractedGames.length} games in ${config.league}`);
    
    games.push(...extractedGames);
    
  } catch (error) {
    console.warn(`[Scraper] Error fetching ${config.league}:`, error);
  }
  
  return games;
}

function parseESPNSchedule(content: string, config: { sport: string; league: string }): ScheduledGame[] {
  const games: ScheduledGame[] = [];
  const lines = content.split('\n');
  
  // ESPN patterns for matching games
  const teamVsPatterns = [
    // "Team A vs Team B" or "Team A @ Team B"
    /([A-Z][A-Za-z\s\.\-']+?)\s+(?:vs\.?|v\.?|@|at)\s+([A-Z][A-Za-z\s\.\-']+?)(?:\s*\||\s*-|\s*$)/gi,
    // "Team A - Team B" format
    /([A-Z][A-Za-z\s\.\-']{2,30})\s+[-–]\s+([A-Z][A-Za-z\s\.\-']{2,30})/gi,
    // Links format [Team Name](url)
    /\[([A-Z][A-Za-z\s\.\-']+)\]\([^)]+\)\s*(?:vs\.?|@|at|-)\s*\[([A-Z][A-Za-z\s\.\-']+)\]/gi,
  ];
  
  // Date patterns
  const datePattern = /(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)[,\s]+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[.\s]+\d{1,2}/gi;
  const shortDatePattern = /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2}/gi;
  
  // Time pattern
  const timePattern = /\d{1,2}:\d{2}\s*(?:AM|PM|ET|PT|CT|MT|EST|PST|CST)?/gi;
  
  let currentDate = '';
  const seenGames = new Set<string>();
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.length < 5) continue;
    
    // Update current date
    const longDateMatch = line.match(datePattern);
    if (longDateMatch) {
      currentDate = longDateMatch[0];
    } else {
      const shortDateMatch = line.match(shortDatePattern);
      if (shortDateMatch) {
        currentDate = shortDateMatch[0];
      }
    }
    
    // Try to extract games
    for (const pattern of teamVsPatterns) {
      pattern.lastIndex = 0;
      let match;
      
      while ((match = pattern.exec(line)) !== null) {
        let homeTeam = cleanTeamName(match[2]); // ESPN shows away @ home
        let awayTeam = cleanTeamName(match[1]);
        
        // Swap if "vs" pattern (home vs away)
        if (line.includes(' vs')) {
          [homeTeam, awayTeam] = [awayTeam, homeTeam];
        }
        
        // Validate team names
        if (!isValidTeamName(homeTeam) || !isValidTeamName(awayTeam)) continue;
        if (homeTeam.toLowerCase() === awayTeam.toLowerCase()) continue;
        
        // Deduplicate
        const gameKey = `${homeTeam.toLowerCase()}-${awayTeam.toLowerCase()}`;
        const reverseKey = `${awayTeam.toLowerCase()}-${homeTeam.toLowerCase()}`;
        if (seenGames.has(gameKey) || seenGames.has(reverseKey)) continue;
        seenGames.add(gameKey);
        
        // Extract time
        let gameTime = '';
        const timeMatches = line.match(timePattern);
        if (timeMatches) {
          gameTime = timeMatches[0];
        }
        
        const startTime = parseGameDateTime(currentDate, gameTime);
        
        const game: ScheduledGame = {
          id: `${config.league}_${homeTeam}_${awayTeam}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`.replace(/\s/g, '_'),
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
          league: config.league,
          homeTeam,
          awayTeam,
          context: line + ' ' + currentDate,
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
    .replace(/^\d+[\.\)]\s*/, '') // Remove leading numbers
    .replace(/\[.*?\]/g, '') // Remove markdown links
    .replace(/\(.*?\)/g, '') // Remove parentheses
    .replace(/^\W+/, '') // Remove leading special chars
    .replace(/\W+$/, '') // Remove trailing special chars
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 35);
}

function isValidTeamName(name: string): boolean {
  if (!name || name.length < 2 || name.length > 35) return false;
  
  // Must start with a letter
  if (!/^[A-Za-z]/.test(name)) return false;
  
  // Skip common non-team words
  const skipWords = ['time', 'date', 'schedule', 'game', 'match', 'live', 'watch', 'stream', 'espn', 'tv', 'network'];
  const nameLower = name.toLowerCase();
  for (const skip of skipWords) {
    if (nameLower === skip) return false;
  }
  
  return true;
}

function parseGameDateTime(dateStr: string, timeStr: string): string {
  const now = new Date();
  
  try {
    if (dateStr) {
      // Clean up the date string
      const cleanDate = dateStr.replace(/(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)[,\s]*/i, '');
      const parsedDate = new Date(cleanDate + `, ${now.getFullYear()}`);
      
      if (!isNaN(parsedDate.getTime())) {
        // If the date is in the past, assume next year
        if (parsedDate < now && parsedDate.getMonth() < now.getMonth()) {
          parsedDate.setFullYear(now.getFullYear() + 1);
        }
        
        if (timeStr) {
          const timeParts = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM|ET|EST|PT|PST|CT|CST)?/i);
          if (timeParts) {
            let hours = parseInt(timeParts[1]);
            const minutes = parseInt(timeParts[2]);
            const period = timeParts[3]?.toUpperCase();
            
            if (period && period.includes('PM') && hours < 12) hours += 12;
            if (period && period.includes('AM') && hours === 12) hours = 0;
            
            parsedDate.setHours(hours, minutes, 0, 0);
          }
        }
        
        return parsedDate.toISOString();
      }
    }
  } catch {}
  
  // Default to today or tomorrow
  const defaultDate = new Date();
  defaultDate.setHours(defaultDate.getHours() + 6); // Assume 6 hours from now
  return defaultDate.toISOString();
}

async function fetchInjuryInfo(apiKey: string, teams: string[]): Promise<Record<string, string[]>> {
  const injuries: Record<string, string[]> = {};
  
  try {
    // Search for injury news on top teams (limit to avoid too many requests)
    const topTeams = [...new Set(teams)].slice(0, 6);
    
    for (const team of topTeams) {
      const query = `${team} injury report latest news`;
      
      try {
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
            const injuryMatch = desc.match(/([A-Z][a-z]+ [A-Z][a-z]+)\s+(out|questionable|doubtful|injured|injury|GTD)/gi);
            if (injuryMatch) {
              teamInjuries.push(...injuryMatch.slice(0, 2));
            }
          }
          
          if (teamInjuries.length > 0) {
            injuries[team] = teamInjuries;
          }
        }
      } catch (e) {
        // Ignore individual injury search errors
      }
      
      await new Promise(r => setTimeout(r, 300));
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

    console.log('[Scraper] Fetching fresh data from ESPN schedules');
    
    // Scrape schedules from ESPN (limit concurrent to avoid rate limits)
    const allGames: ScheduledGame[] = [];
    
    for (const config of SPORTS_CONFIG) {
      const games = await scrapeESPNSchedule(apiKey, config);
      allGames.push(...games);
      
      // Polite delay between requests
      await new Promise(r => setTimeout(r, 1000));
    }
    
    console.log(`[Scraper] Total games found: ${allGames.length}`);
    
    // Get top 15 games
    let topGames = deduplicateAndRank(allGames);
    
    // Fetch injury info for top games
    if (topGames.length > 0) {
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
    }
    
    // Update cache
    cachedGames = topGames;
    cacheTimestamp = Date.now();
    
    console.log(`[Scraper] Returning ${topGames.length} high-interest games`);

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
