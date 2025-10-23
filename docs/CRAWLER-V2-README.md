# BBB Club Crawler v2 - Dokumentation

## 📚 Übersicht

Diese Dokumentation beschreibt den überarbeiteten Club-Crawler mit folgenden Features:

- ✅ **Non-Destructive Updates** - Bestehende Daten bleiben erhalten
- ✅ **Season-basierte Struktur** - Historische Daten pro Saison
- ✅ **Multi-Verband Support** - Mehrere Verbände in einer Datei
- ✅ **Smart Merge** - Intelligentes Zusammenführen von Daten
- ✅ **Automatische Backups** - Sicherung vor jedem Schreibvorgang
- ✅ **Zusätzlicher Club-Endpoint** - Fehlende Kontaktdaten ergänzen

---

## 📖 Dokumentations-Dateien

### 1. [CRAWLER-V2-ABLAUF.md](./CRAWLER-V2-ABLAUF.md)
**Ablaufdiagramm** des kompletten Crawl-Prozesses von Start bis Ende.

**Inhalt:**
- Flowchart mit allen Schritten
- Entscheidungspunkte
- Error-Handling
- Backup-Strategie

### 2. [CRAWLER-V2-STRUKTUR.md](./CRAWLER-V2-STRUKTUR.md)
**Datenstruktur-Transformation** von API-Responses zur finalen JSON.

**Inhalt:**
- API-Response-Strukturen
- Transformations-Flow
- Finale JSON-Hierarchie
- Vorteile der Struktur

### 3. [CRAWLER-V2-SEQUENZ.md](./CRAWLER-V2-SEQUENZ.md)
**API-Call Sequenz** zeigt die Reihenfolge aller HTTP-Requests.

**Inhalt:**
- Sequenzdiagramm
- API-Endpunkte im Detail
- Timing-Informationen
- Response-Strukturen

### 4. [CRAWLER-V2-USECASES.md](./CRAWLER-V2-USECASES.md)
**Use Cases** mit konkreten Beispielen für verschiedene Szenarien.

**Inhalt:**
- Initiales Crawling
- Weitere Verbände hinzufügen
- Neue Saison hinzufügen
- Fehlende Daten ergänzen
- Rollback bei Fehler
- Alle Verbände crawlen

### 5. [CRAWLER-V2-MERGE-LOGIC.md](./CRAWLER-V2-MERGE-LOGIC.md) *(wird noch erstellt)*
**Merge-Logik** als Pseudo-Code mit allen Regeln.

**Inhalt:**
- Laden existierender Daten
- Backup-Erstellung
- Smart Merge-Algorithmus
- Club-Endpoint für kontaktData
- Konvertierung Maps → Arrays

---

## 🚀 Schnellstart

```bash
# Initiales Crawling für Bayern
npm run crawl:clubs -- --verband=2

# Saarland hinzufügen (non-destructive!)
npm run crawl:clubs -- --verband=9

# Nochmal Bayern crawlen (ergänzt fehlende Daten)
npm run crawl:clubs -- --verband=2
```

---

## 📊 Finale Datenstruktur

```
Club (clubId, vereinsname, vereinsnummer, kontaktData, verbaende)
  └─ Teams (teamPermanentId, teamAkj, teamGender, teamNumber) ← FIX!
      └─ Seasons (seasonId, seasonName)
          └─ Ligen (teamCompetitionId, ligaId, liganame, akName)
```

**Wichtig:**
- **teamAkj ist PERMANENT** (z.B. U10 bleibt U10)
- Team kann in **höheren** Ligen spielen (U10 in U12)
- Team kann **NICHT** in niedrigeren Ligen spielen

**Beispiel:**
```json
{
  "clubId": "619",
  "vereinsname": "FC Bayern München e.V.",
  "vereinsnummer": "0212033",
  "verbaende": [2],
  "teams": [
    {
      "teamPermanentId": "167863",
      "teamAkj": "U10",  // ← FIX! Team bleibt U10
      "teamGender": "m",
      "teamNumber": 3,
      "seasons": [
        {
          "seasonId": 2025,
          "seasonName": "2025/2026",
          "ligen": [
            {
              "ligaId": "48014",
              "liganame": "U12 Bezirksliga",
              "akName": "U12"  // ← Liga kann höher sein!
            }
          ]
        }
      ]
    }
  ]
}
```

---

## ⚙️ Wichtige Merge-Regeln

1. ✅ Bestehende JSON laden als Basis
2. ✅ Backup erstellen (Timestamp)
3. ✅ Nur null-Werte überschreiben
4. ✅ Nur truthy-Werte verwenden
5. ✅ `vereinId` NICHT übernehmen (= clubId)
6. ✅ Ligen-Arrays erweitern (keine Duplikate)
7. ✅ Maps für schnelles Lookup nutzen
8. ✅ Club-Endpoint für fehlende kontaktData

---

## 🔍 API-Endpunkte

| Endpunkt | Zweck | Wichtig |
|----------|-------|---------|
| `/wam/liga/list` | Ligen-Liste | ❌ seasonId: null |
| `/competition/table/id/:ligaId` | Tabellen + Teams | ✅ seasonId: 2025 |
| `/team/id/:teamId/matches` | Team + Club Details | Team-Daten |
| `/club/id/:clubId/actualmatches` | Kontaktdaten | kontaktData |

---

## 📝 Nächste Schritte

1. ✅ Dokumentation reviewen
2. ⏳ Merge-Logic Pseudo-Code erstellen
3. ⏳ Implementation des Scripts
4. ⏳ Tests schreiben
5. ⏳ CI/CD Integration

---

## ❓ Fragen & Feedback

Bei Fragen oder Verbesserungsvorschlägen siehe die einzelnen Dokumentations-Dateien oder erstelle ein Issue.
