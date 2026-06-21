// Post-build crawler fallback for SEO landing pages.
//
// Why: ThinkBetAI is a client-rendered SPA. Crawlers receive an empty
// <div id="root"> on first byte and only see content after JS executes
// — Googlebot handles this on a delayed second pass, but it's slow and
// flaky for ranking. This script generates a static HTML snapshot for
// each /<slug> in SEO_LANDING_CONFIGS so crawlers get the full content,
// title, meta description, canonical, og:* and JSON-LD on first request.
//
// The semantic fallback lives in <noscript>, leaving #root empty so React
// does not replace mismatched prerendered markup and trigger a large CLS.
//
// Runs as `postbuild` so it reads the production dist/index.html
// (which includes hashed asset URLs) and writes dist/<slug>/index.html.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve, join } from "path";
import { SEO_LANDING_CONFIGS, type SeoLandingConfig } from "../src/lib/seoLandingConfigs";
import { SEO_ALIAS_REDIRECTS } from "../src/seoAliases";

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

const sportLandingLinks = [
  { label: "AI NFL Picks", href: "/ai-nfl-picks" },
  { label: "NBA AI Predictions", href: "/nba-ai-predictions" },
  { label: "MLB AI Predictions", href: "/mlb-ai-predictions" },
  { label: "NHL AI Predictions", href: "/nhl-ai-predictions" },
  { label: "UFC AI Predictions", href: "/ufc-ai-predictions" },
  { label: "Soccer AI Predictions", href: "/soccer-ai-predictions" },
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

  // Semantic no-JS fallback. Crawlers can read the content in the initial
  // response while JavaScript users render directly into an empty #root.
  return `
<div id="root"></div>
<noscript id="seo-content">
  <main style="max-width:64rem;margin:0 auto;padding:2rem 1rem;">
    <nav aria-label="Breadcrumb"><a href="/">Home</a> &rsaquo; <span>${escapeHtml(config.h1)}</span></nav>
    <header style="text-align:center;margin:2rem 0;">
      <p><strong>ThinkBetAI · Probability-based sports analysis</strong></p>
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
      <h2>Sport-Specific AI Predictions</h2>
      <ul>${linkList(sportLandingLinks)}</ul>
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
</noscript>`;
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

function buildRedirectHtml(config: SeoLandingConfig, destination: string): string {
  const target = `${BASE}${destination}`;
  let html = baseHtml;
  html = html.replace(
    /<title>[^<]*<\/title>/,
    `<title>Page Moved | ThinkBetAI</title>`,
  );
  html = html.replace(
    /<meta\s+name="description"[^>]*>/,
    `<meta name="description" content="This ThinkBetAI page has moved to its canonical destination." />`,
  );
  html = html.replace(
    /<meta\s+name="robots"[^>]*>/,
    `<meta name="robots" content="noindex, follow" />`,
  );
  html = html.replace(
    "</head>",
    `<link rel="canonical" href="${escapeAttr(target)}" />\n<meta http-equiv="refresh" content="0;url=${escapeAttr(destination)}" />\n<script>location.replace(${JSON.stringify(destination)});</script>\n</head>`,
  );
  html = html.replace(
    /<div id="root"><\/div>/,
    `<div id="root"><main><h1>Page moved</h1><p><a href="${escapeAttr(destination)}">Continue to ${escapeHtml(config.h1)}</a></p></main></div>`,
  );
  return html;
}

// ---------- write all snapshots ----------
// We emit BOTH forms so the snapshot is reachable regardless of how
// Lovable's edge resolves clean URLs:
//   dist/<slug>.html          → extensionless-html lookup
//   dist/<slug>/index.html    → folder-index lookup
// First verified attempt (folder-index only) was shadowed by the SPA
// catch-all rewrite. Adding the flat .html gives the host a second
// matchable static file before the catch-all runs.
let written = 0;
for (const config of SEO_LANDING_CONFIGS) {
  try {
    const destination = SEO_ALIAS_REDIRECTS[config.slug];
    const html = destination
      ? buildRedirectHtml(config, destination)
      : buildHtmlForConfig(config);
    // Flat .html (preferred for extensionless serving on Cloudflare-style edges)
    writeFileSync(join(DIST, `${config.slug}.html`), html);
    // Nested index.html (folder-index fallback)
    const outDir = join(DIST, config.slug);
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, "index.html"), html);
    written++;
  } catch (err) {
    console.warn(`[prerender] failed for /${config.slug}:`, (err as Error).message);
  }
}

console.log(`[prerender] wrote ${written}/${SEO_LANDING_CONFIGS.length} SEO landing snapshots into dist/ (both .html and /index.html forms)`);
