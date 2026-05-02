# Test-Import-Analyse & Korrekturen

## Zusammenfassung
Datum: 2025-10-30
Status: ⚠️ **Inkonsistenzen gefunden**

## Hauptprobleme

### 1. Import-Alias-Inkonsistenzen

#### ❌ Falsche Imports (ohne `@/`)
Diese Dateien verwenden veraltete Import-Pfade:

1. **SimplifiedTeamStep.test.tsx**
   - `@domains/` → sollte `@/domains/` sein
   - `@shared/` → sollte `@/shared/` sein

2. **SimplifiedVereinStep.test.tsx**
   - `@domains/` → sollte `@/domains/` sein
   - `@shared/` → sollte `@/shared/` sein

3. **ClubDataLoader.test.ts**
   - `@shared/` → sollte `@/shared/` sein

4. **onboarding-local-data.test.ts**
   - `@shared/` → sollte `@/shared/` sein

#### ✅ Korrekte Imports (mit `@/`)
Diese Dateien verwenden die richtigen Imports:
- BBBApiService.test.ts
- BBBSyncService.test.ts
- onboarding-simple.store.test.ts
- TeamService.test.ts
- TeamService.v7.test.ts
- team-merge.test.ts
- appStore.test.ts

### 2. Verzeichnisstruktur-Probleme

#### ⚠️ Leeres E2E-Verzeichnis
- `/basketball-app/e2e/` ist leer
- Sollte entfernt werden
- E2E-Tests sind korrekt in `/basketball-app/tests/e2e/`

### 3. Test-Helper-Verzeichnis
- Tests importieren `@/test/helpers/bbbTestHelpers`
- Dieses Verzeichnis existiert möglicherweise nicht oder wurde nicht überprüft

## Detaillierte Korrekturen

### Datei: SimplifiedTeamStep.test.tsx
```diff
- import { SimplifiedTeamStep } from '@domains/onboarding/components/SimplifiedTeamStep';
- import type { Team } from '@shared/types';
+ import { SimplifiedTeamStep } from '@/domains/onboarding/components/SimplifiedTeamStep';
+ import type { Team } from '@/shared/types';

- vi.mock('@shared/services/ClubDataLoader', () => ({
+ vi.mock('@/shared/services/ClubDataLoader', () => ({
   clubDataLoader: {
     loadTeamsForClub: vi.fn()
   }
 }));

- import { clubDataLoader } from '@shared/services/ClubDataLoader';
+ import { clubDataLoader } from '@/shared/services/ClubDataLoader';
```

### Datei: SimplifiedVereinStep.test.tsx
```diff
- import { SimplifiedVereinStep } from '@domains/onboarding/components/SimplifiedVereinStep';
- import type { Verein } from '@shared/types';
+ import { SimplifiedVereinStep } from '@/domains/onboarding/components/SimplifiedVereinStep';
+ import type { Verein } from '@/shared/types';

- vi.mock('@shared/services/ClubDataLoader', () => ({
+ vi.mock('@/shared/services/ClubDataLoader', () => ({
   clubDataLoader: {
     loadAllClubs: vi.fn(),
     clearCache: vi.fn()
   }
 }));

- import { clubDataLoader } from '@shared/services/ClubDataLoader';
+ import { clubDataLoader } from '@/shared/services/ClubDataLoader';
```

### Datei: ClubDataLoader.test.ts
```diff
- import { clubDataLoader } from '@shared/services/ClubDataLoader';
+ import { clubDataLoader } from '@/shared/services/ClubDataLoader';
```

### Datei: onboarding-local-data.test.ts
```diff
- import { clubDataService } from '@shared/services/ClubDataService';
+ import { clubDataService } from '@/shared/services/ClubDataService';
```

## Empfohlene Maßnahmen

### 1. Sofort
- [ ] Korrekturen in den 4 betroffenen Dateien durchführen
- [ ] Leeres `/e2e` Verzeichnis entfernen

### 2. Verifizierung
- [ ] Alle Tests ausführen: `npm test`
- [ ] TypeScript-Kompilierung prüfen: `npm run type-check`
- [ ] Import-Konsistenz mit Linter prüfen

### 3. Prävention
- [ ] ESLint-Regel für Import-Konsistenz hinzufügen
- [ ] Pre-commit Hook für Import-Validierung
- [ ] Dokumentation über korrekte Import-Pfade aktualisieren

## Test-Datei-Übersicht

### ✅ Korrekt platziert
```
tests/
├── unit/
│   ├── domains/
│   │   ├── bbb-api/ (2 Tests)
│   │   ├── onboarding/ (3 Tests + 1 Store-Test)
│   │   └── team/services/ (2 Tests)
│   ├── shared/services/ (1 Test)
│   └── stores/ (1 Test)
├── integration/
│   ├── onboarding/ (1 Test)
│   └── (1 Test)
├── e2e/ (2 Tests)
├── contract/ (leer, bereit für PACT)
├── accessibility/ (leer, bereit)
├── performance/ (leer, bereit)
├── security/ (leer, bereit)
└── visual/ (leer, bereit)
```

### ❌ Zu entfernen
```
/basketball-app/e2e/ (leer)
```

## TypeScript-Konfiguration prüfen

Stelle sicher, dass in `tsconfig.json` folgendes definiert ist:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

## Nächste Schritte

1. **Auto-Fix-Skript ausführen** (siehe unten)
2. **Tests ausführen**: `npm test`
3. **TypeScript prüfen**: `npm run type-check`
4. **Commit mit Fix**: `git commit -m "fix: Korrigiere Import-Pfade in Tests"`
