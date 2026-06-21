// Daily cron: re-submit the canonical sitemap to Google Search Console to force re-crawl.
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const GSC_API_KEY = Deno.env.get("GOOGLE_SEARCH_CONSOLE_API_KEY")!;
const SITE = "sc-domain:thinkbetai.com";

async function submit(sitemapUrl: string) {
  const path = `/google_search_console/webmasters/v3/sites/${encodeURIComponent(SITE)}/sitemaps/${encodeURIComponent(sitemapUrl)}`;
  const res = await fetch(`https://connector-gateway.lovable.dev${path}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": GSC_API_KEY,
    },
  });
  return { url: sitemapUrl, status: res.status, ok: res.ok };
}

async function remove(sitemapUrl: string) {
  const path = `/google_search_console/webmasters/v3/sites/${encodeURIComponent(SITE)}/sitemaps/${encodeURIComponent(sitemapUrl)}`;
  const res = await fetch(`https://connector-gateway.lovable.dev${path}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": GSC_API_KEY,
    },
  });
  return { url: sitemapUrl, status: res.status, ok: res.ok };
}

Deno.serve(async () => {
  // Remove legacy split sitemaps from GSC (they 404 now) and re-submit
  // the single canonical sitemap.
  const removed = await Promise.all([
    remove("https://thinkbetai.com/sitemap-index.xml"),
    remove("https://thinkbetai.com/sitemap-blog.xml"),
    remove("https://thinkbetai.com/sitemap-dynamic.xml"),
  ]);
  const submitted = await submit("https://thinkbetai.com/sitemap.xml");
  console.log("gsc-ping results", JSON.stringify({ removed, submitted }));
  return new Response(JSON.stringify({ ok: true, removed, submitted }), {
    headers: { "Content-Type": "application/json" },
  });
});
