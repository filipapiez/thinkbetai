import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Button } from '@/components/ui/button';
import { 
  UserPlus, Search, Brain, BarChart3, Layers, 
  MessageCircle, ArrowRight, Database, Zap, Shield,
  CheckCircle2, TrendingUp, Activity, Target, Clock,
  LineChart, RefreshCw, Cpu, Globe, Award, AlertTriangle,
  Sparkles, DollarSign
} from 'lucide-react';

const steps = [
  {
    icon: UserPlus,
    title: "1. Create Your Account",
    description: "Sign up for free and choose a plan that fits your needs. Get instant access to AI-powered analysis across every major sport.",
    detail: "No credit card required to start exploring. Upgrade anytime to unlock full features.",
  },
  {
    icon: Search,
    title: "2. Browse Today's Games",
    description: "View all upcoming games across NFL, NBA, MLB, NHL, soccer, UFC, and more. Each game card shows key matchup info, odds, and spreads at a glance.",
    detail: "Games are pulled from live odds feeds so you always see the latest lines and spreads from top sportsbooks.",
  },
  {
    icon: Brain,
    title: "3. Get AI Analysis",
    description: "Click into any game to see our AI's full breakdown — win probability, recommended pick, confidence score, edge rating, and detailed reasoning.",
    detail: "The AI evaluates historical performance, recent form, injuries, weather, line movement, and more.",
  },
  {
    icon: Layers,
    title: "4. Build Parlays",
    description: "Select games from the Games page to build custom parlays, or let the AI generate optimized parlay suggestions automatically.",
    detail: "Each parlay gets a confidence grade, combined probability analysis, and risk assessment.",
  },
  {
    icon: MessageCircle,
    title: "5. Ask the AI Anything",
    description: "Use the AI chat to ask questions like 'Who should I bet on tonight?' or 'What's the best over/under in the NBA today?'",
    detail: "The chat has full context on today's games, odds, injuries, and historical trends.",
  },
  {
    icon: BarChart3,
    title: "6. Track Your Results",
    description: "Review your bet history, win rate, and ROI over time. See which sports and bet types perform best for you.",
    detail: "Our dashboard shows qualified accuracy metrics so you know exactly how the AI is performing.",
  },
];

const aiFeatures = [
  {
    icon: Database,
    title: "Real-Time Data Ingestion",
    description: "We pull live odds, injury reports, and box scores from multiple data providers every few minutes to ensure our analysis reflects the latest information.",
  },
  {
    icon: Brain,
    title: "Machine Learning Models",
    description: "Our models analyze thousands of variables — team stats, player matchups, travel fatigue, weather, public betting trends — to generate probability estimates.",
  },
  {
    icon: Zap,
    title: "Edge Detection",
    description: "We compare our calculated probabilities against bookmaker lines to surface picks where the AI sees the most value — the bigger the edge, the stronger the recommendation.",
  },
  {
    icon: Shield,
    title: "Risk Assessment",
    description: "Every pick comes with a confidence score and risk meter so you can make informed decisions about how much to wager and which bets to prioritize.",
  },
];

const dataSources = [
  {
    icon: Globe,
    title: "Live Odds Feeds",
    description: "Real-time moneyline, spread, and over/under odds from major sportsbooks including DraftKings, FanDuel, BetMGM, and more.",
  },
  {
    icon: Activity,
    title: "Injury Reports",
    description: "Player injury statuses scraped from official team sources and news outlets, updated continuously throughout the day.",
  },
  {
    icon: LineChart,
    title: "Historical Statistics",
    description: "Years of team and player performance data including head-to-head records, home/away splits, and situational stats.",
  },
  {
    icon: RefreshCw,
    title: "Line Movement Tracking",
    description: "We monitor how odds shift over time to detect sharp money movement and public betting patterns that affect value.",
  },
];

const analysisProcess = [
  {
    step: "01",
    title: "Data Collection",
    description: "Our system aggregates data from multiple sources — odds APIs, injury feeds, weather services, and historical databases — into a unified dataset for each game.",
    icon: Database,
  },
  {
    step: "02",
    title: "Feature Engineering",
    description: "Raw data is transformed into meaningful signals: recent form trends, rest days, travel distance, scoring pace, defensive efficiency, and dozens more factors specific to each sport.",
    icon: Cpu,
  },
  {
    step: "03",
    title: "AI Probability Modeling",
    description: "Our AI models process these features to calculate true win probabilities, projected totals, and spread likelihoods — independent of what the sportsbooks say.",
    icon: Brain,
  },
  {
    step: "04",
    title: "Edge Calculation",
    description: "We compare our calculated probabilities against current sportsbook odds. When our model's probability is significantly higher than what the odds imply, that's an edge.",
    icon: Target,
  },
  {
    step: "05",
    title: "Confidence Scoring",
    description: "Each pick receives a confidence score (0-100) based on the size of the edge, model certainty, data quality, and historical accuracy in similar situations.",
    icon: Award,
  },
  {
    step: "06",
    title: "Pick Generation",
    description: "Only picks that meet our quality thresholds are surfaced. Each comes with a full breakdown of reasoning, key factors, and risk level so you can decide for yourself.",
    icon: Sparkles,
  },
];

const sportsCovered = [
  "NFL", "NBA", "MLB", "NHL", "NCAAF", "NCAAB", "Soccer (EPL, La Liga, MLS)", "UFC/MMA", "Tennis", "Golf"
];

const betTypes = [
  { name: "Moneyline", description: "Straight win/loss predictions with edge-based confidence" },
  { name: "Spreads", description: "Point spread analysis factoring in margin tendencies" },
  { name: "Over/Under", description: "Total score projections using pace and defensive metrics" },
  { name: "Player Props", description: "Individual player performance predictions" },
  { name: "Parlays", description: "Multi-leg combinations with combined probability analysis" },
];

const HowItWorks = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="How ThinkBetAI Works: Models, Odds & Risk"
        description="See how ThinkBetAI organizes sports data, creates probability estimates, compares implied odds and explains matchup factors and uncertainty."
        keywords="how ThinkBetAI works, AI sports betting explained, AI picks process, sports betting AI tool"
        url="https://thinkbetai.com/how-it-works"
      />

      <Header />

      <main className="container mx-auto px-4 py-12 max-w-5xl">
        <Breadcrumb
          items={[{ label: 'How It Works' }]}
          className="mb-8"
        />

        {/* Hero */}
        <header className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            How ThinkBetAI Works
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            From sign-up to smarter bets — here's exactly how our AI analyzes games and helps you make data-driven decisions.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 mt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4 text-primary" />
              Real-time updates
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4 text-primary" />
              10+ sports covered
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Target className="h-4 w-4 text-primary" />
              Edge-based picks
            </div>
          </div>
        </header>

        {/* Step-by-step user journey */}
        <section className="mb-20">
          <h2 className="text-2xl font-semibold mb-2 text-center">Your Journey</h2>
          <p className="text-muted-foreground text-center max-w-xl mx-auto mb-8">
            Six steps from creating an account to reviewing analysis and tracking results.
          </p>
          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-px bg-border hidden md:block" />
            <div className="space-y-8">
              {steps.map((step, i) => (
                <div key={i} className="relative flex gap-6 items-start group">
                  <div className="relative z-10 flex-shrink-0 h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <step.icon className="h-6 w-6" />
                  </div>
                  <div className="glass-card p-5 flex-1 border border-border/50 hover:border-primary/30 transition-colors">
                    <h3 className="text-lg font-semibold mb-1">{step.title}</h3>
                    <p className="text-muted-foreground leading-relaxed mb-2">{step.description}</p>
                    <p className="text-sm text-muted-foreground/70 flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                      {step.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Deep Dive: The Analysis Pipeline */}
        <section className="mb-20">
          <h2 className="text-2xl font-semibold mb-2 text-center">The Analysis Pipeline</h2>
          <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-10">
            Every game goes through a six-stage AI pipeline before a pick is ever shown to you. Here's what happens behind the scenes.
          </p>
          <div className="space-y-6">
            {analysisProcess.map((item, i) => (
              <div key={i} className="group flex gap-5 items-start">
                <div className="flex-shrink-0 flex flex-col items-center">
                  <span className="text-xs font-bold text-primary/60 mb-1">{item.step}</span>
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
                    <item.icon className="h-5 w-5" />
                  </div>
                  {i < analysisProcess.length - 1 && (
                    <div className="w-px h-6 bg-border mt-1" />
                  )}
                </div>
                <div className="pt-1">
                  <h3 className="font-semibold mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Data Sources */}
        <section className="mb-20">
          <h2 className="text-2xl font-semibold mb-2 text-center">Where Our Data Comes From</h2>
          <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-8">
            Good AI starts with good data. We aggregate from multiple sources to give our models the most complete picture possible.
          </p>
          <div className="grid sm:grid-cols-2 gap-6">
            {dataSources.map((source, i) => (
              <div
                key={i}
                className="group relative overflow-hidden rounded-2xl bg-card/50 border border-border/50 p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-lg"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 text-primary">
                    <source.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{source.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{source.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* AI Methodology */}
        <section className="mb-20">
          <h2 className="text-2xl font-semibold mb-3 text-center">Under the Hood: Our AI</h2>
          <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-8">
            Here's what happens behind the scenes every time you open a game on ThinkBetAI.
          </p>
          <div className="grid sm:grid-cols-2 gap-6">
            {aiFeatures.map((feat, i) => (
              <div
                key={i}
                className="group relative overflow-hidden rounded-2xl bg-card/50 border border-border/50 p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-lg"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 text-primary">
                    <feat.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{feat.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feat.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Sports & Bet Types */}
        <section className="mb-20">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Sports Covered */}
            <div className="glass-card p-6 border border-border/50">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Sports We Cover
              </h2>
              <div className="flex flex-wrap gap-2">
                {sportsCovered.map((sport) => (
                  <span
                    key={sport}
                    className="px-3 py-1.5 rounded-full text-sm font-medium bg-primary/10 text-primary border border-primary/20"
                  >
                    {sport}
                  </span>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                New sports and leagues are added regularly based on data availability and user demand.
              </p>
            </div>

            {/* Bet Types */}
            <div className="glass-card p-6 border border-border/50">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Bet Types Analyzed
              </h2>
              <div className="space-y-3">
                {betTypes.map((bet) => (
                  <div key={bet.name} className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                    <div>
                      <span className="font-medium text-sm">{bet.name}</span>
                      <p className="text-xs text-muted-foreground">{bet.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* FAQ-style Q&A */}
        <section className="mb-20">
          <h2 className="text-2xl font-semibold mb-8 text-center">Common Questions</h2>
          <div className="space-y-4">
            {[
              {
                q: "How accurate is the AI?",
                a: "Our AI tracks qualified accuracy — picks that meet minimum confidence and edge thresholds. Performance varies by sport and bet type. You can view our live accuracy metrics on the dashboard.",
              },
              {
                q: "How often are picks updated?",
                a: "Picks are generated in real-time when you view a game. Odds and analysis refresh every few minutes to reflect the latest lines, injury news, and market movement.",
              },
              {
                q: "Can the AI guarantee wins?",
                a: "No. No AI or system can guarantee sports betting outcomes. Our tool provides data-driven analysis to help you make more informed decisions, but sports are inherently unpredictable.",
              },
              {
                q: "What makes ThinkBetAI different from other tools?",
                a: "We combine real-time odds, AI-powered analysis, a conversational AI chat, and an integrated parlay builder in one platform — so you get everything in one place instead of juggling multiple tools.",
              },
              {
                q: "Do I need to be an experienced bettor?",
                a: "Not at all. Our analysis includes plain-language explanations, confidence scores, and risk ratings that make it easy for beginners to understand while still being valuable for experienced bettors.",
              },
            ].map((item, i) => (
              <div key={i} className="glass-card p-5 border border-border/50">
                <h3 className="font-semibold mb-2 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-1 text-primary flex-shrink-0" />
                  {item.q}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed pl-6">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Disclaimer */}
        <section className="glass-card p-6 border-l-4 border-destructive/60 mb-12">
          <p className="text-sm text-muted-foreground leading-relaxed">
            <strong>Disclaimer:</strong> AI analysis is a decision-support tool, not a guarantee of profit. Sports outcomes are inherently unpredictable. Always bet responsibly and within your means.
          </p>
        </section>

        {/* CTA */}
        <div className="text-center">
          <Button size="lg" asChild>
            <Link to="/games" className="flex items-center gap-2">
              Start Exploring Games
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default HowItWorks;
