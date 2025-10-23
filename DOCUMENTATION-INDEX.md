# Basketball PWA - Dokumentations-Index

**Letzte Aktualisierung:** 22. Oktober 2025  
**Projekt-Status:** In Entwicklung  
**Schema-Version:** v4.0

---

## 📋 Übersicht

Dieser Index bietet eine strukturierte Übersicht über alle projektrelevanten Dokumente der Basketball PWA.

---

## 🎯 Projekt-Übersicht

### **Haupt-Dokumentation**

| Dokument | Beschreibung | Status | Version |
|----------|--------------|--------|---------|
| [docs/README.md](docs/README.md) | **Haupt-Dokumentations-Index** | ✅ Aktuell | - |
| [docs/requirements/basketball-pwa-spec-v2.md](docs/requirements/basketball-pwa-spec-v2.md) | **Hauptspezifikation** - Vollständige technische Spezifikation | ✅ Aktuell | v2.0 |
| [docs/architecture/datenbank-schema-update_v3.md](docs/architecture/datenbank-schema-update_v3.md) | Datenbank-Schema und Migrationspfade | ✅ Aktuell | v3.0 |
| [docs/architecture/ANALYSE-Schema-Änderungen.md](docs/architecture/ANALYSE-Schema-Änderungen.md) | Schema-Änderungs-Analysen | ✅ Aktuell | - |

---

## 🔄 User Flows & Prozesse

### **App-Start & Onboarding**

| Dokument | Beschreibung | Status | Format |
|----------|--------------|--------|--------|
| [docs/userflows/app-start_onboarding_flow_v3.1.md](docs/userflows/app-start_onboarding_flow_v3.1.md) | **Primär** - Detaillierte Onboarding-Beschreibung mit BBB-Import | ✅ Aktuell | Text |
| [docs/userflows/App-Start-Flows.md](docs/userflows/App-Start-Flows.md) | Visuelle Flow-Diagramme (Mermaid) | ✅ Aktuell | Mermaid |
| [docs/userflows/projekt-zusammenfassng-userflow.md](docs/userflows/projekt-zusammenfassng-userflow.md) | Projekt-Kurzfassung für Kontext-Übergabe | ✅ Aktuell | Text |

**Features:**
- Einzel-URL-Eingabe für BBB-Liga (liga_id Parameter)
- Automatische Ableitung von Spielplan, Tabelle, Ergebnisse
- Pflicht-CSV-Import für Spieler und Trikots
- Multi-Team-Support

---

## 📊 Datenmodell & Architektur

| Dokument | Beschreibung | Status | Format |
|----------|--------------|--------|--------|
| [docs/architecture/basketball-erd.mermaid](docs/architecture/basketball-erd.mermaid) | Entity-Relationship-Diagramm | ✅ Aktuell | Mermaid |
| [docs/architecture/datenstruktur.puml](docs/architecture/datenstruktur.puml) | PlantUML Datenstruktur | ⚠️ Prüfen | PlantUML |
| [basketball-app/prototypes/schema-designer.tsx](basketball-app/prototypes/schema-designer.tsx) | Interaktiver Schema-Designer | ✅ v4.0 | React/TSX |

---

## 🏀 Crawler & Daten-Import

### **Club & Team Crawler**

| Dokument | Beschreibung | Status |
|----------|--------------|--------|
| [docs/CRAWLER-V2-EXPLAINED.md](docs/CRAWLER-V2-EXPLAINED.md) | **Basis-Logik** - Detaillierte Erklärung v2 Crawler | ✅ Aktuell |
| [docs/CRAWLER-BULK.md](docs/CRAWLER-BULK.md) | Bulk Crawler für Deutschland-weite Daten | ✅ Aktuell |
| [docs/CRAWLER-COMPARISON.md](docs/CRAWLER-COMPARISON.md) | Vergleich: Incremental vs Bulk Crawler | ✅ Aktuell |
| [docs/SPLIT-CLUBS.md](docs/SPLIT-CLUBS.md) | Split-Script: clubs-germany.json → Chunks | ✅ Aktuell |
| [docs/STATISCHE-VERBAENDE.md](docs/STATISCHE-VERBAENDE.md) | Verbands-ID Struktur (Referenz) | ✅ Aktuell |

**Scripts:**
```bash
npm run crawl:clubs:bulk      # Deutschland-weiter Bulk Crawl
npm run crawl:clubs           # Incremental Crawl (einzelner Verband)
npm run split:clubs           # Split in Chunks (Lazy Loading)
npm run update:verbaende      # Update Verbands-Konstanten
```

---

## 🎓 Fachliche Anforderungen

| Dokument | Beschreibung | Status | Zielgruppe |
|----------|--------------|--------|------------|
| [docs/requirements/Anforderungen-Team-Management.md](docs/requirements/Anforderungen-Team-Management.md) | **Umfassende Anforderungserhebung** für Minibasketball (U10) | ✅ Aktuell | U8/U10/U12 |

**Inhalte:**
- DBB-Minibasketball-Regelwerk
- 9 Kernmetriken mit Gewichtungen
- User Stories
- Inventarmanagement
- Einsatzplanung-Algorithmen

---

## 🛠️ Prototypen & Komponenten

| Dokument | Beschreibung | Status | Technologie |
|----------|--------------|--------|-------------|
| [basketball-app/prototypes/README.md](basketball-app/prototypes/README.md) | Prototypen-Übersicht | ✅ Aktuell | - |
| [basketball-app/prototypes/schema-designer.tsx](basketball-app/prototypes/schema-designer.tsx) | Schema Designer v4.0 | ✅ Aktuell | React/TSX |
| [basketball-app/prototypes/pwa-mvp.tsx](basketball-app/prototypes/pwa-mvp.tsx) | MVP Legacy-Prototyp | 🚧 Referenz | React/TSX |

⚠️ **Hinweis:** Prototypen sind NICHT Teil des Production-Builds.

---

## 📁 Projektstruktur

```
Basketball-Apps/
├── DOCUMENTATION-INDEX.md          # Dieser Index
├── DOCS-CLEANUP-COMPLETE.md        # Cleanup-Protokoll (22.10.2025)
├── .env
├── .gitignore
│
├── docs/                           # 📚 Projekt-Dokumentation
│   ├── README.md                   # Dokumentations-Haupt-Index
│   │
│   ├── requirements/               # Anforderungen
│   │   ├── basketball-pwa-spec-v2.md
│   │   └── Anforderungen-Team-Management.md
│   │
│   ├── architecture/               # Architektur & Schema
│   │   ├── basketball-erd.mermaid
│   │   ├── datenstruktur.puml
│   │   ├── datenbank-schema-update_v3.md
│   │   └── ANALYSE-Schema-Änderungen.md
│   │
│   ├── userflows/                  # User Flows
│   │   ├── app-start_onboarding_flow_v3.1.md
│   │   ├── App-Start-Flows.md
│   │   └── projekt-zusammenfassng-userflow.md
│   │
│   ├── CRAWLER-V2-EXPLAINED.md     # Crawler Basis-Logik
│   ├── CRAWLER-BULK.md             # Bulk Crawler
│   ├── CRAWLER-COMPARISON.md       # Crawler-Vergleich
│   ├── SPLIT-CLUBS.md              # Split-Script
│   ├── STATISCHE-VERBAENDE.md      # Verbands-IDs
│   │
│   └── archive/                    # 📦 Archivierte Dokumente
│       ├── README.md               # Archiv-Index
│       ├── migrations/             # Abgeschlossene Migrations
│       ├── cleanup/                # Refactoring-Protokolle
│       ├── crawler/                # Alte Crawler-Planungen
│       ├── packages/               # Package-Management Historie
│       ├── security/               # Security-Fixes
│       └── fixes/                  # Bug-Fixes
│
├── basketball-app/                 # 🏀 Haupt-Applikation
│   ├── src/                        # Production Code
│   │   ├── domains/               # Domain-Driven Design
│   │   │   ├── onboarding/
│   │   │   ├── team/
│   │   │   ├── spieler/
│   │   │   ├── spielplan/
│   │   │   ├── dashboard/
│   │   │   ├── bbb/
│   │   │   └── verein/
│   │   ├── shared/
│   │   │   ├── types/
│   │   │   └── db/
│   │   └── stores/
│   │
│   ├── prototypes/                 # 🧪 Entwicklungs-Prototypen
│   │   ├── README.md
│   │   ├── schema-designer.tsx    # v4.0
│   │   └── pwa-mvp.tsx
│   │
│   ├── test/                       # Tests
│   ├── STATUS.md                   # Implementierungs-Status
│   └── README.md
│
├── scripts/                        # 🔧 Crawler & Tools
│   ├── crawl-clubs-bulk.js        # Bulk Crawler
│   ├── crawl-clubs.js             # Incremental Crawler
│   ├── split-clubs-data.js        # Split-Script
│   └── update-verbaende.js        # Verbands-Update
│
├── data/                           # 📊 Crawler-Daten
│   └── clubs-germany.json         # Club-Datenbank
│
└── archive/                        # 🗄️ Code-Backups
    └── *.backup
```

---

## 🎯 Implementierungs-Status

Siehe [basketball-app/STATUS.md](basketball-app/STATUS.md) für detaillierten Entwicklungs-Status.

**Aktueller Stand (Oktober 2025):**
- ✅ Build-Setup (TypeScript, Vite, PWA)
- ✅ Datenbank-Schema v4.0 (24 Tabellen, Dexie/IndexedDB, Compound-Indizes)
- ✅ WCAG 2.0 AA Compliance
- ✅ React 19.2.0 Migration
- ✅ Club Crawler (Bulk & Incremental)
- 🚧 Onboarding Flow (in Arbeit)
- ⏳ Dashboard
- ⏳ BBB-Integration
- ⏳ Spieler-Management
- ⏳ Einsatzplanung

---

## 📝 Versionierung

### Spezifikationen
- **v2.0** (Aktuell) - Erweiterte Spezifikation mit DSGVO, Datensparsamkeit, BBB-Integration
- **v1.0** (Archiviert) - Basis-Spezifikation

### Datenbank-Schema
- **v4.0** (Aktuell) - Compound-Indizes, Performance-Optimierung
- **v3.0** (Dokumentiert) - 24 Tabellen, Multi-Team-Support, BBB-Sync
- v2.x, v1.x - (Siehe Archiv)

### Flows
- **v3.1** (Aktuell) - Onboarding mit Einzel-URL-Eingabe
- v3.0 - Basis Onboarding Flow

---

## 📦 Archivierte Dokumentation

Siehe [docs/archive/README.md](docs/archive/README.md) für vollständige Übersicht.

**Kategorien:**
- **migrations/** - Abgeschlossene Migrations (React 19, Onboarding V2, Dependencies, Verbände-Optimierung)
- **cleanup/** - Refactoring-Protokolle
- **crawler/** - Alte Crawler-Planungen
- **packages/** - Package-Management Historie
- **security/** - Security-Fix Dokumentationen
- **fixes/** - Spezifische Bug-Fixes

---

## 🔍 Dokumenten-Suche

### Nach Thema

**Onboarding:**
- [docs/userflows/app-start_onboarding_flow_v3.1.md](docs/userflows/app-start_onboarding_flow_v3.1.md)
- [docs/userflows/App-Start-Flows.md](docs/userflows/App-Start-Flows.md)

**Datenmodell:**
- [docs/requirements/basketball-pwa-spec-v2.md](docs/requirements/basketball-pwa-spec-v2.md) (Abschnitt 2)
- [docs/architecture/basketball-erd.mermaid](docs/architecture/basketball-erd.mermaid)
- [docs/architecture/datenbank-schema-update_v3.md](docs/architecture/datenbank-schema-update_v3.md)
- [basketball-app/prototypes/schema-designer.tsx](basketball-app/prototypes/schema-designer.tsx) (interaktiv)

**Crawler & Daten:**
- [docs/CRAWLER-V2-EXPLAINED.md](docs/CRAWLER-V2-EXPLAINED.md)
- [docs/CRAWLER-BULK.md](docs/CRAWLER-BULK.md)
- [docs/SPLIT-CLUBS.md](docs/SPLIT-CLUBS.md)
- [docs/STATISCHE-VERBAENDE.md](docs/STATISCHE-VERBAENDE.md)

**BBB-Integration:**
- [docs/userflows/app-start_onboarding_flow_v3.1.md](docs/userflows/app-start_onboarding_flow_v3.1.md) (Abschnitt 3)
- [docs/requirements/basketball-pwa-spec-v2.md](docs/requirements/basketball-pwa-spec-v2.md) (BBB-Sync)

**Regeln & Anforderungen:**
- [docs/requirements/Anforderungen-Team-Management.md](docs/requirements/Anforderungen-Team-Management.md)
- [docs/requirements/basketball-pwa-spec-v2.md](docs/requirements/basketball-pwa-spec-v2.md) (Abschnitt 1)

**Implementierung:**
- [basketball-app/STATUS.md](basketball-app/STATUS.md)
- [basketball-app/README.md](basketball-app/README.md)

---

## 🗑️ Dokumentations-Cleanup

**Letzte Bereinigung:** 22. Oktober 2025

- ✅ 15 Dokumente archiviert/reorganisiert
- ✅ Root-Verzeichnis bereinigt (93% Reduktion)
- ✅ Archive strukturiert nach Kategorien
- ✅ Alle historischen Dokumente erhalten

Details: [DOCS-CLEANUP-COMPLETE.md](DOCS-CLEANUP-COMPLETE.md)

---

## 📞 Anmerkungen

### Zu prüfen:
- `docs/architecture/datenstruktur.puml` - Überschneidung mit `basketball-erd.mermaid`?

### Offene Punkte:
- Dokumentation für Test-Strategie erstellen
- API-Dokumentation für BBB-Parser erstellen
- Deployment-Guide erstellen

---

## 🚀 Nächste Schritte

1. **Dokumentation:**
   - Test-Strategie dokumentieren
   - BBB-Parser API dokumentieren
   - Deployment-Guide erstellen
   - Split-Clubs Integration dokumentieren

2. **Entwicklung:**
   - Onboarding Flow abschließen
   - Dashboard implementieren
   - BBB-Integration testen
   - Lazy Loading für Club-Chunks

3. **Qualitätssicherung:**
   - Unit-Tests für kritische Pfade
   - PACT-Tests für externe Services
   - WCAG 2.0 AA Audit

---

## 🔗 Quick Links

- [📚 Dokumentations-Index](docs/README.md)
- [🧪 Prototypen](basketball-app/prototypes/README.md)
- [📊 Projekt-Status](basketball-app/STATUS.md)
- [🏀 Basketball-App](basketball-app/)
- [🔧 Crawler Scripts](scripts/)
- [📦 Archiv](docs/archive/README.md)
- [🗑️ Cleanup-Protokoll](DOCS-CLEANUP-COMPLETE.md)

---

**Letzte Änderungen:**
- 22. Oktober 2025: Dokumentations-Cleanup & Archivierung
- 22. Oktober 2025: Crawler-Dokumentation hinzugefügt
- 22. Oktober 2025: Archive strukturiert (migrations, cleanup, crawler, packages, security, fixes)
- 12. Oktober 2025: Ordnerstruktur komplett reorganisiert
- 12. Oktober 2025: Schema Designer auf v4.0 aktualisiert
