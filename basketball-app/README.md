# Basketball Team Manager PWA

[![Deploy to GitHub Pages](https://github.com/OliEder/dbb-mini-bball-coach-app/actions/workflows/deploy.yml/badge.svg)](https://github.com/OliEder/dbb-mini-bball-coach-app/actions/workflows/deploy.yml)
[![Club Crawler](https://github.com/OliEder/dbb-mini-bball-coach-app/actions/workflows/crawler.yml/badge.svg)](https://github.com/OliEder/dbb-mini-bball-coach-app/actions/workflows/crawler.yml)

## 🏀 Basketball Team Manager für Jugendtrainer

Progressive Web App für Jugend-Basketball-Trainer (U8/U10/U12) im deutschen Basketball-System.

### ✨ Features

- 📱 **PWA** - Installierbar auf allen Geräten
- 🔄 **Offline-First** - Funktioniert ohne Internet
- 👥 **Spieler-Management** mit Skill-Assessment
- 📋 **Lineup-Planung** nach DBB Minibasketball-Regeln
- 🎮 **Live Game Management** mit Substitution-Tracking
- 🏆 **BBB Integration** - Automatischer Import von Liga-Daten
- 📊 **Vereinsdaten** - Über 5000 deutsche Basketball-Vereine

## 🚀 Live Demo

👉 **[App starten](https://olieeder.github.io/dbb-mini-bball-coach-app/)**

## 📱 Installation

### iPhone/iPad
1. Link in **Safari** öffnen
2. **Teilen** → **Zum Home-Bildschirm**

### Android
1. Link in **Chrome** öffnen
2. **⋮** → **App installieren**

### Desktop
1. Link in **Chrome/Edge** öffnen
2. **Installieren** in der Adressleiste

## 🛠️ Entwicklung

```bash
# In den App-Ordner wechseln
cd basketball-app

# Installation
npm install

# Entwicklung
npm run dev

# Build
npm run build

# Tests
npm test
```

## 📊 Datenquellen

- **Vereinsdaten:** Automatisch aktualisiert via GitHub Actions
- **Liga-Daten:** basketball-bund.net REST API
- **Offline-Storage:** IndexedDB mit Dexie.js

## 🔒 Datenschutz

- **GDPR/DSGVO konform**
- Keine Nutzer-Accounts
- Lokale Datenhaltung
- Keine Tracking-Cookies

## 🤝 Contributing

Contributions sind willkommen! Siehe [CONTRIBUTING.md](docs/CONTRIBUTING.md).

## 📄 Lizenz

MIT License - siehe [LICENSE](LICENSE)

## 🙏 Credits

- Entwickelt für Basketball-Trainer in Deutschland
- Daten von [basketball-bund.net](https://www.basketball-bund.net)
- Icons von [Lucide](https://lucide.dev)

---

**[📱 App installieren](https://olieeder.github.io/dbb-mini-bball-coach-app/)** | **[📚 Dokumentation](basketball-app/docs/)** | **[🐛 Bug melden](https://github.com/OliEder/dbb-mini-bball-coach-app/issues)**
