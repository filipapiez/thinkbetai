import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Team } from '@/lib/mockData';
import { TrendingUp, TrendingDown, Home, Plane, Trophy, Target } from 'lucide-react';

interface TeamInfoCardProps {
  team: Team;
  isHome: boolean;
}

export const TeamInfoCard = ({ team, isHome }: TeamInfoCardProps) => {
  const stats = team.stats;
  
  if (!stats) {
    return (
      <Card className="glass-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            {isHome ? <Home className="h-4 w-4 text-primary" /> : <Plane className="h-4 w-4 text-muted-foreground" />}
            {team.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Team statistics not available</p>
        </CardContent>
      </Card>
    );
  }

  const isWinning = stats.winPct >= 0.5;
  const streakType = stats.streak.startsWith('W') ? 'win' : 'loss';

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            {isHome ? <Home className="h-4 w-4 text-primary" /> : <Plane className="h-4 w-4 text-muted-foreground" />}
            {team.name}
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            <Trophy className="h-3 w-3 mr-1" />
            Rank #{stats.ranking}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Record & Win % */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold">{stats.wins}-{stats.losses}</p>
            <p className="text-xs text-muted-foreground">Season Record</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1">
              {isWinning ? (
                <TrendingUp className="h-4 w-4 text-emerald-400" />
              ) : (
                <TrendingDown className="h-4 w-4 text-rose-400" />
              )}
              <span className={`text-2xl font-bold ${isWinning ? 'text-emerald-400' : 'text-rose-400'}`}>
                {(stats.winPct * 100).toFixed(1)}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Win Rate</p>
          </div>
        </div>

        {/* Streak */}
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
          streakType === 'win' 
            ? 'bg-emerald-500/20 text-emerald-400' 
            : 'bg-rose-500/20 text-rose-400'
        }`}>
          {streakType === 'win' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {stats.streak} Streak
        </div>

        {/* Home/Away Split */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
          <div>
            <div className="flex items-center gap-1 mb-1">
              <Home className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Home</span>
            </div>
            <p className="font-semibold">{stats.homeRecord}</p>
          </div>
          <div>
            <div className="flex items-center gap-1 mb-1">
              <Plane className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Away</span>
            </div>
            <p className="font-semibold">{stats.awayRecord}</p>
          </div>
        </div>

        {/* Points/Goals */}
        {stats.pointsPerGame > 0 && (
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
            <div>
              <div className="flex items-center gap-1 mb-1">
                <Target className="h-3 w-3 text-emerald-400" />
                <span className="text-xs text-muted-foreground">PPG</span>
              </div>
              <p className="font-semibold text-emerald-400">{stats.pointsPerGame}</p>
            </div>
            <div>
              <div className="flex items-center gap-1 mb-1">
                <Target className="h-3 w-3 text-rose-400" />
                <span className="text-xs text-muted-foreground">OPP PPG</span>
              </div>
              <p className="font-semibold text-rose-400">{stats.pointsAllowed}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
