import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Lock, Loader2, CheckCircle, ArrowLeft, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [passwordUpdated, setPasswordUpdated] = useState(false);

  // Check if user came from password reset email
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      // If there's a session and we have a type=recovery in URL or hash
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const type = hashParams.get('type') || searchParams.get('type');
      
      if (session && type === 'recovery') {
        setIsUpdateMode(true);
      }
    };
    
    checkSession();

    // Listen for auth state changes (for when user clicks email link)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsUpdateMode(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [searchParams]);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      emailSchema.parse(email);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
    }
    
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) {
        toast.error('Failed to send reset email. Please try again.');
        return;
      }
      
      setEmailSent(true);
    } catch (error) {
      toast.error('An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      passwordSchema.parse(newPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
    }
    
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      
      if (error) {
        toast.error('Failed to update password. Please try again.');
        return;
      }
      
      setPasswordUpdated(true);
      toast.success('Password updated successfully!');
      
      // Redirect to login after a delay
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      toast.error('An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  // Success state after password update
  if (passwordUpdated) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-1 py-8 md:py-16">
          <div className="container max-w-md">
            <Card variant="glass">
              <CardContent className="pt-6 text-center">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 mb-4">
                  <CheckCircle className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-xl font-bold mb-2">Password Updated!</h2>
                <p className="text-muted-foreground mb-6">
                  Your password has been successfully updated. Redirecting to login...
                </p>
                <Button onClick={() => navigate('/login')} className="w-full">
                  Go to Login
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  // Update password form (when user clicked email link)
  if (isUpdateMode) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-1 py-8 md:py-16">
          <div className="container max-w-md">
            <div className="text-center mb-8">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 mb-4">
                <KeyRound className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Set New Password</h1>
              <p className="text-muted-foreground">
                Enter your new password below.
              </p>
            </div>

            <Card variant="glass">
              <CardContent className="pt-6">
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="new-password"
                        type="password"
                        placeholder="Enter new password (min 6 chars)"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
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
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10"
                        disabled={isLoading}
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" variant="hero" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Update Password
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  // Email sent success state
  if (emailSent) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-1 py-8 md:py-16">
          <div className="container max-w-md">
            <Card variant="glass">
              <CardContent className="pt-6 text-center">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 mb-4">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-xl font-bold mb-2">Check Your Email</h2>
                <p className="text-muted-foreground mb-6">
                  We've sent a password reset link to <strong>{email}</strong>. 
                  Click the link in the email to reset your password.
                </p>
                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setEmailSent(false)}
                  >
                    Try a different email
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full"
                    onClick={() => navigate('/login')}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Login
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  // Request reset form
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-8 md:py-16">
        <div className="container max-w-md">
          <Button 
            variant="ghost" 
            className="mb-6"
            onClick={() => navigate('/login')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Login
          </Button>

          <div className="text-center mb-8">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 mb-4">
              <KeyRound className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Forgot Password?</h1>
            <p className="text-muted-foreground">
              No worries! Enter your email and we'll send you a reset link.
            </p>
          </div>

          <Card variant="glass">
            <CardContent className="pt-6">
              <form onSubmit={handleRequestReset} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
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
                <Button type="submit" variant="hero" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4 mr-2" />
                  )}
                  Send Reset Link
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ResetPassword;
