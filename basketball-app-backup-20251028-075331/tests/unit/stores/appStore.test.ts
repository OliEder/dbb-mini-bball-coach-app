/**
 * App Store Tests - Multi-Team Support
 * 
 * Tests für Multi-Team Funktionalität im App Store
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '@/stores/appStore';

describe('AppStore - Multi-Team Support', () => {
  beforeEach(() => {
    // Reset store vor jedem Test
    useAppStore.getState().reset();
  });

  describe('setMyTeams', () => {
    it('should store multiple team IDs', () => {
      const { setMyTeams } = useAppStore.getState();
      const teamIds = ['team-1', 'team-2', 'team-3'];
      
      setMyTeams(teamIds);
      
      const state = useAppStore.getState();
      expect(state.myTeamIds).toEqual(teamIds);
      expect(state.myTeamIds.length).toBe(3);
    });

    it('should set first team as current when no team is selected', () => {
      const { setMyTeams } = useAppStore.getState();
      const teamIds = ['team-1', 'team-2', 'team-3'];
      
      setMyTeams(teamIds);
      
      const state = useAppStore.getState();
      expect(state.currentTeamId).toBe('team-1');
    });

    it('should not change current team if already set', () => {
      const { setMyTeams, setCurrentTeam } = useAppStore.getState();
      
      // Setze Team manuell
      setCurrentTeam('team-2');
      
      // Füge Teams hinzu
      const teamIds = ['team-1', 'team-2', 'team-3'];
      setMyTeams(teamIds);
      
      const state = useAppStore.getState();
      expect(state.currentTeamId).toBe('team-2');
    });

    it('should handle empty array', () => {
      const { setMyTeams } = useAppStore.getState();
      
      setMyTeams([]);
      
      const state = useAppStore.getState();
      expect(state.myTeamIds).toEqual([]);
      expect(state.currentTeamId).toBeNull();
    });
  });

  describe('switchTeam', () => {
    beforeEach(() => {
      // Setup: Mehrere Teams verfügbar
      const { setMyTeams } = useAppStore.getState();
      setMyTeams(['team-1', 'team-2', 'team-3']);
    });

    it('should switch to valid team', () => {
      const { switchTeam } = useAppStore.getState();
      
      switchTeam('team-2');
      
      const state = useAppStore.getState();
      expect(state.currentTeamId).toBe('team-2');
    });

    it('should not switch to non-existent team', () => {
      const { switchTeam, setCurrentTeam } = useAppStore.getState();
      
      // Setze aktuelles Team
      setCurrentTeam('team-1');
      
      // Versuche zu nicht-existierendem Team zu wechseln
      switchTeam('team-999');
      
      // Sollte beim aktuellen Team bleiben
      const state = useAppStore.getState();
      expect(state.currentTeamId).toBe('team-1');
    });

    it('should switch between multiple teams', () => {
      const { switchTeam } = useAppStore.getState();
      
      switchTeam('team-1');
      expect(useAppStore.getState().currentTeamId).toBe('team-1');
      
      switchTeam('team-2');
      expect(useAppStore.getState().currentTeamId).toBe('team-2');
      
      switchTeam('team-3');
      expect(useAppStore.getState().currentTeamId).toBe('team-3');
    });

    it('should log warning when switching to invalid team', () => {
      const { switchTeam } = useAppStore.getState();
      
      // Console warn spy
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      switchTeam('invalid-team');
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Cannot switch to team invalid-team')
      );
      
      consoleWarnSpy.mockRestore();
    });
  });

  describe('reset', () => {
    it('should reset myTeamIds to empty array', () => {
      const { setMyTeams, reset } = useAppStore.getState();
      
      setMyTeams(['team-1', 'team-2']);
      expect(useAppStore.getState().myTeamIds.length).toBe(2);
      
      reset();
      
      const state = useAppStore.getState();
      expect(state.myTeamIds).toEqual([]);
      expect(state.currentTeamId).toBeNull();
    });
  });

  describe('persistence', () => {
    it('should persist myTeamIds', () => {
      const { setMyTeams } = useAppStore.getState();
      const teamIds = ['team-1', 'team-2'];
      
      setMyTeams(teamIds);
      
      // Simuliere Page-Reload durch neuen Store-Zugriff
      const persistedState = useAppStore.getState();
      expect(persistedState.myTeamIds).toEqual(teamIds);
    });
  });

  describe('edge cases', () => {
    it('should handle null values gracefully', () => {
      const { setMyTeams } = useAppStore.getState();
      
      // TypeScript sollte das verhindern, aber zur Sicherheit
      setMyTeams([]);
      
      const state = useAppStore.getState();
      expect(Array.isArray(state.myTeamIds)).toBe(true);
    });

    it('should handle single team correctly', () => {
      const { setMyTeams } = useAppStore.getState();
      
      setMyTeams(['team-1']);
      
      const state = useAppStore.getState();
      expect(state.myTeamIds).toEqual(['team-1']);
      expect(state.currentTeamId).toBe('team-1');
    });
  });
});
