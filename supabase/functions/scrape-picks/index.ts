const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60 * 1000;

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);
  
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + RATE_WINDOW_MS });
    return true;
  }
  
  if (entry.count >= RATE_LIMIT) {
    return false;
  }
  
  entry.count++;
  return true;
}

function getClientIdentifier(req: Request): string {
  return req.headers.get('x-forwarded-for') || 
         req.headers.get('cf-connecting-ip') || 
         'anonymous';
}

// Cache for picks data
let cachedPicks: Pick[] = [];
let cacheTimestamp = 0;
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

interface Pick {
  id: string;
  platform: string;
  sport: string;
  playerName: string;
  playerImage: string;
  team: string;
  opponent: string;
  gameDate: string;
  gameTime: string;
  propType: string;
  line: number;
  direction: 'MORE' | 'LESS';
  confidence: number;
  hitRate?: number;
  projection?: number;
}

// Platform mapping
const PLATFORMS = [
  'PrizePicks',
  'Underdog', 
  'Pick6',
  'Sleeper',
  'FanDuel',
  'DraftKings',
  'BetMGM',
  'BetRivers',
  'RTSports',
  'Hard Rock',
  'Caesars'
];

// Parse pick data from markdown
function parsePicksFromMarkdown(markdown: string): Pick[] {
  const picks: Pick[] = [];
  
  // Split by "Leaning" sections
  const leaningMoreSection = markdown.split('LeaningMORE')[1]?.split('LeaningLESS')[0] || '';
  const leaningLessSection = markdown.split('LeaningLESS')[1] || '';
  
  // Parse MORE picks
  parseSection(leaningMoreSection, 'MORE', picks);
  // Parse LESS picks
  parseSection(leaningLessSection, 'LESS', picks);
  
  return picks;
}

function parseSection(section: string, direction: 'MORE' | 'LESS', picks: Pick[]): void {
  // Match player entries - look for player links followed by team info
  const playerRegex = /\[([^\]]+)\]\([^)]+player[^)]+\)[^]*?!\[[^\]]*\]\(([^)]+teamlogo[^)]+)\)[^]*?(\w{2,4})[^]*?(vs|@)\s*(\w{2,4})[^]*?(\w{3}\s+\w{3}\s+\d+)[^]*?(\d{1,2}:\d{2}\s*[ap]m)[^]*?(\d+\.?\d*)[^]*?(Passing Yards|Rushing Yards|Receiving Yards|Rushing \+ Receiving|Receptions|Touchdowns|Points|Rebounds|Assists|Strikeouts|Hits|RBIs)/gi;
  
  let match;
  while ((match = playerRegex.exec(section)) !== null) {
    const [, playerName, , team, , opponent, gameDate, gameTime, line, propType] = match;
    
    // Determine sport from prop type
    let sport = 'NFL';
    if (['Points', 'Rebounds', 'Assists'].includes(propType)) {
      sport = 'NBA';
    } else if (['Strikeouts', 'Hits', 'RBIs'].includes(propType)) {
      sport = 'MLB';
    }
    
    picks.push({
      id: `${playerName}-${propType}-${line}-${direction}`.replace(/\s/g, '-').toLowerCase(),
      platform: 'PrizePicks', // Default, will be enhanced
      sport,
      playerName,
      playerImage: '',
      team,
      opponent,
      gameDate,
      gameTime,
      propType,
      line: parseFloat(line),
      direction,
      confidence: Math.floor(Math.random() * 30) + 70, // Placeholder
      hitRate: Math.floor(Math.random() * 30) + 50,
      projection: parseFloat(line) * (direction === 'MORE' ? 1.15 : 0.85),
    });
  }
}

// ESPN headshot URL helper - uses player ID
function getESPNHeadshot(playerId: string, sport: 'nfl' | 'nba' | 'mlb' | 'nhl' = 'nfl'): string {
  return `https://a.espncdn.com/i/headshots/${sport}/players/full/${playerId}.png`;
}

// Player database with ESPN IDs for headshots
const PLAYER_DATABASE = {
  nfl: [
    { name: 'Patrick Mahomes', team: 'KC', espnId: '3139477', props: ['Passing Yards', 'Passing TDs', 'Completions'] },
    { name: 'Josh Allen', team: 'BUF', espnId: '3918298', props: ['Passing Yards', 'Rushing Yards', 'Passing TDs'] },
    { name: 'Lamar Jackson', team: 'BAL', espnId: '3916387', props: ['Passing Yards', 'Rushing Yards', 'Passing TDs'] },
    { name: 'Jalen Hurts', team: 'PHI', espnId: '4040715', props: ['Passing Yards', 'Rushing Yards', 'Passing TDs'] },
    { name: 'Joe Burrow', team: 'CIN', espnId: '3915511', props: ['Passing Yards', 'Passing TDs', 'Completions'] },
    { name: 'Dak Prescott', team: 'DAL', espnId: '2577417', props: ['Passing Yards', 'Passing TDs', 'Completions'] },
    { name: 'Tua Tagovailoa', team: 'MIA', espnId: '4241479', props: ['Passing Yards', 'Passing TDs', 'Completions'] },
    { name: 'C.J. Stroud', team: 'HOU', espnId: '4432577', props: ['Passing Yards', 'Passing TDs', 'Completions'] },
    { name: 'Brock Purdy', team: 'SF', espnId: '4361741', props: ['Passing Yards', 'Passing TDs', 'Completions'] },
    { name: 'Jordan Love', team: 'GB', espnId: '4036378', props: ['Passing Yards', 'Passing TDs', 'Interceptions'] },
    { name: 'Derrick Henry', team: 'BAL', espnId: '3043078', props: ['Rushing Yards', 'Rushing + Receiving', 'Rushing Attempts'] },
    { name: 'Saquon Barkley', team: 'PHI', espnId: '3929630', props: ['Rushing Yards', 'Rushing + Receiving', 'Receptions'] },
    { name: 'Christian McCaffrey', team: 'SF', espnId: '3117251', props: ['Rushing Yards', 'Rushing + Receiving', 'Receptions'] },
    { name: 'Bijan Robinson', team: 'ATL', espnId: '4426348', props: ['Rushing Yards', 'Rushing + Receiving', 'Receptions'] },
    { name: 'Breece Hall', team: 'NYJ', espnId: '4362628', props: ['Rushing Yards', 'Rushing + Receiving', 'Receptions'] },
    { name: 'Jonathan Taylor', team: 'IND', espnId: '4242335', props: ['Rushing Yards', 'Rushing + Receiving', 'Rushing Attempts'] },
    { name: 'Josh Jacobs', team: 'GB', espnId: '4047365', props: ['Rushing Yards', 'Rushing + Receiving', 'Rushing Attempts'] },
    { name: 'De\'Von Achane', team: 'MIA', espnId: '4429795', props: ['Rushing Yards', 'Rushing + Receiving', 'Receptions'] },
    { name: 'Tyreek Hill', team: 'MIA', espnId: '3116406', props: ['Receiving Yards', 'Receptions', 'Longest Reception'] },
    { name: 'Ja\'Marr Chase', team: 'CIN', espnId: '4362628', props: ['Receiving Yards', 'Receptions', 'Receiving TDs'] },
    { name: 'CeeDee Lamb', team: 'DAL', espnId: '4241389', props: ['Receiving Yards', 'Receptions', 'Receiving TDs'] },
    { name: 'A.J. Brown', team: 'PHI', espnId: '4047650', props: ['Receiving Yards', 'Receptions', 'Receiving TDs'] },
    { name: 'Amon-Ra St. Brown', team: 'DET', espnId: '4360438', props: ['Receiving Yards', 'Receptions', 'Receiving TDs'] },
    { name: 'Davante Adams', team: 'NYJ', espnId: '2976499', props: ['Receiving Yards', 'Receptions', 'Receiving TDs'] },
    { name: 'Travis Kelce', team: 'KC', espnId: '2976212', props: ['Receiving Yards', 'Receptions', 'Receiving TDs'] },
    { name: 'T.J. Hockenson', team: 'MIN', espnId: '4040980', props: ['Receiving Yards', 'Receptions', 'Receiving TDs'] },
    { name: 'George Kittle', team: 'SF', espnId: '2976630', props: ['Receiving Yards', 'Receptions', 'Receiving TDs'] },
    { name: 'Puka Nacua', team: 'LAR', espnId: '4569618', props: ['Receiving Yards', 'Receptions', 'Longest Reception'] },
    { name: 'Nico Collins', team: 'HOU', espnId: '4242546', props: ['Receiving Yards', 'Receptions', 'Receiving TDs'] },
    { name: 'Mike Evans', team: 'TB', espnId: '16737', props: ['Receiving Yards', 'Receptions', 'Receiving TDs'] },
  ],
  nba: [
    { name: 'LeBron James', team: 'LAL', espnId: '1966', props: ['Points', 'Rebounds', 'Assists'] },
    { name: 'Stephen Curry', team: 'GSW', espnId: '3975', props: ['Points', '3-Pointers', 'Assists'] },
    { name: 'Luka Doncic', team: 'DAL', espnId: '3945274', props: ['Points', 'Assists', 'Rebounds'] },
    { name: 'Giannis Antetokounmpo', team: 'MIL', espnId: '3032977', props: ['Points', 'Rebounds', 'Assists'] },
    { name: 'Kevin Durant', team: 'PHX', espnId: '3202', props: ['Points', 'Rebounds', 'Assists'] },
    { name: 'Nikola Jokic', team: 'DEN', espnId: '3112335', props: ['Points', 'Assists', 'Rebounds'] },
    { name: 'Joel Embiid', team: 'PHI', espnId: '3059318', props: ['Points', 'Rebounds', 'Blocks'] },
    { name: 'Jayson Tatum', team: 'BOS', espnId: '4065648', props: ['Points', 'Rebounds', 'Assists'] },
    { name: 'Anthony Edwards', team: 'MIN', espnId: '4594327', props: ['Points', 'Rebounds', 'Assists'] },
    { name: 'Shai Gilgeous-Alexander', team: 'OKC', espnId: '4278073', props: ['Points', 'Assists', 'Steals'] },
    { name: 'Donovan Mitchell', team: 'CLE', espnId: '3908809', props: ['Points', 'Assists', '3-Pointers'] },
    { name: 'Devin Booker', team: 'PHX', espnId: '3136193', props: ['Points', 'Assists', '3-Pointers'] },
    { name: 'Ja Morant', team: 'MEM', espnId: '4279888', props: ['Points', 'Assists', 'Rebounds'] },
    { name: 'Trae Young', team: 'ATL', espnId: '4277905', props: ['Points', 'Assists', '3-Pointers'] },
    { name: 'Damian Lillard', team: 'MIL', espnId: '6606', props: ['Points', 'Assists', '3-Pointers'] },
    { name: 'Tyrese Haliburton', team: 'IND', espnId: '4396993', props: ['Points', 'Assists', 'Steals'] },
    { name: 'De\'Aaron Fox', team: 'SAC', espnId: '4066259', props: ['Points', 'Assists', 'Steals'] },
    { name: 'Jaylen Brown', team: 'BOS', espnId: '3917376', props: ['Points', 'Rebounds', 'Assists'] },
    { name: 'Kawhi Leonard', team: 'LAC', espnId: '6450', props: ['Points', 'Rebounds', 'Steals'] },
    { name: 'Paolo Banchero', team: 'ORL', espnId: '4433134', props: ['Points', 'Rebounds', 'Assists'] },
    { name: 'Domantas Sabonis', team: 'SAC', espnId: '3155942', props: ['Points', 'Rebounds', 'Assists'] },
    { name: 'Bam Adebayo', team: 'MIA', espnId: '4066261', props: ['Points', 'Rebounds', 'Assists'] },
    { name: 'Jimmy Butler', team: 'MIA', espnId: '6430', props: ['Points', 'Rebounds', 'Assists'] },
    { name: 'Karl-Anthony Towns', team: 'NYK', espnId: '3136195', props: ['Points', 'Rebounds', '3-Pointers'] },
    { name: 'Chet Holmgren', team: 'OKC', espnId: '4432159', props: ['Points', 'Rebounds', 'Blocks'] },
    { name: 'Victor Wembanyama', team: 'SAS', espnId: '4871823', props: ['Points', 'Rebounds', 'Blocks'] },
  ],
  mlb: [
    { name: 'Shohei Ohtani', team: 'LAD', espnId: '39832', props: ['Hits', 'Total Bases', 'RBIs'] },
    { name: 'Aaron Judge', team: 'NYY', espnId: '33192', props: ['Hits', 'Total Bases', 'RBIs'] },
    { name: 'Mookie Betts', team: 'LAD', espnId: '33039', props: ['Hits', 'Runs', 'Total Bases'] },
    { name: 'Ronald Acuna Jr.', team: 'ATL', espnId: '39373', props: ['Hits', 'Total Bases', 'Stolen Bases'] },
    { name: 'Juan Soto', team: 'NYY', espnId: '35882', props: ['Hits', 'Walks', 'Total Bases'] },
    { name: 'Mike Trout', team: 'LAA', espnId: '30836', props: ['Hits', 'RBIs', 'Total Bases'] },
    { name: 'Freddie Freeman', team: 'LAD', espnId: '32098', props: ['Hits', 'RBIs', 'Total Bases'] },
    { name: 'Corey Seager', team: 'TEX', espnId: '32691', props: ['Hits', 'RBIs', 'Total Bases'] },
    { name: 'Trea Turner', team: 'PHI', espnId: '32129', props: ['Hits', 'Stolen Bases', 'Runs'] },
    { name: 'Marcus Semien', team: 'TEX', espnId: '31771', props: ['Hits', 'Runs', 'Total Bases'] },
    { name: 'Gerrit Cole', team: 'NYY', espnId: '28963', props: ['Strikeouts', 'Outs', 'Earned Runs'] },
    { name: 'Spencer Strider', team: 'ATL', espnId: '39911', props: ['Strikeouts', 'Outs', 'Earned Runs'] },
    { name: 'Zack Wheeler', team: 'PHI', espnId: '30988', props: ['Strikeouts', 'Outs', 'Earned Runs'] },
    { name: 'Corbin Burnes', team: 'BAL', espnId: '36040', props: ['Strikeouts', 'Outs', 'Earned Runs'] },
    { name: 'Dylan Cease', team: 'SD', espnId: '39683', props: ['Strikeouts', 'Outs', 'Earned Runs'] },
  ],
  nhl: [
    { name: 'Connor McDavid', team: 'EDM', espnId: '3895074', props: ['Points', 'Shots', 'Assists'] },
    { name: 'Nathan MacKinnon', team: 'COL', espnId: '3041969', props: ['Points', 'Shots', 'Assists'] },
    { name: 'Leon Draisaitl', team: 'EDM', espnId: '3114727', props: ['Points', 'Shots', 'Goals'] },
    { name: 'Auston Matthews', team: 'TOR', espnId: '4024123', props: ['Points', 'Shots', 'Goals'] },
    { name: 'David Pastrnak', team: 'BOS', espnId: '3899937', props: ['Points', 'Shots', 'Goals'] },
    { name: 'Nikita Kucherov', team: 'TB', espnId: '3042109', props: ['Points', 'Shots', 'Assists'] },
    { name: 'Cale Makar', team: 'COL', espnId: '4351729', props: ['Points', 'Shots', 'Blocked Shots'] },
    { name: 'Sidney Crosby', team: 'PIT', espnId: '3114', props: ['Points', 'Shots', 'Assists'] },
  ],
};

// Generate realistic mock picks
function generateMockPicks(): Pick[] {
  const mockPicks: Pick[] = [];
  
  const opponents = {
    nfl: ['GB', 'DAL', 'SF', 'NYG', 'CHI', 'DET', 'SEA', 'MIN', 'TB', 'LAR'],
    nba: ['BOS', 'MIA', 'NYK', 'PHX', 'LAC', 'DEN', 'MIL', 'CLE', 'OKC', 'SAC'],
    mlb: ['NYY', 'BOS', 'HOU', 'ATL', 'LAD', 'SD', 'PHI', 'TEX', 'BAL', 'ARI'],
    nhl: ['TOR', 'BOS', 'NYR', 'VGK', 'CAR', 'DAL', 'FLA', 'NJ', 'WPG', 'VAN'],
  };
  
  const dates = ['Sat Jan 11', 'Sun Jan 12', 'Mon Jan 13', 'Tue Jan 14', 'Wed Jan 15'];
  const times = ['1:00 pm', '4:30 pm', '7:00 pm', '8:00 pm', '8:20 pm', '10:00 pm'];

  // Helper to generate line based on prop type
  const getLine = (prop: string, sport: string): number => {
    const lines: Record<string, [number, number]> = {
      'Passing Yards': [225, 350],
      'Passing TDs': [1.5, 3.5],
      'Completions': [18, 30],
      'Interceptions': [0.5, 1.5],
      'Rushing Yards': [45, 120],
      'Rushing + Receiving': [70, 150],
      'Rushing Attempts': [12, 25],
      'Receiving Yards': [45, 120],
      'Receptions': [3.5, 8.5],
      'Receiving TDs': [0.5, 1.5],
      'Longest Reception': [15, 35],
      'Points': [20, 35],
      'Rebounds': [6, 14],
      'Assists': [4, 12],
      '3-Pointers': [2, 5],
      'Steals': [0.5, 2.5],
      'Blocks': [0.5, 3.5],
      'Hits': [0.5, 2.5],
      'Total Bases': [1.5, 4.5],
      'RBIs': [0.5, 2.5],
      'Runs': [0.5, 2.5],
      'Walks': [0.5, 2.5],
      'Stolen Bases': [0.5, 1.5],
      'Strikeouts': [4.5, 9.5],
      'Outs': [15, 21],
      'Earned Runs': [1.5, 4.5],
      'Shots': [3, 7],
      'Goals': [0.5, 1.5],
      'Blocked Shots': [1, 4],
    };
    const range = lines[prop] || [5, 15];
    return Math.round((range[0] + Math.random() * (range[1] - range[0])) * 10) / 10;
  };

  // Generate picks for each sport
  const sports: Array<{ key: keyof typeof PLAYER_DATABASE; name: string }> = [
    { key: 'nfl', name: 'NFL' },
    { key: 'nba', name: 'NBA' },
    { key: 'mlb', name: 'MLB' },
    { key: 'nhl', name: 'NHL' },
  ];

  sports.forEach(({ key, name }) => {
    const players = PLAYER_DATABASE[key];
    const sportOpponents = opponents[key];

    players.forEach(player => {
      // Generate 2-4 picks per player across different platforms
      const numPicks = Math.floor(Math.random() * 3) + 2;
      const usedProps = new Set<string>();
      const usedPlatforms = new Set<string>();

      for (let i = 0; i < numPicks; i++) {
        // Pick a random prop not yet used for this player
        const availableProps = player.props.filter(p => !usedProps.has(p));
        if (availableProps.length === 0) break;
        const prop = availableProps[Math.floor(Math.random() * availableProps.length)];
        usedProps.add(prop);

        // Pick a platform not yet used
        const availablePlatforms = PLATFORMS.filter(p => !usedPlatforms.has(p));
        const platform = availablePlatforms[Math.floor(Math.random() * availablePlatforms.length)];
        usedPlatforms.add(platform);

        const direction = Math.random() > 0.5 ? 'MORE' : 'LESS';
        const line = getLine(prop, key);
        const confidence = Math.floor(Math.random() * 30) + 60;
        const hitRate = Math.floor(Math.random() * 25) + 50;

        mockPicks.push({
          id: `${player.name}-${prop}-${platform}-${direction}`.replace(/\s/g, '-').toLowerCase(),
          platform,
          sport: name,
          playerName: player.name,
          playerImage: getESPNHeadshot(player.espnId, key),
          team: player.team,
          opponent: sportOpponents[Math.floor(Math.random() * sportOpponents.length)],
          gameDate: dates[Math.floor(Math.random() * dates.length)],
          gameTime: times[Math.floor(Math.random() * times.length)],
          propType: prop,
          line,
          direction,
          confidence,
          hitRate,
          projection: Math.round(line * (direction === 'MORE' ? (1 + (confidence - 50) / 200) : (1 - (confidence - 50) / 200)) * 10) / 10,
        });
      }
    });
  });

  // Shuffle picks for variety
  return mockPicks.sort(() => Math.random() - 0.5);
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientId = getClientIdentifier(req);
    
    if (!checkRateLimit(clientId)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Rate limit exceeded' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const forceRefresh = url.searchParams.get('refresh') === 'true';
    
    // Return cached data if valid
    const now = Date.now();
    if (!forceRefresh && cachedPicks.length > 0 && (now - cacheTimestamp) < CACHE_TTL) {
      console.log('Returning cached picks data');
      return new Response(
        JSON.stringify({
          success: true,
          data: cachedPicks,
          source: 'cache',
          lastUpdated: new Date(cacheTimestamp).toISOString(),
          platforms: PLATFORMS,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    
    let picks: Pick[] = [];
    
    if (firecrawlApiKey) {
      console.log('Scraping RotoWire picks with Firecrawl...');
      
      try {
        const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: 'https://www.rotowire.com/picks/',
            formats: ['markdown'],
            onlyMainContent: true,
            waitFor: 3000,
          }),
        });

        const data = await response.json();
        
        if (response.ok && data.success) {
          const markdown = data.data?.markdown || data.markdown || '';
          picks = parsePicksFromMarkdown(markdown);
          console.log(`Parsed ${picks.length} picks from RotoWire`);
        }
      } catch (scrapeError) {
        console.error('Firecrawl scrape error:', scrapeError);
      }
    }
    
    // Fallback to mock data if scraping fails or returns no results
    if (picks.length === 0) {
      console.log('Using mock picks data');
      picks = generateMockPicks();
    }
    
    // Update cache
    cachedPicks = picks;
    cacheTimestamp = now;

    return new Response(
      JSON.stringify({
        success: true,
        data: picks,
        source: picks.length > 0 && firecrawlApiKey ? 'scraped' : 'generated',
        lastUpdated: new Date().toISOString(),
        platforms: PLATFORMS,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in scrape-picks:', error);
    
    // Return mock data on error
    const mockPicks = generateMockPicks();
    
    return new Response(
      JSON.stringify({
        success: true,
        data: mockPicks,
        source: 'fallback',
        lastUpdated: new Date().toISOString(),
        platforms: PLATFORMS,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
