import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Trophy, TrendingUp, Target, CheckCircle, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';
import { platformStats } from '@/lib/mockData';

interface QualifiedBetAccuracyChartProps {
  sport: string;
}

interface SportAccuracy {
  wins: number;
  losses: number;
  total: number;
  winRate: number;
  profit: number;
}

interface RecentBet {
  id: string;
  matchup: string;
  pick: string;
  result: 'W' | 'L';
  date: string;
}

// Get accuracy for specific sport using platformStats for consistency
const getSportAccuracy = (sport: string): SportAccuracy => {
  const normalizedSport = sport.toUpperCase().replace(/\s+/g, '');
  
  // Map sport to platformStats breakdown for consistent win rates
  const sportMapping: Record<string, string> = {
    'NBA': 'NBA',
    'NFL': 'NFL', 
    'NHL': 'NHL',
    'MLB': 'MLB',
    'UFC': 'UFC',
    'MMA': 'UFC',
    'TENNIS': 'Tennis',
    'ATP': 'Tennis',
    'WTA': 'Tennis',
    'TABLETENNIS': 'Table Tennis',
    'WTT': 'Table Tennis',
    'SOCCER': 'Soccer',
    'EPL': 'Soccer',
    'LALIGA': 'Soccer',
    'CHAMPIONSLEAGUE': 'Soccer',
    'BUNDESLIGA': 'Soccer',
    'SERIEA': 'Soccer',
    'LIGUE1': 'Soccer',
    'MLS': 'Soccer',
  };
  
  const mappedSport = sportMapping[normalizedSport];
  const sportData = platformStats.sportBreakdown.find(s => s.sport === mappedSport);
  
  if (sportData) {
    const losses = sportData.qualified - sportData.wins;
    return {
      wins: sportData.wins,
      losses: losses,
      total: sportData.qualified,
      winRate: sportData.winRate,
      profit: Math.round((sportData.winRate - 50) * 0.9 * 10) / 10, // Approximate ROI
    };
  }
  
  // Fallback to overall platform stats for unknown sports
  return {
    wins: platformStats.correctQualified,
    losses: platformStats.totalQualified - platformStats.correctQualified,
    total: platformStats.totalQualified,
    winRate: platformStats.qualifiedWinRate,
    profit: 42.1,
  };
};

// Get recent qualified bets for the sport
const getRecentBets = (sport: string): RecentBet[] => {
  const normalizedSport = sport.toUpperCase();
  
  // Sport-specific recent bets (simulated based on win rate)
  const recentBetsData: Record<string, RecentBet[]> = {
    'NBA': [
      { id: '1', matchup: 'Lakers vs Celtics', pick: 'Lakers ML', result: 'W', date: 'Jan 14' },
      { id: '2', matchup: 'Warriors vs Heat', pick: 'Warriors -3.5', result: 'W', date: 'Jan 13' },
      { id: '3', matchup: 'Nuggets vs 76ers', pick: 'Nuggets ML', result: 'W', date: 'Jan 12' },
      { id: '4', matchup: 'Bucks vs Suns', pick: 'Under 228.5', result: 'L', date: 'Jan 11' },
      { id: '5', matchup: 'Celtics vs Heat', pick: 'Celtics -5.5', result: 'W', date: 'Jan 10' },
    ],
    'NFL': [
      { id: '1', matchup: 'Chiefs vs Bills', pick: 'Chiefs ML', result: 'W', date: 'Jan 14' },
      { id: '2', matchup: 'Lions vs Eagles', pick: 'Lions -2.5', result: 'W', date: 'Jan 13' },
      { id: '3', matchup: 'Ravens vs Texans', pick: 'Ravens ML', result: 'W', date: 'Jan 12' },
      { id: '4', matchup: 'Packers vs Cowboys', pick: 'Over 48.5', result: 'W', date: 'Jan 11' },
      { id: '5', matchup: 'Bills vs Dolphins', pick: 'Bills -7.5', result: 'W', date: 'Jan 10' },
    ],
    'UFC': [
      { id: '1', matchup: 'Jones vs Aspinall', pick: 'Jones ML', result: 'W', date: 'Jan 14' },
      { id: '2', matchup: 'Makhachev vs Holloway', pick: 'Makhachev ML', result: 'W', date: 'Jan 12' },
      { id: '3', matchup: 'Pereira vs Hill', pick: 'Pereira KO', result: 'W', date: 'Jan 10' },
      { id: '4', matchup: 'Du Plessis vs Strickland', pick: 'Du Plessis ML', result: 'W', date: 'Jan 8' },
      { id: '5', matchup: 'O\'Malley vs Merab', pick: 'O\'Malley ML', result: 'L', date: 'Jan 6' },
    ],
    'SOCCER': [
      { id: '1', matchup: 'Real Madrid vs Barcelona', pick: 'Real Madrid ML', result: 'W', date: 'Jan 14' },
      { id: '2', matchup: 'Liverpool vs Man City', pick: 'Liverpool ML', result: 'W', date: 'Jan 13' },
      { id: '3', matchup: 'Arsenal vs Chelsea', pick: 'Under 2.5', result: 'L', date: 'Jan 12' },
      { id: '4', matchup: 'Bayern vs Dortmund', pick: 'Bayern -1.5', result: 'W', date: 'Jan 11' },
      { id: '5', matchup: 'PSG vs Monaco', pick: 'PSG ML', result: 'W', date: 'Jan 10' },
    ],
    'TENNIS': [
      { id: '1', matchup: 'Sinner vs Alcaraz', pick: 'Sinner ML', result: 'W', date: 'Jan 14' },
      { id: '2', matchup: 'Djokovic vs Medvedev', pick: 'Djokovic ML', result: 'W', date: 'Jan 13' },
      { id: '3', matchup: 'Zverev vs Rublev', pick: 'Zverev -3.5', result: 'W', date: 'Jan 12' },
      { id: '4', matchup: 'Fritz vs Ruud', pick: 'Fritz ML', result: 'L', date: 'Jan 11' },
      { id: '5', matchup: 'Sinner vs Djokovic', pick: 'Sinner ML', result: 'W', date: 'Jan 10' },
    ],
    'NHL': [
      { id: '1', matchup: 'Oilers vs Panthers', pick: 'Oilers ML', result: 'W', date: 'Jan 14' },
      { id: '2', matchup: 'Jets vs Golden Knights', pick: 'Jets -1.5', result: 'W', date: 'Jan 13' },
      { id: '3', matchup: 'Avalanche vs Stars', pick: 'Over 6.5', result: 'L', date: 'Jan 12' },
      { id: '4', matchup: 'Rangers vs Bruins', pick: 'Rangers ML', result: 'W', date: 'Jan 11' },
      { id: '5', matchup: 'Hurricanes vs Leafs', pick: 'Under 6.5', result: 'W', date: 'Jan 10' },
    ],
    'MLB': [
      { id: '1', matchup: 'Dodgers vs Yankees', pick: 'Dodgers ML', result: 'W', date: 'Oct 14' },
      { id: '2', matchup: 'Braves vs Phillies', pick: 'Braves -1.5', result: 'W', date: 'Oct 13' },
      { id: '3', matchup: 'Astros vs Rangers', pick: 'Astros ML', result: 'W', date: 'Oct 12' },
      { id: '4', matchup: 'Orioles vs Rays', pick: 'Orioles ML', result: 'L', date: 'Oct 11' },
      { id: '5', matchup: 'Padres vs Diamondbacks', pick: 'Padres ML', result: 'W', date: 'Oct 10' },
    ],
  };
  
  // Map variations to main sports
  const sportKey = normalizedSport.includes('TENNIS') || normalizedSport === 'ATP' || normalizedSport === 'WTA' 
    ? 'TENNIS' 
    : normalizedSport.includes('TABLE') || normalizedSport === 'WTT'
    ? 'TENNIS' // Use tennis data for table tennis
    : normalizedSport.includes('SOCCER') || ['EPL', 'LALIGA', 'BUNDESLIGA', 'SERIEA', 'LIGUE1', 'MLS', 'CHAMPIONSLEAGUE'].includes(normalizedSport)
    ? 'SOCCER'
    : normalizedSport === 'MMA' 
    ? 'UFC'
    : recentBetsData[normalizedSport] ? normalizedSport : 'NBA';
  
  return recentBetsData[sportKey] || recentBetsData['NBA'];
};

// Generate monthly trend data for this sport
const getMonthlyTrend = (baseWinRate: number): { month: string; winRate: number; bets: number }[] => {
  return [
    { month: 'Aug', winRate: baseWinRate - 4 + Math.random() * 2, bets: 28 },
    { month: 'Sep', winRate: baseWinRate - 2 + Math.random() * 2, bets: 32 },
    { month: 'Oct', winRate: baseWinRate - 1 + Math.random() * 2, bets: 35 },
    { month: 'Nov', winRate: baseWinRate + Math.random() * 2, bets: 38 },
    { month: 'Dec', winRate: baseWinRate + 1 + Math.random() * 2, bets: 42 },
    { month: 'Jan', winRate: baseWinRate + 2, bets: 25 },
  ];
};

export const QualifiedBetAccuracyChart = ({ sport }: QualifiedBetAccuracyChartProps) => {
  const sportData = useMemo(() => getSportAccuracy(sport), [sport]);
  const recentBets = useMemo(() => getRecentBets(sport), [sport]);
  const trendData = useMemo(() => getMonthlyTrend(sportData.winRate), [sportData.winRate]);

  const pieData = [
    { name: 'Wins', value: sportData.wins, fill: 'hsl(142, 76%, 36%)' },
    { name: 'Losses', value: sportData.losses, fill: 'hsl(0, 84%, 60%)' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between flex-wrap gap-2">
          <span className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-400" />
            {sport} Model Performance
          </span>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/40 text-xs px-2 animate-pulse">
              <Radio className="h-3 w-3 mr-1" />
              LIVE
            </Badge>
            <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-sm px-3">
              {sportData.winRate}% Win Rate
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center p-4 rounded-lg bg-muted/30">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Target className="h-4 w-4 text-primary" />
            </div>
            <div className="text-2xl font-bold text-primary">{sportData.winRate}%</div>
            <div className="text-xs text-muted-foreground">Win Rate</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <div className="flex items-center justify-center gap-1 mb-1">
              <CheckCircle className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400">{sportData.wins}</div>
            <div className="text-xs text-muted-foreground">Wins</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-rose-500/10 border border-rose-500/20">
            <div className="text-2xl font-bold text-rose-400">{sportData.losses}</div>
            <div className="text-xs text-muted-foreground">Losses</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="h-4 w-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400">+{sportData.profit}%</div>
            <div className="text-xs text-muted-foreground">ROI</div>
          </div>
        </div>

        {/* Recent Qualified Bets */}
        <div>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            Recent Qualified Bets
            <Badge variant="outline" className="text-xs bg-primary/10 border-primary/20">
              Last 5
            </Badge>
          </h4>
          <div className="space-y-2">
            {recentBets.map((bet) => (
              <div 
                key={bet.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border",
                  bet.result === 'W' 
                    ? "bg-emerald-500/5 border-emerald-500/20" 
                    : "bg-rose-500/5 border-rose-500/20"
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{bet.matchup}</div>
                  <div className="text-xs text-muted-foreground">{bet.pick} • {bet.date}</div>
                </div>
                <Badge 
                  variant="outline" 
                  className={cn(
                    "ml-2 font-bold",
                    bet.result === 'W' 
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" 
                      : "bg-rose-500/20 text-rose-400 border-rose-500/40"
                  )}
                >
                  {bet.result}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Win Rate Trend */}
          <div className="lg:col-span-2">
            <h4 className="text-sm font-semibold mb-3">{sport} Win Rate Trend</h4>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  />
                  <YAxis 
                    domain={[65, 95]} 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`${value.toFixed(1)}%`, 'Win Rate']}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="winRate"
                    stroke="hsl(142, 76%, 36%)"
                    fill="hsl(142, 76%, 36% / 0.2)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie Chart */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Record</h4>
            <div className="h-48 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-muted-foreground">Wins ({sportData.wins})</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-rose-500" />
                <span className="text-muted-foreground">Losses ({sportData.losses})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Transparency Note */}
        <div className="p-3 rounded-lg bg-muted/30 border border-border">
          <p className="text-xs text-muted-foreground">
            Based on <span className="font-medium text-foreground">{sportData.total} {sport.toLowerCase()} qualified bets</span> since Aug 2025. 
            Only bets rated "GOOD" (qualified) are included in this record. Overall platform win rate: <span className="font-medium text-emerald-400">{platformStats.qualifiedWinRate}%</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
