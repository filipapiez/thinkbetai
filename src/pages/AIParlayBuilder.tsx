import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Layers, 
  CheckCircle, 
  TrendingUp, 
  Zap,
  ArrowRight,
  Target,
  Calculator,
  Shield,
  Sparkles
} from 'lucide-react';

const AIParlayBuilder = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "ThinkBetAI Parlay Builder",
    "applicationCategory": "SportsApplication",
    "description": "AI-powered parlay builder that analyzes correlations, calculates true odds, and optimizes multi-leg bets for maximum value.",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "450"
    }
  };

  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is an AI parlay builder?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "An AI parlay builder uses machine learning to analyze multi-leg bets, identify correlations between picks, calculate true win probabilities, and optimize parlays for maximum expected value."
        }
      },
      {
        "@type": "Question",
        "name": "How does AI improve parlay betting?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "AI analyzes correlations that sportsbooks don't always price correctly. For example, if a game goes over the total, certain player props become more likely. AI finds these edges and builds smarter parlays."
        }
      },
      {
        "@type": "Question",
        "name": "What's the optimal number of legs for a parlay?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "AI analysis shows 2-3 leg parlays offer the best balance of payout and probability. Longer parlays have higher payouts but exponentially lower win rates. Focus on quality over quantity."
        }
      }
    ]
  };

  const parlayFeatures = [
    { icon: Layers, title: 'Smart Combinations', description: 'AI identifies correlated picks that boost win probability' },
    { icon: Calculator, title: 'True Odds Calculator', description: 'See real probabilities vs. sportsbook odds' },
    { icon: Target, title: 'Confidence Scoring', description: 'Each parlay rated by AI confidence level' },
    { icon: Shield, title: 'Risk Analysis', description: 'Understand variance and expected outcomes' },
    { icon: TrendingUp, title: 'Edge Detection', description: 'Find parlays where you have mathematical advantage' },
    { icon: Sparkles, title: 'One-Click Build', description: 'AI suggests optimal parlays automatically' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="AI Parlay Builder - Smart Multi-Leg Bet Optimizer"
        description="Build smarter parlays with AI. Our parlay builder analyzes correlations, calculates true odds, and finds multi-leg betting opportunities with real edge."
        keywords="AI parlay builder, parlay optimizer, smart parlay, AI parlay picks, parlay calculator, correlated parlay, same game parlay AI"
        url="/ai-parlay-builder"
        type="article"
      />
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(faqData)}
        </script>
      </Helmet>
      
      <Header />
      
      <main className="flex-1">
        <div className="container py-8 max-w-4xl">
          <Breadcrumb 
            items={[{ label: 'AI Parlay Builder' }]} 
            className="mb-8"
          />

          {/* Hero */}
          <header className="text-center mb-12">
            <Badge className="mb-4 bg-accent/20 text-accent border-accent/30">
              <Layers className="h-3 w-3 mr-1" />
              Advanced Tool
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
              AI Parlay <span className="text-gradient">Builder</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Stop guessing on parlays. Our AI analyzes leg correlations, calculates true win probabilities, 
              and builds optimized multi-leg bets with real mathematical edge.
            </p>
            <Button size="lg" asChild>
              <Link to="/parlays">
                <Layers className="h-5 w-5 mr-2" />
                Build AI Parlay
                <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
            </Button>
          </header>

          {/* Features Grid */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-center">
              AI Parlay Builder Features
            </h2>
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

          {/* Content */}
          <article className="prose prose-lg dark:prose-invert max-w-none mb-12">
            <h2>How the AI Parlay Builder Works</h2>
            <p>
              Building winning parlays requires understanding correlations between outcomes. 
              Our AI does this automatically:
            </p>
            <ol>
              <li><strong>Select your legs:</strong> Add picks from any sport or game</li>
              <li><strong>AI analyzes correlations:</strong> See how picks affect each other's probability</li>
              <li><strong>Review true odds:</strong> Compare calculated probability vs. payout odds</li>
              <li><strong>Optimize:</strong> AI suggests additions or removals to improve value</li>
            </ol>

            <h2>What Makes a Good Parlay?</h2>
            <p>
              The best parlays aren't random combinations of favorites. AI identifies:
            </p>
            <ul>
              <li><strong>Positive correlations:</strong> Picks that are more likely to hit together</li>
              <li><strong>Value discrepancies:</strong> Where sportsbook odds are mispriced</li>
              <li><strong>Optimal leg count:</strong> Usually 2-3 legs for best risk/reward</li>
              <li><strong>Bankroll sizing:</strong> How much to wager based on edge and variance</li>
            </ul>

            <h2>Same Game Parlay Analysis</h2>
            <p>
              Same game parlays (SGPs) are particularly suited for AI analysis because outcomes 
              are highly correlated. For example:
            </p>
            <ul>
              <li>If the over hits, specific players are more likely to have big games</li>
              <li>If a team covers the spread, their players hit performance props more often</li>
              <li>First basket/TD scorers correlate with game flow predictions</li>
            </ul>

            <h2>Parlay Betting Strategy</h2>
            <h3>The 2-3 Leg Sweet Spot</h3>
            <p>
              Data shows that 2-3 leg parlays offer the optimal balance of payout and hit rate. 
              4+ leg parlays sound exciting but have exponentially lower win probabilities.
            </p>

            <h3>Focus on Correlated Outcomes</h3>
            <p>
              Random 3-leg parlays have roughly 12.5% expected win rate (0.5³). But correlated 
              parlays can reach 20-25% hit rates because outcomes aren't independent.
            </p>

            <h3>Bankroll Management</h3>
            <p>
              Even with AI optimization, parlays are high-variance bets. Limit parlay wagers to 
              1-2% of your bankroll and don't chase losses with bigger parlays.
            </p>
          </article>

          {/* CTA */}
          <div className="text-center py-12 px-6 rounded-2xl bg-gradient-to-br from-accent/10 to-primary/10 border border-accent/20">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Build Your First AI Parlay
            </h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              Let AI find the correlations and value in your multi-leg bets.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link to="/parlays">
                  <Layers className="h-4 w-4 mr-2" />
                  Open Parlay Builder
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/blog/parlay-betting-ai-strategies">Parlay Strategies Guide</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AIParlayBuilder;
