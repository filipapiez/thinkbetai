import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, FileText, Sparkles } from 'lucide-react';
import { LiveGame } from '@/lib/liveTypes';
import { ScrapedGameData } from '@/lib/api/gameData';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

interface FullAIReportProps {
  game: LiveGame;
  scrapedData: ScrapedGameData | null;
}

export const FullAIReport = ({ game, scrapedData }: FullAIReportProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState<string | null>(null);

  const generateReport = async () => {
    setIsGenerating(true);
    
    try {
      const gameData = {
        homeTeam: game.homeTeam.name,
        awayTeam: game.awayTeam.name,
        sport: game.sport,
        odds: game.odds ? {
          moneyline: game.odds.moneyline,
          spread: game.odds.spread,
          total: game.odds.total
        } : undefined,
        injuries: scrapedData?.injuries,
        recentForm: scrapedData?.recentForm,
        headToHead: scrapedData?.headToHead
      };

      const { data, error } = await supabase.functions.invoke('generate-report', {
        body: gameData
      });

      if (error) {
        console.error('Error generating report:', error);
        toast.error('Failed to generate report');
        return;
      }

      if (data?.success && data?.report) {
        setReport(data.report);
      } else if (data?.error) {
        toast.error(data.error);
      }
    } catch (err) {
      console.error('Error:', err);
      toast.error('Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!report) {
    return (
      <Card className="border-primary/20">
        <CardContent className="p-6">
          <div className="text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-primary/60" />
            <h3 className="text-lg font-semibold mb-2">Generate Full AI Report</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Get a comprehensive AI-powered analysis including odds breakdown, injury impact, form analysis, and betting recommendation.
            </p>
            <Button 
              onClick={generateReport} 
              disabled={isGenerating}
              size="lg"
              className="gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating Report...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate AI Report
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Full AI Report
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={generateReport}
            disabled={isGenerating}
            className="gap-2"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Sparkles className="h-3 w-3" />
                Regenerate
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="max-h-[600px] overflow-y-auto prose prose-sm prose-invert max-w-none">
        <ReactMarkdown
          components={{
            h1: ({ children }) => <h1 className="text-2xl font-bold mb-4 text-primary">{children}</h1>,
            h2: ({ children }) => <h2 className="text-lg font-semibold mt-6 mb-3 border-b border-border pb-2">{children}</h2>,
            h3: ({ children }) => <h3 className="text-md font-medium mt-4 mb-2 text-muted-foreground">{children}</h3>,
            p: ({ children }) => <p className="text-sm my-2 text-foreground/90">{children}</p>,
            ul: ({ children }) => <ul className="space-y-1 my-2">{children}</ul>,
            li: ({ children }) => (
              <li className="flex items-start gap-2 text-sm">
                <span className="text-primary mt-1.5">•</span>
                <span>{children}</span>
              </li>
            ),
            strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
            em: ({ children }) => <em className="italic text-muted-foreground">{children}</em>,
            hr: () => <hr className="my-4 border-border" />,
          }}
        >
          {report}
        </ReactMarkdown>
        <p className="text-xs text-muted-foreground italic text-center mt-6">
          This report is for informational purposes only. Past performance does not guarantee future results. Bet responsibly.
        </p>
      </CardContent>
    </Card>
  );
};
