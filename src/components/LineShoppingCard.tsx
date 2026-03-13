import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { DollarSign, TrendingUp, ExternalLink } from 'lucide-react';

interface BookmakerOdds {
  key: string;
  title: string;
  moneyline: { home: number; away: number };
  spread: { home: number; homeOdds: number; away: number; awayOdds: number };
  total: { line: number; overOdds: number; underOdds: number };
}

interface LineShoppingCardProps {
  bookmakers: BookmakerOdds[];
  homeTeam: string;
  awayTeam: string;
}

const SPORTSBOOK_LINKS: Record<string, string> = {
  fanduel: 'https://sportsbook.fanduel.com',
  draftkings: 'https://sportsbook.draftkings.com',
  betmgm: 'https://sports.betmgm.com',
  caesars: 'https://www.caesars.com/sportsbook-and-casino',
  pointsbetus: 'https://www.pointsbet.com',
  bovada: 'https://www.bovada.lv',
  betonlineag: 'https://www.betonline.ag',
  betrivers: 'https://www.betrivers.com',
  unibet_us: 'https://www.unibet.com',
  williamhill_us: 'https://www.williamhill.com',
  wynnbet: 'https://www.wynnbet.com',
  superbook: 'https://www.superbook.com',
  betfred: 'https://www.betfred.com',
  espnbet: 'https://espnbet.com',
  fliff: 'https://www.fliff.com',
  hardrockbet: 'https://www.hardrock.bet',
  fanatics: 'https://sportsbook.fanatics.com',
};

const formatOdds = (odds: number): string => {
  if (odds === 0) return 'N/A';
  return odds > 0 ? `+${odds}` : `${odds}`;
};

// Find the best odds for each market
function findBestOdds(bookmakers: BookmakerOdds[]) {
  let bestHomeML = { value: -Infinity, book: '' };
  let bestAwayML = { value: -Infinity, book: '' };
  let bestHomeSpread = { value: -Infinity, book: '' };
  let bestAwaySpread = { value: -Infinity, book: '' };
  let bestOver = { value: -Infinity, book: '' };
  let bestUnder = { value: -Infinity, book: '' };

  for (const bk of bookmakers) {
    if (bk.moneyline.home !== 0 && bk.moneyline.home > bestHomeML.value) {
      bestHomeML = { value: bk.moneyline.home, book: bk.key };
    }
    if (bk.moneyline.away !== 0 && bk.moneyline.away > bestAwayML.value) {
      bestAwayML = { value: bk.moneyline.away, book: bk.key };
    }
    if (bk.spread.homeOdds !== 0 && bk.spread.homeOdds > bestHomeSpread.value) {
      bestHomeSpread = { value: bk.spread.homeOdds, book: bk.key };
    }
    if (bk.spread.awayOdds !== 0 && bk.spread.awayOdds > bestAwaySpread.value) {
      bestAwaySpread = { value: bk.spread.awayOdds, book: bk.key };
    }
    if (bk.total.overOdds !== 0 && bk.total.overOdds > bestOver.value) {
      bestOver = { value: bk.total.overOdds, book: bk.key };
    }
    if (bk.total.underOdds !== 0 && bk.total.underOdds > bestUnder.value) {
      bestUnder = { value: bk.total.underOdds, book: bk.key };
    }
  }

  return { bestHomeML, bestAwayML, bestHomeSpread, bestAwaySpread, bestOver, bestUnder };
}

export const LineShoppingCard = ({ bookmakers, homeTeam, awayTeam }: LineShoppingCardProps) => {
  if (!bookmakers || bookmakers.length <= 1) return null;

  const best = findBestOdds(bookmakers);

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <DollarSign className="h-5 w-5 text-primary" />
          Line Shopping
          <Badge variant="secondary" className="ml-auto text-xs">
            {bookmakers.length} books
          </Badge>
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Compare odds across sportsbooks — <span className="text-emerald-400 font-medium">green = best price</span>
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-3 text-xs text-muted-foreground font-medium w-[140px]">Sportsbook</th>
                <th className="text-center py-2 px-2 text-xs text-muted-foreground font-medium" colSpan={2}>Moneyline</th>
                <th className="text-center py-2 px-2 text-xs text-muted-foreground font-medium" colSpan={2}>Spread</th>
                <th className="text-center py-2 px-2 text-xs text-muted-foreground font-medium" colSpan={2}>Total</th>
              </tr>
              <tr className="border-b border-border/50">
                <th></th>
                <th className="text-center py-1 text-[10px] text-muted-foreground">{homeTeam.split(' ').pop()}</th>
                <th className="text-center py-1 text-[10px] text-muted-foreground">{awayTeam.split(' ').pop()}</th>
                <th className="text-center py-1 text-[10px] text-muted-foreground">{homeTeam.split(' ').pop()}</th>
                <th className="text-center py-1 text-[10px] text-muted-foreground">{awayTeam.split(' ').pop()}</th>
                <th className="text-center py-1 text-[10px] text-muted-foreground">Over</th>
                <th className="text-center py-1 text-[10px] text-muted-foreground">Under</th>
              </tr>
            </thead>
            <tbody>
              {bookmakers.map((bk) => {
                const link = SPORTSBOOK_LINKS[bk.key];
                return (
                  <tr key={bk.key} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-xs truncate max-w-[110px]">{bk.title}</span>
                        {link && (
                          <a href={link} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                            <ExternalLink className="h-3 w-3 text-muted-foreground hover:text-primary" />
                          </a>
                        )}
                      </div>
                    </td>
                    {/* Moneyline */}
                    <td className={cn(
                      "text-center py-2.5 px-1 font-mono text-xs",
                      best.bestHomeML.book === bk.key && bk.moneyline.home !== 0 && "text-emerald-400 font-bold"
                    )}>
                      {formatOdds(bk.moneyline.home)}
                    </td>
                    <td className={cn(
                      "text-center py-2.5 px-1 font-mono text-xs",
                      best.bestAwayML.book === bk.key && bk.moneyline.away !== 0 && "text-emerald-400 font-bold"
                    )}>
                      {formatOdds(bk.moneyline.away)}
                    </td>
                    {/* Spread */}
                    <td className={cn(
                      "text-center py-2.5 px-1 font-mono text-xs",
                      best.bestHomeSpread.book === bk.key && bk.spread.homeOdds !== 0 && "text-emerald-400 font-bold"
                    )}>
                      {bk.spread.home !== 0 ? `${bk.spread.home > 0 ? '+' : ''}${bk.spread.home} (${formatOdds(bk.spread.homeOdds)})` : 'N/A'}
                    </td>
                    <td className={cn(
                      "text-center py-2.5 px-1 font-mono text-xs",
                      best.bestAwaySpread.book === bk.key && bk.spread.awayOdds !== 0 && "text-emerald-400 font-bold"
                    )}>
                      {bk.spread.away !== 0 ? `${bk.spread.away > 0 ? '+' : ''}${bk.spread.away} (${formatOdds(bk.spread.awayOdds)})` : 'N/A'}
                    </td>
                    {/* Total */}
                    <td className={cn(
                      "text-center py-2.5 px-1 font-mono text-xs",
                      best.bestOver.book === bk.key && bk.total.overOdds !== 0 && "text-emerald-400 font-bold"
                    )}>
                      {bk.total.line > 0 ? `O${bk.total.line} (${formatOdds(bk.total.overOdds)})` : 'N/A'}
                    </td>
                    <td className={cn(
                      "text-center py-2.5 px-1 font-mono text-xs",
                      best.bestUnder.book === bk.key && bk.total.underOdds !== 0 && "text-emerald-400 font-bold"
                    )}>
                      {bk.total.line > 0 ? `U${bk.total.line} (${formatOdds(bk.total.underOdds)})` : 'N/A'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Best Odds Summary */}
        <div className="mt-4 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-semibold text-emerald-400">Best Available Lines</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            {best.bestHomeML.book && (
              <div>
                <span className="text-muted-foreground">{homeTeam.split(' ').pop()} ML:</span>{' '}
                <span className="font-mono font-bold text-emerald-400">{formatOdds(best.bestHomeML.value)}</span>{' '}
                <span className="text-muted-foreground">@ {bookmakers.find(b => b.key === best.bestHomeML.book)?.title}</span>
              </div>
            )}
            {best.bestAwayML.book && (
              <div>
                <span className="text-muted-foreground">{awayTeam.split(' ').pop()} ML:</span>{' '}
                <span className="font-mono font-bold text-emerald-400">{formatOdds(best.bestAwayML.value)}</span>{' '}
                <span className="text-muted-foreground">@ {bookmakers.find(b => b.key === best.bestAwayML.book)?.title}</span>
              </div>
            )}
            {best.bestOver.book && (
              <div>
                <span className="text-muted-foreground">Best Over:</span>{' '}
                <span className="font-mono font-bold text-emerald-400">{formatOdds(best.bestOver.value)}</span>{' '}
                <span className="text-muted-foreground">@ {bookmakers.find(b => b.key === best.bestOver.book)?.title}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
