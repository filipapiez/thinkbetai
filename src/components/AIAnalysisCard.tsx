import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2, 
  Activity, 
  Flame,
  Info,
  XCircle,
  Sparkles,
  Loader2
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
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AIAnalysisCardProps {
  game: LiveGame;
  qualification: LiveBetQualification | null;
  scrapedData: ScrapedGameData | null;
  riskAssessment?: { level: 'Low' | 'Medium' | 'High'; score: number } | null;
}

type TieredSignal = 'STRONG_VALUE' | 'QUALIFIED' | 'RISKY' | 'AVOID';

interface QualifyingFactor {
  label: string;
  positive: boolean;
}

interface AIAnalysis {
  signal: TieredSignal;
  confidence: number;
  pick: 'home' | 'away';
  pickTeam: string;
  verdict: string;
  factors: QualifyingFactor[];
  injurySummary: string | null;
  riskLevel: 'Low' | 'Medium' | 'High';
  suggestedStake: string;
  keyInsight: string;
  reasoning: string;
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

function getFactorIcon(label: string, positive: boolean) {
  const lowerLabel = label.toLowerCase();
  if (lowerLabel.includes('form') || lowerLabel.includes('streak')) {
    return positive ? TrendingUp : TrendingDown;
  }
  if (lowerLabel.includes('injury')) {
    return AlertTriangle;
  }
  return positive ? CheckCircle2 : AlertTriangle;
}

export const AIAnalysisCard = ({ game, qualification, scrapedData, riskAssessment }: AIAnalysisCardProps) => {
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  const generateAnalysis = async () => {
    setIsLoading(true);
    
    try {
      const gameData = {
        homeTeam: game.homeTeam.name,
        awayTeam: game.awayTeam.name,
        sport: game.sport,
        // Pass the initial qualification so AI aligns with header signal
        initialQualification: qualification ? {
          signal: qualification.signal,
          confidenceScore: qualification.confidenceScore,
          pick: qualification.pick,
        } : undefined,
        // Pass the initial risk so AI aligns with risk assessment
        initialRisk: riskAssessment ? {
          level: riskAssessment.level,
          score: riskAssessment.score,
        } : undefined,
        odds: game.odds ? {
          moneyline: game.odds.moneyline,
          spread: game.odds.spread,
          total: game.odds.total
        } : undefined,
        injuries: scrapedData?.injuries,
        recentForm: scrapedData?.recentForm,
        headToHead: scrapedData?.headToHead,
        teamStats: scrapedData?.teamStats
      };

      const { data, error } = await supabase.functions.invoke('analyze-game', {
        body: gameData
      });

      if (error) {
        console.error('Error calling analyze-game:', error);
        toast.error('Failed to generate AI analysis');
        return;
      }

      if (data?.success && data?.analysis) {
        setAnalysis(data.analysis);
        setHasGenerated(true);
      } else if (data?.error) {
        toast.error(data.error);
      }
    } catch (err) {
      console.error('Error generating analysis:', err);
      toast.error('Failed to generate AI analysis');
    } finally {
      setIsLoading(false);
    }
  };

  // If no analysis yet, show generate button
  if (!hasGenerated) {
    return (
      <Card className="col-span-full">
        <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            AI Match Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-sm text-muted-foreground mb-4">
            Get real AI-powered insights analyzing injuries, form, odds, and matchup factors.
          </p>
          <Button 
            variant="default" 
            onClick={generateAnalysis}
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate AI Analysis
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) return null;

  const style = getTieredSignalStyle(analysis.signal);
  
  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            AI Match Analysis
          </span>
          <Badge variant="outline" className={cn("text-sm px-3 py-1", style.bg, style.text, style.border)}>
            {style.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* AI Verdict */}
        <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
          <p className="text-sm font-medium">{analysis.verdict}</p>
          <p className="text-sm text-muted-foreground mt-2">{analysis.reasoning}</p>
        </div>

        {/* Key Insight */}
        {analysis.keyInsight && (
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 flex items-start gap-3">
            <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div>
              <span className="text-sm font-medium text-primary">Key Insight: </span>
              <span className="text-sm text-foreground/90">{analysis.keyInsight}</span>
            </div>
          </div>
        )}

        {/* Why This Match Qualifies - Bullet Points */}
        <div>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            Analysis Factors
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {analysis.factors.map((factor, idx) => {
              const Icon = getFactorIcon(factor.label, factor.positive);
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
              <span className="text-sm font-medium text-amber-400">Injury Impact: </span>
              <span className="text-sm text-foreground/80">{analysis.injurySummary}</span>
            </div>
          </div>
        )}
        
        {/* Confidence with Tooltip */}
        <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">{analysis.confidence}%</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">
                    AI confidence based on analyzed factors including injuries, form, and odds alignment.
                    This is not a guarantee of outcome.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="text-sm text-muted-foreground">
            AI Confidence
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
          
          {analysis.signal === 'AVOID' ? (
            <p className="text-sm text-foreground/90">
              Skip this matchup. The risk factors outweigh potential value. Protect your bankroll for clearer opportunities.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="text-center p-2 rounded bg-background/50">
                <div className="text-xs text-muted-foreground mb-1">Pick</div>
                <div className="font-semibold text-sm">{analysis.pickTeam}</div>
                <div className="text-xs text-muted-foreground">({analysis.pick === 'home' ? 'Home' : 'Away'})</div>
              </div>
              <div className="text-center p-2 rounded bg-background/50">
                <div className="text-xs text-muted-foreground mb-1">Confidence</div>
                <div className="font-semibold text-sm">{analysis.confidence}%</div>
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

        {/* Regenerate button */}
        <div className="flex justify-center">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={generateAnalysis}
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Regenerating...
              </>
            ) : (
              <>
                <Sparkles className="h-3 w-3" />
                Regenerate Analysis
              </>
            )}
          </Button>
        </div>
        
        {/* Soft Disclaimer */}
        <p className="text-xs text-muted-foreground text-center">
          AI analysis for informational purposes only. No guarantees. Bet responsibly.
        </p>
      </CardContent>
    </Card>
  );
};
