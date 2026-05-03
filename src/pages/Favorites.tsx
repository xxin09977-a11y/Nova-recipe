/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import RecipeCard from '../components/RecipeCard';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { motion } from 'motion/react';
import { Bookmark } from 'lucide-react';

export default function Favorites() {
  const favoriteRecipes = useLiveQuery(() => db.recipes.where('isFavorite').equals(1).toArray());

  return (
    <div className="space-y-12">
      <section className="pt-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="text-zinc-500 uppercase tracking-[0.2em] text-[10px] font-semibold opacity-60 block mb-2">Vault v1.0.42</span>
          <h2 className="editorial-title mb-6">
            SAVED<br />
            <span className="text-zinc-500 text-5xl">ARCHIVES.</span>
          </h2>
          <p className="text-zinc-400 text-lg max-w-xs leading-tight font-medium">
            Your curated collection of high-performance culinary protocols.
          </p>
        </motion.div>
      </section>

      <section className="grid grid-cols-1 gap-10">
        {favoriteRecipes?.map((recipe, index) => (
          <RecipeCard key={recipe.id} recipe={recipe} index={index} />
        ))}
        {favoriteRecipes && favoriteRecipes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 space-y-6 opacity-30">
            <div className="w-16 h-16 rounded-full border border-white/20 flex items-center justify-center">
              <Bookmark className="w-6 h-6" />
            </div>
            <p className="font-display text-sm tracking-widest uppercase text-center">No Favorites Logged</p>
          </div>
        )}
      </section>
    </div>
  );
}
