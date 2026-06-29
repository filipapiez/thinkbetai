import { Link } from "react-router-dom";
import type { ComponentType } from "react";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Brain,
  CheckCircle2,
  CircleGauge,
  ClipboardCheck,
  Clock3,
  FileText,
  Gauge,
  LineChart,
  ListChecks,
  Lock,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLiveRangeMetric } from "@/hooks/useLiveRangeMetric";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { liveMarketStats, platformStats } from "@/lib/platformStats";
import { cn } from "@/lib/utils";
import type { SeoBlueprint, SeoSection } from "@/seo/blueprints";
import { getRelatedLinks } from "@/seo/blueprints";

interface SectionRendererProps {
  blueprint: SeoBlueprint;
  section: SeoSection;
}

const predictionPreview = [
  {
    matchup: "Los Angeles Lakers vs Phoenix Suns",
    pick: "Lakers moneyline",
    market: "Moneyline",
    confidence: 83,
    edge: "+4.8%",
    risk: "Medium",
    sportsbookOdds: "+145",
    fairOdds: "+128",
    reason: "Phoenix is missing two rotation starters and the market has not fully adjusted to the usage shift.",
  },
  {
    matchup: "New York Yankees vs Boston Red Sox",
    pick: "Yankees -1.5",
    market: "Run line",
    confidence: 79,
    edge: "+3.9%",
    risk: "Medium",
    sportsbookOdds: "+132",
    fairOdds: "+118",
    reason: "Projected bullpen advantage and stronger late-game run prevention create a playable alternate price.",
  },
  {
    matchup: "Kansas City Chiefs vs Denver Broncos",
    pick: "Chiefs -3",
    market: "Spread",
    confidence: 81,
    edge: "+4.3%",
    risk: "Low",
    sportsbookOdds: "-110",
    fairOdds: "-126",
    reason: "The model grades Kansas City higher in pass efficiency, pressure rate and red-zone conversion.",
  },
  {
    matchup: "Toronto Maple Leafs vs Boston Bruins",
    pick: "Over 5.5",
    market: "Total",
    confidence: 76,
    edge: "+2.7%",
    risk: "Medium",
    sportsbookOdds: "-105",
    fairOdds: "-116",
    reason: "Shot quality, power-play volume and goalie rest point toward a higher-scoring game script.",
  },
  {
    matchup: "Inter Miami vs Atlanta United",
    pick: "Both teams to score",
    market: "Soccer",
    confidence: 74,
    edge: "+2.4%",
    risk: "Medium",
    sportsbookOdds: "-120",
    fairOdds: "-132",
    reason: "Both clubs rate above league average in transition chances while allowing high-value box entries.",
  },
  {
    matchup: "UFC Main Event",
    pick: "Fight goes distance",
    market: "Prop",
    confidence: 72,
    edge: "+2.1%",
    risk: "High",
    sportsbookOdds: "+115",
    fairOdds: "+106",
    reason: "Pace projections are modest and both fighters have strong defensive grappling metrics.",
  },
];

const sports = [
  { label: "NFL", href: "/nfl-ai-predictions", markets: "Spreads, totals, props" },
  { label: "NBA", href: "/nba-ai-predictions", markets: "Moneylines, spreads, props" },
  { label: "MLB", href: "/mlb-ai-predictions", markets: "Moneylines, run lines, totals" },
  { label: "NHL", href: "/nhl-ai-predictions", markets: "Moneylines, puck lines, totals" },
  { label: "Soccer", href: "/soccer-ai-predictions", markets: "1X2, totals, both teams score" },
  { label: "UFC", href: "/ufc-ai-predictions", markets: "Moneyline, method, round props" },
  { label: "WNBA", href: "/wnba-ai-predictions", markets: "Spreads, totals, player props" },
  { label: "NCAAF", href: "/ncaaf-ai-predictions", markets: "Spreads, totals, team props" },
  { label: "NCAAB", href: "/ncaab-ai-predictions", markets: "Moneylines, spreads, totals" },
  { label: "Tennis", href: "/tennis-ai-predictions", markets: "Match winner, sets, totals" },
  { label: "Golf", href: "/golf-ai-predictions", markets: "Outrights, matchups, props" },
  { label: "Formula 1", href: "/formula-1-ai-predictions", markets: "Race winner, podium, props" },
  { label: "NASCAR", href: "/nascar-ai-predictions", markets: "Race winner, matchups, props" },
  { label: "Esports", href: "/esports-ai-predictions", markets: "Moneylines, maps, totals" },
];

const marketStats = [
  { label: "Today's games", value: "46" },
  { label: "Predictions generated", value: "214" },
  { label: "Sports covered", value: "14" },
  { label: "Markets tracked", value: "ML, spread, props, parlays, totals" },
];

const workflowSteps = [
  { label: "Collect odds", description: "Capture current prices, implied probability and market movement." },
  { label: "Analyze injuries", description: "Review lineup news, player availability and usage changes." },
  { label: "Evaluate trends", description: "Compare recent form, pace, matchups and historical performance." },
  { label: "Compare market prices", description: "Measure the sportsbook number against the model price." },
  { label: "Estimate probability", description: "Turn matchup inputs into a projected win or cover chance." },
  { label: "Score confidence", description: "Grade strength, volatility and data quality for each pick." },
  { label: "Explain the pick", description: "Summarize the edge, risk and best next action in plain English." },
];

const comparisonRows = [
  {
    label: "Board coverage",
    traditional: "Manual research usually focuses on a handful of games.",
    thinkbetai: "Scans the full board across sports, markets and bet types.",
  },
  {
    label: "Odds context",
    traditional: "Easy to miss stale lines or late price movement.",
    thinkbetai: "Compares market price, implied probability and model fair odds.",
  },
  {
    label: "Injury impact",
    traditional: "Requires checking multiple sources before every bet.",
    thinkbetai: "Bakes availability, lineup and usage changes into the report.",
  },
  {
    label: "Repeatability",
    traditional: "Process changes depending on time, bias and attention.",
    thinkbetai: "Applies the same evaluation framework to every matchup.",
  },
];

const howToUseSteps = [
  "Choose today's game",
  "Review AI confidence",
  "Compare market odds",
  "Check the reasoning",
  "Analyze your bet",
  "Decide for yourself",
];

const reportRows = [
  { label: "AI confidence", value: "83%", detail: "Qualified pick threshold cleared" },
  { label: "Model edge", value: "+4.8%", detail: "Sportsbook price is above fair value" },
  { label: "Expected value", value: "+7.2%", detail: "Positive EV at the current market" },
  { label: "Risk grade", value: "Medium", detail: "Lineup volatility still matters" },
];

const confidenceClass = (value: number) =>
  value >= 80 ? "text-success" : value >= 74 ? "text-primary" : "text-warning";

const SectionHeader = ({
  icon: Icon,
  eyebrow,
  heading,
  subheading,
  centered = false,
}: {
  icon?: ComponentType<{ className?: string }>;
  eyebrow?: string;
  heading: string;
  subheading?: string;
  centered?: boolean;
}) => (
  <div className={cn("mb-8 max-w-3xl", centered && "mx-auto text-center")}>
    {eyebrow && (
      <Badge variant="outline" className="mb-3 border-primary/30 bg-primary/5 text-primary">
        {Icon && <Icon className="mr-1.5 h-3.5 w-3.5" />}
        {eyebrow}
      </Badge>
    )}
    <h2 className="text-3xl font-bold md:text-4xl">{heading}</h2>
    {subheading && <p className="mt-3 text-muted-foreground md:text-lg">{subheading}</p>}
  </div>
);

const MiniReport = () => (
  <div className="rounded-lg border border-border/70 bg-background shadow-xl shadow-primary/5">
    <div className="border-b border-border/70 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-semibold">Lakers moneyline</p>
          <p className="text-sm text-muted-foreground">AI report preview</p>
        </div>
        <Badge className="bg-success/15 text-success hover:bg-success/15">83% confidence</Badge>
      </div>
    </div>
    <div className="grid gap-3 p-4 sm:grid-cols-2">
      {reportRows.map((row) => (
        <div key={row.label} className="rounded-lg border border-border/60 bg-card/40 p-3">
          <p className="text-xs text-muted-foreground">{row.label}</p>
          <p className="mt-1 text-xl font-bold text-primary">{row.value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{row.detail}</p>
        </div>
      ))}
    </div>
    <div className="border-t border-border/70 p-4">
      <p className="text-sm font-medium">AI reasoning</p>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">
        Phoenix is down two rotation starters, Los Angeles projects better in half-court efficiency and the current +145 price is above the model's fair number.
      </p>
    </div>
  </div>
);

const PageIntro = ({ blueprint }: { blueprint: SeoBlueprint }) => {
  const liveMarketCount = useLiveRangeMetric({
    ...liveMarketStats,
    storageKey: "thinkbetai-seo-live-market-count",
  });

  return (
    <section className="border-b border-border/60 bg-card/20">
    <div className="container max-w-6xl py-10 md:py-16">
      <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
        <div className="space-y-5">
          <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary">
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            {blueprint.primaryKeyword}
          </Badge>
          <h1 className="max-w-4xl text-4xl font-bold leading-tight md:text-6xl">
            {blueprint.h1}
          </h1>
          <p className="max-w-3xl text-lg leading-8 text-muted-foreground md:text-xl">
            {blueprint.heroSubheadline}
          </p>
          <div className="flex flex-col gap-3 pt-1 sm:flex-row">
            <Button size="lg" asChild>
              <a href={blueprint.primaryCTA.href}>
                {blueprint.primaryCTA.label}
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            {blueprint.secondaryCTA && (
              <Button size="lg" variant="outline" asChild>
                <a href={blueprint.secondaryCTA.href}>
                  <Target className="mr-2 h-4 w-4" />
                  {blueprint.secondaryCTA.label}
                </a>
              </Button>
            )}
          </div>
          <div className="grid gap-3 pt-3 sm:grid-cols-2 xl:grid-cols-4">
            {blueprint.heroTrust.map((metric) => {
              const value = metric.label === liveMarketStats.label ? liveMarketCount.toLocaleString() : metric.value;
              return (
                <div key={metric.label} className="rounded-lg border border-border/60 bg-background/70 p-3">
                  <div className="flex items-center gap-1 text-warning">
                    {Array.from({ length: value.includes("15,000") ? 5 : 1 }).map((_, index) => (
                      <Star key={`${metric.label}-${index}`} className="h-3.5 w-3.5 fill-current" />
                    ))}
                  </div>
                  <p className="mt-2 text-lg font-bold">{value}</p>
                  <p className="text-xs text-muted-foreground">{metric.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <MiniReport />
          <div className="grid gap-3 sm:grid-cols-3">
            {predictionPreview.slice(0, 3).map((item) => (
              <div key={item.pick} className="rounded-lg border border-border/60 bg-background/70 p-3">
                <p className="text-sm font-semibold">{item.pick}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.market}</p>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">Edge {item.edge}</span>
                  <span className={cn("text-sm font-bold", confidenceClass(item.confidence))}>
                    {item.confidence}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    </section>
  );
};

const IntroExplainer = ({ section }: SectionRendererProps) => {
  if (section.type !== "intro_explainer") return null;

  return (
    <section className="py-12 md:py-16">
      <div className="container max-w-5xl">
        {section.eyebrow && (
          <p className="mb-3 text-sm font-semibold text-primary">{section.eyebrow}</p>
        )}
        <h2 className="mb-5 text-3xl font-bold md:text-4xl">{section.heading}</h2>
        <div className="space-y-4 text-lg leading-8 text-muted-foreground">
          {section.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        {section.bullets && (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {section.bullets.map((bullet) => (
              <div key={bullet} className="flex gap-3 rounded-lg border border-border/60 bg-card/40 p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <span className="text-sm text-muted-foreground">{bullet}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

const PredictionsWidget = ({ section }: SectionRendererProps) => {
  if (section.type !== "predictions_widget") return null;
  const rows = predictionPreview.slice(0, section.limit);

  return (
    <section id="today-predictions" className="bg-card/30 py-12 md:py-16">
      <div className="container max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <SectionHeader
            icon={TrendingUp}
            eyebrow="Today's board"
            heading={section.heading}
            subheading={section.subheading}
          />
          <Button variant="outline" asChild>
            <Link to="/free-ai-predictions">
              <ListChecks className="mr-2 h-4 w-4" />
              View free picks
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {rows.map((row) => (
            <article key={`${row.matchup}-${row.pick}`} className="rounded-lg border border-border/70 bg-background p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-semibold">{row.pick}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{row.matchup}</p>
                </div>
                <span className={cn("shrink-0 text-2xl font-bold", confidenceClass(row.confidence))}>
                  {row.confidence}%
                </span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="rounded-lg border border-border/60 bg-card/40 p-3">
                  <p className="text-xs text-muted-foreground">Sportsbook</p>
                  <p className="mt-1 font-semibold">{row.sportsbookOdds}</p>
                </div>
                <div className="rounded-lg border border-border/60 bg-card/40 p-3">
                  <p className="text-xs text-muted-foreground">AI fair odds</p>
                  <p className="mt-1 font-semibold">{row.fairOdds}</p>
                </div>
                <div className="rounded-lg border border-border/60 bg-card/40 p-3">
                  <p className="text-xs text-muted-foreground">Edge</p>
                  <p className="mt-1 font-semibold text-primary">{row.edge}</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">{row.reason}</p>
              <div className="mt-4 flex items-center justify-between gap-3">
                <Badge variant="outline" className="border-border/70">
                  {row.market} - {row.risk} risk
                </Badge>
                <Button variant="ghost" size="sm" asChild>
                  <a href="#analyze-bet">
                    View analysis
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </a>
                </Button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

const MarketStats = ({ section }: SectionRendererProps) => {
  if (section.type !== "market_stats") return null;

  return (
    <section className="py-12 md:py-16">
      <div className="container max-w-6xl">
        <SectionHeader
          icon={Activity}
          eyebrow="Live coverage"
          heading={section.heading}
          subheading={section.subheading}
          centered
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {marketStats.map((stat) => (
            <Card key={stat.label} className="border-border/70 bg-card/40">
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="mt-2 text-3xl font-bold text-primary">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

const ProductReportPreview = ({ section }: SectionRendererProps) => {
  if (section.type !== "product_report_preview") return null;

  return (
    <section className="bg-card/30 py-12 md:py-16">
      <div className="container max-w-6xl">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <SectionHeader
            icon={FileText}
            eyebrow="Report preview"
            heading={section.heading}
            subheading={section.subheading}
          />
          <div className="rounded-lg border border-border/70 bg-background p-4 shadow-xl shadow-primary/5">
            <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
              <div className="rounded-lg border border-border/60 bg-card/40 p-4">
                <p className="text-sm font-semibold">Bet report</p>
                <p className="mt-1 text-xs text-muted-foreground">Lakers moneyline +145</p>
                <div className="mt-5 flex items-center justify-center">
                  <div className="flex h-36 w-36 items-center justify-center rounded-full border-8 border-primary/25 bg-primary/10">
                    <div className="text-center">
                      <p className="text-4xl font-bold text-primary">83%</p>
                      <p className="text-xs text-muted-foreground">confidence</p>
                    </div>
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-lg bg-background p-3">
                    <p className="text-muted-foreground">Edge</p>
                    <p className="font-semibold text-primary">+4.8%</p>
                  </div>
                  <div className="rounded-lg bg-background p-3">
                    <p className="text-muted-foreground">EV</p>
                    <p className="font-semibold text-primary">+7.2%</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  ["Explanation", "Phoenix's availability downgrade increases Los Angeles usage and half-court efficiency projections."],
                  ["Risk", "Medium volatility because the market can move quickly after confirmed lineups."],
                  ["Alternative bet", "If the moneyline shortens below +130, compare Lakers +2.5 instead."],
                ].map(([label, copy]) => (
                  <div key={label} className="rounded-lg border border-border/60 bg-card/40 p-4">
                    <p className="text-sm font-semibold">{label}</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{copy}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const HowAIWorks = ({ section }: SectionRendererProps) => {
  if (section.type !== "how_ai_works") return null;

  return (
    <section className="py-12 md:py-16">
      <div className="container max-w-6xl">
        <SectionHeader
          icon={Brain}
          eyebrow="AI process"
          heading={section.heading}
          subheading={section.subheading}
          centered
        />
        <div className="grid gap-3 lg:grid-cols-7">
          {workflowSteps.map((step, index) => (
            <div key={step.label} className="rounded-lg border border-border/70 bg-card/40 p-4">
              <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {index + 1}
              </div>
              <p className="font-semibold">{step.label}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const RecentPerformance = ({ section }: SectionRendererProps) => {
  if (section.type !== "recent_performance") return null;
  const stats = [
    { label: "Qualified picks", value: platformStats.totalQualified.toLocaleString(), icon: ClipboardCheck },
    { label: "Qualified win rate", value: platformStats.qualifiedWinRateLabel, icon: Gauge },
    { label: "Average confidence", value: `${platformStats.averageConfidence}%`, icon: LineChart },
    { label: "Best streak", value: `${platformStats.streakBest}`, icon: Zap },
  ];

  return (
    <section className="py-12 md:py-16">
      <div className="container max-w-6xl">
        <SectionHeader
          icon={BarChart3}
          eyebrow="Track record"
          heading={section.heading}
          subheading={section.subheading}
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label}>
                <CardContent className="p-5">
                  <Icon className="h-5 w-5 text-primary" />
                  <p className="mt-4 text-sm text-muted-foreground">{stat.label}</p>
                  <p className="mt-2 text-3xl font-bold text-primary">{stat.value}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Past performance does not guarantee future outcomes. Use performance data as context, not as a promise.
        </p>
      </div>
    </section>
  );
};

const BetAnalyzerPreview = ({ section }: SectionRendererProps) => {
  if (section.type !== "bet_analyzer_preview") return null;

  return (
    <section id="analyze-bet" className="bg-card/30 py-12 md:py-16">
      <div className="container max-w-6xl">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <SectionHeader
            icon={Target}
            eyebrow="Bet analyzer"
            heading={section.heading}
            subheading={section.subheading}
          />
          <Card className="border-primary/20 bg-background">
            <CardContent className="p-5">
              <label className="mb-2 block text-sm font-medium">Paste a bet slip or line</label>
              <Textarea placeholder={section.placeholder} className="min-h-28 resize-none" />
              <div className="mt-4 rounded-lg border border-border/70 bg-card/60 p-4">
                <div className="flex items-start gap-3">
                  <Lock className="mt-0.5 h-5 w-5 text-primary" />
                  <div>
                    <p className="font-semibold">Generate a full AI report</p>
                    <p className="text-sm text-muted-foreground">
                      Preview the workflow first, then unlock implied probability, model edge, risk notes and recommended action.
                    </p>
                  </div>
                </div>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="mt-4 w-full">
                    <Brain className="mr-2 h-4 w-4" />
                    Analyze My Bet
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-xl">
                  <DialogHeader>
                    <DialogTitle>Generating your AI report</DialogTitle>
                    <DialogDescription>
                      ThinkBetAI is checking the line, market price, matchup inputs and risk profile.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Progress value={82} />
                    <div className="grid gap-3">
                      {[
                        ["Uploading bet slip", "Complete"],
                        ["Reading sportsbook odds", "Complete"],
                        ["Generating AI report", "In progress"],
                        ["Unlocking full analysis", "Account required"],
                      ].map(([label, status]) => (
                        <div key={label} className="flex items-center justify-between rounded-lg border border-border/70 bg-card/50 p-3">
                          <span className="text-sm font-medium">{label}</span>
                          <Badge variant={status === "In progress" ? "default" : "outline"}>{status}</Badge>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                      <p className="font-semibold">Create your free account to unlock the complete analysis.</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Full reports include edge, fair odds, confidence, EV, risk flags and alternative bet suggestions.
                      </p>
                    </div>
                    <Button className="w-full" asChild>
                      <Link to="/login?tab=signup">
                        Create free account
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

const ComparisonTable = ({ section }: SectionRendererProps) => {
  if (section.type !== "comparison_table") return null;

  return (
    <section className="bg-card/30 py-12 md:py-16">
      <div className="container max-w-6xl">
        <SectionHeader
          icon={Scale}
          eyebrow="Why ThinkBetAI"
          heading={section.heading}
          subheading={section.subheading}
        />
        <div className="overflow-hidden rounded-lg border border-border/70 bg-background">
          <div className="grid gap-4 border-b border-border/70 bg-card/50 p-4 text-sm font-semibold md:grid-cols-[0.8fr_1fr_1fr]">
            <span>Category</span>
            <span>Traditional research</span>
            <span>ThinkBetAI</span>
          </div>
          {comparisonRows.map((row) => (
            <div key={row.label} className="grid gap-4 border-b border-border/50 p-4 last:border-b-0 md:grid-cols-[0.8fr_1fr_1fr]">
              <p className="font-semibold">{row.label}</p>
              <p className="text-sm leading-6 text-muted-foreground">{row.traditional}</p>
              <p className="text-sm leading-6 text-muted-foreground">{row.thinkbetai}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const HowToUse = ({ section }: SectionRendererProps) => {
  if (section.type !== "how_to_use") return null;

  return (
    <section className="py-12 md:py-16">
      <div className="container max-w-6xl">
        <SectionHeader
          icon={ListChecks}
          eyebrow="Simple workflow"
          heading={section.heading}
          subheading={section.subheading}
          centered
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {howToUseSteps.map((step, index) => (
            <div key={step} className="flex items-center gap-4 rounded-lg border border-border/70 bg-card/40 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                {index + 1}
              </div>
              <p className="font-semibold">{step}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const SupportedSports = ({ section }: SectionRendererProps) => {
  if (section.type !== "supported_sports") return null;

  return (
    <section className="py-12 md:py-16">
      <div className="container max-w-6xl">
        <SectionHeader
          icon={CircleGauge}
          eyebrow="Sports covered"
          heading={section.heading}
          subheading={section.subheading}
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sports.map((sport) => (
            <Link
              key={sport.label}
              to={sport.href}
              className="rounded-lg border border-border/60 bg-card/40 p-5 transition-colors hover:border-primary/40"
            >
              <p className="text-xl font-bold">{sport.label}</p>
              <p className="mt-1 text-sm text-muted-foreground">{sport.markets}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

const RelatedPages = ({ blueprint, section }: SectionRendererProps) => {
  if (section.type !== "related_pages") return null;
  const links = getRelatedLinks(blueprint, 9);

  return (
    <section className="bg-card/30 py-12 md:py-16">
      <div className="container max-w-6xl">
        <SectionHeader
          icon={Search}
          eyebrow="Keep exploring"
          heading={section.heading}
          subheading={section.subheading}
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {links.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="group flex items-center justify-between rounded-lg border border-border/60 bg-background p-4 transition-colors hover:border-primary/40"
            >
              <span className="font-medium">{link.label}</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

const FAQModule = ({ blueprint, section }: SectionRendererProps) => {
  if (section.type !== "faq") return null;

  return (
    <section className="py-12 md:py-16">
      <div className="container max-w-4xl">
        <h2 className="mb-8 text-3xl font-bold md:text-4xl">{section.heading}</h2>
        <div className="divide-y divide-border rounded-lg border border-border/70 bg-card/30">
          {blueprint.faq.map((faq) => (
            <details key={faq.question} className="group p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                {faq.question}
                <span className="text-primary transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 leading-7 text-muted-foreground">{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
};

const FinalCTA = ({ blueprint, section }: SectionRendererProps) => {
  if (section.type !== "final_cta") return null;

  return (
    <section className="pb-14 md:pb-20">
      <div className="container max-w-5xl">
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-8 text-center md:p-12">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h2 className="text-3xl font-bold md:text-4xl">{section.heading}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground md:text-lg">{section.subheading}</p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <a href={blueprint.primaryCTA.href}>
                <ListChecks className="mr-2 h-4 w-4" />
                {blueprint.primaryCTA.label}
              </a>
            </Button>
            {blueprint.secondaryCTA && (
              <Button size="lg" variant="outline" asChild>
                <a href={blueprint.secondaryCTA.href}>
                  <Brain className="mr-2 h-4 w-4" />
                  {blueprint.secondaryCTA.label}
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

const SECTION_REGISTRY: Record<SeoSection["type"], ComponentType<SectionRendererProps>> = {
  intro_explainer: IntroExplainer,
  predictions_widget: PredictionsWidget,
  market_stats: MarketStats,
  product_report_preview: ProductReportPreview,
  how_ai_works: HowAIWorks,
  recent_performance: RecentPerformance,
  bet_analyzer_preview: BetAnalyzerPreview,
  supported_sports: SupportedSports,
  comparison_table: ComparisonTable,
  how_to_use: HowToUse,
  related_pages: RelatedPages,
  faq: FAQModule,
  final_cta: FinalCTA,
};

export const SeoBlueprintRenderer = ({ blueprint }: { blueprint: SeoBlueprint }) => (
  <>
    <PageIntro blueprint={blueprint} />
    {blueprint.intro.length > 0 && (
      <section className="py-10">
        <div className="container max-w-4xl space-y-4 text-lg leading-8 text-muted-foreground">
          {blueprint.intro.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </section>
    )}
    {blueprint.sections.map((section, index) => {
      const Section = SECTION_REGISTRY[section.type];
      return <Section key={`${section.type}-${index}`} blueprint={blueprint} section={section} />;
    })}
  </>
);
