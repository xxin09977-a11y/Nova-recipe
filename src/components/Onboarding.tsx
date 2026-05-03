/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChefHat, Database, Timer, ChevronRight, Zap } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

const SCREENS = [
  {
    icon: <ChefHat className="w-12 h-12" />,
    title: "Precision. Scaling.",
    description: "Adjust servings instantly. Ingredients and durations recalibrate in real-time for zero-waste preparation.",
    color: "from-blue-500/20",
    detail: "Dynamic Ratio Engine"
  },
  {
    icon: <Database className="w-12 h-12" />,
    title: "Zero. Latency.",
    description: "Your archives live on-device. Access images, steps, and details deep in the bunker or 30,000 feet up.",
    color: "from-purple-500/20",
    detail: "Offline-First Architecture"
  },
  {
    icon: <Timer className="w-12 h-12" />,
    title: "Tactical. Timing.",
    description: "Integrated process clocks ensure perfect synchronicity across multi-phase sequences.",
    color: "from-amber-500/20",
    detail: "Hardware-Accelerated Clocks"
  }
];

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [current, setCurrent] = useState(0);

  const next = () => {
    if (current < SCREENS.length - 1) {
      setCurrent(current + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col justify-between p-8 overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none">
        <AnimatePresence mode="wait">
          <motion.div 
            key={current}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`absolute inset-0 bg-gradient-to-tr ${SCREENS[current].color} to-transparent blur-3xl opacity-30`}
          />
        </AnimatePresence>
      </div>

      {/* Progress */}
      <div className="flex gap-2 relative z-10 pt-4">
        {SCREENS.map((_, i) => (
          <div 
            key={i} 
            className={`h-1 flex-1 rounded-full bg-white/10 overflow-hidden transition-all duration-500 ${i <= current ? 'opacity-100' : 'opacity-30'}`}
          >
            {i === current && (
              <motion.div 
                initial={{ x: '-100%' }}
                animate={{ x: '0%' }}
                transition={{ duration: 0.8 }}
                className="h-full bg-white"
              />
            )}
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-12"
          >
            {/* Visual Element */}
            <div className="relative">
              <div className="w-24 h-24 rounded-3xl glass border border-white/10 flex items-center justify-center shadow-[0_20px_50px_rgba(255,255,255,0.1)] mx-auto">
                <motion.div
                  animate={{ 
                    rotateY: [0, 15, 0],
                    rotateX: [0, -15, 0]
                  }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  {SCREENS[current].icon}
                </motion.div>
              </div>
              <div className="absolute -inset-4 bg-white/5 blur-2xl rounded-full -z-10" />
            </div>

            <div className="space-y-6 text-center">
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-500 opacity-60">
                  {SCREENS[current].detail}
                </span>
                <h1 className="editorial-title text-5xl leading-tight">
                  {SCREENS[current].title}
                </h1>
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed max-w-xs mx-auto font-medium">
                {SCREENS[current].description}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Primary Action */}
      <div className="relative z-10 pb-8 flex flex-col gap-6">
        <button 
          onClick={next}
          className="w-full bg-white text-black h-14 rounded-2xl font-bold uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 active:scale-95 transition-transform"
        >
          {current === SCREENS.length - 1 ? (
             <>Initialize KitchenOS <Zap className="w-4 h-4" /></>
          ) : (
             <>Advance Sequence <ChevronRight className="w-4 h-4" /></>
          )}
        </button>
        
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-600 px-2">
          <span>v2.0.4.stable</span>
          <button onClick={onComplete} className="hover:text-white transition-colors">Abort Onboarding</button>
        </div>
      </div>
    </div>
  );
}
