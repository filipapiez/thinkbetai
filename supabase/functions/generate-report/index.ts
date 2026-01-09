import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GameData {
  homeTeam: string;
  awayTeam: string;
  sport: string;
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
    last5: Array<{ result: string }>;
  }>;
  headToHead?: Array<{
    date: string;
    winner: string;
    score: string;
  }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const gameData: GameData = await req.json();
    
    // Validate and normalize sport
    const validatedSport = validateAndNormalizeSport(gameData.sport);
    gameData.sport = validatedSport;
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build context with sport-specific validation
    const context = buildContext(gameData);
    const sportTerminology = getSportTerminology(validatedSport);

    const systemPrompt = `You are an expert ${validatedSport} analyst writing a comprehensive game report.

CRITICAL SPORT ISOLATION RULES:
- This is a ${validatedSport} game ONLY
- Use ONLY ${validatedSport} terminology: ${sportTerminology.terms.join(', ')}
- Score references must follow: ${sportTerminology.scoreFormat}
- Period/timing references: ${sportTerminology.periods}
- NEVER reference other sports, their teams, players, or terminology
- NEVER mix basketball terminology with football or any other sport
- If any data seems inconsistent with ${validatedSport}, note the discrepancy

GENERAL RULES:
- Never mention scraping, APIs, or data sources
- Be confident and actionable
- Use markdown formatting
- Include sections: Summary, Key Factors, Injury Analysis, Form Analysis, Betting Angle, Final Verdict
- Keep each section focused and insightful

Write a professional ${validatedSport} analysis report in markdown format.`;

    const userPrompt = `Write a full analysis report for this ${validatedSport} matchup.

IMPORTANT: All terminology, scores, and references must be ${validatedSport}-specific only.

${context}

Format as a professional markdown report with clear sections.`;

    console.log("Calling Lovable AI for full report...");

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
          JSON.stringify({ error: "Rate limit exceeded. Please try again." }),
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
        JSON.stringify({ error: "Failed to generate report" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const report = data.choices?.[0]?.message?.content;

    if (!report) {
      console.error("No content in AI response");
      return new Response(
        JSON.stringify({ error: "Empty AI response" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Full report generated successfully");

    return new Response(
      JSON.stringify({ success: true, report }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error in generate-report:", error);
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
    terms: ['points', 'rebounds', 'assists', 'steals', 'blocks', 'turnovers', 'three-pointers'],
    scoreFormat: '90-120 points typical',
    periods: 'quarters (4 x 12 minutes)',
  },
  'NFL': {
    terms: ['touchdowns', 'field goals', 'yards', 'passes', 'rushing', 'sacks', 'interceptions'],
    scoreFormat: '14-35 points typical',
    periods: 'quarters (4 x 15 minutes)',
  },
  'NHL': {
    terms: ['goals', 'assists', 'saves', 'shots on goal', 'power play', 'penalty kill'],
    scoreFormat: '2-5 goals typical',
    periods: 'periods (3 x 20 minutes)',
  },
  'MLB': {
    terms: ['runs', 'hits', 'RBIs', 'home runs', 'strikeouts', 'walks', 'ERA'],
    scoreFormat: '3-8 runs typical',
    periods: 'innings (9 innings)',
  },
  'Soccer': {
    terms: ['goals', 'assists', 'shots', 'possession', 'corners', 'fouls', 'cards'],
    scoreFormat: '0-4 goals typical',
    periods: 'halves (2 x 45 minutes)',
  },
  'UFC': {
    terms: ['knockouts', 'submissions', 'decisions', 'takedowns', 'strikes', 'ground control'],
    scoreFormat: 'Win by KO/TKO/SUB/DEC',
    periods: 'rounds (3 or 5 x 5 minutes)',
  },
  'Tennis': {
    terms: ['sets', 'games', 'aces', 'double faults', 'break points', 'winners'],
    scoreFormat: 'Sets (best of 3 or 5)',
    periods: 'sets and games',
  },
  'Boxing': {
    terms: ['knockouts', 'decisions', 'rounds', 'punches landed', 'jabs', 'power punches'],
    scoreFormat: 'Win by KO/TKO/DEC',
    periods: 'rounds (12 x 3 minutes)',
  },
};

function validateAndNormalizeSport(sport: string): string {
  const normalized = (sport || '').toLowerCase().trim();
  
  const sportMap: Record<string, string> = {
    'nba': 'NBA', 'basketball': 'NBA', 'ncaab': 'NCAAB',
    'nfl': 'NFL', 'football': 'NFL', 'ncaaf': 'NCAAF', 'american football': 'NFL',
    'nhl': 'NHL', 'hockey': 'NHL', 'ice hockey': 'NHL',
    'mlb': 'MLB', 'baseball': 'MLB',
    'soccer': 'Soccer', 'epl': 'Soccer', 'premier league': 'Soccer',
    'ufc': 'UFC', 'mma': 'UFC',
    'tennis': 'Tennis', 'atp': 'Tennis', 'wta': 'Tennis',
    'boxing': 'Boxing',
  };
  
  return sportMap[normalized] || sport || 'NBA';
}

function getSportTerminology(sport: string): { terms: string[]; scoreFormat: string; periods: string } {
  return SPORT_CONFIG[sport] || SPORT_CONFIG['NBA'];
}

function buildContext(data: GameData): string {
  const lines: string[] = [];
  
  lines.push(`MATCHUP: ${data.homeTeam} (Home) vs ${data.awayTeam} (Away)`);
  lines.push(`SPORT: ${data.sport}`);
  lines.push('');
  
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
  
  if (data.injuries && data.injuries.length > 0) {
    lines.push('INJURIES:');
    data.injuries.forEach(i => {
      lines.push(`- ${i.player} (${i.team}, ${i.position}): ${i.injuryType} - ${i.status}`);
    });
    lines.push('');
  }
  
  if (data.recentForm && data.recentForm.length > 0) {
    lines.push('RECENT FORM:');
    data.recentForm.forEach(team => {
      const wins = team.last5.filter(g => g.result === 'W').length;
      const results = team.last5.map(g => g.result).join('-');
      lines.push(`${team.team}: ${wins}-${5 - wins} (${results})`);
    });
    lines.push('');
  }
  
  if (data.headToHead && data.headToHead.length > 0) {
    lines.push('HEAD TO HEAD:');
    data.headToHead.slice(0, 3).forEach(h2h => {
      lines.push(`${h2h.date}: ${h2h.winner} (${h2h.score})`);
    });
    lines.push('');
  }
  
  return lines.join('\n');
}
