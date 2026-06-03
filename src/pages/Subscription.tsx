import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CreditCard, Calendar, CheckCircle, ExternalLink, AlertCircle, Ticket, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface SubscriptionDetails {
  subscribed: boolean;
  product_id: string | null;
  subscription_end: string | null;
}

const Subscription = () => {
  const navigate = useNavigate();
  const { user, profile, isLoading: authLoading, isSubscribed, refreshProfile } = useAuth();
  
  const [subscriptionDetails, setSubscriptionDetails] = useState<SubscriptionDetails | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSubscriptionDetails();
    }
  }, [user]);

  const fetchSubscriptionDetails = async () => {
    setIsLoadingDetails(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        console.error('Error fetching subscription:', error);
        return;
      }
      
      setSubscriptionDetails(data);
      await refreshProfile();
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleManageSubscription = async () => {
    setIsOpeningPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) {
        toast.error('Failed to open subscription management');
        console.error('Portal error:', error);
        return;
      }
      
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      toast.error('Something went wrong');
      console.error('Portal error:', error);
    } finally {
      setIsOpeningPortal(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getPlanName = () => {
    if (profile?.promo_used) return 'Promo Access';
    if (profile?.access_type === 'subscription') return 'Pro Plan';
    if (profile?.access_type === 'one_time') return 'Lifetime Access';
    return 'Free';
  };

  const hasStripeSubscription = subscriptionDetails?.subscribed && profile?.access_type === 'subscription';
  const hasPromoAccess = profile?.promo_used && profile?.has_access;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-8">
        <div className="container max-w-2xl">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">Subscription</h1>
            <Button variant="outline" onClick={() => navigate('/account')}>
              Back to Account
            </Button>
          </div>

          <div className="space-y-6">
            {/* Current Plan Card */}
            <Card variant="glass">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Current Plan
                  </CardTitle>
                  <Badge 
                    className={isSubscribed 
                      ? "bg-primary/20 text-primary border-primary/30" 
                      : "bg-muted text-muted-foreground"
                    }
                  >
                    {isSubscribed ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingDetails ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : isSubscribed ? (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-4 border border-primary/20">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle className="h-5 w-5 text-primary" />
                        <span className="font-semibold text-lg">{getPlanName()}</span>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        {hasPromoAccess && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Ticket className="h-4 w-4" />
                            <span>Code: {profile?.promo_used}</span>
                          </div>
                        )}
                        
                        {subscriptionDetails?.subscription_end && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>Renews on {formatDate(subscriptionDetails.subscription_end)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="h-4 w-4 text-primary" />
                        <span>Unlimited AI analysis</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="h-4 w-4 text-primary" />
                        <span>Live game data</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="h-4 w-4 text-primary" />
                        <span>Personalized insights</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="h-4 w-4 text-primary" />
                        <span>Priority support</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground mb-4">
                      You don't have an active subscription
                    </p>
                    <Button variant="hero" onClick={() => navigate('/pricing')}>
                      View Plans
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Manage Subscription Card - Only show for Stripe subscribers */}
            {hasStripeSubscription && (
              <Card variant="glass">
                <CardHeader>
                  <CardTitle>Manage Subscription</CardTitle>
                  <CardDescription>
                    Update payment method, change plan, or cancel your subscription
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={handleManageSubscription}
                    disabled={isOpeningPortal}
                  >
                    {isOpeningPortal ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <ExternalLink className="h-4 w-4 mr-2" />
                    )}
                    Open Billing Portal
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    You'll be redirected to our secure billing portal
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Upgrade/Change Plan - Only show if not subscribed or has promo access */}
            {(!hasStripeSubscription || hasPromoAccess) && isSubscribed && (
              <Card variant="glass">
                <CardHeader>
                  <CardTitle>Upgrade Your Plan</CardTitle>
                  <CardDescription>
                    Get more features with a paid subscription
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    variant="hero" 
                    className="w-full"
                    onClick={() => navigate('/pricing')}
                  >
                    View Available Plans
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Billing History Note */}
            {hasStripeSubscription && (
              <Card variant="glass">
                <CardHeader>
                  <CardTitle>Billing History</CardTitle>
                  <CardDescription>
                    View past invoices and payment history
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Access your complete billing history through the billing portal above.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Subscription;
