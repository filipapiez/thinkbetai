import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, ExternalLink, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface SitemapEntry {
  path: string;
  lastSubmitted: string;
  lastDownloaded: string;
  isPending: boolean;
  warnings: number;
  errors: number;
  contents: { type: string; submitted: number; indexed: number }[];
}

interface TrendRow { date: string; clicks: number; impressions: number; ctr: number; position: number; }
interface TopPage { url: string; clicks: number; impressions: number; ctr: number; position: number; }

interface GscData {
  ok: boolean;
  verified: boolean;
  message?: string;
  siteUrl?: string;
  coverage?: {
    totalSubmitted: number; totalIndexed: number; notIndexed: number;
    warnings: number; errors: number; indexedRate: number;
  };
  sitemaps?: SitemapEntry[];
  trend?: TrendRow[];
  topPages?: TopPage[];
  error?: string;
}

export const GscCoveragePanel = () => {
  const [data, setData] = useState<GscData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  const load = async () => {
    setLoading(true);
    try {
      const { data: res, error } = await supabase.functions.invoke("gsc-coverage", {
        body: {},
        // pass days via query — invoke doesn't support query, so we use body and ignore
      });
      // invoke doesn't pass query params; rebuild URL manually
      const projectId = (import.meta.env as any).VITE_SUPABASE_PROJECT_ID;
      const session = (await supabase.auth.getSession()).data.session;
      const direct = await fetch(
        `https://${projectId}.supabase.co/functions/v1/gsc-coverage?days=${days}`,
        { headers: { Authorization: `Bearer ${session?.access_token ?? ""}` } },
      );
      const json = await direct.json();
      setData(json);
      if (!json.ok) toast.error(json.error ?? "Failed to load GSC data");
    } catch (e: any) {
      toast.error(e?.message ?? "GSC fetch failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [days]);

  if (loading && !data) {
    return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  if (!data?.ok) {
    return (
      <Card variant="glass">
        <CardContent className="pt-6">
          <p className="text-sm text-destructive">Failed to load Google Search Console data.</p>
          <p className="text-xs text-muted-foreground mt-2">{data?.error}</p>
          <Button size="sm" variant="outline" className="mt-3" onClick={load}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  if (!data.verified) {
    return (
      <Card variant="glass">
        <CardHeader><CardTitle className="text-base">Google Search Console — Not Verified</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground">{data.message}</p>
          <a
            href="https://search.google.com/search-console/welcome"
            target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            Open Search Console <ExternalLink className="h-3 w-3" />
          </a>
        </CardContent>
      </Card>
    );
  }

  const cov = data.coverage!;
  const trend = data.trend ?? [];
  const recent = trend.slice(-7);
  const totalClicks = trend.reduce((s, r) => s + r.clicks, 0);
  const totalImpressions = trend.reduce((s, r) => s + r.impressions, 0);
  const avgPosition = trend.length
    ? trend.reduce((s, r) => s + r.position, 0) / trend.length : 0;
  const issuePages = (data.topPages ?? []).filter((p) => p.impressions > 0 && p.clicks === 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-lg font-semibold">Google Search Console</h3>
          <p className="text-xs text-muted-foreground">Site: {data.siteUrl}</p>
        </div>
        <div className="flex gap-2">
          {[7, 30, 90].map((d) => (
            <Button key={d} size="sm" variant={days === d ? "default" : "outline"} onClick={() => setDays(d)}>
              {d}d
            </Button>
          ))}
          <Button size="sm" variant="outline" onClick={load} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card variant="glass"><CardContent className="pt-4">
          <p className="text-xs text-muted-foreground">URLs submitted</p>
          <p className="text-2xl font-bold">{cov.totalSubmitted.toLocaleString()}</p>
        </CardContent></Card>
        <Card variant="glass"><CardContent className="pt-4">
          <p className="text-xs text-muted-foreground">Indexed</p>
          <p className="text-2xl font-bold text-primary">{cov.totalIndexed.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">{Math.round(cov.indexedRate * 100)}% rate</p>
        </CardContent></Card>
        <Card variant="glass"><CardContent className="pt-4">
          <p className="text-xs text-muted-foreground">Not indexed</p>
          <p className="text-2xl font-bold text-yellow-500">{cov.notIndexed.toLocaleString()}</p>
        </CardContent></Card>
        <Card variant="glass"><CardContent className="pt-4">
          <p className="text-xs text-muted-foreground">Sitemap errors</p>
          <p className="text-2xl font-bold text-destructive">{cov.errors.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">{cov.warnings} warnings</p>
        </CardContent></Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card variant="glass"><CardContent className="pt-4">
          <p className="text-xs text-muted-foreground">Clicks ({days}d)</p>
          <p className="text-2xl font-bold">{totalClicks.toLocaleString()}</p>
        </CardContent></Card>
        <Card variant="glass"><CardContent className="pt-4">
          <p className="text-xs text-muted-foreground">Impressions ({days}d)</p>
          <p className="text-2xl font-bold">{totalImpressions.toLocaleString()}</p>
        </CardContent></Card>
        <Card variant="glass"><CardContent className="pt-4">
          <p className="text-xs text-muted-foreground">Avg. CTR</p>
          <p className="text-2xl font-bold">
            {totalImpressions > 0 ? `${((totalClicks / totalImpressions) * 100).toFixed(2)}%` : "—"}
          </p>
        </CardContent></Card>
        <Card variant="glass"><CardContent className="pt-4">
          <p className="text-xs text-muted-foreground">Avg. position</p>
          <p className="text-2xl font-bold">{avgPosition ? avgPosition.toFixed(1) : "—"}</p>
        </CardContent></Card>
      </div>

      <Card variant="glass">
        <CardHeader><CardTitle className="text-base">Submitted sitemaps</CardTitle></CardHeader>
        <CardContent>
          {data.sitemaps && data.sitemaps.length > 0 ? (
            <div className="space-y-2">
              {data.sitemaps.map((s) => {
                const sub = s.contents.reduce((a, c) => a + c.submitted, 0);
                const idx = s.contents.reduce((a, c) => a + c.indexed, 0);
                return (
                  <div key={s.path} className="flex items-center justify-between p-2 rounded border border-border text-sm flex-wrap gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {s.errors > 0 ? (
                        <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                      )}
                      <span className="font-mono text-xs truncate">{s.path}</span>
                    </div>
                    <div className="flex gap-2 text-xs">
                      <Badge variant="outline">{sub} submitted</Badge>
                      <Badge variant="outline">{idx} indexed</Badge>
                      {s.errors > 0 && <Badge variant="destructive">{s.errors} errors</Badge>}
                      {s.warnings > 0 && <Badge variant="secondary">{s.warnings} warnings</Badge>}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No sitemaps submitted. Submit /sitemap.xml in Search Console.</p>
          )}
        </CardContent>
      </Card>

      <Card variant="glass">
        <CardHeader><CardTitle className="text-base">Recent daily performance (last 7 days)</CardTitle></CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data yet — Google needs time to crawl new pages.</p>
          ) : (
            <div className="space-y-1">
              {recent.map((r) => (
                <div key={r.date} className="grid grid-cols-5 gap-2 text-xs py-1 border-b border-border/50 last:border-0">
                  <span className="font-mono">{r.date}</span>
                  <span>{r.clicks} clicks</span>
                  <span>{r.impressions} impr.</span>
                  <span>{(r.ctr * 100).toFixed(2)}% CTR</span>
                  <span>pos {r.position.toFixed(1)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card variant="glass">
        <CardHeader>
          <CardTitle className="text-base">Pages with impressions but 0 clicks ({issuePages.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {issuePages.length === 0 ? (
            <p className="text-sm text-muted-foreground">None — every page surfacing in search is getting clicks. 🎉</p>
          ) : (
            <div className="space-y-1 max-h-80 overflow-y-auto">
              {issuePages.slice(0, 25).map((p) => (
                <div key={p.url} className="flex items-center justify-between p-2 rounded border border-border text-xs gap-2">
                  <a href={p.url} target="_blank" rel="noopener noreferrer" className="truncate text-primary hover:underline">
                    {p.url.replace(/^https?:\/\/[^/]+/, "")}
                  </a>
                  <div className="flex gap-2 flex-shrink-0">
                    <Badge variant="outline">{p.impressions} impr.</Badge>
                    <Badge variant="outline">pos {p.position.toFixed(1)}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card variant="glass">
        <CardHeader><CardTitle className="text-base">Top performing pages</CardTitle></CardHeader>
        <CardContent>
          {!data.topPages || data.topPages.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data yet.</p>
          ) : (
            <div className="space-y-1 max-h-80 overflow-y-auto">
              {data.topPages.slice(0, 25).map((p) => (
                <div key={p.url} className="flex items-center justify-between p-2 rounded border border-border text-xs gap-2">
                  <a href={p.url} target="_blank" rel="noopener noreferrer" className="truncate text-primary hover:underline">
                    {p.url.replace(/^https?:\/\/[^/]+/, "")}
                  </a>
                  <div className="flex gap-2 flex-shrink-0">
                    <Badge variant="outline">{p.clicks} clicks</Badge>
                    <Badge variant="outline">{p.impressions} impr.</Badge>
                    <Badge variant="outline">pos {p.position.toFixed(1)}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
