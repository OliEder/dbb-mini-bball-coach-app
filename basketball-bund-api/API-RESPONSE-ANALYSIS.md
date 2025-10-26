# API Response Analyse und Schema Korrektur

## 1. WAM Data Endpoint Analyse

### Tatsächliche Response-Struktur aus wam-data.json:

```json
{
  "timestamp": "2025-10-17T17:12:38+0200",
  "status": "0",
  "message": "",
  "data": {
    "wam": {
      // Echo der Request-Parameter
      "token": "0",
      "verbandIds": [100],
      "gebietIds": [],
      "ligatypIds": [],
      "akgGeschlechtIds": [],
      "altersklasseIds": [],
      "spielklasseIds": [],
      "sortBy": 1
    },
    "verbaende": [
      {
        "id": 2,
        "label": "Bayern",
        "hits": 374
      }
    ],
    "gebiete": [
      {
        "id": "_",
        "bezirk": null,
        "kreis": null,
        "hits": 32
      }
    ],
    "ligatypen": [...],
    "agkGeschlechtList": [...],
    "altersklassen": [
      {
        "id": 1,
        "label": "Senioren",
        "hits": 13
      }
    ],
    "spielklassen": [...],
    "ligaListe": {
      "startAtIndex": 0,
      "ligen": [
        {
          "seasonId": null,
          "seasonName": null,
          "actualMatchDay": null,
          "ligaId": 51520,
          "liganame": "1. Bundesliga (easyCredit BBL)",
          "liganr": 1,
          "skName": "1. Bundesliga",
          "skNameSmall": "BL",
          "skEbeneId": 0,
          "skEbeneName": "Verband",
          "akName": "Senioren",
          "geschlechtId": 1,
          "geschlecht": "männlich",
          "verbandId": 100,
          "verbandName": "Bundesligen",
          "bezirknr": null,
          "bezirkName": null,
          "kreisnr": null,
          "kreisname": null,
          "statisticType": null,
          "vorabliga": false,
          "tableExists": null,
          "crossTableExists": null
        }
      ],
      "hasMoreData": true,
      "size": 10
    }
  },
  "version": "11.42.2-b100829",
  "dateFormat": "yyyy-MM-dd",
  "timeFormat": "yyyy-MM-dd'T'HH:mm:ssZ",
  "timeFormatShort": "HH:mm",
  "serverInstance": "www",
  "username": null,
  "appContext": "https://www.basketball-bund.net"
}
```

### Probleme in unserer Implementierung:
1. Response hat Root-Level mit `timestamp`, `status`, `message`, `data`
2. Die eigentlichen Daten sind in `data` verschachtelt
3. `ligaListe` ist ein Objekt mit `ligen`, `hasMoreData`, `size`
4. `gebiete` haben `id` als String, nicht als Number
5. `agkGeschlechtList` statt `akgGeschlechtIds`

## 2. Competition Table Endpoint

Aus `competiotion-table-id_ligaId.json`:

```json
{
  "timestamp": "2025-10-17T17:19:18+0200",
  "status": "0",
  "message": "",
  "data": {
    "ligaId": 50953,
    "liganame": "U18-1 Bezirksliga (m)",
    "teams": [
      {
        "platzierung": 1,
        "teamId": 133854,
        "teamname": "SC Grün-Weiß Paderborn",
        "spiele": 2,
        "gewonnen": 2,
        "verloren": 0,
        "punkte": 4,
        "korbpunkteGemacht": 175,
        "korbpunkteGegen": 107,
        "differenz": 68,
        "siegeHeim": 2,
        "niederlagenHeim": 0,
        "siegeAuswaerts": 0,
        "niederlagenAuswaerts": 0
      }
    ]
  }
}
```

### Abweichungen vom aktuellen Schema:
- `platzierung` statt `position`
- `teamname` statt `teamName`
- `gewonnen`/`verloren` statt `wins`/`losses`
- `korbpunkteGemacht`/`korbpunkteGegen` statt `scoredPoints`/`concededPoints`
- Kein `clubId` oder `clubName` in der Response

## 3. Competition Spielplan Endpoint

Aus `competition-spielplan-id-_ligaId.json`:

```json
{
  "timestamp": "2025-10-17T17:21:31+0200",
  "status": "0",
  "message": "",
  "data": {
    "ligaId": 51227,
    "liganame": "U10-1 Oberpfalz - Kreisliga A",
    "spielplan": [
      {
        "tag": 1,
        "nr": 1,
        "datum": "2025-09-14",
        "uhrzeit": "09:00",
        "heimteamname": "BBV Vohenstrauß",
        "gastteamname": "SV Mitterteich",
        "halle": "Pfalzgraf-Friedrich-Mittelschule Vohenstrauß",
        "heimteamid": 135651,
        "gastteamid": 135652,
        "spielbericht": null,
        "spielid": 1551337,
        "heimTore": null,
        "gastTore": null
      }
    ]
  }
}
```

### Abweichungen:
- `spielplan` Array statt `games`
- `tag`/`nr` statt `gameDay`/`gameNumber`
- `heimteamname`/`gastteamname` statt nested objects
- `heimteamid`/`gastteamid` als direkte Properties
- `spielid` statt `matchId`
- `heimTore`/`gastTore` statt `homeScore`/`awayScore`

## 4. Match Info Endpoint

Aus `match-id-_matchId-matchInfo.json`:

```json
{
  "timestamp": "2025-10-17T17:24:36+0200",
  "status": "0",
  "message": "",
  "data": {
    "akgId": "U10",
    "spielNr": "1",
    "spielTag": 1,
    "heimmannschaft": "BBV Vohenstrauß",
    "gastmannschaft": "SV Mitterteich",
    "ort": "Pfalzgraf-Friedrich-Mittelschule Vohenstrauß",
    "datum": "2025-09-14",
    "uhrzeit": "09:00",
    "heimErgebnis": null,
    "gastErgebnis": null,
    "schiedsrichter1": null,
    "schiedsrichter2": null,
    "kommissar": null,
    "zuschauer": null,
    "heimSpielerList": [],
    "gastSpielerList": [],
    "viertelErgebnisse": []
  }
}
```

## Zusammenfassung der Hauptprobleme:

1. **Response Wrapper**: Alle Responses haben einen Wrapper mit `timestamp`, `status`, `message`, `data`
2. **Deutsche Property-Namen**: Viele Properties verwenden deutsche Namen statt englische
3. **Fehlende Daten**: clubId/clubName fehlen oft in den Responses
4. **Andere Struktur**: Verschachtelte Objekte vs. flache Properties
5. **Type-Unterschiede**: IDs als Strings vs. Numbers

Nächster Schritt: Ich werde die korrigierte API-Spec erstellen.
