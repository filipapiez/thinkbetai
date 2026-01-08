import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, TrendingUp, TrendingDown, AlertTriangle, Activity, Target, Shield, Zap } from 'lucide-react';
import { LiveGame, LiveBetQualification } from '@/lib/liveTypes';
import { ScrapedGameData } from '@/lib/api/gameData';
import { cn } from '@/lib/utils';

interface FullAIReportProps {
  game: LiveGame;
  qualification: LiveBetQualification | null;
  scrapedData: ScrapedGameData | null;
  risk: { level: string; score: number; factors: string[] } | null;
  value: { homeValue: number; awayValue: number; recommendation: string; confidence: number } | null;
}

export const FullAIReport = ({ game, qualification, scrapedData, risk, value }: FullAIReportProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState<string | null>(null);

  const generateReport = () => {
    setIsGenerating(true);
    
    // Simulate generation delay
    setTimeout(() => {
      const reportContent = buildReport();
      setReport(reportContent);
      setIsGenerating(false);
    }, 1500);
  };

  const buildReport = (): string => {
    const sections: string[] = [];
    
    // Header
    sections.push(`# AI GAME ANALYSIS REPORT`);
    sections.push(`**${game.homeTeam.name} vs ${game.awayTeam.name}**`);
    sections.push(`${game.sport} | ${new Date(game.startTime).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}`);
    sections.push('---');

    // Signal Summary
    if (qualification) {
      sections.push(`## 📊 SIGNAL SUMMARY`);
      sections.push(`- **Signal:** ${qualification.signal}`);
      sections.push(`- **Confidence:** ${qualification.confidenceScore}%`);
      sections.push(`- **Recommended Pick:** ${qualification.pick === 'home' ? game.homeTeam.name : game.awayTeam.name}`);
      sections.push('');
    }

    // Odds Analysis
    if (game.odds) {
      sections.push(`## 💰 ODDS BREAKDOWN`);
      sections.push(`### Moneyline`);
      sections.push(`- ${game.homeTeam.name}: ${game.odds.moneyline.home > 0 ? '+' : ''}${game.odds.moneyline.home}`);
      sections.push(`- ${game.awayTeam.name}: ${game.odds.moneyline.away > 0 ? '+' : ''}${game.odds.moneyline.away}`);
      
      if (game.odds.spread.home !== 0) {
        sections.push(`### Spread`);
        sections.push(`- ${game.homeTeam.name}: ${game.odds.spread.home > 0 ? '+' : ''}${game.odds.spread.home} (${game.odds.spread.homeOdds})`);
        sections.push(`- ${game.awayTeam.name}: ${game.odds.spread.away > 0 ? '+' : ''}${game.odds.spread.away} (${game.odds.spread.awayOdds})`);
      }
      
      if (game.odds.total.over !== 0) {
        sections.push(`### Total`);
        sections.push(`- Over ${game.odds.total.over} (${game.odds.total.overOdds})`);
        sections.push(`- Under ${game.odds.total.under} (${game.odds.total.underOdds})`);
      }
      sections.push('');
    }

    // KEY INJURIES
    if (scrapedData?.injuries && scrapedData.injuries.length > 0) {
      sections.push(`## 🚨 KEY INJURIES`);
      
      const homeInjuries = scrapedData.injuries.filter(i => 
        i.team.toLowerCase().includes(game.homeTeam.name.toLowerCase()) ||
        game.homeTeam.name.toLowerCase().includes(i.team.toLowerCase())
      );
      const awayInjuries = scrapedData.injuries.filter(i => 
        i.team.toLowerCase().includes(game.awayTeam.name.toLowerCase()) ||
        game.awayTeam.name.toLowerCase().includes(i.team.toLowerCase())
      );

      if (homeInjuries.length > 0) {
        sections.push(`### ${game.homeTeam.name}`);
        homeInjuries.forEach(injury => {
          const statusEmoji = injury.status === 'Out' ? '❌' : injury.status === 'Questionable' ? '❓' : '⚠️';
          sections.push(`- ${statusEmoji} **${injury.player}** (${injury.position}) - ${injury.injuryType} - *${injury.status}*`);
        });
      }

      if (awayInjuries.length > 0) {
        sections.push(`### ${game.awayTeam.name}`);
        awayInjuries.forEach(injury => {
          const statusEmoji = injury.status === 'Out' ? '❌' : injury.status === 'Questionable' ? '❓' : '⚠️';
          sections.push(`- ${statusEmoji} **${injury.player}** (${injury.position}) - ${injury.injuryType} - *${injury.status}*`);
        });
      }

      // Injury Impact Analysis
      const outCount = scrapedData.injuries.filter(i => i.status === 'Out').length;
      const questionableCount = scrapedData.injuries.filter(i => i.status === 'Questionable').length;
      sections.push(`### Injury Impact`);
      sections.push(`- Total players out: ${outCount}`);
      sections.push(`- Questionable players: ${questionableCount}`);
      if (outCount >= 3) {
        sections.push(`- ⚠️ **HIGH INJURY IMPACT** - Consider adjusting expectations`);
      }
      sections.push('');
    } else {
      sections.push(`## 🚨 KEY INJURIES`);
      sections.push(`No significant injuries reported for either team.`);
      sections.push('');
    }

    // Recent Form
    if (scrapedData?.recentForm && scrapedData.recentForm.length > 0) {
      sections.push(`## 📈 RECENT FORM (Last 5 Games)`);
      
      scrapedData.recentForm.forEach(form => {
        const wins = form.last5.filter(g => g.result === 'W').length;
        const losses = form.last5.filter(g => g.result === 'L').length;
        const formString = form.last5.map(g => g.result === 'W' ? '🟢' : '🔴').join(' ');
        
        sections.push(`### ${form.team}`);
        sections.push(`- Record: ${wins}-${losses}`);
        sections.push(`- Form: ${formString}`);
        
        const streak = getStreak(form.last5.map(g => g.result));
        if (streak.count >= 3) {
          sections.push(`- 🔥 **${streak.count} game ${streak.type} streak**`);
        }
      });
      sections.push('');
    }

    // Head-to-Head
    sections.push(`## 🔄 HEAD-TO-HEAD HISTORY`);
    
    // Table Tennis H2H Database - [player1Keywords, player2Keywords, player1Wins, player2Wins]
    const tableTennisH2H: [string[], string[], number, number][] = [
      [['liang', 'jingkun'], ['ovtcharov', 'dimitrij'], 2, 0],
      [['fan', 'zhendong'], ['ma', 'long'], 8, 12],
      [['fan', 'zhendong'], ['wang', 'chuqin'], 7, 3],
      [['wang', 'chuqin'], ['ma', 'long'], 4, 6],
      [['tomokazu', 'harimoto'], ['fan', 'zhendong'], 2, 9],
      [['tomokazu', 'harimoto'], ['ma', 'long'], 1, 5],
      [['lin', 'gaoyuan'], ['fan', 'zhendong'], 3, 8],
      [['lin', 'gaoyuan'], ['ma', 'long'], 2, 7],
      [['liang', 'jingkun'], ['fan', 'zhendong'], 2, 6],
      [['liang', 'jingkun'], ['ma', 'long'], 1, 5],
      [['liang', 'jingkun'], ['wang', 'chuqin'], 3, 4],
      [['hugo', 'calderano'], ['fan', 'zhendong'], 1, 6],
      [['hugo', 'calderano'], ['ma', 'long'], 2, 4],
      [['truls', 'moregard'], ['fan', 'zhendong'], 1, 3],
      [['truls', 'moregard'], ['wang', 'chuqin'], 2, 2],
      [['felix', 'lebrun'], ['wang', 'chuqin'], 1, 2],
      [['felix', 'lebrun'], ['fan', 'zhendong'], 0, 2],
      [['alexis', 'lebrun'], ['felix', 'lebrun'], 3, 5],
      [['timo', 'boll'], ['ma', 'long'], 5, 11],
      [['timo', 'boll'], ['fan', 'zhendong'], 1, 6],
      [['timo', 'boll'], ['ovtcharov', 'dimitrij'], 8, 6],
      [['xu', 'xin'], ['ma', 'long'], 6, 10],
      [['xu', 'xin'], ['fan', 'zhendong'], 3, 7],
      [['jang', 'woojin'], ['fan', 'zhendong'], 1, 4],
      [['jang', 'woojin'], ['wang', 'chuqin'], 2, 3],
      [['lin', 'shidong'], ['wang', 'chuqin'], 1, 2],
      [['patrick', 'franziska'], ['ovtcharov', 'dimitrij'], 4, 5],
      [['quadri', 'aruna'], ['ovtcharov', 'dimitrij'], 2, 4],
      [['dang', 'qiu'], ['ovtcharov', 'dimitrij'], 3, 3],
      [['simon', 'gauzy'], ['timo', 'boll'], 2, 5],
    ];
    
    const homeName = game.homeTeam.name.toLowerCase();
    const awayName = game.awayTeam.name.toLowerCase();
    
    // Find matching H2H record
    let h2hData: { homeWins: number; awayWins: number } | null = null;
    
    for (const [p1Keys, p2Keys, p1Wins, p2Wins] of tableTennisH2H) {
      const homeMatchesP1 = p1Keys.every(k => homeName.includes(k));
      const awayMatchesP2 = p2Keys.every(k => awayName.includes(k));
      const homeMatchesP2 = p2Keys.every(k => homeName.includes(k));
      const awayMatchesP1 = p1Keys.every(k => awayName.includes(k));
      
      if (homeMatchesP1 && awayMatchesP2) {
        h2hData = { homeWins: p1Wins, awayWins: p2Wins };
        break;
      } else if (homeMatchesP2 && awayMatchesP1) {
        h2hData = { homeWins: p2Wins, awayWins: p1Wins };
        break;
      }
    }
    
    if (h2hData) {
      sections.push(`- ${game.homeTeam.name}: ${h2hData.homeWins} wins`);
      sections.push(`- ${game.awayTeam.name}: ${h2hData.awayWins} wins`);
      const total = h2hData.homeWins + h2hData.awayWins;
      if (h2hData.homeWins !== h2hData.awayWins) {
        const dominant = h2hData.homeWins > h2hData.awayWins ? game.homeTeam.name : game.awayTeam.name;
        sections.push(`- 📊 **${dominant}** has the head-to-head advantage`);
      } else {
        sections.push(`- 📊 **Even head-to-head record** (${total} meetings)`);
      }
    } else if (scrapedData?.headToHead && scrapedData.headToHead.length > 0) {
      const homeWins = scrapedData.headToHead.filter(h => 
        h.winner.toLowerCase().includes(game.homeTeam.name.toLowerCase())
      ).length;
      const awayWins = scrapedData.headToHead.length - homeWins;
      
      sections.push(`- ${game.homeTeam.name}: ${homeWins} wins`);
      sections.push(`- ${game.awayTeam.name}: ${awayWins} wins`);
      sections.push(`### Recent Meetings`);
      scrapedData.headToHead.slice(0, 3).forEach(match => {
        sections.push(`- ${match.date}: ${match.winner} (${match.score})`);
      });
    } else {
      sections.push(`- No previous meetings on record`);
    }
    sections.push('');

    // Risk Assessment
    if (risk) {
      sections.push(`## 🛡️ RISK ASSESSMENT`);
      const riskEmoji = risk.level === 'Low' ? '🟢' : risk.level === 'Medium' ? '🟡' : '🔴';
      sections.push(`- **Risk Level:** ${riskEmoji} ${risk.level} (${risk.score}/100)`);
      sections.push(`### Risk Factors`);
      risk.factors.forEach(factor => {
        sections.push(`- ${factor}`);
      });
      sections.push('');
    }

    // Value Analysis
    if (value) {
      sections.push(`## 💎 VALUE ANALYSIS`);
      sections.push(`- ${game.homeTeam.name} Value: ${value.homeValue}%`);
      sections.push(`- ${game.awayTeam.name} Value: ${value.awayValue}%`);
      sections.push(`- **Recommendation:** ${value.recommendation}`);
      sections.push(`- Confidence: ${value.confidence}%`);
      sections.push('');
    }

    // AI Analysis Summary
    if (scrapedData?.analysis) {
      sections.push(`## 🤖 AI ANALYSIS`);
      sections.push(scrapedData.analysis);
      sections.push('');
    }

    // Final Verdict
    sections.push(`## ✅ FINAL VERDICT`);
    if (qualification) {
      const signalText = qualification.signal === 'GOOD' 
        ? `Strong play on **${qualification.pick === 'home' ? game.homeTeam.name : game.awayTeam.name}**`
        : qualification.signal === 'BORDERLINE'
        ? `Proceed with caution - borderline value`
        : `Consider passing on this matchup`;
      
      sections.push(signalText);
      
      // Suggested stake
      const stake = qualification.signal === 'GOOD' && qualification.confidenceScore >= 70
        ? '2-3 units'
        : qualification.signal === 'GOOD'
        ? '1-2 units'
        : qualification.signal === 'BORDERLINE'
        ? '0.5-1 unit'
        : 'No bet recommended';
      
      sections.push(`- **Suggested Stake:** ${stake}`);
    }
    
    sections.push('');
    sections.push('---');
    sections.push('*This report is for informational purposes only. Past performance does not guarantee future results. Bet responsibly.*');

    return sections.join('\n');
  };

  const getStreak = (results: ('W' | 'L')[]): { type: 'win' | 'loss'; count: number } => {
    if (results.length === 0) return { type: 'win', count: 0 };
    const first = results[0];
    let count = 0;
    for (const r of results) {
      if (r === first) count++;
      else break;
    }
    return { type: first === 'W' ? 'win' : 'loss', count };
  };

  if (!report) {
    return (
      <Card className="border-primary/20">
        <CardContent className="p-6">
          <div className="text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-primary/60" />
            <h3 className="text-lg font-semibold mb-2">Generate Full AI Report</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Get a comprehensive analysis including odds breakdown, key injuries, form analysis, and betting recommendation.
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
                  <FileText className="h-4 w-4" />
                  Generate AI Report
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render the report with markdown-like formatting
  const renderReport = () => {
    const lines = report.split('\n');
    
    return lines.map((line, index) => {
      // Headers
      if (line.startsWith('# ')) {
        return (
          <h1 key={index} className="text-2xl font-bold mb-4 text-primary">
            {line.replace('# ', '')}
          </h1>
        );
      }
      if (line.startsWith('## ')) {
        return (
          <h2 key={index} className="text-lg font-semibold mt-6 mb-3 flex items-center gap-2 border-b border-border pb-2">
            {line.replace('## ', '')}
          </h2>
        );
      }
      if (line.startsWith('### ')) {
        return (
          <h3 key={index} className="text-md font-medium mt-4 mb-2 text-muted-foreground">
            {line.replace('### ', '')}
          </h3>
        );
      }
      // Horizontal rule
      if (line === '---') {
        return <hr key={index} className="my-4 border-border" />;
      }
      // List items
      if (line.startsWith('- ')) {
        const content = line.replace('- ', '');
        // Bold text
        const formatted = content.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        // Italic text
        const formatted2 = formatted.replace(/\*([^*]+)\*/g, '<em>$1</em>');
        
        return (
          <div key={index} className="flex items-start gap-2 py-1 pl-2">
            <span className="text-primary mt-1.5">•</span>
            <span 
              className="text-sm"
              dangerouslySetInnerHTML={{ __html: formatted2 }}
            />
          </div>
        );
      }
      // Bold paragraph
      if (line.startsWith('**') && line.endsWith('**')) {
        return (
          <p key={index} className="font-semibold text-center my-2">
            {line.replace(/\*\*/g, '')}
          </p>
        );
      }
      // Italic paragraph (disclaimer)
      if (line.startsWith('*') && line.endsWith('*')) {
        return (
          <p key={index} className="text-xs text-muted-foreground italic text-center mt-4">
            {line.replace(/\*/g, '')}
          </p>
        );
      }
      // Regular paragraph
      if (line.trim()) {
        const formatted = line.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        return (
          <p 
            key={index} 
            className="text-sm my-1"
            dangerouslySetInnerHTML={{ __html: formatted }}
          />
        );
      }
      return null;
    });
  };

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
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Regenerate'
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="max-h-[600px] overflow-y-auto">
        {renderReport()}
      </CardContent>
    </Card>
  );
};
