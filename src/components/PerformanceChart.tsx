import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart, BarChart, Bar } from 'recharts';
import { TrendingUp, Target, Award, Activity, Info } from 'lucide-react';
import { PerformanceData, GameResult, platformStats } from '@/lib/mockData';

interface PerformanceChartProps {
  data: PerformanceData[];
  sport: string;
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  homeLast5: GameResult[];
  awayLast5: GameResult[];
}

// Sport-specific chart configurations
const getChartConfig = (sport: string) => {
  switch (sport) {
    case 'Table Tennis':
    case 'Tennis':
      return {
        chartType: 'form',
        title: 'Recent Form Comparison',
        description: 'Last 5 matches win/loss record for each player',
        yAxisLabel: 'Matches',
      };
    case 'Soccer':
      return {
        chartType: 'goals',
        title: 'Goals Performance',
        description: 'Predicted vs actual goal outcomes',
        yAxisLabel: 'Goals',
      };
    case 'NHL':
      return {
        chartType: 'goals',
        title: 'Scoring Trend',
        description: 'Predicted vs actual goal performance',
        yAxisLabel: 'Goals',
      };
    default:
      return {
        chartType: 'probability',
        title: 'Win Probability Trend',
        description: 'Model confidence over last 10 games (context, not guarantee)',
        yAxisLabel: 'Win %',
      };
  }
};

// Get sport-specific QUALIFIED accuracy from platform stats (GOOD bets only)
const getQualifiedAccuracy = (sport: string) => {
  const sportData = platformStats.sportBreakdown.find(s => s.sport === sport);
  if (sportData) {
    return {
      wins: sportData.wins,
      total: sportData.qualified,
      winRate: sportData.winRate,
      timeframe: 'last 30 days',
    };
  }
  return {
    wins: platformStats.correctQualified,
    total: platformStats.totalQualified,
    winRate: platformStats.qualifiedWinRate,
    timeframe: 'all time',
  };
};

export const PerformanceChart = ({ 
  data, 
  sport, 
  gameId, 
  homeTeam, 
  awayTeam,
  homeLast5,
  awayLast5 
}: PerformanceChartProps) => {
  const config = getChartConfig(sport);
  const qualifiedAccuracy = getQualifiedAccuracy(sport);
  
  // Generate unique chart key for caching
  const cacheKey = `${sport}_${gameId}`;
  
  // Calculate stats from actual game data
  const stats = useMemo(() => {
    const homeWins = homeLast5.filter(g => g.result === 'W').length;
    const awayWins = awayLast5.filter(g => g.result === 'W').length;
    const accurateCount = data.filter(d => Math.abs(d.predicted - d.actual) < 10).length;
    const accuracy = data.length > 0 ? Math.round((accurateCount / data.length) * 100) : 0;
    
    return {
      homeWins,
      awayWins,
      homeRecord: `${homeWins}-${5 - homeWins}`,
      awayRecord: `${awayWins}-${5 - awayWins}`,
      accuracy,
      totalPredictions: data.length,
    };
  }, [data, homeLast5, awayLast5, cacheKey]);

  // Form chart data for Tennis/Table Tennis
  const formChartData = useMemo(() => {
    if (config.chartType !== 'form') return [];
    
    return [
      { name: homeTeam, wins: stats.homeWins, losses: 5 - stats.homeWins },
      { name: awayTeam, wins: stats.awayWins, losses: 5 - stats.awayWins },
    ];
  }, [config.chartType, homeTeam, awayTeam, stats, cacheKey]);

  // Match-by-match form data
  const matchFormData = useMemo(() => {
    const homeData = homeLast5.map((game, i) => ({
      match: `M${i + 1}`,
      [homeTeam]: game.result === 'W' ? 1 : 0,
      homeScore: game.score,
      opponent: game.opponent,
    }));
    
    const awayData = awayLast5.map((game, i) => ({
      match: `M${i + 1}`,
      [awayTeam]: game.result === 'W' ? 1 : 0,
      awayScore: game.score,
      opponent: game.opponent,
    }));
    
    return homeData.map((h, i) => ({
      ...h,
      [awayTeam]: awayData[i]?.[awayTeam] || 0,
    }));
  }, [homeLast5, awayLast5, homeTeam, awayTeam, cacheKey]);

  return (
    <Card className="glass-card" data-cache-key={cacheKey}>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              {config.chartType === 'form' ? (
                <Activity className="h-5 w-5 text-primary" />
              ) : (
                <TrendingUp className="h-5 w-5 text-primary" />
              )}
              {config.title}
            </CardTitle>
            <CardDescription>
              {config.description} • <span className="text-primary font-medium">{sport}</span>
            </CardDescription>
          </div>
          <div className="flex gap-4">
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">{stats.homeRecord}</p>
              <p className="text-xs text-muted-foreground">{homeTeam}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-emerald-400">{stats.awayRecord}</p>
              <p className="text-xs text-muted-foreground">{awayTeam}</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {config.chartType === 'form' ? (
              <BarChart data={matchFormData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis 
                  dataKey="match" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  domain={[0, 1]}
                  ticks={[0, 1]}
                  tickFormatter={(value) => value === 1 ? 'W' : 'L'}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number, name: string) => [value === 1 ? 'Win' : 'Loss', name]}
                />
                <Legend />
                <Bar dataKey={homeTeam} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey={awayTeam} fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : (
              <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={`predictedGradient-${cacheKey}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id={`actualGradient-${cacheKey}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  domain={[40, 80]}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  formatter={(value: number, name: string) => [`${value.toFixed(1)}%`, name === 'predicted' ? 'Predicted' : 'Actual']}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="predicted" 
                  stroke="hsl(var(--primary))" 
                  fill={`url(#predictedGradient-${cacheKey})`}
                  strokeWidth={2}
                  name="Predicted Win %"
                />
                <Area 
                  type="monotone" 
                  dataKey="actual" 
                  stroke="#10b981" 
                  fill={`url(#actualGradient-${cacheKey})`}
                  strokeWidth={2}
                  name="Actual Result"
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Stats Row with Proper Accuracy Context */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-border">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">{homeTeam} Form</span>
            </div>
            <p className="text-xl font-bold">{stats.homeWins}/5 Wins</p>
            <p className="text-xs text-muted-foreground">Last 5 games</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <span className="text-sm text-muted-foreground">{awayTeam} Form</span>
            </div>
            <p className="text-xl font-bold text-emerald-400">{stats.awayWins}/5 Wins</p>
            <p className="text-xs text-muted-foreground">Last 5 games</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Award className="h-4 w-4 text-amber-400" />
              <span className="text-sm text-muted-foreground">{sport} Qualified Accuracy</span>
            </div>
            <p className="text-xl font-bold text-amber-400">
              {qualifiedAccuracy.wins}/{qualifiedAccuracy.total}
            </p>
            <p className="text-xs text-muted-foreground">
              ({qualifiedAccuracy.winRate}%) — {qualifiedAccuracy.timeframe}
            </p>
          </div>
        </div>

        {/* Accuracy Transparency Note */}
        <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-muted/30 border border-border">
          <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          <div className="text-xs text-muted-foreground">
            <p className="font-medium text-foreground mb-1">About This Chart</p>
            <p>
              {config.chartType === 'form' 
                ? 'Shows recent match results (last 5 games) for context. Past performance does not guarantee future outcomes.'
                : 'Shows model confidence across recent games for context, not a guarantee for today. Accuracy is computed as Correct Predictions / Total Predictions.'}
            </p>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground text-center mt-4">
          Historical accuracy reflects past performance and does not guarantee future results.
        </p>
      </CardContent>
    </Card>
  );
};
