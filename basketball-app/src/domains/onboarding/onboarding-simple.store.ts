/**
 * Onboarding Store (v2)
 *
 * Flow:
 * 1. Welcome
 * 2. User
 * 3. Verein suchen (clubs.json vom Vereinsregister)
 * 4. Team wählen
 * 5. Completion
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const CLUBS_JSON_URL =
  'https://olieder.github.io/basketball-vereinsregister-deutschland/data/clubs.json';

export interface VRHall {
  id: number | string;
  dbbSpielfeldId: number | null;
  bezeichnung: string;
  strasse?: string;
  plz?: string;
  ort?: string;
  lat?: number | null;
  lng?: number | null;
}

export interface VRTeam {
  teamPermanentId: number;
  altersklasse?: string;
  geschlecht?: string;
  teamNumber?: number;
}

export interface VRClub {
  clubId: number;
  name: string;
  verbandId: number;
  verbandName: string;
  lat: number | null;
  lng: number | null;
  geocodedFrom: string | null;
  logoUrl: string | null;
  lastCrawled: string;
  halls: VRHall[];
  teams: VRTeam[];
}

export type SimpleOnboardingStep =
  | 'welcome'
  | 'user'
  | 'verein'
  | 'team'
  | 'completion';

/**
 * Clientseitige Suche in clubs-Array.
 * Exportiert für Unit-Tests.
 */
export function searchClubs(clubs: VRClub[], query: string): VRClub[] {
  if (!query.trim()) return clubs;
  const q = query.toLowerCase();
  return clubs.filter((c) => c.name.toLowerCase().includes(q));
}

interface OnboardingState {
  currentStep: SimpleOnboardingStep;
  user: { vorname: string; nachname: string } | null;
  clubs: VRClub[];
  clubsLoaded: boolean;
  clubsError: string | null;
  searchQuery: string;
  selectedClub: VRClub | null;
  selectedTeam: VRTeam | null;
  error: string | null;
}

interface OnboardingActions {
  setStep: (step: SimpleOnboardingStep) => void;
  nextStep: () => void;
  previousStep: () => void;
  setUser: (user: { vorname: string; nachname: string }) => void;
  loadClubs: () => Promise<void>;
  setSearchQuery: (query: string) => void;
  setSelectedClub: (club: VRClub) => void;
  setSelectedTeam: (team: VRTeam) => void;
  setError: (error: string | null) => void;
  reset: () => void;
  completeOnboarding: () => Promise<void>;
}

const STEP_ORDER: SimpleOnboardingStep[] = [
  'welcome',
  'user',
  'verein',
  'team',
  'completion',
];

const initialState: OnboardingState = {
  currentStep: 'welcome',
  user: null,
  clubs: [],
  clubsLoaded: false,
  clubsError: null,
  searchQuery: '',
  selectedClub: null,
  selectedTeam: null,
  error: null,
};

export const useSimpleOnboardingStore = create<OnboardingState & OnboardingActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      setStep: (step) => set({ currentStep: step }),

      nextStep: () => {
        const idx = STEP_ORDER.indexOf(get().currentStep);
        if (idx < STEP_ORDER.length - 1) {
          set({ currentStep: STEP_ORDER[idx + 1] });
        }
      },

      previousStep: () => {
        const idx = STEP_ORDER.indexOf(get().currentStep);
        if (idx > 0) {
          set({ currentStep: STEP_ORDER[idx - 1] });
        }
      },

      setUser: (user) => set({ user }),

      loadClubs: async () => {
        if (get().clubsLoaded) return;
        set({ clubsError: null });
        try {
          const res = await fetch(CLUBS_JSON_URL);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const clubs: VRClub[] = await res.json();
          set({ clubs, clubsLoaded: true });
        } catch {
          set({ clubsError: 'Vereine konnten nicht geladen werden. Bitte erneut versuchen.' });
        }
      },

      setSearchQuery: (query) => set({ searchQuery: query }),

      setSelectedClub: (club) => set({ selectedClub: club, selectedTeam: null }),

      setSelectedTeam: (team) => set({ selectedTeam: team }),

      setError: (error) => set({ error }),

      reset: () => set(initialState),

      completeOnboarding: async () => {
        const state = get();

        if (!state.user || !state.selectedClub || !state.selectedTeam) {
          throw new Error('Onboarding nicht vollständig');
        }

        const { vereinService } = await import('@/domains/verein/services/VereinService');
        const { teamService } = await import('@/domains/team/services/TeamService');

        // 1. Verein anlegen / finden
        const existingVereine = await vereinService.getAllVereine();
        let vereinId: string;

        const existing = existingVereine.find((v) => v.name === state.selectedClub!.name);

        if (existing) {
          vereinId = existing.verein_id;
        } else {
          const created = await vereinService.createVerein({
            name: state.selectedClub.name,
            kurzname: state.selectedClub.name,
            ort: state.selectedClub.geocodedFrom || 'Unbekannt',
            ist_eigener_verein: true,
          });
          vereinId = created.verein_id;
        }

        // 2. Team anlegen mit extern_permanent_id
        const team = state.selectedTeam;
        const trainerName = `${state.user.vorname} ${state.user.nachname}`;

        const createdTeam = await teamService.createTeam({
          verein_id: vereinId,
          name: formatTeamLabel(team),
          geschlecht: mapGeschlecht(team.geschlecht),
          trainer: trainerName,
          team_typ: 'eigen',
          extern_permanent_id: team.teamPermanentId.toString(),
        });

        // 3. App-State setzen
        localStorage.setItem('onboarding-complete', 'true');
        localStorage.setItem('active-team-id', createdTeam.team_id);

        const { useAppStore } = await import('@/stores/appStore');
        const appStore = useAppStore.getState();
        appStore.setMyTeams([createdTeam.team_id]);
        appStore.setCurrentTeam(createdTeam.team_id);
        appStore.completeOnboarding();

        console.log('✅ Onboarding abgeschlossen, Team:', createdTeam.team_id);
      },
    }),
    {
      name: 'basketball-onboarding-simple',
      partialize: (state) => ({
        currentStep: state.currentStep,
        user: state.user,
        selectedClub: state.selectedClub,
        selectedTeam: state.selectedTeam,
      }),
    }
  )
);

function formatTeamLabel(team: VRTeam): string {
  const ak = team.altersklasse || '';
  const num = team.teamNumber || 1;
  return num > 1 ? `${ak} ${num}` : ak;
}

function mapGeschlecht(g?: string): 'male' | 'female' | 'mixed' {
  if (g === 'm') return 'male';
  if (g === 'w') return 'female';
  return 'mixed';
}

// Expose store for E2E tests
if (typeof window !== 'undefined') {
  (window as any).__SIMPLE_ONBOARDING_STORE__ = useSimpleOnboardingStore;
}
