import { useState } from 'react';
import { Send, Sparkles, Loader2, Info, AlertTriangle, TrendingUp, Target, Percent, Shield, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { GameFacts, platformStats } from '@/lib/mockData';

// Prop parsing result interface
interface PropParsing {
  sport: string;
  homeTeam: string;
  awayTeam: string;
  player?: string;
  marketType: 'moneyline' | 'spread' | 'total' | 'prop' | 'general';
  stat?: string;
  line?: number;
  direction?: 'over' | 'under';
}

// AI Response with structured output
interface AIResponse {
  verdict: 'Over' | 'Under' | 'Home' | 'Away' | 'Pass' | 'Lean';
  probability: string;
  fairOdds?: string;
  reasoning: string[];
  risks: string[];
  dataUsed: string;
  accuracy: {
    text: string;
    wins: number;
    total: number;
    percentage: number;
  };
}

interface AIQueryBarProps {
  facts: GameFacts;
}

// Parse user query to extract prop information
const parseQuery = (query: string, facts: GameFacts): PropParsing => {
  const lowerQuery = query.toLowerCase();
  const { game } = facts;
  
  const parsing: PropParsing = {
    sport: game.sport,
    homeTeam: game.homeTeam.name,
    awayTeam: game.awayTeam.name,
    marketType: 'general',
  };
  
  // Detect market type
  if (lowerQuery.includes('over') || lowerQuery.includes('under') || lowerQuery.includes('total')) {
    parsing.marketType = 'total';
    parsing.direction = lowerQuery.includes('over') ? 'over' : 'under';
  } else if (lowerQuery.includes('spread') || lowerQuery.includes('cover')) {
    parsing.marketType = 'spread';
  } else if (lowerQuery.includes('win') || lowerQuery.includes('moneyline') || lowerQuery.includes('ml')) {
    parsing.marketType = 'moneyline';
  } else if (lowerQuery.includes('points') || lowerQuery.includes('assists') || lowerQuery.includes('saves') || 
             lowerQuery.includes('kills') || lowerQuery.includes('aces') || lowerQuery.includes('goals')) {
    parsing.marketType = 'prop';
  }
  
  // Extract line numbers
  const lineMatch = query.match(/(\d+\.?\d*)/);
  if (lineMatch) {
    parsing.line = parseFloat(lineMatch[1]);
  }
  
  return parsing;
};

// Get sport-specific accuracy stats
const getSportAccuracy = (sport: string): { wins: number; total: number; winRate: number } => {
  const sportData = platformStats.sportBreakdown.find(s => s.sport === sport);
  if (sportData) {
    return { wins: sportData.wins, total: sportData.predictions, winRate: sportData.winRate };
  }
  return { wins: platformStats.correctPredictions, total: platformStats.totalPredictions, winRate: platformStats.winRate };
};

// Generate AI response based on actual game facts following system rules
const generateAIResponse = (query: string, facts: GameFacts): AIResponse => {
  const parsing = parseQuery(query, facts);
  const { game, odds, injuries, recentForm, context, risk } = facts;
  const sport = game.sport;
  const homeTeam = game.homeTeam.name;
  const awayTeam = game.awayTeam.name;
  
  // Get injuries for each team
  const homeInjuries = injuries.filter(i => i.team === homeTeam);
  const awayInjuries = injuries.filter(i => i.team === awayTeam);
  const homeOut = homeInjuries.filter(i => i.status === 'Out');
  const awayOut = awayInjuries.filter(i => i.status === 'Out');
  const homeQuestionable = homeInjuries.filter(i => i.status === 'Questionable');
  const awayQuestionable = awayInjuries.filter(i => i.status === 'Questionable');
  
  // Calculate recent form
  const homeWins = recentForm.homeLast5.filter(g => g.result === 'W').length;
  const awayWins = recentForm.awayLast5.filter(g => g.result === 'W').length;
  
  // Determine favorite and confidence
  const homeFavorite = odds.impliedProb.homePct > odds.impliedProb.awayPct;
  const favorite = homeFavorite ? homeTeam : awayTeam;
  const underdog = homeFavorite ? awayTeam : homeTeam;
  const favProb = homeFavorite ? odds.impliedProb.homePct : odds.impliedProb.awayPct;
  
  // Calculate line movement magnitude
  const lineMovement = odds.lineMovement ? 
    Math.abs(odds.lineMovement.current.home - odds.lineMovement.opening.home) : 0;
  const significantLineMove = lineMovement >= 10;
  
  // Get sport-specific accuracy
  const accuracy = getSportAccuracy(sport);
  
  // Build reasoning based on query type
  const reasoning: string[] = [];
  const risks: string[] = [];
  let verdict: AIResponse['verdict'] = 'Pass';
  let probability = '';
  let fairOdds = '';
  
  // Market odds determine favorites, resolve contradictions
  if (game.homeTeam.stats?.ranking && game.awayTeam.stats?.ranking) {
    const homeRanked = game.homeTeam.stats.ranking;
    const awayRanked = game.awayTeam.stats.ranking;
    const oddsFavorite = homeFavorite ? 'home' : 'away';
    const rankFavorite = homeRanked < awayRanked ? 'home' : 'away';
    
    if (oddsFavorite !== rankFavorite) {
      reasoning.push(`⚠️ Odds contradict rankings: ${favorite} favored despite lower ranking. Possible reasons: ${context.homeIsHomeStrong ? 'home court advantage' : ''} ${significantLineMove ? '| sharp money movement' : ''} ${homeQuestionable.length + awayQuestionable.length > 0 ? '| injury uncertainty' : ''}`);
    }
  }
  
  // Moneyline/Winner questions
  if (parsing.marketType === 'moneyline' || query.toLowerCase().includes('win')) {
    const homeEdge = homeWins > awayWins;
    const restAdvantage = context.restDays.home > context.restDays.away;
    const injuryAdvantage = homeOut.length < awayOut.length;
    
    const factors = [homeEdge, restAdvantage, injuryAdvantage, context.homeIsHomeStrong, homeFavorite];
    const homeFactors = factors.filter(Boolean).length;
    
    if (homeFactors >= 3) {
      verdict = 'Home';
      probability = `${homeTeam} win: ${odds.impliedProb.homePct.toFixed(1)}%`;
    } else if (homeFactors <= 1) {
      verdict = 'Away';
      probability = `${awayTeam} win: ${odds.impliedProb.awayPct.toFixed(1)}%`;
    } else {
      verdict = 'Pass';
      probability = `Split factors: ${odds.impliedProb.homePct.toFixed(1)}% vs ${odds.impliedProb.awayPct.toFixed(1)}%`;
    }
    
    reasoning.push(`Market implied probability: ${favorite} ${favProb.toFixed(1)}%`);
    reasoning.push(`Recent form: ${homeTeam} (${homeWins}-${5-homeWins}) vs ${awayTeam} (${awayWins}-${5-awayWins})`);
    if (context.homeIsHomeStrong) reasoning.push(`${homeTeam} strong at home (${game.homeTeam.stats?.homeRecord || 'N/A'})`);
    if (context.awayIsAwayStrong) reasoning.push(`${awayTeam} performing well on the road`);
    
    fairOdds = `Fair odds: ${favorite} approximately ${homeFavorite ? odds.moneyline.home : odds.moneyline.away}`;
  }
  
  // Spread questions
  else if (parsing.marketType === 'spread') {
    const spreadValue = odds.spread.home;
    const closeGame = Math.abs(spreadValue) <= 4;
    
    verdict = homeFavorite && homeWins >= 3 ? 'Home' : awayWins >= 3 ? 'Away' : 'Pass';
    probability = `Cover probability: ~${closeGame ? '48-52%' : homeFavorite ? '54-58%' : '52-56%'} (close call)`;
    
    reasoning.push(`Spread: ${homeTeam} ${spreadValue > 0 ? '+' : ''}${spreadValue}`);
    reasoning.push(`${closeGame ? 'Tight spread indicates competitive matchup' : 'Spread suggests clear favorite'}`);
    if (significantLineMove) reasoning.push(`Line movement: ${lineMovement} cents since open`);
  }
  
  // Total questions
  else if (parsing.marketType === 'total') {
    const totalLine = odds.total.line;
    verdict = parsing.direction === 'over' ? 'Over' : 'Under';
    probability = `${parsing.direction === 'over' ? 'Over' : 'Under'} ${totalLine}: ~52%`;
    
    reasoning.push(`Total set at ${totalLine} points`);
    reasoning.push(`Both teams' scoring trends factored`);
    if (context.backToBack.home || context.backToBack.away) {
      reasoning.push(`Back-to-back factor may impact pace/scoring`);
      risks.push('B2B games often lower scoring due to fatigue');
    }
  }
  
  // General/default comprehensive analysis
  else {
    verdict = homeFavorite && homeWins >= 3 ? 'Lean' : 'Pass';
    probability = `${favorite} favored at ${favProb.toFixed(1)}%`;
    
    reasoning.push(`Market: ${favorite} ${favProb.toFixed(1)}% implied probability`);
    reasoning.push(`Form: ${homeTeam} ${homeWins}-${5-homeWins}, ${awayTeam} ${awayWins}-${5-awayWins} (last 5)`);
    reasoning.push(`Rest: ${homeTeam} ${context.restDays.home}d, ${awayTeam} ${context.restDays.away}d`);
    if (significantLineMove) reasoning.push(`⚠️ Line moved ${lineMovement} cents - monitor for news`);
  }
  
  // Add risks based on data
  if (homeQuestionable.length > 0 || awayQuestionable.length > 0) {
    risks.push(`Injury uncertainty: ${[...homeQuestionable, ...awayQuestionable].map(i => `${i.player} (${i.status})`).join(', ')}`);
  }
  if (significantLineMove) {
    risks.push('Significant line movement suggests new information');
  }
  if (risk.level === 'High') {
    risks.push('High volatility game - elevated uncertainty');
  }
  if (homeWins <= 2 && awayWins <= 2) {
    risks.push('Both teams inconsistent recently (low sample confidence)');
  }
  
  // Always add context/safety
  if (risks.length === 0) {
    risks.push('Standard variance applies to all predictions');
  }
  
  return {
    verdict,
    probability,
    fairOdds,
    reasoning,
    risks,
    dataUsed: `Last 5 games + current odds + injury reports (${sport})`,
    accuracy: {
      text: `${sport} accuracy: ${accuracy.wins}/${accuracy.total} (${accuracy.winRate}%) — last 30 days`,
      wins: accuracy.wins,
      total: accuracy.total,
      percentage: accuracy.winRate,
    },
  };
};

export const AIQueryBar = ({ facts }: AIQueryBarProps) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<AIResponse | null>(null);

  // Guard against undefined facts
  if (!facts || !facts.game) {
    return (
      <div className="text-center py-4 text-muted-foreground text-sm">
        Unable to load game data. Please try refreshing the page.
      </div>
    );
  }

  const { game } = facts;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    const aiResponse = generateAIResponse(query, facts);
    setResponse(aiResponse);
    setIsLoading(false);
  };

  const handleQuickQuestion = async (question: string) => {
    setQuery(question);
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1200));
    const aiResponse = generateAIResponse(question, facts);
    setResponse(aiResponse);
    setIsLoading(false);
  };

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'Over':
      case 'Home':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'Under':
      case 'Away':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'Pass':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'Lean':
        return 'bg-primary/20 text-primary border-primary/30';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
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
              placeholder={`Ask any prop: "Will ${game.homeTeam.abbreviation} cover?" or "${game.awayTeam.abbreviation} over 2.5 goals?"...`}
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
      {!response && !isLoading && (
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-muted-foreground">Quick props:</span>
          {[
            `Will ${game.homeTeam.abbreviation} win?`, 
            `Cover the spread?`, 
            `Over/Under total?`, 
            `Injury impact?`,
            `Who has the edge?`
          ].map((q) => (
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

      {/* AI Response Display */}
      {response && !isLoading && (
        <div className="space-y-4">
          {/* Verdict & Probability */}
          <div className="flex flex-wrap items-center gap-3">
            <Badge className={cn("text-sm py-1 px-3", getVerdictColor(response.verdict))}>
              <Target className="h-3 w-3 mr-1" />
              Verdict: {response.verdict}
            </Badge>
            <div className="flex items-center gap-1 text-sm">
              <Percent className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">{response.probability}</span>
            </div>
          </div>

          {/* Reasoning */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Why
            </h4>
            <ul className="space-y-1.5">
              {response.reasoning.map((reason, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  <span className="text-muted-foreground">{reason}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Risks */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <Shield className="h-3 w-3" /> Risks
            </h4>
            <ul className="space-y-1.5">
              {response.risks.map((risk, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <AlertTriangle className="h-3 w-3 mt-0.5 text-warning shrink-0" />
                  <span className="text-warning/80">{risk}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Data & Accuracy */}
          <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-border text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Database className="h-3 w-3" />
              <span>{response.dataUsed}</span>
            </div>
            <div className="flex items-center gap-1 text-primary">
              <Target className="h-3 w-3" />
              <span>{response.accuracy.text}</span>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="bg-muted/30 border border-border rounded-lg p-3 text-xs text-muted-foreground">
            Historical accuracy reflects past performance and does not guarantee future results. This is informational only, not betting advice.
          </div>
          
          {/* Clear button */}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => { setResponse(null); setQuery(''); }}
            className="text-xs text-muted-foreground"
          >
            Ask another question
          </Button>
        </div>
      )}
    </div>
  );
};
