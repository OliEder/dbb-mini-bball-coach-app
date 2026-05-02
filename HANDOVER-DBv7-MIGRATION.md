# 🚀 DBv7 Migration - Handover für nächsten Chat

**Datum:** 03. November 2025, 14:15 Uhr  
**Status:** 🟡 Phase 1 abgeschlossen, Phase 2-4 ausstehend  
**Nächster Schritt:** BBBSyncService auf DBv7 migrieren

---

## ✅ Was ist fertig?

### Phase 1: SpielService (DBv7-Integration) ✅

**Implementiert:**
- ✅ `getAktiveParticipationLigaIds(teamId)` - Holt aktive Liga-IDs
- ✅ `getSpiele(teamId)` - Neue Hauptmethode (DBv7-kompatibel)
- ✅ `getSpielByLiga(ligaId)` - Lädt alle Spiele einer Liga
- ✅ Backward Compatibility: `getSpieleByTeam()` nutzt intern `getSpiele()`

**Dateien:**
- `/src/domains/spielplan/services/SpielService.ts` (neu geschrieben)
- `/src/domains/spielplan/services/SpielService.test.ts` (8 Test-Cases)

**Erkenntnisse:**
- Dashboard.tsx nutzte `spielService.getSpiele()` → existierte nicht
- Jetzt beide Methoden vorhanden (`getSpiele()` + `getSpieleByTeam()`)

---

## 🔴 Was ist NICHT fertig?

### KRITISCHES Problem: BBBSyncService ist KOMPLETT v6.0!

**Error in Console:**
```
KeyPath extern_team_id on object store teams is not indexed
```

**Ursache:**
Der BBBSyncService nutzt noch die **alte v6.0-Team-Struktur**:

```typescript
// ❌ FALSCH (v6.0)
let team = await db.teams
  .where('extern_team_id')  // ❌ Heißt jetzt extern_permanent_id
  .equals(data.teamId.toString())
  .first();

team = {
  team_id: crypto.randomUUID(),
  extern_team_id: data.teamId.toString(),  // ❌ → extern_permanent_id
  verein_id: data.vereinId,
  name: data.teamName,
  trainer: '',
  altersklasse: altersklasse,  // ❌ Nicht mehr in Team!
  saison: liga.saison,         // ❌ Nicht mehr in Team!
  liga_id: liga.bbb_liga_id,   // ❌ Nicht mehr in Team!
  team_typ: 'gegner',
  created_at: new Date(),
};
```

**Sollte sein (v7.0):**
```typescript
// ✅ RICHTIG (v7.0)
let team = await db.teams
  .where('extern_permanent_id')  // ✅ Neuer Name
  .equals(data.teamId.toString())
  .first();

// Team ohne altersklasse/saison/liga_id erstellen
team = {
  team_id: crypto.randomUUID(),
  extern_permanent_id: data.teamId.toString(),  // ✅ Neuer Name
  verein_id: data.vereinId,
  name: data.teamName,
  trainer: '',
  team_typ: 'gegner',
  created_at: new Date(),
};

// DANN TeamLigaParticipation erstellen
const participation = {
  id: 0,  // Auto-increment
  team_id: team.team_id,
  extern_team_id: data.teamId.toString(),  // seasonTeamId
  saison: liga.saison,
  altersklasse: altersklasse,
  liga_id: liga.bbb_liga_id,
  ist_aktiv: true,
  created_at: new Date(),
};
await db.team_liga_participations.add(participation);
```

---

## 📋 Offene Aufgaben (Priorität)

### 🔴 PRIO 1: BBBSyncService auf DBv7 migrieren

**Betroffene Methoden:**
1. `createOrFindTeam()` - **KRITISCH**
   - Sucht mit `extern_team_id` → auf `extern_permanent_id` umstellen
   - Erstellt Team mit altersklasse/saison/liga_id → entfernen
   - TeamLigaParticipation nach Team-Erstellung hinzufügen

2. `findTeamByExternId()` - **KRITISCH**
   - Sucht mit `extern_team_id` → auf `extern_permanent_id` umstellen

3. `markAsOwnTeam()` - **Optional anpassen**
   - Prüfen ob Participation-Update nötig

**Dateien:**
- `/src/shared/services/BBBSyncService.ts` (Zeilen 580-650)

**Referenz-Implementation:**
- `/docs/operations/migrations/DBv7/BBBSyncService-v7.ts` (vollständige v7-Version)

---

### 🟡 PRIO 2: TeamService Refactoring

**Ziel:** Helper-Methoden für Participations

**Neue Methoden:**
```typescript
// TeamService.ts
async getActiveParticipation(teamId: string): Promise<TeamLigaParticipation | null>
async createTeamWithParticipation(teamData, participationData): Promise<Team>
async updateParticipation(teamId: string, updates): Promise<void>
```

**Anpassungen:**
- Alle Queries auf `extern_permanent_id` umstellen
- `team.altersklasse` → über Participation laden
- `team.saison` → über Participation laden

**Dateien:**
- `/src/domains/team/services/TeamService.ts`
- `/src/domains/team/team.service.ts` (legacy?)

---

### 🟡 PRIO 3: Onboarding-Store anpassen

**Problem:**
Erstellt Teams mit alten Properties:
```typescript
// ❌ FALSCH
const team = {
  altersklasse: 'U12',
  saison: '2024/25',
  liga_id: '...',
};
```

**Lösung:**
```typescript
// ✅ RICHTIG
const team = await teamService.createTeamWithParticipation(
  { name, trainer, verein_id },
  { altersklasse, saison, liga_id, ist_aktiv: true }
);
```

**Dateien:**
- `/src/domains/onboarding/onboarding-simple.store.ts` (Zeile 165)

---

### 🟢 PRIO 4: UI-Components anpassen

**Betroffene Components:**
- `Dashboard.tsx` (Zeile 71, 94)
- `TeamOverview.tsx` (Zeile 31)
- `SpielplanListe.tsx` (Zeile 53, 63)

**Typische Änderungen:**
```typescript
// ❌ FALSCH
const altersklasse = team.altersklasse;

// ✅ RICHTIG
const participation = await db.team_liga_participations
  .where('[team_id+ist_aktiv]')
  .equals([teamId, true])
  .first();
const altersklasse = participation?.altersklasse;
```

---

## 🛠️ Zugriff auf das System

### WICHTIG: Filesystem-Tool-Nutzung

**Das System akzeptiert NUR diese Tools:**
```typescript
// ✅ FUNKTIONIERT
Filesystem:read_file
Filesystem:write_file
Filesystem:search_files
Filesystem:list_directory

// ❌ FUNKTIONIERT NICHT (Linux-Only)
bash_tool
str_replace (manchmal)
view
```

**Pfade:**
- Arbeitsverzeichnis: `/Users/oliver-marcuseder/Documents/00-Privat/Basketball-Apps/basketball-app`
- Immer absolute Pfade verwenden
- Keine relativen Pfade, keine `cd` Commands

**Beispiel:**
```typescript
// ✅ RICHTIG
Filesystem:read_file({
  path: "/Users/oliver-marcuseder/Documents/00-Privat/Basketball-Apps/basketball-app/src/shared/services/BBBSyncService.ts"
})

// ❌ FALSCH
bash_tool({ command: "cd basketball-app && cat src/..." })
```

---

## 📚 Wichtige Dokumentation

### Migration-Docs (alles vorhanden!)
- `/docs/operations/migrations/DBv7/DB-V7-MIGRATION.md` - Komplette Spec
- `/docs/operations/migrations/DBv7/BBBSyncService-v7.ts` - Vollständige v7-Version
- `/docs/operations/migrations/DBv7/TEST-PLAN-V7.md` - Test-Strategie
- `/DBv7-STATUS-REPORT.md` - Aktueller Status-Report
- `/FIX-SESSION-LOG.md` - Session-Log mit Fortschritt

### Schema-Referenz
- `/src/shared/db/database.ts` - DBv7 Schema (✅ korrekt)
- `/src/shared/types/index.ts` - Type Definitions (✅ korrekt)

---

## 🧪 Testing

**Test-Commands:**
```bash
npm run dev           # Dev-Server starten
npm run type-check    # TypeScript-Errors prüfen
npm test              # Alle Tests (Vitest)
npm test -- SpielService.test.ts  # Einzelner Test
```

**Aktueller Stand:**
- 92 TypeScript-Errors in 20 Dateien
- Haupt-Errors: BBBSyncService, TeamService, Onboarding, UI-Components

---

## 🎯 Empfohlenes Vorgehen

### Schritt 1: BBBSyncService fixen (1-2 Stunden)
1. Öffne `/src/shared/services/BBBSyncService.ts`
2. Referenz: `/docs/operations/migrations/DBv7/BBBSyncService-v7.ts`
3. Methoden anpassen:
   - `createOrFindTeam()` - Größter Teil
   - `findTeamByExternId()`
   - Alle `extern_team_id` → `extern_permanent_id`
   - TeamLigaParticipation nach Team-Creation
4. Testen: `npm run dev` → Onboarding durchlaufen
5. Errors sollten verschwinden

### Schritt 2: TeamService Helper (30 Min)
1. Öffne `/src/domains/team/services/TeamService.ts`
2. Neue Methoden implementieren:
   - `getActiveParticipation()`
   - `createTeamWithParticipation()`
3. Tests schreiben (TDD!)

### Schritt 3: Onboarding anpassen (30 Min)
1. Öffne `/src/domains/onboarding/onboarding-simple.store.ts`
2. Nutze `createTeamWithParticipation()` statt direktem DB-Insert
3. Testen: Onboarding-Flow durchspielen

### Schritt 4: UI-Components fixen (1 Stunde)
1. TypeScript-Errors abarbeiten
2. `team.altersklasse` → Participation laden
3. Alle Components testen

### Schritt 5: Integration Testing (30 Min)
1. Kompletter Onboarding-Flow
2. BBB-Liga-Sync testen
3. Dashboard mit Spielen testen
4. TypeScript-Errors: 0

---

## ⚠️ Fallstricke

### Database-Reset bei Schema-Problemen
Falls die Migration crashed:
```typescript
// In Browser DevTools Console:
indexedDB.deleteDatabase('BasketballPWA');
localStorage.clear();
// Dann Page-Reload
```

### TypeScript kann lügen
Manchmal cached TypeScript alte Types:
```bash
rm -rf node_modules/.vite
npm run dev
```

### Dexie-Queries sind strikt
```typescript
// ❌ FALSCH - Property muss indexed sein
db.teams.where('altersklasse').equals('U12')

// ✅ RICHTIG - Über Participation
db.team_liga_participations.where('[team_id+ist_aktiv]').equals([teamId, true])
```

---

## 💡 Quick Wins

Falls du schnelle Fortschritte sehen willst:

**Option A: Nur BBBSyncService fixen**
- Behebt 90% der Console-Errors
- Onboarding funktioniert wieder
- **Dauer:** 1-2 Stunden

**Option B: Vollständige Migration**
- Alle Services auf v7
- 0 TypeScript-Errors
- Production-Ready
- **Dauer:** 4-6 Stunden

---

## 📞 Fragen für den User

Wenn du weitermachst, kläre ab:
1. Gibt es schon produktive Daten? (Migration-Script nötig?)
2. Soll Backward Compatibility erhalten bleiben?
3. Priorität: Schnell fertig vs. Perfekt getestet?

---

**Erstellt:** 2025-11-03 14:15 Uhr  
**Von:** Claude (AI Assistant)  
**Für:** Nächsten Chat  
**Zweck:** DBv7 Migration abschließen

**Viel Erfolg! 🚀**
