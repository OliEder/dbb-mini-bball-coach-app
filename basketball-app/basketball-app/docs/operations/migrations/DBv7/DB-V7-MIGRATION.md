# DB v7.0 Migration - Team-Liga-Relationships

**Datum:** 29. Oktober 2025  
**Status:** 🚀 Implementation  
**Breaking Change:** Ja (Team-Schema geändert)

---

## 🎯 Ziel

**Problem:** 
- Team-Identifikation über `name + liga_id` fehleranfällig
- BBB-API liefert `teamPermanentId` (permanent) und `seasonTeamId` (temporär)
- Wir speicherten bisher `seasonTeamId` → falsch!

**Lösung:**
1. `extern_team_id` → `teamPermanentId` (permanent über Saisons)
2. Neue Tabelle `team_liga_participations` für Team-Liga-Beziehungen
3. Team wird "saisonen-unabhängig" (ein Team spielt über mehrere Saisons)

---

## 📊 Schema-Änderungen

### VORHER (v6.0)

```typescript
interface Team {
  team_id: UUID;
  extern_team_id?: string;  // ❌ seasonTeamId (temporär!)
  verein_id: UUID;
  name: string;
  trainer: string;
  altersklasse: Altersklasse;
  saison: string;
  liga_id?: string;  // BBB Liga-ID
  team_typ: 'eigen' | 'gegner';
  user_id?: UUID;
  created_at: Date;
  updated_at?: Date;
}
```

### NACHHER (v7.0)

```typescript
// Team = Permanente Entität (unabhängig von Liga/Saison)
interface Team {
  team_id: UUID;
  extern_permanent_id: string;  // ✅ teamPermanentId (permanent!)
  verein_id: UUID;
  name: string;
  trainer: string;
  team_typ: 'eigen' | 'gegner';
  user_id?: UUID;
  created_at: Date;
  updated_at?: Date;
}

// NEU: Team-Liga-Participation (Team spielt in Liga)
interface TeamLigaParticipation {
  participation_id: UUID;
  team_id: UUID;                    // → Team (Foreign Key)
  liga_id: string;                  // BBB Liga-ID
  extern_season_team_id: string;    // seasonTeamId von BBB
  altersklasse: Altersklasse;
  saison: string;
  ist_aktiv: boolean;               // Aktuelle Saison?
  created_at: Date;
}
```

---

## 🗄️ Datenbank-Indices

```typescript
// database.ts v7.0
const DB_VERSION = 7;

this.version(7).stores({
  teams: `
    team_id,
    extern_permanent_id,
    verein_id,
    name,
    [extern_permanent_id+verein_id],
    [user_id+team_typ],
    created_at
  `,
  
  team_liga_participations: `
    participation_id,
    team_id,
    liga_id,
    extern_season_team_id,
    [team_id+liga_id],
    [team_id+saison],
    ist_aktiv,
    created_at
  `,
  
  // Restliche Tabellen unverändert...
});
```

---

## 🔄 BBBSyncService Refactoring

### Haupt-Änderungen

**1. Team-Deduplizierung über teamPermanentId**
```typescript
// VORHER (v6.0): ❌ Name + liga_id
const existing = await db.teams
  .where('[name+liga_id]')
  .equals([teamName, ligaId])
  .first();

// NACHHER (v7.0): ✅ teamPermanentId
const existing = await db.teams
  .where('extern_permanent_id')
  .equals(teamPermanentId.toString())
  .first();
```

**2. Team-Liga-Participation erstellen**
```typescript
// Nach Team-Creation:
await this.createOrUpdateParticipation({
  teamId: team.team_id,
  ligaId: liga.liga_id,
  seasonTeamId: data.seasonTeamId,
  altersklasse: altersklasse,
  saison: liga.saison,
});
```

**3. Spiel-Queries anpassen**
```typescript
// Spiele für Team in AKTUELLER Saison:
const participations = await db.team_liga_participations
  .where('[team_id+ist_aktiv]')
  .equals([teamId, true])
  .toArray();

const ligaIds = participations.map(p => p.liga_id);

const spiele = await db.spiele
  .where('liga_id')
  .anyOf(ligaIds)
  .filter(s => 
    s.heim_team_id === teamId || 
    s.gast_team_id === teamId
  )
  .toArray();
```

---

## 📝 Migration Steps (für später, wenn live)

**Hinweis:** Da wir noch nicht live sind, KEINE Migration nötig!

Falls später Migration nötig:
```typescript
this.version(7)
  .stores({ /* neue Struktur */ })
  .upgrade(async tx => {
    // 1. Alle Teams durchlaufen
    const teams = await tx.table('teams').toArray();
    
    for (const team of teams) {
      // 2. extern_team_id → extern_permanent_id umbenennen
      // Problem: Wir haben nur seasonTeamId, nicht permanentId!
      // → Manueller Daten-Fix oder BBB-API neu abfragen
      
      // 3. Participation erstellen
      if (team.liga_id && team.altersklasse && team.saison) {
        await tx.table('team_liga_participations').add({
          participation_id: crypto.randomUUID(),
          team_id: team.team_id,
          liga_id: team.liga_id,
          extern_season_team_id: team.extern_team_id || '',
          altersklasse: team.altersklasse,
          saison: team.saison,
          ist_aktiv: true,
          created_at: new Date(),
        });
      }
      
      // 4. Alte Felder aus Team entfernen
      await tx.table('teams').update(team.team_id, {
        extern_permanent_id: team.extern_team_id || '', // FIXME!
        // altersklasse: undefined,  // ENTFERNT
        // saison: undefined,        // ENTFERNT
        // liga_id: undefined,       // ENTFERNT
      });
    }
  });
```

---

## ✅ Vorteile

1. **✅ Korrekte BBB-ID-Verwendung** - `teamPermanentId` ist stabil
2. **✅ Multi-Saison-Tracking** - Team über mehrere Saisons verfolgbar
3. **✅ Auf-/Abstieg möglich** - Team wechselt Liga, bleibt aber gleich
4. **✅ Historische Daten** - Alte Participations bleiben erhalten
5. **✅ Deduplizierung robust** - Name kann sich ändern, permanentId nicht

---

## ⚠️ Breaking Changes

### Code-Änderungen nötig in:

- [x] `src/shared/types/index.ts` - Team & TeamLigaParticipation Interfaces
- [x] `src/shared/db/database.ts` - Schema v7.0
- [x] `src/domains/bbb-api/services/BBBSyncService.ts` - Komplettes Refactoring
- [ ] `src/domains/team/services/TeamService.ts` - Queries anpassen
- [ ] `src/domains/spiel/services/SpielService.ts` - Team-Liga-Filter
- [ ] Dashboard & UI Components - Team-Daten-Zugriff

### Test-Änderungen:
- [ ] BBBSyncService Tests komplett neu
- [ ] TeamService Tests anpassen
- [ ] Integration Tests

---

## 🚀 Implementation Order

1. **Types** - Interfaces definieren
2. **Database** - Schema v7.0 mit neuer Tabelle
3. **BBBSyncService** - Refactoring (größter Teil)
4. **TeamService** - Helper-Methoden für Participations
5. **Tests** - Anpassen & erweitern
6. **UI** - Dashboard anpassen (falls nötig)

---

## 📊 Datenmodell-Visualisierung

```
┌─────────────────┐
│     Verein      │
│  (verein_id)    │
└────────┬────────┘
         │ 1:N
         │
┌────────▼────────┐
│      Team       │◄──────────┐
│  (team_id)      │           │
│  extern_perm_id │           │ N:M
│  name           │           │
│  team_typ       │           │
└────────┬────────┘           │
         │ 1:N        ┌───────▼──────────┐
         │            │   Participation  │
         │            │  (part_id)       │
         │            │  team_id         │
         │            │  liga_id         │
         │            │  saison          │
         │            │  altersklasse    │
         │            └───────┬──────────┘
         │                    │ N:1
         │            ┌───────▼──────────┐
         │            │      Liga        │
         │            │  (liga_id)       │
         │            │  name            │
         │            │  saison          │
         │            └──────────────────┘
         │
┌────────▼────────┐
│     Spieler     │
│  (spieler_id)   │
│  team_id        │
└─────────────────┘
```

---

**Status:** 🚀 Ready für Implementation  
**Next:** Types Definition
