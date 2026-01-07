import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { MockDataBanner } from '@/components/MockDataBanner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { User as UserIcon, Mail, Lock, CreditCard, Star, LogIn, Loader2, Ticket, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';

// Validation schemas
const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');
const codeSchema = z.string().min(1, 'Please enter an access code').max(50, 'Code is too long');

interface Profile {
  id: string;
  user_id: string;
  email: string | null;
  has_access: boolean;
  access_type: string | null;
  created_at: string;
  updated_at: string;
}

const Account = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRedeemingCode, setIsRedeemingCode] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Fetch user profile
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      return data as Profile;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsInitializing(false);
        
        // Fetch profile after auth state change
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id).then(setProfile);
          }, 0);
        } else {
          setProfile(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsInitializing(false);
      
      if (session?.user) {
        fetchProfile(session.user.id).then(setProfile);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const validateInputs = (): boolean => {
    try {
      emailSchema.parse(email);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return false;
      }
    }
    
    try {
      passwordSchema.parse(password);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return false;
      }
    }
    
    return true;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateInputs()) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Invalid email or password. Please try again.');
        } else if (error.message.includes('Email not confirmed')) {
          toast.error('Please check your email to confirm your account.');
        } else {
          toast.error('Login failed. Please try again.');
        }
        return;
      }
      
      toast.success('Logged in successfully!');
      setEmail('');
      setPassword('');
    } catch (error) {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateInputs()) return;
    
    setIsLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });
      
      if (error) {
        if (error.message.includes('already registered')) {
          toast.error('This email is already registered. Please log in instead.');
        } else if (error.message.includes('Password')) {
          toast.error('Password does not meet requirements. Use at least 6 characters.');
        } else {
          toast.error('Sign up failed. Please try again.');
        }
        return;
      }
      
      toast.success('Account created! You can now activate your access.');
      setEmail('');
      setPassword('');
    } catch (error) {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error('Logout failed. Please try again.');
        return;
      }
      toast.success('Logged out successfully!');
    } catch (error) {
      toast.error('An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRedeemCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      codeSchema.parse(accessCode.trim());
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
    }
    
    if (!user) {
      toast.error('Please log in first');
      return;
    }
    
    setIsRedeemingCode(true);
    try {
      // Check if code exists and is active
      const { data: codeData, error: codeError } = await supabase
        .from('access_codes')
        .select('*')
        .eq('code', accessCode.trim().toUpperCase())
        .eq('is_active', true)
        .single();
      
      if (codeError || !codeData) {
        toast.error('Invalid or expired access code.');
        return;
      }
      
      // Check max uses if set
      if (codeData.max_uses !== null && codeData.current_uses >= codeData.max_uses) {
        toast.error('This code has reached its maximum usage limit.');
        return;
      }
      
      // Update user profile with access
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          has_access: true,
          access_type: 'free_code',
        })
        .eq('user_id', user.id);
      
      if (updateError) {
        toast.error('Failed to activate access. Please try again.');
        return;
      }
      
      // Increment code usage
      await supabase
        .from('access_codes')
        .update({ current_uses: codeData.current_uses + 1 })
        .eq('id', codeData.id);
      
      // Refresh profile
      const updatedProfile = await fetchProfile(user.id);
      setProfile(updatedProfile);
      
      toast.success('Access code redeemed! Welcome to ThinkBetAI!');
      setAccessCode('');
    } catch (error) {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsRedeemingCode(false);
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen flex flex-col">
        <MockDataBanner />
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  // Not logged in - show login/signup
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <MockDataBanner />
        <Header />
        
        <main className="flex-1 py-8 md:py-16">
          <div className="container max-w-md">
            <div className="text-center mb-8">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 mb-4">
                <UserIcon className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Welcome to ThinkBetAI</h1>
              <p className="text-muted-foreground">
                Sign in to access AI-powered sports analysis.
              </p>
            </div>

            <Card variant="glass">
              <CardContent className="pt-6">
                <Tabs defaultValue="login" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="login">Log In</TabsTrigger>
                    <TabsTrigger value="signup">Sign Up</TabsTrigger>
                  </TabsList>

                  <TabsContent value="login">
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="email"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="pl-10"
                            disabled={isLoading}
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="pl-10"
                            disabled={isLoading}
                            required
                          />
                        </div>
                      </div>
                      <Button type="submit" variant="hero" className="w-full" disabled={isLoading}>
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <LogIn className="h-4 w-4 mr-2" />
                        )}
                        Log In
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="signup">
                    <form onSubmit={handleSignUp} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="signup-email"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="pl-10"
                            disabled={isLoading}
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="signup-password"
                            type="password"
                            placeholder="Create a password (min 6 chars)"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="pl-10"
                            disabled={isLoading}
                            required
                          />
                        </div>
                      </div>
                      <Button type="submit" variant="hero" className="w-full" disabled={isLoading}>
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : null}
                        Create Account
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  // Logged in but no access - show activation options
  if (!profile?.has_access) {
    return (
      <div className="min-h-screen flex flex-col">
        <MockDataBanner />
        <Header />
        
        <main className="flex-1 py-8 md:py-16">
          <div className="container max-w-lg">
            <div className="text-center mb-8">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 mb-4">
                <Star className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Activate Your Access</h1>
              <p className="text-muted-foreground">
                Welcome, {user.email}! Choose how to unlock ThinkBetAI.
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
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="Enter access code"
                        value={accessCode}
                        onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                        className="uppercase tracking-wider font-mono"
                        disabled={isRedeemingCode}
                      />
                    </div>
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
                    Choose a plan that fits your needs.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-between h-auto py-4"
                    onClick={() => navigate('/pricing')}
                  >
                    <div className="flex flex-col items-start">
                      <span className="font-semibold">Basic</span>
                      <span className="text-sm text-muted-foreground">Essential features</span>
                    </div>
                    <span className="text-lg font-bold">$49</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-between h-auto py-4 border-primary/50 bg-primary/5"
                    onClick={() => navigate('/pricing')}
                  >
                    <div className="flex flex-col items-start">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">Pro</span>
                        <Badge variant="secondary" className="text-xs">Popular</Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">Advanced analytics</span>
                    </div>
                    <span className="text-lg font-bold">$99</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-between h-auto py-4"
                    onClick={() => navigate('/pricing')}
                  >
                    <div className="flex flex-col items-start">
                      <span className="font-semibold">Insider</span>
                      <span className="text-sm text-muted-foreground">Full access + priority support</span>
                    </div>
                    <span className="text-lg font-bold">$299</span>
                  </Button>
                </CardContent>
              </Card>

              {/* Logout option */}
              <div className="text-center">
                <Button 
                  variant="ghost" 
                  onClick={handleLogout}
                  disabled={isLoading}
                  className="text-muted-foreground"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Log out
                </Button>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  // Full access - show account dashboard
  return (
    <div className="min-h-screen flex flex-col">
      <MockDataBanner />
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
                    {user.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="font-medium">{user.email}</p>
                    <p className="text-sm text-muted-foreground">
                      Member since {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={handleLogout}
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
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
                    {profile?.access_type === 'free_code' ? 'Access Code' : 
                     profile?.access_type === 'basic' ? 'Basic' :
                     profile?.access_type === 'pro' ? 'Pro' :
                     profile?.access_type === 'insider' ? 'Insider' : 'Active'}
                  </Badge>
                </div>
                <CardDescription>
                  You have full access to ThinkBetAI.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-4 border border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <span className="font-semibold">Access Active</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Enjoy unlimited AI analysis, live data, and personalized insights.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card variant="glass">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/games')}>
                  View Live Games
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/chat')}>
                  Chat with AI
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/settings')}>
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
};

export default Account;