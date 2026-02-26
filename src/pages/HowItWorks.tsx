import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Button } from '@/components/ui/button';
import { 
  UserPlus, Search, Brain, BarChart3, Layers, 
  MessageCircle, ArrowRight, Database, Zap, Shield,
  CheckCircle2
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
    description: "View all upcoming games across NFL, NBA, MLB, NHL, soccer, and more. Each game card shows key matchup info at a glance.",
    detail: "Games are pulled from live odds feeds so you always see the latest lines and spreads.",
  },
  {
    icon: Brain,
    title: "3. Get AI Analysis",
    description: "Click into any game to see our AI's full breakdown — win probability, recommended pick, confidence score, and edge rating.",
    detail: "The AI evaluates historical performance, recent form, injuries, weather, and line movement.",
  },
  {
    icon: Layers,
    title: "4. Build Parlays",
    description: "Combine multiple picks into parlays. Our AI calculates combined probability and flags risky legs so you can adjust.",
    detail: "Save parlays to your account and track their outcomes over time.",
  },
  {
    icon: MessageCircle,
    title: "5. Ask the AI Anything",
    description: "Use the AI chat to ask questions like 'Who should I bet on tonight?' or 'What's the best over/under in the NBA today?'",
    detail: "The chat has full context on today's games, odds, and historical trends.",
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
    description: "We pull live odds, injury reports, and box scores from multiple data providers every few minutes.",
  },
  {
    icon: Brain,
    title: "Machine Learning Models",
    description: "Our models analyze thousands of variables — team stats, player matchups, travel fatigue, weather — to generate probability estimates.",
  },
  {
    icon: Zap,
    title: "Edge Detection",
    description: "We compare our calculated probabilities against bookmaker lines to surface picks where the AI sees the most value.",
  },
  {
    icon: Shield,
    title: "Risk Assessment",
    description: "Every pick comes with a confidence score and risk meter so you can make informed decisions about how much to wager.",
  },
];

const HowItWorks = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="How ThinkBetAI Works – AI Sports Betting Explained"
        description="Learn how ThinkBetAI uses AI and machine learning to analyze games, generate picks, and help you build smarter parlays across every major sport."
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
        </header>

        {/* Step-by-step user journey */}
        <section className="mb-20">
          <h2 className="text-2xl font-semibold mb-8 text-center">Your Journey</h2>
          <div className="relative">
            {/* Vertical connector line */}
            <div className="absolute left-6 top-0 bottom-0 w-px bg-border hidden md:block" />

            <div className="space-y-8">
              {steps.map((step, i) => (
                <div key={i} className="relative flex gap-6 items-start group">
                  {/* Icon circle */}
                  <div className="relative z-10 flex-shrink-0 h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <step.icon className="h-6 w-6" />
                  </div>

                  {/* Content */}
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
