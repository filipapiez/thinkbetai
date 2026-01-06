import { useParams, Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { MockDataBanner, DataTimestamp } from '@/components/MockDataBanner';
import { OddsCard } from '@/components/OddsCard';
import { InjuryCard } from '@/components/InjuryCard';
import { RecentFormCard } from '@/components/RecentFormCard';
import { RiskMeter } from '@/components/RiskMeter';
import { AIExplanationCard } from '@/components/AIExplanationCard';
import { AIQueryBar } from '@/components/AIQueryBar';
import { PerformanceChart } from '@/components/PerformanceChart';
import { TeamInfoCard } from '@/components/TeamInfoCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getGameFacts } from '@/lib/mockData';
import { ArrowLeft, Calendar, MapPin, Clock, Bed, Zap, Sparkles } from 'lucide-react';

const GameDetail = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const facts = getGameFacts(gameId || '');

  if (!facts) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Game Not Found</h1>
            <p className="text-muted-foreground mb-6">The game you're looking for doesn't exist.</p>
            <Button asChild>
              <Link to="/games">Back to Games</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const { game, odds, injuries, recentForm, headToHead, context, risk, lastUpdated, performanceHistory } = facts;

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }),
    };
  };

  const dateTime = formatDateTime(game.startTime);

  return (
    <div className="min-h-screen flex flex-col">
      <MockDataBanner />
      <Header />
      
      <main className="flex-1 py-6 md:py-8">
        <div className="container">
          {/* Back Button */}
          <Link to="/games" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft className="h-4 w-4" />
            Back to Games
          </Link>

          {/* Game Header */}
          <Card variant="glass" className="mb-6 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                {/* Teams */}
                <div className="flex-1">
                  <div className="flex items-center justify-center lg:justify-start gap-6">
                    {/* Home Team */}
                    <div className="text-center">
                      <div className="w-20 h-20 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-2xl font-bold">
                        {game.homeTeam.abbreviation}
                      </div>
                      <p className="font-semibold">{game.homeTeam.name}</p>
                      <p className="text-xs text-muted-foreground">Home</p>
                    </div>

                    {/* VS */}
                    <div className="text-center px-4">
                      <div className="text-3xl font-bold text-muted-foreground">vs</div>
                    </div>

                    {/* Away Team */}
                    <div className="text-center">
                      <div className="w-20 h-20 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-secondary to-muted flex items-center justify-center text-2xl font-bold">
                        {game.awayTeam.abbreviation}
                      </div>
                      <p className="font-semibold">{game.awayTeam.name}</p>
                      <p className="text-xs text-muted-foreground">Away</p>
                    </div>
                  </div>
                </div>

                {/* Game Info */}
                <div className="lg:border-l lg:border-border lg:pl-6 space-y-3">
                  <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                    <Badge variant="info">{game.sport}</Badge>
                    <RiskMeter risk={risk} compact />
                  </div>
                  
                  <div className="flex flex-col gap-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{dateTime.date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{dateTime.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{game.venue}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Context Badges */}
              <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-border justify-center">
                <Badge variant={context.backToBack.home ? 'warning' : 'secondary'}>
                  <Zap className="h-3 w-3 mr-1" />
                  {context.backToBack.home ? 'Home B2B' : `Home: ${context.restDays.home}d rest`}
                </Badge>
                <Badge variant={context.backToBack.away ? 'warning' : 'secondary'}>
                  <Bed className="h-3 w-3 mr-1" />
                  {context.backToBack.away ? 'Away B2B' : `Away: ${context.restDays.away}d rest`}
                </Badge>
                {context.homeIsHomeStrong && (
                  <Badge variant="success">Strong at Home</Badge>
                )}
                {context.awayIsAwayStrong && (
                  <Badge variant="success">Strong on Road</Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Data Timestamp */}
          <div className="mb-6">
            <DataTimestamp timestamp={lastUpdated} />
          </div>

          {/* Team Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <TeamInfoCard team={game.homeTeam} isHome={true} />
            <TeamInfoCard team={game.awayTeam} isHome={false} />
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              <OddsCard 
                odds={odds} 
                homeTeam={game.homeTeam.abbreviation} 
                awayTeam={game.awayTeam.abbreviation} 
              />
              <InjuryCard 
                injuries={injuries} 
                homeTeam={game.homeTeam.name} 
                awayTeam={game.awayTeam.name} 
              />
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <RiskMeter risk={risk} />
              <RecentFormCard 
                homeLast5={recentForm.homeLast5} 
                awayLast5={recentForm.awayLast5} 
                headToHead={headToHead}
                homeTeam={game.homeTeam.name}
                awayTeam={game.awayTeam.name}
              />
            </div>
          </div>

          {/* Performance Chart - Full Width */}
          <div className="mt-6">
            <PerformanceChart 
              data={performanceHistory} 
              sport={game.sport}
              gameId={game.id}
              homeTeam={game.homeTeam.name}
              awayTeam={game.awayTeam.name}
              homeLast5={recentForm.homeLast5}
              awayLast5={recentForm.awayLast5}
            />
          </div>

          {/* AI Query Bar - Full Width */}
          <div className="mt-6">
            <Card variant="glass">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <span>Ask AI about {game.sport}</span>
                  <span className="text-xs font-normal text-muted-foreground ml-auto">{game.homeTeam.name} vs {game.awayTeam.name}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AIQueryBar facts={facts} />
              </CardContent>
            </Card>
          </div>

          {/* AI Explanation - Full Width */}
          <div className="mt-6">
            <AIExplanationCard gameId={game.id} />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default GameDetail;
