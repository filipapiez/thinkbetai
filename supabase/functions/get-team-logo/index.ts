import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { teamName, sport } = await req.json();

    if (!teamName) {
      return new Response(
        JSON.stringify({ error: "teamName is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check cache first
    const normalizedName = teamName.toLowerCase().trim();
    const normalizedSport = (sport || "unknown").toLowerCase().trim();

    const { data: cached } = await supabase
      .from("team_logos_cache")
      .select("logo_url")
      .eq("team_name", normalizedName)
      .eq("sport", normalizedSport)
      .maybeSingle();

    if (cached) {
      return new Response(
        JSON.stringify({ logoUrl: cached.logo_url }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Search TheSportsDB (free API, key = 3)
    let logoUrl: string | null = null;

    // Try searching by team name
    const searchUrl = `https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(teamName)}`;
    console.log("Searching TheSportsDB:", searchUrl);

    const res = await fetch(searchUrl);
    const data = await res.json();

    if (data.teams && data.teams.length > 0) {
      // Find best match - prefer exact or closest name match
      const team = data.teams.find(
        (t: any) =>
          t.strTeam?.toLowerCase() === normalizedName ||
          t.strTeamShort?.toLowerCase() === normalizedName ||
          t.strAlternate?.toLowerCase()?.includes(normalizedName)
      ) || data.teams[0];

      logoUrl = team.strBadge || team.strLogo || null;

      // Append /preview for smaller size if available
      if (logoUrl) {
        logoUrl = logoUrl + "/preview";
      }
    }

    // Cache the result (even null, to avoid repeated lookups)
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

    return new Response(
      JSON.stringify({ logoUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error fetching team logo:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch logo", logoUrl: null }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
