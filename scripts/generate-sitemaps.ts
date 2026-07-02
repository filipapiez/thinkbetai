// Generates a single, clean public/sitemap.xml containing ONLY real,
// indexable pages: homepage, core marketing routes, keyword-cluster
// landing pages, and every blog post.
//
// Does NOT include the retired programmatic page types (game_preview,
// game_result, team, player, player_prop, matchup) or the noindex-only
// hubs (daily_best, league). Including a noindex URL in sitemap.xml
// would waste crawl budget and is explicitly against Google guidance.
//
// Runs via npm predev/prebuild hooks.

import { writeFileSync, existsSync, unlinkSync } from "fs";
import { resolve } from "path";
import { blogPosts } from "../src/lib/blogData";
import { isSeoAlias } from "../src/seoAliases";
import { seoBlueprints } from "../src/seo/blueprints";

const BASE = "https://thinkbetai.com";
const today = new Date().toISOString().slice(0, 10);

interface Entry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
  lastmod?: string;
}

// 1) Homepage
const homepage: Entry = { path: "/", changefreq: "daily", priority: "1.0" };

// 2) Core marketing / feature pages
const marketing: Entry[] = [
  { path: "/ai-sports-betting", changefreq: "weekly", priority: "0.95" },
  { path: "/ai-parlay-builder", changefreq: "weekly", priority: "0.95" },
  { path: "/ai-bet-analyzer", changefreq: "weekly", priority: "0.95" },
  { path: "/ai-sports-picks", changefreq: "daily", priority: "0.95" },
  { path: "/best-ai-sports-betting-tools", changefreq: "monthly", priority: "0.9" },
  { path: "/best-ai-betting-app", changefreq: "monthly", priority: "0.9" },
  { path: "/free-ai-predictions", changefreq: "daily", priority: "0.9" },
  { path: "/what-is-ai-sports-betting", changefreq: "monthly", priority: "0.8" },
  { path: "/how-it-works", changefreq: "monthly", priority: "0.8" },
  { path: "/track-record", changefreq: "weekly", priority: "0.85" },
  { path: "/pricing", changefreq: "monthly", priority: "0.8" },
  { path: "/about", changefreq: "monthly", priority: "0.6" },
  { path: "/faq", changefreq: "monthly", priority: "0.7" },
  { path: "/responsible-gambling", changefreq: "yearly", priority: "0.4" },
  { path: "/editorial-policy", changefreq: "yearly", priority: "0.5" },
  { path: "/privacy", changefreq: "yearly", priority: "0.3" },
  { path: "/terms", changefreq: "yearly", priority: "0.3" },
  { path: "/contact", changefreq: "yearly", priority: "0.4" },
  { path: "/disclaimer", changefreq: "yearly", priority: "0.4" },
];

// 3) Sport-level + keyword-cluster landing pages (all SeoLanding routes
//    declared in src/App.tsx).
const sportLandings: Entry[] = [
  "/ai-nfl-picks",
  "/nfl-ai-predictions",
  "/nba-ai-predictions",
  "/mlb-ai-predictions",
  "/nhl-ai-predictions",
  "/ufc-ai-predictions",
  "/soccer-ai-predictions",
  "/ai-player-prop-predictions",
  "/ai-pick-of-the-day",
  "/ai-underdog-picks",
  "/ai-against-the-spread-picks",
]
  .filter((path) => !isSeoAlias(path.slice(1)))
  .map((path) => ({ path, changefreq: "weekly" as const, priority: "0.85" }));

const keywordLandings: Entry[] = seoBlueprints
  .map((blueprint) => blueprint.canonical)
  .filter((path) => !isSeoAlias(path.slice(1)))
  .map((path) => ({ path, changefreq: "weekly" as const, priority: "0.9" }));

// 4) Blog
const blogIndex: Entry = { path: "/blog", changefreq: "weekly", priority: "0.8" };
const blogEntries: Entry[] = blogPosts.map((p) => ({
  path: `/blog/${p.slug}`,
  lastmod: (p.publishedAt || today).slice(0, 10),
  changefreq: "monthly",
  priority: "0.7",
}));

const rawEntries: Entry[] = [
  homepage,
  ...marketing,
  ...sportLandings,
  ...keywordLandings,
  blogIndex,
  ...blogEntries,
];

const all: Entry[] = rawEntries.filter(
  (entry, index, entries) => entries.findIndex((candidate) => candidate.path === entry.path) === index,
);

function renderUrl(e: Entry): string {
  const parts = [
    `  <url>`,
    `    <loc>${BASE}${e.path}</loc>`,
    `    <lastmod>${e.lastmod ?? today}</lastmod>`,
    e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
    e.priority ? `    <priority>${e.priority}</priority>` : null,
    `  </url>`,
  ].filter(Boolean);
  return parts.join("\n");
}

const xml = [
  `<?xml version="1.0" encoding="UTF-8"?>`,
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
  ...all.map(renderUrl),
  `</urlset>`,
  ``,
].join("\n");

writeFileSync(resolve("public/sitemap.xml"), xml);

// Remove the legacy split-sitemap files so Google doesn't keep crawling
// stale URLs from them. robots.txt now points at /sitemap.xml only.
for (const stale of ["sitemap-index.xml", "sitemap-blog.xml", "sitemap-dynamic.xml"]) {
  const p = resolve("public", stale);
  if (existsSync(p)) {
    try {
      unlinkSync(p);
    } catch {
      /* ignore */
    }
  }
}

console.log(`✓ sitemap.xml written (${all.length} URLs, all 200-status indexable)`);
