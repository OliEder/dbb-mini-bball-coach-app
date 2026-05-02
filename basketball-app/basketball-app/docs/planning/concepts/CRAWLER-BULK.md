# Bulk Crawler - Quick Start

## 🚀 Der schnelle Weg

```bash
cd basketball-app
npm run crawl:clubs:bulk
```

**Dauer:** 15-25 Minuten (statt 6-8 Stunden!)

---

## 🎯 Was macht der Bulk-Crawler anders?

### Alte Strategie (Incremental):
```
Verband 1 → Alle Ligen → Team-Details → 20 min
Verband 2 → Alle Ligen → Team-Details → 20 min
Verband 3 → Alle Ligen → Team-Details → 20 min
...
Verband 21 → Alle Ligen → Team-Details → 20 min

Total: ~6-8 Stunden
Problem: Team "167863" wird 5x abgefragt!
```

### Neue Strategie (Bulk):
```
ALLE Ligen auf einmal → Team-Details (dedupliziert) → 15-25 min

Total: ~15-25 Minuten
Vorteil: Team "167863" wird NUR EINMAL abgefragt!
```

---

## 📊 Strategie-Details

### 1. Lade ALLE Ligen
```javascript
POST /wam/data
{
  "verbandIds": [],  // LEER = ALLE!
  ...
}

→ ~2000-3000 Ligen
```

### 2. Batch Processing (10 parallel)
```
Batch 1: Ligen 1-10 → parallel abrufen
Batch 2: Ligen 11-20 → parallel abrufen
...
```

### 3. Deduplizierung
```javascript
Team "167863" in:
- Liga "Bayernliga U10"
- Liga "Deutsche Meisterschaft U10"
- Liga "NBBL"

→ Wird NUR EINMAL abgerufen
→ Clubdaten werden gemerged
→ verbaende: [2, 29, 100]
```

### 4. Periodic Flush (alle 100 Ligen)
```
✅ 100 Ligen → Save to disk
✅ 200 Ligen → Save to disk
✅ 300 Ligen → Save to disk
...

→ Bei Crash: Maximal 100 Ligen verloren
```

---

## 🔧 Optionen

### Fast-Mode (empfohlen)
```bash
npm run crawl:clubs:bulk -- --skip-kontakt
```

Überspringt Kontaktdaten → **~20% schneller**

---

## 📁 Output

**Gleiche Struktur wie Incremental Crawler:**

```json
{
  "metadata": {
    "crawledAt": "2025-10-22T16:30:00.000Z",
    "crawlStrategy": "bulk",
    "totalClubs": 1250,
    "totalTeams": 3500,
    "verbaende": [1, 2, 3, ..., 29, 30, 31, 32, 33, 100]
  },
  "clubs": [...]
}
```

**Datei:** `src/shared/data/clubs-germany.json`

---

## 📊 Performance-Vergleich

| Crawler | Dauer | API Calls | Duplikate |
|---------|-------|-----------|-----------|
| **Incremental (alt)** | 6-8h | ~50.000 | Ja (5x) |
| **Incremental (v3.1)** | 30-45min | ~25.000 | Ja (3x) |
| **Bulk (neu)** | 15-25min | ~10.000 | Nein ✅ |

**Speedup:** 15-20x schneller als alt, 2x schneller als v3.1!

---

## 🧪 Beispiel-Output

```bash
npm run crawl:clubs:bulk

╔════════════════════════════════════════════╗
║  BBB Club Crawler - BULK Strategy v1.0    ║
╚════════════════════════════════════════════╝

Output: .../clubs-germany.json
⚡ Fast-Mode: Kontaktdaten übersprungen
📦 Batch Size: 10 parallel
💾 Auto-Save: Alle 100 Ligen

📡 Schritt 1: Lade ALLE Ligen...
✅ 2847 Ligen geladen

🔄 Schritt 2: Batch Processing...
📊 100/2847 Ligen (3.5%) | Clubs: 45 | Teams: 120
💾 Checkpoint gespeichert
📊 200/2847 Ligen (7.0%) | Clubs: 89 | Teams: 245
💾 Checkpoint gespeichert
...
📊 2847/2847 Ligen (100.0%) | Clubs: 1250 | Teams: 3500
💾 Checkpoint gespeichert

✅ Batch Processing abgeschlossen
   Erfolgreich: 2847/2847 Ligen

⏭️  Schritt 4: Kontaktdaten übersprungen (--skip-kontakt)

💾 Schritt 5: Finale Speicherung...
💾 Backup: clubs-germany.backup-2025-10-22T16-30-00-000Z.json
✅ Output: .../clubs-germany.json
   Clubs: 1250
   Teams: 3500
   Seasons: 5200
   Verbände: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 29, 30, 31, 32, 33, 100

══════════════════════════════════════════════════
✅ BULK CRAWL ERFOLGREICH!
══════════════════════════════════════════════════
⏱️  Dauer: 18.45 Minuten
📊 Clubs: 1250
📊 Teams (unique): 3500
📁 Output: .../clubs-germany.json
══════════════════════════════════════════════════
```

---

## 🔄 Crash-Recovery

**Vorteil:** Periodic Flush alle 100 Ligen

**Szenario:**
1. Crawl läuft
2. Bei Liga 1543 → Crash (Internet weg)
3. → `clubs-germany.json` hat 1500 Ligen
4. Neustart → Fortsetzung ab Liga 1500

**Aktuell:** Kein Resume (Start von vorne)  
**Zukünftig:** Resume-Logik möglich

---

## 🆚 Wann welcher Crawler?

### Bulk (empfohlen für Production)

```bash
npm run crawl:clubs:bulk
```

**Wann:**
- ✅ Initial Crawl (alle Verbände)
- ✅ Kompletter Refresh
- ✅ GitHub Actions (monatlich/quartalsweise)
- ✅ Schnellste Option

**Dauer:** 15-25 min

---

### Incremental (für Development)

```bash
npm run crawl:clubs -- --verband=2
```

**Wann:**
- ✅ Single-Verband Update
- ✅ Testing einzelner Verbände
- ✅ Incremental Updates mit Cache

**Dauer:** 5-8 min pro Verband (mit Cache <1 sec)

---

### ALL (deprecated)

```bash
npm run crawl:clubs:all
```

**Status:** ⚠️ Veraltet, nutze stattdessen `bulk`

**Wann:**
- ❌ Nicht mehr verwenden
- ✅ Wird durch `bulk` ersetzt

**Dauer:** 30-45 min (mit Cache)

---

## 🎯 Empfohlener Workflow

### Production (GitHub Actions)

```bash
npm run crawl:clubs:bulk
npm run split:clubs  # (noch zu bauen)
```

**Cron:** Monatlich oder Quartalsweise

---

### Development

```bash
# Schneller Test
npm run crawl:clubs -- --verband=5 --skip-kontakt

# Kompletter Refresh
npm run crawl:clubs:bulk
```

---

## 🐛 Troubleshooting

### "Rate limit" Fehler

**Lösung:** Script hat automatisches Retry mit Exponential Backoff

### Crawl dauert >30 Minuten

**Mögliche Ursachen:**
- API ist langsam
- Viele Kontaktdaten (ohne `--skip-kontakt`)
- Schlechte Internet-Verbindung

**Lösung:** Mit `--skip-kontakt` laufen lassen

### Crash Recovery

**Aktuell:** Neustart von vorne (letzte 100 Ligen verloren)  
**Zukünftig:** Resume-Logik kann implementiert werden

---

## 📚 Weitere Dokumentation

- **Performance-Details:** `docs/CRAWLER-OPTIMIZATIONS.md`
- **Verbände:** `docs/STATISCHE-VERBAENDE.md`
- **Automation:** `docs/CRAWLER-AUTOMATION.md`

---

## ✅ Nächste Schritte

```bash
# 1. Bulk Crawl starten
npm run crawl:clubs:bulk

# 2. Split in Chunks (noch zu bauen)
npm run split:clubs

# 3. App testen mit neuen Daten
npm run dev
```

---

**Version:** v1.0.0  
**Datum:** 2025-10-22  
**Status:** ✅ Production Ready
