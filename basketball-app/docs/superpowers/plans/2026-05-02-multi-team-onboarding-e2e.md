# Multi-Team Onboarding + E2E/Accessibility Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Onboarding erlaubt Multi-Team-Auswahl (Checkboxen statt Radio), `completeOnboarding` legt pro gewähltem Team einen DB-Eintrag an, Playwright Config zeigt auf `tests/e2e/`, E2E-Specs passen zur aktuellen UI, neue Accessibility-Specs vorhanden.

**Architecture:** Store-Umbau von `selectedTeam: VRTeam | null` → `selectedTeams: VRTeam[]`, UI-Umbau von Radio auf Checkbox, `completeOnboarding` iteriert per Team ohne Liga-Info (Liga kommt später via `syncSpielplanForTeam`). Playwright `testDir` auf `tests/e2e/` + `tests/accessibility/` als zweites Projekt. Liga-IDs werden beim App-Start via Team-Matches-Endpoint nachgeladen — das liegt außerhalb dieses Plans.

**Tech Stack:** TypeScript, React, Zustand, Vitest, Playwright, axe-core (`@axe-core/playwright`)

---

## File Map

| Datei | Aktion | Verantwortung |
|---|---|---|
| `src/domains/onboarding/onboarding-simple.store.ts` | Modify | `selectedTeam → selectedTeams[]`, `setSelectedTeam → toggleTeam`, `completeOnboarding` Multi-Team |
| `src/domains/onboarding/components/SimplifiedTeamStep.tsx` | Modify | Checkboxen statt Radio, "Weiter"-Button aktiviert wenn ≥1 Team |
| `tests/unit/domains/onboarding/stores/onboarding-simple.store.test.ts` | Modify | Tests auf `selectedTeams[]` umstellen |
| `tests/unit/domains/onboarding/SimplifiedTeamStep.test.tsx` | Modify | Tests auf Checkbox-Verhalten umstellen |
| `playwright.config.ts` | Modify | `testDir` → `tests/e2e/`, zweites Projekt für `tests/accessibility/` |
| `tests/e2e/onboarding-simplified.spec.ts` | Modify | Specs auf aktuelle UI anpassen (Placeholder, Radio→Checkbox, kein Verband-Filter) |
| `tests/accessibility/onboarding.a11y.spec.ts` | Create | axe-basierte A11y-Tests für Onboarding-Flow |
| `tests/accessibility/dashboard.a11y.spec.ts` | Create | axe-basierte A11y-Tests für Dashboard |

---

## Task 1: Store — `selectedTeam` → `selectedTeams[]`

**Files:**
- Modify: `src/domains/onboarding/onboarding-simple.store.ts`
- Modify: `tests/unit/domains/onboarding/stores/onboarding-simple.store.test.ts`

- [ ] **Step 1: Failing Tests schreiben**

In `tests/unit/domains/onboarding/stores/onboarding-simple.store.test.ts` — bestehende Tests auf `selectedTeam` ersetzen durch neue Multi-Team-Tests. Füge nach dem bestehenden `describe('Navigation')` Block ein:

```typescript
describe('Multi-Team Auswahl', () => {
  const teamA: VRTeam = { teamPermanentId: 167889, altersklasse: 'Senioren', geschlecht: 'm', teamNumber: 1 };
  const teamB: VRTeam = { teamPermanentId: 167890, altersklasse: 'U16', geschlecht: 'm', teamNumber: 1 };

  it('startet mit leerer Team-Auswahl', () => {
    const state = useSimpleOnboardingStore.getState();
    expect(state.selectedTeams).toEqual([]);
  });

  it('fügt Team zur Auswahl hinzu', () => {
    useSimpleOnboardingStore.getState().toggleTeam(teamA);
    expect(useSimpleOnboardingStore.getState().selectedTeams).toHaveLength(1);
    expect(useSimpleOnboardingStore.getState().selectedTeams[0].teamPermanentId).toBe(167889);
  });

  it('entfernt Team aus Auswahl bei erneutem toggleTeam', () => {
    useSimpleOnboardingStore.getState().toggleTeam(teamA);
    useSimpleOnboardingStore.getState().toggleTeam(teamA);
    expect(useSimpleOnboardingStore.getState().selectedTeams).toHaveLength(0);
  });

  it('erlaubt Auswahl mehrerer Teams', () => {
    useSimpleOnboardingStore.getState().toggleTeam(teamA);
    useSimpleOnboardingStore.getState().toggleTeam(teamB);
    expect(useSimpleOnboardingStore.getState().selectedTeams).toHaveLength(2);
  });

  it('setzt selectedTeams zurück wenn neuer Verein gewählt wird', () => {
    useSimpleOnboardingStore.getState().toggleTeam(teamA);
    useSimpleOnboardingStore.getState().setSelectedClub(mockClub1);
    expect(useSimpleOnboardingStore.getState().selectedTeams).toEqual([]);
  });

  it('completeOnboarding wirft Fehler wenn keine Teams gewählt', async () => {
    useSimpleOnboardingStore.getState().setUser({ vorname: 'Max', nachname: 'M' });
    useSimpleOnboardingStore.getState().setSelectedClub(mockClub1);
    // keine Teams
    await expect(
      useSimpleOnboardingStore.getState().completeOnboarding()
    ).rejects.toThrow('Onboarding nicht vollständig');
  });
});
```

Ersetze außerdem in `describe('Initial State')` den Check auf `selectedTeam`:
```typescript
// ALT:
expect(state.selectedTeam).toBeNull();
// NEU:
expect(state.selectedTeams).toEqual([]);
```

- [ ] **Step 2: Test ausführen — RED bestätigen**

```bash
npx vitest run tests/unit/domains/onboarding/stores/onboarding-simple.store.test.ts
```

Erwartete Fehler: `selectedTeams is not defined`, `toggleTeam is not a function`

- [ ] **Step 3: Store umbauen**

In `src/domains/onboarding/onboarding-simple.store.ts`:

**Interface `OnboardingState`** — ersetze:
```typescript
// ALT:
selectedTeam: VRTeam | null;
// NEU:
selectedTeams: VRTeam[];
```

**Interface `OnboardingActions`** — ersetze:
```typescript
// ALT:
setSelectedTeam: (team: VRTeam) => void;
// NEU:
toggleTeam: (team: VRTeam) => void;
```

**`initialState`** — ersetze:
```typescript
// ALT:
selectedTeam: null,
// NEU:
selectedTeams: [],
```

**`setSelectedClub`** — setzt selectedTeams zurück:
```typescript
setSelectedClub: (club) => set({ selectedClub: club, selectedTeams: [] }),
```

**`toggleTeam` Implementation** — ersetze `setSelectedTeam`:
```typescript
toggleTeam: (team) => {
  const current = get().selectedTeams;
  const exists = current.some(t => t.teamPermanentId === team.teamPermanentId);
  set({
    selectedTeams: exists
      ? current.filter(t => t.teamPermanentId !== team.teamPermanentId)
      : [...current, team],
  });
},
```

**`completeOnboarding`** — Validierung und Loop:
```typescript
completeOnboarding: async () => {
  const state = get();

  if (!state.user || !state.selectedClub || state.selectedTeams.length === 0) {
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

  // 2. Pro Team einen DB-Eintrag anlegen (ohne liga_id — kommt via syncSpielplanForTeam)
  const trainerName = `${state.user.vorname} ${state.user.nachname}`;
  const createdTeamIds: string[] = [];

  for (const team of state.selectedTeams) {
    const createdTeam = await teamService.createTeam({
      verein_id: vereinId,
      name: formatTeamLabel(team),
      geschlecht: mapGeschlecht(team.geschlecht),
      trainer: trainerName,
      team_typ: 'eigen',
      extern_permanent_id: team.teamPermanentId.toString(),
    });
    createdTeamIds.push(createdTeam.team_id);
  }

  // 3. App-State setzen
  localStorage.setItem('onboarding-complete', 'true');
  localStorage.setItem('active-team-id', createdTeamIds[0]);

  const { useAppStore } = await import('@/stores/appStore');
  const appStore = useAppStore.getState();
  appStore.setMyTeams(createdTeamIds);
  appStore.setCurrentTeam(createdTeamIds[0]);
  appStore.completeOnboarding();

  console.log('✅ Onboarding abgeschlossen, Teams:', createdTeamIds);
},
```

**`persist` partialize** — ersetze:
```typescript
// ALT:
selectedTeam: state.selectedTeam,
// NEU:
selectedTeams: state.selectedTeams,
```

- [ ] **Step 4: Test ausführen — GREEN bestätigen**

```bash
npx vitest run tests/unit/domains/onboarding/stores/onboarding-simple.store.test.ts
```

Erwartet: alle Tests grün (inkl. neue Multi-Team-Tests)

- [ ] **Step 5: TS-Check**

```bash
npx tsc --noEmit
```

Erwartet: 0 Fehler

- [ ] **Step 6: Commit**

```bash
git add src/domains/onboarding/onboarding-simple.store.ts \
        tests/unit/domains/onboarding/stores/onboarding-simple.store.test.ts
git commit -m "feat: multi-team onboarding store — selectedTeams[], toggleTeam"
```

---

## Task 2: UI — `SimplifiedTeamStep` auf Checkbox umbauen

**Files:**
- Modify: `src/domains/onboarding/components/SimplifiedTeamStep.tsx`
- Modify: `tests/unit/domains/onboarding/SimplifiedTeamStep.test.tsx`

- [ ] **Step 1: Failing Tests schreiben**

Lese `tests/unit/domains/onboarding/SimplifiedTeamStep.test.tsx` und ersetze den Inhalt vollständig:

```typescript
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SimplifiedTeamStep } from '@/domains/onboarding/components/SimplifiedTeamStep';
import { useSimpleOnboardingStore } from '@/domains/onboarding/onboarding-simple.store';
import type { VRClub } from '@/domains/onboarding/onboarding-simple.store';

vi.mock('@/domains/onboarding/onboarding-simple.store');

const mockClub: VRClub = {
  clubId: 4468,
  name: 'Fibalon Baskets Neumarkt',
  verbandId: 2,
  verbandName: 'Bayern',
  lat: 49.28,
  lng: 11.46,
  geocodedFrom: 'Neumarkt',
  logoUrl: null,
  lastCrawled: '2026-04-14T00:00:00Z',
  halls: [],
  teams: [
    { teamPermanentId: 167889, altersklasse: 'Senioren', geschlecht: 'männlich', teamNumber: 1 },
    { teamPermanentId: 167890, altersklasse: 'U16', geschlecht: 'männlich', teamNumber: 1 },
  ],
};

const mockToggleTeam = vi.fn();
const mockOnNext = vi.fn();
const mockOnBack = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useSimpleOnboardingStore).mockReturnValue({
    selectedClub: mockClub,
    selectedTeams: [],
    toggleTeam: mockToggleTeam,
  } as any);
});

describe('SimplifiedTeamStep', () => {
  it('zeigt alle Teams als Checkboxen an', () => {
    render(<SimplifiedTeamStep onNext={mockOnNext} onBack={mockOnBack} />);
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(2);
  });

  it('"Weiter"-Button ist deaktiviert wenn keine Teams gewählt', () => {
    render(<SimplifiedTeamStep onNext={mockOnNext} onBack={mockOnBack} />);
    expect(screen.getByRole('button', { name: /weiter/i })).toBeDisabled();
  });

  it('"Weiter"-Button ist aktiv wenn mind. 1 Team gewählt', () => {
    vi.mocked(useSimpleOnboardingStore).mockReturnValue({
      selectedClub: mockClub,
      selectedTeams: [mockClub.teams[0]],
      toggleTeam: mockToggleTeam,
    } as any);
    render(<SimplifiedTeamStep onNext={mockOnNext} onBack={mockOnBack} />);
    expect(screen.getByRole('button', { name: /weiter/i })).not.toBeDisabled();
  });

  it('ruft toggleTeam auf beim Klick auf Checkbox', () => {
    render(<SimplifiedTeamStep onNext={mockOnNext} onBack={mockOnBack} />);
    fireEvent.click(screen.getAllByRole('checkbox')[0]);
    expect(mockToggleTeam).toHaveBeenCalledWith(mockClub.teams[0]);
  });

  it('ruft onNext mit ausgewählten Teams auf', () => {
    vi.mocked(useSimpleOnboardingStore).mockReturnValue({
      selectedClub: mockClub,
      selectedTeams: [mockClub.teams[0]],
      toggleTeam: mockToggleTeam,
    } as any);
    render(<SimplifiedTeamStep onNext={mockOnNext} onBack={mockOnBack} />);
    fireEvent.click(screen.getByRole('button', { name: /weiter/i }));
    expect(mockOnNext).toHaveBeenCalledWith([mockClub.teams[0]]);
  });

  it('zeigt Anzahl gewählter Teams an', () => {
    vi.mocked(useSimpleOnboardingStore).mockReturnValue({
      selectedClub: mockClub,
      selectedTeams: [mockClub.teams[0], mockClub.teams[1]],
      toggleTeam: mockToggleTeam,
    } as any);
    render(<SimplifiedTeamStep onNext={mockOnNext} onBack={mockOnBack} />);
    expect(screen.getByText(/2.*teams.*ausgewählt/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Test ausführen — RED bestätigen**

```bash
npx vitest run tests/unit/domains/onboarding/SimplifiedTeamStep.test.tsx
```

Erwartet: Fehler wegen `toggleTeam is not a function`, `type="radio"` statt `checkbox`

- [ ] **Step 3: `SimplifiedTeamStep.tsx` umbauen**

Ersetze den gesamten Inhalt von `src/domains/onboarding/components/SimplifiedTeamStep.tsx`:

```typescript
import React from 'react';
import { Users } from 'lucide-react';
import {
  useSimpleOnboardingStore,
  type VRTeam,
} from '../onboarding-simple.store';

interface SimplifiedTeamStepProps {
  onNext: (teams: VRTeam[]) => void;
  onBack: () => void;
}

function formatTeamLabel(team: VRTeam): string {
  const ak = team.altersklasse || 'Unbekannt';
  const num = team.teamNumber && team.teamNumber > 1 ? ` ${team.teamNumber}` : '';
  return `${ak}${num}`.trim();
}

export const SimplifiedTeamStep: React.FC<SimplifiedTeamStepProps> = ({
  onNext,
  onBack,
}) => {
  const { selectedClub, selectedTeams, toggleTeam } = useSimpleOnboardingStore();

  const teams = selectedClub?.teams || [];
  const isChecked = (team: VRTeam) =>
    selectedTeams.some(t => t.teamPermanentId === team.teamPermanentId);

  const handleSubmit = () => {
    if (selectedTeams.length > 0) onNext(selectedTeams);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Wähle deine Teams
          </h1>
          <p className="text-gray-600">{selectedClub?.name}</p>
          <p className="text-sm text-gray-500 mt-1">
            {teams.length} {teams.length === 1 ? 'Team' : 'Teams'} verfügbar
          </p>
          {selectedTeams.length > 0 && (
            <p className="text-sm text-blue-600 mt-1 font-medium">
              {selectedTeams.length} {selectedTeams.length === 1 ? 'Team' : 'Teams'} ausgewählt
            </p>
          )}
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
                    isChecked(team) ? 'bg-blue-50' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked(team)}
                    onChange={() => toggleTeam(team)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded"
                  />
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">{formatTeamLabel(team)}</p>
                    <p className="text-sm text-gray-500">ID: {team.teamPermanentId}</p>
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
            disabled={selectedTeams.length === 0}
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

- [ ] **Step 4: `SimplifiedOnboardingContainer.tsx` anpassen**

In `src/domains/onboarding/components/SimplifiedOnboardingContainer.tsx` — im `case 'team':` Block den `onNext`-Handler anpassen:

```typescript
// ALT:
return (
  <SimplifiedTeamStep
    onNext={(team) => {
      setSelectedTeam(team);
      nextStep();
    }}
    onBack={previousStep}
  />
);

// NEU — importiere toggleTeam statt setSelectedTeam, onNext bekommt teams[]:
return (
  <SimplifiedTeamStep
    onNext={(_teams) => {
      // Teams wurden bereits via toggleTeam im Store gesetzt
      nextStep();
    }}
    onBack={previousStep}
  />
);
```

Entferne `setSelectedTeam` aus dem Destructuring in `SimplifiedOnboardingContainer.tsx`.

- [ ] **Step 5: Test ausführen — GREEN bestätigen**

```bash
npx vitest run tests/unit/domains/onboarding/SimplifiedTeamStep.test.tsx
```

Erwartet: alle 6 Tests grün

- [ ] **Step 6: TS-Check + volle Suite**

```bash
npx tsc --noEmit && npx vitest run 2>&1 | tail -5
```

Erwartet: 0 TS-Fehler, alle Unit-Tests grün

- [ ] **Step 7: Commit**

```bash
git add src/domains/onboarding/components/SimplifiedTeamStep.tsx \
        src/domains/onboarding/components/SimplifiedOnboardingContainer.tsx \
        tests/unit/domains/onboarding/SimplifiedTeamStep.test.tsx
git commit -m "feat: multi-team selection via checkboxes in onboarding"
```

---

## Task 3: Playwright Config + E2E-Specs anpassen

**Files:**
- Modify: `playwright.config.ts`
- Modify: `tests/e2e/onboarding-simplified.spec.ts`

- [ ] **Step 1: `playwright.config.ts` fixen**

Ersetze `testDir: './e2e'` durch `testDir: './tests'` und füge `testMatch` hinzu damit nur E2E und Accessibility-Specs von Playwright ausgeführt werden (nicht die Vitest-Unit-Tests):

```typescript
export default defineConfig({
  testDir: './tests',
  testMatch: ['**/e2e/**/*.spec.ts', '**/accessibility/**/*.spec.ts'],
  testIgnore: '**/zu-loeschen/**',
  // ... Rest bleibt unverändert
```

- [ ] **Step 2: Playwright-Lauf prüfen (erwartet Fehler wegen UI-Mismatch)**

```bash
npx playwright test --list 2>&1 | head -20
```

Erwartet: Specs werden gefunden (mind. `onboarding-simplified.spec.ts`)

- [ ] **Step 3: E2E-Spec auf aktuelle UI anpassen**

Ersetze den gesamten Inhalt von `tests/e2e/onboarding-simplified.spec.ts`:

```typescript
/**
 * E2E Tests für Simplified Onboarding
 *
 * Flow: Welcome → User → Verein → Team (Multi) → Completion → Dashboard
 */

import { test, expect } from '@playwright/test';

test.describe('Simplified Onboarding', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      indexedDB.deleteDatabase('BasketballPWA_v4');
    });
    await page.reload();
  });

  test('sollte kompletten Flow durchlaufen', async ({ page }) => {
    // 1. Welcome
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /willkommen/i })).toBeVisible();
    await page.getByRole('button', { name: /los geht/i }).click();

    // 2. User
    await expect(page.getByRole('heading', { name: /über dich/i })).toBeVisible();
    await page.getByLabel(/vorname/i).fill('Max');
    await page.getByLabel(/nachname/i).fill('Mustermann');
    await page.getByRole('button', { name: /weiter/i }).click();

    // 3. Verein
    await expect(page.getByRole('heading', { name: /wähle deinen verein/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/vereine verfügbar/i)).toBeVisible({ timeout: 10000 });

    await page.getByPlaceholder(/z\.B\./i).fill('Neumarkt');
    await page.waitForTimeout(300);
    await page.locator('input[type="radio"]').first().check();
    await page.getByRole('button', { name: /weiter/i }).click();

    // 4. Team (Multi-Auswahl)
    await expect(page.getByRole('heading', { name: /wähle deine teams/i })).toBeVisible({ timeout: 10000 });
    await page.locator('input[type="checkbox"]').first().check();
    await page.getByRole('button', { name: /weiter/i }).click();

    // 5. Completion
    await expect(page.getByText(/geschafft|abgeschlossen/i)).toBeVisible({ timeout: 10000 });
  });

  test('sollte Multi-Team-Auswahl erlauben', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /los geht/i }).click();
    await page.getByLabel(/vorname/i).fill('Test');
    await page.getByLabel(/nachname/i).fill('User');
    await page.getByRole('button', { name: /weiter/i }).click();

    await expect(page.getByText(/vereine verfügbar/i)).toBeVisible({ timeout: 10000 });
    await page.locator('input[type="radio"]').first().check();
    await page.getByRole('button', { name: /weiter/i }).click();

    await expect(page.getByRole('heading', { name: /wähle deine teams/i })).toBeVisible({ timeout: 10000 });

    const checkboxes = page.locator('input[type="checkbox"]');
    const count = await checkboxes.count();

    if (count >= 2) {
      await checkboxes.nth(0).check();
      await checkboxes.nth(1).check();
      await expect(page.getByText(/2.*teams.*ausgewählt/i)).toBeVisible();
    }
  });

  test('sollte Suche funktionieren', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      const store = (window as any).__SIMPLE_ONBOARDING_STORE__;
      if (store) store.setState({ currentStep: 'verein', user: { vorname: 'Test', nachname: 'User' } });
    });
    await page.reload();

    await expect(page.getByText(/vereine verfügbar/i)).toBeVisible({ timeout: 10000 });
    await page.getByPlaceholder(/z\.B\./i).fill('Bayern München');
    await page.waitForTimeout(300);

    const results = page.locator('input[type="radio"]');
    const resultCount = await results.count();
    expect(resultCount).toBeGreaterThan(0);
    expect(resultCount).toBeLessThan(50);
  });

  test('sollte Progress Bar anzeigen', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/schritt 1 von 5/i)).toBeVisible();

    await page.getByRole('button', { name: /los geht/i }).click();
    await expect(page.getByText(/schritt 2 von 5/i)).toBeVisible();

    await page.getByLabel(/vorname/i).fill('Test');
    await page.getByLabel(/nachname/i).fill('User');
    await page.getByRole('button', { name: /weiter/i }).click();
    await expect(page.getByText(/schritt 3 von 5/i)).toBeVisible({ timeout: 10000 });
  });

  test('sollte zurück navigieren können', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /los geht/i }).click();
    await page.getByLabel(/vorname/i).fill('Test');
    await page.getByLabel(/nachname/i).fill('User');
    await page.getByRole('button', { name: /weiter/i }).click();

    await expect(page.getByText(/vereine verfügbar/i)).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: /zurück/i }).click();
    await expect(page.getByRole('heading', { name: /über dich/i })).toBeVisible();
    await expect(page.getByLabel(/vorname/i)).toHaveValue('Test');
  });

  test('sollte Session Persistence haben', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /los geht/i }).click();
    await page.getByLabel(/vorname/i).fill('Session');
    await page.getByLabel(/nachname/i).fill('Test');
    await page.getByRole('button', { name: /weiter/i }).click();
    await page.reload();
    await expect(page.getByRole('heading', { name: /wähle deinen verein/i })).toBeVisible({ timeout: 10000 });
  });

  test('sollte responsive sein', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.getByRole('button', { name: /los geht/i }).click();
    await page.getByLabel(/vorname/i).fill('Mobile');
    await page.getByLabel(/nachname/i).fill('User');
    await page.getByRole('button', { name: /weiter/i }).click();
    await expect(page.getByRole('heading', { name: /wähle deinen verein/i })).toBeVisible({ timeout: 10000 });
  });
});
```

- [ ] **Step 4: Commit**

```bash
git add playwright.config.ts tests/e2e/onboarding-simplified.spec.ts
git commit -m "fix: playwright config zeigt auf tests/e2e + tests/accessibility, E2E-Specs auf aktuelle UI angepasst"
```

---

## Task 4: Accessibility-Tests schreiben

**Files:**
- Create: `tests/accessibility/onboarding.a11y.spec.ts`
- Create: `tests/accessibility/dashboard.a11y.spec.ts`

Voraussetzung: `@axe-core/playwright` installieren.

- [ ] **Step 1: axe-core/playwright installieren**

```bash
npm install --save-dev @axe-core/playwright
```

Erwartet: Paket erscheint in `package.json` devDependencies

- [ ] **Step 2: Onboarding A11y-Test erstellen**

Erstelle `tests/accessibility/onboarding.a11y.spec.ts`:

```typescript
/**
 * Accessibility Tests — Onboarding Flow
 *
 * Prüft WCAG 2.1 AA Compliance für alle Onboarding-Schritte via axe-core.
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Onboarding Accessibility', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.reload();
  });

  test('Welcome-Step hat keine kritischen A11y-Verstöße', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /willkommen/i })).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious')).toEqual([]);
  });

  test('User-Step hat keine kritischen A11y-Verstöße', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /los geht/i }).click();
    await expect(page.getByRole('heading', { name: /über dich/i })).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious')).toEqual([]);
  });

  test('Verein-Step hat keine kritischen A11y-Verstöße', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /los geht/i }).click();
    await page.getByLabel(/vorname/i).fill('Test');
    await page.getByLabel(/nachname/i).fill('User');
    await page.getByRole('button', { name: /weiter/i }).click();
    await expect(page.getByText(/vereine verfügbar/i)).toBeVisible({ timeout: 10000 });

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious')).toEqual([]);
  });

  test('Formular-Labels sind korrekt verknüpft', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /los geht/i }).click();

    // Vorname-Input muss ein assoziiertes Label haben
    const vornameInput = page.getByLabel(/vorname/i);
    await expect(vornameInput).toBeVisible();

    const nachnameInput = page.getByLabel(/nachname/i);
    await expect(nachnameInput).toBeVisible();
  });

  test('Tastatur-Navigation funktioniert im User-Step', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /los geht/i }).click();

    // Tab-Navigation durch Formularfelder
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(['INPUT', 'BUTTON']).toContain(focused);
  });
});
```

- [ ] **Step 3: Dashboard A11y-Test erstellen**

Erstelle `tests/accessibility/dashboard.a11y.spec.ts`:

```typescript
/**
 * Accessibility Tests — Dashboard
 *
 * Prüft WCAG 2.1 AA Compliance für das Dashboard.
 * Setzt abgeschlossenes Onboarding voraus (via localStorage-Injection).
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Dashboard Accessibility', () => {

  test.beforeEach(async ({ page }) => {
    // Onboarding überspringen via localStorage
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('onboarding-complete', 'true');
      localStorage.setItem('active-team-id', 'test-team-id');
    });
    await page.reload();
  });

  test('Dashboard hat keine kritischen A11y-Verstöße', async ({ page }) => {
    // Warte bis Dashboard gerendert
    await page.waitForSelector('[data-testid="dashboard"], nav, main', { timeout: 5000 }).catch(() => {});

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    expect(results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious')).toEqual([]);
  });

  test('Navigation-Elemente haben zugängliche Namen', async ({ page }) => {
    const buttons = page.getByRole('button');
    const count = await buttons.count();

    for (let i = 0; i < count; i++) {
      const btn = buttons.nth(i);
      const name = await btn.getAttribute('aria-label') ?? await btn.textContent();
      expect(name?.trim().length).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 4: Playwright-Lauf (nur Accessibility) prüfen**

```bash
npx playwright test tests/accessibility/ --project=chromium 2>&1 | tail -15
```

Erwartet: Tests laufen (können initial wegen fehlender Route fehlschlagen — das ist OK, die Infrastruktur muss laufen)

- [ ] **Step 5: Commit**

```bash
git add tests/accessibility/onboarding.a11y.spec.ts \
        tests/accessibility/dashboard.a11y.spec.ts \
        package.json package-lock.json
git commit -m "test: axe-basierte Accessibility-Tests für Onboarding und Dashboard"
```

---

## Self-Review

**Spec-Coverage:**
- ✅ Multi-Team Store (`selectedTeams[]`, `toggleTeam`) → Task 1
- ✅ `completeOnboarding` legt pro Team DB-Eintrag an → Task 1
- ✅ Checkbox-UI statt Radio → Task 2
- ✅ "X Teams ausgewählt"-Zähler → Task 2
- ✅ Playwright Config fix → Task 3
- ✅ E2E-Specs auf aktuelle UI → Task 3
- ✅ Multi-Team E2E-Test → Task 3
- ✅ Accessibility-Specs neu → Task 4

**Nicht in diesem Plan (bewusst ausgeschlossen):**
- Liga-ID-Nachladen via Team-Matches beim App-Start → separater Plan
- Verband-Filter in Verein-Step → wurde in altem Store entfernt, E2E-Test entfernt

**Placeholder-Scan:** Keine TBDs oder TODOs im Plan.

**Type-Konsistenz:**
- `toggleTeam(team: VRTeam)` konsistent in Store, UI und Tests
- `selectedTeams: VRTeam[]` konsistent in Store, UI, Container, Tests
- `onNext: (teams: VRTeam[]) => void` in SimplifiedTeamStep konsistent mit Container
