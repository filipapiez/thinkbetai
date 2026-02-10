import { motion } from 'framer-motion';
import { TrendingUp, Shield, Zap, Database } from 'lucide-react';
import { cn } from '@/lib/utils';

const dataSources = [
  { icon: TrendingUp, label: 'Live Odds', sublabel: '12 sportsbooks', color: 'from-blue-500 to-cyan-500' },
  { icon: Shield, label: 'Injuries', sublabel: 'Real-time updates', color: 'from-red-500 to-rose-500' },
  { icon: Zap, label: 'Player Stats', sublabel: '10K+ players', color: 'from-amber-500 to-orange-500' },
  { icon: Database, label: 'Historical', sublabel: '5 years data', color: 'from-purple-500 to-violet-500' },
];

const DataCollectionVisual = () => (
  <div className="space-y-8">
    {/* Animated data stream visualization */}
    <div className="relative h-32 overflow-hidden rounded-xl bg-background/20">
      {/* Flowing data particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-1 rounded-full bg-gradient-to-r from-primary/80 to-cyan-400/80"
          style={{
            top: `${10 + (i * 4.5) % 80}%`,
            width: `${20 + Math.random() * 60}px`,
          }}
          animate={{
            x: ['-100px', 'calc(100% + 100px)'],
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            repeat: Infinity,
            delay: i * 0.15,
            ease: 'linear',
          }}
        />
      ))}
      {/* Central processor */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center z-10"
        animate={{
          boxShadow: [
            '0 0 20px hsl(174 72% 50% / 0.3)',
            '0 0 60px hsl(174 72% 50% / 0.6)',
            '0 0 20px hsl(174 72% 50% / 0.3)',
          ],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        >
          <Database className="h-8 w-8 text-white" />
        </motion.div>
      </motion.div>
      {/* Concentric rings */}
      {[40, 56, 72].map((size, i) => (
        <motion.div
          key={size}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/20"
          style={{ width: `${size * 4}px`, height: `${size * 4}px` }}
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
        />
      ))}
    </div>

    {/* Data Sources Grid */}
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
      {dataSources.map((item, i) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1, type: 'spring', stiffness: 200 }}
          whileHover={{ scale: 1.05, y: -4 }}
          className="relative p-3 sm:p-4 rounded-xl bg-card border border-border/50 overflow-hidden group cursor-default"
        >
          <motion.div
            className={cn("absolute inset-0 bg-gradient-to-br opacity-0", item.color)}
            whileHover={{ opacity: 0.1 }}
          />
          <div className={cn("h-10 w-10 rounded-lg bg-gradient-to-br flex items-center justify-center mb-2", item.color)}>
            <item.icon className="h-5 w-5 text-white" />
          </div>
          <p className="text-sm font-semibold">{item.label}</p>
          <p className="text-xs text-muted-foreground">{item.sublabel}</p>
          {/* Animated status dot */}
          <motion.div
            className="absolute top-2 right-2 h-2 w-2 rounded-full bg-emerald-500"
            animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
          />
        </motion.div>
      ))}
    </div>

    {/* Live Feed Status */}
    <div className="flex items-center justify-center gap-3">
      <motion.div
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30"
        animate={{ borderColor: ['hsl(210 100% 50% / 0.3)', 'hsl(210 100% 50% / 0.6)', 'hsl(210 100% 50% / 0.3)'] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        <motion.div
          className="h-1.5 w-1.5 rounded-full bg-blue-500"
          animate={{ scale: [1, 1.5, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <span className="text-xs text-blue-400">50+ sources connected</span>
      </motion.div>
      <motion.div
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30"
        animate={{ borderColor: ['hsl(142 76% 36% / 0.3)', 'hsl(142 76% 36% / 0.6)', 'hsl(142 76% 36% / 0.3)'] }}
        transition={{ duration: 3, repeat: Infinity, delay: 1 }}
      >
        <motion.div
          className="h-1.5 w-1.5 rounded-full bg-emerald-500"
          animate={{ scale: [1, 1.5, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
        />
        <span className="text-xs text-emerald-400">Updating every 30s</span>
      </motion.div>
    </div>
  </div>
);

export default DataCollectionVisual;
