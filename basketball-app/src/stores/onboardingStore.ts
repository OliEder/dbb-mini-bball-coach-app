/**
 * Onboarding Store - Zustand State Management
 * 
 * KORRIGIERT: BBB-Import zuerst, dann Team-Auswahl
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
  
  // CSV-Files
  spieler_csv?: File;
  trikot_csv?: File;
}

interface OnboardingStore extends OnboardingState {
  // Actions
  setStep: (step: OnboardingStep) => void;
  setBBBUrl: (url: string) => void;
  setParsedLigaData: (data: BBBParseResult) => void;
  setSelectedTeam: (teamName: string) => void;
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

      setBBBUrl: (url) => set({ bbb_url: url }),

      setParsedLigaData: (data) => set({ parsed_liga_data: data }),

      setSelectedTeam: (teamName) => set({ selected_team_name: teamName }),

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
      // Nur Step und non-File-Data speichern
      partialize: (state) => ({
        step: state.step,
        bbb_url: state.bbb_url,
        selected_team_name: state.selected_team_name,
        trainer_name: state.trainer_name,
        // parsed_liga_data wird NICHT gespeichert (zu groß)
      })
    }
  )
);
