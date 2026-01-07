const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

const sportSearchQueries: Record<string, string[]> = {
  soccer: ['Premier League matches today', 'La Liga games today', 'Bundesliga fixtures today', 'Serie A matches today', 'MLS games today'],
  tennis: ['ATP tennis matches today', 'WTA tennis matches today'],
  tabletennis: ['table tennis matches today live'],
  basketball: ['NBA games today', 'NCAA basketball games today'],
  football: ['NFL games today', 'NCAA football games today'],
  hockey: ['NHL games today'],
  baseball: ['MLB games today'],
  boxing: ['boxing fights today'],
  mma: ['UFC fights today'],
  golf: ['PGA tournament today'],
  cricket: ['cricket matches today live'],
  esports: ['esports matches today live'],
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const sport = url.searchParams.get('sport') || 'all';

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      console.log('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl not configured', games: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Scraping live games for sport: ${sport}`);

    const queries = sport === 'all' 
      ? Object.values(sportSearchQueries).flat().slice(0, 5) // Limit to avoid rate limits
      : sportSearchQueries[sport.toLowerCase()] || [`${sport} games today live`];

    const allGames: ScrapedGame[] = [];

    for (const query of queries) {
      try {
        const searchResult = await searchFirecrawl(apiKey, query);
        if (searchResult?.data) {
          const games = parseGamesFromSearch(searchResult.data, sport);
          allGames.push(...games);
        }
        // Small delay between requests
        await new Promise(r => setTimeout(r, 500));
      } catch (err) {
        console.warn(`Error searching for "${query}":`, err);
      }
    }

    // Deduplicate by home+away team
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
    console.error('Error scraping live games:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to scrape games',
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
    console.error(`Firecrawl search failed: ${response.status}`);
    return null;
  }

  return await response.json();
}

function parseGamesFromSearch(searchResults: any[], sport: string): ScrapedGame[] {
  const games: ScrapedGame[] = [];
  
  for (const result of searchResults) {
    const content = result.markdown || result.description || '';
    
    // Pattern: "Team A vs Team B" or "Team A v Team B" or "Team A @ Team B"
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
        
        // Skip if teams are too short or look like non-team text
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
    .replace(/^\d+\s*/, '') // Remove leading numbers
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
  // Look for time patterns like "7:30 PM ET" or "19:30"
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
