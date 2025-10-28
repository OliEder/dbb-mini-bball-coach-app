# Refactoring v6.0: team_id aus Spiel entfernen

**Datum:** 27.10.2025  
**Status:** 🚧 In Arbeit

## Problem

`team_id` in Spiel-Entity ist konzeptionell falsch:
- Ein Spiel findet zwischen zwei Teams statt (nicht "gehört" einem Team)
- Edge Case nicht lösbar: Internes Spiel (zwei eigene Teams gegeneinander)
- Bug in BBBSyncService: `team_id` wird immer auf erstes eigenes Team gesetzt

## Lösung

**1. Types anpassen (`src/shared/types/index.ts`)**

```typescript
// VORHER (v5.0):
export interface Spiel {
  spiel_id: UUID;
  team_id: UUID;  // ❌ FALSCH!
  heim_team_id?: UUID;
  gast_team_id?: UUID;
  // ...
}

// NACHHER (v6.0):
export interface Spiel {
  spiel_id: UUID;
  // team_id ENTFERNT! ✅
  heim_team_id?: UUID;
  gast_team_id?: UUID;
  // ...
}
```

**2. DB Schema v6.0**

```typescript
// database.ts
const DB_VERSION = 6; // team_id aus Spiel entfernt!

this.version(6).stores({
  // VORHER:
  spiele: 'spiel_id, ..., team_id, ..., [team_id+datum]'
  
  // NACHHER:
  spiele: 'spiel_id, ..., [heim_team_id+datum], [gast_team_id+datum], [liga_id+datum]'
}).upgrade(tx => {
  // Migration: team_id aus allen Spielen entfernen
  return tx.table('spiele').toCollection().modify(spiel => {
    delete spiel.team_id;
  });
});
```

**3. SpielService (NEU)**

Service kapselt Filterlogik:

```typescript
class SpielService {
  async getSpiele(teamId: string): Promise<Spiel[]> {
    const alle = await db.spiele.toArray();
    return alle.filter(s => 
      s.heim_team_id === teamId || 
      s.gast_team_id === teamId
    ).sort((a, b) => a.datum.getTime() - b.datum.getTime());
  }
  
  async isInternesSpiel(spiel: Spiel): Promise<boolean> {
    const [heim, gast] = await Promise.all([
      db.teams.get(spiel.heim_team_id!),
      db.teams.get(spiel.gast_team_id!)
    ]);
    return heim?.team_typ === 'eigen' && gast?.team_typ === 'eigen';
  }
}
```

**4. BBBSyncService vereinfachen**

```typescript
// VORHER - FALSCH:
let teamId = '';
if (heimTeam?.team_typ === 'eigen') {
  teamId = heimTeam.team_id; // ❌ Nur Heim-Team!
} else if (gastTeam?.team_typ === 'eigen') {
  teamId = gastTeam.team_id;
}

// NACHHER - KORREKT:
// team_id wird NICHT mehr gesetzt!
const spiel: Spiel = {
  spiel_id: crypto.randomUUID(),
  // KEIN team_id mehr! ✅
  heim_team_id: data.heimTeamId,
  gast_team_id: data.gastTeamId,
  // ...
}
```

##  Files zu ändern

- [x] `src/shared/types/index.ts` - Spiel Interface
- [ ] `src/shared/db/database.ts` - Schema v6.0
- [x] `src/domains/spiel/services/SpielService.ts` - NEU
- [ ] `src/domains/bbb-api/services/BBBSyncService.ts`
- [ ] Alle Consumer (Dashboard, etc.)

## Tests

- [x] `SpielService.test.ts` - Unit Tests (RED)
- [ ] Integration Tests anpassen
- [ ] E2E Tests für internes Spiel

## Technical Decision Record

**TDR-006: Removal of team_id from Spiel Entity**

- **Context:** Spiel gehört konzeptionell keinem Team
- **Problem:** Edge Case "internes Spiel" nicht lösbar mit team_id
- **Decision:** team_id entfernen, SpielService kapselt Team-Filterung
- **Consequences:** ✅ Semantisch korrekt, ✅ Alle Edge Cases lösbar, ❌ Breaking Change

---

**Status:** Types-Datei durch fehlerhafte Edits korrupt - wird jetzt repariert
