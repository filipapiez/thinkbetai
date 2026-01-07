import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, User, Activity } from 'lucide-react';
import { ScrapedInjury } from '@/lib/api/gameData';
import { cn } from '@/lib/utils';

interface ScrapedInjuryCardProps {
  injuries: ScrapedInjury[];
  homeTeam: string;
  awayTeam: string;
}

export const ScrapedInjuryCard = ({ injuries, homeTeam, awayTeam }: ScrapedInjuryCardProps) => {
  const homeInjuries = injuries.filter(i => i.team === homeTeam);
  const awayInjuries = injuries.filter(i => i.team === awayTeam);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Out': return 'bg-red-500/20 text-red-400 border-red-500/40';
      case 'Questionable': return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      case 'Probable': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      case 'Day-to-Day': return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const InjuryList = ({ teamInjuries, teamName }: { teamInjuries: ScrapedInjury[]; teamName: string }) => (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold flex items-center gap-2">
        <Activity className="h-4 w-4 text-primary" />
        {teamName}
        <Badge variant="outline" className="text-xs">{teamInjuries.length}</Badge>
      </h4>
      {teamInjuries.length === 0 ? (
        <p className="text-sm text-muted-foreground pl-6">No injuries reported</p>
      ) : (
        <div className="space-y-2 pl-6">
          {teamInjuries.map((injury, idx) => (
            <div key={idx} className="flex items-center justify-between gap-2 text-sm">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <User className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="truncate">{injury.player}</span>
                <span className="text-xs text-muted-foreground">({injury.position})</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-muted-foreground">{injury.injuryType}</span>
                <Badge variant="outline" className={cn("text-xs", getStatusColor(injury.status))}>
                  {injury.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const outCount = injuries.filter(i => i.status === 'Out').length;
  const questionableCount = injuries.filter(i => i.status === 'Questionable').length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
            Key Injuries
          </span>
          <div className="flex gap-2">
            {outCount > 0 && (
              <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/40">
                {outCount} Out
              </Badge>
            )}
            {questionableCount > 0 && (
              <Badge variant="outline" className="bg-amber-500/20 text-amber-400 border-amber-500/40">
                {questionableCount} Questionable
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <InjuryList teamInjuries={homeInjuries} teamName={homeTeam} />
        <div className="border-t border-border pt-4">
          <InjuryList teamInjuries={awayInjuries} teamName={awayTeam} />
        </div>
      </CardContent>
    </Card>
  );
};
