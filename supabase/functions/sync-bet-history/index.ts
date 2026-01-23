import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TARGET_WIN_RATE = 0.80;

interface ESPNEvent {
  id: string;
  name: string;
  date: string;
  status: { type: { state: string; completed: boolean } };
  competitions: Array<{
    competitors: Array<{
      homeAway: string;
      team: { displayName: string; abbreviation: string };
      score: string;
      winner?: boolean;
    }>;
  }>;
}

interface GeneratedBet {
  date: string;
  sport: string;
  home_team: string;
  away_team: string;
  pick: string;
  odds: number;
  confidence: number;
  edge: number;
  result: 'win' | 'loss';
}

const SPORT_ENDPOINTS = [
  { sport: 'NBA', url: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=20250101-20250123&limit=100' },
  { sport: 'NFL', url: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=20250101-20250123&limit=100' },
  { sport: 'NHL', url: 'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard?dates=20250101-20250123&limit=100' },
  { sport: 'NCAAB', url: 'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard?dates=20250101-20250123&limit=50' },
  { sport: 'Soccer', url: 'https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard?dates=20250101-20250123&limit=50' },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { action = 'generate', count = 50 } = await req.json().catch(() => ({}));
    
    console.log(`Syncing bet history with action: ${action}, target count: ${count}`);

    // Fetch completed games from ESPN APIs
    const allCompletedGames: Array<{
      sport: string;
      homeTeam: string;
      awayTeam: string;
      homeScore: number;
      awayScore: number;
      gameDate: string;
      winner: string;
    }> = [];

    for (const { sport, url } of SPORT_ENDPOINTS) {
      try {
        const response = await fetch(url);
        if (!response.ok) continue;
        
        const data = await response.json();
        const events = data.events || [];
        
        for (const event of events) {
          if (!event.status?.type?.completed) continue;
          
          const competition = event.competitions?.[0];
          if (!competition?.competitors?.length) continue;
          
          const homeTeam = competition.competitors.find((c: any) => c.homeAway === 'home');
          const awayTeam = competition.competitors.find((c: any) => c.homeAway === 'away');
          
          if (!homeTeam || !awayTeam) continue;
          
          const homeScore = parseInt(homeTeam.score) || 0;
          const awayScore = parseInt(awayTeam.score) || 0;
          
          if (homeScore === 0 && awayScore === 0) continue;
          
          const gameDate = new Date(event.date).toISOString().split('T')[0];
          const winner = homeScore > awayScore ? homeTeam.team.displayName : awayTeam.team.displayName;
          
          allCompletedGames.push({
            sport,
            homeTeam: homeTeam.team.displayName,
            awayTeam: awayTeam.team.displayName,
            homeScore,
            awayScore,
            gameDate,
            winner,
          });
        }
      } catch (err) {
        console.error(`Error fetching ${sport}:`, err);
      }
    }

    console.log(`Found ${allCompletedGames.length} completed games from ESPN`);

    if (allCompletedGames.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No completed games found from APIs',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Shuffle and select games
    const shuffled = allCompletedGames.sort(() => Math.random() - 0.5);
    const selectedGames = shuffled.slice(0, Math.min(count, shuffled.length));

    // Calculate how many wins we need for 80% rate
    const totalBets = selectedGames.length;
    const winsNeeded = Math.round(totalBets * TARGET_WIN_RATE);
    const lossesNeeded = totalBets - winsNeeded;

    // Create win/loss assignment array
    const outcomes: boolean[] = [
      ...Array(winsNeeded).fill(true),
      ...Array(lossesNeeded).fill(false),
    ].sort(() => Math.random() - 0.5);

    // Use Gemini to generate realistic bet details for all games
    const gamesForAI = selectedGames.map((game, idx) => ({
      ...game,
      shouldWin: outcomes[idx],
      pick: outcomes[idx] ? game.winner : (game.winner === game.homeTeam ? game.awayTeam : game.homeTeam),
    }));

    const prompt = `Generate realistic sports betting pick data for these ${gamesForAI.length} completed games. 
For each game, provide confidence (65-92), edge (2.5-8.5), and American odds (-180 to +160).

Games:
${gamesForAI.map((g, i) => `${i + 1}. ${g.sport}: ${g.awayTeam} @ ${g.homeTeam} (${g.awayScore}-${g.homeScore}) - Pick: ${g.pick} ML - ${g.shouldWin ? 'WIN' : 'LOSS'}`).join('\n')}

Return a JSON array with objects containing: index, confidence, edge, odds
Higher confidence (78-92) for wins, moderate (65-80) for losses.
Favorites should have negative odds (-110 to -180), underdogs positive (+100 to +160).
Return ONLY valid JSON array, no markdown.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: 'You are a sports analytics AI. Return only valid JSON arrays.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      console.error('AI API error:', aiResponse.status);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    let betDetails: Array<{ index: number; confidence: number; edge: number; odds: number }> = [];
    
    try {
      const aiData = await aiResponse.json();
      let content = aiData.choices?.[0]?.message?.content || '';
      content = content.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      betDetails = JSON.parse(content);
    } catch (parseErr) {
      console.warn('Could not parse AI response, generating defaults');
      betDetails = gamesForAI.map((g, i) => ({
        index: i + 1,
        confidence: g.shouldWin ? 75 + Math.floor(Math.random() * 15) : 68 + Math.floor(Math.random() * 10),
        edge: 3 + Math.random() * 5,
        odds: Math.random() > 0.5 ? -110 - Math.floor(Math.random() * 50) : 105 + Math.floor(Math.random() * 45),
      }));
    }

    // Create bet records
    const betsToInsert: GeneratedBet[] = gamesForAI.map((game, idx) => {
      const details = betDetails.find(d => d.index === idx + 1) || betDetails[idx] || {
        confidence: game.shouldWin ? 80 : 72,
        edge: 4.5,
        odds: -115,
      };

      return {
        date: game.gameDate,
        sport: game.sport,
        home_team: game.homeTeam,
        away_team: game.awayTeam,
        pick: `${game.pick} ML`,
        odds: Math.round(details.odds),
        confidence: Math.round(details.confidence),
        edge: Math.round(details.edge * 10) / 10,
        result: game.shouldWin ? 'win' : 'loss',
      };
    });

    // Clear existing and insert new if action is 'replace'
    if (action === 'replace') {
      const { error: deleteError } = await supabase
        .from('historical_bets')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (deleteError) {
        console.error('Error clearing historical bets:', deleteError);
      }
    }

    // Insert new bets
    const { data: inserted, error: insertError } = await supabase
      .from('historical_bets')
      .insert(betsToInsert)
      .select();

    if (insertError) {
      console.error('Error inserting bets:', insertError);
      throw insertError;
    }

    const actualWins = betsToInsert.filter(b => b.result === 'win').length;
    const actualWinRate = (actualWins / betsToInsert.length * 100).toFixed(1);

    console.log(`Successfully generated ${betsToInsert.length} bets with ${actualWinRate}% win rate`);

    return new Response(JSON.stringify({
      success: true,
      generated: betsToInsert.length,
      wins: actualWins,
      losses: betsToInsert.length - actualWins,
      winRate: actualWinRate,
      games: betsToInsert.slice(0, 5), // Sample
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in sync-bet-history:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
