/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Info, Check, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../lib/db';
import { Ingredient, Instruction } from '../types';

const COMMON_INGREDIENTS = [
  { name: 'Flour', sub: 'Almond flour for gluten-free' },
  { name: 'Sugar', sub: 'Stevia or Honey' },
  { name: 'Butter', sub: 'Coconut oil or Vegan butter' },
  { name: 'Milk', sub: 'Oat milk or Almond milk' },
  { name: 'Egg', sub: 'Flax egg or Applesauce' },
  { name: 'Chicken', sub: 'Tofu or Tempeh' },
  { name: 'Beef', sub: 'Seitan or Lentils' },
  { name: 'Salt', sub: 'Miso or Seaweed' },
  { name: 'Olive Oil', sub: 'Avocado oil' },
  { name: 'Garlic', sub: 'Shallots' },
  { name: 'Onion', sub: 'Leek' },
];

export default function AddRecipe() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');
  const [image, setImage] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [instructions, setInstructions] = useState<Instruction[]>([]);
  
  // Local state for new entries
  const [newIngredientName, setNewIngredientName] = useState('');
  const [newIngredientAmount, setNewIngredientAmount] = useState('');
  const [newIngredientUnit, setNewIngredientUnit] = useState('');
  const [newInstructionText, setNewInstructionText] = useState('');

  const [historicalIngredients, setHistoricalIngredients] = useState<Record<string, {name: string, sub?: string, commonUnits: string[]}>>({});

  useEffect(() => {
    db.recipes.toArray().then(recipes => {
      const hist: Record<string, {name: string, sub?: string, commonUnits: string[]}> = {};
      
      COMMON_INGREDIENTS.forEach(i => {
        hist[i.name.toLowerCase()] = {
          name: i.name,
          sub: i.sub,
          commonUnits: []
        };
      });

      recipes.forEach(r => {
        r.ingredients?.forEach(ing => {
          const key = ing.name.toLowerCase();
          if (!hist[key]) {
            hist[key] = {
              name: ing.name,
              commonUnits: []
            };
          }
          if (ing.unit && !hist[key].commonUnits.includes(ing.unit.toLowerCase())) {
            hist[key].commonUnits.push(ing.unit.toLowerCase());
          }
        });
      });
      setHistoricalIngredients(hist);
    });
  }, []);

  const activeIngredientData = useMemo(() => {
    return historicalIngredients[newIngredientName.toLowerCase()];
  }, [newIngredientName, historicalIngredients]);

  const activeSub = activeIngredientData?.sub;

  const suggestions = useMemo(() => {
    if (!newIngredientName) return [];
    const searchName = newIngredientName.toLowerCase();
    
    return Object.values(historicalIngredients)
      .filter(i => i.name.toLowerCase().includes(searchName) && i.name.toLowerCase() !== searchName)
      .sort((a, b) => {
        const aStarts = a.name.toLowerCase().startsWith(searchName) ? -1 : 1;
        const bStarts = b.name.toLowerCase().startsWith(searchName) ? -1 : 1;
        if (aStarts !== bStarts) return aStarts - bStarts;
        return a.name.localeCompare(b.name);
      })
      .slice(0, 5);
  }, [newIngredientName, historicalIngredients]);

  useEffect(() => {
    if (id) {
      db.recipes.get(id).then((recipe) => {
        if (recipe) {
          setTitle(recipe.title);
          setDescription(recipe.description);
          setCategory(recipe.category);
          setImage(recipe.image || '');
          setIngredients(recipe.ingredients || []);
          setInstructions(recipe.instructions || []);
        }
      });
    }
  }, [id]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 600;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          // Compress as JPEG
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setImage(dataUrl);
          setIsCompressing(false);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Compression failed', err);
      setIsCompressing(false);
    }
  };

  const handleAddIngredient = () => {
    if (!newIngredientName || !newIngredientAmount) return;
    setIngredients([...ingredients, {
      id: Math.random().toString(36).substr(2, 9),
      name: newIngredientName,
      amount: parseFloat(newIngredientAmount),
      unit: newIngredientUnit
    }]);
    setNewIngredientName('');
    setNewIngredientAmount('');
    setNewIngredientUnit('');
  };

  const handleAddInstruction = () => {
    if (!newInstructionText) return;
    setInstructions([...instructions, {
      step: instructions.length + 1,
      text: newInstructionText
    }]);
    setNewInstructionText('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    if (id) {
      await db.recipes.update(id, {
        title,
        description,
        image,
        category,
        ingredients,
        instructions,
        updatedAt: new Date().toISOString(),
      });
    } else {
      await db.recipes.add({
        id: Math.random().toString(36).substr(2, 9),
        title,
        description,
        image,
        prepTime: 15, // Default for now
        cookTime: 15, // Default for now
        servings: 2,
        difficulty: 'Medium',
        category,
        ingredients,
        instructions,
        isFavorite: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    navigate(id ? `/recipe/${id}` : '/');
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Header */}
      <section className="flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full glass flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <span className="text-zinc-500 uppercase tracking-[0.2em] text-[10px] font-semibold opacity-60 block">Editor v1.0</span>
          <h2 className="font-display text-4xl font-bold tracking-tighter">{id ? 'EDIT ARCHIVE.' : 'NEW ARCHIVE.'}</h2>
        </div>
      </section>

      <form onSubmit={handleSubmit} className="space-y-12">
        {/* Core Info */}
        <section className="space-y-8">
          <div className="space-y-4">
            <label className="text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-600 ml-1">Protocol Identification</label>
            <input 
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Archive Title..." 
              className="w-full glass-dark border border-white/5 rounded-3xl px-8 py-6 focus:outline-none focus:border-white/20 transition-all font-display text-3xl font-bold tracking-tighter placeholder:opacity-20"
            />
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-600 ml-1">Visual Reference (Offline Optimized)</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative group">
                <input 
                  type="text"
                  value={image.startsWith('data:') ? 'Image stored locally' : image}
                  onChange={e => setImage(e.target.value)}
                  placeholder="Paste URL or upload below..." 
                  className="w-full glass-dark border border-white/5 rounded-3xl px-8 py-5 pl-14 focus:outline-none focus:border-white/20 transition-all text-xs font-mono tracking-tight"
                />
                <ImageIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
              </div>
              
              <div className="relative">
                <input 
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className={`w-full glass border border-white/5 rounded-3xl px-8 py-5 flex items-center justify-center gap-3 text-xs font-bold uppercase tracking-widest transition-all ${isCompressing ? 'animate-pulse opacity-50' : 'hover:bg-white/5'}`}>
                  {isCompressing ? 'Optimizing Architecture...' : <><Plus className="w-4 h-4" /> Upload Sequence</>}
                </div>
              </div>
            </div>

            {image && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative aspect-video rounded-[2.5rem] overflow-hidden mt-4 border border-white/10 shadow-3xl group"
              >
                <img src={image} alt="Preview" className="w-full h-full object-cover grayscale-[0.2]" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <button 
                  type="button"
                  onClick={() => setImage('')}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full glass flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/20 text-white"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                {image.startsWith('data:') && (
                  <div className="absolute bottom-6 left-6 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[8px] font-bold uppercase tracking-widest text-zinc-300">Offline Synced</span>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </section>

        {/* Ingredients section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-display font-bold text-xl tracking-tight">Ingredients</h3>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-none">Archive Total: {ingredients.length}</span>
          </div>

          {/* New Ingredient Form */}
          <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 space-y-4">
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-6 relative">
                <input 
                  type="text"
                  value={newIngredientName}
                  onChange={e => setNewIngredientName(e.target.value)}
                  placeholder="Ingredient"
                  className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none"
                />
                {/* Auto-complete Suggestions */}
                <AnimatePresence>
                  {suggestions.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 right-0 z-30 mt-2 glass rounded-xl overflow-hidden shadow-2xl"
                    >
                      {suggestions.map(s => (
                        <button
                          key={s.name}
                          type="button"
                          onClick={() => setNewIngredientName(s.name)}
                          className="w-full text-left px-4 py-3 text-xs hover:bg-white/10 transition-colors border-b border-white/5 last:border-0"
                        >
                          {s.name}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <input 
                type="number"
                value={newIngredientAmount}
                onChange={e => setNewIngredientAmount(e.target.value)}
                placeholder="Qty"
                className="col-span-3 bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none"
              />
              <input 
                type="text"
                value={newIngredientUnit}
                onChange={e => setNewIngredientUnit(e.target.value)}
                placeholder="Unit"
                className="col-span-3 bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none"
              />
            </div>

            {/* Unit Suggestions */}
            <AnimatePresence>
              {activeIngredientData?.commonUnits && activeIngredientData.commonUnits.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex flex-wrap gap-2 pt-1 pb-2">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold self-center mr-1">Common Units:</span>
                    {activeIngredientData.commonUnits.map(unit => (
                      <button
                        key={unit}
                        type="button"
                        onClick={() => setNewIngredientUnit(unit)}
                        className={`px-3 py-1 rounded-full border text-xs transition-colors cursor-pointer ${
                          newIngredientUnit === unit 
                            ? 'bg-white text-black border-white' 
                            : 'glass border-white/5 hover:bg-white/10 text-white'
                        }`}
                      >
                        {unit}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Substitution Tip */}
            <AnimatePresence>
              {activeSub && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex gap-3 p-3 rounded-xl bg-zinc-900/50 border border-zinc-800 text-[10px]">
                    <Info className="w-3 h-3 text-white shrink-0" />
                    <p className="text-zinc-400 italic">Substitution hint: {activeSub}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button 
              type="button"
              onClick={handleAddIngredient}
              className="w-full py-3 bg-white text-black text-xs font-bold uppercase tracking-widest rounded-xl hover:scale-[1.02] active:scale-95 transition-all"
            >
              Add Component
            </button>
          </div>

          <div className="space-y-2">
            {ingredients.map(ing => (
              <motion.div 
                layout
                key={ing.id} 
                className="flex items-center justify-between p-4 rounded-xl glass x-border group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                  <span className="text-sm font-medium tracking-tight">
                    {ing.amount}{ing.unit} <span className="text-zinc-500 ml-1">{ing.name}</span>
                  </span>
                </div>
                <button 
                  onClick={() => setIngredients(ingredients.filter(i => i.id !== ing.id))}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Instructions */}
        <section className="space-y-4">
          <h3 className="font-display font-bold text-xl tracking-tight">Protocol</h3>
          
          <div className="space-y-4">
            <textarea 
              value={newInstructionText}
              onChange={e => setNewInstructionText(e.target.value)}
              placeholder="Next sequence..."
              className="w-full bg-zinc-900 border border-white/5 rounded-2xl px-6 py-4 focus:outline-none focus:border-white/20 transition-colors text-sm min-h-[100px] resize-none"
            />
            <button 
              type="button"
              onClick={handleAddInstruction}
              className="w-full py-3 glass text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-white/5 transition-all"
            >
              Log Sequence
            </button>
          </div>

          <div className="space-y-4 relative">
            <div className="absolute left-[19px] top-4 bottom-4 w-px bg-white/5" />
            {instructions.map((inst, index) => (
              <div key={index} className="flex gap-4 relative">
                <div className="w-10 h-10 rounded-full glass border-white/10 flex items-center justify-center shrink-0 text-[10px] font-bold z-10">
                  {inst.step}
                </div>
                <div className="flex-1 pt-2">
                  <p className="text-sm text-zinc-400 leading-relaxed">{inst.text}</p>
                </div>
                <button 
                  onClick={() => setInstructions(instructions.filter((_, i) => i !== index))}
                  className="p-1 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Final Submit */}
        <section className="pt-8 flex flex-col gap-4">
          <button 
            type="submit"
            className="w-full h-14 bg-white text-black font-bold text-xs tracking-[0.2em] uppercase flex items-center justify-center rounded-full shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:scale-[1.02] active:scale-95 transition-all"
          >
            {id ? 'Update Archive' : 'Commit Archive'} <Check className="ml-2 w-4 h-4" />
          </button>
          <p className="text-[10px] text-zinc-500 text-center uppercase tracking-widest font-medium">
            Changes are permanent and stored locally.
          </p>
        </section>
      </form>
    </div>
  );
}
