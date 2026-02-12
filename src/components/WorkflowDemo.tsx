import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Brain, Target, ArrowRight, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import DataCollectionVisual from './workflow/DataCollectionVisual';
import AIAnalysisVisual from './workflow/AIAnalysisVisual';
import SmartPicksVisual from './workflow/SmartPicksVisual';

const steps = [
  {
    id: 1,
    title: 'Intelligent Data Processing',
    description: 'ThinkBetAI leverages advanced AI models to analyze thousands of historical and real-time data points across leagues, teams, and player performance. By continuously evaluating patterns, trends, and probabilities, the platform uncovers opportunities that are often missed through manual research.',
    icon: Database,
    color: 'from-blue-500 to-cyan-500',
    details: [
      { label: 'Live Odds', value: '12 books' },
      { label: 'Player Stats', value: '10K+ players' },
      { label: 'Injury Reports', value: 'Real-time' },
    ],
  },
  {
    id: 2,
    title: 'Actionable, Data-Driven Insights',
    description: 'Our system transforms complex analytics into clear, structured predictions and insights. Each recommendation is supported by measurable data, allowing you to quickly understand the reasoning behind every pick without spending hours reviewing statistics yourself.',
    icon: Brain,
    color: 'from-purple-500 to-pink-500',
    details: [
      { label: 'Models Running', value: '7 active' },
      { label: 'Patterns Found', value: '847 today' },
      { label: 'Processing', value: '< 2 sec' },
    ],
  },
  {
    id: 3,
    title: 'Smarter, Strategy-Focused Decision Making',
    description: 'With AI-powered analysis at your fingertips, you can approach betting with a disciplined, data-first strategy. ThinkBetAI helps users reduce emotional decision-making, stay consistent, and make more informed choices over time.',
    icon: Target,
    color: 'from-emerald-500 to-teal-500',
    details: [
      { label: 'Win Rate', value: '81%' },
      { label: 'Avg Edge', value: '+4.2%' },
      { label: "Today's Picks", value: '23 live' },
    ],
  },
];

const WorkflowDemo = () => {
  const [activeStep, setActiveStep] = useState(1);
  const currentStep = steps.find(s => s.id === activeStep) || steps[0];

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Step Indicators */}
      <div className="flex items-center justify-center mb-8 sm:mb-12 px-2">
        <div className="flex items-center gap-2 sm:gap-3">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center gap-2 sm:gap-3">
              <motion.button
                onClick={() => setActiveStep(step.id)}
                className={cn(
                  "relative flex flex-col items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 rounded-2xl transition-all duration-300 min-w-[90px] sm:min-w-[120px]",
                  activeStep === step.id
                    ? "bg-card border border-primary/30 shadow-lg shadow-primary/10"
                    : "hover:bg-card/50"
                )}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
              >
                {/* Step Number Badge */}
                <motion.div
                  className={cn(
                    "absolute -top-2 -left-2 h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold",
                    activeStep === step.id
                      ? "bg-primary text-primary-foreground"
                      : activeStep > step.id
                        ? "bg-emerald-500 text-white"
                        : "bg-muted text-muted-foreground"
                  )}
                  animate={activeStep === step.id ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 0.5 }}
                >
                  {activeStep > step.id ? <CheckCircle2 className="h-4 w-4" /> : step.id}
                </motion.div>

                {/* Icon */}
                <motion.div
                  className={cn(
                    "h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center",
                    activeStep === step.id
                      ? `bg-gradient-to-br ${step.color}`
                      : "bg-muted"
                  )}
                  animate={
                    activeStep === step.id
                      ? {
                          boxShadow: [
                            '0 0 0px transparent',
                            '0 0 30px hsl(174 72% 50% / 0.3)',
                            '0 0 0px transparent',
                          ],
                        }
                      : {}
                  }
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <step.icon className={cn(
                    "h-5 w-5 sm:h-6 sm:w-6 transition-colors",
                    activeStep === step.id ? "text-white" : "text-muted-foreground"
                  )} />
                </motion.div>

                <span className={cn(
                  "text-xs sm:text-sm font-semibold transition-colors text-center leading-tight",
                  activeStep === step.id ? "text-foreground" : "text-muted-foreground"
                )}>
                  {step.id === 1 ? 'Data Processing' : step.id === 2 ? 'AI Insights' : 'Smart Decisions'}
                </span>
              </motion.button>

              {/* Arrow Connector */}
              {index < steps.length - 1 && (
                <div className="flex items-center">
                  <motion.div
                    className={cn(
                      "w-6 sm:w-10 h-0.5",
                      activeStep > step.id ? "bg-emerald-500" : "bg-border"
                    )}
                    animate={
                      activeStep > step.id
                        ? { scaleX: [0, 1], opacity: [0, 1] }
                        : {}
                    }
                    transition={{ duration: 0.5 }}
                  />
                  <ArrowRight className={cn(
                    "h-4 w-4 -ml-1",
                    activeStep > step.id ? "text-emerald-500" : "text-muted-foreground"
                  )} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Content Card */}
      <motion.div
        className="relative rounded-2xl border border-border/50 bg-gradient-to-br from-card via-card to-muted/20 shadow-2xl overflow-hidden"
        layout
      >
        {/* Gradient Accent */}
        <motion.div
          className={cn(
            "absolute top-0 left-0 right-0 h-1 bg-gradient-to-r",
            currentStep.color
          )}
          layoutId="step-accent"
        />

        <div className="p-5 sm:p-8 md:p-10">
          {/* Header */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep}
              className="text-center mb-6 sm:mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                className={cn(
                  "inline-flex items-center justify-center h-12 w-12 sm:h-16 sm:w-16 rounded-2xl bg-gradient-to-br mb-3 sm:mb-4",
                  currentStep.color
                )}
                animate={{
                  boxShadow: [
                    '0 0 0px transparent',
                    '0 0 40px hsl(174 72% 50% / 0.3)',
                    '0 0 0px transparent',
                  ],
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <currentStep.icon className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </motion.div>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2">
                Step {currentStep.id}: {currentStep.title}
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto">
                {currentStep.description}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
            {currentStep.details.map((detail, i) => (
              <motion.div
                key={`${activeStep}-${detail.label}`}
                className="text-center p-3 sm:p-4 md:p-6 rounded-xl bg-background/60 border border-border/50"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1, type: 'spring', stiffness: 200 }}
                whileHover={{ y: -4, borderColor: 'hsl(174 72% 50% / 0.4)' }}
              >
                <motion.p
                  className="text-lg sm:text-2xl md:text-3xl font-bold text-primary mb-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.15 + 0.2 }}
                >
                  {detail.value}
                </motion.p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {detail.label}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Visual Demo */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep}
              className="rounded-xl bg-background/40 border border-border/30 p-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.4 }}
            >
              {activeStep === 1 && <DataCollectionVisual />}
              {activeStep === 2 && <AIAnalysisVisual />}
              {activeStep === 3 && <SmartPicksVisual />}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default WorkflowDemo;
