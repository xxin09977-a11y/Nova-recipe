/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect } from 'react';
import { db } from './lib/db';
import MobileLayout from './layouts/MobileLayout';
import Home from './pages/Home';
import AddRecipe from './pages/AddRecipe';
import RecipeDetail from './pages/RecipeDetail';
import Favorites from './pages/Favorites';
import Settings from './pages/Settings';
import Search from './pages/Search';
import Onboarding from './components/Onboarding';
import DebugPanel from './components/DebugPanel';
import FeatureErrorBoundary from './components/FeatureErrorBoundary';
import { AnimatePresence, motion } from 'motion/react';

const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
    <h2 className="font-display text-2xl font-bold">{title}</h2>
    <p className="text-white/40 text-center">This feature is coming soon in Step 3 of development.</p>
    <div className="w-12 h-12 bg-white/5 rounded-full animate-pulse" />
  </div>
);

function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 1.02, y: -10 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <Routes location={location}>
          <Route path="/" element={<FeatureErrorBoundary featureName="Recipe Archive"><Home /></FeatureErrorBoundary>} />
          <Route path="/recipe/:id" element={<FeatureErrorBoundary featureName="Recipe Intel"><RecipeDetail /></FeatureErrorBoundary>} />
          <Route path="/add" element={<FeatureErrorBoundary featureName="Data Archive"><AddRecipe /></FeatureErrorBoundary>} />
          <Route path="/edit/:id" element={<FeatureErrorBoundary featureName="Data Archive"><AddRecipe /></FeatureErrorBoundary>} />
          <Route path="/favorites" element={<FeatureErrorBoundary featureName="Favorites Filter"><Favorites /></FeatureErrorBoundary>} />
          <Route path="/settings" element={<FeatureErrorBoundary featureName="Core Config"><Settings /></FeatureErrorBoundary>} />
          <Route path="/search" element={<FeatureErrorBoundary featureName="Neural Search"><Search /></FeatureErrorBoundary>} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  const profile = useLiveQuery(() => db.userProfile.get('me'));

  useEffect(() => {
    if (profile?.preferences) {
      if (profile.preferences.fontScale) {
        document.documentElement.style.setProperty('--font-scale', profile.preferences.fontScale.toString());
      }
      
      if (profile.preferences.appTheme) {
        document.documentElement.setAttribute('data-theme', profile.preferences.appTheme);
      } else {
        document.documentElement.setAttribute('data-theme', 'noir');
      }
      
      if (profile.preferences.darkMode !== undefined) {
        if (!profile.preferences.darkMode) {
          document.documentElement.classList.add('light-theme');
        } else {
          document.documentElement.classList.remove('light-theme');
        }
      }
    }
  }, [profile]);

  const completeOnboarding = async () => {
    await db.userProfile.update('me', { hasCompletedOnboarding: true });
  };

  const showOnboarding = profile && profile.hasCompletedOnboarding === false;
  const showDebug = profile?.preferences?.debugMode;

  return (
    <BrowserRouter>
      {showOnboarding && <Onboarding onComplete={completeOnboarding} />}
      {showDebug && <DebugPanel />}
      <MobileLayout>
        <AnimatedRoutes />
      </MobileLayout>
    </BrowserRouter>
  );
}
