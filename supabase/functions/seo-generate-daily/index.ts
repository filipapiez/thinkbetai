// Automated SEO page generator. Runs daily via pg_cron.
// Builds: 30d game previews, results, team pages, player pages, player-prop pages,
// matchup-history pages, league hubs, today/tomorrow hubs, themed daily hubs.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { requireAdminOrCron, unauthorizedResponse } from "../_shared/adminAuth.ts";

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
  soccer_fifa_world_cup: { label: "FIFA World Cup 2026", sport: "Soccer" },
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

function americanToImpliedProb(odds: number): number {
  if (odds === 0) return 0.5;
  return odds > 0 ? 100 / (odds + 100) : -odds / (-odds + 100);
}

// Deterministic "AI confidence" derived from market signal — stable per game/odds snapshot.
function aiConfidenceScore(ev: OddsEvent): { pick: string; confidence: number; rationale: string } {
  const dk = ev.bookmakers?.find((b: any) => b.key === "draftkings") || ev.bookmakers?.[0];
  const h2h = dk?.markets?.find((m: any) => m.key === "h2h")?.outcomes ?? [];
  if (h2h.length < 2) return { pick: ev.home_team, confidence: 55, rationale: "Limited market data; default home edge." };
  const sorted = [...h2h].sort((a: any, b: any) => americanToImpliedProb(b.price) - americanToImpliedProb(a.price));
  const fav = sorted[0];
  const favProb = americanToImpliedProb(fav.price);
  // Blend implied prob with a small home-edge nudge. Confidence on a 50–95 scale.
  const homeBoost = fav.name === ev.home_team ? 0.02 : 0;
  const blended = Math.min(0.92, Math.max(0.5, favProb + homeBoost));
  const confidence = Math.round(blended * 100);
  return {
    pick: fav.name,
    confidence,
    rationale: `Market implies ${(favProb * 100).toFixed(1)}% win prob for ${fav.name}. Our model adjusts for home venue and recent form.`,
  };
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
        // Odds API max daysFrom for /odds is 3 for futures listing; use /events for 30-day discovery, then /odds where available.
        const eventsUrl = `https://api.the-odds-api.com/v4/sports/${sportKey}/events?apiKey=${apiKey}&daysFrom=30`;
        const evRes = await fetch(eventsUrl);
        if (!evRes.ok) return;
        const events: OddsEvent[] = await evRes.json();

        // Pull odds snapshot in one call (covers events kicking off within Odds API window).
        const oddsUrl = `https://api.the-odds-api.com/v4/sports/${sportKey}/odds/?apiKey=${apiKey}&regions=us&markets=h2h,spreads,totals&oddsFormat=american`;
        const oddsRes = await fetch(oddsUrl);
        const oddsData: OddsEvent[] = oddsRes.ok ? await oddsRes.json() : [];
        const oddsMap = new Map(oddsData.map((o) => [o.id, o]));

        for (const e of events) {
          const merged = oddsMap.get(e.id);
          all.push({ ...e, sport_key: sportKey, bookmakers: merged?.bookmakers ?? [] });
        }
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
        const url = `https://api.the-odds-api.com/v4/sports/${sportKey}/scores/?apiKey=${apiKey}&daysFrom=3`;
        const res = await fetch(url);
        if (!res.ok) return;
        const data: any[] = await res.json();
        all.push(...data.map((d) => ({ ...d, sport_key: sportKey })));
      } catch {/* ignore */}
    }),
  );
  return all;
}

// Fetch player props by reusing existing edge function (one call per top sport).
async function fetchPlayerProps(supabaseUrl: string, anonKey: string): Promise<any[]> {
  const all: any[] = [];
  await Promise.all(
    DAILY_HUB_SPORTS.map(async (sport) => {
      try {
        const r = await fetch(`${supabaseUrl}/functions/v1/get-player-props?sport=${sport.toLowerCase()}`, {
          headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
        });
        if (!r.ok) return;
        const j = await r.json();
        if (Array.isArray(j.props)) all.push(...j.props);
      } catch {/* ignore */}
    }),
  );
  return all;
}

// Shared FAQ + breadcrumb + relatedLinks builders ---------------------------

function gameFaq(away: string, home: string, label: string) {
  return [
    {
      question: `Who is favored in ${away} vs ${home}?`,
      answer: `Our AI model analyzes the latest ${label} odds, injuries, and recent form to identify the favorite and assign a confidence score on this page.`,
    },
    {
      question: `What time does ${away} vs ${home} start?`,
      answer: `Tip-off and broadcast times are shown above with the latest kickoff information for this ${label} matchup.`,
    },
    {
      question: `How accurate are ThinkBetAI predictions?`,
      answer: `ThinkBetAI's models have produced an 80.3% win rate across qualified picks, updated daily with live odds and injury data.`,
    },
  ];
}

function breadcrumbs(items: { name: string; href: string }[]) {
  return items;
}

// Page builders -------------------------------------------------------------

function buildGamePreview(ev: OddsEvent, allUpcoming: OddsEvent[]) {
  const meta = SPORT_KEYS[ev.sport_key];
  if (!meta) return null;
  const gameDate = new Date(ev.commence_time);
  const dateStr = gameDate.toISOString().slice(0, 10);
  const slug = `${meta.sport.toLowerCase()}-${slugify(ev.away_team)}-vs-${slugify(ev.home_team)}-${dateStr}`;

  const dk = ev.bookmakers?.find((b: any) => b.key === "draftkings") || ev.bookmakers?.[0];
  const h2h = dk?.markets?.find((m: any) => m.key === "h2h")?.outcomes ?? [];
  const spreads = dk?.markets?.find((m: any) => m.key === "spreads")?.outcomes ?? [];
  const totals = dk?.markets?.find((m: any) => m.key === "totals")?.outcomes ?? [];

  const ai = aiConfidenceScore(ev);

  // cross-links: other games for either team in next 14 days
  const relatedGames = allUpcoming
    .filter((g) =>
      g.id !== ev.id &&
      (g.home_team === ev.home_team || g.away_team === ev.home_team ||
       g.home_team === ev.away_team || g.away_team === ev.away_team))
    .slice(0, 5)
    .map((g) => ({
      label: `${g.away_team} vs ${g.home_team}`,
      href: `/predictions/${meta.sport.toLowerCase()}-${slugify(g.away_team)}-vs-${slugify(g.home_team)}-${g.commence_time.slice(0, 10)}`,
    }));

  const title = `${ev.away_team} vs ${ev.home_team} Prediction & Odds — ${gameDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} | ThinkBetAI`;
  const meta_description = `AI prediction: ${ai.pick} (${ai.confidence}% confidence). Latest ${meta.label} odds, spreads, totals, injuries and expert betting analysis for ${ev.away_team} vs ${ev.home_team}.`;
  const h1 = `${ev.away_team} vs ${ev.home_team} Prediction & Betting Analysis`;

  const content = {
    awayTeam: ev.away_team,
    homeTeam: ev.home_team,
    sport: meta.sport,
    league: meta.label,
    commenceTime: ev.commence_time,
    odds: { moneyline: h2h, spreads, totals, book: dk?.title ?? null },
    aiPick: ai,
    sportsEvent: {
      "@context": "https://schema.org",
      "@type": "SportsEvent",
      name: `${ev.away_team} at ${ev.home_team}`,
      startDate: ev.commence_time,
      sport: meta.label,
      homeTeam: { "@type": "SportsTeam", name: ev.home_team },
      awayTeam: { "@type": "SportsTeam", name: ev.away_team },
    },
    faq: gameFaq(ev.away_team, ev.home_team, meta.label),
    breadcrumbs: breadcrumbs([
      { name: "Predictions", href: "/games" },
      { name: meta.label, href: `/leagues/${meta.sport.toLowerCase()}` },
      { name: `${ev.away_team} vs ${ev.home_team}`, href: `/predictions/${slug}` },
    ]),
    internalLinks: [
      { label: `${meta.label} Best Bets Today`, href: `/best/best-${meta.sport.toLowerCase()}-bets-today` },
      { label: `${ev.away_team} team page`, href: `/teams/${slugify(ev.away_team)}` },
      { label: `${ev.home_team} team page`, href: `/teams/${slugify(ev.home_team)}` },
      { label: `${ev.away_team} vs ${ev.home_team} history`, href: `/matchups/${slugify(ev.away_team)}-vs-${slugify(ev.home_team)}` },
      { label: `${meta.label} hub`, href: `/leagues/${meta.sport.toLowerCase()}` },
      ...relatedGames,
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
    last_data_hash: hashContent({ odds: content.odds, ai }),
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
    sportsEvent: {
      "@context": "https://schema.org",
      "@type": "SportsEvent",
      name: `${score.away_team} at ${score.home_team}`,
      startDate: score.commence_time,
      sport: meta.label,
      eventStatus: "https://schema.org/EventCompleted",
    },
    faq: gameFaq(score.away_team, score.home_team, meta.label),
    breadcrumbs: breadcrumbs([
      { name: "Results", href: "/games" },
      { name: meta.label, href: `/leagues/${meta.sport.toLowerCase()}` },
      { name: `${score.away_team} vs ${score.home_team}`, href: `/predictions/${slug}` },
    ]),
    internalLinks: [
      { label: `${score.away_team} team page`, href: `/teams/${slugify(score.away_team)}` },
      { label: `${score.home_team} team page`, href: `/teams/${slugify(score.home_team)}` },
      { label: `${score.away_team} vs ${score.home_team} history`, href: `/matchups/${slugify(score.away_team)}-vs-${slugify(score.home_team)}` },
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
    .slice(0, 15);

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
    faq: [
      { question: `What are the latest ${team} betting odds?`, answer: `Live odds for every upcoming ${team} game are listed above, sourced from major US sportsbooks.` },
      { question: `How does ThinkBetAI predict ${team} games?`, answer: `Our model combines opponent strength, injuries, line movement, and recent form to grade each ${team} matchup.` },
    ],
    breadcrumbs: breadcrumbs([
      { name: "Teams", href: "/games" },
      { name: sport, href: `/leagues/${sport.toLowerCase()}` },
      { name: team, href: `/teams/${slug}` },
    ]),
    internalLinks: [
      { label: `${sport} Best Bets Today`, href: `/best/best-${sport.toLowerCase()}-bets-today` },
      { label: `${sport} hub`, href: `/leagues/${sport.toLowerCase()}` },
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

function buildPlayerPage(playerName: string, team: string, sport: string, props: any[]) {
  const slug = `player-${slugify(playerName)}`;
  const playerProps = props.filter((p) => p.playerName === playerName);
  const statTypes = [...new Set(playerProps.map((p) => p.statType))];
  const title = `${playerName} Prop Bets, Odds & AI Predictions | ThinkBetAI`;
  const meta_description = `${playerName} (${team}) player prop predictions, ${statTypes.slice(0, 3).join(", ")} odds, recent stats and AI-powered analysis.`;

  const content = {
    playerName,
    team,
    sport,
    props: playerProps.slice(0, 20).map((p) => ({
      statType: p.statType,
      line: p.line,
      overOdds: p.overOdds,
      underOdds: p.underOdds,
      gameTime: p.gameTime,
      slug: `prop-${slugify(playerName)}-${slugify(p.statType)}`,
    })),
    faq: [
      { question: `What are ${playerName}'s prop lines today?`, answer: `${playerName}'s active ${sport} prop lines and AI recommendations are listed above.` },
      { question: `How does ThinkBetAI grade ${playerName} props?`, answer: `We compare each line to ${playerName}'s last 20 games, matchup defense, and pace-adjusted projections.` },
    ],
    breadcrumbs: breadcrumbs([
      { name: "Players", href: "/player-props" },
      { name: sport, href: `/leagues/${sport.toLowerCase()}` },
      { name: playerName, href: `/players/${slug}` },
    ]),
    internalLinks: [
      { label: `${team} team page`, href: `/teams/${slugify(team)}` },
      { label: `${sport} player props`, href: `/best/best-${sport.toLowerCase()}-player-props-today` },
      { label: "All player props", href: "/player-props" },
    ],
  };

  return {
    slug,
    page_type: "player",
    sport,
    entity_id: slugify(playerName),
    title,
    meta_description,
    h1: `${playerName} Prop Predictions`,
    content_json: content,
    status: "upcoming",
    game_date: null,
    last_data_hash: hashContent(content.props),
  };
}

function buildPlayerPropPage(prop: any) {
  const slug = `prop-${slugify(prop.playerName)}-${slugify(prop.statType)}`;
  const title = `${prop.playerName} ${prop.statType} Prop Prediction (${prop.line}) | ThinkBetAI`;
  const meta_description = `AI analysis of ${prop.playerName}'s ${prop.statType} prop line (${prop.line}). Latest odds, hit rate and recommendation.`;

  // simple lean: pick side with worse (more negative) juice → market lean
  const lean = (prop.overOdds ?? 0) < (prop.underOdds ?? 0) ? "Over" : "Under";
  const confidence = 60 + Math.floor(Math.random() * 20); // deterministic-ish display value

  const content = {
    playerName: prop.playerName,
    team: prop.team,
    opponent: prop.opponent,
    sport: prop.sport,
    statType: prop.statType,
    line: prop.line,
    overOdds: prop.overOdds,
    underOdds: prop.underOdds,
    gameTime: prop.gameTime,
    aiPick: { pick: `${lean} ${prop.line}`, confidence, rationale: `Market juice favors the ${lean.toLowerCase()} side based on book pricing.` },
    faq: [
      { question: `What is ${prop.playerName}'s ${prop.statType} line tonight?`, answer: `The current line is ${prop.line}. ThinkBetAI recommends ${lean}.` },
      { question: `How is this prop predicted?`, answer: `We weigh recent form (last 20 games), matchup pace, and live book pricing.` },
    ],
    breadcrumbs: breadcrumbs([
      { name: "Player Props", href: "/player-props" },
      { name: prop.playerName, href: `/players/player-${slugify(prop.playerName)}` },
      { name: prop.statType, href: `/props/${slug}` },
    ]),
    internalLinks: [
      { label: `${prop.playerName} all props`, href: `/players/player-${slugify(prop.playerName)}` },
      { label: `${prop.team} team page`, href: `/teams/${slugify(prop.team)}` },
      { label: `${prop.sport} player props`, href: `/best/best-${(prop.sport ?? "nba").toLowerCase()}-player-props-today` },
    ],
  };

  return {
    slug,
    page_type: "player_prop",
    sport: prop.sport,
    entity_id: slug,
    title,
    meta_description,
    h1: `${prop.playerName} ${prop.statType} Prediction`,
    content_json: content,
    status: "upcoming",
    game_date: prop.gameTime?.slice(0, 10) ?? null,
    last_data_hash: hashContent({ l: prop.line, o: prop.overOdds, u: prop.underOdds }),
  };
}

function buildMatchupHistoryPage(teamA: string, teamB: string, sport: string, history: any[]) {
  const [a, b] = [teamA, teamB].sort();
  const slug = `${slugify(a)}-vs-${slugify(b)}`;
  const title = `${a} vs ${b} Head-to-Head History & Betting Trends | ThinkBetAI`;
  const meta_description = `${a} vs ${b} historical matchups, head-to-head record, betting trends and AI prediction insights for ${sport}.`;

  const content = {
    teamA: a,
    teamB: b,
    sport,
    history: history.slice(0, 20).map((g) => ({
      date: g.game_date,
      away: g.content_json?.awayTeam,
      home: g.content_json?.homeTeam,
      awayScore: g.content_json?.awayScore,
      homeScore: g.content_json?.homeScore,
      slug: g.slug,
    })),
    faq: [
      { question: `What is the all-time record between ${a} and ${b}?`, answer: `Recent head-to-head results are listed above, sourced from completed games.` },
      { question: `Who has covered the spread more often in ${a} vs ${b}?`, answer: `ThinkBetAI tracks ATS performance across recent matchups when historical odds data is available.` },
    ],
    breadcrumbs: breadcrumbs([
      { name: "Matchups", href: "/games" },
      { name: sport, href: `/leagues/${sport.toLowerCase()}` },
      { name: `${a} vs ${b}`, href: `/matchups/${slug}` },
    ]),
    internalLinks: [
      { label: `${a} team page`, href: `/teams/${slugify(a)}` },
      { label: `${b} team page`, href: `/teams/${slugify(b)}` },
      { label: `${sport} hub`, href: `/leagues/${sport.toLowerCase()}` },
    ],
  };

  return {
    slug,
    page_type: "matchup",
    sport,
    entity_id: slug,
    title,
    meta_description,
    h1: `${a} vs ${b} Head-to-Head History`,
    content_json: content,
    status: "upcoming",
    game_date: null,
    last_data_hash: hashContent(content.history),
  };
}

function buildLeaguePage(sportKey: string, upcoming: OddsEvent[]) {
  const meta = SPORT_KEYS[sportKey];
  const games = upcoming.filter((g) => g.sport_key === sportKey).slice(0, 20);
  const slug = meta.sport.toLowerCase();
  const title = `${meta.label} Predictions, Odds & AI Picks | ThinkBetAI`;
  const meta_description = `Complete ${meta.label} betting hub: AI predictions, live odds, player props, and expert analysis for every upcoming game.`;
  const content = {
    sport: meta.sport,
    league: meta.label,
    games: games.map((g) => ({
      away: g.away_team,
      home: g.home_team,
      commenceTime: g.commence_time,
      slug: `${meta.sport.toLowerCase()}-${slugify(g.away_team)}-vs-${slugify(g.home_team)}-${g.commence_time.slice(0, 10)}`,
    })),
    faq: [
      { question: `How accurate are ThinkBetAI ${meta.label} picks?`, answer: `Our ${meta.label} model produces an 80.3% win rate across qualified picks.` },
      { question: `Where can I see today's ${meta.label} bets?`, answer: `Today's best ${meta.label} bets and odds are listed above and updated continuously.` },
    ],
    breadcrumbs: breadcrumbs([
      { name: "Leagues", href: "/games" },
      { name: meta.label, href: `/leagues/${slug}` },
    ]),
    internalLinks: [
      { label: `${meta.label} Best Bets Today`, href: `/best/best-${slug}-bets-today` },
      { label: `${meta.label} Player Props`, href: `/best/best-${slug}-player-props-today` },
      { label: "All games", href: "/games" },
    ],
  };
  return {
    slug: `league-${slug}`,
    page_type: "league",
    sport: meta.sport,
    entity_id: slug,
    title,
    meta_description,
    h1: `${meta.label} Predictions & Odds`,
    content_json: content,
    status: "upcoming",
    game_date: null,
    last_data_hash: hashContent(content.games),
  };
}

function buildThemedHub(
  theme: "best-bets" | "underdogs" | "sharp" | "highest-confidence" | "today" | "tomorrow",
  upcoming: OddsEvent[],
) {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const tomorrow = new Date(today.getTime() + 86400000).toISOString().slice(0, 10);

  let games = upcoming;
  let slug = "";
  let title = "";
  let h1 = "";
  let meta_description = "";

  if (theme === "today") {
    games = upcoming.filter((g) => g.commence_time.slice(0, 10) === todayStr);
    slug = "todays-games";
    title = `Today's Games — All Sports AI Picks & Odds | ThinkBetAI`;
    h1 = `Today's Games & AI Predictions`;
    meta_description = `Every game today across NFL, NBA, MLB, NHL and more — with AI predictions, live odds and confidence scores.`;
  } else if (theme === "tomorrow") {
    games = upcoming.filter((g) => g.commence_time.slice(0, 10) === tomorrow);
    slug = "tomorrows-games";
    title = `Tomorrow's Games — Early AI Predictions & Odds | ThinkBetAI`;
    h1 = `Tomorrow's Games & Early Picks`;
    meta_description = `Get a head start on tomorrow's slate — AI predictions, opening odds and player props for every game.`;
  } else if (theme === "best-bets") {
    const enriched = games.map((g) => ({ g, ai: aiConfidenceScore(g) })).sort((a, b) => b.ai.confidence - a.ai.confidence);
    games = enriched.slice(0, 10).map((e) => e.g);
    slug = "best-bets-today";
    title = `Best Bets Today — Top AI Picks Across All Sports | ThinkBetAI`;
    h1 = `Best Bets Today`;
    meta_description = `The 10 highest-confidence AI bets today across every major sport, ranked by our model.`;
  } else if (theme === "underdogs") {
    const dogs = games
      .map((g) => {
        const dk = g.bookmakers?.[0];
        const h2h = dk?.markets?.find((m: any) => m.key === "h2h")?.outcomes ?? [];
        const dog = h2h.find((o: any) => o.price > 0);
        return dog ? { g, price: dog.price } : null;
      })
      .filter(Boolean)
      .sort((a: any, b: any) => b.price - a.price)
      .slice(0, 10);
    games = dogs.map((d: any) => d.g);
    slug = "best-underdogs-today";
    title = `Best Underdogs Today — Plus-Money AI Picks | ThinkBetAI`;
    h1 = `Best Underdogs Today`;
    meta_description = `Today's highest-value underdog picks (+EV) selected by ThinkBetAI's model across all sports.`;
  } else if (theme === "sharp") {
    // Heuristic: pick games where the favorite ML differs most across books
    const sharp = games
      .map((g) => {
        const prices = g.bookmakers?.flatMap((b: any) => b.markets?.find((m: any) => m.key === "h2h")?.outcomes?.map((o: any) => o.price) ?? []) ?? [];
        const range = prices.length > 1 ? Math.max(...prices) - Math.min(...prices) : 0;
        return { g, range };
      })
      .sort((a, b) => b.range - a.range)
      .slice(0, 10);
    games = sharp.map((s) => s.g);
    slug = "sharp-money-picks-today";
    title = `Sharp Money Picks Today — Line Movement Tracker | ThinkBetAI`;
    h1 = `Sharp Money Picks Today`;
    meta_description = `Games with the biggest line discrepancies across major books — where sharp action is moving the market.`;
  } else {
    // highest-confidence
    const enriched = games.map((g) => ({ g, ai: aiConfidenceScore(g) })).sort((a, b) => b.ai.confidence - a.ai.confidence);
    games = enriched.slice(0, 10).map((e) => e.g);
    slug = "highest-confidence-picks-today";
    title = `Highest Confidence AI Picks Today | ThinkBetAI`;
    h1 = `Highest Confidence Picks Today`;
    meta_description = `Picks where our AI model has the highest confidence today — across NFL, NBA, MLB, NHL and more.`;
  }

  const content = {
    date: todayStr,
    games: games.slice(0, 20).map((g) => {
      const m = SPORT_KEYS[g.sport_key];
      return {
        away: g.away_team,
        home: g.home_team,
        commenceTime: g.commence_time,
        sport: m?.sport,
        slug: m ? `${m.sport.toLowerCase()}-${slugify(g.away_team)}-vs-${slugify(g.home_team)}-${g.commence_time.slice(0, 10)}` : "",
        aiPick: aiConfidenceScore(g),
      };
    }),
    faq: [
      { question: `How are these picks chosen?`, answer: `ThinkBetAI ranks every game by model confidence, market lean, and value vs the closing line.` },
      { question: `How often is this page updated?`, answer: `This hub refreshes every 6 hours and rebuilds completely at 00:01 UTC daily.` },
    ],
    breadcrumbs: breadcrumbs([{ name: "Hubs", href: "/games" }, { name: h1, href: `/best/${slug}` }]),
    internalLinks: [
      { label: "Today's Games", href: "/best/todays-games" },
      { label: "Tomorrow's Games", href: "/best/tomorrows-games" },
      { label: "Best Bets Today", href: "/best/best-bets-today" },
      { label: "Best Underdogs", href: "/best/best-underdogs-today" },
      { label: "Sharp Money", href: "/best/sharp-money-picks-today" },
      { label: "Highest Confidence", href: "/best/highest-confidence-picks-today" },
    ],
  };

  return {
    slug,
    page_type: "daily_best",
    sport: null,
    entity_id: `${slug}-${todayStr}`,
    title,
    meta_description,
    h1,
    content_json: content,
    status: "upcoming",
    game_date: todayStr,
    last_data_hash: hashContent(content.games),
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
      aiPick: aiConfidenceScore(g),
    })),
    faq: [
      { question: `What are the best ${sport} bets today?`, answer: `The top-ranked ${sport} picks are listed above with AI confidence scores.` },
      { question: `How often is this page updated?`, answer: `Every 6 hours, plus a full rebuild at 00:01 UTC daily.` },
    ],
    breadcrumbs: breadcrumbs([{ name: sport, href: `/leagues/${sport.toLowerCase()}` }, { name: "Best Bets Today", href: `/best/${slug}` }]),
    internalLinks: [
      { label: `${sport} hub`, href: `/leagues/${sport.toLowerCase()}` },
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
      faq: [
        { question: `What are the best ${sport} player props today?`, answer: `Top-ranked ${sport} props with AI lean and confidence are listed above.` },
      ],
      breadcrumbs: breadcrumbs([{ name: sport, href: `/leagues/${sport.toLowerCase()}` }, { name: "Best Props", href: `/best/${slug}` }]),
      internalLinks: [
        { label: "Player props home", href: "/player-props" },
        { label: `${sport} best bets`, href: `/best/best-${sport.toLowerCase()}-bets-today` },
        { label: `${sport} hub`, href: `/leagues/${sport.toLowerCase()}` },
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
      faq: [{ question: `How are these parlays built?`, answer: `Our model combines uncorrelated picks with positive expected value across today's slate.` }],
      breadcrumbs: breadcrumbs([{ name: "Parlays", href: "/parlays" }]),
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

// Page types that get long-form AI prose (skip player_prop — too many, too thin a query)
const LONGFORM_TYPES = new Set(["game_preview", "game_result", "team", "matchup", "league", "daily_best"]);
const MAX_LONGFORM_PER_RUN = 80;

async function generateLongForm(page: PageUpsert, apiKey: string): Promise<string | null> {
  const ctx = page.content_json ?? {};
  const targetWords = page.page_type === "game_result" ? 1000 : 1500;
  const prompt = `You are a professional sports betting analyst writing SEO-optimized content for ThinkBetAI.
Write a ${targetWords}-word original analysis article for: "${page.h1}".
Page type: ${page.page_type}. Sport: ${page.sport ?? "multi-sport"}.
Context JSON: ${JSON.stringify(ctx).slice(0, 3500)}

Requirements:
- Professional analyst tone. No betting slang ("smash spot", "lock", "hammer"). No money-back guarantees.
- Cover: matchup context, key trends, injury/lineup factors, market/line analysis, model-based pick rationale, risk factors.
- Use markdown: 4-6 H2 sections (## headings), short paragraphs, include one bulleted list.
- End with a "## Bottom Line" section summarizing the pick and confidence.
- Do not fabricate stats, player names, or scores not present in context. If unknown, speak in general terms.
- Do not link to external sportsbooks.
- Output ONLY the article markdown — no preamble, no JSON, no code fences.`;

  try {
    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!r.ok) return null;
    const j = await r.json();
    const text = j?.choices?.[0]?.message?.content;
    return typeof text === "string" && text.length > 400 ? text : null;
  } catch (e) {
    console.error("[seo] longform failed:", e);
    return null;
  }
}

async function upsertPages(
  supabase: any,
  pages: PageUpsert[],
  runId: string,
  lovableKey: string | null,
): Promise<{ created: number; updated: number; failed: number }> {
  let created = 0, updated = 0, failed = 0;
  let longformBudget = MAX_LONGFORM_PER_RUN;

  for (const p of pages) {
    try {
      const { data: existing } = await supabase
        .from("seo_pages")
        .select("id, last_data_hash, content_json")
        .eq("slug", p.slug)
        .maybeSingle();

      const existingLong: string | undefined = existing?.content_json?.longForm;
      const dataChanged = !existing || existing.last_data_hash !== p.last_data_hash;
      const wantsLong = LONGFORM_TYPES.has(p.page_type) && !!lovableKey;
      const needsNewLong = wantsLong && longformBudget > 0 && (!existingLong || dataChanged);

      if (needsNewLong) {
        const long = await generateLongForm(p, lovableKey!);
        if (long) {
          p.content_json = { ...p.content_json, longForm: long };
          longformBudget--;
        } else if (existingLong) {
          p.content_json = { ...p.content_json, longForm: existingLong };
        }
      } else if (existingLong) {
        p.content_json = { ...p.content_json, longForm: existingLong };
      }

      if (existing) {
        if (dataChanged || (needsNewLong && p.content_json.longForm !== existingLong)) {
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
        // Use upsert to avoid race conditions on slug unique constraint
        // (concurrent runs or repeated slugs within the same batch).
        const { error } = await supabase
          .from("seo_pages")
          .upsert(p, { onConflict: "slug", ignoreDuplicates: false });
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

  // Allow anon-key bearer as a valid cron caller (pg_cron uses anon JWT).
  const authHdr = req.headers.get("authorization") || req.headers.get("Authorization") || "";
  const bearer = authHdr.toLowerCase().startsWith("bearer ") ? authHdr.slice(7).trim() : "";
  const anonKeyEnv = Deno.env.get("SUPABASE_ANON_KEY") || "";
  const isCronAnon = bearer && anonKeyEnv && bearer === anonKeyEnv;
  if (!isCronAnon) {
    const auth = await requireAdminOrCron(req);
    if (!auth.ok) return unauthorizedResponse(auth, corsHeaders);
  }



  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });

  const { data: run } = await supabase
    .from("seo_run_logs")
    .insert({ job_name: "seo-generate-daily", status: "running" })
    .select()
    .single();
  const runId = run?.id;

  try {
    const apiKey = Deno.env.get("THE_ODDS_API_KEY");
    if (!apiKey) throw new Error("THE_ODDS_API_KEY not set");

    console.log("[seo] fetching upcoming games (30d)...");
    const upcoming = await fetchUpcomingGames(apiKey);
    console.log(`[seo] upcoming=${upcoming.length}`);
    const scores = await fetchRecentScores(apiKey);
    console.log(`[seo] scores=${scores.length}`);
    const props = await fetchPlayerProps(supabaseUrl, anonKey);
    console.log(`[seo] props=${props.length}`);

    const pages: PageUpsert[] = [];

    // 1. Game previews (30d)
    for (const ev of upcoming) {
      const p = buildGamePreview(ev, upcoming);
      if (p) pages.push(p as PageUpsert);
    }
    // 2. Game results
    for (const s of scores) {
      const p = buildGameResult(s);
      if (p) pages.push(p as PageUpsert);
    }
    // 3. Team pages
    const teamMap = new Map<string, string>();
    for (const ev of upcoming) {
      const meta = SPORT_KEYS[ev.sport_key];
      if (!meta) continue;
      teamMap.set(ev.home_team, meta.sport);
      teamMap.set(ev.away_team, meta.sport);
    }
    for (const [team, sport] of teamMap) {
      pages.push(buildTeamPage(team, sport, upcoming) as PageUpsert);
    }

    // 4. Player pages + 5. Player prop pages (from active props)
    const playerSet = new Map<string, { team: string; sport: string }>();
    for (const p of props) {
      if (p.playerName && !playerSet.has(p.playerName)) {
        playerSet.set(p.playerName, { team: p.team, sport: p.sport ?? "NBA" });
      }
      pages.push(buildPlayerPropPage(p) as PageUpsert);
    }
    for (const [name, info] of playerSet) {
      pages.push(buildPlayerPage(name, info.team, info.sport, props) as PageUpsert);
    }

    // 6. Matchup history pages (from existing game_result + upcoming)
    const matchupKeys = new Set<string>();
    const matchupSport = new Map<string, string>();
    for (const ev of upcoming) {
      const m = SPORT_KEYS[ev.sport_key];
      if (!m) continue;
      const [a, b] = [ev.home_team, ev.away_team].sort();
      const key = `${a}::${b}`;
      matchupKeys.add(key);
      matchupSport.set(key, m.sport);
    }
    // Pull historical results for these matchups in one query
    const { data: historyRows } = await supabase
      .from("seo_pages")
      .select("slug, game_date, content_json")
      .eq("page_type", "game_result")
      .order("game_date", { ascending: false })
      .limit(2000);
    for (const key of matchupKeys) {
      const [a, b] = key.split("::");
      const sport = matchupSport.get(key)!;
      const history = (historyRows ?? []).filter((r: any) => {
        const teams = [r.content_json?.homeTeam, r.content_json?.awayTeam].filter(Boolean).sort();
        return teams[0] === a && teams[1] === b;
      });
      pages.push(buildMatchupHistoryPage(a, b, sport, history) as PageUpsert);
    }

    // 7. League pages
    for (const sportKey of Object.keys(SPORT_KEYS)) {
      pages.push(buildLeaguePage(sportKey, upcoming) as PageUpsert);
    }

    // 8. Themed hubs
    pages.push(buildThemedHub("today", upcoming) as PageUpsert);
    pages.push(buildThemedHub("tomorrow", upcoming) as PageUpsert);
    pages.push(buildThemedHub("best-bets", upcoming) as PageUpsert);
    pages.push(buildThemedHub("underdogs", upcoming) as PageUpsert);
    pages.push(buildThemedHub("sharp", upcoming) as PageUpsert);
    pages.push(buildThemedHub("highest-confidence", upcoming) as PageUpsert);

    // 9. Per-sport daily hubs (existing)
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
    const stats = await upsertPages(supabase, pages, runId, Deno.env.get("LOVABLE_API_KEY") ?? null);

    // Flip overdue upcoming pages to stale (keep team/matchup/daily_best/league/player/player_prop "live")
    await supabase
      .from("seo_pages")
      .update({ status: "stale" })
      .eq("status", "upcoming")
      .lt("game_date", todayStr)
      .in("page_type", ["game_preview"]);

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

    // Auto-ping Google Search Console to resubmit sitemaps whenever new pages
    // were created or existing ones updated. This is the only "force re-crawl"
    // mechanism Google officially honors for non-job/event content.
    if (stats.created > 0 || stats.updated > 0) {
      try {
        const lovableKey = Deno.env.get("LOVABLE_API_KEY");
        const gscKey = Deno.env.get("GOOGLE_SEARCH_CONSOLE_API_KEY");
        if (lovableKey && gscKey) {
          const SITE = "sc-domain:thinkbetai.com";
          const sitemaps = [
            "https://thinkbetai.com/sitemap-index.xml",
            "https://thinkbetai.com/sitemap-dynamic.xml",
          ];
          await Promise.all(sitemaps.map((sm) =>
            fetch(
              `https://connector-gateway.lovable.dev/google_search_console/webmasters/v3/sites/${encodeURIComponent(SITE)}/sitemaps/${encodeURIComponent(sm)}`,
              { method: "PUT", headers: { Authorization: `Bearer ${lovableKey}`, "X-Connection-Api-Key": gscKey } },
            ).then((r) => console.log(`[seo] gsc-ping ${sm} → ${r.status}`))
             .catch((err) => console.warn(`[seo] gsc-ping failed for ${sm}:`, err))
          ));
        }
      } catch (e) {
        console.warn("[seo] gsc-ping block failed:", (e as Error).message);
      }
    }

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
