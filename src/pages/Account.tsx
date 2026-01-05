import { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { MockDataBanner } from '@/components/MockDataBanner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Lock, CreditCard, Star, LogIn } from 'lucide-react';

const Account = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock login - in real app would call auth API
    if (email && password) {
      setIsLoggedIn(true);
    }
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock signup - in real app would call auth API
    if (email && password) {
      setIsLoggedIn(true);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex flex-col">
        <MockDataBanner />
        <Header />
        
        <main className="flex-1 py-8 md:py-16">
          <div className="container max-w-md">
            <div className="text-center mb-8">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 mb-4">
                <User className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Welcome to BetIQ</h1>
              <p className="text-muted-foreground">
                Sign in to save games and access personalized insights.
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
                          />
                        </div>
                      </div>
                      <Button type="submit" variant="hero" className="w-full">
                        <LogIn className="h-4 w-4 mr-2" />
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
                            placeholder="Create a password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                      <Button type="submit" variant="hero" className="w-full">
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
                  <User className="h-5 w-5" />
                  Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-2xl font-bold text-primary-foreground">
                    {email.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{email}</p>
                    <p className="text-sm text-muted-foreground">Member since Jan 2026</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full" onClick={() => setIsLoggedIn(false)}>
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
                  <Badge variant="secondary">Free</Badge>
                </div>
                <CardDescription>
                  Upgrade to access premium features and AI analysis.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-4 border border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="h-5 w-5 text-primary" />
                    <span className="font-semibold">Pro Plan</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Unlimited AI analysis, real-time alerts, and priority data updates.
                  </p>
                  <Button variant="hero" className="w-full">
                    Upgrade to Pro
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Saved Games */}
            <Card variant="glass">
              <CardHeader>
                <CardTitle>Saved Games</CardTitle>
                <CardDescription>
                  Games you've bookmarked for quick access.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <p>No saved games yet.</p>
                  <p className="text-sm">Browse games and save the matchups you want to follow.</p>
                </div>
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
