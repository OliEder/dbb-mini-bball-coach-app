# TypeScript Guide - Basketball Team Manager

**Letzte Aktualisierung:** 26.10.2025  
**Status:** ✅ Aktiv

## ⚠️ WICHTIG: Die häufigsten TypeScript-Fehler vermeiden

### 🔴 Property-Namen: Alle IDs folgen dem Pattern `{entity}_id`

```typescript
// ❌ FALSCH - Diese Properties existieren NICHT!
team.id
spieler.id  
spiel.id
verein.id

// ✅ RICHTIG - So heißen die Properties wirklich!
team.team_id
spieler.spieler_id
spiel.spiel_id
verein.verein_id
liga.liga_id
halle.halle_id
user.user_id
```

### 📋 Quick Reference - Korrekte Entity Properties

| Entity | Primary Key | Wichtige Properties |
|--------|------------|-------------------|
| **Team** | `team_id` | `name`, `verein_id`, `altersklasse`, `trainer` |
| **Spieler** | `spieler_id` | `vorname`, `nachname`, `team_id`, `trikotnummer` |
| **Spiel** | `spiel_id` | `datum`, `heim`, `gast`, `team_id`, `status` |
| **Verein** | `verein_id` | `name`, `ort`, `ist_eigener_verein` |
| **Liga** | `liga_id` | `name`, `saison`, `altersklasse` |
| **Halle** | `halle_id` | `name`, `strasse`, `plz`, `ort` |

### 🛡️ TypeScript Best Practices

#### 1. Arrays immer typisieren
```typescript
// ❌ FALSCH
const duplicates = [];  // Error: implicitly has type 'any[]'

// ✅ RICHTIG  
const duplicates: Spiel[] = [];
const teams: Team[] = [];
```

#### 2. Types importieren
```typescript
// ✅ Am Anfang jeder Datei
import type { Team, Spiel, Spieler, Verein } from '@/shared/types';
import { db } from '@/shared/db/database';
```

#### 3. Null-Checks nicht vergessen
```typescript
// ❌ FALSCH - kann undefined sein!
const team = await db.teams.get(id);
console.log(team.team_id);  // Error wenn team undefined

// ✅ RICHTIG - mit Null-Check
const team = await db.teams.get(id);
if (team) {
  console.log(team.team_id);
}
```

#### 4. Database Tables sind Plural
```typescript
// ✅ Korrekte Dexie Table Namen
db.teams      // nicht db.team
db.spiele     // nicht db.spiel  
db.spieler    // nicht db.player
db.vereine    // nicht db.verein
```

### 🔍 Debug-Checkliste bei TypeScript-Fehlern

| Fehlermeldung | Lösung |
|--------------|--------|
| `Property 'id' does not exist on type 'Team'` | → Verwende `team_id` statt `id` |
| `Variable implicitly has type 'any[]'` | → Explizit typisieren: `const x: Team[] = []` |
| `Object is possibly 'undefined'` | → Null-Check hinzufügen: `if (obj) { ... }` |
| `Cannot find name 'Team'` | → Type importieren: `import type { Team } from '@/shared/types'` |

### 📚 Wo sind die Type-Definitionen?

- **Haupt-Types:** `/src/shared/types/index.ts`
- **API-Types:** `/src/shared/types/bbb-api-types.ts`  
- **Club-Types:** `/src/shared/types/club.ts`

**Bei Unsicherheit:** Schaue IMMER in diese Files!

### 💡 VSCode Tipp

Installiere "Error Lens" Extension - zeigt TypeScript-Fehler direkt inline:
```bash
code --install-extension usernamehw.errorlens
```

---

## 🚀 Copy-Paste Templates

```typescript
// Standard-Imports für neue Files
import type { Team, Spiel, Spieler, Verein, Liga } from '@/shared/types';
import { db } from '@/shared/db/database';

// Team abrufen
const team = await db.teams.get(teamId);
if (team) {
  console.log(team.team_id);  // NICHT team.id!
}

// Spieler-Liste
const spieler: Spieler[] = await db.spieler
  .where('team_id')
  .equals(team.team_id)  // NICHT team.id!
  .toArray();

// Spiele filtern
const spiele: Spiel[] = await db.spiele
  .where('team_id')  
  .equals(team.team_id)  // NICHT team.id!
  .toArray();
```

---

**❗ Regel Nr. 1:** Bei Entities immer `{entity}_id` verwenden, niemals nur `id`!

**📌 Bookmark diese Datei:** `/docs/development/TYPESCRIPT-GUIDE.md`
