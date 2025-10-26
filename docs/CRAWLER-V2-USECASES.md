# BBB Club Crawler v2 - Use Cases

## Use Case 1: Initiales Crawling (Bayern)

```bash
npm run crawl:clubs -- --verband=2
```

**Output:**
```
📂 Keine existierende Datei gefunden
📋 Schritt 1: Lade alle Ligen...
✅ 373 Ligen geladen

🏀 Schritt 2: Extrahiere Teams...
✅ 278 Clubs mit Teams gefunden

📞 Schritt 3: Lade Team-Details...
✅ 450 Team-Details geladen

📞 Schritt 4: Lade fehlende Kontaktdaten...
📞 120 Clubs ohne kontaktData
✅ 45 kontaktData ergänzt

💾 Schritt 5: Speichere Daten...
✅ Gespeichert: clubs-germany.json
   Clubs: 278
   Teams: 450
```

---

## Use Case 2: Weiterer Verband hinzufügen (Saarland)

```bash
npm run crawl:clubs -- --verband=9
```

**Output:**
```
📂 Lade existierende Daten... (278 Clubs)
✅ Backup erstellt: clubs-germany.backup-1729600000.json

📋 Schritt 1: Lade alle Ligen...
✅ 25 Ligen geladen

🏀 Schritt 2: Extrahiere Teams...
📊 Neue Daten: 5 neue Clubs, 0 neue Seasons, 12 neue Teams
✅ 285 Clubs gesamt

📞 Schritt 3: Lade Team-Details...
✅ 462 Teams geladen (450 bestehend, 12 neu)

📞 Schritt 4: Lade fehlende Kontaktdaten...
✅ 3 kontaktData ergänzt

💾 Gespeichert: clubs-germany.json (283 Clubs)
```

**Ergebnis:**
- Bayern-Daten: ✅ Erhalten
- Saarland-Daten: ✅ Hinzugefügt
- Clubs in beiden Verbänden: `verbaende: [2, 9]`

---

## Use Case 3: Neue Saison hinzufügen

```bash
# Saison 2025/2026 ist gestartet
npm run crawl:clubs -- --verband=2
```

**Output:**
```
📂 Lade existierende Daten... (283 Clubs)
✅ Backup erstellt: clubs-germany.backup-1729700000.json

📊 Neue Daten: 0 neue Clubs, 1 neue Season, 450 neue Teams
✅ 900 Teams geladen (450 alt, 450 neu)

💾 Gespeichert: clubs-germany.json
```

**Ergebnis:**
```json
{
  "clubId": "619",
  "vereinsname": "FC Bayern München e.V.",
  "teams": [
    {
      "teamPermanentId": "167863",
      "teamAkj": "U10",  // ← FIX!
      "seasons": [
        {
          "seasonId": 2025,
          "seasonName": "2025/2026",
          "ligen": [...]  // NEU
        },
        {
          "seasonId": 2024,
          "seasonName": "2024/2025",
          "ligen": [...]  // BEHALTEN
        }
      ]
    }
  ]
}
```

---

## Use Case 4: Fehlende kontaktData ergänzen

```bash
# Script nochmal laufen lassen
npm run crawl:clubs -- --verband=2
```

**Output:**
```
📂 Lade existierende Daten... (283 Clubs)
📊 Neue Daten: 0 neue Clubs, 0 neue Seasons, 0 neue Teams
📞 75 Clubs ohne kontaktData
✅ 18 kontaktData ergänzt
```

**Nutzen:** Jeder weitere Lauf kann mehr Kontaktdaten finden!

---

## Use Case 5: Rollback bei Fehler

```bash
# Wenn Crawler abbricht oder Daten korrupt:
ls -la basketball-app/src/shared/data/*.backup*

# Manuelles Rollback:
cp clubs-germany.backup-1729800000.json clubs-germany.json
```

---

## Use Case 6: Alle Verbände crawlen

```bash
#!/bin/bash
# crawl-all-verbaende.sh

VERBAENDE=(1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16)

for verband in "${VERBAENDE[@]}"; do
  echo "Crawle Verband $verband..."
  npm run crawl:clubs -- --verband=$verband
  
  if [ $? -eq 0 ]; then
    echo "✅ Verband $verband erfolgreich"
  else
    echo "❌ Verband $verband fehlgeschlagen"
  fi
  
  # Pause zwischen Verbänden
  sleep 60
done

echo "✅ Alle Verbände gecrawlt!"
```

**Ergebnis:**
- `clubs-germany.json` enthält ALLE Verbände
- Clubs können in mehreren Verbänden sein
- Historie bleibt erhalten
- Backup für jeden Durchlauf

---

## Vorteile des Non-Destructive Ansatzes

✅ **Inkrementelle Updates** - Kein vollständiger Re-Crawl nötig
✅ **Multi-Verband** - Mehrere Verbände in einer Datei
✅ **Historisch** - Alte Seasons bleiben erhalten
✅ **Backup** - Automatisch bei jedem Lauf
✅ **Rollback** - Jederzeit möglich
✅ **Fehlende Daten** - Können nachträglich ergänzt werden
✅ **Keine Duplikate** - Smart Merge verhindert doppelte Einträge
✅ **Unterbrechbar** - Kann jederzeit neu gestartet werden
✅ **Transparent** - Metadata zeigt was sich geändert hat

---

## Metadata-Beispiel

```json
{
  "metadata": {
    "crawledAt": "2025-10-22T16:00:00Z",
    "totalClubs": 283,
    "totalSeasons": 2,
    "totalTeams": 900,
    "verbaende": [2, 9],
    "note": "Struktur: Club → Teams → Seasons → Ligen",
    "lastUpdated": {
      "newClubs": 5,
      "newSeasons": 1,
      "newTeams": 450,
      "teamDetailsLoaded": 450,
      "kontaktDataLoaded": 18
    }
  }
}
```

Zeigt genau was beim letzten Lauf passiert ist!
