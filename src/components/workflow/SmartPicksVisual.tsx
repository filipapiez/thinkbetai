import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, ShieldCheck, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

const SmartPicksVisual = () => {
  const [confidence, setConfidence] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setConfidence(81), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <motion.div
        className="relative rounded-2xl bg-card border border-border/50 overflow-hidden shadow-2xl"
        initial={{ opacity: 0, y: 30, rotateX: 10 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ type: 'spring', stiffness: 80, damping: 20 }}
      >
        {/* Holographic shine effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent z-30 pointer-events-none"
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear', repeatDelay: 2 }}
        />

        {/* Header with animated gradient border */}
        <motion.div
          className="relative flex items-center justify-between px-5 py-4 border-b border-border/50 overflow-hidden"
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-primary/5 to-emerald-500/10"
            animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
            style={{ backgroundSize: '200% 100%' }}
            transition={{ duration: 5, repeat: Infinity }}
          />
          <div className="relative flex items-center gap-3">
            <motion.span
              className="text-sm font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5"
              animate={{
                boxShadow: [
                  '0 0 0px hsl(142 76% 36% / 0), inset 0 0 0px hsl(142 76% 36% / 0)',
                  '0 0 20px hsl(142 76% 36% / 0.4), inset 0 0 10px hsl(142 76% 36% / 0.1)',
                  '0 0 0px hsl(142 76% 36% / 0), inset 0 0 0px hsl(142 76% 36% / 0)',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Flame className="h-3.5 w-3.5" />
              TOP PICK
            </motion.span>
            <span className="text-sm text-muted-foreground">NBA • Today • 7:30 PM</span>
          </div>
          <motion.span
            className="relative text-xs px-2.5 py-1 rounded-full bg-primary/15 text-primary font-semibold border border-primary/20"
            whileHover={{ scale: 1.1 }}
          >
            Spread
          </motion.span>
        </motion.div>

        {/* Teams matchup */}
        <div className="p-6">
          <motion.div
            className="flex items-center justify-between mb-5"
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, type: 'spring' }}
          >
            <div className="flex items-center gap-4">
              <motion.div
                className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-lg shadow-xl shadow-amber-500/25"
                whileHover={{ rotate: [0, -10, 10, 0], scale: 1.15 }}
                animate={{
                  boxShadow: ['0 8px 20px hsl(38 92% 50% / 0.2)', '0 8px 30px hsl(38 92% 50% / 0.4)', '0 8px 20px hsl(38 92% 50% / 0.2)'],
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                LAL
              </motion.div>
              <div>
                <p className="text-lg font-bold">Los Angeles Lakers</p>
                <p className="text-sm text-muted-foreground">32-18 • Home • 5-2 L7</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Spread</p>
              <p className="text-xl font-bold text-muted-foreground">+4.5</p>
            </div>
          </motion.div>

          {/* VS divider with energy effect */}
          <div className="flex items-center justify-center my-3">
            <motion.div
              className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent"
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.span
              className="px-4 text-sm font-bold text-primary"
              animate={{ scale: [1, 1.15, 1], textShadow: ['0 0 0px transparent', '0 0 10px hsl(174 72% 50% / 0.5)', '0 0 0px transparent'] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              VS
            </motion.span>
            <motion.div
              className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent"
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>

          <motion.div
            className="flex items-center justify-between mt-5"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, type: 'spring' }}
          >
            <div className="flex items-center gap-4">
              <motion.div
                className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white font-bold text-lg shadow-xl shadow-emerald-500/25"
                whileHover={{ rotate: [0, -10, 10, 0], scale: 1.15 }}
                animate={{
                  boxShadow: ['0 8px 20px hsl(142 76% 36% / 0.2)', '0 8px 30px hsl(142 76% 36% / 0.5)', '0 8px 20px hsl(142 76% 36% / 0.2)'],
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                BOS
              </motion.div>
              <div>
                <p className="text-lg font-bold">Boston Celtics</p>
                <p className="text-sm text-muted-foreground">38-12 • Away • 6-1 L7</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">AI Pick</p>
              <motion.p
                className="text-xl font-bold text-emerald-400"
                animate={{ textShadow: ['0 0 0px transparent', '0 0 15px hsl(142 76% 50% / 0.6)', '0 0 0px transparent'] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                -4.5 ✓
              </motion.p>
            </div>
          </motion.div>
        </div>

        {/* AI Recommendation with animated confidence ring */}
        <motion.div
          className="px-6 pb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="relative p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-primary/5 border border-emerald-500/30 overflow-hidden">
            {/* Multiple shimmer effects */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-400/5 to-transparent"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent"
              animate={{ x: ['200%', '-100%'] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear', delay: 1.5 }}
            />

            <div className="relative flex items-start justify-between mb-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1 uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-primary" /> AI Recommendation
                </p>
                <motion.p
                  className="text-2xl font-bold text-emerald-400"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  Boston Celtics -4.5
                </motion.p>
                <p className="text-sm text-muted-foreground mt-1">Best odds at DraftKings: -110</p>
              </div>

              {/* Animated circular confidence gauge */}
              <motion.div
                className="relative h-24 w-24 flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.6, type: 'spring', stiffness: 100 }}
              >
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(142 76% 36% / 0.15)" strokeWidth="6" />
                  <motion.circle
                    cx="50" cy="50" r="42"
                    fill="none"
                    stroke="hsl(142, 76%, 50%)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={`${Math.PI * 84}`}
                    initial={{ strokeDashoffset: Math.PI * 84 }}
                    animate={{ strokeDashoffset: Math.PI * 84 * (1 - confidence / 100) }}
                    transition={{ duration: 1.5, delay: 0.8, ease: 'easeOut' }}
                    filter="url(#glow-green)"
                  />
                  <defs>
                    <filter id="glow-green">
                      <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                      <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
                    </filter>
                  </defs>
                </svg>
                <div className="text-center">
                  <motion.p
                    className="text-2xl font-bold text-primary"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                  >
                    {confidence}%
                  </motion.p>
                  <p className="text-[9px] text-muted-foreground">WIN PROB</p>
                </div>
              </motion.div>
            </div>

            {/* Key Factors with staggered reveal */}
            <div className="relative mb-4 p-3 rounded-xl bg-background/40 border border-border/50">
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-widest flex items-center gap-1.5">
                <ShieldCheck className="h-3 w-3" /> Key Factors
              </p>
              <ul className="space-y-1.5 text-sm text-foreground/80">
                {[
                  'Celtics 8-2 ATS in last 10 road games',
                  'Lakers missing AD (ankle) - confirmed out',
                  'Boston averages +6.2 margin vs West teams',
                ].map((text, i) => (
                  <motion.li
                    key={i}
                    className="flex items-center gap-2"
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1 + i * 0.2, type: 'spring' }}
                  >
                    <motion.span
                      className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0"
                      animate={{ scale: [1, 1.8, 1], opacity: [1, 0.5, 1] }}
                      transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
                    />
                    {text}
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* Metrics grid with entrance animations */}
            <div className="relative grid grid-cols-4 gap-2 pt-4 border-t border-emerald-500/20">
              {[
                { value: '+5.2%', label: 'Edge', color: 'text-emerald-400', icon: TrendingUp },
                { value: '-110', label: 'Odds', color: 'text-primary', icon: null },
                { value: '2.3u', label: 'Rec Bet', color: 'text-primary', icon: null },
                { value: 'A+', label: 'Grade', color: 'text-emerald-400', icon: Sparkles },
              ].map((metric, i) => (
                <motion.div
                  key={metric.label}
                  className="text-center p-2.5 rounded-xl bg-background/50 border border-border/30 hover:border-primary/30 transition-colors"
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 1.2 + i * 0.12, type: 'spring', stiffness: 150 }}
                  whileHover={{ scale: 1.1, y: -3 }}
                >
                  <motion.p
                    className={cn("text-lg font-bold", metric.color)}
                    animate={metric.label === 'Grade' ? {
                      textShadow: ['0 0 0px transparent', '0 0 10px hsl(142 76% 50% / 0.5)', '0 0 0px transparent'],
                    } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {metric.value}
                  </motion.p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{metric.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default SmartPicksVisual;
