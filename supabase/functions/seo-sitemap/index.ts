// Serves a conservative public sitemap fallback.
// Do not include app/private routes or retired DB-backed programmatic pages here;
// the canonical generated sitemap is public/sitemap.xml.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const BASE_URL = "https://thinkbetai.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const STATIC_ROUTES: Array<{ path: string; priority: string; changefreq: string }> = [
  { path: "/", priority: "1.0", changefreq: "daily" },
  { path: "/pricing", priority: "0.7", changefreq: "weekly" },
  { path: "/about", priority: "0.5", changefreq: "monthly" },
  { path: "/blog", priority: "0.7", changefreq: "weekly" },
  { path: "/faq", priority: "0.5", changefreq: "monthly" },
  { path: "/how-it-works", priority: "0.6", changefreq: "monthly" },
  { path: "/ai-sports-picks", priority: "0.8", changefreq: "weekly" },
  { path: "/ai-sports-predictions", priority: "0.9", changefreq: "daily" },
  { path: "/ai-betting-predictions", priority: "0.9", changefreq: "daily" },
  { path: "/best-ai-betting-picks", priority: "0.9", changefreq: "daily" },
  { path: "/free-ai-sports-predictions", priority: "0.9", changefreq: "daily" },
  { path: "/free-ai-sports-predictions-today", priority: "0.9", changefreq: "daily" },
  { path: "/sports-betting-ai", priority: "0.9", changefreq: "weekly" },
  { path: "/ai-sports-picks-today", priority: "0.9", changefreq: "daily" },
  { path: "/ai-sports-predictor", priority: "0.85", changefreq: "weekly" },
  { path: "/ai-betting-app", priority: "0.85", changefreq: "weekly" },
  { path: "/ai-betting-assistant", priority: "0.85", changefreq: "weekly" },
  { path: "/ai-parlay-builder", priority: "0.85", changefreq: "weekly" },
  { path: "/ai-parlay-generator", priority: "0.85", changefreq: "weekly" },
  { path: "/free-ai-parlay-generator", priority: "0.85", changefreq: "weekly" },
  { path: "/parlay-builder", priority: "0.85", changefreq: "weekly" },
  { path: "/parlay-maker-ai", priority: "0.85", changefreq: "weekly" },
  { path: "/thinkbetai-reviews", priority: "0.85", changefreq: "weekly" },
  { path: "/best-ai-betting-app", priority: "0.7", changefreq: "weekly" },
  { path: "/free-ai-predictions", priority: "0.7", changefreq: "weekly" },
  { path: "/ai-nfl-picks", priority: "0.7", changefreq: "weekly" },
  { path: "/ai-sports-betting", priority: "0.7", changefreq: "weekly" },
  { path: "/ai-bet-analyzer", priority: "0.7", changefreq: "weekly" },
  { path: "/best-ai-sports-betting-tools", priority: "0.7", changefreq: "weekly" },
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const entries: string[] = [];
  for (const s of STATIC_ROUTES) {
    entries.push(
      `  <url>\n    <loc>${BASE_URL}${s.path}</loc>\n    <changefreq>${s.changefreq}</changefreq>\n    <priority>${s.priority}</priority>\n  </url>`,
    );
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</urlset>`;

  return new Response(xml, {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
});
