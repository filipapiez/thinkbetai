import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { FeatureCard } from '@/components/FeatureCard';
import { MockDataBanner } from '@/components/MockDataBanner';
import { 
  Search, 
  TrendingUp, 
  UserX, 
  History, 
  Gauge, 
  Shield,
  ArrowRight,
  BarChart3
} from 'lucide-react';

const Index = () => {
  const features = [
    {
      icon: TrendingUp,
      title: 'Odds Explained',
      description: 'Understand what the numbers mean with implied probability breakdowns and line movement tracking.',
    },
    {
      icon: UserX,
      title: 'Injury Context',
      description: 'See key injuries, status updates, and how absences might impact game dynamics.',
    },
    {
      icon: History,
      title: 'Historical Trends',
      description: 'Review recent form, head-to-head records, and home/away performance patterns.',
    },
    {
      icon: Gauge,
      title: 'Risk Meter',
      description: 'Visual volatility assessment based on injuries, line movement, and recent performance.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <MockDataBanner />
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 md:py-32">
          {/* Background Effects */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-accent/10 rounded-full blur-3xl" />
          </div>

          <div className="container relative">
            <div className="max-w-3xl mx-auto text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6 animate-fade-in">
                <BarChart3 className="h-4 w-4" />
                Sports Analytics Platform
              </div>

              {/* Headline */}
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 animate-slide-up">
                Understand Odds,{' '}
                <span className="text-gradient">Not Gamble Blind</span>
              </h1>

              {/* Subheadline */}
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '100ms' }}>
                Educational insights into betting odds, injuries, and matchup context. 
                Make informed decisions with data, not hunches.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: '200ms' }}>
                <Button variant="hero" size="xl" asChild>
                  <Link to="/games">
                    <Search className="h-5 w-5 mr-2" />
                    Search a Game
                  </Link>
                </Button>
                <Button variant="glass" size="xl" asChild>
                  <Link to="/games">
                    Learn How It Works
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Link>
                </Button>
              </div>

              {/* Disclaimer */}
              <p className="mt-8 text-xs text-muted-foreground flex items-center justify-center gap-2 animate-fade-in" style={{ animationDelay: '400ms' }}>
                <Shield className="h-3 w-3" />
                Educational tool only. No betting advice. No guarantees.
              </p>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 md:py-24 border-t border-border/40">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                Data-Driven Insights
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Everything you need to understand a matchup, all in one place.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <FeatureCard
                  key={feature.title}
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                  delay={index * 100}
                />
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 md:py-24 bg-card/30 border-t border-border/40">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                How It Works
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Three simple steps to better understand any matchup.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {[
                {
                  step: '01',
                  title: 'Search a Game',
                  description: 'Find any upcoming matchup by team name or browse scheduled games.',
                },
                {
                  step: '02',
                  title: 'Review the Data',
                  description: 'See odds, injuries, recent form, and head-to-head history in one view.',
                },
                {
                  step: '03',
                  title: 'Understand the Context',
                  description: 'Get AI-powered explanations and risk assessments based on the data.',
                },
              ].map((item, index) => (
                <div key={item.step} className="relative text-center animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
                  <div className="text-5xl font-bold text-primary/20 mb-4">{item.step}</div>
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <Button variant="hero" size="lg" asChild>
                <Link to="/games">
                  Get Started
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
