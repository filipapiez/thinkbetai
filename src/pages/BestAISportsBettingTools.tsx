import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Link } from "react-router-dom";
import { CheckCircle, XCircle, Star, ArrowRight, Brain, Layers, MessageSquare } from "lucide-react";

const competitors = [
  { name: "ThinkBetAI", ai: true, parlays: true, liveOdds: true, chat: true, free: true, accuracy: "83%" },
  { name: "Competitor A", ai: true, parlays: false, liveOdds: true, chat: false, free: false, accuracy: "~70%" },
  { name: "Competitor B", ai: false, parlays: true, liveOdds: true, chat: false, free: true, accuracy: "N/A" },
  { name: "Competitor C", ai: true, parlays: true, liveOdds: false, chat: false, free: false, accuracy: "~65%" },
];

const differentiators = [
  { title: "Multi-Sport AI Coverage", desc: "NFL, NBA, MLB, NHL, UFC, soccer, and tennis — all analyzed by the same powerful AI engine." },
  { title: "AI Parlay Optimization", desc: "Our AI doesn't just pick winners — it builds optimized parlays with correlation-aware leg selection." },
  { title: "Real-Time Odds Integration", desc: "Live odds from multiple sportsbooks are compared against AI probabilities to surface the best value." },
  { title: "Conversational AI Chat", desc: "Ask the AI any betting question and get instant, data-backed answers — no other tool offers this." },
  { title: "Transparent Accuracy Tracking", desc: "We publish our historical accuracy openly. No black-box promises — just verifiable results." },
  { title: "Free Tier Available", desc: "Start using AI betting predictions for free. Upgrade only when you're ready for premium features." },
];

const faqItems = [
  { q: "What makes a good AI sports betting tool?", a: "A strong AI sports betting tool should offer data-driven predictions based on real statistical models, transparent accuracy tracking, multi-sport coverage, real-time odds integration, and clear explanations for every pick. Avoid tools that make unrealistic profit guarantees." },
  { q: "How do I compare AI betting sites?", a: "Look at accuracy track records, the range of sports covered, whether they offer a free tier, the quality of their explanations, and whether they integrate live odds data. ThinkBetAI scores highest across all these criteria." },
  { q: "Are AI betting tools worth paying for?", a: "Premium AI betting tools provide deeper analysis, more sports coverage, and advanced features like parlay optimization. If you bet regularly, the edge from better analysis typically outweighs the subscription cost." },
  { q: "Can AI betting tools guarantee profits?", a: "No legitimate AI tool guarantees profits. Sports are inherently unpredictable. What AI does is identify value bets with a statistical edge — over a large sample, this edge can translate to better returns than unaided betting." },
  { q: "Does ThinkBetAI work for casual bettors?", a: "Absolutely. ThinkBetAI is designed for all experience levels. Each pick includes plain-language explanations, confidence scores, and risk ratings so even first-time bettors can understand and act on the analysis." },
  { q: "How often are AI predictions updated?", a: "ThinkBetAI updates predictions throughout the day as new data — injuries, lineup changes, odds movements — becomes available. Premium users get real-time updates right up until game time." },
];

const combinedSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "FAQPage",
      mainEntity: faqItems.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
    {
      "@type": "SoftwareApplication",
      name: "ThinkBetAI",
      applicationCategory: "SportsApplication",
      operatingSystem: "Web",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      aggregateRating: { "@type": "AggregateRating", ratingValue: "4.9", reviewCount: "2140" },
    },
  ],
};

const BestAISportsBettingTools = () => {
  const Bool = ({ value }: { value: boolean }) =>
    value ? <CheckCircle className="h-5 w-5 text-primary mx-auto" /> : <XCircle className="h-5 w-5 text-muted-foreground/40 mx-auto" />;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO
        title="Best AI Sports Betting Tools 2026 — Compare Top AI Betting Sites"
        description="Compare the best AI sports betting tools and AI betting sites for 2026. See how ThinkBetAI leads with 83% accuracy, AI parlays, live odds integration, and a free tier."
        keywords="best ai sports betting tools, ai betting sites, best ai betting app, ai sports betting comparison, top ai betting platforms 2026"
        url="/best-ai-sports-betting-tools"
        structuredData={combinedSchema}
      />

      <Header />

      <main className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Hero */}
        <section className="mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Best AI Sports Betting Tools in 2026</h1>
          <p className="text-lg text-muted-foreground max-w-3xl mb-4">
            Looking for the <Link to="/best-ai-sports-betting-tools" className="text-primary hover:underline font-medium">best AI sports betting tools</Link>? We compared the top AI betting sites across accuracy, features, pricing, and usability so you don&apos;t have to. See why ThinkBetAI leads the pack.
          </p>
          <p className="text-muted-foreground leading-relaxed max-w-3xl mb-8">
            The AI sports betting landscape has exploded in recent years, with dozens of platforms claiming to use artificial intelligence for predictions. But not all AI betting tools are created equal. Some rely on basic statistical models dressed up as "AI," while others offer genuine machine learning with transparent accuracy tracking. In this comprehensive comparison, we break down what matters most when choosing an AI betting platform — and show you exactly how ThinkBetAI stacks up against the competition.
          </p>
          <Button size="lg" asChild><Link to="/login?tab=signup">Try ThinkBetAI Free <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
        </section>

        {/* What to look for */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6">What to Look for in an AI Betting Tool</h2>
          <div className="prose prose-lg dark:prose-invert max-w-none space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              Before comparing specific tools, it helps to understand the criteria that separate genuine AI betting platforms from marketing hype. A credible AI betting tool should publish verifiable accuracy data — not vague claims like "up to 90% accuracy." It should cover multiple sports and bet types, integrate real-time odds data, and explain <em>why</em> it recommends each pick rather than just listing selections.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Transparency is key. If a platform won't show you its historical track record or explain its methodology, that's a red flag. The best AI sports betting tools also offer features beyond basic picks — things like parlay optimization, conversational AI assistants, risk scoring, and expected value calculations. These features separate a genuine analytical platform from a simple tipster service with an AI label.
            </p>
          </div>
        </section>

        {/* Comparison table */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6">ThinkBetAI vs Other AI Betting Sites</h2>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Tool</TableHead>
                    <TableHead className="text-center">AI Picks</TableHead>
                    <TableHead className="text-center">AI Parlays</TableHead>
                    <TableHead className="text-center">Live Odds</TableHead>
                    <TableHead className="text-center">AI Chat</TableHead>
                    <TableHead className="text-center">Free Tier</TableHead>
                    <TableHead className="text-center">Accuracy</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {competitors.map((c) => (
                    <TableRow key={c.name} className={c.name === "ThinkBetAI" ? "bg-primary/5 font-semibold" : ""}>
                      <TableCell className="flex items-center gap-2">
                        {c.name === "ThinkBetAI" && <Star className="h-4 w-4 text-primary" />}
                        {c.name}
                      </TableCell>
                      <TableCell><Bool value={c.ai} /></TableCell>
                      <TableCell><Bool value={c.parlays} /></TableCell>
                      <TableCell><Bool value={c.liveOdds} /></TableCell>
                      <TableCell><Bool value={c.chat} /></TableCell>
                      <TableCell><Bool value={c.free} /></TableCell>
                      <TableCell className="text-center">{c.accuracy}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>

        {/* Why ThinkBetAI is different */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6">Why ThinkBetAI Is Different</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {differentiators.map((d) => (
              <Card key={d.title} variant="glass">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2">{d.title}</h3>
                  <p className="text-sm text-muted-foreground">{d.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Internal links */}
        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-6">Explore ThinkBetAI's Features</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <Link to="/ai-bet-analyzer" className="p-5 rounded-xl border border-border hover:border-primary/30 transition-colors text-center">
              <Brain className="h-8 w-8 text-primary mx-auto mb-2" />
              <span className="font-semibold block">AI Bet Analyzer</span>
              <span className="text-xs text-muted-foreground">Analyze any bet instantly</span>
            </Link>
            <Link to="/ai-parlay-builder" className="p-5 rounded-xl border border-border hover:border-primary/30 transition-colors text-center">
              <Layers className="h-8 w-8 text-primary mx-auto mb-2" />
              <span className="font-semibold block">AI Parlay Builder</span>
              <span className="text-xs text-muted-foreground">Build optimized parlays</span>
            </Link>
            <Link to="/chat" className="p-5 rounded-xl border border-border hover:border-primary/30 transition-colors text-center">
              <MessageSquare className="h-8 w-8 text-primary mx-auto mb-2" />
              <span className="font-semibold block">AI Betting Chat</span>
              <span className="text-xs text-muted-foreground">Ask anything about games</span>
            </Link>
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6">FAQs About AI Betting Tools</h2>
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-left">{item.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* Bottom links */}
        <section className="mb-16 text-center">
          <p className="text-muted-foreground mb-4">
            Want to learn more about <Link to="/ai-sports-betting" className="text-primary hover:underline font-medium">how AI betting works</Link>? Read our in-depth guide, check the <Link to="/blog" className="text-primary hover:underline font-medium">blog</Link>, or see our <Link to="/pricing" className="text-primary hover:underline font-medium">pricing plans</Link>.
          </p>
        </section>

        {/* CTA */}
        <section className="text-center py-12 rounded-2xl bg-muted/30 border border-border">
          <h2 className="text-2xl font-bold mb-4">Join the #1 AI Betting Platform</h2>
          <p className="text-muted-foreground mb-6">83% accuracy. AI parlays. Live odds. <Link to="/login?tab=signup" className="text-primary hover:underline font-medium">Start using AI bets</Link> today.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" asChild><Link to="/login?tab=signup">Sign Up Free <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
            <Button size="lg" variant="outline" asChild><Link to="/pricing">View Plans</Link></Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default BestAISportsBettingTools;
