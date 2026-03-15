import { useState } from 'react';
import { format } from 'date-fns';
import { RefreshCw, Clock, CheckCircle, XCircle, Timer, Loader2, Plus, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useActiveBets, ActiveBet } from '@/hooks/useActiveBets';
import { AddBetDialog } from './AddBetDialog';

export function ActiveBetsPanel() {
  const { 
    pendingBets, 
    completedBets, 
    isLoading, 
    checkResults, 
    isChecking,
    refetch 
  } = useActiveBets();
  const [showAddDialog, setShowAddDialog] = useState(false);

  const handleShareBet = async (bet: ActiveBet) => {
    const odds = bet.odds > 0 ? `+${bet.odds}` : `${bet.odds}`;
    const text = `🎯 ${bet.away_team} @ ${bet.home_team}\n📌 Pick: ${bet.pick} (${odds})\n📊 Confidence: ${bet.confidence}%\n🏟️ ${bet.sport}${bet.result ? `\n✅ Result: ${bet.result.toUpperCase()}` : ''}\n\nShared via ThinkBetAI`;

    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch {}
    } else {
      await navigator.clipboard.writeText(text);
      toast.success('Bet copied to clipboard!');
    }
  };

  const getStatusBadge = (bet: ActiveBet) => {
    if (bet.status === 'pending') {
      const gameTime = new Date(bet.game_time);
      const now = new Date();
      const isLive = gameTime <= now;
      
      return (
        <Badge variant="outline" className={cn(
          "gap-1",
          isLive ? "border-amber-500/50 text-amber-400" : "border-blue-500/50 text-blue-400"
        )}>
          {isLive ? <Timer className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
          {isLive ? 'In Progress' : 'Upcoming'}
        </Badge>
      );
    }
    
    if (bet.result === 'win') {
      return (
        <Badge className="gap-1 bg-green-500/20 text-green-400 border-green-500/50">
          <CheckCircle className="h-3 w-3" />
          Win
        </Badge>
      );
    }
    
    if (bet.result === 'loss') {
      return (
        <Badge className="gap-1 bg-red-500/20 text-red-400 border-red-500/50">
          <XCircle className="h-3 w-3" />
          Loss
        </Badge>
      );
    }
    
    return (
      <Badge variant="secondary" className="gap-1">
        Push
      </Badge>
    );
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Timer className="h-5 w-5 text-primary" />
          Active Bets Tracker
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddDialog(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Bet
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => checkResults()}
            disabled={isChecking || pendingBets.length === 0}
          >
            {isChecking ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-1" />
            )}
            Check Results
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : pendingBets.length === 0 && completedBets.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Timer className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No active bets being tracked</p>
            <p className="text-sm mt-1">Add bets to start auto-tracking results</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Pending Bets */}
            {pendingBets.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  Pending ({pendingBets.length})
                </h3>
                <div className="space-y-2">
                  {pendingBets.map((bet) => (
                    <div
                      key={bet.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className="text-xs">
                            {bet.sport}
                          </Badge>
                          {getStatusBadge(bet)}
                        </div>
                        <p className="font-medium">
                          {bet.away_team} @ {bet.home_team}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Pick: <span className="text-foreground">{bet.pick}</span>
                          <span className="mx-2">•</span>
                          {format(new Date(bet.game_time), 'MMM d, h:mm a')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className="text-lg font-bold">{bet.confidence}%</div>
                          <div className="text-sm text-muted-foreground">
                            {bet.odds > 0 ? '+' : ''}{bet.odds}
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleShareBet(bet)} title="Share bet">
                          <Share2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Completed */}
            {completedBets.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  Recently Completed ({completedBets.slice(0, 5).length})
                </h3>
                <div className="space-y-2">
                  {completedBets.slice(0, 5).map((bet) => (
                    <div
                      key={bet.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border",
                        bet.result === 'win' 
                          ? "bg-green-500/5 border-green-500/20" 
                          : bet.result === 'loss'
                          ? "bg-red-500/5 border-red-500/20"
                          : "bg-secondary/50 border-border"
                      )}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className="text-xs">
                            {bet.sport}
                          </Badge>
                          {getStatusBadge(bet)}
                        </div>
                        <p className="font-medium">
                          {bet.away_team} @ {bet.home_team}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Pick: {bet.pick}
                          {bet.home_score !== null && bet.away_score !== null && (
                            <span className="ml-2">
                              Final: {bet.away_score} - {bet.home_score}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className={cn(
                          "text-lg font-bold",
                          bet.result === 'win' ? "text-green-400" : bet.result === 'loss' ? "text-red-400" : ""
                        )}>
                          {bet.result?.toUpperCase()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>

      <AddBetDialog open={showAddDialog} onOpenChange={setShowAddDialog} />
    </Card>
  );
}
