# DB v7.0 Implementation - Quick Start

**Datum:** 29. Oktober 2025  
**Status:** ✅ Ready for Implementation

---

## 🎯 Was wurde gemacht?

### Problem gelöst:
- ❌ Team-Deduplizierung über `name + liga_id` → fehleranfällig
- ❌ `extern_team_id` speicherte `seasonTeamId` (temporär) statt `teamPermanentId` (permanent)
- ❌ Team-Entity hatte `altersklasse`, `saison`, `liga_id` → falsch modelliert

### Lösung implementiert:
- ✅ **Team** = Permanente Entität (ohne Liga/Saison-Bezug)
- ✅ **TeamLigaParticipation** = Team spielt in Liga (neue Tabelle)
- ✅ Deduplizierung über `teamPermanentId` (BBB-API)
- ✅ Multi-Saison-Tracking möglich

---

## 📦 Erstelle Files

4 neue Files für dein Projekt:

### 1. `src/shared/types/index.ts` - Ergänzungen

```typescript
// Füge hinzu zu existierenden Types:

export interface Team {
  team_id: UUID;
  extern_permanent_id: string;      // ✅ NEU: teamPermanentId
  verein_id: UUID;
  name: string;
  trainer: string;
  team_typ: 'eigen' | 'gegner';
  user_id?: UUID;
  created_at: Date;
  updated_at?: Date;
  // REMOVED: altersklasse, saison, liga_id
}

export interface TeamLigaParticipation {
  participation_id: UUID;
  team_id: UUID;
  liga_id: string;
  extern_season_team_id: string;
  altersklasse: Altersklasse;
  saison: string;
  ist_aktiv: boolean;
  created_at: Date;
}
```

### 2. `src/shared/db/database.ts` - Schema v7.0

Siehe: `/home/claude/database-v7.ts`

**Key Changes:**
- `DB_VERSION = 7`
- Neue Tabelle: `team_liga_participations`
- Team-Indices angepasst
- Helper Functions hinzugefügt

### 3. `src/domains/bbb-api/services/BBBSyncService.ts` - Refactored

Siehe: `/home/claude/BBBSyncService-v7.ts`

**Key Changes:**
- `createOrFindTeam()` - Nutzt `teamPermanentId`
- `createOrUpdateParticipation()` - NEU
- `findTeamByPermanentId()` - NEU (statt `findTeamByExternId`)
- `syncTabelleAndTeams()` - Erstellt Participations
- Alle Team-Queries angepasst

### 4. Dokumentation

- `/home/claude/DB-V7-MIGRATION.md` - Vollständige Dokumentation
- `/home/claude/TEST-PLAN-V7.md` - Test-Strategie

---

## 🚀 Implementation Steps

### Step 1: Types aktualisieren ✅

```bash
# Öffne: src/shared/types/index.ts
# Ersetze Team Interface wie oben
# Füge TeamLigaParticipation Interface hinzu
```

**Wichtig:** 
- ✅ `extern_team_id` → `extern_permanent_id`
- ✅ ENTFERNE: `altersklasse`, `saison`, `liga_id` aus Team

### Step 2: Database Schema v7.0 ✅

```bash
# Öffne: src/shared/db/database.ts
# Kopiere Content aus: /home/claude/database-v7.ts
```

**Wichtig:**
- ✅ `DB_VERSION = 7`
- ✅ Neue Tabelle `team_liga_participations`
- ✅ Helper Functions am Ende hinzufügen

### Step 3: BBBSyncService refactoren ✅

```bash
# Öffne: src/domains/bbb-api/services/BBBSyncService.ts
# Ersetze KOMPLETT mit: /home/claude/BBBSyncService-v7.ts
```

**Wichtig:**
- ✅ Komplettes Refactoring
- ✅ Nutzt `teamPermanentId`
- ✅ Erstellt Participations

### Step 4: Tests anpassen (TODO)

```bash
# Siehe: /home/claude/TEST-PLAN-V7.md
```

Tests müssen angepasst werden:
- [ ] BBBSyncService Tests
- [ ] Integration Tests
- [ ] E2E Onboarding Tests

### Step 5: Consumer anpassen (TODO)

Services die `Team` nutzen müssen angepasst werden:
- [ ] `TeamService.ts` - Team-Queries
- [ ] `SpielService.ts` - Team-Filter
- [ ] Dashboard Components - Team-Daten-Zugriff

**Pattern für Queries:**
```typescript
// ❌ VORHER:
const team = await db.teams.get(teamId);
console.log(team.altersklasse); // ❌ Existiert nicht mehr!

// ✅ NACHHER:
const team = await db.teams.get(teamId);
const participation = await db.team_liga_participations
  .where('[team_id+ist_aktiv]')
  .equals([teamId, true])
  .first();

console.log(participation?.altersklasse); // ✅ Von Participation
```

---

## 🧪 Testing

### Minimal-Test vor Commit:

```bash
# 1. App starten
npm run dev

# 2. In DevTools → Application → IndexedDB
# Prüfe Struktur:
# - teams table: extern_permanent_id exists, kein altersklasse/saison/liga_id
# - team_liga_participations table: exists

# 3. Onboarding durchlaufen
# - BBB URL eingeben
# - Team auswählen
# - Prüfe in IndexedDB:
#   → Team in `teams` table
#   → Participation in `team_liga_participations` table

# 4. Sync durchführen
# - Tabelle laden
# - Spielplan laden
# - Prüfe: Teams korrekt dedupliziert (über teamPermanentId)
```

### Full Testing:

```bash
# Unit Tests
npm test -- BBBSyncService

# Integration Tests
npm test -- integration/

# E2E Tests
npm run test:e2e
```

---

## 📊 Verification Checklist

Nach Implementation prüfen:

### Database
- [ ] `teams` table hat `extern_permanent_id` (nicht `extern_team_id`)
- [ ] `teams` table hat KEINE `altersklasse`, `saison`, `liga_id`
- [ ] `team_liga_participations` table existiert
- [ ] Indices funktionieren: `[team_id+liga_id]`, `[team_id+ist_aktiv]`

### BBB Sync
- [ ] Team wird über `teamPermanentId` dedupliziert
- [ ] Participation wird pro Liga erstellt
- [ ] Spiele referenzieren Teams korrekt

### Multi-Season
- [ ] Team kann in mehreren Ligen/Saisons spielen
- [ ] Alte Participations bleiben erhalten

### UI
- [ ] Dashboard zeigt Team-Daten (mit Altersklasse aus Participation)
- [ ] Onboarding funktioniert
- [ ] Keine Fehlermeldungen in Console

---

## 🔥 Häufige Fehler vermeiden

### 1. Team Properties zugreifen

```typescript
// ❌ FALSCH:
const team = await db.teams.get(teamId);
const altersklasse = team.altersklasse; // ❌ UNDEFINED!

// ✅ RICHTIG:
const team = await db.teams.get(teamId);
const participation = await db.team_liga_participations
  .where('[team_id+ist_aktiv]')
  .equals([teamId, true])
  .first();
const altersklasse = participation?.altersklasse;
```

### 2. Team-Queries

```typescript
// ❌ FALSCH:
const teams = await db.teams
  .where('altersklasse')
  .equals('U12')
  .toArray(); // ❌ Property existiert nicht!

// ✅ RICHTIG:
const participations = await db.team_liga_participations
  .where('altersklasse')
  .equals('U12')
  .toArray();

const teamIds = participations.map(p => p.team_id);
const teams = await db.teams
  .where('team_id')
  .anyOf(teamIds)
  .toArray();
```

### 3. Spiel-Queries

```typescript
// ❌ FALSCH:
const spiele = await db.spiele
  .where('altersklasse')
  .equals('U12')
  .toArray(); // Funktioniert, ABER: Altersklasse stammt von Participation!

// ✅ RICHTIG (wenn Team-basiert):
const participation = await db.team_liga_participations
  .where('[team_id+ist_aktiv]')
  .equals([teamId, true])
  .first();

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

## 🎯 Next Steps

1. **Jetzt:** Types & Database Schema implementieren
2. **Dann:** BBBSyncService ersetzen
3. **Dann:** Tests anpassen
4. **Dann:** Consumer anpassen (TeamService, etc.)
5. **Dann:** Full Testing
6. **Dann:** Deploy

---

## 📚 Weitere Dokumentation

- **Vollständige Doku:** `/home/claude/DB-V7-MIGRATION.md`
- **Test-Plan:** `/home/claude/TEST-PLAN-V7.md`
- **BBB-API Referenz:** `/mnt/project/DBB-API-COMPLETE-DOCUMENTATION.md`

---

**Status:** ✅ Ready to implement  
**Breaking Change:** Ja - Team-Schema geändert  
**Migration nötig:** Nein (noch nicht live)

---

**Good luck! 🚀**
