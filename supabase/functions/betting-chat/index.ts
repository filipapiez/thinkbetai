import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting (per user, per minute)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 20; // 20 requests per minute
const RATE_WINDOW_MS = 60 * 1000;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(userId);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_WINDOW_MS });
    return true;
  }
  
  if (record.count >= RATE_LIMIT) {
    return false;
  }
  
  record.count++;
  return true;
}

// Authentication helper
async function authenticateUser(req: Request): Promise<{ userId: string } | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    console.log('No valid auth header found');
    return null;
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const token = authHeader.replace('Bearer ', '');
  const { data, error } = await supabase.auth.getClaims(token);
  
  if (error || !data?.claims) {
    console.log('Auth claims error:', error?.message);
    return null;
  }

  return { userId: data.claims.sub as string };
}

// Input validation
const MAX_MESSAGE_LENGTH = 2000;
const MAX_MESSAGES = 20;
const MAX_TEAM_NAME_LENGTH = 100;

function sanitizeString(str: string, maxLength: number): string {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, maxLength).replace(/[<>]/g, '');
}

function validateMessages(messages: unknown): { role: string; content: string }[] | null {
  if (!Array.isArray(messages)) return null;
  if (messages.length > MAX_MESSAGES) return null;
  
  const validated: { role: string; content: string }[] = [];
  for (const msg of messages) {
    if (!msg || typeof msg !== 'object') return null;
    const role = (msg as any).role;
    const content = (msg as any).content;
    
    if (!['user', 'assistant', 'system'].includes(role)) return null;
    if (typeof content !== 'string' || content.length > MAX_MESSAGE_LENGTH) return null;
    
    validated.push({ role, content: sanitizeString(content, MAX_MESSAGE_LENGTH) });
  }
  return validated;
}

function validateGameContext(ctx: unknown): object | null {
  if (!ctx || typeof ctx !== 'object') return null;
  const c = ctx as any;
  
  return {
    sport: sanitizeString(c.sport || '', 50),
    homeTeam: sanitizeString(c.homeTeam || '', MAX_TEAM_NAME_LENGTH),
    awayTeam: sanitizeString(c.awayTeam || '', MAX_TEAM_NAME_LENGTH),
    venue: sanitizeString(c.venue || '', 200),
    startTime: sanitizeString(c.startTime || '', 50),
    odds: c.odds ? {
      moneyline: {
        home: Number(c.odds?.moneyline?.home) || 0,
        away: Number(c.odds?.moneyline?.away) || 0,
      },
      spread: {
        home: Number(c.odds?.spread?.home) || 0,
        line: Number(c.odds?.spread?.line) || 0,
      },
      total: {
        line: Number(c.odds?.total?.line) || 0,
      },
      impliedProb: {
        homePct: Number(c.odds?.impliedProb?.homePct) || 50,
        awayPct: Number(c.odds?.impliedProb?.awayPct) || 50,
      },
    } : null,
    betSignal: c.betSignal ? {
      signal: sanitizeString(c.betSignal?.signal || '', 50),
      edge: Number(c.betSignal?.edge) || 0,
      confidence: Number(c.betSignal?.confidence) || 0,
      pick: ['home', 'away'].includes(c.betSignal?.pick) ? c.betSignal.pick : 'home',
      reason: sanitizeString(c.betSignal?.reason || '', 500),
    } : null,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const auth = await authenticateUser(req);
    if (!auth) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Rate limiting by user ID
    if (!checkRateLimit(auth.userId)) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const messages = validateMessages(body.messages);
    
    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Invalid request format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const gameContext = body.gameContext ? validateGameContext(body.gameContext) : null;
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("[Internal] LOVABLE_API_KEY not configured");
      return new Response(JSON.stringify({ error: "Service temporarily unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Chat request from user ${auth.userId}: ${messages.length} messages`);

    // Build context-aware system prompt
    let systemPrompt = `You are ThinkBetAI Assistant, an AI helper for the ThinkBetAI sports betting analysis platform. You ONLY answer questions about:

1. Sports betting topics:
   - How odds work (moneylines, spreads, totals)
   - Betting terminology and concepts
   - Bankroll management strategies
   - Understanding value and expected value
   - Line movements and what they indicate

2. ThinkBetAI platform features:
   - How to use the Games page to find matchups
   - Understanding the bet signals and confidence ratings
   - Reading the odds comparison charts
   - Interpreting team stats and recent form
   - Using ThinkBetAI's AI analysis for decision making

IMPORTANT RULES:
- If someone asks about anything NOT related to sports betting or ThinkBetAI, politely decline and redirect them to betting-related topics
- Never provide advice on non-sports topics, personal matters, coding, or general knowledge
- Be concise and helpful
- Always remind users that betting involves risk and to gamble responsibly
- Don't make guarantees about outcomes
- Format responses with bullet points when helpful`;

    // Add game-specific context if provided
    if (gameContext) {
      const ctx = gameContext as any;
      systemPrompt += `

CURRENT GAME CONTEXT:
- Sport: ${ctx.sport}
- Match: ${ctx.homeTeam} vs ${ctx.awayTeam}
- Venue: ${ctx.venue}
- Start Time: ${ctx.startTime}
${ctx.odds ? `
CURRENT ODDS:
- Moneyline: ${ctx.homeTeam} ${ctx.odds.moneyline?.home > 0 ? '+' : ''}${ctx.odds.moneyline?.home} / ${ctx.awayTeam} ${ctx.odds.moneyline?.away > 0 ? '+' : ''}${ctx.odds.moneyline?.away}
- Spread: ${ctx.homeTeam} ${ctx.odds.spread?.home > 0 ? '+' : ''}${ctx.odds.spread?.home} (${ctx.odds.spread?.line})
- Total: O/U ${ctx.odds.total?.line}
- Implied Probability: ${ctx.homeTeam} ${ctx.odds.impliedProb?.homePct?.toFixed(1)}% / ${ctx.awayTeam} ${ctx.odds.impliedProb?.awayPct?.toFixed(1)}%
` : ''}
${ctx.betSignal ? `
BET SIGNAL ANALYSIS:
- Signal: ${ctx.betSignal.signal}
- Edge: ${ctx.betSignal.edge > 0 ? '+' : ''}${ctx.betSignal.edge}%
- Confidence: ${ctx.betSignal.confidence}%
- Recommended Pick: ${ctx.betSignal.pick === 'home' ? ctx.homeTeam : ctx.awayTeam}
- Reason: ${ctx.betSignal.reason}
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
      console.error("[Internal] AI gateway error:", response.status);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Service temporarily busy. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "Service temporarily unavailable." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Streaming response from AI gateway");
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("[Internal] Betting chat error");
    return new Response(JSON.stringify({ error: "Service temporarily unavailable." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});