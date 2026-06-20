// Prerender DB-backed SEO pages into static HTML snapshots.
//
// Scope reduced (Dec 2026): only daily_best + league remain. All other
// programmatic page types (game_preview, game_result, team, player,
// player_prop, matchup) were retired for SEO hygiene — their routes are
// removed from src/App.tsx and now fall through to the 404 route.
//
// The remaining types are kept live but NOINDEX while their content is
// improved, so prerendered snapshots still carry a noindex robots meta.
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
  league: "/leagues/",
};

const TYPE_LIMITS: Record<string, number> = {
  daily_best: 50,
  league: 50,
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
    const { data, error } = await supabase
      .from("seo_pages")
      .select("slug,page_type,sport,title,meta_description,h1,content_json,status,game_date,updated_at")
      .eq("page_type", pageType)
      .order("updated_at", { ascending: false })
      .range(0, limit - 1);
    if (error) {
      console.warn(`[prerender-seo-pages] ${pageType} read failed:`, error.message);
      continue;
    }
    if (data) rows.push(...(data as Row[]));
  }
  return rows;
}

function renderBody(r: Row): string {
  const c = r.content_json || {};
  const longForm =
    typeof c.longForm === "string" && c.longForm.length
      ? `<article>${c.longForm
          .split(/\n{2,}/)
          .map((p: string) => `<p>${escapeHtml(p)}</p>`)
          .join("")}</article>`
      : "";
  const sportBadge = r.sport ? `<p><strong>${escapeHtml(r.sport)}</strong></p>` : "";
  return `
<div id="root">
  <main style="max-width:64rem;margin:0 auto;padding:2rem 1rem;">
    ${sportBadge}
    <h1>${escapeHtml(r.h1 ?? r.title)}</h1>
    ${r.meta_description ? `<p>${escapeHtml(r.meta_description)}</p>` : ""}
    ${longForm}
    <p><a href="/ai-sports-picks">See AI sports picks</a> · <a href="/pricing">View pricing</a></p>
  </main>
</div>`;
}

function patchHtml(r: Row): string {
  const prefix = PATH_MAP[r.page_type];
  const url = `${BASE}${prefix}${r.slug}`;
  const title = r.title;
  const desc = r.meta_description ?? "";
  // All remaining programmatic pages are noindex while content is improved.
  const robots = "noindex, follow";

  let html = baseHtml;
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`);
  html = html.replace(/<meta\s+name="title"[^>]*>/, `<meta name="title" content="${escapeAttr(title)}" />`);
  html = html.replace(/<meta\s+name="description"[^>]*>/, `<meta name="description" content="${escapeAttr(desc)}" />`);
  html = html.replace(/<meta\s+name="robots"[^>]*>/, `<meta name="robots" content="${escapeAttr(robots)}" />`);
  html = html.replace(/<meta\s+property="og:url"[^>]*>/, `<meta property="og:url" content="${escapeAttr(url)}" />`);
  html = html.replace(/<meta\s+property="og:title"[^>]*>/, `<meta property="og:title" content="${escapeAttr(title)}" />`);
  html = html.replace(/<meta\s+property="og:description"[^>]*>/, `<meta property="og:description" content="${escapeAttr(desc)}" />`);

  const headInsert = `<link rel="canonical" href="${escapeAttr(url)}" />\n</head>`;
  html = html.replace("</head>", headInsert);
  html = html.replace(/<div id="root"><\/div>/, renderBody(r));
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
    const slugPath = prefix.replace(/^\/|\/$/g, "");
    const html = patchHtml(r);
    const dir = join(DIST, slugPath, r.slug);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "index.html"), html);
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
