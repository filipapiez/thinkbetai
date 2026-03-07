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
      console.log(`Cache hit for ${playerName} ${statType}`);
      const cachedData = cached.data as any;
      // Recalculate hits against the current line (line may differ from cached)
      const results = (cachedData.statValues || []).map((val: number) => val >= line);
      return new Response(
        JSON.stringify({
          success: true,
          results,
          statValues: cachedData.statValues,
          hitCount: results.filter(Boolean).length,
          total: results.length,
          source: 'cached',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!firecrawlApiKey || !lovableApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Search services not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Search for player game log
    const currentYear = new Date().getFullYear();
    const sportNorm = (sport || 'nba').toLowerCase();
    const query = `${playerName} game log ${currentYear} ${statType} stats site:espn.com OR site:basketball-reference.com OR site:statmuse.com OR site:baseball-reference.com OR site:hockey-reference.com`;

    console.log(`Searching game log for ${playerName} (${statType})`);

    const searchResp = await fetch('https://api.firecrawl.dev/v1/search', {
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

    if (!searchResp.ok) {
      console.error(`Firecrawl search failed: ${searchResp.status}`);
      return new Response(
        JSON.stringify({ success: false, error: 'Search failed' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const searchData = await searchResp.json();
    const snippets = (searchData?.data || [])
      .slice(0, 5)
      .map((r: any) => {
        const md = (r?.markdown || r?.description || '').toString();
        return md.length > 3000 ? md.slice(0, 3000) : md;
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
            content: `You are a sports statistics expert. Extract the last 20 game stat values for a specific player and stat type from source snippets. Return ONLY numeric values from actual games. Do NOT fabricate data.`,
          },
          {
            role: 'user',
            content: `Player: ${playerName}\nStat: ${statType}\nSport: ${sport}\n\nSOURCE SNIPPETS:\n${snippets.join('\n\n---\n\n')}\n\nExtract the ${statType} values from ${playerName}'s last 20 games. If you can only find fewer games, return what you find. Return the values in chronological order (oldest first).`,
          },
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'extract_stat_values',
              description: `Extract numeric ${statType} values from the player's recent game log`,
              parameters: {
                type: 'object',
                additionalProperties: false,
                required: ['statValues', 'gamesFound'],
                properties: {
                  statValues: {
                    type: 'array',
                    description: `Array of numeric ${statType} values from recent games, oldest first`,
                    items: { type: 'number' },
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

    if (!parsed?.statValues || !Array.isArray(parsed.statValues)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Could not extract stat values' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Take last 20 values, ensure they're numbers
    const statValues = parsed.statValues
      .filter((v: any) => typeof v === 'number' && Number.isFinite(v))
      .slice(-20);

    // Calculate hits against the line
    // For "Over" props: hit = stat >= line. For simplicity, we return the raw values
    // and let the frontend decide based on direction
    const results = statValues.map((val: number) => val >= line);
    const hitCount = results.filter(Boolean).length;

    // Cache the stat values (not the line-specific results)
    const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();
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
