/**
 * Simplified Onboarding Store Tests
 * 
 * RED Phase: Tests für onboarding-simple.store.ts
 * 
 * Coverage:
 * - State Management
 * - Navigation
 * - User Input
 * - Filter
 * - Selections (Verein, Teams)
 * - Error Handling
 * - Reset
 * - Complete Onboarding
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useSimpleOnboardingStore } from '@/domains/onboarding/onboarding-simple.store';
import type { Verein, Team } from '@/shared/types';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Test Data
const testUser = {
  vorname: 'Max',
  nachname: 'Mustermann'
};

const testVerein: Verein = {
  verein_id: 'verein-1',
  extern_verein_id: 'ext-001',
  name: 'TSV Pilsach',
  kurzname: 'Pilsach',
  ort: 'Pilsach',
  ist_eigener_verein: true,
  created_at: new Date()
};

const testTeam1: Team = {
  team_id: 'team-1',
  extern_permanent_id: 'perm-001',
  verein_id: 'verein-1',
  name: 'U12',
  geschlecht: 'mixed',
  trainer: 'Max Mustermann',
  team_typ: 'eigen',
  created_at: new Date()
};

const testTeam2: Team = {
  team_id: 'team-2',
  extern_permanent_id: 'perm-002',
  verein_id: 'verein-1',
  name: 'U10',
  geschlecht: 'mixed',
  trainer: 'Max Mustermann',
  team_typ: 'eigen',
  created_at: new Date()
};

describe('useSimpleOnboardingStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useSimpleOnboardingStore.getState().reset();
    localStorageMock.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useSimpleOnboardingStore.getState();

      expect(state.currentStep).toBe('welcome');
      expect(state.user).toBeNull();
      expect(state.selectedVerbandFilter).toBeNull();
      expect(state.selectedVerein).toBeNull();
      expect(state.selectedClubId).toBeNull();
      expect(state.selectedTeams).toEqual([]);
      expect(state.error).toBeNull();
    });
  });

  describe('Navigation', () => {
    it('should navigate to next step', () => {
      const { setStep, nextStep } = useSimpleOnboardingStore.getState();

      setStep('welcome');
      nextStep();

      expect(useSimpleOnboardingStore.getState().currentStep).toBe('user');
    });

    it('should navigate to previous step', () => {
      const { setStep, previousStep } = useSimpleOnboardingStore.getState();

      setStep('verein');
      previousStep();

      expect(useSimpleOnboardingStore.getState().currentStep).toBe('user');
    });

    it('should not go beyond last step', () => {
      const { setStep, nextStep } = useSimpleOnboardingStore.getState();

      setStep('completion');
      nextStep();

      expect(useSimpleOnboardingStore.getState().currentStep).toBe('completion');
    });

    it('should not go before first step', () => {
      const { setStep, previousStep } = useSimpleOnboardingStore.getState();

      setStep('welcome');
      previousStep();

      expect(useSimpleOnboardingStore.getState().currentStep).toBe('welcome');
    });

    it('should navigate through all steps in order', () => {
      const { nextStep } = useSimpleOnboardingStore.getState();
      const steps: string[] = [];

      for (let i = 0; i < 5; i++) {
        steps.push(useSimpleOnboardingStore.getState().currentStep);
        nextStep();
      }

      expect(steps).toEqual(['welcome', 'user', 'verein', 'team', 'completion']);
    });

    it('should set step directly', () => {
      const { setStep } = useSimpleOnboardingStore.getState();

      setStep('team');

      expect(useSimpleOnboardingStore.getState().currentStep).toBe('team');
    });
  });

  describe('User Management', () => {
    it('should set user data', () => {
      const { setUser } = useSimpleOnboardingStore.getState();

      setUser(testUser);

      expect(useSimpleOnboardingStore.getState().user).toEqual(testUser);
    });

    it('should update user data', () => {
      const { setUser } = useSimpleOnboardingStore.getState();

      setUser(testUser);
      setUser({ vorname: 'Lisa', nachname: 'Musterfrau' });

      const state = useSimpleOnboardingStore.getState();
      expect(state.user?.vorname).toBe('Lisa');
      expect(state.user?.nachname).toBe('Musterfrau');
    });

    it('should allow partial user data', () => {
      const { setUser } = useSimpleOnboardingStore.getState();

      setUser({ vorname: 'Max', nachname: '' });

      const state = useSimpleOnboardingStore.getState();
      expect(state.user?.vorname).toBe('Max');
      expect(state.user?.nachname).toBe('');
    });
  });

  describe('Verband Filter', () => {
    it('should set verband filter', () => {
      const { setVerbandFilter } = useSimpleOnboardingStore.getState();

      setVerbandFilter(2); // Bayern

      expect(useSimpleOnboardingStore.getState().selectedVerbandFilter).toBe(2);
    });

    it('should clear verband filter', () => {
      const { setVerbandFilter } = useSimpleOnboardingStore.getState();

      setVerbandFilter(2);
      setVerbandFilter(null);

      expect(useSimpleOnboardingStore.getState().selectedVerbandFilter).toBeNull();
    });

    it('should update verband filter', () => {
      const { setVerbandFilter } = useSimpleOnboardingStore.getState();

      setVerbandFilter(2);
      setVerbandFilter(5); // Hamburg

      expect(useSimpleOnboardingStore.getState().selectedVerbandFilter).toBe(5);
    });
  });

  describe('Verein Selection', () => {
    it('should set verein and clubId', () => {
      const { setVerein } = useSimpleOnboardingStore.getState();

      setVerein(testVerein, 'club-001');

      const state = useSimpleOnboardingStore.getState();
      expect(state.selectedVerein).toEqual(testVerein);
      expect(state.selectedClubId).toBe('club-001');
    });

    it('should update verein selection', () => {
      const { setVerein } = useSimpleOnboardingStore.getState();

      const verein2: Verein = {
        ...testVerein,
        verein_id: 'verein-2',
        name: 'TSV München'
      };

      setVerein(testVerein, 'club-001');
      setVerein(verein2, 'club-002');

      const state = useSimpleOnboardingStore.getState();
      expect(state.selectedVerein?.name).toBe('TSV München');
      expect(state.selectedClubId).toBe('club-002');
    });
  });

  describe('Team Selection', () => {
    it('should set single team', () => {
      const { setTeams } = useSimpleOnboardingStore.getState();

      setTeams([testTeam1]);

      expect(useSimpleOnboardingStore.getState().selectedTeams).toEqual([testTeam1]);
    });

    it('should set multiple teams', () => {
      const { setTeams } = useSimpleOnboardingStore.getState();

      setTeams([testTeam1, testTeam2]);

      const state = useSimpleOnboardingStore.getState();
      expect(state.selectedTeams).toHaveLength(2);
      expect(state.selectedTeams).toContainEqual(testTeam1);
      expect(state.selectedTeams).toContainEqual(testTeam2);
    });

    it('should replace teams on update', () => {
      const { setTeams } = useSimpleOnboardingStore.getState();

      setTeams([testTeam1]);
      setTeams([testTeam2]);

      const state = useSimpleOnboardingStore.getState();
      expect(state.selectedTeams).toHaveLength(1);
      expect(state.selectedTeams[0]).toEqual(testTeam2);
    });

    it('should clear teams with empty array', () => {
      const { setTeams } = useSimpleOnboardingStore.getState();

      setTeams([testTeam1, testTeam2]);
      setTeams([]);

      expect(useSimpleOnboardingStore.getState().selectedTeams).toEqual([]);
    });
  });

  describe('Error Handling', () => {
    it('should set error message', () => {
      const { setError } = useSimpleOnboardingStore.getState();

      setError('Test error');

      expect(useSimpleOnboardingStore.getState().error).toBe('Test error');
    });

    it('should clear error', () => {
      const { setError } = useSimpleOnboardingStore.getState();

      setError('Test error');
      setError(null);

      expect(useSimpleOnboardingStore.getState().error).toBeNull();
    });

    it('should update error message', () => {
      const { setError } = useSimpleOnboardingStore.getState();

      setError('Error 1');
      setError('Error 2');

      expect(useSimpleOnboardingStore.getState().error).toBe('Error 2');
    });
  });

  describe('Reset', () => {
    it('should reset all state to initial values', () => {
      const { setUser, setVerein, setTeams, setVerbandFilter, setError, setStep, reset } = 
        useSimpleOnboardingStore.getState();

      // Set some state
      setStep('team');
      setUser(testUser);
      setVerbandFilter(2);
      setVerein(testVerein, 'club-001');
      setTeams([testTeam1, testTeam2]);
      setError('Test error');

      // Reset
      reset();

      // Verify all reset
      const state = useSimpleOnboardingStore.getState();
      expect(state.currentStep).toBe('welcome');
      expect(state.user).toBeNull();
      expect(state.selectedVerbandFilter).toBeNull();
      expect(state.selectedVerein).toBeNull();
      expect(state.selectedClubId).toBeNull();
      expect(state.selectedTeams).toEqual([]);
      expect(state.error).toBeNull();
    });
  });

  describe('Complete Onboarding - Validation', () => {
    it('should throw error if user is missing', async () => {
      const { setVerein, setTeams, completeOnboarding } = useSimpleOnboardingStore.getState();

      setVerein(testVerein, 'club-001');
      setTeams([testTeam1]);

      await expect(completeOnboarding()).rejects.toThrow('Onboarding nicht vollständig');
    });

    it('should throw error if verein is missing', async () => {
      const { setUser, setTeams, completeOnboarding } = useSimpleOnboardingStore.getState();

      setUser(testUser);
      setTeams([testTeam1]);

      await expect(completeOnboarding()).rejects.toThrow('Onboarding nicht vollständig');
    });

    it('should throw error if teams are empty', async () => {
      const { setUser, setVerein, completeOnboarding } = useSimpleOnboardingStore.getState();

      setUser(testUser);
      setVerein(testVerein, 'club-001');

      await expect(completeOnboarding()).rejects.toThrow('Onboarding nicht vollständig');
    });
  });

  describe('Workflow Integration', () => {
    it('should complete full onboarding workflow', () => {
      const {
        setStep,
        setUser,
        setVerbandFilter,
        setVerein,
        setTeams,
        nextStep
      } = useSimpleOnboardingStore.getState();

      // Welcome
      expect(useSimpleOnboardingStore.getState().currentStep).toBe('welcome');
      nextStep();

      // User
      expect(useSimpleOnboardingStore.getState().currentStep).toBe('user');
      setUser(testUser);
      expect(useSimpleOnboardingStore.getState().user).toEqual(testUser);
      nextStep();

      // Verein
      expect(useSimpleOnboardingStore.getState().currentStep).toBe('verein');
      setVerbandFilter(2);
      setVerein(testVerein, 'club-001');
      expect(useSimpleOnboardingStore.getState().selectedVerein).toEqual(testVerein);
      nextStep();

      // Team
      expect(useSimpleOnboardingStore.getState().currentStep).toBe('team');
      setTeams([testTeam1, testTeam2]);
      expect(useSimpleOnboardingStore.getState().selectedTeams).toHaveLength(2);
      nextStep();

      // Completion
      expect(useSimpleOnboardingStore.getState().currentStep).toBe('completion');

      // Verify all data is still present
      const finalState = useSimpleOnboardingStore.getState();
      expect(finalState.user).toEqual(testUser);
      expect(finalState.selectedVerein).toEqual(testVerein);
      expect(finalState.selectedTeams).toHaveLength(2);
    });

    it('should allow navigation back and forth', () => {
      const { setUser, setVerein, nextStep, previousStep } = useSimpleOnboardingStore.getState();

      // Forward
      nextStep(); // -> user
      setUser(testUser);
      nextStep(); // -> verein
      setVerein(testVerein, 'club-001');
      nextStep(); // -> team

      // Back
      previousStep(); // -> verein
      expect(useSimpleOnboardingStore.getState().currentStep).toBe('verein');
      expect(useSimpleOnboardingStore.getState().selectedVerein).toEqual(testVerein);

      previousStep(); // -> user
      expect(useSimpleOnboardingStore.getState().currentStep).toBe('user');
      expect(useSimpleOnboardingStore.getState().user).toEqual(testUser);

      // Forward again
      nextStep(); // -> verein
      nextStep(); // -> team
      expect(useSimpleOnboardingStore.getState().currentStep).toBe('team');
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid step changes', () => {
      const { nextStep, previousStep } = useSimpleOnboardingStore.getState();

      nextStep();
      nextStep();
      previousStep();
      nextStep();
      nextStep();
      nextStep();

      expect(useSimpleOnboardingStore.getState().currentStep).toBe('completion');
    });

    it('should preserve data across step changes', () => {
      const { setUser, setVerein, nextStep, previousStep } = useSimpleOnboardingStore.getState();

      nextStep(); // -> user
      setUser(testUser);
      nextStep(); // -> verein
      setVerein(testVerein, 'club-001');

      // Navigate back and forth
      previousStep();
      nextStep();
      previousStep();
      previousStep();
      nextStep();
      nextStep();

      // Data should still be there
      const state = useSimpleOnboardingStore.getState();
      expect(state.user).toEqual(testUser);
      expect(state.selectedVerein).toEqual(testVerein);
    });

    it('should handle empty string in user data', () => {
      const { setUser } = useSimpleOnboardingStore.getState();

      setUser({ vorname: '', nachname: '' });

      const state = useSimpleOnboardingStore.getState();
      expect(state.user).toEqual({ vorname: '', nachname: '' });
    });

    it('should handle verein without optional fields', () => {
      const { setVerein } = useSimpleOnboardingStore.getState();

      const minimalVerein: Verein = {
        verein_id: 'v-1',
        name: 'Test Verein',
        ist_eigener_verein: true,
        created_at: new Date()
      };

      setVerein(minimalVerein, 'club-minimal');

      const state = useSimpleOnboardingStore.getState();
      expect(state.selectedVerein).toEqual(minimalVerein);
      expect(state.selectedClubId).toBe('club-minimal');
    });
  });
});
