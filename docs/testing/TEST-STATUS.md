# 🧪 Test-Status & Analyse

**Datum:** 23. Oktober 2025  
**Sprint:** Simplified Onboarding - Test-Stabilisierung  
**Status:** 🔴 27 Tests fehlschlagen (von ~97 Unit Tests)

---

## 📊 Test-Übersicht

### Implementierte Tests

```
tests/
├── unit/                                          [97 Tests]
│   ├── shared/services/
│   │   ├── ClubDataLoader.test.ts                [30 Tests] ⚠️
│   │   ├── BBBApiService.test.ts                 [18 Tests] ✅
│   │   └── BBBSyncService.test.ts                [14 Tests] ✅
│   │
│   └── domains/onboarding/
│       ├── SimplifiedVereinStep.test.tsx         [20 Tests] ⚠️
│       └── SimplifiedTeamStep.test.tsx           [15 Tests] ⚠️
│
├── integration/
│   └── onboarding-local-data.test.ts             [TODO]
│
├── contract/
│   └── BBBSyncService.pact.test.ts               [6 Tests] ✅
│
└── e2e/
    ├── onboarding-simplified.spec.ts             [~10 Tests] ⚠️
    └── onboarding-v2.spec.ts                     [~10 Tests] ⚠️
```

### Status-Legende
- ✅ **Alle Tests grün**
- ⚠️ **Tests teilweise fehlschlagend**
- 🔴 **Kritischer Fehler**
- 📝 **TODO / Nicht implementiert**

---

## 🔍 Detaillierte Analyse

### 1. ClubDataLoader.test.ts (30 Tests)

**Datei:** `tests/unit/shared/services/ClubDataLoader.test.ts`  
**Service:** `src/shared/services/ClubDataLoader.ts`  
**Test-Ansatz:** Integration-Tests mit echten JSON-Chunks

#### Test-Struktur
```typescript
describe('ClubDataLoader', () => {
  beforeEach(() => {
    clubDataLoader.clearCache(); // Cache leeren vor jedem Test
  });

  describe('loadAllClubs()', () => {
    // 4 Tests für grundlegende Lade-Funktionalität
  });

  describe('searchClubs()', () => {
    // 5 Tests für Suche
  });

  describe('filterByVerband()', () => {
    // 3 Tests für Verband-Filter
  });

  describe('searchAndFilter()', () => {
    // 4 Tests für kombinierte Filter
  });

  describe('loadTeamsForClub()', () => {
    // 3 Tests für Team-Laden
  });

  describe('getMetadata()', () => {
    // 1 Test für Metadaten
  });

  describe('clearCache()', () => {
    // 1 Test für Cache-Clearing
  });

  describe('Performance & Edge Cases', () => {
    // 3 Tests für Performance/UTF-8/Whitespace
  });

  describe('Data Integrity', () => {
    // 3 Tests für Datenqualität
  });
});
```

#### Besonderheiten

**✅ Warum Integration-Tests statt Unit-Tests?**
```typescript
// ❌ Unit-Test-Ansatz (schwierig in Vitest)
vi.mock('@shared/data/clubs-chunks/clubs-chunk-0.json', () => ({
  default: { clubs: { ... } }
}));
// → Dynamische Imports sind schwer zu mocken!

// ✅ Integration-Test-Ansatz (aktuelle Lösung)
// Lädt echte JSON-Chunks aus src/shared/data/clubs-chunks/
// Vorteile:
// - Testet echte Datenstruktur
// - Findet Datenintegritäts-Probleme
// - Keine komplizierten Mocks
// - Performance akzeptabel (~200ms)
```

**✅ kurzname-Fallback implementiert**
```typescript
// Service-Implementation
kurzname: clubData.verein.kurzname ?? clubData.verein.name

// Interface
interface ClubData {
  verein: {
    kurzname?: string; // Optional!
  };
}

// Test erwartet IMMER einen String (durch Fallback)
expect(typeof firstClub.verein.kurzname).toBe('string');
expect(firstClub.verein.kurzname.length).toBeGreaterThan(0);
```

**⚠️ Potenzielle Fehlerquellen**
1. **Import-Pfad-Auflösung:** `@shared/*` muss in `vitest.config.ts` korrekt gemappt sein
2. **JSON-Import:** Vite muss JSON-Imports unterstützen (sollte Standard sein)
3. **Async/Await:** Alle Tests verwenden korrekt `async/await`
4. **Cache-Isolation:** `clearCache()` in `beforeEach()` verhindert Test-Interferenz

**🔧 Erwartete Fehler (noch zu verifizieren)**
- Möglicherweise: "Cannot find module '@shared/data/clubs-chunks/...'"
- Möglicherweise: Type-Errors bei `kurzname` (sollte durch `?:` behoben sein)
- Möglicherweise: Timeout bei langsamen Systemen (18 Chunks parallel)

---

### 2. SimplifiedVereinStep.test.tsx (20 Tests)

**Datei:** `tests/unit/domains/onboarding/SimplifiedVereinStep.test.tsx`  
**Component:** `src/domains/onboarding/components/SimplifiedVereinStep.tsx`  
**Test-Ansatz:** Unit-Tests mit gemocktem ClubDataLoader

#### Test-Struktur
```typescript
// ⚠️ WICHTIG: Mock VOR Import!
vi.mock('@shared/services/ClubDataLoader', () => ({
  clubDataLoader: {
    loadAllClubs: mockLoadAllClubs,
    clearCache: vi.fn()
  }
}));

// DANN erst importieren
import { SimplifiedVereinStep } from '@domains/onboarding/components/SimplifiedVereinStep';

describe('SimplifiedVereinStep', () => {
  const mockOnNext = vi.fn();
  const mockOnBack = vi.fn();
  const mockOnVerbandFilterChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadAllClubs.mockResolvedValue(mockClubs); // Mock-Daten
  });

  describe('Rendering & Loading States', () => {
    // 3 Tests: Loading, Success, Error
  });

  describe('Verband-Filter', () => {
    // 3 Tests: Dropdown, Filter-Anwendung, Reset
  });

  describe('Suche', () => {
    // 4 Tests: Suche, Case-Insensitive, Leer-Ergebnis
  });

  describe('Vereinsauswahl', () => {
    // 2 Tests: Auswahl, Visuelle Hervorhebung
  });

  describe('Navigation', () => {
    // 5 Tests: Zurück, Weiter disabled/enabled, onNext-Call
  });

  describe('Accessibility', () => {
    // 1 Test: ARIA-Labels
  });
});
```

#### Mock-Daten
```typescript
const createMockVerein = (
  id: string,
  name: string,
  kurzname: string,
  verbandIds: number[]
): Verein => ({
  verein_id: id,
  name,
  kurzname, // ✅ Wird explizit gesetzt (kein Fallback nötig im Mock)
  verband_ids: verbandIds,
  ist_eigener_verein: false,
  created_at: new Date()
});

const mockClubs = [
  {
    verein: createMockVerein('V001', 'FC Bayern München Basketball', 'Bayern München', [2]),
    clubId: 'club_001'
  },
  {
    verein: createMockVerein('V002', 'Alba Berlin', 'Alba', [3]),
    clubId: 'club_002'
  },
  {
    verein: createMockVerein('V003', 'MHP Riesen Ludwigsburg', 'Ludwigsburg', [1]),
    clubId: 'club_003'
  }
];
```

**⚠️ Potenzielle Fehlerquellen**
1. **Mock-Reihenfolge:** Mock MUSS vor Import stehen!
2. **Testing Library:** `waitFor()` timeout bei langsamen Renderings
3. **HappyDOM:** Manche DOM-APIs möglicherweise nicht vollständig implementiert
4. **User Events:** `userEvent.setup()` vs. `userEvent` (v14 Syntax)

**🔧 Erwartete Fehler (noch zu verifizieren)**
- "Cannot find element with text..." → `waitFor()` timeout erhöhen?
- "Mock not working" → Reihenfolge Mock/Import prüfen
- Type-Errors bei Mock-Rückgabewerten

---

### 3. SimplifiedTeamStep.test.tsx (15 Tests)

**Datei:** `tests/unit/domains/onboarding/SimplifiedTeamStep.test.tsx`  
**Component:** `src/domains/onboarding/components/SimplifiedTeamStep.tsx`  
**Test-Ansatz:** Unit-Tests mit gemocktem ClubDataLoader

#### Test-Struktur
```typescript
// ⚠️ WICHTIG: Mock VOR Import!
vi.mock('@shared/services/ClubDataLoader', () => ({
  clubDataLoader: {
    loadTeamsForClub: mockLoadTeamsForClub
  }
}));

describe('SimplifiedTeamStep', () => {
  const mockOnNext = vi.fn();
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadTeamsForClub.mockResolvedValue(mockTeams);
  });

  describe('Rendering & Loading States', () => {
    // 3 Tests: Loading, Success, Error
  });

  describe('Team-Auswahl', () => {
    // 4 Tests: Single, Multiple, Alle auswählen, Abwählen
  });

  describe('Navigation', () => {
    // 5 Tests: Zurück, Weiter disabled/enabled, onNext-Call
  });

  describe('Empty State', () => {
    // 1 Test: Keine Teams vorhanden
  });

  describe('Accessibility', () => {
    // 1 Test: ARIA-Labels
  });
});
```

#### Mock-Daten
```typescript
const createMockTeam = (
  id: string,
  vereinId: string,
  name: string,
  ligaName?: string
): Team => ({
  team_id: id,
  verein_id: vereinId,
  name,
  liga_id: ligaName ? 'liga_' + id : '',
  liga_name: ligaName || '',
  altersklasse_id: 1,
  geschlecht: 'male',
  saison: '2024/2025',
  team_typ: 'eigen',
  created_at: new Date()
});

const mockTeams = [
  createMockTeam('team_001', 'V001', '1. Herren', 'Basketball Bundesliga'),
  createMockTeam('team_002', 'V001', 'U19 NBBL', 'Nachwuchs Basketball Bundesliga'),
  createMockTeam('team_003', 'V001', 'U16 männlich', 'Jugend Basketball Bundesliga')
];
```

**⚠️ Potenzielle Fehlerquellen**
- Gleiche wie SimplifiedVereinStep
- Multi-Select-Logic (Checkboxen statt Radio-Buttons)

---

## 🛠️ Konfiguration

### vitest.config.ts - Path Aliases

```typescript
resolve: {
  alias: {
    '@shared': path.resolve(__dirname, './src/shared'),
    '@domains': path.resolve(__dirname, './src/domains'),
    '@features': path.resolve(__dirname, './src/features'),
    '@test': path.resolve(__dirname, './src/test')
  }
}
```

**✅ Validiert am:** 23.10.2025  
**Status:** Konfiguration sieht korrekt aus

### tsconfig.json - Path Mapping

```json
{
  "compilerOptions": {
    "paths": {
      "@shared/*": ["./src/shared/*"],
      "@domains/*": ["./src/domains/*"],
      "@features/*": ["./src/features/*"],
      "@test/*": ["./src/test/*"]
    }
  }
}
```

**⚠️ Wichtig:** Beide Configs müssen IDENTISCH sein!

### Test-Setup

**Datei:** `src/test/setup.ts`

```typescript
import '@testing-library/jest-dom';
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup nach jedem Test
afterEach(() => {
  cleanup();
});
```

**✅ Validiert am:** 23.10.2025  
**Status:** Setup-File vorhanden und korrekt

---

## 📝 Vermutete Fehlerursachen (Hypothesen)

### ❌ Hypothese 1: Import-Path-Resolution (WIDERLEGT!)
**Status:** 🟢 WIDERLEGT - Kein Problem
**Validiert:** 23.10.2025, 13:00 Uhr

**Annahme war:**
```bash
Error: Cannot find module '@shared/services/ClubDataLoader'
Error: Cannot find module '@shared/data/clubs-chunks/clubs-metadata.json'
```

**Tatsächliches Ergebnis:**
- ✅ Alle ClubDataLoader Tests grün (28/28)
- ✅ Alle SimplifiedVereinStep Tests grün (16/16)
- ✅ Alle SimplifiedTeamStep Tests grün (16/16)
- ✅ Path-Resolution funktioniert korrekt

**Lesson Learned:**
Vite's `path.resolve()` funktioniert korrekt auch ohne `/*` Suffix. Die Aliases wurden richtig aufgelöst.

---

### ✅ Hypothese 2: BBB API Response Mapping (BESTÄTIGT!)
**Status:** 🔴 BESTÄTIGT - Hauptproblem!
**Wahrscheinlichkeit:** 🔴 Hoch

**Symptome:**
```javascript
TypeError: Cannot read properties of undefined (reading 'seasonTeamId')
// In: BBBApiService.getSpielplan() Line 317

AssertionError: expected [] to have a length of 1 but got +0
// In: BBBApiService.getTabelle() Tests
```

**Root Cause:**
Die deutsche BBB-API liefert Properties mit deutschen Namen:
- API: `teamname` ❌
- Erwartet: `teamName` ✅

- API: `gewonnen` ❌
- Erwartet: `wins` / `victories` ✅

- API: Response-Struktur stimmt nicht mit erwartetem Format überein

**Betroffene Dateien:**
- `src/domains/bbb-api/services/BBBApiService.ts:317`
- `src/domains/bbb-api/services/BBBApiService.ts:229`
- `src/domains/bbb-api/services/BBBSyncService.ts`

**Fix-Plan:**
1. Analysiere echte API-Response-Struktur
2. Passe Property-Mapping an deutsche Feldnamen an
3. Füge Null-Checks für optionale Properties hinzu
4. Update Tests mit korrekten Mock-Daten

---

### Hypothese 3: JSON-Import in Tests (NICHT RELEVANT)
**Wahrscheinlichkeit:** 🟡 Mittel

```bash
# Fehler könnte sein:
Error: Unexpected token in JSON
Error: Cannot parse JSON
```

**Ursache:** Vite verarbeitet JSON-Imports evtl. anders in Tests

**Lösung:**
```typescript
// Option A: JSON direkt importieren (aktuell)
import metadata from '@shared/data/clubs-chunks/clubs-metadata.json';

// Option B: Als Module importieren
const metadata = await import('@shared/data/clubs-chunks/clubs-metadata.json').default;

// Option C: Fetch (nicht empfohlen für Tests)
```

---

### Hypothese 3: kurzname Type-Error
**Wahrscheinlichkeit:** 🟢 Niedrig (bereits gefixt)

```typescript
// ❌ Vor Fix:
interface ClubData {
  verein: {
    kurzname: string; // NICHT optional
  };
}
// → TypeScript-Error: Property 'kurzname' is possibly 'undefined'

// ✅ Nach Fix:
interface ClubData {
  verein: {
    kurzname?: string; // Optional
  };
}
kurzname: clubData.verein.kurzname ?? clubData.verein.name // Fallback
```

**Status:** ✅ Fix bereits im Code implementiert

---

### Hypothese 4: Mock-Timing-Probleme
**Wahrscheinlichkeit:** 🟡 Mittel

```typescript
// ⚠️ FALSCH: Mock nach Import
import { SimplifiedVereinStep } from './SimplifiedVereinStep';
vi.mock('@shared/services/ClubDataLoader'); // ZU SPÄT!

// ✅ RICHTIG: Mock vor Import
vi.mock('@shared/services/ClubDataLoader', () => ({ ... }));
import { SimplifiedVereinStep } from './SimplifiedVereinStep';
```

**Status:** ✅ Reihenfolge in Tests korrekt

---

### Hypothese 5: HappyDOM Limitations
**Wahrscheinlichkeit:** 🟢 Niedrig

Manche DOM-APIs sind in HappyDOM nicht vollständig implementiert.

**Potenzielle Probleme:**
- `Element.scrollIntoView()` → Mock nötig
- `IntersectionObserver` → Mock nötig
- `ResizeObserver` → Mock nötig

**Lösung:** Falls nötig, globale Mocks in `src/test/setup.ts`

---

### Hypothese 6: Async Timeout
**Wahrscheinlichkeit:** 🟡 Mittel

```typescript
// 18 Chunks parallel laden kann lange dauern
const chunks = await Promise.all(chunkPromises);
```

**Lösung:**
```typescript
// In Tests: Timeout erhöhen
it('lädt alle Clubs', async () => {
  // ...
}, 10000); // 10 Sekunden statt 5
```

---

## 🎯 Nächste Schritte

### Phase 1: Tests ausführen & Fehler sammeln ⏭️ **JETZT**
```bash
cd basketball-app

# Option 1: Vitest UI (empfohlen)
npm run test:ui

# Option 2: Console
npm test

# Option 3: Nur ClubDataLoader Tests
npm test -- ClubDataLoader

# Option 4: Nur Component Tests
npm test -- SimplifiedVereinStep SimplifiedTeamStep
```

**Was dokumentieren:**
1. ✅ Welche Tests grün sind
2. ❌ Welche Tests rot sind
3. 📋 Exakte Fehlermeldungen
4. 📊 Stack Traces
5. ⏱️ Laufzeiten

---

### Phase 2: Fehler kategorisieren
Nach Test-Run → Fehler in Kategorien einteilen:

**A) Import/Path-Fehler**
```
Cannot find module '@shared/...'
Module not found
```
→ Fix: vitest.config.ts alias

**B) Type-Fehler**
```
Property 'kurzname' does not exist
Type 'undefined' is not assignable
```
→ Fix: Interface-Definitionen

**C) Runtime-Fehler**
```
Cannot read property 'X' of undefined
Timeout exceeded
```
→ Fix: Daten-Validierung, async/await

**D) Test-Logic-Fehler**
```
Expected X but got Y
Assertion failed
```
→ Fix: Test-Assertions anpassen

---

### Phase 3: Fixes implementieren (TDD!)

**Pro Fehler-Kategorie:**
```
1. Verstehe den Fehler
2. Reproduziere lokal (falls nötig)
3. Implementiere Fix
4. Verifiziere: Test wird grün
5. Commit: `fix(tests): resolve [kategorie] errors`
```

**Reihenfolge:**
1. **Import/Path-Fehler** (blockiert alle Tests)
2. **Type-Fehler** (blockiert Compilation)
3. **Runtime-Fehler** (kritisch)
4. **Test-Logic-Fehler** (least critical)

---

### Phase 4: Coverage & Quality Gates

**Nachdem alle Tests grün:**
```bash
# Coverage prüfen
npm run test:coverage

# Ziel: ≥85%
```

**Dann:**
- E2E Tests prüfen (`npm run test:e2e`)
- Contract Tests prüfen (falls relevant)
- Mutation Tests (später)

---

## 📚 Wichtige Dateien - Quick Reference

### Tests
```
tests/unit/shared/services/ClubDataLoader.test.ts
tests/unit/domains/onboarding/SimplifiedVereinStep.test.tsx
tests/unit/domains/onboarding/SimplifiedTeamStep.test.tsx
```

### Services
```
src/shared/services/ClubDataLoader.ts
```

### Components
```
src/domains/onboarding/components/SimplifiedVereinStep.tsx
src/domains/onboarding/components/SimplifiedTeamStep.tsx
```

### Konfiguration
```
vitest.config.ts          # Vitest Config + Aliases
tsconfig.json             # TypeScript + Path Mapping
src/test/setup.ts         # Test-Setup (jest-dom)
```

### Daten
```
src/shared/data/clubs-chunks/clubs-metadata.json
src/shared/data/clubs-chunks/clubs-chunk-[0-17].json
```

---

## 🤖 Für den nächsten Chat

**Wenn du diese Datei liest:**

1. **Prüfe zuerst:** Wurden Tests bereits ausgeführt?
   - Siehe unten: "Test-Run-Ergebnisse"
   - Falls nein → Führe Tests aus (siehe Phase 1)

2. **Lies die Fehler-Kategorisierung**
   - Welche Kategorie hat die meisten Fehler?
   - Start mit höchster Priorität

3. **Implementiere Fixes schrittweise**
   - Ein Fix → Test-Run → Verifizierung
   - Dokumentiere Fixes hier

4. **Update dieses Dokument**
   - Status ändern (🔴 → 🟡 → ✅)
   - Neue Erkenntnisse hinzufügen
   - "Letzte Aktualisierung" ändern

---

## 📊 Test-Run-Ergebnisse

### Run #1: Baseline Analysis
**Datum:** 23. Oktober 2025, 13:00 Uhr  
**Command:** `npm run test:json`  
**Dauer:** ~16s

**Ergebnis:**
```
Tests:     ✅ 307 passed | ❌ 14 failed | 📝 1 skipped
Total:     322 Tests
Success:   95.3%
Coverage:  TBD
```

**Fehler-Kategorien:**
- [x] Import/Path-Fehler: **0** ✅ Path-Resolution funktioniert!
- [ ] Type-Fehler: 0
- [x] Runtime-Fehler: **14** (BBB API Mapping)
- [ ] Test-Logic-Fehler: 0

**Detaillierte Fehler:**
```
1. BBBApiService.test.ts (src) - 2 Fehler:
   ❌ getTabelle: Leeres Array statt Daten
   ❌ getSpielplan: TypeError seasonTeamId undefined

2. BBBSyncService.integration.test.ts - 3 Fehler:
   ❌ Real API Response: TypeError seasonTeamId undefined
   ❌ Partial Errors: Expected > 0, got 0
   ❌ Duplikate vermeiden: Empty array

3. BBBSyncService.pact.test.ts - 6 Fehler:
   ❌ Alle Tests: CORS Proxy failures

4. BBBApiService.test.ts (unit) - 1 Fehler:
   ❌ getTabelle mapping: Liga-Name fehlt

5. BBBSyncService.test.ts (unit) - 2 Fehler:
   ❌ Error message mismatch
   ❌ TypeError: teams undefined
```

---

### Run #2: [Nach Fixes]
**Datum:** TBD  
**Command:** TBD  
**Dauer:** TBD

**Ergebnis:**
```
[TBD]
```

---

## 🧠 Erkenntnisse & Learnings

### ✅ Was gut funktioniert

1. **Integration-Test-Ansatz für ClubDataLoader**
   - Echte Daten testen echte Bugs
   - Keine komplexen Mocks nötig
   - Performance akzeptabel

2. **Mocking-Strategie für Components**
   - Mock vor Import
   - Klare Trennung: Service-Logic vs. UI-Logic
   - Wiederverwendbare Mock-Factories

3. **Test-Struktur**
   - Klare Gruppierung nach Feature
   - Sprechende Test-Namen
   - Gute Coverage verschiedener Szenarien

---

### ⚠️ Was zu beachten ist

1. **Path Aliases**
   - MÜSSEN in beiden Configs identisch sein
   - Vitest + TypeScript
   - Häufige Fehlerquelle!

2. **Async/Await**
   - Alle ClubDataLoader-Calls sind async
   - `waitFor()` in Component-Tests
   - Timeout-Anpassungen evtl. nötig

3. **Mock-Reihenfolge**
   - KRITISCH: Mock VOR Import!
   - Sonst wird echte Implementation geladen

4. **kurzname-Handling**
   - Muss optional sein
   - Fallback implementieren
   - Tests erwarten immer einen String (durch Fallback)

---

### 🔮 Verbesserungspotenzial

1. **Integration-Tests fehlen**
   - Layer-Interaktionen testen
   - Store → Service → Component

2. **Performance-Tests**
   - 18 Chunks parallel: Wie lange dauert das?
   - Memory-Usage bei Cache?

3. **Mutation-Tests**
   - Sind unsere Tests stark genug?
   - Finden sie echte Bugs?

4. **E2E-Tests erweitern**
   - Vollständige User-Journeys
   - Offline-Szenarios

---

## 🔗 Related Docs

- [PROJECT-STATUS.md](./PROJECT-STATUS.md) - Vollständiger Projekt-Status
- [TECHNICAL-DECISIONS.md](./TECHNICAL-DECISIONS.md) - Architektur-Entscheidungen
- [QUICKSTART.md](./QUICKSTART.md) - Chat-Wechsel-Template
- [tests/README.md](../../tests/README.md) - Test-Strategie

---

**Letzte Aktualisierung:** 23. Oktober 2025, 12:30 Uhr  
**Nächster Meilenstein:** Alle Unit-Tests grün  
**Status:** 🔴 Warten auf Test-Run-Ergebnisse

---

**⚡ Quick Commands:**
```bash
# Tests ausführen
npm run test:ui              # Vitest UI (beste DX)
npm test                     # Console
npm test -- ClubDataLoader   # Nur ein Test-File

# Coverage
npm run test:coverage

# Watch Mode
npm run test:watch
```
