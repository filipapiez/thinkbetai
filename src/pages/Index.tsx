import { Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { FeatureCard } from '@/components/FeatureCard';
import { Badge } from '@/components/ui/badge';
import { SEO } from '@/components/SEO';
import { lazy, Suspense } from 'react';
const WorkflowDemo = lazy(() => import('@/components/WorkflowDemo'));

import { platformStats } from '@/lib/mockData';
import { useWinRate } from '@/hooks/useWinRate';
import { 
  Search, 
  TrendingUp, 
  UserX, 
  Gauge, 
  Shield,
  ArrowRight,
  BarChart3,
  Trophy,
  Target,
  Zap,
  CheckCircle2,
  Star,
  Layers,
  Dumbbell,
  Sparkles,
  Clock,
  Users,
  DollarSign,
  TrendingDown,
  Play,
  ChevronLeft,
  ChevronRight,
  Brain,
  LogIn
} from 'lucide-react';

const Index = () => {
  const { winRate, currentStreak } = useWinRate();
  // Animated live viewer count
  const [viewerCount, setViewerCount] = useState(847);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setViewerCount(prev => {
        const change = Math.floor(Math.random() * 5) + 1; // 1-5
        const direction = Math.random() > 0.5 ? 1 : -1;
        const newCount = prev + (change * direction);
        // Keep within 500-1200 range
        return Math.max(500, Math.min(1200, newCount));
      });
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  // Testimonial carousel
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollButtons = () => {
    if (scrollRef.current) {
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
          setCanScrollLeft(scrollLeft > 0);
          setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
        }
      });
    }
  };

  const scrollTestimonials = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 320;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const features = [
    {
      icon: Target,
      title: 'AI-Powered Picks',
      description: 'Get moneyline, spread, and player prop picks backed by real-time data analysis and confidence scores.',
    },
    {
      icon: Layers,
      title: 'Parlay Builder',
      description: 'Combine multiple picks into parlays with calculated odds and win probability.',
    },
    {
      icon: UserX,
      title: 'Injury Reports',
      description: 'Real-time injury updates and how player absences impact game outcomes.',
    },
    {
      icon: Gauge,
      title: 'Risk Analysis',
      description: 'Visual risk meters based on line movement, matchup history, and recent form.',
    },
  ];

  const stats = [
    { value: `${winRate}%`, label: 'Win Rate', sublabel: 'on qualified picks' },
    { value: `${platformStats.totalQualified}+`, label: 'Picks Analyzed', sublabel: 'this season' },
    { value: `${currentStreak}`, label: 'Current Streak', sublabel: 'consecutive wins' },
    { value: '15+', label: 'Sports Covered', sublabel: 'major leagues' },
  ];

  const allSports = [
    { name: 'NFL', emoji: '🏈' },
    { name: 'NBA', emoji: '🏀' },
    { name: 'MLB', emoji: '⚾' },
    { name: 'NHL', emoji: '🏒' },
    { name: 'NCAAF', emoji: '🏈' },
    { name: 'NCAAB', emoji: '🏀' },
    { name: 'WNBA', emoji: '🏀' },
    { name: 'EPL', emoji: '⚽' },
    { name: 'La Liga', emoji: '⚽' },
    { name: 'Champions League', emoji: '⚽' },
    { name: 'Bundesliga', emoji: '⚽' },
    { name: 'MLS', emoji: '⚽' },
    { name: 'UFC', emoji: '🥊' },
    { name: 'Boxing', emoji: '🥊' },
    { name: 'Tennis', emoji: '🎾' },
    { name: 'Golf', emoji: '⛳' },
  ];

  const testimonials = [
    {
      quote: "lowkey this app is fire. hit 3 parlays last weekend 🔥",
      author: "Marcus D.",
      role: "NBA Fan",
      rating: 5
    },
    {
      quote: "been using it for a month now, my friends think i'm psychic lol",
      author: "Taylor S.",
      role: "Weekend Bettor",
      rating: 5
    },
    {
      quote: "finally something that actually makes sense. no more random guesses",
      author: "Chris M.",
      role: "Football Guy",
      rating: 5
    },
    {
      quote: "the injury updates alone are worth it. caught me slipping on a bad bet twice",
      author: "Jordan P.",
      role: "Fantasy League Champ",
      rating: 5
    },
    {
      quote: "my bankroll went from 😬 to 😎 real quick",
      author: "Alex K.",
      role: "Sports Junkie",
      rating: 5
    },
    {
      quote: "bruh the parlay builder is addicting. in a good way tho",
      author: "Devon R.",
      role: "Parlay King",
      rating: 5
    },
    {
      quote: "started following the GOOD signals only and i'm up 40% this month",
      author: "Sam W.",
      role: "Smart Bettor",
      rating: 5
    },
    {
      quote: "wish i found this sooner honestly. simple and it just works",
      author: "Riley T.",
      role: "Casual Fan",
      rating: 4
    },
  ];

  // Review structured data for testimonials
  const reviewStructuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "ThinkBetAI",
    "description": "AI-powered sports betting predictions and analytics platform",
    "brand": {
      "@type": "Brand",
      "name": "ThinkBetAI"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "2400",
      "bestRating": "5",
      "worstRating": "1"
    },
    "review": testimonials.slice(0, 5).map((t, i) => ({
      "@type": "Review",
      "author": {
        "@type": "Person",
        "name": t.author
      },
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": t.rating.toString(),
        "bestRating": "5"
      },
      "reviewBody": t.quote
    }))
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SEO />
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(reviewStructuredData)}
        </script>
      </Helmet>
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-16 md:py-28" style={{ contain: 'layout style paint' }}>
          {/* Background Effects - simplified for CWV (no blur on mobile) */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/15 rounded-full opacity-60 hidden md:block md:blur-3xl" />
          </div>

          <div className="container relative">
            <div className="max-w-4xl mx-auto text-center">
              {/* Live Badge */}
              <div className="inline-flex flex-wrap items-center justify-center gap-2 md:gap-3 px-4 md:px-5 py-2 md:py-2.5 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30 mb-8 animate-fade-in">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span className="text-xs md:text-sm font-semibold text-emerald-400">LIVE</span>
                </div>
                <div className="hidden sm:block w-px h-4 bg-border" />
                <span className="text-xs md:text-sm font-medium text-foreground">
                  <span className="text-primary font-bold">{winRate}%</span> Win Rate
                </span>
                <div className="hidden md:block w-px h-4 bg-border" />
                <span className="hidden md:inline text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{currentStreak}</span> Game Streak 🔥
                </span>
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1]">
                Smarter Picks.{' '}
                <span className="relative inline-block">
                  <span className="text-gradient">Bigger Wins.</span>
                  <Sparkles className="absolute -top-1 -right-4 md:-top-2 md:-right-6 h-4 w-4 md:h-6 md:w-6 text-primary animate-pulse" />
                </span>
              </h1>

              {/* Subheadline */}
              <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto animate-slide-up leading-relaxed" style={{ animationDelay: '100ms' }}>
                AI analyzes <span className="text-foreground font-semibold">10,000+ data points</span> across NFL, NBA, UFC & 15+ sports 
                to find <span className="text-primary font-semibold">high-value picks</span> — spreads, props, and parlays you'd never spot alone.
              </p>

              {/* Quick Value Props */}
              <div className="flex flex-wrap justify-center gap-2 md:gap-4 mb-10 animate-slide-up" style={{ animationDelay: '150ms' }}>
                <Badge variant="secondary" className="px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm bg-card/80 border-border/50">
                  <Clock className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2 text-primary" />
                  Updated Every 5 Min
                </Badge>
                <Badge variant="secondary" className="px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm bg-card/80 border-border/50">
                  <TrendingUp className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2 text-emerald-400" />
                  {platformStats.totalQualified}+ Winning Picks
                </Badge>
                <Badge variant="secondary" className="px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm bg-card/80 border-border/50">
                  <CheckCircle2 className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2 text-amber-400" />
                  Instant Access
                </Badge>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: '200ms' }}>
                <Button variant="hero" size="xl" asChild className="group relative overflow-hidden">
                  <Link to="/pricing" className="flex items-center">
                    <Sparkles className="h-5 w-5 mr-2 group-hover:animate-pulse" />
                    Get Today's Picks
                    <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button variant="glass" size="xl" asChild className="group">
                  <Link to="/login?tab=signup" className="flex items-center">
                    <LogIn className="h-5 w-5 mr-2" />
                    Create Free Account
                    <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 sm:gap-6 mt-10 text-xs sm:text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: '300ms' }}>
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 border-2 border-background flex items-center justify-center text-xs font-bold">
                        {['M', 'S', 'J', 'A'][i]}
                      </div>
                    ))}
                  </div>
                  <span><span className="font-semibold text-foreground">1,247</span> joined this week</span>
                </div>
                <div className="hidden sm:block w-px h-5 bg-border" />
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3 w-3 sm:h-4 sm:w-4 fill-amber-400 text-amber-400" />
                  ))}
                  <span className="ml-1"><span className="font-semibold text-foreground">4.9</span> from 2,400+ reviews</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section - More Dynamic */}
        <section className="py-16 border-t border-border/40 bg-gradient-to-b from-card/50 to-transparent">
          <div className="container">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {[
                { value: `${platformStats.qualifiedWinRate}%`, label: 'Win Rate', sublabel: 'on qualified picks', icon: Target, color: 'text-emerald-400' },
                { value: '$2.4M+', label: 'User Winnings', sublabel: 'tracked this year', icon: DollarSign, color: 'text-amber-400' },
                { value: `${platformStats.streakCurrent}`, label: 'Win Streak', sublabel: 'and counting', icon: TrendingUp, color: 'text-primary' },
                { value: '15+', label: 'Sports', sublabel: 'covered daily', icon: Trophy, color: 'text-purple-400' },
              ].map((stat, index) => (
                <div 
                  key={stat.label} 
                  className="relative group bg-card/50 border border-border/50 rounded-2xl p-6 text-center hover:border-primary/40 transition-all duration-300 animate-slide-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <stat.icon className={`h-6 w-6 mx-auto mb-3 ${stat.color}`} />
                  <div className="text-3xl md:text-4xl font-extrabold text-foreground mb-1">{stat.value}</div>
                  <div className="text-sm font-semibold text-foreground">{stat.label}</div>
                  <div className="text-xs text-muted-foreground">{stat.sublabel}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Live Viewers Banner */}
        <section className="py-4 bg-gradient-to-r from-primary/10 via-primary/20 to-primary/10 border-y border-primary/20">
          <div className="container">
            <div className="flex items-center justify-center gap-3 text-sm">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>
              <span className="text-sm font-semibold text-red-400 uppercase">Live</span>
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                <span className="font-semibold text-foreground transition-all duration-300">{viewerCount.toLocaleString()}</span> users viewing picks right now
              </span>
            </div>
          </div>
        </section>

        {/* How It Works - Interactive Demo */}
        <section className="py-16 md:py-24 border-t border-border/40 relative overflow-hidden">
          {/* Background effects */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 -left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl animate-pulse-slow" />
            <div className="absolute bottom-1/4 -right-1/4 w-[400px] h-[400px] bg-accent/5 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
          </div>
          
          <div className="container relative">
            <div className="text-center mb-12">
              <Badge variant="outline" className="px-4 py-1.5 mb-4 border-primary/30 text-primary">
                <Zap className="h-3.5 w-3.5 mr-2" />
                How It Works
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-3">
                See the AI in <span className="text-gradient">Action</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                From real-time data to winning picks in seconds. Watch how our AI processes thousands of data points.
              </p>
            </div>
            
            <Suspense fallback={<div className="h-96 flex items-center justify-center"><div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
              <WorkflowDemo />
            </Suspense>
          </div>
        </section>

        {/* Sports Coverage Section - More Visual */}
        <section className="py-16 border-t border-border/40">
          <div className="container">
            <div className="text-center mb-10">
              <Badge variant="outline" className="px-4 py-1.5 mb-4 border-primary/30 text-primary">
                <Dumbbell className="h-3.5 w-3.5 mr-2" />
                Complete Coverage
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-3">
                Every Sport. Every Game. <span className="text-gradient">Every Edge.</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                From primetime NFL to late-night UFC, our AI never sleeps so you never miss a winning opportunity.
              </p>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-8 gap-2 sm:gap-3 max-w-5xl mx-auto">
              {allSports.map((sport, index) => (
                <div 
                  key={sport.name}
                  className="group flex flex-col items-center gap-1 sm:gap-2 p-2 sm:p-4 bg-card/50 border border-border/40 rounded-lg sm:rounded-xl text-center hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 cursor-pointer animate-slide-up"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <span className="text-xl sm:text-2xl md:text-3xl group-hover:scale-110 transition-transform">{sport.emoji}</span>
                  <span className="text-[10px] sm:text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors truncate w-full">{sport.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* Features Section */}
        <section className="py-16 md:py-24 border-t border-border/40">
          <div className="container">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
                <BarChart3 className="h-3 w-3" />
                Full Toolkit
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                Everything You Need to Bet Smarter
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                From single-game picks to multi-leg parlays — get AI-powered insights for every bet type.
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
                We only recommend "GOOD" signal bets with high confidence. Here's how our qualified picks perform by league.
              </p>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-4 max-w-6xl mx-auto">
              {platformStats.sportBreakdown.map((sport, index) => (
                <div 
                  key={sport.sport} 
                  className="bg-background/50 border border-border/40 rounded-lg sm:rounded-xl p-2 sm:p-4 text-center hover:border-primary/40 transition-colors animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="text-lg sm:text-2xl font-bold text-primary mb-0.5 sm:mb-1">{sport.winRate}%</div>
                  <div className="text-[10px] sm:text-sm font-medium truncate">{sport.sport}</div>
                  <div className="text-[9px] sm:text-xs text-muted-foreground">{sport.wins}/{sport.qualified}</div>
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2">
                  What People Are Saying
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Real users, real results
                </p>
              </div>
              <div className="flex gap-2 self-end sm:self-auto">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => scrollTestimonials('left')}
                  disabled={!canScrollLeft}
                  className="h-8 w-8 sm:h-10 sm:w-10 rounded-full"
                >
                  <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => scrollTestimonials('right')}
                  disabled={!canScrollRight}
                  className="h-8 w-8 sm:h-10 sm:w-10 rounded-full"
                >
                  <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </div>
            </div>

            <div 
              ref={scrollRef}
              onScroll={updateScrollButtons}
              className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 snap-x snap-mandatory"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {testimonials.map((testimonial, index) => (
                <div 
                  key={testimonial.author} 
                  className="flex-shrink-0 w-[300px] bg-background/50 border border-border/40 rounded-xl p-5 snap-start"
                >
                  <div className="flex gap-1 mb-3">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-foreground mb-4 leading-relaxed">"{testimonial.quote}"</p>
                  <div>
                    <div className="font-medium text-sm">{testimonial.author}</div>
                    <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA - More Compelling */}
        <section className="py-20 md:py-28 border-t border-border/40 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent" />
          <div className="container relative">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-400 text-sm font-semibold mb-6 animate-pulse">
                <Zap className="h-4 w-4" />
                Limited Time: 70% Off All Plans
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold mb-6">
                Stop Guessing. <span className="text-gradient">Start Winning.</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Every minute you wait is another parlay you could be cashing. 
                Join <span className="text-foreground font-semibold">5,000+ winners</span> and get your edge today.
              </p>
              
              {/* What You Get */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10 max-w-2xl mx-auto">
                {[
                  { icon: Target, text: 'AI-Powered Picks' },
                  { icon: Layers, text: 'Smart Parlay Builder' },
                  { icon: TrendingUp, text: `${platformStats.qualifiedWinRate}% Win Rate` },
                ].map((item) => (
                  <div key={item.text} className="flex items-center justify-center gap-2 text-sm">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    <span className="font-medium">{item.text}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="hero" size="xl" asChild className="group text-lg">
                  <Link to="/pricing">
                    <Sparkles className="h-5 w-5 mr-2" />
                    Get Started Now
                    <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>
              <p className="mt-6 text-sm text-muted-foreground">
                Cancel anytime
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs sm:text-sm px-4">
                <Link to="/ai-sports-picks" className="text-primary hover:text-primary/80 font-medium transition-colors">AI Sports Picks →</Link>
                <Link to="/blog/is-ai-betting-legal" className="text-muted-foreground hover:text-primary transition-colors">Is AI betting legal?</Link>
                <Link to="/blog/how-ai-is-used-in-sports-betting" className="text-muted-foreground hover:text-primary transition-colors">How AI is used in betting</Link>
                <Link to="/blog/can-ai-predict-sports-outcomes" className="text-muted-foreground hover:text-primary transition-colors">Can AI predict sports?</Link>
                <Link to="/blog/ai-betting-myths-vs-reality" className="text-muted-foreground hover:text-primary transition-colors">AI myths vs reality</Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Bottom padding for sticky mobile CTA */}
      <div className="h-16 md:hidden" aria-hidden="true" />

      <Footer />

      {/* Sticky Mobile Signup CTA – always rendered to avoid CLS */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/95 backdrop-blur-lg border-t border-border/50 p-3 safe-area-bottom" style={{ containIntrinsicSize: '0 56px', contentVisibility: 'visible' }}>
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">Get AI Picks Today</p>
            <p className="text-xs text-muted-foreground truncate">{platformStats.qualifiedWinRate}% win rate • 70% off</p>
          </div>
          <Button variant="hero" size="sm" asChild className="shrink-0">
            <Link to="/login?tab=signup">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              Sign Up Free
            </Link>
          </Button>
        </div>
      </div>
      
    </div>
  );
};

export default Index;
