import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAdminOrCron, unauthorizedResponse } from "../_shared/adminAuth.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TARGET_WIN_RATE = 0.833; // 80% target win rate

interface GameData {
  sport: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  gameDate: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const auth = await requireAdminOrCron(req);
  if (!auth.ok) return unauthorizedResponse(auth, corsHeaders);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { game } = await req.json() as { game: GameData };

    if (!game) {
      throw new Error('Game data is required');
    }

    console.log(`Generating AI bet for: ${game.awayTeam} @ ${game.homeTeam}`);

    // Calculate current win rate from existing historical bets
    const { data: existingBets, error: fetchError } = await supabase
      .from('historical_bets')
      .select('result');

    if (fetchError) {
      console.error('Error fetching historical bets:', fetchError);
    }

    const totalBets = existingBets?.length || 0;
    const wins = existingBets?.filter(b => b.result === 'win').length || 0;
    const currentWinRate = totalBets > 0 ? wins / totalBets : TARGET_WIN_RATE;

    // Determine if next bet should win to maintain target rate
    // If current rate is below target, next bet should win
    // If current rate is above target, next bet should lose
    const shouldWin = currentWinRate < TARGET_WIN_RATE || 
                      (currentWinRate === TARGET_WIN_RATE && Math.random() < TARGET_WIN_RATE);
    
    const actualWinner = game.homeScore > game.awayScore ? game.homeTeam : game.awayTeam;
    const actualLoser = game.homeScore > game.awayScore ? game.awayTeam : game.homeTeam;
    
    // Pick the team that achieves our desired outcome
    const pickedTeam = shouldWin ? actualWinner : actualLoser;
    const result = shouldWin ? 'win' : 'loss';

    // Use Gemini to generate realistic bet analysis
    const prompt = `Generate a realistic sports betting pick analysis for this game:
Sport: ${game.sport}
Matchup: ${game.awayTeam} @ ${game.homeTeam}
Final Score: ${game.awayTeam} ${game.awayScore} - ${game.homeTeam} ${game.homeScore}
Our Pick: ${pickedTeam} ML
Result: ${result.toUpperCase()}

Generate a JSON object with these fields (numbers only, no text):
- confidence: number between 65-92 (higher for wins, 70-85 for losses)
- edge: number between 2.5-8.5 representing the edge percentage
- odds: American odds between -180 and +160 (typically -110 to -150 for favorites, +100 to +160 for underdogs)

Consider:
- ${pickedTeam === game.homeTeam ? 'Home' : 'Away'} team was picked
- The final score margin was ${Math.abs(game.homeScore - game.awayScore)} points
- Generate odds that make sense (favorites have negative odds)

Return ONLY valid JSON, no markdown, no explanation.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: 'You are a sports analytics AI. Return only valid JSON with numeric values.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || '';
    
    // Parse AI response
    let betDetails = { confidence: 75, edge: 4.5, odds: -110 };
    try {
      // Clean the response - remove markdown code blocks if present
      let cleanContent = aiContent.trim();
      if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/```json?\n?/g, '').replace(/```/g, '');
      }
      const parsed = JSON.parse(cleanContent);
      betDetails = {
        confidence: Math.min(92, Math.max(65, parsed.confidence || 75)),
        edge: Math.min(8.5, Math.max(2.5, parsed.edge || 4.5)),
        odds: Math.min(160, Math.max(-180, parsed.odds || -110)),
      };
    } catch (parseErr) {
      console.warn('Could not parse AI response, using defaults:', parseErr);
      // Use reasonable defaults based on result
      betDetails = {
        confidence: shouldWin ? 78 + Math.floor(Math.random() * 10) : 70 + Math.floor(Math.random() * 8),
        edge: 3.5 + Math.random() * 4,
        odds: Math.random() > 0.5 ? -110 - Math.floor(Math.random() * 40) : 100 + Math.floor(Math.random() * 50),
      };
    }

    // Insert into historical_bets
    const { data: insertedBet, error: insertError } = await supabase
      .from('historical_bets')
      .insert({
        date: game.gameDate,
        sport: game.sport,
        home_team: game.homeTeam,
        away_team: game.awayTeam,
        pick: `${pickedTeam} ML`,
        odds: Math.round(betDetails.odds),
        confidence: Math.round(betDetails.confidence),
        edge: Math.round(betDetails.edge * 10) / 10,
        result,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting bet:', insertError);
      throw insertError;
    }

    console.log(`Successfully generated ${result} bet: ${pickedTeam} ML @ ${betDetails.odds}`);

    return new Response(JSON.stringify({
      success: true,
      bet: insertedBet,
      winRateBefore: (currentWinRate * 100).toFixed(1),
      targetWinRate: (TARGET_WIN_RATE * 100).toFixed(1),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-ai-bet:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
