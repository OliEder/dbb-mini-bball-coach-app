/**
 * Onboarding Container KORRIGIERT
 * 
 * Orchestriert den korrekten Onboarding-Flow:
 * 1. Welcome
 * 2. BBB-URL (NEU!)
 * 3. Team Select (NEU!)
 * 4. Spieler CSV
 * 5. Trikot CSV
 * 6. Complete
 */

import React from 'react';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { OnboardingLayout } from './OnboardingLayout';
import { WelcomeStep } from './WelcomeStep';
import { BBBUrlStep } from './BBBUrlStep';
import { TeamSelectStep } from './TeamSelectStep';
import { SpielerImportStep } from './SpielerImportStep';
import { TrikotImportStep } from './TrikotImportStep';
import { CompleteStep } from './CompleteStep';

export function OnboardingContainer() {
  const step = useOnboardingStore(state => state.step);

  const renderStep = () => {
    switch (step) {
      case 'welcome':
        return <WelcomeStep />;
      
      case 'bbb_url':
        return <BBBUrlStep />;
      
      case 'team_select':
        return <TeamSelectStep />;
      
      case 'spieler':
        return <SpielerImportStep />;
      
      case 'trikots':
        return <TrikotImportStep />;
      
      case 'complete':
        return <CompleteStep />;
      
      default:
        return <WelcomeStep />;
    }
  };

  return (
    <OnboardingLayout currentStep={step}>
      {renderStep()}
    </OnboardingLayout>
  );
}
