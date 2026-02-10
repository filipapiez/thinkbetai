import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

const SmartPicksVisual = () => (
  <div className="w-full max-w-2xl mx-auto">
    <motion.div
      className="rounded-2xl bg-card border border-border/50 overflow-hidden shadow-2xl"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 100 }}
    >
      {/* Header */}
      <motion.div
        className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border-b border-border/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center gap-3">
          <motion.span
            className="text-sm font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
            animate={{
              boxShadow: [
                '0 0 0px hsl(142 76% 36% / 0)',
                '0 0 20px hsl(142 76% 36% / 0.4)',
                '0 0 0px hsl(142 76% 36% / 0)',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            ⭐ TOP PICK
          </motion.span>
          <span className="text-sm text-muted-foreground">NBA • Feb 9, 2026 • 7:30 PM EST</span>
        </div>
        <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary font-medium">Spread</span>
      </motion.div>

      {/* Teams */}
      <div className="p-6">
        <motion.div
          className="flex items-center justify-between mb-6"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, type: 'spring' }}
        >
          <div className="flex items-center gap-4">
            <motion.div
              className="h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold text-lg shadow-xl shadow-amber-500/20"
              whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
              transition={{ duration: 0.5 }}
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
            <p className="text-xl font-bold">+4.5</p>
          </div>
        </motion.div>

        <div className="flex items-center justify-center my-4">
          <div className="w-full h-px bg-border" />
          <motion.span
            className="px-4 text-sm font-medium text-muted-foreground"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            VS
          </motion.span>
          <div className="w-full h-px bg-border" />
        </div>

        <motion.div
          className="flex items-center justify-between mt-6"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, type: 'spring' }}
        >
          <div className="flex items-center gap-4">
            <motion.div
              className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white font-bold text-lg shadow-xl shadow-emerald-500/20"
              whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
              transition={{ duration: 0.5 }}
            >
              BOS
            </motion.div>
            <div>
              <p className="text-lg font-bold">Boston Celtics</p>
              <p className="text-sm text-muted-foreground">38-12 • Away • 6-1 L7</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Spread</p>
            <motion.p
              className="text-xl font-bold text-emerald-400"
              animate={{ textShadow: ['0 0 0px transparent', '0 0 12px hsl(142 76% 50% / 0.5)', '0 0 0px transparent'] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              -4.5 ✓
            </motion.p>
          </div>
        </motion.div>
      </div>

      {/* AI Pick Section */}
      <motion.div
        className="px-6 pb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div className="relative p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/30 overflow-hidden">
          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/5 to-transparent"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          />

          <div className="relative flex items-start justify-between mb-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> AI Recommendation
              </p>
              <p className="text-2xl font-bold text-emerald-400">Boston Celtics -4.5</p>
              <p className="text-sm text-muted-foreground mt-1">Best odds at DraftKings: -110</p>
            </div>
            <motion.div
              className="text-right bg-background/50 rounded-xl p-3 border border-emerald-500/20"
              animate={{
                boxShadow: [
                  '0 0 0px hsl(142 76% 36% / 0)',
                  '0 0 30px hsl(142 76% 36% / 0.3)',
                  '0 0 0px hsl(142 76% 36% / 0)',
                ],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <p className="text-4xl font-bold text-primary">81%</p>
              <p className="text-xs text-muted-foreground">Win Probability</p>
            </motion.div>
          </div>

          {/* Key Factors */}
          <div className="relative mb-4 p-3 rounded-xl bg-background/40 border border-border/50">
            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Key Factors</p>
            <ul className="space-y-1 text-sm text-foreground/80">
              {[
                'Celtics 8-2 ATS in last 10 road games',
                'Lakers missing AD (ankle) - confirmed out',
                'Boston averages +6.2 margin vs West teams',
              ].map((text, i) => (
                <motion.li
                  key={i}
                  className="flex items-center gap-2"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + i * 0.15 }}
                >
                  <motion.span
                    className="h-1.5 w-1.5 rounded-full bg-emerald-500"
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
                  />
                  {text}
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Metrics */}
          <div className="relative grid grid-cols-4 gap-3 pt-4 border-t border-emerald-500/20">
            {[
              { value: '+5.2%', label: 'Edge', color: 'text-emerald-400' },
              { value: '-110', label: 'Odds', color: 'text-primary' },
              { value: '2.3u', label: 'Rec Bet', color: 'text-primary' },
              { value: 'A+', label: 'Grade', color: 'text-emerald-400' },
            ].map((metric, i) => (
              <motion.div
                key={metric.label}
                className="text-center p-2 rounded-lg bg-background/40"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1 + i * 0.1, type: 'spring' }}
                whileHover={{ scale: 1.1, y: -2 }}
              >
                <p className={`text-lg font-bold ${metric.color}`}>{metric.value}</p>
                <p className="text-[10px] text-muted-foreground uppercase">{metric.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  </div>
);

export default SmartPicksVisual;
