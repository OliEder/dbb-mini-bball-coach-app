# Crawler Strategien - Vollständiger Vergleich

**Stand:** 2025-10-22

---

## 📊 Alle Crawler im Überblick

| Crawler | Command | Dauer | API Calls | Duplikate | Status |
|---------|---------|-------|-----------|-----------|--------|
| **Bulk** 🏆 | `crawl:clubs:bulk` | 15-25 min | ~10.000 | ❌ Nein | ✅ Production |
| **Incremental (v3.1)** | `crawl:clubs -- --verband=X` | 5-8 min | Verband-spezifisch | ✅ Ja | ✅ Development |
| **ALL (v3.1)** | `crawl:clubs:all` | 30-45 min | ~25.000 | ✅ Ja | ⚠️ Deprecated |
| **Old (v3.0)** | - | 6-8 h | ~50.000 | ✅ Ja | ❌ Veraltet |

---

## 🏆 Empfehlung nach Use Case

### Production: Bulk Crawler

```bash
npm run crawl:clubs:bulk
```

**Wann:**
- ✅ Initial Crawl
- ✅ Kompletter Refresh
- ✅ GitHub Actions (monatlich/quartalsweise)
- ✅ Schnellste Option für alle Verbände

**Vorteile:**
- 🚀 15-20x schneller als v3.0
- 🎯 Keine API-Duplikate
- 💾 Crash-Recovery (alle 100 Ligen)
- 📊 Deduplizierung nach teamPermanentId

**Nachteile:**
- ⚠️ Lädt immer ALLE Verbände (kein Cache)

---

### Development: Incremental Crawler

```bash
npm run crawl:clubs -- --verband=2 --skip-kontakt
```

**Wann:**
- ✅ Single-Verband Testing
- ✅ Schnelle Updates einzelner Verbände
- ✅ Mit Smart-Caching (<7 Tage)

**Vorteile:**
- ⚡ Smart-Caching (<1 sec bei Cache-Hit)
- 🎯 Nur gewünschter Verband
- 🔄 Merge mit existierenden Daten

**Nachteile:**
- ⚠️ API-Duplikate bei Multi-Verband Clubs
- ⚠️ Langsamer für alle Verbände

---

## 🔍 Strategie-Details

### Bulk Crawler (NEU)

```
1. API Call: Lade ALLE Ligen ohne Filter
   POST /wam/data { verbandIds: [] }
   → ~2000-3000 Ligen

2. Batch Processing: 10 parallel API Calls
   Batch 1: Ligen 1-10 → teamdetails parallel
   Batch 2: Ligen 11-20 → teamdetails parallel
   ...

3. Deduplizierung: Nach teamPermanentId
   Team "167863" in 5 Ligen → NUR 1x API Call

4. Periodic Flush: Alle 100 Ligen
   → Checkpoint auf Disk
   → Bei Crash: Max 100 Ligen verloren
```

**Output:** `clubs-germany.json` (komplett)

---

### Incremental Crawler (v3.1)

```
1. API Call: Lade Ligen für einen Verband
   POST /wam/data { verbandIds: [2] }
   → ~200-300 Ligen (Bayern)

2. Smart-Caching: Skip wenn <7 Tage
   Check metadata.verbandLastCrawled[2]
   → Bei Cache Hit: <1 sec, fertig

3. Team-Details: Pro Liga
   Liga "Bayernliga U10" → teamdetails
   Liga "Bayernliga U12" → teamdetails
   ...

4. Merge: Mit existierenden Daten
   Club bereits in Verband 29? → Merge verbaende
```

**Output:** `clubs-germany.json` (merged)

---

## 📈 Performance-Metriken

### Szenario 1: Erster Full Crawl

| Crawler | Dauer | Clubs | Teams | API Calls |
|---------|-------|-------|-------|-----------|
| Bulk | 18 min | 1250 | 3500 | 10.000 |
| Incremental (21x) | 2h 30min | 1250 | 3500 | 25.000 |
| Old | 6-8h | 1250 | 3500 | 50.000 |

**Winner:** Bulk (8x schneller als Incremental)

---

### Szenario 2: Single-Verband Update

| Crawler | Dauer | Use Case |
|---------|-------|----------|
| Incremental (cached) | <1 sec | Update innerhalb 7 Tage |
| Incremental (force) | 6 min | Update nach >7 Tage |
| Bulk | 18 min | Overkill für 1 Verband |

**Winner:** Incremental (mit Cache)

---

### Szenario 3: Monatlicher GitHub Actions Run

| Crawler | Dauer | Kosten (Minutes) |
|---------|-------|------------------|
| Bulk | 18 min | 18 |
| Incremental (all) | 45 min | 45 |
| Old | N/A | Timeout |

**Winner:** Bulk (spart 27 Minutes)

---

## 🎯 Migration Guide

### Von v3.0 → Bulk

```bash
# Alt (deprecated)
npm run crawl:clubs:all

# Neu (empfohlen)
npm run crawl:clubs:bulk
```

**Änderungen:**
- ✅ Gleiche Output-Struktur
- ✅ Keine Code-Änderungen nötig
- ✅ 15-20x schneller

---

### Von Incremental → Bulk

```bash
# Development: Incremental
npm run crawl:clubs -- --verband=2

# Production: Bulk
npm run crawl:clubs:bulk
```

**Use Cases:**
- Incremental: Quick Tests, Single-Verband
- Bulk: Full Refresh, GitHub Actions

---

## 🔧 Optionen & Flags

### Bulk Crawler

```bash
# Standard
npm run crawl:clubs:bulk

# Fast-Mode (empfohlen)
npm run crawl:clubs:bulk -- --skip-kontakt
```

**Flags:**
- `--skip-kontakt`: Überspringt Kontaktdaten (~20% schneller)

---

### Incremental Crawler

```bash
# Standard
npm run crawl:clubs -- --verband=2

# Fast-Mode
npm run crawl:clubs -- --verband=2 --skip-kontakt

# Force (ignoriert Cache)
npm run crawl:clubs -- --verband=2 --force

# Kombiniert
npm run crawl:clubs -- --verband=2 --force --skip-kontakt
```

**Flags:**
- `--skip-kontakt`: Überspringt Kontaktdaten
- `--force`: Ignoriert Smart-Caching (<7 Tage)

---

## 📁 Output-Struktur (gleich bei allen)

```json
{
  "metadata": {
    "crawledAt": "2025-10-22T16:30:00.000Z",
    "crawlStrategy": "bulk | incremental",
    "totalClubs": 1250,
    "totalTeams": 3500,
    "verbaende": [1, 2, ..., 100],
    "verbandLastCrawled": {
      "2": {
        "timestamp": "2025-10-22T14:00:00.000Z",
        "ligaCount": 373
      }
    }
  },
  "clubs": [
    {
      "clubId": "619",
      "vereinsname": "FC Bayern München",
      "verbaende": [2, 29, 100],
      "teams": [...]
    }
  ]
}
```

---

## 🚀 GitHub Actions Empfehlung

```yaml
# .github/workflows/crawler.yml
- name: 🏀 Run Bulk Crawler
  working-directory: basketball-app
  run: npm run crawl:clubs:bulk -- --skip-kontakt
```

**Warum Bulk?**
- ✅ Schnellste Option (18 min statt 45 min)
- ✅ Spart GitHub Actions Minutes
- ✅ Keine Cache-Komplexität
- ✅ Immer komplette Daten

---

## 📚 Dokumentation

| Thema | Dokument |
|-------|----------|
| **Bulk Crawler** | `docs/CRAWLER-BULK.md` |
| **Optimierungen** | `docs/CRAWLER-OPTIMIZATIONS.md` |
| **Quick Start** | `docs/CRAWLER-QUICKSTART.md` |
| **Automation** | `docs/CRAWLER-AUTOMATION.md` |
| **Verbände** | `docs/STATISCHE-VERBAENDE.md` |

---

## ✅ Decision Tree

```
Brauchst du alle Verbände?
  ├─ Ja → Bulk Crawler (18 min)
  └─ Nein → Incremental Crawler
      ├─ <7 Tage gecrawlt? → Cached (<1 sec)
      ├─ >7 Tage gecrawlt? → Re-Crawl (6 min)
      └─ Nie gecrawlt? → Fresh Crawl (6 min)

GitHub Actions?
  └─ Bulk Crawler (empfohlen)

Development/Testing?
  └─ Incremental Crawler
```

---

## 🎯 Zusammenfassung

**Production:** Bulk Crawler 🏆  
**Development:** Incremental Crawler  
**Deprecated:** ALL Crawler  

**Speedup:** 15-20x schneller als v3.0!

---

**Version:** v4.0.0  
**Datum:** 2025-10-22  
**Status:** ✅ Production Ready
