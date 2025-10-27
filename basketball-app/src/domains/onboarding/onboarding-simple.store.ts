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
import { db } from '@shared/db/database';

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
              ort: state.selectedVerein.ort || 'Unbekannt',  // REQUIRED field
              ist_eigener_verein: true
            });
            vereinId = createdVerein.verein_id;
          }
          
          // 2. Teams in DB schreiben
          const createdTeamIds: string[] = [];
          
          for (const team of state.selectedTeams) {
            // Map altersklasse_id to Altersklasse type
            const altersklasse = team.altersklasse || 'U12';  // Use existing or default
            
            const createdTeam = await teamService.createTeam({
              verein_id: vereinId,
              name: team.name,
              altersklasse: altersklasse,  // Type-safe Altersklasse
              altersklasse_id: team.altersklasse_id,
              geschlecht: team.geschlecht || 'mixed',
              saison: team.saison,
              trainer: state.user ? `${state.user.vorname} ${state.user.nachname}` : 'Unbekannt',  // REQUIRED
              liga_id: team.liga_id || undefined,
              liga_name: team.liga_name || undefined
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
                for (const ligaId of Array.from(ligaIds)) {
                  console.log('🎯 Synchronisiere Liga:', ligaId);
                  
                  try {
                    await bbbSyncService.syncLiga(ligaId, { skipMatchInfo: true });
                    console.log('✅ Liga', ligaId, 'erfolgreich synchronisiert');
                  } catch (syncError) {
                    console.error('❌ Liga-Sync fehlgeschlagen für Liga', ligaId, ':', syncError);
                    // Weiter mit nächster Liga
                  }
                  
                  // Rate-Limiting zwischen Ligen
                  if (Array.from(ligaIds).indexOf(ligaId) < ligaIds.size - 1) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                  }
                }
                
                // ⭐ WICHTIG: Nach allen Liga-Syncs - Merge ALLE User-Teams mit Sync-Teams
                console.log('🔄 Starte Team-Merge für alle User-Teams...');
                
                for (let i = 0; i < createdTeamIds.length; i++) {
                  const userTeamId = createdTeamIds[i];
                  const userTeam = await db.teams.get(userTeamId);
                  if (!userTeam) {
                    console.warn('⚠️ User-Team nicht gefunden:', userTeamId);
                    continue;
                  }
                  
                  console.log('🔍 Prüfe User-Team:', userTeam.name, '(Liga:', userTeam.liga_id, ')');
                  
                  // ⭐ WICHTIG: Finde Sync-Team anhand von NAME + LIGA!
                  // Grund: Mehrere Teams können den gleichen Namen haben (z.B. "Regensburg Baskets 2")
                  const syncTeam = await db.teams
                    .where('name')
                    .equals(userTeam.name)
                    .and(team => 
                      team.extern_team_id !== undefined && 
                      team.team_id !== userTeam.team_id &&
                      team.liga_id === userTeam.liga_id  // ✅ WICHTIG: Auch Liga muss matchen!
                    )
                    .first();
                  
                  if (syncTeam && syncTeam.extern_team_id) {
                    console.log('🔄 Merge User-Team', userTeam.name, 'mit Sync-Team:', syncTeam.extern_team_id);
                        
                    // ✅ Übernehme extern_team_id, Altersklasse UND Saison vom Sync-Team
                    await db.teams.update(userTeamId, {
                      extern_team_id: syncTeam.extern_team_id,
                      altersklasse: syncTeam.altersklasse,  // ✅ Übernehme aus Liga
                      saison: syncTeam.saison,              // ✅ Übernehme aus Liga
                      team_typ: 'eigen', // ✅ Markiere als eigenes Team!
                    });
                    
                    // ⭐ WICHTIG: Update alle Spiele die das Sync-Team referenzieren!
                    // 1. Spiele mit heim_team_id
                    const spieleAsHeim = await db.spiele
                          .where('heim_team_id')
                          .equals(syncTeam.team_id)
                          .toArray();
                    
                    // 2. Spiele mit gast_team_id
                    const spieleAsGast = await db.spiele
                          .where('gast_team_id')
                          .equals(syncTeam.team_id)
                          .toArray();
                    
                    // 3. ✅ NEU: Spiele mit nur team_id (Legacy/U10-Fall)
                    const spieleByTeamId = await db.spiele
                          .where('team_id')
                          .equals(syncTeam.team_id)
                          .toArray();
                    
                    console.log('🔄 Update Spiele:', {
                      heimspiele: spieleAsHeim.length,
                      auswärtsspiele: spieleAsGast.length,
                      teamIdSpiele: spieleByTeamId.length
                    });
                    
                    // Update Heimspiele
                    for (const spiel of spieleAsHeim) {
                      await db.spiele.update(spiel.spiel_id, {
                        heim_team_id: userTeamId,
                        team_id: userTeamId // ✅ Auch team_id setzen!
                      });
                    }
                    
                    // Update Auswärtsspiele
                    for (const spiel of spieleAsGast) {
                      await db.spiele.update(spiel.spiel_id, {
                        gast_team_id: userTeamId,
                        team_id: userTeamId // ✅ Auch team_id setzen!
                      });
                    }
                    
                    // ⭐ Update team_id-only Spiele (U10-Fall)
                    for (const spiel of spieleByTeamId) {
                      // Bestimme ob Heim oder Auswärtsspiel
                      const istHeim = spiel.ist_heimspiel ?? true; // Fallback: true
                      
                      await db.spiele.update(spiel.spiel_id, {
                        team_id: userTeamId,
                        heim_team_id: istHeim ? userTeamId : spiel.heim_team_id,
                        gast_team_id: istHeim ? spiel.gast_team_id : userTeamId
                      });
                    }
                    
                    // Lösche das Sync-Team (Duplikat)
                    await db.teams.delete(syncTeam.team_id);
                    
                    console.log('✅ Team', userTeam.name, 'erfolgreich gemergt!');
                  } else {
                    console.log('ℹ️ Kein Sync-Team gefunden für:', userTeam.name);
                  }
                }
                
                // Zeige Stats nach allen Syncs
                const spieleCount = await db.spiele.count();
                const tabelleCount = await db.liga_tabellen.count();
                const teamsCount = await db.teams.count();
                console.log('📈 Gesamt-Sync-Stats:', { spieleCount, tabelleCount, teamsCount });
                
              } catch (error) {
                console.error('❌ Liga-Sync Setup Fehler:', error);
                // Zeige User-Hinweis, aber blockiere Onboarding nicht
                console.warn('⚠️ Liga-Daten können später über Sync-Button nachgeladen werden');
              }
            } else {
              console.warn('⚠️ Kein liga_id vorhanden - überspringe Liga-Sync');
            }
          
          // Save to localStorage
          localStorage.setItem('onboarding-complete', 'true');
          localStorage.setItem('active-team-id', firstTeamId);
          
          // ✅ Update app store with ALL teams
          const { useAppStore } = await import('@/stores/appStore');
          const appStore = useAppStore.getState();
          appStore.setMyTeams(createdTeamIds);  // ✅ Alle Teams setzen
          appStore.setCurrentTeam(firstTeamId);  // ✅ Erstes Team aktiv
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
