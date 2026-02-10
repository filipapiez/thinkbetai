import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Zap, CheckCircle2, Cpu, Activity } from 'lucide-react';
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
      {/* Neural network hero visualization */}
      <div className="relative h-52 sm:h-60 overflow-hidden rounded-2xl bg-gradient-to-br from-background/80 to-purple-500/5 border border-border/30">
        {/* Matrix-style data rain */}
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={`rain-${i}`}
            className="absolute text-[10px] font-mono text-primary/30 select-none"
            style={{ left: `${5 + (i / 15) * 90}%` }}
            animate={{
              y: ['-20%', '120%'],
              opacity: [0, 0.6, 0],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 3,
              ease: 'linear',
            }}
          >
            {['0.87', '1.05', '-4.5', '223', '0.91', '+3.2', '81%', '-110', '2.3u', 'A+', '0.72', '88%', '-185', '0.65', '+5.2'][i]}
          </motion.div>
        ))}

        {/* Neural network — 3 layers with animated connections */}
        <svg className="absolute inset-0 w-full h-full z-0" style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id="nn-grad1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(210, 100%, 60%)" stopOpacity="0.6" />
              <stop offset="100%" stopColor="hsl(270, 60%, 60%)" stopOpacity="0.6" />
            </linearGradient>
            <linearGradient id="nn-grad2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(270, 60%, 60%)" stopOpacity="0.6" />
              <stop offset="100%" stopColor="hsl(142, 76%, 50%)" stopOpacity="0.6" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          {/* Input → Hidden connections */}
          {[0, 1, 2, 3, 4].map(li =>
            [0, 1, 2, 3].map(mi => (
              <motion.line
                key={`l${li}-m${mi}`}
                x1="12%" y1={`${12 + li * 19}%`}
                x2="50%" y2={`${18 + mi * 20}%`}
                stroke="url(#nn-grad1)"
                strokeWidth="1"
                animate={{
                  opacity: [0, 0.5, 0],
                  strokeWidth: [0.5, 2, 0.5],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: (li * 0.15) + (mi * 0.1),
                  ease: 'easeInOut',
                }}
              />
            ))
          )}

          {/* Hidden → Output connections */}
          {[0, 1, 2, 3].map(mi =>
            [0, 1, 2].map(ri => (
              <motion.line
                key={`m${mi}-r${ri}`}
                x1="50%" y1={`${18 + mi * 20}%`}
                x2="88%" y2={`${25 + ri * 25}%`}
                stroke="url(#nn-grad2)"
                strokeWidth="1.5"
                animate={{
                  opacity: [0, 0.6, 0],
                  strokeWidth: [0.5, 2.5, 0.5],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: mi * 0.2 + 0.6,
                  ease: 'easeInOut',
                }}
              />
            ))
          )}
        </svg>

        {/* Input layer nodes */}
        {[0, 1, 2, 3, 4].map(i => (
          <motion.div
            key={`in-${i}`}
            className="absolute left-[10%] w-4 h-4 rounded-full bg-blue-500/80 z-10"
            style={{ top: `${10 + i * 19}%` }}
            animate={{
              boxShadow: ['0 0 8px hsl(210 100% 50% / 0.3)', '0 0 24px hsl(210 100% 50% / 0.8)', '0 0 8px hsl(210 100% 50% / 0.3)'],
              scale: [1, 1.3, 1],
            }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}

        {/* Hidden layer nodes */}
        {[0, 1, 2, 3].map(i => (
          <motion.div
            key={`hid-${i}`}
            className="absolute left-[48%] w-5 h-5 rounded-full bg-purple-500/80 z-10"
            style={{ top: `${16 + i * 20}%` }}
            animate={{
              boxShadow: ['0 0 10px hsl(270 60% 50% / 0.3)', '0 0 30px hsl(270 60% 50% / 0.9)', '0 0 10px hsl(270 60% 50% / 0.3)'],
              scale: [1, 1.4, 1],
            }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 + 0.3 }}
          />
        ))}

        {/* Output layer nodes */}
        {[0, 1, 2].map(i => (
          <motion.div
            key={`out-${i}`}
            className="absolute left-[86%] w-6 h-6 rounded-full bg-emerald-500/80 z-10"
            style={{ top: `${23 + i * 25}%` }}
            animate={{
              boxShadow: ['0 0 12px hsl(142 76% 36% / 0.3)', '0 0 36px hsl(142 76% 36% / 0.9)', '0 0 12px hsl(142 76% 36% / 0.3)'],
              scale: [1, 1.3, 1],
            }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.25 + 0.8 }}
          />
        ))}

        {/* Central brain with energy ring */}
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20"
        >
          <motion.div
            className="h-20 w-20 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-2xl"
            animate={{
              boxShadow: [
                '0 0 30px hsl(270 60% 50% / 0.3), 0 0 60px hsl(270 60% 50% / 0.1)',
                '0 0 50px hsl(270 60% 50% / 0.7), 0 0 100px hsl(270 60% 50% / 0.2)',
                '0 0 30px hsl(270 60% 50% / 0.3), 0 0 60px hsl(270 60% 50% / 0.1)',
              ],
              rotate: [0, 3, -3, 0],
            }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            <Brain className="h-10 w-10 text-white" />
          </motion.div>
          {/* Energy rings */}
          <motion.div
            className="absolute inset-0 rounded-2xl border-2 border-purple-400/50"
            animate={{ scale: [1, 1.8], opacity: [0.5, 0], rotate: [0, 90] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          />
          <motion.div
            className="absolute inset-0 rounded-2xl border border-pink-400/30"
            animate={{ scale: [1, 2.2], opacity: [0.3, 0], rotate: [0, -45] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: 0.8 }}
          />
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
            {/* Progress fill */}
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
