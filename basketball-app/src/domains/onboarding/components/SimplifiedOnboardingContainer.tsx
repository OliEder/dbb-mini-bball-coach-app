/**
 * Simplified Onboarding Container
 * 
 * Schlanker Flow:
 * 1. Welcome
 * 2. User
 * 3. Verein (mit Filter)
 * 4. Team
 * 5. Completion
 */

import React from 'react';
import { useSimpleOnboardingStore } from '../onboarding-simple.store';
import { WelcomeStep, UserStep } from './v2';
import { SimplifiedVereinStep } from './SimplifiedVereinStep';
import { SimplifiedTeamStep } from './SimplifiedTeamStep';
import { CompletionStep } from './v2/CompletionStep';

export const SimplifiedOnboardingContainer: React.FC = () => {
  const {
    currentStep,
    user,
    selectedVerbandFilter,
    selectedVerein,
    selectedClubId,
    selectedTeams,
    
    // Actions
    setStep,
    nextStep,
    previousStep,
    setUser,
    setVerbandFilter,
    setVerein,
    setTeams,
    completeOnboarding
  } = useSimpleOnboardingStore();

  const TOTAL_STEPS = 5;
  const stepIndex = {
    'welcome': 0,
    'user': 1,
    'verein': 2,
    'team': 3,
    'completion': 4
  };
  
  const progressPercentage = ((stepIndex[currentStep] || 0) / (TOTAL_STEPS - 1)) * 100;

  const renderStep = () => {
    switch (currentStep) {
      case 'welcome':
        return <WelcomeStep onNext={nextStep} />;
      
      case 'user':
        return (
          <UserStep
            initialData={user}
            onNext={(userData) => {
              setUser(userData);
              nextStep();
            }}
            onBack={previousStep}
          />
        );
      
      case 'verein':
        return (
          <SimplifiedVereinStep
            verbandFilter={selectedVerbandFilter}
            onVerbandFilterChange={setVerbandFilter}
            onNext={(verein, clubId) => {
              setVerein(verein, clubId);
              nextStep();
            }}
            onBack={previousStep}
          />
        );
      
      case 'team':
        if (!selectedVerein || !selectedClubId) {
          return (
            <div className="max-w-lg mx-auto p-6 text-center">
              <p className="text-gray-600 mb-4">Fehler: Kein Verein gewählt</p>
              <button
                onClick={() => setStep('verein')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                ← Zurück zur Vereinsauswahl
              </button>
            </div>
          );
        }
        
        return (
          <SimplifiedTeamStep
            clubId={selectedClubId}
            clubName={selectedVerein.name}
            onNext={(teams) => {
              setTeams(teams);
              nextStep();
            }}
            onBack={previousStep}
          />
        );
      
      case 'completion':
        return <CompletionStep onComplete={completeOnboarding} />;
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progress Bar */}
      {currentStep !== 'completion' && (
        <div className="fixed top-0 left-0 right-0 bg-white shadow-sm z-40">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-sm font-semibold text-gray-700">
                Basketball Team Manager - Einrichtung
              </h1>
              <span className="text-sm text-gray-500">
                Schritt {(stepIndex[currentStep] || 0) + 1} von {TOTAL_STEPS}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Main Content */}
      <div className={currentStep !== 'completion' ? 'pt-20 pb-12' : ''}>
        {renderStep()}
      </div>
    </div>
  );
};
