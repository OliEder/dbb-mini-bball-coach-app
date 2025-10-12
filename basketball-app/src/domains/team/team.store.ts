/**
 * Team Store
 * 
 * Zustand Store für Team-Verwaltung
 * Reaktive State-Management mit Dexie Live Queries
 */

import { create } from 'zustand';
import type { Team, UUID } from '@shared/types';
import { teamService } from './team.service';

interface TeamStore {
  // State
  teams: Team[];
  currentTeam: Team | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadTeams: () => Promise<void>;
  loadTeamById: (team_id: UUID) => Promise<void>;
  setCurrentTeam: (team: Team | null) => void;
  createTeam: (dto: Parameters<typeof teamService.createTeam>[0]) => Promise<Team>;
  updateTeam: (team_id: UUID, dto: Parameters<typeof teamService.updateTeam>[1]) => Promise<Team>;
  deleteTeam: (team_id: UUID) => Promise<void>;
  clearError: () => void;
}

export const useTeamStore = create<TeamStore>((set, get) => ({
  // Initial State
  teams: [],
  currentTeam: null,
  isLoading: false,
  error: null,

  // Load all teams
  loadTeams: async () => {
    set({ isLoading: true, error: null });
    try {
      const teams = await teamService.getAllTeams();
      set({ teams, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Fehler beim Laden der Teams', 
        isLoading: false 
      });
    }
  },

  // Load team by ID
  loadTeamById: async (team_id: UUID) => {
    set({ isLoading: true, error: null });
    try {
      const team = await teamService.getTeamById(team_id);
      set({ currentTeam: team || null, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Fehler beim Laden des Teams', 
        isLoading: false 
      });
    }
  },

  // Set current team
  setCurrentTeam: (team: Team | null) => {
    set({ currentTeam: team });
  },

  // Create team
  createTeam: async (dto) => {
    set({ isLoading: true, error: null });
    try {
      const team = await teamService.createTeam(dto);
      const teams = [...get().teams, team];
      set({ teams, currentTeam: team, isLoading: false });
      return team;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Fehler beim Erstellen des Teams', 
        isLoading: false 
      });
      throw error;
    }
  },

  // Update team
  updateTeam: async (team_id: UUID, dto) => {
    set({ isLoading: true, error: null });
    try {
      const updatedTeam = await teamService.updateTeam(team_id, dto);
      const teams = get().teams.map(t => t.team_id === team_id ? updatedTeam : t);
      set({ 
        teams, 
        currentTeam: get().currentTeam?.team_id === team_id ? updatedTeam : get().currentTeam,
        isLoading: false 
      });
      return updatedTeam;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Fehler beim Aktualisieren des Teams', 
        isLoading: false 
      });
      throw error;
    }
  },

  // Delete team
  deleteTeam: async (team_id: UUID) => {
    set({ isLoading: true, error: null });
    try {
      await teamService.deleteTeam(team_id);
      const teams = get().teams.filter(t => t.team_id !== team_id);
      set({ 
        teams, 
        currentTeam: get().currentTeam?.team_id === team_id ? null : get().currentTeam,
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Fehler beim Löschen des Teams', 
        isLoading: false 
      });
      throw error;
    }
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  }
}));
