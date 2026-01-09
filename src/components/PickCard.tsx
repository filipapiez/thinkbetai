import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Target, BarChart3, User } from 'lucide-react';
import type { Pick } from '@/hooks/usePicks';

interface PickCardProps {
  pick: Pick;
}

export function PickCard({ pick }: PickCardProps) {
  const isMore = pick.direction === 'MORE';
  
  // Calculate signal based on confidence and hit rate
  const signal = pick.confidence >= 75 ? 'GOOD' : pick.confidence >= 60 ? 'BORDERLINE' : 'PASS';
  
  const signalColors = {
    GOOD: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    BORDERLINE: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    PASS: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  const platformColors: Record<string, string> = {
    'PrizePicks': 'bg-purple-500/20 text-purple-300',
    'Underdog': 'bg-red-500/20 text-red-300',
    'Pick6': 'bg-blue-500/20 text-blue-300',
    'Sleeper': 'bg-teal-500/20 text-teal-300',
    'FanDuel': 'bg-blue-600/20 text-blue-300',
    'DraftKings': 'bg-green-500/20 text-green-300',
    'BetMGM': 'bg-amber-500/20 text-amber-300',
    'BetRivers': 'bg-cyan-500/20 text-cyan-300',
    'RTSports': 'bg-orange-500/20 text-orange-300',
    'Hard Rock': 'bg-pink-500/20 text-pink-300',
    'Caesars': 'bg-yellow-500/20 text-yellow-300',
  };

  return (
    <Card className="bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
      <CardContent className="p-4">
        {/* Header: Platform + Signal */}
        <div className="flex items-center justify-between mb-3">
          <Badge className={platformColors[pick.platform] || 'bg-muted text-muted-foreground'}>
            {pick.platform}
          </Badge>
          <Badge variant="outline" className={signalColors[signal]}>
            {signal}
          </Badge>
        </div>

        {/* Player Info */}
        <div className="flex items-center gap-3 mb-3">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
            {pick.playerImage ? (
              <img src={pick.playerImage} alt={pick.playerName} className="h-full w-full rounded-full object-cover" />
            ) : (
              <User className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{pick.playerName}</h3>
            <p className="text-sm text-muted-foreground">
              {pick.team} {pick.opponent.startsWith('@') ? pick.opponent : `vs ${pick.opponent}`}
            </p>
          </div>
          <Badge variant="outline" className="text-xs">
            {pick.sport}
          </Badge>
        </div>

        {/* Prop Details */}
        <div className="bg-muted/30 rounded-lg p-3 mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">{pick.propType}</span>
            <span className="text-sm text-muted-foreground">{pick.gameDate} • {pick.gameTime}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{pick.line}</span>
              <div className={`flex items-center gap-1 px-2 py-1 rounded-md ${
                isMore ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
              }`}>
                {isMore ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                <span className="font-medium text-sm">{pick.direction}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-muted/20 rounded-md p-2">
            <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
              <Target className="h-3 w-3" />
              <span className="text-xs">Confidence</span>
            </div>
            <span className="font-semibold text-sm">{pick.confidence}%</span>
          </div>
          
          {pick.hitRate !== undefined && (
            <div className="bg-muted/20 rounded-md p-2">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <BarChart3 className="h-3 w-3" />
                <span className="text-xs">Hit Rate</span>
              </div>
              <span className="font-semibold text-sm">{pick.hitRate}%</span>
            </div>
          )}
          
          {pick.projection !== undefined && (
            <div className="bg-muted/20 rounded-md p-2">
              <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                <TrendingUp className="h-3 w-3" />
                <span className="text-xs">Projection</span>
              </div>
              <span className="font-semibold text-sm">{pick.projection}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
