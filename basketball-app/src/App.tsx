/**
 * Main App Component
 * 
 * Router und Layout-Struktur
 * FIX: Verhindert Reload-Schleife durch besseres State-Management
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useAppStore } from './stores/appStore';
import { initializeDatabase } from './shared/db/database';
import { OnboardingV2Container } from './domains/onboarding/components/OnboardingV2Container';
import { Dashboard } from './domains/dashboard/Dashboard';

function App() {
  const hasCompletedOnboarding = useAppStore(state => state.hasCompletedOnboarding);
  const resetApp = useAppStore(state => state.reset);
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [showMigrationInfo, setShowMigrationInfo] = useState(false);

  // Database initialisierung nur EINMAL beim Mount
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        await initializeDatabase();
        if (isMounted) {
          setIsInitialized(true);
          
          // Check if old onboarding was completed but new one not started
          const oldOnboardingComplete = localStorage.getItem('basketball-onboarding');
          const newOnboardingComplete = localStorage.getItem('onboarding-v2-complete');
          
          if (oldOnboardingComplete && !newOnboardingComplete && hasCompletedOnboarding) {
            setShowMigrationInfo(true);
          }
        }
      } catch (error) {
        console.error('Failed to initialize database:', error);
        if (isMounted) {
          setInitError((error as Error).message);
        }
      }
    };

    init();

    // Cleanup: Verhindert State-Updates nach Unmount
    return () => {
      isMounted = false;
    };
  }, []); // Leeres Dependency-Array = nur einmal ausführen!
  
  // Handler für Migration zum neuen Onboarding
  const handleMigration = useCallback(() => {
    localStorage.removeItem('basketball-onboarding');
    localStorage.removeItem('onboarding-v2-complete');
    resetApp();
    setShowMigrationInfo(false);
  }, [resetApp]);

  // Loading State
  if (!isInitialized && !initError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div 
            className="inline-block w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mb-4"
            role="status"
            aria-label="Lädt..."
          ></div>
          <p className="text-gray-600">Basketball Team Manager wird geladen...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (initError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <div className="text-error-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Initialisierung fehlgeschlagen
          </h1>
          <p className="text-gray-600 mb-4">{initError}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Neu laden
          </button>
        </div>
      </div>
    );
  }

  // Migration Info für Nutzer mit altem Onboarding
  if (showMigrationInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Neues Onboarding verfügbar!
          </h2>
          <p className="text-gray-600 mb-4">
            Wir haben einen verbesserten Einrichtungsprozess mit direkter 
            Liga-Integration entwickelt. Möchten Sie die neue Einrichtung durchführen?
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
            <p className="text-sm text-blue-700">
              <strong>Neu:</strong> Automatischer Import von Liga-Daten, 
              Teams und Spielplänen direkt aus basketball-bund.net
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleMigration}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Neue Einrichtung starten
            </button>
            <button
              onClick={() => setShowMigrationInfo(false)}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
            >
              Später
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Routing Logic - zeigt entweder Onboarding oder Dashboard
  if (!hasCompletedOnboarding) {
    return <OnboardingV2Container />;
  }

  return <Dashboard />;
}

export default App;
