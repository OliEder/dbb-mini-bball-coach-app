# DBv7.0 Implementation - Continuation Plan

**Datum:** 30.10.2025
**Status:** 🚀 In Umsetzung
**Letzte Session:** DBv7.0 implementation continuation 1

---

## ✅ Bereits erledigt (Letzter Chat)

1. **database.ts** → v7.0 migriert
   - DB_VERSION = 7
   - team_liga_participations Tabelle erstellt
   - Migration v6→v7 implementiert
   - Indizes angepasst

2. **Types** → v7.0 angepasst
   - Team Interface vereinfacht
   - TeamLigaParticipation Interface hinzugefügt
   - extern_team_id → extern_permanent_id

3. **Tests**
   - 380/381 Tests grün
   - Boolean-Index-Problem gelöst

---

## 🎯 Nächste Schritte

### 1. Consumer-Services anpassen (TDD)

#### TeamService.ts
**Betroffene Methoden:**
- `getTeamStats()` - benötigt Participation für altersklasse/saison
- `getActiveParticipation(teamId)` - NEU: Aktuelle Saison laden
- `getAllParticipations(teamId)` - NEU: Historie laden

**TDD-Workflow:**
```bash
# RED: Test schreiben
tests/unit/team/TeamService.test.ts

# GREEN: Implementation
src/domains/team/services/TeamService.ts

# REFACTOR: Code optimieren
```

#### SpielService.ts
**Betroffene Methoden:**
- Liga-Filter müssen über Participation gehen
- Team-Spiele-Queries anpassen

#### BBBSyncService.ts
**Prüfen:**
- Team-Erstellung korrekt?
- Participation-Erstellung korrekt?
- Migration-Tests schreiben

### 2. Tests aktualisieren
- [ ] TeamService Tests anpassen
- [ ] SpielService Tests anpassen
- [ ] Integration Tests für v7 Migration
- [ ] E2E Tests für Multi-Saison-Tracking

### 3. UI Components
- [ ] Dashboard: Participation-Daten anzeigen
- [ ] Team-Details: Saison-Historie
- [ ] Liga-Tabelle: Aktive Participation laden

### 4. Dokumentation
- [x] Umsetzungsplan erstellen
- [ ] PROJECT-STATUS.md aktualisieren (DB v7.0)
- [ ] Migration Guide erstellen

---

## 📋 Task List

### Phase 1: Core Services (Prio 1)
- [ ] TeamService.getActiveParticipation() implementieren
- [ ] TeamService.getAllParticipations() implementieren
- [ ] TeamService.getTeamStats() anpassen
- [ ] Tests für TeamService schreiben
- [ ] SpielService.getSpieleMitBeteiligung() prüfen
- [ ] Tests für SpielService aktualisieren

### Phase 2: BBBSyncService (Prio 2)
- [ ] createOrUpdateTeam() prüfen
- [ ] createOrUpdateParticipation() prüfen
- [ ] Tests für BBBSyncService erweitern

### Phase 3: UI & Integration (Prio 3)
- [ ] Dashboard anpassen
- [ ] Team-Details anpassen
- [ ] Integration Tests schreiben
- [ ] E2E Tests aktualisieren

### Phase 4: Cleanup & Doku (Prio 4)
- [ ] PROJECT-STATUS.md updaten
- [ ] Migration Guide schreiben
- [ ] Legacy Code entfernen
- [ ] CHANGELOG.md updaten

---

## 🔧 Implementation Details

### TeamService Helper-Methoden

```typescript
/**
 * Lädt die aktive Participation für ein Team
 */
async getActiveParticipation(teamId: UUID): Promise<TeamLigaParticipation | undefined> {
  return await db.team_liga_participations
    .where('[team_id+ist_aktiv]')
    .equals([teamId, true])
    .first();
}

/**
 * Lädt alle Participations (Historie)
 */
async getAllParticipations(teamId: UUID): Promise<TeamLigaParticipation[]> {
  return await db.team_liga_participations
    .where('team_id')
    .equals(teamId)
    .reverse()
    .sortBy('created_at');
}

/**
 * Team-Stats mit Participation-Daten
 */
async getTeamStats(teamId: UUID) {
  const team = await db.teams.get(teamId);
  const participation = await this.getActiveParticipation(teamId);
  
  return {
    team,
    altersklasse: participation?.altersklasse,
    saison: participation?.saison,
    liga_name: participation?.liga_name,
    // ... weitere Stats
  };
}
```

### SpielService Anpassungen

```typescript
// VORHER (v6.0):
const spiele = await db.spiele
  .where('team_id')
  .equals(teamId)
  .toArray();

// NACHHER (v7.0):
const spiele = await db.spiele
  .where('heim_team_id')
  .equals(teamId)
  .or('gast_team_id')
  .equals(teamId)
  .toArray();

// ODER mit Participation:
const participation = await teamService.getActiveParticipation(teamId);
const spiele = await db.spiele
  .where('liga_id')
  .equals(participation!.liga_id)
  .filter(s => 
    s.heim_team_id === teamId || 
    s.gast_team_id === teamId
  )
  .toArray();
```

---

## ⚠️ Breaking Changes

### Code-Änderungen erforderlich in:
- ✅ database.ts (bereits done)
- ✅ types/index.ts (bereits done)
- 🔄 TeamService.ts (in Arbeit)
- 🔄 SpielService.ts (in Arbeit)
- 🔄 Dashboard Components
- 🔄 Team-Detail Views

### Test-Änderungen:
- 🔄 TeamService.test.ts
- 🔄 SpielService.test.ts
- 🔄 Integration Tests
- 🔄 E2E Tests

---

## 🧪 Test-Strategie

### Unit Tests
```typescript
describe('TeamService v7.0', () => {
  describe('getActiveParticipation', () => {
    it('should return active participation', async () => {
      // Test implementation
    });
    
    it('should return undefined if no active', async () => {
      // Test implementation
    });
  });
  
  describe('getAllParticipations', () => {
    it('should return all participations sorted by date', async () => {
      // Test implementation
    });
  });
  
  describe('getTeamStats', () => {
    it('should include participation data', async () => {
      // Test implementation
    });
  });
});
```

### Integration Tests
```typescript
describe('v7.0 Migration Integration', () => {
  it('should migrate v6 team to v7 with participation', async () => {
    // Setup v6 data
    // Run migration
    // Verify v7 structure
  });
  
  it('should handle multi-season tracking', async () => {
    // Create team with multiple seasons
    // Verify correct ist_aktiv flags
  });
});
```

---

## 📊 Success Criteria

### Phase 1 abgeschlossen wenn:
- [ ] Alle TeamService Tests grün
- [ ] Alle SpielService Tests grün
- [ ] Coverage ≥ 85%
- [ ] Keine TypeScript Errors

### Phase 2 abgeschlossen wenn:
- [ ] BBBSyncService Tests erweitert & grün
- [ ] Integration Tests grün
- [ ] Migration korrekt dokumentiert

### Phase 3 abgeschlossen wenn:
- [ ] UI zeigt Participation-Daten korrekt
- [ ] E2E Tests grün
- [ ] User kann Multi-Saison-Historie sehen

### Phase 4 abgeschlossen wenn:
- [ ] Dokumentation vollständig
- [ ] Keine Legacy Code-Reste
- [ ] CHANGELOG aktualisiert
- [ ] Ready für Merge

---

## 🚀 Start Implementation

**Los geht's mit:**
1. TeamService Tests schreiben (RED)
2. TeamService Methoden implementieren (GREEN)
3. Code refactoren (REFACTOR)

---

**Status:** 📝 Plan erstellt, ready für Implementation
