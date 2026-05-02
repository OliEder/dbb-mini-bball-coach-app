/**
 * Onboarding Store v2 Tests
 *
 * Testet den neuen clubs.json-basierten Flow:
 * - searchClubs (pure function)
 * - State Management & Navigation
 * - loadClubs (mit fetch-Mock)
 * - completeOnboarding Validierung
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useSimpleOnboardingStore, searchClubs } from '@/domains/onboarding/onboarding-simple.store';
import type { VRClub, VRTeam } from '@/domains/onboarding/onboarding-simple.store';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Test data
const mockClub1: VRClub = {
  clubId: 4468,
  name: 'Fibalon Baskets Neumarkt',
  verbandId: 2,
  verbandName: 'Bayern',
  lat: 49.28,
  lng: 11.46,
  geocodedFrom: 'Neumarkt',
  logoUrl: null,
  lastCrawled: '2026-04-14T00:00:00.000Z',
  halls: [],
  teams: [
    { teamPermanentId: 167889, altersklasse: 'Senioren I', geschlecht: 'm', teamNumber: 1 },
    { teamPermanentId: 167890, altersklasse: 'U16', geschlecht: 'm', teamNumber: 1 },
  ],
};

const mockClub2: VRClub = {
  clubId: 9999,
  name: 'FC Anderer Verein',
  verbandId: 2,
  verbandName: 'Bayern',
  lat: 48.1,
  lng: 11.5,
  geocodedFrom: 'München',
  logoUrl: null,
  lastCrawled: '2026-04-14T00:00:00.000Z',
  halls: [],
  teams: [],
};

const mockClubs = [mockClub1, mockClub2];

const mockTeam: VRTeam = { teamPermanentId: 167889, altersklasse: 'Senioren I', geschlecht: 'm', teamNumber: 1 };

describe('searchClubs (pure function)', () => {
  it('findet Verein per Substring (case-insensitive)', () => {
    expect(searchClubs(mockClubs, 'baskets')).toHaveLength(1);
    expect(searchClubs(mockClubs, 'baskets')[0].name).toBe('Fibalon Baskets Neumarkt');
  });

  it('findet Verein unabhängig von Groß-/Kleinschreibung', () => {
    expect(searchClubs(mockClubs, 'BASKETS')).toHaveLength(1);
    expect(searchClubs(mockClubs, 'Neumarkt')).toHaveLength(1);
  });

  it('gibt leere Liste bei keinem Treffer zurück', () => {
    expect(searchClubs(mockClubs, 'xyzxyz')).toHaveLength(0);
  });

  it('gibt alle Clubs bei leerem Query zurück', () => {
    expect(searchClubs(mockClubs, '')).toHaveLength(2);
  });

  it('gibt alle Clubs bei nur-Leerzeichen Query zurück', () => {
    expect(searchClubs(mockClubs, '   ')).toHaveLength(2);
  });
});

describe('useSimpleOnboardingStore', () => {
  beforeEach(() => {
    useSimpleOnboardingStore.getState().reset();
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('hat korrekten Initialzustand', () => {
      const state = useSimpleOnboardingStore.getState();
      expect(state.currentStep).toBe('welcome');
      expect(state.user).toBeNull();
      expect(state.clubs).toEqual([]);
      expect(state.clubsLoaded).toBe(false);
      expect(state.clubsError).toBeNull();
      expect(state.searchQuery).toBe('');
      expect(state.selectedClub).toBeNull();
      expect(state.selectedTeams).toEqual([]);
      expect(state.error).toBeNull();
    });
  });

  describe('Navigation', () => {
    it('navigiert zum nächsten Schritt', () => {
      useSimpleOnboardingStore.getState().nextStep();
      expect(useSimpleOnboardingStore.getState().currentStep).toBe('user');
    });

    it('navigiert zum vorherigen Schritt', () => {
      useSimpleOnboardingStore.getState().setStep('verein');
      useSimpleOnboardingStore.getState().previousStep();
      expect(useSimpleOnboardingStore.getState().currentStep).toBe('user');
    });

    it('geht nicht über den letzten Schritt hinaus', () => {
      useSimpleOnboardingStore.getState().setStep('completion');
      useSimpleOnboardingStore.getState().nextStep();
      expect(useSimpleOnboardingStore.getState().currentStep).toBe('completion');
    });

    it('geht nicht vor den ersten Schritt zurück', () => {
      useSimpleOnboardingStore.getState().previousStep();
      expect(useSimpleOnboardingStore.getState().currentStep).toBe('welcome');
    });

    it('navigiert durch alle Schritte in Reihenfolge', () => {
      const steps: string[] = [];
      for (let i = 0; i < 5; i++) {
        steps.push(useSimpleOnboardingStore.getState().currentStep);
        useSimpleOnboardingStore.getState().nextStep();
      }
      expect(steps).toEqual(['welcome', 'user', 'verein', 'team', 'completion']);
    });

    it('setzt Schritt direkt', () => {
      useSimpleOnboardingStore.getState().setStep('team');
      expect(useSimpleOnboardingStore.getState().currentStep).toBe('team');
    });
  });

  describe('User Management', () => {
    it('setzt User-Daten', () => {
      useSimpleOnboardingStore.getState().setUser({ vorname: 'Max', nachname: 'Mustermann' });
      expect(useSimpleOnboardingStore.getState().user).toEqual({ vorname: 'Max', nachname: 'Mustermann' });
    });

    it('aktualisiert User-Daten', () => {
      useSimpleOnboardingStore.getState().setUser({ vorname: 'Max', nachname: 'Mustermann' });
      useSimpleOnboardingStore.getState().setUser({ vorname: 'Lisa', nachname: 'Musterfrau' });
      expect(useSimpleOnboardingStore.getState().user?.vorname).toBe('Lisa');
    });
  });

  describe('Club-Suche', () => {
    it('setzt searchQuery', () => {
      useSimpleOnboardingStore.getState().setSearchQuery('baskets');
      expect(useSimpleOnboardingStore.getState().searchQuery).toBe('baskets');
    });

    it('setzt selectedClub und löscht selectedTeams', () => {
      useSimpleOnboardingStore.getState().toggleTeam(mockTeam);
      useSimpleOnboardingStore.getState().setSelectedClub(mockClub1);
      const state = useSimpleOnboardingStore.getState();
      expect(state.selectedClub?.clubId).toBe(4468);
      expect(state.selectedTeams).toEqual([]);
    });
  });

  describe('Team-Auswahl (Multi)', () => {
    it('fügt Team zur Auswahl hinzu', () => {
      useSimpleOnboardingStore.getState().toggleTeam(mockTeam);
      expect(useSimpleOnboardingStore.getState().selectedTeams).toHaveLength(1);
      expect(useSimpleOnboardingStore.getState().selectedTeams[0].teamPermanentId).toBe(167889);
    });

    it('entfernt Team bei erneutem toggleTeam', () => {
      useSimpleOnboardingStore.getState().toggleTeam(mockTeam);
      useSimpleOnboardingStore.getState().toggleTeam(mockTeam);
      expect(useSimpleOnboardingStore.getState().selectedTeams).toHaveLength(0);
    });

    it('erlaubt mehrere Teams gleichzeitig', () => {
      const team2: VRTeam = { teamPermanentId: 167890, altersklasse: 'U16', geschlecht: 'm', teamNumber: 1 };
      useSimpleOnboardingStore.getState().toggleTeam(mockTeam);
      useSimpleOnboardingStore.getState().toggleTeam(team2);
      expect(useSimpleOnboardingStore.getState().selectedTeams).toHaveLength(2);
    });

    it('entfernt nur das richtige Team aus Multi-Auswahl', () => {
      const team2: VRTeam = { teamPermanentId: 167890, altersklasse: 'U16', geschlecht: 'm', teamNumber: 1 };
      useSimpleOnboardingStore.getState().toggleTeam(mockTeam);
      useSimpleOnboardingStore.getState().toggleTeam(team2);
      useSimpleOnboardingStore.getState().toggleTeam(mockTeam);
      const teams = useSimpleOnboardingStore.getState().selectedTeams;
      expect(teams).toHaveLength(1);
      expect(teams[0].teamPermanentId).toBe(167890);
    });
  });

  describe('loadClubs', () => {
    it('lädt clubs.json und setzt clubsLoaded', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockClubs),
      }));

      await useSimpleOnboardingStore.getState().loadClubs();

      const state = useSimpleOnboardingStore.getState();
      expect(state.clubsLoaded).toBe(true);
      expect(state.clubs).toHaveLength(2);
      expect(state.clubsError).toBeNull();
    });

    it('setzt clubsError bei Fetch-Fehler', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

      await useSimpleOnboardingStore.getState().loadClubs();

      const state = useSimpleOnboardingStore.getState();
      expect(state.clubsError).toBeTruthy();
      expect(state.clubsLoaded).toBe(false);
    });

    it('lädt clubs nicht nochmal wenn bereits geladen', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockClubs),
      });
      vi.stubGlobal('fetch', fetchMock);

      await useSimpleOnboardingStore.getState().loadClubs();
      await useSimpleOnboardingStore.getState().loadClubs();

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling', () => {
    it('setzt Fehlermeldung', () => {
      useSimpleOnboardingStore.getState().setError('Test error');
      expect(useSimpleOnboardingStore.getState().error).toBe('Test error');
    });

    it('löscht Fehlermeldung', () => {
      useSimpleOnboardingStore.getState().setError('Test error');
      useSimpleOnboardingStore.getState().setError(null);
      expect(useSimpleOnboardingStore.getState().error).toBeNull();
    });
  });

  describe('Reset', () => {
    it('setzt alle State-Felder zurück', () => {
      useSimpleOnboardingStore.getState().setStep('team');
      useSimpleOnboardingStore.getState().setUser({ vorname: 'Max', nachname: 'M' });
      useSimpleOnboardingStore.getState().setSelectedClub(mockClub1);
      useSimpleOnboardingStore.getState().toggleTeam(mockTeam);
      useSimpleOnboardingStore.getState().setError('Test');

      useSimpleOnboardingStore.getState().reset();

      const state = useSimpleOnboardingStore.getState();
      expect(state.currentStep).toBe('welcome');
      expect(state.user).toBeNull();
      expect(state.selectedClub).toBeNull();
      expect(state.selectedTeams).toEqual([]);
      expect(state.error).toBeNull();
      expect(state.clubs).toEqual([]);
      expect(state.clubsLoaded).toBe(false);
    });
  });

  describe('completeOnboarding Validierung', () => {
    it('wirft Fehler wenn User fehlt', async () => {
      useSimpleOnboardingStore.getState().setSelectedClub(mockClub1);
      useSimpleOnboardingStore.getState().toggleTeam(mockTeam);
      await expect(useSimpleOnboardingStore.getState().completeOnboarding()).rejects.toThrow('Onboarding nicht vollständig');
    });

    it('wirft Fehler wenn Verein fehlt', async () => {
      useSimpleOnboardingStore.getState().setUser({ vorname: 'Max', nachname: 'M' });
      useSimpleOnboardingStore.getState().toggleTeam(mockTeam);
      await expect(useSimpleOnboardingStore.getState().completeOnboarding()).rejects.toThrow('Onboarding nicht vollständig');
    });

    it('wirft Fehler wenn keine Teams ausgewählt', async () => {
      useSimpleOnboardingStore.getState().setUser({ vorname: 'Max', nachname: 'M' });
      useSimpleOnboardingStore.getState().setSelectedClub(mockClub1);
      await expect(useSimpleOnboardingStore.getState().completeOnboarding()).rejects.toThrow('Onboarding nicht vollständig');
    });
  });
});
