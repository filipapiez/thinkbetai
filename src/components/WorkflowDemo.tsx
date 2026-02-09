import { useState } from 'react';
import { Database, Brain, Target, ArrowRight, CheckCircle2, TrendingUp, Zap, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

const steps = [
  {
    id: 1,
    title: 'Collect Data',
    description: 'We pull real-time odds, injuries, stats & trends from 50+ sources',
    icon: Database,
    color: 'from-blue-500 to-cyan-500',
    details: [
      { label: 'Live Odds', value: '12 books' },
      { label: 'Player Stats', value: '10K+ players' },
      { label: 'Injury Reports', value: 'Real-time' },
    ]
  },
  {
    id: 2,
    title: 'AI Analysis',
    description: 'Our models analyze patterns, edges & value across every game',
    icon: Brain,
    color: 'from-purple-500 to-pink-500',
    details: [
      { label: 'Models Running', value: '7 active' },
      { label: 'Patterns Found', value: '847 today' },
      { label: 'Processing', value: '< 2 sec' },
    ]
  },
  {
    id: 3,
    title: 'Smart Picks',
    description: 'Get high-confidence picks with clear reasoning & edge metrics',
    icon: Target,
    color: 'from-emerald-500 to-teal-500',
    details: [
      { label: 'Win Rate', value: '81%' },
      { label: 'Avg Edge', value: '+4.2%' },
      { label: "Today's Picks", value: '23 live' },
    ]
  },
];

const WorkflowDemo = () => {
  const [activeStep, setActiveStep] = useState(1);
  const currentStep = steps.find(s => s.id === activeStep) || steps[0];

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Step Indicators - Horizontal Flow */}
      <div className="flex items-center justify-center mb-10">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <button
              onClick={() => setActiveStep(step.id)}
              className={cn(
                "relative flex flex-col items-center gap-2 px-4 sm:px-8 py-3 rounded-2xl transition-all duration-300",
                activeStep === step.id
                  ? "bg-card border border-primary/30 shadow-lg shadow-primary/10"
                  : "hover:bg-card/50"
              )}
            >
              {/* Step Number Badge */}
              <div className={cn(
                "absolute -top-2 -left-2 h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                activeStep === step.id
                  ? "bg-primary text-primary-foreground"
                  : activeStep > step.id
                    ? "bg-emerald-500 text-white"
                    : "bg-muted text-muted-foreground"
              )}>
                {activeStep > step.id ? <CheckCircle2 className="h-4 w-4" /> : step.id}
              </div>

              {/* Icon */}
              <div className={cn(
                "h-12 w-12 rounded-xl flex items-center justify-center transition-all",
                activeStep === step.id
                  ? `bg-gradient-to-br ${step.color}`
                  : "bg-muted"
              )}>
                <step.icon className={cn(
                  "h-6 w-6 transition-colors",
                  activeStep === step.id ? "text-white" : "text-muted-foreground"
                )} />
              </div>

              {/* Title */}
              <span className={cn(
                "text-sm font-semibold transition-colors",
                activeStep === step.id ? "text-foreground" : "text-muted-foreground"
              )}>
                {step.title}
              </span>
            </button>

            {/* Arrow Connector */}
            {index < steps.length - 1 && (
              <div className="flex items-center mx-2 sm:mx-4">
                <div className={cn(
                  "w-8 sm:w-12 h-0.5 transition-colors",
                  activeStep > step.id ? "bg-emerald-500" : "bg-border"
                )} />
                <ArrowRight className={cn(
                  "h-4 w-4 -ml-1 transition-colors",
                  activeStep > step.id ? "text-emerald-500" : "text-muted-foreground"
                )} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Content Card */}
      <div className="relative rounded-2xl border border-border/50 bg-gradient-to-br from-card via-card to-muted/20 shadow-2xl overflow-hidden">
        {/* Gradient Accent */}
        <div className={cn(
          "absolute top-0 left-0 right-0 h-1 bg-gradient-to-r transition-all duration-500",
          currentStep.color
        )} />

        <div className="p-6 sm:p-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className={cn(
              "inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br mb-4",
              currentStep.color
            )}>
              <currentStep.icon className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold mb-2">
              Step {currentStep.id}: {currentStep.title}
            </h3>
            <p className="text-muted-foreground max-w-lg mx-auto">
              {currentStep.description}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 sm:gap-6 mb-8">
            {currentStep.details.map((detail, i) => (
              <div
                key={detail.label}
                className="text-center p-4 sm:p-6 rounded-xl bg-background/60 border border-border/50 animate-fade-in"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <p className="text-2xl sm:text-3xl font-bold text-primary mb-1">
                  {detail.value}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {detail.label}
                </p>
              </div>
            ))}
          </div>

          {/* Visual Demo Based on Step */}
          <div className="rounded-xl bg-background/40 border border-border/30 p-6 animate-fade-in">
            {activeStep === 1 && <DataCollectionVisual />}
            {activeStep === 2 && <AIAnalysisVisual />}
            {activeStep === 3 && <SmartPicksVisual />}
          </div>
        </div>
      </div>
    </div>
  );
};

// Visual Components for each step
const DataCollectionVisual = () => (
  <div className="space-y-6">
    {/* Data Sources Grid */}
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
      {[
        { icon: TrendingUp, label: 'Live Odds', sublabel: '12 sportsbooks', color: 'from-blue-500 to-blue-600' },
        { icon: Shield, label: 'Injuries', sublabel: 'Real-time updates', color: 'from-red-500 to-rose-600' },
        { icon: Zap, label: 'Player Stats', sublabel: '10K+ players', color: 'from-amber-500 to-orange-600' },
        { icon: Database, label: 'Historical', sublabel: '5 years data', color: 'from-purple-500 to-violet-600' },
      ].map((item, i) => (
        <div
          key={item.label}
          className="relative p-3 sm:p-4 rounded-xl bg-card border border-border/50 animate-fade-in overflow-hidden group hover:border-blue-500/50 transition-colors"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <div className={cn("absolute inset-0 bg-gradient-to-br opacity-5 group-hover:opacity-10 transition-opacity", item.color)} />
          <div className={cn("h-10 w-10 rounded-lg bg-gradient-to-br flex items-center justify-center mb-2", item.color)}>
            <item.icon className="h-5 w-5 text-white" />
          </div>
          <p className="text-sm font-semibold">{item.label}</p>
          <p className="text-xs text-muted-foreground">{item.sublabel}</p>
          {/* Pulse indicator */}
          <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>
      ))}
    </div>
    
    {/* Live Feed Simulation */}
    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30">
        <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
        <span className="text-blue-400">50+ sources connected</span>
      </div>
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-emerald-400">Updating every 30s</span>
      </div>
    </div>
  </div>
);

const AIAnalysisVisual = () => (
  <div className="flex items-center justify-center">
    <div className="relative">
      {/* Central Brain */}
      <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-xl shadow-purple-500/30 animate-pulse">
        <Brain className="h-10 w-10 text-white" />
      </div>
      {/* Orbiting dots */}
      {[0, 60, 120, 180, 240, 300].map((deg, i) => (
        <div
          key={deg}
          className="absolute h-3 w-3 rounded-full bg-purple-400"
          style={{
            top: '50%',
            left: '50%',
            transform: `rotate(${deg}deg) translateX(50px) translateY(-50%)`,
            animation: `pulse 2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </div>
    <div className="ml-8 sm:ml-12 space-y-2">
      {['Pattern matching...', 'Edge calculation...', 'Confidence scoring...'].map((text, i) => (
        <div
          key={text}
          className="flex items-center gap-2 text-sm animate-fade-in"
          style={{ animationDelay: `${i * 200}ms` }}
        >
          <div className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-muted-foreground">{text}</span>
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        </div>
      ))}
    </div>
  </div>
);

const SmartPicksVisual = () => (
  <div className="w-full max-w-2xl mx-auto">
    {/* Game Card Example - Larger and more detailed */}
    <div className="rounded-2xl bg-card border border-border/50 overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border-b border-border/50">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            ⭐ TOP PICK
          </span>
          <span className="text-sm text-muted-foreground">NBA • Feb 9, 2026 • 7:30 PM EST</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary font-medium">Spread</span>
        </div>
      </div>
      
      {/* Teams - Larger */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold text-lg shadow-xl shadow-amber-500/20">
              LAL
            </div>
            <div>
              <p className="text-lg font-bold">Los Angeles Lakers</p>
              <p className="text-sm text-muted-foreground">32-18 • Home • 5-2 L7</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Spread</p>
            <p className="text-xl font-bold">+4.5</p>
          </div>
        </div>
        
        <div className="flex items-center justify-center my-4">
          <div className="w-full h-px bg-border" />
          <span className="px-4 text-sm font-medium text-muted-foreground">VS</span>
          <div className="w-full h-px bg-border" />
        </div>
        
        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white font-bold text-lg shadow-xl shadow-emerald-500/20">
              BOS
            </div>
            <div>
              <p className="text-lg font-bold">Boston Celtics</p>
              <p className="text-sm text-muted-foreground">38-12 • Away • 6-1 L7</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Spread</p>
            <p className="text-xl font-bold text-emerald-400">-4.5 ✓</p>
          </div>
        </div>
      </div>
      
      {/* AI Pick Section - Expanded */}
      <div className="px-6 pb-6">
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/30">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">AI Recommendation</p>
              <p className="text-2xl font-bold text-emerald-400">Boston Celtics -4.5</p>
              <p className="text-sm text-muted-foreground mt-1">Best odds at DraftKings: -110</p>
            </div>
            <div className="text-right bg-background/50 rounded-xl p-3 border border-emerald-500/20">
              <p className="text-4xl font-bold text-primary">81%</p>
              <p className="text-xs text-muted-foreground">Win Probability</p>
            </div>
          </div>
          
          {/* Key Factors */}
          <div className="mb-4 p-3 rounded-xl bg-background/40 border border-border/50">
            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Key Factors</p>
            <ul className="space-y-1 text-sm text-foreground/80">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Celtics 8-2 ATS in last 10 road games
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Lakers missing AD (ankle) - confirmed out
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Boston averages +6.2 margin vs West teams
              </li>
            </ul>
          </div>
          
          {/* Metrics */}
          <div className="grid grid-cols-4 gap-3 pt-4 border-t border-emerald-500/20">
            <div className="text-center p-2 rounded-lg bg-background/40">
              <p className="text-lg font-bold text-emerald-400">+5.2%</p>
              <p className="text-[10px] text-muted-foreground uppercase">Edge</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-background/40">
              <p className="text-lg font-bold text-primary">-110</p>
              <p className="text-[10px] text-muted-foreground uppercase">Odds</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-background/40">
              <p className="text-lg font-bold text-primary">2.3u</p>
              <p className="text-[10px] text-muted-foreground uppercase">Rec Bet</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-background/40">
              <p className="text-lg font-bold text-emerald-400">A+</p>
              <p className="text-[10px] text-muted-foreground uppercase">Grade</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default WorkflowDemo;
