import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, CheckCircle2, Globe2, Languages, ShieldCheck, Trophy } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  globalMarketAlternates,
  getLanguagePageConfig,
  languagePageList,
  LanguageSlug,
} from '@/countryPages';

interface LanguageLandingProps {
  language: LanguageSlug;
}

const LanguageLanding = ({ language }: LanguageLandingProps) => {
  const config = getLanguagePageConfig(language);

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: config.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  };

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        name: config.h1,
        description: config.seoDescription,
        url: `https://thinkbetai.com${config.path}`,
        inLanguage: config.hrefLang,
        isPartOf: { '@type': 'WebSite', name: 'ThinkBetAI', url: 'https://thinkbetai.com/' },
        audience: {
          '@type': 'Audience',
          geographicArea: config.marketName,
        },
      },
      {
        '@type': 'SoftwareApplication',
        name: 'ThinkBetAI',
        applicationCategory: 'SportsApplication',
        operatingSystem: 'Web',
        url: 'https://thinkbetai.com/',
        areaServed: config.marketName,
        description: `${config.languageName} sports analysis with AI-assisted probabilities, odds context and risk notes.`,
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: config.currency,
          description: 'Free public previews and optional paid plans are available.',
        },
      },
      faqSchema,
    ],
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title={config.seoTitle}
        description={config.seoDescription}
        keywords={config.keywords}
        url={config.path}
        canonical={config.path}
        htmlLang={config.htmlLang}
        alternates={globalMarketAlternates}
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
                {config.heroEyebrow}
              </Badge>
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight mb-6">
                {config.h1}
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl">
                {config.intro}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mt-8">
                <Button size="lg" asChild>
                  <Link to="/ai-sports-picks">
                    {config.labels.primaryCta} <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/ai-sports-betting">{config.labels.secondaryCta}</Link>
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
                  {config.languageName}
                </Badge>
                <h2 className="text-3xl font-bold tracking-tight mb-4">
                  {config.labels.intentHeading}
                </h2>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  {config.marketNotes.map((note) => (
                    <p key={note}>{note}</p>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-border bg-card/50 p-5">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  {config.labels.sportsHeading}
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {config.primarySports.map((sport) => (
                    <div
                      key={sport}
                      className="rounded-md border border-border/70 bg-background/60 px-3 py-2 text-sm font-medium"
                    >
                      {sport}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-14 md:py-20 border-y border-border/40 bg-card/20">
          <div className="container">
            <div className="max-w-2xl mb-10">
              <Badge variant="outline" className="mb-4 border-primary/30 text-primary">
                <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
                Golden Template
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight mb-3">
                {config.labels.templateHeading}
              </h2>
              <p className="text-muted-foreground">
                Each language page has localized metadata, search intent, sports, FAQ copy,
                self-canonical URL, hreflang alternates and crawler-readable prerendered HTML.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-5">
              {config.toolModules.map((module) => (
                <article key={module.heading} className="rounded-lg border border-border bg-background/60 p-5">
                  <h3 className="font-semibold mb-3">{module.heading}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{module.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="py-14 md:py-20">
          <div className="container">
            <div className="grid gap-8 lg:grid-cols-[0.75fr_1fr]">
              <div>
                <Badge variant="secondary" className="mb-4">
                  <ShieldCheck className="mr-2 h-3.5 w-3.5" />
                  <Globe2 className="mr-2 h-3.5 w-3.5" />
                  {config.marketName}
                </Badge>
                <h2 className="text-3xl font-bold tracking-tight mb-4">{config.labels.faqHeading}</h2>
                <p className="text-muted-foreground leading-relaxed">
                  ThinkBetAI provides sports analysis and education. It does not operate
                  sportsbook accounts, hold funds, place wagers or guarantee results.
                </p>
              </div>

              <div className="divide-y divide-border rounded-lg border border-border bg-card/50">
                {config.faqs.map((faq) => (
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

        <section className="border-t border-border/40 py-12">
          <div className="container">
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-3">{config.labels.marketSwitcherTitle}</h2>
              <p className="text-muted-foreground mb-5">
                The main ThinkBetAI site targets the United States. Country and language pages
                give search engines clearer regional and linguistic context.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" asChild>
                  <Link to="/">US main site</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/uk">UK</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/ca">Canada</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/au">Australia</Link>
                </Button>
                {languagePageList.map((page) => (
                  <Button key={page.slug} variant={page.slug === language ? 'default' : 'outline'} asChild>
                    <Link to={page.path}>{page.languageName}</Link>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default LanguageLanding;
