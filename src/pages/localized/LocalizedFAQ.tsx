import { Link } from 'react-router-dom';
import { LocalizedHeader } from '@/components/LocalizedHeader';
import { LocalizedFooter } from '@/components/LocalizedFooter';
import { SEO } from '@/components/SEO';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { HelpCircle, Sparkles, Shield, DollarSign, TrendingUp, Users, Zap, ArrowRight } from 'lucide-react';
import { Locale, getTranslations, getLocalePath } from '@/lib/i18n';

const categoryIcons: Record<string, React.ReactNode> = {
  'AI & Technology': <Sparkles className="h-5 w-5" />,
  'Getting Started': <Zap className="h-5 w-5" />,
  'Betting Strategy': <TrendingUp className="h-5 w-5" />,
  'Subscription & Billing': <DollarSign className="h-5 w-5" />,
  'Responsible Gambling': <Shield className="h-5 w-5" />,
};

interface Props { locale: Exclude<Locale, 'en'>; }

const LocalizedFAQ = ({ locale }: Props) => {
  const t = getTranslations(locale).faq;
  const lp = (path: string) => getLocalePath(locale, path);

  const grouped = t.faqs.reduce((acc, faq) => {
    if (!acc[faq.category]) acc[faq.category] = [];
    acc[faq.category].push(faq);
    return acc;
  }, {} as Record<string, typeof t.faqs>);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO title={t.seoTitle} description={t.seoDescription} keywords={t.seoKeywords} url={lp('/faq')} noIndex />
      <LocalizedHeader locale={locale} />

      <main className="flex-1">
        <div className="container max-w-4xl pt-8"><Breadcrumb items={[{ label: 'FAQ' }]} /></div>

        <section className="py-16 md:py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
          <div className="container max-w-4xl relative">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-primary/20 text-primary border-primary/30"><HelpCircle className="h-3 w-3 mr-1" />{t.helpCenter}</Badge>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">{t.title1} <span className="text-gradient">{t.title2}</span></h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">{t.subtitle}</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
              {[{ val: '67%', label: t.aiAccuracy }, { val: '15+', label: t.sportsCovered }, { val: '50K+', label: t.gamesAnalyzed }, { val: '24/7', label: t.aiUpdates }].map(s => (
                <div key={s.label} className="text-center p-4 rounded-xl bg-card/50 border border-border/50">
                  <div className="text-2xl font-bold text-primary">{s.val}</div>
                  <div className="text-sm text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-12 md:py-16">
          <div className="container max-w-4xl">
            {Object.entries(grouped).map(([category, faqs]) => (
              <div key={category} className="mb-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">{categoryIcons[category]}</div>
                  <h2 className="text-2xl font-bold">{t.categories[category] || category}</h2>
                </div>
                <Accordion type="single" collapsible className="space-y-3">
                  {faqs.map((faq, i) => (
                    <AccordionItem key={i} value={`${category}-${i}`} className="bg-card/50 border border-border/50 rounded-xl px-6 data-[state=open]:bg-card">
                      <AccordionTrigger className="text-left hover:no-underline py-5"><span className="font-medium pr-4">{faq.question}</span></AccordionTrigger>
                      <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">{faq.answer}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </div>
        </section>

        <section className="py-16 md:py-24 bg-gradient-to-b from-transparent to-card/50">
          <div className="container max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6"><Users className="h-4 w-4" />{t.joinSmartBettors}</div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t.stillHaveQuestions}</h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-xl mx-auto">{t.stillHaveQuestionsSubtitle}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild><Link to="/chat"><Sparkles className="h-4 w-4 mr-2" />{t.askAIChat}</Link></Button>
              <Button size="lg" variant="outline" asChild><Link to="/games">{t.viewGames}<ArrowRight className="h-4 w-4 ml-2" /></Link></Button>
            </div>
          </div>
        </section>
      </main>

      <LocalizedFooter locale={locale} />
    </div>
  );
};

export default LocalizedFAQ;
