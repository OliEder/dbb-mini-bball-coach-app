# Basketball Team Manager PWA - Project Status

**Letztes Update:** 2025-11-03 15:30 Uhr  
**Phase:** DBv7 Migration - PRIO 1 BBBSyncService  
**Status:** 🟡 In Bearbeitung

---

## 🎯 Aktueller Sprint: DBv7 Migration

### ✅ Abgeschlossen (Phase 1)
- [x] SpielService auf DBv7 migriert
- [x] `getSpiele(teamId)` mit Participation-Filter
- [x] `getSpielByLiga(ligaId)` implementiert
- [x] 8 Unit Tests geschrieben (SpielService.test.ts)
- [x] Dashboard nutzt korrekte Methoden

### 🔴 In Arbeit (PRIO 1 - BBBSyncService)
- [ ] `createOrFindTeam()` auf `extern_permanent_id` umstellen
- [ ] NEU: `createOrUpdateParticipation()` implementieren
- [ ] `findTeamByExternId()` → `findTeamByPermanentId()` umbenennen
- [ ] `syncTabelleAndTeams()` API-Response-Struktur anpassen
- [ ] `syncSpielplan()` Team-Suche über permanentId
- [ ] Unit Tests für BBBSyncService schreiben/anpassen

**Erwarteter Effekt:** 
- Console-Error "KeyPath extern_team_id on object store teams is not indexed" behoben
- Onboarding-Flow läuft wieder
- 90% der TypeScript-Errors verschwinden

---

## 📊 Migration-Fortschritt

| Phase | Status | Dauer | Completion |
|-------|--------|-------|------------|
| Phase 1: SpielService | ✅ | 45min | 100% |
| Phase 2: BBBSyncService | 🔴 | 1-2h | 0% |
| Phase 3: TeamService | ⏳ | 30min | 0% |
| Phase 4: Onboarding + UI | ⏳ | 1-2h | 0% |

**Gesamt:** ~25% abgeschlossen, ~4-5h verbleibend

---

## 🔧 Technische Schulden

### Kritisch (PRIO 1)
1. **BBBSyncService nutzt v6.0 Schema** ← AKTIV
   - Teams ohne Participations
   - `extern_team_id` statt `extern_permanent_id`
   - Blockiert Onboarding

### Hoch (PRIO 2)
2. **TeamService fehlen Helper-Methoden**
   - `getActiveParticipation(teamId)`
   - `createTeamWithParticipation()`
   - Direkte DB-Queries ohne Service-Layer

3. **Onboarding-Store nutzt alte Team-Struktur**
   - Erstellt Teams mit `altersklasse`, `saison`, `liga_id`
   - Keine Participations

### Mittel (PRIO 3)
4. **UI-Components greifen auf alte Properties zu**
   - `team.altersklasse` → via Participation laden
   - 92 TypeScript-Errors in 20 Dateien

---

## 📝 Nächste Schritte

1. **BBBSyncService Tests schreiben** (TDD RED)
   - Test: Team-Creation mit Participation
   - Test: Team-Deduplizierung über permanentId
   - Test: API-Response-Parsing

2. **BBBSyncService implementieren** (TDD GREEN)
   - Referenz: `/docs/operations/migrations/DBv7/BBBSyncService-v7.ts`
   - Methode für Methode migrieren
   - Tests grün machen

3. **Refactoring** (TDD REFACTOR)
   - Code-Qualität verbessern
   - Dokumentation aktualisieren

4. **Integration Testing**
   - Onboarding-Flow durchspielen
   - BBB-Liga-Sync testen
   - Console-Errors prüfen

---

## 🐛 Bekannte Bugs

1. **Console-Error: KeyPath extern_team_id on object store teams is not indexed**
   - Ursache: BBBSyncService nutzt v6.0-Property
   - Status: AKTIV - wird in PRIO 1 behoben

2. **TypeScript-Errors: 92 in 20 Dateien**
   - Hauptursache: BBBSyncService, TeamService, Onboarding
   - Status: Wird durch PRIO 1-3 Migration behoben

---

## 📚 Dokumentation

- `/HANDOVER-DBv7-MIGRATION.md` - Vollständiger Handover
- `/DBv7-STATUS-REPORT.md` - Technische Analyse
- `/FIX-SESSION-LOG.md` - Session-Fortschritt
- `/docs/operations/migrations/DBv7/` - Migration-Specs

---

**Erstellt:** 2025-11-03  
**Autor:** Oliver Marcuseder + Claude AI  
**Nächster Review:** Nach BBBSyncService-Implementation
