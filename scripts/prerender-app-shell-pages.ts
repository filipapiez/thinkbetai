/**
 * Writes small noindex snapshots for private app routes. This prevents the
 * SPA catch-all from serving homepage HTML for /login, /account, /games, etc.
 * and gives those URLs a quick first paint while React loads the real screen.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { APP_SHELL_PAGES, type AppShellPage } from "../src/appShellPages";

const BASE = "https://thinkbetai.com";
const DIST = resolve("dist");
const indexPath = join(DIST, "index.html");

if (!existsSync(indexPath)) {
  console.warn("[prerender-app-shell] dist/index.html missing — skipping.");
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

function renderBody(page: AppShellPage) {
  return `<div id="root"><div id="seo-prerender">
  <main style="min-height:100vh;display:grid;place-items:center;margin:0;padding:2rem;background:#07111f;color:#f8fafc;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
    <section style="max-width:38rem;text-align:center;">
      <p style="margin:0 0 1rem;color:#2dd4bf;font-weight:800;letter-spacing:.08em;text-transform:uppercase;">ThinkBetAI</p>
      <h1 style="margin:0;font-size:clamp(2rem,8vw,4rem);line-height:1.02;">${escapeHtml(page.h1)}</h1>
      <p style="margin:1rem auto 0;max-width:32rem;color:#9aa7bd;font-size:1.125rem;line-height:1.6;">${escapeHtml(page.intro)}</p>
    </section>
  </main>
</div></div>`;
}

function build(page: AppShellPage) {
  const url = `${BASE}${page.path}`;
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
    '<meta name="robots" content="noindex, follow" />',
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
  html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, "");
  html = html.replace(
    "</head>",
    `<link rel="canonical" href="${escapeHtml(url)}" />\n</head>`,
  );
  html = html.replace(/<div id="root"><\/div>/, renderBody(page));
  return html;
}

let written = 0;

for (const page of APP_SHELL_PAGES) {
  const html = build(page);
  const slug = page.path.slice(1);
  const flatFile = join(DIST, `${slug}.html`);
  mkdirSync(dirname(flatFile), { recursive: true });
  writeFileSync(flatFile, html);

  const nested = join(DIST, slug, "index.html");
  mkdirSync(dirname(nested), { recursive: true });
  writeFileSync(nested, html);
  written++;
}

const notFoundHtml = build({
  path: "/404",
  title: "Page Not Found | ThinkBetAI",
  description: "The requested ThinkBetAI page does not exist or has moved.",
  h1: "Page Not Found",
  intro: "The page you requested does not exist. Use the navigation or return to the homepage.",
});
writeFileSync(join(DIST, "404.html"), notFoundHtml);
const nestedNotFound = join(DIST, "404", "index.html");
mkdirSync(dirname(nestedNotFound), { recursive: true });
writeFileSync(nestedNotFound, notFoundHtml);

console.log(`✓ prerendered ${written} noindex app-shell pages and 404.html`);
