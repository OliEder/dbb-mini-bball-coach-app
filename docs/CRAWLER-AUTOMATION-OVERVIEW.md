# 🏀 Basketball Crawler - Automation Übersicht

**Stand:** 2025-10-22

---

## 🎯 Welche Lösung ist die richtige?

| Kriterium | GitHub Actions ✅ | Lokaler Cron | Manuell |
|-----------|-------------------|--------------|---------|
| **Setup-Aufwand** | Niedrig | Mittel | - |
| **Kosten** | Kostenlos | Server nötig | - |
| **Wartung** | Minimal | Mittel | - |
| **Logs** | GitHub UI | Log-Datei | Terminal |
| **Auto-Commit** | Ja | Optional | Nein |
| **Fehler-Alarm** | GitHub Issue | E-Mail/Script | - |
| **Backups** | Artifacts (90d) | Manuell | Manuell |
| **Empfohlen** | 🌟🌟🌟 | 🌟🌟 | 🌟 |

**➡️ Empfehlung: GitHub Actions** (kostenlos, wartungsarm, in Git integriert)

---

## 🚀 Option 1: GitHub Actions (Empfohlen)

### Setup (5 Minuten)

```bash
# Workflows sind bereits erstellt!
git add .github/workflows/
git commit -m "feat: Add GitHub Actions Crawler"
git push

# Fertig! Läuft ab jetzt automatisch.
```

### Manuell ausführen

1. GitHub → **Actions**
2. **"Basketball Club Crawler"** wählen
3. **"Run workflow"** klicken
4. Optional: Verband-ID eingeben (z.B. `2`)
5. **"Run workflow"** bestätigen

### Schedule-Optionen

**Monatlich** (`crawler.yml`):
```yaml
schedule:
  - cron: '0 2 1 * *'  # Jeden 1. um 02:00 UTC
```

**Quartalsweise** (`crawler-quarterly.yml`):
```yaml
schedule:
  - cron: '0 2 1 1,4,7,10 *'  # Jan/Apr/Jul/Okt
```

### Features

✅ Automatischer Crawl  
✅ Auto-Commit & Push  
✅ Backup als Artifact (90 Tage)  
✅ Issue bei Fehler  
✅ Logs in GitHub UI  
✅ Kostenlos (Public Repos)  
✅ Keine Server nötig  

### Dokumentation

📖 `.github/workflows/README.md`

---

## 🐧 Option 2: Lokaler Cron-Job (Linux/macOS)

### Setup

```bash
# 1. Wrapper-Script erstellen
cat > ~/crawl-basketball.sh << 'EOF'
#!/bin/bash
cd ~/Basketball-Apps/basketball-app
npm run crawl:clubs:all >> /var/log/basketball-crawler.log 2>&1
EOF

chmod +x ~/crawl-basketball.sh

# 2. Crontab konfigurieren
crontab -e

# 3. Zeile hinzufügen (monatlich)
0 2 1 * * ~/crawl-basketball.sh
```

### Schedule-Optionen

**Monatlich:**
```bash
0 2 1 * * ~/crawl-basketball.sh
```

**Quartalsweise:**
```bash
0 2 1 1,4,7,10 * ~/crawl-basketball.sh
```

**Wöchentlich (nicht empfohlen):**
```bash
0 2 * * 0 ~/crawl-basketball.sh  # Jeden Sonntag
```

### Features

✅ Volle Kontrolle  
✅ Läuft offline  
⚠️ Server/PC muss laufen  
⚠️ Manuelle Commits nötig  
⚠️ Log-Management selbst  

### Dokumentation

📖 `docs/CRAWLER-AUTOMATION.md` (Abschnitt "Linux Cron Setup")

---

## 🪟 Option 3: Windows Task Scheduler

### Setup

```powershell
# 1. Script erstellen (run-crawler.ps1)
Set-Location "C:\Basketball-Apps\basketball-app"
npm run crawl:clubs:all | Out-File -Append "C:\Logs\crawler.log"

# 2. Task Scheduler öffnen
# 3. Aufgabe erstellen
#    - Trigger: Monatlich, 1. Tag, 02:00
#    - Aktion: PowerShell Script ausführen
```

### Features

✅ Integriert in Windows  
⚠️ PC muss laufen  
⚠️ Manuelle Commits  

### Dokumentation

📖 `docs/CRAWLER-AUTOMATION.md` (Abschnitt "Windows Task Scheduler")

---

## 🖱️ Option 4: Manuell (Development)

### Verwendung

```bash
# Alle Verbände
cd basketball-app
npm run crawl:clubs:all

# Single Verband
npm run crawl:clubs -- --verband=2  # Bayern
```

### Wann verwenden?

- 🧪 Testing während Entwicklung
- 🐛 Debugging einzelner Verbände
- 📊 Ad-hoc Updates

---

## 📊 Vergleich: Laufzeit & Kosten

| Lösung | Laufzeit | Kosten/Monat | Setup-Zeit |
|--------|----------|--------------|------------|
| GitHub Actions | 45 min | €0 (Public) | 5 min |
| Lokaler Cron | 45 min | €0 (Hardware da) | 15 min |
| Windows Task | 45 min | €0 (Hardware da) | 20 min |
| Manuell | 45 min | - | 0 min |

**GitHub Actions Free Tier:**
- Public Repos: ♾️ Unbegrenzt
- Private Repos: 2000 Minutes/Monat
- **Monatlicher Crawl:** 45 Minutes (passt easy!)

---

## 🎯 Empfehlung nach Use Case

### Production (empfohlen)

**→ GitHub Actions** (`crawler.yml` - monatlich)

✅ Keine Infrastruktur  
✅ Automatische Commits  
✅ Fehler-Monitoring  
✅ Kostenlos  

---

### Low-Maintenance

**→ GitHub Actions** (`crawler-quarterly.yml` - quartalsweise)

✅ Reduzierte Minutes  
✅ Ausreichend für die meisten Cases  
✅ Aligned mit Basketball-Saison  

---

### Offline / Selbst-Hosted

**→ Lokaler Cron** (Linux/macOS)

✅ Volle Kontrolle  
✅ Keine externe Abhängigkeit  
⚠️ Server muss laufen  

---

### Development / Testing

**→ Manuell** (`npm run crawl:clubs:all`)

✅ Volle Kontrolle  
✅ Sofortiges Feedback  
✅ Einzelne Verbände testbar  

---

## 🔄 Migration zwischen Lösungen

### Von Manuell → GitHub Actions

```bash
git add .github/workflows/
git commit -m "feat: Add GitHub Actions Crawler"
git push
```

**Fertig!** Keine weiteren Änderungen nötig.

---

### Von Cron → GitHub Actions

```bash
# 1. Cron deaktivieren
crontab -e
# Zeile mit # auskommentieren

# 2. GitHub Actions aktivieren
git add .github/workflows/
git push
```

---

### Von GitHub Actions → Cron

```bash
# 1. Workflow deaktivieren
# In GitHub: Actions → Workflow → "..." → Disable

# 2. Cron konfigurieren
crontab -e
0 2 1 * * cd ~/Basketball-Apps/basketball-app && npm run crawl:clubs:all
```

---

## 📚 Dokumentation

| Thema | Dokument |
|-------|----------|
| **GitHub Actions Setup** | `.github/workflows/README.md` |
| **Cron-Job Details** | `docs/CRAWLER-AUTOMATION.md` |
| **Quick Start** | `docs/CRAWLER-QUICKSTART.md` |
| **Technische Details** | `docs/CRAWLER-EXPLAINED.md` |
| **Verbände** | `docs/STATISCHE-VERBAENDE.md` |

---

## 🧪 Test vor Produktiv-Einsatz

```bash
# 1. Manuell testen
cd basketball-app
npm run crawl:clubs:all

# 2. Output prüfen
cat src/shared/data/clubs-germany.json | jq '.metadata'

# 3. GitHub Actions testen (wenn gewählt)
# GitHub → Actions → Run workflow (manuell)

# 4. Logs prüfen
# GitHub → Actions → Workflow Run → Logs

# 5. Schedule aktivieren
# Automatisch nach Push
```

---

## ✅ Quick Decision Tree

```
Brauchst du automatische Updates?
  ├─ Ja → Ist das Repo auf GitHub?
  │      ├─ Ja → ✅ GitHub Actions
  │      └─ Nein → Hast du einen Server?
  │              ├─ Ja → Cron (Linux/macOS) / Task Scheduler (Windows)
  │              └─ Nein → GitHub Actions (migriere zu GitHub)
  └─ Nein → Manuell (`npm run crawl:clubs:all`)
```

---

**Empfehlung:** 🌟 **GitHub Actions** (`crawler.yml` - monatlich)

---

**Version:** v3.0.0  
**Letzte Aktualisierung:** 2025-10-22
