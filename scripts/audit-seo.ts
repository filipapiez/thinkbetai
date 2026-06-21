import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { CORE_SEO_PAGES } from "../src/seoCorePages";
import { SEO_ALIAS_REDIRECTS } from "../src/seoAliases";

const issues: string[] = [];
const sitemapPath = resolve("public/sitemap.xml");
const sitemap = readFileSync(sitemapPath, "utf8");
const sitemapUrls = new Set(
  [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]),
);

for (const [slug, destination] of Object.entries(SEO_ALIAS_REDIRECTS)) {
  if (sitemapUrls.has(`https://thinkbetai.com/${slug}`)) {
    issues.push(`alias remains in sitemap: /${slug}`);
  }
  if (!destination.startsWith("/")) issues.push(`invalid alias destination: ${destination}`);
}

for (const page of CORE_SEO_PAGES) {
  const url = `https://thinkbetai.com${page.path}`;
  if (!sitemapUrls.has(url)) issues.push(`core page missing from sitemap: ${page.path}`);
  if (page.title.length > 60) issues.push(`title too long (${page.title.length}): ${page.path}`);
  if (page.description.length < 110 || page.description.length > 160) {
    issues.push(`description length ${page.description.length}: ${page.path}`);
  }
}

const dist = resolve("dist");
if (existsSync(dist)) {
  const titles = new Map<string, string>();
  for (const sitemapUrl of sitemapUrls) {
    const parsed = new URL(sitemapUrl);
    const path = parsed.pathname;
    const file = path === "/" ? join(dist, "index.html") : join(dist, `${path.slice(1)}.html`);
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
    const file =
      page.path === "/" ? join(dist, "index.html") : join(dist, `${page.path.slice(1)}.html`);
    if (!existsSync(file)) {
      issues.push(`missing prerender: ${file}`);
      continue;
    }
    const html = readFileSync(file, "utf8");
    if (!html.includes('<noscript id="seo-content">')) {
      issues.push(`missing no-JS SEO fallback: ${page.path}`);
    }
    if (!html.includes(`<h1>${page.h1}</h1>`)) issues.push(`prerender H1 mismatch: ${page.path}`);
    if (!html.includes('rel="canonical"')) issues.push(`missing canonical: ${page.path}`);
  }

  const htmlFiles = readdirSync(dist).filter((file) => file.endsWith(".html"));
  for (const file of htmlFiles) {
    const html = readFileSync(join(dist, file), "utf8");
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
    `SEO audit passed: ${CORE_SEO_PAGES.length} core pages, ${Object.keys(SEO_ALIAS_REDIRECTS).length} consolidated aliases.`,
  );
}
