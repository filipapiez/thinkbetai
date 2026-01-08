import { useState } from 'react';
import { useUFCEvents, UFCEvent, UFCFight } from '@/hooks/useUFCEvents';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Trophy, 
  MapPin, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  Swords,
  Crown,
  Users,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

interface UFCFightCardProps {
  fight: UFCFight;
  index: number;
}

const UFCFightCard = ({ fight, index }: UFCFightCardProps) => {
  return (
    <div 
      className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
        fight.isMainEvent 
          ? 'bg-primary/10 border border-primary/30' 
          : fight.isTitleFight 
            ? 'bg-amber-500/10 border border-amber-500/30'
            : 'bg-muted/30 hover:bg-muted/50'
      }`}
    >
      <div className="flex items-center gap-3 flex-1">
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-bold">
          {index + 1}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">{fight.fighter1}</span>
            <span className="text-xs text-muted-foreground">vs</span>
            <span className="font-medium text-sm">{fight.fighter2}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-muted-foreground">{fight.weightClass}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {fight.isTitleFight && (
          <Badge variant="outline" className="bg-amber-500/20 text-amber-400 border-amber-500/40 text-xs">
            <Crown className="h-3 w-3 mr-1" />
            Title
          </Badge>
        )}
        {fight.isMainEvent && (
          <Badge className="bg-primary text-primary-foreground text-xs">
            Main Event
          </Badge>
        )}
      </div>
    </div>
  );
};

interface UFCEventCardProps {
  event: UFCEvent;
  isExpanded: boolean;
  onToggle: () => void;
}

const UFCEventCard = ({ event, isExpanded, onToggle }: UFCEventCardProps) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const mainEvent = event.fights.find(f => f.isMainEvent);
  const titleFights = event.fights.filter(f => f.isTitleFight && !f.isMainEvent);
  const otherFights = event.fights.filter(f => !f.isMainEvent && !f.isTitleFight);

  return (
    <Card className="overflow-hidden border-border/60 hover:border-primary/40 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-bold truncate">{event.name}</CardTitle>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(event.date)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                <span>{event.location}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                <span>{event.fights.length} fights</span>
              </div>
            </div>
          </div>
          {titleFights.length > 0 && (
            <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30 shrink-0">
              <Crown className="h-3 w-3 mr-1" />
              {titleFights.length + (mainEvent?.isTitleFight ? 1 : 0)} Title Fight{titleFights.length > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Main Event Preview */}
        {mainEvent && (
          <div className="p-4 rounded-lg bg-gradient-to-r from-primary/20 to-primary/5 border border-primary/30 mb-4">
            <div className="flex items-center gap-2 text-xs text-primary font-medium mb-2">
              <Swords className="h-3.5 w-3.5" />
              MAIN EVENT
              {mainEvent.isTitleFight && (
                <Badge variant="outline" className="bg-amber-500/20 text-amber-400 border-amber-500/40 text-xs ml-1">
                  <Crown className="h-3 w-3 mr-1" />
                  Title Fight
                </Badge>
              )}
            </div>
            <div className="flex items-center justify-center gap-4">
              <div className="text-center flex-1">
                <div className="font-bold text-lg">{mainEvent.fighter1}</div>
              </div>
              <div className="text-xl font-bold text-muted-foreground">VS</div>
              <div className="text-center flex-1">
                <div className="font-bold text-lg">{mainEvent.fighter2}</div>
              </div>
            </div>
            <div className="text-center mt-2 text-sm text-muted-foreground">
              {mainEvent.weightClass}
            </div>
          </div>
        )}

        {/* Expand/Collapse Button */}
        <Button 
          variant="ghost" 
          className="w-full justify-between h-10"
          onClick={onToggle}
        >
          <span className="text-sm">
            {isExpanded ? 'Hide full card' : `View full card (${event.fights.length} fights)`}
          </span>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>

        {/* Expanded Fight Card */}
        {isExpanded && (
          <div className="mt-4 space-y-2">
            {event.fights.map((fight, index) => (
              <UFCFightCard key={fight.id} fight={fight} index={index} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const UFCEventsSkeleton = () => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    {[1, 2].map(i => (
      <Card key={i} className="overflow-hidden">
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-3/4 mb-2" />
          <div className="flex gap-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full rounded-lg mb-4" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    ))}
  </div>
);

export const UFCEventsSection = () => {
  const { events, isLoading, error, refetch } = useUFCEvents();
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());

  const toggleEvent = (eventId: string) => {
    setExpandedEvents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
      } else {
        newSet.add(eventId);
      }
      return newSet;
    });
  };

  if (isLoading) {
    return (
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/20">
              <Swords className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold">UFC Events</h2>
              <p className="text-sm text-muted-foreground">Loading upcoming fight cards...</p>
            </div>
          </div>
        </div>
        <UFCEventsSkeleton />
      </section>
    );
  }

  if (error && events.length === 0) {
    return (
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/20">
              <Swords className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold">UFC Events</h2>
              <p className="text-sm text-muted-foreground">Upcoming fight cards</p>
            </div>
          </div>
        </div>
        <Card className="p-8 text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">Failed to load UFC events</p>
          <Button variant="outline" size="sm" onClick={refetch}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </Card>
      </section>
    );
  }

  if (events.length === 0) {
    return null;
  }

  const totalFights = events.reduce((sum, e) => sum + e.fights.length, 0);
  const totalTitleFights = events.reduce(
    (sum, e) => sum + e.fights.filter(f => f.isTitleFight).length, 
    0
  );

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/20">
            <Swords className="h-5 w-5 text-red-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold">UFC Events</h2>
            <p className="text-sm text-muted-foreground">
              {events.length} upcoming events • {totalFights} fights • {totalTitleFights} title fights
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={refetch}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {events.map(event => (
          <UFCEventCard 
            key={event.id} 
            event={event}
            isExpanded={expandedEvents.has(event.id)}
            onToggle={() => toggleEvent(event.id)}
          />
        ))}
      </div>
    </section>
  );
};
