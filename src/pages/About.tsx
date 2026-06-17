import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SEO } from '@/components/SEO';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Link } from 'react-router-dom';
import { 
  Heart, 
  Rocket, 
  Users, 
  Trophy, 
  Target, 
  Sparkles,
  CheckCircle,
  TrendingUp,
  Clock,
  Shield
} from 'lucide-react';

const AboutPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <SEO 
        title="About Us - Our AI Betting Story"
        description="Learn how ThinkBetAI is revolutionizing sports betting with artificial intelligence. Discover our mission, values, and the technology behind our 67% accuracy rate."
        keywords="about ThinkBetAI, AI betting company, sports betting technology, betting predictions team"
        url="/about"
      />
      <Header />
      
      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="container pt-6">
          <Breadcrumb items={[{ label: 'About' }]} />
        </div>
        {/* Hero Section */}
        <section className="py-16 md:py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
          <div className="container max-w-4xl relative">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
                <Heart className="h-3 w-3 mr-1" />
                Our Story
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent">
                3 Years in the Making
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Hey there! We're so glad you found us. After three years of testing, tweaking, 
                and perfecting our system, we're finally ready to share it with you.
              </p>
            </div>
          </div>
        </section>

        {/* The Journey */}
        <section className="py-12 md:py-16">
          <div className="container max-w-4xl">
            <Card className="bg-gradient-to-br from-muted/50 to-muted/20 border-border/50">
              <CardContent className="p-8 md:p-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 rounded-xl bg-primary/20">
                    <Rocket className="h-6 w-6 text-primary" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold">How It All Started</h2>
                </div>
                
                <div className="space-y-6 text-muted-foreground leading-relaxed">
                  <p className="text-lg">
                    Look, we get it. Sports betting can feel like a guessing game. You've probably 
                    been there — staring at odds, second-guessing yourself, wondering if there's 
                    a smarter way to do this. That's exactly where we were three years ago.
                  </p>
                  
                  <p>
                    We started as a small group of sports fans and data nerds who were tired of 
                    making bets based on gut feelings alone. So we asked ourselves: what if we 
                    could use real data, smart algorithms, and years of historical patterns to 
                    find the bets that actually make sense?
                  </p>
                  
                  <p>
                    For three years, we ran our models quietly in the background. We tested 
                    thousands of predictions across every major sport. We tracked what worked, 
                    threw out what didn't, and kept refining until we had something we were 
                    genuinely proud of.
                  </p>
                  
                  <p className="text-foreground font-medium">
                    And now? We're finally ready to share it with you.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* What We Believe */}
        <section className="py-12 md:py-16 bg-muted/20">
          <div className="container max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">What We Believe In</h2>
              <p className="text-muted-foreground">
                These aren't just buzzwords — they're how we built this whole thing.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="group hover:border-primary/50 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="p-3 rounded-xl bg-emerald-500/20 w-fit mb-4 group-hover:scale-110 transition-transform">
                    <Target className="h-6 w-6 text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Quality Over Quantity</h3>
                  <p className="text-muted-foreground">
                    We don't throw 50 picks at you every day. We focus on finding the 
                    bets that truly stand out — the ones where the data says "this is worth it."
                  </p>
                </CardContent>
              </Card>
              
              <Card className="group hover:border-primary/50 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="p-3 rounded-xl bg-blue-500/20 w-fit mb-4 group-hover:scale-110 transition-transform">
                    <Shield className="h-6 w-6 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Transparency First</h3>
                  <p className="text-muted-foreground">
                    We show you exactly why we like a bet. No hidden formulas, no "trust us" 
                    nonsense. You see the data, you make the call.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="group hover:border-primary/50 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="p-3 rounded-xl bg-amber-500/20 w-fit mb-4 group-hover:scale-110 transition-transform">
                    <Clock className="h-6 w-6 text-amber-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Patience Pays Off</h3>
                  <p className="text-muted-foreground">
                    We spent three years testing before launching. That same patience is 
                    what helps find bets that others miss because they're in too much of a rush.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="group hover:border-primary/50 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="p-3 rounded-xl bg-purple-500/20 w-fit mb-4 group-hover:scale-110 transition-transform">
                    <Users className="h-6 w-6 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Built for Real People</h3>
                  <p className="text-muted-foreground">
                    We're not some faceless corporation. We're sports fans just like you, 
                    building something we actually use ourselves.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* The Numbers */}
        <section className="py-12 md:py-16">
          <div className="container max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">The Results Speak</h2>
              <p className="text-muted-foreground">
                After three years of testing, here's where we stand.
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/20">
                <div className="text-3xl md:text-4xl font-bold text-emerald-400 mb-2">80.3%</div>
                <div className="text-sm text-muted-foreground">Avg. Win Rate</div>
              </div>
              <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 border border-blue-500/20">
                <div className="text-3xl md:text-4xl font-bold text-blue-400 mb-2">3</div>
                <div className="text-sm text-muted-foreground">Years Testing</div>
              </div>
              <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 border border-amber-500/20">
                <div className="text-3xl md:text-4xl font-bold text-amber-400 mb-2">6</div>
                <div className="text-sm text-muted-foreground">Sports Covered</div>
              </div>
              <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 border border-purple-500/20">
                <div className="text-3xl md:text-4xl font-bold text-purple-400 mb-2">24/7</div>
                <div className="text-sm text-muted-foreground">Live Odds</div>
              </div>
            </div>
          </div>
        </section>

        {/* What You Get */}
        <section className="py-12 md:py-16 bg-muted/20">
          <div className="container max-w-4xl">
            <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
              <CardContent className="p-8 md:p-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 rounded-xl bg-primary/20">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold">What You Get With Us</h2>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    "AI-powered bet analysis in real-time",
                    "Clear explanations for every recommendation",
                    "Risk assessments you can actually understand",
                    "Live odds from major sportsbooks",
                    "Historical data to back up every pick",
                    "An AI assistant that answers your questions"
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                      <span className="text-muted-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 md:py-24">
          <div className="container max-w-2xl text-center">
            <Trophy className="h-12 w-12 text-amber-400 mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Make Smarter Bets?
            </h2>
            <p className="text-muted-foreground mb-8 text-lg">
              We've done the hard work. Now it's your turn to see what three years 
              of preparation looks like in action.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="gap-2">
                <Link to="/games">
                  <TrendingUp className="h-5 w-5" />
                  View Today's Games
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/pricing">
                  See Pricing
                </Link>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-3 text-sm">
              <Link to="/blog/is-ai-betting-legal" className="text-muted-foreground hover:text-primary transition-colors">Is AI betting legal?</Link>
              <span className="text-border">•</span>
              <Link to="/blog/how-ai-is-used-in-sports-betting" className="text-muted-foreground hover:text-primary transition-colors">How AI is used in betting</Link>
              <span className="text-border">•</span>
              <Link to="/blog/can-ai-predict-sports-outcomes" className="text-muted-foreground hover:text-primary transition-colors">Can AI predict sports?</Link>
              <span className="text-border">•</span>
              <Link to="/blog/ai-betting-myths-vs-reality" className="text-muted-foreground hover:text-primary transition-colors">AI betting myths vs reality</Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default AboutPage;