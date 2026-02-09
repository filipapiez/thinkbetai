import { useEffect, useRef, useState } from 'react';
import { Brain, LineChart, Target, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface FeatureItemProps {
  number: string;
  icon: React.ElementType;
  title: string;
  description: string;
  delay: number;
  isVisible: boolean;
}

const FeatureItem = ({ number, icon: Icon, title, description, delay, isVisible }: FeatureItemProps) => {
  return (
    <div 
      className={cn(
        "group relative",
        "opacity-0 translate-y-8",
        isVisible && "animate-feature-slide-in"
      )}
      style={{ 
        animationDelay: `${delay}ms`,
        animationFillMode: 'forwards'
      }}
    >
      {/* Floating background orb */}
      <div className="absolute -top-4 -left-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative bg-card/60 backdrop-blur-sm border border-border/50 rounded-2xl p-6 md:p-8 hover:border-primary/40 transition-all duration-500 hover:shadow-lg hover:shadow-primary/5 overflow-hidden">
        {/* Animated gradient line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Number badge with pulse effect */}
        <div className="relative inline-flex mb-4">
          <span className="absolute inset-0 bg-primary/20 rounded-full blur-md animate-pulse" />
          <div className="relative flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30">
            <span className="text-lg font-bold text-primary">{number}</span>
          </div>
        </div>

        {/* Icon with float animation */}
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 mb-4 group-hover:scale-110 transition-transform duration-300">
          <Icon className="h-7 w-7 text-primary animate-float" style={{ animationDelay: `${delay * 2}ms` }} />
        </div>

        <h3 className="text-xl md:text-2xl font-bold mb-3 group-hover:text-primary transition-colors duration-300">
          {title}
        </h3>
        
        <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
          {description}
        </p>

        {/* Corner sparkle */}
        <Sparkles className="absolute top-4 right-4 h-4 w-4 text-primary/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
    </div>
  );
};

const WhyThinkBetAI = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const features = [
    {
      number: '1',
      icon: Brain,
      title: 'Intelligent Data Processing',
      description: 'ThinkBetAI leverages advanced AI models to analyze thousands of historical and real-time data points across leagues, teams, and player performance. By continuously evaluating patterns, trends, and probabilities, the platform uncovers opportunities that are often missed through manual research.',
    },
    {
      number: '2',
      icon: LineChart,
      title: 'Actionable, Data-Driven Insights',
      description: 'Our system transforms complex analytics into clear, structured predictions and insights. Each recommendation is supported by measurable data, allowing you to quickly understand the reasoning behind every pick without spending hours reviewing statistics yourself.',
    },
    {
      number: '3',
      icon: Target,
      title: 'Smarter, Strategy-Focused Decision Making',
      description: 'With AI-powered analysis at your fingertips, you can approach betting with a disciplined, data-first strategy. ThinkBetAI helps users reduce emotional decision-making, stay consistent, and make more informed choices over time.',
    },
  ];

  return (
    <section 
      ref={sectionRef}
      className="py-16 md:py-24 border-t border-border/40 relative overflow-hidden"
    >
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 -right-1/4 w-[400px] h-[400px] bg-accent/5 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
      </div>

      <div className="container relative">
        <div className="text-center mb-12 md:mb-16">
          <Badge 
            variant="outline" 
            className={cn(
              "px-4 py-1.5 mb-4 border-primary/30 text-primary opacity-0",
              isVisible && "animate-fade-in"
            )}
            style={{ animationFillMode: 'forwards' }}
          >
            <Brain className="h-3.5 w-3.5 mr-2" />
            Why ThinkBetAI
          </Badge>
          
          <h2 
            className={cn(
              "text-3xl md:text-4xl lg:text-5xl font-bold mb-4 opacity-0",
              isVisible && "animate-fade-in"
            )}
            style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}
          >
            The <span className="text-gradient">Smart Edge</span> You Need
          </h2>
          
          <p 
            className={cn(
              "text-lg text-muted-foreground max-w-2xl mx-auto opacity-0",
              isVisible && "animate-fade-in"
            )}
            style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}
          >
            Powered by cutting-edge AI, designed for winning results
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <FeatureItem
              key={feature.number}
              {...feature}
              delay={300 + index * 150}
              isVisible={isVisible}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyThinkBetAI;
