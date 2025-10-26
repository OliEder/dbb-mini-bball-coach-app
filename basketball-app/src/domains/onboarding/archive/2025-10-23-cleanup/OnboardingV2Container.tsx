/**
 * Onboarding v2 Container
 * 
 * Orchestriert den gesamten Onboarding-Flow
 */

import React from 'react';
import { useOnboardingV2Store } from '../onboarding-v2.store';
import {
  WelcomeStep,
  UserStep,
  VerbandStep,
  AltersklassenStep,
  GebietStep
} from './v2';
import { VereinStepV3 } from './v2/VereinStepV3';
import { TeamStepV3 } from './v2/TeamStepV3';
import { CompletionStep } from './v2/CompletionStep';
import type { WamLigaEintrag, DBBTabellenEintrag } from '@shared/types';

export const OnboardingV2Container: React.FC = () => {
  const {
    currentStep,
    user,
    selectedVerband,
    selectedAltersklassen,
    selectedGebiet,
    selectedVerein,
    selectedClubId,
    eigeneTeams,
    
    // Actions
    setStep,
    nextStep,
    previousStep,
    setUserData,
    setVerband,
    setAltersklassen: setAltersklassenSelection,
    setGebiet,
    setLigen,
    addTeamsForLiga,
    selectVerein,
    setError,
    completeOnboarding
  } = useOnboardingV2Store();
  
  // Progress Bar berechnen
  const TOTAL_STEPS = 10;
  const stepIndex = {
    'welcome': 0,
    'user': 1,
    'verband': 2,
    'altersklassen': 3,
    'gebiet': 4,
    'ligen-loading': 5,
    'verein': 6,
    'team-select': 7,
    'sync': 8,
    'team-selection': 9
  };
  
  const progressPercentage = ((stepIndex[currentStep] || 0) / (TOTAL_STEPS - 1)) * 100;
  
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'welcome':
        return (
          <WelcomeStep
            onNext={nextStep}
          />
        );
      
      case 'user':
        return (
          <UserStep
            initialData={user}
            onNext={(data) => {
              setUserData(data);
              nextStep();
            }}
            onBack={previousStep}
          />
        );
      
      case 'verband':
        return (
          <VerbandStep
            initialSelection={selectedVerband}
            onNext={(verbandId) => {
              setVerband(verbandId);
              nextStep();
            }}
            onBack={previousStep}
          />
        );
      
      case 'altersklassen':
        return (
          <AltersklassenStep
            verbandId={selectedVerband!}
            initialSelection={selectedAltersklassen}
            onNext={(altersklassenIds) => {
              setAltersklassenSelection(altersklassenIds);
              nextStep();
            }}
            onBack={previousStep}
          />
        );
      
      case 'gebiet':
        return (
          <GebietStep
            verbandId={selectedVerband!}
            altersklassenIds={selectedAltersklassen}
            initialSelection={selectedGebiet}
            onNext={(gebietId) => {
              setGebiet(gebietId);
              nextStep();
            }}
            onBack={previousStep}
          />
        );
      
      case 'ligen-loading':
        // Nicht mehr nötig mit lokalen Daten! Direkt zu Verein
        nextStep();
        return null;
      
      case 'verein':
        return (
          <VereinStepV3
            selectedVerbaende={selectedVerband ? [selectedVerband] : []}
            initialSelection={selectedVerein}
            onNext={(verein, clubId) => {
              selectVerein(verein);
              // Speichere clubId für TeamStep
              useOnboardingV2Store.setState({ selectedClubId: clubId });
              nextStep();
            }}
            onBack={previousStep}
          />
        );
      case 'team-select':
        if (!selectedVerein || !selectedClubId) {
          return (
            <div className="max-w-lg mx-auto p-6 text-center">
              <p className="text-gray-600 mb-4">Fehler: Verein nicht gewählt</p>
              <button onClick={() => setStep('verein')} className="px-4 py-2 bg-blue-600 text-white rounded-md">
                ← Zurück zur Vereinsauswahl
              </button>
            </div>
          );
        }
        
        return (
          <TeamStepV3
            clubId={selectedClubId}
            clubName={selectedVerein.name}
            selectedVerbaende={selectedVerband ? [selectedVerband] : []}
            initialSelection={eigeneTeams}
            onNext={(teams) => {
              // Speichere ausgewählte Teams
              teams.forEach(team => {
                // Setze verein_id
                team.verein_id = selectedVerein.verein_id;
              });
              
              // Update Store
              useOnboardingV2Store.setState({ eigeneTeams: teams });
              
              // Setze erstes Team als aktives Team
              if (teams.length > 0) {
                useOnboardingV2Store.setState({ aktivesTeam: teams[0] });
              }
              
              nextStep();
            }}
            onBack={previousStep}
          />
        );
      
      case 'sync':
      case 'team-selection':
        return <CompletionStep onComplete={completeOnboarding} />;
      
      default:
        return null;
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progress Bar */}
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
      
      {/* Main Content */}
      <div className="pt-20 pb-12">
        {renderCurrentStep()}
      </div>
    </div>
  );
};
