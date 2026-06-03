import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowRight, Sparkles } from "lucide-react";

interface SeoPage {
  slug: string;
  page_type: string;
  sport: string | null;
  title: string;
  meta_description: string | null;
  h1: string | null;
  content_json: any;
  status: string;
  game_date: string | null;
  updated_at: string;
}

interface Props {
  pageType: "game" | "team" | "player" | "prop" | "best" | "matchup" | "league";
}

const TYPE_FILTER: Record<Props["pageType"], string[]> = {
  game: ["game_preview", "game_result"],
  team: ["team"],
  player: ["player"],
  prop: ["player_prop"],
  best: ["daily_best"],
  matchup: ["matchup"],
  league: ["league"],
};

const URL_PREFIX: Record<Props["pageType"], string> = {
  game: "/predictions/",
  team: "/teams/",
  player: "/players/",
  prop: "/props/",
  best: "/best/",
  matchup: "/matchups/",
  league: "/leagues/",
};

const SCHEMA_ID = "seo-page-jsonld";

const SeoPageView = ({ pageType }: Props) => {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<SeoPage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    supabase
      .from("seo_pages")
      .select("*")
      .eq("slug", slug)
      .in("page_type", TYPE_FILTER[pageType])
      .maybeSingle()
      .then(({ data }) => {
        setPage(data as SeoPage | null);
        setLoading(false);
      });
  }, [slug, pageType]);

  // SEO head + JSON-LD injection
  useEffect(() => {
    if (!page) return;
    document.title = page.title;
    const setMeta = (name: string, content: string, attr: "name" | "property" = "name") => {
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.content = content;
    };
    if (page.meta_description) setMeta("description", page.meta_description);
    setMeta("og:title", page.title, "property");
    if (page.meta_description) setMeta("og:description", page.meta_description, "property");
    const url = `https://thinkbetai.com${URL_PREFIX[pageType]}${page.slug}`;
    setMeta("og:url", url, "property");

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = url;

    // JSON-LD: BreadcrumbList + FAQPage + SportsEvent
    const c = page.content_json || {};
    const graph: any[] = [];
    if (Array.isArray(c.breadcrumbs) && c.breadcrumbs.length) {
      graph.push({
        "@type": "BreadcrumbList",
        itemListElement: c.breadcrumbs.map((b: any, i: number) => ({
          "@type": "ListItem",
          position: i + 1,
          name: b.name,
          item: `https://thinkbetai.com${b.href}`,
        })),
      });
    }
    if (Array.isArray(c.faq) && c.faq.length) {
      graph.push({
        "@type": "FAQPage",
        mainEntity: c.faq.map((f: any) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: f.answer },
        })),
      });
    }
    if (c.sportsEvent) {
      const ev = { ...c.sportsEvent };
      delete ev["@context"];
      graph.push(ev);
    }

    document.getElementById(SCHEMA_ID)?.remove();
    if (graph.length) {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.id = SCHEMA_ID;
      script.text = JSON.stringify({ "@context": "https://schema.org", "@graph": graph });
      document.head.appendChild(script);
    }

    return () => {
      document.getElementById(SCHEMA_ID)?.remove();
    };
  }, [page, pageType]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container max-w-2xl py-16 text-center">
          <h1 className="text-3xl font-bold mb-3">Page not found</h1>
          <p className="text-muted-foreground mb-6">This SEO page hasn't been generated yet. Try the main site sections below.</p>
          <div className="flex gap-3 justify-center">
            <Link to="/games" className="text-primary underline">All games</Link>
            <Link to="/picks" className="text-primary underline">AI picks</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const c = page.content_json || {};
  const ai = c.aiPick;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container max-w-4xl py-8 md:py-12">
        {/* Visible breadcrumbs */}
        {Array.isArray(c.breadcrumbs) && c.breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground mb-4">
            {c.breadcrumbs.map((b: any, i: number) => (
              <span key={i}>
                {i > 0 && " / "}
                {i === c.breadcrumbs.length - 1 ? (
                  <span className="text-foreground">{b.name}</span>
                ) : (
                  <Link to={b.href} className="hover:text-foreground">{b.name}</Link>
                )}
              </span>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {page.sport && <Badge variant="outline">{page.sport}</Badge>}
          <Badge variant={page.status === "final" ? "secondary" : "default"}>
            {page.status === "final" ? "Final" : page.status === "stale" ? "Past" : "Upcoming"}
          </Badge>
          {page.game_date && (
            <span className="text-sm text-muted-foreground">
              {new Date(page.game_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </span>
          )}
        </div>

        <h1 className="text-3xl md:text-4xl font-bold mb-4">{page.h1 ?? page.title}</h1>
        {page.meta_description && (
          <p className="text-lg text-muted-foreground mb-8">{page.meta_description}</p>
        )}

        {/* AI Confidence card */}
        {ai && (
          <Card variant="glass" className="mb-6 border-primary/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI Prediction: {ai.pick}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold text-primary">{ai.confidence}%</span>
                <span className="text-sm text-muted-foreground">Confidence Score</span>
              </div>
              {ai.rationale && <p className="text-sm text-muted-foreground">{ai.rationale}</p>}
            </CardContent>
          </Card>
        )}

        {/* Game preview/result */}
        {(page.page_type === "game_preview" || page.page_type === "game_result") && (
          <Card variant="glass" className="mb-6">
            <CardHeader>
              <CardTitle>
                {c.awayTeam} {c.awayScore !== undefined && <span className="font-bold">{c.awayScore}</span>}
                {" "}@{" "}
                {c.homeTeam} {c.homeScore !== undefined && <span className="font-bold">{c.homeScore}</span>}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {c.commenceTime && <p>Kickoff: {new Date(c.commenceTime).toLocaleString()}</p>}
              {c.league && <p>League: {c.league}</p>}
              {c.odds?.moneyline?.length > 0 && (
                <div>
                  <p className="font-semibold mb-1">Moneyline ({c.odds.book})</p>
                  <ul className="text-muted-foreground">
                    {c.odds.moneyline.map((o: any, i: number) => (
                      <li key={i}>{o.name}: {o.price > 0 ? `+${o.price}` : o.price}</li>
                    ))}
                  </ul>
                </div>
              )}
              {c.odds?.spreads?.length > 0 && (
                <div>
                  <p className="font-semibold mb-1">Spreads</p>
                  <ul className="text-muted-foreground">
                    {c.odds.spreads.map((o: any, i: number) => (
                      <li key={i}>{o.name} {o.point > 0 ? `+${o.point}` : o.point} ({o.price > 0 ? `+${o.price}` : o.price})</li>
                    ))}
                  </ul>
                </div>
              )}
              {c.odds?.totals?.length > 0 && (
                <div>
                  <p className="font-semibold mb-1">Totals</p>
                  <ul className="text-muted-foreground">
                    {c.odds.totals.map((o: any, i: number) => (
                      <li key={i}>{o.name} {o.point} ({o.price > 0 ? `+${o.price}` : o.price})</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Player prop details */}
        {page.page_type === "player_prop" && (
          <Card variant="glass" className="mb-6">
            <CardHeader><CardTitle>{c.playerName} • {c.statType}</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>Line: <span className="font-semibold">{c.line}</span></p>
              <p>Over: {c.overOdds > 0 ? `+${c.overOdds}` : c.overOdds} • Under: {c.underOdds > 0 ? `+${c.underOdds}` : c.underOdds}</p>
              {c.opponent && <p>Matchup: {c.team} vs {c.opponent}</p>}
            </CardContent>
          </Card>
        )}

        {/* Player props list */}
        {page.page_type === "player" && c.props?.length > 0 && (
          <Card variant="glass" className="mb-6">
            <CardHeader><CardTitle>Active Props</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {c.props.map((p: any, i: number) => (
                <Link key={i} to={`/props/${p.slug}`} className="flex justify-between p-3 rounded border border-border hover:bg-accent/30">
                  <span>{p.statType} {p.line}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Matchup history */}
        {page.page_type === "matchup" && c.history?.length > 0 && (
          <Card variant="glass" className="mb-6">
            <CardHeader><CardTitle>Recent Results</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {c.history.map((h: any, i: number) => (
                <Link key={i} to={`/predictions/${h.slug}`} className="flex justify-between p-3 rounded border border-border hover:bg-accent/30">
                  <span>{h.away} {h.awayScore}–{h.homeScore} {h.home}</span>
                  <span className="text-sm text-muted-foreground">{h.date}</span>
                </Link>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Team / daily-best / league / hub upcoming games list */}
        {(c.upcomingGames?.length > 0 || c.games?.length > 0) && (
          <Card variant="glass" className="mb-6">
            <CardHeader><CardTitle>Upcoming Games</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {(c.upcomingGames ?? c.games).map((g: any, i: number) => (
                <Link
                  key={i}
                  to={`/predictions/${g.slug}`}
                  className="flex items-center justify-between p-3 rounded border border-border hover:bg-accent/30 transition"
                >
                  <span className="flex flex-col">
                    <span>
                      {g.away ?? g.opponent}{" "}{g.home === false ? "@" : "vs"}{" "}{g.home ?? g.opponent}
                    </span>
                    {g.aiPick && (
                      <span className="text-xs text-primary mt-1">
                        AI: {g.aiPick.pick} ({g.aiPick.confidence}%)
                      </span>
                    )}
                  </span>
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    {g.commenceTime && new Date(g.commenceTime).toLocaleDateString()}
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              ))}
            </CardContent>
          </Card>
        )}

        {/* FAQ section */}
        {Array.isArray(c.faq) && c.faq.length > 0 && (
          <Card variant="glass" className="mb-6">
            <CardHeader><CardTitle>Frequently Asked Questions</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {c.faq.map((f: any, i: number) => (
                <div key={i}>
                  <h3 className="font-semibold mb-1">{f.question}</h3>
                  <p className="text-sm text-muted-foreground">{f.answer}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Internal links */}
        {c.internalLinks?.length > 0 && (
          <Card variant="glass">
            <CardHeader><CardTitle>Related</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              {c.internalLinks.map((l: any, i: number) => (
                <Link key={i} to={l.href} className="text-primary hover:underline text-sm">
                  {l.label} →
                </Link>
              ))}
            </CardContent>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default SeoPageView;
