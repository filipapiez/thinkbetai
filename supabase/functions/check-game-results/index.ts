import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAdminOrCron, unauthorizedResponse } from "../_shared/adminAuth.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ActiveBet {
  id: string;
  game_id: string;
  sport: string;
  home_team: string;
  away_team: string;
  pick: string;
  pick_type: string;
  pick_value: number | null;
  odds: number;
  confidence: number;
  edge: number;
  game_time: string;
  status: string;
  published_at?: string | null;
  bookmaker?: string | null;
  market_type?: string | null;
  line?: number | null;
  opening_odds?: number | null;
  pick_odds?: number | null;
  closing_odds?: number | null;
  closing_line?: number | null;
  closing_bookmaker?: string | null;
  closing_captured_at?: string | null;
  model_probability?: number | null;
  implied_probability?: number | null;
  expected_value?: number | null;
  clv_percent?: number | null;
  clv_cents?: number | null;
  source_event_id?: string | null;
  odds_source?: string | null;
}

interface GameResult {
  eventID: string;
  homeScore: number;
  awayScore: number;
  status: { ended: boolean };
}

function impliedProbability(price: number) {
  return price < 0 ? Math.abs(price) / (Math.abs(price) + 100) : 100 / (price + 100);
}

function calculateClvPercent(pickOdds?: number | null, closingOdds?: number | null) {
  if (typeof pickOdds !== 'number' || typeof closingOdds !== 'number') return null;
  return Number(((impliedProbability(closingOdds) - impliedProbability(pickOdds)) * 100).toFixed(2));
}

function calculateClvCents(pickOdds?: number | null, closingOdds?: number | null) {
  if (typeof pickOdds !== 'number' || typeof closingOdds !== 'number') return null;
  return pickOdds - closingOdds;
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
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get pending active bets
    const { data: activeBets, error: fetchError } = await supabase
      .from('active_bets')
      .select('*')
      .eq('status', 'pending')
      .lte('game_time', new Date().toISOString());

    if (fetchError) {
      console.error('Error fetching active bets:', fetchError);
      throw fetchError;
    }

    if (!activeBets || activeBets.length === 0) {
      console.log('No pending bets to check');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No pending bets to check',
        checked: 0,
        updated: 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${activeBets.length} pending bets to check`);

    // Group bets by sport for efficient API calls
    const betsBySport = activeBets.reduce((acc: Record<string, ActiveBet[]>, bet: ActiveBet) => {
      const sport = bet.sport.toLowerCase();
      if (!acc[sport]) acc[sport] = [];
      acc[sport].push(bet);
      return acc;
    }, {});

    const API_KEY = Deno.env.get('SPORTSGAMEODDS_API_KEY');
    let updatedCount = 0;
    const results: Array<{ betId: string; result: string; homeScore: number; awayScore: number }> = [];

    // Check each sport's games
    for (const [sport, betsForSport] of Object.entries(betsBySport)) {
      const bets = betsForSport as ActiveBet[];
      console.log(`Checking ${bets.length} bets for sport: ${sport}`);
      try {
        // Fetch completed games from API
        const leagueId = sport.toUpperCase();
        const apiUrl = `https://api.sportsgameodds.com/v2/events?leagueID=${leagueId}&status=ended&limit=50`;
        
        const response = await fetch(apiUrl, {
          headers: { 'x-api-key': API_KEY || '' },
        });

        if (!response.ok) {
          console.error(`API error for ${sport}: ${response.status}`);
          continue;
        }

        const data = await response.json();
        const events = data?.data || data?.events || [];
        console.log(`Found ${events.length} completed events for ${sport}`);

        // Map events by ID for quick lookup
        const eventMap = new Map<string, GameResult>();
        for (const event of events) {
          const eventId = event.eventID || event.id;
          const homeScore = event.scores?.home?.total || 
                           event.scores?.home?.points ||
                           event.result?.homeScore || 0;
          const awayScore = event.scores?.away?.total || 
                           event.scores?.away?.points ||
                           event.result?.awayScore || 0;
          
          if (event.status?.ended) {
            eventMap.set(eventId, {
              eventID: eventId,
              homeScore,
              awayScore,
              status: { ended: true }
            });
          }
        }

        // Check each bet against completed games
        for (const bet of bets) {
          const gameResult = eventMap.get(bet.game_id);
          
          if (gameResult) {
            const { homeScore, awayScore } = gameResult;
            let result: 'win' | 'loss' | 'push' = 'loss';

            // Determine result based on pick type
            if (bet.pick_type === 'moneyline') {
              const pickedHome = bet.pick.toLowerCase().includes(bet.home_team.toLowerCase());
              const homeWon = homeScore > awayScore;
              result = (pickedHome && homeWon) || (!pickedHome && !homeWon) ? 'win' : 'loss';
              if (homeScore === awayScore) result = 'push';
            } else if (bet.pick_type === 'spread') {
              const pickedHome = bet.pick.toLowerCase().includes(bet.home_team.toLowerCase());
              const spread = bet.pick_value || 0;
              const adjustedScore = pickedHome ? homeScore + spread : awayScore + spread;
              const opposingScore = pickedHome ? awayScore : homeScore;
              
              if (adjustedScore > opposingScore) result = 'win';
              else if (adjustedScore === opposingScore) result = 'push';
              else result = 'loss';
            } else if (bet.pick_type === 'total') {
              const totalScore = homeScore + awayScore;
              const line = bet.pick_value || 0;
              const isOver = bet.pick.toLowerCase().includes('over');
              
              if (totalScore > line && isOver) result = 'win';
              else if (totalScore < line && !isOver) result = 'win';
              else if (totalScore === line) result = 'push';
              else result = 'loss';
            }

            console.log(`Bet ${bet.id}: ${bet.pick} - Result: ${result} (${homeScore}-${awayScore})`);

            // Update active_bets
            const { error: updateError } = await supabase
              .from('active_bets')
              .update({
                status: 'completed',
                result,
                home_score: homeScore,
                away_score: awayScore,
              })
              .eq('id', bet.id);

            if (updateError) {
              console.error(`Error updating bet ${bet.id}:`, updateError);
              continue;
            }

            const gameDate = new Date(bet.game_time).toISOString().split('T')[0];
            const pickOdds = bet.pick_odds ?? bet.odds;
            const clvPercent = bet.clv_percent ?? calculateClvPercent(pickOdds, bet.closing_odds);
            const clvCents = bet.clv_cents ?? calculateClvCents(pickOdds, bet.closing_odds);

            if (result === 'win' || result === 'loss') {
              const { error: historyError } = await supabase
                .from('historical_bets')
                .upsert({
                  date: gameDate,
                  sport: bet.sport,
                  home_team: bet.home_team,
                  away_team: bet.away_team,
                  pick: bet.pick,
                  odds: bet.odds,
                  confidence: bet.confidence,
                  edge: bet.edge,
                  result,
                  published_at: bet.published_at ?? bet.game_time,
                  bookmaker: bet.bookmaker ?? null,
                  market_type: bet.market_type ?? bet.pick_type,
                  line: bet.line ?? bet.pick_value ?? null,
                  opening_odds: bet.opening_odds ?? bet.odds,
                  pick_odds: pickOdds,
                  closing_odds: bet.closing_odds ?? null,
                  closing_line: bet.closing_line ?? null,
                  closing_bookmaker: bet.closing_bookmaker ?? null,
                  closing_captured_at: bet.closing_captured_at ?? null,
                  model_probability: bet.model_probability ?? null,
                  implied_probability: bet.implied_probability ?? null,
                  expected_value: bet.expected_value ?? null,
                  clv_percent: clvPercent,
                  clv_cents: clvCents,
                  source_event_id: bet.source_event_id ?? bet.game_id,
                  odds_source: bet.odds_source ?? null,
                }, {
                  onConflict: 'sport,home_team,away_team,pick,date',
                });

              if (historyError) {
                console.error(`Error inserting historical bet ${bet.id}:`, historyError);
                continue;
              }
            }

            updatedCount++;
            results.push({ betId: bet.id, result, homeScore, awayScore });
          }
        }
      } catch (err) {
        console.error(`Error checking ${sport}:`, err);
      }
    }

    console.log(`Updated ${updatedCount} bets`);

    return new Response(JSON.stringify({
      success: true,
      checked: activeBets.length,
      updated: updatedCount,
      results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in check-game-results:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
