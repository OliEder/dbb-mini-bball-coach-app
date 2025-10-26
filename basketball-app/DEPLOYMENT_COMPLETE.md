# 🚀 GitHub Pages Deployment - Complete Setup

## ✅ Was wurde eingerichtet?

### 1. **GitHub Actions Workflows**
   - `deploy.yml`: Automatisches Deployment + Crawler
   - `crawler.yml`: Wöchentliche Club-Daten Updates

### 2. **PWA-Optimierungen**
   - Dynamischer base path für GitHub Pages
   - 404.html für SPA-Routing
   - robots.txt für SEO

### 3. **Automatisierung**
   - Setup-Script für einfache Einrichtung
   - Deploy-Helper für schnelles Deployment

## 📋 Deployment-Schritte

### Schritt 1: Scripts ausführbar machen
```bash
chmod +x setup-github-pages.sh
chmod +x deploy.sh
```

### Schritt 2: Änderungen committen
```bash
# Alle neuen Dateien hinzufügen
git add -A

# Commit mit ausführlicher Message
git commit -F COMMIT_GITHUB_PAGES.md

# Oder kurzer Commit
git commit -m "feat: GitHub Pages Deployment mit automatischem Crawler"
```

### Schritt 3: GitHub Repository erstellen
1. Gehe zu [github.com/new](https://github.com/new)
2. Name: `basketball-app`
3. Public
4. KEIN README hinzufügen

### Schritt 4: Push zu GitHub
```bash
# Remote hinzufügen (USERNAME ersetzen!)
git remote add origin https://github.com/USERNAME/basketball-app.git

# Push
git push -u origin main
```

### Schritt 5: GitHub Pages aktivieren
1. Repository → **Settings** → **Pages**
2. Source: **GitHub Actions**
3. Save

### Schritt 6: Workflow Permissions
1. Repository → **Settings** → **Actions** → **General**
2. Workflow permissions: **Read and write permissions**
3. Save

### Schritt 7: Erstes Deployment
1. Repository → **Actions**
2. Wähle **"Deploy to GitHub Pages & Run Crawler"**
3. **Run workflow** → **Run workflow**

## 🌐 Nach 2-3 Minuten verfügbar

Die App ist dann erreichbar unter:
```
https://USERNAME.github.io/basketball-app/
```

## 📱 PWA Installation testen

### iOS
1. In **Safari** öffnen
2. Teilen → Zum Home-Bildschirm

### Android
1. In **Chrome** öffnen
2. ⋮ → App installieren

### Desktop
1. In **Chrome/Edge** öffnen
2. Installieren-Icon in Adressleiste

## 🔄 Automatische Updates

- **App**: Bei jedem Push auf main
- **Club-Daten**: Jeden Sonntag 2 Uhr UTC
- **Manuell**: Über GitHub Actions

## 📊 Monitoring

- **Actions**: github.com/USERNAME/basketball-app/actions
- **Lighthouse**: Automatisch nach jedem Deployment
- **Status**: Badges im README

## 🐛 Troubleshooting

### Build lokal testen
```bash
npm run build
```

### GitHub Pages URL anpassen
In den Workflows `USERNAME` durch deinen GitHub-Username ersetzen.

### 404 Fehler
Warte 5-10 Minuten nach dem ersten Deployment (DNS).

## 📚 Dokumentation

- **Setup Guide**: `docs/GITHUB-PAGES-SETUP.md`
- **README**: Aktualisiert mit Badges und Links
- **TypeScript Guide**: `docs/development/TYPESCRIPT-GUIDE.md`

## 🎯 Fertig!

Nach dem Deployment hast du:
- ✅ Eine live PWA auf GitHub Pages
- ✅ Automatische Deployments
- ✅ Wöchentliche Daten-Updates
- ✅ Performance-Monitoring
- ✅ Offline-Funktionalität

**Viel Erfolg! 🏀**
