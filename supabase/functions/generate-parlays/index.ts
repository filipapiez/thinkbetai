import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[generate-parlays] User: ${claimsData.claims.sub}`);

    // Parse request body
    let forceRefresh = false;
    let userSelectedGames: any[] | null = null;
    try {
      const body = await req.json();
      forceRefresh = body?.forceRefresh === true;
      if (Array.isArray(body?.games) && body.games.length > 0) {
        userSelectedGames = body.games;
      }
    } catch { /* no body */ }

    const isCustomSelection = userSelectedGames !== null;

    // Check DB cache first (30 min TTL for suggested parlays) — only for non-custom requests
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const CACHE_KEY = 'suggested-parlays';

    if (!isCustomSelection && !forceRefresh) {
      const { data: cached } = await adminClient
        .from('odds_cache')
        .select('data, expires_at')
        .eq('id', CACHE_KEY)
        .single();

      if (cached && new Date(cached.expires_at) > new Date()) {
        const cachedParlays = Array.isArray(cached.data) ? cached.data : [];
        const hasPlaceholderTeams = cachedParlays.some((parlay: any) =>
          Array.isArray(parlay?.legs) &&
          parlay.legs.some((leg: any) => {
            const home = String(leg?.homeTeam || '').trim().toLowerCase();
            const away = String(leg?.awayTeam || '').trim().toLowerCase();
            return home === 'home' || away === 'away';
          })
        );

        if (!hasPlaceholderTeams) {
          console.log('[generate-parlays] Returning cached parlays');
          return new Response(JSON.stringify({ success: true, parlays: cached.data, source: 'cached' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        console.log('[generate-parlays] Cached parlays had placeholder team names, regenerating');
      }
    } else if (isCustomSelection) {
      console.log(`[generate-parlays] Custom selection of ${userSelectedGames!.length} games, skipping cache`);
    } else {
      console.log('[generate-parlays] Force refresh requested, skipping cache');
    }

    let gamesWithOdds: any[];

    if (isCustomSelection) {
      // Use user-selected games directly — they already have the data we need
      gamesWithOdds = userSelectedGames!;
      console.log(`[generate-parlays] Using ${gamesWithOdds.length} user-selected games`);

      if (gamesWithOdds.length < 2) {
        return new Response(JSON.stringify({ success: true, parlays: [], message: 'Select at least 2 games' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else {
      // Fetch current games from scrape-live-games
      const gamesResponse = await fetch(
        `${Deno.env.get('SUPABASE_URL')}/functions/v1/scrape-live-games`,
        {
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!gamesResponse.ok) {
        console.error('[generate-parlays] Failed to fetch games:', gamesResponse.status);
        return new Response(JSON.stringify({ error: 'Failed to fetch games data' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const gamesData = await gamesResponse.json();
      const games = gamesData?.games || [];

      if (games.length < 3) {
        return new Response(JSON.stringify({ success: true, parlays: [], message: 'Not enough games available' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Filter to games with odds and upcoming status
      gamesWithOdds = games.filter((g: any) => 
        g.hasOdds && g.status === 'scheduled' && g.odds
      ).slice(0, 30);

      if (gamesWithOdds.length < 3) {
        return new Response(JSON.stringify({ success: true, parlays: [], message: 'Not enough games with odds' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const getTeamName = (team: any, fallback: string) => {
      if (!team) return fallback;
      if (typeof team === 'string' && team.trim()) return team.trim();
      if (typeof team?.name === 'string' && team.name.trim()) return team.name.trim();
      if (typeof team?.fullName === 'string' && team.fullName.trim()) return team.fullName.trim();
      if (typeof team?.displayName === 'string' && team.displayName.trim()) return team.displayName.trim();
      return fallback;
    };

    // Build compact game context for AI
    const gameContext = gamesWithOdds.map((g: any, i: number) => {
      const odds = g.odds || {};
      const ml = odds.moneyline || {};
      const spread = odds.spread || {};
      const total = odds.total || {};
      const homeName = getTeamName(g.homeTeam, 'Home');
      const awayName = getTeamName(g.awayTeam, 'Away');
      return `${i + 1}. [${g.sport}] ${homeName} vs ${awayName} | ${new Date(g.startTime).toLocaleDateString()} | ML: ${ml.home || 'N/A'}/${ml.away || 'N/A'} | Spread: ${spread.home || 'N/A'} | O/U: ${total.over || 'N/A'}`;
    }).join('\n');

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const parlayCount = isCustomSelection ? Math.min(4, gamesWithOdds.length) : 20;
    const minLegs = isCustomSelection ? 2 : 2;
    const maxLegs = isCustomSelection ? Math.min(gamesWithOdds.length, 3) : 3;

    const systemPrompt = isCustomSelection
      ? `You are an expert sports betting analyst. The user has selected specific games for their parlay. Generate ${parlayCount} parlay suggestions using ONLY the provided games. Each parlay should have ${minLegs}-${maxLegs} legs.

RULES:
- ONLY use games from the provided list — do NOT add any other games
- Every leg must reference a game the user selected
- Focus on correlated outcomes and value
- Never guarantee wins
- Use the exact team names from the list
- Generate variety: some STRONG, some DECENT, some RISKY
- Include a mix of moneyline, spread, and total picks

OUTPUT FORMAT (JSON array):
[
  {
    "name": "Descriptive parlay name",
    "signal": "STRONG" | "DECENT" | "RISKY",
    "confidence": 50-85,
    "legs": [
      {
        "gameIndex": 1,
        "sport": "NBA",
        "homeTeam": "Full Team Name",
        "awayTeam": "Full Team Name",
        "gameDate": "Mar 5",
        "pick": "home" | "away",
        "pickType": "moneyline" | "spread" | "total",
        "pickDetail": "Team A ML -150" or "Over 215.5",
        "reasoning": "Short reason"
      }
    ],
    "rationale": "Why these legs work together",
    "estimatedOdds": "+250"
  }
]`
      : `You are an expert sports betting analyst. Generate exactly 20 suggested parlay combinations from available games. Each parlay should have 2-3 legs. Mix of 2-leg and 3-leg parlays. You MUST generate 20 parlays, no fewer.

RULES:
- Only suggest games from the provided list
- Focus on correlated outcomes and value
- Never guarantee wins
- Include confidence and reasoning
- Use the exact team names from the list
- Generate a good variety: some STRONG, some DECENT, some RISKY
- Include a mix of moneyline, spread, and total picks
- Each parlay should have a unique theme/angle

OUTPUT FORMAT (JSON array):
[
  {
    "name": "Descriptive parlay name (e.g., 'NBA Favorites Lock')",
    "signal": "STRONG" | "DECENT" | "RISKY",
    "confidence": 50-85,
    "legs": [
      {
        "gameIndex": 1,
        "sport": "NBA",
        "homeTeam": "Team A",
        "awayTeam": "Team B",
        "gameDate": "Mar 5",
        "pick": "home" | "away",
        "pickType": "moneyline" | "spread" | "total",
        "pickDetail": "Team A ML -150" or "Over 215.5",
        "reasoning": "Short reason"
      }
    ],
    "rationale": "Why these legs work together",
    "estimatedOdds": "+250"
  }
]`;

    const userPrompt = isCustomSelection
      ? `The user selected these ${gamesWithOdds.length} games for their parlay:\n\n${gameContext}\n\nGenerate ${parlayCount} smart parlay suggestions using ONLY these games. Always use FULL team names. Return JSON only.`
      : `Here are today's available games with odds:\n\n${gameContext}\n\nGenerate exactly 20 smart parlay suggestions with variety in signal strength and bet types. Always use the FULL team names (e.g. "Los Angeles Lakers" not just "Home"). Return JSON only.`;

    console.log('[generate-parlays] Calling AI...');

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
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[generate-parlays] AI error:', response.status, errorText);
      return new Response(JSON.stringify({ error: 'Failed to generate parlays' }), {
        status: response.status === 429 ? 429 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(JSON.stringify({ error: 'Empty AI response' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let parlays;
    try {
      const clean = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parlays = JSON.parse(clean);
    } catch {
      console.error('[generate-parlays] Parse error:', content);
      return new Response(JSON.stringify({ error: 'Failed to parse AI response' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const isPlaceholderTeam = (value: unknown) => {
      const v = String(value ?? '').trim().toLowerCase();
      return v === '' || v === 'home' || v === 'away';
    };

    const normalizedParlays = Array.isArray(parlays)
      ? parlays.map((parlay: any) => ({
          ...parlay,
          legs: Array.isArray(parlay?.legs)
            ? parlay.legs.map((leg: any) => {
                const gameIdx = Number(leg?.gameIndex);
                const game = Number.isFinite(gameIdx) ? gamesWithOdds[Math.max(0, gameIdx - 1)] : undefined;
                const fallbackHome = getTeamName(game?.homeTeam, leg?.homeTeam || 'Home');
                const fallbackAway = getTeamName(game?.awayTeam, leg?.awayTeam || 'Away');
                const safeHome = isPlaceholderTeam(leg?.homeTeam) ? fallbackHome : leg.homeTeam;
                const safeAway = isPlaceholderTeam(leg?.awayTeam) ? fallbackAway : leg.awayTeam;
                const safePickDetail = typeof leg?.pickDetail === 'string'
                  ? leg.pickDetail
                      .replace(/\bHome\b/g, String(fallbackHome))
                      .replace(/\bAway\b/g, String(fallbackAway))
                  : leg?.pickDetail;

                // Derive gameDate from the source game's startTime if AI didn't include it
                let gameDate = leg?.gameDate || '';
                if (!gameDate && game?.startTime) {
                  gameDate = new Date(game.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }

                return {
                  ...leg,
                  homeTeam: safeHome,
                  awayTeam: safeAway,
                  pickDetail: safePickDetail,
                  gameDate,
                };
              })
            : [],
        }))
      : [];

    // Cache for 30 minutes — only for non-custom selections
    if (!isCustomSelection) {
      await adminClient.from('odds_cache').upsert({
        id: CACHE_KEY,
        data: normalizedParlays,
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    console.log(`[generate-parlays] Generated ${normalizedParlays.length} parlays`);

    return new Response(JSON.stringify({ success: true, parlays: normalizedParlays, source: 'generated' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[generate-parlays] Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
