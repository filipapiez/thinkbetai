import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SEO } from '@/components/SEO';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Check, Zap, Crown, Trophy, Star, TrendingUp, Shield } from 'lucide-react';
import { useWinRate } from '@/hooks/useWinRate';
import { useAuth } from '@/contexts/AuthContext';
import { EmbeddedCheckoutDialog } from '@/components/EmbeddedCheckoutDialog';

// Stripe price IDs for each plan
const pricingPlans = [
  {
    id: 'basic',
    priceId: 'price_1SpOpRQrqKHReEDtP3WD1zne',
    name: 'Basic',
    price: 4.99,
    originalPrice: 16.99,
    description: 'Perfect for casual fans looking to understand odds better',
    icon: Zap,
    features: [
      'Access to all sports coverage',
      'Basic AI game analysis',
      'Injury reports & player status',
      'Recent form analysis',
      'Team stats & standings',
      'Basic parlay insights',
      'Daily game previews',
      'Email support',
    ],
    cta: 'Get Started',
    popular: false,
  },
  {
    id: 'pro',
    priceId: 'price_1SpOqPQrqKHReEDtqHZcLsbY',
    name: 'Pro',
    price: 13.99,
    originalPrice: 49.99,
    description: 'For serious enthusiasts who want deeper insights',
    icon: Crown,
    features: [
      'Everything in Basic',
      'AI-powered game analysis',
      'Risk/volatility assessments',
      'Line movement tracking',
      'Head-to-head history',
      'Performance charts',
      'AI Parlay analysis',
      'Weather & venue impact data',
      'Betting trends & public %',
      'Priority support',
    ],
    cta: 'Go Pro',
    popular: true,
  },
  {
    id: 'insider',
    priceId: 'price_1Sn2CkQrqKHReEDtvJ6iR1gz',
    name: 'Insider',
    price: 49,
    originalPrice: 163,
    description: 'The ultimate package for dedicated analysts',
    icon: Trophy,
    features: [
      'Everything in Pro',
      'Real-time odds updates',
      'Advanced statistical models',
      'Custom alerts & notifications',
      'Exclusive Discord community',
      'One-on-one consultation',
      'AI Parlay Builder & analysis',
      'Early access to upgraded features',
      'Multi-leg parlay optimization',
    ],
    cta: 'Become an Insider',
    popular: false,
  },
];

const Pricing = () => {
  const navigate = useNavigate();
  const { user, isSubscribed, profile } = useAuth();
  const { winRate } = useWinRate();
  const [selectedPlan, setSelectedPlan] = useState<typeof pricingPlans[0] | null>(null);

  // Determine user's current plan tier
  const currentPlanId = profile?.access_type || null; // 'basic', 'pro', 'insider'
  const tierOrder = ['basic', 'pro', 'insider'];
  const currentTierIndex = currentPlanId ? tierOrder.indexOf(currentPlanId) : -1;

  const handleSelectPlan = (plan: typeof pricingPlans[0]) => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: '/pricing' } } });
      return;
    }

    // Use Stripe Payment Links with client_reference_id for webhook matching
    const paymentLinks: Record<string, string> = {
      basic: 'https://buy.stripe.com/aFa14g5xL34efPZdvb0oM03',
      pro: 'https://buy.stripe.com/7sY28k9O1fR033d3UB0oM01',
      insider: 'https://buy.stripe.com/14A7sE0dr9sC7jt9eV0oM00',
    };
    if (paymentLinks[plan.id]) {
      let url = paymentLinks[plan.id];
      if (user?.id) {
        url += `?client_reference_id=${user.id}`;
      }
      window.open(url, '_blank');
      return;
    }

    setSelectedPlan(plan);
  };

  const handleCheckoutClose = () => {
    setSelectedPlan(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background via-background to-primary/5">
      <SEO 
        title="Pricing - AI Betting Plans"
        description="Choose the perfect ThinkBetAI plan for your betting strategy. Get AI-powered predictions, real-time analysis, and expert insights starting at $4.99/month."
        keywords="AI betting subscription, sports betting plans, betting software pricing, AI predictions cost"
        url="/pricing"
      />
      <Header />
      
      <main className="flex-1 py-12 md:py-20">
        <div className="container">
          {/* Breadcrumb */}
          <Breadcrumb items={[{ label: 'Pricing' }]} className="mb-8" />
          
          {/* Header */}
          <div className="text-center mb-8 md:mb-16">
            <Badge variant="outline" className="mb-4 border-primary/50 text-primary">
              <Star className="h-3 w-3 mr-1 fill-primary" />
              Trusted by 1,000+ Bettors
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Pick Your <span className="text-gradient">Winning</span> Plan
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
              Join thousands making smarter decisions with AI-powered insights.
              Cancel anytime.
            </p>
            
            {/* Social Proof Stats */}
            <div className="inline-flex items-center gap-4 sm:gap-8 py-4 px-6 bg-card/50 backdrop-blur-sm rounded-2xl border border-border/50">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-success flex items-center justify-center gap-1">
                  <TrendingUp className="h-5 w-5" />
                  80.35%
                </div>
                <div className="text-xs text-muted-foreground">Win Rate</div>
              </div>
              <div className="h-10 w-px bg-border" />
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-primary">1,000+</div>
                <div className="text-xs text-muted-foreground">Verified Picks</div>
              </div>
              <div className="h-10 w-px bg-border hidden sm:block" />
              <div className="text-center hidden sm:block">
                <div className="text-2xl sm:text-3xl font-bold text-accent flex items-center justify-center gap-1">
                  <Check className="h-5 w-5" />
                  Instant
                </div>
                <div className="text-xs text-muted-foreground">Access</div>
              </div>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-4 max-w-6xl mx-auto items-stretch">
            {pricingPlans.map((plan, index) => {
              const Icon = plan.icon;
              const isPopular = plan.popular;
              
              return (
                <Card 
                  key={plan.id}
                  className={`relative flex flex-col overflow-hidden transition-all duration-300 hover:scale-[1.02] ${
                    isPopular 
                      ? 'border-2 border-primary shadow-2xl shadow-primary/20 lg:scale-105 lg:z-10 bg-gradient-to-b from-card to-primary/5' 
                      : 'border-border hover:border-primary/50 hover:shadow-xl'
                  }`}
                >
                  {/* Popular Badge */}
                  {isPopular && (
                    <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-primary to-accent py-2 text-center">
                      <span className="text-sm font-semibold text-primary-foreground flex items-center justify-center gap-1">
                        <Crown className="h-4 w-4" />
                        Most Popular
                      </span>
                    </div>
                  )}
                  
                  <CardHeader className={`text-center pb-2 ${isPopular ? 'pt-12' : ''}`}>
                    <div className={`mx-auto h-16 w-16 rounded-2xl flex items-center justify-center mb-4 ${
                      isPopular 
                        ? 'bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/30' 
                        : 'bg-muted'
                    }`}>
                      <Icon className={`h-8 w-8 ${isPopular ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                    </div>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription className="min-h-[40px]">{plan.description}</CardDescription>
                  </CardHeader>
                  
                  <CardContent className="flex-1 flex flex-col">
                    {/* Price */}
                    <div className="text-center mb-6 py-4 rounded-xl bg-muted/50">
                      <span className="inline-block mb-2 text-xs font-semibold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                        Save 70%
                      </span>
                      <div className="flex items-baseline justify-center gap-2">
                        <span className="text-lg text-muted-foreground line-through">${plan.originalPrice}</span>
                        <div className="flex items-baseline">
                          <span className="text-lg text-muted-foreground">$</span>
                          <span className="text-5xl font-bold text-success">{plan.price}</span>
                          <span className="text-muted-foreground">/mo</span>
                        </div>
                      </div>
                      {plan.id === 'insider' && (
                        <p className="text-xs text-success mt-1">Best value for serious analysts</p>
                      )}
                      {plan.id === 'pro' && (
                        <p className="text-xs text-primary mt-1">Most popular choice</p>
                      )}
                    </div>

                    {/* Features */}
                    <ul className="space-y-3 mb-8 flex-1">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start gap-3">
                          <div className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                            isPopular ? 'bg-primary/20' : 'bg-muted'
                          }`}>
                            <Check className={`h-3 w-3 ${isPopular ? 'text-primary' : 'text-muted-foreground'}`} />
                          </div>
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA Button */}
                    {(() => {
                      const planTierIndex = tierOrder.indexOf(plan.id);
                      const isCurrentPlan = isSubscribed && plan.id === currentPlanId;
                      const isLowerPlan = isSubscribed && currentTierIndex >= 0 && planTierIndex <= currentTierIndex && !isCurrentPlan;
                      
                      return (
                        <Button 
                          onClick={() => handleSelectPlan(plan)}
                          variant={isCurrentPlan ? 'outline' : isPopular ? 'hero' : 'outline'}
                          size="lg"
                          className={`w-full ${isPopular && !isCurrentPlan ? 'shadow-lg shadow-primary/30' : ''} ${isCurrentPlan ? 'border-primary/50' : ''}`}
                          disabled={isCurrentPlan || isLowerPlan}
                        >
                          {isCurrentPlan ? '✓ Your Plan' : isLowerPlan ? 'Current or Lower' : plan.cta}
                        </Button>
                      );
                    })()}
                    
                    {/* Trust text */}
                    <p className="text-xs text-center text-muted-foreground mt-3">
                      Cancel anytime
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-6 mt-12 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-success" />
              <span>Secure Checkout</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-success" />
              <span>Instant Access</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-success" />
              <span>24/7 Support</span>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-20 max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
              Frequently Asked <span className="text-gradient">Questions</span>
            </h2>
            <div className="space-y-4">
              {[
                {
                  q: 'Can I cancel anytime?',
                  a: "Yes, you can cancel your subscription at any time. Contact our 24/7 support team for cancellation, and you'll continue to have access until the end of your billing cycle."
                },
                {
                  q: 'Is this betting advice?',
                  a: 'No. This platform provides educational content and data analysis. We do not provide betting advice or guarantee any outcomes.'
                },
                {
                  q: 'What sports do you cover?',
                  a: 'We cover NBA, NFL, MLB, NHL, Tennis, Table Tennis, and Soccer with more sports being added regularly.'
                },
                {
                  q: 'Is there an AI betting platform?',
                  a: 'Yes! ThinkBetAI is a leading AI betting platform.'
                }
              ].map((faq, i) => (
                <div key={i} className="glass-card p-5 rounded-xl hover:border-primary/30 transition-colors">
                  <h3 className="font-semibold mb-2">{faq.q}</h3>
                  <p className="text-muted-foreground text-sm">
                    {faq.a}
                    {i === 3 && (
                      <> Learn more in our detailed{' '}
                        <Link to="/blog/is-there-an-ai-betting-platform" className="text-primary hover:underline">
                          AI betting FAQ
                        </Link>.
                      </>
                    )}
                  </p>
                </div>
              ))}
            </div>
            
            {/* Educational Links */}
            <div className="mt-10 text-center p-6 bg-card/50 rounded-2xl border border-border/50">
              <p className="text-sm text-muted-foreground mb-4">Learn more about AI betting:</p>
              <div className="flex flex-wrap justify-center gap-3 text-sm">
                <Link to="/blog/is-ai-betting-legal" className="px-3 py-1.5 rounded-full bg-muted hover:bg-primary/20 hover:text-primary transition-colors">
                  Is AI betting legal?
                </Link>
                <Link to="/blog/how-ai-is-used-in-sports-betting" className="px-3 py-1.5 rounded-full bg-muted hover:bg-primary/20 hover:text-primary transition-colors">
                  How AI is used
                </Link>
                <Link to="/blog/can-ai-predict-sports-outcomes" className="px-3 py-1.5 rounded-full bg-muted hover:bg-primary/20 hover:text-primary transition-colors">
                  Can AI predict sports?
                </Link>
                <Link to="/blog/ai-betting-myths-vs-reality" className="px-3 py-1.5 rounded-full bg-muted hover:bg-primary/20 hover:text-primary transition-colors">
                  Myths vs reality
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Embedded Checkout Dialog */}
      {selectedPlan && (
        <EmbeddedCheckoutDialog
          isOpen={!!selectedPlan}
          onClose={handleCheckoutClose}
          priceId={selectedPlan.priceId}
          planName={selectedPlan.name}
        />
      )}
    </div>
  );
};

export default Pricing;
