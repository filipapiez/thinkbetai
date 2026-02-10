import { motion } from 'framer-motion';
import { TrendingUp, Shield, Zap, Database, Activity, Wifi, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

const dataSources = [
  { icon: TrendingUp, label: 'Live Odds', sublabel: '12 sportsbooks', color: 'from-blue-500 to-cyan-500', delay: 0 },
  { icon: Shield, label: 'Injuries', sublabel: 'Real-time updates', color: 'from-red-500 to-rose-500', delay: 0.1 },
  { icon: Zap, label: 'Player Stats', sublabel: '10K+ players', color: 'from-amber-500 to-orange-500', delay: 0.2 },
  { icon: Database, label: 'Historical', sublabel: '5 years data', color: 'from-purple-500 to-violet-500', delay: 0.3 },
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
      {/* Main visualization — orbital data hub */}
      <div className="relative h-56 sm:h-64 overflow-hidden rounded-2xl bg-gradient-to-br from-background/80 to-background/40 border border-border/30">
        {/* Radar sweep */}
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 sm:w-80 sm:h-80"
          style={{ transformOrigin: 'center' }}
        >
          <motion.div
            className="absolute inset-0"
            animate={{ rotate: 360 }}
            transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          >
            <div className="absolute top-1/2 left-1/2 w-1/2 h-0.5 origin-left bg-gradient-to-r from-primary/60 to-transparent" />
            <div className="absolute top-1/2 left-1/2 w-1/2 h-8 origin-left bg-gradient-to-r from-primary/15 to-transparent -translate-y-4 rounded-r-full blur-sm" />
          </motion.div>
        </motion.div>

        {/* Concentric rings */}
        {[80, 120, 160, 200].map((size, i) => (
          <motion.div
            key={size}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/10"
            style={{ width: size, height: size }}
            animate={{ opacity: [0.2, 0.5, 0.2], scale: [1, 1.02, 1] }}
            transition={{ duration: 3, repeat: Infinity, delay: i * 0.4 }}
          />
        ))}

        {/* Orbiting data nodes */}
        {dataSources.map((src, i) => {
          const angle = (i / dataSources.length) * Math.PI * 2;
          const radius = 90;
          return (
            <motion.div
              key={src.label}
              className="absolute left-1/2 top-1/2 z-10"
              animate={{
                x: [
                  Math.cos(angle) * radius - 20,
                  Math.cos(angle + Math.PI / 6) * radius - 20,
                  Math.cos(angle) * radius - 20,
                ],
                y: [
                  Math.sin(angle) * radius - 20,
                  Math.sin(angle + Math.PI / 6) * radius - 20,
                  Math.sin(angle) * radius - 20,
                ],
              }}
              transition={{ duration: 8, repeat: Infinity, delay: i * 0.5, ease: 'easeInOut' }}
            >
              <motion.div
                className={cn("h-10 w-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg", src.color)}
                whileHover={{ scale: 1.3 }}
                animate={{
                  boxShadow: [
                    '0 0 10px hsl(174 72% 50% / 0.2)',
                    '0 0 25px hsl(174 72% 50% / 0.5)',
                    '0 0 10px hsl(174 72% 50% / 0.2)',
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
              >
                <src.icon className="h-5 w-5 text-white" />
              </motion.div>
            </motion.div>
          );
        })}

        {/* Particle streams toward center */}
        {[...Array(30)].map((_, i) => {
          const angle = (i / 30) * Math.PI * 2;
          const startR = 140;
          return (
            <motion.div
              key={`p-${i}`}
              className="absolute left-1/2 top-1/2 h-1 w-1 rounded-full bg-primary/70"
              animate={{
                x: [Math.cos(angle) * startR, 0],
                y: [Math.sin(angle) * startR, 0],
                opacity: [0, 1, 0],
                scale: [0.5, 1.5, 0],
              }}
              transition={{
                duration: 1.5 + Math.random(),
                repeat: Infinity,
                delay: i * 0.12,
                ease: 'easeIn',
              }}
            />
          );
        })}

        {/* Central hub */}
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-20 w-20 rounded-2xl bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center z-20 shadow-2xl"
          animate={{
            boxShadow: [
              '0 0 20px hsl(174 72% 50% / 0.3), 0 0 60px hsl(174 72% 50% / 0.1)',
              '0 0 40px hsl(174 72% 50% / 0.6), 0 0 80px hsl(174 72% 50% / 0.2)',
              '0 0 20px hsl(174 72% 50% / 0.3), 0 0 60px hsl(174 72% 50% / 0.1)',
            ],
            scale: [1, 1.05, 1],
          }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
          >
            <Database className="h-9 w-9 text-white" />
          </motion.div>
          {/* Pulse ring */}
          <motion.div
            className="absolute inset-0 rounded-2xl border-2 border-primary/50"
            animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.div
            className="absolute inset-0 rounded-2xl border border-primary/30"
            animate={{ scale: [1, 2], opacity: [0.4, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
          />
        </motion.div>

        {/* Data throughput counter */}
        <motion.div
          className="absolute bottom-3 right-3 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card/80 border border-border/50 backdrop-blur-sm z-20"
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

      {/* Data Sources Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {dataSources.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, type: 'spring', stiffness: 200 }}
            whileHover={{ scale: 1.05, y: -4 }}
            className="relative p-3 rounded-xl bg-card border border-border/50 overflow-hidden group cursor-default"
          >
            <motion.div
              className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity", item.color)}
            />
            <div className={cn("h-10 w-10 rounded-lg bg-gradient-to-br flex items-center justify-center mb-2", item.color)}>
              <item.icon className="h-5 w-5 text-white" />
            </div>
            <p className="text-sm font-semibold">{item.label}</p>
            <p className="text-xs text-muted-foreground">{item.sublabel}</p>
            <motion.div
              className="absolute top-2 right-2 h-2 w-2 rounded-full bg-emerald-500"
              animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
            />
          </motion.div>
        ))}
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
