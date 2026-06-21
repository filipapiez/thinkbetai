import { Link } from "react-router-dom";
import { ArrowRight, Brain, CheckCircle2, ExternalLink, Layers, Scale, ShieldCheck, WalletCards } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

type ToolComparison = {
  name: string;
  bestFor: string;
  access: string;
  proof: string;
  sourceUrl: string;
  sourceLabel: string;
};

const tools: ToolComparison[] = [
  {
    name: "ThinkBetAI",
    bestFor: "A lower-cost web workflow combining game analysis, parlays and AI-assisted research",
    access: "Paid plans currently listed from $4.99/month",
    proof: "Methodology page and settled-record summary",
    sourceUrl: "/pricing",
    sourceLabel: "ThinkBetAI pricing",
  },
  {
    name: "Rithmm",
    bestFor: "No-code custom models, tracked bets and personalized signals",
    access: "7-day trial; membership listed at $29.99/month",
    proof: "Tracks predictions and bets inside its app",
    sourceUrl: "https://www.rithmm.com/",
    sourceLabel: "Rithmm official site",
  },
  {
    name: "IABET",
    bestFor: "A mobile-first daily-picks experience with confidence scores",
    access: "Free plan; paid plans listed at $49.95 and $99.95/month",
    proof: "Timestamped calls, hit-rate tracking and a public pick tracker",
    sourceUrl: "https://iabet.co/",
    sourceLabel: "IABET official site",
  },
  {
    name: "ParlAI",
    bestFor: "Screenshot-based parlay building and individual bet analysis",
    access: "Free allowance; paid plans listed at $19.99 and $39.99/month",
    proof: "Confidence, risk and correlation analysis with parlay history",
    sourceUrl: "https://www.tryparlai.com/",
    sourceLabel: "ParlAI official site",
  },
  {
    name: "Outlier",
    bestFor: "Player-prop research, line shopping, positive-EV and arbitrage feeds",
    access: "7-day trial; plans currently listed from $19.99/month",
    proof: "Market data, line movement and research filters rather than a single headline model",
    sourceUrl: "https://outlier.bet/",
    sourceLabel: "Outlier official site",
  },
  {
    name: "Moddy",
    bestFor: "Building, testing and following transparent community-created models",
    access: "7-day bettor trial and 14-day creator trial; pricing varies by plan",
    proof: "Visible model histories and tracked prediction performance",
    sourceUrl: "https://moddy.ai/",
    sourceLabel: "Moddy official site",
  },
  {
    name: "BetEdge AI",
    bestFor: "A compact live board with odds comparison and a public performance summary",
    access: "7-day trial; verify current paid pricing with the provider",
    proof: "Public settled-prediction, win-rate and units summary",
    sourceUrl: "https://www.betedges.com/",
    sourceLabel: "BetEdge AI official site",
  },
];

const faqItems = [
  {
    q: "What is the best AI sports betting tool in 2026?",
    a: "There is no universal winner. Rithmm and Moddy emphasize custom models, Outlier emphasizes market research, ParlAI emphasizes screenshot-based parlay workflows, and ThinkBetAI emphasizes a lower-cost combined web toolkit. Choose based on the workflow you will actually use.",
  },
  {
    q: "Which AI betting tool has the lowest listed entry price?",
    a: "Among the paid plans reviewed on June 20, 2026, ThinkBetAI listed the lowest starting monthly price at $4.99. Some competitors also offer free allowances or limited-time trials, so compare the included features rather than price alone.",
  },
  {
    q: "What should I verify before paying for AI picks?",
    a: "Check the sample size, date range, market and odds used for grading, whether losses remain visible, cancellation terms, sport coverage, and whether the product explains uncertainty. A headline win rate without those details is not enough.",
  },
  {
    q: "Can an AI betting app guarantee a profit?",
    a: "No. Sports outcomes and market prices are uncertain. A responsible tool presents estimates, supporting data and limitations; it does not promise wins or remove the need for judgment and risk controls.",
  },
  {
    q: "Are these rankings independent?",
    a: "No. ThinkBetAI publishes this comparison and has a commercial interest. That is why the guide links directly to every provider, avoids affiliate links, states where competitors may be stronger, and explains the evaluation criteria.",
  },
];

const comparisonSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      headline: "Best AI Sports Betting Tools: An Evidence-Based Comparison",
      description: "Compare AI sports betting tools by workflow, public evidence, access and price using current provider information.",
      datePublished: "2026-06-20",
      dateModified: "2026-06-20",
      author: { "@type": "Organization", name: "ThinkBetAI Editorial Team", url: "https://thinkbetai.com/editorial-policy" },
      publisher: { "@type": "Organization", name: "ThinkBetAI", url: "https://thinkbetai.com" },
      mainEntityOfPage: "https://thinkbetai.com/best-ai-sports-betting-tools",
    },
    {
      "@type": "ItemList",
      name: "AI sports betting tools reviewed",
      itemListElement: tools.map((tool, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: tool.name,
        url: tool.sourceUrl.startsWith("http") ? tool.sourceUrl : `https://thinkbetai.com${tool.sourceUrl}`,
      })),
    },
    {
      "@type": "FAQPage",
      mainEntity: faqItems.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
  ],
};

const ExternalSource = ({ tool }: { tool: ToolComparison }) => {
  if (!tool.sourceUrl.startsWith("http")) {
    return <Link className="text-primary hover:underline" to={tool.sourceUrl}>{tool.sourceLabel}</Link>;
  }
  return (
    <a className="inline-flex items-center gap-1 text-primary hover:underline" href={tool.sourceUrl} target="_blank" rel="noopener noreferrer">
      {tool.sourceLabel}<ExternalLink className="h-3 w-3" />
    </a>
  );
};

const BestAISportsBettingTools = () => (
  <div className="min-h-screen bg-background text-foreground">
    <SEO
      title="Best AI Sports Betting Tools Compared (2026)"
      description="An evidence-based comparison of ThinkBetAI, Rithmm, IABET, ParlAI, Outlier, Moddy and BetEdge by workflow, pricing and public proof."
      keywords="best AI sports betting tools, AI betting app comparison, Rithmm alternative, Outlier alternative, AI parlay builder comparison"
      url="/best-ai-sports-betting-tools"
      type="article"
      author="ThinkBetAI Editorial Team"
      publishedTime="2026-06-20"
      structuredData={comparisonSchema}
    />

    <Header />
    <main className="container mx-auto max-w-6xl px-4 py-8 md:py-12">
      <Breadcrumb items={[{ label: "AI betting tools comparison" }]} className="mb-8" />

      <article>
        <header className="mb-12 max-w-4xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-primary">Provider information checked June 20, 2026</p>
          <h1 className="mb-5 text-4xl font-bold tracking-tight md:text-6xl">Best AI Sports Betting Tools: An Evidence-Based Comparison</h1>
          <p className="mb-5 text-xl leading-relaxed text-muted-foreground">
            The best tool is the one that matches your workflow and proves what it claims. We compared current provider pages for pricing, free access, product focus and publicly described performance tracking.
          </p>
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-muted-foreground">
            <strong className="text-foreground">Disclosure:</strong> ThinkBetAI publishes this page and is included in the comparison. We have a commercial interest, use no affiliate links here, link directly to each provider and explicitly note where another product may be the better fit.
          </div>
        </header>

        <section className="mb-14">
          <h2 className="mb-6 text-3xl font-bold">Quick comparison</h2>
          <Card>
            <CardContent className="overflow-x-auto p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-36">Tool</TableHead>
                    <TableHead className="min-w-64">Best suited for</TableHead>
                    <TableHead className="min-w-56">Access and listed price</TableHead>
                    <TableHead className="min-w-60">Publicly described proof</TableHead>
                    <TableHead className="min-w-44">Source</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tools.map((tool) => (
                    <TableRow key={tool.name} className={tool.name === "ThinkBetAI" ? "bg-primary/5" : undefined}>
                      <TableCell className="font-semibold">{tool.name}</TableCell>
                      <TableCell>{tool.bestFor}</TableCell>
                      <TableCell>{tool.access}</TableCell>
                      <TableCell>{tool.proof}</TableCell>
                      <TableCell className="text-xs"><ExternalSource tool={tool} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <p className="mt-3 text-xs text-muted-foreground">Prices and trials change. Taxes, annual discounts and regional availability may differ. Verify the provider page before purchasing.</p>
        </section>

        <section className="mb-14">
          <h2 className="mb-6 text-3xl font-bold">How we evaluated each tool</h2>
          <div className="grid gap-5 md:grid-cols-2">
            {[
              { icon: ShieldCheck, title: "Evidence", text: "Does the provider define the sample, grading method, time period and whether losses remain visible?" },
              { icon: Brain, title: "Workflow fit", text: "Is it primarily a picks feed, custom-model builder, research terminal, parlay tool or conversational assistant?" },
              { icon: WalletCards, title: "Real cost", text: "What can a new user do for free, what does the first paid tier include, and is a card required for a trial?" },
              { icon: Scale, title: "Limitations", text: "Which sports, markets or advanced features are missing, gated or still described as coming soon?" },
            ].map(({ icon: Icon, title, text }) => (
              <Card key={title}>
                <CardContent className="p-6">
                  <Icon className="mb-3 h-6 w-6 text-primary" />
                  <h3 className="mb-2 font-semibold">{title}</h3>
                  <p className="text-sm text-muted-foreground">{text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mb-14">
          <h2 className="mb-6 text-3xl font-bold">Which tool fits which bettor?</h2>
          <div className="space-y-5">
            {[
              ["Choose ThinkBetAI when", "you want a lower entry price and prefer one web product for matchup analysis, parlays and AI-assisted research."],
              ["Choose Rithmm or Moddy when", "building or following custom predictive models is more important than having the lowest monthly price."],
              ["Choose Outlier when", "line shopping, player-prop filters, positive-EV feeds and arbitrage research are your primary workflow."],
              ["Choose ParlAI when", "you want to upload an odds screenshot and make parlay or bet-slip analysis the center of the experience."],
              ["Choose IABET when", "you prefer a mobile-first picks feed with confidence tiers and in-app result tracking."],
              ["Choose BetEdge AI when", "you want a compact live board tied closely to a public top-line performance summary."],
            ].map(([title, text]) => (
              <div key={title} className="flex gap-3 rounded-xl border border-border p-5">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <p><strong>{title}</strong> {text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-14 grid gap-6 lg:grid-cols-2">
          <Card className="border-primary/30">
            <CardContent className="p-7">
              <Layers className="mb-4 h-7 w-7 text-primary" />
              <h2 className="mb-3 text-2xl font-bold">What ThinkBetAI does well</h2>
              <ul className="space-y-3 text-muted-foreground">
                <li>• Paid access currently starts at $4.99/month.</li>
                <li>• Matchup analysis, parlay tools and AI-assisted explanations live in one web workflow.</li>
                <li>• Methodology and responsible-gambling information are public.</li>
                <li>• Results are described with uncertainty instead of guaranteed-win language.</li>
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-7">
              <Scale className="mb-4 h-7 w-7 text-primary" />
              <h2 className="mb-3 text-2xl font-bold">Where competitors may be stronger</h2>
              <ul className="space-y-3 text-muted-foreground">
                <li>• Rithmm and Moddy make custom model creation a central product feature.</li>
                <li>• Outlier offers deeper arbitrage and multi-book research tools.</li>
                <li>• ParlAI has a focused screenshot-upload workflow.</li>
                <li>• Established mobile apps can offer more third-party ratings and download history.</li>
              </ul>
            </CardContent>
          </Card>
        </section>

        <section className="mb-14">
          <h2 className="mb-5 text-3xl font-bold">Frequently asked questions</h2>
          <Accordion type="single" collapsible>
            {faqItems.map((item, index) => (
              <AccordionItem value={`comparison-${index}`} key={item.q}>
                <AccordionTrigger className="text-left">{item.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        <section className="rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center md:p-12">
          <h2 className="mb-3 text-3xl font-bold">Try the lower-cost option first</h2>
          <p className="mx-auto mb-7 max-w-2xl text-muted-foreground">Review ThinkBetAI’s exact plan features, methodology and limitations before deciding. Paid plans currently start at $4.99/month and can be canceled anytime.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button size="lg" asChild><Link to="/pricing">Compare ThinkBetAI plans <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
            <Button size="lg" variant="outline" asChild><Link to="/track-record">Review the methodology</Link></Button>
          </div>
        </section>
      </article>
    </main>
    <Footer />
  </div>
);

export default BestAISportsBettingTools;
