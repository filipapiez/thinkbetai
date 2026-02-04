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
      { label: 'Win Rate', value: '67%' },
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
  <div className="flex items-center justify-center gap-4 sm:gap-8">
    {[
      { icon: TrendingUp, label: 'Odds', delay: 0 },
      { icon: Shield, label: 'Injuries', delay: 100 },
      { icon: Zap, label: 'Stats', delay: 200 },
    ].map((item) => (
      <div
        key={item.label}
        className="flex flex-col items-center gap-2 animate-fade-in"
        style={{ animationDelay: `${item.delay}ms` }}
      >
        <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 flex items-center justify-center animate-pulse">
          <item.icon className="h-7 w-7 sm:h-8 sm:w-8 text-blue-400" />
        </div>
        <span className="text-xs sm:text-sm text-muted-foreground">{item.label}</span>
        <div className="h-8 w-0.5 bg-gradient-to-b from-blue-500/50 to-transparent" />
      </div>
    ))}
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
        <Database className="h-6 w-6 text-white" />
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
  <div className="flex items-center justify-center">
    <div className="w-full max-w-sm p-4 rounded-xl bg-card border border-emerald-500/30 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-mono px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400">
          TOP PICK
        </span>
        <span className="text-xs text-muted-foreground">NBA • Tonight</span>
      </div>
      <div className="flex items-center justify-between mb-4">
        <div className="text-center">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold text-xs mx-auto mb-1">
            LAL
          </div>
          <p className="text-xs">Lakers</p>
        </div>
        <div className="text-lg font-bold text-muted-foreground">vs</div>
        <div className="text-center">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white font-bold text-xs mx-auto mb-1">
            BOS
          </div>
          <p className="text-xs">Celtics</p>
        </div>
      </div>
      <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
        <div>
          <p className="text-sm font-bold text-emerald-400">Celtics -4.5</p>
          <p className="text-xs text-muted-foreground">AI Pick</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-primary">78%</p>
          <p className="text-xs text-muted-foreground">Confidence</p>
        </div>
      </div>
    </div>
  </div>
);

export default WorkflowDemo;
