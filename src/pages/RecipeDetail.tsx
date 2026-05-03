/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Heart, Share2, Clock, Users, Timer, 
  ChevronRight, CheckCircle2, Play, Pause, RotateCcw,
  Edit, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import FeatureErrorBoundary from '../components/FeatureErrorBoundary';

export default function RecipeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const recipe = useLiveQuery(() => db.recipes.get(id || ''));
  
  const [scaleMultiplier, setScaleMultiplier] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isFavorite, setIsFavorite] = useState(false);
  const [showCopied, setShowCopied] = useState(false);

  useEffect(() => {
    if (recipe) {
      setIsFavorite(recipe.isFavorite);
    }
  }, [recipe]);

  if (!recipe) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
    </div>
  );

  const toggleStep = (index: number) => {
    const next = new Set(completedSteps);
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    setCompletedSteps(next);
  };

  const progressPercentage = recipe.instructions.length > 0 
    ? (completedSteps.size / recipe.instructions.length) * 100 
    : 0;

  // Scaling Factor
  const ratio = scaleMultiplier;

  const scaleValue = (val: number) => {
    return (val * ratio).toFixed(1).replace(/\.0$/, '');
  };

  // Scaled Times
  const scaledPrepTime = Math.round(recipe.prepTime * ratio);
  const scaledCookTime = Math.round(recipe.cookTime * ratio);
  const totalTime = scaledPrepTime + scaledCookTime;

  const toggleFavorite = async () => {
    if (!recipe) return;
    setIsFavorite(!isFavorite);
    await db.recipes.update(recipe.id, { isFavorite: !isFavorite });
  };

  const handleShare = async () => {
    if (!recipe) return;

    const ingredientsText = recipe.ingredients
      .map(ing => `- ${scaleValue(ing.amount)} ${ing.unit} ${ing.name}`)
      .join('\n');
    
    const instructionsText = recipe.instructions
      .map(inst => `${inst.step}. ${inst.text}`)
      .join('\n\n');

    const fullRecipeText = `${recipe.title}\n\n${recipe.description}\n\nINGREDIENTS:\n${ingredientsText}\n\nINSTRUCTIONS:\n${instructionsText}`;

    const triggerCopied = () => {
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    };

    if (navigator.share && /mobile|android|iphone|ipad|tablet/i.test(navigator.userAgent)) {
      try {
        await navigator.share({
          title: `KitchenOS: ${recipe.title}`,
          text: fullRecipeText,
          url: window.location.href,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Sharing failed', err);
          try {
            await navigator.clipboard.writeText(`${fullRecipeText}\n\nView online: ${window.location.href}`);
            triggerCopied();
          } catch (e) {
            console.error('Clipboard fallback failed', e);
          }
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${fullRecipeText}\n\nView online: ${window.location.href}`);
        triggerCopied();
      } catch (err) {
        console.error('Clipboard failed', err);
        // Fallback for secure context issues in iframe
        const textArea = document.createElement("textarea");
        textArea.value = `${fullRecipeText}\n\nView online: ${window.location.href}`;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand('copy');
          triggerCopied();
        } catch (e) {
          console.error('execCommand copy failed', e);
        }
        document.body.removeChild(textArea);
      }
    }
  };

  return (
    <div className="space-y-8 pb-32">
      {/* Header Actions */}
      <section className="flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full glass flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex gap-3">
          <button 
            onClick={() => navigate(`/edit/${recipe.id}`)}
            className="w-10 h-10 rounded-full glass flex items-center justify-center transition-transform hover:bg-white/10"
          >
            <Edit className="w-4 h-4 opacity-60" />
          </button>
          <button 
            onClick={handleShare}
            className={`w-10 h-10 rounded-full glass flex items-center justify-center active:scale-90 transition-all ${showCopied ? 'bg-green-500/20 text-green-400' : 'hover:bg-white/10'}`}
          >
            {showCopied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4 opacity-60" />}
          </button>
          <button 
            onClick={toggleFavorite}
            className={`w-10 h-10 rounded-full glass flex items-center justify-center transition-colors ${isFavorite ? 'text-red-500' : 'text-white'}`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : 'opacity-60'}`} />
          </button>
        </div>
      </section>

      {/* Hero Section */}
      <section className="space-y-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative aspect-[4/5] rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl group"
        >
          <img 
            src={recipe.image || `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=1000`} 
            className="w-full h-full object-cover grayscale-[0.2] transition-transform duration-1000 group-hover:scale-110 group-hover:grayscale-0"
            alt={recipe.title}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
          <div className="absolute bottom-10 left-10 right-10">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="flex gap-2 mb-4"
            >
              <span className="px-3 py-1 glass-dark rounded-full text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                {recipe.category}
              </span>
              <span className="px-3 py-1 glass-dark rounded-full text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                {recipe.difficulty}
              </span>
            </motion.div>
            <h2 className="editorial-title text-6xl leading-[0.8] mb-2">{recipe.title}</h2>
          </div>
        </motion.div>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-zinc-400 text-lg italic font-medium leading-relaxed max-w-sm"
        >
          {recipe.description}
        </motion.p>
      </section>

      {/* Stats, Scaling & Ingredients */}
      <section className="bg-zinc-900/50 p-6 rounded-[2.5rem] border border-white/5 space-y-6">
        <div className="flex flex-col items-center text-center pb-6 border-b border-white/5">
          <div className="w-12 h-12 rounded-full glass flex items-center justify-center mb-4 text-white">
            <Clock className="w-6 h-6" />
          </div>
          <div className="text-6xl font-display font-bold tracking-tighter mb-2">{totalTime}<span className="text-2xl text-zinc-500 ml-1">min</span></div>
          <p className="text-[10px] text-zinc-500 uppercase tracking-[0.3em] font-bold">Estimated Total Time</p>
          <div className="flex gap-4 mt-4 text-xs font-mono text-zinc-400">
            <span>Prep: {scaledPrepTime}m</span>
            <span>•</span>
            <span>Cook: {scaledCookTime}m</span>
          </div>
        </div>

        <div className="flex flex-col items-center pb-6 border-b border-white/5">
          <div className="flex items-center gap-6 glass p-2 rounded-full x-border">
            <button 
              onClick={() => scaleMultiplier > 0.5 && setScaleMultiplier(prev => prev - 0.5)}
              className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 hover:text-white transition-all text-zinc-400 active:scale-95 text-xl"
            >
              -
            </button>
            <div className="flex flex-col items-center min-w-[80px]">
               <div className="flex items-center gap-2 mb-1">
                 <Users className="w-4 h-4 text-zinc-500" />
                 <span className="text-3xl font-display font-bold tabular-nums">{scaleMultiplier}x</span>
               </div>
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Scaling</span>
            </div>
            <button 
              onClick={() => setScaleMultiplier(prev => prev + 0.5)}
              className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 hover:text-white transition-all text-zinc-400 active:scale-95 text-xl"
            >
              +
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-display font-bold text-lg tracking-tight">Scaled Ingredients</h3>
          </div>
          <div className="space-y-2">
            {recipe.ingredients.map(ing => (
              <div key={ing.id} className="flex items-center justify-between p-4 rounded-xl glass border border-white/5 shadow-inner">
                <span className="text-sm font-medium">{ing.name}</span>
                <motion.span 
                  key={scaleMultiplier}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-sm text-zinc-400 font-display font-bold"
                >
                  {scaleValue(ing.amount)} {ing.unit}
                </motion.span>
              </div>
            ))}
            {recipe.ingredients.length === 0 && (
              <p className="text-zinc-600 text-xs italic px-2">No specific ingredients archived.</p>
            )}
          </div>
        </div>
      </section>

      {/* Preparation Steps */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-xl tracking-tight">Protocol</h3>
          <div className="text-[10px] font-mono text-zinc-500 bg-white/5 px-3 py-1 rounded-full border border-white/5 uppercase tracking-widest">
            {completedSteps.size} / {recipe.instructions.length} resolved
          </div>
        </div>

        {/* Protocol Progress Bar */}
        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden relative">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            className="absolute top-0 left-0 h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.4)]"
          />
        </div>

        <div className="space-y-6 relative">
          <div className="absolute left-[19px] top-4 bottom-4 w-px bg-white/5" />
          {recipe.instructions.map((inst, index) => {
            const isCompleted = completedSteps.has(index);
            return (
              <motion.div 
                key={index} 
                className={`flex gap-4 relative cursor-pointer transition-all duration-500 group ${isCompleted ? 'opacity-40 grayscale-[0.5]' : 'opacity-100'}`}
                onClick={() => toggleStep(index)}
                whileTap={{ scale: 0.98 }}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold z-10 transition-all duration-300 ${isCompleted ? 'bg-green-500 text-black shadow-[0_0_20px_rgba(34,197,94,0.3)]' : 'glass border-white/10 text-white group-hover:border-white/30'}`}>
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : inst.step}
                </div>
                <div className="flex-1 pt-2">
                  <p className={`text-sm font-medium leading-relaxed transition-all ${isCompleted ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>
                    {inst.text}
                  </p>
                  
                  {isCompleted && (
                    <motion.div 
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="mt-2 text-[9px] font-bold uppercase tracking-[0.2em] text-green-500/60"
                    >
                      Step Verified
                    </motion.div>
                  )}
                </div>
              </motion.div>
            );
          })}
          {recipe.instructions.length === 0 && (
            <p className="text-zinc-600 text-xs italic">No sequences documented for this archive.</p>
          )}
        </div>
      </section>

      {/* Integrated Timer Component */}
      <FeatureErrorBoundary featureName="Process Clock">
        <CookingTimer defaultTime={scaledCookTime * 60} />
      </FeatureErrorBoundary>
    </div>
  );
}

function CookingTimer({ defaultTime }: { defaultTime: number }) {
  const [timeLeft, setTimeLeft] = useState(defaultTime);
  const [isActive, setIsActive] = useState(false);
  
  useEffect(() => {
    setTimeLeft(defaultTime);
    setIsActive(false);
  }, [defaultTime]);

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const progress = defaultTime > 0 ? ((defaultTime - timeLeft) / defaultTime) * 100 : 0;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <section className="fixed bottom-28 left-6 right-6 z-50">
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass-dark x-border rounded-3xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-3xl overflow-hidden relative"
      >
        {/* Progress Bar Background */}
        <div className="absolute bottom-0 left-0 h-1.5 bg-white/10 w-full" />
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: "linear" }}
          className="absolute bottom-0 left-0 h-1.5 bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)]" 
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center shadow-2xl">
              <Timer className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] leading-none mb-2">Process Clock</div>
              <div className="text-3xl font-display font-bold leading-none tabular-nums tracking-tighter">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={() => {
                setTimeLeft(defaultTime);
                setIsActive(false);
              }}
              className="w-12 h-12 glass rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setIsActive(!isActive)}
              className={`h-12 px-8 rounded-full font-bold text-[10px] uppercase tracking-[0.2em] flex items-center gap-3 transition-all ${
                isActive 
                  ? 'glass border-white/20 text-white' 
                  : 'bg-white text-black shadow-2xl scale-105'
              }`}
            >
              {isActive ? <><Pause className="w-3.5 h-3.5 fill-current" /> Hold</> : <><Play className="w-3.5 h-3.5 fill-current" /> Engage</>}
            </button>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
