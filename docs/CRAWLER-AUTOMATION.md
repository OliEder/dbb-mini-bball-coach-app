# Club-Crawler Automation (Cron-Jobs & GitHub Actions)

## 🎯 Zweck

Automatische, periodische Aktualisierung der Club-Daten aus allen Basketball-Verbänden Deutschlands.

---

## 🚀 Empfohlene Lösung: GitHub Actions

### ✅ Vorteile

- **Keine lokale Infrastruktur** - Läuft in der Cloud
- **Kostenlos** für Public Repos (unbegrenzt)
- **Einfaches Setup** - Nur YML-Datei committen
- **Logs in GitHub** - Debugging direkt im Browser
- **Automatische Commits** - Datei wird direkt gepusht
- **Issue bei Fehler** - Automatische Benachrichtigung
- **Backups als Artifacts** - 90 Tage aufbewahrt

### 🔧 Setup

1. **Workflows committen:**
```bash
git add .github/workflows/
git commit -m "feat: Add GitHub Actions Crawler"
git push
```

2. **Manuell testen:**
- GitHub → Actions → "Basketball Club Crawler" → "Run workflow"

3. **Fertig!** Läuft ab jetzt automatisch jeden 1. des Monats.

**Vollständige Doku:** `.github/workflows/README.md`

---

## 📊 Crawl-Strategien

### 1. **Single-Verband Crawl** (Ad-hoc)

```bash
npm run crawl:clubs -- --verband=2  # Bayern
```

**Verwendung:**
- Testing
- Einzelner Verband muss aktualisiert werden
- Während der Entwicklung

---

### 2. **ALL-Verbände Crawl** (Automatisiert)

```bash
npm run crawl:clubs:all
```

**Crawlt:**
- 16 Landesverbände (IDs 1-16)
- 1 Deutsche Meisterschaft (ID 29)
- 4 Regionalligen (IDs 30-33)
- Bundesligen (ID 100+)

**Details:**
- **Laufzeit:** ~30-45 Minuten
- **API-Calls:** ~15.000 Requests
- **Verhalten:** Sequenziell, fehler-tolerant
- **Merging:** Automatisch mit existierenden Daten

---

## ⏰ Empfohlene Cron-Jobs

### Option 1: Monatlich (empfohlen)

```bash
# Jeden 1. des Monats um 02:00 Uhr
0 2 1 * * cd /pfad/zu/Basketball-Apps/basketball-app && npm run crawl:clubs:all >> /var/log/basketball-crawler.log 2>&1
```

**Vorteile:**
- Daten bleiben aktuell
- Erfasst monatliche Liga-Updates
- Catch neue Teams/Saisons

---

### Option 2: Quartalsweise

```bash
# Jeden 1. im Januar, April, Juli, Oktober um 02:00 Uhr
0 2 1 1,4,7,10 * cd /pfad/zu/Basketball-Apps/basketball-app && npm run crawl:clubs:all >> /var/log/basketball-crawler.log 2>&1
```

**Vorteile:**
- Reduzierte Server-Last
- Ausreichend für meiste Use Cases
- Aligned mit Saison-Quarters

---

### Option 3: Saisonstart & -mitte

```bash
# 1. September (Saisonstart) um 02:00 Uhr
0 2 1 9 * cd /pfad/zu/Basketball-Apps/basketball-app && npm run crawl:clubs:all >> /var/log/basketball-crawler.log 2>&1

# 1. Februar (Saisonmitte) um 02:00 Uhr
0 2 1 2 * cd /pfad/zu/Basketball-Apps/basketball-app && npm run crawl:clubs:all >> /var/log/basketball-crawler.log 2>&1
```

**Vorteile:**
- Minimale Server-Last
- Aligned mit Basketball-Kalender
- Erfasst Haupt-Änderungspunkte

---

## 🐧 Linux Cron Setup

### 1. Crontab bearbeiten

```bash
crontab -e
```

### 2. Cron-Job hinzufügen

```bash
# Basketball Club Crawler - Monatlich
0 2 1 * * cd /home/user/Basketball-Apps/basketball-app && npm run crawl:clubs:all >> /var/log/basketball-crawler.log 2>&1
```

### 3. Cron-Jobs anzeigen

```bash
crontab -l
```

### 4. Logs prüfen

```bash
tail -f /var/log/basketball-crawler.log
```

---

## 🪟 Windows Task Scheduler

### PowerShell Script erstellen

`run-crawler.ps1`:
```powershell
Set-Location "C:\Projekte\Basketball-Apps\basketball-app"
npm run crawl:clubs:all | Out-File -Append "C:\Logs\basketball-crawler.log"
```

### Task Scheduler Konfiguration

1. **Task Scheduler** öffnen
2. **Aufgabe erstellen**
3. **Trigger:** Monatlich, 1. Tag, 02:00 Uhr
4. **Aktion:** PowerShell Script ausführen
   - Programm: `powershell.exe`
   - Argumente: `-ExecutionPolicy Bypass -File "C:\Scripts\run-crawler.ps1"`

---

## 🍎 macOS LaunchAgent

### plist erstellen

`~/Library/LaunchAgents/com.basketball.crawler.plist`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.basketball.crawler</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>-c</string>
        <string>cd /Users/oliver/Basketball-Apps/basketball-app && npm run crawl:clubs:all >> /var/log/basketball-crawler.log 2>&1</string>
    </array>
    <key>StartCalendarInterval</key>
    <dict>
        <key>Day</key>
        <integer>1</integer>
        <key>Hour</key>
        <integer>2</integer>
        <key>Minute</key>
        <integer>0</integer>
    </dict>
</dict>
</plist>
```

### LaunchAgent laden

```bash
launchctl load ~/Library/LaunchAgents/com.basketball.crawler.plist
launchctl start com.basketball.crawler
```

---

## 📧 E-Mail Benachrichtigungen

### Shell-Wrapper mit Mail

`crawl-with-notification.sh`:
```bash
#!/bin/bash

LOG_FILE="/var/log/basketball-crawler.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

echo "[$DATE] Starting crawl..." >> $LOG_FILE

cd /pfad/zu/Basketball-Apps/basketball-app

if npm run crawl:clubs:all >> $LOG_FILE 2>&1; then
    echo "[$DATE] Crawl successful" >> $LOG_FILE
    echo "Basketball Crawler erfolgreich abgeschlossen am $DATE" | mail -s "✅ Basketball Crawler Success" admin@example.com
else
    echo "[$DATE] Crawl failed" >> $LOG_FILE
    echo "Basketball Crawler fehlgeschlagen am $DATE. Siehe Log: $LOG_FILE" | mail -s "❌ Basketball Crawler Error" admin@example.com
fi
```

### Cron mit Wrapper

```bash
0 2 1 * * /pfad/zu/crawl-with-notification.sh
```

---

## 📊 Monitoring & Alerts

### Healthcheck-Service (Optional)

```bash
# Vor dem Crawl
curl https://hc-ping.com/your-uuid/start

# Nach dem Crawl
curl https://hc-ping.com/your-uuid
```

### Log-Rotation

`/etc/logrotate.d/basketball-crawler`:
```
/var/log/basketball-crawler.log {
    monthly
    rotate 12
    compress
    delaycompress
    notifempty
    create 0644 root root
}
```

---

## 🔍 Debugging Cron-Jobs

### Problem: Cron läuft nicht

**1. Prüfe Cron-Service:**
```bash
sudo systemctl status cron  # Linux
```

**2. Teste Script manuell:**
```bash
cd /pfad/zu/Basketball-Apps/basketball-app
npm run crawl:clubs:all
```

**3. Environment-Variablen:**
```bash
# In Crontab
PATH=/usr/local/bin:/usr/bin:/bin
NODE_ENV=production

0 2 1 * * cd /pfad/zu/Basketball-Apps/basketball-app && npm run crawl:clubs:all >> /var/log/basketball-crawler.log 2>&1
```

---

### Problem: "npm command not found"

**Lösung:** Vollständiger Pfad verwenden

```bash
# Node/npm Pfad finden
which npm  # z.B. /usr/local/bin/npm

# In Crontab
0 2 1 * * cd /pfad/zu/Basketball-Apps/basketball-app && /usr/local/bin/npm run crawl:clubs:all >> /var/log/basketball-crawler.log 2>&1
```

---

### Problem: Permissions

```bash
# Script ausführbar machen
chmod +x /pfad/zu/Basketball-Apps/scripts/crawl-clubs-all.js

# Log-Datei erstellen
sudo touch /var/log/basketball-crawler.log
sudo chown $USER:$USER /var/log/basketball-crawler.log
```

---

## 🧪 Test-Run

Vor dem Produktiv-Einsatz:

```bash
# 1. Manuell testen
cd basketball-app
npm run crawl:clubs:all

# 2. Mit Logging testen
npm run crawl:clubs:all >> /tmp/test-crawler.log 2>&1

# 3. Log prüfen
cat /tmp/test-crawler.log

# 4. Output-Datei prüfen
cat src/shared/data/clubs-germany.json | jq '.metadata'
```

---

## 📋 Checkliste: Produktiv-Setup

- [ ] Script getestet: `npm run crawl:clubs:all`
- [ ] Log-Datei erstellt: `/var/log/basketball-crawler.log`
- [ ] Cron-Job konfiguriert (monatlich/quartalsweise)
- [ ] E-Mail Benachrichtigungen (optional)
- [ ] Log-Rotation konfiguriert
- [ ] Backup der Output-Datei (vor erstem Lauf)
- [ ] Monitoring eingerichtet (optional)

---

## 🎯 Beispiel: Vollständiges Setup

```bash
# 1. Log-Datei erstellen
sudo touch /var/log/basketball-crawler.log
sudo chown $USER:$USER /var/log/basketball-crawler.log

# 2. Backup-Strategie
mkdir -p ~/basketball-backups

# 3. Wrapper-Script
cat > ~/crawl-basketball.sh << 'EOF'
#!/bin/bash
DATE=$(date '+%Y%m%d-%H%M%S')
BACKUP_DIR=~/basketball-backups
APP_DIR=~/Basketball-Apps/basketball-app
DATA_FILE=$APP_DIR/src/shared/data/clubs-germany.json

# Backup
if [ -f "$DATA_FILE" ]; then
    cp "$DATA_FILE" "$BACKUP_DIR/clubs-germany-$DATE.json"
fi

# Crawl
cd $APP_DIR
npm run crawl:clubs:all >> /var/log/basketball-crawler.log 2>&1

# Cleanup alte Backups (>90 Tage)
find $BACKUP_DIR -name "clubs-germany-*.json" -mtime +90 -delete
EOF

chmod +x ~/crawl-basketball.sh

# 4. Crontab
crontab -e
# Füge hinzu:
# 0 2 1 * * ~/crawl-basketball.sh
```

---

## 📚 Weitere Ressourcen

- **Crawler-Doku:** `docs/CRAWLER-EXPLAINED.md`
- **Verbände:** `docs/STATISCHE-VERBAENDE.md`
- **API-Sequenz:** `docs/CRAWLER-V2-SEQUENZ.md`

---

**Letzte Aktualisierung:** 2025-10-22  
**Script-Version:** v3.0.0
