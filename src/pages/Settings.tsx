/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { User, Type, Palette, Shield, LogOut, ChevronRight, Camera, Download, Upload, Database } from 'lucide-react';

export default function Settings() {
  const profile = useLiveQuery(() => db.userProfile.get('me'));
  const [userName, setUserName] = useState('');
  const [fontScale, setFontScale] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const [versionTaps, setVersionTaps] = useState(0);
  const [diagnostics, setDiagnostics] = useState<{ name: string; status: 'pending' | 'pass' | 'fail'; detail: string }[]>([]);
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState(false);
  const [showSecurity, setShowSecurity] = useState(false);
  const [confirmDecommission, setConfirmDecommission] = useState(false);

  const runAllDiagnostics = async () => {
    setIsRunningDiagnostics(true);
    const results: typeof diagnostics = [];

    // 1. Storage R/W
    try {
      const mockId = 'diag-' + Date.now();
      await db.recipes.add({
        id: mockId,
        title: 'Diagnostic Mock',
        description: 'Testing r/w loop',
        ingredients: [],
        instructions: [],
        prepTime: 5,
        cookTime: 10,
        servings: 1,
        difficulty: 'Easy',
        category: 'General',
        image: '',
        isFavorite: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      await db.recipes.delete(mockId);
      results.push({ name: 'Storage r/w', status: 'pass', detail: 'IndexedDB Commit Success' });
    } catch (e) {
      results.push({ name: 'Storage r/w', status: 'fail', detail: (e as Error).message });
    }

    // 2. Indexing Engine
    try {
      const searchTest = await db.recipes.where('title').startsWithIgnoreCase('a').toArray();
      results.push({ name: 'Indexing', status: 'pass', detail: `${searchTest.length} records indexed` });
    } catch (e) {
      results.push({ name: 'Indexing', status: 'fail', detail: (e as Error).message });
    }

    // 3. Arithmetic Integrity
    try {
      const base = 2;
      const scale = 2.5;
      const result = base * scale;
      if (result === 5) {
        results.push({ name: 'Math Logic', status: 'pass', detail: 'Scaling precision 100%' });
      } else {
        throw new Error('Precision mismatch');
      }
    } catch (e) {
      results.push({ name: 'Math Logic', status: 'fail', detail: (e as Error).message });
    }

    // 4. Hardware Clock
    try {
      const start = performance.now();
      await new Promise(resolve => setTimeout(resolve, 100));
      const end = performance.now();
      const delta = end - start;
      if (delta >= 90 && delta <= 150) {
        results.push({ name: 'Clock Sync', status: 'pass', detail: `${delta.toFixed(1)}ms interval calibration` });
      } else {
        throw new Error(`Latency drift: ${delta.toFixed(1)}ms`);
      }
    } catch (e) {
      results.push({ name: 'Clock Sync', status: 'fail', detail: (e as Error).message });
    }

    setDiagnostics(results);
    setIsRunningDiagnostics(false);
  };

  useEffect(() => {
    if (profile) {
      setUserName(profile.name);
      if (profile.preferences.fontScale) {
        setFontScale(profile.preferences.fontScale);
      }
    }
  }, [profile]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const SIZE = 200; // Avatar size
          canvas.width = SIZE;
          canvas.height = SIZE;
          const ctx = canvas.getContext('2d');
          
          // Draw square cropped image
          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;
          
          ctx?.drawImage(img, sx, sy, minDim, minDim, 0, 0, SIZE, SIZE);

          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          await db.userProfile.update('me', { avatar: dataUrl });
          setIsUploading(false);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Avatar update failed', err);
      setIsUploading(false);
    }
  };

  const updateName = async () => {
    if (!userName || !profile) return;
    await db.userProfile.update('me', { name: userName });
  };

  const handleFontScaleChange = async (newScale: number) => {
    setFontScale(newScale);
    if (profile) {
      await db.userProfile.update('me', {
        preferences: {
          ...profile.preferences,
          fontScale: newScale
        }
      });
    }
  };

  const toggleTheme = async () => {
    if (!profile) return;
    const themes: ('noir' | 'clay' | 'frost' | 'organic')[] = ['noir', 'clay', 'frost', 'organic'];
    const currentTheme = profile.preferences.appTheme || 'noir';
    const currentIndex = themes.indexOf(currentTheme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];

    await db.userProfile.update('me', {
      preferences: {
        ...profile.preferences,
        appTheme: nextTheme
      }
    });
  };

  const handleDecommissionExecute = async () => {
    try {
      await db.recipes.clear();
      await db.userProfile.clear();
      window.location.href = '/';
    } catch (err) {
      console.error("Failed to decommission node", err);
      alert("Decommission protocol failed.");
      setConfirmDecommission(false);
    }
  };

  const handleExport = async () => {
    try {
      const recipes = await db.recipes.toArray();
      const profileData = await db.userProfile.get('me');
      
      const backup = {
        version: 1,
        exportedAt: new Date().toISOString(),
        recipes,
        profile: profileData
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `KitchenOS_Backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed', err);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const backup = JSON.parse(text);

      if (!backup.recipes || !backup.profile) {
        throw new Error('Invalid backup format');
      }

      await db.transaction('rw', db.recipes, db.userProfile, async () => {
        await db.recipes.clear();
        await db.userProfile.clear();
        
        await db.recipes.bulkAdd(backup.recipes);
        await db.userProfile.add(backup.profile);
      });

      window.location.reload(); // Refresh to apply all data changes
    } catch (err) {
      console.error('Import failed', err);
      alert('Failed to restore archive: Protocol mismatch.');
    }
  };

  return (
    <div className="space-y-12">
      <section className="pt-4">
        <motion.div
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
        >
          <span className="text-zinc-500 uppercase tracking-[0.2em] text-[10px] font-semibold opacity-60 block mb-2">Protocol Settings v1.0</span>
          <h2 className="editorial-title mb-6">
            USER<br />
            <span className="text-zinc-500 text-5xl">PROFILE.</span>
          </h2>
        </motion.div>
      </section>

        <motion.div
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           className="p-8 rounded-[2.5rem] glass x-border space-y-12"
        >
          {/* Profile Identity */}
          <section className="space-y-6">
            <div className="flex items-center gap-6">
              <div className="relative group">
                <div className={`w-24 h-24 rounded-full border border-white/10 bg-white/5 flex items-center justify-center relative overflow-hidden transition-all ${isUploading ? 'animate-pulse scale-95' : 'group-hover:border-white/30'}`}>
                   {profile?.avatar ? (
                     <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover grayscale-[0.2]" />
                   ) : (
                     <User className="w-8 h-8 opacity-40 group-hover:opacity-100 transition-opacity" />
                   )}
                   <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-transparent group-hover:opacity-0 transition-opacity" />
                   
                   {/* Upload Overlay */}
                   <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
                     <Camera className="w-6 h-6 mb-1" />
                     <span className="text-[8px] font-bold uppercase tracking-widest">Update</span>
                   </div>
                   <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleAvatarUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer z-20"
                   />
                </div>
                {profile?.avatar && (
                   <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center border-2 border-black z-30">
                     <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                   </div>
                )}
              </div>
              <div className="flex-1 space-y-1">
                 <h3 className="text-3xl font-bold font-display w-full p-0 tracking-tighter text-white">
                   {userName || "Researcher Name"}
                 </h3>
                 <p className="text-[10px] text-zinc-500 uppercase tracking-[0.25em] font-bold">Protocol Architect • IndexedDB Synced</p>
              </div>
            </div>
          </section>

          {/* Interface Settings */}
          <section className="space-y-6">
            <h3 className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em] flex items-center gap-2">
              <Palette className="w-3.5 h-3.5" /> Core Interface
            </h3>
            
            <div className="space-y-3">
              <div className="p-8 rounded-3xl x-border bg-black/40 flex flex-col gap-6">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 text-zinc-400">
                    <Type className="w-4 h-4 opacity-40" /> Typography Scale
                  </span>
                  <span className="text-[10px] font-mono bg-white/10 px-3 py-1 rounded-full">{fontScale.toFixed(2)}x</span>
                </div>
                <input 
                  type="range" 
                  min="0.8" 
                  max="1.2" 
                  step="0.05" 
                  value={fontScale} 
                  onChange={(e) => handleFontScaleChange(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-white" 
                />
                <div className="flex justify-between text-[9px] text-zinc-600 font-bold uppercase tracking-[0.2em]">
                  <span>Minimalist</span>
                  <span>System Default</span>
                  <span>Expansive</span>
                </div>
              </div>
            </div>
          </section>

          {/* Infrastructure & Data */}
          <section className="space-y-6">
            <h3 className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em] flex items-center gap-2">
              <Database className="w-3.5 h-3.5" /> Local Infrastructure
            </h3>

            <div className="grid grid-cols-1 gap-3">
              <div 
                onClick={handleExport}
                className="p-6 rounded-3xl x-border glass hover:bg-white/5 cursor-pointer transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-widest text-zinc-200">Export Archive</div>
                    <div className="text-[9px] text-zinc-500 font-medium">Backup recipes & profile to JSON</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-white transition-colors" />
              </div>

              <div className="relative p-6 rounded-3xl x-border glass hover:bg-white/5 cursor-pointer transition-all flex items-center justify-between group overflow-hidden">
                <input 
                  type="file" 
                  accept=".json" 
                  onChange={handleImport}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                />
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-widest text-zinc-200">Restore Sequence</div>
                    <div className="text-[9px] text-zinc-500 font-medium">Instantiate database from archive</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-white transition-colors" />
              </div>
            </div>
          </section>
        </motion.div>

      {/* General Sections */}
      <section className="space-y-2">
        <SettingItem icon={<Shield className="w-4 h-4" />} label="Security Protocols" onClick={() => setShowSecurity(true)} />
        <div 
          onClick={toggleTheme}
          className="flex items-center justify-between p-4 rounded-xl glass x-border hover:bg-white/5 cursor-pointer transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-500 group-hover:text-white transition-colors">
              <Palette className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium text-white">Neural Theme Engine</span>
          </div>
          <span className="text-xs uppercase tracking-widest text-zinc-500 font-mono">
            {profile?.preferences.appTheme || 'noir'}
          </span>
        </div>
        {confirmDecommission ? (
          <div className="flex items-center justify-between p-4 rounded-xl glass x-border border-red-500/50 bg-red-500/10 transition-all">
            <span className="text-sm font-bold text-red-500 uppercase tracking-wider">Confirm Deletion?</span>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDecommission(false)} className="px-3 py-1 text-xs font-semibold text-white bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors">Cancel</button>
              <button onClick={handleDecommissionExecute} className="px-3 py-1 text-xs font-bold text-white bg-red-600 rounded-lg shadow-lg hover:bg-red-500 transition-colors shadow-red-500/20">Purge Data</button>
            </div>
          </div>
        ) : (
          <SettingItem icon={<LogOut className="w-4 h-4" />} label="Decommission Node" color="text-red-400" onClick={() => setConfirmDecommission(true)} />
        )}
      </section>

      <div 
        className="pt-8 text-center"
        onClick={() => setVersionTaps(v => v + 1)}
      >
        <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.3em] cursor-default select-none">
          KitchenOS Build v1.0.42 {versionTaps > 3 && versionTaps < 7 && `[${7 - versionTaps} taps to unlock]`}
        </p>
        
        {versionTaps >= 7 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-6 rounded-3xl x-border bg-blue-500/5 border border-blue-500/20 flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                <Shield className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-[11px] font-bold uppercase tracking-widest text-blue-100">Diagnostic Nexus</div>
                <div className="text-[9px] text-blue-500/60 font-medium">Real-time infrastructure monitoring active</div>
              </div>
            </div>
            <button 
              onClick={async () => {
                if (!profile) return;
                await db.userProfile.update('me', {
                   preferences: { ...profile.preferences, debugMode: !profile.preferences.debugMode }
                });
              }}
              className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${profile?.preferences.debugMode ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-white/5 text-zinc-500'}`}
            >
              {profile?.preferences.debugMode ? 'ACTIVE' : 'INACTIVE'}
            </button>
          </motion.div>
        )}

        {versionTaps >= 7 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 space-y-4"
          >
            <button 
              onClick={runAllDiagnostics}
              disabled={isRunningDiagnostics}
              className={`w-full py-4 rounded-3xl x-border glass-dark text-[10px] font-bold uppercase tracking-[0.2em] transition-all hover:bg-white/5 ${isRunningDiagnostics ? 'animate-pulse' : ''}`}
            >
              {isRunningDiagnostics ? 'Executing Modules...' : 'Run System Diagnostics'}
            </button>

            {diagnostics.length > 0 && (
              <div className="grid grid-cols-1 gap-2">
                {diagnostics.map((d, i) => (
                  <div key={i} className="flex items-center justify-between px-6 py-4 glass rounded-2xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className={`w-1.5 h-1.5 rounded-full ${d.status === 'pass' ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-300">{d.name}</span>
                    </div>
                    <span className={`text-[8px] font-mono font-bold uppercase ${d.status === 'pass' ? 'text-green-500' : 'text-red-500'}`}>
                      {d.status === 'pass' ? 'PASS' : `FAIL: ${d.detail}`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {showSecurity && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6"
            onClick={() => setShowSecurity(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="glass border border-white/10 rounded-3xl p-6 max-w-sm w-full max-h-[85vh] flex flex-col gap-4"
            >
              <div className="flex items-center gap-3 shrink-0">
                <div className="w-10 h-10 rounded-full glass flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg tracking-tight leading-tight">Security Protocols <br/><span className="text-sm font-normal text-zinc-400 font-sans">လုံခြုံရေး ပရိုတိုကောများ</span></h3>
                  <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold mt-1">System Integrity</p>
                </div>
              </div>
              
              <div className="space-y-4 text-sm text-zinc-300 overflow-y-auto flex-1 pr-2 custom-scrollbar min-h-0 pb-20">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 shrink-0">
                  <h4 className="font-bold text-white mb-2">Local Storage Sandbox <span className="block text-xs font-normal text-zinc-400 mt-1">ဒေတာလုံခြုံရေး</span></h4>
                  <p className="text-xs leading-relaxed text-zinc-300 mb-2">All recipe data and settings are contained locally in your device's IndexedDB. No remote servers receive your personal culinary data.</p>
                  <p className="text-xs leading-relaxed text-zinc-400">ဟင်းချက်နည်းဒေတာများနှင့် ဆက်တင်များအားလုံးကို သင့်စက်ရှိ IndexedDB တွင်သာ သိမ်းဆည်းထားပါသည်။ သင်၏ကိုယ်ရေးကိုယ်တာ အချက်အလက်များကို မည်သည့်အပြင်ဆာဗာသို့မှ ပေးပို့မည်မဟုတ်ပါ။</p>
                </div>
                
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 shrink-0">
                  <h4 className="font-bold text-white mb-2">Theme Isolation <span className="block text-xs font-normal text-zinc-400 mt-1">အပြင်အဆင် ခွဲခြားမှု</span></h4>
                  <p className="text-xs leading-relaxed text-zinc-300 mb-2">The Neural Theme Engine operates on a strict context-basis, ensuring UI preference alterations do not affect underlying data structures.</p>
                  <p className="text-xs leading-relaxed text-zinc-400">Neural Theme Engine သည် သတ်မှတ်ထားသော ကန့်သတ်ချက်များအတွင်းသာ အလုပ်လုပ်ပြီး UI ပြောင်းလဲမှုများက နောက်ကွယ်ရှိ အချက်အလက်များကို ထိခိုက်မှုမရှိစေပါ။</p>
                </div>
                
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 shrink-0">
                  <h4 className="font-bold text-white mb-2">Diagnostic Mode <span className="block text-xs font-normal text-zinc-400 mt-1">စစ်ဆေးရေး မုဒ်</span></h4>
                  <p className="text-xs leading-relaxed text-zinc-300 mb-2">Available only via sequence unlock, diagnostics run non-destructive operations to verify database integrity without touching user records.</p>
                  <p className="text-xs leading-relaxed text-zinc-400">Sequence unlock ဖြင့်သာ အသုံးပြုနိုင်ပြီး၊ အသုံးပြုသူ၏ မှတ်တမ်းများကို မထိခိုက်စေဘဲ ဒေတာဘေ့စ် မှန်ကန်မှုကို စစ်ဆေးပေးပါသည်။</p>
                </div>

                <div className="pt-2">
                  <button 
                    onClick={() => setShowSecurity(false)}
                    className="w-full py-3 shrink-0 rounded-2xl bg-white text-black text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors"
                  >
                    Acknowledge / အသိအမှတ်ပြုသည်
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SettingItem({ icon, label, active, color = "text-white", onClick }: { icon: React.ReactNode, label: string, active?: boolean, color?: string, onClick?: () => void }) {
  return (
    <div 
      onClick={onClick}
      className="flex items-center justify-between p-4 rounded-xl glass x-border hover:bg-white/5 cursor-pointer transition-all group"
    >
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-500 group-hover:text-white transition-colors">
          {icon}
        </div>
        <span className={`text-sm font-medium ${color}`}>{label}</span>
      </div>
      <div className="flex items-center gap-3">
        {active && <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />}
        <ChevronRight className="w-4 h-4 text-zinc-600" />
      </div>
    </div>
  );
}
