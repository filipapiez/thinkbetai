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
    const gameData: GameData = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build context for the AI
    const context = buildGameContext(gameData);
    
    const systemPrompt = `You are an expert sports analyst providing concise, actionable betting insights. 

RULES:
- Never mention "scraping", "APIs", or data sources
- Never make guarantees or promise wins
- Be direct and confident in your analysis
- Focus on what matters: injuries, form, matchup factors
- Use bullet points for clarity
- Keep explanations short but insightful

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

    const userPrompt = `Analyze this ${gameData.sport} matchup and provide betting insights:

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

function buildGameContext(data: GameData): string {
  const lines: string[] = [];
  
  lines.push(`MATCHUP: ${data.homeTeam} (Home) vs ${data.awayTeam} (Away)`);
  lines.push(`SPORT: ${data.sport}`);
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
  
  // Injuries
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
