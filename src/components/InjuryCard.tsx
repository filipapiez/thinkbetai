import { Injury } from '@/lib/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserX, AlertCircle, CheckCircle } from 'lucide-react';

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

  // Calculate key statuses for summary - following rule A4
  const hasConfirmedOut = injuries.some(i => i.status === 'Out');
  const hasQuestionable = injuries.some(i => i.status === 'Questionable');
  const hasProbable = injuries.some(i => i.status === 'Probable');
  const hasKeyInjuries = hasConfirmedOut || hasQuestionable;

  // Get summary text that doesn't contradict individual statuses
  const getSummaryText = () => {
    if (hasConfirmedOut) {
      const outPlayers = injuries.filter(i => i.status === 'Out');
      return `${outPlayers.length} confirmed absence${outPlayers.length > 1 ? 's' : ''}`;
    }
    if (hasQuestionable) {
      const questionablePlayers = injuries.filter(i => i.status === 'Questionable');
      return `${questionablePlayers.length} questionable status${questionablePlayers.length > 1 ? 'es' : ''}`;
    }
    if (hasProbable) {
      return 'No confirmed absences';
    }
    return 'No injuries reported';
  };

  const InjuryList = ({ teamInjuries, teamName }: { teamInjuries: Injury[]; teamName: string }) => {
    if (teamInjuries.length === 0) {
      return (
        <div className="bg-success/10 border border-success/20 rounded-lg p-3 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-success" />
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

  // Key statuses list for display
  const keyStatuses = injuries.filter(i => i.status === 'Questionable' || i.status === 'Out');

  return (
    <Card variant="glass">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserX className="h-5 w-5 text-warning" />
            <span>Key Injuries</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            {hasKeyInjuries ? (
              <>
                <AlertCircle className="h-3 w-3 text-warning" />
                <span className="text-warning">Monitor pregame</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-3 w-3 text-success" />
                <span className="text-success">{getSummaryText()}</span>
              </>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key statuses summary if any */}
        {keyStatuses.length > 0 && (
          <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 mb-4">
            <p className="text-xs font-medium text-warning mb-2">Key Statuses:</p>
            <div className="flex flex-wrap gap-2">
              {keyStatuses.map((injury, i) => (
                <Badge key={i} variant={getStatusVariant(injury.status)} className="text-xs">
                  {injury.player} ({injury.status})
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div>
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">{homeTeam}</h4>
          <InjuryList teamInjuries={homeInjuries} teamName={homeTeam} />
        </div>
        <div>
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">{awayTeam}</h4>
          <InjuryList teamInjuries={awayInjuries} teamName={awayTeam} />
        </div>

        {/* Status legend */}
        <div className="pt-3 border-t border-border flex flex-wrap gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-success" />
            <span>Probable: Expected to play</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-warning" />
            <span>Questionable: Uncertain</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-destructive" />
            <span>Out: Confirmed absence</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
