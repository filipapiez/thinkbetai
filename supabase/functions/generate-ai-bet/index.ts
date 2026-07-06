import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAdminOrCron, unauthorizedResponse } from "../_shared/adminAuth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const MIN_QUALIFIED_CONFIDENCE = 83;

interface UpcomingGameInput {
  gameId: string;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  gameTime: string;
  pickTeam: string;
  odds: number;
  confidence?: number;
  edge?: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const auth = await requireAdminOrCron(req);
  if (!auth.ok) return unauthorizedResponse(auth, corsHeaders);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { game } = await req.json() as { game?: UpcomingGameInput };

    if (!game) throw new Error("Upcoming game data is required");
    if ("homeScore" in game || "awayScore" in game) {
      throw new Error("Refusing to create a historical bet from completed scores. Create an active pre-game pick first, then settle it.");
    }

    const gameTime = new Date(game.gameTime);
    if (!Number.isFinite(gameTime.getTime()) || gameTime.getTime() <= Date.now()) {
      throw new Error("Qualified picks must be created before game start");
    }

    const confidence = Math.round(game.confidence ?? MIN_QUALIFIED_CONFIDENCE);
    if (confidence < MIN_QUALIFIED_CONFIDENCE) {
      throw new Error(`Pick confidence ${confidence}% is below the ${MIN_QUALIFIED_CONFIDENCE}% qualified threshold`);
    }

    const pick = {
      game_id: game.gameId,
      sport: game.sport,
      home_team: game.homeTeam,
      away_team: game.awayTeam,
      pick: `${game.pickTeam} ML`,
      pick_type: "moneyline",
      pick_value: null,
      odds: Math.round(game.odds),
      confidence,
      edge: Math.round((game.edge ?? 3.0) * 10) / 10,
      game_time: gameTime.toISOString(),
      status: "pending",
    };

    const { data, error } = await supabase
      .from("active_bets")
      .upsert(pick, {
        onConflict: "sport,home_team,away_team,pick,game_time",
        ignoreDuplicates: true,
      })
      .select()
      .maybeSingle();

    if (error) throw error;

    return new Response(JSON.stringify({
      success: true,
      bet: data,
      minimumConfidence: MIN_QUALIFIED_CONFIDENCE,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-ai-bet:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
