import { Injury } from '@/lib/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserX, AlertCircle } from 'lucide-react';

interface InjuryCardProps {
  injuries: Injury[];
  homeTeam: string;
  awayTeam: string;
}

export const InjuryCard = ({ injuries, homeTeam, awayTeam }: InjuryCardProps) => {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Out': return 'out';
      case 'Questionable': return 'questionable';
      case 'Probable': return 'probable';
      default: return 'secondary';
    }
  };

  const homeInjuries = injuries.filter(i => i.team === homeTeam);
  const awayInjuries = injuries.filter(i => i.team === awayTeam);

  const InjuryList = ({ teamInjuries, teamName }: { teamInjuries: Injury[]; teamName: string }) => {
    if (teamInjuries.length === 0) {
      return (
        <div className="bg-success/10 border border-success/20 rounded-lg p-3 text-center">
          <p className="text-sm text-success">No injuries reported</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {teamInjuries.map((injury, index) => (
          <div 
            key={index}
            className="bg-secondary/50 rounded-lg p-3 flex items-start justify-between gap-3"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-sm">{injury.player}</p>
                <span className="text-xs text-muted-foreground">({injury.position})</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{injury.injuryType}</p>
              {injury.gamesMissed > 0 && (
                <p className="text-xs text-muted-foreground">
                  {injury.gamesMissed} game{injury.gamesMissed > 1 ? 's' : ''} missed
                </p>
              )}
            </div>
            <Badge variant={getStatusVariant(injury.status)}>
              {injury.status}
            </Badge>
          </div>
        ))}
      </div>
    );
  };

  const hasKeyInjuries = injuries.some(i => i.status === 'Out' || i.status === 'Questionable');

  return (
    <Card variant="glass">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserX className="h-5 w-5 text-warning" />
            <span>Key Injuries</span>
          </div>
          {hasKeyInjuries && (
            <div className="flex items-center gap-1.5 text-xs text-warning">
              <AlertCircle className="h-3 w-3" />
              <span>Monitor pregame</span>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">{homeTeam}</h4>
          <InjuryList teamInjuries={homeInjuries} teamName={homeTeam} />
        </div>
        <div>
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">{awayTeam}</h4>
          <InjuryList teamInjuries={awayInjuries} teamName={awayTeam} />
        </div>
      </CardContent>
    </Card>
  );
};
