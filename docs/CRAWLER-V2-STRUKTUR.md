# BBB Club Crawler v2 - Datenstruktur

## API-Transformation

```mermaid
graph LR
    subgraph API1["/wam/liga/list"]
        L1[Liga 1<br/>ligaId: 48014<br/>seasonId: null ❌]
        L2[Liga 2<br/>...]
    end
    
    subgraph API2["/competition/table/id/:ligaId"]
        T1[Tabelle mit ligaData<br/>seasonId: 2025 ✅<br/>seasonName: 2025/2026]
        T2[entries: Teams<br/>teamPermanentId: 310566<br/>teamCompetitionId: 401086<br/>clubId: 4563]
    end
    
    subgraph API3["/team/id/:teamPermanentId/matches"]
        TD[Team Details:<br/>teamAkjId: 10<br/>teamAkj: U10<br/>teamGenderId: 1<br/>teamGender: m<br/>teamNumber: 3]
        CD[Club Details:<br/>vereinId: 4563<br/>vereinsname: FC Bayern e.V.<br/>vereinsnummer: 0212033<br/>kontaktData: null]
    end
    
    API1 --> API2
    API2 --> Merge1[Merge Teams<br/>nach clubId]
    API3 --> Merge1
    
    Merge1 --> Transform[Transformiere Struktur]
    
    Transform --> Output
    
    subgraph Output[Finale JSON-Struktur]
        direction TB
        Club[Club<br/>clubId: 4563<br/>vereinsname: FC Bayern e.V.<br/>vereinsnummer: 0212033<br/>kontaktData: null<br/>verbaende: 2]
        
        Club --> Seasons[seasons: Array]
        
        Seasons --> S1[Season 2025/2026<br/>seasonId: 2025<br/>seasonName: 2025/2026]
        
        S1 --> Teams[teams: Array]
        
        Teams --> Team1[Team<br/>teamPermanentId: 310566<br/>teamAkjId: 10<br/>teamAkj: U10<br/>teamGenderId: 1<br/>teamGender: m<br/>teamNumber: 3]
        
        Team1 --> Ligen[ligen: Array]
        
        Ligen --> Liga1[Liga<br/>teamCompetitionId: 401086<br/>ligaId: 48014<br/>liganame: Bezirksliga<br/>akName: U10]
    end
    
    style API1 fill:#fff4e1
    style API2 fill:#fff4e1
    style API3 fill:#fff4e1
    style Output fill:#e1f5e1
    style Transform fill:#e1e5ff
```

## Finale JSON-Struktur

```json
{
  "clubs": [
    {
      "clubId": "619",
      "vereinsname": "FC Bayern München e.V.",
      "vereinsnummer": "0212033",
      "kontaktData": null,
      "verbaende": [2],
      
      "teams": [
        {
          "teamPermanentId": "167863",
          "teamname": "FC Bayern München 3",
          "teamnameSmall": "FCB3",
          
          "teamAkjId": 10,
          "teamAkj": "U10",  // ← FIX! Bleibt immer U10
          "teamGenderId": 1,
          "teamGender": "m",
          "teamNumber": 3,
          
          "seasons": [
            {
              "seasonId": 2025,
              "seasonName": "2025/2026",
              
              "ligen": [
                {
                  "teamCompetitionId": "401234",
                  "ligaId": "48014",
                  "liganame": "U12 Bezirksliga",
                  "akName": "U12",  // ← Liga kann höher sein!
                  "geschlechtId": 1,
                  "geschlecht": "männlich"
                }
              ]
            },
            {
              "seasonId": 2024,
              "seasonName": "2024/2025",
              "ligen": [...]  // Team spielte auch letzte Saison
            }
          ]
        }
      ]
    }
  ]
}
```

## Hierarchie

```
Club (vereinsname, vereinsnummer, kontaktData)
  └─ Teams (teamPermanentId, teamAkj, teamGender, teamNumber) ← PERMANENT!
      └─ Seasons (seasonId, seasonName)
          └─ Ligen (ligaId, liganame, akName)
```

**Wichtige Regeln:**
- **teamAkj ist FIX** - Ein U10-Team bleibt immer U10
- **Team spielt über Saisons** - Gleiche Kinder, verschiedene Jahre
- **Liga-AK kann höher sein** - U10 Team in U12 Liga (erlaubt)
- **Liga-AK kann NICHT niedriger sein** - U12 Team in U10 Liga (verboten)
- **Senioren = höchste AK** - Teams können "aufsteigen" zu Senioren

## Vorteile

1. **Team-Zentrierung** - Team als permanente Entität
2. **Historische Daten** - Team-Historie über Saisons
3. **Multi-Liga** - Team in Liga + Pokal gleichzeitig
4. **Club-Zentriert** - Keine Duplikate
5. **Korrekte Semantik** - Spiegelt Basketball-Realität
