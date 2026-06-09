// Daily cron: re-submit sitemaps to Google Search Console to force re-crawl.
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

Deno.serve(async () => {
  const results = await Promise.all([
    submit("https://thinkbetai.com/sitemap-index.xml"),
    submit("https://thinkbetai.com/sitemap.xml"),
    submit("https://thinkbetai.com/sitemap-blog.xml"),
    submit("https://thinkbetai.com/sitemap-dynamic.xml"),
  ]);
  console.log("gsc-ping results", JSON.stringify(results));
  return new Response(JSON.stringify({ ok: true, results }), {
    headers: { "Content-Type": "application/json" },
  });
});
