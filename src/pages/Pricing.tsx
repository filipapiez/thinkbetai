import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SEO } from '@/components/SEO';
import { Check, Zap, Crown, Trophy, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
// Stripe price IDs for each plan
const pricingPlans = [
  {
    id: 'basic',
    priceId: 'price_1Sn2CkQrqKHReEDtvJ6iR1gz',
    name: 'Basic',
    price: 49,
    description: 'Perfect for casual fans looking to understand odds better',
    icon: Zap,
    features: [
      'Access to all sports coverage',
      'Basic odds explanations',
      'Injury reports',
      'Recent form analysis',
      'Email support',
    ],
    cta: 'Get Started',
    popular: false,
  },
  {
    id: 'pro',
    priceId: 'price_1Sn2EBQrqKHReEDtxXgWQBQL',
    name: 'Pro',
    price: 89,
    description: 'For serious enthusiasts who want deeper insights',
    icon: Crown,
    features: [
      'Everything in Basic',
      'AI-powered game analysis',
      'Risk/volatility assessments',
      'Line movement tracking',
      'Head-to-head history',
      'Performance charts',
      'Priority support',
    ],
    cta: 'Go Pro',
    popular: true,
  },
  {
    id: 'insider',
    priceId: 'price_1Sn2DhQrqKHReEDtr8LCdEXA',
    name: 'Insider',
    price: 299,
    description: 'The ultimate package for dedicated analysts',
    icon: Trophy,
    features: [
      'Everything in Pro',
      'Real-time odds updates',
      'Advanced statistical models',
      'Custom alerts & notifications',
      'API access for data export',
      'Exclusive Discord community',
      'One-on-one consultation',
      'Early access to new features',
    ],
    cta: 'Become an Insider',
    popular: false,
  },
];

const Pricing = () => {
  const navigate = useNavigate();
  const { user, isSubscribed, session } = useAuth();
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);

  const handleSelectPlan = async (plan: typeof pricingPlans[0]) => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: '/pricing' } } });
      return;
    }

    if (!session?.access_token) {
      toast.error('Please log in to continue');
      return;
    }

    setLoadingPlanId(plan.id);

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId: plan.priceId },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Checkout error:', error);
        toast.error('Failed to start checkout. Please try again.');
        return;
      }

      if (data?.url) {
        // Open Stripe Checkout in new tab
        window.open(data.url, '_blank');
      } else {
        toast.error('No checkout URL received');
      }
    } catch (err) {
      console.error('Checkout exception:', err);
      toast.error('An unexpected error occurred');
    } finally {
      setLoadingPlanId(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SEO 
        title="Pricing - AI Betting Plans"
        description="Choose the perfect ThinkBetAI plan for your betting strategy. Get AI-powered predictions, real-time analysis, and expert insights starting at $49/month."
        keywords="AI betting subscription, sports betting plans, betting software pricing, AI predictions cost"
        url="/pricing"
      />
      <Header />
      
      <main className="flex-1 py-16">
        <div className="container">
          {/* Header */}
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">Pricing</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Choose Your <span className="text-gradient">Plan</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get access to powerful insights and analytics to make more informed decisions.
              No hidden fees. Cancel anytime.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan) => {
              const Icon = plan.icon;
              return (
                <Card 
                  key={plan.id}
                  className={`relative flex flex-col ${
                    plan.popular 
                      ? 'border-primary shadow-lg shadow-primary/20 scale-105' 
                      : 'border-border'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center pb-2">
                    <div className={`mx-auto h-14 w-14 rounded-full flex items-center justify-center mb-4 ${
                      plan.popular ? 'bg-primary/20' : 'bg-muted'
                    }`}>
                      <Icon className={`h-7 w-7 ${plan.popular ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  
                  <CardContent className="flex-1 flex flex-col">
                    <div className="text-center mb-6">
                      <span className="text-5xl font-bold">${plan.price}</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>

                    <ul className="space-y-3 mb-8 flex-1">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button 
                      onClick={() => handleSelectPlan(plan)}
                      variant={plan.popular ? 'default' : 'outline'}
                      size="lg"
                      className="w-full"
                      disabled={isSubscribed || loadingPlanId === plan.id}
                    >
                      {loadingPlanId === plan.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : isSubscribed ? (
                        'Already Subscribed'
                      ) : (
                        plan.cta
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* FAQ Section */}
          <div className="mt-20 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
            <div className="space-y-6">
              <div className="glass-card p-6">
                <h3 className="font-semibold mb-2">Can I cancel anytime?</h3>
                <p className="text-muted-foreground text-sm">
                  Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.
                </p>
              </div>
              <div className="glass-card p-6">
                <h3 className="font-semibold mb-2">Is this betting advice?</h3>
                <p className="text-muted-foreground text-sm">
                  No. This platform provides educational content and data analysis. We do not provide betting advice or guarantee any outcomes.
                </p>
              </div>
              <div className="glass-card p-6">
                <h3 className="font-semibold mb-2">What sports do you cover?</h3>
                <p className="text-muted-foreground text-sm">
                  We cover NBA, NFL, MLB, NHL, Tennis, Table Tennis, and Soccer with more sports being added regularly.
                </p>
              </div>
              <div className="glass-card p-6">
                <h3 className="font-semibold mb-2">Is there an AI betting platform?</h3>
                <p className="text-muted-foreground text-sm">
                  Yes! ThinkBetAI is a leading AI betting platform. Learn more in our detailed{' '}
                  <Link to="/blog/is-there-an-ai-betting-platform" className="text-primary hover:underline">AI betting FAQ</Link>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Pricing;
