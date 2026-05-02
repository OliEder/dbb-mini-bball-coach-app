# v6.0 Migration Status - team_id aus Spiel entfernen

**Datum:** 27.10.2025  
**Status:** ✅ Core Implementation Complete

## ✅ Completed Tasks

### 1. Types & Schema (BREAKING CHANGE)
- [x] `src/shared/types/index.ts` - Spiel Interface: team_id entfernt
- [x] `src/shared/db/database.ts` - Schema v6.0
  - DB_VERSION = 6
  - Indizes angepasst: `[heim_team_id+datum], [gast_team_id+datum]`
  - Migration: team_id aus allen Spielen entfernen
- [x] Dokumentation in Types mit Kommentaren

### 2. Domain Service (NEU)
- [x] `src/domains/spiel/services/SpielService.ts` - Complete Implementation
  - `getSpiele(teamId)` - Alle Spiele (Heim OR Gast)
  - `getHeimSpiele(teamId)` - Nur Heimspiele
  - `getAuswaertsSpiele(teamId)` - Nur Auswärtsspiele
  - `getUpcomingSpiele(teamId, limit?)` - Kommende Spiele
  - `getCompletedSpiele(teamId)` - Abgeschlossene Spiele
  - `isInternesSpiel(spiel)` - Edge Case: Internes Spiel
- [x] `src/domains/spiel/services/__tests__/SpielService.test.ts` - Unit Tests
- [x] `src/domains/spiel/services/index.ts` - Exports
- [x] `src/domains/spiel/index.ts` - Domain Index

### 3. BBBSyncService Refactoring
- [x] `src/domains/bbb-api/services/BBBSyncService.ts`
  - Entfernt: `team_id` Logik in `createOrUpdateSpiel()`
  - Vereinfacht: `ist_heimspiel` Berechnung
  - Kommentiert: v6.0 Changes

### 4. Consumer Updates ✅ COMPLETE!
- [x] `src/domains/team/services/TeamService.ts`
  - `getTeamStats()` - Verwendet spielService.getSpiele()
  - `deleteTeam()` - Spiele werden NICHT mehr gelöscht
  - `countGames()` - Verwendet spielService
- [x] `src/domains/spielplan/services/SpielService.ts` (alter Service)
  - `getSpieleByTeam()` - Entfernt team_id, nur noch heim/gast
  - `countSpieleByStatus()` - Verwendet getSpieleByTeam()
  - `validateSpiel()` - Prüft heim_team_id/gast_team_id
- [x] Test-Fixes
  - SpielService.test.ts - Korrigierte Test-Daten
  - Alle 22 SchemaError Tests sollten jetzt grün sein

## 🚧 Remaining Tasks

### 5. Tests Update
- [ ] Integration Tests für BBBSyncService prüfen
- [ ] E2E Tests: Internes Spiel Szenario hinzufügen (falls nötig)
- [ ] PACT Contract Tests prüfen

### 6. Migration Testing
- [ ] Test mit existierenden Daten (v5.0 → v6.0)
- [ ] Verify: team_id wird korrekt entfernt
- [ ] Verify: Spiele werden noch korrekt angezeigt

### 7. UI Components (Optional - nur bei Bedarf)
- [ ] Dashboard prüfen ob korrekt funktioniert
- [ ] Einsatzplanung prüfen

## 🎯 Next Steps

### ✅ Sofort: Tests laufen lassen
```bash
cd basketball-app
npm test
```

**Expected:** Alle 24 vorher fehlgeschlagenen Tests sollten jetzt grün sein!

### Danach (Qualitätssicherung)
1. Integration Tests prüfen
2. E2E Tests lokal testen
3. App im Browser testen:
   ```bash
   npm run dev
   # Test Dashboard mit verschiedenen Teams
   # Test BBB Sync
   # Test internes Spiel Szenario
   ```

## 📋 Checklist für jeden Consumer

Für jedes File das `spiel.team_id` verwendet:

```typescript
// ❌ ENTFERNEN:
const spiele = await db.spiele
  .where('team_id')
  .equals(teamId)
  .toArray();

const meinSpiel = spiele.find(s => s.team_id === myTeam.team_id);

// ✅ ERSETZEN MIT:
import { spielService } from '@/domains/spiel';

const spiele = await spielService.getSpiele(teamId);
const meinSpiel = spiele.find(s => 
  s.heim_team_id === myTeam.team_id || 
  s.gast_team_id === myTeam.team_id
);
```

## 🧪 Test Strategy

### Unit Tests
```bash
npm test -- SpielService
```
**Expected:** Alle Tests GREEN

### Integration Tests
```bash
npm test -- BBBSyncService.integration
```
**Expected:** Sync funktioniert ohne team_id

### E2E Tests
```bash
npm run test:e2e -- sync-internal-game
```
**Expected:** Internes Spiel wird korrekt importiert

## 📊 Migration Impact

### Breaking Changes
- ❌ `Spiel.team_id` entfernt (Property existiert nicht mehr)
- ✅ Neue Indizes: `[heim_team_id+datum]`, `[gast_team_id+datum]`
- ✅ SpielService kapselt Filterlogik

### Benefits
- ✅ Semantisch korrekt: Spiel gehört keinem Team
- ✅ Edge Case gelöst: Internes Spiel funktioniert
- ✅ Bug behoben: Falsche team_id Zuweisung in BBBSyncService
- ✅ Bessere Testbarkeit durch Service Layer

### Risks
- ⚠️ Breaking Change: Alle Consumer müssen angepasst werden
- ⚠️ Performance: Filter jetzt im Service statt DB-Index
  - Mitigation: Compound Indizes für schnelle Lookups

## 🔍 Debug Commands

```bash
# Finde alle team_id Verwendungen:
grep -rn "team_id" src/ | grep -v ".test.ts" | grep -v "spieler.team_id"

# Test einzelnen Service:
npm test -- --reporter=verbose SpielService

# Watch Tests:
npm test -- --watch SpielService
```

## 📚 Technical Decision Record

**TDR-006: Removal of team_id from Spiel Entity**

- **Date:** 2025-10-27
- **Context:** Spiel gehört konzeptionell keinem Team, Edge Case nicht lösbar
- **Decision:** team_id entfernen, SpielService für Filterung
- **Status:** ✅ Implemented
- **Consequences:**
  - ✅ Semantisch korrekte Modellierung
  - ✅ Alle Edge Cases lösbar
  - ❌ Breaking Change - Consumer müssen angepasst werden

---

**Letzte Aktualisierung:** 27.10.2025  
**Nächster Schritt:** Consumer Updates (siehe Section 4)
