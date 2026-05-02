# Team-Endpunkt & Onboarding-Neubau Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `getTeamMatches(teamPermanentId)` in BBBApiService einführen, Spielplan-Sync darauf umstellen, und das Onboarding komplett auf clubs.json vom Vereinsregister umbauen.

**Architecture:** BBBApiService bekommt eine neue Methode für `/rest/team/id/{id}/matches`. BBBSyncService nutzt diese als primären Weg für den Spielplan-Sync (Fallback auf `getSpielplan(ligaId)` bleibt). Das Onboarding ersetzt ClubDataLoader + TeamWithParticipationData durch direkte Nutzung von `clubs.json` vom Vereinsregister (GitHub Pages), clientseitige Suche im Zustand-Store, und vereinfachte Completion-Logik ohne Liga-Sync-Merge.

**Tech Stack:** TypeScript, Vitest, Zustand, Dexie/IndexedDB, React

---

## File Map

| Datei | Aktion | Zweck |
|---|---|---|
| `src/shared/types/index.ts` | Modify | `DBBTeamMatchEintrag`, `DBBTeamMatchesResponse` bereits vorhanden — korrekt |
| `src/domains/bbb-api/services/BBBApiService.ts` | Modify | `getTeamMatches()` hinzufügen |
| `src/domains/bbb-api/services/__tests__/BBBApiService.test.ts` | Modify | Tests für `getTeamMatches` |
| `src/domains/bbb-api/services/BBBSyncService.ts` | Modify | `syncSpielplan` auf `getTeamMatches` umstellen |
| `src/domains/bbb-api/services/__tests__/BBBSyncService.test.ts` | Modify | Tests anpassen |
| `src/domains/onboarding/onboarding-simple.store.ts` | Replace | Neuer Store mit clubs.json-Flow |
| `src/domains/onboarding/components/SimplifiedVereinStep.tsx` | Replace | Nutzt neuen Store |
| `src/domains/onboarding/components/SimplifiedTeamStep.tsx` | Replace | Nutzt neuen Store |

---

## Task 1: `getTeamMatches` in BBBApiService

**Files:**
- Modify: `src/domains/bbb-api/services/__tests__/BBBApiService.test.ts`
- Modify: `src/domains/bbb-api/services/BBBApiService.ts`

- [ ] **Step 1: Test schreiben**

Füge diesen `describe`-Block in `BBBApiService.test.ts` nach dem `getSpielplan`-Block ein:

```typescript
describe('getTeamMatches', () => {
  it('sollte Team-Matches-Daten abrufen und mappen', async () => {
    const mockData = {
      data: {
        team: {
          teamId: 167889,
          teamName: 'Test Baskets',
        },
        matches: [
          {
            ligaData: {
              ligaId: 47653,
              liganame: 'Bayernliga Herren Mitte',
            },
            matchId: 1001,
            matchNo: 1,
            matchDay: 1,
            kickoffDate: '2025-10-04',
            kickoffTime: '19:30',
            homeTeam: {
              seasonTeamId: 405995,
              teamPermanentId: 167889,
              teamname: 'Test Baskets',
              clubId: 4468,
            },
            guestTeam: {
              seasonTeamId: 397879,
              teamPermanentId: 154164,
              teamname: 'TSV Gegner',
              clubId: 1422,
            },
            result: '93:74',
          },
        ],
      },
    };

    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue(mockData),
    };
    vi.mocked(global.fetch).mockResolvedValueOnce(mockResponse as any);

    const result = await service.getTeamMatches(167889);

    expect(result.teamId).toBe(167889);
    expect(result.teamName).toBe('Test Baskets');
    expect(result.matches).toHaveLength(1);
    expect(result.matches[0]).toMatchObject({
      matchId: 1001,
      gameNumber: 1,
      gameDay: 1,
      ligaId: 47653,
      liganame: 'Bayernliga Herren Mitte',
      homeTeam: {
        teamId: 405995,
        teamPermanentId: 167889,
        teamName: 'Test Baskets',
        clubId: 4468,
      },
      awayTeam: {
        teamId: 397879,
        teamPermanentId: 154164,
        teamName: 'TSV Gegner',
        clubId: 1422,
      },
      status: 'finished',
      homeScore: 93,
      awayScore: 74,
    });
  });

  it('sollte Fehler werfen bei ungültiger teamPermanentId', async () => {
    await expect(service.getTeamMatches(0)).rejects.toThrow('Invalid team permanent ID');
    await expect(service.getTeamMatches(-1)).rejects.toThrow('Invalid team permanent ID');
  });

  it('sollte leere matches-Liste handhaben', async () => {
    const mockData = {
      data: { team: { teamId: 1, teamName: 'Test' }, matches: [] },
    };
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue(mockData),
    } as any);

    const result = await service.getTeamMatches(1);
    expect(result.matches).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Test ausführen — muss FEHLSCHLAGEN**

```bash
cd /Users/oliver-marcuseder/01-vibe-coding/00-Basektball/basketball-app
npx vitest run src/domains/bbb-api/services/__tests__/BBBApiService.test.ts --reporter=verbose 2>&1 | grep -E "FAIL|PASS|getTeamMatches|Error"
```

Erwartet: FAIL mit `service.getTeamMatches is not a function`

- [ ] **Step 3: Implementierung in BBBApiService.ts**

Füge nach `getSpielplan` (Zeile ~461) und vor `getMatchInfo` folgende Methode ein:

```typescript
/**
 * GET /rest/team/id/{teamPermanentId}/matches
 * Gibt alle Spiele eines Teams über alle Ligen zurück.
 */
async getTeamMatches(teamPermanentId: number): Promise<DBBTeamMatchesResponse> {
  if (!teamPermanentId || teamPermanentId <= 0 || !Number.isInteger(teamPermanentId)) {
    throw new Error('Invalid team permanent ID: must be a positive integer');
  }

  const response = await this.fetchWithFallback(
    `${this.BASE_URL}/rest/team/id/${teamPermanentId}/matches`,
    { headers: { 'Accept': 'application/json' } }
  );

  const apiResponse: any = await response.json();
  const data = apiResponse.data || apiResponse;

  const matches: DBBTeamMatchEintrag[] = (data.matches || [])
    .filter((m: any) => m && m.homeTeam && m.guestTeam)
    .map((m: any) => ({
      matchId: m.matchId || 0,
      gameNumber: m.matchNo || 0,
      gameDay: m.matchDay || 0,
      date: m.kickoffDate || '',
      time: m.kickoffTime || '',
      ligaId: m.ligaData?.ligaId || 0,
      liganame: m.ligaData?.liganame || '',
      homeTeam: {
        teamId: m.homeTeam?.seasonTeamId || 0,
        teamPermanentId: m.homeTeam?.teamPermanentId,
        teamName: m.homeTeam?.teamname || 'Unknown',
        clubId: m.homeTeam?.clubId || m.homeTeam?.seasonTeamId || 0,
      },
      awayTeam: {
        teamId: m.guestTeam?.seasonTeamId || 0,
        teamPermanentId: m.guestTeam?.teamPermanentId,
        teamName: m.guestTeam?.teamname || 'Unknown',
        clubId: m.guestTeam?.clubId || m.guestTeam?.seasonTeamId || 0,
      },
      status: m.result ? 'finished' : 'scheduled',
      homeScore: m.result ? parseInt(m.result.split(':')[0]) : undefined,
      awayScore: m.result ? parseInt(m.result.split(':')[1]) : undefined,
    }));

  return {
    teamId: data.team?.teamId || 0,
    teamName: data.team?.teamName || '',
    matches,
  };
}
```

Füge auch den Import-Typ oben in der Datei hinzu:

```typescript
import type {
  // ... bestehende Imports ...
  DBBTeamMatchesResponse,
  DBBTeamMatchEintrag,
} from '../../../shared/types';
```

- [ ] **Step 4: Tests ausführen — müssen BESTEHEN**

```bash
npx vitest run src/domains/bbb-api/services/__tests__/BBBApiService.test.ts --reporter=verbose 2>&1 | grep -E "FAIL|PASS|✓|×"
```

Erwartet: Alle Tests PASS inkl. der 3 neuen `getTeamMatches`-Tests.

- [ ] **Step 5: TypeScript prüfen**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Erwartet: 0 Fehler

- [ ] **Step 6: Commit**

```bash
cd /Users/oliver-marcuseder/01-vibe-coding/00-Basektball/basketball-app
git add src/domains/bbb-api/services/BBBApiService.ts src/domains/bbb-api/services/__tests__/BBBApiService.test.ts src/shared/types/index.ts
git commit -m "feat: add getTeamMatches to BBBApiService"
```

---

## Task 2: BBBSyncService Spielplan-Sync umstellen

**Files:**
- Modify: `src/domains/bbb-api/services/BBBSyncService.ts`
- Modify: `src/domains/bbb-api/services/__tests__/BBBSyncService.test.ts`

- [ ] **Step 1: Test schreiben**

Suche in `BBBSyncService.test.ts` den Block der `syncSpielplan` testet. Füge einen neuen Test-Block hinzu:

```typescript
describe('syncSpielplanForTeam', () => {
  it('sollte getTeamMatches aufrufen und Spiele speichern', async () => {
    const mockTeamMatches = {
      teamId: 167889,
      teamName: 'Test Baskets',
      matches: [
        {
          matchId: 2001,
          gameNumber: 1,
          gameDay: 1,
          date: '2025-10-04',
          time: '19:30',
          ligaId: 47653,
          liganame: 'Bayernliga Herren Mitte',
          homeTeam: {
            teamId: 405995,
            teamPermanentId: 167889,
            teamName: 'Test Baskets',
            clubId: 4468,
          },
          awayTeam: {
            teamId: 397879,
            teamPermanentId: 154164,
            teamName: 'TSV Gegner',
            clubId: 1422,
          },
          status: 'finished',
          homeScore: 93,
          awayScore: 74,
        },
      ],
    };

    vi.spyOn(mockApiService, 'getTeamMatches').mockResolvedValue(mockTeamMatches);

    await syncService.syncSpielplanForTeam(167889);

    expect(mockApiService.getTeamMatches).toHaveBeenCalledWith(167889);
  });

  it('sollte auf getSpielplan(ligaId) fallen wenn getTeamMatches fehlschlägt', async () => {
    vi.spyOn(mockApiService, 'getTeamMatches').mockRejectedValue(new Error('API error'));
    vi.spyOn(mockApiService, 'getSpielplan').mockResolvedValue({
      ligaId: 47653,
      liganame: 'Bayernliga',
      games: [],
    });

    await syncService.syncSpielplanForTeam(167889, { fallbackLigaId: 47653 });

    expect(mockApiService.getSpielplan).toHaveBeenCalledWith(47653);
  });
});
```

- [ ] **Step 2: Test ausführen — muss FEHLSCHLAGEN**

```bash
npx vitest run src/domains/bbb-api/services/__tests__/BBBSyncService.test.ts --reporter=verbose 2>&1 | grep -E "FAIL|PASS|syncSpielplanForTeam|Error"
```

Erwartet: FAIL mit `syncService.syncSpielplanForTeam is not a function`

- [ ] **Step 3: `syncSpielplanForTeam` in BBBSyncService.ts implementieren**

Füge nach `syncSpielplan` (ca. Zeile 446) folgende neue Methode ein:

```typescript
/**
 * Synchronisiert den Spielplan eines Teams via teamPermanentId.
 * Primär: GET /rest/team/id/{teamPermanentId}/matches
 * Fallback: getSpielplan(ligaId) wenn Primär fehlschlägt.
 */
async syncSpielplanForTeam(
  teamPermanentId: number,
  options?: { fallbackLigaId?: number }
): Promise<void> {
  let matches: import('../../../shared/types').DBBTeamMatchEintrag[];
  let primarySuccess = false;

  try {
    const result = await this.apiService.getTeamMatches(teamPermanentId);
    matches = result.matches;
    primarySuccess = true;
    console.log(`✅ getTeamMatches: ${matches.length} Spiele für Team ${teamPermanentId}`);
  } catch (err) {
    console.warn(`⚠️ getTeamMatches fehlgeschlagen für Team ${teamPermanentId}:`, err);

    if (!options?.fallbackLigaId) {
      console.error('❌ Kein Fallback ligaId vorhanden, Sync abgebrochen');
      throw err;
    }

    console.log(`🔄 Fallback: getSpielplan(${options.fallbackLigaId})`);
    await this.syncSpielplan(options.fallbackLigaId);
    return;
  }

  // Verarbeite matches aus getTeamMatches
  for (const match of matches) {
    const liga = await db.ligen
      .where('bbb_liga_id')
      .equals(match.ligaId.toString())
      .first();

    if (!liga) {
      console.warn(`⚠️ Liga ${match.ligaId} nicht in DB, überspringe Spiel ${match.matchId}`);
      continue;
    }

    const heimPermanentId = match.homeTeam.teamPermanentId || match.homeTeam.teamId;
    const gastPermanentId = match.awayTeam.teamPermanentId || match.awayTeam.teamId;
    const heimTeam = await this.findTeamByPermanentId(heimPermanentId);
    const gastTeam = await this.findTeamByPermanentId(gastPermanentId);

    if (!heimTeam || !gastTeam) {
      console.warn(`⚠️ Team nicht gefunden für Spiel ${match.matchId}`);
      continue;
    }

    await this.createOrUpdateSpiel({
      matchId: match.matchId,
      gameNumber: match.gameNumber,
      gameDay: match.gameDay,
      date: match.date,
      time: match.time,
      heimTeamId: heimTeam.team_id,
      gastTeamId: gastTeam.team_id,
      ligaId: liga.liga_id,
      halleId: undefined,
      status: match.status,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
    });
  }

  console.log(`✅ syncSpielplanForTeam abgeschlossen (${primarySuccess ? 'primär' : 'fallback'})`);
}
```

- [ ] **Step 4: Tests ausführen — müssen BESTEHEN**

```bash
npx vitest run src/domains/bbb-api/services/__tests__/BBBSyncService.test.ts --reporter=verbose 2>&1 | grep -E "FAIL|PASS|✓|×"
```

Erwartet: Alle Tests PASS

- [ ] **Step 5: TypeScript prüfen**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Erwartet: 0 Fehler

- [ ] **Step 6: Commit**

```bash
git add src/domains/bbb-api/services/BBBSyncService.ts src/domains/bbb-api/services/__tests__/BBBSyncService.test.ts
git commit -m "feat: add syncSpielplanForTeam with fallback to BBBSyncService"
```

---

## Task 3: Neuer Onboarding-Store

**Files:**
- Replace: `src/domains/onboarding/onboarding-simple.store.ts`

Der neue Store lädt `clubs.json` direkt von GitHub Pages, sucht clientseitig, und speichert nur `teamPermanentId` — keine Liga-Merge-Logik mehr.

- [ ] **Step 1: Test schreiben**

Erstelle `src/domains/onboarding/__tests__/onboarding-simple.store.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';

// clubs.json Mock
const mockClubs = [
  {
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
      {
        teamPermanentId: 167889,
        altersklasse: 'Senioren I',
        geschlecht: 'm',
        teamNumber: 1,
      },
      {
        teamPermanentId: 167890,
        altersklasse: 'U16',
        geschlecht: 'm',
        teamNumber: 1,
      },
    ],
  },
  {
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
  },
];

vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
  ok: true,
  json: vi.fn().mockResolvedValue(mockClubs),
}));

// Store nach mock importieren
import { searchClubs } from '../onboarding-simple.store';

describe('onboarding-simple.store searchClubs', () => {
  it('findet Verein per Substring (case-insensitive)', () => {
    const results = searchClubs(mockClubs, 'baskets');
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Fibalon Baskets Neumarkt');
  });

  it('gibt leere Liste bei keinem Treffer', () => {
    const results = searchClubs(mockClubs, 'xyzxyz');
    expect(results).toHaveLength(0);
  });

  it('gibt alle Clubs bei leerem Query', () => {
    const results = searchClubs(mockClubs, '');
    expect(results).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Test ausführen — muss FEHLSCHLAGEN**

```bash
npx vitest run src/domains/onboarding/__tests__/onboarding-simple.store.test.ts --reporter=verbose 2>&1 | grep -E "FAIL|PASS|Error|searchClubs"
```

Erwartet: FAIL (Modul nicht gefunden oder `searchClubs` nicht exportiert)

- [ ] **Step 3: Neuen Store schreiben**

Ersetze `src/domains/onboarding/onboarding-simple.store.ts` vollständig:

```typescript
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

export const useSimpleOnboardingStore = create<
  OnboardingState & OnboardingActions
>()(
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
        } catch (err) {
          set({ clubsError: 'Vereine konnten nicht geladen werden. Bitte erneut versuchen.' });
        }
      },

      setSearchQuery: (query) => set({ searchQuery: query }),

      setSelectedClub: (club) =>
        set({ selectedClub: club, selectedTeam: null }),

      setSelectedTeam: (team) => set({ selectedTeam: team }),

      setError: (error) => set({ error }),

      reset: () => set(initialState),

      completeOnboarding: async () => {
        const state = get();

        if (!state.user || !state.selectedClub || !state.selectedTeam) {
          throw new Error('Onboarding nicht vollständig');
        }

        const { vereinService } = await import(
          '@/domains/verein/services/VereinService'
        );
        const { teamService } = await import(
          '@/domains/team/services/TeamService'
        );

        // 1. Verein anlegen / finden
        const existingVereine = await vereinService.getAllVereine();
        let vereinId: string;

        const existing = existingVereine.find(
          (v) => v.name === state.selectedClub!.name
        );

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

        // 2. Team anlegen
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

if (typeof window !== 'undefined') {
  (window as any).__SIMPLE_ONBOARDING_STORE__ = useSimpleOnboardingStore;
}
```

- [ ] **Step 4: Tests ausführen — müssen BESTEHEN**

```bash
npx vitest run src/domains/onboarding/__tests__/onboarding-simple.store.test.ts --reporter=verbose 2>&1 | grep -E "FAIL|PASS|✓|×"
```

Erwartet: 3 Tests PASS

- [ ] **Step 5: TypeScript prüfen**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Erwartet: 0 Fehler (ggf. Fehler in den UI-Komponenten wegen geänderter Store-API — die werden in Task 4 behoben)

- [ ] **Step 6: Commit**

```bash
git add src/domains/onboarding/onboarding-simple.store.ts src/domains/onboarding/__tests__/onboarding-simple.store.test.ts
git commit -m "feat: replace onboarding store with clubs.json-based flow"
```

---

## Task 4: Onboarding-Komponenten anpassen

**Files:**
- Replace: `src/domains/onboarding/components/SimplifiedVereinStep.tsx`
- Replace: `src/domains/onboarding/components/SimplifiedTeamStep.tsx`

- [ ] **Step 1: SimplifiedVereinStep.tsx ersetzen**

```typescript
import React, { useEffect, useMemo } from 'react';
import { Search, Building2, Loader2 } from 'lucide-react';
import {
  useSimpleOnboardingStore,
  searchClubs,
  type VRClub,
} from '../onboarding-simple.store';

interface SimplifiedVereinStepProps {
  onNext: (club: VRClub) => void;
  onBack: () => void;
}

export const SimplifiedVereinStep: React.FC<SimplifiedVereinStepProps> = ({
  onNext,
  onBack,
}) => {
  const {
    clubs,
    clubsLoaded,
    clubsError,
    searchQuery,
    selectedClub,
    loadClubs,
    setSearchQuery,
    setSelectedClub,
  } = useSimpleOnboardingStore();

  useEffect(() => {
    loadClubs();
  }, [loadClubs]);

  const filtered = useMemo(
    () => searchClubs(clubs, searchQuery),
    [clubs, searchQuery]
  );

  const handleSubmit = () => {
    if (selectedClub) onNext(selectedClub);
  };

  if (!clubsLoaded && !clubsError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Vereine werden geladen...</p>
        </div>
      </div>
    );
  }

  if (clubsError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md bg-white rounded-lg shadow-lg p-6 text-center">
          <p className="text-gray-600 mb-4">{clubsError}</p>
          <button
            onClick={() => loadClubs()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Wähle deinen Verein
          </h1>
          <p className="text-gray-600">
            {clubs.length.toLocaleString()} Vereine verfügbar
          </p>
        </div>

        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="z.B. Baskets Neumarkt"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="mb-4 text-sm text-gray-600">
          {filtered.length === clubs.length
            ? `Alle ${clubs.length.toLocaleString()} Vereine`
            : `${filtered.length.toLocaleString()} von ${clubs.length.toLocaleString()} Vereinen`}
        </div>

        <div className="mb-6 max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Keine Vereine gefunden</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filtered.map((club) => (
                <label
                  key={club.clubId}
                  className={`flex items-center p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                    selectedClub?.clubId === club.clubId ? 'bg-blue-50' : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="verein"
                    checked={selectedClub?.clubId === club.clubId}
                    onChange={() => setSelectedClub(club)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">{club.name}</p>
                    <p className="text-sm text-gray-500">{club.verbandName}</p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            ← Zurück
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedClub}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Weiter →
          </button>
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: SimplifiedTeamStep.tsx ersetzen**

```typescript
import React from 'react';
import { Users } from 'lucide-react';
import {
  useSimpleOnboardingStore,
  type VRTeam,
} from '../onboarding-simple.store';

interface SimplifiedTeamStepProps {
  onNext: (team: VRTeam) => void;
  onBack: () => void;
}

function formatTeamLabel(team: VRTeam): string {
  const ak = team.altersklasse || 'Unbekannt';
  const geschlecht =
    team.geschlecht === 'm'
      ? 'Herren'
      : team.geschlecht === 'w'
      ? 'Damen'
      : '';
  const num = team.teamNumber && team.teamNumber > 1 ? ` ${team.teamNumber}` : '';
  return `${ak}${geschlecht ? ' ' + geschlecht : ''}${num}`.trim();
}

export const SimplifiedTeamStep: React.FC<SimplifiedTeamStepProps> = ({
  onNext,
  onBack,
}) => {
  const { selectedClub, selectedTeam, setSelectedTeam } =
    useSimpleOnboardingStore();

  const teams = selectedClub?.teams || [];

  const handleSubmit = () => {
    if (selectedTeam) onNext(selectedTeam);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Wähle dein Team
          </h1>
          <p className="text-gray-600">{selectedClub?.name}</p>
          <p className="text-sm text-gray-500 mt-1">
            {teams.length} {teams.length === 1 ? 'Team' : 'Teams'} verfügbar
          </p>
        </div>

        {teams.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-gray-300 rounded-lg mb-6">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-600">Keine Teams gefunden</p>
          </div>
        ) : (
          <div className="mb-6 max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
            <div className="divide-y divide-gray-200">
              {teams.map((team) => (
                <label
                  key={team.teamPermanentId}
                  className={`flex items-center p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                    selectedTeam?.teamPermanentId === team.teamPermanentId
                      ? 'bg-blue-50'
                      : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="team"
                    checked={
                      selectedTeam?.teamPermanentId === team.teamPermanentId
                    }
                    onChange={() => setSelectedTeam(team)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">
                      {formatTeamLabel(team)}
                    </p>
                    <p className="text-sm text-gray-500">
                      ID: {team.teamPermanentId}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            ← Zurück
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedTeam}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Weiter →
          </button>
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 3: TypeScript prüfen**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Erwartet: 0 Fehler. Falls `SimplifiedOnboardingContainer.tsx` die alten Props erwartet, müssen diese angepasst werden (z.B. `onNext` Signaturen).

- [ ] **Step 4: Falls TS-Fehler im Container — Container anpassen**

Öffne `src/domains/onboarding/components/SimplifiedOnboardingContainer.tsx`. Ersetze überall wo `onNext(verein, clubId)` aufgerufen wird durch `onNext(club)`, und wo `onNext(teams)` aufgerufen wird durch `onNext(team)`. Passe die lokalen Handler-Funktionen entsprechend an.

- [ ] **Step 5: Alle Tests ausführen**

```bash
npx vitest run --reporter=verbose 2>&1 | tail -20
```

Erwartet: 316+ Tests PASS, nur Pact-Test weiterhin FAIL (bekannter Bug TS-03)

- [ ] **Step 6: Commit**

```bash
git add src/domains/onboarding/components/SimplifiedVereinStep.tsx src/domains/onboarding/components/SimplifiedTeamStep.tsx src/domains/onboarding/components/SimplifiedOnboardingContainer.tsx
git commit -m "feat: rebuild onboarding UI for clubs.json flow"
```

---

## Self-Review

**Spec coverage:**
- ✅ `getTeamMatches(teamPermanentId)` → Task 1
- ✅ `DBBTeamMatchEintrag` mit `Omit<...>` + optionalem `clubName` → Typen bereits korrekt in `shared/types/index.ts`
- ✅ Spielplan-Sync primär via Team-Endpunkt, Fallback via `getSpielplan` → Task 2
- ✅ Onboarding: clubs.json fetch, clientseitige Suche, Team-Auswahl → Task 3
- ✅ Onboarding UI-Komponenten → Task 4
- ✅ Fehlerbehandlung clubs.json → Task 3 Store (`clubsError` + Retry)
- ✅ Fehlerbehandlung `getTeamMatches` invalid ID → Task 1 Test + Impl
- ✅ Kein Pact-Test für neuen Endpunkt → bewusst ausgelassen (TS-03)

**Placeholder scan:** Keine TBDs gefunden.

**Type consistency:**
- `VRClub`, `VRTeam` in Store definiert, von beiden Komponenten importiert ✅
- `DBBTeamMatchEintrag`, `DBBTeamMatchesResponse` in `shared/types/index.ts` ✅
- `searchClubs` exportiert aus Store, in Test + Komponente importiert ✅
- `syncSpielplanForTeam` nimmt `teamPermanentId: number` + optionales `fallbackLigaId` ✅
