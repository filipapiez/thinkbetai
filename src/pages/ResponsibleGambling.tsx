import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SEO } from '@/components/SEO';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Heart, AlertTriangle, Phone, Shield, ExternalLink } from 'lucide-react';

const ResponsibleGambling = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title="Responsible Gambling — ThinkBetAI"
        description="Resources, helplines, self-exclusion tools, and age requirements. ThinkBetAI is an analytics platform, not financial advice. If gambling stops being fun, help is available 24/7."
        url="/responsible-gambling"
      />
      <Header />
      <main className="flex-1">
        <div className="container pt-6">
          <Breadcrumb items={[{ label: 'Responsible Gambling' }]} />
        </div>

        <section className="py-12 md:py-16">
          <div className="container max-w-3xl">
            <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
              <Heart className="h-3 w-3 mr-1" />
              Play Smart
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Responsible Gambling</h1>
            <p className="text-lg text-muted-foreground">
              Sports betting should be entertainment, not a source of stress or financial harm. ThinkBetAI is an
              analytics and educational tool — it does not place bets and is not financial advice.
            </p>

            <Card className="mt-8 border-warning/40 bg-warning/5">
              <CardContent className="p-6 md:p-8 space-y-4">
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-warning" />
                  <h2 className="text-xl font-semibold">Get help now (24/7)</h2>
                </div>
                <ul className="space-y-3 text-muted-foreground">
                  <li>
                    <strong className="text-foreground">United States:</strong> Call or text{' '}
                    <a href="tel:1-800-522-4700" className="underline text-foreground">1-800-GAMBLER (1-800-522-4700)</a>{' '}
                    — National Council on Problem Gambling.
                  </li>
                  <li>
                    <strong className="text-foreground">United Kingdom:</strong>{' '}
                    <a href="https://www.gamcare.org.uk/" target="_blank" rel="noopener noreferrer" className="underline text-foreground inline-flex items-center gap-1">
                      GamCare <ExternalLink className="h-3 w-3" />
                    </a>{' '}— 0808 8020 133.
                  </li>
                  <li>
                    <strong className="text-foreground">Canada:</strong>{' '}
                    <a href="https://www.connexontario.ca/" target="_blank" rel="noopener noreferrer" className="underline text-foreground inline-flex items-center gap-1">
                      ConnexOntario <ExternalLink className="h-3 w-3" />
                    </a>{' '}— 1-866-531-2600.
                  </li>
                  <li>
                    <strong className="text-foreground">Worldwide:</strong>{' '}
                    <a href="https://www.gamblersanonymous.org/" target="_blank" rel="noopener noreferrer" className="underline text-foreground inline-flex items-center gap-1">
                      Gamblers Anonymous <ExternalLink className="h-3 w-3" />
                    </a>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardContent className="p-6 md:p-8 space-y-3">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">Age & jurisdiction</h2>
                </div>
                <p className="text-muted-foreground">
                  You must be of legal gambling age in your jurisdiction to place bets — typically 21+ in most US
                  states and 18+ in the UK, Canada, and EU. Sports betting is not legal everywhere. It's your
                  responsibility to know and follow the laws where you live.
                </p>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardContent className="p-6 md:p-8 space-y-3">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  <h2 className="text-xl font-semibold">Warning signs</h2>
                </div>
                <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                  <li>Betting more than you intended, or chasing losses.</li>
                  <li>Hiding bets or spending from family, friends, or partners.</li>
                  <li>Borrowing money — or using credit — to bet.</li>
                  <li>Feeling anxious, irritable, or depressed about betting.</li>
                  <li>Letting bets interfere with work, sleep, or relationships.</li>
                </ul>
                <p className="text-muted-foreground pt-2">
                  If any of these sound familiar, please reach out to one of the resources above. Help is free,
                  confidential, and works.
                </p>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardContent className="p-6 md:p-8 space-y-3">
                <h2 className="text-xl font-semibold">Self-exclusion & deposit limits</h2>
                <p className="text-muted-foreground">
                  Every major regulated sportsbook offers self-exclusion (a voluntary ban from your own account),
                  deposit limits, time limits, and reality checks. Use them. In the US, statewide self-exclusion
                  programs are run by each state's gaming regulator. In the UK, register once with{' '}
                  <a href="https://www.gamstop.co.uk/" target="_blank" rel="noopener noreferrer" className="underline text-foreground inline-flex items-center gap-1">
                    GAMSTOP <ExternalLink className="h-3 w-3" />
                  </a>{' '}to self-exclude from all licensed UK operators at once.
                </p>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardContent className="p-6 md:p-8 space-y-3">
                <h2 className="text-xl font-semibold">What ThinkBetAI is — and isn't</h2>
                <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                  <li>It's an analytics platform that surfaces model-driven context (odds, injuries, form, matchups).</li>
                  <li>It is not financial advice and it does not guarantee any outcome.</li>
                  <li>It does not place bets and does not hold funds.</li>
                  <li>Even our best-graded picks lose. Variance is real. Only stake what you can afford to lose.</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ResponsibleGambling;
