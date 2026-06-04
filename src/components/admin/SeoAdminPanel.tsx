import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Play, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { GscCoveragePanel } from "./GscCoveragePanel";

interface RunLog {
  id: string;
  job_name: string;
  started_at: string;
  finished_at: string | null;
  status: string;
  pages_created: number;
  pages_updated: number;
  pages_failed: number;
  next_run_at: string | null;
}

interface PageError {
  id: string;
  slug: string | null;
  page_type: string | null;
  reason: string;
  created_at: string;
}

export const SeoAdminPanel = () => {
  const [runs, setRuns] = useState<RunLog[]>([]);
  const [errors, setErrors] = useState<PageError[]>([]);
  const [totals, setTotals] = useState<{ total: number; today: number; byType: Record<string, number> }>({
    total: 0,
    today: 0,
    byType: {},
  });
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const load = async () => {
    setLoading(true);
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    const [runsRes, errorsRes, totalRes, todayRes, allTypesRes] = await Promise.all([
      supabase.from("seo_run_logs").select("*").order("started_at", { ascending: false }).limit(10),
      supabase.from("seo_page_errors").select("*").order("created_at", { ascending: false }).limit(20),
      supabase.from("seo_pages").select("id", { count: "exact", head: true }),
      supabase
        .from("seo_pages")
        .select("id", { count: "exact", head: true })
        .gte("created_at", todayStart.toISOString()),
      supabase.from("seo_pages").select("page_type"),
    ]);

    setRuns((runsRes.data as RunLog[]) ?? []);
    setErrors((errorsRes.data as PageError[]) ?? []);
    const byType: Record<string, number> = {};
    for (const row of (allTypesRes.data ?? []) as any[]) {
      byType[row.page_type] = (byType[row.page_type] ?? 0) + 1;
    }
    setTotals({
      total: totalRes.count ?? 0,
      today: todayRes.count ?? 0,
      byType,
    });
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const runNow = async () => {
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("seo-generate-daily");
      if (error) throw error;
      toast.success(`Run complete: +${data?.created ?? 0} created, ${data?.updated ?? 0} updated, ${data?.failed ?? 0} failed`);
      await load();
    } catch (e: any) {
      toast.error(`Run failed: ${e?.message ?? "unknown"}`);
    } finally {
      setRunning(false);
    }
  };

  const lastRun = runs[0];
  const todayFailed = runs.filter((r) => {
    const d = new Date(r.started_at);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  }).reduce((sum, r) => sum + (r.pages_failed ?? 0), 0);

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xl font-semibold">SEO Automation</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
          <Button size="sm" onClick={runNow} disabled={running}>
            {running ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Play className="h-4 w-4 mr-1" />}
            Run now
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card variant="glass"><CardContent className="pt-4">
          <p className="text-xs text-muted-foreground">Total SEO pages</p>
          <p className="text-2xl font-bold">{totals.total.toLocaleString()}</p>
        </CardContent></Card>
        <Card variant="glass"><CardContent className="pt-4">
          <p className="text-xs text-muted-foreground">Created today</p>
          <p className="text-2xl font-bold">{totals.today.toLocaleString()}</p>
        </CardContent></Card>
        <Card variant="glass"><CardContent className="pt-4">
          <p className="text-xs text-muted-foreground">Failed today</p>
          <p className="text-2xl font-bold text-destructive">{todayFailed}</p>
        </CardContent></Card>
        <Card variant="glass"><CardContent className="pt-4">
          <p className="text-xs text-muted-foreground">Next scheduled run</p>
          <p className="text-sm font-semibold">
            {lastRun?.next_run_at
              ? new Date(lastRun.next_run_at).toLocaleString()
              : "00:01 UTC daily"}
          </p>
        </CardContent></Card>
      </div>

      <Card variant="glass">
        <CardHeader><CardTitle className="text-base">Pages by type</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {Object.entries(totals.byType).map(([type, count]) => (
            <Badge key={type} variant="outline">{type}: {count}</Badge>
          ))}
          {Object.keys(totals.byType).length === 0 && (
            <p className="text-sm text-muted-foreground">No pages yet — click "Run now" to generate the first batch.</p>
          )}
        </CardContent>
      </Card>

      <Card variant="glass">
        <CardHeader><CardTitle className="text-base">Recent runs</CardTitle></CardHeader>
        <CardContent>
          {runs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No runs yet.</p>
          ) : (
            <div className="space-y-2">
              {runs.map((r) => (
                <div key={r.id} className="flex items-center justify-between p-2 rounded border border-border text-sm flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={r.status === "success" ? "default" : r.status === "failed" ? "destructive" : "secondary"}>
                      {r.status}
                    </Badge>
                    <span className="font-mono text-xs">{new Date(r.started_at).toLocaleString()}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    +{r.pages_created} created · {r.pages_updated} updated · {r.pages_failed} failed
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card variant="glass">
        <CardHeader><CardTitle className="text-base">Recent failures</CardTitle></CardHeader>
        <CardContent>
          {errors.length === 0 ? (
            <p className="text-sm text-muted-foreground">No errors. 🎉</p>
          ) : (
            <div className="space-y-2">
              {errors.map((e) => (
                <div key={e.id} className="p-2 rounded border border-destructive/30 bg-destructive/5 text-xs">
                  <div className="flex justify-between mb-1">
                    <span className="font-mono">{e.slug ?? "(no slug)"}</span>
                    <span className="text-muted-foreground">{new Date(e.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-destructive">{e.reason}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="pt-4 border-t border-border">
        <GscCoveragePanel />
      </div>
    </div>
  );
};
