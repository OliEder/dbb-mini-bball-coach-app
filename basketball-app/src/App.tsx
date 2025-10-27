/**
 * Main App Component mit React Router
 * 
 * Routing-Struktur:
 * - / → Redirect zu /onboarding oder /dashboard
 * - /onboarding → Onboarding-Flow
 * - /dashboard → Geschützter Bereich (nur nach Onboarding)
 */

import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAppStore } from './stores/appStore';
import { initializeDatabase } from './shared/db/database';
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
      
      // Zeige verfügbare Tabellen
      const tables = db.tables.map(t => t.name);
      console.log('🗃️ Verfügbare Tabellen:', tables);
      
      // Zähle Einträge
      const stats: Record<string, number> = {};
      for (const table of tables) {
        try {
          stats[table] = await (db as any)[table].count();
        } catch (e) {
          stats[table] = -1; // Fehler
        }
      }
      
      console.log('🗄️ Database Stats:', stats);
      return { tables, stats };
    },
    
    // Force Dashboard
    dashboard: () => {
      console.log('🎯 Forcing Dashboard...');
      const appStore = useAppStore.getState();
      appStore.completeOnboarding();
      window.location.href = '/dashboard';
    },
    
    // Sync Liga-Daten
    sync: async (ligaId?: number) => {
      console.log('🔄 Starting BBB Sync...');
      const { bbbSyncService } = await import('./domains/bbb-api/services/BBBSyncService');
      const { db } = await import('./shared/db/database');
      
      if (!ligaId) {
        // Finde Liga-ID vom aktuellen Team
        const appStore = useAppStore.getState();
        const teamId = appStore.currentTeamId;
        
        if (!teamId) {
          console.error('❌ Kein aktives Team');
          return;
        }
        
        const team = await db.teams.get(teamId);
        if (!team || !team.liga_id) {
          console.error('❌ Team hat keine Liga-ID');
          return;
        }
        
        const match = team.liga_id.match(/\d+/);
        if (!match) {
          console.error('❌ Keine gültige Liga-ID gefunden');
          return;
        }
        
        ligaId = parseInt(match[0], 10);
      }
      
      console.log('🔄 Syncing Liga:', ligaId);
      
      try {
        await bbbSyncService.syncLiga(ligaId, { skipMatchInfo: true });
        console.log('✅ Sync erfolgreich!');
        
        // Zeige Stats
        const spiele = await db.spiele.count();
        const tabelle = await db.liga_tabellen.count();
        console.log('📈 Stats:', { spiele, tabelle });
      } catch (error) {
        console.error('❌ Sync fehlgeschlagen:', error);
      }
    },
    
    // Help
    help: () => {
      console.log(`
🔧 Dev Utils - Verfügbare Commands:

  __DEV_UTILS__.reset()      - Quick Reset (DB + Storage)
  __DEV_UTILS__.store()      - App Store anzeigen
  __DEV_UTILS__.storage()    - LocalStorage anzeigen
  __DEV_UTILS__.db()         - Database Stats
  __DEV_UTILS__.dashboard()  - Force Dashboard (skip Onboarding)
  __DEV_UTILS__.sync(ligaId) - BBB Liga-Sync (optional: ligaId)
  __DEV_UTILS__.help()       - Diese Hilfe
      `);
    }
  };
  
  console.log('🛍️ Dev Utils loaded! Type __DEV_UTILS__.help() for commands');
}

// Loading Screen
const LoadingScreen: React.FC = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <div 
        className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"
        role="status"
        aria-label="Lädt..."
      />
      <p className="text-gray-600">Basketball Team Manager wird geladen...</p>
    </div>
  </div>
);

// Error Screen
const ErrorScreen: React.FC<{ error: string }> = ({ error }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div className="max-w-md text-center">
      <div className="text-red-600 mb-4">
        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Initialisierung fehlgeschlagen
      </h1>
      <p className="text-gray-600 mb-4">{error}</p>
      <button
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        Neu laden
      </button>
    </div>
  </div>
);

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const hasCompletedOnboarding = useAppStore(state => state.hasCompletedOnboarding);
  
  if (!hasCompletedOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }
  
  return <>{children}</>;
};

// Root Redirect
const RootRedirect: React.FC = () => {
  const hasCompletedOnboarding = useAppStore(state => state.hasCompletedOnboarding);
  
  return (
    <Navigate 
      to={hasCompletedOnboarding ? "/dashboard" : "/onboarding"} 
      replace 
    />
  );
};

// Main Router Component
const AppRouter: React.FC = () => {
  return (
    <Routes>
      {/* Root - Redirect basierend auf Onboarding-Status */}
      <Route path="/" element={<RootRedirect />} />
      
      {/* Onboarding */}
      <Route path="/onboarding" element={<SimplifiedOnboardingContainer />} />
      
      {/* Dashboard (Protected) */}
      <Route 
        path="/dashboard/*" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      
      {/* Fallback: Alles andere zu Root */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// App Initialization Wrapper
function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  // Database Initialisierung
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        await initializeDatabase();
        if (isMounted) {
          setIsInitialized(true);
        }
      } catch (error) {
        console.error('Failed to initialize database:', error);
        if (isMounted) {
          setInitError((error as Error).message);
        }
      }
    };

    init();

    return () => {
      isMounted = false;
    };
  }, []);
  
  // Loading State
  if (!isInitialized && !initError) {
    return <LoadingScreen />;
  }

  // Error State
  if (initError) {
    return <ErrorScreen error={initError} />;
  }
  
  // Main App mit Router
  // basename für GitHub Pages Subpath Deployment
  const basename = import.meta.env.BASE_URL || '/';
  
  return (
    <>
      <BrowserRouter basename={basename}>
        <AppRouter />
      </BrowserRouter>
      
      {/* DevTools - Global verfügbar */}
      <DevTools />
    </>
  );
}

export default App;
