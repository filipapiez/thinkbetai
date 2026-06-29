import { Link } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { FeatureCard } from '@/components/FeatureCard';
import { Badge } from '@/components/ui/badge';
import { SEO } from '@/components/SEO';
import { platformStats } from '@/lib/platformStats';
import { lazy, Suspense } from 'react';
const WorkflowDemo = lazy(() => import('@/components/WorkflowDemo'));
// LatestPredictionsHub removed — linked to retired /predictions/* and /matchups/* programmatic pages.

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
  Layers,
  Dumbbell,
  Sparkles,
  Clock,
  Brain,
  Users
} from 'lucide-react';

const Index = () => {
  const workflowRef = useRef<HTMLElement>(null);
  const [workflowReady, setWorkflowReady] = useState(false);
  const qualifiedWinRate = platformStats.qualifiedWinRateLabel;
  const winStreak = `${platformStats.streakCurrent} Win Streak`;

  useEffect(() => {
    const section = workflowRef.current;
    if (!section || typeof IntersectionObserver === 'undefined') {
      setWorkflowReady(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setWorkflowReady(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px 0px' },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

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

  return (
    <div className="min-h-screen flex flex-col">
      <SEO canonical="/" />
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
              <div className="inline-flex flex-wrap items-center justify-center gap-2 md:gap-3 px-4 md:px-5 py-2 md:py-2.5 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30 mb-8">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                  </span>
                  <span className="text-xs md:text-sm font-semibold text-red-400">LIVE</span>
                </div>
                <div className="hidden sm:block w-px h-4 bg-border" />
                <span className="text-xs md:text-sm font-medium text-foreground">
                  <span className="text-primary font-bold">{qualifiedWinRate} Win Rate</span>
                </span>
                <div className="hidden md:block w-px h-4 bg-border" />
                <span className="hidden md:inline text-sm text-muted-foreground">
                  {winStreak}
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
              <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
                AI-powered picks across NFL, NBA, UFC and every major sport — backed by a verified
                <Link to="/track-record" className="text-primary font-semibold hover:underline"> {qualifiedWinRate} win rate</Link> on qualified plays. Stop guessing. Start winning.
              </p>

              {/* Quick Value Props */}
              <div className="flex flex-wrap justify-center gap-2 md:gap-4 mb-10">
                <Badge variant="secondary" className="px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm bg-card/80 border-border/50">
                  <TrendingUp className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2 text-emerald-400" />
                  {qualifiedWinRate} Win Rate
                </Badge>
                <Badge variant="secondary" className="px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm bg-card/80 border-border/50">
                  <span className="relative mr-1.5 flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                  </span>
                  {winStreak}
                </Badge>
                <Badge variant="secondary" className="px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm bg-card/80 border-border/50">
                  <Clock className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2 text-primary" />
                  2-7 Min Updates
                </Badge>
                <Badge variant="secondary" className="px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm bg-card/80 border-border/50">
                  <Users className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2 text-amber-400" />
                  15,000+ Bettors
                </Badge>
                <Badge variant="secondary" className="px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm bg-card/80 border-border/50">
                  <CheckCircle2 className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2 text-amber-400" />
                  Instant Access
                </Badge>
              </div>


              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="hero" size="xl" asChild className="group relative overflow-hidden">
                  <Link to="/pricing" className="flex items-center">
                    <Sparkles className="h-5 w-5 mr-2 group-hover:animate-pulse" />
                    See Plans From $4.99
                    <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button variant="glass" size="xl" asChild className="group">
                  <Link to="/how-it-works" className="flex items-center">
                    <Brain className="h-5 w-5 mr-2" />
                    See How It Works
                    <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 sm:gap-6 mt-10 text-xs sm:text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span><span className="font-semibold text-foreground">Transparent</span> methodology</span>
                </div>
                <div className="hidden sm:block w-px h-5 bg-border" />
                <div className="flex items-center gap-1">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="ml-1"><span className="font-semibold text-foreground">Results</span> are not guaranteed</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Immediate product proof without fabricated picks or testimonials */}
        <section className="pb-16 md:pb-20">
          <div className="container">
            <div className="mx-auto max-w-5xl rounded-2xl border border-primary/20 bg-card/60 p-6 shadow-xl shadow-primary/5 md:p-8">
              <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">Inside a matchup report</p>
                  <h2 className="text-2xl font-bold md:text-3xl">See the estimate, the market and the uncertainty</h2>
                </div>
                <Link to="/how-it-works" className="inline-flex items-center text-sm font-medium text-primary hover:underline">
                  View the full workflow <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  { icon: Target, label: 'Model estimate', text: 'A probability range and recommended interpretation—not a guaranteed outcome.' },
                  { icon: BarChart3, label: 'Market comparison', text: 'Context for how the estimate compares with the price currently available.' },
                  { icon: Shield, label: 'Risk notes', text: 'Injuries, limited samples, late lineup news and other reasons to lower confidence.' },
                ].map(({ icon: Icon, label, text }) => (
                  <div key={label} className="rounded-xl border border-border/60 bg-background/50 p-5">
                    <Icon className="mb-3 h-6 w-6 text-primary" />
                    <h3 className="mb-2 font-semibold">{label}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section - More Dynamic */}
        <section className="py-16 border-t border-border/40 bg-gradient-to-b from-card/50 to-transparent">
          <div className="container">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {[
                { value: '$4.99', label: 'Starting Price', sublabel: 'per month', icon: Target, color: 'text-emerald-400' },
                { value: '3', label: 'Plan Options', sublabel: 'clearly listed', icon: BarChart3, color: 'text-amber-400' },
                { value: 'Public', label: 'Methodology', sublabel: 'and limitations', icon: Shield, color: 'text-primary' },
                { value: 'Anytime', label: 'Cancellation', sublabel: 'no long contract', icon: Trophy, color: 'text-purple-400' },
              ].map((stat, index) => (
                <div 
                  key={stat.label} 
                  className="relative group bg-card/50 border border-border/50 rounded-2xl p-6 text-center hover:border-primary/40 transition-all duration-300"
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

        {/* Analysis status banner */}
        <section className="py-4 bg-gradient-to-r from-primary/10 via-primary/20 to-primary/10 border-y border-primary/20">
          <div className="container">
            <div className="flex items-center justify-center gap-3 text-sm">
              <span className="relative flex h-2.5 w-2.5">
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>
              <span className="text-sm font-semibold text-red-400 uppercase">Updated</span>
              <span className="text-muted-foreground">
                <Link to="/pricing" className="font-medium text-foreground hover:text-primary">Plans from $4.99/month</Link>
                {' '}· Compare exact features before subscribing
              </span>
            </div>
          </div>
        </section>


        {/* How It Works - Interactive Demo */}
        <section ref={workflowRef} className="py-16 md:py-24 border-t border-border/40 relative overflow-hidden">
          {/* Background effects */}
          {/* Background effects removed for CWV performance */}
          
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
                See how available data becomes a probability estimate, explanation and risk assessment.
              </p>
            </div>
            
            <div className="min-h-96" style={{ contentVisibility: 'auto', containIntrinsicSize: '384px' }}>
              {workflowReady ? (
                <Suspense fallback={<div className="h-96" aria-hidden="true" />}>
                  <WorkflowDemo />
                </Suspense>
              ) : (
                <div className="h-96" aria-hidden="true" />
              )}
            </div>
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
                From primetime NFL to late-night UFC, review one consistent analysis format across major sports.
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

        {/* Analysis framework */}
        <section className="py-16 md:py-24 bg-card/30 border-t border-border/40">
          <div className="container">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
                <Target className="h-3 w-3" />
                Transparent Analysis
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                What Every AI Pick Should Explain
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                A useful prediction shows its assumptions and uncertainty—not just a team name and a confidence badge.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-5xl mx-auto">
              {[
                { title: 'Probability', detail: 'Model estimate' },
                { title: 'Market', detail: 'Implied odds' },
                { title: 'Context', detail: 'Matchup factors' },
                { title: 'Risk', detail: 'Uncertainty notes' },
              ].map((item, index) => (
                <div 
                  key={item.title}
                  className="bg-background/50 border border-border/40 rounded-lg sm:rounded-xl p-2 sm:p-4 text-center hover:border-primary/40 transition-colors animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="text-base sm:text-lg font-bold text-primary mb-1">{item.title}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">{item.detail}</div>
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
                Start Reviewing Picks in 3 Simple Steps
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                No complicated setup—just a clearer way to review model-driven sports analysis.
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
                  icon: Shield,
                  title: 'Review the Risk',
                  description: 'Compare probability, market price and uncertainty before making your own decision.',
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
                  Review Today's Games
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Analysis standards */}
        <section className="py-16 md:py-24 bg-card/30 border-t border-border/40">
          <div className="container">
            <div className="text-center mb-10">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2">What Good Analysis Should Show</h2>
              <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
                Evaluate the reasoning and uncertainty behind a prediction instead of relying on anonymous success stories.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-4 max-w-5xl mx-auto">
              {[
                { title: 'A probability estimate', text: 'See the model estimate alongside the sportsbook-implied probability.' },
                { title: 'The important context', text: 'Review injuries, matchup factors, market movement and data limitations.' },
                { title: 'A clear risk note', text: 'Understand uncertainty and why no individual outcome is guaranteed.' },
              ].map((item) => (
                <div key={item.title} className="bg-background/50 border border-border/40 rounded-xl p-5">
                  <CheckCircle2 className="h-5 w-5 text-primary mb-3" />
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.text}</p>
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
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-400 text-sm font-semibold mb-6">
                <Zap className="h-4 w-4" />
                Limited Time: 70% Off All Plans
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold mb-6">
                Stop Guessing. <span className="text-gradient">Review the Data.</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Compare probabilities, matchup information and market context in one place. Results remain uncertain, so always set responsible limits.
              </p>
              
              {/* What You Get */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10 max-w-2xl mx-auto">
                {[
                  { icon: Target, text: 'AI-Powered Picks' },
                  { icon: Layers, text: 'Smart Parlay Builder' },
                  { icon: TrendingUp, text: 'Published Methodology' },
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
                <Link to="/ai-parlay-builder" className="text-primary hover:text-primary/80 font-medium transition-colors">AI Parlay Builder →</Link>
                <Link to="/free-ai-predictions" className="text-primary hover:text-primary/80 font-medium transition-colors">Free AI Predictions →</Link>
                <Link to="/ai-sports-picks" className="text-primary hover:text-primary/80 font-medium transition-colors">AI Sports Picks →</Link>
                <Link to="/blog/is-ai-betting-legal" className="text-muted-foreground hover:text-primary transition-colors">Is AI betting legal?</Link>
                <Link to="/blog/how-ai-is-used-in-sports-betting" className="text-muted-foreground hover:text-primary transition-colors">How AI is used in betting</Link>
                <Link to="/blog/can-ai-predict-sports-outcomes" className="text-muted-foreground hover:text-primary transition-colors">Can AI predict sports?</Link>
                <Link to="/blog/ai-betting-myths-vs-reality" className="text-muted-foreground hover:text-primary transition-colors">AI myths vs reality</Link>
              </div>
            </div>
          </div>
        </section>

        {/* LatestPredictionsHub removed — pointed to retired programmatic URLs. */}
      </main>

      <div className="h-16 md:hidden" aria-hidden="true" />

      <Footer />

      {/* Stable mobile CTA; account state is intentionally not loaded on this public route. */}
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background border-t border-border/50 p-3 safe-area-bottom" style={{ containIntrinsicSize: '0 56px', contentVisibility: 'visible' }}>
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">Get AI Picks Today</p>
              <p className="text-xs text-muted-foreground truncate">Probability analysis • Introductory offer</p>
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
