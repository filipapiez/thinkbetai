import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle, ArrowRight, Sparkles, BarChart3, MessageSquare, Loader2 } from 'lucide-react';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const { user, refreshProfile, profile } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(true);

  useEffect(() => {
    const refresh = async () => {
      await refreshProfile();
      setIsRefreshing(false);
    };
    refresh();
  }, [refreshProfile]);

  const nextSteps = [
    {
      icon: BarChart3,
      title: 'Explore Games',
      description: 'Browse upcoming games with AI-powered analysis and real-time odds.',
      action: () => navigate('/games'),
      buttonText: 'View Games',
    },
    {
      icon: MessageSquare,
      title: 'Ask AI',
      description: 'Chat with our AI assistant for personalized betting insights.',
      action: () => navigate('/chat'),
      buttonText: 'Start Chat',
    },
    {
      icon: Sparkles,
      title: 'Account Settings',
      description: 'Manage your subscription and account preferences.',
      action: () => navigate('/account'),
      buttonText: 'View Account',
    },
  ];

  if (isRefreshing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Activating your subscription...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Success Banner */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/20 mb-6">
              <CheckCircle className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Payment Successful!</h1>
            <p className="text-xl text-muted-foreground">
              Welcome to ThinkBetAI! Your {profile?.access_type || 'premium'} subscription is now active.
            </p>
            {user?.email && (
              <p className="text-sm text-muted-foreground mt-2">
                A confirmation email has been sent to <span className="font-medium">{user.email}</span>
              </p>
            )}
          </div>

          {/* Subscription Details */}
          <Card variant="glass" className="mb-8 border-primary/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Your Subscription
              </CardTitle>
              <CardDescription>Here's what you now have access to</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span>AI-powered game analysis and predictions</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span>Real-time odds tracking across sportsbooks</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span>Ask AI chatbot for personalized insights</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span>Injury reports and team statistics</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span>Value bet identification</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <h2 className="text-2xl font-semibold mb-6">Get Started</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {nextSteps.map((step) => (
              <Card key={step.title} variant="glass" className="hover:border-primary/50 transition-colors">
                <CardHeader className="pb-2">
                  <step.icon className="h-8 w-8 text-primary mb-2" />
                  <CardTitle className="text-lg">{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{step.description}</p>
                  <Button onClick={step.action} variant="outline" className="w-full">
                    {step.buttonText}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center mt-12">
            <Button onClick={() => navigate('/games')} size="lg" className="px-8">
              Start Exploring Games
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PaymentSuccess;
