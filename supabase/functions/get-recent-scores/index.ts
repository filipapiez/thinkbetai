import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const espnSportMap: Record<string, { sport: string; league: string }> = {
  nba: { sport: "basketball", league: "nba" },
  nfl: { sport: "football", league: "nfl" },
  mlb: { sport: "baseball", league: "mlb" },
  nhl: { sport: "hockey", league: "nhl" },
  ncaab: { sport: "basketball", league: "mens-college-basketball" },
  ncaaf: { sport: "football", league: "college-football" },
};

interface RecentGame {
  opponent: string;
  score: number;
  opponentScore: number;
  totalPoints: number;
  won: boolean;
  date: string;
}

async function getEspnTeams(sport: string, league: string): Promise<Map<string, string>> {
  const url = `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/teams?limit=100`;
  const res = await fetch(url);
  if (!res.ok) {
    await res.text();
    return new Map();
  }
  const data = await res.json();
  const map = new Map<string, string>();
  for (const entry of data.sports?.[0]?.leagues?.[0]?.teams || []) {
    const team = entry.team;
    if (team?.displayName && team?.id) {
      map.set(team.displayName.toLowerCase(), team.id);
    }
  }
  return map;
}

async function getTeamRecentGames(
  sport: string,
  league: string,
  teamId: string,
  limit: number = 5
): Promise<RecentGame[]> {
  try {
    const url = `https://site.api.espn.com/apis/site/v2/sports/${sport}/${league}/teams/${teamId}/schedule`;
    const res = await fetch(url);
    if (!res.ok) {
      await res.text();
      return [];
    }
    const data = await res.json();
    const events = data.events || [];

    const completed: RecentGame[] = [];
    for (const event of events.reverse()) {
      if (completed.length >= limit) break;

      const competition = event.competitions?.[0];
      if (!competition || competition.status?.type?.name !== "STATUS_FINAL") continue;

      const competitors = competition.competitors || [];
      const teamComp = competitors.find((c: any) => c.id === teamId);
      const oppComp = competitors.find((c: any) => c.id !== teamId);

      if (!teamComp || !oppComp) continue;

      const teamScore = parseInt(teamComp.score?.value || teamComp.score || "0");
      const oppScore = parseInt(oppComp.score?.value || oppComp.score || "0");

      completed.push({
        opponent: oppComp.team?.displayName || "Unknown",
        score: teamScore,
        opponentScore: oppScore,
        totalPoints: teamScore + oppScore,
        won: teamComp.winner === true || teamScore > oppScore,
        date: event.date,
      });
    }

    return completed;
  } catch (e) {
    console.error(`Error fetching schedule for team ${teamId}:`, e);
    return [];
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { teamNames, sport } = await req.json() as { teamNames: string[]; sport: string };

    const espnConfig = espnSportMap[sport];
    if (!espnConfig) {
      return new Response(JSON.stringify({ scores: {} }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get ESPN team ID mapping
    const teamIdMap = await getEspnTeams(espnConfig.sport, espnConfig.league);

    // Deduplicate team names
    const uniqueTeams = [...new Set(teamNames.map(n => n.toLowerCase()))];

    // Fetch recent games for each team in parallel (max 10 concurrent)
    const results: Record<string, RecentGame[]> = {};
    const batch = uniqueTeams.slice(0, 20); // Cap at 20 teams

    await Promise.all(
      batch.map(async (teamName) => {
        const espnId = teamIdMap.get(teamName);
        if (!espnId) {
          console.log(`[recent-scores] No ESPN ID for: ${teamName}`);
          return;
        }
        const games = await getTeamRecentGames(espnConfig.sport, espnConfig.league, espnId, 5);
        results[teamName] = games;
      })
    );

    return new Response(JSON.stringify({ scores: results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[get-recent-scores] Error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error", scores: {} }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
