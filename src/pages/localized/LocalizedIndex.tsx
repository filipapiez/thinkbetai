import { Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { LocalizedHeader } from '@/components/LocalizedHeader';
import { LocalizedFooter } from '@/components/LocalizedFooter';
import { FeatureCard } from '@/components/FeatureCard';
import { Badge } from '@/components/ui/badge';
import { SEO } from '@/components/SEO';
import WorkflowDemo from '@/components/WorkflowDemo';
import { platformStats } from '@/lib/platformStats';
import { useWinRate } from '@/hooks/useWinRate';
import { Locale, getTranslations, getLocalePath, getHreflangEntries } from '@/lib/i18n';
import {
  Search, TrendingUp, UserX, Gauge, Shield, ArrowRight, BarChart3, Trophy,
  Target, Zap, CheckCircle2, Star, Layers, Dumbbell, Sparkles, Clock,
  Users, DollarSign, ChevronLeft, ChevronRight
} from 'lucide-react';

interface Props { locale: Exclude<Locale, 'en'>; }

const LocalizedIndex = ({ locale }: Props) => {
  const t = getTranslations(locale).homepage;
  const lp = (path: string) => getLocalePath(locale, path);
  const { winRate, currentStreak } = useWinRate();

  const [viewerCount, setViewerCount] = useState(847);
  useEffect(() => {
    const interval = setInterval(() => {
      setViewerCount(prev => Math.max(500, Math.min(1200, prev + (Math.floor(Math.random() * 5) + 1) * (Math.random() > 0.5 ? 1 : -1))));
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const updateScrollButtons = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };
  const scrollTestimonials = (direction: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: direction === 'left' ? -320 : 320, behavior: 'smooth' });
  };

  const allSports = [
    { name: 'NFL', emoji: '🏈' }, { name: 'NBA', emoji: '🏀' }, { name: 'MLB', emoji: '⚾' },
    { name: 'NHL', emoji: '🏒' }, { name: 'NCAAF', emoji: '🏈' }, { name: 'NCAAB', emoji: '🏀' },
    { name: 'WNBA', emoji: '🏀' }, { name: 'EPL', emoji: '⚽' }, { name: 'La Liga', emoji: '⚽' },
    { name: 'Champions League', emoji: '⚽' },
    { name: locale === 'de' ? 'Bundesliga' : locale === 'pl' ? 'Ekstraklasa' : 'Ligue 1', emoji: '⚽' },
    { name: 'MLS', emoji: '⚽' }, { name: 'UFC', emoji: '🥊' }, { name: 'Boxing', emoji: '🥊' },
    { name: 'Tennis', emoji: '🎾' }, { name: 'Golf', emoji: '⛳' },
  ];

  const testimonials = [
    { quote: "lowkey this app is fire. hit 3 parlays last weekend 🔥", author: "Marcus D.", role: "NBA Fan", rating: 5 },
    { quote: "been using it for a month now, my friends think i'm psychic lol", author: "Taylor S.", role: "Weekend Bettor", rating: 5 },
    { quote: "finally something that actually makes sense. no more random guesses", author: "Chris M.", role: "Football Guy", rating: 5 },
    { quote: "the injury updates alone are worth it", author: "Jordan P.", role: "Fantasy Champ", rating: 5 },
    { quote: "my bankroll went from 😬 to 😎 real quick", author: "Alex K.", role: "Sports Junkie", rating: 5 },
  ];

  const hreflangEntries = getHreflangEntries('');

  return (
    <div className="min-h-screen flex flex-col">
      <SEO title={t.seoTitle} description={t.seoDescription} keywords={t.seoKeywords} url={lp('')} />
      <Helmet>
        {hreflangEntries.map(e => (
          <link key={e.hreflang} rel="alternate" hrefLang={e.hreflang} href={e.href} />
        ))}
        <link rel="alternate" hrefLang="x-default" href="https://thinkbetai.com/" />
      </Helmet>
      <LocalizedHeader locale={locale} />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden py-16 md:py-28">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/20 rounded-full blur-[120px] animate-pulse-slow" />
          </div>
          <div className="container relative">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex flex-wrap items-center justify-center gap-2 md:gap-3 px-4 md:px-5 py-2 md:py-2.5 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30 mb-8 animate-fade-in">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span></span>
                  <span className="text-xs md:text-sm font-semibold text-emerald-400">{t.liveBadge}</span>
                </div>
                <div className="hidden sm:block w-px h-4 bg-border" />
                <span className="text-xs md:text-sm font-medium text-foreground"><span className="text-primary font-bold">{winRate}%</span> {t.winRate}</span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight mb-6 animate-slide-up leading-[1.1]">
                {t.headline1}{' '}<span className="relative inline-block"><span className="text-gradient">{t.headline2}</span><Sparkles className="absolute -top-1 -right-4 md:-top-2 md:-right-6 h-4 w-4 md:h-6 md:w-6 text-primary animate-pulse" /></span>
              </h1>

              <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto animate-slide-up leading-relaxed" style={{ animationDelay: '100ms' }}>
                {t.subheadline}
              </p>

              <div className="flex flex-wrap justify-center gap-2 md:gap-4 mb-10 animate-slide-up" style={{ animationDelay: '150ms' }}>
                <Badge variant="secondary" className="px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm bg-card/80 border-border/50"><Clock className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2 text-primary" />{t.badgeUpdated}</Badge>
                <Badge variant="secondary" className="px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm bg-card/80 border-border/50"><TrendingUp className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2 text-emerald-400" />{platformStats.totalQualified}+ {t.badgeWinningPicks}</Badge>
                <Badge variant="secondary" className="px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm bg-card/80 border-border/50"><Shield className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2 text-amber-400" />{t.badgeGuarantee}</Badge>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: '200ms' }}>
                <Button variant="hero" size="xl" asChild className="group relative overflow-hidden">
                  <Link to={lp('/pricing')} className="flex items-center"><Sparkles className="h-5 w-5 mr-2 group-hover:animate-pulse" />{t.ctaPrimary}<ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" /></Link>
                </Button>
                <Button variant="glass" size="xl" asChild className="group">
                  <Link to={lp('/pricing')} className="flex items-center"><Zap className="h-5 w-5 mr-2" />{t.ctaSecondary}<ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" /></Link>
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 sm:gap-6 mt-10 text-xs sm:text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: '300ms' }}>
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {['M','S','J','A'].map((l, i) => (
                      <div key={i} className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 border-2 border-background flex items-center justify-center text-xs font-bold">{l}</div>
                    ))}
                  </div>
                  <span><span className="font-semibold text-foreground">1,247</span> {t.joinedThisWeek}</span>
                </div>
                <div className="hidden sm:block w-px h-5 bg-border" />
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => <Star key={i} className="h-3 w-3 sm:h-4 sm:w-4 fill-amber-400 text-amber-400" />)}
                  <span className="ml-1"><span className="font-semibold text-foreground">4.9</span> {t.fromReviews}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-16 border-t border-border/40 bg-gradient-to-b from-card/50 to-transparent">
          <div className="container">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {[
                { value: `${winRate}%`, label: t.statWinRate, sublabel: t.statOnQualified, icon: Target, color: 'text-emerald-400' },
                { value: '$2.4M+', label: t.statUserWinnings, sublabel: t.statTrackedYear, icon: DollarSign, color: 'text-amber-400' },
                { value: `${currentStreak}`, label: t.statWinStreak, sublabel: t.statAndCounting, icon: TrendingUp, color: 'text-primary' },
                { value: '15+', label: t.statSports, sublabel: t.statCoveredDaily, icon: Trophy, color: 'text-purple-400' },
              ].map((stat, i) => (
                <div key={stat.label} className="relative group bg-card/50 border border-border/50 rounded-2xl p-6 text-center hover:border-primary/40 transition-all duration-300 animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
                  <stat.icon className={`h-6 w-6 mx-auto mb-3 ${stat.color}`} />
                  <div className="text-3xl md:text-4xl font-extrabold text-foreground mb-1">{stat.value}</div>
                  <div className="text-sm font-semibold text-foreground">{stat.label}</div>
                  <div className="text-xs text-muted-foreground">{stat.sublabel}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Live Viewers */}
        <section className="py-4 bg-gradient-to-r from-primary/10 via-primary/20 to-primary/10 border-y border-primary/20">
          <div className="container">
            <div className="flex items-center justify-center gap-3 text-sm">
              <span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span></span>
              <span className="text-sm font-semibold text-red-400 uppercase">{t.liveViewers}</span>
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground"><span className="font-semibold text-foreground">{viewerCount.toLocaleString()}</span> {t.usersViewingNow}</span>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 md:py-24 border-t border-border/40 relative overflow-hidden">
          <div className="container relative">
            <div className="text-center mb-12">
              <Badge variant="outline" className="px-4 py-1.5 mb-4 border-primary/30 text-primary"><Zap className="h-3.5 w-3.5 mr-2" />{t.howItWorksBadge}</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-3">{t.howItWorksTitle} <span className="text-gradient">Action</span></h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{t.howItWorksSubtitle}</p>
            </div>
            <WorkflowDemo />
          </div>
        </section>

        {/* Sports Coverage */}
        <section className="py-16 border-t border-border/40">
          <div className="container">
            <div className="text-center mb-10">
              <Badge variant="outline" className="px-4 py-1.5 mb-4 border-primary/30 text-primary"><Dumbbell className="h-3.5 w-3.5 mr-2" />{t.sportsCoverageBadge}</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-3">{t.sportsCoverageTitle} <span className="text-gradient">{t.headline2}</span></h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{t.sportsCoverageSubtitle}</p>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-8 gap-2 sm:gap-3 max-w-5xl mx-auto">
              {allSports.map((sport, i) => (
                <div key={sport.name} className="group flex flex-col items-center gap-1 sm:gap-2 p-2 sm:p-4 bg-card/50 border border-border/40 rounded-lg sm:rounded-xl text-center hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 cursor-pointer animate-slide-up" style={{ animationDelay: `${i * 30}ms` }}>
                  <span className="text-xl sm:text-2xl md:text-3xl group-hover:scale-110 transition-transform">{sport.emoji}</span>
                  <span className="text-[10px] sm:text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors truncate w-full">{sport.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 md:py-24 border-t border-border/40">
          <div className="container">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4"><BarChart3 className="h-3 w-3" />{t.featuresBadge}</div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4">{t.featuresTitle}</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">{t.featuresSubtitle}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Target, title: t.featureAIPicks, description: t.featureAIPicksDesc },
                { icon: Layers, title: t.featureParlayBuilder, description: t.featureParlayBuilderDesc },
                { icon: UserX, title: t.featureInjury, description: t.featureInjuryDesc },
                { icon: Gauge, title: t.featureRisk, description: t.featureRiskDesc },
              ].map((f, i) => <FeatureCard key={f.title} icon={f.icon} title={f.title} description={f.description} delay={i * 100} />)}
            </div>
          </div>
        </section>

        {/* Performance */}
        <section className="py-16 md:py-24 bg-card/30 border-t border-border/40">
          <div className="container">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4"><Target className="h-3 w-3" />{t.performanceBadge}</div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4">{t.performanceTitle}</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">{t.performanceSubtitle}</p>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-4 max-w-6xl mx-auto">
              {platformStats.sportBreakdown.map((sport, i) => (
                <div key={sport.sport} className="bg-background/50 border border-border/40 rounded-lg sm:rounded-xl p-2 sm:p-4 text-center hover:border-primary/40 transition-colors animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="text-lg sm:text-2xl font-bold text-primary mb-0.5 sm:mb-1">{sport.winRate}%</div>
                  <div className="text-[10px] sm:text-sm font-medium truncate">{sport.sport}</div>
                  <div className="text-[9px] sm:text-xs text-muted-foreground">{sport.wins}/{sport.qualified}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Steps */}
        <section className="py-16 md:py-24 border-t border-border/40">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">{t.stepsTitle}</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">{t.stepsSubtitle}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {[
                { step: '01', icon: Search, title: t.step1Title, desc: t.step1Desc },
                { step: '02', icon: BarChart3, title: t.step2Title, desc: t.step2Desc },
                { step: '03', icon: Trophy, title: t.step3Title, desc: t.step3Desc },
              ].map((item, i) => (
                <div key={item.step} className="relative text-center animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-4"><item.icon className="h-8 w-8" /></div>
                  <div className="text-xs font-bold text-primary/60 mb-2">STEP {item.step}</div>
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
            <div className="text-center mt-12">
              <Button variant="hero" size="lg" asChild><Link to="/games">{t.stepsCTA}<ArrowRight className="h-4 w-4 ml-2" /></Link></Button>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16 md:py-24 bg-card/30 border-t border-border/40">
          <div className="container">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2">{t.testimonialsTitle}</h2>
                <p className="text-sm sm:text-base text-muted-foreground">{t.testimonialsSubtitle}</p>
              </div>
              <div className="flex gap-2 self-end sm:self-auto">
                <Button variant="outline" size="icon" onClick={() => scrollTestimonials('left')} disabled={!canScrollLeft} className="h-8 w-8 sm:h-10 sm:w-10 rounded-full"><ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" /></Button>
                <Button variant="outline" size="icon" onClick={() => scrollTestimonials('right')} disabled={!canScrollRight} className="h-8 w-8 sm:h-10 sm:w-10 rounded-full"><ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" /></Button>
              </div>
            </div>
            <div ref={scrollRef} onScroll={updateScrollButtons} className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 snap-x snap-mandatory" style={{ scrollbarWidth: 'none' }}>
              {testimonials.map(t => (
                <div key={t.author} className="flex-shrink-0 w-[300px] bg-background/50 border border-border/40 rounded-xl p-5 snap-start">
                  <div className="flex gap-1 mb-3">{[...Array(t.rating)].map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />)}</div>
                  <p className="text-sm text-foreground mb-4 leading-relaxed">"{t.quote}"</p>
                  <div><div className="font-medium text-sm">{t.author}</div><div className="text-xs text-muted-foreground">{t.role}</div></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 md:py-28 border-t border-border/40 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent" />
          <div className="container relative">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-400 text-sm font-semibold mb-6 animate-pulse">
                <Zap className="h-4 w-4" />{t.finalCtaBadge}
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold mb-6">{t.finalCtaTitle1} <span className="text-gradient">{t.finalCtaTitle2}</span></h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">{t.finalCtaSubtitle} <span className="text-foreground font-semibold">{t.finalCtaJoin}</span></p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="hero" size="xl" asChild className="group text-lg">
                  <Link to={lp('/pricing')}><Sparkles className="h-5 w-5 mr-2" />{t.finalCtaCTA}<ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" /></Link>
                </Button>
              </div>
              <p className="mt-6 text-sm text-muted-foreground">{t.finalCtaCancel}</p>
            </div>
          </div>
        </section>
      </main>

      <LocalizedFooter locale={locale} />
    </div>
  );
};

export default LocalizedIndex;
