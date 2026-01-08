import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { FeatureCard } from '@/components/FeatureCard';
import { LiveDataBanner } from '@/components/LiveDataBanner';
import { useOddsAPI } from '@/hooks/useOddsAPI';
import { platformStats } from '@/lib/mockData';
import { 
  Search, 
  TrendingUp, 
  UserX, 
  History, 
  Gauge, 
  Shield,
  ArrowRight,
  BarChart3,
  Trophy,
  Target,
  Zap,
  CheckCircle2,
  Star
} from 'lucide-react';

const Index = () => {
  // Fetch live data status
  const { 
    games: liveGames, 
    isLoading, 
    error, 
    lastUpdated,
    remainingRequests,
    refetch 
  } = useOddsAPI('nba');

  const hasLiveData = liveGames.length > 0 && !error;

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

  const stats = [
    { value: `${platformStats.qualifiedWinRate}%`, label: 'Win Rate', sublabel: 'on qualified picks' },
    { value: `${platformStats.totalQualified}+`, label: 'Picks Analyzed', sublabel: 'this season' },
    { value: `${platformStats.streakCurrent}`, label: 'Current Streak', sublabel: 'consecutive wins' },
    { value: '10+', label: 'Sports Covered', sublabel: 'major leagues' },
  ];

  const testimonials = [
    {
      quote: "Finally, a tool that explains odds in a way I can actually understand. The injury context is invaluable.",
      author: "Mike R.",
      role: "Sports Enthusiast",
      rating: 5
    },
    {
      quote: "The risk meter saved me from so many bad bets. I only take GOOD signals now and my bankroll thanks me.",
      author: "Sarah K.",
      role: "Casual Bettor",
      rating: 5
    },
    {
      quote: "I used to bet blind. Now I actually understand why lines move and what injuries really mean for a game.",
      author: "James T.",
      role: "Fantasy Player",
      rating: 5
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <LiveDataBanner 
        isLive={hasLiveData}
        lastUpdated={lastUpdated}
        remainingRequests={remainingRequests}
        isLoading={isLoading}
        onRefresh={refetch}
        error={error}
      />
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
                <Trophy className="h-4 w-4" />
                {platformStats.qualifiedWinRate}% Win Rate on Qualified Picks
              </div>

              {/* Headline */}
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 animate-slide-up">
                Stop Gambling.{' '}
                <span className="text-gradient">Start Winning.</span>
              </h1>

              {/* Subheadline */}
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '100ms' }}>
                Our AI analyzes odds, injuries, and matchup data to identify high-confidence betting opportunities. 
                Join thousands who turned their betting from a gamble into a strategy.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: '200ms' }}>
                <Button variant="hero" size="xl" asChild>
                  <Link to="/games">
                    <Search className="h-5 w-5 mr-2" />
                    Find Winning Picks
                  </Link>
                </Button>
                <Button variant="glass" size="xl" asChild>
                  <Link to="/pricing">
                    View Pricing
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Link>
                </Button>
              </div>

              {/* Disclaimer */}
              <p className="mt-8 text-xs text-muted-foreground flex items-center justify-center gap-2 animate-fade-in" style={{ animationDelay: '400ms' }}>
                <Shield className="h-3 w-3" />
                Educational tool only. Past performance doesn't guarantee future results.
              </p>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 border-t border-b border-border/40 bg-card/30">
          <div className="container">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={stat.label} className="text-center animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
                  <div className="text-3xl md:text-4xl font-bold text-primary mb-1">{stat.value}</div>
                  <div className="text-sm font-medium text-foreground">{stat.label}</div>
                  <div className="text-xs text-muted-foreground">{stat.sublabel}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Social Proof Banner */}
        <section className="py-8 bg-primary/5">
          <div className="container">
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>5,000+ Active Users</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>$2.4M+ in Tracked Wins</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>4.9★ User Rating</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 md:py-24 border-t border-border/40">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                Everything You Need to Bet Smarter
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Powered by AI that analyzes millions of data points to give you an edge.
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

        {/* Win Rate Breakdown */}
        <section className="py-16 md:py-24 bg-card/30 border-t border-border/40">
          <div className="container">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
                <Target className="h-3 w-3" />
                Verified Performance
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                Our Picks Win. Here's The Proof.
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                We only recommend "GOOD" signal bets with high confidence. Here's how our qualified picks perform by sport.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 max-w-6xl mx-auto">
              {platformStats.sportBreakdown.map((sport, index) => (
                <div 
                  key={sport.sport} 
                  className="bg-background/50 border border-border/40 rounded-xl p-4 text-center hover:border-primary/40 transition-colors animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="text-2xl font-bold text-primary mb-1">{sport.winRate}%</div>
                  <div className="text-sm font-medium">{sport.sport}</div>
                  <div className="text-xs text-muted-foreground">{sport.wins}/{sport.qualified} wins</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 md:py-24 border-t border-border/40">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                Start Winning in 3 Simple Steps
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                No complicated setup. Just pure, data-driven betting intelligence.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {[
                {
                  step: '01',
                  icon: Search,
                  title: 'Find a Game',
                  description: 'Browse upcoming matchups or search for your favorite teams.',
                },
                {
                  step: '02',
                  icon: BarChart3,
                  title: 'See the Signal',
                  description: 'Our AI shows you GOOD, BORDERLINE, or PASS signals with full reasoning.',
                },
                {
                  step: '03',
                  icon: Trophy,
                  title: 'Win More Bets',
                  description: 'Follow GOOD signals and watch your win rate climb.',
                },
              ].map((item, index) => (
                <div key={item.step} className="relative text-center animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-4">
                    <item.icon className="h-8 w-8" />
                  </div>
                  <div className="text-xs font-bold text-primary/60 mb-2">STEP {item.step}</div>
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <Button variant="hero" size="lg" asChild>
                <Link to="/games">
                  Start Finding Winners
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16 md:py-24 bg-card/30 border-t border-border/40">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                Trusted by Smart Bettors
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                See what our users say about transforming their betting strategy.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {testimonials.map((testimonial, index) => (
                <div 
                  key={testimonial.author} 
                  className="bg-background/50 border border-border/40 rounded-xl p-6 animate-slide-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-sm text-foreground mb-4">"{testimonial.quote}"</p>
                  <div>
                    <div className="font-medium text-sm">{testimonial.author}</div>
                    <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 md:py-28 border-t border-border/40">
          <div className="container">
            <div className="max-w-2xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6">
                <Zap className="h-3 w-3" />
                Limited Time Offer
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Start Winning?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Join thousands of smart bettors who trust ThinkBetAI for data-driven picks. 
                Start your free trial today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="hero" size="xl" asChild>
                  <Link to="/pricing">
                    Start Free Trial
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Link>
                </Button>
                <Button variant="glass" size="xl" asChild>
                  <Link to="/games">
                    Browse Games
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
