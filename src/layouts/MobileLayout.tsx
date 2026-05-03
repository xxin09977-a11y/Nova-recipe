/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Search, Heart, User, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';

interface MobileLayoutProps {
  children: React.ReactNode;
}

export default function MobileLayout({ children }: MobileLayoutProps) {
  const navigate = useNavigate();
  const profile = useLiveQuery(() => db.userProfile.get('me'));

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 font-sans max-w-md mx-auto relative shadow-2xl overflow-y-auto overflow-x-hidden scroll-smooth">
      {/* Top Header */}
      <header className="sticky top-0 z-50 glass-dark px-6 py-5 flex justify-between items-center safe-top">
        <div className="flex flex-col">
          <button 
            type="button"
            onClick={() => {
              navigate('/');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="font-mono font-bold text-2xl tracking-tighter uppercase leading-none cursor-pointer hover:opacity-80 active:scale-95 transition-all text-left"
          >
            Kitchen<span className="text-zinc-500">OS</span>
          </button>
          {profile && (
            <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mt-1">
              Active: {profile.name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-28">
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="p-6"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation - Floating Pill style */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-[320px] px-6 z-50 flex justify-center pointer-events-none">
        <nav className="pointer-events-auto h-[68px] bg-[#111111]/80 backdrop-blur-3xl border border-white/5 rounded-full flex items-center justify-between px-2 w-full shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.1)]">
          <NavButton to="/" icon={<Home className="w-[22px] h-[22px]" />} />
          
          <NavLink to="/add" className={({ isActive }) => `relative flex items-center justify-center w-14 h-14 transition-transform duration-300 z-10 group active:scale-90 ${isActive ? 'scale-95' : 'hover:scale-105'}`}>
            <div className="absolute inset-2 rounded-full bg-gradient-to-tr from-white to-zinc-300 shadow-[0_0_20px_rgba(255,255,255,0.4)]" />
            <Plus className="w-6 h-6 stroke-[2.5] text-black relative z-10" />
          </NavLink>

          <NavButton to="/favorites" icon={<Heart className="w-[22px] h-[22px]" />} />
          <NavButton to="/settings" icon={<User className="w-[22px] h-[22px]" />} />
        </nav>
      </div>
      
      {/* Editorial Decorative Elements */}
      <div className="fixed top-[-5%] right-[-10%] w-72 h-72 bg-white/[0.02] rounded-full blur-3xl pointer-events-none" />
    </div>
  );
}

function NavButton({ to, icon }: { to: string; icon: React.ReactNode }) {
  const handleClick = (e: React.MouseEvent) => {
    if (to === '/' && window.location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <NavLink
      to={to}
      onClick={handleClick}
      className={({ isActive }) =>
        `relative w-14 h-14 flex items-center justify-center transition-colors duration-400 z-10 ${
          isActive 
            ? 'text-black' 
            : 'text-zinc-500 hover:text-zinc-300'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.div
              layoutId="navTab"
              className="absolute inset-[6px] bg-white shadow-lg shadow-white/20 rounded-full -z-10"
              transition={{ type: "spring", stiffness: 400, damping: 25, mass: 0.8 }}
            />
          )}
          <motion.div
             initial={false}
             animate={{ scale: isActive ? 1.05 : 1, y: isActive ? -1 : 0 }}
             transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            {icon}
          </motion.div>
        </>
      )}
    </NavLink>
  );
}
