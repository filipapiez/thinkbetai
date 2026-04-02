import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { dataFreshnessPrompt } from "../_shared/seasonGuard.ts";

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
    // Authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("Authentication failed:", userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;
    console.log(`Authenticated user: ${userId}`);

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

    const currentDate = new Date().toISOString().split('T')[0];
    const systemPrompt = `You are an elite sports betting analyst. Provide an extremely detailed, professional-grade parlay analysis. Be data-driven, specific, and actionable.

${dataFreshnessPrompt(currentDate)}

RULES:
- Never mention data sources or APIs
- Never guarantee outcomes
- Be specific about each matchup — reference team/player tendencies, matchup dynamics, and situational factors ONLY if confirmed by the provided data
- Treat each leg as its own mini-analysis before combining
- Be direct, insightful, and professional
- Do NOT mention specific players by name unless they appear in the provided pick data

OUTPUT FORMAT (JSON):
{
  "signal": "STRONG" | "DECENT" | "RISKY" | "AVOID",
  "overallConfidence": 0-100,
  "winProbability": "estimated combined win probability as percentage string e.g. '12.4%'",
  "grade": "A+" | "A" | "B+" | "B" | "C+" | "C" | "D" | "F",
  "verdict": "2-3 sentence executive summary of this parlay",
  "legBreakdowns": [
    {
      "leg": "Player/Team name — prop or matchup description",
      "signal": "STRONG" | "DECENT" | "RISKY" | "AVOID",
      "confidence": 0-100,
      "strengths": ["specific strength 1", "specific strength 2"],
      "risks": ["specific risk 1", "specific risk 2"],
      "keyInsight": "One sentence with the most important factor for this leg"
    }
  ],
  "correlations": {
    "positive": ["correlation that helps multiple legs hit together"],
    "negative": ["correlation that hurts — if one hits, another might not"]
  },
  "overallStrengths": ["parlay-level strength 1", "parlay-level strength 2"],
  "overallRisks": ["parlay-level risk 1", "parlay-level risk 2"],
  "suggestion": "Detailed actionable advice — keep, modify, or split this parlay",
  "alternativeIdea": "A specific tweak or alternative parlay construction that improves EV"
}`;

    const userPrompt = `Analyze this ${picks.length}-leg parlay in detail:

${picksContext}

Combined estimated win probability: ~${(picks.reduce((acc, p) => acc * (p.confidence / 100), 1) * 100).toFixed(1)}%.

For EACH leg, provide specific strengths, risks, and a key insight. Then analyze how the legs correlate with each other. Provide your analysis in JSON format only.`;

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
