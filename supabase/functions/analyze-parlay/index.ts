import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Pick {
  playerName: string;
  team: string;
  propType: string;
  line: number;
  direction: 'MORE' | 'LESS';
  confidence: number;
  sport: string;
  opponent?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { picks }: { picks: Pick[] } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!picks || picks.length === 0) {
      return new Response(
        JSON.stringify({ error: "No picks provided" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build context for the AI
    const picksContext = picks.map((p, i) => 
      `${i + 1}. ${p.playerName} (${p.team}) - ${p.direction} ${p.line} ${p.propType} | Confidence: ${p.confidence}% | Sport: ${p.sport}${p.opponent ? ` vs ${p.opponent}` : ''}`
    ).join('\n');

    const systemPrompt = `You are an expert sports analyst providing parlay analysis. Be concise and actionable.

RULES:
- Never mention data sources or APIs
- Never guarantee outcomes
- Focus on correlations, risks, and value
- Be direct and helpful

OUTPUT FORMAT (JSON):
{
  "signal": "STRONG" | "DECENT" | "RISKY" | "AVOID",
  "overallConfidence": 0-100,
  "verdict": "One sentence summary",
  "strengths": ["strength 1", "strength 2"],
  "risks": ["risk 1", "risk 2"],
  "correlations": "Any positive or negative correlations between picks",
  "suggestion": "Actionable advice for this parlay",
  "alternativeIdea": "Optional: a tweak that could improve the parlay"
}`;

    const userPrompt = `Analyze this ${picks.length}-leg parlay:

${picksContext}

Combined win probability is approximately ${(picks.reduce((acc, p) => acc * (p.confidence / 100), 1) * 100).toFixed(1)}%.

Provide analysis in JSON format only.`;

    console.log("Calling Lovable AI for parlay analysis...");

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

    // Parse the JSON response
    let analysis;
    try {
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysis = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      return new Response(
        JSON.stringify({ error: "Failed to parse AI analysis", raw: content }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Parlay analysis generated successfully");

    return new Response(
      JSON.stringify({ success: true, analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error in analyze-parlay:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
