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
import { dirname, resolve, join } from "path";
import { SEO_LANDING_CONFIGS, type SeoLandingConfig } from "../src/lib/seoLandingConfigs";
import { SEO_ALIAS_REDIRECTS } from "../src/seoAliases";
import {
  getRelatedLinks,
  seoBlueprints,
  type SeoBlueprint,
  type SeoSection,
} from "../src/seo/blueprints";

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

const blueprintSlugs = new Set(seoBlueprints.map((blueprint) => blueprint.slug));

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
  const articleNode = { ...articleLd };
  const faqNode = { ...faqLd };
  delete articleNode["@context"];
  delete faqNode["@context"];
  const jsonLd = `
<script id="thinkbetai-page-schema" type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [articleNode, faqNode],
  })}</script>`;

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

  // Replace the generic application schemas inherited from index.html.
  // Keeping them would create duplicate and stale entities after hydration.
  html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, "");

  // Inject canonical + JSON-LD into <head>. Index.html has no static
  // canonical (it's documented as "set dynamically per page via React
  // Helmet"), so we insert one just before </head>.
  const headInsert = `<link rel="canonical" href="${escapeAttr(patches.canonical)}" />${patches.jsonLd}\n</head>`;
  html = html.replace("</head>", headInsert);

  // Replace empty #root with prerendered content.
  html = html.replace(/<div id="root"><\/div>/, renderBody(config));

  return html;
}

function renderBlueprintSection(section: SeoSection): string {
  if (section.type === "faq" || section.type === "final_cta") return "";

  if (section.type === "intro_explainer") {
    const body = section.body.map((p) => `<p>${escapeHtml(p)}</p>`).join("\n");
    const bullets = section.bullets?.length
      ? `<ul>${section.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join("")}</ul>`
      : "";
    return `<article><p><strong>${escapeHtml(section.eyebrow ?? "Overview")}</strong></p><h2>${escapeHtml(section.heading)}</h2>${body}${bullets}</article>`;
  }

  if (section.type === "predictions_widget") {
    return `<article><h2>${escapeHtml(section.heading)}</h2><p>${escapeHtml(section.subheading)}</p><ul><li>Lakers moneyline — 83% confidence, +4.8% edge</li><li>Yankees -1.5 — 79% confidence, +3.9% edge</li><li>Chiefs -3 — 81% confidence, +4.3% edge</li></ul></article>`;
  }

  if (section.type === "bet_analyzer_preview") {
    return `<article><h2>${escapeHtml(section.heading)}</h2><p>${escapeHtml(section.subheading)}</p><p>Example: ${escapeHtml(section.placeholder)}</p></article>`;
  }

  return `<article><h2>${escapeHtml(section.heading)}</h2><p>${escapeHtml(section.subheading)}</p></article>`;
}

function renderBlueprintBody(blueprint: SeoBlueprint): string {
  const primary = blueprint.primaryCTA;
  const secondary = blueprint.secondaryCTA;
  const finalSection = blueprint.sections.find(
    (section): section is Extract<SeoSection, { type: "final_cta" }> => section.type === "final_cta",
  );
  const introHtml = blueprint.intro.map((p) => `<p>${escapeHtml(p)}</p>`).join("\n");
  const sectionsHtml = blueprint.sections.map(renderBlueprintSection).join("\n");
  const faqsHtml = blueprint.faq
    .map((f) => `<div><h3>${escapeHtml(f.question)}</h3><p>${escapeHtml(f.answer)}</p></div>`)
    .join("\n");
  const relatedLinks = getRelatedLinks(blueprint, 12)
    .map((link) => `<li><a href="${escapeAttr(link.href)}">${escapeHtml(link.label)}</a></li>`)
    .join("");

  return `
<div id="root"></div>
<noscript id="seo-content">
  <main style="max-width:64rem;margin:0 auto;padding:2rem 1rem;">
    <nav aria-label="Breadcrumb"><a href="/">Home</a> &rsaquo; <span>${escapeHtml(blueprint.h1)}</span></nav>
    <header style="margin:2rem 0;">
      <p><strong>${escapeHtml(blueprint.primaryKeyword)}</strong></p>
      <h1>${escapeHtml(blueprint.h1)}</h1>
      <p>${escapeHtml(blueprint.heroSubheadline)}</p>
      <ul>
        ${blueprint.heroTrust.map((metric) => `<li><strong>${escapeHtml(metric.value)}</strong> ${escapeHtml(metric.label)}</li>`).join("")}
      </ul>
      <p>
        <a href="${escapeAttr(primary.href)}">${escapeHtml(primary.label)}</a>
        ${secondary ? `&nbsp;·&nbsp;<a href="${escapeAttr(secondary.href)}">${escapeHtml(secondary.label)}</a>` : ""}
      </p>
    </header>
    <section>${introHtml}</section>
    <section>${sectionsHtml}</section>
    <section>
      <h2>Related AI Betting Tools and Pages</h2>
      <ul>${relatedLinks}</ul>
    </section>
    <section>
      <h2>Frequently Asked Questions</h2>
      ${faqsHtml}
    </section>
    <section style="text-align:center;margin-top:3rem;">
      <h2>${escapeHtml(finalSection?.heading ?? "Ready to use ThinkBetAI?")}</h2>
      <p>${escapeHtml(finalSection?.subheading ?? blueprint.description)}</p>
      <p><a href="${escapeAttr(primary.href)}">${escapeHtml(primary.label)}</a></p>
    </section>
  </main>
</noscript>`;
}

function buildHtmlForBlueprint(blueprint: SeoBlueprint): string {
  const url = blueprint.canonical;
  const fullUrl = `${BASE}${url}`;
  const title = blueprint.title.includes("ThinkBetAI")
    ? blueprint.title
    : `${blueprint.title} | ThinkBetAI`;
  const jsonLd = `
<script id="thinkbetai-page-schema" type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: blueprint.h1,
        headline: blueprint.heroHeadline,
        description: blueprint.description,
        url: fullUrl,
        mainEntityOfPage: fullUrl,
        keywords: [blueprint.primaryKeyword, ...blueprint.secondaryKeywords].join(", "),
        isPartOf: { "@id": `${BASE}/#website` },
      },
      {
        "@type": "SoftwareApplication",
        name: "ThinkBetAI",
        applicationCategory: "SportsApplication",
        operatingSystem: "Web",
        url: BASE,
        description:
          "AI sports betting analysis platform for predictions, picks, bet analysis and parlay research.",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: blueprint.faq.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer },
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${BASE}/` },
          { "@type": "ListItem", position: 2, name: blueprint.h1, item: fullUrl },
        ],
      },
    ],
  })}</script>`;

  let html = baseHtml;
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`);
  html = html.replace(
    /<meta\s+name="title"[^>]*>/,
    `<meta name="title" content="${escapeAttr(title)}" />`,
  );
  html = html.replace(
    /<meta\s+name="description"[^>]*>/,
    `<meta name="description" content="${escapeAttr(blueprint.description)}" />`,
  );
  html = html.replace(
    /<meta\s+property="og:url"[^>]*>/,
    `<meta property="og:url" content="${escapeAttr(fullUrl)}" />`,
  );
  html = html.replace(
    /<meta\s+property="og:title"[^>]*>/,
    `<meta property="og:title" content="${escapeAttr(title)}" />`,
  );
  html = html.replace(
    /<meta\s+property="og:description"[^>]*>/,
    `<meta property="og:description" content="${escapeAttr(blueprint.description)}" />`,
  );
  html = html.replace(
    /<meta\s+name="twitter:url"[^>]*>/,
    `<meta name="twitter:url" content="${escapeAttr(fullUrl)}" />`,
  );
  html = html.replace(
    /<meta\s+name="twitter:title"[^>]*>/,
    `<meta name="twitter:title" content="${escapeAttr(title)}" />`,
  );
  html = html.replace(
    /<meta\s+name="twitter:description"[^>]*>/,
    `<meta name="twitter:description" content="${escapeAttr(blueprint.description)}" />`,
  );
  html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, "");
  html = html.replace(
    "</head>",
    `<link rel="canonical" href="${escapeAttr(fullUrl)}" />${jsonLd}\n</head>`,
  );
  html = html.replace(/<div id="root"><\/div>/, renderBlueprintBody(blueprint));
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
  if (blueprintSlugs.has(config.slug)) continue;
  try {
    const destination = SEO_ALIAS_REDIRECTS[config.slug];
    const html = destination
      ? buildRedirectHtml(config, destination)
      : buildHtmlForConfig(config);
    // Flat .html (preferred for extensionless serving on Cloudflare-style edges)
    const flatFile = join(DIST, `${config.slug}.html`);
    mkdirSync(dirname(flatFile), { recursive: true });
    writeFileSync(flatFile, html);
    // Nested index.html (folder-index fallback)
    const outDir = join(DIST, config.slug);
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, "index.html"), html);
    written++;
  } catch (err) {
    console.warn(`[prerender] failed for /${config.slug}:`, (err as Error).message);
  }
}

let blueprintWritten = 0;
for (const blueprint of seoBlueprints) {
  try {
    const html = buildHtmlForBlueprint(blueprint);
    const flatFile = join(DIST, `${blueprint.slug}.html`);
    mkdirSync(dirname(flatFile), { recursive: true });
    writeFileSync(flatFile, html);
    const outDir = join(DIST, blueprint.slug);
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, "index.html"), html);
    blueprintWritten++;
  } catch (err) {
    console.warn(`[prerender] failed for /${blueprint.slug}:`, (err as Error).message);
  }
}

console.log(`[prerender] wrote ${written} legacy SEO landing snapshots and ${blueprintWritten}/${seoBlueprints.length} blueprint snapshots into dist/ (both .html and /index.html forms)`);
