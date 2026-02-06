import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GameData {
  homeTeam: string;
  awayTeam: string;
  sport: string;
  initialQualification?: {
    signal: 'GOOD' | 'BORDERLINE' | 'PASS';
    confidenceScore: number;
    pick?: 'home' | 'away';
  };
  initialRisk?: {
    level: 'Low' | 'Medium' | 'High';
    score: number;
  };
  odds?: {
    moneyline?: { home: number; away: number };
    spread?: { home: number; away: number };
    total?: { line: number };
  };
  injuries?: Array<{
    team: string;
    player: string;
    position: string;
    injuryType: string;
    status: string;
  }>;
  recentForm?: Array<{
    team: string;
    last5: Array<{ opponent: string; result: string; score: string; date: string }>;
  }>;
  headToHead?: Array<{
    date: string;
    winner: string;
    score: string;
  }>;
  teamStats?: Array<{
    team: string;
    wins: number;
    losses: number;
    streak: string;
    ranking: number;
  }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication is optional - log user if authenticated
    const authHeader = req.headers.get('Authorization');
    let userId = 'anonymous';
    
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL')!,
          Deno.env.get('SUPABASE_ANON_KEY')!,
          { global: { headers: { Authorization: authHeader } } }
        );

        const token = authHeader.replace('Bearer ', '');
        const { data: userData } = await supabase.auth.getUser(token);
        if (userData?.user?.id) {
          userId = userData.user.id;
        }
      } catch (authErr) {
        console.log("Auth check failed, proceeding as anonymous:", authErr);
      }
    }
    
    console.log(`User: ${userId}`);

    const gameData: GameData = await req.json();
    
    // Validate sport and normalize - pass team names for better detection
    const validatedSport = validateAndNormalizeSport(gameData.sport, gameData.homeTeam, gameData.awayTeam);
    gameData.sport = validatedSport;
    console.log(`Sport normalized: "${gameData.sport}" -> "${validatedSport}" for ${gameData.homeTeam} vs ${gameData.awayTeam}`);
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build context for the AI with sport-isolated data
    const context = buildGameContext(gameData);
    const sportTerminology = getSportTerminology(validatedSport);
    
    // Extract initial qualification signal if provided
    const initialSignal = gameData.initialQualification?.signal || null;
    const initialConfidence = gameData.initialQualification?.confidenceScore || null;
    const initialRisk = gameData.initialRisk?.level || null;
    
    const signalGuidance = initialSignal 
      ? `\nINITIAL ODDS-BASED SIGNAL: ${initialSignal} (${initialConfidence}% confidence)
- You should generally ALIGN with this signal unless you find STRONG evidence to downgrade
- Downgrade from GOOD to AVOID only if: major injury to star player, terrible recent form (0-5 or 1-4), or lopsided H2H against the pick
- If initial signal is GOOD and data supports it, use STRONG_VALUE or QUALIFIED
- If initial signal is PASS, you may upgrade to RISKY if you see value, but never to QUALIFIED/STRONG_VALUE without strong evidence`
      : '';
    
    const riskGuidance = initialRisk
      ? `\nINITIAL RISK LEVEL: ${initialRisk}
- You MUST use this same risk level (${initialRisk}) in your output unless there's a critical reason to differ
- Only deviate if you find major new risk factors not captured in the odds analysis`
      : '';

    const systemPrompt = `You are an expert ${validatedSport} analyst providing concise, actionable betting insights.

CRITICAL SPORT ISOLATION RULES:
- This is a ${validatedSport} game ONLY
- Use ONLY ${validatedSport} terminology: ${sportTerminology.terms.join(', ')}
- Score format: ${sportTerminology.scoreFormat}
- Period terminology: ${sportTerminology.periods}
- NEVER reference other sports, their teams, players, or terminology
- NEVER use basketball terms for football or vice versa
- If data seems inconsistent with ${validatedSport}, flag it as questionable
${signalGuidance}
${riskGuidance}

GENERAL RULES:
- Never mention "scraping", "APIs", or data sources
- Never make guarantees or promise wins
- Be direct and confident in your analysis
- Focus on what matters: injuries, form, matchup factors
- Use bullet points for clarity
- Keep explanations short but insightful

SIGNAL CONSISTENCY:
- Your signal should generally match the header signal unless you have strong contrary evidence
- Map signals: GOOD → STRONG_VALUE or QUALIFIED, BORDERLINE → RISKY, PASS → AVOID
- Only contradict the header signal if injuries/form clearly warrant it

OUTPUT FORMAT (JSON):
{
  "signal": "STRONG_VALUE" | "QUALIFIED" | "RISKY" | "AVOID",
  "confidence": 0-100,
  "pick": "home" | "away",
  "pickTeam": "Team Name",
  "verdict": "One sentence verdict",
  "factors": [
    { "label": "Factor description", "positive": true/false }
  ],
  "injurySummary": "Brief injury impact or null",
  "riskLevel": "Low" | "Medium" | "High",
  "suggestedStake": "Stake recommendation",
  "keyInsight": "One unique insight the model noticed",
  "reasoning": "2-3 sentence explanation of the pick"
}`;

    const userPrompt = `Analyze this ${validatedSport} matchup and provide betting insights.

IMPORTANT: All analysis must use ${validatedSport}-specific terminology only.

${context}

Respond with valid JSON only.`;

    console.log("Calling Lovable AI for game analysis...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Failed to generate analysis" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error("No content in AI response");
      return new Response(
        JSON.stringify({ error: "Empty AI response" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the JSON response from the AI
    let analysis;
    try {
      // Clean the response in case it has markdown code blocks
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysis = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      return new Response(
        JSON.stringify({ error: "Failed to parse AI analysis", raw: content }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("AI analysis generated successfully");

    return new Response(
      JSON.stringify({ success: true, analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error in analyze-game:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ============================================================================
// SPORT VALIDATION AND TERMINOLOGY - CRITICAL FOR DATA ISOLATION
// ============================================================================

const SPORT_CONFIG: Record<string, { terms: string[]; scoreFormat: string; periods: string }> = {
  'NBA': {
    terms: ['points', 'rebounds', 'assists', 'steals', 'blocks', 'turnovers', 'three-pointers', 'free throws', 'paint points'],
    scoreFormat: '90-120 points typical',
    periods: 'quarters (4 x 12 minutes)',
  },
  'NFL': {
    terms: ['touchdowns', 'field goals', 'yards', 'passes', 'rushing', 'sacks', 'interceptions', 'fumbles', 'first downs'],
    scoreFormat: '14-35 points typical',
    periods: 'quarters (4 x 15 minutes)',
  },
  'NHL': {
    terms: ['goals', 'assists', 'saves', 'shots on goal', 'power play', 'penalty kill', 'face-offs', 'hits', 'blocked shots'],
    scoreFormat: '2-5 goals typical',
    periods: 'periods (3 x 20 minutes)',
  },
  'MLB': {
    terms: ['runs', 'hits', 'RBIs', 'home runs', 'strikeouts', 'walks', 'ERA', 'batting average', 'innings'],
    scoreFormat: '3-8 runs typical',
    periods: 'innings (9 innings)',
  },
  'Soccer': {
    terms: ['goals', 'assists', 'shots', 'possession', 'corners', 'fouls', 'cards', 'clean sheet', 'saves'],
    scoreFormat: '0-4 goals typical',
    periods: 'halves (2 x 45 minutes)',
  },
  'UFC': {
    terms: ['knockouts', 'submissions', 'decisions', 'takedowns', 'strikes', 'ground control', 'reach', 'weight class'],
    scoreFormat: 'Win by KO/TKO/SUB/DEC',
    periods: 'rounds (3 or 5 x 5 minutes)',
  },
  'Tennis': {
    terms: ['sets', 'games', 'aces', 'double faults', 'break points', 'winners', 'unforced errors', 'first serve %'],
    scoreFormat: 'Sets (best of 3 or 5)',
    periods: 'sets and games',
  },
  'Boxing': {
    terms: ['knockouts', 'decisions', 'rounds', 'punches landed', 'jabs', 'power punches', 'knockdowns', 'cuts'],
    scoreFormat: 'Win by KO/TKO/DEC',
    periods: 'rounds (12 x 3 minutes)',
  },
};

function validateAndNormalizeSport(sport: string, homeTeam?: string, awayTeam?: string): string {
  const normalized = (sport || '').toLowerCase().trim();
  
  // Known soccer team names/keywords to detect soccer even when labeled as "Football"
  const soccerTeamIndicators = [
    'fc', 'united', 'city', 'rovers', 'athletic', 'wanderers', 'albion', 'villa',
    'hotspur', 'palace', 'forest', 'county', 'town', 'rangers', 'celtic',
    'real', 'barcelona', 'madrid', 'bayern', 'borussia', 'juventus', 'inter', 'milan',
    'psg', 'paris', 'lyon', 'marseille', 'monaco', 'ajax', 'feyenoord', 'psv',
    'porto', 'benfica', 'sporting', 'stoke', 'middlesbrough', 'sunderland', 'leeds',
    'everton', 'newcastle', 'aston', 'wolves', 'brighton', 'brentford', 'fulham',
    'burnley', 'watford', 'norwich', 'swansea', 'cardiff', 'hull', 'reading',
    'sheffield', 'bristol', 'ipswich', 'blackburn', 'bolton', 'wigan', 'millwall',
    'coventry', 'birmingham', 'derby', 'nottingham', 'leicester', 'preston', 'plymouth',
    'luton', 'huddersfield', 'rotherham', 'qpr', 'queens park'
  ];
  
  // Check if team names suggest soccer
  const teamCheck = ((homeTeam || '') + ' ' + (awayTeam || '')).toLowerCase();
  const isSoccerTeam = soccerTeamIndicators.some(indicator => teamCheck.includes(indicator));
  
  // If sport is "football" but teams look like soccer teams, it's Soccer
  if ((normalized === 'football' || normalized === 'soccer_efl_championship' || 
       normalized.includes('efl') || normalized.includes('championship')) && isSoccerTeam) {
    return 'Soccer';
  }
  
  // Map variations to canonical names
  const sportMap: Record<string, string> = {
    'nba': 'NBA', 'basketball': 'NBA', 'ncaab': 'NCAAB',
    'nfl': 'NFL', 'american football': 'NFL', 'ncaaf': 'NCAAF',
    'nhl': 'NHL', 'hockey': 'NHL', 'ice hockey': 'NHL',
    'mlb': 'MLB', 'baseball': 'MLB',
    'soccer': 'Soccer', 'football (soccer)': 'Soccer', 'epl': 'Soccer', 'premier league': 'Soccer',
    'la liga': 'Soccer', 'bundesliga': 'Soccer', 'serie a': 'Soccer', 'mls': 'Soccer',
    'efl championship': 'Soccer', 'soccer_efl_championship': 'Soccer', 'championship': 'Soccer',
    'ligue 1': 'Soccer', 'eredivisie': 'Soccer', 'primeira liga': 'Soccer',
    'ufc': 'UFC', 'mma': 'UFC', 'mixed martial arts': 'UFC',
    'tennis': 'Tennis', 'atp': 'Tennis', 'wta': 'Tennis',
    'boxing': 'Boxing',
  };
  
  // Special handling: "football" defaults to NFL only if no soccer indicators found
  if (normalized === 'football') {
    return isSoccerTeam ? 'Soccer' : 'NFL';
  }
  
  return sportMap[normalized] || sport || 'NBA';
}

function getSportTerminology(sport: string): { terms: string[]; scoreFormat: string; periods: string } {
  return SPORT_CONFIG[sport] || SPORT_CONFIG['NBA'];
}

function buildGameContext(data: GameData): string {
  const lines: string[] = [];
  const sport = data.sport;
  
  lines.push(`MATCHUP: ${data.homeTeam} (Home) vs ${data.awayTeam} (Away)`);
  lines.push(`SPORT: ${sport}`);
  lines.push('');
  
  // Odds
  if (data.odds) {
    lines.push('ODDS:');
    if (data.odds.moneyline) {
      lines.push(`- Moneyline: ${data.homeTeam} ${data.odds.moneyline.home > 0 ? '+' : ''}${data.odds.moneyline.home} | ${data.awayTeam} ${data.odds.moneyline.away > 0 ? '+' : ''}${data.odds.moneyline.away}`);
    }
    if (data.odds.spread) {
      lines.push(`- Spread: ${data.homeTeam} ${data.odds.spread.home > 0 ? '+' : ''}${data.odds.spread.home}`);
    }
    if (data.odds.total) {
      lines.push(`- Total: ${data.odds.total.line}`);
    }
    lines.push('');
  }
  
  // Injuries - validate positions match sport
  if (data.injuries && data.injuries.length > 0) {
    lines.push('INJURIES:');
    const homeInjuries = data.injuries.filter(i => i.team === data.homeTeam);
    const awayInjuries = data.injuries.filter(i => i.team === data.awayTeam);
    
    if (homeInjuries.length > 0) {
      lines.push(`${data.homeTeam}:`);
      homeInjuries.forEach(i => {
        lines.push(`  - ${i.player} (${i.position}): ${i.injuryType} - ${i.status}`);
      });
    }
    if (awayInjuries.length > 0) {
      lines.push(`${data.awayTeam}:`);
      awayInjuries.forEach(i => {
        lines.push(`  - ${i.player} (${i.position}): ${i.injuryType} - ${i.status}`);
      });
    }
    lines.push('');
  }
  
  // Recent Form
  if (data.recentForm && data.recentForm.length > 0) {
    lines.push('RECENT FORM (Last 5 Games):');
    data.recentForm.forEach(team => {
      const wins = team.last5.filter(g => g.result === 'W').length;
      const losses = team.last5.filter(g => g.result === 'L').length;
      const results = team.last5.map(g => g.result).join('-');
      lines.push(`${team.team}: ${wins}W-${losses}L (${results})`);
    });
    lines.push('');
  }
  
  // Team Stats
  if (data.teamStats && data.teamStats.length > 0) {
    lines.push('TEAM STANDINGS:');
    data.teamStats.forEach(team => {
      lines.push(`${team.team}: ${team.wins}-${team.losses} | Rank #${team.ranking} | ${team.streak}`);
    });
    lines.push('');
  }
  
  // Head to Head
  if (data.headToHead && data.headToHead.length > 0) {
    lines.push('HEAD TO HEAD (Recent):');
    data.headToHead.slice(0, 3).forEach(h2h => {
      lines.push(`${h2h.date}: ${h2h.winner} won (${h2h.score})`);
    });
    lines.push('');
  }
  
  return lines.join('\n');
}
