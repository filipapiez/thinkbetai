import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, ChevronDown, ChevronUp, AlertTriangle, Target, TrendingUp, Shield, Database } from 'lucide-react';
import { GameFacts, platformStats } from '@/lib/mockData';

interface AIExplanationCardProps {
  gameId: string;
  facts?: GameFacts;
}

// Generate AI explanation following system rules
const generateExplanation = (facts: GameFacts) => {
  const { game, odds, injuries, recentForm, context, risk } = facts;
  const sport = game.sport;
  const homeTeam = game.homeTeam.name;
  const awayTeam = game.awayTeam.name;
  
  // Get sport accuracy (qualified picks only)
  const sportData = platformStats.sportBreakdown.find(s => s.sport === sport);
  const accuracy = sportData 
    ? `${sportData.wins}/${sportData.qualified} (${sportData.winRate}%)`
    : `${platformStats.correctQualified}/${platformStats.totalQualified} (${platformStats.qualifiedWinRate}%)`;
  
  // Calculate injury summary
  const homeInjuries = injuries.filter(i => i.team === homeTeam);
  const awayInjuries = injuries.filter(i => i.team === awayTeam);
  const homeOut = homeInjuries.filter(i => i.status === 'Out');
  const awayOut = awayInjuries.filter(i => i.status === 'Out');
  const homeQuestionable = homeInjuries.filter(i => i.status === 'Questionable');
  const awayQuestionable = awayInjuries.filter(i => i.status === 'Questionable');
  
  // Calculate form
  const homeWins = recentForm.homeLast5.filter(g => g.result === 'W').length;
  const awayWins = recentForm.awayLast5.filter(g => g.result === 'W').length;
  
  // Line movement analysis
  const lineMovement = odds.lineMovement 
    ? Math.abs(odds.lineMovement.current.home - odds.lineMovement.opening.home)
    : 0;
  let lineMovementCause = '';
  if (lineMovement >= 15) lineMovementCause = 'Sharp money or news-driven';
  else if (lineMovement >= 10) lineMovementCause = 'Public action';
  else if (lineMovement >= 5) lineMovementCause = 'Early market adjustment';
  
  // Determine favorite
  const homeFavorite = odds.impliedProb.homePct > odds.impliedProb.awayPct;
  const favorite = homeFavorite ? homeTeam : awayTeam;
  const favProb = homeFavorite ? odds.impliedProb.homePct : odds.impliedProb.awayPct;
  
  // Check for odds vs ranking contradiction
  let contradiction = '';
  if (game.homeTeam.stats?.ranking && game.awayTeam.stats?.ranking) {
    const oddsFav = homeFavorite ? 'home' : 'away';
    const rankFav = game.homeTeam.stats.ranking < game.awayTeam.stats.ranking ? 'home' : 'away';
    if (oddsFav !== rankFav) {
      contradiction = `Note: ${favorite} favored by odds despite lower ranking. Possible factors: ${context.homeIsHomeStrong ? 'home advantage' : ''} ${lineMovement >= 10 ? '| sharp money' : ''} ${homeQuestionable.length + awayQuestionable.length > 0 ? '| injury uncertainty' : ''}`;
    }
  }
  
  // Risk level adjustment based on line movement
  let adjustedRisk = risk.level;
  if (lineMovement >= 15 && risk.level === 'Low') adjustedRisk = 'High';
  else if (lineMovement >= 10 && risk.level === 'Low') adjustedRisk = 'Medium';
  
  // Build injury summary without contradictions
  let injurySummary = '';
  if (homeOut.length > 0 || awayOut.length > 0) {
    const outNames = [...homeOut, ...awayOut].map(i => `${i.player} (Out)`);
    injurySummary = `Confirmed absences: ${outNames.join(', ')}`;
  } else if (homeQuestionable.length > 0 || awayQuestionable.length > 0) {
    const qNames = [...homeQuestionable, ...awayQuestionable].map(i => `${i.player} (Questionable)`);
    injurySummary = `Key statuses to monitor: ${qNames.join(', ')}`;
  } else {
    injurySummary = 'No confirmed absences';
  }
  
  return {
    sport,
    homeTeam,
    awayTeam,
    verdict: homeFavorite && homeWins >= 3 ? `Lean ${homeTeam}` : awayWins >= 4 ? `Lean ${awayTeam}` : 'Toss-up',
    probability: `${favorite} ${favProb.toFixed(1)}% implied`,
    accuracy,
    timeframe: 'last 30 days',
    sections: [
      {
        title: 'ODDS EXPLAINED',
        content: [
          `${favorite} favored at ${odds.moneyline.home > 0 ? '+' : ''}${homeFavorite ? odds.moneyline.home : odds.moneyline.away} (${favProb.toFixed(1)}% implied probability)`,
          `Spread: ${homeTeam} ${odds.spread.home > 0 ? '+' : ''}${odds.spread.home}`,
          `Total: ${odds.total.line} points`,
          contradiction || null,
        ].filter(Boolean),
      },
      {
        title: 'INJURY IMPACT',
        content: [
          injurySummary,
          homeQuestionable.length > 0 ? `${homeTeam}: ${homeQuestionable.map(i => `${i.player} (${i.injuryType})`).join(', ')} - monitor pregame` : null,
          awayQuestionable.length > 0 ? `${awayTeam}: ${awayQuestionable.map(i => `${i.player} (${i.injuryType})`).join(', ')} - monitor pregame` : null,
        ].filter(Boolean),
      },
      {
        title: 'RECENT FORM & HISTORY',
        content: [
          `${homeTeam}: ${homeWins}-${5 - homeWins} (last 5 ${sport} matches)`,
          `${awayTeam}: ${awayWins}-${5 - awayWins} (last 5 ${sport} matches)`,
          `H2H context weighted lower if old/roster changes apply`,
        ],
      },
      {
        title: 'RISK / VOLATILITY',
        content: [
          `Level: ${adjustedRisk}`,
          lineMovement >= 5 ? `Line moved ${lineMovement} cents (${lineMovementCause})` : 'Minimal line movement',
          adjustedRisk !== risk.level ? `⚠️ Risk upgraded due to significant line movement` : null,
          ...risk.reasons.slice(0, 2),
        ].filter(Boolean),
      },
      {
        title: 'WHAT TO WATCH',
        content: [
          homeQuestionable.length > 0 || awayQuestionable.length > 0 ? 'Pregame injury report confirmation' : null,
          `Early game pace and tempo`,
          `Late game execution (projects as ${Math.abs(odds.spread.home) <= 4 ? 'close' : 'decisive'} outcome)`,
        ].filter(Boolean),
      },
    ],
  };
};

export const AIExplanationCard = ({ gameId, facts }: AIExplanationCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [explanation, setExplanation] = useState<ReturnType<typeof generateExplanation> | null>(null);

  const handleGenerateExplanation = async () => {
    if (!facts) return;
    
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setExplanation(generateExplanation(facts));
    setIsExpanded(true);
    setIsLoading(false);
  };

  return (
    <Card variant="glass" className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <span>AI Analysis</span>
          <span className="text-xs font-normal text-muted-foreground ml-auto">
            {facts ? `${facts.game.sport}: ${facts.game.homeTeam.name} vs ${facts.game.awayTeam.name}` : 'What this means'}
          </span>
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
              disabled={isLoading || !facts}
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
            {/* Verdict & Probability Header */}
            <div className="flex flex-wrap items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <Badge className="bg-primary/20 text-primary border-primary/30">
                <Target className="h-3 w-3 mr-1" />
                {explanation.verdict}
              </Badge>
              <span className="text-sm text-muted-foreground">{explanation.probability}</span>
              <div className="ml-auto flex items-center gap-1 text-xs text-primary">
                <TrendingUp className="h-3 w-3" />
                <span>{explanation.sport} accuracy: {explanation.accuracy} — {explanation.timeframe}</span>
              </div>
            </div>

            {/* Sections */}
            <div 
              className={`space-y-4 transition-all duration-300 overflow-hidden ${
                isExpanded ? 'max-h-none' : 'max-h-48'
              }`}
            >
              {explanation.sections.map((section, sIdx) => (
                <div key={sIdx} className="space-y-2">
                  <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
                    {section.title === 'RISK / VOLATILITY' && <Shield className="h-4 w-4" />}
                    {section.title === 'ODDS EXPLAINED' && <TrendingUp className="h-4 w-4" />}
                    {section.title === 'INJURY IMPACT' && <AlertTriangle className="h-4 w-4" />}
                    {section.title === 'RECENT FORM & HISTORY' && <Database className="h-4 w-4" />}
                    {section.title === 'WHAT TO WATCH' && <Target className="h-4 w-4" />}
                    {section.title}
                  </h3>
                  <ul className="space-y-1">
                    {section.content.map((item, iIdx) => (
                      <li key={iIdx} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
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

            {/* Data Source & Disclaimer */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Database className="h-3 w-3" />
                <span>Data: Last 5 games + current odds + injury reports ({explanation.sport})</span>
              </div>
              
              <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 flex gap-2">
                <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                <p className="text-xs text-warning/80">
                  Historical accuracy reflects past performance and does not guarantee future results. 
                  This analysis is for informational purposes only, not betting advice.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
