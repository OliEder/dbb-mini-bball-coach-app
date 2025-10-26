# Club-Crawler - Quick Start

## 🚀 Empfohlen: Bulk Crawler (NEU)

```bash
cd basketball-app
npm run crawl:clubs:bulk
```

**Alle Verbände in 15-25 Minuten!** 🏆

- Crawlt ALLE Verbände auf einmal
- Keine API-Call Duplikate
- 15-20x schneller als alte Strategie
- Auto-Save alle 100 Ligen (Crash-Recovery)

**Details:** `docs/CRAWLER-BULK.md`

---

## 🐌 Single-Verband Crawl (Development)

```bash
cd basketball-app
npm run crawl:clubs -- --verband=2  # Bayern
```

**Alle Verbände:** Siehe `docs/STATISCHE-VERBAENDE.md`

---

## 🌍 ALL-Verbände Crawl

```bash
cd basketball-app
npm run crawl:clubs:all
```

**Crawlt:**
- 16 Landesverbände
- Deutsche Meisterschaften
- Regionalligen
- Bundesligen

**Laufzeit:** ~30-45 Minuten

---

## 📅 Automatisierung (Cron)

### Monatlich (empfohlen)

```bash
# Crontab öffnen
crontab -e

# Hinzufügen
0 2 1 * * cd /pfad/zu/Basketball-Apps/basketball-app && npm run crawl:clubs:all >> /var/log/basketball-crawler.log 2>&1
```

### Quartalsweise

```bash
# Januar, April, Juli, Oktober
0 2 1 1,4,7,10 * cd /pfad/zu/Basketball-Apps/basketball-app && npm run crawl:clubs:all >> /var/log/basketball-crawler.log 2>&1
```

**Details:** `docs/CRAWLER-AUTOMATION.md`

---

## 📊 Output

**Datei:** `src/shared/data/clubs-germany.json`

**Struktur:**
```json
{
  "metadata": {
    "crawledAt": "2025-10-22T14:30:00.000Z",
    "totalClubs": 1250,
    "totalTeams": 3500,
    "verbaende": [1, 2, 3, ...],
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

## 🔄 Merging

Das Script **merged** automatisch:
- Neue Clubs werden hinzugefügt
- Existierende Clubs werden aktualisiert
- Verbände werden zum `verbaende` Array hinzugefügt
- Teams/Seasons werden gemerged

**Backup:** `clubs-germany.backup-<timestamp>.json`

---

## 🛠️ Troubleshooting

### Script nicht ausführbar

```bash
chmod +x scripts/crawl-clubs-all.js
```

### "npm command not found" in Cron

```bash
# Vollständiger Pfad
which npm  # z.B. /usr/local/bin/npm

# In Crontab
0 2 1 * * cd /pfad && /usr/local/bin/npm run crawl:clubs:all
```

### Logs prüfen

```bash
tail -f /var/log/basketball-crawler.log
```

---

## 📚 Dokumentation

- **Technische Details:** `docs/CRAWLER-EXPLAINED.md`
- **API-Sequenz:** `docs/CRAWLER-V2-SEQUENZ.md`
- **Verbände:** `docs/STATISCHE-VERBAENDE.md`
- **Automation:** `docs/CRAWLER-AUTOMATION.md`

---

## 🧪 Test-Lauf

```bash
# Manuell testen
npm run crawl:clubs:all

# Mit Logging
npm run crawl:clubs:all >> /tmp/test.log 2>&1
cat /tmp/test.log

# Output prüfen
cat src/shared/data/clubs-germany.json | jq '.metadata'
```

---

**Version:** v3.0.0  
**Letzte Aktualisierung:** 2025-10-22
