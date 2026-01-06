import { Wifi, WifiOff, AlertCircle, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface LiveDataBannerProps {
  isLive: boolean;
  lastUpdated: string | null;
  remainingRequests: number | null;
  isLoading: boolean;
  onRefresh: () => void;
  error?: string | null;
}

export const LiveDataBanner = ({ 
  isLive, 
  lastUpdated, 
  remainingRequests, 
  isLoading, 
  onRefresh,
  error 
}: LiveDataBannerProps) => {
  if (error) {
    return (
      <div className="bg-destructive/10 border-b border-destructive/20">
        <div className="container py-2 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-3 w-3" />
            <span className="font-medium">API Error</span>
            <span className="hidden sm:inline text-destructive/70">— {error}</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onRefresh} 
            disabled={isLoading}
            className="h-6 px-2 text-xs"
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const date = lastUpdated ? new Date(lastUpdated) : null;
  const formattedTime = date?.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });

  return (
    <div className={`border-b ${isLive ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-warning/10 border-warning/20'}`}>
      <div className="container py-2 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          {isLive ? (
            <>
              <Wifi className="h-3 w-3 text-emerald-400" />
              <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs h-5">
                LIVE DATA
              </Badge>
              {formattedTime && (
                <span className="text-muted-foreground hidden sm:inline">
                  Updated at {formattedTime}
                </span>
              )}
            </>
          ) : (
            <>
              <WifiOff className="h-3 w-3 text-warning" />
              <span className="font-medium text-warning">Connecting to live data...</span>
            </>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {remainingRequests !== null && (
            <span className="text-muted-foreground hidden md:inline">
              API calls remaining: {remainingRequests.toLocaleString()}
            </span>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onRefresh} 
            disabled={isLoading}
            className="h-6 px-2 text-xs"
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>
    </div>
  );
};
