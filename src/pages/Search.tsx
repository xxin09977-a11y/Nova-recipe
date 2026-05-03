/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Search as SearchIcon, SlidersHorizontal, Clock, X, LayoutGrid, List } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import RecipeCard from '../components/RecipeCard';

const CATEGORIES = ['All', 'Japanese', 'Italian', 'Healthy', 'Local'];
const TIME_LIMITS = [
  { label: 'Any Time', value: 0 },
  { label: '< 15m', value: 15 },
  { label: '< 30m', value: 30 },
  { label: '< 60m', value: 60 }
];

export default function Search() {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [maxTime, setMaxTime] = useState(0);
  const [cols, setCols] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const profile = useLiveQuery(() => db.userProfile.get('me'));
  const theme = profile?.preferences?.appTheme || 'noir';

  const updateTheme = async (newTheme: 'noir' | 'clay' | 'frost' | 'organic') => {
    if (profile) {
      await db.userProfile.update('me', {
        preferences: {
          ...profile.preferences,
          appTheme: newTheme
        }
      });
    }
  };

  const recipes = useLiveQuery(() => db.recipes.toArray());

  const filteredRecipes = useMemo(() => {
    if (!recipes) return [];
    return recipes.filter(recipe => {
      const lowerQuery = query.toLowerCase();
      const matchesQuery = !query || 
                          recipe.title.toLowerCase().includes(lowerQuery) ||
                          recipe.description.toLowerCase().includes(lowerQuery) ||
                          recipe.ingredients.some(ing => ing.name.toLowerCase().includes(lowerQuery));
      const matchesCategory = selectedCategory === 'All' || recipe.category === selectedCategory;
      const totalTime = recipe.prepTime + recipe.cookTime;
      const matchesTime = maxTime === 0 || totalTime <= maxTime;
      
      return matchesQuery && matchesCategory && matchesTime;
    });
  }, [recipes, query, selectedCategory, maxTime]);

  return (
    <div className="space-y-8 min-h-[80vh]">
      {/* Header & Search Bar */}
      <section className="pt-4 space-y-6 sticky top-0 bg-black/50 backdrop-blur-3xl z-40 -mx-6 px-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-zinc-500 uppercase tracking-[0.2em] text-[10px] font-semibold opacity-60 block mb-1">Index Retrieval</span>
            <h2 className="editorial-title text-4xl theme-text transition-colors duration-500">Discovery.</h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 group">
            <input 
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full glass-dark border border-white/5 rounded-2xl px-12 py-4 text-sm focus:outline-none focus:border-white/20 transition-all font-medium placeholder:opacity-40"
              placeholder="Search archives..."
            />
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            {query && (
              <button 
                onClick={() => setQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:text-white text-zinc-500"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-all ${showFilters ? 'bg-white border-white text-black shadow-xl ring-4 ring-white/10' : 'glass border-white/5 text-zinc-500 hover:text-zinc-300'}`}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden space-y-4"
            >
              <div className="p-4 rounded-3xl glass-dark border border-white/5 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <Clock className="w-3 h-3 text-zinc-500" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Temporal Constraints</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {TIME_LIMITS.map(limit => (
                      <button
                        key={limit.label}
                        onClick={() => setMaxTime(limit.value)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${
                          maxTime === limit.value 
                            ? 'bg-zinc-800 text-white border-white/20' 
                            : 'bg-white/5 text-zinc-500 border-white/5 hover:border-white/10'
                        }`}
                      >
                        {limit.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 pt-2 border-t border-white/5">
                  <div className="flex items-center gap-2 px-1">
                    <LayoutGrid className="w-3 h-3 text-zinc-500" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Visual Aesthetic</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'noir', color: 'bg-zinc-900', label: 'Noir' },
                      { id: 'clay', color: 'bg-[#ca9d9d]', label: 'Clay' },
                      { id: 'frost', color: 'bg-[#acaeda]', label: 'Frost' },
                      { id: 'organic', color: 'bg-[#a3b18a]', label: 'Organic' }
                    ].map(t => (
                      <button
                        key={t.id}
                        onClick={() => updateTheme(t.id as any)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${
                          theme === t.id 
                            ? 'bg-white text-black border-white' 
                            : 'bg-white/5 text-zinc-500 border-white/5 hover:text-white'
                        }`}
                      >
                        <div className={`w-2 h-2 rounded-full ${t.color}`} />
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Categories Quick Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all whitespace-nowrap ${
                selectedCategory === cat 
                  ? 'bg-white text-black border-white shadow-[0_5px_15px_rgba(255,255,255,0.2)]' 
                  : 'glass border-white/5 text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>


      </section>

      {/* Results Grid */}
      <section className="space-y-6 pb-20 -mt-8">
        <div className="flex items-center justify-between opacity-70">
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] theme-text transition-colors duration-500">Query Results</span>
            <div className="flex bg-white/5 p-0.5 rounded-lg border border-white/5">
              <button 
                onClick={() => setCols(1)}
                className={`p-1 rounded-md transition-all ${cols === 1 ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300 transform active:scale-95'}`}
                title="List View"
              >
                <List className="w-3 h-3" />
              </button>
              <button 
                onClick={() => setCols(2)}
                className={`p-1 rounded-md transition-all ${cols === 2 ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300 transform active:scale-95'}`}
                title="Grid View"
              >
                <LayoutGrid className="w-3 h-3" />
              </button>
            </div>
          </div>
          <span className="text-[10px] font-mono">{filteredRecipes.length} Found</span>
        </div>

        <motion.div 
          layout
          className={`grid gap-6 ${cols === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}
        >
          <AnimatePresence mode="popLayout">
            {filteredRecipes.map((recipe, index) => (
              <motion.div
                key={recipe.id}
                layout
                initial={{ opacity: 0, scale: 0.8, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ 
                  duration: 0.6, 
                  delay: (index % 6) * 0.05,
                  ease: [0.22, 1, 0.36, 1] 
                }}
              >
                <RecipeCard 
                  recipe={recipe} 
                  index={index} 
                  isCompact={cols > 1} 
                  theme={theme}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {filteredRecipes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 space-y-6 opacity-30">
            <div className="w-16 h-16 rounded-full border border-white/20 flex items-center justify-center">
              <SearchIcon className="w-6 h-6" />
            </div>
            <p className="font-display text-sm tracking-widest uppercase text-center">No Archives Match Sequence</p>
          </div>
        )}
      </section>
    </div>
  );
}
