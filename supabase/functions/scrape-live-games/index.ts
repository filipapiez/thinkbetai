import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting (per user, per minute)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // 10 requests per minute (scraping is expensive)
const RATE_WINDOW_MS = 60 * 1000;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(userId);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_WINDOW_MS });
    return true;
  }
  
  if (record.count >= RATE_LIMIT) {
    return false;
  }
  
  record.count++;
  return true;
}

// Authentication helper
async function authenticateUser(req: Request): Promise<{ userId: string } | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const token = authHeader.replace('Bearer ', '');
  const { data, error } = await supabase.auth.getUser(token);
  
  if (error || !data?.user) {
    return null;
  }

  return { userId: data.user.id };
}

interface ScrapedGame {
  id: string;
  homeTeam: string;
  awayTeam: string;
  sport: string;
  startTime: string;
  status: 'scheduled' | 'live' | 'final';
  homeScore?: number;
  awayScore?: number;
  league?: string;
}

// Allowed sports whitelist
const ALLOWED_SPORTS = ['all', 'soccer', 'tennis', 'tabletennis', 'basketball', 'football', 'hockey', 'baseball', 'boxing', 'mma', 'golf', 'cricket', 'esports', 'rugby', 'f1', 'nascar'];

const sportSearchQueries: Record<string, string[]> = {
  soccer: ['Premier League matches today', 'La Liga games today', 'Bundesliga fixtures today', 'Serie A matches today', 'MLS games today', 'Ligue 1 matches today', 'Champions League matches today'],
  tennis: ['ATP tennis matches today', 'WTA tennis matches today'],
  tabletennis: ['table tennis matches today live', 'ITTF table tennis today'],
  basketball: ['NBA games today', 'NCAA basketball games today', 'WNBA games today'],
  football: ['NFL games today', 'NCAA football games today'],
  hockey: ['NHL games today'],
  baseball: ['MLB games today'],
  boxing: ['boxing fights today', 'boxing matches this week'],
  mma: ['UFC fights today', 'UFC event this week'],
  golf: ['PGA tournament today', 'golf tournament leaderboard'],
  cricket: ['cricket matches today live', 'IPL matches today', 'Test cricket today'],
  esports: ['esports matches today live', 'League of Legends matches today', 'CS2 matches today'],
  rugby: ['rugby matches today', 'Six Nations rugby', 'Rugby World Cup'],
  f1: ['Formula 1 race today', 'F1 Grand Prix this week'],
  nascar: ['NASCAR race today', 'NASCAR Cup Series'],
};

// Validate sport input
function validateSport(sport: string | null): string {
  if (!sport) return 'all';
  const normalized = sport.toLowerCase().replace(/[^a-z0-9-]/g, '');
  if (normalized.length > 20) return 'all';
  return ALLOWED_SPORTS.includes(normalized) ? normalized : 'all';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const auth = await authenticateUser(req);
    if (!auth) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized', games: [] }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limiting by user ID
    if (!checkRateLimit(auth.userId)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Rate limit exceeded. Please try again later.', games: [] }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const sport = validateSport(url.searchParams.get('sport'));

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      console.log('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Service not configured', games: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`User ${auth.userId} scraping live games for sport: ${sport}`);

    const queries = sport === 'all' 
      ? Object.values(sportSearchQueries).flat().slice(0, 5)
      : sportSearchQueries[sport] || [];

    if (queries.length === 0) {
      return new Response(
        JSON.stringify({ success: true, games: [], source: 'scraped', lastUpdated: new Date().toISOString() }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const allGames: ScrapedGame[] = [];

    for (const query of queries) {
      try {
        const searchResult = await searchFirecrawl(apiKey, query);
        if (searchResult?.data) {
          const games = parseGamesFromSearch(searchResult.data, sport);
          allGames.push(...games);
        }
        await new Promise(r => setTimeout(r, 500));
      } catch (err) {
        console.warn(`[Internal] Error searching`);
      }
    }

    const uniqueGames = deduplicateGames(allGames);

    console.log(`Found ${uniqueGames.length} unique games`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        games: uniqueGames,
        source: 'scraped',
        lastUpdated: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Internal] Error scraping live games');
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

async function searchFirecrawl(apiKey: string, query: string): Promise<any> {
  const response = await fetch('https://api.firecrawl.dev/v1/search', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      limit: 5,
      scrapeOptions: { formats: ['markdown'] },
    }),
  });

  if (!response.ok) {
    console.error(`[Internal] Firecrawl search failed: ${response.status}`);
    return null;
  }

  return await response.json();
}

function parseGamesFromSearch(searchResults: any[], sport: string): ScrapedGame[] {
  const games: ScrapedGame[] = [];
  
  for (const result of searchResults) {
    const content = result.markdown || result.description || '';
    
    const matchPatterns = [
      /([A-Z][a-zA-Z\s]+?)\s+(?:vs\.?|v\.?|@)\s+([A-Z][a-zA-Z\s]+?)(?:\s|,|$|\n)/gi,
      /([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)?)\s+(\d+)\s*[-–]\s*(\d+)\s+([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)?)/gi,
    ];

    for (const pattern of matchPatterns) {
      let match;
      pattern.lastIndex = 0;
      while ((match = pattern.exec(content)) !== null) {
        const homeTeam = cleanTeamName(match[1]);
        const awayTeam = match[4] ? cleanTeamName(match[4]) : cleanTeamName(match[2]);
        
        if (homeTeam.length < 3 || awayTeam.length < 3) continue;
        if (homeTeam.toLowerCase() === awayTeam.toLowerCase()) continue;

        const hasScore = match[2] && match[3] && match[4];
        
        games.push({
          id: `scraped_${homeTeam}_${awayTeam}_${Date.now()}`.replace(/\s/g, '_'),
          homeTeam,
          awayTeam,
          sport: detectSport(content, sport),
          startTime: extractTime(content) || new Date().toISOString(),
          status: hasScore ? 'final' : detectStatus(content),
          homeScore: hasScore ? parseInt(match[2]) : undefined,
          awayScore: hasScore ? parseInt(match[3]) : undefined,
          league: extractLeague(content),
        });
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
    .slice(0, 30);
}

function detectSport(content: string, defaultSport: string): string {
  const lower = content.toLowerCase();
  if (lower.includes('nba') || lower.includes('basketball')) return 'basketball';
  if (lower.includes('nfl') || lower.includes('football')) return 'football';
  if (lower.includes('nhl') || lower.includes('hockey')) return 'hockey';
  if (lower.includes('mlb') || lower.includes('baseball')) return 'baseball';
  if (lower.includes('premier league') || lower.includes('la liga') || lower.includes('bundesliga') || lower.includes('serie a') || lower.includes('mls')) return 'soccer';
  if (lower.includes('atp') || lower.includes('wta') || lower.includes('tennis')) return 'tennis';
  if (lower.includes('table tennis') || lower.includes('ping pong')) return 'tabletennis';
  if (lower.includes('ufc') || lower.includes('mma')) return 'mma';
  if (lower.includes('boxing')) return 'boxing';
  if (lower.includes('pga') || lower.includes('golf')) return 'golf';
  if (lower.includes('cricket')) return 'cricket';
  if (lower.includes('esports') || lower.includes('league of legends') || lower.includes('dota')) return 'esports';
  return defaultSport;
}

function detectStatus(content: string): 'scheduled' | 'live' | 'final' {
  const lower = content.toLowerCase();
  if (lower.includes('live') || lower.includes('in progress') || lower.includes('ongoing')) return 'live';
  if (lower.includes('final') || lower.includes('ended') || lower.includes('finished')) return 'final';
  return 'scheduled';
}

function extractTime(content: string): string | null {
  const timeMatch = content.match(/(\d{1,2}):(\d{2})\s*(AM|PM|ET|PT|CT)?/i);
  if (timeMatch) {
    const now = new Date();
    let hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2]);
    const period = timeMatch[3]?.toUpperCase();
    
    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    
    now.setHours(hours, minutes, 0, 0);
    return now.toISOString();
  }
  return null;
}

function extractLeague(content: string): string | undefined {
  const lower = content.toLowerCase();
  if (lower.includes('premier league')) return 'EPL';
  if (lower.includes('la liga')) return 'La Liga';
  if (lower.includes('bundesliga')) return 'Bundesliga';
  if (lower.includes('serie a')) return 'Serie A';
  if (lower.includes('mls')) return 'MLS';
  if (lower.includes('nba')) return 'NBA';
  if (lower.includes('nfl')) return 'NFL';
  if (lower.includes('nhl')) return 'NHL';
  if (lower.includes('mlb')) return 'MLB';
  if (lower.includes('ncaa')) return 'NCAA';
  if (lower.includes('atp')) return 'ATP';
  if (lower.includes('wta')) return 'WTA';
  if (lower.includes('ufc')) return 'UFC';
  return undefined;
}

function deduplicateGames(games: ScrapedGame[]): ScrapedGame[] {
  const seen = new Set<string>();
  return games.filter(game => {
    const key = `${game.homeTeam.toLowerCase()}_${game.awayTeam.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}