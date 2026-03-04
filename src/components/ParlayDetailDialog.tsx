import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  Flame, CheckCircle2, AlertTriangle, Trophy, TrendingUp, 
  Star, Target, BarChart3, Zap, ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';

interface ParlayLeg {
  gameIndex: number;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  gameDate?: string;
  pick: 'home' | 'away';
  pickType: string;
  pickDetail: string;
  reasoning: string;
}

interface SuggestedParlay {
  name: string;
  signal: 'STRONG' | 'DECENT' | 'RISKY';
  confidence: number;
  legs: ParlayLeg[];
  rationale: string;
  estimatedOdds: string;
}

const GRADE_CONFIG: Record<string, { color: string; text: string; bg: string; border: string }> = {
  'A+': { color: 'from-emerald-500 to-green-400', text: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30' },
  'A':  { color: 'from-emerald-500 to-teal-400', text: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30' },
  'B+': { color: 'from-blue-500 to-cyan-400', text: 'text-blue-400', bg: 'bg-blue-500/15', border: 'border-blue-500/30' },
  'B':  { color: 'from-blue-500 to-indigo-400', text: 'text-blue-400', bg: 'bg-blue-500/15', border: 'border-blue-500/30' },
  'C+': { color: 'from-amber-500 to-yellow-400', text: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/30' },
  'C':  { color: 'from-amber-500 to-orange-400', text: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/30' },
  'D':  { color: 'from-red-500 to-orange-400', text: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/30' },
  'F':  { color: 'from-red-600 to-red-400', text: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/30' },
};

function getGrade(confidence: number): string {
  if (confidence >= 80) return 'A+';
  if (confidence >= 73) return 'A';
  if (confidence >= 66) return 'B+';
  if (confidence >= 60) return 'B';
  if (confidence >= 55) return 'C+';
  if (confidence >= 50) return 'C';
  if (confidence >= 40) return 'D';
  return 'F';
}

function getSignalConfig(signal: string) {
  switch (signal) {
    case 'STRONG': return { icon: Flame, label: 'STRONG', color: 'text-orange-400', bg: 'bg-orange-500/15', border: 'border-orange-500/30' };
    case 'DECENT': return { icon: CheckCircle2, label: 'DECENT', color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30' };
    default: return { icon: AlertTriangle, label: 'RISKY', color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/30' };
  }
}

interface ParlayDetailDialogProps {
  parlay: SuggestedParlay | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ParlayDetailDialog({ parlay, open, onOpenChange }: ParlayDetailDialogProps) {
  if (!parlay) return null;

  const grade = getGrade(parlay.confidence);
  const gradeConfig = GRADE_CONFIG[grade] || GRADE_CONFIG['C'];
  const signal = getSignalConfig(parlay.signal);
  const SignalIcon = signal.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto p-0 gap-0 border-border/50">
        {/* Hero Header */}
        <div className="relative p-6 pb-4 bg-gradient-to-br from-primary/10 via-accent/5 to-transparent">
          <DialogHeader className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge className={cn("text-xs border", signal.bg, signal.color, signal.border)}>
                <SignalIcon className="h-3 w-3 mr-1" />
                {signal.label}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {parlay.legs.length} Leg Parlay
              </Badge>
            </div>
            <DialogTitle className="text-xl font-bold pr-8">{parlay.name}</DialogTitle>
            <DialogDescription className="sr-only">Detailed breakdown of {parlay.name}</DialogDescription>
          </DialogHeader>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className={cn("rounded-xl p-3 text-center border", gradeConfig.bg, gradeConfig.border)}>
              <span className={cn("text-2xl font-black block", gradeConfig.text)}>{grade}</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Grade</span>
            </div>
            <div className="rounded-xl p-3 text-center bg-primary/10 border border-primary/20">
              <span className="text-2xl font-black block text-primary">{parlay.confidence}%</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Confidence</span>
            </div>
            <div className="rounded-xl p-3 text-center bg-accent/10 border border-accent/20">
              <span className="text-2xl font-black block text-accent font-mono">{parlay.estimatedOdds}</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Est. Odds</span>
            </div>
          </div>
        </div>

        {/* Legs Breakdown */}
        <div className="p-6 pt-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Target className="h-4 w-4 text-primary" />
            <h4 className="font-semibold text-sm">Parlay Legs</h4>
          </div>

          {parlay.legs.map((leg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="rounded-xl border border-border/60 bg-muted/30 overflow-hidden"
            >
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-primary/15 flex items-center justify-center text-primary font-bold text-xs">
                      {idx + 1}
                    </div>
                    <Badge variant="outline" className="text-[10px] px-1.5">{leg.sport}</Badge>
                  </div>
                  <Badge className="bg-primary/10 text-primary border-0 text-[10px]">
                    {leg.pickType}
                  </Badge>
                </div>

                <div className="ml-9 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm text-foreground">
                      {leg.awayTeam} <span className="text-muted-foreground mx-1">vs</span> {leg.homeTeam}
                    </p>
                    {leg.gameDate && (
                      <span className="text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                        {leg.gameDate}
                      </span>
                    )}
                  </div>
                  <p className="font-semibold text-sm flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-primary" />
                    {leg.pickDetail}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed italic">
                    {leg.reasoning}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Rationale */}
          <div className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/15">
            <div className="flex items-start gap-2.5">
              <Trophy className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div>
                <h4 className="font-semibold text-sm mb-1">AI Rationale</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {parlay.rationale}
                </p>
              </div>
            </div>
          </div>

          {/* Combined Probability */}
          <div className="p-3 rounded-xl bg-muted/40 border border-border/40">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Combined hit probability: <span className="font-bold text-foreground">
                  {Math.round(parlay.legs.reduce((acc, _, i) => acc * (parlay.confidence / 100), 1) * 100)}%
                </span>
                {' '}(based on individual leg confidence)
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}