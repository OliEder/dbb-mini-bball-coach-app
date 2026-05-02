# DBv7.0 TDD Progress - Phase 1 Complete

**Datum:** 30.10.2025 14:00 UTC  
**Status:** ✅ Phase 1 COMPLETE - Phase 2 START

---

## ✅ Phase 1: Test Infrastructure (DONE - 15min)

### Erstellt:
- [x] `/tests/helpers/v7-test-helpers.ts`
  - MockBBBTeam mit **korrekter API-Struktur** (teamPermanentId, seasonTeamId)
  - MockBBBMatch mit deutscher Feldnamen (teamname, heimteamId)
  - createTestTeam() - v7.0 Format
  - createTestParticipation() - v7.0 Format
  - setupV7Database() - Komplettes Test-Setup
  - setupMultiSeasonData() - Multi-Season Test Data
  - cleanupDatabase() - Test Cleanup
  - isV7Team() - Type Guard
  - isValidParticipation() - Type Guard

**Wichtig:** Alle Mocks basieren auf DBB-API-COMPLETE-DOCUMENTATION.md
- teamPermanentId ✅ (permanent)
- seasonTeamId (ändert sich pro Saison)
- Deutsche Feldnamen: `teamname` (nicht `name`)

---

## 🔄 Phase 2: Service Layer Tests (IN PROGRESS)

### 2.1 TeamService Tests ✅ DONE
- [x] TeamService.v7.test.ts (19 Tests)

### 2.2 BBBSyncService Tests (NEXT - 15 Tests)

**Test-Datei:** `/tests/unit/domains/bbb-api/services/BBBSyncService.v7.test.ts`

**Tests zu schreiben:**

1. **Team-Deduplizierung (3 Tests)**
   - [ ] Findet Team über teamPermanentId
   - [ ] Erstellt neues Team wenn nicht vorhanden
   - [ ] Updated existierendes Team bei Name-Änderung

2. **Participation-Erstellung (4 Tests)**
   - [ ] Erstellt Participation bei neuem Team
   - [ ] Updated Participation bei Re-Sync
   - [ ] Setzt ist_aktiv korrekt
   - [ ] Handhabt seasonTeamId-Änderung

3. **Multi-Saison (3 Tests)**
   - [ ] Team bleibt über Saisons gleich
   - [ ] Neue Participation pro Saison
   - [ ] Alte Participations bleiben inaktiv

4. **Liga-Sync Integration (3 Tests)**
   - [ ] Sync Tabelle → Teams + Participations
   - [ ] Sync Spielplan → Verwendet Participations
   - [ ] Deduplizierung über teamPermanentId

5. **Edge Cases (2 Tests)**
   - [ ] Team ohne permanentId (Fehler)
   - [ ] Participation mit fehlender Liga (Fehler)

---

## 📋 Nächste Phasen

### Phase 3: Store Tests (1-2h)
- [ ] onboarding-simple.store Tests

### Phase 4: UI Component Tests (3-4h)
- [ ] Dashboard Tests
- [ ] TeamOverview Tests
- [ ] TeamSwitcher Tests

### Phase 5: Utility Tests (30min)
- [ ] debugTeamData Tests

### Phase 6: GREEN Phase (2-3h)
- [ ] BBBSyncService anpassen
- [ ] Components anpassen
- [ ] Refactoring

---

## 🎯 Aktueller Fokus

**JETZT:** BBBSyncService.v7.test.ts schreiben (RED Phase)
**Zeit:** ~1h
**Ziel:** 15 Tests für BBBSyncService mit korrekten Mocks

---

**Status:** Phase 1 ✅ | Phase 2.1 ✅ | Phase 2.2 🔄 IN PROGRESS
