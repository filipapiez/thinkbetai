import {
  AlertTriangle,
  CreditCard,
  FileText,
  Lock,
  Mail,
  RefreshCw,
  Scale,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type LegalPageKey = 'privacy' | 'terms' | 'contact' | 'disclaimer';

interface LegalCard {
  icon: LucideIcon;
  title: string;
  body: string;
}

interface LegalSection {
  title: string;
  body: string;
}

interface LegalPageContent {
  path: string;
  metaTitle: string;
  description: string;
  eyebrow: string;
  breadcrumb: string;
  title: string;
  intro: string;
  cards: LegalCard[];
  sections: LegalSection[];
}

const LEGAL_PAGES: Record<LegalPageKey, LegalPageContent> = {
  privacy: {
    path: '/privacy',
    metaTitle: 'Privacy Policy | ThinkBetAI',
    description:
      'Read how ThinkBetAI handles account data, payments, analytics, cookies, security, user rights and privacy questions for sports analysis tools.',
    eyebrow: 'Last reviewed July 2, 2026',
    breadcrumb: 'Privacy Policy',
    title: 'Privacy Policy',
    intro:
      'This page explains what ThinkBetAI may collect, why it is used, and how to contact us about privacy questions. The product is a sports analysis platform, not a sportsbook.',
    cards: [
      {
        icon: Lock,
        title: 'Account and product data',
        body: 'If you create an account, we may process your email, authentication details, product settings, saved analysis, usage events and support messages so the platform can operate.',
      },
      {
        icon: CreditCard,
        title: 'Payments',
        body: 'Payments are handled by payment providers such as Stripe. ThinkBetAI should not store full card numbers on its own servers.',
      },
      {
        icon: RefreshCw,
        title: 'Analytics and diagnostics',
        body: 'We may use analytics and error reporting to understand performance, discover broken pages, improve conversion flows and keep the app reliable.',
      },
      {
        icon: Mail,
        title: 'Privacy requests',
        body: 'For access, deletion, correction or privacy questions, contact support@thinkbetai.com from the email address connected to your account.',
      },
    ],
    sections: [
      {
        title: 'How information is used',
        body: 'Information is used to provide account access, maintain subscriptions, deliver AI-assisted sports analysis, prevent abuse, answer support requests, improve product quality and comply with legal obligations.',
      },
      {
        title: 'Cookies and local storage',
        body: 'The site may use cookies, local storage or similar technologies for authentication, preferences, analytics and security. Browser settings may allow you to limit some of these technologies, but core account features may stop working.',
      },
      {
        title: 'Age and location',
        body: 'ThinkBetAI is intended for adults who are legally allowed to view betting-related analysis in their location. The service is not intended for minors.',
      },
      {
        title: 'Security and retention',
        body: 'No internet service can promise perfect security. Data should be retained only as long as needed for product, legal, accounting, security or support reasons.',
      },
    ],
  },
  terms: {
    path: '/terms',
    metaTitle: 'Terms of Service | ThinkBetAI',
    description:
      'Review ThinkBetAI terms covering eligibility, subscriptions, acceptable use, AI sports analysis limits, account access and legal responsibilities.',
    eyebrow: 'Last reviewed July 2, 2026',
    breadcrumb: 'Terms of Service',
    title: 'Terms of Service',
    intro:
      'These terms describe the rules for using ThinkBetAI. By using the site or app, you agree to use the product responsibly and understand that sports outcomes are uncertain.',
    cards: [
      {
        icon: ShieldCheck,
        title: 'Eligibility',
        body: 'You must be legally allowed to access sports betting related analysis in your jurisdiction and old enough to participate where applicable.',
      },
      {
        icon: AlertTriangle,
        title: 'No guaranteed outcomes',
        body: 'ThinkBetAI provides informational analysis. It does not guarantee wins, profits, odds movement, sportsbook acceptance or any specific result.',
      },
      {
        icon: CreditCard,
        title: 'Subscriptions',
        body: 'Paid access, renewals, cancellation timing and taxes should be reviewed before checkout. Access can change if payment fails or a plan is canceled.',
      },
      {
        icon: Scale,
        title: 'Acceptable use',
        body: 'Do not scrape, abuse, reverse engineer, resell, overload, attack or misuse the platform, data, models, pages or account systems.',
      },
    ],
    sections: [
      {
        title: 'Informational sports analysis',
        body: 'Model output, confidence scores, picks, matchup notes and parlay tools are research aids. They are not financial, legal or investment advice and should not replace your own judgment.',
      },
      {
        title: 'Accounts and security',
        body: 'You are responsible for keeping your account credentials secure and for activity under your account. Notify support if you believe your account has been accessed without permission.',
      },
      {
        title: 'Intellectual property',
        body: 'The ThinkBetAI name, interface, content, analysis format, code, copy and design belong to ThinkBetAI or its licensors unless stated otherwise.',
      },
      {
        title: 'Service changes',
        body: 'Features, sports coverage, prices, data providers and availability may change over time. Some analysis can be delayed, incomplete or unavailable.',
      },
    ],
  },
  contact: {
    path: '/contact',
    metaTitle: 'Contact ThinkBetAI Support',
    description:
      'Contact ThinkBetAI for support, billing questions, corrections, privacy requests, responsible gambling concerns and product feedback.',
    eyebrow: 'Support and corrections',
    breadcrumb: 'Contact',
    title: 'Contact ThinkBetAI',
    intro:
      'Use this page to reach the right support path. Include the page URL, account email and enough detail for us to understand the issue without guessing.',
    cards: [
      {
        icon: Mail,
        title: 'General support',
        body: 'Email support@thinkbetai.com for account access, product questions, bug reports, billing questions and subscription issues.',
      },
      {
        icon: FileText,
        title: 'Corrections',
        body: 'For factual corrections, include the page URL, the exact claim, why it is wrong and a supporting source when available.',
      },
      {
        icon: Lock,
        title: 'Privacy requests',
        body: 'For privacy or data requests, email from the account address when possible so ownership can be verified.',
      },
      {
        icon: AlertTriangle,
        title: 'Responsible gambling',
        body: 'If gambling feels harmful or hard to control, use the responsible gambling page and contact a qualified support organization immediately.',
      },
    ],
    sections: [
      {
        title: 'Best way to get a useful reply',
        body: 'Send the page URL, browser/device, screenshots if relevant, account email if applicable and a short description of what you expected versus what happened.',
      },
      {
        title: 'Billing and subscription issues',
        body: 'For billing questions, include the account email and the approximate payment date. Do not send full card numbers by email.',
      },
      {
        title: 'SEO, media and partnerships',
        body: 'For commercial, editorial or partnership questions, explain the context clearly and link to the relevant page or proposal.',
      },
      {
        title: 'Urgent safety issues',
        body: 'ThinkBetAI support is not an emergency service. For crisis, gambling harm or immediate safety concerns, contact local emergency services or a qualified support hotline.',
      },
    ],
  },
  disclaimer: {
    path: '/disclaimer',
    metaTitle: 'Sports Betting Disclaimer | ThinkBetAI',
    description:
      'Read the ThinkBetAI disclaimer on sports betting risk, AI prediction limits, data accuracy, legal restrictions and no guaranteed outcomes.',
    eyebrow: 'Risk and limitations',
    breadcrumb: 'Disclaimer',
    title: 'Sports Betting Disclaimer',
    intro:
      'ThinkBetAI provides sports analysis and educational information. It does not place bets, hold funds or guarantee betting outcomes.',
    cards: [
      {
        icon: AlertTriangle,
        title: 'Sports betting involves risk',
        body: 'You can lose money. Do not bet money needed for rent, food, bills, debt payments, medical care or other essentials.',
      },
      {
        icon: ShieldCheck,
        title: 'No guarantee',
        body: 'AI picks, confidence scores, projections, odds comparisons and analysis notes can be wrong. Past performance does not predict future results.',
      },
      {
        icon: RefreshCw,
        title: 'Data can change',
        body: 'Odds, injuries, lineups, weather, prices and market conditions can change quickly. Refresh information before making any decision.',
      },
      {
        icon: Scale,
        title: 'Know your laws',
        body: 'Sports betting rules vary by age, state, province and country. You are responsible for following the laws where you live.',
      },
    ],
    sections: [
      {
        title: 'Not financial or legal advice',
        body: 'Nothing on ThinkBetAI should be treated as financial, investment, tax, legal or professional gambling advice. The platform is for informational and educational use.',
      },
      {
        title: 'Model limitations',
        body: 'Models depend on available data, assumptions, timing and market inputs. They cannot account for every injury, coaching decision, officiating call, random event or late-breaking update.',
      },
      {
        title: 'Affiliate and commercial context',
        body: 'Some pages may compare products, discuss sportsbooks or include commercial links. Commercial context should not be read as a guarantee that any product or bet is suitable for you.',
      },
      {
        title: 'Use responsibly',
        body: 'Set limits before considering any wager, avoid chasing losses and seek help if gambling causes stress, debt, secrecy or difficulty stopping.',
      },
    ],
  },
};

interface LegalPageProps {
  page: LegalPageKey;
}

const LegalPage = ({ page }: LegalPageProps) => {
  const content = LEGAL_PAGES[page];

  return (
    <div className="min-h-screen flex flex-col">
      <SEO title={content.metaTitle} description={content.description} url={content.path} />
      <Header />
      <main className="flex-1">
        <div className="container max-w-5xl pt-6">
          <Breadcrumb items={[{ label: content.breadcrumb }]} />
        </div>

        <section className="py-12 md:py-16">
          <div className="container max-w-5xl">
            <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
              {content.eyebrow}
            </Badge>
            <h1 className="mb-5 text-4xl font-bold md:text-5xl">{content.title}</h1>
            <p className="max-w-3xl text-lg leading-relaxed text-muted-foreground">{content.intro}</p>

            <div className="mt-10 grid gap-5 md:grid-cols-2">
              {content.cards.map(({ icon: Icon, title, body }) => (
                <Card key={title}>
                  <CardContent className="p-6">
                    <Icon className="mb-3 h-6 w-6 text-primary" />
                    <h2 className="mb-2 text-xl font-semibold">{title}</h2>
                    <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-8 grid gap-5">
              {content.sections.map((section) => (
                <Card key={section.title}>
                  <CardContent className="p-6 md:p-8">
                    <h2 className="mb-2 text-xl font-semibold">{section.title}</h2>
                    <p className="leading-relaxed text-muted-foreground">{section.body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default LegalPage;
