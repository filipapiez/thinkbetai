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
          
          <div className="space-y-1">
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
        </div>
      </CardContent>
    </Card>
  );
};
