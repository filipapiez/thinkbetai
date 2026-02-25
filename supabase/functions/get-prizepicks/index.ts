import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CACHE_TTL_MS = 15 * 60 * 1000;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const cacheKey = "prizepicks_board_v3";

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check cache
    const { data: cached } = await supabase
      .from("odds_cache")
      .select("data, expires_at")
      .eq("id", cacheKey)
      .single();

    if (cached && new Date(cached.expires_at) > new Date()) {
      console.log("Returning cached PrizePicks data");
      return new Response(JSON.stringify(cached.data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!firecrawlKey) {
      return new Response(
        JSON.stringify({ projections: [], leagues: [], totalCount: 0, lastUpdated: new Date().toISOString(), error: "Firecrawl not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use Firecrawl to scrape the PrizePicks board page (renders JS)
    console.log("Scraping PrizePicks board via Firecrawl...");

    const fcResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${firecrawlKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: "https://app.prizepicks.com/board",
        formats: ["markdown"],
        waitFor: 5000,
        onlyMainContent: true,
      }),
    });

    if (!fcResponse.ok) {
      const errText = await fcResponse.text();
      console.error("Firecrawl error:", fcResponse.status, errText);
      return new Response(
        JSON.stringify({ projections: [], leagues: [], totalCount: 0, lastUpdated: new Date().toISOString(), error: "Scraping failed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const fcData = await fcResponse.json();
    const markdown = fcData?.data?.markdown || fcData?.markdown || "";
    console.log(`Got ${markdown.length} chars of markdown from PrizePicks`);

    if (!markdown || markdown.length < 100) {
      console.log("Markdown content too short, scrape may have been blocked");
      return new Response(
        JSON.stringify({ projections: [], leagues: [], totalCount: 0, lastUpdated: new Date().toISOString(), error: "PrizePicks blocked scrape" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse the markdown to extract player props
    // PrizePicks board shows cards with: Player Name, Team - Position, Game, Line, Stat Type
    const projections = parseMarkdownProps(markdown);

    const leagueSet = new Set<string>();
    projections.forEach(p => {
      if (p.sport) leagueSet.add(p.sport);
    });

    const result = {
      projections,
      leagues: Array.from(leagueSet).map(s => ({ id: s.toLowerCase().replace(/\s/g, '_'), name: s })),
      totalCount: projections.length,
      lastUpdated: new Date().toISOString(),
      source: "firecrawl",
    };

    // Cache
    if (projections.length > 0) {
      const expiresAt = new Date(Date.now() + CACHE_TTL_MS).toISOString();
      await supabase.from("odds_cache").upsert({
        id: cacheKey,
        data: result,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      });
    }

    console.log(`Returning ${projections.length} parsed PrizePicks props`);
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("PrizePicks error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch data", projections: [], leagues: [] }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function parseMarkdownProps(markdown: string): any[] {
  const projections: any[] = [];
  const lines = markdown.split("\n").map(l => l.trim()).filter(Boolean);

  // PrizePicks markdown typically contains patterns like:
  // Player Name
  // TEAM - POS
  // TEAM1 vs TEAM2  or  TEAM1 @ TEAM2
  // Cur. XX  YY.Y  StatType
  // Less  More

  let i = 0;
  while (i < lines.length) {
    // Look for game description patterns (e.g., "ORL 70@ LAL 77" or "LAL vs ORL")
    const gamePattern = /([A-Z]{2,4})\s*\d*\s*(?:@|vs\.?|VS)\s*([A-Z]{2,4})\s*\d*/;
    const linePattern = /(?:Cur\.\s*\d+\s+)?(\d+\.?\d*)\s+(Points|Rebounds|Assists|Threes|Pts\+|Steals|Blocks|Fantasy|Turnovers|Double|Triple|Strikeouts|Hits|Total Bases|RBIs|Runs|Home Runs|Goals|Shots|Saves|Pass|Rush|Rec|Reception|TD|Tackles|Sacks|Interceptions|Completions|Attempts)/i;
    
    const gameMatch = lines[i]?.match(gamePattern);
    const lineMatch = lines[i]?.match(linePattern);

    // Try to detect a player card block
    if (lineMatch) {
      // Look backwards for player name and team
      let playerName = "";
      let team = "";
      let position = "";
      let description = "";

      for (let j = Math.max(0, i - 5); j < i; j++) {
        const line = lines[j];
        
        // Team - Position pattern (e.g., "ORL - F" or "LAL - C")
        const teamPosMatch = line.match(/^([A-Z]{2,4})\s*[-–]\s*([A-Z]{1,3}(?:-[A-Z]{1,3})?)$/);
        if (teamPosMatch) {
          team = teamPosMatch[1];
          position = teamPosMatch[2];
          continue;
        }

        // Game description
        const gm = line.match(gamePattern);
        if (gm) {
          description = line;
          continue;
        }

        // Player name (a line that's not a number, not a game, not a stat)
        if (line.length > 2 && line.length < 40 && !line.match(/^[\d.]+$/) && !line.match(/^(Less|More|Cur\.|Q\d|[A-Z]{2,4}\s*[-–])/i)) {
          playerName = line;
        }
      }

      if (playerName && lineMatch[1]) {
        const lineScore = parseFloat(lineMatch[1]);
        const statType = lineMatch[2];

        projections.push({
          id: `pp_${projections.length}_${playerName.replace(/\s/g, '_')}`,
          lineScore,
          statType,
          description: description || `${team} game`,
          gameTime: null,
          isPromo: false,
          flashSaleLine: null,
          oddsType: null,
          player: {
            id: playerName.toLowerCase().replace(/\s/g, '_'),
            name: playerName,
            position,
            team,
            teamName: team,
            imageUrl: null,
          },
          league: null,
          sport: guessSport(statType, team),
        });
      }
    }

    i++;
  }

  // Deduplicate by player + stat
  const seen = new Set<string>();
  return projections.filter(p => {
    const key = `${p.player.name}_${p.statType}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function guessSport(statType: string, _team: string): string {
  const st = statType.toLowerCase();
  if (st.includes('strikeout') || st.includes('hits') || st.includes('total bases') || st.includes('rbis') || st.includes('home run')) return 'MLB';
  if (st.includes('pass') || st.includes('rush') || st.includes('reception') || st.includes('td') || st.includes('tackles') || st.includes('sacks')) return 'NFL';
  if (st.includes('goals') || st.includes('saves') || st.includes('shots on')) return 'NHL';
  if (st.includes('points') || st.includes('rebounds') || st.includes('assists') || st.includes('threes') || st.includes('fantasy')) return 'NBA';
  return 'Other';
}
