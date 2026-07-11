import { useMemo, useState } from "react";
import { Calculator, Gauge, Scale, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const americanToDecimal = (odds: number) => {
  if (!Number.isFinite(odds) || odds === 0) return 1;
  return odds > 0 ? 1 + odds / 100 : 1 + 100 / Math.abs(odds);
};

const probabilityToAmerican = (probability: number) => {
  const p = clamp(probability, 0.001, 0.999);
  if (p >= 0.5) return Math.round(-(p / (1 - p)) * 100);
  return Math.round(((1 - p) / p) * 100);
};

const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;
const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);

export const BetAnalyzerDemo = () => {
  const [americanOdds, setAmericanOdds] = useState(-110);
  const [modelProbability, setModelProbability] = useState(55);
  const [stake, setStake] = useState(25);

  const analysis = useMemo(() => {
    const decimalOdds = americanToDecimal(americanOdds);
    const p = clamp(modelProbability / 100, 0.001, 0.999);
    const breakEven = 1 / decimalOdds;
    const profitIfWin = stake * (decimalOdds - 1);
    const expectedValue = p * profitIfWin - (1 - p) * stake;
    const evPercent = stake > 0 ? expectedValue / stake : 0;
    const edge = p - breakEven;
    const kelly = Math.max(0, ((decimalOdds - 1) * p - (1 - p)) / (decimalOdds - 1));

    return {
      breakEven,
      decimalOdds,
      edge,
      evPercent,
      expectedValue,
      fairOdds: probabilityToAmerican(p),
      halfKelly: kelly / 2,
      profitIfWin,
      signal: edge >= 0.04 ? "Positive value" : edge >= 0.01 ? "Thin edge" : "Pass or recheck",
    };
  }, [americanOdds, modelProbability, stake]);

  return (
    <Card className="not-prose border-primary/20 bg-primary/5">
      <CardContent className="p-5 md:p-7">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-bold">Try the Public Bet Analyzer</h2>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Enter a sportsbook price, model probability and stake to see implied probability, fair odds, EV and a conservative Kelly guide.
            </p>
          </div>
          <Badge variant="outline" className="w-fit border-primary/40 text-primary">
            {analysis.signal}
          </Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="demo-odds">American odds</Label>
            <Input
              id="demo-odds"
              type="number"
              value={americanOdds}
              onChange={(event) => setAmericanOdds(Number(event.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="demo-probability">Model probability (%)</Label>
            <Input
              id="demo-probability"
              type="number"
              min={1}
              max={99}
              value={modelProbability}
              onChange={(event) => setModelProbability(Number(event.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="demo-stake">Stake ($)</Label>
            <Input
              id="demo-stake"
              type="number"
              min={0}
              value={stake}
              onChange={(event) => setStake(Number(event.target.value))}
            />
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Gauge, label: "Break-even", value: formatPercent(analysis.breakEven), note: "Market implied" },
            { icon: TrendingUp, label: "Model edge", value: formatPercent(analysis.edge), note: "Model minus market" },
            { icon: Scale, label: "Expected value", value: formatCurrency(analysis.expectedValue), note: `${formatPercent(analysis.evPercent)} per dollar` },
            { icon: Calculator, label: "Fair odds", value: `${analysis.fairOdds > 0 ? "+" : ""}${analysis.fairOdds}`, note: `${formatPercent(analysis.halfKelly)} half-Kelly cap` },
          ].map(({ icon: Icon, label, value, note }) => (
            <div key={label} className="rounded-xl border border-border/60 bg-background/70 p-4">
              <Icon className="mb-2 h-5 w-5 text-primary" />
              <div className="text-xs text-muted-foreground">{label}</div>
              <div className="text-2xl font-bold">{value}</div>
              <div className="text-xs text-muted-foreground">{note}</div>
            </div>
          ))}
        </div>

        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
          This calculator is educational. Real analysis should also account for sportsbook limits, line movement, injuries, data quality and whether the quoted number is still available.
        </p>
      </CardContent>
    </Card>
  );
};
