/**
 * Main App Component mit React Router
 * 
 * Routing-Struktur:
 * - / → Redirect zu /onboarding oder /dashboard
 * - /onboarding → Onboarding-Flow
 * - /dashboard → Geschützter Bereich (nur nach Onboarding)
 * 
 * WICHTIG: Auto-Fix für inkonsistenten State nach DB-Löschung
 */

import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAppStore } from './stores/appStore';
import { initializeDatabase, db } from './shared/db/database';
import { SimplifiedOnboardingContainer } from './domains/onboarding/components/SimplifiedOnboardingContainer';
import { Dashboard } from './domains/dashboard/Dashboard';
import { DevTools } from './shared/components/DevTools';

// 🛍️ Dev Console Utilities - Global verfügbar in Browser Console
if (typeof window !== 'undefined') {
  (window as any).__DEV_UTILS__ = {
    // Quick Reset
    reset: async () => {
      console.log('🛠️ Quick Reset...');
      const { resetDatabase } = await import('./shared/db/database');
      await resetDatabase();
      localStorage.clear();
      sessionStorage.clear();
      console.log('✅ Reset complete - Reloading...');
      window.location.href = '/';
    },
    
    // Store Inspector
    store: () => {
      const appStore = useAppStore.getState();
      console.log('📋 App Store:', appStore);
      return appStore;
    },
    
    // LocalStorage Inspector
    storage: () => {
      console.log('💾 LocalStorage:');
      Object.keys(localStorage).forEach(key => {
        console.log(`  ${key}:`, localStorage.getItem(key));
      });
    },
    
    // DB Inspector
    db: async () => {
      const { db } = await import('./shared/db/database');
      console.log('🔍 Database Tables:');
      const tables = ['teams', 'spieler', 'spiele', 'liga_tabellen'];
      for (const table of tables) {
        const count = await (db as any)[table].count();
        console.log(`  ${table}: ${count} entries`);
      }
    },
    
    help: () => {
      console.log(`
🛠️ Developer Utilities:
  __DEV_UTILS__.reset()   - Reset DB & Storage
  __DEV_UTILS__.store()   - Inspect App Store
  __DEV_UTILS__.storage() - Inspect LocalStorage
  __DEV_UTILS__.db()      - Inspect Database
  __DEV_UTILS__.help()    - Show this help
      `);
    }
  };
  
  console.log('💡 Developer utilities loaded. Type __DEV_UTILS__.help() for commands.');
}

// ProtectedRoute Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const hasCompletedOnboarding = useAppStore(state => state.hasCompletedOnboarding);
  const currentTeamId = useAppStore(state => state.currentTeamId);
  const reset = useAppStore(state => state.reset);
  const [isChecking, setIsChecking] = useState(true);
  const [hasValidData, setHasValidData] = useState(false);

  useEffect(() => {
    const checkDataIntegrity = async () => {
      // Check ob Store-Daten mit DB übereinstimmen
      if (hasCompletedOnboarding && currentTeamId) {
        try {
          // Prüfe ob Team in DB existiert
          const team = await db.teams.get(currentTeamId);
          
          if (!team) {
            console.warn('⚠️ Inkonsistenter State erkannt: Team nicht in DB gefunden');
            console.log('🔄 Auto-Fix: Reset auf Onboarding...');
            
            // Reset Store
            reset();
            
            // Navigate zu Onboarding
            navigate('/onboarding', { replace: true });
            return;
          }
          
          setHasValidData(true);
        } catch (error) {
          console.error('❌ Fehler beim Prüfen der Datenintegrität:', error);
          reset();
          navigate('/onboarding', { replace: true });
        }
      } else if (!hasCompletedOnboarding) {
        navigate('/onboarding', { replace: true });
      }
      
      setIsChecking(false);
    };

    checkDataIntegrity();
  }, [hasCompletedOnboarding, currentTeamId, navigate, reset]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Prüfe Datenintegrität...</p>
        </div>
      </div>
    );
  }

  if (!hasCompletedOnboarding || !hasValidData) {
    return null;
  }

  return <>{children}</>;
}

// Haupt App Component
function App() {
  const [isDbReady, setIsDbReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        console.log('🔌 Initialisiere Datenbank...');
        await initializeDatabase();
        setIsDbReady(true);
        console.log('✅ Datenbank bereit');
      } catch (error) {
        console.error('❌ Datenbank-Initialisierung fehlgeschlagen:', error);
        setDbError(error instanceof Error ? error.message : 'Unbekannter Fehler');
      }
    };
    init();
  }, []);

  if (dbError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="max-w-md p-6 bg-white rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Datenbank-Fehler</h1>
          <p className="text-gray-700 mb-4">{dbError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Neu laden
          </button>
        </div>
      </div>
    );
  }

  if (!isDbReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Lade Datenbank...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter basename="/dbb-mini-bball-coach-app">
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/onboarding" element={<SimplifiedOnboardingContainer />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
      </Routes>
      {import.meta.env.DEV && <DevTools />}
    </BrowserRouter>
  );
}

// Root Redirect Component
function RootRedirect() {
  const hasCompletedOnboarding = useAppStore(state => state.hasCompletedOnboarding);
  return <Navigate to={hasCompletedOnboarding ? '/dashboard' : '/onboarding'} replace />;
}

export default App;
