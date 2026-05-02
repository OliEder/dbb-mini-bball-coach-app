# Test-Fixes Action Plan

**Datum:** 27.10.2025  
**Ziel:** Alle 8 fehlschlagenden Tests fixen  
**Status:** 🔧 Ready to implement

---

## Quick Summary

| Datei | Tests | Problem | Fix |
|-------|-------|---------|-----|
| `BBBSyncService.test.ts` | 1 | Falscher Fehler-Test | Test umschreiben |
| `BBBSyncService.integration.test.ts` | 1 | Falsches Mock-Format | Mock korrigieren |
| `BBBSyncService.pact.test.ts` | 6 | CORS-Fallback blockiert | Test-Mode aktivieren |

---

## Fix 1: BBBSyncService.test.ts

### Problem
Test löscht Liga manuell, aber Fehler wird früher geworfen als erwartet.

### Lösung
```typescript
// tests/unit/domains/bbb-api/BBBSyncService.test.ts

it('should throw error if Liga not found when syncing Spielplan', async () => {
  // ÄNDERUNG: Erstelle Liga direkt in DB (ohne Tabelle)
  const liga: Liga = {
    liga_id: crypto.randomUUID(),
    bbb_liga_id: '99999',
    name: 'Test Liga',
    saison: '2025/26',
    altersklasse: 'U10',
    sync_am: new Date(),
    created_at: new Date(),
  };
  await db.ligen.add(liga);

  // Mock: Spielplan mit Teams die nicht existieren
  mockBBBApiService.getSpielplan.mockResolvedValueOnce({
    games: [{
      matchId: 123,
      gameNumber: 1,
      gameDay: 1,
      date: '2025-10-05',
      time: '18:00',
      homeTeam: { teamId: 1, teamName: 'A' },
      awayTeam: { teamId: 2, teamName: 'B' },
      status: 'scheduled'
    }]
  });

  // ÄNDERUNG: Teste syncSpielplan direkt (nicht syncLiga!)
  await expect(syncService.syncSpielplan(99999))
    .rejects
    .toThrow('Liga 99999 not found in DB');
});
```

**Datei:** `/Users/oliver-marcuseder/Documents/00-Privat/Basketball-Apps/basketball-app/tests/unit/domains/bbb-api/BBBSyncService.test.ts`

**Zeilen:** ~224-247

---

## Fix 2: BBBSyncService.integration.test.ts

### Problem
Mock-Response hat falschen `data`-Wrapper.

### Lösung
```typescript
// src/domains/bbb-api/services/__tests__/BBBSyncService.integration.test.ts

it('sollte echte API-Antwortstrukturen korrekt verarbeiten', async () => {
  const ligaId = 12345;

  // ✅ ÄNDERUNG: Korrektes Format (OHNE data-Wrapper)
  const tableResponse = {
    ligaId: ligaId,  // Direkt im Root, nicht in data!
    liganame: 'U10 Bezirksliga Oberpfalz',
    teams: [
      {
        position: 1,
        teamId: 111,
        teamName: 'SV Postbauer U10',
        clubId: 4087,
        clubName: 'SV Postbauer',
        games: 10,
        wins: 8,
        losses: 2,
        points: 16,
        scoredPoints: 450,
        concededPoints: 380,
        pointsDifference: 70,
      },
      {
        position: 2,
        teamId: 222,
        teamName: 'TSV Neumarkt U10',
        clubId: 4083,
        clubName: 'TSV Neumarkt',
        games: 10,
        wins: 6,
        losses: 4,
        points: 12,
        scoredPoints: 400,
        concededPoints: 380,
        pointsDifference: 20,
      }
    ]
  };

  const spielplanResponse = {
    games: [  // Direkt im Root, nicht in data!
      {
        matchId: 99991,
        gameNumber: 1,
        gameDay: 1,
        date: '2025-11-01',
        time: '10:00',
        homeTeam: {
          teamId: 111,
          teamName: 'SV Postbauer U10'
        },
        awayTeam: {
          teamId: 222,
          teamName: 'TSV Neumarkt U10'
        },
        venue: {
          name: 'Sporthalle Postbauer',
          address: 'Hauptstraße 1',
          city: 'Postbauer-Heng',
          zipCode: '92353'
        },
        status: 'scheduled'
      }
    ]
  };

  // Rest bleibt gleich...
});
```

**Datei:** `/Users/oliver-marcuseder/Documents/00-Privat/Basketball-Apps/basketball-app/src/domains/bbb-api/services/__tests__/BBBSyncService.integration.test.ts`

**Zeilen:** ~38-134

---

## Fix 3: BBBSyncService.pact.test.ts

### Problem
CORS-Fallback verhindert PACT Mock-Server.

### Lösung
```typescript
// src/domains/bbb-api/services/__tests__/BBBSyncService.pact.test.ts

import { PactV3, MatchersV3 } from '@pact-foundation/pact';
import { BBBApiService } from '../BBBApiService';  // ✅ Import hinzufügen
import { BBBSyncService } from '../BBBSyncService';
import { db } from '../../../../shared/db/database';
import path from 'path';

const { like, eachLike, integer, string } = MatchersV3;

describe('BBBSyncService PACT Tests v16', () => {
  let mockProvider: PactV3;
  let apiService: BBBApiService;  // ✅ Typed
  let syncService: BBBSyncService;

  beforeEach(async () => {
    // Clear database
    await db.delete();
    await db.open();

    // Setup PACT
    mockProvider = new PactV3({
      consumer: 'BasketballTeamManager',
      provider: 'DBB-REST-API',
      port: 8989,
      dir: path.resolve(process.cwd(), 'pacts')
    });

    // ✅ ÄNDERUNG: Test-Mode aktivieren!
    apiService = new BBBApiService({
      baseUrl: mockProvider.url,
      testMode: true  // CORS-Fallback deaktiviert
    });
    
    syncService = new BBBSyncService(apiService);
  });

  afterEach(async () => {
    await db.close();
  });

  // ... alle Tests bleiben gleich!
});
```

**Datei:** `/Users/oliver-marcuseder/Documents/00-Privat/Basketball-Apps/basketball-app/src/domains/bbb-api/services/__tests__/BBBSyncService.pact.test.ts`

**Zeilen:** ~1-35

---

## Implementation Checklist

### Phase 1: BBBApiService (✅ Done)
- [x] Constructor mit Config-Option
- [x] `testMode` Flag
- [x] `fetchWithFallback` angepasst
- [x] Dokumentation

### Phase 2: Test-Fixes
- [ ] **Fix 1:** BBBSyncService.test.ts
  - [ ] Test-Logik umschreiben
  - [ ] Test ausführen
  - [ ] Validieren

- [ ] **Fix 2:** BBBSyncService.integration.test.ts
  - [ ] Mock-Format korrigieren
  - [ ] Test ausführen
  - [ ] Validieren

- [ ] **Fix 3:** BBBSyncService.pact.test.ts
  - [ ] Import hinzufügen
  - [ ] Test-Mode aktivieren
  - [ ] Alle 6 Tests ausführen
  - [ ] Validieren

### Phase 3: Validation
- [ ] Alle Unit-Tests: `npm run test:unit`
- [ ] Alle Integration-Tests: `npm run test:integration`
- [ ] Alle PACT-Tests: `npm run test:pact`
- [ ] Full Test-Suite: `npm test`

---

## Expected Results

### Before
```bash
$ npm test

Test Suites: 11 failed, 154 passed, 165 total
Tests:       8 failed, 1 skipped, 313 passed, 322 total
```

### After
```bash
$ npm test

Test Suites: 165 passed, 165 total
Tests:       1 skipped, 321 passed, 322 total
```

---

## Rollback Plan

Falls Probleme auftreten:

1. **BBBApiService zurücksetzen:**
   ```bash
   git checkout HEAD -- src/domains/bbb-api/services/BBBApiService.ts
   ```

2. **Test-Fixes rückgängig:**
   ```bash
   git checkout HEAD -- tests/unit/domains/bbb-api/BBBSyncService.test.ts
   git checkout HEAD -- src/domains/bbb-api/services/__tests__/*.test.ts
   ```

---

## Time Estimate

| Task | Time |
|------|------|
| Fix 1: BBBSyncService.test.ts | 5 min |
| Fix 2: BBBSyncService.integration.test.ts | 5 min |
| Fix 3: BBBSyncService.pact.test.ts | 10 min |
| Test Validation | 10 min |
| **Total** | **30 min** |

---

## Next Steps

Soll ich die Fixes direkt implementieren? 

1. ✅ BBBApiService ist fertig
2. ⏳ Warte auf dein Go für Test-Fixes

**Kommando:** "Implementiere Fixes" oder einzeln: "Fix 1", "Fix 2", "Fix 3"
