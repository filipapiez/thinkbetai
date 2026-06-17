import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SEO } from '@/components/SEO';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Link } from 'react-router-dom';
import { TrendingUp, ShieldCheck, BarChart3, FileText, AlertTriangle, ScrollText } from 'lucide-react';

const TrackRecord = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title="Track Record & Methodology — ThinkBetAI"
        description="Public performance and methodology for ThinkBetAI: sample size, date range, qualified-pick criteria, and how the 80.3% figure is computed. Past performance does not guarantee future results."
        url="/track-record"
      />
      <Header />
      <main className="flex-1">
        <div className="container pt-6">
          <Breadcrumb items={[{ label: 'Track Record' }]} />
        </div>

        <section className="py-12 md:py-16">
          <div className="container max-w-4xl">
            <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
              <ShieldCheck className="h-3 w-3 mr-1" />
              Transparency
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Track Record & Methodology</h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              We publish how our performance figures are calculated so you can judge them honestly.
              Sports betting carries real financial risk and past performance does not guarantee future results.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 text-center">
                <div className="text-3xl md:text-4xl font-bold text-emerald-400">80.3%</div>
                <div className="text-xs text-muted-foreground mt-1">Qualified-pick win rate</div>
              </div>
              <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6 text-center">
                <div className="text-3xl md:text-4xl font-bold text-blue-400">Mar 2023 → Now</div>
                <div className="text-xs text-muted-foreground mt-1">Tracking window</div>
              </div>
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 text-center">
                <div className="text-3xl md:text-4xl font-bold text-amber-400">6</div>
                <div className="text-xs text-muted-foreground mt-1">Sports tracked</div>
              </div>
              <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-6 text-center">
                <div className="text-3xl md:text-4xl font-bold text-purple-400">Qualified</div>
                <div className="text-xs text-muted-foreground mt-1">Picks only</div>
              </div>
            </div>

            <Card className="mt-10">
              <CardContent className="p-6 md:p-8 space-y-4">
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">How the 80.3% figure is computed</h2>
                </div>
                <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                  <li><strong className="text-foreground">Universe:</strong> only "qualified" picks — model confidence ≥ 70%, market odds available at pick time, kickoff in the future at recommendation.</li>
                  <li><strong className="text-foreground">Result:</strong> graded against the official final score from the league feed; pushes are excluded from numerator and denominator.</li>
                  <li><strong className="text-foreground">Sports:</strong> NFL, NBA, MLB, NHL, UFC, soccer. Off-season sports are excluded from grading.</li>
                  <li><strong className="text-foreground">Sample:</strong> figure is rolling — recomputed daily from the historical bet ledger. Smaller sub-samples (single sport, single week) can deviate substantially from the headline.</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardContent className="p-6 md:p-8 space-y-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">What "qualified pick" means</h2>
                </div>
                <p className="text-muted-foreground">
                  Not every game generates a recommendation. A pick is considered qualified only when the model has
                  enough recent data (team form, injuries, line movement, head-to-head), the available odds clear our
                  edge threshold, and there are no known data-integrity issues (e.g. missing roster updates near tip-off).
                  Picks that don't clear these gates are surfaced as informational, not as recommendations, and do not
                  count toward the win-rate figure.
                </p>
              </CardContent>
            </Card>

            <Card className="mt-6 border-warning/30 bg-warning/5">
              <CardContent className="p-6 md:p-8 space-y-3">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  <h2 className="text-xl font-semibold">Honest disclaimers</h2>
                </div>
                <ul className="list-disc pl-5 space-y-2 text-muted-foreground text-sm">
                  <li>Past performance does not guarantee future results.</li>
                  <li>ThinkBetAI is an analytics and educational tool, not financial advice.</li>
                  <li>No outcome is guaranteed. Variance is real and losing streaks happen even on a long-term winning model.</li>
                  <li>Only bet what you can afford to lose. See our <Link to="/responsible-gambling" className="underline text-foreground">responsible gambling</Link> page.</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardContent className="p-6 md:p-8 space-y-3">
                <div className="flex items-center gap-3">
                  <ScrollText className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">Auditability</h2>
                </div>
                <p className="text-muted-foreground">
                  Every graded pick is stored in our historical bet ledger with the recommendation timestamp, odds at
                  pick time, final result, and pick rationale. We're continuously improving the public-facing breakdown;
                  if a specific sport, week, or sample window matters to you, email{' '}
                  <a href="mailto:support@thinkbetai.com" className="underline text-foreground">support@thinkbetai.com</a>{' '}
                  and we'll pull the slice.
                </p>
              </CardContent>
            </Card>

            <div className="mt-10 flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/games"><TrendingUp className="h-4 w-4 mr-2" />View today's games</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/pricing">See pricing</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default TrackRecord;
