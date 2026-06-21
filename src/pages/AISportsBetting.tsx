import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Button } from '@/components/ui/button';

/**
 * Performance: this page targets the "ai sports betting" / "ai betting" head terms
 * (top traffic page in GSC). It is intentionally lightweight — no radix Accordion,
 * no lucide-react barrel — to keep mobile LCP low. Use the inline icons below.
 */

// Tiny inline icons (replace lucide-react to shrink the route chunk)
const Icon = ({ d, className = 'h-6 w-6' }: { d: string; className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d={d} />
  </svg>
);
const BrainIcon = (p: { className?: string }) => (
  <Icon
    {...p}
    d="M9.5 2a2.5 2.5 0 0 0-2.5 2.5v0A2.5 2.5 0 0 0 4.5 7v0A2.5 2.5 0 0 0 3 9.5v0A2.5 2.5 0 0 0 4.5 12v0A2.5 2.5 0 0 0 3 14.5v0A2.5 2.5 0 0 0 4.5 17v0A2.5 2.5 0 0 0 7 19.5v0A2.5 2.5 0 0 0 9.5 22a2.5 2.5 0 0 0 2.5-2.5V4.5A2.5 2.5 0 0 0 9.5 2zM14.5 2a2.5 2.5 0 0 1 2.5 2.5v0A2.5 2.5 0 0 1 19.5 7v0A2.5 2.5 0 0 1 21 9.5v0a2.5 2.5 0 0 1-1.5 2.5v0A2.5 2.5 0 0 1 21 14.5v0a2.5 2.5 0 0 1-1.5 2.5v0A2.5 2.5 0 0 1 17 19.5v0a2.5 2.5 0 0 1-2.5 2.5 2.5 2.5 0 0 1-2.5-2.5V4.5A2.5 2.5 0 0 1 14.5 2z"
  />
);
const ZapIcon = (p: { className?: string }) => (
  <Icon {...p} d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
);
const ChartIcon = (p: { className?: string }) => (
  <Icon {...p} d="M3 3v18h18 M7 16V10 M12 16V6 M17 16v-4" />
);
const TargetIcon = (p: { className?: string }) => (
  <Icon {...p} d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12z M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
);
const ArrowRight = (p: { className?: string }) => (
  <Icon {...p} d="M5 12h14 M12 5l7 7-7 7" />
);
const CheckIcon = (p: { className?: string }) => (
  <Icon {...p} d="M21.8 10A10 10 0 1 1 12 2 M9 11l3 3L22 4" />
);
const LayersIcon = (p: { className?: string }) => (
  <Icon {...p} d="M12 2 2 7l10 5 10-5-10-5z M2 17l10 5 10-5 M2 12l10 5 10-5" />
);
const MessageIcon = (p: { className?: string }) => (
  <Icon {...p} d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
);
const UserPlusIcon = (p: { className?: string }) => (
  <Icon {...p} d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M8.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M20 8v6 M23 11h-6" />
);

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
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="AI Sports Betting: Free AI Picks & Analysis"
        description="Explore AI sports betting analysis, free AI picks, probability estimates and matchup context for NFL, NBA, MLB, NHL, UFC and soccer."
        keywords="ai betting, ai bets, ai betting predictions, ai sports betting tool, ai sports betting, ai predictions sports"
        url="/ai-sports-betting"
        type="article"
        structuredData={{
          '@context': 'https://schema.org',
          '@graph': [faqSchema, softwareSchema],
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

        {/* Hero — LCP element. Keep above the fold and free of layout-shifting siblings. */}
        <header className="mb-14">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            AI Sports Betting Analysis and Free AI Picks
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
              <Link to="/picks">Get AI Predictions</Link>
            </Button>
          </div>
        </header>

        <article className="prose prose-lg dark:prose-invert max-w-none">
          <section className="mb-14">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-3">
              <BrainIcon className="h-6 w-6 text-primary" />
              What Is AI Betting?
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              AI betting uses machine learning algorithms to analyze sports data — player stats, team form, injuries, weather, travel schedules, and historical matchups — to generate probability estimates for game outcomes. ThinkBetAI is a purpose-built AI betting tool that organizes those signals into analysis a user can review.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              The result is a set of data-driven <Link to="/ai-sports-betting" className="text-primary hover:underline font-medium">AI betting picks</Link> and confidence scores that help bettors make more informed decisions. This <Link to="/ai-sports-betting" className="text-primary hover:underline font-medium">AI sports betting software</Link> isn't a crystal ball — it's a smarter starting point.
            </p>
          </section>

          <section className="mb-14">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-3">
              <ZapIcon className="h-6 w-6 text-primary" />
              How ThinkBetAI Generates AI Bets
            </h2>
            <div className="space-y-6">
              {[
                ['Real-Time Data Collection', 'We pull live odds, injury reports, lineup changes, and performance metrics from multiple sources every few minutes so models always work with the freshest data.'],
                ['Multi-Model Analysis', 'Our AI engine runs several specialized models — regression, gradient boosting, and neural networks — then ensembles the outputs into a single probability estimate for each market.'],
                ['Edge Detection & Qualification', 'The system compares its probability to the implied probability of the current odds. Only picks that meet a minimum edge threshold are surfaced as qualified AI betting predictions.'],
                ['Plain-Language Explanations', 'Every pick comes with a confidence rating, risk meter, and a short explanation so you know why the AI likes the bet — not just that it does.'],
              ].map(([title, body], i) => (
                <div key={i} className="glass-card p-5">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <span className="text-primary font-bold">{i + 1}.</span> {title}
                  </h3>
                  <p className="text-sm text-muted-foreground">{body}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-14">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-3">
              <ChartIcon className="h-6 w-6 text-primary" />
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
          </section>

          <section className="mb-14">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-3">
              <TargetIcon className="h-6 w-6 text-primary" />
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
                  <CheckIcon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              That said, no AI system is infallible. Sports are inherently unpredictable — injuries, referee decisions, and random variance all play a role. A sound <Link to="/ai-sports-betting" className="text-primary hover:underline font-medium">AI betting strategy</Link> should complement your research, not replace it.
            </p>
          </section>

          <section className="mb-14">
            <h2 className="text-2xl font-semibold mb-6">Explore More AI Betting Tools</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <Link to="/ai-parlay-builder" className="glass-card p-5 flex flex-col items-center text-center gap-3 hover:border-primary/30 transition-colors">
                <LayersIcon className="h-8 w-8 text-primary" />
                <span className="font-semibold">AI Parlay Builder</span>
                <span className="text-xs text-muted-foreground">Build smarter parlays with AI-correlated picks</span>
              </Link>
              <Link to="/chat" className="glass-card p-5 flex flex-col items-center text-center gap-3 hover:border-primary/30 transition-colors">
                <MessageIcon className="h-8 w-8 text-primary" />
                <span className="font-semibold">AI Betting Chat</span>
                <span className="text-xs text-muted-foreground">Ask our AI anything about today's games</span>
              </Link>
              <Link to="/login" className="glass-card p-5 flex flex-col items-center text-center gap-3 hover:border-primary/30 transition-colors">
                <UserPlusIcon className="h-8 w-8 text-primary" />
                <span className="font-semibold">Sign Up Free</span>
                <span className="text-xs text-muted-foreground">Create an account and start getting AI picks</span>
              </Link>
            </div>
          </section>

          {/* FAQs — native <details> instead of radix Accordion to avoid pulling
              @radix-ui/react-accordion (~15KB) into this route's lazy chunk. */}
          <section className="mb-14">
            <h2 className="text-2xl font-semibold mb-6">FAQs About AI Betting</h2>
            <div className="divide-y divide-border border-y border-border">
              {faqs.map((f, i) => (
                <details key={i} className="group py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                    <span>{f.q}</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180"
                      aria-hidden="true"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </summary>
                  <p className="mt-3 text-muted-foreground">{f.a}</p>
                </details>
              ))}
            </div>
          </section>

          <section className="rounded-2xl bg-primary/5 border border-primary/20 p-8 text-center">
            <h2 className="text-2xl font-bold mb-3">Ready to Try AI Bets?</h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              Review model probabilities, build data-informed parlays and compare each estimate with the current market and your own risk limits.
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
