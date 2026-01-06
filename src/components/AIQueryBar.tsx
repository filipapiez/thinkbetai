import { useState } from 'react';
import { Send, Sparkles, Loader2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { GameFacts } from '@/lib/mockData';

interface AIInsight {
  type: 'positive' | 'negative' | 'neutral';
  text: string;
}

interface AIQueryBarProps {
  facts: GameFacts;
}

// Generate AI responses based on actual game facts
const generateMockResponse = (query: string, facts: GameFacts): AIInsight[] => {
  const lowerQuery = query.toLowerCase();
  const { game, odds, injuries, recentForm, context, risk } = facts;
  const sport = game.sport;
  const homeTeam = game.homeTeam.name;
  const awayTeam = game.awayTeam.name;
  
  // Get injuries for each team
  const homeInjuries = injuries.filter(i => i.team === homeTeam);
  const awayInjuries = injuries.filter(i => i.team === awayTeam);
  const homeOut = homeInjuries.filter(i => i.status === 'Out');
  const awayOut = awayInjuries.filter(i => i.status === 'Out');
  
  // Calculate recent form
  const homeWins = recentForm.homeLast5.filter(g => g.result === 'W').length;
  const awayWins = recentForm.awayLast5.filter(g => g.result === 'W').length;
  
  if (lowerQuery.includes('injury') || lowerQuery.includes('injuries')) {
    const insights: AIInsight[] = [];
    
    if (homeOut.length > 0) {
      insights.push({ 
        type: 'negative', 
        text: `${homeTeam} missing ${homeOut.map(i => `${i.player} (${i.injuryType})`).join(', ')}` 
      });
    } else if (homeInjuries.length === 0) {
      insights.push({ type: 'positive', text: `${homeTeam} have no reported injuries` });
    }
    
    if (awayOut.length > 0) {
      insights.push({ 
        type: 'negative', 
        text: `${awayTeam} missing ${awayOut.map(i => `${i.player} (${i.injuryType})`).join(', ')}` 
      });
    } else if (awayInjuries.length === 0) {
      insights.push({ type: 'positive', text: `${awayTeam} have no reported injuries` });
    }
    
    const advantageTeam = homeOut.length < awayOut.length ? homeTeam : 
                          awayOut.length < homeOut.length ? awayTeam : null;
    if (advantageTeam) {
      insights.push({ type: 'neutral', text: `Injury advantage favors ${advantageTeam} in this ${sport} matchup` });
    } else {
      insights.push({ type: 'neutral', text: `Both teams are similarly affected by injuries in this ${sport} match` });
    }
    
    return insights;
  }
  
  if (lowerQuery.includes('home') || lowerQuery.includes('away') || lowerQuery.includes('court') || lowerQuery.includes('venue')) {
    const insights: AIInsight[] = [];
    
    if (context.homeIsHomeStrong) {
      insights.push({ type: 'positive', text: `${homeTeam} have strong home ${sport === 'Soccer' ? 'ground' : 'court'} advantage` });
    } else {
      insights.push({ type: 'negative', text: `${homeTeam} haven't been strong at home recently` });
    }
    
    if (context.awayIsAwayStrong) {
      insights.push({ type: 'positive', text: `${awayTeam} are dangerous on the road` });
    } else {
      insights.push({ type: 'negative', text: `${awayTeam} struggle away from home` });
    }
    
    insights.push({ 
      type: 'neutral', 
      text: `Venue: ${game.venue} - ${homeTeam} playing at home` 
    });
    
    return insights;
  }
  
  if (lowerQuery.includes('odds') || lowerQuery.includes('spread') || lowerQuery.includes('line') || lowerQuery.includes('probability')) {
    const homeFavorite = odds.impliedProb.homePct > odds.impliedProb.awayPct;
    const favorite = homeFavorite ? homeTeam : awayTeam;
    const underdog = homeFavorite ? awayTeam : homeTeam;
    const favProb = homeFavorite ? odds.impliedProb.homePct : odds.impliedProb.awayPct;
    const dogProb = homeFavorite ? odds.impliedProb.awayPct : odds.impliedProb.homePct;
    
    return [
      { 
        type: homeFavorite ? 'positive' : 'negative', 
        text: `${homeTeam} ${homeFavorite ? 'favored' : 'underdog'} at ${odds.moneyline.home > 0 ? '+' : ''}${odds.moneyline.home} (${odds.impliedProb.homePct.toFixed(1)}% implied probability)` 
      },
      { 
        type: 'neutral', 
        text: `Spread: ${homeTeam} ${odds.spread.home > 0 ? '+' : ''}${odds.spread.home}` 
      },
      { 
        type: 'neutral', 
        text: `Total points line set at ${odds.total}` 
      },
      { 
        type: 'neutral', 
        text: `${favorite} are favorites for this ${sport} match based on current odds` 
      },
    ];
  }
  
  if (lowerQuery.includes('win') || lowerQuery.includes('chance') || lowerQuery.includes('predict') || lowerQuery.includes('edge')) {
    const insights: AIInsight[] = [];
    
    if (homeWins >= 3) {
      insights.push({ type: 'positive', text: `${homeTeam} have won ${homeWins} of last 5 games - strong momentum` });
    } else if (homeWins <= 2) {
      insights.push({ type: 'negative', text: `${homeTeam} have won only ${homeWins} of last 5 - struggling recently` });
    }
    
    if (awayWins >= 3) {
      insights.push({ type: 'positive', text: `${awayTeam} have won ${awayWins} of last 5 games - in good form` });
    } else if (awayWins <= 2) {
      insights.push({ type: 'negative', text: `${awayTeam} have won only ${awayWins} of last 5 - inconsistent form` });
    }
    
    const edgeTeam = homeWins > awayWins ? homeTeam : awayWins > homeWins ? awayTeam : null;
    if (edgeTeam) {
      insights.push({ type: 'neutral', text: `Recent form suggests ${edgeTeam} has the edge in this ${sport} matchup` });
    } else {
      insights.push({ type: 'neutral', text: `Both teams evenly matched based on recent ${sport} form` });
    }
    
    insights.push({ type: 'neutral', text: `Risk level: ${risk.level} - ${sport} matches can be unpredictable` });
    
    return insights;
  }
  
  if (lowerQuery.includes('rest') || lowerQuery.includes('fatigue') || lowerQuery.includes('back')) {
    const insights: AIInsight[] = [];
    
    if (context.backToBack.home) {
      insights.push({ type: 'negative', text: `${homeTeam} on a back-to-back - potential fatigue factor` });
    } else {
      insights.push({ type: 'positive', text: `${homeTeam} have ${context.restDays.home} days rest - well rested` });
    }
    
    if (context.backToBack.away) {
      insights.push({ type: 'negative', text: `${awayTeam} on a back-to-back - potential fatigue factor` });
    } else {
      insights.push({ type: 'positive', text: `${awayTeam} have ${context.restDays.away} days rest - fresh legs` });
    }
    
    const restAdvantage = context.restDays.home > context.restDays.away ? homeTeam :
                          context.restDays.away > context.restDays.home ? awayTeam : null;
    if (restAdvantage) {
      insights.push({ type: 'neutral', text: `Rest advantage goes to ${restAdvantage}` });
    } else {
      insights.push({ type: 'neutral', text: `Rest factor is neutral for this ${sport} matchup` });
    }
    
    return insights;
  }
  
  // Default response - comprehensive overview
  const insights: AIInsight[] = [];
  
  if (homeWins >= 3) {
    insights.push({ type: 'positive', text: `${homeTeam} showing strong recent form (${homeWins}-${5-homeWins} last 5)` });
  } else {
    insights.push({ type: 'negative', text: `${homeTeam} struggling recently (${homeWins}-${5-homeWins} last 5)` });
  }
  
  if (homeOut.length > 0 || awayOut.length > 0) {
    const injuryNote = [];
    if (homeOut.length > 0) injuryNote.push(`${homeTeam} missing ${homeOut.length} player(s)`);
    if (awayOut.length > 0) injuryNote.push(`${awayTeam} missing ${awayOut.length} player(s)`);
    insights.push({ type: 'negative', text: injuryNote.join(', ') });
  } else {
    insights.push({ type: 'positive', text: `Both teams healthy for this ${sport} match` });
  }
  
  const homeFavorite = odds.impliedProb.homePct > odds.impliedProb.awayPct;
  insights.push({ 
    type: 'neutral', 
    text: `${homeFavorite ? homeTeam : awayTeam} favored (${Math.max(odds.impliedProb.homePct, odds.impliedProb.awayPct).toFixed(1)}% implied win probability)` 
  });
  
  insights.push({ type: 'neutral', text: `Risk level: ${risk.level} - ${risk.reasons[0]}` });
  
  return insights;
};

export const AIQueryBar = ({ facts }: AIQueryBarProps) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState<AIInsight[]>([]);

  const { game } = facts;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    const response = generateMockResponse(query, facts);
    setInsights(response);
    setIsLoading(false);
  };

  const handleQuickQuestion = async (question: string) => {
    setQuery(question);
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1200));
    const response = generateMockResponse(question, facts);
    setInsights(response);
    setIsLoading(false);
  };

  return (
    <div className="space-y-4">
      {/* Context Info Banner */}
      <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/20 text-xs">
        <Info className="h-4 w-4 text-primary shrink-0" />
        <span className="text-muted-foreground">
          <span className="text-foreground font-medium">Sport:</span> {game.sport} | 
          <span className="text-foreground font-medium ml-1">Match:</span> {game.homeTeam.name} vs {game.awayTeam.name}
        </span>
      </div>

      {/* Query Input */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Ask AI about this ${game.sport} match...`}
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
          {['Injury impact?', 'Who has the edge?', 'Home advantage?', 'Rest & fatigue?', 'What are the odds?'].map((q) => (
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
            <span className="text-sm">Analyzing {game.sport} match data...</span>
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
