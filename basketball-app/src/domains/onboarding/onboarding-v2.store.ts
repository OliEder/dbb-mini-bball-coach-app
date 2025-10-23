/**
 * Onboarding v2 Store
 * 
 * Geführter Multi-Step Flow mit DBB API Integration
 * Filtert Schritt für Schritt bis zur Liga-Auswahl
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { 
  User, 
  Team, 
  Verein, 
  Liga,
  WamFilterOption,
  WamLigaEintrag,
  DBBTabellenEintrag
} from '@shared/types';

export type OnboardingV2Step = 
  | 'welcome'
  | 'user'
  | 'verband'
  | 'altersklassen'
  | 'gebiet'
  | 'ligen-loading'
  | 'verein'
  | 'team-select'
  | 'sync'
  | 'team-selection';

interface OnboardingV2State {
  // Current Step
  currentStep: OnboardingV2Step;
  completedSteps: OnboardingV2Step[];
  
  // User Data
  user: {
    vorname: string;
    nachname: string;
  } | null;
  
  // Filter Selections
  selectedVerband: number | null;  // verband_id (z.B. 2 = Bayern)
  selectedAltersklassen: number[];  // Array von AK-IDs
  selectedGebiet: string | null;    // Gebiet-ID
  
  // API Response Data
  verfuegbareVerbaende: WamFilterOption[];
  verfuegbareAltersklassen: WamFilterOption[];
  verfuegbareGebiete: WamFilterOption[];
  gefundeneLigen: WamLigaEintrag[];
  
  // Loaded Teams from Ligen
  geladeneTeams: Map<string, DBBTabellenEintrag[]>;  // ligaId -> teams
  geladeneVereine: Verein[];
  
  // User Selections
  selectedVerein: Verein | null;
  selectedClubId: string | null;  // Für lokale Club-Daten (V3)
  eigeneTeams: Team[];  // Mehrfachauswahl möglich
  aktivesTeam: Team | null;  // Das aktuell zu verwaltende Team
  
  // Loading States
  isLoadingVerbaende: boolean;
  isLoadingAltersklassen: boolean;
  isLoadingGebiete: boolean;
  isLoadingLigen: boolean;
  isSyncing: boolean;
  
  // Error States
  error: string | null;
}

interface OnboardingV2Actions {
  // Navigation
  setStep: (step: OnboardingV2Step) => void;
  nextStep: () => void;
  previousStep: () => void;
  canGoNext: () => boolean;
  canGoBack: () => boolean;
  
  // User
  setUserData: (user: { vorname: string; nachname: string }) => void;
  
  // Filter Selections
  setVerband: (verbandId: number) => void;
  setAltersklassen: (altersklassenIds: number[]) => void;
  setGebiet: (gebietId: string) => void;
  
  // API Data
  setVerbaende: (verbaende: WamFilterOption[]) => void;
  setVerfuegbareAltersklassen: (altersklassen: WamFilterOption[]) => void;
  setGebiete: (gebiete: WamFilterOption[]) => void;
  setLigen: (ligen: WamLigaEintrag[]) => void;
  addTeamsForLiga: (ligaId: string, teams: DBBTabellenEintrag[]) => void;
  setVereine: (vereine: Verein[]) => void;
  
  // User Selections
  selectVerein: (verein: Verein) => void;
  toggleTeam: (team: Team) => void;
  setAktivesTeam: (team: Team) => void;
  
  // Loading States
  setLoadingVerbaende: (loading: boolean) => void;
  setLoadingAltersklassen: (loading: boolean) => void;
  setLoadingGebiete: (loading: boolean) => void;
  setLoadingLigen: (loading: boolean) => void;
  setSyncing: (syncing: boolean) => void;
  
  // Error
  setError: (error: string | null) => void;
  
  // Reset
  reset: () => void;
  
  // Completion
  completeOnboarding: () => Promise<void>;
}

const STEP_ORDER: OnboardingV2Step[] = [
  'welcome',
  'user',
  'verband',
  'altersklassen',
  'gebiet',
  'ligen-loading',
  'verein',
  'team-select',
  'sync',
  'team-selection'
];

const initialState: OnboardingV2State = {
  currentStep: 'welcome',
  completedSteps: [],
  user: null,
  selectedVerband: null,
  selectedAltersklassen: [],
  selectedGebiet: null,
  verfuegbareVerbaende: [],
  verfuegbareAltersklassen: [],
  verfuegbareGebiete: [],
  gefundeneLigen: [],
  geladeneTeams: new Map(),
  geladeneVereine: [],
  selectedVerein: null,
  selectedClubId: null,
  eigeneTeams: [],
  aktivesTeam: null,
  isLoadingVerbaende: false,
  isLoadingAltersklassen: false,
  isLoadingGebiete: false,
  isLoadingLigen: false,
  isSyncing: false,
  error: null
};

export const useOnboardingV2Store = create<OnboardingV2State & OnboardingV2Actions>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // Navigation
      setStep: (step: OnboardingV2Step) => {
        const completedSteps = get().completedSteps;
        const currentIndex = STEP_ORDER.indexOf(get().currentStep);
        const newIndex = STEP_ORDER.indexOf(step);
        
        // Mark all steps up to current as completed
        if (newIndex > currentIndex) {
          const newCompleted = STEP_ORDER.slice(0, newIndex).filter(
            s => !completedSteps.includes(s)
          );
          set({ 
            currentStep: step,
            completedSteps: [...completedSteps, ...newCompleted]
          });
        } else {
          set({ currentStep: step });
        }
      },
      
      nextStep: () => {
        const currentIndex = STEP_ORDER.indexOf(get().currentStep);
        if (currentIndex < STEP_ORDER.length - 1 && get().canGoNext()) {
          const nextStep = STEP_ORDER[currentIndex + 1];
          get().setStep(nextStep);
        }
      },
      
      previousStep: () => {
        const currentIndex = STEP_ORDER.indexOf(get().currentStep);
        if (currentIndex > 0) {
          const prevStep = STEP_ORDER[currentIndex - 1];
          get().setStep(prevStep);
        }
      },
      
      canGoNext: () => {
        const state = get();
        switch (state.currentStep) {
          case 'welcome':
            return true;
          case 'user':
            return !!(state.user?.vorname && state.user?.nachname);
          case 'verband':
            return state.selectedVerband !== null;
          case 'altersklassen':
            return state.selectedAltersklassen.length > 0;
          case 'gebiet':
            return state.selectedGebiet !== null;
          case 'ligen-loading':
            return state.gefundeneLigen.length > 0 && !state.isLoadingLigen;
          case 'verein':
            return state.selectedVerein !== null;
          case 'team-select':
            return state.eigeneTeams.length > 0;
          case 'sync':
            return !state.isSyncing;
          case 'team-selection':
            return state.aktivesTeam !== null;
          default:
            return false;
        }
      },
      
      canGoBack: () => {
        const currentIndex = STEP_ORDER.indexOf(get().currentStep);
        return currentIndex > 0;
      },
      
      // User
      setUserData: (user) => set({ user }),
      
      // Filter Selections
      setVerband: (verbandId) => set({ selectedVerband: verbandId }),
      setAltersklassen: (altersklassenIds) => set({ selectedAltersklassen: altersklassenIds }),
      setGebiet: (gebietId) => set({ selectedGebiet: gebietId }),
      
      // API Data
      setVerbaende: (verbaende) => set({ verfuegbareVerbaende: verbaende }),
      setVerfuegbareAltersklassen: (altersklassen) => set({ verfuegbareAltersklassen: altersklassen }),
      setGebiete: (gebiete) => set({ verfuegbareGebiete: gebiete }),
      setLigen: (ligen) => set({ gefundeneLigen: ligen }),
      
      addTeamsForLiga: (ligaId, teams) => {
        const geladeneTeams = new Map(get().geladeneTeams);
        geladeneTeams.set(ligaId, teams);
        set({ geladeneTeams });
      },
      
      setVereine: (vereine) => set({ geladeneVereine: vereine }),
      
      // User Selections
      selectVerein: (verein) => set({ selectedVerein: verein }),
      
      toggleTeam: (team) => {
        const eigeneTeams = get().eigeneTeams;
        const exists = eigeneTeams.find(t => t.team_id === team.team_id);
        
        if (exists) {
          set({ 
            eigeneTeams: eigeneTeams.filter(t => t.team_id !== team.team_id) 
          });
        } else {
          set({ 
            eigeneTeams: [...eigeneTeams, team] 
          });
        }
      },
      
      setAktivesTeam: (team) => set({ aktivesTeam: team }),
      
      // Loading States
      setLoadingVerbaende: (loading) => set({ isLoadingVerbaende: loading }),
      setLoadingAltersklassen: (loading) => set({ isLoadingAltersklassen: loading }),
      setLoadingGebiete: (loading) => set({ isLoadingGebiete: loading }),
      setLoadingLigen: (loading) => set({ isLoadingLigen: loading }),
      setSyncing: (syncing) => set({ isSyncing: syncing }),
      
      // Error
      setError: (error) => set({ error }),
      
      // Reset
      reset: () => set(initialState),
      
      // Completion
      completeOnboarding: async () => {
        const state = get();
        
        // Validate required data
        if (!state.user || !state.selectedVerein || state.eigeneTeams.length === 0) {
          throw new Error('Onboarding nicht vollständig');
        }
        
        // Mark onboarding as complete
        localStorage.setItem('onboarding-v2-complete', 'true');
        
        // Save active team
        if (state.aktivesTeam) {
          localStorage.setItem('active-team-id', state.aktivesTeam.team_id);
        }
        
        // Update global app store
        const appStore = (await import('@/stores/appStore')).useAppStore.getState();
        appStore.completeOnboarding();
        if (state.aktivesTeam) {
          appStore.setCurrentTeam(state.aktivesTeam.team_id);
        }
      }
    }),
    {
      name: 'basketball-onboarding-v2',
      partialize: (state) => ({
        currentStep: state.currentStep,
        completedSteps: state.completedSteps,
        user: state.user,
        selectedVerband: state.selectedVerband,
        selectedAltersklassen: state.selectedAltersklassen,
        selectedGebiet: state.selectedGebiet,
        selectedVerein: state.selectedVerein,
        selectedClubId: state.selectedClubId,
        eigeneTeams: state.eigeneTeams,
        aktivesTeam: state.aktivesTeam
      })
    }
  )
);
