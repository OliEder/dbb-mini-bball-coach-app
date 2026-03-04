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
import type { Verein } from '@/shared/types';
import type { TeamWithParticipationData } from '@/shared/services/ClubDataLoader';
import { db } from '@/shared/db/database';

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
  selectedTeams: TeamWithParticipationData[];
  
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
  setTeams: (teams: TeamWithParticipationData[]) => void;
  
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
        const { bbbSyncService } = await import('@/shared/services/BBBSyncService');

        try {
          // 1. Verein in DB schreiben (falls noch nicht vorhanden)
          let vereinId = state.selectedVerein.verein_id;
          const existingVerein = await vereinService.getVereinById(vereinId);

          if (!existingVerein) {
            const createdVerein = await vereinService.createVerein({
              name: state.selectedVerein.name,
              kurzname: state.selectedVerein.kurzname,
              ort: state.selectedVerein.ort || 'Unbekannt',
              ist_eigener_verein: true
            });
            vereinId = createdVerein.verein_id;
          }

          // 2. Teams + Participations in DB schreiben (v7.0)
          const createdTeamIds: string[] = [];
          const trainerName = state.user
            ? `${state.user.vorname} ${state.user.nachname}`
            : 'Unbekannt';

          for (const team of state.selectedTeams) {
            const createdTeam = await teamService.createTeamWithParticipation({
              verein_id: vereinId,
              name: team.name,
              geschlecht: team.geschlecht || 'mixed',
              trainer: trainerName,
              team_typ: 'eigen',
              extern_permanent_id: team.extern_permanent_id,
              // Participation-Daten
              saison: team.saison,
              altersklasse: team.altersklasse,
              altersklasse_id: team.altersklasse_id,
              liga_id: team.liga_id,
              liga_name: team.liga_name,
              extern_team_id: team.extern_team_id,
            });

            createdTeamIds.push(createdTeam.team_id);
          }

          // 3. Erstes Team als aktives Team setzen
          const firstTeamId = createdTeamIds[0];

          // 4. Liga-Daten synchronisieren für ALLE Teams
          console.log('🔄 Starte Liga-Sync für alle Teams...');

          // Sammle alle eindeutigen Liga-IDs
          const ligaIds = new Set<number>();
          for (const team of state.selectedTeams) {
            if (team.liga_id) {
              const ligaIdMatch = team.liga_id.match(/\d+/);
              if (ligaIdMatch) {
                ligaIds.add(parseInt(ligaIdMatch[0], 10));
              }
            }
          }

          console.log('📊 Gefundene Ligen:', Array.from(ligaIds));

          if (ligaIds.size > 0) {
            console.log('🔄 Starte Liga-Sync für', ligaIds.size, 'Ligen...');

            try {
              // Synchronisiere alle Ligen nacheinander
              const ligaIdArray = Array.from(ligaIds);
              for (let i = 0; i < ligaIdArray.length; i++) {
                const ligaId = ligaIdArray[i];
                console.log('🎯 Synchronisiere Liga:', ligaId);

                try {
                  await bbbSyncService.syncLiga(ligaId, { skipMatchInfo: true });
                  console.log('✅ Liga', ligaId, 'erfolgreich synchronisiert');
                } catch (syncError) {
                  console.error('❌ Liga-Sync fehlgeschlagen für Liga', ligaId, ':', syncError);
                  // Weiter mit nächster Liga
                }

                // Rate-Limiting zwischen Ligen
                if (i < ligaIdArray.length - 1) {
                  await new Promise(resolve => setTimeout(resolve, 500));
                }
              }

              // ⭐ Nach allen Liga-Syncs: Merge User-Teams mit Sync-Teams (v7.0)
              console.log('🔄 Starte Team-Merge für alle User-Teams...');

              for (const userTeamId of createdTeamIds) {
                const userTeam = await db.teams.get(userTeamId);
                if (!userTeam) {
                  console.warn('⚠️ User-Team nicht gefunden:', userTeamId);
                  continue;
                }

                console.log('🔍 Prüfe User-Team:', userTeam.name);

                // v7.0: Hole Participation des User-Teams für Liga-Vergleich
                const userParticipation = await db.team_liga_participations
                  .where('team_id')
                  .equals(userTeamId)
                  .and(p => p.ist_aktiv === true)
                  .first();

                // Finde passendes Sync-Team anhand von NAME + extern_permanent_id
                const syncTeam = await db.teams
                  .where('name')
                  .equals(userTeam.name)
                  .and(t =>
                    t.extern_permanent_id !== undefined &&
                    t.team_id !== userTeamId
                  )
                  .first();

                if (!syncTeam || !syncTeam.extern_permanent_id) {
                  console.log('ℹ️ Kein Sync-Team gefunden für:', userTeam.name);
                  continue;
                }

                // v7.0: Prüfe ob gleiche Liga via Participation
                if (userParticipation) {
                  const syncParticipation = await db.team_liga_participations
                    .where('team_id')
                    .equals(syncTeam.team_id)
                    .and(p => p.liga_id === userParticipation.liga_id)
                    .first();

                  if (!syncParticipation) {
                    console.log('ℹ️ Sync-Team in anderer Liga, überspringe:', syncTeam.name);
                    continue;
                  }

                  // Übernehme extern_team_id aus Sync-Participation in User-Participation
                  if (syncParticipation.extern_team_id) {
                    await db.team_liga_participations.update(userParticipation.id!, {
                      extern_team_id: syncParticipation.extern_team_id,
                    });
                  }
                }

                console.log('🔄 Merge User-Team', userTeam.name, 'mit Sync-Team:', syncTeam.extern_permanent_id);

                // v7.0: Übernehme extern_permanent_id, setze team_typ = 'eigen'
                await db.teams.update(userTeamId, {
                  extern_permanent_id: syncTeam.extern_permanent_id,
                  team_typ: 'eigen',
                });

                // Update alle Spiele die das Sync-Team referenzieren
                const spieleAsHeim = await db.spiele
                  .where('heim_team_id')
                  .equals(syncTeam.team_id)
                  .toArray();

                const spieleAsGast = await db.spiele
                  .where('gast_team_id')
                  .equals(syncTeam.team_id)
                  .toArray();

                console.log('🔄 Update Spiele:', {
                  heimspiele: spieleAsHeim.length,
                  auswärtsspiele: spieleAsGast.length,
                });

                for (const spiel of spieleAsHeim) {
                  await db.spiele.update(spiel.spiel_id, { heim_team_id: userTeamId });
                }

                for (const spiel of spieleAsGast) {
                  await db.spiele.update(spiel.spiel_id, { gast_team_id: userTeamId });
                }

                // Lösche das Sync-Team (Duplikat)
                await db.teams.delete(syncTeam.team_id);

                console.log('✅ Team', userTeam.name, 'erfolgreich gemergt!');
              }

              // Zeige Stats nach allen Syncs
              const spieleCount = await db.spiele.count();
              const tabelleCount = await db.liga_tabellen.count();
              const teamsCount = await db.teams.count();
              console.log('📈 Gesamt-Sync-Stats:', { spieleCount, tabelleCount, teamsCount });

            } catch (error) {
              console.error('❌ Liga-Sync Setup Fehler:', error);
              console.warn('⚠️ Liga-Daten können später über Sync-Button nachgeladen werden');
            }
          } else {
            console.warn('⚠️ Kein liga_id vorhanden - überspringe Liga-Sync');
          }

          // Save to localStorage
          localStorage.setItem('onboarding-complete', 'true');
          localStorage.setItem('active-team-id', firstTeamId);

          // Update app store with ALL teams
          const { useAppStore } = await import('@/stores/appStore');
          const appStore = useAppStore.getState();
          appStore.setMyTeams(createdTeamIds);
          appStore.setCurrentTeam(firstTeamId);
          appStore.completeOnboarding();

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
