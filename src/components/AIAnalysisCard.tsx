import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, TrendingUp, TrendingDown, AlertTriangle, Loader2, RefreshCw, Minus } from 'lucide-react';
import { LiveGame, LiveBetQualification } from '@/lib/liveTypes';
import { ScrapedGameData } from '@/lib/api/gameData';
import { cn } from '@/lib/utils';

interface AIAnalysisCardProps {
  game: LiveGame;
  qualification: LiveBetQualification | null;
  scrapedData: ScrapedGameData | null;
}

interface AIAnalysisContent {
  paragraphs: string[];
  injuryStatement: string;
}

// Sport-specific analysis generators
function generateSportSpecificAnalysis(
  game: LiveGame,
  qualification: LiveBetQualification | null,
  scrapedData: ScrapedGameData | null
): AIAnalysisContent {
  const sport = game.sport.toLowerCase();
  const signal = qualification?.signal || 'PASS';
  
  const homeInjuries = scrapedData?.injuries.filter(
    i => i.team === game.homeTeam.name && (i.status === 'Out' || i.status === 'Questionable')
  ) || [];
  const awayInjuries = scrapedData?.injuries.filter(
    i => i.team === game.awayTeam.name && (i.status === 'Out' || i.status === 'Questionable')
  ) || [];
  
  const hasInjuries = homeInjuries.length > 0 || awayInjuries.length > 0;
  
  const homeForm = scrapedData?.recentForm.find(f => f.team === game.homeTeam.name);
  const awayForm = scrapedData?.recentForm.find(f => f.team === game.awayTeam.name);
  const homeWins = homeForm?.last5.filter(g => g.result === 'W').length || 0;
  const awayWins = awayForm?.last5.filter(g => g.result === 'W').length || 0;
  
  const homeML = game.odds?.moneyline.home || 0;
  const awayML = game.odds?.moneyline.away || 0;
  const spread = game.odds?.spread.home || 0;
  
  // Determine favorite
  const homeFavored = homeML < awayML;
  const favorite = homeFavored ? game.homeTeam.name : game.awayTeam.name;
  const underdog = homeFavored ? game.awayTeam.name : game.homeTeam.name;
  
  // Injury statement with detailed impact analysis
  let injuryStatement = '';
  if (hasInjuries) {
    const injuryParts: string[] = [];
    
    // Home team injuries with impact
    if (homeInjuries.length > 0) {
      const outPlayers = homeInjuries.filter(i => i.status === 'Out');
      const questionable = homeInjuries.filter(i => i.status === 'Questionable');
      
      if (outPlayers.length > 0) {
        const keyPlayers = outPlayers.slice(0, 2).map(i => `${i.player}${i.injuryType ? ` (${i.injuryType})` : ''}`).join(' and ');
        injuryParts.push(`${game.homeTeam.name} is confirmed without ${keyPlayers}`);
      }
      if (questionable.length > 0) {
        const qPlayers = questionable.slice(0, 2).map(i => i.player).join(' and ');
        injuryParts.push(`${qPlayers} listed as questionable for ${game.homeTeam.name}`);
      }
    }
    
    // Away team injuries with impact
    if (awayInjuries.length > 0) {
      const outPlayers = awayInjuries.filter(i => i.status === 'Out');
      const questionable = awayInjuries.filter(i => i.status === 'Questionable');
      
      if (outPlayers.length > 0) {
        const keyPlayers = outPlayers.slice(0, 2).map(i => `${i.player}${i.injuryType ? ` (${i.injuryType})` : ''}`).join(' and ');
        injuryParts.push(`${game.awayTeam.name} missing ${keyPlayers}`);
      }
      if (questionable.length > 0) {
        const qPlayers = questionable.slice(0, 2).map(i => i.player).join(' and ');
        injuryParts.push(`${qPlayers} game-time decisions for ${game.awayTeam.name}`);
      }
    }
    
    injuryStatement = injuryParts.join('. ') + '. ';
    
    // Add impact analysis
    const totalHomeOut = homeInjuries.filter(i => i.status === 'Out').length;
    const totalAwayOut = awayInjuries.filter(i => i.status === 'Out').length;
    
    if (totalHomeOut > totalAwayOut) {
      injuryStatement += `This gives ${game.awayTeam.name} a notable advantage - expect them to exploit the depleted roster with adjusted rotations and increased workload on remaining starters.`;
    } else if (totalAwayOut > totalHomeOut) {
      injuryStatement += `${game.homeTeam.name} benefits here - their healthier roster combined with home court should translate to better execution and depth in crunch time.`;
    } else if (totalHomeOut > 0 && totalAwayOut > 0) {
      injuryStatement += `Both teams dealing with absences creates unpredictability - role players will need to step up, making this matchup harder to project.`;
    } else {
      injuryStatement += `Monitor game-time decisions closely as these questionable players could significantly shift the betting landscape.`;
    }
  } else {
    injuryStatement = 'Both teams appear at full strength with no significant injuries reported. This removes injury variance from the equation - the outcome will come down to execution, game plan, and which team performs closer to their ceiling.';
  }
  
  const paragraphs: string[] = [];
  
  // Sport-specific context
  switch (sport) {
    case 'basketball':
    case 'nba':
      paragraphs.push(generateBasketballAnalysis(game, signal, homeWins, awayWins, homeML, awayML, spread, favorite, underdog, hasInjuries, homeInjuries.length, awayInjuries.length));
      break;
    case 'football':
    case 'nfl':
      paragraphs.push(generateFootballAnalysis(game, signal, homeWins, awayWins, homeML, awayML, spread, favorite, underdog, hasInjuries, homeInjuries.length, awayInjuries.length));
      break;
    case 'baseball':
    case 'mlb':
      paragraphs.push(generateBaseballAnalysis(game, signal, homeWins, awayWins, homeML, awayML, favorite, underdog, hasInjuries));
      break;
    case 'hockey':
    case 'nhl':
      paragraphs.push(generateHockeyAnalysis(game, signal, homeWins, awayWins, homeML, awayML, favorite, underdog, hasInjuries));
      break;
    case 'soccer':
    case 'mls':
      paragraphs.push(generateSoccerAnalysis(game, signal, homeWins, awayWins, homeML, awayML, favorite, underdog, hasInjuries));
      break;
    case 'mma':
    case 'ufc':
      paragraphs.push(generateMMAAnalysis(game, signal, homeML, awayML, favorite, underdog, hasInjuries));
      break;
    default:
      paragraphs.push(generateGenericAnalysis(game, signal, homeWins, awayWins, homeML, awayML, spread, favorite, underdog, hasInjuries, homeInjuries.length, awayInjuries.length));
  }
  
  // Add signal-specific reasoning
  paragraphs.push(generateSignalReasoning(signal, qualification?.confidenceScore || 0, qualification?.reason || ''));
  
  return { paragraphs, injuryStatement };
}

function generateBasketballAnalysis(
  game: LiveGame, signal: string, homeWins: number, awayWins: number,
  homeML: number, awayML: number, spread: number, favorite: string, underdog: string,
  hasInjuries: boolean, homeInjuryCount: number, awayInjuryCount: number
): string {
  const homeTeam = game.homeTeam.name;
  const awayTeam = game.awayTeam.name;
  
  let analysis = `In this NBA matchup, `;
  
  if (Math.abs(spread) >= 7) {
    analysis += `${favorite} enters as a heavy favorite with a ${Math.abs(spread)}-point spread, suggesting a potential blowout scenario. `;
  } else if (Math.abs(spread) <= 3) {
    analysis += `the tight ${Math.abs(spread)}-point spread indicates a highly competitive contest where pace and shooting efficiency will be decisive. `;
  } else {
    analysis += `the ${Math.abs(spread)}-point spread suggests a moderate edge for ${favorite}. `;
  }
  
  // Form context
  if (homeWins >= 4) {
    analysis += `${homeTeam} is riding hot with ${homeWins} wins in their last 5, showing excellent form. `;
  } else if (awayWins >= 4) {
    analysis += `${awayTeam} brings momentum with ${awayWins} recent victories. `;
  }
  
  // Injury impact for basketball
  if (hasInjuries) {
    if (homeInjuryCount >= 2) {
      analysis += `Rotation depth becomes critical with ${homeTeam} missing key players. `;
    }
    if (awayInjuryCount >= 2) {
      analysis += `${awayTeam}'s bench will need to step up given their injury situation. `;
    }
  }
  
  return analysis;
}

function generateFootballAnalysis(
  game: LiveGame, signal: string, homeWins: number, awayWins: number,
  homeML: number, awayML: number, spread: number, favorite: string, underdog: string,
  hasInjuries: boolean, homeInjuryCount: number, awayInjuryCount: number
): string {
  const homeTeam = game.homeTeam.name;
  const awayTeam = game.awayTeam.name;
  
  let analysis = `This NFL matchup features `;
  
  if (Math.abs(spread) >= 10) {
    analysis += `a significant mismatch with ${favorite} laying ${Math.abs(spread)} points. In football, these large spreads often come down to turnover margin and time of possession. `;
  } else if (Math.abs(spread) <= 3) {
    analysis += `a coin-flip scenario with just ${Math.abs(spread)} points separating the teams. Field position and red zone efficiency will be crucial. `;
  } else {
    analysis += `a competitive game where ${favorite} has the edge but ${underdog} can cover with strong defensive play. `;
  }
  
  // Form in football context
  if (homeWins >= 4) {
    analysis += `${homeTeam}'s recent success (${homeWins}-${5-homeWins}) suggests their system is clicking on both sides of the ball. `;
  } else if (awayWins >= 4) {
    analysis += `${awayTeam} enters with momentum (${awayWins}-${5-awayWins}), often key for road success in the NFL. `;
  }
  
  // Injury impact is massive in football
  if (hasInjuries) {
    analysis += `In football, injuries to skill position players or linemen dramatically shift game dynamics. `;
  }
  
  return analysis;
}

function generateBaseballAnalysis(
  game: LiveGame, signal: string, homeWins: number, awayWins: number,
  homeML: number, awayML: number, favorite: string, underdog: string,
  hasInjuries: boolean
): string {
  const homeTeam = game.homeTeam.name;
  const awayTeam = game.awayTeam.name;
  
  let analysis = `In baseball, pitching matchups drive the line. `;
  
  if (Math.abs(homeML) >= 200 || Math.abs(awayML) >= 200) {
    analysis += `The heavy juice on ${favorite} (${homeML < awayML ? homeML : awayML}) suggests a significant pitching advantage, though baseball's variance means upsets happen frequently. `;
  } else {
    analysis += `The relatively even moneyline indicates comparable starting pitching, making bullpen depth a key factor. `;
  }
  
  // Recent form
  if (homeWins >= 4 || awayWins >= 4) {
    const hotTeam = homeWins >= 4 ? homeTeam : awayTeam;
    analysis += `${hotTeam}'s recent run suggests their lineup is seeing the ball well and their rotation is performing. `;
  }
  
  return analysis;
}

function generateHockeyAnalysis(
  game: LiveGame, signal: string, homeWins: number, awayWins: number,
  homeML: number, awayML: number, favorite: string, underdog: string,
  hasInjuries: boolean
): string {
  const homeTeam = game.homeTeam.name;
  const awayTeam = game.awayTeam.name;
  
  let analysis = `Hockey's puck luck and goaltending create significant variance. `;
  
  if (Math.abs(homeML) >= 180) {
    analysis += `${favorite} is a strong favorite, but NHL upsets are common even with heavy favorites. `;
  } else {
    analysis += `This evenly matched game will likely come down to special teams and goaltending performance. `;
  }
  
  // Form
  if (homeWins >= 4 || awayWins >= 4) {
    const hotTeam = homeWins >= 4 ? homeTeam : awayTeam;
    analysis += `${hotTeam}'s hot streak suggests their goalie is dialed in and power play is converting. `;
  }
  
  // Home ice in hockey
  analysis += `Home ice advantage matters in hockey, giving ${homeTeam} last change and favorable matchups. `;
  
  return analysis;
}

function generateSoccerAnalysis(
  game: LiveGame, signal: string, homeWins: number, awayWins: number,
  homeML: number, awayML: number, favorite: string, underdog: string,
  hasInjuries: boolean
): string {
  const homeTeam = game.homeTeam.name;
  const awayTeam = game.awayTeam.name;
  
  let analysis = `Soccer's low-scoring nature makes every goal crucial. `;
  
  if (Math.abs(homeML) >= 200) {
    analysis += `${favorite}'s heavy odds suggest a significant class difference, though defensive soccer can keep matches close. `;
  } else {
    analysis += `The competitive odds indicate a match where tactical discipline will be paramount. `;
  }
  
  // Form in soccer
  if (homeWins >= 4) {
    analysis += `${homeTeam}'s strong run of form suggests confidence in their attacking play. `;
  } else if (awayWins >= 4) {
    analysis += `${awayTeam} arrives with momentum, though away form often differs from home results. `;
  }
  
  return analysis;
}

function generateMMAAnalysis(
  game: LiveGame, signal: string, homeML: number, awayML: number,
  favorite: string, underdog: string, hasInjuries: boolean
): string {
  let analysis = `MMA's high finish rate creates volatility that the odds can't fully capture. `;
  
  if (Math.abs(homeML) >= 300 || Math.abs(awayML) >= 300) {
    analysis += `The heavy favorite status of ${favorite} reflects a perceived skill gap, but MMA upsets happen with single strikes or submissions. `;
  } else {
    analysis += `This is a competitive fight where style matchups and cardio could determine the outcome. `;
  }
  
  if (hasInjuries) {
    analysis += `Training camp issues or injuries can significantly impact fighter readiness - worth monitoring. `;
  }
  
  return analysis;
}

function generateGenericAnalysis(
  game: LiveGame, signal: string, homeWins: number, awayWins: number,
  homeML: number, awayML: number, spread: number, favorite: string, underdog: string,
  hasInjuries: boolean, homeInjuryCount: number, awayInjuryCount: number
): string {
  let analysis = `Looking at this ${game.sport} matchup, `;
  
  const homeFavored = homeML < awayML;
  
  if (homeFavored) {
    analysis += `${game.homeTeam.name} enters as the favorite with home field advantage. `;
  } else {
    analysis += `${game.awayTeam.name} is favored despite playing on the road, indicating a perceived talent edge. `;
  }
  
  // Form context
  if (homeWins >= 4) {
    analysis += `${game.homeTeam.name}'s excellent recent form (${homeWins}-${5-homeWins}) adds confidence to their position. `;
  } else if (awayWins >= 4) {
    analysis += `${game.awayTeam.name}'s momentum (${awayWins}-${5-awayWins}) could prove decisive. `;
  } else {
    analysis += `Both teams show mixed recent results, adding uncertainty to predictions. `;
  }
  
  return analysis;
}

function generateSignalReasoning(signal: string, confidence: number, reason: string): string {
  switch (signal) {
    case 'GOOD':
      return `The GOOD BET signal (${confidence}% confidence) emerges because value aligns with stability. ${reason}. When odds, form, and matchup factors converge favorably, this represents a betting opportunity worth considering.`;
    case 'BORDERLINE':
      return `The BORDERLINE rating (${confidence}% confidence) reflects mixed signals in this matchup. ${reason}. While there may be some value, the uncertainty from variance factors or conflicting indicators suggests caution.`;
    case 'PASS':
      return `The PASS recommendation (${confidence}% confidence) indicates that risk or uncertainty outweighs any potential value. ${reason}. The combination of unfavorable factors makes this a matchup to avoid from a betting perspective.`;
    default:
      return `Analysis confidence: ${confidence}%. ${reason}`;
  }
}

export const AIAnalysisCard = ({ game, qualification, scrapedData }: AIAnalysisCardProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Auto-generate analysis when component mounts or data changes
  const analysis = useMemo(() => {
    return generateSportSpecificAnalysis(game, qualification, scrapedData);
  }, [game, qualification, scrapedData]);
  
  const signal = qualification?.signal || 'PASS';
  
  const getSignalStyle = (signal: string) => {
    switch (signal) {
      case 'GOOD': return { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/40', icon: TrendingUp };
      case 'BORDERLINE': return { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/40', icon: Minus };
      case 'PASS': return { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/40', icon: TrendingDown };
      default: return { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-border', icon: Minus };
    }
  };
  
  const style = getSignalStyle(signal);
  const SignalIcon = style.icon;

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            AI Analysis
          </span>
          <Badge variant="outline" className={cn("text-sm px-3 py-1", style.bg, style.text, style.border)}>
            <SignalIcon className="h-4 w-4 mr-1" />
            {signal === 'GOOD' ? 'GOOD BET' : signal}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Analysis Paragraphs */}
        <div className="space-y-3">
          {analysis.paragraphs.map((paragraph, idx) => (
            <p key={idx} className="text-sm text-foreground/90 leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>
        
        {/* Injury Statement - Always Present */}
        <div className={cn(
          "p-3 rounded-lg border flex items-start gap-3",
          analysis.injuryStatement.includes('no significant injuries')
            ? "bg-emerald-500/10 border-emerald-500/20"
            : "bg-amber-500/10 border-amber-500/20"
        )}>
          <AlertTriangle className={cn(
            "h-4 w-4 mt-0.5 shrink-0",
            analysis.injuryStatement.includes('no significant injuries')
              ? "text-emerald-400"
              : "text-amber-400"
          )} />
          <p className="text-sm text-foreground/80">
            <span className="font-medium">Injury Impact: </span>
            {analysis.injuryStatement}
          </p>
        </div>
        
        {/* Final Recommendation */}
        <div className={cn(
          "p-4 rounded-lg border",
          style.bg, style.border
        )}>
          <div className="flex items-center gap-2 mb-2">
            <SignalIcon className={cn("h-5 w-5", style.text)} />
            <span className={cn("font-semibold", style.text)}>
              Final Recommendation
            </span>
          </div>
          <p className="text-sm text-foreground/90">
            {signal === 'GOOD' && qualification?.pick && (
              <>Consider <strong>{qualification.pick === 'home' ? game.homeTeam.name : game.awayTeam.name}</strong> based on the favorable alignment of odds, form, and matchup factors. This represents a high-confidence betting opportunity.</>
            )}
            {signal === 'BORDERLINE' && (
              <>This matchup presents mixed signals. If betting, proceed with reduced stake size and be aware of the elevated uncertainty. Consider waiting for better opportunities.</>
            )}
            {signal === 'PASS' && (
              <>Skip this matchup. The combination of risk factors and uncertainty makes this an unfavorable betting scenario. Protect your bankroll for clearer opportunities.</>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
