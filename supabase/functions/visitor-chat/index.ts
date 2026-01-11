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

    const systemPrompt = `You are a friendly and helpful assistant for BetEdge AI, a sports betting analytics platform. Your role is to:

1. Answer questions about the platform's features:
   - AI-powered picks for NFL, NBA, UFC, MLB, NHL, and 15+ sports
   - Parlay builder with calculated odds
   - Real-time injury reports
   - Risk analysis and confidence scores
   - Live game updates and line movements

2. Explain how the service works:
   - Our AI analyzes 10,000+ data points per game
   - We provide moneyline, spread, and prop picks
   - Qualified picks have a 67%+ win rate
   - Users can access picks, build parlays, and get AI analysis

3. Help potential users understand the value:
   - Save time on research
   - Get data-driven insights
   - Avoid common betting mistakes
   - Track performance and improve

4. Guide users to take action:
   - Encourage them to sign up for free to see today's picks
   - Mention the money-back guarantee
   - Highlight the free trial if they're hesitant

Keep responses concise (2-3 sentences max), friendly, and helpful. Don't make specific betting predictions or guarantee wins. If asked about odds or specific games, suggest they sign up to see live analysis.

Do NOT discuss topics unrelated to sports betting or the platform. Politely redirect off-topic questions.`;

    // Build messages array with history
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-6).map((msg: { role: string; content: string }) => ({
        role: msg.role,
        content: msg.content.substring(0, 300) // Limit history message length
      })),
      { role: 'user', content: message }
    ];

    const response = await fetch('https://ai.gateway.lovable.dev/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-5-nano',
        messages,
        max_completion_tokens: 200,
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
