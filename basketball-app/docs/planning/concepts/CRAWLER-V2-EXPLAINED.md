# 📖 Club-Crawler Script v2 - Detaillierte Erklärung

## 🎯 Zweck

Crawlt ALLE Vereine eines Verbands mit korrekter Hierarchie:
**Club → Teams → Seasons → Ligen**

---

## 🔧 Aufruf

```bash
# Bayern crawlen
npm run crawl:clubs -- --verband=2

# Weitere Beispiele:
npm run crawl:clubs -- --verband=1  # Baden-Württemberg
npm run crawl:clubs -- --verband=10 # NRW
```

---

## 📋 Schritt-für-Schritt

### Schritt 1: Lade ALLE Ligen (paginated)

**API:** `POST /rest/wam/liga/list?startAtIndex=0`

**Request Body:**
```json
{
  "verbandIds": [2],
  "gebietIds": [],
  "ligatypIds": [],
  "akgGeschlechtIds": [],
  "altersklasseIds": [],
  "spielklasseIds": []
}
```

**Wichtig:**
- API gibt maximal 10 Ligen pro Request
- Bayern hat ~380 Ligen → 38 Requests nötig
- **KEIN `saison` Parameter** - wir wollen ALLE Ligen über alle Saisons!

**Output:** Array von ~380 Ligen

---

### Schritt 2: Extrahiere Teams aus Tabellen

**API:** `GET /rest/competition/table/id/:ligaId`

**Für jede Liga:**
1. Lade Tabelle
2. Hole `ligaData.seasonId` (korrekte Season!)
3. Extrahiere Teams aus `entries`
4. Gruppiere nach `clubId` → `teamPermanentId` → `seasonId`

**Response-Struktur:**
```json
{
  "data": {
    "ligaData": {
      "ligaId": 48014,
      "liganame": "U10 Bezirksliga",
      "seasonId": 2025,        // ✅ WICHTIG!
      "seasonName": "2025/2026",
      "akName": "U10",
      "geschlecht": "männlich"
    },
    "tabelle": {
      "entries": [
        {
          "team": {
            "clubId": 619,
            "teamPermanentId": "167863",
            "teamCompetitionId": "401234",
            "teamname": "FC Bayern München 3"
          }
        }
      ]
    }
  }
}
```

**Wichtig:**
- `seasonId` kommt von `ligaData`, NICHT von `/wam/liga/list`
- Mehrere Ligen können zur gleichen Season gehören
- Teams werden nach `teamPermanentId` dedupliziert

---

### Schritt 3: Lade Team-Details

**API:** `GET /rest/team/id/:teamPermanentId/matches`

**Für jedes eindeutige Team:**
1. Lade Team-Details: `teamAkj`, `teamGender`, `teamNumber`
2. Lade Club-Daten: `vereinsname`, `vereinsnummer`, `kontaktData`

**Response-Struktur:**
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
        "clubId": "619",
        "vereinsname": "FC Bayern München e.V.",
        "vereinsnummer": "0212033",
        "kontaktData": {
          "street": "Säbener Straße 51",
          "city": "München"
        }
      }
    }
  }
}
```

**Wichtig:**
- `teamAkj` ist **PERMANENT** - Ein U10-Team bleibt immer U10
- Team kann in **höheren** Ligen spielen (U10 in U12 Liga)
- `kontaktData` kann `null` sein → Schritt 4 nötig

---

### Schritt 4: Ergänze fehlende Kontaktdaten

**API:** `GET /rest/club/id/:clubId/actualmatches`

**Nur für Clubs mit `kontaktData === null`:**
```javascript
if (!club.kontaktData) {
  const url = `${BASE_URL}/rest/club/id/${club.clubId}/actualmatches`;
  const data = await fetch(url).then(r => r.json());
  
  if (data.data?.club?.kontaktData) {
    club.kontaktData = data.data.club.kontaktData;
  }
}
```

---

### Schritt 5: Strukturiere und Speichere

**Finale Struktur:**
```
Club
  └─ Teams (permanent, gleiche Kinder über Jahre)
      └─ Seasons (2024/2025, 2025/2026, ...)
          └─ Ligen (kann höhere AK sein!)
```

**Beispiel:**
```json
{
  "clubId": "619",
  "vereinsname": "FC Bayern München e.V.",
  "vereinsnummer": "0212033",
  "kontaktData": {...},
  "verbaende": [2],
  "teams": [
    {
      "teamPermanentId": "167863",
      "teamname": "FC Bayern München 3",
      "teamAkj": "U10",        // ← FIX!
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
              "liganame": "U10 Bezirksliga",
              "akName": "U10"    // ← Liga-AK
            }
          ]
        },
        {
          "seasonId": 2024,
          "seasonName": "2024/2025",
          "ligen": [...]
        }
      ]
    }
  ]
}
```

**Wichtige Regeln:**
- **teamAkj ist FIX** - Bleibt über alle Seasons gleich
- **Liga-AK kann höher sein** - U10 Team in U12 Liga (erlaubt)
- **Liga-AK kann NICHT niedriger sein** - U12 Team in U10 Liga (verboten)
- **Seasons am Team** - Zeigt Team-Historie über Jahre
- **Senioren = höchste AK** - Teams können "aufsteigen"

---

## ⚙️ Rate Limiting

```javascript
const DELAY_MS = 100; // 100ms zwischen Requests
await sleep(DELAY_MS);
```

**Gesamt-Dauer (Bayern):**
- ~380 Ligen = 380 Requests (Schritt 2)
- ~300 Teams = 300 Requests (Schritt 3)
- ~100 Clubs = 100 Requests (Schritt 4)
- **Total: ~780 Requests**
- **Zeit: ~78 Sekunden + Overhead = ~2-3 Minuten**

---

## 🔍 Smart Grouping

Das Script gruppiert in drei Ebenen:

### 1. Nach Club (clubId)
```javascript
const clubMap = new Map(); // clubId → Club-Objekt
```

### 2. Nach Team (teamPermanentId)
```javascript
const teamMap = new Map(); // teamPermanentId → Team-Objekt
```

### 3. Nach Season (seasonId)
```javascript
const seasonMap = new Map(); // seasonId → Season-Objekt
```

**Resultat:**
- Ein Club kann mehrere Teams haben
- Ein Team spielt über mehrere Seasons
- Eine Season enthält mehrere Ligen (Liga + Pokal)

---

## 📊 Beispiel-Output

```
╔══════════════════════════════════════════╗
║      BBB Club Crawler v2                 ║
╚══════════════════════════════════════════╝

Verband: 2 (Bayern)
Output: .../clubs-germany.json

📋 Schritt 1: Lade alle Ligen...
✅ 373 Ligen geladen

🏀 Schritt 2: Extrahiere Teams...
✅ 278 Clubs gefunden
✅ 450 Teams gefunden
✅ 2 Seasons gefunden (2024, 2025)

📞 Schritt 3: Lade Team-Details...
✅ 450 Teams mit Details

📞 Schritt 4: Lade Kontaktdaten...
✅ 45 kontaktData ergänzt

💾 Schritt 5: Speichere Daten...
✅ Gespeichert: clubs-germany.json
   Clubs: 278
   Teams: 450
   Seasons: 2

═══════════════════════════════════════════
✅ CRAWL ERFOLGREICH!
═══════════════════════════════════════════
```

---

## 🚨 Häufige Fehler

### 1. Saison-Parameter verwendet
```javascript
// ❌ FALSCH - Nur aktuelle Saison
body: JSON.stringify({ verbandIds: [2], saison: "2025/2026" })

// ✅ RICHTIG - Alle Saisons
body: JSON.stringify({ verbandIds: [2] })
```

### 2. seasonId von falscher Quelle
```javascript
// ❌ FALSCH - /wam/liga/list hat seasonId: null
const season = liga.seasonId;

// ✅ RICHTIG - ligaData aus /competition/table
const season = ligaData.seasonId;
```

### 3. Team-AK überschrieben
```javascript
// ❌ FALSCH - Team-AK ändert sich NICHT
team.teamAkj = ligaData.akName;

// ✅ RICHTIG - Nur beim ersten Setzen
if (!team.teamAkj) {
  team.teamAkj = teamDetails.teamAkj; // Von /team/.../matches
}
```

---

## ✅ Nächste Schritte

Nach dem Crawl:
1. Prüfe Output-Datei (clubs-germany.json)
2. Validiere Struktur: Club → Teams → Seasons → Ligen
3. Teste Queries (z.B. alle U10 Teams eines Clubs)
4. Importiere in Onboarding v3
5. Committen!

---

**Fragen?** 🤔
