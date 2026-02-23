import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function getSupabaseAdmin() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
}

async function getDbCache(key: string): Promise<unknown | null> {
  try {
    const sb = getSupabaseAdmin();
    const { data } = await sb
      .from('odds_cache')
      .select('data, expires_at')
      .eq('id', key)
      .single();
    if (data && new Date(data.expires_at) > new Date()) {
      return data.data;
    }
  } catch { /* miss */ }
  return null;
}

async function setDbCache(key: string, value: unknown, ttlMs: number): Promise<void> {
  try {
    const sb = getSupabaseAdmin();
    await sb.from('odds_cache').upsert({
      id: key,
      data: value,
      expires_at: new Date(Date.now() + ttlMs).toISOString(),
      updated_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error('[odds_cache] write error', e);
  }
}

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 min

// Map sport filter to SportsGameOdds league IDs
const sportLeagueMap: Record<string, string[]> = {
  all: ['NBA', 'NFL', 'MLB', 'NHL'],
  basketball: ['NBA'],
  football: ['NFL'],
  baseball: ['MLB'],
  hockey: ['NHL'],
};

// Player prop odd ID patterns in SportsGameOdds
// Format: {statType}-{playerID}-game-ou-{over|under}
const PLAYER_PROP_PATTERNS = [
  { pattern: /^points-(.+)-game-ou-(over|under)$/, stat: 'Points' },
  { pattern: /^rebounds-(.+)-game-ou-(over|under)$/, stat: 'Rebounds' },
  { pattern: /^assists-(.+)-game-ou-(over|under)$/, stat: 'Assists' },
  { pattern: /^threes-(.+)-game-ou-(over|under)$/, stat: '3-Pointers' },
  { pattern: /^steals-(.+)-game-ou-(over|under)$/, stat: 'Steals' },
  { pattern: /^blocks-(.+)-game-ou-(over|under)$/, stat: 'Blocks' },
  { pattern: /^strikeouts-(.+)-game-ou-(over|under)$/, stat: 'Strikeouts' },
  { pattern: /^hits-(.+)-game-ou-(over|under)$/, stat: 'Hits' },
  { pattern: /^totalbases-(.+)-game-ou-(over|under)$/, stat: 'Total Bases' },
  { pattern: /^passingyards-(.+)-game-ou-(over|under)$/, stat: 'Pass Yards' },
  { pattern: /^rushingyards-(.+)-game-ou-(over|under)$/, stat: 'Rush Yards' },
  { pattern: /^receivingyards-(.+)-game-ou-(over|under)$/, stat: 'Rec Yards' },
  { pattern: /^receptions-(.+)-game-ou-(over|under)$/, stat: 'Receptions' },
  { pattern: /^saves-(.+)-game-ou-(over|under)$/, stat: 'Saves' },
  { pattern: /^shots-(.+)-game-ou-(over|under)$/, stat: 'Shots' },
  { pattern: /^goals-(.+)-game-ou-(over|under)$/, stat: 'Goals' },
];

interface PlayerProp {
  id: string;
  playerName: string;
  playerId: string;
  team: string;
  opponent: string;
  sport: string;
  league: string;
  statType: string;
  line: number;
  overOdds: number;
  underOdds: number;
  gameTime: string;
  gameId: string;
}

function formatPlayerName(playerId: string): string {
  // Convert IDs like "lebron-james" or "LeBronJames" to readable names
  return playerId
    .replace(/([a-z])([A-Z])/g, '$1 $2')  // camelCase
    .replace(/[-_]/g, ' ')                   // kebab/snake
    .replace(/\b\w/g, c => c.toUpperCase()); // capitalize
}

function parseOdds(val: unknown): number {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') return parseInt(val.replace(/[^0-9+-]/g, '')) || -110;
  return -110;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const API_KEY = Deno.env.get('SPORTSGAMEODDS_API_KEY');
    if (!API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: 'API not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const sportFilter = url.searchParams.get('sport') || 'all';
    const leagues = sportLeagueMap[sportFilter.toLowerCase()] || sportLeagueMap.all;

    const cacheKey = `player-props:${leagues.join(',')}`;

    // Check DB cache
    const cached = await getDbCache(cacheKey);
    if (cached) {
      console.log('Returning cached player props');
      return new Response(JSON.stringify(cached), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const allProps: PlayerProp[] = [];

    for (const leagueId of leagues) {
      try {
        console.log(`Fetching player props for ${leagueId}...`);
        const apiUrl = `https://api.sportsgameodds.com/v2/events?leagueID=${leagueId}&oddsAvailable=true&limit=20`;
        const response = await fetch(apiUrl, {
          headers: { 'x-api-key': API_KEY },
        });

        if (!response.ok) {
          console.error(`SportsGameOdds ${leagueId} error: ${response.status}`);
          continue;
        }

        const data = await response.json();
        const events = data?.data || [];

        for (const event of events) {
          const homeTeam = event.teams?.home?.names?.medium || event.teams?.home?.names?.long || 'Home';
          const awayTeam = event.teams?.away?.names?.medium || event.teams?.away?.names?.long || 'Away';
          const gameTime = event.status?.startsAt || '';
          const gameId = event.eventID || event.id || '';
          const odds = event.odds || {};

          // Group player props by player+stat
          const playerMap = new Map<string, { stat: string; playerId: string; over?: { line: number; odds: number }; under?: { line: number; odds: number } }>();

          for (const [oddId, oddData] of Object.entries(odds)) {
            const odd = oddData as any;
            for (const { pattern, stat } of PLAYER_PROP_PATTERNS) {
              const match = oddId.match(pattern);
              if (match) {
                const playerId = match[1];
                const direction = match[2]; // over or under
                const key = `${playerId}:${stat}`;
                
                if (!playerMap.has(key)) {
                  playerMap.set(key, { stat, playerId, over: undefined, under: undefined });
                }
                const entry = playerMap.get(key)!;
                const line = parseFloat(odd?.fairOverUnder || odd?.bookOverUnder || odd?.overUnder || odd?.line || '0');
                const oddsVal = parseOdds(odd?.fairOdds || odd?.bookOdds || odd?.odds);

                if (direction === 'over') {
                  entry.over = { line, odds: oddsVal };
                } else {
                  entry.under = { line, odds: oddsVal };
                }
              }
            }
          }

          // Convert to PlayerProp array
          for (const [, entry] of playerMap) {
            if (!entry.over && !entry.under) continue;
            const line = entry.over?.line || entry.under?.line || 0;
            if (line === 0) continue;

            // Determine which team the player is on (heuristic: check if playerID is in home/away rosters or odd IDs)
            const isHome = Object.keys(odds).some(k => k.includes(entry.playerId) && k.includes('home'));
            const team = isHome ? homeTeam : awayTeam;
            const opponent = isHome ? awayTeam : homeTeam;

            allProps.push({
              id: `${gameId}-${entry.playerId}-${entry.stat}`,
              playerName: formatPlayerName(entry.playerId),
              playerId: entry.playerId,
              team,
              opponent,
              sport: leagueId,
              league: leagueId,
              statType: entry.stat,
              line,
              overOdds: entry.over?.odds || -110,
              underOdds: entry.under?.odds || -110,
              gameTime,
              gameId,
            });
          }
        }
      } catch (err) {
        console.error(`Error fetching ${leagueId} props:`, err);
      }
    }

    console.log(`Returning ${allProps.length} player props across ${leagues.join(', ')}`);

    const result = {
      success: true,
      props: allProps,
      lastUpdated: new Date().toISOString(),
      count: allProps.length,
    };

    // Cache results
    await setDbCache(cacheKey, result, CACHE_TTL_MS);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in get-player-props:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to fetch player props' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
