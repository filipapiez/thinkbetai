import { GameResult, HeadToHead } from '@/lib/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, History } from 'lucide-react';

interface RecentFormCardProps {
  homeLast5: GameResult[];
  awayLast5: GameResult[];
  headToHead: HeadToHead[];
  homeTeam: string;
  awayTeam: string;
}

export const RecentFormCard = ({ 
  homeLast5, 
  awayLast5, 
  headToHead, 
  homeTeam, 
  awayTeam 
}: RecentFormCardProps) => {
  const getRecord = (games: GameResult[]) => {
    const wins = games.filter(g => g.result === 'W').length;
    const losses = games.filter(g => g.result === 'L').length;
    return `${wins}-${losses}`;
  };

  const ResultBadge = ({ result }: { result: 'W' | 'L' }) => (
    <span className={`
      inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold
      ${result === 'W' ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}
    `}>
      {result}
    </span>
  );

  return (
    <Card variant="glass">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <span>Recent Form & History</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Last 5 Games */}
        <div className="space-y-3">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Last 5 Games</h4>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{homeTeam}</span>
              <span className="text-sm font-mono text-primary">{getRecord(homeLast5)}</span>
            </div>
            <div className="flex gap-1.5">
              {homeLast5.map((game, index) => (
                <div 
                  key={index}
                  className="flex-1 bg-secondary/50 rounded-lg p-2 text-center"
                >
                  <ResultBadge result={game.result} />
                  <p className="text-xs text-muted-foreground mt-1 truncate">{game.opponent}</p>
                  <p className="text-xs font-mono">{game.score}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{awayTeam}</span>
              <span className="text-sm font-mono text-primary">{getRecord(awayLast5)}</span>
            </div>
            <div className="flex gap-1.5">
              {awayLast5.map((game, index) => (
                <div 
                  key={index}
                  className="flex-1 bg-secondary/50 rounded-lg p-2 text-center"
                >
                  <ResultBadge result={game.result} />
                  <p className="text-xs text-muted-foreground mt-1 truncate">{game.opponent}</p>
                  <p className="text-xs font-mono">{game.score}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Head to Head */}
        <div className="pt-4 border-t border-border space-y-3">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Head to Head (Last 5)
            </h4>
          </div>
          
          <div className="space-y-2">
            {headToHead.slice(0, 5).map((game, index) => (
              <div 
                key={index}
                className="flex items-center justify-between bg-secondary/30 rounded-lg px-3 py-2 text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className={`font-semibold ${game.winner === homeTeam.split(' ').pop() ? 'text-primary' : ''}`}>
                    {game.winner}
                  </span>
                  <span className="font-mono text-muted-foreground">{game.score}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(game.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                </div>
              </div>
            ))}
          </div>

          {/* H2H Summary */}
          <div className="flex items-center justify-center gap-4 pt-2">
            <div className="text-center">
              <p className="text-2xl font-bold font-mono text-primary">
                {headToHead.filter(g => g.winner === homeTeam.split(' ').pop()).length}
              </p>
              <p className="text-xs text-muted-foreground">{homeTeam.split(' ').pop()}</p>
            </div>
            <span className="text-muted-foreground">-</span>
            <div className="text-center">
              <p className="text-2xl font-bold font-mono">
                {headToHead.filter(g => g.winner === awayTeam.split(' ').pop()).length}
              </p>
              <p className="text-xs text-muted-foreground">{awayTeam.split(' ').pop()}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
