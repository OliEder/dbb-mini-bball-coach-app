# DBB Basketball API - Dokumentation

Vollständige Dokumentation der REST API von basketball-bund.net

---

## 📚 Inhalt

1. **OpenAPI Specification** (`dbb-api-spec-v3.yaml`)
   - Vollständige API-Dokumentation
   - Alle Endpoints
   - Request/Response Schemas
   - Beispiele

2. **Bruno Collection** (`basketball-bund-net/`)
   - API-Tests
   - Live-Requests
   - Authentifizierung: Keine erforderlich

3. **Response-Beispiele** (JSON-Dateien)
   - Reale API-Responses
   - Verschiedene Filter-Kombinationen
   - U10 Ligen Bayern

---

## 🚀 Quick Start

### OpenAPI Spec öffnen

```bash
# Option 1: Swagger Editor (Online)
https://editor.swagger.io/
# → Datei dbb-api-spec-v3.yaml hochladen

# Option 2: VS Code Extension
code --install-extension 42Crunch.vscode-openapi
# → Datei öffnen
```

### Bruno Collection verwenden

```bash
# Bruno installieren
https://www.usebruno.com/downloads

# Collection öffnen
# → Ordner basketball-bund-net/ öffnen
```

---

## 📋 API-Übersicht

### Hauptendpoints

| Endpoint | Methode | Beschreibung |
|----------|---------|-------------|
| `/rest/wam/data` | POST | Liga-Suche & Filter |
| `/rest/competition/table/id/{ligaId}` | GET | Tabelle |
| `/rest/competition/spielplan/id/{ligaId}` | GET | Spielplan |
| `/rest/competition/crosstable/id/{ligaId}` | GET | Kreuztabelle |
| `/rest/match/id/{matchId}/matchInfo` | GET | Match-Details |

---

## 🔍 Typischer Workflow

### 1. Liga suchen

```bash
curl -X POST https://www.basketball-bund.net/rest/wam/data \
  -H "Content-Type: application/json" \
  -d '{
    "token": 0,
    "verbandIds": [2],
    "gebietIds": ["4_"],
    "altersklasseIds": [10],
    "spielklasseIds": [320]
  }'
```

**Response:** Liga-Liste mit `ligaId: 51961`

### 2. Tabelle laden

```bash
curl https://www.basketball-bund.net/rest/competition/table/id/51961
```

### 3. Spielplan laden

```bash
curl https://www.basketball-bund.net/rest/competition/spielplan/id/51961
```

---

## 📊 Filter-Parameter

### Verbände (verbandIds)

```json
{
  "1": "Baden-Württemberg",
  "2": "Bayern",
  "3": "Berlin",
  "4": "Bremen",
  "5": "Hamburg",
  "6": "Hessen",
  "7": "Niedersachsen",
  "8": "Rheinland-Pfalz",
  "9": "Saarland",
  "10": "Schleswig-Holstein",
  "11": "Nordrhein-Westfalen"
}
```

### Altersklassen (altersklasseIds)

```json
{
  "8": "U8",
  "9": "U9",
  "10": "U10",
  "11": "U11",
  "12": "U12",
  "14": "U14",
  "15": "U15",
  "16": "U16",
  "18": "U18",
  "20": "U20"
}
```

### Spielklassen (spielklasseIds)

```json
{
  "337": "Bay. Meisterschaft",
  "338": "Bezirksoberliga",
  "320": "Bezirksliga",
  "325": "Bezirksklasse",
  "330": "Kreisliga",
  "335": "Kreisklasse"
}
```

### Bayern Gebiete (gebietIds)

```json
{
  "1_": "Oberbayern",
  "2_": "Schwaben",
  "3_": "Mittelfranken",
  "4_": "Oberpfalz",
  "5_": "Oberfranken",
  "6_": "Unterfranken"
}
```

---

## 📁 Dateien

### OpenAPI Specs

- `dbb-api-spec-v3.yaml` ⭐ **AKTUELL** - Vollständige Spec
- `dbb-api-spec-corrected.yaml` - Vorherige Version

### Response-Beispiele

- `post-wam-data-bayern-u10-oberpflaz_mittelfranken.json` - 10 U10 Ligen
- `post-wam-data-bayern-u10.json` - 5 U10 Bezirksligen
- `wam-data-bayern-oberpfalz.json` - Alle Ligen Oberpfalz
- `wam-data-bayern.json` - Alle Ligen Bayern
- `wam-data.json` - Alle Optionen

### Bruno Collection

```
basketball-bund-net/
├── collection.bru              # Collection-Metadaten
├── wam-data.bru               # Filter-Endpoint
├── competition-list.bru       # Liga-Liste
├── competition-id-*.bru       # Liga-Details
├── competition-table-*.bru    # Tabelle
├── competition-spielplan-*.bru # Spielplan
├── competition-actual-*.bru   # Aktueller Stand
├── competition-crosstable-*.bru # Kreuztabelle
├── competition-teamstatistic-*.bru # Team-Stats
├── match-id-*.bru            # Match-Details
└── environments/             # Test-Umgebungen
```

---

## 🔗 PWA Integration

Siehe: `docs/development/DBB-API-EVALUATION.md`

**Wichtige Erkenntnisse:**
- ✅ Vollständige Liga-Daten verfügbar
- ✅ Alle Spiele (nicht nur eigene)
- ✅ Kreuztabelle für Benchmark-Analysen
- ✅ Konsistentes Datenmodell
- ⚠️ CORS-Proxy erforderlich

---

## 📝 Notizen

### Authentifizierung

Keine Authentifizierung erforderlich - alle Endpoints sind öffentlich.

### Rate-Limiting

Unbekannt. Empfehlung:
- Max. 1 Request pro Sekunde
- Caching verwenden

### CORS

Direkte Requests aus dem Browser funktionieren nicht!

**Lösung:**
1. CORS-Proxy verwenden (siehe PWA `BBBParserService`)
2. Eigener Backend-Proxy
3. Server-Side Rendering

---

## 🛠️ Tools

### OpenAPI Tools

- **Swagger Editor**: https://editor.swagger.io/
- **Redoc**: `npx redoc-cli serve dbb-api-spec-v3.yaml`
- **VS Code Extension**: 42Crunch OpenAPI

### API Testing

- **Bruno**: https://www.usebruno.com/
- **Postman**: Import OpenAPI Spec
- **curl**: Command Line

---

## 📚 Weiterführende Dokumentation

- [DBB Website](https://www.basketball-bund.net)
- [PWA Integration Guide](../basketball-app/docs/development/DBB-API-EVALUATION.md)
- [OpenAPI Specification](https://spec.openapis.org/oas/v3.0.0)

---

## ✅ Changelog

### v3.0.0 (14.10.2025)
- ✅ Vollständige OpenAPI Spec
- ✅ Validiert mit realen Responses
- ✅ U8-U14 Altersklassen dokumentiert
- ✅ Bayern-spezifische Filter
- ✅ Alle wichtigen Endpoints

### v2.0.0 (13.10.2025)
- ✅ Korrigierte Filter-Logik
- ✅ Bruno Collection erstellt

### v1.0.0 (Vorher)
- ✅ Initiale API-Dokumentation

---

**Status:** ✅ Production Ready  
**Letzte Aktualisierung:** 14. Oktober 2025
