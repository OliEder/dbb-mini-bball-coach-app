# 🟢 GREEN Phase Plan - TeamService v7.0

**Datum:** 03. November 2025  
**Status:** Bereit für GREEN Phase  
**Ziel:** 16 RED-Phase Tests grün bekommen

---

## 📊 Ausgangslage

**Tests Status (02.11.2025):**
- ✅ **178/194 Tests bestehen** (91.75%)
- 🔴 **16 Tests RED** (TeamService DBv7 - erwartet!)

**RED Phase Tests:**
- `tests/unit/domains/team/services/TeamService.test.ts` (8 Fehler)
- `tests/unit/domains/team/services/TeamService.v7.test.ts` (8 Fehler)

**Ursache:** DBv7 Migration - `team_liga_participation` Schema-Problem

---

## ✅ Vorbereitungen (bereits erledigt)

1. **TeamService.ts** - v7.0 Methoden implementiert ✅
   - `getActiveParticipation()`
   - `getAllParticipations()`
   - `createTeamWithParticipation()`
   - `updateParticipation()`
   - `addParticipation()`
   - `setActiveParticipation()`

2. **Database.ts** - v7.0 Schema definiert ✅
   - `team_liga_participations` Tabelle
   - Compound-Indizes: `[team_id+ist_aktiv]`, `[team_id+saison]`
   - Auto-increment PK `id`
   - Migration v6→v7 implementiert

3. **Types** - `TeamLigaParticipation` definiert ✅

---

## 🔍 Diagnose-Schritte

### 1. Test-Ausführung prüfen
```bash
npm test -- TeamService
```
**Erwartung:** Sehen welche spezifischen Assertions failen

### 2. Häufige Fehlerquellen bei Dexie Tests
- **Problem:** Auto-increment ID nicht richtig behandelt
  - **Lösung:** `++id` in Schema (bereits korrekt ✅)
- **Problem:** Compound-Index funktioniert nicht
  - **Lösung:** `[team_id+ist_aktiv]` Syntax (bereits korrekt ✅)
- **Problem:** Transaction-Scope zu klein
  - **Lösung:** Alle beteiligten Tabellen in Transaction einbeziehen

### 3. Test-spezifische Checks
- Werden `team_liga_participations` korrekt hinzugefügt? 
- Funktioniert die Suche über Compound-Index `[team_id+ist_aktiv]`?
- Werden IDs korrekt zurückgegeben nach `add()`?

---

## 🔧 Mögliche Fixes

### Fix 1: Test-Setup verbessern
**Problem:** beforeEach cleared Tabellen nicht richtig
```typescript
beforeEach(async () => {
  await db.teams.clear();
  await db.team_liga_participations.clear();
  await db.spieler.clear();
  await db.spiele.clear();
  await db.liga_tabellen.clear();
});
```

### Fix 2: ID-Handling in Tests
**Problem:** Auto-increment ID wird nicht korrekt behandelt
```typescript
// ❌ BAD
const participation: TeamLigaParticipation = {
  id: 1,  // Manuell gesetzt
  ...
};

// ✅ GOOD
const participation: Omit<TeamLigaParticipation, 'id'> = {
  // id wird von Dexie automatisch vergeben
  ...
};
```

### Fix 3: Compound-Index Queries
**Problem:** `.where('[team_id+ist_aktiv]').equals([teamId, true])` funktioniert nicht
```typescript
// Prüfen ob Dexie-Syntax korrekt ist
const result = await db.team_liga_participations
  .where('[team_id+ist_aktiv]')
  .equals([teamId, 1])  // Boolean als Number?
  .first();
```

### Fix 4: Database-Version in Tests
**Problem:** Tests verwenden alte DB-Version
```typescript
// In Test-Setup sicherstellen:
beforeAll(async () => {
  await db.open();
  // Version prüfen
  console.log('DB Version:', db.verno);
});
```

---

## 📋 Schritt-für-Schritt Vorgehen

### Phase 1: Diagnose (15 min)
1. Tests ausführen und Fehler genau lesen
2. Console-Logs in TeamService aktivieren
3. DB-Schema mit Dexie Inspector prüfen

### Phase 2: Fix Implementation (30 min)
1. Ersten Fehler identifizieren
2. Fix implementieren
3. Test re-run
4. Nächsten Fehler → Repeat

### Phase 3: Validation (15 min)
1. Alle 16 Tests grün?
2. Integration-Tests noch grün?
3. Coverage ≥85% erreicht?

### Phase 4: Cleanup & Dokumentation (15 min)
1. Console-Logs entfernen
2. Code-Kommentare aufräumen
3. TEST-LOCATION-INVENTORY.md aktualisieren
4. PROJECT-STATUS.md aktualisieren

---

## 🎯 Definition of Done

- [ ] Alle 16 TeamService Tests grün
- [ ] Keine Regression bei anderen Tests (178 bleiben grün)
- [ ] Coverage ≥85%
- [ ] Code sauber (keine Debug-Logs)
- [ ] Dokumentation aktualisiert

---

## 🚀 Start-Befehl

```bash
cd /Users/oliver-marcuseder/Documents/00-Privat/Basketball-Apps/basketball-app
npm test -- TeamService
```

---

**Erstellt:** 03.11.2025  
**Status:** 🟢 Bereit für Implementation
