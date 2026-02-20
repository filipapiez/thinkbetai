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
  Sparkles, 
  CheckCircle, 
  TrendingUp, 
  Zap,
  ArrowRight,
  Gift,
  Clock,
  Target,
  BarChart3
} from 'lucide-react';

const FreeAIPredictions = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Free AI Sports Predictions - Get AI Betting Picks Today",
    "description": "Get free AI sports predictions for NFL, NBA, MLB, NHL, and UFC. Try AI betting picks with no signup required.",
    "author": {
      "@type": "Organization",
      "name": "ThinkBetAI"
    },
    "publisher": {
      "@type": "Organization",
      "name": "ThinkBetAI",
      "logo": {
        "@type": "ImageObject",
        "url": "https://thinkbetai.com/thinkbetai-logo.png"
      }
    },
    "datePublished": "2026-02-09",
    "dateModified": "2026-02-09"
  };

  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Are there really free AI sports predictions?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, ThinkBetAI offers free AI sports predictions with limited daily picks. You can view AI analysis for select games without signing up or paying."
        }
      },
      {
        "@type": "Question",
        "name": "How accurate are free AI predictions?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "ThinkBetAI's free predictions use the same AI models as premium picks, achieving 82%+ accuracy on qualified bets across NFL, NBA, and other major sports."
        }
      },
      {
        "@type": "Question",
        "name": "What sports have free AI predictions?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Free AI predictions are available for NFL, NBA, MLB, NHL, UFC, and major soccer leagues. Premium plans unlock all 15+ sports and unlimited picks."
        }
      }
    ]
  };

  const freeBenefits = [
    { icon: Gift, title: 'No Credit Card', description: 'Access free picks without payment info' },
    { icon: Target, title: 'Same AI Accuracy', description: 'Free picks use our 82%+ accurate models' },
    { icon: Clock, title: 'Daily Updates', description: 'Fresh predictions every day' },
    { icon: BarChart3, title: 'Full Analysis', description: 'See why AI recommends each pick' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="Free AI Sports Predictions - Get AI Betting Picks Today"
        description="Get free AI sports predictions for NFL, NBA, MLB, NHL, and UFC. Try AI betting picks with 82%+ accuracy - no signup required."
        keywords="free AI predictions, free AI sports picks, free AI betting, AI predictions free, free sports betting AI"
        url="/free-ai-predictions"
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
            items={[{ label: 'Free AI Predictions' }]} 
            className="mb-8"
          />

          {/* Hero */}
          <header className="text-center mb-12">
            <Badge className="mb-4 bg-success/20 text-success border-success/30">
              <Gift className="h-3 w-3 mr-1" />
              100% Free
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
              Free AI Sports <span className="text-gradient">Predictions</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              <Link to="/login?tab=signup" className="text-primary hover:underline font-medium">Get AI picks today</Link> without paying a dime. Our machine learning models 
              analyze thousands of data points to find winning picks.
            </p>
            <Button size="lg" asChild>
              <Link to="/games">
                <Sparkles className="h-5 w-5 mr-2" />
                Get Free Picks Now
                <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
            </Button>
          </header>

          {/* Benefits Grid */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-center">
              What's Included Free
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {freeBenefits.map((benefit, index) => (
                <Card key={index} className="hover:border-primary/50 transition-colors">
                  <CardContent className="p-6 flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-success/10">
                      <benefit.icon className="h-6 w-6 text-success" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{benefit.title}</h3>
                      <p className="text-sm text-muted-foreground">{benefit.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Content */}
          <article className="prose prose-lg dark:prose-invert max-w-none mb-12">
            <h2>How to Get Free AI Sports Predictions</h2>
            <p>
              Getting free AI predictions from ThinkBetAI is simple:
            </p>
            <ol>
              <li><strong>Visit the Games page</strong> - Browse today's matchups across all sports</li>
              <li><strong>View AI Analysis</strong> - Each game shows AI confidence scores and key factors</li>
              <li><strong>Check Free Picks</strong> - Select games are marked as free daily picks</li>
              <li><strong>Make Your Decision</strong> - Use our analysis to inform your betting choices</li>
            </ol>

            <h2>Sports Covered by Free AI Predictions</h2>
            <p>Our free tier includes AI predictions for the most popular sports:</p>
            <ul>
              <li><strong>NFL Football</strong> - Weekly game predictions and player props</li>
              <li><strong>NBA Basketball</strong> - Daily picks for spreads and totals</li>
              <li><strong>MLB Baseball</strong> - Moneyline and run line analysis</li>
              <li><strong>NHL Hockey</strong> - Puck line and total predictions</li>
              <li><strong>UFC/MMA</strong> - Fight outcome probabilities</li>
              <li><strong>Soccer</strong> - Premier League, La Liga, and more</li>
            </ul>

            <h2>Why Our Free Predictions Are Different</h2>
            <p>
              Unlike other "free picks" sites that show random selections, our <Link to="/ai-sports-betting" className="text-primary hover:underline font-medium">AI sports betting platform</Link> uses the 
              <strong> same AI models</strong> for free and premium predictions. The only difference 
              is volume—free users get limited daily picks while premium members get unlimited access. You can also use our <Link to="/ai-bet-analyzer" className="text-primary hover:underline font-medium">AI bet analyzer</Link> to evaluate any wager.
            </p>

            <h2>Ready for More?</h2>
            <p>
              If you like our free AI predictions, premium plans start at just $4.99/month and include:
            </p>
            <ul>
              <li>Unlimited AI predictions across all 15+ sports</li>
              <li>Real-time odds updates from 20+ sportsbooks</li>
              <li>AI Parlay Builder with correlation analysis</li>
              <li>Injury reports and line movement alerts</li>
              <li>Priority customer support</li>
            </ul>
          </article>

          {/* CTA */}
          <div className="text-center py-12 px-6 rounded-2xl bg-gradient-to-br from-success/10 to-primary/10 border border-success/20">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Start Getting Free AI Predictions
            </h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              No signup required. Just visit the Games page and start using AI-powered analysis today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link to="/games">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  View Free Picks
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/pricing">
                  <Zap className="h-4 w-4 mr-2" />
                  Unlock Unlimited
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FreeAIPredictions;
