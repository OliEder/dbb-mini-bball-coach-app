# Test-Import-Pfade nach Service-Migration

## Problem
Nach Service Cleanup (30.10.2025) haben sich Pfade geändert:
- `domains/bbb-api/` → **gelöscht**
- BBBApiService → `shared/services/`
- BBBSyncService → `shared/services/`

Tests in `/tests` importieren noch alte Pfade!

## Betroffene Test-Dateien

### 1. BBBApiService.test.ts
```typescript
// ALT ❌
import { BBBApiService } from '@/domains/bbb-api/services/BBBApiService';

// NEU ✅
import { BBBApiService } from '@/shared/services/BBBApiService';
```

### 2. BBBSyncService.test.ts
```typescript
// ALT ❌
import { BBBSyncService } from '@/domains/bbb-api/services/BBBSyncService';
import { bbbApiService } from '@/domains/bbb-api/services/BBBApiService';

// NEU ✅
import { BBBSyncService } from '@/shared/services/BBBSyncService';
import { bbbApiService } from '@/shared/services/BBBApiService';
```

### 3. TeamService.test.ts
```typescript
// ALT ❌ (hat noch v6.0 Schema!)
const team1: Team = {
  altersklasse: 'U12',     // ❌ Gibt's nicht mehr in v7.0!
  saison: '2025/2026',     // ❌ Gibt's nicht mehr in v7.0!
  ...
};

// NEU ✅ (v7.0 kompatibel)
// Teams haben keine altersklasse/saison mehr
// Das geht jetzt über team_liga_participations
```

## Alle zu korrigierenden Dateien

1. `tests/unit/domains/bbb-api/BBBApiService.test.ts`
2. `tests/unit/domains/bbb-api/BBBSyncService.test.ts`
3. `tests/unit/domains/team/services/TeamService.test.ts` (v7.0!)
4. Alle anderen Tests die v6.0 Schema verwenden

## Warum 163 statt 380 Tests?

**Vorher (380 Tests):**
- Tests in `/src` (wurden ausgeführt)
- Tests in `/tests` (wurden ausgeführt)
- = Duplikate wurden doppelt gezählt!

**Jetzt (163 Tests):**
- Tests nur noch in `/tests`
- ABER: Viele failen wegen falscher Imports
- = Werden übersprungen/nicht gezählt

## Lösung

1. Import-Pfade korrigieren (bbb-api → shared/services)
2. v6.0 → v7.0 Schema in Tests anpassen
3. Tests neu ausführen

Dann sollten wir ~200-250 funktionierende Tests haben.
