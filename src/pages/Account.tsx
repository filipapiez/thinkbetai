import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { User as UserIcon, CreditCard, Star, Loader2, Ticket, CheckCircle, Settings, MessageSquare, Trophy } from 'lucide-react';
import { toast } from 'sonner';

const Account = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, profile, isLoading: authLoading, isSubscribed, refreshProfile, signOut } = useAuth();
  
  const [accessCode, setAccessCode] = useState('');
  const [isRedeemingCode, setIsRedeemingCode] = useState(false);
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(false);

  // Check for Stripe checkout success
  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId && user) {
      // Verify subscription after successful checkout
      checkSubscription();
      toast.success('Payment successful! Welcome to ThinkBetAI!');
      // Clear the URL params
      navigate('/account', { replace: true });
    }
  }, [searchParams, user]);

  const checkSubscription = async () => {
    if (!user) return;
    
    setIsCheckingSubscription(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        console.error('Error checking subscription:', error);
        return;
      }
      
      if (data?.subscribed) {
        await refreshProfile();
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    } finally {
      setIsCheckingSubscription(false);
    }
  };

  const handleRedeemCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessCode.trim() || !user) return;
    
    setIsRedeemingCode(true);
    try {
      const { data, error } = await supabase.functions.invoke('redeem-access-code', {
        body: { code: accessCode.trim().toUpperCase() },
      });
      
      if (error) {
        toast.error('Failed to redeem code. Please try again.');
        return;
      }
      
      if (!data?.success) {
        toast.error(data?.error || 'Invalid or expired access code.');
        return;
      }
      
      await refreshProfile();
      toast.success('Access code redeemed! Welcome to ThinkBetAI!');
      setAccessCode('');
    } catch (error) {
      toast.error('An unexpected error occurred.');
    } finally {
      setIsRedeemingCode(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    toast.success('Logged out successfully!');
    navigate('/');
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

  // User has full access - show account dashboard
  if (isSubscribed) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-1 py-8">
          <div className="container max-w-2xl">
            <h1 className="text-3xl font-bold mb-8">Account</h1>

            <div className="space-y-6">
              {/* Profile Card */}
              <Card variant="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserIcon className="h-5 w-5" />
                    Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-2xl font-bold text-primary-foreground">
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="font-medium">{user?.email}</p>
                      <p className="text-sm text-muted-foreground">
                        Member since {new Date(user?.created_at || '').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full" onClick={handleLogout}>
                    Log Out
                  </Button>
                </CardContent>
              </Card>

              {/* Subscription Card */}
              <Card variant="glass">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Subscription
                    </CardTitle>
                    <Badge className="bg-primary/20 text-primary border-primary/30">
                      {profile?.promo_used ? `Code: ${profile.promo_used}` : 
                       profile?.access_type === 'subscription' ? 'Premium' : 'Active'}
                    </Badge>
                  </div>
                  <CardDescription>
                    You have full access to ThinkBetAI.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-4 border border-primary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-primary" />
                      <span className="font-semibold">Access Active</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Enjoy unlimited AI analysis, live data, and personalized insights.
                    </p>
                  </div>
                  <Button variant="outline" className="w-full" onClick={() => navigate('/subscription')}>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Manage Subscription
                  </Button>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card variant="glass">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/games')}>
                    <Trophy className="h-4 w-4 mr-2" />
                    View Live Games
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/chat')}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Chat with AI
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/settings')}>
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  // Logged in but no access - show activation options
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-8 md:py-16">
        <div className="container max-w-lg">
          <div className="text-center mb-8">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 mb-4">
              <Star className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Activate Your Access</h1>
            <p className="text-muted-foreground">
              Welcome, {user?.email}! Choose how to unlock ThinkBetAI.
            </p>
          </div>

          <div className="space-y-6">
            {/* Access Code Card */}
            <Card variant="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="h-5 w-5 text-primary" />
                  Have an Access Code?
                </CardTitle>
                <CardDescription>
                  Enter your code to unlock full access instantly.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRedeemCode} className="space-y-4">
                  <Input
                    type="text"
                    placeholder="Enter access code (e.g. GETIT)"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                    className="uppercase tracking-wider font-mono"
                    disabled={isRedeemingCode}
                  />
                  <Button 
                    type="submit" 
                    variant="hero" 
                    className="w-full" 
                    disabled={isRedeemingCode || !accessCode.trim()}
                  >
                    {isRedeemingCode ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Redeem Code
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Subscription Options */}
            <Card variant="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Subscribe
                </CardTitle>
                <CardDescription>
                  Get full access with a subscription.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="hero" 
                  className="w-full"
                  onClick={() => navigate('/paywall')}
                >
                  View Plans – Starting at $4.99/month
                </Button>
              </CardContent>
            </Card>

            {/* Logout option */}
            <div className="text-center">
              <Button variant="ghost" onClick={handleLogout} className="text-muted-foreground">
                Log out
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Account;
