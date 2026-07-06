// Internal-link hub: surfaces latest upcoming game previews and matchups from
// the seo_pages table so Googlebot can reach them via on-page links (not just
// the sitemap). This typically lifts indexing rate substantially.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight } from "lucide-react";

interface SeoPageRow {
  slug: string;
  title: string | null;
  page_type: string;
  sport: string | null;
}

const titleize = (slug: string) =>
  slug
    .split("-")
    .map((w) => (w.length <= 3 ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");

export const LatestPredictionsHub = () => {
  const [previews, setPreviews] = useState<SeoPageRow[]>([]);
  const [matchups, setMatchups] = useState<SeoPageRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [previewsRes, matchupsRes] = await Promise.all([
          supabase
            .from("seo_pages")
            .select("slug, title, page_type, sport")
            .eq("page_type", "game_preview")
            .eq("status", "upcoming")
            .order("game_date", { ascending: true })
            .limit(12),
          supabase
            .from("seo_pages")
            .select("slug, title, page_type, sport")
            .eq("page_type", "matchup")
            .order("updated_at", { ascending: false })
            .limit(8),
        ]);
        if (cancelled) return;
        setPreviews((previewsRes.data as SeoPageRow[]) ?? []);
        setMatchups((matchupsRes.data as SeoPageRow[]) ?? []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || (previews.length === 0 && matchups.length === 0)) return null;

  return (
    <section
      aria-labelledby="latest-predictions-hub"
      className="container mx-auto px-4 py-12 border-t border-border/40"
    >
      <div className="max-w-6xl mx-auto">
        <h2 id="latest-predictions-hub" className="text-2xl md:text-3xl font-bold mb-2">
          Latest AI Predictions & Matchups
        </h2>
        <p className="text-muted-foreground mb-8">
          Browse our newest game previews and head-to-head matchup analyses.
        </p>

        {previews.length > 0 && (
          <div className="mb-10">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              Upcoming Game Predictions
              <Link
                to="/ai-sports-picks"
                className="ml-auto text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1"
              >
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {previews.map((p) => (
                <li key={p.slug}>
                  <Link
                    to="/ai-sports-picks"
                    className="block px-3 py-2 rounded-md text-sm text-foreground/90 hover:text-primary hover:bg-muted/50 transition-colors border border-border/30"
                  >
                    {p.title || titleize(p.slug)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {matchups.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Featured Matchup Analyses</h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {matchups.map((m) => (
                <li key={m.slug}>
                  <Link
                    to="/ai-sports-picks"
                    className="block px-3 py-2 rounded-md text-sm text-foreground/90 hover:text-primary hover:bg-muted/50 transition-colors border border-border/30"
                  >
                    {m.title || titleize(m.slug)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
};

export default LatestPredictionsHub;
