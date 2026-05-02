# DB v7.0 - Installation Guide

**Erstellt:** 29. Oktober 2025  
**Status:** ✅ Ready to Install

---

## 📦 Files in diesem Verzeichnis

### Implementation Files:
1. **`types-v7.ts`** → MANUELL mergen in `src/shared/types/index.ts`
2. **`database-v7.ts`** → Ersetze `src/shared/db/database.ts`
3. **`BBBSyncService-v7.ts`** → Ersetze `src/domains/bbb-api/services/BBBSyncService.ts`

### Dokumentation:
4. **`DB-V7-MIGRATION.md`** → Vollständige Doku
5. **`TEST-PLAN-V7.md`** → Test-Strategie
6. **`QUICK-START-V7.md`** → Quick Start Guide

### Installation:
7. **`install-v7.sh`** → Auto-Install Script (siehe unten)

---

## 🚀 Installation

### Option 1: Automatische Installation (empfohlen)

```bash
cd /path/to/this/directory
chmod +x install-v7.sh
./install-v7.sh
```

**Was das Script macht:**
- ✅ Backup von v6.0 Files erstellen
- ✅ database.ts ersetzen
- ✅ BBBSyncService.ts ersetzen
- ✅ Dokumentation kopieren
- ⚠️ Types MUSS manuell gemerged werden!

### Option 2: Manuelle Installation

```bash
# 1. Backup erstellen
cp src/shared/types/index.ts backups/types-v6.ts
cp src/shared/db/database.ts backups/database-v6.ts
cp src/domains/bbb-api/services/BBBSyncService.ts backups/BBBSyncService-v6.ts

# 2. Types mergen (WICHTIG: Nicht einfach ersetzen!)
# Öffne: src/shared/types/index.ts
# Ersetze: Team Interface
# Füge hinzu: TeamLigaParticipation Interface
# Siehe: types-v7.ts für Details

# 3. Database ersetzen
cp database-v7.ts src/shared/db/database.ts

# 4. BBBSyncService ersetzen
cp BBBSyncService-v7.ts src/domains/bbb-api/services/BBBSyncService.ts

# 5. Dokumentation kopieren
mkdir -p docs/migrations
cp *.md docs/migrations/
```

---

## ⚠️ WICHTIG: Manual Steps nach Installation

### 1. Types mergen

**NICHT einfach ersetzen!** Es gibt andere Types in `index.ts`.

**Änderungen:**
```typescript
// Team Interface - ERSETZEN:
export interface Team {
  team_id: UUID;
  extern_permanent_id: string;  // ✅ NEU (war: extern_team_id)
  verein_id: UUID;
  name: string;
  trainer: string;
  team_typ: 'eigen' | 'gegner';
  user_id?: UUID;
  created_at: Date;
  updated_at?: Date;
  // REMOVED: altersklasse, saison, liga_id
}

// TeamLigaParticipation - HINZUFÜGEN:
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

### 2. Tests ausführen

```bash
npm test
```

**Erwarte Fehler in:**
- TeamService Tests (nutzen alte Team-Properties)
- BBBSyncService Tests (müssen angepasst werden)

### 3. Consumer anpassen

Services die `Team` nutzen müssen geändert werden:

**Beispiel TeamService:**
```typescript
// ❌ ALT:
const team = await db.teams.get(teamId);
const altersklasse = team.altersklasse; // ❌ UNDEFINED!

// ✅ NEU:
const team = await db.teams.get(teamId);
const participation = await db.team_liga_participations
  .where('[team_id+ist_aktiv]')
  .equals([teamId, true])
  .first();
const altersklasse = participation?.altersklasse; // ✅
```

**Files zu prüfen:**
- `src/domains/team/services/TeamService.ts`
- `src/domains/spiel/services/SpielService.ts`
- `src/domains/dashboard/` Components
- Alle UI Components die Team-Daten anzeigen

### 4. Tests anpassen

Siehe: `TEST-PLAN-V7.md` für Details

---

## 🧪 Verification

Nach Installation prüfen:

```bash
# 1. App starten
npm run dev

# 2. DevTools → Application → IndexedDB
# Prüfe:
# - teams table: extern_permanent_id exists
# - teams table: KEINE altersklasse/saison/liga_id
# - team_liga_participations table: exists

# 3. Onboarding durchlaufen
# - BBB URL eingeben
# - Team auswählen
# - Prüfe: Team + Participation werden erstellt

# 4. Sync testen
# - Tabelle laden
# - Spielplan laden
# - Prüfe: Teams korrekt dedupliziert
```

---

## 📊 File Mapping

| Source File              | Target Location                                    |
|--------------------------|---------------------------------------------------|
| types-v7.ts              | src/shared/types/index.ts (MERGE!)               |
| database-v7.ts           | src/shared/db/database.ts                        |
| BBBSyncService-v7.ts     | src/domains/bbb-api/services/BBBSyncService.ts   |
| DB-V7-MIGRATION.md       | docs/migrations/DB-V7-MIGRATION.md               |
| TEST-PLAN-V7.md          | docs/migrations/TEST-PLAN-V7.md                  |
| QUICK-START-V7.md        | docs/migrations/QUICK-START-V7.md                |

---

## 🔥 Breaking Changes

### Schema Changes:
- ✅ Team: `extern_team_id` → `extern_permanent_id`
- ✅ Team: REMOVED `altersklasse`, `saison`, `liga_id`
- ✅ NEW Table: `team_liga_participations`

### Code Changes nötig in:
- [ ] TeamService
- [ ] SpielService
- [ ] Dashboard Components
- [ ] Alle Team-Queries
- [ ] Alle Tests

---

## 📚 Documentation

### Start hier:
1. **QUICK-START-V7.md** - Schnelleinstieg
2. **DB-V7-MIGRATION.md** - Vollständige Doku
3. **TEST-PLAN-V7.md** - Testing-Strategie

---

## 🆘 Hilfe

Bei Problemen:
1. Siehe `QUICK-START-V7.md` → "Häufige Fehler vermeiden"
2. Prüfe `TEST-PLAN-V7.md` für Testing
3. Schau in `DB-V7-MIGRATION.md` für Details

---

**Good luck! 🚀**
