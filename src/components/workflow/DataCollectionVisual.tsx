import { motion } from 'framer-motion';
import { TrendingUp, Shield, Zap, Database, Activity, Wifi, Radio, Server } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

const dataSources = [
  { icon: TrendingUp, label: 'Live Odds', color: 'from-blue-500 to-cyan-500', dot: 'bg-blue-400' },
  { icon: Shield, label: 'Injuries', color: 'from-red-500 to-rose-500', dot: 'bg-red-400' },
  { icon: Zap, label: 'Player Stats', color: 'from-amber-500 to-orange-500', dot: 'bg-amber-400' },
  { icon: Database, label: 'Historical', color: 'from-purple-500 to-violet-500', dot: 'bg-purple-400' },
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
  const [processedCount, setProcessedCount] = useState(47293);

  useEffect(() => {
    const feedInterval = setInterval(() => {
      setActiveFeed(prev => (prev + 1) % feedItems.length);
    }, 1800);
    const countInterval = setInterval(() => {
      setProcessedCount(prev => prev + Math.floor(Math.random() * 50 + 10));
    }, 200);
    return () => { clearInterval(feedInterval); clearInterval(countInterval); };
  }, []);

  // Positions for the 4 source icons around a semicircle (left side)
  const sourcePositions = [
    { x: 8, y: 15 },
    { x: 5, y: 38 },
    { x: 5, y: 62 },
    { x: 8, y: 85 },
  ];

  const hubX = 50;
  const hubY = 50;

  return (
    <div className="space-y-5">
      {/* Main visualization — radial convergence */}
      <div className="relative h-64 sm:h-72 overflow-hidden rounded-2xl bg-gradient-to-br from-background/90 via-background/60 to-blue-500/5 border border-border/30">

        {/* Subtle grid background */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(hsl(210 100% 60%) 1px, transparent 1px), linear-gradient(90deg, hsl(210 100% 60%) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />

        {/* SVG paths + animated packets */}
        <svg className="absolute inset-0 w-full h-full z-[1]" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            {dataSources.map((_, i) => (
              <linearGradient key={`grad-${i}`} id={`path-grad-${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={['hsl(210,100%,60%)', 'hsl(0,80%,60%)', 'hsl(38,92%,50%)', 'hsl(270,60%,60%)'][i]} stopOpacity="0.6" />
                <stop offset="100%" stopColor="hsl(174, 72%, 50%)" stopOpacity="0.8" />
              </linearGradient>
            ))}
          </defs>

          {/* Connection paths */}
          {sourcePositions.map((pos, i) => {
            const midX = (pos.x + hubX) / 2 + 5;
            return (
              <g key={`connection-${i}`}>
                <motion.path
                  d={`M ${pos.x + 5} ${pos.y} Q ${midX} ${pos.y}, ${hubX} ${hubY}`}
                  fill="none"
                  stroke={`url(#path-grad-${i})`}
                  strokeWidth="0.4"
                  animate={{ opacity: [0.2, 0.5, 0.2] }}
                  transition={{ duration: 3, repeat: Infinity, delay: i * 0.4 }}
                  style={{ vectorEffect: 'non-scaling-stroke' }}
                />
                {/* Traveling data packets */}
                {[0, 1, 2].map(j => (
                  <motion.circle
                    key={`packet-${i}-${j}`}
                    r="0.8"
                    fill={['hsl(210,100%,70%)', 'hsl(0,80%,70%)', 'hsl(38,92%,60%)', 'hsl(270,60%,70%)'][i]}
                    animate={{
                      offsetDistance: ['0%', '100%'],
                      opacity: [0, 1, 1, 0],
                    }}
                    transition={{
                      duration: 1.8 + j * 0.3,
                      repeat: Infinity,
                      delay: i * 0.5 + j * 0.6,
                      ease: 'easeInOut',
                    }}
                    style={{
                      offsetPath: `path("M ${pos.x + 5} ${pos.y} Q ${midX} ${pos.y}, ${hubX} ${hubY}")`,
                    }}
                  />
                ))}
              </g>
            );
          })}

          {/* Output paths from hub to right */}
          {[35, 50, 65].map((y, i) => (
            <g key={`out-${i}`}>
              <motion.path
                d={`M ${hubX + 5} ${hubY} Q ${75} ${y}, ${90} ${y}`}
                fill="none"
                stroke="hsl(142, 76%, 50%)"
                strokeWidth="0.3"
                animate={{ opacity: [0.15, 0.4, 0.15] }}
                transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.3 }}
                style={{ vectorEffect: 'non-scaling-stroke' }}
              />
              <motion.circle
                r="0.6"
                fill="hsl(142, 76%, 60%)"
                animate={{
                  offsetDistance: ['0%', '100%'],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: 0.8 + i * 0.4,
                  ease: 'easeInOut',
                }}
                style={{
                  offsetPath: `path("M ${hubX + 5} ${hubY} Q ${75} ${y}, ${90} ${y}")`,
                }}
              />
            </g>
          ))}
        </svg>

        {/* Source icons */}
        {dataSources.map((src, i) => (
          <motion.div
            key={src.label}
            className="absolute z-10 flex flex-col items-center gap-1"
            style={{ left: `${sourcePositions[i].x}%`, top: `${sourcePositions[i].y}%`, transform: 'translate(-50%, -50%)' }}
          >
            <motion.div
              className={cn("h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg", src.color)}
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.4 }}
            >
              <src.icon className="h-5 w-5 text-white" />
            </motion.div>
            <span className="text-[9px] sm:text-[10px] font-medium text-muted-foreground hidden sm:block">{src.label}</span>
          </motion.div>
        ))}

        {/* Central hub */}
        <motion.div
          className="absolute z-20"
          style={{ left: `${hubX}%`, top: `${hubY}%`, transform: 'translate(-50%, -50%)' }}
        >
          {/* Outer ring */}
          <motion.div
            className="absolute -inset-4 rounded-full border border-primary/20"
            animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          <motion.div
            className="absolute -inset-2 rounded-full border border-primary/30"
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 h-2 w-2 rounded-full bg-primary/60" />
          </motion.div>
          <motion.div
            className="h-16 w-16 sm:h-18 sm:w-18 rounded-2xl bg-gradient-to-br from-primary via-cyan-500 to-emerald-500 flex items-center justify-center shadow-2xl"
            animate={{
              boxShadow: [
                '0 0 15px hsl(174 72% 50% / 0.2)',
                '0 0 40px hsl(174 72% 50% / 0.5)',
                '0 0 15px hsl(174 72% 50% / 0.2)',
              ],
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Server className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
          </motion.div>
        </motion.div>

        {/* Output labels */}
        <div className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 flex flex-col gap-2.5 z-10">
          {['Spread', 'Totals', 'Props'].map((label, i) => (
            <motion.div
              key={label}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-sm"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 + i * 0.15 }}
            >
              <motion.div
                className="h-1.5 w-1.5 rounded-full bg-emerald-400"
                animate={{ scale: [1, 1.5, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
              />
              <span className="text-xs font-mono text-emerald-400">{label}</span>
            </motion.div>
          ))}
        </div>

        {/* Live counter */}
        <motion.div
          className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-1.5 rounded-full bg-card/80 border border-border/50 backdrop-blur-sm z-20"
        >
          <motion.div
            className="h-2 w-2 rounded-full bg-emerald-500"
            animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
          <span className="text-xs font-mono text-emerald-400">{processedCount.toLocaleString()} events/sec</span>
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
