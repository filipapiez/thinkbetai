import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Lock, Check, Ticket, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

const Paywall = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isSubscribed, refreshProfile, signOut } = useAuth();
  
  const [promoCode, setPromoCode] = useState('');
  const [isRedeemingCode, setIsRedeemingCode] = useState(false);
  const [promoError, setPromoError] = useState('');

  const from = (location.state as any)?.from?.pathname || '/games';

  // If already subscribed, redirect
  if (isSubscribed) {
    navigate(from, { replace: true });
    return null;
  }

  // If not logged in, redirect to login
  if (!user) {
    navigate('/login', { replace: true });
    return null;
  }

  const handleRedeemCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError('');
    
    const trimmedCode = promoCode.trim().toUpperCase();
    if (!trimmedCode) {
      toast.error('Please enter a promo code');
      return;
    }
    
    setIsRedeemingCode(true);
    try {
      const { data, error } = await supabase.functions.invoke('redeem-access-code', {
        body: { code: trimmedCode },
      });
      
      if (error) {
        toast.error('Failed to redeem code. Please try again.');
        return;
      }
      
      if (!data?.success) {
        setPromoError(data?.error || 'Invalid promo code');
        return;
      }
      
      await refreshProfile();
      toast.success('Promo code redeemed! Welcome to ThinkBetAI!');
      navigate(from, { replace: true });
    } catch (error) {
      toast.error('An unexpected error occurred.');
    } finally {
      setIsRedeemingCode(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-8 md:py-16">
        <div className="container max-w-lg">
          {/* Unlock Banner */}
          <div className="mb-6 p-4 rounded-lg bg-primary/10 border border-primary/20 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Lock className="h-5 w-5 text-primary" />
              <span className="font-semibold text-primary">Premium Features Locked</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Unlock full access to AI-powered sports analysis
            </p>
          </div>

          <div className="text-center mb-8">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 mb-4">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Unlock ThinkBetAI</h1>
            <p className="text-muted-foreground">
              Get instant access to Games, AI Analysis, and more.
            </p>
          </div>

          <div className="space-y-6">
            {/* Promo Code Card */}
            <Card variant="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Ticket className="h-5 w-5 text-primary" />
                  Have a Promo Code?
                </CardTitle>
                <CardDescription>
                  Enter your code to unlock full access instantly.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRedeemCode} className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Enter promo code"
                      value={promoCode}
                      onChange={(e) => {
                        setPromoCode(e.target.value.toUpperCase());
                        setPromoError('');
                      }}
                      className={`uppercase tracking-wider font-mono flex-1 ${promoError ? 'border-destructive' : ''}`}
                      disabled={isRedeemingCode}
                    />
                    <Button type="submit" disabled={isRedeemingCode || !promoCode.trim()}>
                      {isRedeemingCode ? 'Unlocking...' : 'Unlock'}
                    </Button>
                  </div>
                  {promoError && (
                    <p className="text-sm text-destructive">{promoError}</p>
                  )}
                </form>
              </CardContent>
            </Card>

            {/* View Pricing Card */}
            <Card variant="glass" className="border-primary/50">
              <CardHeader className="text-center pb-2">
                <Badge className="w-fit mx-auto mb-2">Subscribe</Badge>
                <CardTitle className="text-xl">Choose a Plan</CardTitle>
                <CardDescription>
                  Select the plan that works best for you
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {[
                    'Live game analysis',
                    'AI-powered predictions',
                    'Real-time odds tracking',
                    'Performance charts',
                    'Ask AI chatbot',
                  ].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  variant="hero" 
                  className="w-full" 
                  onClick={() => navigate('/pricing')}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  View Pricing Plans
                </Button>
                
                <p className="text-xs text-center text-muted-foreground">
                  Secure checkout powered by Stripe. Cancel anytime.
                </p>
              </CardContent>
            </Card>

            {/* Already logged in info */}
            <div className="text-center text-sm text-muted-foreground">
              Logged in as <span className="font-medium">{user.email}</span>
              <Button variant="link" className="text-xs p-0 h-auto ml-2" onClick={signOut}>
                Sign out
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Paywall;
