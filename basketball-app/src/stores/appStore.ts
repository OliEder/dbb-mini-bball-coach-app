/**
 * App Store - Globaler Application State
 * 
 * Verwaltet aktuelles Team, User-Status, etc.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UUID } from '@/shared/types';

interface AppStore {
  // Current State
  currentTeamId: UUID | null;
  hasCompletedOnboarding: boolean;
  
  // Actions
  setCurrentTeam: (teamId: UUID) => void;
  completeOnboarding: () => void;
  reset: () => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      currentTeamId: null,
      hasCompletedOnboarding: false,

      setCurrentTeam: (teamId) => set({ currentTeamId: teamId }),

      completeOnboarding: () => set({ hasCompletedOnboarding: true }),

      reset: () => set({
        currentTeamId: null,
        hasCompletedOnboarding: false
      })
    }),
    {
      name: 'basketball-app'
    }
  )
);
