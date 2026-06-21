import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  Layers,
  CheckCircle,
  TrendingUp,
  Zap,
  ArrowRight,
  Target,
  Calculator,
  Shield,
  Sparkles,
  BarChart3,
  Brain,
} from 'lucide-react';

const faqs = [
  {
    q: 'What is an AI parlay builder?',
    a: 'An AI parlay builder uses machine learning to analyze multi-leg bets, identify correlations between picks, calculate true win probabilities, and optimize parlays for maximum expected value.',
  },
  {
    q: 'How does AI improve parlay betting?',
    a: "AI analyzes correlations that sportsbooks don't always price correctly. For example, if a game goes over the total, certain player props become more likely. AI finds these edges and builds smarter parlays.",
  },
  {
    q: "What's the optimal number of legs for a parlay?",
    a: 'AI analysis shows 2-3 leg parlays offer the best balance of payout and probability. Longer parlays have higher payouts but exponentially lower win rates. Focus on quality over quantity.',
  },
  {
    q: 'Can AI guarantee parlay wins?',
    a: 'No. Parlays are inherently high-variance bets. AI improves your edge by finding correlated outcomes and mispriced odds, but no system can eliminate the uncertainty of sports.',
  },
  {
    q: 'What sports work best with the AI parlay builder?',
    a: 'NFL and NBA tend to have the richest data sets for correlation analysis. MLB and NHL also work well. The builder supports any sport available on ThinkBetAI.',
  },
  {
    q: 'How are AI parlay picks different from regular parlay picks?',
    a: 'Regular parlay picks are often random combinations. AI parlay picks are selected specifically because the outcomes are positively correlated — meaning if one leg hits, the others are statistically more likely to hit too.',
  },
];

const parlayFeatures = [
  { icon: Layers, title: 'Smart Combinations', description: 'AI identifies correlated picks that boost win probability' },
  { icon: Calculator, title: 'True Odds Calculator', description: 'See real probabilities vs. sportsbook odds' },
  { icon: Target, title: 'Confidence Scoring', description: 'Each parlay rated by AI confidence level' },
  { icon: Shield, title: 'Risk Analysis', description: 'Understand variance and expected outcomes' },
  { icon: TrendingUp, title: 'Edge Detection', description: 'Find parlays where you have mathematical advantage' },
  { icon: Sparkles, title: 'One-Click Build', description: 'AI suggests optimal parlays automatically' },
];

const AIParlayBuilder = () => {
  const softwareSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'ThinkBetAI Parlay Builder',
    applicationCategory: 'SportsApplication',
    operatingSystem: 'Web',
    url: 'https://thinkbetai.com/ai-parlay-builder',
    description:
      'AI-powered parlay builder that analyzes correlations, calculates true odds, and optimizes multi-leg bets for maximum value.',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
  const combinedSchema = { '@context': 'https://schema.org', '@graph': [softwareSchema, faqSchema] };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="Free AI Parlay Builder & Parlay Generator"
        description="Use an AI parlay builder to compare leg probabilities, identify correlation and review risk before combining NFL, NBA, MLB or NHL picks."
        keywords="ai parlay builder, free ai parlay generator, ai parlay picks, same game parlay AI, smart parlay builder, parlay ai predictions, correlated parlay"
        url="/ai-parlay-builder"
        type="article"
        structuredData={combinedSchema}
      />

      <Header />

      <main className="flex-1">
        <div className="container py-8 max-w-4xl">
          <Breadcrumb
            items={[
              { label: 'AI Sports Betting', href: '/ai-sports-betting' },
              { label: 'AI Parlay Builder' },
            ]}
            className="mb-8"
          />

          {/* Hero */}
          <header className="text-center mb-14">
            <Badge className="mb-4 bg-accent/20 text-accent border-accent/30">
              <Layers className="h-3 w-3 mr-1" />
              Advanced Tool
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
              Free AI Parlay Builder and Parlay Generator
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Stop guessing on parlays. Our <Link to="/ai-parlay-builder" className="text-primary hover:underline font-medium">AI parlay builder</Link> analyzes leg correlations, calculates true win probabilities,
              and helps you review <Link to="/ai-parlay-builder" className="text-primary hover:underline font-medium">AI-assisted parlays</Link> with explicit risk context.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" asChild>
                <Link to="/parlays">
                  Build AI Parlay <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/picks">Get AI Parlay Picks</Link>
              </Button>
            </div>
          </header>

          <article className="prose prose-lg dark:prose-invert max-w-none">
            {/* Section 1 — How it works */}
            <section className="mb-14">
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-3">
                <Zap className="h-6 w-6 text-primary" />
                How the AI Parlay Builder Works
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Building winning parlays requires understanding how outcomes relate to each other. You can <Link to="/ai-parlay-builder" className="text-primary hover:underline font-medium">build parlays with AI</Link> automatically in four steps using our <Link to="/ai-parlay-builder" className="text-primary hover:underline font-medium">smart parlay generator</Link>:
              </p>
              <div className="space-y-5">
                {[
                  { step: '1', title: 'Select Your Legs', desc: 'Add picks from any sport or game on the platform.' },
                  { step: '2', title: 'AI Analyzes Correlations', desc: 'The model calculates how each leg affects the probability of every other leg hitting.' },
                  { step: '3', title: 'Review True Odds', desc: 'Compare AI-calculated win probability against the sportsbook payout to see your real edge.' },
                  { step: '4', title: 'Optimize', desc: 'AI suggests additions, removals, or swaps to maximize expected value.' },
                ].map((s) => (
                  <div key={s.step} className="glass-card p-5">
                    <h3 className="font-semibold mb-1 flex items-center gap-2">
                      <span className="text-primary font-bold">{s.step}.</span> {s.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">{s.desc}</p>
                  </div>
                ))}
              </div>

              {/* Screenshot placeholder */}
              <div className="mt-8 rounded-xl border border-border bg-muted/30 flex items-center justify-center h-56 text-muted-foreground text-sm">
                [ Screenshot: AI Parlay Builder interface with correlation indicators ]
              </div>
            </section>

            {/* Section 2 — Example AI Parlay Picks */}
            <section className="mb-14">
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-3">
                <Layers className="h-6 w-6 text-primary" />
                Example AI Parlay Picks
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Here's the kind of correlated parlay our AI surfaces — not random combinations, but <Link to="/ai-parlay-builder" className="text-primary hover:underline font-medium">AI parlay picks</Link> whose outcomes reinforce each other.
              </p>

              <div className="glass-card p-6 mb-4">
                <h3 className="font-semibold mb-3">Sample 3-Leg NFL Parlay</h3>
                <ul className="space-y-2 text-muted-foreground text-sm">
                  <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" /> <span><strong>Leg 1:</strong> Game total Over 47.5</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" /> <span><strong>Leg 2:</strong> QB passing yards Over 275.5</span></li>
                  <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" /> <span><strong>Leg 3:</strong> WR1 receptions Over 5.5</span></li>
                </ul>
                <p className="text-xs text-muted-foreground mt-3">
                  <em>Why it's correlated:</em> A high-scoring game means more pass attempts, which lifts both QB yardage and receiver receptions.
                </p>
              </div>

              {/* Screenshot placeholder */}
              <div className="mt-6 rounded-xl border border-border bg-muted/30 flex items-center justify-center h-56 text-muted-foreground text-sm">
                [ Screenshot: AI parlay suggestion card with confidence & payout ]
              </div>
            </section>

            {/* Section 3 — Smart Odds Optimization */}
            <section className="mb-14">
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-3">
                <BarChart3 className="h-6 w-6 text-primary" />
                Smart Odds Optimization
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Sportsbooks price parlay legs independently, but outcomes aren't independent. ThinkBetAI exploits this gap:
              </p>
              <ul className="space-y-3 text-muted-foreground">
                {[
                  'Identifies positively correlated legs the book prices as uncorrelated.',
                  'Calculates the true combined probability using historical co-occurrence data.',
                  "Flags parlays where the implied odds are worse than your true probability — that\u0027s your edge.",
                  'Suggests removing negatively correlated legs that drag down expected value.',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Section 4 — Parlay Strategy with AI */}
            <section className="mb-14">
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-3">
                <Brain className="h-6 w-6 text-primary" />
                Parlay Strategy with AI
              </h2>

              <h3 className="font-semibold mt-6 mb-2">The 2-3 Leg Sweet Spot</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Data shows that 2-3 leg parlays offer the optimal balance of payout and hit rate. 4+ leg parlays sound exciting but have exponentially lower win probabilities.
              </p>

              <h3 className="font-semibold mt-6 mb-2">Focus on Correlated Outcomes</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Random 3-leg parlays have roughly 12.5% expected win rate (0.5³). But correlated parlays can reach 20-25% hit rates because outcomes aren't independent.
              </p>

              <h3 className="font-semibold mt-6 mb-2">Same Game Parlays (SGPs)</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                SGPs are particularly suited for AI analysis because all legs share the same game context. If the over hits, specific players are more likely to have big games. If a team covers, their players hit performance props more often.
              </p>

              <h3 className="font-semibold mt-6 mb-2">Bankroll Management</h3>
              <p className="text-muted-foreground leading-relaxed">
                Even with an <Link to="/ai-parlay-builder" className="text-primary hover:underline font-medium">AI multi-bet strategy</Link>, parlays are high-variance bets. Limit parlay wagers to 1-2% of your bankroll and don't chase losses with bigger parlays.
              </p>
            </section>

            {/* Features Grid */}
            <section className="mb-14 not-prose">
              <h2 className="text-2xl font-semibold mb-6 text-center">AI Parlay Builder Features</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {parlayFeatures.map((feature, index) => (
                  <Card key={index} className="hover:border-primary/50 transition-colors">
                    <CardContent className="p-6">
                      <feature.icon className="h-8 w-8 text-accent mb-3" />
                      <h3 className="font-semibold mb-2">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* FAQs */}
            <section className="mb-14 not-prose">
              <h2 className="text-2xl font-semibold mb-6">FAQs</h2>
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((f, i) => (
                  <AccordionItem key={i} value={`faq-${i}`}>
                    <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>

            {/* Bottom CTA */}
            <section className="not-prose rounded-2xl bg-primary/5 border border-primary/20 p-8 text-center mb-14">
              <h2 className="text-2xl font-bold mb-3">Build Your First AI Parlay</h2>
              <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
                Let AI find the correlations and value in your multi-leg bets.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button size="lg" asChild>
                  <Link to="/parlays">
                    Open Parlay Builder <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/pricing">View Plans</Link>
                </Button>
              </div>
            </section>
          </article>

          {/* Daily picks hubs — internal links pass crawl signal to /best/* pages */}
          <section className="pt-8 border-t border-border">
            <h2 className="text-xl font-semibold mb-3">Today's Best AI Picks</h2>
            <p className="text-muted-foreground mb-4 text-sm">
              Curated highest-confidence picks updated daily by sport and market.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
              <Link to="/best/best-nba-bets-today" className="text-primary hover:underline">Best NBA Bets Today</Link>
              <Link to="/best/best-nfl-bets-today" className="text-primary hover:underline">Best NFL Bets Today</Link>
              <Link to="/best/best-mlb-bets-today" className="text-primary hover:underline">Best MLB Bets Today</Link>
              <Link to="/best/best-nhl-bets-today" className="text-primary hover:underline">Best NHL Bets Today</Link>
              <Link to="/best/best-parlays-today" className="text-primary hover:underline">Best Parlays Today</Link>
              <Link to="/best/best-nba-player-props-today" className="text-primary hover:underline">Best NBA Player Props</Link>
              <Link to="/best/best-nfl-player-props-today" className="text-primary hover:underline">Best NFL Player Props</Link>
              <Link to="/best/best-mlb-player-props-today" className="text-primary hover:underline">Best MLB Player Props</Link>
              <Link to="/best/best-nhl-player-props-today" className="text-primary hover:underline">Best NHL Player Props</Link>
            </div>
          </section>

          {/* Nav */}
          <div className="flex flex-wrap gap-4 pt-8 border-t border-border">
            <Button variant="outline" asChild>
              <Link to="/ai-sports-betting">← AI Sports Betting</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/blog">Blog</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/faq">FAQ</Link>
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AIParlayBuilder;
