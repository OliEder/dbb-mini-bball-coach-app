# GitHub Actions - Basketball Crawler

Automatische Crawler-Workflows für Club-Daten.

---

## 📋 Verfügbare Workflows

### 1. `crawler.yml` - Monatlich (Standard)

**Trigger:**
- 🕐 **Automatisch:** Jeden 1. des Monats um 02:00 UTC
- 🖱️ **Manuell:** GitHub UI → Actions → "Basketball Club Crawler" → "Run workflow"

**Features:**
- Crawlt ALLE Verbände (21+)
- Oder Single-Verband (manuell wählbar)
- Erstellt Backup vor Crawl
- Committed Änderungen automatisch
- Erstellt Issue bei Fehler

**Empfohlen für:** Produktiv-Umgebungen mit regelmäßigen Updates

---

### 2. `crawler-quarterly.yml` - Quartalsweise

**Trigger:**
- 🕐 **Automatisch:** 1. Januar, April, Juli, Oktober um 02:00 UTC
- 🖱️ **Manuell:** GitHub UI

**Features:**
- Crawlt ALLE Verbände
- Reduzierte Laufhäufigkeit
- Gleiche Features wie monatlich

**Empfohlen für:** Niedrige Änderungsrate, weniger GitHub Actions Minutes

---

## 🚀 Setup

### 1. Workflow aktivieren

```bash
# Workflows sind nach Commit automatisch aktiv
git add .github/workflows/
git commit -m "feat: Add GitHub Actions Crawler Workflows"
git push
```

### 2. Manuell testen

1. Gehe zu **GitHub → Actions**
2. Wähle **"Basketball Club Crawler"**
3. Klicke **"Run workflow"**
4. Optional: Gib Verband-ID ein (z.B. `2` für Bayern)
5. Klicke **"Run workflow"**

### 3. Logs prüfen

- **GitHub → Actions → Workflow Run**
- Dort siehst du alle Steps in Echtzeit

---

## ⚙️ Konfiguration

### Schedule ändern

**Monatlich → Wöchentlich:**
```yaml
schedule:
  - cron: '0 2 * * 0'  # Jeden Sonntag um 02:00 UTC
```

**Täglich (nicht empfohlen):**
```yaml
schedule:
  - cron: '0 2 * * *'  # Jeden Tag um 02:00 UTC
```

**Cron-Syntax:**
```
┌───────────── minute (0 - 59)
│ ┌───────────── hour (0 - 23)
│ │ ┌───────────── day of month (1 - 31)
│ │ │ ┌───────────── month (1 - 12)
│ │ │ │ ┌───────────── day of week (0 - 6, Sunday = 0)
│ │ │ │ │
* * * * *
```

**Hilfe:** https://crontab.guru

---

### Timeout anpassen

```yaml
jobs:
  crawl:
    timeout-minutes: 90  # Für langsame Verbindungen
```

---

### Benachrichtigungen deaktivieren

Entferne Step:
```yaml
- name: 📧 Notification on Failure
```

---

## 📊 Was passiert bei einem Run?

### Ablauf

```
1. Checkout Code ✅
2. Setup Node.js ✅
3. Install Dependencies ✅
4. Create Backup ✅
5. Run Crawler (30-45 min) 🏀
6. Check Output ✅
7. Upload Artifact (Backup) 💾
8. Commit & Push Changes 📝
9. (Bei Fehler) Create Issue 📧
```

### Output

**Committed:**
- `basketball-app/src/shared/data/clubs-germany.json`

**Artifact (90 Tage):**
- `clubs-germany-backup-<run-number>.zip`
- Enthält Backup + neue Datei

---

## 🔒 Permissions

Der Workflow benötigt:

**Schreiben:**
- `contents:write` - Für Commit & Push
- `issues:write` - Für Fehler-Issues (optional)

**Standard `GITHUB_TOKEN`** hat diese Permissions bereits!

---

## 💰 Kosten & Limits

### GitHub Actions Minutes

**Public Repos:**
- ✅ **Kostenlos** und **unbegrenzt**

**Private Repos:**
- 🟢 **Free Plan:** 2000 Minutes/Monat
- 🔵 **Pro Plan:** 3000 Minutes/Monat

**Crawler-Verbrauch:**
- ~45 Minuten pro Run (ALL Verbände)
- Monatlich: ~45 Minutes
- Quartalsweise: ~12 Minutes/Monat

➡️ **Passt problemlos in Free Tier!**

---

## 🛠️ Troubleshooting

### Workflow läuft nicht automatisch

**Mögliche Ursachen:**
1. Branch ist nicht `main` oder `master`
2. Workflow ist deaktiviert (GitHub Actions Tab)
3. Repository ist inaktiv (>60 Tage keine Commits)

**Lösung:**
```bash
# Dummy-Commit zum Reaktivieren
git commit --allow-empty -m "chore: Keep repo active"
git push
```

---

### "Permission denied" beim Commit

**Lösung:**

Repository Settings → Actions → General → Workflow permissions:
- ✅ **Read and write permissions**

---

### Crawler schlägt fehl

**Logs prüfen:**
1. GitHub → Actions → Fehlgeschlagener Run
2. Klicke auf rotes ❌ Step
3. Expandiere Logs

**Häufige Fehler:**
- API Timeout → Retry Workflow
- Keine Ligen gefunden → API down
- npm install failed → package-lock.json Problem

---

### Artifact nicht vorhanden

**Retention:**
- Artifacts werden nach 90 Tagen gelöscht
- Änderbar in Workflow: `retention-days: 365`

---

## 📧 E-Mail Benachrichtigungen

### GitHub Notifications aktivieren

1. **GitHub → Settings → Notifications**
2. ✅ **Actions** → "Send notifications for failed workflows"

### Alternative: Slack/Discord

**Slack Integration:**
```yaml
- name: Slack Notification
  if: failure()
  uses: slackapi/slack-github-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK }}
    payload: |
      {
        "text": "Basketball Crawler fehlgeschlagen!"
      }
```

**Discord:**
```yaml
- name: Discord Notification
  if: failure()
  uses: sarisia/actions-status-discord@v1
  with:
    webhook: ${{ secrets.DISCORD_WEBHOOK }}
    title: "Basketball Crawler Error"
```

---

## 🧪 Lokaler Test

Workflow lokal simulieren mit `act`:

```bash
# Install act (macOS)
brew install act

# Run workflow
act schedule -W .github/workflows/crawler.yml
```

**Oder manuell:**
```bash
cd basketball-app
npm run crawl:clubs:all
```

---

## 📚 Workflow-Badges

Füge Badge zu README.md hinzu:

```markdown
![Crawler Status](https://github.com/OWNER/REPO/actions/workflows/crawler.yml/badge.svg)
```

Ersetze `OWNER/REPO` mit deinen Daten.

---

## 🔄 Workflow-Übersicht

| Workflow | Häufigkeit | Minutes/Monat | Empfohlen für |
|----------|------------|---------------|---------------|
| `crawler.yml` | Monatlich | ~45 | Standard |
| `crawler-quarterly.yml` | Quartalsweise | ~12 | Niedrige Änderungsrate |

**Wähle EINEN Workflow** - beide parallel nicht nötig!

---

## 📝 Nächste Schritte

1. ✅ Workflow committen & pushen
2. ✅ Manuellen Test-Run durchführen
3. ✅ Logs prüfen
4. ✅ Output-Datei validieren
5. ✅ Schedule-Run abwarten (nächster 1. des Monats)

---

## 🆘 Support

**Probleme?**
- 📖 [GitHub Actions Docs](https://docs.github.com/en/actions)
- 🐛 Issue erstellen mit Log-Output
- 💬 Team fragen

---

**Version:** v1.0.0  
**Letzte Aktualisierung:** 2025-10-22
