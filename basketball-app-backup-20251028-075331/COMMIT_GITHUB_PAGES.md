feat: GitHub Pages Deployment mit automatischem Crawler

## 🚀 Neue Features

### GitHub Pages Deployment
- Automatisches Deployment bei Push auf main
- PWA vollständig installierbar
- Offline-First Funktionalität
- Optimiert für mobile Geräte

### GitHub Actions Workflows
- **deploy.yml**: Build & Deploy + optional Crawler
- **crawler.yml**: Wöchentliche Club-Daten Updates
- Lighthouse CI für Performance-Monitoring

### Setup & Dokumentation
- `setup-github-pages.sh`: Automatisiertes Setup-Script
- Umfassende Dokumentation in `docs/GITHUB-PAGES-SETUP.md`
- README mit Installations-Anleitung
- 404-Handling für SPA-Routing

## 📁 Neue Dateien
- `.github/workflows/deploy.yml` - Main deployment workflow
- `.github/workflows/crawler.yml` - Club data crawler
- `docs/GITHUB-PAGES-SETUP.md` - Deployment guide
- `public/404.html` - SPA fallback
- `public/robots.txt` - SEO configuration
- `setup-github-pages.sh` - Setup automation
- `deploy.sh` - Quick deployment helper
- `README.md` - Updated with badges & instructions

## 🔧 Konfigurationsänderungen
- Vite config: Dynamic base path für GitHub Pages
- PWA manifest: Angepasst für subdirectory deployment

## 📱 PWA Features
- Installierbar auf iOS, Android, Desktop
- Offline-fähig mit Service Worker
- Automatische Updates
- Cache-Strategien für optimale Performance

## 🔄 Automatisierung
- Deployment bei jedem Push
- Wöchentliche Club-Daten Updates (Sonntags)
- Lighthouse Performance Tests
- Automatische Commit-Messages für Updates

## 🎯 Nächste Schritte
1. Repository auf GitHub erstellen
2. `./setup-github-pages.sh` ausführen
3. Den Anweisungen folgen
4. App unter https://USERNAME.github.io/basketball-app/ verfügbar

Refs: #github-pages #pwa #deployment #automation
