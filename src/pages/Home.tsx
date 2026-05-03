/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import RecipeCard from '../components/RecipeCard';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
  const recipes = useLiveQuery(() => db.recipes.toArray());
  const profile = useLiveQuery(() => db.userProfile.get('me'));
  const [cols, setCols] = useState(1);
  const theme = profile?.preferences?.appTheme || 'noir';

  return (
    <div className="space-y-8">
      {/* Mini Header */}
      <section className="pt-4 flex items-center justify-between opacity-60">
        <span className="text-zinc-500 uppercase tracking-[0.2em] text-[10px] font-semibold block cursor-pointer hover:text-white transition-colors" onClick={() => navigate('/')}>KitchenOS v1.0.42</span>
        <div className="flex bg-white/5 p-0.5 rounded-lg border border-white/5">
          <button 
            onClick={() => setCols(1)}
            className={`px-3 py-1 rounded-md text-[10px] uppercase font-bold tracking-widest transition-all ${cols === 1 ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            1x
          </button>
          <button 
            onClick={() => setCols(2)}
            className={`px-3 py-1 rounded-md text-[10px] uppercase font-bold tracking-widest transition-all ${cols === 2 ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            2x
          </button>
        </div>
      </section>

      {/* Featured Grid */}
      <section className={`grid gap-6 min-h-[40vh] ${cols === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
        {recipes === undefined ? (
          <div className="col-span-full flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-8 h-8 rounded-full border-2 border-zinc-800 border-t-zinc-400 animate-spin" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Loading Archives...</span>
          </div>
        ) : recipes.length === 0 ? (
          <div className="col-span-full text-center py-20 opacity-20 italic">
            No recipes discovered yet.
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {recipes.map((recipe, index) => (
              <motion.div
                key={recipe.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4 }}
              >
                <RecipeCard recipe={recipe} index={index} isCompact={cols > 1} theme={theme} />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </section>

      {/* Archives Title */}
      <section className="pt-8 mb-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-4 mb-6">
            <h2 className="editorial-title text-4xl">
              Knowledge<br />
              <span className="text-zinc-500 text-3xl">Archives.</span>
            </h2>
            <div className="h-[1px] flex-1 bg-white/5 mt-6" />
          </div>
        </motion.div>
      </section>

      {/* Footer / CTA Style */}
      <section className="pb-12 text-center">
        <motion.div 
          whileHover={{ y: -4 }}
          className="p-10 rounded-[2.5rem] glass x-border bg-white/[0.01] backdrop-blur-3xl relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <h4 className="editorial-title text-3xl mb-3">Architect your taste.</h4>
          <p className="text-zinc-500 text-sm mb-8 tracking-tight font-medium">Build your own local culinary intelligence engine.</p>
          <button 
            onClick={() => navigate('/add')}
            className="h-14 px-10 bg-white text-black font-bold text-xs tracking-[0.2em] uppercase flex items-center justify-center rounded-full hover:scale-105 active:scale-95 transition-all mx-auto shadow-2xl relative z-10"
          >
            Create Profile
          </button>
        </motion.div>
      </section>
    </div>
  );
}

