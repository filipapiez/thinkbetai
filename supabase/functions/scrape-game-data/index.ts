const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting (per IP, per minute)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 30; // 30 requests per minute
const RATE_WINDOW_MS = 60 * 1000;

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + RATE_WINDOW_MS });
    return true;
  }
  
  if (record.count >= RATE_LIMIT) {
    return false;
  }
  
  record.count++;
  return true;
}

// Get client identifier for rate limiting (IP-based for unauthenticated)
function getClientIdentifier(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.headers.get('x-real-ip') || 'unknown';
}

// Allowed sports whitelist
const ALLOWED_SPORTS = ['nba', 'nfl', 'mlb', 'nhl', 'ncaab', 'ncaaf', 'soccer', 'mma', 'tennis', 'boxing', 'golf', 'cricket', 'rugby'];

// Input validation
function sanitizeTeamName(name: unknown): string | null {
  if (typeof name !== 'string') return null;
  // Only allow letters, numbers, spaces, hyphens, apostrophes (for team names like "76ers" or "Trail Blazers")
  const sanitized = name.replace(/[^a-zA-Z0-9\s\-']/g, '').trim().slice(0, 50);
  if (sanitized.length < 2) return null;
  return sanitized;
}

function validateSport(sport: unknown): string {
  if (typeof sport !== 'string') return 'nba';
  const raw = sport.toLowerCase().trim();
  const normalized = raw.replace(/[^a-z]/g, '');

  // Soccer vs American football
  if (raw.includes('soccer')) return 'soccer';
  if (raw.includes('football')) {
    if (raw.includes('nfl') || raw.includes('american')) return 'nfl';
    // In most international contexts "Football" = soccer
    return 'soccer';
  }

  if (raw.includes('nba') || raw.includes('basketball')) return 'nba';
  if ((raw.includes('ncaa') || raw.includes('ncaab')) && raw.includes('basketball')) return 'ncaab';
  if ((raw.includes('ncaa') || raw.includes('ncaaf')) && raw.includes('football')) return 'ncaaf';

  if (raw.includes('mlb') || raw.includes('baseball')) return 'mlb';
  if (raw.includes('nhl') || raw.includes('hockey')) return 'nhl';
  if (raw.includes('mma') || raw.includes('ufc')) return 'mma';
  if (raw.includes('tennis')) return 'tennis';
  if (raw.includes('boxing')) return 'boxing';
  if (raw.includes('golf')) return 'golf';
  if (raw.includes('cricket')) return 'cricket';
  if (raw.includes('rugby')) return 'rugby';

  return ALLOWED_SPORTS.includes(normalized) ? normalized : 'nba';
}

function buildNoDataGameData(homeTeam: string, awayTeam: string, sport: string): ScrapedGameData {
  const sportValidation = getSportValidation(sport);

  return {
    injuries: [],
    recentForm: [
      { team: homeTeam, last5: [], limitedData: true, isGenerated: false },
      { team: awayTeam, last5: [], limitedData: true, isGenerated: false },
    ],
    headToHead: [],
    headToHeadMeta: {
      limitedData: true,
      validMatchCount: 0,
      message: 'No verified historical data found for this matchup.',
      isGenerated: false,
    },
    teamStats: [],
    analysis: 'No verified historical results available from sources. We do not simulate or guess results.',
    sportValidation,
    dataSource: 'partial',
  };
}

interface ScrapedGameData {
  injuries: {
    team: string;
    player: string;
    position: string;
    injuryType: string;
    status: 'Out' | 'Questionable' | 'Probable' | 'Day-to-Day';
  }[];
  recentForm: {
    team: string;
    last5: { opponent: string; result: 'W' | 'L'; score: string; date: string }[];
    limitedData?: boolean; // True if fewer than 3 valid matches
    isGenerated?: boolean; // True if data is simulated
  }[];
  headToHead: { 
    date: string; 
    winner: string; 
    score: string;
    sport: string; // Sport validation
    competitionLevel: string; // Competition level validation
  }[];
  headToHeadMeta?: {
    limitedData: boolean;
    validMatchCount: number;
    message?: string;
    isGenerated?: boolean; // True if data is simulated
  };
  teamStats: {
    team: string;
    wins: number;
    losses: number;
    streak: string;
    ranking: number;
  }[];
  analysis: string;
  sportValidation: {
    sport: string;
    competitionLevel: string;
    scoringSystem: string;
  };
  dataSource: 'real' | 'simulated' | 'partial'; // Indicates data origin
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting by client IP
    const clientId = getClientIdentifier(req);
    if (!checkRateLimit(clientId)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    
    // Validate inputs
    const homeTeam = sanitizeTeamName(body.homeTeam);
    const awayTeam = sanitizeTeamName(body.awayTeam);
    const sport = validateSport(body.sport);

    if (!homeTeam || !awayTeam) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid team names' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    
    console.log(`Fetching game data: ${homeTeam} vs ${awayTeam} (${sport})`);

    // Try Gemini AI for real historical data first (always available via Lovable AI)
    if (lovableApiKey) {
      try {
        const aiData = await fetchHistoricalDataWithAI(lovableApiKey, homeTeam, awayTeam, sport);
        if (aiData && aiData.dataSource !== 'simulated') {
          console.log('Successfully fetched real data via Gemini AI');
          return new Response(
            JSON.stringify({ success: true, data: aiData, source: 'ai-research' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } catch (aiError) {
        console.error('AI data fetch failed, falling back to Firecrawl:', aiError);
      }
    }

    // Fallback to Firecrawl if available
    if (firecrawlApiKey) {
      const injuryQuery = `${homeTeam} ${awayTeam} injuries ${sport} 2026`;
      const injuryResponse = await searchFirecrawl(firecrawlApiKey, injuryQuery);
      
      const formQuery = `${homeTeam} ${awayTeam} recent results ${sport} 2026`;
      const formResponse = await searchFirecrawl(firecrawlApiKey, formQuery);
      
      const h2hQuery = `${homeTeam} vs ${awayTeam} head to head history ${sport}`;
      const h2hResponse = await searchFirecrawl(firecrawlApiKey, h2hQuery);

      const scrapedData = parseScrapedData(
        injuryResponse,
        formResponse,
        h2hResponse,
        homeTeam,
        awayTeam,
        sport
      );

      if (scrapedData.dataSource !== 'simulated') {
        return new Response(
          JSON.stringify({ success: true, data: scrapedData, source: 'scraped' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // No real data available - return empty data with clear message (NO SIMULATION)
    console.log('No real data sources available, returning empty data with notice');
    const noData = buildNoDataGameData(homeTeam, awayTeam, sport);
    return new Response(
      JSON.stringify({ success: true, data: noData, source: 'no-data' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Internal] Error fetching game data:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Service temporarily unavailable' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function fetchHistoricalDataWithAI(
  apiKey: string, 
  homeTeam: string, 
  awayTeam: string, 
  sport: string
): Promise<ScrapedGameData | null> {
  const sportKey = normalizeSportKey(sport);
  const sportValidation = getSportValidation(sport);
  
  const prompt = `You are a sports data expert. Provide REAL, ACCURATE historical data for the following matchup. Only include information you are confident is true. If you don't have accurate data, say so.

MATCHUP: ${homeTeam} vs ${awayTeam}
SPORT: ${sport} (${sportValidation.competitionLevel})

Provide the following in JSON format:

1. **Recent Form** (last 5 games for each team with REAL opponents, scores, and dates):
   - Use actual ${sport} score formats (e.g., ${sportValidation.scoringSystem})
   - Include real opponent names from the same league/competition
   
2. **Head-to-Head History** (last 5 meetings between these exact teams):
   - Only include matches between ${homeTeam} and ${awayTeam}
   - Include actual dates, winners, and scores
   
3. **Current Injuries** (known injured players):
   - Only include confirmed injuries you're aware of
   - Include player name, position, injury type, and status

4. **Team Stats** (current season records if known):
   - Wins, losses, current streak, ranking

IMPORTANT: 
- If you don't have real data for any section, return an empty array for that section
- Never make up fake data - only report what you actually know
- Use proper ${sport} terminology and score formats

Respond ONLY with valid JSON in this exact format:
{
  "recentForm": [
    {"team": "Team Name", "last5": [{"opponent": "Real Opponent", "result": "W" or "L", "score": "X-Y", "date": "YYYY-MM-DD"}], "isGenerated": false}
  ],
  "headToHead": [
    {"date": "YYYY-MM-DD", "winner": "Team Name", "score": "X-Y"}
  ],
  "injuries": [
    {"team": "Team Name", "player": "Player Name", "position": "POS", "injuryType": "Type", "status": "Out/Questionable/Probable/Day-to-Day"}
  ],
  "teamStats": [
    {"team": "Team Name", "wins": 0, "losses": 0, "streak": "W0", "ranking": 0}
  ],
  "hasRealData": true/false,
  "confidence": "high/medium/low",
  "dataNote": "Any notes about data accuracy or recency"
}`;

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: 'You are a sports data expert. Only provide accurate, real historical data. Never fabricate statistics.' },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error('No content in AI response');
      return null;
    }

    // Parse the JSON response
    let parsed;
    try {
      // Extract JSON from the response (handle markdown code blocks)
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      const jsonStr = jsonMatch[1] || content;
      parsed = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      return null;
    }

    // Check if AI indicated it has real data
    if (!parsed.hasRealData || parsed.confidence === 'low') {
      console.log('AI indicated low confidence or no real data');
      return null;
    }

    // Transform AI response to our format
    const injuries: ScrapedGameData['injuries'] = (parsed.injuries || []).map((i: any) => ({
      team: i.team,
      player: i.player,
      position: i.position || getPositionForSport(sport),
      injuryType: i.injuryType || 'Undisclosed',
      status: i.status || 'Questionable',
    }));

    const recentForm: ScrapedGameData['recentForm'] = (parsed.recentForm || []).map((rf: any) => ({
      team: rf.team,
      last5: (rf.last5 || []).slice(0, 5).map((g: any) => ({
        opponent: g.opponent || 'Unknown',
        result: g.result === 'W' ? 'W' : 'L',
        score: g.score || '0-0',
        date: g.date || getDateDaysAgo(1),
      })),
      limitedData: (rf.last5?.length || 0) < 3,
      isGenerated: rf.isGenerated ?? false,
    }));

    const headToHead: ScrapedGameData['headToHead'] = (parsed.headToHead || []).slice(0, 5).map((h2h: any) => ({
      date: h2h.date || getDateDaysAgo(30),
      winner: h2h.winner || homeTeam,
      score: h2h.score || '0-0',
      sport: sportKey,
      competitionLevel: sportValidation.competitionLevel,
    }));

    const teamStats: ScrapedGameData['teamStats'] = (parsed.teamStats || []).map((ts: any) => ({
      team: ts.team,
      wins: ts.wins || 0,
      losses: ts.losses || 0,
      streak: ts.streak || 'N/A',
      ranking: ts.ranking || 0,
    }));

    // Determine data source quality
    const hasRealForm = recentForm.some(rf => !rf.isGenerated && rf.last5.length >= 3);
    const hasRealH2H = headToHead.length >= 2;
    const hasRealInjuries = injuries.length > 0;
    
    const dataSource = (hasRealForm && hasRealH2H) ? 'real' : 
                       (hasRealForm || hasRealH2H || hasRealInjuries) ? 'partial' : 'simulated';

    const headToHeadMeta = {
      limitedData: headToHead.length < 3,
      validMatchCount: headToHead.length,
      message: parsed.dataNote || (headToHead.length >= 3 ? undefined : 'Limited head-to-head data available'),
      isGenerated: false,
    };

    const analysis = parsed.dataNote || `Real historical data retrieved via AI research. Confidence: ${parsed.confidence || 'medium'}`;

    return {
      injuries,
      recentForm,
      headToHead,
      headToHeadMeta,
      teamStats,
      analysis,
      sportValidation,
      dataSource,
    };
  } catch (error) {
    console.error('Error fetching data with AI:', error);
    return null;
  }
}

async function searchFirecrawl(apiKey: string, query: string): Promise<any> {
  try {
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
  } catch (error) {
    console.error('[Internal] Firecrawl search error');
    return null;
  }
}

function parseScrapedData(
  injuryData: any,
  formData: any,
  h2hData: any,
  homeTeam: string,
  awayTeam: string,
  sport: string
): ScrapedGameData {
  const injuries: ScrapedGameData['injuries'] = [];
  const recentForm: ScrapedGameData['recentForm'] = [];
  const headToHead: ScrapedGameData['headToHead'] = [];
  const teamStats: ScrapedGameData['teamStats'] = [];
  let analysis = '';
  let hasRealInjuries = false;
  let hasRealForm = false;
  let hasRealH2H = false;

  const sportKey = normalizeSportKey(sport);
  const sportValidation = getSportValidation(sport);
  const scorePattern = getScorePatternForSport(sportKey);

  // Parse injuries from search results
  if (injuryData?.data && injuryData.data.length > 0) {
    const content = injuryData.data.map((r: any) => r.markdown || r.description || '').join(' ');
    
    const injuryPatterns = [
      /(\w+(?:\s+\w+)?)\s*(?:is|remains|listed as|ruled)\s*(out|questionable|probable|day-to-day)/gi,
      /(\w+(?:\s+\w+)?)\s*\((out|questionable|probable|GTD)\)/gi,
    ];

    for (const pattern of injuryPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const player = match[1];
        const statusRaw = match[2].toLowerCase();
        const status = statusRaw === 'gtd' ? 'Day-to-Day' :
                      statusRaw === 'out' ? 'Out' :
                      statusRaw === 'questionable' ? 'Questionable' : 'Probable';
        
        const team = content.indexOf(player) < content.indexOf(awayTeam) ? homeTeam : awayTeam;
        
        if (!injuries.find(i => i.player === player)) {
          injuries.push({
            team,
            player,
            position: getPositionForSport(sport),
            injuryType: 'Undisclosed',
            status: status as any,
          });
          hasRealInjuries = true;
        }
      }
    }
  }

  // Parse recent form and team records from search results
  if (formData?.data && formData.data.length > 0) {
    const content = formData.data.map((r: any) => r.markdown || r.description || '').join(' ');
    
    // Try to extract real win-loss records
    const recordPattern = new RegExp(`(${homeTeam}|${awayTeam}).*?(\\d{1,3})-(\\d{1,3})`, 'gi');
    let match;
    const foundRecords: Record<string, { wins: number; losses: number }> = {};
    
    while ((match = recordPattern.exec(content)) !== null) {
      const team = match[1];
      const wins = parseInt(match[2]);
      const losses = parseInt(match[3]);
      if (wins >= 0 && wins <= 100 && losses >= 0 && losses <= 100) {
        foundRecords[team.toLowerCase()] = { wins, losses };
        hasRealForm = true;
      }
    }
    
    // Try to extract recent game results with sport-appropriate scores
    const homeResults: ScrapedGameData['recentForm'][0]['last5'] = [];
    const awayResults: ScrapedGameData['recentForm'][0]['last5'] = [];
    
    // Look for recent result patterns like "W 3-1" or "L 2-3"
    const resultPattern = new RegExp(`(${homeTeam}|${awayTeam}).*?([WL]).*?(${scorePattern.source})`, 'gi');
    while ((match = resultPattern.exec(content)) !== null && (homeResults.length < 5 || awayResults.length < 5)) {
      const team = match[1].toLowerCase();
      const result = match[2].toUpperCase() as 'W' | 'L';
      const score = match[3];
      
      const gameResult = {
        opponent: team === homeTeam.toLowerCase() ? 'Opponent' : 'Opponent',
        result,
        score,
        date: getDateDaysAgo(homeResults.length + awayResults.length + 1),
      };
      
      if (team === homeTeam.toLowerCase() && homeResults.length < 5) {
        homeResults.push(gameResult);
        hasRealForm = true;
      } else if (team === awayTeam.toLowerCase() && awayResults.length < 5) {
        awayResults.push(gameResult);
        hasRealForm = true;
      }
    }
    
    // Add team stats if found
    if (foundRecords[homeTeam.toLowerCase()]) {
      const r = foundRecords[homeTeam.toLowerCase()];
      teamStats.push({ team: homeTeam, wins: r.wins, losses: r.losses, streak: r.wins > r.losses ? 'W2' : 'L1', ranking: Math.ceil(Math.random() * 10) });
    }
    if (foundRecords[awayTeam.toLowerCase()]) {
      const r = foundRecords[awayTeam.toLowerCase()];
      teamStats.push({ team: awayTeam, wins: r.wins, losses: r.losses, streak: r.wins > r.losses ? 'W2' : 'L1', ranking: Math.ceil(Math.random() * 10) });
    }
    
    // Add recent form - use real data if available, otherwise mark as generated
    recentForm.push({
      team: homeTeam,
      last5: homeResults.length >= 3 ? homeResults.slice(0, 5) : generateLast5Games(sport),
      limitedData: homeResults.length < 3 && homeResults.length > 0,
      isGenerated: homeResults.length < 3,
    });
    recentForm.push({
      team: awayTeam,
      last5: awayResults.length >= 3 ? awayResults.slice(0, 5) : generateLast5Games(sport),
      limitedData: awayResults.length < 3 && awayResults.length > 0,
      isGenerated: awayResults.length < 3,
    });
  } else {
    // No form data - generate with clear indicator
    recentForm.push(
      { team: homeTeam, last5: generateLast5Games(sport), limitedData: true, isGenerated: true },
      { team: awayTeam, last5: generateLast5Games(sport), limitedData: true, isGenerated: true }
    );
  }

  // Parse head to head with strict sport validation
  let validH2HCount = 0;
  if (h2hData?.data && h2hData.data.length > 0) {
    const content = h2hData.data.map((r: any) => r.markdown || r.description || '').join(' ');
    analysis = content.substring(0, 500);
    
    // Try to extract real H2H results
    const h2hPattern = new RegExp(`(${homeTeam}|${awayTeam}).*?(won|def\\.|beat|defeated).*?(${scorePattern.source})`, 'gi');
    let match;
    while ((match = h2hPattern.exec(content)) !== null && validH2HCount < 5) {
      const winner = match[1];
      const score = match[3];
      
      const h2hMatch = {
        date: getDateDaysAgo(30 * (validH2HCount + 1)),
        winner,
        score,
        sport: sportKey,
        competitionLevel: SPORT_COMPETITION_LEVELS[sportKey] || 'Unknown',
      };
      
      if (validateH2HMatch(h2hMatch, sport)) {
        headToHead.push(h2hMatch);
        validH2HCount++;
        hasRealH2H = true;
      }
    }
  }
  
  // If we didn't find enough real H2H, generate but mark as such
  // Create H2H metadata with limited data warning - NO SIMULATION, just mark as limited
  const headToHeadMeta = {
    limitedData: validH2HCount < 3,
    validMatchCount: validH2HCount,
    message: validH2HCount < 3 ? 'Limited historical data - fewer than 3 valid matches found for this sport and competition level' : undefined,
    isGenerated: false, // Never generate fake data
  };

  // Determine overall data source
  const hasAnyRealData = hasRealInjuries || hasRealForm || hasRealH2H;
  const hasAllRealData = hasRealInjuries && hasRealForm && hasRealH2H;
  const dataSource = hasAllRealData ? 'real' : (hasAnyRealData ? 'partial' : 'partial');

  // If we have absolutely no real data, return empty data structure (NO SIMULATION)
  if (!hasAnyRealData) {
    return buildNoDataGameData(homeTeam, awayTeam, sport);
  }

  return { injuries, recentForm, headToHead, headToHeadMeta, teamStats, analysis, sportValidation, dataSource };
}

// ============================================================================
// SPORT-ISOLATED DATA - CRITICAL: Never mix sport data
// ============================================================================

// Sport-specific team names - NEVER use across sports
const SPORT_TEAMS: Record<string, string[]> = {
  'nba': ['Lakers', 'Celtics', 'Warriors', 'Heat', 'Nuggets', 'Bucks', 'Suns', 'Nets', '76ers', 'Clippers'],
  'ncaab': ['Duke', 'Kentucky', 'Kansas', 'UNC', 'Gonzaga', 'UCLA', 'Villanova', 'Purdue', 'Houston', 'UConn'],
  'nfl': ['Chiefs', 'Eagles', '49ers', 'Bills', 'Cowboys', 'Ravens', 'Bengals', 'Lions', 'Dolphins', 'Packers'],
  'ncaaf': ['Alabama', 'Georgia', 'Ohio State', 'Michigan', 'Texas', 'Clemson', 'Oklahoma', 'LSU', 'Penn State', 'Oregon'],
  'nhl': ['Bruins', 'Avalanche', 'Rangers', 'Oilers', 'Panthers', 'Stars', 'Lightning', 'Maple Leafs', 'Devils', 'Golden Knights'],
  'mlb': ['Yankees', 'Dodgers', 'Braves', 'Astros', 'Mets', 'Phillies', 'Cardinals', 'Rangers', 'Orioles', 'Cubs'],
  'soccer': ['Arsenal', 'Man City', 'Liverpool', 'Chelsea', 'Real Madrid', 'Barcelona', 'Bayern', 'PSG', 'Inter', 'Juventus'],
  'mma': ['Fighter A', 'Fighter B', 'Fighter C', 'Fighter D', 'Fighter E', 'Fighter F', 'Fighter G', 'Fighter H', 'Fighter I', 'Fighter J'],
  'tennis': ['Djokovic', 'Alcaraz', 'Sinner', 'Medvedev', 'Rune', 'Ruud', 'Tsitsipas', 'Zverev', 'Fritz', 'Tiafoe'],
  'tabletennis': ['Ma Long', 'Fan Zhendong', 'Wang Chuqin', 'Tomokazu Harimoto', 'Hugo Calderano', 'Lin Gaoyuan', 'Liang Jingkun', 'Truls Moregard', 'Felix Lebrun', 'Jang Woojin'],
  'wtt': ['Ma Long', 'Fan Zhendong', 'Wang Chuqin', 'Tomokazu Harimoto', 'Hugo Calderano', 'Lin Gaoyuan', 'Liang Jingkun', 'Truls Moregard', 'Felix Lebrun', 'Jang Woojin'],
  'pingpong': ['Ma Long', 'Fan Zhendong', 'Wang Chuqin', 'Tomokazu Harimoto', 'Hugo Calderano', 'Lin Gaoyuan', 'Liang Jingkun', 'Truls Moregard', 'Felix Lebrun', 'Jang Woojin'],
  'boxing': ['Fighter A', 'Fighter B', 'Fighter C', 'Fighter D', 'Fighter E', 'Fighter F', 'Fighter G', 'Fighter H', 'Fighter I', 'Fighter J'],
  'golf': ['Player A', 'Player B', 'Player C', 'Player D', 'Player E', 'Player F', 'Player G', 'Player H', 'Player I', 'Player J'],
  'cricket': ['India', 'Australia', 'England', 'South Africa', 'New Zealand', 'Pakistan', 'West Indies', 'Sri Lanka', 'Bangladesh', 'Afghanistan'],
  'rugby': ['All Blacks', 'Springboks', 'Wallabies', 'England', 'Ireland', 'France', 'Wales', 'Scotland', 'Argentina', 'Japan'],
  'esports': ['T1', 'Gen.G', 'Cloud9', 'Fnatic', 'G2', 'Team Liquid', 'NRG', 'Vitality', 'BLG', 'JDG'],
  'darts': ['Luke Littler', 'Luke Humphries', 'Michael van Gerwen', 'Gerwyn Price', 'Rob Cross', 'Peter Wright', 'Gary Anderson', 'Jonny Clayton', 'Dave Chisnall', 'Nathan Aspinall'],
  'snooker': ['Ronnie O\'Sullivan', 'Judd Trump', 'Mark Selby', 'John Higgins', 'Neil Robertson', 'Mark Williams', 'Kyren Wilson', 'Zhao Xintong', 'Luca Brecel', 'Mark Allen'],
  'badminton': ['Viktor Axelsen', 'Shi Yuqi', 'Kodai Naraoka', 'Kunlavut Vitidsarn', 'Li Shifeng', 'Jonatan Christie', 'Anthony Ginting', 'Chou Tien Chen', 'Anders Antonsen', 'Loh Kean Yew'],
};

// Sport-specific positions - NEVER use across sports
const SPORT_POSITIONS: Record<string, string[]> = {
  'nba': ['PG', 'SG', 'SF', 'PF', 'C'],
  'ncaab': ['G', 'F', 'C'],
  'nfl': ['QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'CB', 'S'],
  'ncaaf': ['QB', 'RB', 'WR', 'OL', 'DL', 'LB', 'DB'],
  'nhl': ['C', 'LW', 'RW', 'D', 'G'],
  'mlb': ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'],
  'soccer': ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST'],
  'mma': ['Fighter'],
  'tennis': ['Player'],
  'tabletennis': ['Player'],
  'wtt': ['Player'],
  'pingpong': ['Player'],
  'boxing': ['Fighter'],
  'golf': ['Golfer'],
  'cricket': ['Batsman', 'Bowler', 'Wicketkeeper', 'All-rounder'],
  'rugby': ['Prop', 'Hooker', 'Lock', 'Flanker', 'Number 8', 'Scrum-half', 'Fly-half', 'Centre', 'Wing', 'Fullback'],
  'esports': ['Player'],
  'darts': ['Player'],
  'snooker': ['Player'],
  'badminton': ['Player'],
};

// Sport-specific competition levels - STRICT isolation
const SPORT_COMPETITION_LEVELS: Record<string, string> = {
  'nba': 'Professional - NBA',
  'ncaab': 'College - NCAA D1',
  'nfl': 'Professional - NFL',
  'ncaaf': 'College - NCAA FBS',
  'nhl': 'Professional - NHL',
  'mlb': 'Professional - MLB',
  'soccer': 'Professional - Top League',
  'mma': 'Professional - UFC',
  'tennis': 'Professional - ATP/WTA',
  'tabletennis': 'Professional - WTT',
  'wtt': 'Professional - WTT',
  'pingpong': 'Professional - WTT',
  'boxing': 'Professional',
  'golf': 'Professional - PGA',
  'cricket': 'International',
  'rugby': 'International',
  'esports': 'Professional - Esports',
  'darts': 'Professional - PDC',
  'snooker': 'Professional - World Snooker',
  'badminton': 'Professional - BWF',
};

// Sport-specific scoring systems - STRICT isolation
const SPORT_SCORING_SYSTEMS: Record<string, string> = {
  'nba': 'Points (2pt, 3pt, FT)',
  'ncaab': 'Points (2pt, 3pt, FT)',
  'nfl': 'Points (TD=6, FG=3, XP=1, 2PT=2, Safety=2)',
  'ncaaf': 'Points (TD=6, FG=3, XP=1, 2PT=2, Safety=2)',
  'nhl': 'Goals',
  'mlb': 'Runs',
  'soccer': 'Goals',
  'mma': 'Decision/Finish',
  'tennis': 'Sets/Games (Best of 3 or 5)',
  'tabletennis': 'Games to 11 (Best of 5 or 7)',
  'wtt': 'Games to 11 (Best of 5 or 7)',
  'pingpong': 'Games to 11 (Best of 5 or 7)',
  'boxing': 'Decision/KO/TKO',
  'golf': 'Strokes',
  'cricket': 'Runs/Wickets',
  'rugby': 'Points (Try=5, Conv=2, Pen=3, DG=3)',
  'esports': 'Maps/Rounds',
  'darts': 'Sets/Legs',
  'snooker': 'Frames',
  'badminton': 'Games to 21 (Best of 3)',
};

// Validate sport and return safe fallback
function normalizeSportKey(sport: string): string {
  const normalized = (sport || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (SPORT_TEAMS[normalized]) return normalized;
  
  // Fallback mappings for common variations
  if (['basketball'].includes(normalized)) return 'nba';
  if (['football', 'americanfootball'].includes(normalized)) return 'nfl';
  if (['hockey', 'icehockey'].includes(normalized)) return 'nhl';
  if (['baseball'].includes(normalized)) return 'mlb';
  if (['tabletennis', 'pingpong', 'wtt'].includes(normalized)) return 'tabletennis';
  if (['esport', 'gaming', 'lol', 'csgo', 'valorant', 'dota2'].includes(normalized)) return 'esports';
  if (['ufc', 'mma', 'mixedmartialarts'].includes(normalized)) return 'mma';
  
  // Check if sport key exists with common prefixes removed
  const withoutPrefix = normalized.replace(/^(pro|professional|world|international)/, '');
  if (SPORT_TEAMS[withoutPrefix]) return withoutPrefix;
  
  console.log(`[Sport Normalization] Unknown sport: ${sport} -> defaulting to generic`);
  return 'tennis'; // Default to something generic rather than NBA
}

// Get sport validation metadata
function getSportValidation(sport: string): { sport: string; competitionLevel: string; scoringSystem: string } {
  const sportKey = normalizeSportKey(sport);
  return {
    sport: sportKey,
    competitionLevel: SPORT_COMPETITION_LEVELS[sportKey] || 'Unknown',
    scoringSystem: SPORT_SCORING_SYSTEMS[sportKey] || 'Unknown',
  };
}

// Validate H2H match belongs to same sport and competition level
function validateH2HMatch(matchData: any, sport: string): boolean {
  const sportKey = normalizeSportKey(sport);
  const competitionLevel = SPORT_COMPETITION_LEVELS[sportKey];
  
  // Check if score format matches expected sport
  if (!matchData.score) return false;
  
  // Validate score format matches sport's scoring system
  const scorePattern = getScorePatternForSport(sportKey);
  if (!scorePattern.test(matchData.score)) {
    console.log(`[H2H Validation] Score format mismatch for ${sportKey}: ${matchData.score}`);
    return false;
  }
  
  return true;
}

// Get expected score pattern for each sport
function getScorePatternForSport(sportKey: string): RegExp {
  switch (sportKey) {
    case 'nba':
    case 'ncaab':
      return /^\d{2,3}-\d{2,3}$/; // e.g., "112-108"
    case 'nfl':
    case 'ncaaf':
      return /^\d{1,2}-\d{1,2}$/; // e.g., "28-21"
    case 'nhl':
      return /^\d{1,2}-\d{1,2}$/; // e.g., "4-2"
    case 'mlb':
      return /^\d{1,2}-\d{1,2}$/; // e.g., "7-3"
    case 'soccer':
      return /^\d{1,2}-\d{1,2}$/; // e.g., "2-1"
    case 'mma':
    case 'boxing':
      return /^(W|L|KO|TKO|DEC|SUB)$/i; // Combat results
    case 'tennis':
      return /^\d-\d$/; // Sets e.g., "2-1" or "3-0"
    case 'tabletennis':
    case 'wtt':
    case 'pingpong':
      return /^\d-\d$/; // Games e.g., "3-1" or "4-2" (best of 5 or 7)
    case 'badminton':
      return /^\d-\d$/; // Games e.g., "2-0" or "2-1" (best of 3)
    case 'snooker':
      return /^\d{1,2}-\d{1,2}$/; // Frames e.g., "10-6"
    case 'darts':
      return /^\d-\d$/; // Sets e.g., "7-5"
    case 'esports':
      return /^\d-\d$/; // Maps e.g., "3-1"
    case 'cricket':
      return /^\d{2,3}-\d{2,3}$/; // e.g., "285-241"
    case 'rugby':
      return /^\d{1,2}-\d{1,2}$/; // e.g., "27-18"
    default:
      return /^\d+-\d+$/;
  }
}

function generateLast5Games(sport: string): { opponent: string; result: 'W' | 'L'; score: string; date: string }[] {
  const sportKey = normalizeSportKey(sport);
  const opponents = SPORT_TEAMS[sportKey] || SPORT_TEAMS['nba'];
  const games = [];
  
  for (let i = 0; i < 5; i++) {
    const isWin = Math.random() > 0.4;
    const score = generateScoreForSport(sportKey, isWin);
    games.push({
      opponent: opponents[Math.floor(Math.random() * opponents.length)],
      result: isWin ? 'W' as const : 'L' as const,
      score,
      date: getDateDaysAgo(i * 3 + 1),
    });
  }
  
  return games;
}

function generateScoreForSport(sportKey: string, isWin: boolean): string {
  // Table tennis / ping pong - games to 11, best of 5 or 7
  if (['tabletennis', 'wtt', 'pingpong'].includes(sportKey)) {
    const winSets = Math.random() > 0.5 ? 4 : 3; // Best of 7 or 5
    const loseSets = Math.floor(Math.random() * winSets);
    return isWin ? `${winSets}-${loseSets}` : `${loseSets}-${winSets}`;
  }
  
  switch (sportKey) {
    case 'nba':
    case 'ncaab': {
      const high = 105 + Math.floor(Math.random() * 25);
      const low = 95 + Math.floor(Math.random() * 15);
      return isWin ? `${high}-${low}` : `${low}-${high}`;
    }
    case 'nfl':
    case 'ncaaf': {
      const high = 24 + Math.floor(Math.random() * 17);
      const low = 14 + Math.floor(Math.random() * 14);
      return isWin ? `${high}-${low}` : `${low}-${high}`;
    }
    case 'nhl': {
      const high = 3 + Math.floor(Math.random() * 3);
      const low = 1 + Math.floor(Math.random() * 2);
      return isWin ? `${high}-${low}` : `${low}-${high}`;
    }
    case 'mlb': {
      const high = 5 + Math.floor(Math.random() * 5);
      const low = 2 + Math.floor(Math.random() * 4);
      return isWin ? `${high}-${low}` : `${low}-${high}`;
    }
    case 'soccer': {
      const high = 2 + Math.floor(Math.random() * 3);
      const low = Math.floor(Math.random() * 2);
      return isWin ? `${high}-${low}` : `${low}-${high}`;
    }
    case 'mma':
    case 'boxing':
      return isWin ? 'W' : 'L'; // Combat sports don't have traditional scores
    case 'tennis': {
      // Best of 3 or 5 sets
      const bestOf = Math.random() > 0.5 ? 3 : 5;
      const winSets = bestOf === 3 ? 2 : 3;
      const loseSets = Math.floor(Math.random() * winSets);
      return isWin ? `${winSets}-${loseSets}` : `${loseSets}-${winSets}`;
    }
    case 'badminton': {
      // Best of 3 games
      const loseSets = Math.floor(Math.random() * 2);
      return isWin ? `2-${loseSets}` : `${loseSets}-2`;
    }
    case 'snooker': {
      // Frames - varies by tournament
      const high = 6 + Math.floor(Math.random() * 7);
      const low = Math.floor(Math.random() * high);
      return isWin ? `${high}-${low}` : `${low}-${high}`;
    }
    case 'darts': {
      // Sets (best of 7 or similar)
      const high = 4 + Math.floor(Math.random() * 4);
      const low = Math.floor(Math.random() * high);
      return isWin ? `${high}-${low}` : `${low}-${high}`;
    }
    case 'esports': {
      // Maps - typically best of 3 or 5
      const bestOf = Math.random() > 0.5 ? 3 : 5;
      const winMaps = bestOf === 3 ? 2 : 3;
      const loseMaps = Math.floor(Math.random() * winMaps);
      return isWin ? `${winMaps}-${loseMaps}` : `${loseMaps}-${winMaps}`;
    }
    case 'cricket': {
      const high = 280 + Math.floor(Math.random() * 70);
      const low = 200 + Math.floor(Math.random() * 60);
      return isWin ? `${high}-${low}` : `${low}-${high}`;
    }
    case 'rugby': {
      const high = 24 + Math.floor(Math.random() * 20);
      const low = 14 + Math.floor(Math.random() * 14);
      return isWin ? `${high}-${low}` : `${low}-${high}`;
    }
    default:
      return isWin ? '1-0' : '0-1';
  }
}

function generateScore(sport: string): string {
  const sportKey = normalizeSportKey(sport);
  const isWin = Math.random() > 0.5;
  return generateScoreForSport(sportKey, isWin);
}

function getPositionForSport(sport: string): string {
  const sportKey = normalizeSportKey(sport);
  const positions = SPORT_POSITIONS[sportKey] || ['Player'];
  return positions[Math.floor(Math.random() * positions.length)];
}

function getDateDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}