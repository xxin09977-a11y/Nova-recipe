/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Recipe } from '../types';
import { Clock, Users, Star, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../lib/db';

interface RecipeCardProps {
  recipe: Recipe;
  index: number;
  isCompact?: boolean;
  theme?: 'noir' | 'clay' | 'frost' | 'organic';
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, index, isCompact }) => {
  const navigate = useNavigate();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressTriggered = useRef(false);

  const startPress = () => {
    isLongPressTriggered.current = false;
    timerRef.current = setTimeout(() => {
      isLongPressTriggered.current = true;
      setShowDeleteDialog(true);
    }, 2500); // 2.5 seconds
  };

  const endPress = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isLongPressTriggered.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    navigate(`/recipe/${recipe.id}`);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await db.recipes.delete(recipe.id);
    } catch (err) {
      console.error('Failed to delete recipe', err);
    } finally {
      setShowDeleteDialog(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ delay: index * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      onClick={handleClick}
      onPointerDown={startPress}
      onPointerUp={endPress}
      onPointerLeave={endPress}
      className={`group relative aspect-[4/5] rounded-[2.5rem] overflow-hidden glass-card three-d-card cursor-pointer transition-all duration-500`}
    >
      {/* Background Gradient & Image */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent z-10 pointer-events-none" />
      <motion.img
        src={recipe.image || `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=1000`}
        alt={recipe.title}
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out grayscale-[0.3] group-hover:grayscale-0"
        referrerPolicy="no-referrer"
      />

      {/* Meta Info Badge */}
      <div className="absolute top-6 right-6 z-20">
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="bg-black/60 backdrop-blur-2xl border border-white/10 px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-[0.2em] shadow-2xl"
        >
          {recipe.prepTime + recipe.cookTime}M • {recipe.difficulty}
        </motion.div>
      </div>

      {/* Card Content */}
      <div className={`absolute bottom-0 left-0 right-0 z-20 transition-transform duration-500 group-hover:-translate-y-2 ${isCompact ? 'p-4' : 'p-8'}`}>
        <div className="space-y-4">
          <span className={`theme-text font-bold uppercase tracking-[0.3em] opacity-80 group-hover:opacity-100 transition-colors ${isCompact ? 'text-[8px]' : 'text-[10px]'}`}>
            {recipe.category}
          </span>
          
          <h3 className={`editorial-title theme-text transition-colors leading-[0.85] ${isCompact ? 'text-xl' : 'text-4xl'}`}>
            {recipe.title}
          </h3>
          
          <div className={`flex items-center gap-6 pt-4 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0 ${isCompact ? 'hidden' : 'flex'}`}>
             <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{recipe.prepTime}m Prep</span>
             </div>
             <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{recipe.servings} Serves</span>
             </div>
          </div>
        </div>
      </div>
      
      {/* Decorative Blur Element */}
      <div className={`absolute -top-12 -right-12 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none group-hover:bg-white/10 transition-all duration-700`} />

      {/* Favorite Indicator Overlay */}
      {recipe.isFavorite && (
        <div className="absolute bottom-8 right-8 z-30">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-10 h-10 rounded-full glass border-white/20 flex items-center justify-center"
          >
            <Star className="w-4 h-4 text-white fill-white shadow-xl" />
          </motion.div>
        </div>
      )}

      {/* Delete Dialog Overlay */}
      <AnimatePresence>
        {showDeleteDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center"
            onClick={(e) => {
              e.stopPropagation();
            }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4 border border-red-500/20">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <h4 className="text-white font-display font-bold text-xl mb-2 tracking-tight">Delete Recipe?</h4>
            <p className="text-xs text-zinc-400 mb-8">This action cannot be undone.</p>
            <div className="flex gap-4 w-full">
              <button 
                onClick={(e) => { e.stopPropagation(); setShowDeleteDialog(false); }}
                className="flex-1 py-3 rounded-2xl glass text-xs font-bold uppercase tracking-wider text-white hover:bg-white/10 transition-colors"
                autoFocus
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete}
                className="flex-1 py-3 rounded-2xl bg-red-500 text-white text-xs font-bold uppercase tracking-wider hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
              >
                Delete
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default RecipeCard;
