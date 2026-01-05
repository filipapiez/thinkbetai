import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { mockAIExplanation } from '@/lib/mockData';

interface AIExplanationCardProps {
  gameId: string;
}

export const AIExplanationCard = ({ gameId }: AIExplanationCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);

  const handleGenerateExplanation = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setExplanation(mockAIExplanation);
    setIsExpanded(true);
    setIsLoading(false);
  };

  return (
    <Card variant="glass" className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <span>AI Analysis</span>
          <span className="text-xs font-normal text-muted-foreground ml-auto">What this means</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!explanation ? (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground mb-4">
              Get an AI-powered breakdown of this matchup based on available data.
            </p>
            <Button 
              variant="hero" 
              onClick={handleGenerateExplanation}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="animate-pulse">Analyzing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Analysis
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div 
              className={`prose prose-sm prose-invert max-w-none transition-all duration-300 overflow-hidden ${
                isExpanded ? 'max-h-none' : 'max-h-48'
              }`}
            >
              <div className="text-sm leading-relaxed whitespace-pre-wrap">
                {explanation.split('\n').map((line, index) => {
                  if (line.startsWith('## ')) {
                    return (
                      <h3 key={index} className="text-primary font-semibold mt-4 mb-2 text-base">
                        {line.replace('## ', '')}
                      </h3>
                    );
                  }
                  if (line.startsWith('- **')) {
                    const match = line.match(/- \*\*(.*?)\*\*: (.*)/);
                    if (match) {
                      return (
                        <p key={index} className="ml-4 mb-1">
                          <span className="font-semibold text-foreground">{match[1]}:</span>{' '}
                          <span className="text-muted-foreground">{match[2]}</span>
                        </p>
                      );
                    }
                  }
                  if (line.startsWith('- ')) {
                    return (
                      <p key={index} className="ml-4 mb-1 text-muted-foreground">
                        • {line.replace('- ', '')}
                      </p>
                    );
                  }
                  if (line.startsWith('*')) {
                    return (
                      <p key={index} className="text-xs text-muted-foreground italic mt-4 pt-4 border-t border-border">
                        {line.replace(/\*/g, '')}
                      </p>
                    );
                  }
                  return line.trim() && (
                    <p key={index} className="text-muted-foreground mb-2">{line}</p>
                  );
                })}
              </div>
            </div>

            {!isExpanded && (
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-card to-transparent pointer-events-none" />
            )}

            <Button 
              variant="ghost" 
              className="w-full"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <>Show Less <ChevronUp className="h-4 w-4 ml-1" /></>
              ) : (
                <>Read Full Analysis <ChevronDown className="h-4 w-4 ml-1" /></>
              )}
            </Button>

            {/* Disclaimer */}
            <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 flex gap-2">
              <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
              <p className="text-xs text-warning/80">
                This analysis is generated from available data and is for informational purposes only. 
                It is not betting advice. No guarantees are made about outcomes.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
