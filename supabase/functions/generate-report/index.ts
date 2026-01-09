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
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build context
    const context = buildContext(gameData);

    const systemPrompt = `You are an expert sports analyst writing a comprehensive game report. 

RULES:
- Never mention scraping, APIs, or data sources
- Be confident and actionable
- Use markdown formatting
- Include sections: Summary, Key Factors, Injury Analysis, Form Analysis, Betting Angle, Final Verdict
- Keep each section focused and insightful

Write a professional analysis report in markdown format.`;

    const userPrompt = `Write a full analysis report for this ${gameData.sport} matchup:

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
