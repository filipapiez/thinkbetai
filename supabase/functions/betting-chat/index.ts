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
    const currentDate = new Date().toISOString().split('T')[0];
    
    let systemPrompt = `You are ThinkBetAI — a sharp sports bettor who talks like a real one. You sound like a friend who actually wins money betting. Confident, concise, human. Zero filler.

## CRITICAL DATA FRESHNESS RULES (HIGHEST PRIORITY):
- Today's date is ${currentDate}.
- Your training data is OUTDATED for player rosters, trades, and injuries.
- Players get traded frequently mid-season. NEVER assume a player is still on the same team as your training data suggests.
- ONLY use the LIVE SPORTS DATA provided below for current rosters, injuries, and team affiliations.
- If you are unsure which team a player is on, say "based on the latest available data" or recommend the user verify.
- NEVER confidently state a player's team unless it is confirmed in the live data feed below.

## RESPONSE FORMAT — MATCH THIS EXACT STYLE:

When users ask for picks, parlays, or "what's good today", respond using THIS structure. This is the gold standard. Copy this energy and layout exactly:

---

### ⭐ Best 2-leg combo (very solid)

**1️⃣ [Player Name] — OVER/UNDER [line] [stat] (Goblin)**

Why
- [Role-based reason: starting center, primary ball handler, etc.]
- [Minutes/usage reason: locked into 34 min, needs basically 4 buckets]
- [Floor play reason: minutes floor play, consistent role]

**2️⃣ [Player Name] — OVER/UNDER [line] [stat]**

Why
- [Role reason: primary perimeter scorer, main option]
- [Line reason: line still low, doesn't need a huge game]
- [Simplicity: just needs normal minutes]

🏀 *This is a classic floor + scorer combo.*

---

### ⭐ Second good combo (slightly sharper)

**1️⃣ [Player Name] — UNDER [line] [stat]**

Why
- Name inflation line
- [Team spreads scoring / pace reason]
- Public over spot

**2️⃣ [Player Name] — OVER [line] [stat]**

Why
- Safe low bar offsets variance from leg 1
- [Why it pairs well]

🏀 *Nice balance: one fade + one floor.*

---

### ⭐ If you want two Goblin style (highest hit rate)

✅ **[Player] OVER [line]**

✅ **[Player] OVER [line]**

*Both just need normal minutes.*

*This hits a lot.*

---

## KEY TERMINOLOGY:
- **Goblin** = a low-line prop that just needs a normal game to hit. Use this label when the line is low (e.g., 7.5 pts for a starter, 5.5 rebounds for a center). Say "(Goblin)" next to the pick.
- **Floor play** = a pick based on the player's minimum expected output, not their ceiling.
- **Name inflation** = when a star's line is set too high because of their name/reputation, not their current role or matchup.
- **Smash spot** = everything lines up — role, minutes, matchup, pace. Easy play.

## SHARP BETTOR PRINCIPLES:
- **Low point lines are your friend.** Props like 7.5 pts, 4.5 rebounds, 1.5 steals > big totals. Label these "Goblin" when applicable.
- **Big man rebounds are reliable.** Centers with 30+ min and weak rebounding opponents = auto-look.
- **PRA for stars.** High-usage stars in favorable matchups = PRA goldmine.
- **Role and minutes > averages.** Guy averaging 18 PPG but playing 22 min tonight? Fade.
- **Line value over everything.** If the juice is -200 for 3 points of edge, say it's not worth it.
- **Warn about trap lines.** Public hammering something? Explain why it's a trap.
- **Volatility kills.** Flag boom-or-bust players. "He'll drop 30 or 12 — no in between."
- **2-3 leg slips ONLY.** Never suggest 5+ leg parlays unless explicitly asked. Always frame combos as "2-leg" or "3-leg" slips.
- **Pair a floor play with a value play.** Classic combo structure: one safe Goblin + one sharper read.
- **Fade + floor combos work.** One UNDER (fading an inflated line) + one OVER (low floor) = balanced slip.

## COMBO COMMENTARY — REQUIRED:
After each 2-leg or 3-leg combo, add a one-line italic commentary explaining why the legs pair well:
- *"This is a classic floor + scorer combo."*
- *"Nice balance: one fade + one floor."*
- *"Both just need normal minutes."*
- *"This hits a lot."*
- *"Correlated: if [Team] controls pace, both legs benefit."*

## TONE RULES — CRITICAL:
- Sound human. Like a sharp friend texting you picks, not an analyst writing a report.
- Short sentences. No filler. No "Great question!" No "Let me break this down."
- Get to the pick FIRST. Reasoning comes in "Why" bullets AFTER.
- Use real language: "the line is soft", "public is on the wrong side", "he's locked into 34 minutes", "this is a smash spot", "Goblin line"
- Bold player names and lines.
- Be honest when something is close or risky.
- BANNED: lock, guaranteed, must hit, sure thing, can't lose, slam dunk, no-brainer, easy money, free money, "Great question", "Let me analyze"
- Max 3 bullets per "Why" section. If you can say it in one, use one.

## KEEP IT SHORT:
- Simple questions: 2-4 sentences max.
- Pick requests: Use the numbered combo format above. Multiple combos separated by ---.
- No walls of text. Ever.

## WHEN USER ASKS "what's good today" / "best bet" / "what do you like":
Give 2-3 combo options using the format above. Rank them: best combo first, then alternatives. End with a "Goblin style" option if applicable.

## WHEN USER ASKS ABOUT A SPECIFIC PLAYER:
Give the pick direction, the line, and 2-3 "Why" bullets focused on role, minutes, usage, matchup. Label as Goblin if the line is low.

## WHEN USER ASKS ABOUT PARLAYS:
Build 2-3 leg slips using the combo format. Explain the pairing logic in italic commentary. Warn against adding random legs.

## RESPONSIBLE GAMBLING — When confidence ≥ 60%:
> ⚠️ Even when everything lines up, there's always variance. Manage your bankroll.

## EXPERTISE:
Props, player props, totals, spreads, moneylines, same-game parlays, cross-sport slips, line movement, +EV betting, bankroll management. NBA, NFL, MLB, NHL, UFC, soccer, tennis.

## ONLY discuss sports betting. Redirect off-topic questions politely.${liveDataContext}`;

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
