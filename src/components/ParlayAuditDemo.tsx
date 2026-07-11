import { useMemo, useState } from "react";
import { Calculator, Link2, ShieldAlert, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CorrelationMode = "negative" | "neutral" | "positive";

const correlationSettings: Record<CorrelationMode, { label: string; multiplier: number; note: string }> = {
  positive: {
    label: "Positive",
    multiplier: 1.12,
    note: "Legs may benefit from the same game script",
  },
  neutral: {
    label: "Neutral",
    multiplier: 1,
    note: "Treat legs as mostly independent",
  },
  negative: {
    label: "Negative",
    multiplier: 0.85,
    note: "One leg may reduce another leg's chance",
  },
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const americanToDecimal = (odds: number) => (odds > 0 ? 1 + odds / 100 : 1 + 100 / Math.abs(odds || -110));
const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;
const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);

export const ParlayAuditDemo = () => {
  const [legOneOdds, setLegOneOdds] = useState(-110);
  const [legTwoOdds, setLegTwoOdds] = useState(120);
  const [legThreeOdds, setLegThreeOdds] = useState(-105);
  const [legOneProbability, setLegOneProbability] = useState(54);
  const [legTwoProbability, setLegTwoProbability] = useState(48);
  const [legThreeProbability, setLegThreeProbability] = useState(53);
  const [stake, setStake] = useState(20);
  const [correlation, setCorrelation] = useState<CorrelationMode>("neutral");

  const analysis = useMemo(() => {
    const legs = [
      { odds: legOneOdds, probability: clamp(legOneProbability / 100, 0.001, 0.999) },
      { odds: legTwoOdds, probability: clamp(legTwoProbability / 100, 0.001, 0.999) },
      { odds: legThreeOdds, probability: clamp(legThreeProbability / 100, 0.001, 0.999) },
    ];
    const decimalPayout = legs.reduce((total, leg) => total * americanToDecimal(leg.odds), 1);
    const independentProbability = legs.reduce((total, leg) => total * leg.probability, 1);
    const adjustedProbability = clamp(independentProbability * correlationSettings[correlation].multiplier, 0.001, 0.98);
    const breakEven = 1 / decimalPayout;
    const profitIfWin = stake * (decimalPayout - 1);
    const expectedValue = adjustedProbability * profitIfWin - (1 - adjustedProbability) * stake;
    const edge = adjustedProbability - breakEven;

    return {
      adjustedProbability,
      breakEven,
      decimalPayout,
      edge,
      expectedValue,
      independentProbability,
      profitIfWin,
      risk:
        adjustedProbability < 0.12
          ? "High variance"
          : edge < 0
            ? "Poor price"
            : edge < 0.025
              ? "Thin edge"
              : "Worth deeper review",
    };
  }, [
    correlation,
    legOneOdds,
    legOneProbability,
    legThreeOdds,
    legThreeProbability,
    legTwoOdds,
    legTwoProbability,
    stake,
  ]);

  const legInputs = [
    {
      label: "Leg 1",
      odds: legOneOdds,
      probability: legOneProbability,
      setOdds: setLegOneOdds,
      setProbability: setLegOneProbability,
    },
    {
      label: "Leg 2",
      odds: legTwoOdds,
      probability: legTwoProbability,
      setOdds: setLegTwoOdds,
      setProbability: setLegTwoProbability,
    },
    {
      label: "Leg 3",
      odds: legThreeOdds,
      probability: legThreeProbability,
      setOdds: setLegThreeOdds,
      setProbability: setLegThreeProbability,
    },
  ];

  return (
    <Card className="not-prose border-primary/20 bg-primary/5">
      <CardContent className="p-5 md:p-7">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Link2 className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-bold">Public Parlay Audit Demo</h2>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Test how odds, leg probabilities and correlation change the real chance of a multi-leg ticket.
            </p>
          </div>
          <Badge variant="outline" className="w-fit border-primary/40 text-primary">
            {analysis.risk}
          </Badge>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {legInputs.map((leg) => (
            <div key={leg.label} className="rounded-xl border border-border/60 bg-background/70 p-4">
              <h3 className="mb-3 font-semibold">{leg.label}</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>{leg.label} odds</Label>
                  <Input type="number" value={leg.odds} onChange={(event) => leg.setOdds(Number(event.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>{leg.label} model %</Label>
                  <Input
                    type="number"
                    min={1}
                    max={99}
                    value={leg.probability}
                    onChange={(event) => leg.setProbability(Number(event.target.value))}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-[1fr_240px]">
          <div className="rounded-xl border border-border/60 bg-background/70 p-4">
            <Label className="mb-3 block">Correlation setting</Label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(correlationSettings) as CorrelationMode[]).map((mode) => (
                <Button
                  key={mode}
                  type="button"
                  variant={correlation === mode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCorrelation(mode)}
                >
                  {correlationSettings[mode].label}
                </Button>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">{correlationSettings[correlation].note}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="parlay-stake">Stake ($)</Label>
            <Input id="parlay-stake" type="number" min={0} value={stake} onChange={(event) => setStake(Number(event.target.value))} />
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Calculator, label: "Sportsbook payout", value: `${analysis.decimalPayout.toFixed(2)}x`, note: `${formatCurrency(analysis.profitIfWin)} profit if it wins` },
            { icon: TrendingUp, label: "Break-even", value: formatPercent(analysis.breakEven), note: "Probability needed at this price" },
            { icon: Link2, label: "Adjusted chance", value: formatPercent(analysis.adjustedProbability), note: `${formatPercent(analysis.independentProbability)} independent` },
            { icon: ShieldAlert, label: "Expected value", value: formatCurrency(analysis.expectedValue), note: `${formatPercent(analysis.edge)} edge vs price` },
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
          Correlation is simplified for the public demo. Full analysis should use actual game context, player usage, market price, book rules and injury/news changes.
        </p>
      </CardContent>
    </Card>
  );
};
