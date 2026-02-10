import { motion } from 'framer-motion';
import { TrendingUp, Shield, Zap, Database, Activity, Wifi, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

const dataSources = [
  { icon: TrendingUp, label: 'Live Odds', sublabel: '12 sportsbooks', color: 'from-blue-500 to-cyan-500' },
  { icon: Shield, label: 'Injuries', sublabel: 'Real-time updates', color: 'from-red-500 to-rose-500' },
  { icon: Zap, label: 'Player Stats', sublabel: '10K+ players', color: 'from-amber-500 to-orange-500' },
  { icon: Database, label: 'Historical', sublabel: '5 years data', color: 'from-purple-500 to-violet-500' },
];

const feedItems = [
  { text: 'DraftKings: LAL +4.5 → +5.0', type: 'odds' },
  { text: 'ESPN: AD questionable (ankle)', type: 'injury' },
  { text: 'Tatum: 32.4 PPG last 10', type: 'stat' },
  { text: 'FanDuel: BOS -4.5 -108', type: 'odds' },
  { text: 'NBA.com: LeBron GTD (rest)', type: 'injury' },
  { text: 'BetMGM: O/U 224.5 → 222', type: 'odds' },
  { text: 'Celtics 8-2 ATS last 10 road', type: 'stat' },
  { text: 'Caesars: BOS ML -185', type: 'odds' },
];

const DataCollectionVisual = () => {
  const [activeFeed, setActiveFeed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeed(prev => (prev + 1) % feedItems.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Main visualization — data pipeline flow */}
      <div className="relative h-56 sm:h-64 overflow-hidden rounded-2xl bg-gradient-to-br from-background/80 to-blue-500/5 border border-border/30">
        
        {/* Horizontal flowing data streams */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={`stream-${i}`}
            className="absolute h-[2px] rounded-full"
            style={{
              top: `${15 + i * 14}%`,
              background: `linear-gradient(90deg, transparent, ${
                ['hsl(210,100%,60%)', 'hsl(0,80%,60%)', 'hsl(38,92%,50%)', 'hsl(270,60%,60%)', 'hsl(174,72%,50%)', 'hsl(142,76%,50%)'][i]
              }, transparent)`,
              width: `${60 + Math.random() * 30}%`,
            }}
            animate={{
              x: ['-30%', '130%'],
              opacity: [0, 0.8, 0],
            }}
            transition={{
              duration: 2.5 + Math.random() * 1.5,
              repeat: Infinity,
              delay: i * 0.4,
              ease: 'linear',
            }}
          />
        ))}

        {/* Data source icons on the left */}
        <div className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-10">
          {dataSources.map((src, i) => (
            <motion.div
              key={src.label}
              className={cn("h-10 w-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg", src.color)}
              animate={{
                scale: [1, 1.15, 1],
                boxShadow: [
                  '0 0 8px hsl(210 100% 50% / 0.2)',
                  '0 0 20px hsl(210 100% 50% / 0.5)',
                  '0 0 8px hsl(210 100% 50% / 0.2)',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
            >
              <src.icon className="h-5 w-5 text-white" />
            </motion.div>
          ))}
        </div>

        {/* Converging lines from sources to processor */}
        <svg className="absolute inset-0 w-full h-full z-0" preserveAspectRatio="none">
          <defs>
            <linearGradient id="pipe-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(210, 100%, 60%)" stopOpacity="0.4" />
              <stop offset="50%" stopColor="hsl(174, 72%, 50%)" stopOpacity="0.6" />
              <stop offset="100%" stopColor="hsl(142, 76%, 50%)" stopOpacity="0.4" />
            </linearGradient>
          </defs>
          {dataSources.map((_, i) => (
            <motion.path
              key={`path-${i}`}
              d={`M ${15} ${22 + i * 16} Q ${50} ${22 + i * 16}, ${65} 50`}
              fill="none"
              stroke="url(#pipe-grad)"
              strokeWidth="1.5"
              animate={{
                opacity: [0.1, 0.6, 0.1],
                strokeWidth: [1, 2.5, 1],
              }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.25 }}
              style={{ vectorEffect: 'non-scaling-stroke' }}
            />
          ))}
        </svg>

        {/* Central processor */}
        <motion.div
          className="absolute left-[60%] sm:left-[65%] top-1/2 -translate-x-1/2 -translate-y-1/2 z-20"
        >
          <motion.div
            className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center shadow-2xl"
            animate={{
              boxShadow: [
                '0 0 20px hsl(174 72% 50% / 0.3)',
                '0 0 50px hsl(174 72% 50% / 0.6)',
                '0 0 20px hsl(174 72% 50% / 0.3)',
              ],
              rotate: [0, 2, -2, 0],
            }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            <Database className="h-9 w-9 text-white" />
          </motion.div>
          <motion.div
            className="absolute inset-0 rounded-2xl border-2 border-primary/50"
            animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>

        {/* Output lines from processor to right */}
        <div className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-10">
          {['Spread', 'Totals', 'Props'].map((label, i) => (
            <motion.div
              key={label}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.2 }}
            >
              <motion.div
                className="h-1.5 w-1.5 rounded-full bg-emerald-400"
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
              />
              <span className="text-xs font-mono text-emerald-400">{label}</span>
            </motion.div>
          ))}
        </div>

        {/* Throughput counter */}
        <motion.div
          className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card/80 border border-border/50 backdrop-blur-sm z-20"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Activity className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-xs font-mono text-emerald-400">47,293 events/sec</span>
        </motion.div>
      </div>

      {/* Live data feed ticker */}
      <div className="relative overflow-hidden rounded-xl bg-card/60 border border-border/50 p-3">
        <div className="flex items-center gap-2 mb-2">
          <motion.div
            className="h-2 w-2 rounded-full bg-emerald-500"
            animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Live Data Feed</span>
        </div>
        <div className="relative h-24 overflow-hidden">
          {feedItems.map((item, i) => (
            <motion.div
              key={`${item.text}-${i}`}
              className={cn(
                "absolute left-0 right-0 flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-mono",
                i === activeFeed ? "bg-primary/10 border border-primary/20" : ""
              )}
              animate={{
                y: (i - activeFeed) * 28,
                opacity: Math.abs(i - activeFeed) > 2 ? 0 : 1 - Math.abs(i - activeFeed) * 0.3,
                scale: i === activeFeed ? 1 : 0.95,
              }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              <span className={cn(
                "h-1.5 w-1.5 rounded-full shrink-0",
                item.type === 'odds' ? 'bg-blue-400' : item.type === 'injury' ? 'bg-red-400' : 'bg-amber-400'
              )} />
              <span className="text-foreground/80 truncate">{item.text}</span>
              {i === activeFeed && (
                <motion.span
                  className="ml-auto text-[10px] text-primary"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  NOW
                </motion.span>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Status pills */}
      <div className="flex items-center justify-center gap-3 flex-wrap">
        {[
          { icon: Wifi, label: '50+ sources', color: 'blue' },
          { icon: Radio, label: 'Every 30s', color: 'emerald' },
          { icon: Activity, label: '99.9% uptime', color: 'amber' },
        ].map((pill, i) => (
          <motion.div
            key={pill.label}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full border",
              pill.color === 'blue' ? 'bg-blue-500/10 border-blue-500/30' :
              pill.color === 'emerald' ? 'bg-emerald-500/10 border-emerald-500/30' :
              'bg-amber-500/10 border-amber-500/30'
            )}
            animate={{
              borderColor: pill.color === 'blue'
                ? ['hsl(210 100% 50% / 0.3)', 'hsl(210 100% 50% / 0.6)', 'hsl(210 100% 50% / 0.3)']
                : pill.color === 'emerald'
                ? ['hsl(142 76% 36% / 0.3)', 'hsl(142 76% 36% / 0.6)', 'hsl(142 76% 36% / 0.3)']
                : ['hsl(38 92% 50% / 0.3)', 'hsl(38 92% 50% / 0.6)', 'hsl(38 92% 50% / 0.3)'],
            }}
            transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
          >
            <motion.div
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                pill.color === 'blue' ? 'bg-blue-500' : pill.color === 'emerald' ? 'bg-emerald-500' : 'bg-amber-500'
              )}
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
            />
            <span className={cn(
              "text-xs",
              pill.color === 'blue' ? 'text-blue-400' : pill.color === 'emerald' ? 'text-emerald-400' : 'text-amber-400'
            )}>{pill.label}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default DataCollectionVisual;
