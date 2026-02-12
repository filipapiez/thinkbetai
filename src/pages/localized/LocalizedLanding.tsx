import { Link } from 'react-router-dom';
import { LocalizedHeader } from '@/components/LocalizedHeader';
import { LocalizedFooter } from '@/components/LocalizedFooter';
import { SEO } from '@/components/SEO';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Star, CheckCircle, TrendingUp, Zap, Shield, ArrowRight, Brain, Target, Users, Gift, Clock, BarChart3, Layers, Calculator, Sparkles } from 'lucide-react';
import { Locale, getTranslations, getLocalePath, getHreflangEntries } from '@/lib/i18n';

interface Props { locale: Exclude<Locale, 'en'>; page: 'bestAIBettingApp' | 'freeAIPredictions' | 'aiNFLPicks' | 'aiParlayBuilder'; }

const landingIcons = {
  bestAIBettingApp: [Brain, Target, Zap, Shield, Users, Trophy],
  freeAIPredictions: [Gift, Target, Clock, BarChart3],
  aiNFLPicks: [Target, BarChart3, Trophy, Clock, Shield, TrendingUp],
  aiParlayBuilder: [Layers, Calculator, Target, Shield, TrendingUp, Sparkles],
};

const LocalizedLanding = ({ locale, page }: Props) => {
  const t = getTranslations(locale).landing[page] as any;
  const lp = (path: string) => getLocalePath(locale, path);

  const pathMap = {
    bestAIBettingApp: '/best-ai-betting-app',
    freeAIPredictions: '/free-ai-predictions',
    aiNFLPicks: '/ai-nfl-picks',
    aiParlayBuilder: '/ai-parlay-builder',
  };
  const hreflangEntries = getHreflangEntries(pathMap[page]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO title={t.seoTitle} description={t.seoDescription} keywords={t.seoKeywords} url={lp(pathMap[page])} type="article" />
      <Helmet>
        {hreflangEntries.map(e => <link key={e.hreflang} rel="alternate" hrefLang={e.hreflang} href={e.href} />)}
        <link rel="alternate" hrefLang="x-default" href={`https://thinkbetai.com${pathMap[page]}`} />
      </Helmet>
      <LocalizedHeader locale={locale} />

      <main className="flex-1">
        <div className="container py-8 max-w-4xl">
          <Breadcrumb items={[{ label: t.headline }]} className="mb-8" />

          <header className="text-center mb-12">
            <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">{t.badge}</Badge>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">{t.headline} <span className="text-gradient">2026</span></h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">{t.subtitle}</p>
            <Button size="lg" asChild>
              <Link to={page === 'aiNFLPicks' ? '/games?sport=americanfootball_nfl' : page === 'aiParlayBuilder' ? '/parlays' : '/games'}>
                <Zap className="h-5 w-5 mr-2" />{t.ctaPrimary}<ArrowRight className="h-5 w-5 ml-2" />
              </Link>
            </Button>
          </header>

          {'featuresTitle' in t && (
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6 text-center">{t.featuresTitle}</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {landingIcons[page].slice(0, 6).map((Icon, i) => (
                  <Card key={i} className="hover:border-primary/50 transition-colors">
                    <CardContent className="p-6">
                      <Icon className="h-8 w-8 text-primary mb-3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {'benefits' in t && (
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6 text-center">{t.benefitsTitle}</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {(t as any).benefits.map((b: any, i: number) => {
                  const Icon = landingIcons.freeAIPredictions[i];
                  return (
                    <Card key={i} className="hover:border-primary/50 transition-colors">
                      <CardContent className="p-6 flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-success/10"><Icon className="h-6 w-6 text-success" /></div>
                        <div><h3 className="font-semibold mb-1">{b.title}</h3><p className="text-sm text-muted-foreground">{b.description}</p></div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>
          )}

          <div className="text-center py-12 px-6 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">{t.ctaBottomTitle}</h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">{t.ctaBottomSubtitle}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild><Link to="/games"><TrendingUp className="h-4 w-4 mr-2" />{'viewPicks' in t ? (t as any).viewPicks : t.ctaPrimary}</Link></Button>
              <Button size="lg" variant="outline" asChild><Link to={lp('/pricing')}>{'ctaSecondary' in t ? (t as any).ctaSecondary : 'unlockUnlimited' in t ? (t as any).unlockUnlimited : getTranslations(locale).nav.pricing}</Link></Button>
            </div>
          </div>
        </div>
      </main>

      <LocalizedFooter locale={locale} />
    </div>
  );
};

export default LocalizedLanding;
