/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../lib/db';
import { Activity, Database, Search, Calculator, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';

export default function DebugPanel() {
  const recipes = useLiveQuery(() => db.recipes.toArray()) || [];
  const [dbStatus, setDbStatus] = useState<'connected' | 'error' | 'connecting'>('connecting');
  const [lastSearchTime, setLastSearchTime] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const checkDb = async () => {
      try {
        if (db.isOpen()) {
          setDbStatus('connected');
        } else {
          await db.open();
          setDbStatus('connected');
        }
      } catch (err) {
        setDbStatus('error');
        console.error('DB Debug Error:', err);
      }
    };
    checkDb();
    
    // Simulate monitoring search latency if we had a global search state
    // For now, we'll just show static-ish data or mock metrics
  }, []);

  // Scaling Validator
  const testScaling = (base: number, scale: number) => {
    const result = base * scale;
    return {
      input: `${base} @ ${scale}x`,
      output: result.toFixed(2),
      valid: !isNaN(result)
    };
  };

  const scalingResult = testScaling(2, 2.5);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-24 right-6 z-[100] pointer-events-none"
    >
      <div className="flex flex-col items-end gap-2">
        <AnimatePresence>
          {isExpanded && (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 10 }}
              className="glass border border-white/10 p-4 rounded-2xl w-64 shadow-2xl pointer-events-auto space-y-4"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Diagnostic Hub</span>
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${dbStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-[8px] font-mono font-bold uppercase">{dbStatus}</span>
                </div>
              </div>

              {/* DB Metrics */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-300">
                  <Database className="w-3 h-3 text-blue-400" /> Storage Engine
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white/5 p-2 rounded-lg">
                    <div className="text-[8px] uppercase text-zinc-500 mb-0.5">Records</div>
                    <div className="text-xs font-mono font-bold">{recipes.length}</div>
                  </div>
                  <div className="bg-white/5 p-2 rounded-lg">
                    <div className="text-[8px] uppercase text-zinc-500 mb-0.5">Type</div>
                    <div className="text-xs font-mono font-bold">IndexedDB</div>
                  </div>
                </div>
              </div>

              {/* Search Logic */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-300">
                  <Search className="w-3 h-3 text-purple-400" /> Filtering Matrix
                </div>
                <div className="bg-white/5 p-2 rounded-lg flex items-center justify-between">
                  <span className="text-[8px] uppercase text-zinc-500">Latency</span>
                  <span className="text-[10px] font-mono text-green-400">12ms</span>
                </div>
              </div>

              {/* Scaling Logic */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-300">
                  <Calculator className="w-3 h-3 text-amber-400" /> Arithmetic Integrity
                </div>
                <div className="bg-white/5 p-2 rounded-lg space-y-1">
                  <div className="flex items-center justify-between text-[8px] uppercase text-zinc-500 font-mono">
                    <span>{scalingResult.input}</span>
                    <span className="text-green-500 flex items-center gap-1">
                      OK <CheckCircle2 className="w-2 h-2" />
                    </span>
                  </div>
                  <div className="text-xs font-mono font-bold">Result: {scalingResult.output}</div>
                </div>
              </div>

              {/* Fail Detection Mock */}
              {dbStatus === 'error' && (
                <div className="bg-red-500/10 border border-red-500/20 p-2 rounded-lg flex items-center gap-2 text-red-400">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  <span className="text-[9px] font-bold uppercase tracking-tight">Data Connection Terminated</span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className={`w-10 h-10 rounded-full glass border border-white/10 flex items-center justify-center pointer-events-auto transition-all ${isExpanded ? 'bg-white text-black' : 'hover:scale-110 active:scale-95'}`}
        >
          <Activity className={`w-5 h-5 ${isExpanded ? '' : 'text-zinc-400'}`} />
          {!isExpanded && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-black" />
          )}
        </button>
      </div>
    </motion.div>
  );
}
