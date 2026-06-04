import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Loader2 } from "lucide-react";

interface SeoPageRow {
  slug: string;
  title: string;
  h1: string | null;
  sport: string | null;
  page_type: string;
  game_date: string | null;
}

interface Props {
  variant: "teams" | "predictions" | "best";
}

const CONFIG: Record<Props["variant"], {
  title: string;
  description: string;
  h1: string;
  intro: string;
  pageTypes: string[];
  urlPrefix: string;
  path: string;
}> = {
  teams: {
    title: "All NFL, NBA, MLB & NHL Team Pages — AI Picks Hub | ThinkBetAI",
    description: "Browse every team page on ThinkBetAI. Get AI-powered picks, upcoming games, schedules, and matchup analysis for every NFL, NBA, MLB, NHL, NCAA team.",
    h1: "All Team Pages",
    intro: "AI-powered analysis, upcoming games, and betting insights for every major team. Click any team for picks, props, and predictions.",
    pageTypes: ["team"],
    urlPrefix: "/teams/",
    path: "/teams",
  },
  predictions: {
    title: "All Game Predictions & Recaps — Daily AI Picks | ThinkBetAI",
    description: "Browse every AI-powered game prediction and recap on ThinkBetAI. NFL, NBA, MLB, NHL, NCAA — daily picks, spread analysis, and win probabilities.",
    h1: "All Game Predictions",
    intro: "Every AI-generated game preview and recap with confidence scores, spread analysis, and matchup breakdowns.",
    pageTypes: ["game_preview", "game_result"],
    urlPrefix: "/predictions/",
    path: "/predictions",
  },
  best: {
    title: "Best AI Picks of the Day by Sport — ThinkBetAI",
    description: "The highest-confidence AI picks of the day for NFL, NBA, MLB, NHL, NCAA, UFC and more. Updated daily with simulation-backed predictions.",
    h1: "Best AI Picks by Sport",
    intro: "Curated highest-confidence AI picks grouped by sport. Updated daily based on 1,000+ simulations.",
    pageTypes: ["daily_best"],
    urlPrefix: "/best/",
    path: "/best",
  },
};

const SeoIndex = ({ variant }: Props) => {
  const cfg = CONFIG[variant];
  const [pages, setPages] = useState<SeoPageRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    supabase
      .from("seo_pages")
      .select("slug,title,h1,sport,page_type,game_date")
      .in("page_type", cfg.pageTypes)
      .order("game_date", { ascending: false, nullsFirst: false })
      .order("title", { ascending: true })
      .limit(1000)
      .then(({ data }) => {
        setPages((data ?? []) as SeoPageRow[]);
        setLoading(false);
      });
  }, [variant]);

  // Group by sport
  const grouped = pages.reduce<Record<string, SeoPageRow[]>>((acc, p) => {
    const key = (p.sport || "Other").toUpperCase();
    (acc[key] ||= []).push(p);
    return acc;
  }, {});

  const sortedSports = Object.keys(grouped).sort();

  const url = `https://thinkbetai.com${cfg.path}`;
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: cfg.h1,
    description: cfg.description,
    url,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: pages.length,
      itemListElement: pages.slice(0, 200).map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `https://thinkbetai.com${cfg.urlPrefix}${p.slug}`,
        name: p.h1 || p.title,
      })),
    },
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>{cfg.title}</title>
        <meta name="description" content={cfg.description} />
        <link rel="canonical" href={url} />
        <meta property="og:title" content={cfg.title} />
        <meta property="og:description" content={cfg.description} />
        <meta property="og:url" content={url} />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(itemListSchema)}</script>
      </Helmet>

      <Header />

      <main className="flex-1 container max-w-5xl py-8 md:py-12">
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground mb-4">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{cfg.h1}</span>
        </nav>

        <h1 className="text-3xl md:text-4xl font-bold mb-3">{cfg.h1}</h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-3xl">{cfg.intro}</p>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : pages.length === 0 ? (
          <p className="text-muted-foreground">No pages available yet. Check back soon.</p>
        ) : (
          <div className="space-y-10">
            {sortedSports.map((sport) => (
              <section key={sport}>
                <h2 className="text-xl font-semibold mb-4 border-b border-border pb-2">
                  {sport} <span className="text-sm font-normal text-muted-foreground">({grouped[sport].length})</span>
                </h2>
                <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2">
                  {grouped[sport].map((p) => (
                    <li key={p.slug}>
                      <Link
                        to={`${cfg.urlPrefix}${p.slug}`}
                        className="text-sm text-primary hover:underline block py-1"
                      >
                        {p.h1 || p.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}

        <div className="mt-12 pt-8 border-t border-border flex flex-wrap gap-3 text-sm">
          <Link to="/teams" className="text-primary hover:underline">All Teams</Link>
          <span className="text-muted-foreground">·</span>
          <Link to="/predictions" className="text-primary hover:underline">All Predictions</Link>
          <span className="text-muted-foreground">·</span>
          <Link to="/best" className="text-primary hover:underline">Best Picks</Link>
          <span className="text-muted-foreground">·</span>
          <Link to="/ai-sports-picks" className="text-primary hover:underline">AI Sports Picks</Link>
          <span className="text-muted-foreground">·</span>
          <Link to="/ai-parlay-builder" className="text-primary hover:underline">AI Parlay Builder</Link>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default SeoIndex;
