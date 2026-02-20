import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { 
  Brain, 
  TrendingUp, 
  Target, 
  Zap, 
  Shield, 
  BarChart3, 
  CheckCircle2, 
  ArrowRight,
  Clock,
  Trophy,
  Sparkles,
  LineChart,
  Users,
  Star
} from "lucide-react";

const AISportsPicks = () => {
  const sports = [
    { name: "NFL", icon: "🏈", accuracy: "88.2%" },
    { name: "NBA", icon: "🏀", accuracy: "85.7%" },
    { name: "MLB", icon: "⚾", accuracy: "82.2%" },
    { name: "NHL", icon: "🏒", accuracy: "80.6%" },
    { name: "UFC/MMA", icon: "🥊", accuracy: "88.5%" },
    { name: "Soccer", icon: "⚽", accuracy: "81.9%" },
    { name: "Tennis", icon: "🎾", accuracy: "84.6%" },
    { name: "Table Tennis", icon: "🏓", accuracy: "81.6%" },
  ];

  const features = [
    {
      icon: Brain,
      title: "Advanced AI Analysis",
      description: "Our proprietary machine learning models analyze thousands of data points including player stats, team performance, injuries, weather, and historical matchups."
    },
    {
      icon: Target,
      title: "High-Confidence Picks Only",
      description: "We only surface picks that meet our strict confidence threshold. Quality over quantity means better outcomes for you."
    },
    {
      icon: BarChart3,
      title: "Real-Time Odds Tracking",
      description: "Live odds from multiple sportsbooks, line movement tracking, and value identification to help you find the best betting opportunities."
    },
    {
      icon: Shield,
      title: "Risk Assessment",
      description: "Every pick comes with a detailed risk analysis including variance metrics, historical volatility, and situational factors."
    },
    {
      icon: Zap,
      title: "Instant Notifications",
      description: "Get notified the moment a high-value pick is identified. Never miss an opportunity with real-time alerts."
    },
    {
      icon: LineChart,
      title: "Performance Tracking",
      description: "Transparent tracking of all picks with detailed analytics, win rates by sport, and ROI calculations."
    }
  ];

  const howItWorks = [
    {
      step: "1",
      title: "Data Collection",
      description: "Our AI continuously ingests data from hundreds of sources including live stats, injury reports, weather conditions, and betting markets."
    },
    {
      step: "2",
      title: "Pattern Recognition",
      description: "Advanced machine learning models identify profitable patterns and inefficiencies in betting lines that human analysts often miss."
    },
    {
      step: "3",
      title: "Confidence Scoring",
      description: "Each potential pick is scored based on multiple factors. Only picks exceeding our 70% confidence threshold are surfaced."
    },
    {
      step: "4",
      title: "Delivery & Explanation",
      description: "You receive the pick with a full AI-generated explanation of the reasoning, key factors, and risk assessment."
    }
  ];

  const testimonials = [
    {
      quote: "The AI picks have completely changed how I approach sports betting. The explanations help me understand why each pick makes sense.",
      author: "Marcus T.",
      role: "Member since 2024",
      rating: 5
    },
    {
      quote: "Finally, an AI betting tool that actually delivers. The 83%+ win rate on qualified picks is incredible.",
      author: "Jennifer K.",
      role: "Premium Member",
      rating: 5
    },
    {
      quote: "I love how transparent they are with their tracking. Every pick is documented and you can see exactly how they perform.",
      author: "David R.",
      role: "Member since 2023",
      rating: 5
    }
  ];

  // Structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "ThinkBetAI - AI Sports Picks",
    "applicationCategory": "SportsApplication",
    "description": "AI-powered sports betting picks and predictions. Get high-confidence picks for NFL, NBA, MLB, NHL, UFC, Soccer, Tennis and more with detailed AI analysis.",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "description": "Free trial available"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "1247",
      "bestRating": "5",
      "worstRating": "1"
    },
    "featureList": [
      "AI-powered sports predictions",
      "Real-time odds tracking",
      "Multi-sport coverage",
      "Detailed pick explanations",
      "Performance analytics"
    ]
  };

  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What are AI sports picks?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "AI sports picks are betting predictions generated by machine learning algorithms that analyze vast amounts of sports data including player statistics, team performance, injuries, weather conditions, and historical trends to identify high-probability betting opportunities."
        }
      },
      {
        "@type": "Question",
        "name": "How accurate are AI sports betting predictions?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Our AI sports picks achieve an 83.8% win rate on qualified picks that meet our strict confidence threshold. Accuracy varies by sport, with NFL and UFC achieving the highest rates above 88%."
        }
      },
      {
        "@type": "Question",
        "name": "Which sports does ThinkBetAI cover?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "ThinkBetAI provides AI-powered picks for NFL, NBA, MLB, NHL, UFC/MMA, Soccer, Tennis, and Table Tennis. We continuously analyze games across all major sports leagues worldwide."
        }
      },
      {
        "@type": "Question",
        "name": "Is using AI for sports betting legal?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, using AI tools and analytics for sports betting research is completely legal. AI betting assistants simply help you make more informed decisions - the actual betting remains your choice and must comply with your local gambling laws."
        }
      }
    ]
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO 
        title="AI Sports Picks | #1 Free AI Betting Predictions 2026 - ThinkBetAI"
        description="🏆 Get winning AI sports picks with 83.8% accuracy. Free daily NFL, NBA, MLB, NHL & UFC predictions powered by machine learning. Join 10,000+ bettors using AI-powered sports betting analysis."
        keywords="AI sports picks, AI sports predictions, AI betting picks, machine learning sports betting, AI NFL picks, AI NBA picks, free sports predictions, AI betting algorithm, sports betting AI, best AI sports picks, AI betting predictions 2026"
        url="/ai-sports-picks"
        canonical="https://thinkbetai.com/ai-sports-picks"
        structuredData={structuredData}
      />
      
      {/* Additional FAQ structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />
      
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-16 md:py-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
          
          <div className="container relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <Badge variant="outline" className="mb-6 px-4 py-1.5 text-sm border-primary/30 bg-primary/5">
                <Sparkles className="h-3.5 w-3.5 mr-1.5 text-primary" />
                83.8% Win Rate on Qualified Picks
              </Badge>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                AI Sports Picks That{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary">
                  Actually Win
                </span>
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                <Link to="/login?tab=signup" className="text-primary hover:underline font-medium">Get AI picks today</Link> — free daily AI-powered sports predictions backed by advanced machine learning. 
                Our algorithms analyze millions of data points to surface only the highest-confidence picks.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <Button size="lg" className="text-base px-8" asChild>
                  <Link to="/pricing">
                    Get AI Picks Now
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="text-base px-8" asChild>
                  <Link to="/picks">
                    View Today's Picks
                  </Link>
                </Button>
              </div>
              
              {/* Trust indicators */}
              <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <span>10,000+ active users</span>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-accent" />
                  <span>Verified track record</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Sports Coverage Section */}
        <section className="py-16 bg-card/30">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                AI Picks for Every Major Sport
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Our AI models are trained on sport-specific data to maximize accuracy. 
                Get predictions for all the sports you care about.
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {sports.map((sport) => (
                <div 
                  key={sport.name}
                  className="flex flex-col items-center p-6 rounded-xl bg-background border border-border/50 hover:border-primary/50 transition-colors"
                >
                  <span className="text-4xl mb-3">{sport.icon}</span>
                  <h3 className="font-semibold mb-1">{sport.name}</h3>
                  <span className="text-sm text-primary font-medium">{sport.accuracy} accuracy</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 md:py-24">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Why Our AI Sports Picks Stand Out
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Built by data scientists and sports analysts, our <Link to="/ai-sports-betting" className="text-primary hover:underline font-medium">AI sports betting platform</Link> combines cutting-edge 
                machine learning with deep sports knowledge. Use our <Link to="/ai-bet-analyzer" className="text-primary hover:underline font-medium">AI bet analyzer</Link> for even deeper analysis.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className="p-6 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all hover:shadow-lg"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-16 bg-gradient-to-b from-background to-card/50">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                How Our AI Generates Sports Picks
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                A transparent look at the technology behind our predictions
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {howItWorks.map((step, index) => (
                <div key={index} className="relative">
                  <div className="text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold mx-auto mb-4">
                      {step.step}
                    </div>
                    <h3 className="font-semibold mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                  {index < howItWorks.length - 1 && (
                    <div className="hidden lg:block absolute top-7 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16">
          <div className="container">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              <div className="text-center p-6 rounded-xl bg-card border border-border/50">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">83.8%</div>
                <div className="text-sm text-muted-foreground">Win Rate</div>
              </div>
              <div className="text-center p-6 rounded-xl bg-card border border-border/50">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">487+</div>
                <div className="text-sm text-muted-foreground">Qualified Picks</div>
              </div>
              <div className="text-center p-6 rounded-xl bg-card border border-border/50">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">8</div>
                <div className="text-sm text-muted-foreground">Sports Covered</div>
              </div>
              <div className="text-center p-6 rounded-xl bg-card border border-border/50">
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">24/7</div>
                <div className="text-sm text-muted-foreground">AI Monitoring</div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-16 bg-card/30">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                What Our Members Say
              </h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {testimonials.map((testimonial, index) => (
                <div 
                  key={index}
                  className="p-6 rounded-xl bg-background border border-border/50"
                >
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4 italic">"{testimonial.quote}"</p>
                  <div>
                    <div className="font-semibold">{testimonial.author}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16">
          <div className="container">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">
                Frequently Asked Questions About AI Sports Picks
              </h2>
              
              <div className="space-y-6">
                <div className="p-6 rounded-xl bg-card border border-border/50">
                  <h3 className="font-semibold mb-2">What are AI sports picks?</h3>
                  <p className="text-muted-foreground text-sm">
                    AI sports picks are betting predictions generated by machine learning algorithms that analyze 
                    vast amounts of sports data including player statistics, team performance, injuries, weather 
                    conditions, and historical trends to identify high-probability betting opportunities.
                  </p>
                </div>
                
                <div className="p-6 rounded-xl bg-card border border-border/50">
                  <h3 className="font-semibold mb-2">How accurate are AI sports betting predictions?</h3>
                  <p className="text-muted-foreground text-sm">
                    Our AI sports picks achieve an 83.8% win rate on qualified picks that meet our strict 
                    confidence threshold. Accuracy varies by sport, with NFL and UFC achieving the highest 
                    rates above 88%.
                  </p>
                </div>
                
                <div className="p-6 rounded-xl bg-card border border-border/50">
                  <h3 className="font-semibold mb-2">Which sports does ThinkBetAI cover?</h3>
                  <p className="text-muted-foreground text-sm">
                    ThinkBetAI provides AI-powered picks for NFL, NBA, MLB, NHL, UFC/MMA, Soccer, Tennis, 
                    and Table Tennis. We continuously analyze games across all major sports leagues worldwide.
                  </p>
                </div>
                
                <div className="p-6 rounded-xl bg-card border border-border/50">
                  <h3 className="font-semibold mb-2">Is using AI for sports betting legal?</h3>
                  <p className="text-muted-foreground text-sm">
                    Yes, using AI tools and analytics for sports betting research is completely legal. AI 
                    betting assistants simply help you make more informed decisions - the actual betting 
                    remains your choice and must comply with your local gambling laws.
                  </p>
                </div>
                
                <div className="p-6 rounded-xl bg-card border border-border/50">
                  <h3 className="font-semibold mb-2">How do I get started with AI sports picks?</h3>
                  <p className="text-muted-foreground text-sm">
                    Simply create a free account to access our daily AI picks. For full access to all features, 
                    detailed analysis, and real-time notifications, upgrade to a premium subscription.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Start Winning with AI Sports Picks Today
              </h2>
              <p className="text-muted-foreground mb-8">
                Join thousands of sports bettors who trust our AI to find the best betting opportunities. 
                No credit card required to start.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="text-base px-8" asChild>
                  <Link to="/pricing">
                    Get Started Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="text-base px-8" asChild>
                  <Link to="/faq">
                    Learn More
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default AISportsPicks;
