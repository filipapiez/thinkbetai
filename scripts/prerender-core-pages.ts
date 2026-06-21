/**
 * Writes crawler-readable HTML snapshots for the core URLs already earning
 * Search Console impressions. The browser still loads the normal React app;
 * these snapshots improve the first response for crawlers and link previews.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { CORE_SEO_PAGES, type CoreSeoPage } from "../src/seoCorePages";

const BASE = "https://thinkbetai.com";
const DIST = resolve("dist");
const indexPath = join(DIST, "index.html");

if (!existsSync(indexPath)) {
  console.warn("[prerender-core] dist/index.html missing — skipping.");
  process.exit(0);
}

const baseHtml = readFileSync(indexPath, "utf8");
const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

function structuredData(page: CoreSeoPage) {
  const url = `${BASE}${page.path === "/" ? "" : page.path}`;
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${BASE}/#organization`,
    name: "ThinkBetAI",
    url: BASE,
    logo: `${BASE}/thinkbetai-logo-v2.png`,
  };
  const webPage = {
    "@context": "https://schema.org",
    "@type": page.path === "/" ? "WebSite" : "WebPage",
    name: page.h1,
    description: page.description,
    url,
    isPartOf: { "@id": `${BASE}/#website` },
    publisher: { "@id": `${BASE}/#organization` },
  };
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${BASE}/` },
      ...(page.path === "/"
        ? []
        : [{ "@type": "ListItem", position: 2, name: page.h1, item: url }]),
    ],
  };
  const nodes = [organization, webPage, breadcrumb].map((data) => {
    const node = { ...data };
    delete node["@context"];
    return node;
  });
  return `<script id="thinkbetai-page-schema" type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@graph": nodes,
  })}</script>`;
}

function renderBody(page: CoreSeoPage) {
  const sections = page.sections
    .map(
      (section) =>
        `<section><h2>${escapeHtml(section.heading)}</h2><p>${escapeHtml(section.body)}</p></section>`,
    )
    .join("\n");
  const links = page.links
    .map((link) => `<li><a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a></li>`)
    .join("");
  return `<div id="root"></div>
<noscript id="seo-content">
  <header style="max-width:64rem;margin:0 auto;padding:1.25rem 1rem;"><a href="/">ThinkBetAI</a></header>
  <main style="max-width:64rem;margin:0 auto;padding:2rem 1rem;">
    ${page.path === "/" ? "" : `<nav aria-label="Breadcrumb"><a href="/">Home</a> &rsaquo; <span>${escapeHtml(page.h1)}</span></nav>`}
    <h1>${escapeHtml(page.h1)}</h1>
    <p>${escapeHtml(page.intro)}</p>
    ${sections}
    <section><h2>Explore related analysis</h2><ul>${links}</ul></section>
    <aside><p><strong>Important:</strong> Sports betting involves risk. ThinkBetAI provides informational analysis, not guaranteed outcomes or financial advice. Only participate where legal and never wager more than you can afford to lose.</p></aside>
  </main>
</noscript>`;
}

function build(page: CoreSeoPage) {
  const url = `${BASE}${page.path === "/" ? "/" : page.path}`;
  let html = baseHtml;
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(page.title)}</title>`);
  html = html.replace(
    /<meta\s+name="title"[^>]*>/,
    `<meta name="title" content="${escapeHtml(page.title)}" />`,
  );
  html = html.replace(
    /<meta\s+name="description"[^>]*>/,
    `<meta name="description" content="${escapeHtml(page.description)}" />`,
  );
  html = html.replace(
    /<meta\s+name="robots"[^>]*>/,
    '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />',
  );
  html = html.replace(
    /<meta\s+property="og:url"[^>]*>/,
    `<meta property="og:url" content="${escapeHtml(url)}" />`,
  );
  html = html.replace(
    /<meta\s+property="og:title"[^>]*>/,
    `<meta property="og:title" content="${escapeHtml(page.title)}" />`,
  );
  html = html.replace(
    /<meta\s+property="og:description"[^>]*>/,
    `<meta property="og:description" content="${escapeHtml(page.description)}" />`,
  );
  html = html.replace(
    /<meta\s+name="twitter:url"[^>]*>/,
    `<meta name="twitter:url" content="${escapeHtml(url)}" />`,
  );
  html = html.replace(
    /<meta\s+name="twitter:title"[^>]*>/,
    `<meta name="twitter:title" content="${escapeHtml(page.title)}" />`,
  );
  html = html.replace(
    /<meta\s+name="twitter:description"[^>]*>/,
    `<meta name="twitter:description" content="${escapeHtml(page.description)}" />`,
  );

  // Replace generic base schema with page-specific, claim-safe schema.
  html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, "");
  html = html.replace(
    "</head>",
    `<link rel="canonical" href="${escapeHtml(url)}" />\n${structuredData(page)}\n</head>`,
  );
  html = html.replace(/<div id="root"><\/div>/, renderBody(page));
  return html;
}

for (const page of CORE_SEO_PAGES) {
  const html = build(page);
  if (page.path === "/") {
    writeFileSync(indexPath, html);
    continue;
  }
  const slug = page.path.slice(1);
  writeFileSync(join(DIST, `${slug}.html`), html);
  const nested = join(DIST, slug, "index.html");
  mkdirSync(dirname(nested), { recursive: true });
  writeFileSync(nested, html);
}

console.log(`✓ prerendered ${CORE_SEO_PAGES.length} core SEO pages`);
