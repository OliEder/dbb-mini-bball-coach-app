/**
 * Onboarding Store
 * 
 * Zustand Store für Multi-Step Onboarding Flow
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { OnboardingState, Team, Verein } from '@shared/types';

type OnboardingStep = OnboardingState['step'];

interface OnboardingStore extends OnboardingState {
  // Navigation
  currentStep: OnboardingStep;
  canGoNext: boolean;
  canGoBack: boolean;
  
  // Actions
  setStep: (step: OnboardingStep) => void;
  nextStep: () => void;
  previousStep: () => void;
  
  // Data setters
  setTeamData: (team: Partial<Team>) => void;
  setVereinData: (verein: Partial<Verein>) => void;
  setSpielerCSV: (file: File) => void;
  setTrikotCSV: (file: File) => void;
  setBBBUrl: (url: string) => void;
  
  // Validation
  validateCurrentStep: () => boolean;
  
  // Reset
  reset: () => void;
  
  // Completion
  markComplete: () => void;
}

const STEP_ORDER: OnboardingStep[] = [
  'welcome',
  'team',
  'verein',
  'spieler',
  'trikots',
  'spielplan',
  'complete'
];

const initialState: Omit<OnboardingStore, 
  'setStep' | 'nextStep' | 'previousStep' | 'setTeamData' | 'setVereinData' | 
  'setSpielerCSV' | 'setTrikotCSV' | 'setBBBUrl' | 'validateCurrentStep' | 
  'reset' | 'markComplete' | 'canGoNext' | 'canGoBack'> = {
  step: 'welcome',
  currentStep: 'welcome',
  team: undefined,
  verein: undefined,
  spieler_csv: undefined,
  trikot_csv: undefined,
  bbb_url: undefined
};

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // Computed
      get canGoNext() {
        const currentIndex = STEP_ORDER.indexOf(get().currentStep);
        return currentIndex < STEP_ORDER.length - 1 && get().validateCurrentStep();
      },
      
      get canGoBack() {
        const currentIndex = STEP_ORDER.indexOf(get().currentStep);
        return currentIndex > 0 && get().currentStep !== 'complete';
      },

      // Navigation
      setStep: (step: OnboardingStep) => {
        set({ currentStep: step, step });
      },

      nextStep: () => {
        const currentIndex = STEP_ORDER.indexOf(get().currentStep);
        if (currentIndex < STEP_ORDER.length - 1 && get().validateCurrentStep()) {
          const nextStep = STEP_ORDER[currentIndex + 1];
          set({ currentStep: nextStep, step: nextStep });
        }
      },

      previousStep: () => {
        const currentIndex = STEP_ORDER.indexOf(get().currentStep);
        if (currentIndex > 0) {
          const prevStep = STEP_ORDER[currentIndex - 1];
          set({ currentStep: prevStep, step: prevStep });
        }
      },

      // Data setters
      setTeamData: (team: Partial<Team>) => {
        set({ team: { ...get().team, ...team } });
      },

      setVereinData: (verein: Partial<Verein>) => {
        set({ verein: { ...get().verein, ...verein } });
      },

      setSpielerCSV: (file: File) => {
        set({ spieler_csv: file });
      },

      setTrikotCSV: (file: File) => {
        set({ trikot_csv: file });
      },

      setBBBUrl: (url: string) => {
        set({ bbb_url: url });
      },

      // Validation
      validateCurrentStep: () => {
        const state = get();
        
        switch (state.currentStep) {
          case 'welcome':
            return true; // Immer valid
            
          case 'team':
            return !!(
              state.team?.name &&
              state.team?.altersklasse &&
              state.team?.saison &&
              state.team?.trainer
            );
            
          case 'verein':
            return !!(
              state.verein?.name &&
              state.verein?.ist_eigener_verein !== undefined
            );
            
          case 'spieler':
            // Optional: CSV kann übersprungen werden
            return true;
            
          case 'trikots':
            // Optional: CSV kann übersprungen werden
            return true;
            
          case 'spielplan':
            // Optional: BBB-URL kann übersprungen werden
            return true;
            
          default:
            return false;
        }
      },

      // Reset
      reset: () => {
        set(initialState);
      },

      // Completion
      markComplete: () => {
        set({ currentStep: 'complete', step: 'complete' });
      }
    }),
    {
      name: 'basketball-onboarding',
      partialize: (state) => ({
        step: state.step,
        currentStep: state.currentStep,
        team: state.team,
        verein: state.verein,
        // Note: Files werden nicht persistiert (nicht serializable)
        bbb_url: state.bbb_url
      })
    }
  )
);
