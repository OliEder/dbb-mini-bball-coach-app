# 🏀 Basketball Team Manager - PWA

Progressive Web App für Basketball-Trainer zur Verwaltung von Teams, Spielern, Trikots und Spielplänen.

[![Version](https://img.shields.io/badge/version-1.2.3-blue.svg)](./CHANGELOG.md)
[![License](https://img.shields.io/badge/license-Private-red.svg)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-blue.svg)](https://react.dev/)
[![WCAG](https://img.shields.io/badge/WCAG-2.0%20AA-green.svg)](https://www.w3.org/WAI/WCAG21/quickref/)

---

## 🚀 Quick Start

```bash
# 1. Dependencies installieren
npm install

# 2. Development Server starten
npm run dev

# 3. Im Browser öffnen
# http://localhost:5173
```

---

## ✨ Features

### ✅ Implementiert (v1.2.3)

#### Onboarding & Setup
- 🎯 Multi-Step Onboarding mit Progress-Indicator
- 🏀 Team-Erstellung mit Altersklassen (U8-U18)
- 🏛️ Vereins-Zuordnung
- 📊 CSV-Import für Spieler & Trikots
- 🔗 BBB-Integration für automatischen Spielplan-Import

#### Team Management
- 👥 Multi-Team-Support
- 📅 Saison-Verwaltung
- ⭐ Leistungsorientierte U12-Kennzeichnung

#### Spieler-Verwaltung
- 📝 Robuster CSV-Parser mit Validation
- 👨‍👩‍👧 Erziehungsberechtigte-Zuordnung (DSGVO-konform)
- 👕 Konfektionsgrößen für Trikotvergabe
- 🎫 TNA-Nummer für Ligaberechtigung
- 📊 9-Skill-Bewertungssystem

#### Trikot-Management
- 🔄 Wendejerseys & Hosen
- 📏 Größen-Tracking (EU 116-170)
- 🎨 Farben (dunkel/hell)
- ✅ Verfügbarkeits-Status

#### BBB-Integration (basketball-bund.net)
- 🌐 Automatischer Liga-Import
- 📋 Spielplan-Sync
- 📊 Tabellen-Daten
- 🎯 Ergebnisse-Import
- 🔄 Robuster CORS-Proxy mit Fallback

#### Dashboard
- 📈 Übersicht mit Statistiken
- 👥 Spieler-Count
- 👕 Trikot-Count
- 🏀 Spiele-Count

### 🚧 In Entwicklung (Roadmap)

- [ ] **Einsatzplanung** - 8-Achtel-Rotation mit DBB-Regelvalidierung
- [ ] **Spieltag-Features** - Live-Timer, Statistiken, Wechsel-Management
- [ ] **Training-Tracking** - Anwesenheit, Übungen, Fortschritt
- [ ] **Benchmark-Analysen** - Vergleich mit Liga-Durchschnitt
- [ ] **PDF-Export** - Spielberichte, Einsatzpläne

Siehe [CHANGELOG.md](./CHANGELOG.md) für vollständige Versionshistorie.

---

## 📦 Tech Stack

| Kategorie | Technologie | Version |
|-----------|-------------|---------|
| **Framework** | React | 18.3 |
| **Sprache** | TypeScript | 5.3 |
| **Build Tool** | Vite | 5.x |
| **State** | Zustand | 4.x |
| **Database** | Dexie.js / IndexedDB | 4.x |
| **Styling** | Tailwind CSS | 3.x |
| **Testing** | Vitest | 1.x |
| **PWA** | vite-plugin-pwa | 0.19 |
| **CSV** | Papaparse | 5.x |
| **Icons** | Lucide React | 0.468 |

---

## 🛠️ Installation & Setup

### Voraussetzungen

- **Node.js** >= 18.x
- **npm** >= 9.x
- Moderner Browser (Chrome, Firefox, Safari, Edge)

### Installation

```bash
# Repository klonen
git clone <repository-url>
cd basketball-app

# Dependencies installieren
npm install
```

### Development

```bash
# Dev Server starten (Hot Reload)
npm run dev

# TypeScript Type-Check
npm run type-check

# Linting
npm run lint
```

### Testing

```bash
# Unit Tests (watch mode)
npm test

# Test UI (interaktiv)
npm run test:ui

# Coverage Report
npm run test:coverage
```

### Production Build

```bash
# Build erstellen
npm run build

# Build lokal testen
npm run preview
```

Siehe [SETUP.md](./SETUP.md) für detaillierte Setup-Anleitung.

---

## 📁 Projekt-Struktur

```
basketball-app/
├── src/
│   ├── main.tsx                    # Entry Point
│   ├── App.tsx                     # Root Component
│   ├── index.css                   # Global Styles
│   │
│   ├── stores/                     # Zustand State
│   │   ├── appStore.ts
│   │   └── onboardingStore.ts
│   │
│   ├── shared/                     # Shared Code
│   │   ├── types/
│   │   │   └── index.ts           # TypeScript Interfaces
│   │   └── db/
│   │       └── database.ts        # Dexie Database
│   │
│   └── domains/                    # Domain-Driven Design
│       ├── onboarding/
│       │   ├── components/
│       │   └── services/
│       ├── team/
│       │   └── services/
│       ├── spieler/
│       ├── trikot/
│       ├── spielplan/
│       ├── bbb/                    # BBB-Integration
│       │   └── services/
│       │       ├── BBBParserService.ts
│       │       └── BBBParserService.test.ts
│       └── dashboard/
│
├── docs/                           # Dokumentation
│   ├── README.md                   # Docs-Index
│   ├── bugfixes/                   # Bugfix-Protokolle
│   ├── development/                # Dev-Guides
│   └── archive/                    # Archivierte Docs
│
├── test-data/                      # Test-Daten
│
├── README.md                       # Diese Datei
├── CHANGELOG.md                    # Versionshistorie
├── SETUP.md                        # Setup-Guide
├── STATUS.md                       # Projekt-Status
├── package.json
└── vite.config.ts
```

---

## 🗄️ Datenbank-Schema

Die App nutzt **IndexedDB** mit 22 Tabellen:

### Kern-Tabellen
- `VEREINE` - Vereinsverwaltung
- `TEAMS` - Multi-Team-Support
- `SPIELER` - Eigene + Gegner + Scouting
- `BEWERTUNGEN` - 9-Skill-System
- `ERZIEHUNGSBERECHTIGTE` - DSGVO-konform
- `TRIKOTS` - Wendejerseys & Hosen

### Spielplan-Tabellen
- `LIGEN` - Liga-Informationen
- `SPIELPLAENE` - BBB-Integration
- `SPIELE` - Spielverwaltung
- `LIGA_ERGEBNISSE` - Ergebnisse
- `LIGA_TABELLEN` - Tabellenstände

### Weitere Tabellen
- `HALLEN` - Spielorte
- `EINSAETZE` - 8-Achtel-Rotation
- `TRAININGS` - Training-Management
- `SAISON_ARCHIVE` - Historische Daten
- ... und mehr

Siehe [Datenbank-Schema](./docs/development/DATABASE.md) für Details.

---

## 🧪 Testing

Die App folgt **Test-Driven Development** (TDD):

```bash
# Tests ausführen
npm test                    # Watch mode
npm run test:ui            # Interactive UI
npm run test:coverage      # Coverage Report
```

### Test-Coverage

- ✅ `TeamService` - 14 Tests
- ✅ `BBBParserService` - 50+ Tests
- ✅ `CSVImportService` - 10+ Tests
- 🚧 Weitere Tests in Entwicklung

**Ziel:** >80% Coverage

---

## ♿ Accessibility (WCAG 2.0 AA)

Die App ist **WCAG 2.0 AA konform**:

✅ **Farbkontraste** - Minimum 4.5:1  
✅ **Tastaturnavigation** - Alle Funktionen per Keyboard  
✅ **Focus Management** - 2px Outline, 2px Offset  
✅ **Touch Targets** - Minimum 44x44px  
✅ **Screen Reader** - Semantisches HTML, ARIA-Labels  
✅ **Error Messages** - Klare, hilfreiche Fehlermeldungen  

---

## 🔐 Datenschutz (DSGVO)

Die App ist **DSGVO-konform**:

✅ **Datensparsamkeit** - Nur notwendige Daten  
✅ **Lokale Speicherung** - Alle Daten im Browser  
✅ **Keine Server** - Kein Tracking, keine Cookies  
✅ **Explizite Zustimmung** - Für Erziehungsberechtigte  
✅ **Löschung** - Vollständige Datenlöschung möglich  

**Gespeicherte Daten:**
- Spieler: Vorname, Nachname, Geburtsdatum (optional)
- Erziehungsberechtigte: Kontaktdaten (mit Zustimmung)

**Nicht gespeichert:**
- Adressen
- Trainer-Kontaktdaten
- Vereins-Kontaktdaten

---

## 📚 Dokumentation

| Dokument | Beschreibung |
|----------|-------------|
| [README.md](./README.md) | Diese Datei - Überblick und Quick Start |
| [CHANGELOG.md](./CHANGELOG.md) | Vollständige Versionshistorie |
| [SETUP.md](./SETUP.md) | Detaillierte Setup-Anleitung |
| [STATUS.md](./STATUS.md) | Aktueller Projekt-Status |
| [docs/](./docs/) | Vollständige Dokumentation |

Siehe [Dokumentations-Index](./docs/README.md) für alle Dokumente.

---

## 🐛 Bugfixes & Updates

Alle Bugfixes und Updates sind dokumentiert:

| Version | Datum | Highlights |
|---------|-------|-----------|
| **1.2.3** | 2025-10-13 | CORS-Proxy Fallback, Robuste Liga-ID Extraktion |
| **1.2.2** | 2025-10-12 | Security-Updates |
| **1.2.1** | 2025-10-11 | Header-Filtering, Liga-Name Parsing |
| **1.2.0** | 2025-10-10 | Spielplan-Domain, BBB-Integration |
| **1.1.0** | 2025-10-09 | Spieler-Domain, 9-Skill-System |
| **1.0.0** | 2025-10-08 | Initial Release |

Siehe [CHANGELOG.md](./CHANGELOG.md) für Details.

---

## 🗺️ Roadmap

### Q4 2025 (Oktober - Dezember)

#### Phase 2: Einsatzplanung (4 Wochen)
- [ ] 8-Achtel-Editor
- [ ] DBB-Regelvalidierung
- [ ] Spieler-Bewertungen Integration
- [ ] Ersatz-Vorschläge

#### Phase 3: Spieltag-Features (6 Wochen)
- [ ] Timer & Live-Tracking
- [ ] Spiel-Statistiken
- [ ] Schnelle Wechsel
- [ ] PDF-Export

#### Phase 4: Training & Analysen (4 Wochen)
- [ ] Training-Tracking
- [ ] Benchmark-Analysen
- [ ] Performance-Metriken
- [ ] Daten-Export

Siehe [STATUS.md](./STATUS.md) für detaillierte Roadmap.

---

## 📝 Scripts

```bash
# Development
npm run dev              # Vite Dev Server
npm run type-check       # TypeScript Check
npm run lint             # ESLint

# Building
npm run build            # Production Build
npm run preview          # Preview Build

# Testing
npm test                 # Vitest (watch)
npm run test:ui          # Test UI
npm run test:coverage    # Coverage Report
```

---

## 🤝 Contributing

Dies ist ein privates Projekt. Contributions sind aktuell nicht möglich.

---

## 📄 Lizenz

Private Entwicklung - Keine öffentliche Lizenz

---

## 👨‍💻 Autor

Entwickelt mit ❤️ von einem Basketball-Trainer für Basketball-Trainer

---

## 🙏 Credits

- **React** - Meta
- **TypeScript** - Microsoft
- **Vite** - Evan You
- **Dexie.js** - David Fahlander
- **Tailwind CSS** - Adam Wathan
- **Zustand** - Daishi Kato
- **Lucide Icons** - Lucide Contributors
- **Papaparse** - Matt Holt

---

**Version:** 1.2.3  
**Letzte Aktualisierung:** 13. Oktober 2025  
**Status:** ✅ Aktive Entwicklung

---

## 📧 Support

Bei Fragen oder Problemen öffne ein Issue im Repository.

---

[📚 Zur vollständigen Dokumentation →](./docs/README.md)
