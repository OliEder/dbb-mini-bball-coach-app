# 📁 Basketball Team Manager - Projekt-Struktur

**Version:** 2.0  
**Letzte Aktualisierung:** 2025-10-30  
**Zweck:** Zentrale Referenz für konsistente Dateiablage (Menschen + KI)  
**Struktur:** Option C - Hybrid (Planning → Design → Implementation → Operations)

> ⚠️ **WICHTIG für KI-Assistenten:**  
> Diese Datei ist als Projektfile verfügbar und MUSS vor jeder Datei-Operation konsultiert werden!

---

## 🎯 Grundprinzipien

1. **ROOT bleibt sauber** - Nur essenzielle Konfigurations-Dateien im Root
2. **Dokumentation → `/docs/`** - ALLE Markdown-Dokumente gehören in Unterordner
3. **Scripts → `/scripts/`** - ALLE ausführbaren Scripts gehören hierhin
4. **Tests → `/tests/`** - Strukturiert nach Test-Typen
5. **Source Code → `/src/`** - Domain-driven Design Struktur
6. **Dokumente folgen Projekt-Phasen** - Planning → Specifications → Architecture → Development → Operations

---

## 📂 Vollständige Verzeichnisstruktur

```
basketball-app/
│
├── 📄 ROOT (nur essenzielle Configs)
│   ├── package.json                # NPM-Konfiguration
│   ├── tsconfig.json               # TypeScript-Konfiguration
│   ├── vite.config.ts              # Vite-Build-Konfiguration
│   ├── vitest.config.ts            # Test-Konfiguration
│   ├── playwright.config.ts        # E2E-Test-Konfiguration
│   ├── tailwind.config.js          # Styling-Konfiguration
│   ├── eslint.config.js            # Linting-Konfiguration
│   ├── .gitignore                  # Git-Ignorierung
│   ├── README.md                   # Projekt-Übersicht
│   └── PROJECT-STRUCTURE.md        # ← DIESE DATEI (zentrale Referenz)
│
├── 📁 docs/                        # ALLE Dokumentation
│   ├── README.md                   # Dokumentations-Übersicht
│   │
│   ├── 📁 planning/                # 🎯 PHASE 1: Planung & Konzeption
│   │   ├── requirements/           # Anforderungen
│   │   │   ├── USER-STORIES.md
│   │   │   ├── FUNCTIONAL-REQUIREMENTS.md
│   │   │   └── NON-FUNCTIONAL-REQUIREMENTS.md
│   │   ├── roadmaps/               # Roadmaps & Meilensteine
│   │   │   ├── PRODUCT-ROADMAP.md
│   │   │   ├── IMPLEMENTATION-ROADMAP.md
│   │   │   └── MULTI-TEAM-SUPPORT-PLAN.md
│   │   └── concepts/               # Konzepte & Design Docs
│   │       ├── SIMPLIFIED_ONBOARDING.md
│   │       └── MULTI-TEAM-CONCEPT.md
│   │
│   ├── 📁 specifications/          # 📐 PHASE 2: Spezifikationen
│   │   ├── api/                    # API-Spezifikationen
│   │   │   ├── DBB-API-COMPLETE-DOCUMENTATION.md
│   │   │   ├── basketball-bund-net-api-V1.yaml
│   │   │   └── REST-API-SPEC.md
│   │   ├── data-models/            # Datenmodelle
│   │   │   ├── DATABASE-SCHEMA.md
│   │   │   └── DOMAIN-MODEL.md
│   │   └── interfaces/             # UI/UX Spezifikationen
│   │       └── UI-SPECIFICATIONS.md
│   │
│   ├── 📁 architecture/            # 🏗️ PHASE 3: Architektur
│   │   ├── decisions/              # ADRs (Architecture Decision Records)
│   │   │   ├── 001-domain-driven-design.md
│   │   │   ├── 002-indexeddb-storage.md
│   │   │   └── README.md
│   │   ├── diagrams/               # Architektur-Diagramme
│   │   │   ├── system-overview.mmd
│   │   │   ├── domain-model.mmd
│   │   │   └── data-flow.mmd
│   │   └── patterns/               # Design Patterns & Best Practices
│   │       ├── DOMAIN-PATTERNS.md
│   │       └── TESTING-PATTERNS.md
│   │
│   ├── 📁 development/             # 💻 PHASE 4: Entwicklung
│   │   ├── PROJECT-STATUS.md       # ← ZENTRALE Status-Datei
│   │   ├── QUICKSTART.md           # Schnellstart-Anleitung
│   │   ├── TYPESCRIPT-GUIDE.md     # TypeScript Best Practices
│   │   ├── DEVELOPMENT-GUIDE.md    # Development Workflows
│   │   ├── MULTI-TEAM-IMPLEMENTATION-LOG.md
│   │   ├── SETTINGS-BACKUP-FEATURE.md
│   │   └── BUILD-TROUBLESHOOTING.md
│   │
│   ├── 📁 testing/                 # 🧪 Test-Dokumentation
│   │   ├── TEST-STRATEGY.md        # Test-Strategie
│   │   ├── TEST-CONSOLIDATION-LOG.md
│   │   ├── TEST-INVENTORY.md       # Test-Inventar
│   │   ├── MANUAL-TEST-MIGRATION-CHECKLIST.md
│   │   └── ACCESSIBILITY-TESTING.md
│   │
│   ├── 📁 operations/              # ⚙️ PHASE 5: Operations & Maintenance
│   │   ├── migrations/             # Datenbank-Migrationen
│   │   │   ├── README-V7.md
│   │   │   ├── DB-V7-MIGRATION.md
│   │   │   ├── MIGRATION-V6-STATUS.md
│   │   │   ├── V6-MIGRATION-COMPLETE.md
│   │   │   └── REACT_ROUTER_MIGRATION.md
│   │   ├── bugfixes/               # Bugfix-Berichte
│   │   │   ├── [YYYY-MM-DD]-[ISSUE].md
│   │   │   └── KNOWN-ISSUES.md
│   │   └── deployment/             # Deployment-Dokumentation
│   │       ├── DEPLOYMENT-GUIDE.md
│   │       └── GITHUB-PAGES-SETUP.md
│   │
│   └── 📁 archive/                 # 🗄️ Veraltete Dokumentation
│       └── [YYYY-MM-DD]-[TITEL].md # Mit Archivierungs-Datum
│
├── 📁 scripts/                     # ALLE ausführbaren Scripts
│   ├── build/                      # Build-Scripts
│   │   ├── deploy.sh
│   │   ├── fix-build-errors.sh
│   │   └── prepare-commit.sh
│   │
│   ├── testing/                    # Test-Scripts
│   │   ├── run-tests.sh
│   │   ├── analyze-test-failures.sh
│   │   └── check-test-duplicates.sh
│   │
│   ├── cleanup/                    # Cleanup-Scripts
│   │   ├── cleanup-all.sh
│   │   ├── consolidate-structure.sh
│   │   └── merge-duplicates.sh
│   │
│   └── development/                # Development-Scripts
│       ├── debug-npm.sh
│       └── start-monitor.sh
│
├── 📁 src/                         # Source Code (Domain-Driven Design)
│   ├── domains/                    # Fachliche Domains
│   │   ├── player/                 # Spieler-Domain
│   │   ├── game/                   # Spiel-Domain
│   │   ├── team/                   # Team-Domain
│   │   └── bbb-api/                # BBB API Integration
│   │
│   ├── shared/                     # Shared Kernel
│   │   ├── infrastructure/         # Infrastruktur-Services
│   │   ├── utils/                  # Utilities
│   │   └── types/                  # Gemeinsame Types
│   │
│   └── app/                        # Application Layer
│       ├── components/             # React Components
│       ├── pages/                  # Page Components
│       └── hooks/                  # Custom Hooks
│
├── 📁 tests/                       # ALLE Tests
│   ├── unit/                       # Unit Tests (spiegelt src/-Struktur)
│   │   ├── domains/
│   │   │   ├── player/
│   │   │   ├── game/
│   │   │   ├── team/
│   │   │   └── bbb-api/
│   │   └── shared/
│   │
│   ├── integration/                # Integration Tests
│   │   ├── api/
│   │   └── database/
│   │
│   ├── contract/                   # PACT Contract Tests
│   │   └── pacts/
│   │
│   ├── e2e/                        # Playwright E2E Tests
│   │   └── scenarios/
│   │
│   ├── visual/                     # Visual Regression Tests
│   ├── security/                   # Security Tests
│   ├── performance/                # Performance Tests
│   ├── accessibility/              # Accessibility Tests
│   │
│   └── helpers/                    # Test Helpers & Utilities
│       ├── test-helpers.ts
│       └── v7-test-helpers.ts
│
├── 📁 public/                      # Statische Assets
│   ├── icons/                      # PWA Icons
│   ├── manifest.json               # PWA Manifest
│   └── robots.txt
│
├── 📁 backups/                     # Automatische Backups
├── 📁 coverage/                    # Test Coverage Reports
├── 📁 dist/                        # Build Output
├── 📁 node_modules/                # NPM Dependencies
├── 📁 pacts/                       # PACT Contract Files
├── 📁 playwright-report/           # Playwright Reports
└── 📁 test-results/                # Test Ergebnisse

```

---

## 🔄 Dokumenttyp-Zuordnung

### Planning (Anforderungen, Roadmaps, Konzepte)
```
docs/planning/requirements/   → Funktionale/Nicht-funktionale Anforderungen, User Stories
docs/planning/roadmaps/       → Projekt-Roadmaps, Meilensteine, Release-Pläne
docs/planning/concepts/       → Konzept-Dokumente, Design Docs, RFCs
```

**Beispiele:**
- `MULTI-TEAM-SUPPORT-PLAN.md` → `docs/planning/roadmaps/`
- `SIMPLIFIED_ONBOARDING.md` → `docs/planning/concepts/`
- User Stories → `docs/planning/requirements/`

### Specifications (API, Datenmodelle, Schnittstellen)
```
docs/specifications/api/          → API-Spezifikationen, OpenAPI, REST-Docs
docs/specifications/data-models/  → Datenbank-Schema, Domain-Modelle
docs/specifications/interfaces/   → UI/UX-Spezifikationen
```

**Beispiele:**
- `DBB-API-COMPLETE-DOCUMENTATION.md` → `docs/specifications/api/`
- `basketball-bund-net-api-V1.yaml` → `docs/specifications/api/`
- `DATABASE-SCHEMA.md` → `docs/specifications/data-models/`

### Architecture (ADRs, Diagramme, Patterns)
```
docs/architecture/decisions/  → Architecture Decision Records (ADRs)
docs/architecture/diagrams/   → System-Diagramme, UML, Mermaid
docs/architecture/patterns/   → Design Patterns, Best Practices
```

**Beispiele:**
- ADRs → `docs/architecture/decisions/`
- Architektur-Diagramme → `docs/architecture/diagrams/`
- Domain-Patterns → `docs/architecture/patterns/`

### Development (Status, Guides, Implementation)
```
docs/development/  → Entwicklungs-Status, Quickstarts, How-Tos, Troubleshooting
```

**Beispiele:**
- `PROJECT-STATUS.md` → `docs/development/` (ZENTRAL)
- `QUICKSTART.md` → `docs/development/`
- `BUILD-TROUBLESHOOTING.md` → `docs/development/`

### Testing (Test-Strategie, Inventar, Berichte)
```
docs/testing/  → Test-Dokumentation, Coverage, Checklisten
```

**Beispiele:**
- `TEST-STRATEGY.md` → `docs/testing/`
- `TEST-CONSOLIDATION-LOG.md` → `docs/testing/`
- `ACCESSIBILITY-TESTING.md` → `docs/testing/`

### Operations (Migrations, Bugfixes, Deployment)
```
docs/operations/migrations/  → Datenbank-Migrationen, Feature-Migrationen
docs/operations/bugfixes/    → Bugfix-Berichte mit Datum
docs/operations/deployment/  → Deployment-Guides, CI/CD
```

**Beispiele:**
- `DB-V7-MIGRATION.md` → `docs/operations/migrations/`
- `2025-10-30-BBBSyncService.md` → `docs/operations/bugfixes/`
- `GITHUB-PAGES-SETUP.md` → `docs/operations/deployment/`

---

## 🔄 Migrations-Bedarf (Aktuell)

### ❌ ROOT → docs/ (nach Dokumenttyp)

```bash
# Planning Docs
IMPLEMENTATION-ROADMAP.md → docs/planning/roadmaps/IMPLEMENTATION-ROADMAP.md
SIMPLIFIED_ONBOARDING.md → docs/planning/concepts/SIMPLIFIED_ONBOARDING.md

# Development Docs
BUILD-FIXES.md → docs/development/BUILD-FIXES.md
BUILD-TROUBLESHOOTING.md → docs/development/BUILD-TROUBLESHOOTING.md
SETUP.md → docs/development/SETUP.md
STATUS.md → docs/development/STATUS.md (oder MERGE mit PROJECT-STATUS.md)

# Testing Docs
TEST-GUIDE.md → docs/testing/TEST-GUIDE.md
TEST-FIXES-SUMMARY.md → docs/testing/TEST-FIXES-SUMMARY.md
ACCESSIBILITY-TESTING.md → docs/testing/ACCESSIBILITY-TESTING.md

# Operations - Migrations
REACT_ROUTER_MIGRATION.md → docs/operations/migrations/REACT_ROUTER_MIGRATION.md
ONBOARDING-V2-FIX.md → docs/operations/migrations/ONBOARDING-V2-FIX.md
ONBOARDING-V2-UPDATE.md → docs/operations/migrations/ONBOARDING-V2-UPDATE.md

# Operations - Bugfixes (mit Datum)
FIX-BBBSyncService.md → docs/operations/bugfixes/2025-10-30-BBBSyncService.md
PACKAGE-FIX.md → docs/operations/bugfixes/2025-10-30-Package.md
VEREIN-DISCOVERY-UPDATE.md → docs/operations/bugfixes/2025-10-30-VereinDiscovery.md

# Archive (wenn veraltet)
DEPLOYMENT_COMPLETE.md → docs/archive/2025-10-30-DEPLOYMENT_COMPLETE.md
COMMIT-SUMMARY.md → docs/archive/2025-10-30-COMMIT-SUMMARY.md
CLEANUP-ANALYSIS.md → docs/archive/2025-10-30-CLEANUP-ANALYSIS.md
```

### ❌ Duplikate in docs/ (MERGE benötigt!)

```bash
# Diese erfordern intelligentes Merge:
docs/PROJECT-STATUS.md ↔ docs/development/PROJECT-STATUS.md
docs/TEST-CONSOLIDATION-LOG.md ↔ docs/testing/TEST-CONSOLIDATION-LOG.md
```

### ❌ Bestehende docs/development/ → Neue Struktur

```bash
# Migrations-Docs verschieben
docs/development/MIGRATION-V6-STATUS.md → docs/operations/migrations/
docs/development/V6-MIGRATION-COMPLETE.md → docs/operations/migrations/
docs/development/CHAT-HANDOVER-V6.md → docs/operations/migrations/
docs/development/REFACTORING-V6-NOTES.md → docs/operations/migrations/

# Planning-Docs verschieben
docs/development/MULTI-TEAM-SUPPORT-PLAN.md → docs/planning/roadmaps/
docs/development/MULTI-TEAM-IMPLEMENTATION-LOG.md → docs/development/ (bleibt)
```

### ❌ Bestehende docs/ → specifications/

```bash
# API-Docs erstellen/verschieben (falls vorhanden)
docs/DBB-API-COMPLETE-DOCUMENTATION.md → docs/specifications/api/
basketball-bund-net-api-V1.yaml → docs/specifications/api/
```

---

## 📋 Entscheidungsregeln für KI-Assistenten

### Beim Erstellen neuer Dateien:

**1. Dokumentation - Frage: "In welcher Projektphase?"**

```
📋 Anforderung/Konzept?     → docs/planning/[requirements|roadmaps|concepts]/
📐 API/Datenmodell-Spec?    → docs/specifications/[api|data-models|interfaces]/
🏗️ Architektur/ADR?         → docs/architecture/[decisions|diagrams|patterns]/
💻 Entwicklungs-Guide?      → docs/development/
🧪 Test-Dokumentation?      → docs/testing/
⚙️ Migration/Bugfix?        → docs/operations/[migrations|bugfixes|deployment]/
🗄️ Veraltet?                → docs/archive/YYYY-MM-DD-[TITEL].md
```

**2. Script - Frage: "Welcher Zweck?"**

```
🏗️ Build/Deploy?     → scripts/build/
🧪 Testing?          → scripts/testing/
🧹 Cleanup?          → scripts/cleanup/
💻 Development?      → scripts/development/
```

**3. Test - Frage: "Welcher Test-Typ?"**

```
Unit Test?         → tests/unit/[spiegelt src/-Struktur]
Integration Test?  → tests/integration/[api|database]/
Contract Test?     → tests/contract/
E2E Test?          → tests/e2e/scenarios/
[weitere]          → tests/[visual|security|performance|accessibility]/
```

**4. Source Code - Frage: "Welche Domain?"**

```
Fachliche Logik?      → src/domains/[player|game|team|bbb-api]/
Gemeinsame Utils?     → src/shared/[infrastructure|utils|types]/
UI Components?        → src/app/[components|pages|hooks]/
```

**5. Unsicher?**
```
→ **FRAGE NACH!**
→ Konsultiere PROJECT-STRUCTURE.md
→ Prüfe ähnliche existierende Dateien
```

### Beim Aktualisieren von Dokumentation:

1. **PROJECT-STATUS.md aktualisieren?**  
   → **NUR** diese Datei: `docs/development/PROJECT-STATUS.md`  
   → **NIEMALS** neue in ROOT oder docs/ direkt erstellen!

2. **Test-Dokumentation?**  
   → `docs/testing/TEST-CONSOLIDATION-LOG.md`  
   → `docs/testing/TEST-INVENTORY.md`

3. **Migration-Dokumentation?**  
   → `docs/operations/migrations/[feature]-MIGRATION.md`

4. **API-Spezifikation?**  
   → `docs/specifications/api/[API-NAME]-SPEC.md`

5. **ADR erstellen?**  
   → `docs/architecture/decisions/[NNN]-[titel].md`  
   → Nummerierung fortlaufend (001, 002, ...)

---

## 🚨 Häufige Fehler (VERMEIDEN!)

### ❌ FALSCH:

```bash
# Dokumente direkt im ROOT
basketball-app/NEW-FEATURE.md
basketball-app/API-SPEC.md

# Dokumente direkt in docs/
docs/NEW-CONCEPT.md
docs/BUGFIX-REPORT.md

# Falsche Kategorie
docs/development/API-SPECIFICATION.md  # → sollte in docs/specifications/api/
docs/testing/MIGRATION-GUIDE.md        # → sollte in docs/operations/migrations/
docs/architecture/QUICKSTART.md        # → sollte in docs/development/

# Scripts im ROOT
basketball-app/new-script.sh
```

### ✅ RICHTIG:

```bash
# Dokumente nach Projektphase
docs/planning/concepts/NEW-FEATURE-CONCEPT.md
docs/specifications/api/NEW-API-SPEC.md
docs/development/QUICKSTART.md
docs/operations/bugfixes/2025-10-30-BUGFIX-REPORT.md

# Scripts nach Zweck
scripts/build/new-build-script.sh
scripts/testing/new-test-script.sh

# Tests nach Typ
tests/unit/domains/player/PlayerService.test.ts
tests/e2e/scenarios/onboarding.spec.ts
```

---

## 📌 Checkliste vor jeder Datei-Operation

- [ ] Habe ich PROJECT-STRUCTURE.md konsultiert?
- [ ] Ist die Projektphase klar (Planning/Specifications/Architecture/Development/Testing/Operations)?
- [ ] Ist die Unter-Kategorie klar (z.B. api/data-models bei specifications)?
- [ ] Existiert die Datei bereits in einem anderen Ordner?
- [ ] Ist der Ziel-Pfad gemäß Struktur korrekt?
- [ ] Bei Unsicherheit: Habe ich nachgefragt?

---

## 🔄 Nächste Schritte (TODO)

1. [ ] Neue Ordner-Struktur erstellen (planning/specifications/operations)
2. [ ] Merge-Script erstellen: `scripts/cleanup/merge-duplicates.sh`
3. [ ] Root-Dateien nach `/docs/` migrieren (siehe Mapping oben)
4. [ ] Duplikate mergen (nicht löschen!)
5. [ ] Bestehende docs/development/ Dateien neu kategorisieren
6. [ ] Root-Scripts nach `/scripts/` migrieren
7. [ ] PROJECT-STRUCTURE.md als permanentes Projektfile registrieren

---

## 📞 Kontakt bei Strukturfragen

**Bei Unsicherheit:**
1. Konsultiere diese Datei (PROJECT-STRUCTURE.md)
2. Prüfe ähnliche existierende Dateien in der Zielkategorie
3. Frage den User/Developer **VOR** der Erstellung
4. **NIEMALS raten oder improvisieren!**

**Golden Rule:**  
Wenn du nicht 100% sicher bist → **FRAGE NACH!**

---

**Ende der PROJECT-STRUCTURE.md v2.0**
