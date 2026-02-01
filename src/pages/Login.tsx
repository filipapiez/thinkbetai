import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SEO } from '@/components/SEO';
import { User as UserIcon, Mail, Lock, LogIn, Loader2, Ticket } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');
const nameSchema = z.string().min(1, 'This field is required').max(50, 'Name is too long');

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isSubscribed, refreshProfile } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [promoError, setPromoError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/games';

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (isSubscribed) {
        navigate(from, { replace: true });
      } else {
        navigate('/pricing', { replace: true });
      }
    }
  }, [user, isSubscribed, navigate, from]);

  const validateInputs = (isSignup = false): boolean => {
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

    if (isSignup) {
      if (password !== confirmPassword) {
        toast.error('Passwords do not match');
        return false;
      }
      try {
        nameSchema.parse(firstName.trim());
      } catch (error) {
        if (error instanceof z.ZodError) {
          toast.error('First name is required');
          return false;
        }
      }
      try {
        nameSchema.parse(lastName.trim());
      } catch (error) {
        if (error instanceof z.ZodError) {
          toast.error('Last name is required');
          return false;
        }
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
          toast.error('Invalid email or password.');
        } else {
          toast.error('Login failed. Please try again.');
        }
        return;
      }
      
      toast.success('Logged in successfully!');
    } catch (error) {
      toast.error('An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInputs(true)) return;
    
    // Clear previous promo error
    setPromoError('');
    
    setIsLoading(true);
    try {
      // Use server-side signup with promo validation
      const { data, error } = await supabase.functions.invoke('signup-with-promo', {
        body: {
          email: email.trim(),
          password,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          promoCode: promoCode.trim(),
        },
      });
      
      // Handle errors - edge function returns error in data when status is 400
      const errorMessage = error?.message || data?.error;
      if (errorMessage) {
        if (errorMessage === 'Invalid promo code') {
          setPromoError('Invalid promo code');
        } else if (errorMessage.includes('already registered')) {
          toast.error('This email is already registered. Please log in instead.');
        } else {
          toast.error(errorMessage);
        }
        return;
      }
      
      // Sign in the user after successful signup
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      
      if (signInError) {
        toast.error('Account created but failed to sign in. Please log in manually.');
        return;
      }
      
      if (data?.isPro) {
        toast.success('Account created with PRO access!');
      } else {
        toast.success('Account created! Choose a plan to get started.');
      }
    } catch (error) {
      toast.error('An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SEO 
        title="Login - Access AI Betting Predictions"
        description="Sign in to ThinkBetAI to access AI-powered sports betting predictions, real-time analysis, and expert picks for all major sports."
        keywords="ThinkBetAI login, sports betting login, AI predictions access"
        url="/login"
      />
      <Header />
      
      <main className="flex-1 py-8 md:py-16">
        <div className="container max-w-md">
          {/* Unlock Banner */}
          <div className="mb-6 p-4 rounded-lg bg-primary/10 border border-primary/20 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Lock className="h-4 w-4 text-primary" />
              <span className="font-semibold text-primary">Premium Features Locked</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Sign in or create an account to unlock. <a href="/pricing" className="text-primary hover:underline">View our plans</a>
            </p>
          </div>

          <div className="text-center mb-8">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 mb-4">
              <UserIcon className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Unlock ThinkBetAI</h1>
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
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="link"
                        className="text-sm text-muted-foreground px-0 h-auto"
                        onClick={() => navigate('/reset-password')}
                      >
                        Forgot password?
                      </Button>
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
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="first-name">First Name</Label>
                        <Input
                          id="first-name"
                          type="text"
                          placeholder="John"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          disabled={isLoading}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last-name">Last Name</Label>
                        <Input
                          id="last-name"
                          type="text"
                          placeholder="Doe"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          disabled={isLoading}
                          required
                        />
                      </div>
                    </div>
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
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="confirm-password"
                          type="password"
                          placeholder="Confirm your password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="pl-10"
                          disabled={isLoading}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="promo-code" className="flex items-center gap-2">
                        <Ticket className="h-4 w-4 text-muted-foreground" />
                        Promo Code (optional)
                      </Label>
                      <Input
                        id="promo-code"
                        type="text"
                        placeholder="Enter promo code"
                        value={promoCode}
                        onChange={(e) => {
                          setPromoCode(e.target.value.toUpperCase());
                          setPromoError('');
                        }}
                        className={`uppercase tracking-wider font-mono ${promoError ? 'border-destructive' : ''}`}
                        disabled={isLoading}
                      />
                      {promoError && (
                        <p className="text-sm text-destructive">{promoError}</p>
                      )}
                    </div>
                    <Button type="submit" variant="hero" className="w-full" disabled={isLoading}>
                      {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Create Account
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground mt-6">
            By signing up, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Login;
