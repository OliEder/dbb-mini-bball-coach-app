# BBB Club Crawler v2 - API Sequenz

```mermaid
sequenceDiagram
    participant Script
    participant File as clubs-germany.json
    participant API1 as /wam/liga/list
    participant API2 as /competition/table
    participant API3 as /team/.../matches
    participant API4 as /club/.../actualmatches
    
    Script->>File: Lade existierende Daten
    File-->>Script: 278 Clubs (falls vorhanden)
    
    Script->>File: Erstelle Backup
    File-->>Script: backup-1729600000.json ✅
    
    Script->>API1: POST verband=2<br/>(OHNE saison!)
    API1-->>Script: 373 Ligen<br/>(alle Saisons)
    
    Note over Script: Loop über alle 373 Ligen
    
    Script->>API2: GET /table/id/48014
    API2-->>Script: ligaData (seasonId: 2025 ✅)<br/>+ 12 Teams
    
    Note over Script: Gruppiere nach:<br/>clubId → teamPermanentId → seasonId
    
    Script->>API2: GET /table/id/48015
    API2-->>Script: ligaData (seasonId: 2024)<br/>+ Teams
    
    Note over Script: ... weitere Ligen ...<br/>278 Clubs<br/>450 Teams<br/>2 Seasons (2024, 2025)
    
    Note over Script: Struktur bisher:<br/>Map(clubId → Map(teamId → Map(seasonId → ligen)))
    
    Note over Script: Loop über ALLE eindeutigen Teams
    
    Script->>API3: GET /team/id/167863/matches
    API3-->>Script: teamAkj: U10 (FIX!)<br/>teamGender: m<br/>Club-Details
    
    Note over Script: Setze teamAkj permanent!<br/>Nur wenn noch null
    
    Script->>API3: GET /team/id/167864/matches
    API3-->>Script: Team + Club Details
    
    Note over Script: ... 450 Teams ...<br/>120 Clubs haben kontaktData: null
    
    Note over Script: Loop über Clubs mit<br/>kontaktData = null
    
    Script->>API4: GET /club/id/619/actualmatches
    API4-->>Script: kontaktData: {...} ✅
    
    Script->>API4: GET /club/id/620/actualmatches
    API4-->>Script: kontaktData: null
    
    Note over Script: 45 kontaktData ergänzt
    
    Note over Script: Transformiere Maps zu Arrays:<br/>Club → Teams → Seasons → Ligen
    
    Note over Script: Sortiere:<br/>- Clubs nach Name<br/>- Teams nach Nummer<br/>- Seasons DESC (neueste zuerst)
    
    Script->>File: Überschreibe JSON<br/>(Backup existiert!)
    
    Script->>Script: ✅ Fertig!<br/>278 Clubs<br/>450 Teams<br/>2 Seasons<br/>45 kontaktData
```

## API-Endpunkte im Detail

### 1. `/wam/liga/list`
**Problem:** `seasonId: null` ❌  
**Nutzung:** Liste aller `ligaId`s  
**Wichtig:** **KEIN** `saison` Parameter - wir wollen alle Saisons!

### 2. `/competition/table/id/:ligaId`
**Wichtig:** `ligaData.seasonId: 2025` ✅  
**Nutzung:** Korrekte Season-Daten + Teams

**Response:**
```json
{
  "data": {
    "ligaData": {
      "ligaId": 48014,
      "liganame": "U10 Bezirksliga",
      "seasonId": 2025,        // ← HIER!
      "seasonName": "2025/2026",
      "akName": "U10"
    },
    "tabelle": {
      "entries": [
        {
          "team": {
            "clubId": 619,
            "teamPermanentId": "167863",
            "teamCompetitionId": "401234"
          }
        }
      ]
    }
  }
}
```

### 3. `/team/id/:teamPermanentId/matches`
**Liefert:**
- **Team-Details:** `teamAkj` (FIX!), `teamGender`, `teamNumber`
- **Club-Details:** `vereinsname`, `vereinsnummer`, `kontaktData`

**Wichtig:**
- `teamAkj` ist **PERMANENT** - wird NUR EINMAL gesetzt
- Überschreibe `teamAkj` NICHT bei weiteren Ligen!

**Response:**
```json
{
  "data": {
    "team": {
      "teamPermanentId": "167863",
      "teamAkjId": 10,
      "teamAkj": "U10",      // ← FIX! Bleibt immer U10
      "teamGenderId": 1,
      "teamGender": "m",
      "teamNumber": 3,
      "club": {
        "vereinsname": "FC Bayern München e.V.",
        "vereinsnummer": "0212033",
        "kontaktData": {...}
      }
    }
  }
}
```

### 4. `/club/id/:clubId/actualmatches`
**Nutzung:** Fehlende `kontaktData` ergänzen  
**Nur für:** Clubs mit `kontaktData === null`

**Response:**
```json
{
  "data": {
    "club": {
      "kontaktData": {
        "street": "Säbener Straße 51",
        "zipCode": "81547",
        "city": "München"
      }
    }
  }
}
```

## Daten-Transformation

### Maps während Verarbeitung:
```javascript
Map<clubId, {
  clubId,
  vereinsname,
  verbaende,
  teams: Map<teamPermanentId, {
    teamPermanentId,
    teamAkj,        // ← FIX! Einmal gesetzt
    teamGender,
    seasons: Map<seasonId, {
      seasonId,
      seasonName,
      ligen: [...]
    }>
  }>
}>
```

### Arrays im Output:
```json
{
  "clubs": [
    {
      "clubId": "619",
      "teams": [
        {
          "teamPermanentId": "167863",
          "teamAkj": "U10",  // ← FIX!
          "seasons": [
            {
              "seasonId": 2025,
              "ligen": [...]
            }
          ]
        }
      ]
    }
  ]
}
```

## Timing

- **373 Ligen** × 100ms = ~37s (Schritt 1 + 2)
- **450 Teams** × 100ms = ~45s (Schritt 3)
- **100 Clubs** × 100ms = ~10s (Schritt 4)
- **Transform + Save:** ~5s
- **Total:** ~97s ≈ **1.6 Minuten**

## Wichtige Regeln

1. ✅ **seasonId von ligaData** - Nicht von liga!
2. ✅ **teamAkj ist FIX** - Nur einmal setzen
3. ✅ **Ligen unter Seasons** - Nicht direkt am Team
4. ✅ **Liga-AK kann höher sein** - U10 Team in U12 Liga
5. ✅ **Maps für Dedup** - Arrays für Output
6. ✅ **Smart Merge** - Nur null-Werte überschreiben
