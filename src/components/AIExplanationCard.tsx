import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, ChevronDown, ChevronUp, AlertTriangle, Target, TrendingUp, Shield, Loader2 } from 'lucide-react';
import { GameFacts } from '@/lib/mockData';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AIExplanationCardProps {
  gameId: string;
  facts?: GameFacts;
}

interface AIExplanation {
  verdict: string;
  probability: string;
  sections: Array<{
    title: string;
    content: string[];
  }>;
}

export const AIExplanationCard = ({ gameId, facts }: AIExplanationCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [explanation, setExplanation] = useState<AIExplanation | null>(null);

  const handleGenerateExplanation = async () => {
    if (!facts) return;
    
    setIsLoading(true);
    
    try {
      const gameData = {
        homeTeam: facts.game.homeTeam.name,
        awayTeam: facts.game.awayTeam.name,
        sport: facts.game.sport,
        odds: facts.odds ? {
          moneyline: facts.odds.moneyline,
          spread: facts.odds.spread,
          total: facts.odds.total
        } : undefined,
        injuries: facts.injuries?.map(i => ({
          team: i.team,
          player: i.player,
          position: i.position,
          injuryType: i.injuryType,
          status: i.status
        })),
        recentForm: facts.recentForm ? [
          { team: facts.game.homeTeam.name, last5: facts.recentForm.homeLast5 },
          { team: facts.game.awayTeam.name, last5: facts.recentForm.awayLast5 }
        ] : undefined
      };

      const { data, error } = await supabase.functions.invoke('analyze-game', {
        body: gameData
      });

      if (error) {
        console.error('Error:', error);
        toast.error('Failed to generate analysis');
        return;
      }

      if (data?.success && data?.analysis) {
        const analysis = data.analysis;
        setExplanation({
          verdict: `${analysis.signal === 'STRONG_VALUE' || analysis.signal === 'QUALIFIED' ? 'Lean' : 'Caution'} ${analysis.pickTeam}`,
          probability: `${analysis.confidence}% confidence`,
          sections: [
            {
              title: 'KEY INSIGHT',
              content: [analysis.keyInsight, analysis.reasoning]
            },
            {
              title: 'ANALYSIS FACTORS',
              content: analysis.factors.map((f: any) => `${f.positive ? '✓' : '⚠️'} ${f.label}`)
            },
            {
              title: 'RISK ASSESSMENT',
              content: [
                `Risk Level: ${analysis.riskLevel}`,
                analysis.injurySummary ? `Injuries: ${analysis.injurySummary}` : 'No significant injury concerns'
              ]
            },
            {
              title: 'RECOMMENDATION',
              content: [
                `Signal: ${analysis.signal}`,
                `Suggested Stake: ${analysis.suggestedStake}`
              ]
            }
          ]
        });
        setIsExpanded(true);
      } else if (data?.error) {
        toast.error(data.error);
      }
    } catch (err) {
      console.error('Error:', err);
      toast.error('Failed to generate analysis');
    } finally {
      setIsLoading(false);
    }
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
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  <span>Analyzing...</span>
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
                    {section.title === 'RISK ASSESSMENT' && <Shield className="h-4 w-4" />}
                    {section.title === 'KEY INSIGHT' && <TrendingUp className="h-4 w-4" />}
                    {section.title === 'ANALYSIS FACTORS' && <Target className="h-4 w-4" />}
                    {section.title === 'RECOMMENDATION' && <Sparkles className="h-4 w-4" />}
                    {section.title}
                  </h3>
                  <ul className="space-y-1">
                    {section.content.filter(Boolean).map((item, iIdx) => (
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

            {/* Disclaimer */}
            <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 flex gap-2">
              <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
              <p className="text-xs text-warning/80">
                This analysis is for informational purposes only, not betting advice. Past performance does not guarantee future results.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
