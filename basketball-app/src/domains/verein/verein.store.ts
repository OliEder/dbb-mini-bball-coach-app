/**
 * Verein Store
 * 
 * Zustand Store für Vereins-Verwaltung
 */

import { create } from 'zustand';
import type { Verein, UUID } from '@shared/types';
import { vereinService } from './verein.service';

interface VereinStore {
  // State
  vereine: Verein[];
  eigenerVerein: Verein | null;
  currentVerein: Verein | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadVereine: () => Promise<void>;
  loadEigenerVerein: () => Promise<void>;
  loadVereinById: (verein_id: UUID) => Promise<void>;
  setCurrentVerein: (verein: Verein | null) => void;
  createVerein: (dto: Parameters<typeof vereinService.createVerein>[0]) => Promise<Verein>;
  updateVerein: (verein_id: UUID, dto: Parameters<typeof vereinService.updateVerein>[1]) => Promise<Verein>;
  deleteVerein: (verein_id: UUID) => Promise<void>;
  searchVereine: (query: string) => Promise<void>;
  clearError: () => void;
}

export const useVereinStore = create<VereinStore>((set, get) => ({
  // Initial State
  vereine: [],
  eigenerVerein: null,
  currentVerein: null,
  isLoading: false,
  error: null,

  // Load all vereine
  loadVereine: async () => {
    set({ isLoading: true, error: null });
    try {
      const vereine = await vereinService.getAllVereine();
      set({ vereine, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Fehler beim Laden der Vereine', 
        isLoading: false 
      });
    }
  },

  // Load eigener verein
  loadEigenerVerein: async () => {
    set({ isLoading: true, error: null });
    try {
      const eigenerVerein = await vereinService.getEigenerVerein();
      set({ eigenerVerein: eigenerVerein || null, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Fehler beim Laden des Vereins', 
        isLoading: false 
      });
    }
  },

  // Load verein by ID
  loadVereinById: async (verein_id: UUID) => {
    set({ isLoading: true, error: null });
    try {
      const verein = await vereinService.getVereinById(verein_id);
      set({ currentVerein: verein || null, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Fehler beim Laden des Vereins', 
        isLoading: false 
      });
    }
  },

  // Set current verein
  setCurrentVerein: (verein: Verein | null) => {
    set({ currentVerein: verein });
  },

  // Create verein
  createVerein: async (dto) => {
    set({ isLoading: true, error: null });
    try {
      const verein = await vereinService.createVerein(dto);
      const vereine = [...get().vereine, verein];
      set({ 
        vereine, 
        currentVerein: verein,
        eigenerVerein: dto.ist_eigener_verein ? verein : get().eigenerVerein,
        isLoading: false 
      });
      return verein;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Fehler beim Erstellen des Vereins', 
        isLoading: false 
      });
      throw error;
    }
  },

  // Update verein
  updateVerein: async (verein_id: UUID, dto) => {
    set({ isLoading: true, error: null });
    try {
      const updatedVerein = await vereinService.updateVerein(verein_id, dto);
      const vereine = get().vereine.map(v => v.verein_id === verein_id ? updatedVerein : v);
      set({ 
        vereine, 
        currentVerein: get().currentVerein?.verein_id === verein_id ? updatedVerein : get().currentVerein,
        eigenerVerein: get().eigenerVerein?.verein_id === verein_id ? updatedVerein : get().eigenerVerein,
        isLoading: false 
      });
      return updatedVerein;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Fehler beim Aktualisieren des Vereins', 
        isLoading: false 
      });
      throw error;
    }
  },

  // Delete verein
  deleteVerein: async (verein_id: UUID) => {
    set({ isLoading: true, error: null });
    try {
      await vereinService.deleteVerein(verein_id);
      const vereine = get().vereine.filter(v => v.verein_id !== verein_id);
      set({ 
        vereine, 
        currentVerein: get().currentVerein?.verein_id === verein_id ? null : get().currentVerein,
        eigenerVerein: get().eigenerVerein?.verein_id === verein_id ? null : get().eigenerVerein,
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Fehler beim Löschen des Vereins', 
        isLoading: false 
      });
      throw error;
    }
  },

  // Search vereine
  searchVereine: async (query: string) => {
    set({ isLoading: true, error: null });
    try {
      const vereine = await vereinService.searchByName(query);
      set({ vereine, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Fehler bei der Suche', 
        isLoading: false 
      });
    }
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  }
}));
