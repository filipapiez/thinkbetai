import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting for visitors (by IP)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // requests per minute
const RATE_WINDOW = 60000; // 1 minute

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);
  
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }
  
  if (entry.count >= RATE_LIMIT) {
    return false;
  }
  
  entry.count++;
  return true;
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 60000);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client IP for rate limiting
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown';
    
    if (!checkRateLimit(clientIP)) {
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please wait a moment.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { message, history = [] } = await req.json();
    
    if (!message || typeof message !== 'string' || message.length > 500) {
      return new Response(
        JSON.stringify({ error: 'Invalid message' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

const systemPrompt = `You are ThinkBetAI Assistant, a friendly and knowledgeable helper for the ThinkBetAI sports betting analytics platform.

## ABOUT THINKBETAI:
ThinkBetAI is an AI-powered sports betting analytics platform that helps bettors make smarter decisions.

## PLATFORM FEATURES:
- **AI Picks:** Data-driven picks for NFL, NBA, UFC, MLB, NHL, and 15+ sports
- **Parlay Builder:** Build and analyze multi-leg parlays with calculated odds
- **Ask AI (Chat):** Get personalized betting advice and parlay recommendations
- **Games Page:** Browse upcoming matchups with AI confidence ratings
- **Live Data:** Real-time injury reports, line movements, and odds comparison
- **Performance Tracking:** Track your betting history and win rates

## HOW IT WORKS:
1. Sign up for free to access today's picks
2. Browse games and see AI-analyzed picks with confidence scores
3. Use Ask AI to get personalized betting advice
4. Build parlays and track your performance

## KEY VALUE PROPS:
- AI analyzes thousands of data points per game
- Qualified picks have a 67%+ historical win rate
- Save hours of research with instant insights
- Money-back guarantee for premium subscribers

## RESPONSE GUIDELINES:
- Be conversational and helpful
- Answer questions about the website features and how to use them
- Encourage signing up to see live picks and analysis
- Keep responses concise but informative (2-4 sentences)
- If asked about specific bets or games, suggest using the Ask AI feature after signing up

## RULES:
- ONLY discuss ThinkBetAI and sports betting topics
- Politely redirect off-topic questions
- Never guarantee wins - betting involves risk
- Remind users to gamble responsibly when appropriate`;

    // Build messages array with history
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-6).map((msg: { role: string; content: string }) => ({
        role: msg.role,
        content: msg.content.substring(0, 300) // Limit history message length
      })),
      { role: 'user', content: message }
    ];

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages,
        max_tokens: 300,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', errorText);
      throw new Error('Failed to get AI response');
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "I'm here to help! Ask me about our sports betting analytics or how to get started.";

    return new Response(
      JSON.stringify({ reply }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Visitor chat error:', error);
    return new Response(
      JSON.stringify({ error: 'Something went wrong. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
