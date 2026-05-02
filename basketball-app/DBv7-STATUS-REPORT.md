# DBv7 Migration - Status Report
**Datum:** 03. November 2025, 13:00 Uhr
**Erstellt von:** Claude (AI Assistant)

---

## 🎯 Executive Summary

**Status:** 🔴 **BLOCKIERT - Migration unvollständig**

Die DBv7 Migration ist **partiell implementiert** aber **NICHT abgeschlossen**:
- ✅ Database Schema v7.0 existiert
- ✅ Types (Team, TeamLigaParticipation) definiert  
- ❌ Services sind NICHT kompatibel
- ❌ 92 TypeScript-Errors in 20 Dateien
- ❌ Runtime-Errors beim Start

---

## 📊 Was ist DBv7?

### Hauptänderung: Team-Liga-Relationship Refactoring

**Problem (v6.0):**
```typescript
interface Team {
  extern_team_id?: string;  // ❌ seasonTeamId (ändert sich jede Saison!)
  altersklasse: Altersklasse;  // ❌ Änderungen jedes Jahr
  saison: string;  // ❌ Änderungen jedes Jahr
  liga_id?: string;  // ❌ Änderungen bei Auf-/Abstieg
}
```

**Lösung (v7.0):**
```typescript
// Team = Permanente Entität
interface Team {
  extern_permanent_id?: string;  // ✅ teamPermanentId (bleibt konstant!)
  // KEIN altersklasse, saison, liga_id mehr!
}

// NEU: Historisierung der Liga-Teilnahme
interface TeamLigaParticipation {
  team_id: UUID;
  saison: string;
  altersklasse: Altersklasse;
  liga_id: string;
  ist_aktiv: boolean;  // Nur 1 aktive Teilnahme pro Team
}
```

---

## ✅ Was ist implementiert?

### 1. Database Schema (database.ts)
```typescript
// v7.0 vollständig implementiert
this.version(7).stores({
  teams: 'team_id, extern_permanent_id, verein_id, ...',
  team_liga_participations: '++id, team_id, liga_id, saison, ...',
});

// Migration v6→v7 implementiert (aber nicht getestet!)
.upgrade(async tx => {
  // Erstellt TeamLigaParticipation aus alten Team-Daten
  // Entfernt alte Properties aus Team
});
```

### 2. Types (types/index.ts)
```typescript
// ✅ Team Interface (v7.0)
export interface Team {
  team_id: UUID;
  extern_permanent_id?: string;  // NEU
  verein_id: UUID;
  name: string;
  trainer: string;
  team_typ: TeamTyp;
  // ENTFERNT: altersklasse, saison, liga_id
}

// ✅ TeamLigaParticipation Interface (NEU)
export interface TeamLigaParticipation {
  id: number;
  team_id: UUID;
  extern_team_id?: string;
  saison: string;
  altersklasse: Altersklasse;
  liga_id?: string;
  ist_aktiv: boolean;
}
```

---

## ❌ Was fehlt noch?

### KRITISCHE Lücken:

#### 1. SpielService (FEHLT komplett!)
```typescript
// ❌ spielService.getSpiele is not a function
```
**Grund:** Service existiert oder ist nicht korrekt exportiert.

#### 2. TeamService (veraltet)
```typescript
// ❌ Nutzt noch alte Team-Properties
const team = await db.teams
  .where('[name+liga_id]')  // ❌ liga_id existiert nicht mehr!
  .first();
```
**Nötig:**
- Queries auf `extern_permanent_id` umstellen
- Helper-Methoden für Participations
- `createTeamWithParticipation()` verwenden

#### 3. BBBSyncService (teilweise veraltet)
```typescript
// ❌ Sync erstellt Teams ohne Participations
// ❌ Nutzt alte Team-Property-Struktur
```

#### 4. Dashboard & UI Components
```typescript
// Dashboard.tsx:94
spielService.getSpiele(currentTeamId)  // ❌ FEHLT

// TeamOverview.tsx
// ❌ Greift auf team.altersklasse zu (existiert nicht mehr!)
```

#### 5. Onboarding Flow
```typescript
// onboarding-simple.store.ts
// ❌ Erstellt Teams mit alten Properties
```

---

## 🔥 Runtime-Errors (Console-Log)

```
❌ Liga-Sync fehlgeschlagen: DexieError2
   → BBBSyncService.ts:129

❌ spielService.getSpiele is not a function
   → Dashboard.tsx:94
   → TeamOverview.tsx:31

❌ Auto-Sync fehlgeschlagen
   → Dashboard.tsx:71
```

### Analyse:

1. **DexieError2** = Schema-Mismatch
   - Services greifen auf Properties zu, die nicht mehr existieren
   - Validation schlägt fehl

2. **spielService.getSpiele fehlt**
   - Service existiert nicht / ist nicht exportiert
   - Oder Methode wurde umbenannt/gelöscht

---

## 📋 TypeScript-Errors (92 Errors in 20 Files)

### Top-Fehlerquellen:

| Datei | Errors | Ursache |
|-------|--------|---------|
| onboarding-simple.store.ts | 18 | Erstellt Teams mit alten Properties |
| Dashboard.tsx | 14 | Nutzt spielService.getSpiele() |
| TeamService.ts | 14 | Queries auf alte Properties |
| TabellenService.ts | 6 | Liga-Zugriffe veraltet |
| BBBSyncService.ts | 5 | Teilweise alte Struktur |
| team.service.ts | 3 | Alte Property-Zugriffe |

---

## 🚀 Migrations-Strategie

### Phase 1: Core Services (PRIO 1)
1. **SpielService vollständig implementieren**
   - `getSpiele(teamId)` - mit Participation-Filter
   - `getSpielByLiga(ligaId)` 
   - Tests schreiben (TDD!)

2. **TeamService refactoren**
   - Helper: `getActiveParticipation(teamId)`
   - Helper: `createTeamWithParticipation()`
   - Queries auf `extern_permanent_id` umstellen
   - Tests anpassen

### Phase 2: BBB Integration (PRIO 2)
3. **BBBSyncService refactoren**
   - Team-Deduplizierung über `teamPermanentId`
   - Participation erstellen nach Team-Sync
   - Tests komplett neu

### Phase 3: UI & Stores (PRIO 3)
4. **Onboarding-Flow anpassen**
   - `createTeamWithParticipation()` verwenden
   - Validation anpassen

5. **Dashboard & Components**
   - `team.altersklasse` → `participation.altersklasse`
   - Daten über Participations laden

### Phase 4: Testing (PRIO 4)
6. **Test-Suite aufräumen**
   - Integration Tests: Team + Participation
   - E2E Tests: Vollständiger Onboarding-Flow
   - Contract Tests: BBB-API

---

## ⚠️ Breaking Changes (für Reversal)

Falls Migration scheitert - Zurück zu v6.0:

```bash
# 1. Database rollback
git checkout HEAD~1 src/shared/db/database.ts
git checkout HEAD~1 src/shared/types/index.ts

# 2. Services wiederherstellen
git checkout HEAD~1 src/domains/team/services/TeamService.ts
git checkout HEAD~1 src/domains/bbb-api/services/BBBSyncService.ts

# 3. Database in Browser löschen
# Application → IndexedDB → BasketballPWA → DELETE
```

---

## 📝 Empfohlenes Vorgehen

### Option A: Migration abschließen (EMPFOHLEN)
**Dauer:** 4-6 Stunden
**Vorteil:** Saubere Architektur, zukunftssicher

1. ✅ Status-Doku erstellen (DONE)
2. 🔴 SpielService komplett implementieren (TDD!)
3. 🔴 TeamService refactoren
4. 🔴 BBBSyncService refactoren
5. 🔴 Onboarding-Store anpassen
6. 🔴 UI-Components fixen
7. 🔴 Tests grün machen
8. ✅ Integration testen

### Option B: Rollback zu v6.0 (NOTFALL)
**Dauer:** 30 Minuten
**Nachteil:** Problem bleibt bestehen

1. Database reset
2. Git revert zu letztem stabilen Commit
3. Tests laufen lassen
4. Migration später neu planen

---

## 🎯 Nächste Schritte

**Empfehlung:** Migration abschließen (Option A)

**Grund:**
- Schema ist bereits deployed (v7.0)
- Rollback = Datenverlust für Testdaten
- Problem wird nur verschoben, nicht gelöst
- Services müssen sowieso refactored werden

**Start:** SpielService komplett neu implementieren (TDD)

---

## 📚 Referenzen

- `/docs/operations/migrations/DBv7/DB-V7-MIGRATION.md` - Vollständige Spec
- `/docs/operations/migrations/DBv7/TEST-PLAN-V7.md` - Test-Strategie
- `/docs/operations/migrations/DBv7/QUICK-START-V7.md` - Implementation Guide

---

**Erstellt:** 2025-11-03 13:00 Uhr  
**Status:** 🔴 BLOCKIERT  
**Nächster Review:** Nach SpielService-Implementation
