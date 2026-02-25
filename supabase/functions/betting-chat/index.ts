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

  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    console.log('Auth error:', error?.message);
    return null;
  }

  return { userId: user.id };
}

// Input validation
const MAX_USER_MESSAGE_LENGTH = 2000;
const MAX_ASSISTANT_MESSAGE_LENGTH = 10000;
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
    const maxLen = role === 'user' ? MAX_USER_MESSAGE_LENGTH : MAX_ASSISTANT_MESSAGE_LENGTH;
    if (typeof content !== 'string' || content.length > maxLen) return null;
    
    validated.push({ role, content: sanitizeString(content, maxLen) });
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

// Fetch live sports data from The Odds API (same source as Games page)
async function fetchLiveOddsData(searchTerms: string[]): Promise<string | null> {
  const oddsApiKey = Deno.env.get('THE_ODDS_API_KEY');
  if (!oddsApiKey) {
    console.log('No Odds API key configured');
    return null;
  }

  const timestamp = new Date().toISOString();
  const sportKeys = [
    'basketball_nba', 'football_nfl', 'icehockey_nhl', 'baseball_mlb',
    'mma_mixed_martial_arts', 'soccer_epl', 'soccer_usa_mls',
  ];

  try {
    let allEvents: any[] = [];

    // Fetch from The Odds API in parallel (scores + odds)
    const fetches = sportKeys.map(async (sport) => {
      try {
        // Fetch scores (includes live scores) and odds together
        const [scoresRes, oddsRes] = await Promise.all([
          fetch(`https://api.the-odds-api.com/v4/sports/${sport}/scores/?apiKey=${oddsApiKey}&daysFrom=1`),
          fetch(`https://api.the-odds-api.com/v4/sports/${sport}/odds/?apiKey=${oddsApiKey}&regions=us&markets=h2h,spreads,totals&oddsFormat=american`),
        ]);

        const scores = scoresRes.ok ? await scoresRes.json() : [];
        const odds = oddsRes.ok ? await oddsRes.json() : [];

        // Merge scores into odds data
        const oddsMap = new Map(odds.map((o: any) => [o.id, o]));
        for (const s of scores) {
          if (oddsMap.has(s.id)) {
            (oddsMap.get(s.id) as any).scores = s.scores;
            (oddsMap.get(s.id) as any).completed = s.completed;
          } else {
            oddsMap.set(s.id, s);
          }
        }

        return Array.from(oddsMap.values()).map((e: any) => ({ ...e, sportKey: sport }));
      } catch (e) {
        console.log(`Error fetching ${sport}:`, e);
        return [];
      }
    });

    const results = await Promise.all(fetches);
    allEvents = results.flat().filter((e: any) => !e.completed);

    // Search for matching teams
    const searchLower = searchTerms.map(t => t.toLowerCase());
    const relevantEvents = searchLower.length > 0
      ? allEvents.filter(event => {
          const home = (event.home_team || '').toLowerCase();
          const away = (event.away_team || '').toLowerCase();
          return searchLower.some(term => home.includes(term) || away.includes(term));
        })
      : allEvents;

    const eventsToShow = (relevantEvents.length > 0 ? relevantEvents : allEvents).slice(0, 8);

    if (eventsToShow.length === 0) return null;

    const gameInfos = eventsToShow.map((e: any) => {
      const home = e.home_team || 'TBD';
      const away = e.away_team || 'TBD';
      const startTime = e.commence_time;
      const isLive = e.scores && !e.completed;

      let info = `**${away} @ ${home}**\n`;
      info += `• Sport: ${e.sport_title || e.sportKey}\n`;

      if (isLive && e.scores) {
        const homeScore = e.scores.find((s: any) => s.name === home)?.score || '0';
        const awayScore = e.scores.find((s: any) => s.name === away)?.score || '0';
        info += `• 🔴 LIVE: ${away} ${awayScore} - ${home} ${homeScore}\n`;
      } else {
        info += `• Game Time: ${startTime ? new Date(startTime).toLocaleString() : 'TBD'}\n`;
      }

      // Extract best odds from bookmakers
      if (e.bookmakers && e.bookmakers.length > 0) {
        const book = e.bookmakers[0]; // Use first (usually DraftKings/FanDuel)
        const bookName = book.title || 'Sportsbook';

        const h2h = book.markets?.find((m: any) => m.key === 'h2h');
        if (h2h) {
          const homeOdds = h2h.outcomes?.find((o: any) => o.name === home)?.price;
          const awayOdds = h2h.outcomes?.find((o: any) => o.name === away)?.price;
          if (homeOdds != null && awayOdds != null) {
            info += `• Moneyline (${bookName}): ${home} ${homeOdds > 0 ? '+' : ''}${homeOdds} / ${away} ${awayOdds > 0 ? '+' : ''}${awayOdds}\n`;
          }
        }

        const spreads = book.markets?.find((m: any) => m.key === 'spreads');
        if (spreads) {
          const homeSpread = spreads.outcomes?.find((o: any) => o.name === home);
          if (homeSpread) {
            info += `• Spread: ${home} ${homeSpread.point > 0 ? '+' : ''}${homeSpread.point} (${homeSpread.price > 0 ? '+' : ''}${homeSpread.price})\n`;
          }
        }

        const totals = book.markets?.find((m: any) => m.key === 'totals');
        if (totals) {
          const over = totals.outcomes?.find((o: any) => o.name === 'Over');
          const under = totals.outcomes?.find((o: any) => o.name === 'Under');
          if (over) {
            info += `• Total: O/U ${over.point} (Over ${over.price > 0 ? '+' : ''}${over.price} / Under ${under?.price > 0 ? '+' : ''}${under?.price})\n`;
          }
        }
      }

      return info;
    }).join('\n---\n');

    return `**📊 Live Data Feed** (The Odds API - ${timestamp})\n\n${gameInfos}\n\n⚠️ Odds and scores update in real-time. Lines may shift before game time.`;
  } catch (error) {
    console.error('Error fetching live odds data:', error);
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

    // Always fetch live data to give the AI real-time context
    const latestUserMessage = [...messages].reverse().find(m => m.role === 'user');
    let liveDataContext = '';
    
    if (latestUserMessage) {
      const dataQuery = detectSportsDataQuery(latestUserMessage.content);
      // Fetch live data for any question — always give the AI fresh odds/scores
      const liveData = await fetchLiveOddsData(dataQuery.searchTerms);
      if (liveData) {
        liveDataContext = `\n\nLIVE SPORTS DATA (from licensed API — use this for your analysis):\n${liveData}`;
      }
    }

    // Build context-aware system prompt
    let systemPrompt = `You are ThinkBetAI Assistant, a decision-support betting analyst. You provide clean, visual, easy-to-read analysis that makes the user feel like a pro.

## RESPONSE FORMAT — REQUIRED for any game/total/spread/prop question:

Use this EXACT visual layout. It must be scannable at a glance:

---

🏀 **Today's Top [Bet Type]: [Away Team] vs. [Home Team]**

**The Pick: [PICK DIRECTION] [LINE]**

| Stat | Rating | What it means |
| :--- | :--- | :--- |
| Confidence | X% | [One sentence — use the scale below] |
| Probability | X% | [One sentence — the math explanation] |
| Edge | +X% | [One sentence — why they're getting a deal] |

### 🟢 Why we like it (The Simple Version)

Use 2-3 bullet points with **bold labels** and plain-language explanations. No jargon. Write like you're explaining to a smart friend, not a quant.

Example style:
- **The "Harden" Effect:** Cleveland just added James Harden. The public thinks they will score 130 points, but they are actually playing slower to get him integrated.
- **Knicks Defense:** New York is the "slowest" team in the league. They force you into a boring, half-court game.
- **The Math:** 89% of regular bettors are taking the Over, which usually means the Under is the smarter, professional play.

### ⚠️ What could go wrong?

One short paragraph describing the specific scenario that would bust this pick. Be honest and specific — name players, stat thresholds, or game flow changes.

### 📈 Pro Tip

One sentence about line movement impact (e.g., "If the line moves down to 44.0, our confidence drops to 54%. Try to get it at 45.5 or higher.")

---

## CONFIDENCE SCALE — Always pair % with rating:

| Confidence % | Rating | Recommendation |
|---|---|---|
| 51% – 55% | Slight Edge | Small "fun" bet only |
| 56% – 64% | Strong Value | A solid standard play |
| 65%+ | Elite Edge | Best for "unit" plays |

## CONFIDENCE vs. PROBABILITY — REQUIRED distinction:

Always separate these two concepts in the stat table:
- **Probability** = The raw chance of the outcome happening
- **Confidence** = The value of the BET given the odds/juice

Example: A team has 75% probability to win (high), but confidence is only 52% (Slight Edge) because at -400 odds, you're risking $400 to win $100.

## SIMULATION FRAMING — Use in the confidence row:

Frame confidence as: "Our strongest play of the night" or "Our model simulated this 1,000 times and X hit Y times."

## RESPONSIBLE GAMBLING NOTE — REQUIRED when confidence ≥ 60%:

> ⚠️ **Note:** Even at X% confidence, there is a Y% chance this doesn't hit. Always manage your bankroll.

## TONE RULES:
- Write in plain English. Explain concepts in "simple version" style
- Use quotes around slang/concepts the user might not know (e.g., the "slowest" team)
- Bold key names, numbers, and directions
- Be conversational but authoritative — like a sharp friend who does this for a living
- Get straight to the point — no filler, no "Great question!"
- BANNED: lock, guaranteed, must hit, sure thing, can't lose, slam dunk, no-brainer, easy money, free money

## WHEN USER ASKS "what's good today" or "best bet today":
Pick the SINGLE strongest play across all available games. Use the full format above. If no game context is provided, use your knowledge of current matchups, trends, and lines.

## WHEN USER ASKS ABOUT MULTIPLE GAMES:
Provide the full format for each game, separated by horizontal rules (---).

## RULES:
- For simple questions (non-game): 2-4 sentences max
- For game/prop analysis: use the structured visual format above
- ONLY discuss sports betting topics; redirect off-topic questions
- Never guarantee wins — betting involves risk
- Focus on the "why" — not just restating odds
- Use sport-appropriate emoji in the header (🏀🏈⚾🏒🥊⚽🎾)

## EXPERTISE:
Moneylines, spreads, totals, props, parlays (same-game & cross-sport), bankroll management, line movement, +EV betting, all major sports (NFL, NBA, MLB, NHL, UFC, soccer, tennis).${liveDataContext}`;

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
