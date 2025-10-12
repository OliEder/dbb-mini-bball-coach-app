/**
 * Main App Component
 * 
 * Router und Layout-Struktur
 */

import React, { useEffect } from 'react';
import { useAppStore } from './stores/appStore';
import { initializeDatabase } from './shared/db/database';
import { OnboardingContainer } from './domains/onboarding/components/OnboardingContainer';
import { Dashboard } from './domains/dashboard/Dashboard';

function App() {
  const hasCompletedOnboarding = useAppStore(state => state.hasCompletedOnboarding);
  const [isInitialized, setIsInitialized] = React.useState(false);

  useEffect(() => {
    initializeDatabase()
      .then(() => {
        setIsInitialized(true);
      })
      .catch((error) => {
        console.error('Failed to initialize database:', error);
      });
  }, []);

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Basketball Team Manager wird geladen...</p>
        </div>
      </div>
    );
  }

  // Routing Logic - Einfach ohne Router-Library für MVP
  const currentPath = window.location.pathname;

  if (currentPath === '/dashboard' && hasCompletedOnboarding) {
    return <Dashboard />;
  }

  if (!hasCompletedOnboarding) {
    return <OnboardingContainer />;
  }

  // Default: Redirect to onboarding
  window.location.href = '/';
  return null;
}

export default App;
