// Generates sitemap-blog.xml, sitemap-dynamic.xml, and sitemap-index.xml.
// Runs via npm predev/prebuild hooks so newly added blog posts and seo_pages
// rows are always picked up AND served from the same hostname as the site
// (Google ignores cross-domain sitemap URLs unless the other host is also
// a verified property).
import { writeFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import { blogPosts } from "../src/lib/blogData";

const BASE = "https://thinkbetai.com";
const today = new Date().toISOString().slice(0, 10);

// -------------------------------------------------------------------
// 1) Blog sitemap — derived from blogPosts so new entries auto-appear.
// -------------------------------------------------------------------
const blogUrls = blogPosts
  .map((p) => {
    const lastmod = (p.publishedAt || today).slice(0, 10);
    return `  <url>\n    <loc>${BASE}/blog/${p.slug}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>`;
  })
  .join("\n");

const blogXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${BASE}/blog</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
${blogUrls}
</urlset>`;

writeFileSync(resolve("public/sitemap-blog.xml"), blogXml);

// -------------------------------------------------------------------
// 2) Dynamic sitemap — pulled from seo_pages and written as a STATIC
//    file on thinkbetai.com so Google accepts the URLs (same-hostname
//    rule). Falls back to the edge function output if direct DB read
//    fails, and leaves the existing file untouched if both fail.
// -------------------------------------------------------------------
// IMPORTANT: We only expose high-value SEO pages to Google.
// Thin DB-generated pages (team rosters, individual game previews/results)
// were diluting crawl budget and signaling low quality. They still exist
// at /teams/* and /predictions/* for direct visitors, but we no longer
// advertise them in the sitemap. Only the curated /best/* (daily_best)
// pages are indexed.
const ALLOWED_PAGE_TYPES = new Set(["daily_best"]);
const PATH_MAP: Record<string, string> = {
  daily_best: "/best/",
};
const PRIO: Record<string, string> = {
  daily_best: "0.85",
};
const FREQ: Record<string, string> = {
  daily_best: "daily",
};

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "https://fmrcmbdgmhoylmxbapdr.supabase.co";
const SUPABASE_ANON = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";

async function buildDynamicXml(): Promise<string | null> {
  // Try direct DB read first (most reliable, no edge cold-start)
  try {
    if (!SUPABASE_ANON) throw new Error("no anon key");
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);
    const rows: { page_type: string; slug: string; updated_at: string | null; created_at: string }[] = [];
    let from = 0;
    const PAGE = 1000;
    while (true) {
      const { data, error } = await supabase
        .from("seo_pages")
        .select("page_type, slug, updated_at, created_at")
        .in("page_type", Array.from(ALLOWED_PAGE_TYPES))
        .range(from, from + PAGE - 1);
      if (error) throw error;
      if (!data || data.length === 0) break;
      rows.push(...(data as any[]));
      if (data.length < PAGE) break;
      from += PAGE;
    }
    const urls = rows
      .map((r) => {
        const base = PATH_MAP[r.page_type];
        if (!base) return null;
        const lm = (r.updated_at || r.created_at).slice(0, 10);
        return `  <url><loc>${BASE}${base}${r.slug}</loc><lastmod>${lm}</lastmod><changefreq>${FREQ[r.page_type] || "weekly"}</changefreq><priority>${PRIO[r.page_type] || "0.7"}</priority></url>`;
      })
      .filter(Boolean)
      .join("\n");
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
  } catch (e) {
    console.warn("dynamic sitemap DB read failed:", (e as Error).message);
    return null;
  }
}

const dynamicXml = await buildDynamicXml();
let dynamicCount = 0;
if (dynamicXml) {
  writeFileSync(resolve("public/sitemap-dynamic.xml"), dynamicXml);
  dynamicCount = (dynamicXml.match(/<url>/g) || []).length;
} else {
  console.warn("⚠ sitemap-dynamic.xml not regenerated — keeping existing file (if any).");
}

// -------------------------------------------------------------------
// 3) Sitemap index — now all on thinkbetai.com (no cross-domain refs).
// -------------------------------------------------------------------
const indexXml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${BASE}/sitemap.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE}/sitemap-blog.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${BASE}/sitemap-dynamic.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
</sitemapindex>`;

writeFileSync(resolve("public/sitemap-index.xml"), indexXml);

console.log(`✓ sitemaps written — blog: ${blogPosts.length}, dynamic: ${dynamicCount}`);
