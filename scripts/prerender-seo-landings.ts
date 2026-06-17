// Post-build prerender for SEO landing pages.
//
// Why: ThinkBetAI is a client-rendered SPA. Crawlers receive an empty
// <div id="root"> on first byte and only see content after JS executes
// — Googlebot handles this on a delayed second pass, but it's slow and
// flaky for ranking. This script generates a static HTML snapshot for
// each /<slug> in SEO_LANDING_CONFIGS so crawlers get the full content,
// title, meta description, canonical, og:* and JSON-LD on first request.
//
// React still boots normally on these URLs; createRoot().render()
// replaces the prerendered DOM with the live React tree once JS runs.
//
// Runs as `postbuild` so it reads the production dist/index.html
// (which includes hashed asset URLs) and writes dist/<slug>/index.html.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve, join } from "path";
import { SEO_LANDING_CONFIGS, type SeoLandingConfig } from "../src/lib/seoLandingConfigs";

const BASE = "https://thinkbetai.com";
const DIST = resolve("dist");
const INDEX_HTML_PATH = join(DIST, "index.html");

if (!existsSync(INDEX_HTML_PATH)) {
  console.warn(`[prerender] dist/index.html not found at ${INDEX_HTML_PATH} — skipping.`);
  process.exit(0);
}

const baseHtml = readFileSync(INDEX_HTML_PATH, "utf-8");

// ---------- helpers ----------
const escapeHtml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const escapeAttr = (s: string) => escapeHtml(s);

// Mirrors the toolLinks / popularGameLinks / teamLinks / playerLinks
// arrays in src/components/SeoLandingPage.tsx so the static HTML carries
// the same internal-link block crawlers will see in the live render.
const toolLinks = [
  { label: "AI Sports Picks", href: "/ai-sports-picks" },
  { label: "AI Parlay Builder", href: "/ai-parlay-builder" },
  { label: "Free AI Predictions", href: "/free-ai-predictions" },
  { label: "AI Bet Analyzer", href: "/ai-bet-analyzer" },
  { label: "AI NFL Picks", href: "/ai-nfl-picks" },
  { label: "AI Chat", href: "/chat" },
  { label: "Live Games", href: "/games" },
  { label: "Player Props", href: "/player-props" },
  { label: "Game Totals", href: "/game-totals" },
];

const popularGameLinks = [
  { label: "Today's NBA Best Bets", href: "/best/nba-best-bets-today" },
  { label: "Today's NFL Best Bets", href: "/best/nfl-best-bets-today" },
  { label: "Today's MLB Best Bets", href: "/best/mlb-best-bets-today" },
  { label: "Today's UFC Best Bets", href: "/best/ufc-best-bets-today" },
  { label: "Best Underdogs Today", href: "/best/best-underdogs-today" },
  { label: "Sharp Money Picks", href: "/best/sharp-money-today" },
];

const teamLinks = [
  { label: "Los Angeles Lakers", href: "/teams/nba-los-angeles-lakers" },
  { label: "Boston Celtics", href: "/teams/nba-boston-celtics" },
  { label: "Kansas City Chiefs", href: "/teams/nfl-kansas-city-chiefs" },
  { label: "Dallas Cowboys", href: "/teams/nfl-dallas-cowboys" },
  { label: "New York Yankees", href: "/teams/mlb-new-york-yankees" },
  { label: "Manchester City", href: "/teams/soccer-manchester-city" },
];

const playerLinks = [
  { label: "Jayson Tatum Props", href: "/players/nba-jayson-tatum" },
  { label: "LeBron James Props", href: "/players/nba-lebron-james" },
  { label: "Patrick Mahomes Props", href: "/players/nfl-patrick-mahomes" },
  { label: "Aaron Judge Props", href: "/players/mlb-aaron-judge" },
  { label: "Nikola Jokić Props", href: "/players/nba-nikola-jokic" },
  { label: "Connor McDavid Props", href: "/players/nhl-connor-mcdavid" },
];

// ---------- render body ----------
function renderBody(config: SeoLandingConfig): string {
  const primary = config.primaryCta ?? { label: "See Today's Free Picks", href: "/games" };
  const secondary = config.secondaryCta ?? { label: "View Pricing", href: "/pricing" };

  const introHtml = config.intro
    .map((p) => `<p>${escapeHtml(p)}</p>`)
    .join("\n");

  const sectionsHtml = config.sections
    .map((s) => {
      const body = s.body.map((p) => `<p>${escapeHtml(p)}</p>`).join("\n");
      const bullets = s.bullets?.length
        ? `<ul>${s.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join("")}</ul>`
        : "";
      return `<article><h2>${escapeHtml(s.heading)}</h2>${body}${bullets}</article>`;
    })
    .join("\n");

  const faqsHtml = config.faqs
    .map(
      (f) =>
        `<div><h3>${escapeHtml(f.q)}</h3><p>${escapeHtml(f.a)}</p></div>`
    )
    .join("\n");

  const linkList = (items: { label: string; href: string }[]) =>
    items
      .map(
        (l) => `<li><a href="${escapeAttr(l.href)}">${escapeHtml(l.label)}</a></li>`
      )
      .join("");

  // Prerendered shell. Layout/typography styles are inherited from the
  // CSS bundle that the original <link> tags in index.html already
  // load. We intentionally keep markup minimal & semantic — React will
  // replace this DOM once it hydrates, so visual fidelity here doesn't
  // matter; only crawler comprehension does.
  return `
<div id="root">
  <main style="max-width:64rem;margin:0 auto;padding:2rem 1rem;">
    <nav aria-label="Breadcrumb"><a href="/">Home</a> &rsaquo; <span>${escapeHtml(config.h1)}</span></nav>
    <header style="text-align:center;margin:2rem 0;">
      <p><strong>ThinkBetAI · 80.3% win rate on flagged picks</strong></p>
      <h1>${escapeHtml(config.h1)}</h1>
      <p>${escapeHtml(config.tagline)}</p>
      <p>
        <a href="${escapeAttr(primary.href)}">${escapeHtml(primary.label)}</a>
        &nbsp;·&nbsp;
        <a href="${escapeAttr(secondary.href)}">${escapeHtml(secondary.label)}</a>
      </p>
    </header>
    <section>${introHtml}</section>
    <section style="margin:2rem 0;padding:1rem;border:1px solid #333;">
      <h3>Skip the reading — see tonight's AI picks</h3>
      <p>Free daily best bet + best underdog. No signup required.</p>
      <p><a href="/games">View Free Picks</a></p>
    </section>
    <section>${sectionsHtml}</section>
    <section>
      <h2>Tools You'll Want Next</h2>
      <ul>${linkList(toolLinks)}</ul>
      <h2>Today's Top Game Predictions</h2>
      <ul>${linkList(popularGameLinks)}</ul>
      <h2>Popular Team Predictions</h2>
      <ul>${linkList(teamLinks)}</ul>
      <h2>Top Player Prop Pages</h2>
      <ul>${linkList(playerLinks)}</ul>
    </section>
    <section>
      <h2>Frequently Asked Questions</h2>
      ${faqsHtml}
    </section>
    <section style="text-align:center;margin-top:3rem;">
      <h2>Ready to bet smarter with AI?</h2>
      <p>Start with the free daily picks. Upgrade only if the model wins for you. Cancel anytime.</p>
      <p>
        <a href="${escapeAttr(primary.href)}">${escapeHtml(primary.label)}</a>
        &nbsp;·&nbsp;
        <a href="/pricing">See Pricing</a>
      </p>
    </section>
  </main>
</div>`;
}

// ---------- render head ----------
function renderHeadPatches(config: SeoLandingConfig, url: string): {
  title: string;
  description: string;
  canonical: string;
  ogUrl: string;
  jsonLd: string;
} {
  const fullUrl = `${BASE}${url}`;
  const title = config.title.includes("ThinkBetAI")
    ? config.title
    : `${config.title} | ThinkBetAI`;

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: config.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: config.h1,
    description: config.description,
    author: { "@type": "Organization", name: "ThinkBetAI" },
    publisher: { "@type": "Organization", name: "ThinkBetAI", url: BASE },
    mainEntityOfPage: fullUrl,
    image: `${BASE}/og-image.png`,
  };
  const jsonLd = `
<script type="application/ld+json">${JSON.stringify(articleLd)}</script>
<script type="application/ld+json">${JSON.stringify(faqLd)}</script>`;

  return {
    title,
    description: config.description,
    canonical: fullUrl,
    ogUrl: fullUrl,
    jsonLd,
  };
}

// ---------- patch the dist index.html for one slug ----------
function buildHtmlForConfig(config: SeoLandingConfig): string {
  const url = `/${config.slug}`;
  const patches = renderHeadPatches(config, url);

  let html = baseHtml;

  // <title>
  html = html.replace(
    /<title>[^<]*<\/title>/,
    `<title>${escapeHtml(patches.title)}</title>`
  );
  // <meta name="title">
  html = html.replace(
    /<meta\s+name="title"[^>]*>/,
    `<meta name="title" content="${escapeAttr(patches.title)}" />`
  );
  // <meta name="description">
  html = html.replace(
    /<meta\s+name="description"[^>]*>/,
    `<meta name="description" content="${escapeAttr(patches.description)}" />`
  );
  // og:url
  html = html.replace(
    /<meta\s+property="og:url"[^>]*>/,
    `<meta property="og:url" content="${escapeAttr(patches.ogUrl)}" />`
  );
  // og:title
  html = html.replace(
    /<meta\s+property="og:title"[^>]*>/,
    `<meta property="og:title" content="${escapeAttr(patches.title)}" />`
  );
  // og:description
  html = html.replace(
    /<meta\s+property="og:description"[^>]*>/,
    `<meta property="og:description" content="${escapeAttr(patches.description)}" />`
  );
  // twitter:url / title / description
  html = html.replace(
    /<meta\s+name="twitter:url"[^>]*>/,
    `<meta name="twitter:url" content="${escapeAttr(patches.ogUrl)}" />`
  );
  html = html.replace(
    /<meta\s+name="twitter:title"[^>]*>/,
    `<meta name="twitter:title" content="${escapeAttr(patches.title)}" />`
  );
  html = html.replace(
    /<meta\s+name="twitter:description"[^>]*>/,
    `<meta name="twitter:description" content="${escapeAttr(patches.description)}" />`
  );

  // Inject canonical + JSON-LD into <head>. Index.html has no static
  // canonical (it's documented as "set dynamically per page via React
  // Helmet"), so we insert one just before </head>.
  const headInsert = `<link rel="canonical" href="${escapeAttr(patches.canonical)}" />${patches.jsonLd}\n</head>`;
  html = html.replace("</head>", headInsert);

  // Replace empty #root with prerendered content.
  html = html.replace(/<div id="root"><\/div>/, renderBody(config));

  return html;
}

// ---------- write all snapshots ----------
let written = 0;
for (const config of SEO_LANDING_CONFIGS) {
  try {
    const outDir = join(DIST, config.slug);
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, "index.html"), buildHtmlForConfig(config));
    written++;
  } catch (err) {
    console.warn(`[prerender] failed for /${config.slug}:`, (err as Error).message);
  }
}

console.log(`[prerender] wrote ${written}/${SEO_LANDING_CONFIGS.length} SEO landing snapshots into dist/`);
