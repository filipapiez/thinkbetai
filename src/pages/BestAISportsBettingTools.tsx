import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link } from "react-router-dom";
import { CheckCircle, XCircle, Star } from "lucide-react";

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

const BestAISportsBettingTools = () => {
  const Bool = ({ value }: { value: boolean }) =>
    value ? <CheckCircle className="h-5 w-5 text-primary mx-auto" /> : <XCircle className="h-5 w-5 text-muted-foreground/40 mx-auto" />;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO
        title="Best AI Sports Betting Tools 2025 — ThinkBetAI vs Competitors"
        description="Compare the best AI sports betting tools and AI betting sites. See how ThinkBetAI stacks up with 83% accuracy, AI parlays, live odds, and more."
        keywords="best ai sports betting tools, ai betting sites, thinkbetai vs competitors, best ai betting app, ai sports betting comparison"
        url="/best-ai-sports-betting-tools"
      />

      <Header />

      <main className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Hero */}
        <section className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Best AI Sports Betting Tools</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Looking for the <Link to="/best-ai-sports-betting-tools" className="text-primary hover:underline font-medium">best AI sports betting tools</Link>? We compared the top AI betting sites so you don&apos;t have to. See why ThinkBetAI leads the pack.
          </p>
          <Button size="lg" asChild><Link to="/login?tab=signup">Try ThinkBetAI Free</Link></Button>
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

        {/* Internal link to pillar */}
        <section className="mb-16 text-center">
          <p className="text-muted-foreground mb-4">
            Want to learn more about <Link to="/ai-sports-betting" className="text-primary hover:underline font-medium">how AI betting works</Link> and why it&apos;s transforming sports betting?
          </p>
          <Button variant="outline" asChild>
            <Link to="/ai-sports-betting">Read: AI Sports Betting Platform →</Link>
          </Button>
        </section>

        {/* CTA */}
        <section className="text-center py-12 rounded-2xl bg-muted/30 border border-border">
          <h2 className="text-2xl font-bold mb-4">Join the #1 AI Betting Platform</h2>
          <p className="text-muted-foreground mb-6">83% accuracy. AI parlays. Live odds. <Link to="/login?tab=signup" className="text-primary hover:underline font-medium">Start using AI bets</Link> today.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" asChild><Link to="/login?tab=signup">Sign Up Free</Link></Button>
            <Button size="lg" variant="outline" asChild><Link to="/pricing">View Plans</Link></Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default BestAISportsBettingTools;
