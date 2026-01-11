import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, BarChart3 } from 'lucide-react';
import { ScrapedRecentForm } from '@/lib/api/gameData';
import { cn } from '@/lib/utils';

interface PerformanceChartLiveProps {
  recentForm: ScrapedRecentForm[];
  homeTeam: string;
  awayTeam: string;
  sport: string;
}

export const PerformanceChartLive = ({ recentForm, homeTeam, awayTeam, sport }: PerformanceChartLiveProps) => {
  const homeForm = recentForm.find(f => f.team === homeTeam);
  const awayForm = recentForm.find(f => f.team === awayTeam);

  // Build chart data from recent form
  const formChartData = useMemo(() => {
    const data = [];
    const homeGames = homeForm?.last5 || [];
    const awayGames = awayForm?.last5 || [];
    
    for (let i = 4; i >= 0; i--) {
      const homeGame = homeGames[i];
      const awayGame = awayGames[i];
      
      data.push({
        game: `G${5 - i}`,
        homeResult: homeGame?.result === 'W' ? 1 : 0,
        awayResult: awayGame?.result === 'W' ? 1 : 0,
        homeScore: homeGame ? parseInt(homeGame.score.split('-')[0]) || 0 : 0,
        awayScore: awayGame ? parseInt(awayGame.score.split('-')[0]) || 0 : 0,
      });
    }
    return data;
  }, [homeForm, awayForm]);

  const homeRecord = homeForm?.last5.filter(g => g.result === 'W').length || 0;
  const awayRecord = awayForm?.last5.filter(g => g.result === 'W').length || 0;
  
  const hasData = (homeForm?.last5?.length || 0) > 0 || (awayForm?.last5?.length || 0) > 0;

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Performance Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-6 text-center text-muted-foreground">
            <p className="text-sm">No verified performance data available for this matchup.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Performance Analysis
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Form Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className={cn(
            "p-3 rounded-lg text-center",
            homeRecord >= 3 ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-rose-500/10 border border-rose-500/20"
          )}>
            <p className="text-xs text-muted-foreground mb-1">{homeTeam}</p>
            <p className={cn(
              "text-2xl font-bold",
              homeRecord >= 3 ? "text-emerald-400" : "text-rose-400"
            )}>
              {homeRecord}-{5 - homeRecord}
            </p>
            <p className="text-xs text-muted-foreground">Last 5</p>
          </div>
          <div className={cn(
            "p-3 rounded-lg text-center",
            awayRecord >= 3 ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-rose-500/10 border border-rose-500/20"
          )}>
            <p className="text-xs text-muted-foreground mb-1">{awayTeam}</p>
            <p className={cn(
              "text-2xl font-bold",
              awayRecord >= 3 ? "text-emerald-400" : "text-rose-400"
            )}>
              {awayRecord}-{5 - awayRecord}
            </p>
            <p className="text-xs text-muted-foreground">Last 5</p>
          </div>
        </div>

        {/* Recent Form Bar Chart */}
        <div>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Recent Scoring
          </h4>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={formChartData} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="game" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Bar dataKey="homeScore" name={homeTeam} radius={[4, 4, 0, 0]}>
                  {formChartData.map((entry, index) => (
                    <Cell key={`home-${index}`} fill={entry.homeResult ? 'hsl(142, 76%, 36%)' : 'hsl(0, 84%, 60%)'} />
                  ))}
                </Bar>
                <Bar dataKey="awayScore" name={awayTeam} radius={[4, 4, 0, 0]}>
                  {formChartData.map((entry, index) => (
                    <Cell key={`away-${index}`} fill={entry.awayResult ? 'hsl(142, 76%, 50%)' : 'hsl(0, 84%, 70%)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span>{homeTeam}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span>{awayTeam}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
