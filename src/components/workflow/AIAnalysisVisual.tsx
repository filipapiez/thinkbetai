import { motion } from 'framer-motion';
import { Brain, Zap, CheckCircle2, Cpu } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

const analysisSteps = [
  { text: 'Pattern recognition', time: '0.3s', detail: 'Scanning 847 patterns' },
  { text: 'Edge calculation', time: '0.6s', detail: 'Computing value lines' },
  { text: 'Confidence scoring', time: '0.9s', detail: 'Running 7 models' },
  { text: 'Risk assessment', time: '1.1s', detail: 'Evaluating variance' },
];

const modelOutputs = [
  { name: 'Spread Model', confidence: 87, result: 'BOS -4.5', status: 'strong' },
  { name: 'Totals Model', confidence: 72, result: 'Under 223', status: 'moderate' },
  { name: 'Props Model', confidence: 91, result: 'Tatum O28.5', status: 'strong' },
  { name: 'ML Model', confidence: 65, result: 'BOS -185', status: 'moderate' },
];

const AIAnalysisVisual = () => {
  const [completedSteps, setCompletedSteps] = useState(0);
  const [activeModel, setActiveModel] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCompletedSteps(prev => {
        if (prev >= 4) {
          setTimeout(() => setCompletedSteps(0), 1000);
          return prev;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveModel(prev => (prev + 1) % modelOutputs.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Main visualization — AI decision matrix */}
      <div className="relative h-56 sm:h-64 overflow-hidden rounded-2xl bg-gradient-to-br from-background/80 to-purple-500/5 border border-border/30">
        
        {/* Animated grid background */}
        <div className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: 'linear-gradient(hsl(270 60% 60%) 1px, transparent 1px), linear-gradient(90deg, hsl(270 60% 60%) 1px, transparent 1px)',
            backgroundSize: '30px 30px',
          }}
        />

        {/* Scanning horizontal line */}
        <motion.div
          className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-400/60 to-transparent z-10"
          animate={{ y: ['0%', '100%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          style={{ boxShadow: '0 0 20px 4px hsl(270 60% 60% / 0.3)' }}
        />

        {/* Floating data points being analyzed */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={`dot-${i}`}
            className="absolute rounded-full"
            style={{
              width: 4 + Math.random() * 6,
              height: 4 + Math.random() * 6,
              left: `${10 + Math.random() * 80}%`,
              top: `${10 + Math.random() * 80}%`,
              background: i % 3 === 0 ? 'hsl(270, 60%, 60%)' : i % 3 === 1 ? 'hsl(330, 80%, 60%)' : 'hsl(210, 100%, 60%)',
            }}
            animate={{
              opacity: [0.2, 0.8, 0.2],
              scale: [0.8, 1.4, 0.8],
              y: [0, -8, 0],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 3,
            }}
          />
        ))}

        {/* Central AI brain with rotating analysis ring */}
        <motion.div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
          {/* Rotating outer ring with dashes */}
          <motion.div
            className="absolute -inset-6 rounded-full border-2 border-dashed border-purple-400/40"
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            className="absolute -inset-12 rounded-full border border-dashed border-pink-400/20"
            animate={{ rotate: -360 }}
            transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
          />
          
          {/* Orbiting analysis indicators */}
          {[0, 1, 2, 3].map(i => {
            const angle = (i / 4) * Math.PI * 2;
            return (
              <motion.div
                key={`orbit-${i}`}
                className="absolute left-1/2 top-1/2 h-3 w-3 rounded-full bg-purple-400 z-30"
                animate={{
                  x: [Math.cos(angle) * 48 - 6, Math.cos(angle + Math.PI * 2) * 48 - 6],
                  y: [Math.sin(angle) * 48 - 6, Math.sin(angle + Math.PI * 2) * 48 - 6],
                }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                style={{
                  boxShadow: '0 0 10px hsl(270 60% 60% / 0.6)',
                }}
              />
            );
          })}

          {/* Core brain */}
          <motion.div
            className="h-20 w-20 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-2xl"
            animate={{
              boxShadow: [
                '0 0 30px hsl(270 60% 50% / 0.3)',
                '0 0 60px hsl(270 60% 50% / 0.6)',
                '0 0 30px hsl(270 60% 50% / 0.3)',
              ],
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Brain className="h-10 w-10 text-white" />
          </motion.div>
          
          {/* Status badge */}
          <motion.div
            className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-emerald-500 border-2 border-background flex items-center justify-center"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <Zap className="h-3.5 w-3.5 text-white" />
          </motion.div>
        </motion.div>

        {/* Processing speed indicator */}
        <motion.div
          className="absolute top-3 right-3 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card/80 border border-border/50 backdrop-blur-sm z-20"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <Cpu className="h-3.5 w-3.5 text-purple-400" />
          <span className="text-xs font-mono text-purple-400">7 models active</span>
        </motion.div>
      </div>

      {/* Model outputs — live results */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {modelOutputs.map((model, i) => (
          <motion.div
            key={model.name}
            className={cn(
              "relative p-3 rounded-xl border transition-all duration-300",
              i === activeModel
                ? "bg-primary/10 border-primary/40 shadow-lg shadow-primary/10"
                : "bg-card/60 border-border/50"
            )}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
          >
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{model.name}</p>
            <p className="text-lg font-bold text-foreground mb-1">{model.result}</p>
            <div className="flex items-center gap-1.5">
              <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className={cn(
                    "h-full rounded-full",
                    model.confidence > 80 ? "bg-emerald-500" : "bg-amber-500"
                  )}
                  initial={{ width: 0 }}
                  animate={{ width: `${model.confidence}%` }}
                  transition={{ duration: 1, delay: i * 0.2 }}
                />
              </div>
              <span className={cn(
                "text-xs font-bold",
                model.confidence > 80 ? "text-emerald-400" : "text-amber-400"
              )}>{model.confidence}%</span>
            </div>
            {i === activeModel && (
              <motion.div
                className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary"
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              />
            )}
          </motion.div>
        ))}
      </div>

      {/* Processing pipeline */}
      <div className="space-y-2">
        {analysisSteps.map((item, i) => (
          <motion.div
            key={item.text}
            className={cn(
              "relative flex items-center gap-3 text-sm p-3 rounded-xl border overflow-hidden transition-all duration-300",
              completedSteps > i
                ? "bg-emerald-500/5 border-emerald-500/30"
                : "bg-card/60 border-border/50"
            )}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-primary/5 to-emerald-500/5"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: completedSteps > i ? 1 : 0 }}
              style={{ transformOrigin: 'left' }}
              transition={{ duration: 0.6, delay: i * 0.2 }}
            />
            <motion.div
              className="relative z-10"
              animate={completedSteps > i ? { scale: [1, 1.3, 1], rotate: [0, 10, 0] } : {}}
              transition={{ duration: 0.5 }}
            >
              <CheckCircle2
                className={cn(
                  "h-5 w-5 shrink-0 transition-colors duration-500",
                  completedSteps > i ? 'text-emerald-500' : 'text-muted-foreground/30'
                )}
              />
            </motion.div>
            <div className="relative z-10 flex-1 min-w-0">
              <span className={cn("transition-colors duration-500 font-medium", completedSteps > i ? 'text-foreground' : 'text-muted-foreground')}>
                {item.text}
              </span>
              <span className={cn("block text-[10px] transition-colors duration-500", completedSteps > i ? 'text-emerald-400/70' : 'text-muted-foreground/40')}>
                {item.detail}
              </span>
            </div>
            <span className={cn("relative z-10 text-xs font-mono transition-colors duration-500", completedSteps > i ? 'text-emerald-400' : 'text-muted-foreground/40')}>
              {item.time}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default AIAnalysisVisual;
