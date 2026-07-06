// Legacy endpoint kept only to consolidate old submitted sitemap URLs.
// The former implementation emitted retired /predictions/*, /teams/*,
// /players/*, /props/*, /matchups/*, /best/*, and /leagues/* pages, which
// created Search Console noindex noise. Redirect crawlers to the clean sitemap.

Deno.serve(() =>
  Response.redirect("https://thinkbetai.com/sitemap.xml", 301)
);
