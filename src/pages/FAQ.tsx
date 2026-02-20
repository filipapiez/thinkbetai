import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Breadcrumb } from '@/components/Breadcrumb';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { HelpCircle, Sparkles, Shield, DollarSign, TrendingUp, Users, Zap, ArrowRight } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqData: FAQItem[] = [
  // AI & Technology
  {
    category: 'AI & Technology',
    question: 'What is AI betting and how does ThinkBetAI work?',
    answer: 'AI betting uses artificial intelligence and machine learning algorithms to analyze vast amounts of sports data and generate predictions. ThinkBetAI processes historical game data, player statistics, injury reports, weather conditions, and real-time odds from multiple sportsbooks to provide data-driven insights for sports betting decisions.'
  },
  {
    category: 'AI & Technology',
    question: 'How accurate are AI betting predictions?',
    answer: 'ThinkBetAI achieves approximately 67% accuracy on qualified bets across major sports. However, accuracy varies by sport and bet type. Our AI continuously learns from new data to improve predictions. Remember that no prediction system is perfect, and past performance does not guarantee future results.'
  },
  {
    category: 'AI & Technology',
    question: 'What sports does ThinkBetAI cover?',
    answer: 'ThinkBetAI covers all major sports including NFL football, NBA basketball, MLB baseball, NHL hockey, UFC/MMA, soccer (Premier League, La Liga, Champions League), tennis, golf, and college sports. Our AI analyzes data across 15+ sports leagues worldwide.'
  },
  {
    category: 'AI & Technology',
    question: 'How does machine learning improve betting predictions?',
    answer: 'Machine learning algorithms identify patterns in historical data that humans might miss. Our models analyze thousands of variables including team performance trends, player matchups, situational factors, and market movements. The AI updates its models after each game, continuously refining its predictions.'
  },
  {
    category: 'AI & Technology',
    question: 'What data sources does the AI use for predictions?',
    answer: 'ThinkBetAI aggregates data from official league statistics, real-time injury reports, weather services, betting market odds from 20+ sportsbooks, historical game outcomes, player tracking data, and social sentiment analysis. This comprehensive approach ensures well-rounded predictions.'
  },
  // Getting Started
  {
    category: 'Getting Started',
    question: 'How do I get started with ThinkBetAI?',
    answer: 'Getting started is easy: 1) Create a free account, 2) Choose a subscription plan that fits your needs, 3) Browse upcoming games and view AI analysis, 4) Use our confidence ratings to inform your decisions. Our AI Chat feature also lets you ask specific questions about any game or betting strategy.'
  },
  {
    category: 'Getting Started',
    question: 'What subscription plans are available?',
    answer: 'We offer various plans starting at $49/month with full access to all sports coverage, AI analysis, and features like injury reports and real-time odds tracking. Visit our pricing page to see all available options.'
  },
  {
    category: 'Getting Started',
    question: 'What devices can I use ThinkBetAI on?',
    answer: 'ThinkBetAI works on any device with a web browser - desktop computers, laptops, tablets, and smartphones. Our responsive design ensures a great experience whether you\'re at home or checking predictions on the go.'
  },
  // Betting Strategy
  {
    category: 'Betting Strategy',
    question: 'What is value betting and how does AI find value?',
    answer: 'Value betting occurs when the probability of an outcome is higher than what the bookmaker\'s odds suggest. Our AI calculates true probabilities based on comprehensive data analysis, then compares these to market odds. When AI probability exceeds implied probability plus the house margin, that\'s a value bet.'
  },
  {
    category: 'Betting Strategy',
    question: 'How should I use AI predictions for parlays?',
    answer: 'For parlays, we recommend: 1) Only include bets with 60%+ AI confidence, 2) Limit to 2-3 legs maximum, 3) Look for correlated outcomes, 4) Never risk more than 5% of your bankroll on any parlay. Our AI Parlay Analysis feature evaluates multi-bet combinations for optimal selection.'
  },
  {
    category: 'Betting Strategy',
    question: 'What bankroll management do you recommend?',
    answer: 'We recommend: 1) Never bet money you can\'t afford to lose, 2) Use 1-2% of your bankroll per standard bet, 3) Increase to 2-3% only for high-confidence AI picks, 4) Never exceed 5% on any single bet, 5) Track all bets and review performance monthly. Proper bankroll management is essential for long-term success.'
  },
  {
    category: 'Betting Strategy',
    question: 'Should I bet on every AI recommendation?',
    answer: 'No. AI predictions are tools to inform your decisions, not guarantees. We recommend focusing on bets where AI confidence is 60% or higher, the sport/league is familiar to you, and you\'ve done your own research. Quality over quantity leads to better long-term results.'
  },
  // Subscription & Billing
  {
    category: 'Subscription & Billing',
    question: 'What subscription plans are available?',
    answer: 'We offer three plans: Basic ($49/month) with access to all sports and basic analysis, Pro ($89/month) with AI-powered game analysis and advanced features, and Elite ($149/month) with everything plus priority support and exclusive insights. All plans include cancel-anytime flexibility.'
  },
  {
    category: 'Subscription & Billing',
    question: 'Can I cancel my subscription anytime?',
    answer: 'Yes, you can cancel your subscription at any time with no cancellation fees. Your access continues until the end of your current billing period. We don\'t believe in locking users into long-term contracts.'
  },
  {
    category: 'Subscription & Billing',
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, Mastercard, American Express, Discover) through our secure Stripe payment processing. Your payment information is encrypted and never stored on our servers.'
  },
  // Responsible Gambling
  {
    category: 'Responsible Gambling',
    question: 'Is ThinkBetAI a sportsbook or betting site?',
    answer: 'No. ThinkBetAI is an educational analytics platform that provides information and AI-powered insights. We do not accept bets, process wagers, or handle any gambling transactions. You use our analysis to make informed decisions at your own chosen, legal sportsbook.'
  },
  {
    category: 'Responsible Gambling',
    question: 'What responsible gambling resources do you provide?',
    answer: 'We encourage responsible gambling and provide links to resources including the National Council on Problem Gambling (ncpgambling.org), Gamblers Anonymous (gamblersanonymous.org), and the 1-800-522-4700 helpline. Remember: never bet more than you can afford to lose, and gambling should be entertainment, not a source of income.'
  },
  {
    category: 'Responsible Gambling',
    question: 'Are there age restrictions for using ThinkBetAI?',
    answer: 'You must be 21 years or older (or the legal gambling age in your jurisdiction) to use ThinkBetAI. While we don\'t facilitate betting directly, our content is intended for adults who may use the information for legal sports wagering where permitted.'
  }
];

// Generate FAQ structured data for SEO
const generateFAQStructuredData = () => {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqData.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  };
};

// Group FAQs by category
const groupedFAQs = faqData.reduce((acc, faq) => {
  if (!acc[faq.category]) {
    acc[faq.category] = [];
  }
  acc[faq.category].push(faq);
  return acc;
}, {} as Record<string, FAQItem[]>);

const categoryIcons: Record<string, React.ReactNode> = {
  'AI & Technology': <Sparkles className="h-5 w-5" />,
  'Getting Started': <Zap className="h-5 w-5" />,
  'Betting Strategy': <TrendingUp className="h-5 w-5" />,
  'Subscription & Billing': <DollarSign className="h-5 w-5" />,
  'Responsible Gambling': <Shield className="h-5 w-5" />
};

const FAQ = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO 
        title="FAQ - AI Betting Questions Answered"
        description="Get answers to common questions about AI betting, machine learning predictions, sports analytics, and how ThinkBetAI helps you make smarter betting decisions."
        keywords="AI betting FAQ, sports betting questions, machine learning predictions FAQ, betting tips, ThinkBetAI help"
        url="/faq"
        structuredData={generateFAQStructuredData()}
      />
      
      <Header />
      
      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="container max-w-4xl pt-8">
          <Breadcrumb items={[{ label: 'FAQ' }]} />
        </div>
        
        {/* Hero Section */}
        <section className="py-16 md:py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
          <div className="container max-w-4xl relative">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
                <HelpCircle className="h-3 w-3 mr-1" />
                Help Center
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                Frequently Asked <span className="text-gradient">Questions</span>
              </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to know about AI betting predictions, our platform, and how to get started.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link to="/blog/is-there-an-ai-betting-platform" className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors">Is there an AI betting platform?</Link>
              <Link to="/blog/is-ai-betting-legal" className="px-3 py-1.5 rounded-full bg-muted text-muted-foreground text-sm font-medium hover:text-foreground transition-colors">Is AI betting legal?</Link>
              <Link to="/blog/can-ai-predict-sports-outcomes" className="px-3 py-1.5 rounded-full bg-muted text-muted-foreground text-sm font-medium hover:text-foreground transition-colors">Can AI predict sports?</Link>
              <Link to="/blog/ai-betting-myths-vs-reality" className="px-3 py-1.5 rounded-full bg-muted text-muted-foreground text-sm font-medium hover:text-foreground transition-colors">AI betting myths vs reality</Link>
            </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
              <div className="text-center p-4 rounded-xl bg-card/50 border border-border/50">
                <div className="text-2xl font-bold text-primary">67%</div>
                <div className="text-sm text-muted-foreground">AI Accuracy</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-card/50 border border-border/50">
                <div className="text-2xl font-bold text-primary">15+</div>
                <div className="text-sm text-muted-foreground">Sports Covered</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-card/50 border border-border/50">
                <div className="text-2xl font-bold text-primary">50K+</div>
                <div className="text-sm text-muted-foreground">Games Analyzed</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-card/50 border border-border/50">
                <div className="text-2xl font-bold text-primary">24/7</div>
                <div className="text-sm text-muted-foreground">AI Updates</div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Content */}
        <section className="py-12 md:py-16">
          <div className="container max-w-4xl">
            {Object.entries(groupedFAQs).map(([category, faqs]) => (
              <div key={category} className="mb-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    {categoryIcons[category]}
                  </div>
                  <h2 className="text-2xl font-bold">{category}</h2>
                </div>
                
                <Accordion type="single" collapsible className="space-y-3">
                  {faqs.map((faq, index) => (
                    <AccordionItem 
                      key={index} 
                      value={`${category}-${index}`}
                      className="bg-card/50 border border-border/50 rounded-xl px-6 data-[state=open]:bg-card"
                    >
                      <AccordionTrigger className="text-left hover:no-underline py-5">
                        <span className="font-medium pr-4">{faq.question}</span>
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-transparent to-card/50">
          <div className="container max-w-4xl text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Users className="h-4 w-4" />
              Join thousands of smart bettors
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Still have questions?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-xl mx-auto">
              Try our AI Chat to get instant answers, or start exploring our predictions today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link to="/chat">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Ask AI Chat
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/games">
                  View Games
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default FAQ;
