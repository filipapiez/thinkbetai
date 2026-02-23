import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LocalizedHeader } from '@/components/LocalizedHeader';
import { LocalizedFooter } from '@/components/LocalizedFooter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SEO } from '@/components/SEO';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Helmet } from 'react-helmet-async';
import { Check, Zap, Crown, Trophy, Star, TrendingUp, Shield } from 'lucide-react';
import { useWinRate } from '@/hooks/useWinRate';
import { useAuth } from '@/contexts/AuthContext';
import { EmbeddedCheckoutDialog } from '@/components/EmbeddedCheckoutDialog';
import { Locale, getTranslations, getLocalePath, getHreflangEntries } from '@/lib/i18n';

const pricingPlans = [
  { id: 'basic', priceId: 'price_1SpOpRQrqKHReEDtP3WD1zne', price: 4.99, originalPrice: 16.99, icon: Zap, popular: false },
  { id: 'pro', priceId: 'price_1SpOqPQrqKHReEDtqHZcLsbY', price: 14.99, originalPrice: 49.99, icon: Crown, popular: true },
  { id: 'insider', priceId: 'price_1Sn2CkQrqKHReEDtvJ6iR1gz', price: 49, originalPrice: 163, icon: Trophy, popular: false },
];

interface Props { locale: Exclude<Locale, 'en'>; }

const LocalizedPricing = ({ locale }: Props) => {
  const navigate = useNavigate();
  const { user, isSubscribed } = useAuth();
  const { winRate } = useWinRate();
  const [selectedPlan, setSelectedPlan] = useState<typeof pricingPlans[0] | null>(null);
  const t = getTranslations(locale).pricing;
  const lp = (path: string) => getLocalePath(locale, path);
  const hreflangEntries = getHreflangEntries('/pricing');

  const planNames = { basic: t.basicName, pro: t.proName, insider: t.insiderName };
  const planDescs = { basic: t.basicDesc, pro: t.proDesc, insider: t.insiderDesc };
  const planFeatures = { basic: t.basicFeatures, pro: t.proFeatures, insider: t.insiderFeatures };
  const planCTAs = { basic: t.basicCTA, pro: t.proCTA, insider: t.insiderCTA };

  const handleSelectPlan = (plan: typeof pricingPlans[0]) => {
    if (!user) { navigate('/login', { state: { from: { pathname: lp('/pricing') } } }); return; }
    setSelectedPlan(plan);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background via-background to-primary/5">
      <SEO title={t.seoTitle} description={t.seoDescription} keywords={t.seoKeywords} url={lp('/pricing')} />
      <Helmet>
        {hreflangEntries.map(e => <link key={e.hreflang} rel="alternate" hrefLang={e.hreflang} href={e.href} />)}
        <link rel="alternate" hrefLang="x-default" href="https://thinkbetai.com/pricing" />
      </Helmet>
      <LocalizedHeader locale={locale} />

      <main className="flex-1 py-12 md:py-20">
        <div className="container">
          <Breadcrumb items={[{ label: t.seoTitle.split(' - ')[0] }]} className="mb-8" />

          <div className="text-center mb-8 md:mb-16">
            <Badge variant="outline" className="mb-4 border-primary/50 text-primary"><Star className="h-3 w-3 mr-1 fill-primary" />{t.trustedBadge}</Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-4">{t.headline1} <span className="text-gradient">{t.headline2}</span></h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-6">{t.subtitle.replace('No questions asked.', '')}</p>
            <div className="inline-flex items-center gap-4 sm:gap-8 py-4 px-6 bg-card/50 backdrop-blur-sm rounded-2xl border border-border/50">
              <div className="text-center"><div className="text-2xl sm:text-3xl font-bold text-success flex items-center justify-center gap-1"><TrendingUp className="h-5 w-5" />{winRate}%</div><div className="text-xs text-muted-foreground">{t.winRateLabel}</div></div>
              <div className="h-10 w-px bg-border" />
              <div className="text-center"><div className="text-2xl sm:text-3xl font-bold text-primary">1,000+</div><div className="text-xs text-muted-foreground">{t.verifiedPicks}</div></div>
              <div className="h-10 w-px bg-border hidden sm:block" />
              <div className="text-center hidden sm:block"><div className="text-2xl sm:text-3xl font-bold text-accent flex items-center justify-center gap-1"><Check className="h-5 w-5" />{t.instantAccess.split(' ')[0]}</div><div className="text-xs text-muted-foreground">{t.instantAccess.split(' ')[1] || 'Access'}</div></div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-4 max-w-6xl mx-auto items-stretch">
            {pricingPlans.map(plan => {
              const Icon = plan.icon;
              const isPopular = plan.popular;
              const name = planNames[plan.id as keyof typeof planNames];
              const desc = planDescs[plan.id as keyof typeof planDescs];
              const features = planFeatures[plan.id as keyof typeof planFeatures];
              const cta = planCTAs[plan.id as keyof typeof planCTAs];

              return (
                <Card key={plan.id} className={`relative flex flex-col overflow-hidden transition-all duration-300 hover:scale-[1.02] ${isPopular ? 'border-2 border-primary shadow-2xl shadow-primary/20 lg:scale-105 lg:z-10 bg-gradient-to-b from-card to-primary/5' : 'border-border hover:border-primary/50 hover:shadow-xl'}`}>
                  {isPopular && <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-primary to-accent py-2 text-center"><span className="text-sm font-semibold text-primary-foreground flex items-center justify-center gap-1"><Crown className="h-4 w-4" />{t.mostPopular}</span></div>}
                  <CardHeader className={`text-center pb-2 ${isPopular ? 'pt-12' : ''}`}>
                    <div className={`mx-auto h-16 w-16 rounded-2xl flex items-center justify-center mb-4 ${isPopular ? 'bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/30' : 'bg-muted'}`}>
                      <Icon className={`h-8 w-8 ${isPopular ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                    </div>
                    <CardTitle className="text-2xl">{name}</CardTitle>
                    <CardDescription className="min-h-[40px]">{desc}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <div className="text-center mb-6 py-4 rounded-xl bg-muted/50">
                      <span className="inline-block mb-2 text-xs font-semibold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">{t.save70}</span>
                      <div className="flex items-baseline justify-center gap-2">
                        <span className="text-lg text-muted-foreground line-through">${plan.originalPrice}</span>
                        <div className="flex items-baseline"><span className="text-lg text-muted-foreground">$</span><span className="text-5xl font-bold text-success">{plan.price}</span><span className="text-muted-foreground">{t.perMonth}</span></div>
                      </div>
                    </div>
                    <ul className="space-y-3 mb-8 flex-1">
                      {features.map((f, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <div className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${isPopular ? 'bg-primary/20' : 'bg-muted'}`}><Check className={`h-3 w-3 ${isPopular ? 'text-primary' : 'text-muted-foreground'}`} /></div>
                          <span className="text-sm">{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Button onClick={() => handleSelectPlan(plan)} variant={isPopular ? 'hero' : 'outline'} size="lg" className={`w-full ${isPopular ? 'shadow-lg shadow-primary/30' : ''}`} disabled={isSubscribed}>
                      {isSubscribed ? t.alreadySubscribed : cta}
                    </Button>
                    <p className="text-xs text-center text-muted-foreground mt-3">{t.cancelAnytime}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="flex flex-wrap justify-center gap-6 mt-12 text-sm text-muted-foreground">
            <div className="flex items-center gap-2"><Shield className="h-5 w-5 text-success" /><span>{t.secureCheckout}</span></div>
            <div className="flex items-center gap-2"><Check className="h-5 w-5 text-success" /><span>{t.instantAccess}</span></div>
            <div className="flex items-center gap-2"><Star className="h-5 w-5 text-success" /><span>{t.support247}</span></div>
          </div>
        </div>
      </main>

      <LocalizedFooter locale={locale} />
      {selectedPlan && <EmbeddedCheckoutDialog isOpen={!!selectedPlan} onClose={() => setSelectedPlan(null)} priceId={selectedPlan.priceId} planName={planNames[selectedPlan.id as keyof typeof planNames]} />}
    </div>
  );
};

export default LocalizedPricing;
