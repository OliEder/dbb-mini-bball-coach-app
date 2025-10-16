/**
 * Onboarding Store - Zustand State Management
 * 
 * KORRIGIERT: BBB-Import zuerst, dann Team-Auswahl
 * FIX: Files werden NICHT persistiert (verhindert Reload-Schleife)
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BBBParseResult } from '@/domains/bbb/services/BBBParserService';

type OnboardingStep = 
  | 'welcome' 
  | 'bbb_url'           // NEU: BBB-URL eingeben (Step 2!)
  | 'team_select'       // NEU: Team auswählen aus geparsten Daten
  | 'spieler' 
  | 'trikots' 
  | 'complete';

interface OnboardingState {
  step: OnboardingStep;
  
  // BBB-Daten (ZENTRAL!)
  bbb_url?: string;
  parsed_liga_data?: BBBParseResult;
  
  // Team-Auswahl
  selected_team_name?: string;
  trainer_name?: string;
  
  // CSV-Files (NICHT persistiert!)
  spieler_csv?: File;
  trikot_csv?: File;
}

interface OnboardingStore extends OnboardingState {
  // Actions
  setStep: (step: OnboardingStep) => void;
  nextStep: () => void;
  previousStep: () => void;
  setBBBUrl: (url: string) => void;
  setBbbUrl: (url: string) => void; // Alias für Kompatibilität
  setParsedLigaData: (data: BBBParseResult) => void;
  setSelectedTeam: (teamName: string) => void;
  setTeam: (teamName: string) => void; // Alias für Kompatibilität
  setTrainerName: (name: string) => void;
  setSpielerCSV: (file: File) => void;
  setTrikotCSV: (file: File) => void;
  reset: () => void;
  
  // Validation
  canProceed: () => boolean;
}

const initialState: OnboardingState = {
  step: 'welcome',
  bbb_url: undefined,
  parsed_liga_data: undefined,
  selected_team_name: undefined,
  trainer_name: undefined,
  spieler_csv: undefined,
  trikot_csv: undefined,
};

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setStep: (step) => set({ step }),

      nextStep: () => {
        const current = get().step;
        const steps: OnboardingStep[] = ['welcome', 'bbb_url', 'team_select', 'spieler', 'trikots', 'complete'];
        const currentIndex = steps.indexOf(current);
        if (currentIndex < steps.length - 1) {
          set({ step: steps[currentIndex + 1] });
        }
      },
      
      previousStep: () => {
        const current = get().step;
        const steps: OnboardingStep[] = ['welcome', 'bbb_url', 'team_select', 'spieler', 'trikots', 'complete'];
        const currentIndex = steps.indexOf(current);
        if (currentIndex > 0) {
          set({ step: steps[currentIndex - 1] });
        }
      },

      setBBBUrl: (url) => set({ bbb_url: url }),
      setBbbUrl: (url) => set({ bbb_url: url }), // Alias

      setParsedLigaData: (data) => set({ parsed_liga_data: data }),

      setSelectedTeam: (teamName) => set({ selected_team_name: teamName }),
      setTeam: (teamName) => set({ selected_team_name: teamName }), // Alias

      setTrainerName: (name) => set({ trainer_name: name }),

      setSpielerCSV: (file) => set({ spieler_csv: file }),

      setTrikotCSV: (file) => set({ trikot_csv: file }),

      reset: () => set(initialState),

      canProceed: () => {
        const state = get();
        
        switch (state.step) {
          case 'welcome':
            return true;
          
          case 'bbb_url':
            // BBB-URL muss geparst sein
            return !!(state.parsed_liga_data && state.parsed_liga_data.teams.length > 0);
          
          case 'team_select':
            // Team muss gewählt sein + Trainer-Name
            return !!(state.selected_team_name && state.trainer_name?.trim());
          
          case 'spieler':
            return !!state.spieler_csv;
          
          case 'trikots':
            return !!state.trikot_csv;
          
          default:
            return false;
        }
      }
    }),
    {
      name: 'basketball-onboarding',
      // KRITISCH: Files und große Objekte NICHT persistieren!
      partialize: (state) => ({
        step: state.step,
        bbb_url: state.bbb_url,
        selected_team_name: state.selected_team_name,
        trainer_name: state.trainer_name,
        // EXPLIZIT AUSGESCHLOSSEN:
        // - spieler_csv: File kann nicht serialisiert werden
        // - trikot_csv: File kann nicht serialisiert werden
        // - parsed_liga_data: Zu groß für localStorage
      })
    }
  )
);
