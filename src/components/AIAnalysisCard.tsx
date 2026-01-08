import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Minus, 
  CheckCircle2, 
  Home, 
  Activity, 
  Users, 
  Flame,
  Info,
  XCircle
} from 'lucide-react';
import { LiveGame, LiveBetQualification } from '@/lib/liveTypes';
import { ScrapedGameData } from '@/lib/api/gameData';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AIAnalysisCardProps {
  game: LiveGame;
  qualification: LiveBetQualification | null;
  scrapedData: ScrapedGameData | null;
}

type TieredSignal = 'STRONG_VALUE' | 'QUALIFIED' | 'RISKY' | 'AVOID';

interface QualifyingFactor {
  label: string;
  icon: typeof CheckCircle2;
  positive: boolean;
}

interface AnalysisResult {
  tieredSignal: TieredSignal;
  factors: QualifyingFactor[];
  injurySummary: string | null;
  riskLevel: 'Low' | 'Medium' | 'High';
  suggestedStake: string;
  pickTeam: string;
  pickType: 'home' | 'away';
}

// Map qualification signal to new tiered system
function getTieredSignal(qualification: LiveBetQualification | null): TieredSignal {
  if (!qualification) return 'AVOID';
  
  const { signal, confidenceScore } = qualification;
  
  if (signal === 'GOOD' && confidenceScore >= 70) return 'STRONG_VALUE';
  if (signal === 'GOOD') return 'QUALIFIED';
  if (signal === 'BORDERLINE') return 'RISKY';
  return 'AVOID';
}

function getTieredSignalStyle(signal: TieredSignal) {
  switch (signal) {
    case 'STRONG_VALUE':
      return { 
        bg: 'bg-orange-500/20', 
        text: 'text-orange-400', 
        border: 'border-orange-500/40',
        icon: Flame,
        label: '🔥 STRONG VALUE'
      };
    case 'QUALIFIED':
      return { 
        bg: 'bg-emerald-500/20', 
        text: 'text-emerald-400', 
        border: 'border-emerald-500/40',
        icon: CheckCircle2,
        label: '✅ QUALIFIED BET'
      };
    case 'RISKY':
      return { 
        bg: 'bg-amber-500/20', 
        text: 'text-amber-400', 
        border: 'border-amber-500/40',
        icon: AlertTriangle,
        label: '⚠️ RISKY'
      };
    case 'AVOID':
      return { 
        bg: 'bg-red-500/20', 
        text: 'text-red-400', 
        border: 'border-red-500/40',
        icon: XCircle,
        label: '❌ AVOID'
      };
  }
}

function getSuggestedStake(signal: TieredSignal, confidence: number): string {
  if (signal === 'STRONG_VALUE' && confidence >= 75) return '2–3 units';
  if (signal === 'STRONG_VALUE') return '1.5–2 units';
  if (signal === 'QUALIFIED' && confidence >= 65) return '1–2 units';
  if (signal === 'QUALIFIED') return '1 unit';
  if (signal === 'RISKY') return '0.5 unit max';
  return 'Do not bet';
}

function getRiskLevel(signal: TieredSignal, game: LiveGame): 'Low' | 'Medium' | 'High' {
  if (signal === 'AVOID') return 'High';
  if (signal === 'RISKY') return 'Medium';
  if (game.status === 'live') return 'Medium';
  if (signal === 'STRONG_VALUE') return 'Low';
  return 'Medium';
}

// Generate qualifying factors as bullet points
function generateQualifyingFactors(
  game: LiveGame,
  qualification: LiveBetQualification | null,
  scrapedData: ScrapedGameData | null
): QualifyingFactor[] {
  const factors: QualifyingFactor[] = [];
  
  // Home advantage check
  const pick = qualification?.pick || 'home';
  if (pick === 'home') {
    factors.push({ label: 'Home advantage', icon: Home, positive: true });
  }
  
  // Injury check
  const homeInjuries = scrapedData?.injuries.filter(
    i => i.team === game.homeTeam.name && i.status === 'Out'
  ) || [];
  const awayInjuries = scrapedData?.injuries.filter(
    i => i.team === game.awayTeam.name && i.status === 'Out'
  ) || [];
  
  if (homeInjuries.length === 0 && awayInjuries.length === 0) {
    factors.push({ label: 'No key injuries', icon: CheckCircle2, positive: true });
  } else if (pick === 'home' && homeInjuries.length < awayInjuries.length) {
    factors.push({ label: 'Healthier roster vs opponent', icon: CheckCircle2, positive: true });
  } else if (pick === 'away' && awayInjuries.length < homeInjuries.length) {
    factors.push({ label: 'Healthier roster vs opponent', icon: CheckCircle2, positive: true });
  } else if (homeInjuries.length > 0 || awayInjuries.length > 0) {
    factors.push({ label: 'Injury concerns present', icon: AlertTriangle, positive: false });
  }
  
  // Market interest / popularity
  const popularity = game.popularityScore || 50;
  if (popularity >= 80) {
    factors.push({ label: 'High market interest', icon: Activity, positive: true });
  } else if (popularity >= 65) {
    factors.push({ label: 'Moderate market interest', icon: Activity, positive: true });
  }
  
  // Recent form check
  const homeForm = scrapedData?.recentForm.find(f => f.team === game.homeTeam.name);
  const awayForm = scrapedData?.recentForm.find(f => f.team === game.awayTeam.name);
  const homeWins = homeForm?.last5.filter(g => g.result === 'W').length || 0;
  const awayWins = awayForm?.last5.filter(g => g.result === 'W').length || 0;
  
  const pickTeamWins = pick === 'home' ? homeWins : awayWins;
  
  if (pickTeamWins >= 4) {
    factors.push({ label: 'Strong recent form', icon: TrendingUp, positive: true });
  } else if (pickTeamWins >= 3) {
    factors.push({ label: 'Stable recent form', icon: Minus, positive: true });
  } else if (pickTeamWins <= 1) {
    factors.push({ label: 'Poor recent form', icon: TrendingDown, positive: false });
  }
  
  // Odds value
  if (game.odds && qualification?.signal === 'GOOD') {
    factors.push({ label: 'Favorable odds alignment', icon: CheckCircle2, positive: true });
  }
  
  // Live game warning
  if (game.status === 'live') {
    factors.push({ label: 'Live betting volatility', icon: AlertTriangle, positive: false });
  }
  
  return factors;
}

// Generate injury summary (short, no scraping mention)
function generateInjurySummary(
  game: LiveGame,
  scrapedData: ScrapedGameData | null
): string | null {
  const homeOut = scrapedData?.injuries.filter(
    i => i.team === game.homeTeam.name && i.status === 'Out'
  ) || [];
  const awayOut = scrapedData?.injuries.filter(
    i => i.team === game.awayTeam.name && i.status === 'Out'
  ) || [];
  
  if (homeOut.length === 0 && awayOut.length === 0) {
    return null; // No injuries to report
  }
  
  const parts: string[] = [];
  
  if (homeOut.length > 0) {
    const names = homeOut.slice(0, 2).map(i => i.player).join(', ');
    parts.push(`${game.homeTeam.name}: ${names} OUT`);
  }
  
  if (awayOut.length > 0) {
    const names = awayOut.slice(0, 2).map(i => i.player).join(', ');
    parts.push(`${game.awayTeam.name}: ${names} OUT`);
  }
  
  return parts.join(' • ');
}

function analyzeMatch(
  game: LiveGame,
  qualification: LiveBetQualification | null,
  scrapedData: ScrapedGameData | null
): AnalysisResult {
  const tieredSignal = getTieredSignal(qualification);
  const factors = generateQualifyingFactors(game, qualification, scrapedData);
  const injurySummary = generateInjurySummary(game, scrapedData);
  const riskLevel = getRiskLevel(tieredSignal, game);
  const suggestedStake = getSuggestedStake(tieredSignal, qualification?.confidenceScore || 0);
  const pickType = qualification?.pick || 'home';
  const pickTeam = pickType === 'home' ? game.homeTeam.name : game.awayTeam.name;
  
  return {
    tieredSignal,
    factors,
    injurySummary,
    riskLevel,
    suggestedStake,
    pickTeam,
    pickType,
  };
}

export const AIAnalysisCard = ({ game, qualification, scrapedData }: AIAnalysisCardProps) => {
  const analysis = useMemo(() => 
    analyzeMatch(game, qualification, scrapedData), 
    [game, qualification, scrapedData]
  );
  
  const style = getTieredSignalStyle(analysis.tieredSignal);
  const confidence = qualification?.confidenceScore || 0;
  
  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Match Analysis
          </span>
          <Badge variant="outline" className={cn("text-sm px-3 py-1", style.bg, style.text, style.border)}>
            {style.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Why This Match Qualifies - Bullet Points */}
        <div>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            Why this match qualifies
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {analysis.factors.map((factor, idx) => {
              const Icon = factor.icon;
              return (
                <div 
                  key={idx} 
                  className={cn(
                    "flex items-center gap-2 text-sm p-2 rounded-lg",
                    factor.positive 
                      ? "bg-emerald-500/10 text-emerald-400" 
                      : "bg-amber-500/10 text-amber-400"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{factor.label}</span>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Injury Alert (if any) */}
        {analysis.injurySummary && (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
            <div>
              <span className="text-sm font-medium text-amber-400">Key Absences: </span>
              <span className="text-sm text-foreground/80">{analysis.injurySummary}</span>
            </div>
          </div>
        )}
        
        {/* Confidence with Tooltip */}
        <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">{confidence}%</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">
                    Based on historical accuracy of similar match profiles. 
                    This is not a guarantee of outcome.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="text-sm text-muted-foreground">
            Confidence
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Badge variant="outline" className={cn(
              "text-xs",
              analysis.riskLevel === 'Low' ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" :
              analysis.riskLevel === 'Medium' ? "bg-amber-500/20 text-amber-400 border-amber-500/40" :
              "bg-red-500/20 text-red-400 border-red-500/40"
            )}>
              {analysis.riskLevel} Risk
            </Badge>
          </div>
        </div>
        
        {/* Suggested Action - Decision Guide */}
        <div className={cn(
          "p-4 rounded-lg border",
          style.bg, style.border
        )}>
          <h4 className={cn("text-sm font-semibold mb-3 flex items-center gap-2", style.text)}>
            <Activity className="h-4 w-4" />
            Suggested Action
          </h4>
          
          {analysis.tieredSignal === 'AVOID' ? (
            <p className="text-sm text-foreground/90">
              Skip this matchup. The risk factors outweigh potential value. Protect your bankroll for clearer opportunities.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="text-center p-2 rounded bg-background/50">
                <div className="text-xs text-muted-foreground mb-1">Pick</div>
                <div className="font-semibold text-sm">{analysis.pickTeam}</div>
                <div className="text-xs text-muted-foreground">({analysis.pickType === 'home' ? 'Home' : 'Away'})</div>
              </div>
              <div className="text-center p-2 rounded bg-background/50">
                <div className="text-xs text-muted-foreground mb-1">Confidence</div>
                <div className="font-semibold text-sm">{confidence}%</div>
              </div>
              <div className="text-center p-2 rounded bg-background/50">
                <div className="text-xs text-muted-foreground mb-1">Risk Level</div>
                <div className={cn(
                  "font-semibold text-sm",
                  analysis.riskLevel === 'Low' ? 'text-emerald-400' :
                  analysis.riskLevel === 'Medium' ? 'text-amber-400' : 'text-red-400'
                )}>
                  {analysis.riskLevel}
                </div>
              </div>
              <div className="text-center p-2 rounded bg-background/50">
                <div className="text-xs text-muted-foreground mb-1">Suggested Stake</div>
                <div className="font-semibold text-sm">{analysis.suggestedStake}</div>
              </div>
            </div>
          )}
        </div>
        
        {/* Soft Disclaimer */}
        <p className="text-xs text-muted-foreground text-center">
          Informational analysis only. No guarantees. Bet responsibly.
        </p>
      </CardContent>
    </Card>
  );
};