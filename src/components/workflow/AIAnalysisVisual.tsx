import { motion } from 'framer-motion';
import { Brain, Zap, CheckCircle2 } from 'lucide-react';
import { useState, useEffect } from 'react';

const analysisSteps = [
  { text: 'Pattern matching', time: '0.4s' },
  { text: 'Edge calculation', time: '0.7s' },
  { text: 'Confidence scoring', time: '1.2s' },
];

const AIAnalysisVisual = () => {
  const [completedSteps, setCompletedSteps] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCompletedSteps(prev => {
        if (prev >= 3) {
          setTimeout(() => setCompletedSteps(0), 800);
          return prev;
        }
        return prev + 1;
      });
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Neural network visualization */}
      <div className="relative w-full max-w-lg h-48">
        {/* Neural nodes - left column */}
        {[0, 1, 2, 3].map(i => (
          <motion.div
            key={`left-${i}`}
            className="absolute left-4 sm:left-8 w-4 h-4 rounded-full bg-blue-500/80"
            style={{ top: `${15 + i * 22}%` }}
            animate={{
              boxShadow: [
                '0 0 8px hsl(210 100% 50% / 0.3)',
                '0 0 20px hsl(210 100% 50% / 0.7)',
                '0 0 8px hsl(210 100% 50% / 0.3)',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}

        {/* Neural nodes - middle column */}
        {[0, 1, 2].map(i => (
          <motion.div
            key={`mid-${i}`}
            className="absolute left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-purple-500/80"
            style={{ top: `${20 + i * 28}%` }}
            animate={{
              boxShadow: [
                '0 0 8px hsl(270 60% 50% / 0.3)',
                '0 0 24px hsl(270 60% 50% / 0.8)',
                '0 0 8px hsl(270 60% 50% / 0.3)',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 + 0.5 }}
          />
        ))}

        {/* Neural nodes - right column */}
        {[0, 1].map(i => (
          <motion.div
            key={`right-${i}`}
            className="absolute right-4 sm:right-8 w-6 h-6 rounded-full bg-emerald-500/80"
            style={{ top: `${30 + i * 35}%` }}
            animate={{
              boxShadow: [
                '0 0 10px hsl(142 76% 36% / 0.3)',
                '0 0 30px hsl(142 76% 36% / 0.8)',
                '0 0 10px hsl(142 76% 36% / 0.3)',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 + 1 }}
          />
        ))}

        {/* Animated connections - SVG lines */}
        <svg className="absolute inset-0 w-full h-full" style={{ overflow: 'visible' }}>
          {/* Left to middle connections */}
          {[0, 1, 2, 3].map(li =>
            [0, 1, 2].map(mi => (
              <motion.line
                key={`l${li}-m${mi}`}
                x1="10%" y1={`${19 + li * 22}%`}
                x2="50%" y2={`${24 + mi * 28}%`}
                stroke="url(#grad1)"
                strokeWidth="1"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: [0, 1], opacity: [0, 0.4, 0] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: (li + mi) * 0.2,
                  ease: 'easeInOut',
                }}
              />
            ))
          )}
          {/* Middle to right connections */}
          {[0, 1, 2].map(mi =>
            [0, 1].map(ri => (
              <motion.line
                key={`m${mi}-r${ri}`}
                x1="50%" y1={`${24 + mi * 28}%`}
                x2="90%" y2={`${34 + ri * 35}%`}
                stroke="url(#grad2)"
                strokeWidth="1.5"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: [0, 1], opacity: [0, 0.5, 0] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: mi * 0.3 + 0.8,
                  ease: 'easeInOut',
                }}
              />
            ))
          )}
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(210, 100%, 60%)" />
              <stop offset="100%" stopColor="hsl(270, 60%, 60%)" />
            </linearGradient>
            <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(270, 60%, 60%)" />
              <stop offset="100%" stopColor="hsl(142, 76%, 50%)" />
            </linearGradient>
          </defs>
        </svg>

        {/* Central brain icon */}
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-20 w-20 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center z-10"
          animate={{
            boxShadow: [
              '0 0 30px hsl(270 60% 50% / 0.3)',
              '0 0 80px hsl(270 60% 50% / 0.6)',
              '0 0 30px hsl(270 60% 50% / 0.3)',
            ],
            rotate: [0, 5, -5, 0],
          }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          <Brain className="h-10 w-10 text-white" />
          <motion.div
            className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-emerald-500 border-2 border-background flex items-center justify-center"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <Zap className="h-3 w-3 text-white" />
          </motion.div>
        </motion.div>
      </div>

      {/* Processing steps with live animation */}
      <div className="w-full max-w-sm space-y-3">
        {analysisSteps.map((item, i) => (
          <motion.div
            key={item.text}
            className="flex items-center gap-3 text-sm p-3 rounded-xl bg-card/60 border border-border/50"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.15 }}
          >
            <motion.div
              animate={
                completedSteps > i
                  ? { scale: [1, 1.3, 1], rotate: [0, 10, 0] }
                  : {}
              }
              transition={{ duration: 0.5 }}
            >
              <CheckCircle2
                className={`h-5 w-5 shrink-0 transition-colors duration-500 ${
                  completedSteps > i ? 'text-emerald-500' : 'text-muted-foreground/30'
                }`}
              />
            </motion.div>
            <span className={`transition-colors duration-500 ${completedSteps > i ? 'text-foreground' : 'text-muted-foreground'}`}>
              {item.text}
            </span>
            <span className={`text-xs font-mono ml-auto transition-colors duration-500 ${completedSteps > i ? 'text-emerald-400' : 'text-muted-foreground/40'}`}>
              {item.time}
            </span>
            {/* Progress bar */}
            <motion.div
              className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-primary to-emerald-500 rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: completedSteps > i ? '100%' : '0%' }}
              transition={{ duration: 0.8, delay: i * 0.3 }}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default AIAnalysisVisual;
