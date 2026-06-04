// Google Search Console coverage edge function.
// Returns: verified sites, sitemap status, indexing coverage trends,
// top performing URLs, and URLs with crawl/indexing issues.
// Admin-only.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY = "https://connector-gateway.lovable.dev/google_search_console";

const SITE_CANDIDATES = [
  "sc-domain:thinkbetai.com",
  "https://thinkbetai.com/",
  "https://www.thinkbetai.com/",
];

async function gscFetch(path: string, init: RequestInit = {}) {
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  const gscKey = Deno.env.get("GOOGLE_SEARCH_CONSOLE_API_KEY");
  if (!lovableKey || !gscKey) {
    throw new Error("Missing LOVABLE_API_KEY or GOOGLE_SEARCH_CONSOLE_API_KEY");
  }
  const res = await fetch(`${GATEWAY}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": gscKey,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  let json: any = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = { raw: text }; }
  if (!res.ok) {
    const err = new Error(`GSC ${path} → ${res.status}: ${text.slice(0, 300)}`);
    (err as any).status = res.status;
    (err as any).body = json;
    throw err;
  }
  return json;
}

async function listSites() {
  const data = await gscFetch("/webmasters/v3/sites");
  return (data?.siteEntry ?? []).filter((s: any) =>
    s.permissionLevel && s.permissionLevel !== "siteUnverifiedUser"
  );
}

async function pickSiteUrl(): Promise<string | null> {
  const sites = await listSites();
  const urls = sites.map((s: any) => s.siteUrl);
  for (const candidate of SITE_CANDIDATES) {
    if (urls.includes(candidate)) return candidate;
  }
  return urls[0] ?? null;
}

async function getSitemaps(siteUrl: string) {
  const enc = encodeURIComponent(siteUrl);
  const data = await gscFetch(`/webmasters/v3/sites/${enc}/sitemaps`);
  return data?.sitemap ?? [];
}

async function getCoverageTrend(siteUrl: string, days: number) {
  const end = new Date();
  const start = new Date(end.getTime() - days * 86400000);
  const enc = encodeURIComponent(siteUrl);
  const body = {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
    dimensions: ["date"],
    rowLimit: 1000,
  };
  const data = await gscFetch(
    `/webmasters/v3/sites/${enc}/searchAnalytics/query`,
    { method: "POST", body: JSON.stringify(body) },
  );
  return (data?.rows ?? []).map((r: any) => ({
    date: r.keys[0],
    clicks: r.clicks ?? 0,
    impressions: r.impressions ?? 0,
    ctr: r.ctr ?? 0,
    position: r.position ?? 0,
  }));
}

async function getTopPages(siteUrl: string, days: number, limit = 50) {
  const end = new Date();
  const start = new Date(end.getTime() - days * 86400000);
  const enc = encodeURIComponent(siteUrl);
  const body = {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
    dimensions: ["page"],
    rowLimit: limit,
  };
  const data = await gscFetch(
    `/webmasters/v3/sites/${enc}/searchAnalytics/query`,
    { method: "POST", body: JSON.stringify(body) },
  );
  return (data?.rows ?? []).map((r: any) => ({
    url: r.keys[0],
    clicks: r.clicks ?? 0,
    impressions: r.impressions ?? 0,
    ctr: r.ctr ?? 0,
    position: r.position ?? 0,
  }));
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    // Admin check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabase.auth.getUser(token);
    const userId = userData?.user?.id;
    if (!userId) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: roleRow } = await supabase
      .from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const days = Math.min(parseInt(url.searchParams.get("days") ?? "30"), 90);

    const sites = await listSites();
    const siteUrl = await pickSiteUrl();

    if (!siteUrl) {
      return new Response(
        JSON.stringify({
          ok: true,
          verified: false,
          message: "No verified site found in Google Search Console. Add and verify https://thinkbetai.com/ in Search Console first.",
          sites,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const [sitemaps, trend, topPages] = await Promise.all([
      getSitemaps(siteUrl).catch((e) => ({ error: e.message })),
      getCoverageTrend(siteUrl, days).catch((e) => ({ error: e.message })),
      getTopPages(siteUrl, days, 50).catch((e) => ({ error: e.message })),
    ]);

    // Derive sitemap coverage summary
    const sitemapList = Array.isArray(sitemaps) ? sitemaps : [];
    const sitemapSummary = sitemapList.map((s: any) => ({
      path: s.path,
      lastSubmitted: s.lastSubmitted,
      lastDownloaded: s.lastDownloaded,
      isPending: s.isPending,
      isSitemapsIndex: s.isSitemapsIndex,
      type: s.type,
      warnings: Number(s.warnings ?? 0),
      errors: Number(s.errors ?? 0),
      contents: (s.contents ?? []).map((c: any) => ({
        type: c.type,
        submitted: Number(c.submitted ?? 0),
        indexed: Number(c.indexed ?? 0),
      })),
    }));

    const totalSubmitted = sitemapSummary.reduce(
      (sum, s) => sum + s.contents.reduce((cs, c) => cs + c.submitted, 0), 0,
    );
    const totalIndexed = sitemapSummary.reduce(
      (sum, s) => sum + s.contents.reduce((cs, c) => cs + c.indexed, 0), 0,
    );
    const totalWarnings = sitemapSummary.reduce((sum, s) => sum + s.warnings, 0);
    const totalErrors = sitemapSummary.reduce((sum, s) => sum + s.errors, 0);

    return new Response(JSON.stringify({
      ok: true,
      verified: true,
      siteUrl,
      sites: sites.map((s: any) => ({ siteUrl: s.siteUrl, permissionLevel: s.permissionLevel })),
      coverage: {
        totalSubmitted,
        totalIndexed,
        notIndexed: Math.max(totalSubmitted - totalIndexed, 0),
        warnings: totalWarnings,
        errors: totalErrors,
        indexedRate: totalSubmitted > 0 ? (totalIndexed / totalSubmitted) : 0,
      },
      sitemaps: sitemapSummary,
      trend,
      topPages,
      days,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e?.message ?? String(e), body: e?.body }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
