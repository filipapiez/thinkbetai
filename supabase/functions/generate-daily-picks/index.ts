import "https://deno.land/x/xhr@0.3.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ODDS_API_KEY = Deno.env.get("THE_ODDS_API_KEY") || Deno.env.get("ODDS_API_KEY");

async function fetchTodaysOdds(): Promise<any[]> {
  if (!ODDS_API_KEY) return [];

  const sports = [
    "basketball_nba",
    "americanfootball_nfl",
    "baseball_mlb",
    "icehockey_nhl",
  ];

  const allGames: any[] = [];

  for (const sport of sports) {
    try {
      const res = await fetch(
        `https://api.the-odds-api.com/v4/sports/${sport}/odds/?apiKey=${ODDS_API_KEY}&regions=us&markets=h2h,spreads,totals&oddsFormat=american&dateFormat=iso`,
      );
      if (res.ok) {
        const data = await res.json();
        const today = new Date().toISOString().split("T")[0];
        const todayGames = data.filter((g: any) => g.commence_time?.startsWith(today));
        allGames.push(...todayGames.slice(0, 4));
      }
    } catch (e) {
      console.error(`Error fetching ${sport}:`, e);
    }
  }

  return allGames;
}

async function fetchInjuries(): Promise<string> {
  const sportPaths = [
    "basketball/nba",
    "football/nfl",
    "baseball/mlb",
    "hockey/nhl",
  ];
  const injuries: string[] = [];

  for (const path of sportPaths) {
    try {
      const res = await fetch(
        `https://site.api.espn.com/apis/site/v2/sports/${path}/injuries`,
      );
      if (res.ok) {
        const data = await res.json();
        for (const team of data?.items || []) {
          const teamName = team?.team?.displayName || "Unknown";
          for (const athlete of (team?.injuries || []).slice(0, 5)) {
            const name = athlete?.athlete?.displayName;
            const status = athlete?.status;
            if (name && status) {
              injuries.push(`${name} (${teamName}) — ${status}`);
            }
          }
        }
      }
    } catch (e) {
      // skip
    }
  }

  return injuries.slice(0, 40).join("\n") || "No injury data available.";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const [odds, injuryReport] = await Promise.all([
      fetchTodaysOdds(),
      fetchInjuries(),
    ]);

    const oddsContext = odds
      .map((g) => {
        const bookmaker = g.bookmakers?.[0];
        const h2h = bookmaker?.markets?.find((m: any) => m.key === "h2h");
        const spreads = bookmaker?.markets?.find((m: any) => m.key === "spreads");
        const totals = bookmaker?.markets?.find((m: any) => m.key === "totals");
        return `${g.away_team} @ ${g.home_team} (${g.sport_title}, ${g.commence_time})
  Moneyline: ${h2h?.outcomes?.map((o: any) => `${o.name} ${o.price > 0 ? "+" : ""}${o.price}`).join(" / ") || "N/A"}
  Spread: ${spreads?.outcomes?.map((o: any) => `${o.name} ${o.point > 0 ? "+" : ""}${o.point} (${o.price > 0 ? "+" : ""}${o.price})`).join(" / ") || "N/A"}
  Total: ${totals?.outcomes?.map((o: any) => `${o.name} ${o.point} (${o.price > 0 ? "+" : ""}${o.price})`).join(" / ") || "N/A"}`;
      })
      .join("\n\n");

    const prompt = `You are an expert sports analyst. Based on the following real-time odds and injury data for today's games, generate your TOP recommended picks — focusing on the EASIEST TO WIN picks with the HIGHEST probability of hitting.

## TODAY'S ODDS:
${oddsContext || "No games available today."}

## INJURY REPORT:
${injuryReport}

## INSTRUCTIONS:
Generate a single list of 8-12 of the BEST, HIGHEST PROBABILITY picks across all categories (moneyline, spread, player props, over/under). Prioritize picks that are MOST LIKELY TO WIN. Return valid JSON only, no markdown.

For each pick include:
- id: unique string
- sport: sport key (NBA, NFL, MLB, NHL)
- sportLabel: display label
- homeTeam, awayTeam
- gameTime: ISO string
- pick: short pick text (e.g. "Lakers ML", "LeBron Over 25.5 Pts", "Over 215.5")
- pickDetail: one-line context (e.g. "Lakers are 8-2 in last 10 home games")
- confidence: 60-95 (be accurate — only give 85+ to truly dominant picks)
- reasoning: 2-3 sentence analysis

CRITICAL RULES:
- Only use teams and games from the odds data provided above
- Factor in injuries when making picks
- Do NOT invent games or players not in the data
- If no games are available, return empty arrays
- Sort picks by confidence descending — easiest wins first
- Include a mix: some moneyline, some spreads, some totals, some props

Return JSON in this exact format:
{
  "games": [...all picks in one array sorted by confidence...]
}`;


    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const aiRes = await fetch(`${supabaseUrl}/functions/v1/proxy/ai/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are a sports betting analyst. Return only valid JSON. No markdown, no code blocks.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 3000,
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      throw new Error(`AI API error: ${aiRes.status} - ${errText}`);
    }

    const aiData = await aiRes.json();
    const content = aiData.choices?.[0]?.message?.content || "{}";

    const cleaned = content
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    const picks = JSON.parse(cleaned);

    const response = {
      games: picks.games || [],
      generatedAt: new Date().toISOString(),
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating daily picks:", error);
    return new Response(
      JSON.stringify({
        games: [],
        props: [],
        overUnder: [],
        generatedAt: new Date().toISOString(),
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  }
});
