/**
 * App Store - Globaler Application State
 * 
 * Verwaltet aktuelles Team, User-Status, etc.
 * 
 * Phase 2: Multi-Team Support
 * - Mehrere Teams pro Trainer
 * - Team-Switcher Funktionalität
 * - Persistente Team-Auswahl
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UUID } from '@/shared/types';

interface AppStore {
  // Current State
  currentTeamId: UUID | null;
  myTeamIds: UUID[];  // ✅ NEU: Liste aller eigenen Teams
  hasCompletedOnboarding: boolean;
  
  // Actions
  setCurrentTeam: (teamId: UUID) => void;
  setMyTeams: (teamIds: UUID[]) => void;      // ✅ NEU
  switchTeam: (teamId: UUID) => void;          // ✅ NEU
  completeOnboarding: () => void;
  reset: () => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      currentTeamId: null,
      myTeamIds: [],  // ✅ NEU: Initial leeres Array
      hasCompletedOnboarding: false,

      setCurrentTeam: (teamId) => set({ currentTeamId: teamId }),

      /**
       * Setzt die Liste aller eigenen Teams
       * Wenn noch kein Team aktiv, wird das erste Team automatisch aktiviert
       */
      setMyTeams: (teamIds) => {
        const currentTeamId = get().currentTeamId;
        
        set({ 
          myTeamIds: teamIds,
          // Wenn noch kein Team aktiv UND Teams vorhanden, setze erstes Team
          currentTeamId: currentTeamId || (teamIds.length > 0 ? teamIds[0] : null)
        });
      },

      /**
       * Wechselt zum angegebenen Team
       * Nur möglich wenn Team in myTeamIds vorhanden ist
       */
      switchTeam: (teamId) => {
        const { myTeamIds } = get();
        
        if (myTeamIds.includes(teamId)) {
          set({ currentTeamId: teamId });
        } else {
          console.warn(
            `Cannot switch to team ${teamId} - not in myTeamIds. ` +
            `Available teams: ${myTeamIds.join(', ')}`
          );
        }
      },

      completeOnboarding: () => set({ hasCompletedOnboarding: true }),

      reset: () => set({
        currentTeamId: null,
        myTeamIds: [],  // ✅ NEU: Reset auf leeres Array
        hasCompletedOnboarding: false
      })
    }),
    {
      name: 'basketball-app'
    }
  )
);
