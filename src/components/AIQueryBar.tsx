import { useState } from 'react';
import { Send, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface AIInsight {
  type: 'positive' | 'negative' | 'neutral';
  text: string;
}

interface AIQueryBarProps {
  gameId: string;
}

// Mock AI responses based on query keywords
const generateMockResponse = (query: string): AIInsight[] => {
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes('injury') || lowerQuery.includes('injuries')) {
    return [
      { type: 'negative', text: 'Lakers missing Anthony Davis (knee) - major impact on paint presence' },
      { type: 'negative', text: 'D\'Angelo Russell questionable - playmaking concerns' },
      { type: 'positive', text: 'Celtics are fully healthy with all starters available' },
      { type: 'neutral', text: 'Injury advantage clearly favors Boston in this matchup' },
    ];
  }
  
  if (lowerQuery.includes('home') || lowerQuery.includes('away') || lowerQuery.includes('court')) {
    return [
      { type: 'positive', text: 'Lakers have strong home court advantage (7-3 last 10 home games)' },
      { type: 'negative', text: 'Celtics are dominant on the road (8-2 last 10 away)' },
      { type: 'neutral', text: 'Home court may be less impactful given Celtics\' road success' },
    ];
  }
  
  if (lowerQuery.includes('odds') || lowerQuery.includes('spread') || lowerQuery.includes('line')) {
    return [
      { type: 'negative', text: 'Lakers are underdogs at +145, implying only 40.8% win probability' },
      { type: 'positive', text: 'Spread of +4.5 suggests a competitive game expected' },
      { type: 'neutral', text: 'Line has moved slightly toward Lakers since opening' },
    ];
  }
  
  if (lowerQuery.includes('win') || lowerQuery.includes('chance') || lowerQuery.includes('predict')) {
    return [
      { type: 'positive', text: 'Celtics have won 4 of last 5 games - strong momentum' },
      { type: 'negative', text: 'Lakers have lost 3 of last 5 - struggling recently' },
      { type: 'positive', text: 'Head-to-head favors Celtics (3-2 in last 5 meetings)' },
      { type: 'neutral', text: 'Data suggests Celtics have edge, but NBA games are unpredictable' },
    ];
  }
  
  if (lowerQuery.includes('rest') || lowerQuery.includes('fatigue') || lowerQuery.includes('back')) {
    return [
      { type: 'positive', text: 'Both teams have 2+ days rest - no fatigue concerns' },
      { type: 'positive', text: 'Neither team is on a back-to-back' },
      { type: 'neutral', text: 'Rest factor is neutral for this matchup' },
    ];
  }
  
  // Default response
  return [
    { type: 'positive', text: 'Celtics showing strong recent form with 4-1 in last 5' },
    { type: 'negative', text: 'Lakers dealing with key injury concerns' },
    { type: 'positive', text: 'Game features two historic franchises - high entertainment value' },
    { type: 'neutral', text: 'Risk level is medium due to injury uncertainties' },
  ];
};

export const AIQueryBar = ({ gameId }: AIQueryBarProps) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState<AIInsight[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    const response = generateMockResponse(query);
    setInsights(response);
    setIsLoading(false);
  };

  const handleQuickQuestion = async (question: string) => {
    setQuery(question);
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1200));
    const response = generateMockResponse(question);
    setInsights(response);
    setIsLoading(false);
  };

  return (
    <div className="space-y-4">
      {/* Query Input */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask AI about this game... (e.g., 'How do injuries affect this matchup?')"
              className="pl-10 bg-card/50 border-border/50 focus:border-primary"
              disabled={isLoading}
            />
          </div>
          <Button type="submit" variant="hero" disabled={isLoading || !query.trim()}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>

      {/* Quick Questions */}
      {insights.length === 0 && !isLoading && (
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-muted-foreground">Quick questions:</span>
          {['Injury impact?', 'Who has the edge?', 'Home court advantage?', 'Rest & fatigue?'].map((q) => (
            <button
              key={q}
              onClick={() => handleQuickQuestion(q)}
              className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm">Analyzing game data...</span>
          </div>
        </div>
      )}

      {/* Insights Display */}
      {insights.length > 0 && !isLoading && (
        <div className="space-y-2">
          {insights.map((insight, index) => (
            <div
              key={index}
              className={cn(
                "p-3 rounded-lg border text-sm",
                insight.type === 'positive' && "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
                insight.type === 'negative' && "bg-red-500/10 border-red-500/30 text-red-400",
                insight.type === 'neutral' && "bg-muted/50 border-border text-muted-foreground"
              )}
            >
              <div className="flex items-start gap-2">
                <span className={cn(
                  "mt-0.5 h-2 w-2 rounded-full shrink-0",
                  insight.type === 'positive' && "bg-emerald-500",
                  insight.type === 'negative' && "bg-red-500",
                  insight.type === 'neutral' && "bg-muted-foreground"
                )} />
                <span>{insight.text}</span>
              </div>
            </div>
          ))}
          
          {/* Clear button */}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => { setInsights([]); setQuery(''); }}
            className="text-xs text-muted-foreground"
          >
            Ask another question
          </Button>
        </div>
      )}
    </div>
  );
};
