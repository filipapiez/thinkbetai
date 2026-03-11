import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface RecentGame {
  totalPoints: number;
}

interface GameSummary {
  id: string;
  homeTeam: string;
  awayTeam: string;
  total: number;
  overOdds: number;
  underOdds: number;
  mlHome: number;
  mlAway: number;
  lean: string;
  confidence: number;
  homeRecent?: RecentGame[];
  awayRecent?: RecentGame[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { games } = (await req.json()) as { games: GameSummary[] };
    if (!games?.length) {
      return new Response(JSON.stringify({ explanations: {} }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Build a compact summary for the AI including recent scores
    const gameSummaries = games.slice(0, 15).map((g, i) => {
      let line = `${i + 1}. [${g.id}] ${g.awayTeam} @ ${g.homeTeam} | Total: ${g.total} | Over ${g.overOdds > 0 ? '+' : ''}${g.overOdds} / Under ${g.underOdds > 0 ? '+' : ''}${g.underOdds} | ML: Home ${g.mlHome > 0 ? '+' : ''}${g.mlHome}, Away ${g.mlAway > 0 ? '+' : ''}${g.mlAway}`;

      // Add recent scores context
      if (g.awayRecent?.length) {
        const totals = g.awayRecent.map(r => r.totalPoints);
        const avg = Math.round(totals.reduce((s, t) => s + t, 0) / totals.length);
        const overCount = totals.filter(t => t > g.total).length;
        line += ` | ${g.awayTeam} L${totals.length}: [${totals.join(', ')}] avg ${avg}, ${overCount}/${totals.length} went OVER ${g.total}`;
      }
      if (g.homeRecent?.length) {
        const totals = g.homeRecent.map(r => r.totalPoints);
        const avg = Math.round(totals.reduce((s, t) => s + t, 0) / totals.length);
        const overCount = totals.filter(t => t > g.total).length;
        line += ` | ${g.homeTeam} L${totals.length}: [${totals.join(', ')}] avg ${avg}, ${overCount}/${totals.length} went OVER ${g.total}`;
      }

      return line;
    }).join("\n");

    const systemPrompt = `You are an expert sports betting analyst. For each game, provide a concise 1-2 sentence explanation of WHY the total leans OVER or UNDER (or is even).

CRITICAL RULES:
- You MUST factor in the recent game scores provided. If both teams' last 5 games consistently went OVER the current line, your lean MUST reflect that (lean OVER). If they consistently went UNDER, lean UNDER.
- Recent scoring trends are the PRIMARY factor. Juice differentials and market signals are secondary.
- Do NOT contradict the data. If 4-5 of the last 5 games went over, do NOT recommend under unless there is an overwhelming reason.
- Focus on the "why" — pace trends, scoring averages vs the line, defensive/offensive matchups.
- Do NOT just restate the odds. Be sharp and insightful.

Return a JSON object where keys are the game IDs (in brackets) and values are the explanation strings. Return ONLY the JSON object, no markdown.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analyze these games:\n${gameSummaries}` },
        ],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429 || status === 402) {
        return new Response(JSON.stringify({ error: status === 429 ? "Rate limited" : "Payment required", explanations: {} }), {
          status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.error("AI gateway error:", status, await response.text());
      return new Response(JSON.stringify({ explanations: {} }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || "{}";
    
    // Parse the JSON from AI response
    let explanations: Record<string, string> = {};
    try {
      const cleaned = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      explanations = JSON.parse(cleaned);
    } catch (e) {
      console.error("Failed to parse AI response:", content);
    }

    return new Response(JSON.stringify({ explanations }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-game-totals error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error", explanations: {} }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
