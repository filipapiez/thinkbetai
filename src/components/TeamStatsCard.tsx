import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Trophy, TrendingUp, TrendingDown } from 'lucide-react';
import type { ScrapedTeamStats, ScrapedKeyStats } from '@/lib/api/gameData';
import { cn } from '@/lib/utils';

interface TeamStatsCardProps {
  teamStats: ScrapedTeamStats[];
  keyStats?: ScrapedKeyStats[];
  homeTeam: string;
  awayTeam: string;
}

export const TeamStatsCard = ({ teamStats, keyStats, homeTeam, awayTeam }: TeamStatsCardProps) => {
  if (teamStats.length === 0 && (!keyStats || keyStats.length === 0)) return null;

  const homeStats = teamStats.find(s => s.team.toLowerCase().includes(homeTeam.toLowerCase()) || homeTeam.toLowerCase().includes(s.team.toLowerCase()));
  const awayStats = teamStats.find(s => s.team.toLowerCase().includes(awayTeam.toLowerCase()) || awayTeam.toLowerCase().includes(s.team.toLowerCase()));
  const homeKey = keyStats?.find(s => s.team.toLowerCase().includes(homeTeam.toLowerCase()) || homeTeam.toLowerCase().includes(s.team.toLowerCase()));
  const awayKey = keyStats?.find(s => s.team.toLowerCase().includes(awayTeam.toLowerCase()) || awayTeam.toLowerCase().includes(s.team.toLowerCase()));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Season Stats & Standings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Win-Loss Records */}
        {(homeStats || awayStats) && (
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: homeTeam, stats: homeStats },
              { label: awayTeam, stats: awayStats },
            ].map(({ label, stats }) => (
              <div key={label} className="bg-muted/30 rounded-lg p-3 space-y-2">
                <p className="text-xs text-muted-foreground font-medium truncate">{label}</p>
                {stats ? (
                  <>
                    <div className="text-2xl font-bold font-mono">
                      {stats.wins}-{stats.losses}
                    </div>
                    <div className="flex items-center gap-2">
                      {stats.streak && stats.streak !== 'N/A' && (
                        <Badge variant="outline" className={cn(
                          "text-xs",
                          stats.streak.startsWith('W') ? 'text-emerald-400 border-emerald-500/40' : 'text-red-400 border-red-500/40'
                        )}>
                          {stats.streak.startsWith('W') ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                          {stats.streak}
                        </Badge>
                      )}
                      {stats.ranking > 0 && (
                        <Badge variant="outline" className="text-xs">
                          <Trophy className="h-3 w-3 mr-1" />
                          #{stats.ranking}
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Win%: {(stats.wins + stats.losses) > 0 ? ((stats.wins / (stats.wins + stats.losses)) * 100).toFixed(0) : 0}%
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No data</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Key Stats */}
        {(homeKey || awayKey) && (
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Key Performance Stats</h4>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: homeTeam, data: homeKey },
                { label: awayTeam, data: awayKey },
              ].map(({ label, data }) => (
                <div key={label} className="space-y-1.5">
                  <p className="text-xs text-muted-foreground font-medium truncate">{label}</p>
                  {data?.stats.slice(0, 5).map((s, i) => (
                    <div key={i} className="flex justify-between items-center text-sm bg-muted/20 rounded px-2 py-1">
                      <span className="text-muted-foreground text-xs">{s.label}</span>
                      <span className="font-mono font-semibold text-xs">{s.value}</span>
                    </div>
                  )) || <p className="text-xs text-muted-foreground">—</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
