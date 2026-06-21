import { AlertTriangle, Bot, CheckCircle2, Database, FileCheck2, Mail, RefreshCw, Scale } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Card, CardContent } from '@/components/ui/card';

const policies = [
  {
    icon: Database,
    title: 'Sources and freshness',
    body: 'Analysis should identify the type of information it relies on—such as schedules, results, injuries, lineups, market prices or historical performance—and avoid presenting stale information as live. Time-sensitive pages should state when information was checked or updated.',
  },
  {
    icon: Bot,
    title: 'How AI is used',
    body: 'AI may organize inputs, generate probability estimates, summarize matchup context and assist with drafting. AI output is not treated as inherently correct. Factual claims, prices, named competitors and performance references require separate verification.',
  },
  {
    icon: FileCheck2,
    title: 'Performance claims',
    body: 'A performance claim should identify its sample, date range, grading method, market and relevant exclusions. If those details are unavailable, we prefer a limitation statement over a precise promotional percentage.',
  },
  {
    icon: Scale,
    title: 'Comparisons and commercial interest',
    body: 'When ThinkBetAI compares itself with another product, the page must disclose our commercial interest, link to provider sources, state where another product may be stronger and include the date the information was checked.',
  },
  {
    icon: RefreshCw,
    title: 'Corrections and updates',
    body: 'Material factual errors should be corrected promptly. Time-sensitive pricing and product comparisons are reviewed periodically, but readers should still verify the current provider page before purchasing.',
  },
  {
    icon: AlertTriangle,
    title: 'Risk and responsible language',
    body: 'We do not promise wins, risk-free returns or guaranteed profit. Betting-related content must acknowledge uncertainty, age and location restrictions, and the possibility of losing money.',
  },
];

const EditorialPolicy = () => (
  <div className="min-h-screen flex flex-col">
    <SEO
      title="Editorial Policy, AI Use & Corrections | ThinkBetAI"
      description="Learn how ThinkBetAI handles data sources, AI-assisted content, performance claims, competitor comparisons, corrections and responsible betting language."
      url="/editorial-policy"
    />
    <Header />
    <main className="flex-1">
      <div className="container max-w-5xl pt-6"><Breadcrumb items={[{ label: 'Editorial Policy' }]} /></div>
      <section className="py-12 md:py-16">
        <div className="container max-w-5xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-primary">Last reviewed June 20, 2026</p>
          <h1 className="mb-5 text-4xl font-bold md:text-5xl">Editorial Policy, AI Use &amp; Corrections</h1>
          <p className="max-w-3xl text-lg leading-relaxed text-muted-foreground">
            ThinkBetAI publishes product information, educational material and model-assisted sports analysis. This policy explains the standard those pages should meet and the limits readers should keep in mind.
          </p>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {policies.map(({ icon: Icon, title, body }) => (
              <Card key={title}>
                <CardContent className="p-6">
                  <Icon className="mb-3 h-6 w-6 text-primary" />
                  <h2 className="mb-2 text-xl font-semibold">{title}</h2>
                  <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="mt-6 border-primary/30 bg-primary/5">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-primary" />
                <div>
                  <h2 className="mb-2 text-xl font-semibold">What readers should expect</h2>
                  <p className="text-muted-foreground">Clear titles, direct explanations, visible uncertainty, useful internal links, current pricing language, accessible correction channels and no fabricated testimonials. Product pages may be persuasive, but they should not hide who published them or turn estimates into guarantees.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-6 w-6 shrink-0 text-primary" />
                <div>
                  <h2 className="mb-2 text-xl font-semibold">Request a correction</h2>
                  <p className="text-muted-foreground">Email <a className="font-medium text-foreground underline" href="mailto:support@thinkbetai.com?subject=Correction%20request">support@thinkbetai.com</a> with the page URL, the statement you believe is incorrect and a supporting source. We prioritize errors involving pricing, legal or responsible-gambling information, performance figures and named competitors.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
    <Footer />
  </div>
);

export default EditorialPolicy;
