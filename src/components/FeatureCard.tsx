import { LucideIcon } from 'lucide-react';
import { forwardRef } from 'react';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  delay?: number;
}

export const FeatureCard = forwardRef<HTMLDivElement, FeatureCardProps>(({ icon: Icon, title, description, delay = 0 }, ref) => {
  return (
    <div 
      ref={ref}
      className="group relative overflow-hidden rounded-2xl bg-card/50 border border-border/50 p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-lg animate-slide-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 text-primary transition-transform duration-300 group-hover:scale-110">
          <Icon className="h-6 w-6" />
        </div>
        
        <h3 className="mb-2 text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </div>
  );
});

FeatureCard.displayName = 'FeatureCard';
