import { useState, useEffect } from 'react';
import { Database, Brain, Target, Zap, TrendingUp, Shield, ArrowRight, Play, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { id: 'collect', label: 'Live Data', icon: Database },
  { id: 'analyze', label: 'AI Analysis', icon: Brain },
  { id: 'predict', label: 'Smart Picks', icon: Target },
];

const WorkflowDemo = () => {
  const [activeTab, setActiveTab] = useState('collect');
  const [isAnimating, setIsAnimating] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setIsAnimating(true);
    setProgress(0);
    const timer = setTimeout(() => setIsAnimating(false), 1500);
    
    // Animate progress bar
    const progressTimer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressTimer);
          return 100;
        }
        return prev + 2;
      });
    }, 30);

    return () => {
      clearTimeout(timer);
      clearInterval(progressTimer);
    };
  }, [activeTab]);

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Tab Navigation */}
      <div className="flex justify-center mb-8">
        <div className="flex items-center gap-0">
          {tabs.map((tab, index) => (
            <div key={tab.id} className="flex items-center">
              <button
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 rounded-full transition-all duration-300 font-medium",
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <tab.icon className="h-5 w-5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
              {index < tabs.length - 1 && (
                <div className={cn(
                  "w-8 sm:w-16 h-0.5 mx-1 transition-colors duration-300",
                  tabs.findIndex(t => t.id === activeTab) > index
                    ? "bg-primary"
                    : "bg-border"
                )} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Demo Container */}
      <div className="relative rounded-2xl border border-border/50 bg-gradient-to-br from-card via-card to-muted/20 shadow-2xl overflow-hidden">
        {/* Decorative grid background */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />

        <div className="relative p-6 sm:p-8 lg:p-12">
          {/* Live Data Tab */}
          {activeTab === 'collect' && (
            <div className="grid lg:grid-cols-2 gap-8 items-center animate-fade-in">
              {/* Left Panel - Data Sources */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Live data streaming</span>
                </div>

                {[
                  { label: 'Odds Movement', value: '+2.5%', icon: TrendingUp, delay: 0 },
                  { label: 'Injury Reports', value: '3 new', icon: Shield, delay: 100 },
                  { label: 'Team Stats', value: '847 pts', icon: Zap, delay: 200 },
                ].map((item, i) => (
                  <div
                    key={item.label}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-xl bg-background/80 border border-border/50 backdrop-blur-sm",
                      isAnimating && "animate-fade-in"
                    )}
                    style={{ animationDelay: `${item.delay}ms` }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <item.icon className="h-5 w-5 text-primary" />
                      </div>
                      <span className="font-medium">{item.label}</span>
                    </div>
                    <span className="text-sm font-mono text-primary">{item.value}</span>
                  </div>
                ))}

                <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Data sync progress</span>
                    <span className="text-sm font-mono text-primary">{progress}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-100"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Right Panel - Visual */}
              <div className="relative h-64 lg:h-80 rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 border border-border/30 overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  {/* Animated data nodes */}
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute h-3 w-3 rounded-full bg-primary/60 animate-pulse"
                      style={{
                        top: `${20 + Math.random() * 60}%`,
                        left: `${10 + Math.random() * 80}%`,
                        animationDelay: `${i * 200}ms`,
                      }}
                    />
                  ))}
                  <div className="p-6 rounded-2xl bg-background/90 backdrop-blur-sm border border-border shadow-xl">
                    <Database className="h-12 w-12 text-primary mx-auto mb-3" />
                    <p className="text-sm font-medium text-center">50+ Data Sources</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AI Analysis Tab */}
          {activeTab === 'analyze' && (
            <div className="grid lg:grid-cols-2 gap-8 items-center animate-fade-in">
              {/* Left Panel - Analysis Process */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-primary mb-6">
                  <Play className="h-4 w-4" />
                  <span>AI processing in real-time</span>
                </div>

                {[
                  { label: 'Pattern Recognition', status: 'complete' },
                  { label: 'Historical Comparison', status: 'complete' },
                  { label: 'Edge Calculation', status: 'running' },
                  { label: 'Confidence Scoring', status: 'pending' },
                ].map((step, i) => (
                  <div
                    key={step.label}
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-xl border transition-all",
                      step.status === 'complete' && "bg-emerald-500/10 border-emerald-500/30",
                      step.status === 'running' && "bg-primary/10 border-primary/30",
                      step.status === 'pending' && "bg-background/80 border-border/50"
                    )}
                    style={{ animationDelay: `${i * 150}ms` }}
                  >
                    {step.status === 'complete' && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                    {step.status === 'running' && <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />}
                    {step.status === 'pending' && <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />}
                    <span className={cn(
                      "font-medium",
                      step.status === 'pending' && "text-muted-foreground"
                    )}>{step.label}</span>
                  </div>
                ))}
              </div>

              {/* Right Panel - Neural Network Visual */}
              <div className="relative h-64 lg:h-80 rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 border border-border/30 overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  {/* Connecting lines */}
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 300">
                    <defs>
                      <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
                        <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
                      </linearGradient>
                    </defs>
                    {[
                      { x1: 60, y1: 80, x2: 200, y2: 120 },
                      { x1: 60, y1: 150, x2: 200, y2: 150 },
                      { x1: 60, y1: 220, x2: 200, y2: 180 },
                      { x1: 200, y1: 120, x2: 340, y2: 150 },
                      { x1: 200, y1: 180, x2: 340, y2: 150 },
                    ].map((line, i) => (
                      <line
                        key={i}
                        x1={line.x1} y1={line.y1}
                        x2={line.x2} y2={line.y2}
                        stroke="url(#lineGradient)"
                        strokeWidth="2"
                        className="animate-pulse"
                        style={{ animationDelay: `${i * 100}ms` }}
                      />
                    ))}
                  </svg>
                  {/* Input nodes */}
                  {[80, 150, 220].map((y, i) => (
                    <div
                      key={`input-${i}`}
                      className="absolute h-8 w-8 rounded-full bg-muted border-2 border-primary/50 animate-pulse"
                      style={{ left: '10%', top: `${(y/300)*100}%`, transform: 'translate(-50%, -50%)', animationDelay: `${i * 100}ms` }}
                    />
                  ))}
                  {/* Hidden layer */}
                  {[120, 180].map((y, i) => (
                    <div
                      key={`hidden-${i}`}
                      className="absolute h-10 w-10 rounded-full bg-primary/20 border-2 border-primary animate-pulse"
                      style={{ left: '50%', top: `${(y/300)*100}%`, transform: 'translate(-50%, -50%)', animationDelay: `${(i + 3) * 100}ms` }}
                    />
                  ))}
                  {/* Output node */}
                  <div
                    className="absolute h-14 w-14 rounded-full bg-primary/30 border-2 border-primary flex items-center justify-center animate-pulse"
                    style={{ left: '85%', top: '50%', transform: 'translate(-50%, -50%)' }}
                  >
                    <Brain className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Smart Picks Tab */}
          {activeTab === 'predict' && (
            <div className="grid lg:grid-cols-2 gap-8 items-center animate-fade-in">
              {/* Left Panel - Sample Pick */}
              <div className="p-6 rounded-2xl bg-background/90 border border-border shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-sm text-muted-foreground">Today's Top Pick</span>
                  </div>
                  <span className="text-xs font-mono px-2 py-1 rounded-full bg-primary/10 text-primary">NBA</span>
                </div>

                <div className="flex items-center justify-between mb-6">
                  <div className="text-center">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold mx-auto mb-2">
                      LAL
                    </div>
                    <p className="text-sm font-medium">Lakers</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-muted-foreground">vs</p>
                    <p className="text-xs text-muted-foreground mt-1">7:30 PM ET</p>
                  </div>
                  <div className="text-center">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white font-bold mx-auto mb-2">
                      BOS
                    </div>
                    <p className="text-sm font-medium">Celtics</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">AI Recommendation</p>
                      <p className="text-lg font-bold text-emerald-600">Celtics -4.5</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Confidence</p>
                      <p className="text-lg font-bold text-primary">78%</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Edge detected:</span>
                  <span className="font-mono text-emerald-600">+4.2%</span>
                </div>
              </div>

              {/* Right Panel - Stats */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold mb-4">AI Performance</h3>
                {[
                  { label: 'Win Rate', value: '67%', bar: 67 },
                  { label: 'ROI', value: '+18.4%', bar: 84 },
                  { label: 'Avg Confidence', value: '72%', bar: 72 },
                ].map((stat, i) => (
                  <div
                    key={stat.label}
                    className={cn(
                      "p-4 rounded-xl bg-background/80 border border-border/50",
                      isAnimating && "animate-fade-in"
                    )}
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">{stat.label}</span>
                      <span className="font-bold text-primary">{stat.value}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-1000"
                        style={{ width: isAnimating ? '0%' : `${stat.bar}%` }}
                      />
                    </div>
                  </div>
                ))}

                <div className="flex items-center gap-2 p-4 rounded-xl bg-primary/5 border border-primary/20 mt-6">
                  <Target className="h-5 w-5 text-primary" />
                  <span className="text-sm">
                    <span className="font-semibold text-primary">2,847</span> winning picks this month
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkflowDemo;
