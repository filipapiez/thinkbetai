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

// Detect if user is asking about player/game availability, injuries, or live info
function detectSportsDataQuery(message: string): { isDataQuery: boolean; queryType: string; searchTerms: string[] } {
  const lowerMsg = message.toLowerCase();
  
  // Player availability patterns
  const playingPatterns = [
    /is\s+([a-z\s]+)\s+playing/i,
    /will\s+([a-z\s]+)\s+play/i,
    /([a-z\s]+)\s+playing\s+today/i,
    /([a-z\s]+)\s+status/i,
    /([a-z\s]+)\s+injury/i,
    /([a-z\s]+)\s+injured/i,
    /([a-z\s]+)\s+out/i,
    /([a-z\s]+)\s+lineup/i,
  ];
  
  // Injury-related keywords
  const injuryKeywords = ['injury', 'injured', 'hurt', 'questionable', 'doubtful', 'probable', 'out', 'gtd', 'day-to-day'];
  
  // Game schedule keywords
  const scheduleKeywords = ['playing today', 'game today', 'games today', 'schedule', 'when do', 'what time', 'start time'];
  
  // Odds/lines keywords
  const oddsKeywords = ['odds', 'spread', 'moneyline', 'over under', 'total', 'line'];
  
  const searchTerms: string[] = [];
  
  // Check for player name patterns
  for (const pattern of playingPatterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      searchTerms.push(match[1].trim());
    }
  }
  
  // Check query type
  let queryType = 'general';
  if (injuryKeywords.some(k => lowerMsg.includes(k))) {
    queryType = 'injury';
  } else if (scheduleKeywords.some(k => lowerMsg.includes(k))) {
    queryType = 'schedule';
  } else if (oddsKeywords.some(k => lowerMsg.includes(k))) {
    queryType = 'odds';
  } else if (searchTerms.length > 0) {
    queryType = 'player_status';
  }
  
  const isDataQuery = queryType !== 'general' || searchTerms.length > 0;
  
  return { isDataQuery, queryType, searchTerms };
}

// Fetch sports data from The Odds API / SportsGameOdds
async function fetchSportsData(queryType: string, searchTerms: string[]): Promise<string | null> {
  const apiKey = Deno.env.get('SPORTSGAMEODDS_API_KEY');
  if (!apiKey) {
    console.log('No SportsGameOdds API key configured');
    return null;
  }
  
  const timestamp = new Date().toISOString();
  
  try {
    // Fetch upcoming events to find relevant games
    const sports = ['basketball_nba', 'football_nfl', 'hockey_nhl', 'baseball_mlb'];
    let allEvents: any[] = [];
    
    for (const sport of sports) {
      try {
        const response = await fetch(
          `https://api.sportsgameodds.com/v2/events?sportID=${sport}&status=upcoming,live&limit=20`,
          {
            headers: {
              'X-API-Key': apiKey,
            },
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.data) {
            allEvents = [...allEvents, ...data.data];
          }
        }
      } catch (e) {
        console.log(`Error fetching ${sport}:`, e);
      }
    }
    
    // Search for matching players/teams in events
    const searchLower = searchTerms.map(t => t.toLowerCase());
    const relevantEvents = allEvents.filter(event => {
      const homeTeam = (event.homeTeam?.name || event.teams?.home?.name || '').toLowerCase();
      const awayTeam = (event.awayTeam?.name || event.teams?.away?.name || '').toLowerCase();
      const allText = `${homeTeam} ${awayTeam}`.toLowerCase();
      
      return searchLower.some(term => allText.includes(term));
    });
    
    if (relevantEvents.length === 0 && allEvents.length > 0) {
      // Return general upcoming games info
      const upcomingGames = allEvents.slice(0, 5).map(e => {
        const home = e.homeTeam?.name || e.teams?.home?.name || 'TBD';
        const away = e.awayTeam?.name || e.teams?.away?.name || 'TBD';
        const startTime = e.startTime || e.commence_time || 'TBD';
        return `• ${away} @ ${home} - ${new Date(startTime).toLocaleString()}`;
      }).join('\n');
      
      return `**Upcoming Games** (SportsGameOdds API - ${timestamp})\n${upcomingGames}\n\n⚠️ Status can change close to game time.`;
    }
    
    if (relevantEvents.length > 0) {
      const gameInfos = relevantEvents.slice(0, 3).map(e => {
        const home = e.homeTeam?.name || e.teams?.home?.name || 'TBD';
        const away = e.awayTeam?.name || e.teams?.away?.name || 'TBD';
        const startTime = e.startTime || e.commence_time;
        const status = e.status || 'scheduled';
        const odds = e.odds || {};
        
        let info = `**${away} @ ${home}**\n`;
        info += `• Status: ${status.charAt(0).toUpperCase() + status.slice(1)}\n`;
        info += `• Game Time: ${startTime ? new Date(startTime).toLocaleString() : 'TBD'}\n`;
        
        if (odds.moneyline) {
          info += `• Moneyline: ${home} ${odds.moneyline.home > 0 ? '+' : ''}${odds.moneyline.home} / ${away} ${odds.moneyline.away > 0 ? '+' : ''}${odds.moneyline.away}\n`;
        }
        
        return info;
      }).join('\n');
      
      return `**Game Information** (SportsGameOdds API - ${timestamp})\n\n${gameInfos}\n\n⚠️ Status can change close to game time. Check official sources for final lineups.`;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching sports data:', error);
    return null;
  }
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

    // Check if the latest user message is asking for live sports data
    const latestUserMessage = [...messages].reverse().find(m => m.role === 'user');
    let liveDataContext = '';
    
    if (latestUserMessage) {
      const dataQuery = detectSportsDataQuery(latestUserMessage.content);
      
      if (dataQuery.isDataQuery) {
        console.log(`Detected sports data query: ${dataQuery.queryType}, terms: ${dataQuery.searchTerms.join(', ')}`);
        
        const sportsData = await fetchSportsData(dataQuery.queryType, dataQuery.searchTerms);
        if (sportsData) {
          liveDataContext = `\n\nLIVE SPORTS DATA (from licensed API):\n${sportsData}`;
        }
      }
    }

    // Build context-aware system prompt
    let systemPrompt = `You are ThinkBetAI Assistant, an expert sports betting and parlay analyst powered by Gemini AI. You specialize in:

## CORE EXPERTISE - Betting & Parlays:

1. **Single Bets Analysis:**
   - Moneyline picks with reasoning
   - Spread betting strategies
   - Over/Under totals analysis
   - Player props evaluation
   - First half/quarter bets

2. **Parlay Building & Strategy:**
   - How to construct winning parlays
   - Correlation strategies (same-game parlays)
   - Risk vs reward calculations
   - Optimal leg counts (2-4 leg parlays vs larger)
   - Round robin and teaser strategies
   - When to hedge parlays

3. **Odds & Value Analysis:**
   - Reading and comparing odds across books
   - Finding +EV (positive expected value) bets
   - Line movement interpretation
   - Public vs sharp money indicators
   - Implied probability calculations

4. **Bankroll Management:**
   - Unit sizing for singles vs parlays
   - Proper staking strategies
   - When to chase and when to walk away
   - Long-term profitability mindset

5. **Sport-Specific Insights:**
   - NFL/College Football betting trends
   - NBA/College Basketball totals and props
   - MLB run lines and first 5 innings
   - NHL puck lines and totals
   - UFC/MMA fight props
   - Soccer betting (spreads, draws, goals)

## RESPONSE STYLE:
- Be conversational and engaging like a betting buddy
- Give specific recommendations when asked
- Explain your reasoning with stats/logic
- Use emojis sparingly for emphasis 🎯💰🔥
- Format with bullet points and bold text for readability

## IMPORTANT RULES:
- ONLY discuss sports betting, parlays, and gambling strategies
- Politely redirect off-topic questions back to betting
- Include responsible gambling reminders when appropriate
- Never guarantee wins - betting always involves risk
- Be honest about uncertainty${liveDataContext}`;

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
        model: "google/gemini-3-flash-preview",
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
