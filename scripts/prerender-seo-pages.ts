// Prerender DB-backed SEO pages (/predictions, /teams, /players, /props,
// /best, /matchups, /leagues) into static HTML snapshots.
//
// Why: these pages render via React + a client-side Supabase fetch,
// which costs ~700-1500ms before LCP paints anything. Googlebot mobile
// flagged the /predictions/* template for poor CLS/LCP/INP. Serving a
// fully rendered HTML snapshot eliminates the round-trip on first paint
// and gives crawlers immediate content + JSON-LD.
//
// React still boots and replaces the snapshot once hydrated.
//
// Runs after the SPA landing prerender in `postbuild`.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve, join } from "path";
import { createClient } from "@supabase/supabase-js";

const BASE = "https://thinkbetai.com";
const DIST = resolve("dist");
const INDEX_HTML_PATH = join(DIST, "index.html");

if (!existsSync(INDEX_HTML_PATH)) {
  console.warn(`[prerender-seo-pages] dist/index.html missing — skipping.`);
  process.exit(0);
}
const baseHtml = readFileSync(INDEX_HTML_PATH, "utf-8");

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  "https://fmrcmbdgmhoylmxbapdr.supabase.co";
const SUPABASE_ANON =
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "";

if (!SUPABASE_ANON) {
  console.warn("[prerender-seo-pages] no anon key — skipping.");
  process.exit(0);
}

const PATH_MAP: Record<string, string> = {
  daily_best: "/best/",
  team: "/teams/",
  game_preview: "/predictions/",
  game_result: "/predictions/",
  player: "/players/",
  player_prop: "/props/",
  matchup: "/matchups/",
  league: "/leagues/",
};

// Prioritise the templates flagged in GSC + the ones most likely to rank.
// Cap totals to keep build time reasonable.
const TYPE_LIMITS: Record<string, number> = {
  game_preview: 1500,
  daily_best: 200,
  matchup: 300,
  league: 200,
  team: 300,
  player: 300,
  player_prop: 600,
  game_result: 300,
};

const escapeHtml = (s: string) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
const escapeAttr = escapeHtml;

interface Row {
  slug: string;
  page_type: string;
  sport: string | null;
  title: string;
  meta_description: string | null;
  h1: string | null;
  content_json: any;
  status: string;
  game_date: string | null;
  updated_at: string;
}

async function fetchAll(): Promise<Row[]> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);
  const rows: Row[] = [];
  for (const [pageType, limit] of Object.entries(TYPE_LIMITS)) {
    let from = 0;
    const PAGE = 500;
    let remaining = limit;
    while (remaining > 0) {
      const take = Math.min(PAGE, remaining);
      const { data, error } = await supabase
        .from("seo_pages")
        .select("slug,page_type,sport,title,meta_description,h1,content_json,status,game_date,updated_at")
        .eq("page_type", pageType)
        .order("updated_at", { ascending: false })
        .range(from, from + take - 1);
      if (error) {
        console.warn(`[prerender-seo-pages] ${pageType} read failed:`, error.message);
        break;
      }
      if (!data || data.length === 0) break;
      rows.push(...(data as Row[]));
      if (data.length < take) break;
      from += take;
      remaining -= take;
    }
  }
  return rows;
}

function renderBody(r: Row, url: string): string {
  const c = r.content_json || {};
  const breadcrumbs = Array.isArray(c.breadcrumbs)
    ? `<nav aria-label="Breadcrumb">${c.breadcrumbs
        .map((b: any, i: number) =>
          i === c.breadcrumbs.length - 1
            ? `<span>${escapeHtml(b.name)}</span>`
            : `<a href="${escapeAttr(b.href)}">${escapeHtml(b.name)}</a> &rsaquo; `
        )
        .join("")}</nav>`
    : "";

  const longForm = typeof c.longForm === "string" && c.longForm.length
    ? `<article>${c.longForm
        .split(/\n{2,}/)
        .map((p: string) => `<p>${escapeHtml(p)}</p>`)
        .join("")}</article>`
    : "";

  const ai = c.aiPick
    ? `<section><h2>AI Prediction: ${escapeHtml(c.aiPick.pick ?? "")}</h2>
        <p><strong>${escapeHtml(String(c.aiPick.confidence ?? ""))}%</strong> confidence</p>
        ${c.aiPick.rationale ? `<p>${escapeHtml(c.aiPick.rationale)}</p>` : ""}
       </section>`
    : "";

  const matchup =
    (r.page_type === "game_preview" || r.page_type === "game_result") && (c.homeTeam || c.awayTeam)
      ? `<section><h2>${escapeHtml(c.awayTeam ?? "")} @ ${escapeHtml(c.homeTeam ?? "")}</h2>
          ${c.commenceTime ? `<p>Kickoff: ${escapeHtml(new Date(c.commenceTime).toUTCString())}</p>` : ""}
          ${c.league ? `<p>League: ${escapeHtml(c.league)}</p>` : ""}
         </section>`
      : "";

  const upcoming =
    Array.isArray(c.upcomingGames ?? c.games) && (c.upcomingGames ?? c.games).length
      ? `<section><h2>Upcoming Games</h2><ul>${(c.upcomingGames ?? c.games)
          .map(
            (g: any) =>
              `<li><a href="/predictions/${escapeAttr(g.slug)}">${escapeHtml(
                g.away ?? g.opponent ?? ""
              )} vs ${escapeHtml(g.home ?? g.opponent ?? "")}</a></li>`
          )
          .join("")}</ul></section>`
      : "";

  const faq = Array.isArray(c.faq) && c.faq.length
    ? `<section><h2>Frequently Asked Questions</h2>${c.faq
        .map(
          (f: any) =>
            `<div><h3>${escapeHtml(f.question)}</h3><p>${escapeHtml(f.answer)}</p></div>`
        )
        .join("")}</section>`
    : "";

  const sportBadge = r.sport ? `<p><strong>${escapeHtml(r.sport)}</strong></p>` : "";

  return `
<div id="root">
  <main style="max-width:64rem;margin:0 auto;padding:2rem 1rem;">
    ${breadcrumbs}
    ${sportBadge}
    <h1>${escapeHtml(r.h1 ?? r.title)}</h1>
    ${r.meta_description ? `<p>${escapeHtml(r.meta_description)}</p>` : ""}
    ${longForm}
    ${ai}
    ${matchup}
    ${upcoming}
    ${faq}
    <p><a href="/games">See today's free picks</a> · <a href="/pricing">View pricing</a></p>
  </main>
</div>`;
}

function renderJsonLd(r: Row, url: string): string {
  const c = r.content_json || {};
  const graph: any[] = [];

  if (Array.isArray(c.breadcrumbs) && c.breadcrumbs.length) {
    graph.push({
      "@type": "BreadcrumbList",
      itemListElement: c.breadcrumbs.map((b: any, i: number) => ({
        "@type": "ListItem",
        position: i + 1,
        name: b.name,
        item: `${BASE}${b.href}`,
      })),
    });
  }
  if (Array.isArray(c.faq) && c.faq.length) {
    graph.push({
      "@type": "FAQPage",
      mainEntity: c.faq.map((f: any) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer },
      })),
    });
  }
  if (c.sportsEvent) {
    const ev: any = { ...c.sportsEvent };
    delete ev["@context"];
    const startISO = ev.startDate || r.game_date;
    if (startISO && !ev.endDate) {
      const start = new Date(startISO);
      if (!isNaN(start.getTime())) {
        ev.endDate = new Date(start.getTime() + 3 * 60 * 60 * 1000).toISOString();
      }
    }
    if (!ev.eventStatus) {
      ev.eventStatus =
        r.status === "stale" || r.page_type === "game_result"
          ? "https://schema.org/EventCompleted"
          : "https://schema.org/EventScheduled";
    }
    if (!ev.eventAttendanceMode) ev.eventAttendanceMode = "https://schema.org/OfflineEventAttendanceMode";
    if (!ev.description && r.meta_description) ev.description = r.meta_description;
    if (!ev.image) ev.image = [`${BASE}/og-image.png`];
    if (!ev.location) {
      ev.location = {
        "@type": "Place",
        name: c.homeTeam ? `${c.homeTeam} home venue` : "TBD",
        address: { "@type": "PostalAddress", addressCountry: "US" },
      };
    }
    if (!ev.performer) {
      const performers: any[] = [];
      if (c.awayTeam) performers.push({ "@type": "SportsTeam", name: c.awayTeam });
      if (c.homeTeam) performers.push({ "@type": "SportsTeam", name: c.homeTeam });
      if (performers.length) ev.performer = performers;
    }
    if (!ev.organizer) {
      ev.organizer = { "@type": "Organization", name: c.league || "ThinkBetAI", url: BASE };
    }
    if (!ev.offers) {
      ev.offers = {
        "@type": "Offer",
        url,
        price: "0",
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
        validFrom: new Date().toISOString(),
      };
    }
    graph.push(ev);
  }

  if (!graph.length) return "";
  return `<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@graph": graph,
  })}</script>`;
}

function patchHtml(r: Row): string {
  const prefix = PATH_MAP[r.page_type];
  const url = `${BASE}${prefix}${r.slug}`;
  const title = r.title;
  const desc = r.meta_description ?? "";
  const isStale = r.status === "stale" || r.page_type === "game_result";
  const robots = isStale ? "noindex, follow" : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";

  let html = baseHtml;
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`);
  html = html.replace(/<meta\s+name="title"[^>]*>/, `<meta name="title" content="${escapeAttr(title)}" />`);
  html = html.replace(/<meta\s+name="description"[^>]*>/, `<meta name="description" content="${escapeAttr(desc)}" />`);
  html = html.replace(/<meta\s+name="robots"[^>]*>/, `<meta name="robots" content="${escapeAttr(robots)}" />`);
  html = html.replace(/<meta\s+property="og:url"[^>]*>/, `<meta property="og:url" content="${escapeAttr(url)}" />`);
  html = html.replace(/<meta\s+property="og:title"[^>]*>/, `<meta property="og:title" content="${escapeAttr(title)}" />`);
  html = html.replace(/<meta\s+property="og:description"[^>]*>/, `<meta property="og:description" content="${escapeAttr(desc)}" />`);
  html = html.replace(/<meta\s+name="twitter:url"[^>]*>/, `<meta name="twitter:url" content="${escapeAttr(url)}" />`);
  html = html.replace(/<meta\s+name="twitter:title"[^>]*>/, `<meta name="twitter:title" content="${escapeAttr(title)}" />`);
  html = html.replace(/<meta\s+name="twitter:description"[^>]*>/, `<meta name="twitter:description" content="${escapeAttr(desc)}" />`);

  const jsonLd = renderJsonLd(r, url);
  const headInsert = `<link rel="canonical" href="${escapeAttr(url)}" />${jsonLd}\n</head>`;
  html = html.replace("</head>", headInsert);
  html = html.replace(/<div id="root"><\/div>/, renderBody(r, url));
  return html;
}

const rows = await fetchAll();
console.log(`[prerender-seo-pages] fetched ${rows.length} rows`);

let written = 0;
let failed = 0;
for (const r of rows) {
  try {
    const prefix = PATH_MAP[r.page_type];
    if (!prefix) continue;
    const slugPath = prefix.replace(/^\/|\/$/g, ""); // "predictions"
    const html = patchHtml(r);
    // folder/index.html form
    const dir = join(DIST, slugPath, r.slug);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "index.html"), html);
    // flat .html form for edges that resolve extensionless paths
    const flatDir = join(DIST, slugPath);
    mkdirSync(flatDir, { recursive: true });
    writeFileSync(join(flatDir, `${r.slug}.html`), html);
    written++;
  } catch (e) {
    failed++;
    if (failed <= 5) console.warn(`[prerender-seo-pages] failed ${r.slug}:`, (e as Error).message);
  }
}

console.log(`[prerender-seo-pages] wrote ${written} snapshots (${failed} failed)`);
