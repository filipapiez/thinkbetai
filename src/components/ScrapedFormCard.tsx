import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Users, AlertTriangle } from 'lucide-react';
import { ScrapedRecentForm, ScrapedH2H, ScrapedH2HMeta } from '@/lib/api/gameData';
import { cn } from '@/lib/utils';

interface ScrapedFormCardProps {
  recentForm: ScrapedRecentForm[];
  headToHead: ScrapedH2H[];
  headToHeadMeta?: ScrapedH2HMeta;
  homeTeam: string;
  awayTeam: string;
}

export const ScrapedFormCard = ({ recentForm, headToHead, headToHeadMeta, homeTeam, awayTeam }: ScrapedFormCardProps) => {
  // Fuzzy match helper for team names
  const matchesTeam = (name: string, team: string): boolean => {
    const n = name.toLowerCase().trim();
    const t = team.toLowerCase().trim();
    return n === t || n.includes(t) || t.includes(n);
  };

  const homeForm = recentForm.find(f => matchesTeam(f.team, homeTeam));
  const awayForm = recentForm.find(f => matchesTeam(f.team, awayTeam));

  const getRecord = (games: { result: 'W' | 'L' }[] | undefined) => {
    if (!games) return { wins: 0, losses: 0 };
    const wins = games.filter(g => g.result === 'W').length;
    return { wins, losses: games.length - wins };
  };

  const homeRecord = getRecord(homeForm?.last5);
  const awayRecord = getRecord(awayForm?.last5);

  const h2hHomeWins = headToHead.filter(h => matchesTeam(h.winner, homeTeam)).length;
  const h2hAwayWins = headToHead.filter(h => matchesTeam(h.winner, awayTeam)).length;

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
        
        {form?.last5 && form.last5.length > 0 ? (
          <>
            <div className="flex gap-1">
              {form.last5.map((game, idx) => (
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
              {form.last5.slice(0, 3).map((game, idx) => (
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
          </>
        ) : (
          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <p className="text-xs text-muted-foreground">No verified recent matches found</p>
          </div>
        )}
      </div>
    );
  };

  // Generate conclusion based on form
  const getFormConclusion = () => {
    if (!homeForm?.last5?.length && !awayForm?.last5?.length) {
      return "No verified form data available for this matchup.";
    }
    
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
    if (headToHead.length === 0) {
      return "No verified head-to-head history available.";
    }
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
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Recent Form & Head-to-Head
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormDisplay form={homeForm} teamName={homeTeam} />
          <FormDisplay form={awayForm} teamName={awayTeam} />
        </div>
        
        {/* Form Conclusion */}
        <div className="p-3 rounded-lg border bg-primary/5 border-primary/20">
          <p className="text-sm text-foreground/80">
            <span className="font-medium">Takeaway: </span>
            {getFormConclusion()}
          </p>
        </div>

        <div className="border-t border-border pt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              Head-to-Head (Last 5)
            </h4>
            {headToHeadMeta?.limitedData && (
              <Badge variant="outline" className="bg-amber-500/20 text-amber-400 border-amber-500/40 text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Limited Data
              </Badge>
            )}
          </div>
          
          {headToHeadMeta?.limitedData && headToHeadMeta.message && (
            <div className="p-2 mb-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-xs text-amber-400">
                {headToHeadMeta.message}
              </p>
            </div>
          )}
          
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
          
          {headToHead.length > 0 ? (
            <div className="space-y-1 mb-3">
              {headToHead.slice(0, 3).map((match, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{match.date}</span>
                  <span className={cn(
                    matchesTeam(match.winner, homeTeam) ? "text-emerald-400" : "text-rose-400"
                  )}>
                    {match.winner} ({match.score})
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-muted/50 text-center mb-3">
              <p className="text-xs text-muted-foreground">No verified head-to-head matches available</p>
            </div>
          )}
          
          {/* H2H Conclusion */}
          <p className="text-xs text-muted-foreground italic">
            {getH2HConclusion()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
