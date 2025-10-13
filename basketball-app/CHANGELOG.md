# Changelog

Alle wichtigen Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/),
und dieses Projekt folgt [Semantic Versioning](https://semver.org/lang/de/).

---

## [1.2.3] - 2025-10-13

### 🐛 Bugfixes
- **CORS-Proxy Fallback**: Implementierung eines robusten Fallback-Mechanismus für CORS-Proxies
  - Primary: `corsproxy.io` (zuverlässiger als `allorigins.win`)
  - Fallback 1: `cors-anywhere.herokuapp.com`
  - Fallback 2: `allorigins.win`
  - 10 Sekunden Timeout pro Proxy-Versuch
- **Liga-ID Extraktion**: Robustere Extraktion unterstützt jetzt `liga_id`, `ligaId` und `LIGA_ID` Parameter
- **Tabellen-Validierung**: 15 neue Tests für `parseTabellenDaten()` mit vollständiger Business-Logik-Validierung

### 📝 Dokumentation
- Dokumentationsstruktur aufgeräumt und in `docs/` Ordner verschoben
- Neue Ordnerstruktur:
  - `docs/bugfixes/` - Bugfix-Protokolle
  - `docs/development/` - Development-Guides
  - `docs/archive/` - Veraltete Dokumente
- Erstellung von `CHANGELOG.md`

### 🧪 Tests
- 3 neue Tests für Liga-ID Extraktion (camelCase, UPPERCASE, Priorität)
- 15 neue Tests für Tabellen-Parsing mit Validierung:
  - Siege + Niederlagen = Spiele
  - Diff = Körbe Plus - Körbe Minus
  - Punkte = Siege * 2

---

## [1.2.2] - 2025-10-12

### 🔒 Security
- Security-Update für kritische Dependencies
- Aktualisierung von `vite` auf neueste Version
- Behebung von bekannten Vulnerabilities

### 📚 Dokumentation
- `SECURITY-UPDATE-v1.2.2.md` erstellt

---

## [1.2.1] - 2025-10-11

### 🐛 Bugfixes
- **Header-Filtering**: Robustere Filterung von Header-Zeilen im BBB-Parser
- **Liga-Name und Scores**: Verbessertes Parsing von Liga-Namen und Spielergebnissen

### 📚 Dokumentation
- `BUGFIX-v1.2.1.md` erstellt
- `BUGFIX-HEADER-FILTERING.md` erstellt
- `BUGFIX-LIGA-NAME-AND-SCORES.md` erstellt

---

## [1.2.0] - 2025-10-10

### ✨ Features
- **Spielplan-Domain**: Vollständige Implementierung der Spielplan-Verwaltung
- **BBB-Integration Basis**: Grundlegende Integration mit basketball-bund.net
  - `BBBParserService` für HTML-Parsing
  - Extraktion von Liga-Informationen
  - Team-Parsing aus Tabellen
  - Spielplan-Import
  - Ergebnisse-Import

### 🔧 Verbesserungen
- Tabellen werden jetzt vor Spielplan geparst (zuverlässigere Team-Extraktion)
- Vollständige Tabellen-Statistiken (Rang, Siege, Niederlagen, Punkte, Körbe, Diff)
- Merge-Strategie für Spielplan und Ergebnisse

### 🧪 Tests
- Umfangreiche Tests für `BBBParserService`
- Integration Tests für BBB-Parsing

### 📚 Dokumentation
- `UPDATE-v1.2-Spielplan-Domain.md` erstellt
- `KORREKTUR-BBB-Integration.md` erstellt
- `PWA-SERVICE-WORKER-FIX.md` erstellt

---

## [1.1.0] - 2025-10-09

### ✨ Features
- **Spieler-Domain**: Vollständige Implementierung des Spieler-Managements
- **Bewertungssystem**: 9-Skill-Bewertungssystem für Spieler
  - Wurf
  - Layup
  - Freiwurf
  - Passen
  - Dribbling
  - Verteidigung
  - Rebounding
  - Schnelligkeit
  - Basketball-IQ

### 📚 Dokumentation
- `UPDATE-v1.1-Spieler-Domain.md` erstellt

---

## [1.0.0] - 2025-10-08

### 🎉 Initial Release

#### ✨ Features
- **Onboarding Flow**
  - Multi-Step Setup mit Progress-Indicator
  - Team-Erstellung mit Altersklassen (U8-U18)
  - Vereins-Zuordnung
  - CSV-Import für Spieler & Trikots
  - Optional: BBB-URL für späteren Spielplan-Import

- **Team Management**
  - Multi-Team-Support
  - Saison-Verwaltung
  - Leistungsorientierte U12-Kennzeichnung

- **Spieler-Import**
  - Robuster CSV-Parser mit Validation
  - Erziehungsberechtigte-Zuordnung
  - Konfektionsgrößen für Trikotvergabe
  - TNA-Nummer für Ligaberechtigung

- **Trikot-Import**
  - Wendejerseys & Hosen
  - Größen-Tracking (EU 116-170)
  - Farben (dunkel/hell)
  - Verfügbarkeits-Status

- **Dashboard**
  - Übersicht mit Statistiken
  - Spieler-Count
  - Trikot-Count
  - Spiele-Count

#### 🏗️ Architektur
- **Domain-Driven Design**: Klare Trennung nach Domains
- **Test-Driven Development**: Umfangreiche Testabdeckung
- **WCAG 2.0 AA Compliance**: Barrierefreie Oberfläche
- **PWA**: Progressive Web App mit Offline-Support
- **IndexedDB**: Browser-native Datenpersistenz

#### 🧪 Tests
- 14 Tests für TeamService
- CSV-Import Validierung
- Umfassende Unit-Tests

#### 📚 Tech Stack
- React 18 + TypeScript
- Vite (Build Tool)
- Zustand (State Management)
- Dexie.js (IndexedDB Wrapper)
- Tailwind CSS (Styling)
- Vitest (Testing)
- Papaparse (CSV Parsing)

#### 📚 Dokumentation
- `README.md` - Hauptdokumentation
- `SETUP.md` - Setup-Anleitung
- `STATUS.md` - Projekt-Status
- `RELEASE-NOTES.md` - Release Notes

---

## Kategorien

- **✨ Features** - Neue Features
- **🔧 Verbesserungen** - Verbesserungen bestehender Features
- **🐛 Bugfixes** - Fehlerbehebungen
- **🔒 Security** - Sicherheitsupdates
- **📚 Dokumentation** - Dokumentationsänderungen
- **🧪 Tests** - Teständerungen
- **🏗️ Architektur** - Architekturänderungen
- **♻️ Refactoring** - Code-Refactoring ohne Funktionsänderung
- **⚡ Performance** - Performance-Verbesserungen
- **♿ Accessibility** - Barrierefreiheit-Verbesserungen

---

## Semantic Versioning

- **MAJOR** (x.0.0) - Breaking Changes
- **MINOR** (0.x.0) - Neue Features (rückwärtskompatibel)
- **PATCH** (0.0.x) - Bugfixes (rückwärtskompatibel)
