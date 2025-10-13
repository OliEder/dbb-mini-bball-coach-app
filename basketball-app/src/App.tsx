/**
 * Main App Component
 * 
 * Router und Layout-Struktur
 * FIX: Verhindert Reload-Schleife durch besseres State-Management
 */

import React, { useEffect, useState } from 'react';
import { useAppStore } from './stores/appStore';
import { initializeDatabase } from './shared/db/database';
import { OnboardingContainer } from './domains/onboarding/components/OnboardingContainer';
import { Dashboard } from './domains/dashboard/Dashboard';

function App() {
  const hasCompletedOnboarding = useAppStore(state => state.hasCompletedOnboarding);
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  // Database initialisierung nur EINMAL beim Mount
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

    // Cleanup: Verhindert State-Updates nach Unmount
    return () => {
      isMounted = false;
    };
  }, []); // Leeres Dependency-Array = nur einmal ausführen!

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

  // Routing Logic - zeigt entweder Onboarding oder Dashboard
  if (!hasCompletedOnboarding) {
    return <OnboardingContainer />;
  }

  return <Dashboard />;
}

export default App;
