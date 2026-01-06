import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, gameContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Received chat request with", messages?.length, "messages");
    console.log("Game context:", gameContext);

    // Build context-aware system prompt
    let systemPrompt = `You are BetIQ Assistant, an AI helper for the BetIQ sports betting analysis platform. You ONLY answer questions about:

1. Sports betting topics:
   - Betting terminology (moneyline, spread, over/under, parlays, props, etc.)
   - How betting odds work and implied probabilities
   - Bankroll management and responsible gambling
   - Value betting concepts and edge calculations
   - Line movements and what they indicate

2. BetIQ platform features:
   - How to use the Games page to find matchups
   - Understanding the bet signals and confidence ratings
   - Reading the odds comparison charts
   - Interpreting team stats and recent form
   - Using BetIQ's AI analysis for decision making

IMPORTANT RULES:
- If someone asks about anything NOT related to sports betting or BetIQ, politely decline and redirect them to betting-related topics
- Never provide advice on non-sports topics, personal matters, coding, or general knowledge
- Be concise and helpful
- Always remind users that betting involves risk and to gamble responsibly
- Don't make guarantees about outcomes
- Format responses with bullet points when helpful`;

    // Add game-specific context if provided
    if (gameContext) {
      systemPrompt += `

CURRENT GAME CONTEXT:
- Sport: ${gameContext.sport}
- Match: ${gameContext.homeTeam} vs ${gameContext.awayTeam}
- Venue: ${gameContext.venue}
- Start Time: ${gameContext.startTime}
${gameContext.odds ? `
CURRENT ODDS:
- Moneyline: ${gameContext.homeTeam} ${gameContext.odds.moneyline?.home > 0 ? '+' : ''}${gameContext.odds.moneyline?.home} / ${gameContext.awayTeam} ${gameContext.odds.moneyline?.away > 0 ? '+' : ''}${gameContext.odds.moneyline?.away}
- Spread: ${gameContext.homeTeam} ${gameContext.odds.spread?.home > 0 ? '+' : ''}${gameContext.odds.spread?.home} (${gameContext.odds.spread?.line})
- Total: O/U ${gameContext.odds.total?.line}
- Implied Probability: ${gameContext.homeTeam} ${gameContext.odds.impliedProb?.homePct?.toFixed(1)}% / ${gameContext.awayTeam} ${gameContext.odds.impliedProb?.awayPct?.toFixed(1)}%
` : ''}
${gameContext.betSignal ? `
BET SIGNAL ANALYSIS:
- Signal: ${gameContext.betSignal.signal}
- Edge: ${gameContext.betSignal.edge > 0 ? '+' : ''}${gameContext.betSignal.edge}%
- Confidence: ${gameContext.betSignal.confidence}%
- Recommended Pick: ${gameContext.betSignal.pick === 'home' ? gameContext.homeTeam : gameContext.awayTeam}
- Reason: ${gameContext.betSignal.reason}
` : ''}

When answering questions, use this context to provide specific, relevant information about this game.`;
    }

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
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add more credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Streaming response from AI gateway");
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Betting chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
