// Generates sitemap-blog.xml and sitemap-index.xml from blogData.ts.
// Runs via npm predev/prebuild hooks so newly added blog posts always show up.
import { writeFileSync } from "fs";
import { resolve } from "path";
import { blogPosts } from "../src/lib/blogData";

const BASE = "https://thinkbetai.com";
const SUPABASE_DYNAMIC = "https://fmrcmbdgmhoylmxbapdr.supabase.co/functions/v1/sitemap-dynamic";
const today = new Date().toISOString().slice(0, 10);

// 1) Blog sitemap — auto-derived from blogPosts so new entries are always picked up.
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

// 2) Sitemap index — references every child sitemap. Add new sitemaps here as the site scales.
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
    <loc>${SUPABASE_DYNAMIC}</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
</sitemapindex>`;

writeFileSync(resolve("public/sitemap-index.xml"), indexXml);

console.log(`✓ sitemap-blog.xml (${blogPosts.length} posts) + sitemap-index.xml written`);
