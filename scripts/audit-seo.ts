import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { CORE_SEO_PAGES } from "../src/seoCorePages";
import { SEO_ALIAS_REDIRECTS } from "../src/seoAliases";
import { getRelatedLinks, seoBlueprints, type SeoBlueprint } from "../src/seo/blueprints";

const BASE = "https://thinkbetai.com";
const issues: string[] = [];
const sitemapPath = resolve("public/sitemap.xml");
const sitemap = readFileSync(sitemapPath, "utf8");
const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
const sitemapUrls = new Set(
  [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]),
);

for (const [slug, destination] of Object.entries(SEO_ALIAS_REDIRECTS)) {
  if (sitemapUrls.has(`${BASE}/${slug}`)) {
    issues.push(`alias remains in sitemap: /${slug}`);
  }
  if (!destination.startsWith("/")) issues.push(`invalid alias destination: ${destination}`);
}

for (const page of CORE_SEO_PAGES) {
  const url = `${BASE}${page.path}`;
  if (!sitemapUrls.has(url)) issues.push(`core page missing from sitemap: ${page.path}`);
  if (page.title.length > 60) issues.push(`title too long (${page.title.length}): ${page.path}`);
  if (page.description.length < 110 || page.description.length > 160) {
    issues.push(`description length ${page.description.length}: ${page.path}`);
  }
}

const expectedBlueprintSections = [
  "predictions_widget",
  "market_stats",
  "intro_explainer",
  "product_report_preview",
  "how_ai_works",
  "recent_performance",
  "bet_analyzer_preview",
  "comparison_table",
  "how_to_use",
  "supported_sports",
  "related_pages",
  "faq",
  "final_cta",
] as const;

const requiredBlueprintSchema = ["WebPage", "SoftwareApplication", "FAQPage", "BreadcrumbList"] as const;
const blueprintCanonicalPaths = new Set(seoBlueprints.map((blueprint) => blueprint.canonical));

const finalTitle = (blueprint: SeoBlueprint) =>
  blueprint.title.includes("ThinkBetAI") ? blueprint.title : `${blueprint.title} | ThinkBetAI`;

const flatHtmlPath = (dist: string, path: string) =>
  path === "/" ? join(dist, "index.html") : join(dist, `${path.slice(1)}.html`);

const folderHtmlPath = (dist: string, path: string) =>
  path === "/" ? join(dist, "index.html") : join(dist, path.slice(1), "index.html");

const redirectRules = existsSync(resolve("public/_redirects"))
  ? readFileSync(resolve("public/_redirects"), "utf8")
  : "";

const seenBlueprintSlugs = new Map<string, string>();
const seenBlueprintCanonicals = new Map<string, string>();
const seenBlueprintTitles = new Map<string, string>();

for (const blueprint of seoBlueprints) {
  const path = blueprint.canonical;
  const url = `${BASE}${path}`;
  const title = finalTitle(blueprint);

  if (blueprint.slug.startsWith("/") || blueprint.slug.endsWith("/")) {
    issues.push(`blueprint slug should be extensionless and slashless: ${blueprint.slug}`);
  }
  if (path !== `/${blueprint.slug}`) {
    issues.push(`blueprint canonical mismatch in source: ${blueprint.slug} -> ${path}`);
  }
  if (SEO_ALIAS_REDIRECTS[blueprint.slug]) {
    issues.push(`blueprint slug conflicts with alias redirect: ${path}`);
  }
  if (!sitemapUrls.has(url)) {
    issues.push(`blueprint missing from sitemap: ${path}`);
  }
  const duplicateSlug = seenBlueprintSlugs.get(blueprint.slug);
  if (duplicateSlug) issues.push(`duplicate blueprint slug: ${duplicateSlug} and ${path}`);
  seenBlueprintSlugs.set(blueprint.slug, path);
  const duplicateCanonical = seenBlueprintCanonicals.get(path);
  if (duplicateCanonical) issues.push(`duplicate blueprint canonical: ${duplicateCanonical} and ${path}`);
  seenBlueprintCanonicals.set(path, path);
  const duplicateTitle = seenBlueprintTitles.get(title);
  if (duplicateTitle) issues.push(`duplicate blueprint title: ${duplicateTitle} and ${path}`);
  seenBlueprintTitles.set(title, path);

  if (title.length > 65) issues.push(`blueprint title too long (${title.length}): ${path}`);
  if (blueprint.description.length < 100 || blueprint.description.length > 170) {
    issues.push(`blueprint description length ${blueprint.description.length}: ${path}`);
  }
  if (!blueprint.h1 || blueprint.h1.length < 8) issues.push(`blueprint H1 too short: ${path}`);
  if (blueprint.secondaryKeywords.length < 3) issues.push(`blueprint needs secondary keywords: ${path}`);
  if (blueprint.intro.length < 2) issues.push(`blueprint needs at least two intro paragraphs: ${path}`);
  if (blueprint.faq.length < 6) issues.push(`blueprint needs at least six FAQs: ${path}`);
  if (getRelatedLinks(blueprint, 12).length < 8) {
    issues.push(`blueprint has too few generated related links: ${path}`);
  }

  for (const sectionType of expectedBlueprintSections) {
    if (!blueprint.sections.some((section) => section.type === sectionType)) {
      issues.push(`blueprint missing golden-template section ${sectionType}: ${path}`);
    }
  }
  for (const schemaType of requiredBlueprintSchema) {
    if (!blueprint.schema.includes(schemaType)) {
      issues.push(`blueprint missing schema ${schemaType}: ${path}`);
    }
  }
  if (!blueprint.primaryCTA?.href || !blueprint.primaryCTA.label) {
    issues.push(`blueprint missing primary CTA: ${path}`);
  }
  if (!blueprint.dynamicData.markets?.length) {
    issues.push(`blueprint missing dynamic markets: ${path}`);
  }
  if (!redirectRules.includes(`${path} ${path}.html 200`)) {
    issues.push(`blueprint missing prerender redirect rule: ${path}`);
  }
}

const dist = resolve("dist");
if (existsSync(dist)) {
  const titles = new Map<string, string>();
  for (const sitemapUrl of sitemapUrls) {
    const parsed = new URL(sitemapUrl);
    const path = parsed.pathname;
    const file = flatHtmlPath(dist, path);
    if (!existsSync(file)) {
      issues.push(`sitemap URL missing crawler HTML: ${path}`);
      continue;
    }

    const html = readFileSync(file, "utf8");
    const title = html.match(/<title>([^<]+)<\/title>/)?.[1]?.trim();
    const description = html.match(/<meta\s+name="description"\s+content="([^"]+)"/)?.[1]?.trim();
    const canonical = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/)?.[1]?.trim();

    if (!title) issues.push(`missing title: ${path}`);
    else {
      if (title.length > 65) issues.push(`title too long (${title.length}): ${path}`);
      const duplicate = titles.get(title);
      if (duplicate) issues.push(`duplicate title: ${duplicate} and ${path}`);
      titles.set(title, path);
    }
    if (!description) issues.push(`missing description: ${path}`);
    else if (description.length < 100 || description.length > 170) {
      issues.push(`description length ${description.length}: ${path}`);
    }
    if (canonical !== sitemapUrl) issues.push(`canonical mismatch: ${path} -> ${canonical ?? "missing"}`);
    if (!/<h1(?:\s|>)/.test(html)) issues.push(`missing H1: ${path}`);
    if (!html.includes('<noscript id="seo-content">')) issues.push(`missing stable SEO fallback: ${path}`);
    if (/name="robots"\s+content="noindex/.test(html)) issues.push(`sitemap URL is noindex: ${path}`);
  }

  for (const page of CORE_SEO_PAGES) {
    if (page.path !== "/" && blueprintCanonicalPaths.has(page.path)) continue;

    const file = flatHtmlPath(dist, page.path);
    if (!existsSync(file)) {
      issues.push(`missing prerender: ${file}`);
      continue;
    }
    const html = readFileSync(file, "utf8");
    if (!html.includes('<noscript id="seo-content">')) {
      issues.push(`missing no-JS SEO fallback: ${page.path}`);
    }
    if (!html.includes(`<h1>${escapeHtml(page.h1)}</h1>`)) {
      issues.push(`prerender H1 mismatch: ${page.path}`);
    }
    if (!html.includes('rel="canonical"')) issues.push(`missing canonical: ${page.path}`);
  }

  for (const blueprint of seoBlueprints) {
    const path = blueprint.canonical;
    const flatFile = flatHtmlPath(dist, path);
    const folderFile = folderHtmlPath(dist, path);

    if (!existsSync(flatFile)) issues.push(`missing blueprint flat prerender: ${path}`);
    if (!existsSync(folderFile)) issues.push(`missing blueprint folder prerender: ${path}`);
    if (!existsSync(flatFile)) continue;

    const html = readFileSync(flatFile, "utf8");
    if (!html.includes(`<h1>${escapeHtml(blueprint.h1)}</h1>`)) {
      issues.push(`blueprint prerender H1 mismatch: ${path}`);
    }
    if (!html.includes(`"@type":"FAQPage"`)) issues.push(`blueprint missing FAQ schema: ${path}`);
    if (!html.includes(`"@type":"SoftwareApplication"`)) {
      issues.push(`blueprint missing SoftwareApplication schema: ${path}`);
    }
    if (!html.includes(`"@type":"BreadcrumbList"`)) {
      issues.push(`blueprint missing BreadcrumbList schema: ${path}`);
    }
    if (!html.includes('id="thinkbetai-page-schema"')) {
      issues.push(`blueprint missing page schema script: ${path}`);
    }
  }

  const htmlFiles: string[] = [];
  const collectHtmlFiles = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const path = join(dir, entry);
      const stats = statSync(path);
      if (stats.isDirectory()) collectHtmlFiles(path);
      else if (entry.endsWith(".html")) htmlFiles.push(path);
    }
  };
  collectHtmlFiles(dist);

  for (const file of htmlFiles) {
    const html = readFileSync(file, "utf8");
    if (/href="\/(?:teams|players|predictions|matchups)\//.test(html)) {
      issues.push(`retired internal link in prerender: ${file}`);
    }
    if (/"@type":"SportsEvent"/.test(html) && !/"location":\{/.test(html)) {
      issues.push(`SportsEvent without location in prerender: ${file}`);
    }
  }
}

if (issues.length) {
  console.error(issues.join("\n"));
  process.exitCode = 1;
} else {
  console.log(
    `SEO audit passed: ${CORE_SEO_PAGES.length} core pages, ${seoBlueprints.length} blueprint pages, ${Object.keys(SEO_ALIAS_REDIRECTS).length} consolidated aliases.`,
  );
}
