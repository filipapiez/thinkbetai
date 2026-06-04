// Auto-updating sitemap of all rows in seo_pages. Submitted to GSC as a secondary sitemap.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BASE = "https://thinkbetai.com";
const PATH_MAP: Record<string, string> = {
  team: "/teams/",
  game_preview: "/predictions/",
  game_result: "/predictions/",
  daily_best: "/best/",
  player: "/players/",
  prop: "/props/",
  matchup: "/matchups/",
  league: "/leagues/",
};
const PRIO: Record<string, string> = {
  team: "0.75", game_preview: "0.8", game_result: "0.6", daily_best: "0.85",
  player: "0.7", prop: "0.7", matchup: "0.7", league: "0.75",
};
const FREQ: Record<string, string> = {
  team: "weekly", game_preview: "daily", game_result: "monthly", daily_best: "daily",
  player: "weekly", prop: "daily", matchup: "weekly", league: "weekly",
};

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const rows: { page_type: string; slug: string; updated_at: string | null; created_at: string }[] = [];
  let from = 0;
  const PAGE = 1000;
  while (true) {
    const { data, error } = await supabase
      .from("seo_pages")
      .select("page_type, slug, updated_at, created_at")
      .range(from, from + PAGE - 1);
    if (error) return new Response(error.message, { status: 500 });
    if (!data || data.length === 0) break;
    rows.push(...data);
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

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
});
