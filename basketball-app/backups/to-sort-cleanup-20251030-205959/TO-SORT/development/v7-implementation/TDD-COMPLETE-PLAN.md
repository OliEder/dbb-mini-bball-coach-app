# DBv7.0 TDD - Complete Test Plan

**Status:** 🔴 RED Phase - Tests schreiben
**Datum:** 30.10.2025

---

## ✅ Bereits vorhanden

### TeamService Tests
- [x] TeamService.v7.test.ts (19 Tests) - ERSTELLT, noch nicht ausgeführt

### Database & Types
- [x] database.ts v7.0
- [x] Types v7.0

---

## 📋 Fehlende Tests (RED Phase)

### Phase 1: Test Infrastructure (15min)
- [ ] Test Helper Functions für v7.0
  - createTestTeam()
  - createTestParticipation()
  - setupV7Database()
- [ ] Type-Safe Test Utils

### Phase 2: Service Layer Tests

#### BBBSyncService Tests (15 Tests)
- [ ] Team-Deduplizierung über teamPermanentId
- [ ] Participation-Erstellung bei Sync
- [ ] Multi-Saison-Handling
- [ ] Migration existierender Teams
- [ ] **WICHTIG:** Mocks gemäß BBB-API Spec!

### Phase 3: Store Tests (1-2h)

#### onboarding-simple.store Tests
- [ ] Team-Auswahl mit Participations
- [ ] Active Participation setzen
- [ ] Multi-Saison Support

### Phase 4: UI Component Tests (3-4h)

#### Dashboard Tests
- [ ] Participation-Daten anzeigen
- [ ] Saison-Wechsel
- [ ] Altersklassen-Anzeige

#### TeamOverview Tests (NEU)
- [ ] Team-Liste mit Participations
- [ ] Saison-Historie
- [ ] Active Participation highlighting

#### TeamSwitcher Tests (NEU)
- [ ] Team-Dropdown
- [ ] Active Team wechseln
- [ ] Participation-Info anzeigen

### Phase 5: Utility Tests (30min)

#### debugTeamData Tests
- [ ] Team + Participations debuggen
- [ ] Saison-Historie ausgeben
- [ ] Active Participation kennzeichnen

---

## 🚨 Kritische Punkte

### BBB-API Spec Compliance
**Problem:** Mocks passen nicht zur API-Doku

**Lösung:** 
1. BBB-API-COMPLETE-DOCUMENTATION.md lesen
2. Mocks gemäß tatsächlicher API-Struktur schreiben
3. PACT Contract Tests aktualisieren

**Relevante Endpunkte:**
- `/rest/competition/table/id/{ligaId}` - Tabelle
- `/rest/competition/spielplan/id/{ligaId}` - Spielplan
- Team-Response Struktur:
  - `teamPermanentId` (permanent)
  - `seasonTeamId` (pro Saison)

---

## 🎯 Nächste Schritte

1. **JETZT:** Phase 1 - Test Infrastructure
2. **Dann:** Phase 2 - BBBSyncService Tests (mit korrekten Mocks!)
3. **Dann:** Phases 3-5
4. **Erst dann:** GREEN Phase (Implementation fixes)

---

## 📚 Referenzen

- `/mnt/project/DBB-API-COMPLETE-DOCUMENTATION.md`
- `/mnt/project/basketball-bund-net-api-V1.yaml`
- `docs/development/v7-implementation/V7-CONTINUATION-PLAN.md`

---

**Status:** Bereit für Phase 1 - Test Infrastructure
