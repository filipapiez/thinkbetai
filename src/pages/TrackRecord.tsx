import { AlertTriangle, BarChart3, FileText, Loader2, Scale, ScrollText, ShieldCheck, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SEO } from '@/components/SEO';
import { Breadcrumb } from '@/components/Breadcrumb';
import { useWinRate } from '@/hooks/useWinRate';
import { PublicBetLedger } from '@/components/PublicBetLedger';

const TrackRecord = () => {
  const { winRate, totalBets, wins, losses, isLoading } = useWinRate({ useFallback: false });
  const hasResults = totalBets > 0;
  const displayValue = (value: string | number) => {
    if (isLoading) return <Loader2 className="mx-auto h-7 w-7 animate-spin" />;
    return value;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title="Settled Pick Record & Grading Methodology | ThinkBetAI"
        description="Review ThinkBetAI's live settled-record summary, public pick ledger, CSV export, CLV fields, grading rules and methodology. Past performance does not guarantee future outcomes."
        url="/track-record"
      />
      <Header />
      <main className="flex-1">
        <div className="container pt-6"><Breadcrumb items={[{ label: 'Track Record' }]} /></div>

        <section className="py-12 md:py-16">
          <div className="container max-w-5xl">
            <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
              <ShieldCheck className="h-3 w-3 mr-1" />Live database summary
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Settled Pick Record &amp; Methodology</h1>
            <p className="text-lg text-muted-foreground max-w-3xl">
              These totals are calculated from settled win/loss records in the product database when the page loads. They are not a guarantee, an audited financial statement or a substitute for reviewing the underlying ledger.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10" aria-live="polite">
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 text-center">
                <div className="text-3xl md:text-4xl font-bold text-emerald-400">{displayValue(hasResults ? `${winRate}%` : '—')}</div>
                <div className="text-xs text-muted-foreground mt-1">Settled win rate</div>
              </div>
              <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6 text-center">
                <div className="text-3xl md:text-4xl font-bold text-blue-400">{displayValue(totalBets.toLocaleString())}</div>
                <div className="text-xs text-muted-foreground mt-1">Settled records</div>
              </div>
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 text-center">
                <div className="text-3xl md:text-4xl font-bold text-amber-400">{displayValue(wins.toLocaleString())}</div>
                <div className="text-xs text-muted-foreground mt-1">Recorded wins</div>
              </div>
              <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-6 text-center">
                <div className="text-3xl md:text-4xl font-bold text-purple-400">{displayValue(losses.toLocaleString())}</div>
                <div className="text-xs text-muted-foreground mt-1">Recorded losses</div>
              </div>
            </div>

            {!isLoading && !hasResults && (
              <p className="mt-4 rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                The public summary could not retrieve settled records. No fallback percentage is shown because an unavailable data source should not be replaced with a marketing estimate.
              </p>
            )}

            <div className="mt-10 grid gap-6 md:grid-cols-2">
              <Card>
                <CardContent className="p-6 md:p-8 space-y-4">
                  <div className="flex items-center gap-3"><BarChart3 className="h-5 w-5 text-primary" /><h2 className="text-xl font-semibold">How the summary is calculated</h2></div>
                  <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                    <li>Only records marked as a settled win or loss are included.</li>
                    <li>Win rate equals recorded wins divided by total settled wins and losses.</li>
                    <li>Pushes, pending events and unavailable outcomes are excluded.</li>
                    <li>The figures are recalculated from the database rather than hard-coded into this page.</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 md:p-8 space-y-4">
                  <div className="flex items-center gap-3"><Scale className="h-5 w-5 text-primary" /><h2 className="text-xl font-semibold">How to evaluate the sample</h2></div>
                  <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                    <li>Separate results by sport, market, odds range and time period.</li>
                    <li>Confirm whether the quoted line was actually available when a pick was recorded.</li>
                    <li>Review sample size and price, not win percentage alone.</li>
                    <li>Expect variance and losing streaks even in a historically positive sample.</li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-6 border-amber-500/30 bg-amber-500/5">
              <CardContent className="p-6 md:p-8 space-y-3">
                <div className="flex items-center gap-3"><AlertTriangle className="h-5 w-5 text-amber-400" /><h2 className="text-xl font-semibold">Important limitations</h2></div>
                <p className="text-muted-foreground">
                  This is a product-reported database summary, not an independently audited record. Row-level records, full CSV export and closing-line fields provide more context than aggregate cards alone, but immutable timestamps and independent auditing would provide stronger evidence. Treat these numbers as one input—not proof of future profitability.
                </p>
              </CardContent>
            </Card>

            <PublicBetLedger />

            <Card className="mt-6">
              <CardContent className="p-6 md:p-8 space-y-4">
                <div className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-primary" /><h2 className="text-xl font-semibold">Verification standard we want users to hold us to</h2></div>
                <div className="grid gap-4 md:grid-cols-3">
                  {[
                    { label: 'Available now', text: 'Aggregate settled-record summary, public event-level rows and full CSV export from the public table.' },
                    { label: 'Being captured', text: 'Pick timestamp, game start time, odds source and closing-line value for qualified picks.' },
                    { label: 'Strongest proof', text: 'Independent third-party archive or signed daily snapshot that cannot be edited after events start.' },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl border border-border/60 bg-muted/20 p-4">
                      <h3 className="mb-2 font-semibold">{item.label}</h3>
                      <p className="text-sm leading-relaxed text-muted-foreground">{item.text}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardContent className="p-6 md:p-8 space-y-3">
                <div className="flex items-center gap-3"><ScrollText className="h-5 w-5 text-primary" /><h2 className="text-xl font-semibold">Corrections and data requests</h2></div>
                <p className="text-muted-foreground">
                  If a settled result appears incorrect or you need a specific sample definition, contact{' '}
                  <a href="mailto:support@thinkbetai.com" className="underline text-foreground">support@thinkbetai.com</a>. Our{' '}
                  <Link to="/editorial-policy" className="underline text-foreground">editorial policy</Link> explains how performance references, corrections and AI-assisted content should be handled.
                </p>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardContent className="p-6 md:p-8 space-y-3">
                <div className="flex items-center gap-3"><FileText className="h-5 w-5 text-primary" /><h2 className="text-xl font-semibold">Responsible interpretation</h2></div>
                <p className="text-muted-foreground">Past performance does not guarantee future results. ThinkBetAI provides analytical and educational information, not financial advice. Only participate where legal and never risk money you cannot afford to lose.</p>
              </CardContent>
            </Card>

            <div className="mt-10 flex flex-wrap gap-3">
              <Button asChild><Link to="/pricing"><TrendingUp className="h-4 w-4 mr-2" />Compare plans</Link></Button>
              <Button asChild variant="outline"><Link to="/how-it-works">Review how analysis works</Link></Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default TrackRecord;
