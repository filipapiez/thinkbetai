import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { playerName, sport, statType, line } = await req.json();

    if (!playerName || !statType || line === undefined) {
      return new Response(
        JSON.stringify({ success: false, error: 'playerName, statType, and line are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Check cache first (12 hour TTL)
    const cacheKey = `player-log:${playerName.toLowerCase().replace(/\s+/g, '-')}:${statType.toLowerCase()}`;
    const { data: cached } = await supabase
      .from('odds_cache')
      .select('data, expires_at')
      .eq('id', cacheKey)
      .single();

    if (cached && new Date(cached.expires_at) > new Date()) {
      const cachedData = cached.data as any;
      const cachedValues = Array.isArray(cachedData?.statValues) ? cachedData.statValues : [];
      // Only use cache if it has at least 10 stat values (reject old small entries)
      if (cachedValues.length >= 10) {
        console.log(`Cache hit for ${playerName} ${statType} (${cachedValues.length} values)`);
        const results = cachedValues.map((val: number) => val >= line);
        return new Response(
          JSON.stringify({
            success: true,
            results,
            statValues: cachedValues,
            hitCount: results.filter(Boolean).length,
            total: results.length,
            source: 'cached',
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      console.log(`Cache has only ${cachedValues.length} values for ${playerName} ${statType}, re-fetching`);
    }

    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!firecrawlApiKey || !lovableApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Search services not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build sport-specific search for game log pages
    const currentYear = new Date().getFullYear();
    const sportNorm = (sport || 'nba').toLowerCase();
    
    // Use sport-specific reference sites for better game log coverage
    const sportSites: Record<string, string> = {
      nba: 'site:basketball-reference.com OR site:espn.com OR site:statmuse.com',
      nhl: 'site:hockey-reference.com OR site:espn.com OR site:statmuse.com',
      nfl: 'site:pro-football-reference.com OR site:espn.com OR site:statmuse.com',
      mlb: 'site:baseball-reference.com OR site:espn.com OR site:statmuse.com',
    };
    const sites = sportSites[sportNorm] || 'site:espn.com OR site:statmuse.com';
    const query = `${playerName} ${currentYear} game log ${sites}`;

    console.log(`Searching game log for ${playerName} (${statType})`);

    // Retry logic for rate limits (429)
    let searchResp: Response | null = null;
    const maxRetries = 3;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      searchResp = await fetch('https://api.firecrawl.dev/v1/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          limit: 5,
          scrapeOptions: { formats: ['markdown'] },
        }),
      });

      if (searchResp.status === 429 && attempt < maxRetries - 1) {
        const wait = (attempt + 1) * 2000; // 2s, 4s backoff
        console.log(`Rate limited, retrying in ${wait}ms (attempt ${attempt + 1})`);
        await new Promise(r => setTimeout(r, wait));
        continue;
      }
      break;
    }

    if (!searchResp || !searchResp.ok) {
      const status = searchResp?.status ?? 0;
      console.error(`Firecrawl search failed: ${status}`);

      // Graceful fallback: if we have any cached data (even stale), use it.
      if (cached?.data && typeof cached.data === 'object') {
        const cachedData = cached.data as any;
        const fallbackValues = Array.isArray(cachedData.statValues)
          ? cachedData.statValues.filter((v: unknown) => typeof v === 'number' && Number.isFinite(v))
          : [];

        if (fallbackValues.length > 0) {
          const fallbackResults = fallbackValues.map((val: number) => val >= line);
          return new Response(
            JSON.stringify({
              success: true,
              results: fallbackResults,
              statValues: fallbackValues,
              hitCount: fallbackResults.filter(Boolean).length,
              total: fallbackResults.length,
              source: 'stale-cache',
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // No cache available: return non-fatal empty payload so UI doesn't crash.
      return new Response(
        JSON.stringify({
          success: true,
          results: [],
          statValues: [],
          hitCount: 0,
          total: 0,
          source: status === 402 ? 'credits-exhausted' : status === 429 ? 'rate-limited' : 'unavailable',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const searchData = await searchResp.json();
    const snippets = (searchData?.data || [])
      .slice(0, 5)
      .map((r: any) => {
        const md = (r?.markdown || r?.description || '').toString();
        // Allow larger snippets to capture full game log tables
        return md.length > 8000 ? md.slice(0, 8000) : md;
      })
      .filter((s: string) => s.trim().length > 0);

    if (snippets.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'No game log data found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use AI to extract the last 20 stat values
    const statLabel = statType.toLowerCase();
    const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a sports statistics expert. Your task is to extract per-game stat values from game log data. Look for tables or lists showing individual game results. Each row in a game log represents one game. Extract the "${statType}" column value AND the game date from each game row. You MUST find at least 15-20 games if the data is present. Do NOT stop at 5 or 6 — scan the ENTIRE source for all game rows. Return ONLY real numeric values. Do NOT fabricate or estimate data.`,
          },
          {
            role: 'user',
            content: `Player: ${playerName}\nStat to extract: ${statType}\nSport: ${sport}\n\nSOURCE DATA (game logs from reference sites):\n${snippets.join('\n\n---\n\n')}\n\nINSTRUCTIONS:\n1. Find the game log table(s) in the source data above\n2. For EACH game row, extract the "${statType}" value AND the game date\n3. Return ALL games found (target: 20 most recent games)\n4. Order: oldest game first, newest game last\n5. If the stat column is labeled differently (e.g., "G" for Goals, "PTS" for Points, "AST" for Assists, "REB" for Rebounds, "3P" for 3-Pointers), still extract it\n6. Return numeric values only (0 is valid)\n7. For each game, include the date string as found in the source (e.g., "2025-03-01", "Mar 1", etc.)`,
          },
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'extract_stat_values',
              description: `Extract numeric ${statType} values and dates from the player's recent game log`,
              parameters: {
                type: 'object',
                additionalProperties: false,
                required: ['games', 'gamesFound'],
                properties: {
                  games: {
                    type: 'array',
                    description: 'Array of game entries with date and stat value, oldest first',
                    items: {
                      type: 'object',
                      properties: {
                        date: { type: 'string', description: 'Game date as found in the source' },
                        value: { type: 'number', description: `The ${statType} value for this game` },
                      },
                      required: ['date', 'value'],
                    },
                  },
                  gamesFound: {
                    type: 'number',
                    description: 'Number of games with data found',
                  },
                },
              },
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'extract_stat_values' } },
      }),
    });

    if (!aiResp.ok) {
      console.error(`AI extraction failed: ${aiResp.status}`);
      return new Response(
        JSON.stringify({ success: false, error: 'Extraction failed' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiPayload = await aiResp.json();
    const toolArgs = aiPayload?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    
    let parsed: any;
    try {
      parsed = typeof toolArgs === 'string' ? JSON.parse(toolArgs) : toolArgs;
    } catch {
      parsed = null;
    }

    if (!parsed?.games || !Array.isArray(parsed.games)) {
      // Fallback: check for legacy statValues format
      if (parsed?.statValues && Array.isArray(parsed.statValues)) {
        const statValues = parsed.statValues
          .filter((v: any) => typeof v === 'number' && Number.isFinite(v))
          .slice(-20);
        const results = statValues.map((val: number) => val >= line);
        const hitCount = results.filter(Boolean).length;

        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        await supabase.from('odds_cache').upsert({
          id: cacheKey,
          data: { statValues, playerName, statType, sport, fetchedAt: new Date().toISOString() },
          expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        });

        return new Response(
          JSON.stringify({ success: true, results, statValues, hitCount, total: statValues.length, source: 'live' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: false, error: 'Could not extract stat values' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sort games by date (oldest first) to ensure correct chronological order
    const currentYear = new Date().getFullYear();
    const sortedGames = parsed.games
      .filter((g: any) => typeof g.value === 'number' && Number.isFinite(g.value))
      .map((g: any) => {
        // Try to parse the date string into a sortable timestamp
        let dateStr = g.date || '';
        // If date lacks a year, prepend current year
        if (dateStr && !/\d{4}/.test(dateStr)) {
          dateStr = `${currentYear} ${dateStr}`;
        }
        const ts = new Date(dateStr).getTime();
        return { value: g.value as number, date: dateStr, ts: isNaN(ts) ? 0 : ts };
      })
      .sort((a: any, b: any) => a.ts - b.ts)
      .slice(-20);

    // Take last 20 values in chronological order
    const statValues = sortedGames.map((g: any) => g.value);

    // Calculate hits against the line
    const results = statValues.map((val: number) => val >= line);
    const hitCount = results.filter(Boolean).length;

    // Cache the stat values (not the line-specific results)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    await supabase
      .from('odds_cache')
      .upsert({
        id: cacheKey,
        data: { statValues, playerName, statType, sport, fetchedAt: new Date().toISOString() },
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      });

    console.log(`Extracted ${statValues.length} stat values for ${playerName} ${statType}`);

    return new Response(
      JSON.stringify({
        success: true,
        results,
        statValues,
        hitCount,
        total: statValues.length,
        source: 'live',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in get-player-game-log:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Service temporarily unavailable' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
