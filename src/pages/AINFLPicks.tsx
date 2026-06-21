import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Trophy, 
  CheckCircle, 
  TrendingUp, 
  Zap,
  ArrowRight,
  Target,
  BarChart3,
  Clock,
  Shield
} from 'lucide-react';

const AINFLPicks = () => {
  const structuredData = {
    "@type": "Article",
    "headline": "AI NFL Picks and Football Predictions",
    "description": "Review AI NFL picks with matchup data, probability estimates and risk context for moneylines, spreads, totals and player props.",
    "author": {
      "@type": "Organization",
      "name": "ThinkBetAI"
    },
    "publisher": {
      "@type": "Organization",
      "name": "ThinkBetAI",
      "logo": {
        "@type": "ImageObject",
        "url": "https://thinkbetai.com/thinkbetai-logo-v2.png"
      }
    },
    "datePublished": "2026-02-09",
    "dateModified": "2026-02-09"
  };

  const faqData = {
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How accurate are AI NFL picks?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Accuracy varies by market, price, sample and time period. NFL analysis should be reviewed with the current injury report, weather, market price and stated uncertainty."
        }
      },
      {
        "@type": "Question",
        "name": "What NFL bets does AI analyze?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Our AI NFL predictions cover point spreads, moneylines, totals (over/under), player props, first half lines, and teaser opportunities across all NFL games."
        }
      },
      {
        "@type": "Question",
        "name": "When are NFL AI picks released?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "AI NFL picks are released by Tuesday for the upcoming week and updated continuously as new information (injuries, weather, line movements) becomes available."
        }
      }
    ]
  };

  const combinedSchema = {
    "@context": "https://schema.org",
    "@graph": [structuredData, faqData],
  };

  const nflFeatures = [
    { icon: Target, title: 'Spread Analysis', description: 'AI-powered point spread predictions' },
    { icon: BarChart3, title: 'Totals Picks', description: 'Over/under predictions with confidence scores' },
    { icon: Trophy, title: 'Player Props', description: 'Yards, TDs, and performance props' },
    { icon: Clock, title: 'Weekly Updates', description: 'Picks updated as news breaks' },
    { icon: Shield, title: 'Weather Impact', description: 'Wind, rain, and temperature analysis' },
    { icon: TrendingUp, title: 'Probability Context', description: 'Compare model estimates with market prices' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="AI NFL Picks & Football Predictions"
        description="Review AI NFL picks with matchup data, probability estimates and risk context for moneylines, spreads, totals and player props."
        keywords="AI NFL picks, NFL AI predictions, AI football picks, NFL betting AI, AI NFL spreads, NFL picks today, AI NFL props"
        url="/ai-nfl-picks"
        type="article"
        structuredData={combinedSchema}
      />
      
      <Header />
      
      <main className="flex-1">
        <div className="container py-8 max-w-4xl">
          <Breadcrumb 
            items={[{ label: 'AI NFL Picks' }]} 
            className="mb-8"
          />

          {/* Hero */}
          <header className="text-center mb-12">
            <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
              🏈 NFL Season
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
              AI NFL Picks <span className="text-gradient">Today</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              <Link to="/login?tab=signup" className="text-primary hover:underline font-medium">Test AI predictions</Link> for every NFL game. Our machine learning models analyze 
              team performance, injuries, weather, and market context to estimate possible outcomes.
            </p>
            <Button size="lg" asChild>
              <Link to="/games?sport=americanfootball_nfl">
                <Zap className="h-5 w-5 mr-2" />
                View NFL Picks
                <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
            </Button>
          </header>

          {/* Features Grid */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-center">
              What Our AI Analyzes for NFL
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {nflFeatures.map((feature, index) => (
                <Card key={index} className="hover:border-primary/50 transition-colors">
                  <CardContent className="p-6">
                    <feature.icon className="h-8 w-8 text-primary mb-3" />
                    <h3 className="font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Content */}
          <article className="prose prose-lg dark:prose-invert max-w-none mb-12">
            <h2>How AI NFL Picks Work</h2>
            <p>
              Our NFL AI analyzes dozens of factors for each game to generate predictions:
            </p>
            <ul>
              <li><strong>Team Performance:</strong> Offensive/defensive efficiency, EPA, success rates</li>
              <li><strong>Injury Reports:</strong> Real-time injury updates and their impact on spreads</li>
              <li><strong>Weather Data:</strong> Wind, precipitation, and temperature effects on scoring</li>
              <li><strong>Historical Trends:</strong> Head-to-head records, home/away splits, divisional patterns</li>
              <li><strong>Betting Market:</strong> Line movements, sharp money, and public betting %</li>
            </ul>

            <h2>NFL Bet Types Covered</h2>
            <h3>Point Spreads</h3>
            <p>
              Our AI excels at NFL spread predictions by analyzing scoring differentials, 
              home field advantage, and situational factors like short weeks and travel.
            </p>

            <h3>Totals (Over/Under)</h3>
            <p>
              Game pace, defensive matchups, and weather conditions are weighted to predict 
              total points with an explicit probability and uncertainty range.
            </p>

            <h3>Player Props</h3>
            <p>
              QB passing yards, RB rushing attempts, and WR/TE receiving props are analyzed 
              using matchup-specific data and game script predictions.
            </p>

            <h2>Weekly NFL AI Workflow</h2>
            <ol>
              <li><strong>Tuesday:</strong> Initial picks released after injury reports</li>
              <li><strong>Wednesday-Friday:</strong> Updates as practice reports come out</li>
              <li><strong>Saturday:</strong> Final weather and inactive projections</li>
              <li><strong>Sunday:</strong> Last-minute adjustments before kickoff</li>
            </ol>

            <h2>Why Trust AI for NFL Picks?</h2>
            <p>
              NFL betting is notoriously difficult due to small sample sizes (17 games per team). 
              Our <Link to="/ai-sports-betting" className="text-primary hover:underline font-medium">AI sports betting platform</Link> helps by:
            </p>
            <ul>
              <li>Processing more data than any human analyst — a key advantage of <Link to="/ai-sports-betting" className="text-primary hover:underline font-medium">AI betting vs human betting</Link></li>
              <li>Removing emotional bias from predictions</li>
              <li>Using our <Link to="/ai-bet-analyzer" className="text-primary hover:underline font-medium">AI odds analysis</Link> to identify value the market hasn't priced in</li>
              <li>Adjusting in real-time as news breaks</li>
            </ul>
          </article>

          {/* CTA */}
          <div className="text-center py-12 px-6 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Get AI NFL Picks for This Week
            </h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              Review the current NFL slate with model probabilities, matchup context and risk notes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link to="/games?sport=americanfootball_nfl">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  View NFL Games
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/blog/nfl-ai-betting-predictions">NFL Betting Guide</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AINFLPicks;
