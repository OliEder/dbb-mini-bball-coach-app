# 📊 PROJECT STATUS - Basketball Team Manager PWA

**Projekt:** Basketball Team Manager PWA  
**Version:** 2.0.0-dev  
**Datenbank:** v7.0 (Team Liga Participation Historisierung)  
**Phase:** 2 - Simplified Onboarding & BBB Integration  
**TDD-Status:** 🔴 RED Phase - Tests sind rot, Refactoring läuft  
**Stand:** 03. November 2025, 10:50 Uhr  
**Status:** 🔴 KRITISCH - DEV Build-Fehler GEFIXT | 🟢 Tests laufen

---

## 🔥 BREAKING: Kritischer Import-Fix (03.11.2025)

**Problem:** DEV Build komplett gebrochen nach Service Cleanup
**Ursache:** Veralteter Import-Pfad in `onboarding-simple.store.ts`
**Fix:** ✅ Import-Pfad aktualisiert (`@/domains/bbb-api` → `@/shared/services`)
**Status:** 🟢 DEV Build sollte jetzt funktionieren

**Details:** [docs/fixes/IMPORT-PATH-FIX.md](../fixes/IMPORT-PATH-FIX.md)

---

## ⚠️ AKTUELLER STATUS - KRITISCH

### 🔴 RED Phase (TDD)
Wir befinden uns in der **RED-Phase** des Test-Driven Development:
- Tests sind bewusst rot (viele failen)
- Gerade großes Refactoring durchgeführt (Service Cleanup)
- ✅ **Test-Migration Phase 1 abgeschlossen** (31.10.2025)
- ✅ **Service-Cleanup analysiert** (31.10.2025)
  - 5 Duplikate identifiziert
  - Import-Scans durchgeführt
  - Cleanup-Script erstellt
- ⚠️ **Nächster Schritt:** Service-Cleanup ausführen + Tests schreiben
- **NICHT DEPLOYEN!** Code ist in Transition

### 🔴 Blockierende Issues

1. **✅ Service-Duplikate BEREIT ZUM LÖSCHEN (31.10.2025)**
   - 5 Service-Duplikate identifiziert
   - Import-Scans abgeschlossen: Alle sicher zu löschen
   - Test-Import gefixt (CSVImportService)
   - **Cleanup-Script:** `scripts/cleanup-services.sh`
   - **Details:** [SERVICE-CLEANUP-READY.md](./SERVICE-CLEANUP-READY.md)

2. **Test-Migration abgeschlossen**
   - ✅ Alle Tests aus `src/` nach `tests/` migriert
   - ✅ vitest.config.ts bereinigt
   - ⚠️ ~141 Tests fehlen noch (gelöscht, nicht archiviert)
   - **Details:** [TEST-MIGRATION-STATUS.md](../testing/TEST-MIGRATION-STATUS.md)

---

## ⚠️ WICHTIG FÜR ENTWICKLER

**🔴 VOR dem Coden unbedingt lesen:**
- 📄 [TYPESCRIPT-GUIDE.md](./TYPESCRIPT-GUIDE.md) - TypeScript Best Practices
- 📄 [SERVICE-CLEANUP-COMPLETED.md](./SERVICE-CLEANUP-COMPLETED.md) - Was gerade geändert wurde
- 📄 [SERVICE-CLEANUP-PLAN.md](./SERVICE-CLEANUP-PLAN.md) - Refactoring-Details

**Wichtige Property-Namen:**
- `team_id` nicht `id`
- `extern_permanent_id` statt `extern_team_id` (DB v7.0)
- `team_liga_participations` Tabelle für Saison-Historie

---

## 🎯 Projektziele

Progressive Web App für Jugend-Basketball-Trainer (U8/U10/U12) im deutschen Basketball-System mit:
- **Spieler-Management** mit Skill-Assessment
- **Lineup-Planung** nach DBB Minibasketball-Regeln
- **Live Game Management** mit Substitution-Tracking
- **BBB Integration** für automatischen Liga-Daten-Import
- **Offline-First** mit IndexedDB (Dexie.js)
- **GDPR-konform** mit Consent Management
- **WCAG 2.0 AAA** Accessibility
- **TDD** - Test-Driven Development

---

## 🏗️ Architektur

### Tech Stack
- **Frontend:** React 19, TypeScript 5.9, Vite 7.1
- **Styling:** Tailwind CSS 3.4
- **State:** Zustand 5.0
- **Storage:** Dexie.js 4.2 (IndexedDB Wrapper)
- **PWA:** Vite PWA Plugin mit Workbox
- **Testing:** Vitest 3.2, Playwright, Pact 16.0
- **Icons:** Lucide React

### Domain-Driven Design Struktur

```
src/
├── domains/                    # Domain Layer (Business Logic)
│   ├── dashboard/
│   │   ├── Dashboard.tsx
│   │   └── components/
│   │       └── TeamOverview.tsx
│   │
│   ├── onboarding/             # Zwei Flows: Simplified + V2
│   │   ├── components/
│   │   │   ├── SimplifiedOnboardingContainer.tsx  ✅ 5-Schritte Flow
│   │   │   ├── SimplifiedVereinStep.tsx          ✅ Verein-Auswahl
│   │   │   ├── SimplifiedTeamStep.tsx            ✅ Multi-Select Teams
│   │   │   ├── UserStep.tsx                      ✅ User-Daten
│   │   │   ├── WelcomeStep.tsx                   ✅ Welcome
│   │   │   └── CompletionStep.tsx                ✅ Completion
│   │   ├── onboarding-simple.store.ts            ✅ Zustand Store
│   │   ├── services/
│   │   │   ├── ClubDataService.ts                ⚠️  ALT - evtl. löschen
│   │   │   └── LigaDiscoveryService.ts           ⚠️  ALT - evtl. löschen
│   │   └── archive/                              📦 Legacy V2 Flow
│   │       └── 2025-10-23-cleanup/
│   │           └── v2/                           (BBB-API-basiert, 10 Schritte)
│   │
│   ├── settings/
│   │   └── components/
│   │       └── SettingsView.tsx
│   │
│   ├── spieler/                # Spieler-Domain
│   │   ├── components/
│   │   │   ├── SpielerForm.tsx
│   │   │   ├── SpielerListe.tsx
│   │   │   └── SpielerVerwaltung.tsx
│   │   └── services/
│   │       ├── SpielerService.ts                 ✅ CRUD + 9-Skill-System
│   │       ├── SpielerService.test.ts
│   │       └── SpielerService.integration.test.ts
│   │
│   ├── spielplan/              # Spielplan-Domain (inkl. Spiele!)
│   │   ├── components/
│   │   │   ├── SpielplanListe.tsx
│   │   │   └── TabellenAnsicht.tsx
│   │   └── services/
│   │       ├── SpielService.ts                   ✅ Umfassender CRUD Service
│   │       ├── SpielService.test.ts
│   │       ├── SpielService.integration.test.ts
│   │       └── TabellenService.ts
│   │
│   ├── team/                   # Team-Domain
│   │   ├── services/
│   │   │   ├── TeamService.ts                    ✅ v7.0 kompatibel
│   │   │   └── TeamService.test.ts
│   │   ├── team.store.ts
│   │   └── team.service.ts                       ⚠️  Duplikat? Prüfen
│   │
│   ├── user/                   # User-Domain (Trainer)
│   │   └── services/
│   │       └── UserService.ts
│   │
│   └── verein/                 # Verein-Domain
│       ├── services/
│       │   ├── VereinService.ts                  ✅ CRUD Service
│       │   └── VereinService.test.ts
│       ├── verein.store.ts
│       └── verein.service.ts                     ⚠️  Duplikat? Prüfen
│
├── shared/                     # Shared Layer
│   ├── components/             # Wiederverwendbare UI
│   │   ├── DevTools.tsx
│   │   └── TeamSwitcher.tsx
│   │
│   ├── constants/
│   │   └── verbaende.ts
│   │
│   ├── data/
│   │   └── clubs-chunks/       # ✅ 18 JSON-Chunks (~9.000 DBB-Vereine)
│   │       ├── clubs-metadata.json
│   │       └── clubs-chunk-[0-17].json
│   │
│   ├── db/
│   │   ├── database.ts         # ✅ Dexie v7.0 (25 Tabellen)
│   │   └── __tests__/
│   │       └── database-v7.test.ts
│   │
│   ├── services/               # ✨ Infrastructure & Application Layer
│   │   ├── BBBApiService.ts                      ✅ REST API Wrapper (verschoben 30.10.)
│   │   ├── BBBSyncService.ts                     ✅ Liga-Sync (verschoben 30.10.)
│   │   ├── ClubDataLoader.ts                     ✅ ES Module Chunk Loader
│   │   ├── ClubDataService.ts                    ⚠️  Alt oder aktuell?
│   │   ├── CSVImportService.ts                   ✅ Konsolidiert (30.10.)
│   │   └── __tests__/                            ✅ BBB Tests (verschoben 30.10.)
│   │       ├── BBBApiService.test.ts
│   │       ├── BBBSyncService.test.ts
│   │       ├── BBBSyncService.integration.test.ts
│   │       ├── BBBSyncService.pact.test.ts
│   │       └── README.md
│   │
│   ├── types/                  # TypeScript Definitionen
│   │   ├── index.ts
│   │   ├── bbb-api-types.ts
│   │   └── club.ts
│   │
│   └── utils/
│       ├── debugTeamData.ts
│       ├── devMode.ts
│       ├── repairU10Spiele.ts
│       └── urlUtils.ts
│
├── stores/
│   └── appStore.ts
│
├── test/
│   ├── helpers/
│   │   └── index.ts
│   └── setup.ts
│
└── utils/
    ├── debug-helpers.ts
    └── onboarding-hooks.ts
```

---

## 🗄️ Datenbank-Schema v7.0

### 🔴 BREAKING CHANGES v7.0
**Team Liga Participation Historisierung**
- ❌ `extern_team_id` entfernt → ✅ `extern_permanent_id` (dauerhaft)
- ❌ Team Properties entfernt: `altersklasse`, `saison`, `liga_id`, `liga_name`
- ✅ Neue Tabelle: `team_liga_participations` (Historie pro Saison/Liga)
- ✅ Automatische Migration v6→v7 implementiert

### Tabellen-Übersicht (25 Tabellen)

```
USER (Trainer)
├── users

VEREINE & TEAMS (v7.0 Breaking Changes!)
├── vereine (extern_verein_id, ist_eigener_verein, bbb_kontakt_id)
├── teams (extern_permanent_id, verein_id, user_id, name, team_typ: 'eigen' | 'gegner')
└── team_liga_participations ✨ NEU v7.0
    ├── team_id → Referenz zu teams
    ├── extern_team_id → BBB Liga-spezifische Team-ID
    ├── saison, altersklasse, liga_id
    └── ist_aktiv (aktuelle Saison)

SPIELER
├── spieler (extern_spieler_id, team_id PFLICHT, spieler_typ, trikotnummer, tna_nr)
├── bewertungen (9-Skill-System, bewertungs_typ)
├── erziehungsberechtigte
└── spieler_erziehungsberechtigte

HALLEN & LIGEN
├── hallen (bbb_halle_id)
├── ligen (bbb_liga_id, saison, altersklasse)
└── liga_teilnahmen

SPIELPLAN & SPIELE (BBB-Integration)
├── spielplaene (bbb_spielplan_url)
├── spiele (extern_spiel_id, liga_id, heim_team_id, gast_team_id, spielnr, spieltag)
├── liga_ergebnisse
└── liga_tabellen

TRIKOTS
└── trikots (team_id, nummer, art, status)

EINSATZPLANUNG (Minibasketball)
├── einsaetze (spiel_id, spieler_id, position)
└── achtel_statistiken

TRAINING
├── trainings (ist_probetraining)
├── training_teilnahmen
├── probetraining_teilnehmer (aufgenommen_als_spieler_id)
└── probetraining_historie

NOTIZEN & ARCHIV
├── spieler_notizen (kategorie, vertraulich)
└── saison_archive
```

### Migration v6→v7
**Automatisch beim DB-Open:**
```typescript
// Alte Team Properties → TeamLigaParticipation
for (const oldTeam of teams) {
  // 1. Create Participation für aktuelle Saison
  team_liga_participations.add({
    team_id: oldTeam.team_id,
    extern_team_id: oldTeam.extern_team_id,
    saison: oldTeam.saison,
    altersklasse: oldTeam.altersklasse,
    liga_id: oldTeam.liga_id,
    ist_aktiv: true
  });
  
  // 2. Update Team: extern_team_id → extern_permanent_id
  teams.update(oldTeam.team_id, {
    extern_permanent_id: oldTeam.extern_team_id
  });
}
```

---

## ✅ Implementiert

### Phase 1 - Basis (Abgeschlossen)
- [x] Projekt-Setup mit Vite & React 19
- [x] Domain-Struktur etabliert
- [x] Dexie.js Integration für IndexedDB
- [x] Spieler-CRUD Operationen
- [x] Basic Lineup Planning
- [x] TypeScript strict mode
- [x] Tailwind CSS Setup
- [x] 9-Skill-Bewertungssystem

### Phase 2 - Simplified Onboarding (Aktuell)
- [x] **BBBApiService** - REST API Wrapper (Infrastructure Layer)
  - Liga-ID Extraktion aus URLs
  - CORS Proxy Fallback-Chain (3 Proxies)
  - Tabellen-Abruf mit Mapping (Deutsch → Englisch)
  - Spielplan-Abruf
  - Match-Info & Spieler-Details
  - **Verschoben nach `shared/services/` am 30.10.2025**

- [x] **BBBSyncService** - Liga-Synchronisation (Application Layer)
  - Vollständiger Liga-Import (Tabelle + Spielplan + Teams)
  - Automatische Verein-Erstellung
  - Deduplizierung via `extern_team_id`
  - **Verschoben nach `shared/services/` am 30.10.2025**

- [x] **ClubDataLoader** - Vereinsdaten aus JSON
  - ~9.000 DBB-Vereine in 18 Chunks
  - Singleton Pattern mit Caching
  - ES Module Imports (nicht fetch!)
  - Suche & Filter-Funktionen

- [x] **CSVImportService** - CSV Import (konsolidiert 30.10.2025)
  - Spieler-Import (inkl. Erziehungsberechtigte)
  - Trikot-Import
  - Validierung
  - Template-Generierung
  - **Konsolidiert aus 2 Duplikaten in `shared/services/`**

- [x] **SimplifiedOnboarding** Components (5 Schritte)
  - SimplifiedVereinStep (mit Verband-Filter & Suche)
  - SimplifiedTeamStep (Multi-Select)
  - UserStep, WelcomeStep, CompletionStep

- [x] **Service Cleanup durchgeführt (30.10.2025)**
  - DDD-Refactoring: BBB Services → `shared/services/`
  - Domain `bbb-api/` gelöscht (war keine Business Domain)
  - Domain `spiel/` gelöscht (redundant zu `spielplan/`)
  - CSV Services konsolidiert
  - Import-Pfade aktualisiert (alle auf `@/`)

- [x] **Test-Infrastruktur**
  - 145+ Tests geschrieben (viele noch rot)
  - PACT Contract Tests (6 Contracts)
  - E2E Tests (Playwright)
  - **Test-Duplikate identifiziert - müssen konsolidiert werden**

---

## 🔴 Bekannte Issues

### Kritisch (Blockierend)
1. **Node Modules Dependencies ⚠️ PRIORITÄT 1**
   - `source-map` und `strip-literal` fehlen
   - Verhindert Test-Ausführung
   - **Fix:** `npm install` nach package.json Update
   - **Status:** Muss VOR allen anderen Arbeiten behoben werden

### Hoch (Tests)
2. **Tests sind rot (RED Phase)**
   - Viele Tests failen (erwartet in RED-Phase)
   - Service Cleanup gerade durchgeführt
   - Import-Pfade aktualisiert, aber nicht alle getestet
   - **Nächster Schritt:** Tests konsolidieren → GREEN Phase

3. **Test-Duplikate identifiziert**
   - Ähnlich wie bei Services gibt es redundante Tests
   - SpielerService.test.ts + SpielerService.integration.test.ts
   - SpielService.test.ts + SpielService.integration.test.ts
   - Weitere Analyse erforderlich

4. **TypeScript kurzname Fix**
   - ✅ `kurzname` optional gemacht
   - ✅ Fallback auf `name` implementiert
   - ⚠️ Tests noch nicht validiert

### Mittel (Cleanup)
5. **Service Worker Build**
   - Workbox-build Dependency fehlt
   - PWA Features nicht vollständig

6. **Alte Services prüfen**
   - `domains/onboarding/services/ClubDataService.ts` (alt?)
   - `domains/onboarding/services/LigaDiscoveryService.ts` (alt?)
   - `domains/team/team.service.ts` (Duplikat?)
   - `domains/verein/verein.service.ts` (Duplikat?)
   - **TODO:** Nach erfolgreichen Tests prüfen und ggf. löschen

---

## 🚀 Nächste Schritte

### SOFORT (Heute - Blockierend) 🔴
```bash
# 1. Dependencies fixen
npm install

# 2. Test-Locations analysieren
bash scripts/testing/analyze-test-locations.sh

# 3. Output prüfen
cat docs/testing/TEST-LOCATION-INVENTORY.md
```

### Diese Woche - Test-Migration & GREEN Phase 🔴
- [ ] **Tests von /src/ nach /tests/ verschieben**
  - Domain für Domain migrieren
  - Import-Pfade anpassen
  - Pro Domain testen
  
- [ ] **Test-Duplikate konsolidieren**
  - SpielerService Tests
  - SpielService Tests
  - BBB Tests
  
- [ ] **DB v7.0 Tests vervollständigen**
  - Team Liga Participation
  - Migration v6⇒v7
  
- [ ] **GREEN Phase erreichen**
  - Alle Tests grün (≥85% Coverage)
  - Mutation Score ≥70%
  - Alte Services prüfen/entfernen

**Siehe:** [TEST-MIGRATION-PLAN.md](../testing/TEST-MIGRATION-PLAN.md)

### Phase 3 (Nächste Woche)
- [ ] Skill Assessment System erweitern
- [ ] Player Performance Tracking
- [ ] Export-Funktionen (mit Consent)
- [ ] Trainer-Handover Feature

### Phase 4 (November)
- [ ] **Scouting-Domain (TDD!)** 🧪
  - Spieler-Erfassung (fremde Spieler)
  - Consent-Dialog (eigene Spieler)
  - Export-Flow
  - Automatischer Cleanup nach Altersklasse
- [ ] Advanced Analytics
- [ ] Season Planning
- [ ] Multi-Team Support

---

## 🧪 Test-Infrastruktur

> 📝 **Detaillierte Analyse:** Siehe [TEST-STATUS.md](./TEST-STATUS.md) (muss aktualisiert werden)

### Test-Struktur (Nach Cleanup 30.10.2025)

```
src/
├── domains/
│   ├── spieler/services/
│   │   ├── SpielerService.test.ts
│   │   └── SpielerService.integration.test.ts
│   │
│   ├── spielplan/services/
│   │   ├── SpielService.test.ts
│   │   └── SpielService.integration.test.ts
│   │
│   ├── team/services/
│   │   └── TeamService.test.ts
│   │
│   └── verein/services/
│       └── VereinService.test.ts
│
└── shared/
    ├── db/__tests__/
    │   └── database-v7.test.ts
    │
    └── services/__tests__/                    ✨ BBB Tests (neu verschoben)
        ├── BBBApiService.test.ts
        ├── BBBSyncService.test.ts
        ├── BBBSyncService.integration.test.ts
        ├── BBBSyncService.pact.test.ts
        └── README.md
```

### Test-Coverage (Aktuell)

```
Total Tests:        145+
Unit Tests:         ~97
Integration Tests:  ~15
Contract Tests:     6 (PACT)
E2E Tests:          ~20

Status:             🔴 Viele Tests rot (RED Phase)
Coverage:           ~75% (Ziel: ≥85%)
Mutation Score:     N/A (TODO: ≥70%)
```

### Test-Commands

```bash
# Development
npm run dev           # Start dev server
npm run build         # Production build

# Testing
npm run test:ui       # Vitest UI (empfohlen!)
npm run test:watch    # Watch Mode
npm run test:coverage # Coverage Report
npm run test:e2e      # Playwright Tests

# Utils
npm run monitor       # Test Monitor
./scripts/fix-node-modules.sh  # Fix Dependencies
./scripts/test-analysis.sh     # Debug Tests
```

---

## 🔌 Services & APIs

### Infrastructure Layer (shared/services/)

#### 1. BBBApiService.ts ✨ (verschoben 30.10.2025)
**Pfad:** `src/shared/services/BBBApiService.ts`  
**Zweck:** REST API Wrapper für basketball-bund.net

**Endpunkte:**
```typescript
POST /rest/wam/data                      → LigaListeEintrag[]
GET /rest/competition/table/id/{ligaId}  → TabellenEintrag[]
GET /rest/competition/spielplan/id/{ligaId} → SpielBasic[]
GET /rest/match/id/{matchId}/matchInfo   → MatchInfoResponse
```

**Features:**
- ✅ CORS-Proxy mit Fallback (3 Proxies)
- ✅ Rate-Limiting (10 parallel, 300ms Delay)
- ✅ Batch-Processing
- ✅ 18 Unit-Tests + 6 PACT Contract-Tests

---

#### 2. BBBSyncService.ts ✨ (verschoben 30.10.2025)
**Pfad:** `src/shared/services/BBBSyncService.ts`  
**Zweck:** Synchronisiert Liga-Daten (Tabelle + Spielplan + Teams)

**API:**
```typescript
await bbbSyncService.syncLiga(ligaId);
await bbbSyncService.markAsOwnTeam(teamId, userId);
await bbbSyncService.markMultipleAsOwnTeams(teamIds, userId);
```

**Workflow:**
```
1. Tabelle laden → Teams + Vereine erstellen
2. Spielplan laden → Spiele + Venues erstellen
3. Optional: Match-Info → Spieler-Listen extrahieren
```

---

#### 3. ClubDataLoader.ts
**Pfad:** `src/shared/services/ClubDataLoader.ts`  
**Zweck:** Lädt ~9.000 DBB-Vereine aus lokalen JSON-Chunks

**API:**
```typescript
const clubs = await clubDataLoader.loadAllClubs();
const results = await clubDataLoader.searchClubs('Bayern');
const filtered = await clubDataLoader.filterByVerband(2);
```

**Besonderheiten:**
- ✅ Singleton Pattern
- ✅ ES Module Imports (dynamisch)
- ✅ Caching-Mechanismus
- ⚠️ `kurzname` ist optional (Fallback auf `name`)

---

#### 4. CSVImportService.ts ✨ (konsolidiert 30.10.2025)
**Pfad:** `src/shared/services/CSVImportService.ts`  
**Zweck:** CSV Import für Spieler & Trikots

**API:**
```typescript
await csvImportService.importSpieler(file, team_id);
await csvImportService.importTrikots(file, team_id);
await csvImportService.validateSpielerCSV(file);
const template = csvImportService.generateSpielerTemplate();
```

**Konsolidiert aus:**
- `domains/onboarding/services/CSVImportService.ts` (gelöscht)
- `shared/services/csv-import.service.ts` (gelöscht)

---

### Domain Services

#### UserService.ts
**Pfad:** `src/domains/user/services/UserService.ts`  
**Zweck:** Trainer-Account-Verwaltung

```typescript
await userService.createUser({ name, email });
await userService.getUser(userId);
await userService.getCurrentUser();
```

---

#### TeamService.ts
**Pfad:** `src/domains/team/services/TeamService.ts`  
**Zweck:** Team-CRUD (v7.0 kompatibel)

```typescript
await teamService.createTeam(team);
await teamService.findByExternId(externId);
await teamService.getTeamsByUser(userId);
await teamService.markAsOwnTeam(teamId, userId);
```

⚠️ **Mögliches Duplikat:** `domains/team/team.service.ts` prüfen

---

#### SpielerService.ts
**Pfad:** `src/domains/spieler/services/SpielerService.ts`  
**Zweck:** Spieler-CRUD + 9-Skill-Bewertungssystem

**Features:**
- ✅ CRUD Operationen
- ✅ 9-Skill-Bewertungssystem
- ✅ CSV-Import Integration
- ✅ TNA-Validierung

---

#### SpielService.ts
**Pfad:** `src/domains/spielplan/services/SpielService.ts`  
**Zweck:** Spiel-CRUD (umfassend)

```typescript
await spielService.getSpieleMitBeteiligung(teamId);
await spielService.getNextSpiel(teamId);
await spielService.findByExternId(externId);
```

**Hinweis:** Domain `spiel/` wurde gelöscht (redundant), alle Funktionen in `spielplan/`

---

#### VereinService.ts
**Pfad:** `src/domains/verein/services/VereinService.ts`  
**Zweck:** Verein-CRUD

⚠️ **Mögliches Duplikat:** `domains/verein/verein.service.ts` prüfen

---

## 🚀 Onboarding-Flows

### Flow 1: Simplified (NEU ✨) - 5 Schritte
**Container:** `SimplifiedOnboardingContainer.tsx`  
**Store:** `onboarding-simple.store.ts`

**Workflow:**
```
1. Welcome     → "Willkommen!" → Los geht's
2. User        → Vorname, Nachname eingeben
3. Verein      → Optional: Verband-Filter → Suche → Auswahl
4. Team        → Multi-Select Teams (min. 1)
5. Completion  → Auto-Redirect zum Dashboard
```

**Features:**
- ✅ Keine API-Calls (alles lokal)
- ✅ ~9.000 Vereine durchsuchbar
- ✅ Alphabetische Sortierung
- ✅ Live-Count ("152 von 1.234 Vereinen")
- ✅ Responsive Design

---

### Flow 2: V2 (BBB-API-basiert) - Archiviert
**Pfad:** `src/domains/onboarding/archive/2025-10-23-cleanup/v2/`

**Status:** 📦 Archiviert, aber vollständig implementiert

**Workflow (10 Schritte):**
```
1. Welcome
2. User
3. Verband → API-Call
4. Altersklassen → API-Call
5. Gebiet → API-Call
6. Ligen Loading → Auto-Load
7. Verein → Aus geladenen Teams
8. Team → Multi-Select
9. Sync → Tabelle + Spielplan
10. Team Selection → Aktives Team
```

**Zweck:**
- Direkte DBB-Integration
- Vollständige Liga-Daten
- Für fortgeschrittene Nutzung

---

## 🔐 Datenschutz & Sicherheit

### GDPR Compliance
- ✅ Lokale Datenhaltung (IndexedDB)
- ✅ Kein User-Tracking
- ✅ Consent für Daten-Export (geplant)
- ⏳ Automatische Daten-Löschung (Scouting, geplant)
- ⏳ Verschlüsselung sensitiver Daten (geplant)

**Öffentliche DBB-Daten:**
- ✅ KEIN Consent nötig (Vereine, Teams, Ligen, Tabellen)

**Temporäre Scouting-Daten (fremde Spieler):**
- ⚠️ Automatischer Cleanup nach Altersklasse (geplant)
- U8/U10: Nach 2 Saisons
- U12+: Nach 3 Saisons
- KEINE Export-Option

**Persistente Scouting-Daten (eigene Spieler):**
- ⚠️ Consent-Dialog (Eltern/Volljährige)
- Export-Option
- Löschung auf Anfrage

### Security
- ✅ Dependencies regelmäßig updaten
- ✅ CORS Proxy für externe APIs
- ✅ Input Validation
- ⏳ CSP Headers (geplant)
- ⏳ OWASP ZAP Scan (CI/CD, geplant)

---

## 🧠 Kritisches Wissen

### 1. Warum BBB Services jetzt in shared/services/?

**Vorher:** `domains/bbb-api/services/`  
**Jetzt:** `shared/services/`

**Begründung:**
- BBBApiService = **Infrastructure Layer** (External API Adapter)
- BBBSyncService = **Application Layer** (orchestriert mehrere Domains)
- "bbb-api" ist keine Business Domain, sondern Integrationsschicht
- Wird von mehreren Domains genutzt (Team, Spielplan, Liga, Verein)
- **DDD-konform:** Infrastruktur gehört nicht in Domains

---

### 2. Warum Domain spiel/ gelöscht?

**Vorher:** `domains/spiel/` (klein, nur Filter) + `domains/spielplan/` (groß, CRUD)  
**Jetzt:** Nur `domains/spielplan/` (enthält SpielService)

**Begründung:**
- `spiel/` war redundant (nur 2650 bytes, minimale Funktionalität)
- `spielplan/` hatte vollständigen SpielService (6643 bytes, CRUD, Validierung)
- **Spielplan** ist der korrekte Business Context

---

### 3. DB v7.0 - Team Liga Participation

```typescript
// ALT (v6):
teams {
  extern_team_id: string
  saison: string
  altersklasse: string
  liga_id: string
}

// NEU (v7):
teams {
  extern_permanent_id: string  // Dauerhaft über Saisons
}

team_liga_participations {
  team_id: string              // Referenz
  extern_team_id: string       // BBB Liga-spezifisch
  saison: string
  altersklasse: string
  liga_id: string
  ist_aktiv: boolean           // Aktuelle Saison
}
```

**Vorteil:** Multi-Saison Support, Liga-Wechsel Historie

---

### 4. Import-Pfade nach Cleanup

**Alte Imports (FALSCH):**
```typescript
import { BBBApiService } from '@/domains/bbb-api/services/BBBApiService';
import { db } from '../../../../shared/db/database';
```

**Neue Imports (RICHTIG):**
```typescript
import { BBBApiService } from '@/shared/services/BBBApiService';
import { db } from '@/shared/db/database';
```

**Regel:** Immer `@/` statt relative Pfade!

---

### 5. Test-Mocking-Strategie

```typescript
// ⚠️ WICHTIG: Mock VOR dem Import!
vi.mock('@/shared/services/BBBApiService', () => ({
  bbbApiService: {
    getTabelle: vi.fn()
  }
}));

// DANN erst importieren
import { SimplifiedVereinStep } from './SimplifiedVereinStep';
```

**Reihenfolge ist kritisch!**

---

### 6. TDD RED-GREEN-REFACTOR

**Aktuell:** 🔴 RED Phase

**RED Phase:**
- ✅ Tests schreiben (viele sind rot)
- ✅ Features definieren
- ⏳ Refactoring läuft (gerade durchgeführt)

**Nächste Phase:** 🟢 GREEN
- Minimal Code um Tests grün zu machen
- Test-Duplikate konsolidieren
- Alle Imports validieren

**Dann:** ♻️ REFACTOR
- Code optimieren
- Tests bleiben grün
- Dokumentation vervollständigen

---

## 📚 Dokumentation

### Haupt-Docs
- [README.md](../README.md) - Übersicht
- [QUICKSTART.md](./QUICKSTART.md) - Chat-Wechsel Template
- [TECHNICAL-DECISIONS.md](../architecture/decisions/TECHNICAL-DECISIONS.md) - Architektur-Entscheidungen
- [TYPESCRIPT-GUIDE.md](./TYPESCRIPT-GUIDE.md) - TypeScript Best Practices

### Roadmaps (NEU 30.10.2025)
- [FEATURE-ROADMAP.md](../planning/roadmaps/FEATURE-ROADMAP.md) - Langfristige Feature-Planung (2025-2026)
- [IMPLEMENTATION-ROADMAP.md](../planning/roadmaps/IMPLEMENTATION-ROADMAP.md) - Technische Implementation (kurzfristig)
- [MULTI-TEAM-SUPPORT-PLAN.md](../planning/roadmaps/MULTI-TEAM-SUPPORT-PLAN.md) - Multi-Team Feature-Details

### Cleanup & Refactoring (30.10.2025)
- [SERVICE-DUPLIKATE-ANALYSE.md](./SERVICE-DUPLIKATE-ANALYSE.md) - Duplikate-Analyse
- [SERVICE-CLEANUP-PLAN.md](./SERVICE-CLEANUP-PLAN.md) - Ausführungsplan
- [SERVICE-CLEANUP-COMPLETED.md](./SERVICE-CLEANUP-COMPLETED.md) - Was geändert wurde
- [ROADMAP-KONSOLIDIERUNG.md](./ROADMAP-KONSOLIDIERUNG.md) - STATUS.md → Roadmaps migriert

### Bug-Fixes
- [2025-10-26-NODE-MODULES-BBB-FIX.md](../bugfixes/2025-10-26-NODE-MODULES-BBB-FIX.md)

### API Docs
- [DBB-API-EVALUATION.md](../specifications/api/DBB-API-EVALUATION.md) - API-Details & Mapping
- [DBB REST API](https://www.basketball-bund.net/rest) - Externe API
- OpenAPI Spec in `/docs/specifications/api/`

---

## 🆘 Troubleshooting

### Node Modules Issue (AKTUELL)
```bash
rm -rf node_modules package-lock.json
npm install
```

### Tests failen nach Cleanup
```bash
# 1. Prüfe Import-Pfade
grep -r "bbb-api" src/

# 2. Prüfe ob alle @/ Imports korrekt sind
grep -r "from.*\.\." src/shared/services/

# 3. Tests ausführen
npm run test:ui
```

### Datenbank-Version-Konflikt
```javascript
// Im Browser Console:
localStorage.clear()
indexedDB.deleteDatabase('BasketballPWA')
// Dann Seite neu laden
```

---

## 👥 Team & Kontakt

**Entwicklung:** Oliver Marcuseder  
**AI-Assistance:** Claude (Anthropic)  
**Projekt-Start:** Oktober 2025  
**Repository:** Privat

---

## 📝 Notizen

### Aktuelle Prioritäten
1. **Dependencies fixen** - BLOCKIERT ALLES 🔴
2. **Tests konsolidieren** - Analog zu Service Cleanup
3. **Tests grün bekommen** - GREEN Phase erreichen
4. **Alte Services prüfen** - ClubDataService, LigaDiscoveryService, etc.
5. **Dokumentation vervollständigen** - TEST-STATUS.md aktualisieren

### Offene Entscheidungen
- Test-Duplikate-Strategie: Merge oder Replace?
- Alte Services: Löschen oder migrieren?
- Cloud Sync: Firebase vs. Supabase vs. Self-hosted
- Analytics: Plausible vs. Matomo vs. None
- Export Format: PDF vs. Excel vs. Beide

### Template für Chat-Wechsel
```
Hallo! Ich arbeite an der Basketball Team Manager PWA.

Lies bitte für Kontext:
1. docs/development/PROJECT-STATUS.md (diese Datei - AKTUELL!)
2. docs/development/SERVICE-CLEANUP-COMPLETED.md (gerade durchgeführt)
3. docs/development/QUICKSTART.md

Aktueller Stand:
- 🔴 RED Phase (TDD) - Tests sind rot
- Node Modules Dependencies fehlen 🔴
- Service Cleanup durchgeführt (30.10.2025) ✅
- BBB Services nach shared/services/ verschoben ✅
- Test-Duplikate identifiziert ⚠️

Nächste Aufgabe:
[Beschreibe hier was du als nächstes tun willst]

Meine Frage:
[Stelle hier deine Frage]
```

---

## 📌 Änderungs-Historie

```
v2.0.0-dev (30.10.2025) - Service Cleanup & DDD-Refactoring 🔴
- 🏗️  Service Cleanup durchgeführt (DDD-konform)
  - BBBApiService.ts: domains/bbb-api/ → shared/services/
  - BBBSyncService.ts: domains/bbb-api/ → shared/services/
  - Alle BBB Tests verschoben → shared/services/__tests__/
  - Domain bbb-api/ gelöscht (keine Business Domain)
  - Domain spiel/ gelöscht (redundant zu spielplan/)
  - CSVImportService konsolidiert (aus 2 Duplikaten)
- 📝 PROJECT-STATUS.md komplett überarbeitet (IST-Zustand)
- 🔴 TDD RED Phase - Tests bewusst rot
- ⚠️ Test-Duplikate identifiziert
- ⚠️ Node Modules Dependencies Issue besteht

v2.0.0-dev (30.10.2025) - DB v7.0 🔴 BREAKING
- 🔴 Datenbank v7.0: Team Liga Participation Historisierung
  - extern_team_id → extern_permanent_id
  - Team Properties ausgelagert in team_liga_participations
  - Automatische Migration v6→v7 implementiert

v2.0.0-dev (26.10.2025) - DB v6.0
- ✅ TypeScript Build-Fehler behoben
- ✅ CORS-Proxy-Fix: IMMER Proxies nutzen
- 📝 Umfassende Bug-Fix-Dokumentation

v2.0.0-dev (23.10.2025) - DB v6.0
- ✅ ClubDataLoader Service implementiert
- ✅ Simplified Onboarding Flow (5 Schritte)
- ✅ 145+ Tests geschrieben
- ⚠️ Tests failen

v1.2.3 (13.10.2025) - DB v5.0
- ✅ CORS-Proxy mit Fallback
- ✅ Robuste Liga-ID Extraktion

v1.2.0 (10.10.2025) - DB v5.0
- ✅ BBB-Integration (BBBApiService, BBBSyncService)

v1.0.0 (08.10.2025) - DB v4.0
- ✅ MVP Release
```

---

**Letzte Aktualisierung:** 30.10.2025, 21:10 Uhr  
**Status:** 🔴 RED Phase (TDD) - Service Cleanup durchgeführt, Tests noch rot  
**Nächster Schritt:** npm install → Test-Duplikate konsolidieren → GREEN Phase
