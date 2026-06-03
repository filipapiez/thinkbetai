// Automated SEO page generator. Runs daily via pg_cron.
// Builds: game previews (next 7d), game results, team pages, daily hub pages.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SPORT_KEYS: Record<string, { label: string; sport: string }> = {
  americanfootball_nfl: { label: "NFL", sport: "NFL" },
  basketball_nba: { label: "NBA", sport: "NBA" },
  baseball_mlb: { label: "MLB", sport: "MLB" },
  icehockey_nhl: { label: "NHL", sport: "NHL" },
  americanfootball_ncaaf: { label: "College Football", sport: "CFB" },
  basketball_ncaab: { label: "College Basketball", sport: "NCAAB" },
  soccer_epl: { label: "Premier League", sport: "Soccer" },
  soccer_usa_mls: { label: "MLS", sport: "Soccer" },
  mma_mixed_martial_arts: { label: "UFC/MMA", sport: "UFC" },
};

const DAILY_HUB_SPORTS = ["NFL", "NBA", "MLB", "NHL"] as const;

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 120);
}

function hashContent(obj: unknown): string {
  const str = JSON.stringify(obj);
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return h.toString(36);
}

interface OddsEvent {
  id: string;
  sport_key: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers?: any[];
}

async function fetchUpcomingGames(apiKey: string): Promise<OddsEvent[]> {
  const all: OddsEvent[] = [];
  const sports = Object.keys(SPORT_KEYS);
  await Promise.all(
    sports.map(async (sportKey) => {
      try {
        const url = `https://api.the-odds-api.com/v4/sports/${sportKey}/odds/?apiKey=${apiKey}&regions=us&markets=h2h,spreads,totals&oddsFormat=american&daysFrom=7`;
        const res = await fetch(url);
        if (!res.ok) return;
        const data: OddsEvent[] = await res.json();
        all.push(...data);
      } catch (e) {
        console.error(`[seo] fetch failed for ${sportKey}:`, e);
      }
    }),
  );
  return all;
}

async function fetchRecentScores(apiKey: string): Promise<any[]> {
  const all: any[] = [];
  const sports = Object.keys(SPORT_KEYS);
  await Promise.all(
    sports.map(async (sportKey) => {
      try {
        const url = `https://api.the-odds-api.com/v4/sports/${sportKey}/scores/?apiKey=${apiKey}&daysFrom=2`;
        const res = await fetch(url);
        if (!res.ok) return;
        const data: any[] = await res.json();
        all.push(...data.map((d) => ({ ...d, sport_key: sportKey })));
      } catch {/* ignore */}
    }),
  );
  return all;
}

function buildGamePreview(ev: OddsEvent) {
  const meta = SPORT_KEYS[ev.sport_key];
  if (!meta) return null;
  const gameDate = new Date(ev.commence_time);
  const dateStr = gameDate.toISOString().slice(0, 10);
  const slug = `${meta.sport.toLowerCase()}-${slugify(ev.away_team)}-vs-${slugify(ev.home_team)}-${dateStr}`;

  // Pull a best-line snapshot
  const dk = ev.bookmakers?.find((b: any) => b.key === "draftkings") || ev.bookmakers?.[0];
  const h2h = dk?.markets?.find((m: any) => m.key === "h2h")?.outcomes ?? [];
  const spreads = dk?.markets?.find((m: any) => m.key === "spreads")?.outcomes ?? [];
  const totals = dk?.markets?.find((m: any) => m.key === "totals")?.outcomes ?? [];

  const title = `${ev.away_team} vs ${ev.home_team} Prediction & Odds — ${gameDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} | ThinkBetAI`;
  const meta_description = `AI-powered prediction for ${ev.away_team} vs ${ev.home_team}. Latest ${meta.label} odds, spreads, totals, injuries and expert betting analysis.`;
  const h1 = `${ev.away_team} vs ${ev.home_team} Prediction & Betting Analysis`;

  const content = {
    awayTeam: ev.away_team,
    homeTeam: ev.home_team,
    sport: meta.sport,
    league: meta.label,
    commenceTime: ev.commence_time,
    odds: { moneyline: h2h, spreads, totals, book: dk?.title ?? null },
    internalLinks: [
      { label: `${meta.label} Best Bets Today`, href: `/best/best-${meta.sport.toLowerCase()}-bets-today` },
      { label: `${ev.away_team} team page`, href: `/teams/${slugify(ev.away_team)}` },
      { label: `${ev.home_team} team page`, href: `/teams/${slugify(ev.home_team)}` },
      { label: "All games", href: "/games" },
    ],
  };

  return {
    slug,
    page_type: "game_preview",
    sport: meta.sport,
    entity_id: ev.id,
    title,
    meta_description,
    h1,
    content_json: content,
    status: "upcoming",
    game_date: dateStr,
    last_data_hash: hashContent(content.odds),
  };
}

function buildGameResult(score: any) {
  const meta = SPORT_KEYS[score.sport_key];
  if (!meta || !score.completed) return null;
  const gameDate = new Date(score.commence_time);
  const dateStr = gameDate.toISOString().slice(0, 10);
  const slug = `${meta.sport.toLowerCase()}-${slugify(score.away_team)}-vs-${slugify(score.home_team)}-${dateStr}`;

  const away = score.scores?.find((s: any) => s.name === score.away_team)?.score;
  const home = score.scores?.find((s: any) => s.name === score.home_team)?.score;

  const title = `${score.away_team} ${away ?? ""}–${home ?? ""} ${score.home_team} Final Score & Recap | ThinkBetAI`;
  const meta_description = `Final score and betting recap: ${score.away_team} ${away ?? ""} - ${home ?? ""} ${score.home_team}. ${meta.label} results and analysis.`;

  const content = {
    awayTeam: score.away_team,
    homeTeam: score.home_team,
    awayScore: away,
    homeScore: home,
    sport: meta.sport,
    league: meta.label,
    completedAt: score.last_update,
    internalLinks: [
      { label: `${score.away_team} team page`, href: `/teams/${slugify(score.away_team)}` },
      { label: `${score.home_team} team page`, href: `/teams/${slugify(score.home_team)}` },
    ],
  };

  return {
    slug,
    page_type: "game_result",
    sport: meta.sport,
    entity_id: score.id,
    title,
    meta_description,
    h1: `${score.away_team} vs ${score.home_team} Final Score`,
    content_json: content,
    status: "final",
    game_date: dateStr,
    last_data_hash: hashContent({ a: away, h: home }),
  };
}

function buildTeamPage(team: string, sport: string, upcoming: OddsEvent[]) {
  const slug = slugify(team);
  const teamGames = upcoming
    .filter((g) => g.home_team === team || g.away_team === team)
    .slice(0, 10);

  const title = `${team} Predictions, Odds & Betting Analysis | ThinkBetAI`;
  const meta_description = `AI-powered ${team} predictions, latest odds, injuries and expert betting analysis for all upcoming ${sport} games.`;

  const content = {
    team,
    sport,
    upcomingGames: teamGames.map((g) => ({
      opponent: g.home_team === team ? g.away_team : g.home_team,
      home: g.home_team === team,
      commenceTime: g.commence_time,
      slug: `${sport.toLowerCase()}-${slugify(g.away_team)}-vs-${slugify(g.home_team)}-${g.commence_time.slice(0, 10)}`,
    })),
    internalLinks: [
      { label: `${sport} Best Bets Today`, href: `/best/best-${sport.toLowerCase()}-bets-today` },
      { label: "All games", href: "/games" },
    ],
  };

  return {
    slug,
    page_type: "team",
    sport,
    entity_id: slug,
    title,
    meta_description,
    h1: `${team} Betting Predictions & Odds`,
    content_json: content,
    status: "upcoming",
    game_date: null,
    last_data_hash: hashContent(content.upcomingGames),
  };
}

function buildDailyHub(sport: string, todaysGames: OddsEvent[]) {
  const slug = `best-${sport.toLowerCase()}-bets-today`;
  const today = new Date().toISOString().slice(0, 10);
  const title = `Best ${sport} Bets Today — AI Picks for ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric" })} | ThinkBetAI`;
  const meta_description = `Today's best AI-powered ${sport} betting picks, predictions, and value plays. Updated daily with the latest odds and injuries.`;

  const content = {
    sport,
    date: today,
    games: todaysGames.slice(0, 12).map((g) => ({
      away: g.away_team,
      home: g.home_team,
      commenceTime: g.commence_time,
      slug: `${sport.toLowerCase()}-${slugify(g.away_team)}-vs-${slugify(g.home_team)}-${g.commence_time.slice(0, 10)}`,
    })),
    internalLinks: [
      { label: "All games", href: "/games" },
      { label: "Player props", href: "/player-props" },
      { label: "Parlay builder", href: "/parlays" },
    ],
  };

  return {
    slug,
    page_type: "daily_best",
    sport,
    entity_id: `${sport}-${today}`,
    title,
    meta_description,
    h1: `Best ${sport} Bets Today`,
    content_json: content,
    status: "upcoming",
    game_date: today,
    last_data_hash: hashContent(content.games),
  };
}

function buildPropsHub(sport: string) {
  const slug = `best-${sport.toLowerCase()}-player-props-today`;
  const today = new Date().toISOString().slice(0, 10);
  return {
    slug,
    page_type: "daily_best",
    sport,
    entity_id: `${sport}-props-${today}`,
    title: `Best ${sport} Player Props Today — AI Picks | ThinkBetAI`,
    meta_description: `Today's top ${sport} player prop bets with AI predictions, hit rates and expert analysis.`,
    h1: `Best ${sport} Player Props Today`,
    content_json: {
      sport,
      date: today,
      internalLinks: [
        { label: "Player props home", href: "/player-props" },
        { label: `${sport} best bets`, href: `/best/best-${sport.toLowerCase()}-bets-today` },
      ],
    },
    status: "upcoming",
    game_date: today,
    last_data_hash: today,
  };
}

function buildParlaysHub() {
  const today = new Date().toISOString().slice(0, 10);
  return {
    slug: "best-parlays-today",
    page_type: "daily_best",
    sport: null,
    entity_id: `parlays-${today}`,
    title: `Best Parlays Today — AI-Built Multi-Leg Picks | ThinkBetAI`,
    meta_description: `Today's highest-EV AI parlays across NFL, NBA, MLB and NHL. Updated daily with live odds and analysis.`,
    h1: `Best Parlays Today`,
    content_json: {
      date: today,
      internalLinks: [
        { label: "Build your own parlay", href: "/parlays" },
        { label: "All games", href: "/games" },
      ],
    },
    status: "upcoming",
    game_date: today,
    last_data_hash: today,
  };
}

interface PageUpsert {
  slug: string;
  page_type: string;
  sport: string | null;
  entity_id: string | null;
  title: string;
  meta_description: string;
  h1: string;
  content_json: any;
  status: string;
  game_date: string | null;
  last_data_hash: string;
}

async function upsertPages(
  supabase: any,
  pages: PageUpsert[],
  runId: string,
): Promise<{ created: number; updated: number; failed: number }> {
  let created = 0, updated = 0, failed = 0;
  for (const p of pages) {
    try {
      const { data: existing } = await supabase
        .from("seo_pages")
        .select("id, last_data_hash")
        .eq("slug", p.slug)
        .maybeSingle();
      if (existing) {
        if (existing.last_data_hash !== p.last_data_hash) {
          const { error } = await supabase
            .from("seo_pages")
            .update({
              title: p.title,
              meta_description: p.meta_description,
              h1: p.h1,
              content_json: p.content_json,
              status: p.status,
              game_date: p.game_date,
              last_data_hash: p.last_data_hash,
              page_type: p.page_type,
            })
            .eq("id", existing.id);
          if (error) throw error;
          updated++;
        }
      } else {
        const { error } = await supabase.from("seo_pages").insert(p);
        if (error) throw error;
        created++;
      }
    } catch (e: any) {
      failed++;
      await supabase.from("seo_page_errors").insert({
        slug: p.slug,
        page_type: p.page_type,
        reason: e?.message ?? String(e),
        run_id: runId,
      });
    }
  }
  return { created, updated, failed };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  const { data: run } = await supabase
    .from("seo_run_logs")
    .insert({ job_name: "seo-generate-daily", status: "running" })
    .select()
    .single();
  const runId = run?.id;

  try {
    const apiKey = Deno.env.get("THE_ODDS_API_KEY");
    if (!apiKey) throw new Error("THE_ODDS_API_KEY not set");

    console.log("[seo] fetching upcoming games...");
    const upcoming = await fetchUpcomingGames(apiKey);
    console.log(`[seo] upcoming=${upcoming.length}`);
    const scores = await fetchRecentScores(apiKey);
    console.log(`[seo] scores=${scores.length}`);

    const pages: PageUpsert[] = [];

    // 1. Game previews
    for (const ev of upcoming) {
      const p = buildGamePreview(ev);
      if (p) pages.push(p as PageUpsert);
    }
    // 2. Game results
    for (const s of scores) {
      const p = buildGameResult(s);
      if (p) pages.push(p as PageUpsert);
    }
    // 3. Team pages (unique teams)
    const teamMap = new Map<string, string>(); // team -> sport
    for (const ev of upcoming) {
      const meta = SPORT_KEYS[ev.sport_key];
      if (!meta) continue;
      teamMap.set(ev.home_team, meta.sport);
      teamMap.set(ev.away_team, meta.sport);
    }
    for (const [team, sport] of teamMap) {
      pages.push(buildTeamPage(team, sport, upcoming) as PageUpsert);
    }
    // 4. Daily hub pages
    const todayStr = new Date().toISOString().slice(0, 10);
    for (const sport of DAILY_HUB_SPORTS) {
      const todays = upcoming.filter((g) => {
        const meta = SPORT_KEYS[g.sport_key];
        return meta?.sport === sport && g.commence_time.slice(0, 10) === todayStr;
      });
      pages.push(buildDailyHub(sport, todays) as PageUpsert);
      pages.push(buildPropsHub(sport) as PageUpsert);
    }
    pages.push(buildParlaysHub() as PageUpsert);

    console.log(`[seo] upserting ${pages.length} pages`);
    const stats = await upsertPages(supabase, pages, runId);

    // Flip overdue upcoming pages to stale if game_date is in the past and no result was generated
    await supabase
      .from("seo_pages")
      .update({ status: "stale" })
      .eq("status", "upcoming")
      .lt("game_date", todayStr)
      .neq("page_type", "team")
      .neq("page_type", "daily_best");

    const next = new Date();
    next.setUTCDate(next.getUTCDate() + 1);
    next.setUTCHours(0, 1, 0, 0);

    await supabase
      .from("seo_run_logs")
      .update({
        status: "success",
        finished_at: new Date().toISOString(),
        pages_created: stats.created,
        pages_updated: stats.updated,
        pages_failed: stats.failed,
        next_run_at: next.toISOString(),
      })
      .eq("id", runId);

    return new Response(
      JSON.stringify({ ok: true, runId, ...stats, totalProcessed: pages.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    console.error("[seo] FAILED", e);
    await supabase
      .from("seo_run_logs")
      .update({
        status: "failed",
        finished_at: new Date().toISOString(),
        errors_json: { message: e?.message ?? String(e) },
      })
      .eq("id", runId);
    return new Response(
      JSON.stringify({ ok: false, error: e?.message ?? String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
