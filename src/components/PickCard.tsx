import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Target, BarChart3, User, Check, Share2 } from 'lucide-react';
import type { Pick } from '@/hooks/usePicks';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface PickCardProps {
  pick: Pick;
  isSelected?: boolean;
  onSelect?: (pick: Pick) => void;
}

export function PickCard({ pick, isSelected = false, onSelect }: PickCardProps) {
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

  const handleClick = () => {
    if (onSelect) {
      onSelect(pick);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `🎯 ${pick.playerName} (${pick.team}) — ${pick.propType} ${pick.direction} ${pick.line}\n📊 Confidence: ${pick.confidence}%${pick.hitRate ? ` | Hit Rate: ${pick.hitRate}%` : ''}\n🏟️ ${pick.opponent} • ${pick.gameDate} ${pick.gameTime}\n📱 ${pick.platform}\n\nShared via ThinkBetAI`;

    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch {}
    } else {
      await navigator.clipboard.writeText(text);
      toast.success('Pick copied to clipboard!');
    }
  };

  return (
    <Card 
      className={cn(
        "bg-card border-border transition-all duration-300 hover:shadow-lg hover:shadow-primary/5",
        onSelect && "cursor-pointer",
        isSelected 
          ? "border-primary ring-2 ring-primary/20" 
          : "hover:border-primary/50"
      )}
      onClick={handleClick}
    >
      <CardContent className="p-4 relative">
        {/* Selection Indicator */}
        {isSelected && (
          <div className="absolute top-3 right-3 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
            <Check className="h-4 w-4 text-primary-foreground" />
          </div>
        )}

        {/* Header: Platform + Signal */}
        <div className="flex items-center justify-between mb-3">
          <Badge className={platformColors[pick.platform] || 'bg-muted text-muted-foreground'}>
            {pick.platform}
          </Badge>
          <Badge variant="outline" className={cn(signalColors[signal], isSelected && "mr-8")}>
            {signal}
          </Badge>
        </div>

        {/* Player Info */}
        <div className="flex items-center gap-3 mb-3">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center overflow-hidden">
            {pick.playerImage ? (
              <img src={pick.playerImage} alt={pick.playerName} className="h-full w-full object-cover" />
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
