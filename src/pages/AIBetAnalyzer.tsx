import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Link } from "react-router-dom";
import { BarChart3, Shield, Target, TrendingUp, Brain, CheckCircle } from "lucide-react";

const faqItems = [
  { q: "What is an AI bet analyzer?", a: "An AI bet analyzer uses machine learning to evaluate any sports bet by calculating true probabilities, identifying value, and scoring risk — giving you a data-driven edge before you place a wager." },
  { q: "How does AI odds analysis work?", a: "Our AI compares sportsbook odds against its own probability model built from thousands of data points including team form, injuries, weather, and historical matchups to find discrepancies." },
  { q: "Is AI betting analysis more accurate than manual research?", a: "Yes. AI processes far more variables simultaneously and removes emotional bias, consistently outperforming manual handicapping over large sample sizes." },
  { q: "Can I analyze parlays with the AI bet analyzer?", a: "Absolutely. The analyzer breaks down each leg of your parlay, scores correlation risk, and provides an overall probability assessment." },
  { q: "What sports does the AI bet analyzer cover?", a: "ThinkBetAI covers NFL, NBA, MLB, NHL, UFC, soccer, and tennis — with more sports being added regularly." },
  { q: "Is the AI bet analyzer free?", a: "Basic analysis is available on our free tier. Premium subscribers get unlimited deep analysis with advanced risk scoring and real-time updates." },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "ThinkBetAI Bet Analyzer",
  applicationCategory: "SportsApplication",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  aggregateRating: { "@type": "AggregateRating", ratingValue: "4.9", reviewCount: "312" },
};

const AIBetAnalyzer = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO
        title="AI Bet Analyzer — Analyze Any Bet with AI"
        description="Use ThinkBetAI's AI bet analyzer for instant probability breakdowns, risk scoring, and AI odds analysis on any sports bet. Data-driven betting analysis AI."
        keywords="ai bet analyzer, betting analysis ai, ai odds analysis, ai bet analysis, sports betting analyzer"
        url="/ai-bet-analyzer"
      />
      <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      <script type="application/ld+json">{JSON.stringify(softwareSchema)}</script>

      <Header />

      <main className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Hero */}
        <section className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">AI Bet Analyzer</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Submit any bet and get an instant AI-powered probability breakdown, risk score, and value rating — powered by the same betting analysis AI trusted by thousands.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" asChild><Link to="/login">Analyze a Bet Now</Link></Button>
            <Button size="lg" variant="outline" asChild><Link to="/ai-sports-betting">Learn About AI Betting</Link></Button>
          </div>
        </section>

        {/* Analyze any bet */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6">Analyze Any Bet with AI</h2>
          <p className="text-muted-foreground mb-6">
            Whether it&apos;s a moneyline, spread, total, or prop — our AI bet analyzer evaluates your wager in seconds. Just enter the matchup and bet type, and the AI returns a comprehensive breakdown including true probability, expected value, and a confidence rating.
          </p>
          <div className="rounded-2xl border border-border bg-muted/30 h-64 flex items-center justify-center text-muted-foreground">
            [Screenshot: AI bet analysis input & results]
          </div>
        </section>

        {/* Probability breakdown */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6">Probability Breakdown</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Target, title: "True Win Probability", desc: "Our model calculates the real chance of each outcome, independent of sportsbook odds." },
              { icon: TrendingUp, title: "Expected Value (EV)", desc: "See whether a bet has positive or negative expected value before you place it." },
              { icon: Brain, title: "Confidence Score", desc: "A 0–100 rating showing how confident the AI is in its probability estimate." },
            ].map((item) => (
              <Card key={item.title} variant="glass">
                <CardContent className="p-6">
                  <item.icon className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Risk scoring */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6">Risk Scoring</h2>
          <p className="text-muted-foreground mb-6">
            Every bet is assigned a risk score from Low to High based on variance, injury impact, historical volatility, and line movement. The AI odds analysis flags bets with hidden risk that the odds alone don&apos;t reveal.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { icon: Shield, label: "Low Risk", desc: "Strong data support, minimal variance. High-confidence plays." },
              { icon: BarChart3, label: "Medium Risk", desc: "Solid edge but moderate uncertainty. Suitable for standard bankroll." },
            ].map((item) => (
              <Card key={item.label}>
                <CardContent className="p-6 flex items-start gap-4">
                  <item.icon className="h-8 w-8 text-primary shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">{item.label}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Real examples */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6">Real Examples</h2>
          <Card variant="glass">
            <CardContent className="p-6 space-y-4">
              <h3 className="font-semibold text-lg">NFL — Chiefs vs Bills Spread Analysis</h3>
              <ul className="space-y-2">
                {[
                  "AI True Probability: Chiefs -3.5 → 54.2%",
                  "Sportsbook Implied: 51.2%",
                  "Expected Value: +3.0% edge",
                  "Risk Score: Medium (weather variable)",
                  "Confidence: 78/100",
                ].map((line) => (
                  <li key={line} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    {line}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <div className="mt-6 rounded-2xl border border-border bg-muted/30 h-48 flex items-center justify-center text-muted-foreground">
            [Screenshot: Full analysis output]
          </div>
        </section>

        {/* FAQs */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-6">FAQs About AI Bet Analysis</h2>
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger>{item.q}</AccordionTrigger>
                <AccordionContent>{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* CTA */}
        <section className="text-center py-12 rounded-2xl bg-muted/30 border border-border">
          <h2 className="text-2xl font-bold mb-4">Ready to Analyze Your Next Bet?</h2>
          <p className="text-muted-foreground mb-6">Join thousands of bettors using AI odds analysis to find value.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" asChild><Link to="/login">Start AI Analysis</Link></Button>
            <Button size="lg" variant="outline" asChild><Link to="/pricing">View Plans</Link></Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default AIBetAnalyzer;
