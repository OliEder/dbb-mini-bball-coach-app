# BBB API Data Structure - Erkenntnisse & Lessons Learned

**Datum:** 25. Oktober 2025  
**Typ:** API Integration Bug  
**Status:** ✅ Behoben

---

## 🎯 Problem-Zusammenfassung

Die Integration der Basketball-Bund.net (BBB) REST API schlug fehl, weil wir falsche Annahmen über die Datenstruktur gemacht haben. Die API-Responses haben **deutsche** Feldnamen, nicht englische wie in der OpenAPI-Spec angenommen.

---

## 🔍 Root Cause Analysis

### Ursprüngliches Problem

1. **API Mapping fehlgeschlagen**: Teams und Spiele wurden nicht korrekt aus der API gelesen
2. **Leere Daten im Frontend**: Obwohl die API-Calls erfolgreich waren, kamen keine Daten an
3. **Falsche Feldnamen**: Code suchte nach englischen Feldnamen, API liefert deutsche

### Was wir falsch gemacht haben

```typescript
// ❌ FALSCH: Angenommene Struktur (Englisch)
{
  "data": {
    "teams": [
      {
        "teamName": "...",
        "wins": 3,
        "losses": 1
      }
    ]
  }
}
```

### Tatsächliche API-Struktur

```typescript
// ✅ RICHTIG: Echte Struktur (Deutsch!)
{
  "data": {
    "tabelle": {
      "entries": [
        {
          "rang": 1,
          "team": {
            "seasonTeamId": 432555,
            "teamname": "Fibalon Baskets Neumarkt"
          },
          "anzspiele": 4,
          "s": 3,  // Siege
          "n": 1,  // Niederlagen
          "koerbe": 362,
          "gegenKoerbe": 271
        }
      ]
    }
  }
}
```

---

## 📊 Korrekte API Data Structures

### 1. Tabelle Endpoint: `/rest/competition/table/id/{ligaId}`

**Response Struktur:**
```json
{
  "timestamp": "2025-10-25T02:42:33+0200",
  "status": "0",
  "message": "",
  "data": {
    "ligaData": {
      "ligaId": 51961,
      "liganame": "U10 mixed Bezirksliga",
      "seasonId": 2025,
      "seasonName": "2025/2026"
    },
    "tabelle": {
      "entries": [
        {
          "rang": 1,
          "team": {
            "seasonTeamId": 432555,
            "teamCompetitionId": 432555,
            "teamPermanentId": 164793,
            "teamname": "Fibalon Baskets Neumarkt",
            "teamnameSmall": "FIB",
            "clubId": 4087,
            "verzicht": false
          },
          "anzspiele": 4,
          "anzGewinnpunkte": 8,
          "anzVerlustpunkte": 0,
          "s": 4,          // Siege
          "n": 0,          // Niederlagen
          "koerbe": 362,   // Erzielte Körbe
          "gegenKoerbe": 271,  // Erhaltene Körbe
          "korbdiff": 91   // Differenz
        }
      ]
    }
  }
}
```

**Korrektes Mapping:**
```typescript
const entries = apiResponse.data.tabelle?.entries || [];

const mappedTeams = entries.map((entry: any) => ({
  position: entry.rang,
  teamId: entry.team.seasonTeamId,
  teamName: entry.team.teamname,
  clubId: entry.team.clubId,
  games: entry.anzspiele,
  wins: entry.s,
  losses: entry.n,
  points: entry.anzGewinnpunkte,
  scoredPoints: entry.koerbe,
  concededPoints: entry.gegenKoerbe,
  pointsDifference: entry.korbdiff
}));
```

### 2. Spielplan Endpoint: `/rest/competition/spielplan/id/{ligaId}`

**Response Struktur:**
```json
{
  "timestamp": "2025-10-25T02:53:08+0200",
  "status": "0",
  "message": "",
  "data": {
    "ligaData": { /* ... */ },
    "matches": [
      {
        "matchId": 2804049,
        "matchDay": 6,
        "matchNo": 1496,
        "kickoffDate": "2025-10-05",
        "kickoffTime": "18:00",
        "homeTeam": {
          "seasonTeamId": 432429,
          "teamCompetitionId": 432429,
          "teamPermanentId": 186126,
          "teamname": "FC Tegernheim",
          "teamnameSmall": "TEG1",
          "clubId": 428,
          "verzicht": false
        },
        "guestTeam": {
          "seasonTeamId": 432428,
          "teamname": "Regensburg Baskets"
        },
        "result": "36:62",  // Format: "home:away" oder null
        "ergebnisbestaetigt": false,
        "verzicht": false,
        "abgesagt": false
      }
    ]
  }
}
```

**Korrektes Mapping:**
```typescript
const games = apiResponse.data.matches || [];

const mappedGames = games.map((match: any) => ({
  matchId: match.matchId,
  gameNumber: match.matchNo,
  gameDay: match.matchDay,
  date: match.kickoffDate,
  time: match.kickoffTime,
  homeTeam: {
    teamId: match.homeTeam.seasonTeamId,
    teamName: match.homeTeam.teamname
  },
  awayTeam: {
    teamId: match.guestTeam.seasonTeamId,
    teamName: match.guestTeam.teamname
  },
  status: match.result ? 'finished' : 'scheduled',
  homeScore: match.result ? parseInt(match.result.split(':')[0]) : undefined,
  awayScore: match.result ? parseInt(match.result.split(':')[1]) : undefined
}));
```

### 3. Team Matches Endpoint: `/rest/team/id/{teamPermanentId}/matches`

**Vorteil:** Liefert NUR Spiele eines spezifischen Teams!

**Response Struktur:**
```json
{
  "data": {
    "team": {
      "teamId": 167863,
      "teamName": "FC Bayern München 3"
    },
    "matches": [
      {
        "ligaData": {
          "ligaId": 49151,
          "liganame": "Bezirksklasse U10m"
        },
        "matchId": 2741780,
        "kickoffDate": "2025-10-05",
        "homeTeam": { /* ... */ },
        "guestTeam": { /* ... */ },
        "result": "37:82"
      }
    ]
  }
}
```

**Use Case:** Besser als Liga-Spielplan wenn nur Team-eigene Spiele benötigt werden!

---

## 🔧 Fixes Applied

### 1. BBBApiService.ts - Korrekte Feldnamen

**Datei:** `src/domains/bbb-api/services/BBBApiService.ts`

```typescript
// Tabelle Mapping
const entries = tableData.tabelle?.entries || [];
const mappedTeams = entries.map((entry: any) => ({
  position: entry.rang,
  teamId: entry.team.seasonTeamId,
  teamName: entry.team.teamname,
  clubId: entry.team.clubId,
  clubName: entry.team.teamname?.split(' ')[0],
  games: entry.anzspiele,
  wins: entry.s,
  losses: entry.n,
  points: entry.anzGewinnpunkte,
  scoredPoints: entry.koerbe,
  concededPoints: entry.gegenKoerbe,
  pointsDifference: entry.korbdiff
}));

// Spielplan Mapping
const games = spielplanData.matches || [];
const mappedGames = games.map((match: any) => ({
  matchId: match.matchId,
  gameNumber: match.matchNo,
  gameDay: match.matchDay,
  date: match.kickoffDate,
  time: match.kickoffTime,
  homeTeam: {
    teamId: match.homeTeam.seasonTeamId,
    teamName: match.homeTeam.teamname
  },
  awayTeam: {
    teamId: match.guestTeam.seasonTeamId,
    teamName: match.guestTeam.teamname
  },
  status: match.result ? 'finished' : 'scheduled',
  homeScore: match.result ? parseInt(match.result.split(':')[0]) : undefined,
  awayScore: match.result ? parseInt(match.result.split(':')[1]) : undefined
}));
```

### 2. Team Merge im Onboarding

**Problem:** User-Team und Sync-Team waren Duplikate mit unterschiedlichen IDs

**Lösung:** Merge nach Liga-Sync

```typescript
// Nach Liga-Sync: Merge User-Team mit Sync-Team
const userTeam = await db.teams.get(firstTeamId);
if (userTeam) {
  const syncTeam = await db.teams
    .where('name')
    .equals(userTeam.name)
    .and(team => team.extern_team_id !== undefined && team.team_id !== userTeam.team_id)
    .first();
  
  if (syncTeam && syncTeam.extern_team_id) {
    // Übernehme extern_team_id
    await db.teams.update(firstTeamId, {
      extern_team_id: syncTeam.extern_team_id
    });
    
    // Update Spiele-Referenzen
    const heimSpiele = await db.spiele
      .where('heim_team_id').equals(syncTeam.team_id).toArray();
    const gastSpiele = await db.spiele
      .where('gast_team_id').equals(syncTeam.team_id).toArray();
    
    for (const spiel of heimSpiele) {
      await db.spiele.update(spiel.spiel_id, { heim_team_id: firstTeamId });
    }
    for (const spiel of gastSpiele) {
      await db.spiele.update(spiel.spiel_id, { gast_team_id: firstTeamId });
    }
    
    // Lösche Sync-Team (Duplikat)
    await db.teams.delete(syncTeam.team_id);
  }
}
```

### 3. TabellenService - Richtige Abfrage

**Problem:** Suchte in nicht-existierender `spielplaene` Tabelle

**Lösung:** Spiele direkt über Team-ID finden

```typescript
async loadTabelleForTeam(teamId: string): Promise<TabellenEintrag[]> {
  // Finde Team
  const team = await db.teams.get(teamId);
  
  // Finde Spiele (Heim + Gast)
  const heimSpiele = await db.spiele.where('heim_team_id').equals(teamId).toArray();
  const gastSpiele = await db.spiele.where('gast_team_id').equals(teamId).toArray();
  const alleSpiele = [...heimSpiele, ...gastSpiele];
  
  // Extrahiere Liga-ID
  const ligaId = alleSpiele[0]?.liga_id;
  
  // Lade Tabelle für Liga
  return await this.loadTabelleFromDatabase(ligaId);
}
```

### 4. Liga-ID in Spielen

**Problem:** Spiele wurden ohne `liga_id` gespeichert

**Lösung:** Liga vor Spielplan-Sync laden und UUID übergeben

```typescript
async syncSpielplan(ligaId: number): Promise<void> {
  // Finde Liga für interne UUID
  const liga = await db.ligen
    .where('bbb_liga_id')
    .equals(ligaId.toString())
    .first();
  
  // Spiele mit liga_id speichern
  await this.createOrUpdateSpiel({
    // ...
    ligaId: liga.liga_id,  // ⭐ UUID übergeben!
    // ...
  });
}
```

---

## 📋 Lessons Learned

### 1. **NIE API-Struktur annehmen - IMMER verifizieren!**

- ✅ Echte API-Calls machen und Response loggen
- ✅ Response-Beispiele in `Resonses BBB-API/` Ordner speichern
- ✅ OpenAPI-Spec kann veraltet/falsch sein

### 2. **Datenstrukturen systematisch analysieren**

```typescript
// Debug-Pattern für unbekannte APIs
console.log('🔍 RAW API Response:', JSON.stringify(apiResponse));
console.log('🔍 Table Data:', tableData);
console.log('🔍 Table Entries:', entries);
```

### 3. **Team-Referenzen konsistent halten**

- User-Team und Sync-Team müssen gemergt werden
- `extern_team_id` ist der Schlüssel für Matching
- Alle Spiele-Referenzen müssen aktualisiert werden

### 4. **Datenbank-Schema verstehen**

- `spielplaene` Tabelle existiert nicht!
- Spiele werden in `spiele` Tabelle gespeichert
- `liga_id` ist UUID, nicht externe BBB Liga-ID

### 5. **API-Responses dokumentieren**

- Beispiele in `/basketball-bund-api/Resonses BBB-API/` sammeln
- Für jeden Endpoint mind. 2 Beispiele (verschiedene Altersklassen)
- Response-Struktur in Markdown dokumentieren

---

## 🎯 Prevention Guidelines

### Für zukünftige API-Integrationen:

1. **Schritt 1: API Response sammeln**
   ```bash
   # Bruno/Postman nutzen, Responses speichern
   ./basketball-bund-api/Resonses BBB-API/endpoint-name.json
   ```

2. **Schritt 2: Response analysieren**
   ```typescript
   // Alle Felder loggen
   console.log('Keys:', Object.keys(response));
   console.log('Sample:', response.data.tabelle.entries[0]);
   ```

3. **Schritt 3: TypeScript Interfaces definieren**
   ```typescript
   interface BBBTabellenEintrag {
     rang: number;
     team: {
       seasonTeamId: number;
       teamname: string;
     };
     anzspiele: number;
     s: number;  // Siege
     n: number;  // Niederlagen
   }
   ```

4. **Schritt 4: Mapping mit Validierung**
   ```typescript
   if (!entry.rang || !entry.team?.seasonTeamId) {
     console.error('Invalid entry:', entry);
     continue;
   }
   ```

5. **Schritt 5: Tests mit echten Daten**
   - Unit Tests mit Response-Beispielen
   - Integration Tests gegen echte API
   - Validierung der gemappten Daten

---

## 📚 Wichtige Erkenntnisse

### Deutsche Feldnamen in BBB API

| Englisch (erwartet) | Deutsch (tatsächlich) | Beschreibung |
|---------------------|----------------------|--------------|
| `teams` | `tabelle.entries` | Teams in Tabelle |
| `wins` | `s` | Siege |
| `losses` | `n` | Niederlagen |
| `games` | `anzspiele` | Anzahl Spiele |
| `points` | `anzGewinnpunkte` | Punkte |
| `scoredPoints` | `koerbe` | Erzielte Körbe |
| `concededPoints` | `gegenKoerbe` | Erhaltene Körbe |
| `pointsDifference` | `korbdiff` | Korb-Differenz |
| `matches` | `matches` | ✅ Bleibt gleich! |
| `teamName` | `teamname` | Kleinschreibung! |

### Team-IDs verstehen

```typescript
// DREI verschiedene Team-IDs in BBB API!
{
  seasonTeamId: 432555,      // ⭐ Für diese Saison (nutzen!)
  teamCompetitionId: 432555, // Gleich wie seasonTeamId
  teamPermanentId: 164793,   // Permanent über alle Saisons
  clubId: 4087               // Verein-ID
}
```

**Für Spiele nutzen:** `seasonTeamId`  
**Für Team-History über mehrere Saisons:** `teamPermanentId`

---

## ✅ Testing Checklist

Für zukünftige API-Integrationen:

- [ ] Response-Beispiele in Bruno/Postman gesammelt
- [ ] Feldnamen dokumentiert (Screenshot oder JSON)
- [ ] TypeScript Interfaces geschrieben
- [ ] Mapping-Code mit Validierung
- [ ] Unit Tests mit echten Response-Beispielen
- [ ] Integration Test gegen echte API
- [ ] Error Handling für fehlende Felder
- [ ] Logging für Debugging
- [ ] Dokumentation in `/docs/bugfixes/`

---

**Erstellt:** 25. Oktober 2025  
**Behoben von:** AI Assistant (Claude)  
**Review:** Oliver Marcuseder
