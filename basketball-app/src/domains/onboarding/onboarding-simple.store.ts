/**
 * Simplified Onboarding Store
 * 
 * Schlanker Flow:
 * 1. Welcome
 * 2. User
 * 3. Verein (mit optionalem Verband-Filter)
 * 4. Team
 * 5. Completion
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Team, Verein } from '@shared/types';

export type SimpleOnboardingStep = 
  | 'welcome'
  | 'user'
  | 'verein'
  | 'team'
  | 'completion';

interface SimpleOnboardingState {
  // Current Step
  currentStep: SimpleOnboardingStep;
  
  // User Data
  user: {
    vorname: string;
    nachname: string;
  } | null;
  
  // Optional Filter
  selectedVerbandFilter: number | null;  // Optional: Verband-Filter für Vereinsliste
  
  // Selections
  selectedVerein: Verein | null;
  selectedClubId: string | null;
  selectedTeams: Team[];
  
  // Error
  error: string | null;
}

interface SimpleOnboardingActions {
  // Navigation
  setStep: (step: SimpleOnboardingStep) => void;
  nextStep: () => void;
  previousStep: () => void;
  
  // User
  setUser: (user: { vorname: string; nachname: string }) => void;
  
  // Filter
  setVerbandFilter: (verbandId: number | null) => void;
  
  // Selections
  setVerein: (verein: Verein, clubId: string) => void;
  setTeams: (teams: Team[]) => void;
  
  // Error
  setError: (error: string | null) => void;
  
  // Reset
  reset: () => void;
  
  // Completion
  completeOnboarding: () => Promise<void>;
}

const STEP_ORDER: SimpleOnboardingStep[] = [
  'welcome',
  'user',
  'verein',
  'team',
  'completion'
];

const initialState: SimpleOnboardingState = {
  currentStep: 'welcome',
  user: null,
  selectedVerbandFilter: null,
  selectedVerein: null,
  selectedClubId: null,
  selectedTeams: [],
  error: null
};

export const useSimpleOnboardingStore = create<SimpleOnboardingState & SimpleOnboardingActions>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // Navigation
      setStep: (step) => set({ currentStep: step }),
      
      nextStep: () => {
        const currentIndex = STEP_ORDER.indexOf(get().currentStep);
        if (currentIndex < STEP_ORDER.length - 1) {
          set({ currentStep: STEP_ORDER[currentIndex + 1] });
        }
      },
      
      previousStep: () => {
        const currentIndex = STEP_ORDER.indexOf(get().currentStep);
        if (currentIndex > 0) {
          set({ currentStep: STEP_ORDER[currentIndex - 1] });
        }
      },
      
      // User
      setUser: (user) => set({ user }),
      
      // Filter
      setVerbandFilter: (verbandId) => set({ selectedVerbandFilter: verbandId }),
      
      // Selections
      setVerein: (verein, clubId) => set({ 
        selectedVerein: verein, 
        selectedClubId: clubId 
      }),
      
      setTeams: (teams) => set({ selectedTeams: teams }),
      
      // Error
      setError: (error) => set({ error }),
      
      // Reset
      reset: () => set(initialState),
      
      // Completion
      completeOnboarding: async () => {
        const state = get();
        
        if (!state.user || !state.selectedVerein || state.selectedTeams.length === 0) {
          throw new Error('Onboarding nicht vollständig');
        }
        
        // Import Services
        const { vereinService } = await import('@/domains/verein/services/VereinService');
        const { teamService } = await import('@/domains/team/services/TeamService');
        const { bbbSyncService } = await import('@/domains/bbb-api/services/BBBSyncService');
        
          try {
          // 1. Verein in DB schreiben (falls noch nicht vorhanden)
          let vereinId = state.selectedVerein.verein_id;
          const existingVerein = await vereinService.getVereinById(vereinId);
          
          if (!existingVerein) {
            const createdVerein = await vereinService.createVerein({
              name: state.selectedVerein.name,
              kurzname: state.selectedVerein.kurzname,
              ist_eigener_verein: true
            });
            vereinId = createdVerein.verein_id;
          }
          
          // 2. Teams in DB schreiben
          const createdTeamIds: string[] = [];
          
          for (const team of state.selectedTeams) {
            const createdTeam = await teamService.createTeam({
              verein_id: vereinId,
              name: team.name,
              altersklasse: team.altersklasse_id?.toString() || 'U12',
              geschlecht: team.geschlecht || 'mixed',
              saison: team.saison,
              liga_id: team.liga_id || undefined,
              liga_name: team.liga_name || undefined
            });
            
            createdTeamIds.push(createdTeam.team_id);
          }
          
          // 3. Erstes Team als aktives Team setzen
          const firstTeamId = createdTeamIds[0];
            
            // 4. Liga-Daten synchronisieren (falls liga_id vorhanden)
            const firstTeam = state.selectedTeams[0];
            if (firstTeam.liga_id) {
              console.log('🔄 Starte Liga-Sync für:', firstTeam.liga_id);
              
              try {
                // Extrahiere Liga-ID aus liga_id String (kann Format "123" oder "liga-123" haben)
                const ligaIdMatch = firstTeam.liga_id.match(/\d+/);
                if (ligaIdMatch) {
                  const ligaId = parseInt(ligaIdMatch[0], 10);
                  
                  // Sync im Hintergrund starten (nicht blockierend)
                  bbbSyncService.syncLiga(ligaId, { skipMatchInfo: true })
                    .then(() => {
                      console.log('✅ Liga-Sync abgeschlossen');
                    })
                    .catch((error) => {
                      console.warn('⚠️ Liga-Sync fehlgeschlagen:', error);
                      // Nicht kritisch - Onboarding kann fortgesetzt werden
                    });
                } else {
                  console.warn('⚠️ Konnte Liga-ID nicht parsen:', firstTeam.liga_id);
                }
              } catch (error) {
                console.warn('⚠️ Liga-Sync Fehler:', error);
                // Nicht kritisch
              }
            }
          
          // Save to localStorage
          localStorage.setItem('onboarding-complete', 'true');
          localStorage.setItem('active-team-id', firstTeamId);
          
          // Update app store
          const { useAppStore } = await import('@/stores/appStore');
          const appStore = useAppStore.getState();
          appStore.completeOnboarding();
          appStore.setCurrentTeam(firstTeamId);
          
          console.log('✅ Onboarding completed successfully');
          console.log('Created Teams:', createdTeamIds);
          
        } catch (error) {
          console.error('❌ Failed to complete onboarding:', error);
          throw error;
        }
      }
    }),
    {
      name: 'basketball-onboarding-simple',
      partialize: (state) => ({
        currentStep: state.currentStep,
        user: state.user,
        selectedVerbandFilter: state.selectedVerbandFilter,
        selectedVerein: state.selectedVerein,
        selectedClubId: state.selectedClubId,
        selectedTeams: state.selectedTeams
      })
    }
  )
);

// Expose store for E2E tests
if (typeof window !== 'undefined') {
  (window as any).__SIMPLE_ONBOARDING_STORE__ = useSimpleOnboardingStore;
}
