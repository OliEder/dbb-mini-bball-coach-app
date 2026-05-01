# 🏀 Basketball Team Manager PWA - GitHub Pages Setup

## 🚀 Quick Setup

### 1. Lokale Vorbereitung

```bash
# Setup-Script ausführbar machen und starten
chmod +x setup-github-pages.sh
./setup-github-pages.sh
```

### 2. GitHub Repository erstellen

1. Gehe zu [github.com/new](https://github.com/new)
2. Repository Name: `basketball-app`
3. Public Repository
4. **KEIN** README.md hinzufügen

### 3. Code pushen

```bash
# Remote hinzufügen
git remote add origin https://github.com/DEIN-USERNAME/basketball-app.git

# Alles committen und pushen
git add -A
git commit -m "feat: GitHub Pages Setup mit PWA und Crawler"
git push -u origin main
```

### 4. GitHub Pages aktivieren

1. Gehe zu **Settings** → **Pages**
2. Source: **GitHub Actions**
3. Save

### 5. Workflow Permissions

1. Gehe zu **Settings** → **Actions** → **General**
2. Workflow permissions: **Read and write permissions**
3. Save

### 6. Deployment starten

1. Gehe zu **Actions**
2. Wähle **"Deploy to GitHub Pages & Run Crawler"**
3. Klicke **"Run workflow"** → **"Run workflow"**

## 🌐 Deployment URLs

Nach 2-3 Minuten ist die App verfügbar unter:
- **Live:** `https://DEIN-USERNAME.github.io/basketball-app/`
- **Direkt-Link für Installation:** Teile diesen Link mit Trainern!

## 📱 PWA Installation

### iOS (iPhone/iPad)
1. Öffne die URL in **Safari**
2. Tippe auf **Teilen** (Share-Button)
3. Wähle **"Zum Home-Bildschirm"**
4. Name anpassen → **"Hinzufügen"**

### Android
1. Öffne die URL in **Chrome**
2. Tippe auf **⋮** (3-Punkte-Menü)
3. Wähle **"App installieren"**
4. **"Installieren"** bestätigen

### Desktop (Chrome/Edge)
1. Öffne die URL
2. Klicke auf **Installieren-Icon** in der Adressleiste
3. **"Installieren"** bestätigen

## 🔄 Automatische Updates

### App-Updates
- **Automatisch:** Bei jedem Push auf `main`
- **Manuell:** Actions → Deploy workflow → Run

### Club-Daten Updates
- **Automatisch:** Jeden Sonntag 2 Uhr
- **Manuell:** Actions → Crawler workflow → Run

## 🛠️ Workflows

### Deploy Workflow (`deploy.yml`)
```yaml
Trigger:
  - Push auf main
  - Manuell
  - Schedule (für Crawler)
  
Jobs:
  1. Build PWA
  2. Deploy to Pages
  3. Run Crawler (optional)
  4. Lighthouse Test
```

### Crawler Workflow (`crawler.yml`)
```yaml
Trigger:
  - Wöchentlich (Sonntag 2 Uhr)
  - Manuell (mit Verband-Filter)
  
Jobs:
  1. Crawl clubs from BBB
  2. Process & split data
  3. Commit updates
```

## 📊 Monitoring

### GitHub Actions Dashboard
- Status: [Actions Tab](../../actions)
- Deployments: [Environments](../../deployments)
- Pages: [Pages Settings](../../settings/pages)

### Lighthouse Scores
Nach jedem Deployment wird ein Lighthouse-Test durchgeführt:
- Performance
- Accessibility
- Best Practices
- SEO
- PWA

## 🐛 Troubleshooting

### Build fehlschlägt
```bash
# Lokal testen
npm run build

# TypeScript-Fehler prüfen
npx tsc --noEmit
```

### Pages nicht erreichbar
1. Check Settings → Pages → Source = GitHub Actions
2. Check Actions → Letztes Deployment erfolgreich?
3. Warte 5-10 Minuten (DNS-Propagierung)

### Crawler-Fehler
```bash
# Lokal testen
npm run crawl:clubs -- --verbandIds=2

# Logs prüfen
cat crawler-summary.json
```

### PWA installiert nicht
1. HTTPS erforderlich (GitHub Pages hat das)
2. manifest.json vorhanden?
3. Service Worker registriert?
4. Browser-Console checken

## 🔒 Sicherheit

### Secrets (keine benötigt!)
- GitHub Token wird automatisch bereitgestellt
- Keine API-Keys erforderlich
- Öffentliche Daten von basketball-bund.net

### CORS
- Automatisch über CORS-Proxy gelöst
- Fallback-Chain implementiert

## 📈 Performance-Tipps

### Bundle-Größe optimieren
```bash
# Analyze Bundle
npm run build -- --analyze
```

### Cache-Strategie
- HTML: Network First
- JS/CSS: Cache First
- API: Network First mit 24h Cache

## 🎯 Nächste Schritte

1. **Custom Domain** (optional)
   - Settings → Pages → Custom domain
   - CNAME-Record setzen

2. **Analytics** (optional)
   - Google Analytics
   - Plausible
   - Matomo

3. **Error Tracking** (optional)
   - Sentry Integration

4. **Beta Testing**
   - Link an Trainer verteilen
   - Feedback sammeln

## 📚 Links

- **Live App:** Nach Deployment verfügbar
- **Repository:** Diese Seite
- **Issues:** [Bug Reports](../../issues)
- **Discussions:** [Fragen & Ideen](../../discussions)

---

**Happy Coaching! 🏀**

*Automatisch deployed mit GitHub Actions*
