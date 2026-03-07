import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Percent, Users } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import type { ScrapedBettingTrends } from '@/lib/api/gameData';
import { cn } from '@/lib/utils';

interface BettingTrendsCardProps {
  trends: ScrapedBettingTrends[];
  homeTeam: string;
  awayTeam: string;
}

export const BettingTrendsCard = ({ trends, homeTeam, awayTeam }: BettingTrendsCardProps) => {
  if (!trends || trends.length === 0) return null;

  const homeTrends = trends.find(t => t.team.toLowerCase().includes(homeTeam.toLowerCase()) || homeTeam.toLowerCase().includes(t.team.toLowerCase()));
  const awayTrends = trends.find(t => t.team.toLowerCase().includes(awayTeam.toLowerCase()) || awayTeam.toLowerCase().includes(t.team.toLowerCase()));

  if (!homeTrends && !awayTrends) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Betting Trends
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: homeTeam, data: homeTrends },
            { label: awayTeam, data: awayTrends },
          ].map(({ label, data }) => (
            <div key={label} className="bg-muted/30 rounded-lg p-3 space-y-2">
              <p className="text-xs text-muted-foreground font-medium truncate">{label}</p>
              {data ? (
                <div className="space-y-2">
                  {data.atsRecord && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">ATS</span>
                      <Badge variant="outline" className="text-xs font-mono">{data.atsRecord}</Badge>
                    </div>
                  )}
                  {data.ouRecord && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">O/U</span>
                      <Badge variant="outline" className="text-xs font-mono">{data.ouRecord}</Badge>
                    </div>
                  )}
                  {data.homeAwayRecord && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">H/A</span>
                      <Badge variant="outline" className="text-xs font-mono">{data.homeAwayRecord}</Badge>
                    </div>
                  )}
                  {data.notes && (
                    <p className="text-xs text-muted-foreground mt-1">{data.notes}</p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No data</p>
              )}
            </div>
          ))}
        </div>

        {/* Public bet percentage */}
        {(homeTrends?.publicBetPct || awayTrends?.publicBetPct) && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              <span>Public Betting Split</span>
            </div>
            <div className="relative h-8 rounded-full overflow-hidden bg-muted">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-accent rounded-l-full"
                style={{ width: `${homeTrends?.publicBetPct || 50}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-between px-3 text-xs font-semibold">
                <span className="text-primary-foreground drop-shadow">{homeTrends?.publicBetPct || 50}%</span>
                <span>{awayTrends?.publicBetPct || 50}%</span>
              </div>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{homeTeam}</span>
              <span>{awayTeam}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
