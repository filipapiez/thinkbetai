import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, CheckCircle2, Languages, Link2, ShieldCheck } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  getLocalizedMoneyPage,
  LocalizedSeoTopicSlug,
} from '@/localizedSeoPages';
import { LanguageSlug } from '@/countryPages';

interface LocalizedSeoLandingProps {
  language: LanguageSlug;
  topic: LocalizedSeoTopicSlug;
}

const LocalizedSeoLanding = ({ language, topic }: LocalizedSeoLandingProps) => {
  const page = getLocalizedMoneyPage(language, topic);

  if (!page) return null;

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        name: page.h1,
        description: page.description,
        url: `https://thinkbetai.com${page.path}`,
        inLanguage: page.hrefLang,
        isPartOf: { '@type': 'WebSite', name: 'ThinkBetAI', url: 'https://thinkbetai.com/' },
        about: page.englishLabel,
        audience: {
          '@type': 'Audience',
          geographicArea: page.marketName,
        },
      },
      {
        '@type': 'SoftwareApplication',
        name: 'ThinkBetAI',
        applicationCategory: 'SportsApplication',
        operatingSystem: 'Web',
        url: 'https://thinkbetai.com/',
        areaServed: page.marketName,
        description: page.labels.softwareDescription,
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: page.currency,
          description: page.labels.offerDescription,
        },
      },
      {
        '@type': 'FAQPage',
        mainEntity: page.faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: { '@type': 'Answer', text: faq.answer },
        })),
      },
    ],
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title={page.title}
        description={page.description}
        keywords={page.keywords}
        url={page.path}
        canonical={page.path}
        htmlLang={page.htmlLang}
        alternates={page.alternates}
        structuredData={structuredData}
      />
      <Header />

      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-border/40 py-16 md:py-24">
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_0%,hsl(var(--primary)/0.16),transparent_42%)]" />
          <div className="container relative">
            <div className="max-w-4xl">
              <Badge variant="outline" className="mb-5 border-primary/30 text-primary">
                <Languages className="mr-2 h-3.5 w-3.5" />
                {page.languageName} · {page.marketType}
              </Badge>
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight mb-6">
                {page.h1}
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl">
                {page.intro}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mt-8">
                <Button size="lg" asChild>
                  <Link to="/login?tab=signup">
                    {page.labels.primaryCta} <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to={page.englishPath}>{page.labels.englishCanonical}</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="py-14 md:py-20">
          <div className="container">
            <div className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
              <div>
                <Badge variant="secondary" className="mb-4">
                  <BarChart3 className="mr-2 h-3.5 w-3.5" />
                  {page.marketName}
                </Badge>
                <h2 className="text-3xl font-bold tracking-tight mb-4">
                  {page.term}
                </h2>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  {page.modules.map((module) => (
                    <div key={module.heading}>
                      <h3 className="text-lg font-semibold text-foreground mb-2">{module.heading}</h3>
                      <p>{module.body}</p>
                    </div>
                  ))}
                </div>
              </div>

              <aside className="rounded-lg border border-border bg-card/50 p-5">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  {page.labels.marketSports}
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {page.primarySports.map((sport) => (
                    <div
                      key={sport}
                      className="rounded-md border border-border/70 bg-background/60 px-3 py-2 text-sm font-medium"
                    >
                      {sport}
                    </div>
                  ))}
                </div>
              </aside>
            </div>
          </div>
        </section>

        <section className="py-14 md:py-20 border-y border-border/40 bg-card/20">
          <div className="container">
            <div className="grid gap-8 lg:grid-cols-[0.75fr_1fr]">
              <div>
                <Badge variant="secondary" className="mb-4">
                  <ShieldCheck className="mr-2 h-3.5 w-3.5" />
                  {page.labels.responsibleBadge}
                </Badge>
                <h2 className="text-3xl font-bold tracking-tight mb-4">{page.labels.faqHeading}</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {page.labels.responsibleText}
                </p>
              </div>

              <div className="divide-y divide-border rounded-lg border border-border bg-background/60">
                {page.faqs.map((faq) => (
                  <details key={faq.question} className="group p-5">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                      <span>{faq.question}</span>
                      <span className="text-primary transition-transform group-open:rotate-45">+</span>
                    </summary>
                    <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-14 md:py-20">
          <div className="container">
            <div className="max-w-2xl mb-8">
              <Badge variant="outline" className="mb-4 border-primary/30 text-primary">
                <Link2 className="mr-2 h-3.5 w-3.5" />
                {page.labels.relatedBadge}
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight mb-3">
                {page.labels.relatedHeading}
              </h2>
              <p className="text-muted-foreground">
                {page.labels.relatedText}
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {page.links.map((link) => (
                <Link
                  key={`${link.href}-${link.label}`}
                  to={link.href}
                  className="rounded-lg border border-border bg-card/50 px-4 py-3 text-sm font-medium hover:border-primary/40 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default LocalizedSeoLanding;
