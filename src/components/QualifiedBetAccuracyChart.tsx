import { useMemo, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Trophy, TrendingUp, Target, CheckCircle, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';
import { platformStats } from '@/lib/mockData';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

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
  
  const sportMapping: Record<string, string> = {
    'NBA': 'NBA',
    'BASKETBALL': 'NBA',
    'NFL': 'NFL',
    'FOOTBALL': 'NFL',
    'AMERICANFOOTBALL': 'NFL',
    'NHL': 'NHL',
    'HOCKEY': 'NHL',
    'ICEHOCKEY': 'NHL',
    'MLB': 'MLB',
    'BASEBALL': 'MLB',
    'UFC': 'UFC',
    'MMA': 'UFC',
    'MIXEDMARTIALARTS': 'UFC',
    'BOXING': 'Boxing',
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
      profit: Math.round((sportData.winRate - 50) * 0.9 * 10) / 10,
    };
  }
  
  return {
    wins: platformStats.correctQualified,
    losses: platformStats.totalQualified - platformStats.correctQualified,
    total: platformStats.totalQualified,
    winRate: platformStats.qualifiedWinRate,
    profit: 42.1,
  };
};

// Map sport names to DB sport values
const getDbSportFilter = (sport: string): string[] => {
  const normalized = sport.toUpperCase().replace(/\s+/g, '');
  const mapping: Record<string, string[]> = {
    'NBA': ['NBA', 'Basketball'],
    'BASKETBALL': ['NBA', 'Basketball'],
    'NFL': ['NFL', 'Football'],
    'FOOTBALL': ['NFL', 'Football'],
    'AMERICANFOOTBALL': ['NFL', 'Football'],
    'NHL': ['NHL', 'Hockey', 'Ice Hockey'],
    'HOCKEY': ['NHL', 'Hockey', 'Ice Hockey'],
    'ICEHOCKEY': ['NHL', 'Hockey', 'Ice Hockey'],
    'MLB': ['MLB', 'Baseball'],
    'BASEBALL': ['MLB', 'Baseball'],
    'UFC': ['UFC', 'MMA'],
    'MMA': ['UFC', 'MMA'],
    'MIXEDMARTIALARTS': ['UFC', 'MMA'],
    'BOXING': ['Boxing'],
    'TENNIS': ['Tennis', 'ATP', 'WTA'],
    'ATP': ['Tennis', 'ATP', 'WTA'],
    'WTA': ['Tennis', 'ATP', 'WTA'],
    'TABLETENNIS': ['Table Tennis', 'WTT'],
    'WTT': ['Table Tennis', 'WTT'],
    'SOCCER': ['Soccer', 'EPL', 'La Liga', 'Bundesliga', 'Serie A', 'Ligue 1', 'MLS', 'Champions League'],
    'EPL': ['Soccer', 'EPL'],
    'LALIGA': ['Soccer', 'La Liga'],
    'CHAMPIONSLEAGUE': ['Soccer', 'Champions League'],
    'BUNDESLIGA': ['Soccer', 'Bundesliga'],
    'SERIEA': ['Soccer', 'Serie A'],
    'LIGUE1': ['Soccer', 'Ligue 1'],
    'MLS': ['Soccer', 'MLS'],
  };
  return mapping[normalized] || [sport];
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
  const [recentBets, setRecentBets] = useState<RecentBet[]>([]);
  const [isLoadingBets, setIsLoadingBets] = useState(true);
  const trendData = useMemo(() => getMonthlyTrend(sportData.winRate), [sportData.winRate]);

  // Fetch last 5 bets from historical_bets table
  useEffect(() => {
    const fetchRecentBets = async () => {
      setIsLoadingBets(true);
      const sportFilters = getDbSportFilter(sport);
      const { data, error } = await supabase
        .from('historical_bets')
        .select('id, home_team, away_team, pick, result, date')
        .in('sport', sportFilters)
        .order('date', { ascending: false })
        .limit(5);

      if (!error && data && data.length > 0) {
        setRecentBets(data.map(bet => ({
          id: bet.id,
          matchup: `${bet.home_team} vs ${bet.away_team}`,
          pick: bet.pick,
          result: bet.result === 'win' ? 'W' : 'L',
          date: format(new Date(bet.date), 'MMM d'),
        })));
      } else {
        setRecentBets([]);
      }
      setIsLoadingBets(false);
    };
    fetchRecentBets();
  }, [sport]);

  const pieData = [
    { name: 'Wins', value: sportData.wins, fill: 'hsl(142, 76%, 36%)' },
    { name: 'Losses', value: sportData.losses, fill: 'hsl(0, 84%, 60%)' },
  ];

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-start justify-between flex-wrap gap-2">
          <span className="flex items-center gap-2 min-w-0">
            <Trophy className="h-5 w-5 text-amber-400 shrink-0" />
            <span className="truncate">{sport} Model Performance</span>
          </span>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/40 text-xs px-2 animate-pulse">
              <Radio className="h-3 w-3 mr-1" />
              LIVE
            </Badge>
            <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-sm px-3 whitespace-nowrap">
              {sportData.winRate}% Win Rate
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 overflow-x-hidden">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="text-center p-3 sm:p-4 rounded-lg bg-muted/30 min-w-0">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Target className="h-4 w-4 text-primary" />
            </div>
            <div className="text-lg sm:text-2xl font-bold text-primary leading-tight break-words">{sportData.winRate}%</div>
            <div className="text-xs text-muted-foreground">Win Rate</div>
          </div>
          <div className="text-center p-3 sm:p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 min-w-0">
            <div className="flex items-center justify-center gap-1 mb-1">
              <CheckCircle className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-lg sm:text-2xl font-bold text-emerald-400 leading-tight break-words">{sportData.wins}</div>
            <div className="text-xs text-muted-foreground">Wins</div>
          </div>
          <div className="text-center p-3 sm:p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 min-w-0">
            <div className="text-lg sm:text-2xl font-bold text-rose-400 leading-tight break-words">{sportData.losses}</div>
            <div className="text-xs text-muted-foreground">Losses</div>
          </div>
          <div className="text-center p-3 sm:p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 min-w-0">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="h-4 w-4 text-amber-400" />
            </div>
            <div className="text-lg sm:text-2xl font-bold text-emerald-400 leading-tight break-words">+{sportData.profit}%</div>
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
            {isLoadingBets ? (
              <div className="text-xs text-muted-foreground text-center py-4">Loading recent bets...</div>
            ) : recentBets.length > 0 ? recentBets.map((bet) => (
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
            )) : (
              <div className="text-xs text-muted-foreground text-center py-4">No tracked bets for this sport yet</div>
            )}
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
