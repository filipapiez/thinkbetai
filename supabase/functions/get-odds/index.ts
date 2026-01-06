import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Map our sport IDs to The Odds API sport keys
const sportKeyMap: Record<string, string> = {
  'nba': 'basketball_nba',
  'nfl': 'americanfootball_nfl',
  'mlb': 'baseball_mlb',
  'nhl': 'icehockey_nhl',
  'soccer': 'soccer_epl', // English Premier League as default
  'tennis': 'tennis_atp_aus_open', // ATP Australian Open as example
  'mma': 'mma_mixed_martial_arts',
  'boxing': 'boxing_boxing',
  'golf': 'golf_pga_championship',
};

interface OddsAPIGame {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Array<{
    key: string;
    title: string;
    markets: Array<{
      key: string;
      outcomes: Array<{
        name: string;
        price: number;
        point?: number;
      }>;
    }>;
  }>;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const API_KEY = Deno.env.get('THE_ODDS_API_KEY');
    if (!API_KEY) {
      console.error('THE_ODDS_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const sport = url.searchParams.get('sport') || 'nba';
    const sportKey = sportKeyMap[sport.toLowerCase()] || 'basketball_nba';

    console.log(`Fetching odds for sport: ${sport} (${sportKey})`);

    // Fetch upcoming games with odds from The Odds API
    const oddsUrl = `https://api.the-odds-api.com/v4/sports/${sportKey}/odds/?apiKey=${API_KEY}&regions=us&markets=h2h,spreads,totals&oddsFormat=american`;
    
    const response = await fetch(oddsUrl);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`The Odds API error: ${response.status} - ${errorText}`);
      
      if (response.status === 401) {
        return new Response(
          JSON.stringify({ error: 'Invalid API key' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Failed to fetch odds data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const games: OddsAPIGame[] = await response.json();
    
    // Log remaining requests
    const remainingRequests = response.headers.get('x-requests-remaining');
    console.log(`Remaining API requests: ${remainingRequests}`);

    // Transform the data to our format
    const transformedGames = games.map((game) => {
      // Get the first bookmaker with data (usually DraftKings or FanDuel)
      const bookmaker = game.bookmakers[0];
      
      let moneylineHome = 0;
      let moneylineAway = 0;
      let spreadHome = 0;
      let spreadHomeOdds = 0;
      let spreadAway = 0;
      let spreadAwayOdds = 0;
      let totalOver = 0;
      let totalOverOdds = 0;
      let totalUnder = 0;
      let totalUnderOdds = 0;

      if (bookmaker) {
        const h2hMarket = bookmaker.markets.find(m => m.key === 'h2h');
        const spreadsMarket = bookmaker.markets.find(m => m.key === 'spreads');
        const totalsMarket = bookmaker.markets.find(m => m.key === 'totals');

        if (h2hMarket) {
          const homeOutcome = h2hMarket.outcomes.find(o => o.name === game.home_team);
          const awayOutcome = h2hMarket.outcomes.find(o => o.name === game.away_team);
          moneylineHome = homeOutcome?.price || 0;
          moneylineAway = awayOutcome?.price || 0;
        }

        if (spreadsMarket) {
          const homeOutcome = spreadsMarket.outcomes.find(o => o.name === game.home_team);
          const awayOutcome = spreadsMarket.outcomes.find(o => o.name === game.away_team);
          spreadHome = homeOutcome?.point || 0;
          spreadHomeOdds = homeOutcome?.price || -110;
          spreadAway = awayOutcome?.point || 0;
          spreadAwayOdds = awayOutcome?.price || -110;
        }

        if (totalsMarket) {
          const overOutcome = totalsMarket.outcomes.find(o => o.name === 'Over');
          const underOutcome = totalsMarket.outcomes.find(o => o.name === 'Under');
          totalOver = overOutcome?.point || 0;
          totalOverOdds = overOutcome?.price || -110;
          totalUnder = underOutcome?.point || 0;
          totalUnderOdds = underOutcome?.price || -110;
        }
      }

      return {
        id: game.id,
        sportKey: game.sport_key,
        sportTitle: game.sport_title,
        commenceTime: game.commence_time,
        homeTeam: game.home_team,
        awayTeam: game.away_team,
        bookmaker: bookmaker?.title || 'N/A',
        odds: {
          moneyline: {
            home: moneylineHome,
            away: moneylineAway,
          },
          spread: {
            home: spreadHome,
            homeOdds: spreadHomeOdds,
            away: spreadAway,
            awayOdds: spreadAwayOdds,
          },
          total: {
            over: totalOver,
            overOdds: totalOverOdds,
            under: totalUnder,
            underOdds: totalUnderOdds,
          },
        },
        hasOdds: !!bookmaker,
      };
    });

    console.log(`Returning ${transformedGames.length} games with odds`);

    return new Response(
      JSON.stringify({ 
        games: transformedGames,
        remainingRequests: remainingRequests ? parseInt(remainingRequests) : null,
        lastUpdated: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-odds function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
