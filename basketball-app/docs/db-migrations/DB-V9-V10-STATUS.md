# DB v9 Hotfix & v10 Planning - Status Update

**Datum:** 2025-11-04  
**Status:** ✅ QUICK-FIX BEREIT | 📋 V10 GEPLANT

---

## 🚨 Problem (v9)

**Symptom:**
```
❌ Team "Regensburg Baskets" hat keine Liga-Zuordnung
❌ Dashboard zeigt: "Keine Liga zugeordnet"
❌ Keine Spiele werden geladen
```

**Root Cause:**
1. **Multi-Team Onboarding** erstellt Duplikate
2. **Team ohne `bbb_team_permanent_id`** kann nicht dedupliziert werden
3. **`team_typ: 'eigen'`** führt zu falschen Team-Zuordnungen

**Betroffene User:**
- Trainer mit mehreren Teams in gleicher Liga
- Beispiel: Oliver hat 2 U10 Teams bei Regensburg Baskets

---

## ✅ Quick-Fix (v9.1)

**Console-Befehl ausführen:**

```javascript
const { db } = await import('/src/shared/db/database.ts');
await db.open();

// 1. BBB-Team mit permanent_id finden
const bbbTeam = await db.teams
  .where('extern_permanent_id')
  .equals('432959')  // ← Deine Team permanent_id
  .first();

// 2. Als "eigen" markieren
if (bbbTeam) {
  await db.teams.update(bbbTeam.team_id, {
    team_typ: 'eigen'
  });
  console.log('✅ Team auf "eigen" gesetzt');
}

// 3. Duplikat ohne permanent_id löschen
await db.teams.delete('3cbdb0cd-cf0c-447a-a16c-4c20a2c24834');
console.log('✅ Duplikat gelöscht');

// 4. Prüfen
const participation = await db.team_liga_participations
  .where('team_id')
  .equals(bbbTeam.team_id)
  .first();

console.log('📋 Participation gefunden:', participation ? 'JA' : 'NEIN');
console.log('✅ QUICK-FIX COMPLETE! Browser neu laden!');
```

**Dann:** Browser neu laden (Cmd+Shift+R)

---

## 📋 v10 Migration Plan

**Master-Dokument:** [`/docs/db-migrations/DB-V10-MIGRATION-PLAN.md`](./DB-V10-MIGRATION-PLAN.md)

### Hauptziele v10:
1. ✅ **BBB-konformes Naming** (`bbb_` Prefix)
2. ✅ **User-zentrische Architektur** (`User.bbb_team_permanent_ids[]`)
3. ✅ **Eliminierung von `team_typ`**
4. ✅ **Garantierte Deduplizierung**
5. ✅ **Out-of-the-box Multi-Team Support**

### Breaking Changes:
- ⚠️ `Team.team_typ` entfernt
- ⚠️ `Team.user_id` entfernt
- ⚠️ Alle `extern_*` Fields → `bbb_*`
- ⚠️ `User.bbb_team_permanent_ids` hinzugefügt

### Timeline:
- **Phase 1:** Vorbereitung (1-2h)
- **Phase 2:** Schema & Types (2-3h)
- **Phase 3:** Services (3-4h)
- **Phase 4:** Components (2-3h)
- **Phase 5:** Testing (2-3h)
- **Phase 6:** Deployment (1h)

**Gesamt:** ~15h reine Entwicklungszeit

---

## 📊 Vergleich: v9 vs v10

### Team-Ownership

**v9 (aktuell):**
```typescript
// ❌ Problematisch
interface Team {
  team_typ: 'eigen' | 'gegner';  // Führt zu Duplikaten
  user_id?: UUID;                // Optional, inkonsistent
  extern_permanent_id?: string;  // Manchmal undefined!
}

// Teams finden:
const myTeams = await db.teams
  .where('team_typ')
  .equals('eigen')
  .toArray();
```

**v10 (geplant):**
```typescript
// ✅ Sauber
interface User {
  bbb_team_permanent_ids: string[];  // Single-Source-of-Truth
}

interface Team {
  bbb_team_permanent_id: string;     // REQUIRED!
  // Kein team_typ, kein user_id
}

// Teams finden:
const user = await db.users.first();
const myTeams = await db.teams
  .where('bbb_team_permanent_id')
  .anyOf(user.bbb_team_permanent_ids)
  .toArray();
```

### Field-Naming

**v9 (verwirrend):**
```typescript
{
  extern_verein_id: "123",    // ← Was ist das?
  extern_team_id: "456",      // ← Permanent oder Season?
  extern_spiel_id: "789"      // ← Match-ID?
}
```

**v10 (klar):**
```typescript
{
  bbb_club_id: "123",           // ✅ BBB clubId
  bbb_team_permanent_id: "456", // ✅ BBB teamPermanentId
  bbb_season_team_id: "789",    // ✅ BBB seasonTeamId
  bbb_match_id: "012"           // ✅ BBB matchId
}
```

---

## 🎯 Nächste Schritte

### Sofort (heute):
1. ✅ Quick-Fix ausführen (siehe oben)
2. ✅ Browser testen
3. ✅ Bestätigen dass Dashboard funktioniert

### Morgen/nächste Session:
1. 📋 v10 Migration starten
2. 📋 Phase 1: Backup + Tests (RED)
3. 📋 Phase 2: Schema definieren

---

## 💬 Für neuen Chat

**Quick-Start:**
```
Ich arbeite an DB v10 Migration nach Quick-Fix in v9.

Status-Dokument: /docs/db-migrations/DB-V9-V10-STATUS.md
Master-Plan: /docs/db-migrations/DB-V10-MIGRATION-PLAN.md

Quick-Fix durchgeführt: [JA/NEIN]
Nächster Schritt: [Phase X aus Master-Plan]
```

---

## 📚 Referenzen

- **Master-Plan:** [DB-V10-MIGRATION-PLAN.md](./DB-V10-MIGRATION-PLAN.md)
- **Migrations-README:** [README.md](./README.md)
- **Aktueller Code:** Git Branch `main` (v9)
- **Feature-Branch:** `feature/db-v10-migration` (noch nicht erstellt)

---

**Status:** ⏳ WAITING FOR QUICK-FIX EXECUTION
