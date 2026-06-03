// Serves dynamic sitemap.xml from seo_pages + core static routes.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const BASE_URL = "https://thinkbetai.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const STATIC_ROUTES: Array<{ path: string; priority: string; changefreq: string }> = [
  { path: "/", priority: "1.0", changefreq: "daily" },
  { path: "/games", priority: "0.9", changefreq: "hourly" },
  { path: "/picks", priority: "0.9", changefreq: "hourly" },
  { path: "/parlays", priority: "0.8", changefreq: "daily" },
  { path: "/player-props", priority: "0.8", changefreq: "hourly" },
  { path: "/pricing", priority: "0.7", changefreq: "weekly" },
  { path: "/about", priority: "0.5", changefreq: "monthly" },
  { path: "/blog", priority: "0.7", changefreq: "weekly" },
  { path: "/faq", priority: "0.5", changefreq: "monthly" },
  { path: "/how-it-works", priority: "0.6", changefreq: "monthly" },
  { path: "/ai-sports-picks", priority: "0.7", changefreq: "weekly" },
  { path: "/best-ai-betting-app", priority: "0.7", changefreq: "weekly" },
  { path: "/free-ai-predictions", priority: "0.7", changefreq: "weekly" },
  { path: "/ai-nfl-picks", priority: "0.7", changefreq: "weekly" },
  { path: "/ai-parlay-builder", priority: "0.7", changefreq: "weekly" },
  { path: "/ai-sports-betting", priority: "0.7", changefreq: "weekly" },
  { path: "/ai-bet-analyzer", priority: "0.7", changefreq: "weekly" },
  { path: "/best-ai-sports-betting-tools", priority: "0.7", changefreq: "weekly" },
];

const TYPE_PREFIX: Record<string, string> = {
  game_preview: "/predictions/",
  game_result: "/predictions/",
  team: "/teams/",
  player: "/players/",
  player_prop: "/props/",
  daily_best: "/best/",
  matchup: "/matchups/",
  league: "/leagues/",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  const { data: pages } = await supabase
    .from("seo_pages")
    .select("slug, page_type, updated_at, status")
    .order("updated_at", { ascending: false })
    .limit(40000);

  const entries: string[] = [];
  for (const s of STATIC_ROUTES) {
    entries.push(
      `  <url>\n    <loc>${BASE_URL}${s.path}</loc>\n    <changefreq>${s.changefreq}</changefreq>\n    <priority>${s.priority}</priority>\n  </url>`,
    );
  }
  for (const p of pages ?? []) {
    const prefix = TYPE_PREFIX[p.page_type];
    if (!prefix) continue;
    const lastmod = new Date(p.updated_at).toISOString().slice(0, 10);
    const priority = p.status === "upcoming" ? "0.8" : "0.5";
    entries.push(
      `  <url>\n    <loc>${BASE_URL}${prefix}${p.slug}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <priority>${priority}</priority>\n  </url>`,
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
