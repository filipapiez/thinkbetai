import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Breadcrumb } from '@/components/Breadcrumb';

import { Brain, BarChart3, Zap, Target, CheckCircle, ArrowRight, MessageSquare, Layers, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const faqs = [
  {
    q: 'Is AI betting legal?',
    a: 'AI betting tools are legal in jurisdictions where sports betting itself is legal. ThinkBetAI provides analysis and predictions — it does not place bets on your behalf. Always check your local regulations before betting.',
  },
  {
    q: 'How accurate are AI betting predictions?',
    a: 'Accuracy varies by sport, market, and data availability. Our models target edges where historical data shows consistent patterns. No system guarantees profits — AI predictions should be one input in your decision-making process.',
  },
  {
    q: 'Does ThinkBetAI place bets for me?',
    a: 'No. ThinkBetAI is an analysis platform. We provide AI-generated picks, confidence scores, and risk assessments. You decide which bets to place through the sportsbook of your choice.',
  },
  {
    q: 'What sports does ThinkBetAI cover?',
    a: 'We cover NFL, NBA, MLB, NHL, UFC, soccer, tennis, and more. Our models adapt to each sport\'s unique statistical landscape.',
  },
  {
    q: 'How is AI betting different from traditional handicapping?',
    a: 'Traditional handicapping relies on expert opinion and limited data points. AI betting processes thousands of variables simultaneously — player stats, weather, travel schedules, historical matchups — to surface edges humans might miss.',
  },
  {
    q: 'Do I need experience to use AI betting tools?',
    a: 'No. ThinkBetAI is designed for beginners and experienced bettors alike. Each pick includes a plain-language explanation, confidence rating, and risk meter so you understand every recommendation.',
  },
];

const AISportsBetting = () => {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  const softwareSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'ThinkBetAI',
    applicationCategory: 'SportsApplication',
    operatingSystem: 'Web',
    url: 'https://thinkbetai.com',
    description:
      'AI-powered sports betting analysis platform delivering data-driven picks, parlay suggestions, and real-time predictions across NFL, NBA, MLB, NHL, and more.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: 'Free tier available',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      ratingCount: '2140',
      bestRating: '5',
    },
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="AI Sports Betting 2026 — Free AI Picks & Predictions (80%+ Accuracy)"
        description="The #1 AI sports betting platform. Free daily AI picks, parlays & predictions for NFL, NBA, MLB, NHL & UFC — powered by machine learning with 80%+ documented accuracy. Try it free."
        keywords="ai betting, ai bets, ai betting predictions, ai sports betting tool, ai sports betting, ai predictions sports"
        url="/ai-sports-betting"
        type="article"
        structuredData={{
          "@context": "https://schema.org",
          "@graph": [faqSchema, softwareSchema],
        }}
      />

      <Header />

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <Breadcrumb
          items={[
            { label: 'Blog', href: '/blog' },
            { label: 'AI Sports Betting' },
          ]}
          className="mb-8"
        />

        {/* Hero */}
        <header className="mb-14">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            AI Sports Betting Platform
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl">
            Our <Link to="/ai-sports-betting" className="text-primary hover:underline font-medium">AI sports betting platform</Link> combines machine learning with real-time sports data to deliver <Link to="/ai-sports-betting" className="text-primary hover:underline font-medium">AI betting predictions</Link> you can actually understand — and act on.
          </p>
          <div className="flex flex-wrap gap-4 mt-8">
            <Button size="lg" asChild>
              <Link to="/login">
                Try AI Bets <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/picks">
                Get AI Predictions
              </Link>
            </Button>
          </div>
        </header>

        <article className="prose prose-lg dark:prose-invert max-w-none">
          {/* Section 1 */}
          <section className="mb-14">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-3">
              <Brain className="h-6 w-6 text-primary" />
              What Is AI Betting?
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
             AI betting uses machine learning algorithms to analyze vast amounts of sports data — player stats, team form, injuries, weather, travel schedules, and historical matchups — to generate probability estimates for game outcomes. As the <Link to="/ai-sports-betting" className="text-primary hover:underline font-medium">best AI betting tool</Link> available, ThinkBetAI processes thousands of variables simultaneously to surface edges that human analysis might miss.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              The result is a set of data-driven <Link to="/ai-sports-betting" className="text-primary hover:underline font-medium">AI betting picks</Link> and confidence scores that help bettors make more informed decisions. This <Link to="/ai-sports-betting" className="text-primary hover:underline font-medium">AI sports betting software</Link> isn't a crystal ball — it's a smarter starting point.
            </p>
          </section>

          {/* Section 2 */}
          <section className="mb-14">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-3">
              <Zap className="h-6 w-6 text-primary" />
              How ThinkBetAI Generates AI Bets
            </h2>
            <div className="space-y-6">
              <div className="glass-card p-5">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <span className="text-primary font-bold">1.</span> Real-Time Data Collection
                </h3>
                <p className="text-sm text-muted-foreground">
                  We pull live odds, injury reports, lineup changes, and performance metrics from multiple sources every few minutes so models always work with the freshest data.
                </p>
              </div>
              <div className="glass-card p-5">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <span className="text-primary font-bold">2.</span> Multi-Model Analysis
                </h3>
                <p className="text-sm text-muted-foreground">
                  Our AI engine runs several specialized models — regression, gradient boosting, and neural networks — then ensembles the outputs into a single probability estimate for each market.
                </p>
              </div>
              <div className="glass-card p-5">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <span className="text-primary font-bold">3.</span> Edge Detection & Qualification
                </h3>
                <p className="text-sm text-muted-foreground">
                  The system compares its probability to the implied probability of the current odds. Only picks that meet a minimum edge threshold are surfaced as qualified AI betting predictions.
                </p>
              </div>
              <div className="glass-card p-5">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <span className="text-primary font-bold">4.</span> Plain-Language Explanations
                </h3>
                <p className="text-sm text-muted-foreground">
                  Every pick comes with a confidence rating, risk meter, and a short explanation so you know <em>why</em> the AI likes the bet — not just <em>that</em> it does.
                </p>
              </div>
            </div>

            {/* Screenshot placeholder */}
            <div className="mt-8 rounded-xl border border-border bg-muted/30 flex items-center justify-center h-56 text-muted-foreground text-sm">
              [ Screenshot: ThinkBetAI pick card with confidence score & explanation ]
            </div>
          </section>

          {/* Section 3 */}
          <section className="mb-14">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-3">
              <BarChart3 className="h-6 w-6 text-primary" />
              AI Betting Predictions Today
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              ThinkBetAI refreshes predictions throughout the day as new data becomes available. Whether it's an NFL Sunday slate, a midweek NBA back-to-back, or a full MLB card, you'll find up-to-date <Link to="/ai-sports-betting" className="text-primary hover:underline font-medium">AI bets today</Link> on the Picks page. Our <Link to="/ai-sports-betting" className="text-primary hover:underline font-medium">sports betting AI analysis</Link> ensures every pick is backed by fresh data.
            </p>
            <div className="flex flex-wrap gap-4 mt-4">
              <Button variant="outline" asChild>
                <Link to="/picks">View Today's AI Picks</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/games">Browse Live Games</Link>
              </Button>
            </div>

            {/* Screenshot placeholder */}
            <div className="mt-8 rounded-xl border border-border bg-muted/30 flex items-center justify-center h-56 text-muted-foreground text-sm">
              [ Screenshot: Picks page showing today's AI predictions ]
            </div>
          </section>

          {/* Section 4 */}
          <section className="mb-14">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-3">
              <Target className="h-6 w-6 text-primary" />
              Why AI Betting Is More Accurate
            </h2>
            <ul className="space-y-3 text-muted-foreground">
              {[
                'Processes thousands of variables per game — far beyond human capacity.',
                'Eliminates emotional bias and recency bias from decision-making.',
                'Continuously learns from new results to improve future predictions.',
                'Compares its own probability estimates against market odds to find value.',
                'Adapts to sport-specific nuances (pace of play, park factors, altitude, etc.).',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              That said, no AI system is infallible. Sports are inherently unpredictable — injuries, referee decisions, and random variance all play a role. A sound <Link to="/ai-sports-betting" className="text-primary hover:underline font-medium">AI betting strategy</Link> should complement your research, not replace it.
            </p>
          </section>

          {/* Internal links section */}
          <section className="mb-14">
            <h2 className="text-2xl font-semibold mb-6">Explore More AI Betting Tools</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <Link
                to="/ai-parlay-builder"
                className="glass-card p-5 flex flex-col items-center text-center gap-3 hover:border-primary/30 transition-colors"
              >
                <Layers className="h-8 w-8 text-primary" />
                <span className="font-semibold">AI Parlay Builder</span>
                <span className="text-xs text-muted-foreground">Build smarter parlays with AI-correlated picks</span>
              </Link>
              <Link
                to="/chat"
                className="glass-card p-5 flex flex-col items-center text-center gap-3 hover:border-primary/30 transition-colors"
              >
                <MessageSquare className="h-8 w-8 text-primary" />
                <span className="font-semibold">AI Betting Chat</span>
                <span className="text-xs text-muted-foreground">Ask our AI anything about today's games</span>
              </Link>
              <Link
                to="/login"
                className="glass-card p-5 flex flex-col items-center text-center gap-3 hover:border-primary/30 transition-colors"
              >
                <UserPlus className="h-8 w-8 text-primary" />
                <span className="font-semibold">Sign Up Free</span>
                <span className="text-xs text-muted-foreground">Create an account and start getting AI picks</span>
              </Link>
            </div>
          </section>

          {/* FAQs */}
          <section className="mb-14">
            <h2 className="text-2xl font-semibold mb-6">FAQs About AI Betting</h2>
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
          <section className="rounded-2xl bg-primary/5 border border-primary/20 p-8 text-center">
            <h2 className="text-2xl font-bold mb-3">Ready to Try AI Bets?</h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              Join thousands of bettors using ThinkBetAI to find smarter picks, build data-backed parlays, and bet with confidence.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" asChild>
                <Link to="/login">
                  Get AI Predictions <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/pricing">View Plans</Link>
              </Button>
            </div>
          </section>
        </article>

        {/* Nav */}
        <div className="flex flex-wrap gap-4 mt-12 pt-8 border-t border-border">
          <Button variant="outline" asChild>
            <Link to="/blog">← Back to Blog</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/what-is-ai-sports-betting">What Is AI Sports Betting?</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/faq">FAQ</Link>
          </Button>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AISportsBetting;
