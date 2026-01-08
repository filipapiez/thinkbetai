import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Users } from 'lucide-react';
import { ScrapedRecentForm, ScrapedH2H } from '@/lib/api/gameData';
import { cn } from '@/lib/utils';

interface ScrapedFormCardProps {
  recentForm: ScrapedRecentForm[];
  headToHead: ScrapedH2H[];
  homeTeam: string;
  awayTeam: string;
}

export const ScrapedFormCard = ({ recentForm, headToHead, homeTeam, awayTeam }: ScrapedFormCardProps) => {
  const homeForm = recentForm.find(f => f.team === homeTeam);
  const awayForm = recentForm.find(f => f.team === awayTeam);

  const getRecord = (games: { result: 'W' | 'L' }[] | undefined) => {
    if (!games) return { wins: 0, losses: 0 };
    const wins = games.filter(g => g.result === 'W').length;
    return { wins, losses: games.length - wins };
  };

  const homeRecord = getRecord(homeForm?.last5);
  const awayRecord = getRecord(awayForm?.last5);

  const h2hHomeWins = headToHead.filter(h => h.winner === homeTeam).length;
  const h2hAwayWins = headToHead.filter(h => h.winner === awayTeam).length;

  const FormDisplay = ({ form, teamName }: { form: ScrapedRecentForm | undefined; teamName: string }) => {
    const record = getRecord(form?.last5);
    const isGood = record.wins >= 3;
    
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            {isGood ? (
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            ) : (
              <TrendingDown className="h-4 w-4 text-rose-400" />
            )}
            {teamName}
          </h4>
          <Badge variant="outline" className={cn(
            "text-xs",
            isGood ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" : "bg-rose-500/20 text-rose-400 border-rose-500/40"
          )}>
            {record.wins}-{record.losses} Last 5
          </Badge>
        </div>
        
        <div className="flex gap-1">
          {form?.last5.map((game, idx) => (
            <div
              key={idx}
              className={cn(
                "flex-1 h-8 rounded flex items-center justify-center text-xs font-bold",
                game.result === 'W' 
                  ? "bg-emerald-500/20 text-emerald-400" 
                  : "bg-rose-500/20 text-rose-400"
              )}
            >
              {game.result}
            </div>
          ))}
        </div>
        
        <div className="space-y-1">
          {form?.last5.slice(0, 3).map((game, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs text-muted-foreground">
              <span>vs {game.opponent}</span>
              <span className={cn(
                game.result === 'W' ? "text-emerald-400" : "text-rose-400"
              )}>
                {game.result} {game.score}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Generate conclusion based on form
  const getFormConclusion = () => {
    const homeBetter = homeRecord.wins > awayRecord.wins;
    const awayBetter = awayRecord.wins > homeRecord.wins;
    const homeHot = homeRecord.wins >= 4;
    const awayHot = awayRecord.wins >= 4;
    
    if (homeHot && !awayHot) {
      return `${homeTeam} enters with strong momentum (${homeRecord.wins}-${homeRecord.losses}), giving them an edge.`;
    }
    if (awayHot && !homeHot) {
      return `${awayTeam} has the form advantage with ${awayRecord.wins} wins in their last 5.`;
    }
    if (homeHot && awayHot) {
      return `Both teams are in excellent form. Expect a competitive, high-quality matchup.`;
    }
    if (homeBetter) {
      return `${homeTeam} holds a slight form edge, but neither team has dominant momentum.`;
    }
    if (awayBetter) {
      return `${awayTeam} has marginally better recent results, though both sides are inconsistent.`;
    }
    return `Recent form shows no strong momentum edge for either team.`;
  };
  
  // Generate H2H conclusion
  const getH2HConclusion = () => {
    if (h2hHomeWins > h2hAwayWins + 1) {
      return `${homeTeam} dominates this rivalry historically.`;
    }
    if (h2hAwayWins > h2hHomeWins + 1) {
      return `${awayTeam} has the edge in recent head-to-head meetings.`;
    }
    if (h2hHomeWins === h2hAwayWins) {
      return `Even split historically — neither team owns this matchup.`;
    }
    return `Slight historical lean, but head-to-head is close.`;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Recent Form & Head-to-Head
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormDisplay form={homeForm} teamName={homeTeam} />
          <FormDisplay form={awayForm} teamName={awayTeam} />
        </div>
        
        {/* Form Conclusion */}
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
          <p className="text-sm text-foreground/80">
            <span className="font-medium">Takeaway: </span>
            {getFormConclusion()}
          </p>
        </div>

        <div className="border-t border-border pt-4">
          <h4 className="text-sm font-semibold mb-3">Head-to-Head (Last 5)</h4>
          <div className="flex items-center justify-between mb-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-400">{h2hHomeWins}</div>
              <div className="text-xs text-muted-foreground">{homeTeam}</div>
            </div>
            <div className="text-sm text-muted-foreground">vs</div>
            <div className="text-center">
              <div className="text-2xl font-bold text-rose-400">{h2hAwayWins}</div>
              <div className="text-xs text-muted-foreground">{awayTeam}</div>
            </div>
          </div>
          
          <div className="space-y-1 mb-3">
            {headToHead.slice(0, 3).map((match, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{match.date}</span>
                <span className={cn(
                  match.winner === homeTeam ? "text-emerald-400" : "text-rose-400"
                )}>
                  {match.winner} ({match.score})
                </span>
              </div>
            ))}
          </div>
          
          {/* H2H Conclusion */}
          <p className="text-xs text-muted-foreground italic">
            {getH2HConclusion()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
