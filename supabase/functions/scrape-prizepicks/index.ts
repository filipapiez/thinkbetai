const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PrizePicksData {
  success: boolean;
  scrapedAt: string;
  projections: Projection[];
  error?: string;
}

interface Projection {
  id: string;
  playerName: string;
  team: string;
  opponent: string;
  sport: string;
  propType: string;
  line: number;
  league: string;
  gameTime?: string;
  imageUrl?: string;
}

// Cache for scraped data
let cachedData: PrizePicksData | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const now = Date.now();
    
    // Return cached data if still valid
    if (cachedData && (now - cacheTimestamp) < CACHE_TTL) {
      console.log('Returning cached PrizePicks data');
      return new Response(
        JSON.stringify({ ...cachedData, fromCache: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl connector not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Starting PrizePicks scrape...');

    // Scrape PrizePicks main page for player projections
    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://app.prizepicks.com',
        formats: ['markdown', 'html'],
        onlyMainContent: true,
        waitFor: 3000, // Wait for dynamic content to load
      }),
    });

    if (!scrapeResponse.ok) {
      const errorData = await scrapeResponse.json();
      console.error('Firecrawl API error:', errorData);
      return new Response(
        JSON.stringify({ success: false, error: errorData.error || 'Failed to scrape PrizePicks' }),
        { status: scrapeResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const scrapeData = await scrapeResponse.json();
    console.log('Scrape completed, parsing data...');

    // Parse the scraped content to extract projections
    const projections = parseProjections(scrapeData.data?.markdown || scrapeData.markdown || '');

    const result: PrizePicksData = {
      success: true,
      scrapedAt: new Date().toISOString(),
      projections,
    };

    // Cache the result
    cachedData = result;
    cacheTimestamp = now;

    console.log(`Successfully scraped ${projections.length} projections from PrizePicks`);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error scraping PrizePicks:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Parse markdown content to extract projections
function parseProjections(markdown: string): Projection[] {
  const projections: Projection[] = [];
  
  // Common sports and their patterns
  const sportPatterns = [
    { sport: 'NBA', keywords: ['points', 'rebounds', 'assists', 'steals', 'blocks', '3-pointers', 'pts+reb', 'pts+ast'] },
    { sport: 'NFL', keywords: ['passing yards', 'rushing yards', 'receiving yards', 'touchdowns', 'receptions', 'completions', 'interceptions'] },
    { sport: 'MLB', keywords: ['hits', 'total bases', 'rbis', 'home runs', 'strikeouts', 'walks', 'runs'] },
    { sport: 'NHL', keywords: ['goals', 'assists', 'shots', 'saves', 'points'] },
    { sport: 'UFC', keywords: ['significant strikes', 'takedowns', 'ko/tko'] },
  ];

  // Try to extract player projection patterns from markdown
  // Pattern: PlayerName - Team - Stat - Line
  const lines = markdown.split('\n');
  
  for (const line of lines) {
    // Skip empty lines and headers
    if (!line.trim() || line.startsWith('#')) continue;

    // Try to match player projection patterns
    // Common patterns in sports betting sites
    const playerMatch = line.match(/([A-Z][a-z]+ [A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
    const numberMatch = line.match(/(\d+\.?\d*)/g);
    
    if (playerMatch && numberMatch && numberMatch.length > 0) {
      const playerName = playerMatch[1];
      const line_value = parseFloat(numberMatch[0]);
      
      // Determine sport based on keywords
      let detectedSport = 'NBA'; // Default
      let detectedProp = 'Points';
      
      for (const { sport, keywords } of sportPatterns) {
        for (const keyword of keywords) {
          if (line.toLowerCase().includes(keyword)) {
            detectedSport = sport;
            detectedProp = keyword.charAt(0).toUpperCase() + keyword.slice(1);
            break;
          }
        }
      }

      // Extract team abbreviation if present
      const teamMatch = line.match(/\b([A-Z]{2,3})\b/);
      const team = teamMatch ? teamMatch[1] : '';

      projections.push({
        id: `pp-${Date.now()}-${projections.length}`,
        playerName,
        team,
        opponent: '',
        sport: detectedSport,
        propType: detectedProp,
        line: line_value,
        league: detectedSport,
      });
    }
  }

  // If no projections found, return empty array
  // In production, you might want to try alternative parsing strategies
  if (projections.length === 0) {
    console.log('No projections extracted from markdown, raw content length:', markdown.length);
  }

  return projections;
}
