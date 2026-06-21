import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Target, BarChart3, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Static, crawler-visible content for /player-props.
 * Rendered above the dynamic prop grid so Googlebot always sees real content
 * (not just a loading spinner or auth wall) — fixes "Crawled - currently not indexed".
 */
export const PlayerPropsSEOContent = () => {
  return (
    <section className="mt-12 pt-12 border-t border-border/40">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">
          AI Player Props Analysis Across NBA, NFL, MLB & NHL
        </h2>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          ThinkBetAI's player prop tool surfaces real-time over/under lines from
          FanDuel, DraftKings, BetMGM and Caesars, then scores each line using a
          last-20-game (L20) performance model, defensive matchup ratings, pace,
          and implied probability vs. true probability (the "edge"). Every prop
          shown here uses live odds — we do not store stale lines.
        </p>

        <div className="grid sm:grid-cols-2 gap-4 mb-10">
          <Card>
            <CardContent className="p-5 flex gap-3">
              <Target className="h-6 w-6 text-primary shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Edge Detection</h3>
                <p className="text-sm text-muted-foreground">
                  We compare the sportsbook's implied probability against our
                  L20-based projection and flag GOOD, BORDERLINE, or PASS.
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 flex gap-3">
              <BarChart3 className="h-6 w-6 text-primary shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Last 20 Games</h3>
                <p className="text-sm text-muted-foreground">
                  Every prop card includes the player's hit rate on the line
                  over their last 20 outings (when data is available).
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 flex gap-3">
              <TrendingUp className="h-6 w-6 text-primary shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Multi-Book Lines</h3>
                <p className="text-sm text-muted-foreground">
                  See the best over and under price across the major US
                  sportsbooks side-by-side, no manual line shopping required.
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 flex gap-3">
              <Zap className="h-6 w-6 text-primary shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold mb-1">Transparent Evaluation</h3>
                <p className="text-sm text-muted-foreground">
                  Review settled results, sample limitations and grading rules before relying on any model output.{' '}
                  <Link to="/track-record" className="text-primary hover:underline">See the methodology</Link>.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <h2 className="text-2xl font-bold mb-4">Supported Player Prop Markets</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 mb-10 text-sm">
          <div><strong>NBA:</strong> Points, Rebounds, Assists, 3PM, PRA, Steals, Blocks</div>
          <div><strong>NFL:</strong> Pass Yds, Rush Yds, Rec Yds, Receptions, Pass TDs, Anytime TD</div>
          <div><strong>MLB:</strong> Strikeouts, Hits, Total Bases, Home Runs, RBIs</div>
          <div><strong>NHL:</strong> Shots on Goal, Points, Goals, Assists, Saves</div>
          <div><strong>Soccer:</strong> Shots, Shots on Target, Goals, Assists</div>
          <div><strong>UFC/MMA:</strong> Method of Victory, Round Betting, Fight Goes the Distance</div>
        </div>

        <h2 className="text-2xl font-bold mb-4">How to Use This Page</h2>
        <ol className="list-decimal pl-6 space-y-2 text-muted-foreground mb-10">
          <li>Pick a sport at the top (or leave on "All Sports" for everything).</li>
          <li>Use the time filter (Today / This Week / Month / Year) to scope the slate.</li>
          <li>Filter by sportsbook if you want lines from a specific book.</li>
          <li>Tap "Best Bets" to only show props our model rates as GOOD edge.</li>
          <li>Tap any card to see the player's full L20 game log and AI explanation.</li>
        </ol>

        <h2 className="text-2xl font-bold mb-4">Related Pages</h2>
        <ul className="grid sm:grid-cols-2 gap-2 text-sm">
          <li>→ <Link to="/games" className="text-primary hover:underline">All games & matchups</Link></li>
          <li>→ <Link to="/picks" className="text-primary hover:underline">Today's AI picks</Link></li>
          <li>→ <Link to="/parlays" className="text-primary hover:underline">AI Parlay Builder</Link></li>
          <li>→ <Link to="/track-record" className="text-primary hover:underline">Public track record</Link></li>
          <li>→ <Link to="/free-ai-predictions" className="text-primary hover:underline">Free AI predictions</Link></li>
          <li>→ <Link to="/how-it-works" className="text-primary hover:underline">How the model works</Link></li>
        </ul>
      </div>
    </section>
  );
};
