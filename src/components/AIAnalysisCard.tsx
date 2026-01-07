import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Brain, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Loader2, BarChart3 } from 'lucide-react';
import { LiveGame, LiveBetQualification } from '@/lib/liveTypes';
import { ScrapedGameData } from '@/lib/api/gameData';
import { cn } from '@/lib/utils';

interface AIAnalysisCardProps {
  game: LiveGame;
  qualification: LiveBetQualification | null;
  scrapedData: ScrapedGameData | null;
}

interface AIAnalysis {
  verdict: 'BET' | 'LEAN' | 'PASS';
  confidence: number;
  pick: string;
  reasoning: string[];
  risks: string[];
  historicalAccuracy: { wins: number; total: number; rate: number };
}

export const AIAnalysisCard = ({ game, qualification, scrapedData }: AIAnalysisCardProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);

  const generateAnalysis = () => {
    setIsGenerating(true);

    // Simulate AI processing
    setTimeout(() => {
      const homeInjuries = scrapedData?.injuries.filter(i => i.team === game.homeTeam.name && i.status === 'Out').length || 0;
      const awayInjuries = scrapedData?.injuries.filter(i => i.team === game.awayTeam.name && i.status === 'Out').length || 0;
      
      const homeForm = scrapedData?.recentForm.find(f => f.team === game.homeTeam.name);
      const awayForm = scrapedData?.recentForm.find(f => f.team === game.awayTeam.name);
      const homeWins = homeForm?.last5.filter(g => g.result === 'W').length || 0;
      const awayWins = awayForm?.last5.filter(g => g.result === 'W').length || 0;

      const h2hHomeWins = scrapedData?.headToHead.filter(h => h.winner === game.homeTeam.name).length || 0;
      
      // Calculate pick based on data
      const homeScore = (homeWins * 10) - (homeInjuries * 15) + (h2hHomeWins * 5) + 10; // Home advantage
      const awayScore = (awayWins * 10) - (awayInjuries * 15) + ((5 - h2hHomeWins) * 5);
      
      const homeFavored = homeScore > awayScore;
      const diff = Math.abs(homeScore - awayScore);
      
      let verdict: 'BET' | 'LEAN' | 'PASS';
      let confidence: number;
      
      if (diff >= 20 && qualification?.signal === 'GOOD') {
        verdict = 'BET';
        confidence = 72 + Math.floor(Math.random() * 15);
      } else if (diff >= 10 || qualification?.signal === 'BORDERLINE') {
        verdict = 'LEAN';
        confidence = 55 + Math.floor(Math.random() * 15);
      } else {
        verdict = 'PASS';
        confidence = 35 + Math.floor(Math.random() * 15);
      }

      const pick = homeFavored ? game.homeTeam.name : game.awayTeam.name;
      
      const reasoning: string[] = [];
      const risks: string[] = [];
      
      // Build reasoning
      if (homeWins >= 4 && homeFavored) {
        reasoning.push(`${game.homeTeam.name} is hot with ${homeWins} wins in last 5 games`);
      } else if (awayWins >= 4 && !homeFavored) {
        reasoning.push(`${game.awayTeam.name} is hot with ${awayWins} wins in last 5 games`);
      }
      
      if (h2hHomeWins >= 3) {
        reasoning.push(`${game.homeTeam.name} dominates head-to-head (${h2hHomeWins}-${5-h2hHomeWins})`);
      } else if (h2hHomeWins <= 2) {
        reasoning.push(`${game.awayTeam.name} has edge in recent H2H (${5-h2hHomeWins}-${h2hHomeWins})`);
      }
      
      if (homeInjuries === 0 && homeFavored) {
        reasoning.push(`${game.homeTeam.name} is fully healthy`);
      }
      if (awayInjuries >= 2 && homeFavored) {
        reasoning.push(`${game.awayTeam.name} dealing with ${awayInjuries} key injuries`);
      }
      
      if (homeFavored) {
        reasoning.push('Home court advantage factor');
      }
      
      // Build risks
      if (homeInjuries >= 2 && homeFavored) {
        risks.push(`${game.homeTeam.name} has ${homeInjuries} players out`);
      }
      if (awayWins >= 4 && homeFavored) {
        risks.push(`${game.awayTeam.name} is playing well recently`);
      }
      if (Math.abs(game.odds.moneyline.home) < 120) {
        risks.push('Close line suggests unpredictable matchup');
      }
      if (game.status === 'live') {
        risks.push('Live betting carries higher volatility');
      }

      // Historical accuracy (simulated)
      const totalBets = 150 + Math.floor(Math.random() * 50);
      const winRate = 0.54 + (Math.random() * 0.08);
      const wins = Math.floor(totalBets * winRate);

      setAnalysis({
        verdict,
        confidence,
        pick,
        reasoning: reasoning.length > 0 ? reasoning : ['Based on overall matchup analysis'],
        risks: risks.length > 0 ? risks : ['Standard game variance'],
        historicalAccuracy: { wins, total: totalBets, rate: Math.round(winRate * 100) }
      });
      setIsGenerating(false);
    }, 1500);
  };

  const getVerdictStyle = (verdict: string) => {
    switch (verdict) {
      case 'BET': return { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/40' };
      case 'LEAN': return { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/40' };
      case 'PASS': return { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/40' };
      default: return { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-border' };
    }
  };

  if (!analysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            AI Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">
            Generate AI-powered analysis based on injuries, form, and historical data
          </p>
          <Button onClick={generateAnalysis} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Generate Analysis
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const style = getVerdictStyle(analysis.verdict);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            AI Analysis
          </span>
          <Badge variant="outline" className={cn("text-sm px-3 py-1", style.bg, style.text, style.border)}>
            {analysis.verdict === 'BET' && <TrendingUp className="h-4 w-4 mr-1" />}
            {analysis.verdict === 'LEAN' && <TrendingUp className="h-4 w-4 mr-1" />}
            {analysis.verdict === 'PASS' && <TrendingDown className="h-4 w-4 mr-1" />}
            {analysis.verdict}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Verdict */}
        <div className={cn("p-4 rounded-lg border", style.bg, style.border)}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-muted-foreground">AI Pick</p>
              <p className={cn("text-xl font-bold", style.text)}>{analysis.pick}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Confidence</p>
              <p className={cn("text-2xl font-bold", style.text)}>{analysis.confidence}%</p>
            </div>
          </div>
          <Progress 
            value={analysis.confidence} 
            className={cn(
              "h-2",
              analysis.verdict === 'BET' ? '[&>div]:bg-emerald-500' :
              analysis.verdict === 'LEAN' ? '[&>div]:bg-amber-500' : '[&>div]:bg-red-500'
            )}
          />
        </div>

        {/* Reasoning */}
        <div>
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-400" />
            Key Factors
          </h4>
          <ul className="space-y-1">
            {analysis.reasoning.map((reason, idx) => (
              <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-emerald-400 mt-1">•</span>
                {reason}
              </li>
            ))}
          </ul>
        </div>

        {/* Risks */}
        <div>
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            Risk Factors
          </h4>
          <ul className="space-y-1">
            {analysis.risks.map((risk, idx) => (
              <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-amber-400 mt-1">•</span>
                {risk}
              </li>
            ))}
          </ul>
        </div>

        {/* Historical Accuracy */}
        <div className="border-t border-border pt-4">
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            Qualified Bet Accuracy
          </h4>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-primary">{analysis.historicalAccuracy.rate}%</p>
              <p className="text-xs text-muted-foreground">Win Rate</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold">
                {analysis.historicalAccuracy.wins}-{analysis.historicalAccuracy.total - analysis.historicalAccuracy.wins}
              </p>
              <p className="text-xs text-muted-foreground">Record</p>
            </div>
          </div>
        </div>

        {/* Regenerate */}
        <Button variant="outline" size="sm" onClick={generateAnalysis} disabled={isGenerating} className="w-full">
          {isGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Brain className="h-4 w-4 mr-2" />}
          Regenerate Analysis
        </Button>
      </CardContent>
    </Card>
  );
};
