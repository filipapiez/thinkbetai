import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const toNormalized = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const buildSearchCandidates = (teamName: string): string[] => {
  const cleaned = teamName.replace(/\./g, "").replace(/\s+/g, " ").trim();
  const expandedState = cleaned.replace(/\bSt\b/gi, "State");
  const words = expandedState.split(" ").filter(Boolean);

  const candidates = [cleaned, expandedState];

  if (words.length > 2) {
    candidates.push(words.slice(0, -1).join(" "));
    candidates.push(words.slice(0, -2).join(" "));
  }

  if (words.length >= 2) {
    candidates.push(words.slice(0, 2).join(" "));
  }

  if (words.length >= 1) {
    candidates.push(words[0]);
  }

  return [...new Set(candidates.map((c) => c.trim()).filter((c) => c.length >= 3))];
};

const findBestTeamMatch = (teams: any[], fullTeamName: string, query: string) => {
  const normalizedFullName = toNormalized(fullTeamName);
  const normalizedQuery = toNormalized(query);

  return (
    teams.find((t) => toNormalized(t?.strTeam || "") === normalizedFullName) ||
    teams.find((t) => toNormalized(t?.strTeamShort || "") === normalizedFullName) ||
    teams.find((t) => toNormalized(t?.strAlternate || "") === normalizedFullName) ||
    teams.find((t) => toNormalized(t?.strTeam || "").includes(normalizedQuery)) ||
    teams.find((t) => toNormalized(t?.strAlternate || "").includes(normalizedQuery)) ||
    teams[0]
  );
};

const toPreviewUrl = (url: string | null): string | null => {
  if (!url) return null;
  return url.endsWith("/preview") ? url : `${url}/preview`;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { teamName, sport } = await req.json();

    if (!teamName) {
      return new Response(JSON.stringify({ error: "teamName is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const normalizedName = teamName.toLowerCase().trim();
    const normalizedSport = (sport || "unknown").toLowerCase().trim();

    const { data: cached } = await supabase
      .from("team_logos_cache")
      .select("logo_url")
      .eq("team_name", normalizedName)
      .eq("sport", normalizedSport)
      .maybeSingle();

    // Only trust positive cache hits. Null entries should be retried with improved search candidates.
    if (cached?.logo_url) {
      return new Response(JSON.stringify({ logoUrl: cached.logo_url }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let logoUrl: string | null = null;
    const candidates = buildSearchCandidates(teamName);

    for (const candidate of candidates) {
      const searchUrl = `https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(candidate)}`;
      console.log("Searching TheSportsDB:", searchUrl);

      const res = await fetch(searchUrl);
      if (!res.ok) continue;

      const payload = await res.json();
      if (!Array.isArray(payload?.teams) || payload.teams.length === 0) continue;

      const team = findBestTeamMatch(payload.teams, teamName, candidate);
      const found = toPreviewUrl(team?.strBadge || team?.strLogo || null);

      if (found) {
        logoUrl = found;
        break;
      }
    }

    await supabase.from("team_logos_cache").upsert(
      {
        team_name: normalizedName,
        sport: normalizedSport,
        logo_url: logoUrl,
        source: "thesportsdb",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "team_name,sport" }
    );

    return new Response(JSON.stringify({ logoUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching team logo:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch logo", logoUrl: null }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
