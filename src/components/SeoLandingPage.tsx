import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle2, Sparkles, TrendingUp, Trophy } from "lucide-react";
import type { SeoLandingConfig } from "@/lib/seoLandingConfigs";

interface Props {
  config: SeoLandingConfig;
}

// Removed popularGameLinks, teamLinks, playerLinks — they pointed to
// retired programmatic pages (/best/*, /teams/*, /players/*). Internal
// linking now only goes to evergreen marketing pages.
const sportLandingLinks = [
  { label: "AI NFL Picks", href: "/ai-nfl-picks" },
  { label: "NBA AI Predictions", href: "/nba-ai-predictions" },
  { label: "MLB AI Predictions", href: "/mlb-ai-predictions" },
  { label: "NHL AI Predictions", href: "/nhl-ai-predictions" },
  { label: "UFC AI Predictions", href: "/ufc-ai-predictions" },
  { label: "Soccer AI Predictions", href: "/soccer-ai-predictions" },
];

const toolLinks = [
  { label: "AI Sports Picks", href: "/ai-sports-picks" },
  { label: "AI Parlay Builder", href: "/ai-parlay-builder" },
  { label: "Free AI Predictions", href: "/free-ai-predictions" },
  { label: "AI Bet Analyzer", href: "/ai-bet-analyzer" },
  { label: "AI NFL Picks", href: "/ai-nfl-picks" },
  { label: "AI Chat", href: "/chat" },
  { label: "Live Games", href: "/games" },
  { label: "Player Props", href: "/player-props" },
  { label: "Game Totals", href: "/game-totals" },
];

export const SeoLandingPage = ({ config }: Props) => {
  const url = `/${config.slug}`;
  const fullUrl = `https://thinkbetai.com${url}`;
  const primary = config.primaryCta ?? { label: "See Today's Free Picks", href: "/games" };
  const secondary = config.secondaryCta ?? { label: "View Pricing", href: "/pricing" };

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: config.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: config.h1,
    description: config.description,
    author: { "@type": "Organization", name: "ThinkBetAI" },
    publisher: { "@type": "Organization", name: "ThinkBetAI", url: "https://thinkbetai.com" },
    mainEntityOfPage: fullUrl,
    image: "https://thinkbetai.com/og-image.png",
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={config.title}
        description={config.description}
        keywords={config.keywords}
        url={url}
        structuredData={articleLd}
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(faqLd)}</script>
      </Helmet>
      <Header />

      <main className="container py-8 md:py-12 max-w-5xl">
        <Breadcrumb items={[{ label: config.h1 }]} className="mb-6" />

        {/* Hero */}
        <section className="text-center mb-10 md:mb-14">
          <Badge variant="outline" className="mb-4">
            <Sparkles className="h-3 w-3 mr-1" />
            ThinkBetAI · 80.3% win rate on flagged picks
          </Badge>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">{config.h1}</h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-6">
            {config.tagline}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg">
              <Link to={primary.href}>
                {primary.label}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to={secondary.href}>{secondary.label}</Link>
            </Button>
          </div>
        </section>

        {/* Intro */}
        <section className="prose prose-invert max-w-none mb-10">
          {config.intro.map((p, i) => (
            <p key={i} className="text-base md:text-lg leading-relaxed text-muted-foreground">
              {p}
            </p>
          ))}
        </section>

        {/* Mid CTA */}
        <Card className="mb-10 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-xl md:text-2xl font-bold mb-1">Skip the reading — see tonight's AI picks</h3>
              <p className="text-muted-foreground">Free daily best bet + best underdog. No signup required.</p>
            </div>
            <Button asChild size="lg">
              <Link to="/games">
                View Free Picks <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Sections */}
        <section className="space-y-10 mb-12">
          {config.sections.map((s, i) => (
            <article key={i}>
              <h2 className="text-2xl md:text-3xl font-bold mb-4">{s.heading}</h2>
              <div className="space-y-4">
                {s.body.map((p, j) => (
                  <p key={j} className="text-base leading-relaxed text-muted-foreground">
                    {p}
                  </p>
                ))}
                {s.bullets && (
                  <ul className="space-y-2 mt-4">
                    {s.bullets.map((b, k) => (
                      <li key={k} className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </article>
          ))}
        </section>

        {/* Internal Linking Hubs */}
        <section className="mb-12 grid md:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" /> Tools You'll Want Next
              </h3>
              <ul className="grid grid-cols-1 gap-2 text-sm">
                {toolLinks.map((l) => (
                  <li key={l.href}>
                    <Link to={l.href} className="text-primary hover:underline">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" /> Sport-Specific AI Predictions
              </h3>
              <ul className="grid grid-cols-2 gap-2 text-sm">
                {sportLandingLinks.map((l) => (
                  <li key={l.href}>
                    <Link to={l.href} className="text-primary hover:underline">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* FAQ */}
        <section className="mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {config.faqs.map((f, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2 text-lg">{f.q}</h3>
                  <p className="text-muted-foreground leading-relaxed">{f.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="text-center py-10 md:py-14 px-6 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Ready to bet smarter with AI?</h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Start with the free daily picks. Upgrade only if the model wins for you. Cancel anytime.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg">
              <Link to={primary.href}>
                {primary.label}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/pricing">See Pricing</Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default SeoLandingPage;
