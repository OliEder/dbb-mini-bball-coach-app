# 🏀 Basketball Team Manager - Vollständiger Projekt-Status

**Version:** 2.0.0-dev  
**Datenbank:** v5  
**Stand:** 23. Oktober 2025  
**Status:** 🚧 Aktive Entwicklung

---

## 📋 Inhaltsverzeichnis

1. [Projekt-Übersicht](#projekt-übersicht)
2. [Aktuelle Architektur](#aktuelle-architektur)
3. [Datenbank-Schema](#datenbank-schema)
4. [Implementierter Stand](#implementierter-stand)
5. [Services & APIs](#services--apis)
6. [Onboarding-Flows](#onboarding-flows)
7. [Test-Infrastruktur](#test-infrastruktur)
8. [Bekannte Issues](#bekannte-issues)
9. [Roadmap](#roadmap)
10. [Kritisches Wissen](#kritisches-wissen)

---

## 🎯 Projekt-Übersicht

### Vision
Progressive Web App für Basketball-Trainer zur Verwaltung von Teams, Scouting und Spielberichtsbögen mit:
- ✅ Offline-First (IndexedDB + Service Worker)
- ✅ Dezentrale Datenhaltung (keine User-Accounts erforderlich)
- ✅ DSGVO-konform (Consent, Datenminimierung, automatischer Cleanup)
- ✅ WCAG 2.0 AAA Accessibility
- ✅ DBB-Integration (Liga-Daten, Tabellen, Spielpläne)
- 🔄 TDD-Entwicklung (ab jetzt strikt!)

### Tech-Stack
```
Frontend:    React 19 + TypeScript + Tailwind CSS
State:       Zustand
Storage:     Dexie.js (IndexedDB v5)
Build:       Vite + SWC
Testing:     Vitest + Playwright + Testing Library
PWA:         vite-plugin-pwa (Workbox)
APIs:        DBB REST API (basketball-bund.net)
```

---

## 🏗️ Aktuelle Architektur

### Ordner-Struktur
```
src/
├── domains/                    # Domain-Driven Design
│   ├── onboarding/            
│   │   ├── components/
│   │   │   ├── SimplifiedOnboardingContainer.tsx  ✅ NEU: 5-Schritte Flow
│   │   │   ├── SimplifiedVereinStep.tsx           ✅ NEU: Verein + Filter + Suche
│   │   │   ├── SimplifiedTeamStep.tsx             ✅ NEU: Multi-Select Teams
│   │   │   └── v2/                                ✅ Legacy: 10-Schritte Flow (BBB-API-basiert)
│   │   ├── services/
│   │   │   ├── ClubDataService.ts                 ⚠️  Alt (wird ersetzt)
│   │   │   └── LigaDiscoveryService.ts            ⚠️  Alt (wird ersetzt)
│   │   ├── onboarding-simple.store.ts             ✅ Simplified Flow Store
│   │   └── onboarding-v2.store.ts                 ✅ V2 Flow Store
│   │
│   ├── team-management/        # 🔄 TODO: Teams verwalten
│   ├── scouting/              # 🔄 TODO: Spieler-Scouting
│   ├── minibasketball/        # 🔄 TODO: Spielberichtsbögen
│   └── export/                # 🔄 TODO: Consent + Export
│
├── shared/                     # Shared Layer
│   ├── data/
│   │   └── clubs-chunks/      # ✅ 18 JSON-Chunks (~9.000 DBB-Vereine)
│   │       ├── clubs-metadata.json
│   │       └── clubs-chunk-[0-17].json
│   │
│   ├── services/
│   │   ├── ClubDataLoader.ts  # ✅ NEU: Lädt Chunks via ES Modules
│   │   ├── BBBApiService.ts   # ✅ REST API Wrapper mit CORS-Fallback
│   │   ├── BBBSyncService.ts  # ✅ Liga-Sync (Tabelle + Spielplan)
│   │   ├── BBBParserService.ts # ✅ HTML-Parsing (Legacy-Support)
│   │   ├── UserService.ts     # ✅ User/Trainer-Verwaltung
│   │   ├── TeamService.ts     # ✅ Team-CRUD
│   │   ├── SpielerService.ts  # ✅ Spieler-CRUD + Bewertungen
│   │   └── SpielService.ts    # ✅ Spiele-CRUD
│   │
│   ├── types/                 # TypeScript Interfaces
│   │   ├── index.ts           # Basis-Types
│   │   ├── dbb-types.ts       # DBB API Types
│   │   └── ...
│   │
│   └── db/
│       └── database.ts        # ✅ Dexie Schema v5 (24 Tabellen)
│
└── test/
    └── setup.ts               # Vitest Config (HappyDOM + axe)
```

---

## 🗄️ Datenbank-Schema

### Version 5 (Aktuell)
**Wichtige Änderungen in v5:**
- ✅ `USER` Tabelle (Trainer-Accounts)
- ✅ Externe IDs für DBB-Integration (`extern_team_id`, `extern_verein_id`, `extern_spiel_id`)
- ✅ `team_typ` Feld ('eigen' | 'gegner')
- ✅ `team_id` in SPIELER (1:n Beziehung)
- ✅ Erweiterte Indizes für Performance

### Tabellen-Übersicht (24 Tabellen)
```
USER (Trainer)
├── users

VEREINE & TEAMS
├── vereine (extern_verein_id, ist_eigener_verein)
└── teams (extern_team_id, user_id, team_typ)

SPIELER
├── spieler (extern_spieler_id, team_id PFLICHT, trikotnummer, tna_nr)
├── bewertungen (9-Skill-System)
├── erziehungsberechtigte
└── spieler_erziehungsberechtigte

HALLEN & LIGEN
├── hallen (bbb_halle_id)
├── ligen (bbb_liga_id)
└── liga_teilnahmen

SPIELPLAN & SPIELE (BBB-Integration)
├── spielplaene (bbb_spielplan_url)
├── spiele (extern_spiel_id, liga_id, heim/gast_team_id)
├── liga_ergebnisse
└── liga_tabellen

TRIKOTS
└── trikots (team_id, nummer, art, status)

EINSATZPLANUNG (Minibasketball)
├── einsaetze (spiel_id, spieler_id, position)
└── achtel_statistiken

TRAINING
├── trainings
├── training_teilnahmen
├── probetraining_teilnehmer
└── probetraining_historie

NOTIZEN & ARCHIV
├── spieler_notizen
└── saison_archive
```

### Wichtige Beziehungen
```
User 1:n Teams (eigene Teams)
Verein 1:n Teams
Team 1:n Spieler (PFLICHT seit v5)
Liga 1:n Spiele
Spiel n:1 HeimTeam, n:1 GastTeam
Spieler n:m Erziehungsberechtigte
```

---

## ✅ Implementierter Stand

### Phase 1: MVP v1.0 - v1.2.3 (Abgeschlossen)
- ✅ Build-Setup (Vite, TypeScript, Tailwind)
- ✅ Datenbank v4 → v5 Migration
- ✅ Type Definitions
- ✅ WCAG 2.0 AA Compliance
- ✅ Onboarding Flow V2 (10 Schritte, BBB-API-basiert)
- ✅ Team Management
- ✅ Spieler-Import (CSV)
- ✅ Trikot-Import (CSV)
- ✅ 9-Skill-Bewertungssystem
- ✅ BBBParserService (HTML-Parsing)
- ✅ BBBApiService (REST API Wrapper)
- ✅ BBBSyncService (Liga-Sync)
- ✅ Dashboard (Basis)
- ✅ 80+ Tests (Unit + PACT)

### Phase 2: Simplified Onboarding (NEU - In Arbeit)
- ✅ ClubDataLoader Service
  - Lädt ~9.000 Vereine aus 18 JSON-Chunks
  - Cached Daten für Performance
  - Suche & Filter-Funktionen
  - ES Module Imports (nicht fetch!)

- ✅ Simplified Onboarding Flow (5 Schritte)
  - Welcome → User → Verein → Team → Completion
  - Verband-Filter (optional)
  - Live-Suche
  - Alphabetische Sortierung
  - Multi-Select Teams

- ✅ SimplifiedOnboardingContainer
- ✅ SimplifiedVereinStep (Verein-Auswahl)
- ✅ SimplifiedTeamStep (Team-Auswahl)
- ✅ Zustand Store (onboarding-simple.store)

- ⚠️ Tests geschrieben (65+), aber noch nicht alle grün
  - ClubDataLoader.test.ts (30+ Tests)
  - SimplifiedVereinStep.test.tsx (20+ Tests)
  - SimplifiedTeamStep.test.tsx (15+ Tests)
  - **Issue:** 27 Tests failen aktuell

---

## 🔌 Services & APIs

### 1. ClubDataLoader (NEU ✨)
**Datei:** `src/shared/services/ClubDataLoader.ts`

**Zweck:** Lädt ~9.000 DBB-Vereine aus lokalen JSON-Chunks

**API:**
```typescript
// Alle Clubs laden (gecached)
const clubs = await clubDataLoader.loadAllClubs();

// Suche (case-insensitive)
const results = await clubDataLoader.searchClubs('Bayern');

// Filter nach Verband
const filtered = await clubDataLoader.filterByVerband(2); // Bayern

// Kombiniert
const combined = await clubDataLoader.searchAndFilter('München', 2);

// Teams für Club
const teams = await clubDataLoader.loadTeamsForClub('club_001');

// Metadata
const meta = clubDataLoader.getMetadata();

// Cache leeren (für Tests)
clubDataLoader.clearCache();
```

**Besonderheiten:**
- ✅ Singleton Pattern
- ✅ ES Module Imports (dynamisch)
- ✅ Caching-Mechanismus
- ⚠️ `kurzname` ist optional (Fallback auf `name`)

---

### 2. BBBApiService
**Datei:** `src/shared/services/BBBApiService.ts`

**Zweck:** REST API Wrapper für basketball-bund.net

**Endpunkte:**
```typescript
// Liga-Suche (POST)
POST /rest/wam/data
→ LigaListeEintrag[]

// Tabelle (GET)
GET /rest/competition/table/id/{ligaId}
→ TabellenEintrag[]

// Spielplan (GET)
GET /rest/competition/spielplan/id/{ligaId}
→ SpielBasic[]

// Match-Info (GET)
GET /rest/match/id/{matchId}/matchInfo
→ MatchInfoResponse

// Kreuztabelle (GET)
GET /rest/competition/crosstable/id/{ligaId}
→ Kreuztabelle
```

**Features:**
- ✅ CORS-Proxy mit Fallback (3 Proxies)
- ✅ Rate-Limiting (10 parallel, 300ms Delay)
- ✅ Batch-Processing
- ✅ Fehlerbehandlung
- ✅ 18 Unit-Tests + 6 PACT Contract-Tests

**CORS-Proxies (mit Fallback):**
1. `corsproxy.io` (Primary)
2. `cors-anywhere.herokuapp.com`
3. `allorigins.win`

---

### 3. BBBSyncService
**Datei:** `src/shared/services/BBBSyncService.ts`

**Zweck:** Synchronisiert Liga-Daten (Tabelle + Spielplan + Teams)

**API:**
```typescript
// Komplette Liga syncen
await bbbSyncService.syncLiga(ligaId);

// Team als "eigen" markieren
await bbbSyncService.markAsOwnTeam(teamId, userId);

// Mehrere Teams markieren
await bbbSyncService.markMultipleAsOwnTeams(teamIds, userId);
```

**Workflow:**
```
1. Tabelle laden (alle Teams)
   ├─ Teams erstellen/updaten
   ├─ Vereine erstellen/updaten
   └─ Tabellen-Einträge speichern

2. Spielplan laden (alle Spiele)
   ├─ Spiele erstellen/updaten
   └─ Venues erstellen/updaten

3. Optional: Match-Info laden
   └─ Spieler-Listen extrahieren
```

**Features:**
- ✅ Automatische Verein-Erstellung
- ✅ Deduplizierung via `extern_team_id`
- ✅ Batch-Processing
- ✅ 14 Unit-Tests

---

### 4. BBBParserService (Legacy)
**Datei:** `src/shared/services/BBBParserService.ts`

**Zweck:** HTML-Parsing für Legacy-Support

**Status:** ⚠️ Wird eventuell durch REST API ersetzt

---

### 5. UserService
**Datei:** `src/shared/services/UserService.ts`

**Zweck:** Trainer-Account-Verwaltung

**API:**
```typescript
await userService.createUser({ name, email });
await userService.getUser(userId);
await userService.getCurrentUser(); // Aktiver User
```

---

### 6. TeamService
**Datei:** `src/shared/services/TeamService.ts`

**API:**
```typescript
await teamService.createTeam(team);
await teamService.findByExternId(externId);
await teamService.getTeamsByUser(userId);
await teamService.markAsOwnTeam(teamId, userId);
```

---

### 7. SpielerService
**Datei:** `src/shared/services/SpielerService.ts`

**Features:**
- ✅ CRUD Operationen
- ✅ 9-Skill-Bewertungssystem
- ✅ CSV-Import
- ✅ TNA-Validierung

---

### 8. SpielService
**Datei:** `src/shared/services/SpielService.ts`

**API:**
```typescript
await spielService.getSpieleMitBeteiligung(teamId);
await spielService.getNextSpiel(teamId);
await spielService.findByExternId(externId);
```

---

## 🚀 Onboarding-Flows

### Flow 1: Simplified (NEU ✨) - 5 Schritte
**Container:** `SimplifiedOnboardingContainer.tsx`  
**Store:** `onboarding-simple.store.ts`

**Workflow:**
```
1. Welcome
   └─ "Willkommen!" → Los geht's

2. User
   └─ Vorname, Nachname eingeben

3. Verein
   ├─ Optional: Verband-Filter wählen
   ├─ Suche: Live-Filterung
   └─ Verein auswählen (Radio)

4. Team
   ├─ Multi-Select Teams (Checkboxen)
   └─ Mindestens 1 Team erforderlich

5. Completion
   └─ Auto-Redirect zum Dashboard
```

**Features:**
- ✅ Keine API-Calls (alles lokal)
- ✅ ~9.000 Vereine durchsuchbar
- ✅ Alphabetische Sortierung
- ✅ Live-Count ("152 von 1.234 Vereinen")
- ✅ Responsive Design
- ✅ Loading & Error States

**Performance:**
- Chunks werden parallel geladen
- Client-seitige Filterung (instant)
- Cache für schnelle Navigation

---

### Flow 2: V2 (BBB-API-basiert) - 10 Schritte
**Container:** `OnboardingV2Container.tsx`  
**Store:** `onboarding-v2.store.ts`

**Workflow:**
```
1. Welcome
2. User
3. Verband          → API-Call #1 (Filter)
4. Altersklassen    → API-Call #2 (Filter)
5. Gebiet           → API-Call #3 (Filter)
6. Ligen Loading    → API-Calls #4-N (Auto-Load)
7. Verein           → Aus geladenen Teams
8. Team             → Multi-Select
9. Sync             → Tabelle + Spielplan
10. Team Selection  → Aktives Team
```

**Zweck:**
- Direkte DBB-Integration
- Minimale API-Calls durch schrittweise Filterung
- Vollständige Liga-Daten (Tabelle + Spielplan)

**Status:** ✅ Implementiert, aber durch Simplified Flow ergänzt

---

## 🧪 Test-Infrastruktur

> 📝 **Detaillierte Test-Analyse:** Siehe [TEST-STATUS.md](./TEST-STATUS.md)

### Test-Struktur
```
tests/
├── unit/                           # Unit Tests
│   ├── shared/services/
│   │   ├── ClubDataLoader.test.ts          ✅ 30+ Tests (Integration-Ansatz)
│   │   ├── BBBApiService.test.ts           ✅ 18 Tests
│   │   └── BBBSyncService.test.ts          ✅ 14 Tests
│   └── domains/onboarding/
│       ├── SimplifiedVereinStep.test.tsx   ✅ 20+ Tests
│       └── SimplifiedTeamStep.test.tsx     ✅ 15+ Tests
│
├── integration/                    # Integration Tests
│   └── (TODO: Layer-Tests)
│
├── contract/                       # PACT Contract Tests
│   └── BBBSyncService.pact.test.ts         ✅ 6 Contracts
│
├── e2e/                            # Playwright E2E
│   ├── onboarding-simplified.spec.ts
│   └── onboarding-v2.spec.ts
│
└── README.md                       # Test-Dokumentation
```

### Test-Coverage (Aktuell)
```
Total Tests:        145+
Unit Tests:         ~97
Integration Tests:  0 (TODO)
Contract Tests:     6 (PACT)
E2E Tests:          ~20

Coverage:           ~75% (Ziel: ≥85%)
Mutation Score:     N/A (TODO: ≥70%)
```

### Test-Strategie

#### ClubDataLoader
- **Ansatz:** Integration-Tests mit echten Chunks
- **Warum:** Vitest kann dynamische JSON-Imports schwer mocken
- **Vorteil:** Testet echte Datenstruktur

#### React Components
- **Ansatz:** Unit-Tests mit gemocktem Service
- **Framework:** Testing Library + Vitest
- **Mocking:** `vi.mock()` vor Import!

#### BBBApiService
- **Ansatz:** Unit-Tests + PACT Contracts
- **Contracts:** 6 definiert (Tabelle, Spielplan, MatchInfo, etc.)

### Commands
```bash
# Alle Tests
npm test

# Watch Mode
npm run test:watch

# UI Mode (empfohlen!)
npm run test:ui

# Coverage
npm run test:coverage

# E2E Tests
npm run test:e2e
npm run test:e2e:ui

# Nur Contract-Tests
./run-tests.sh pact
```

---

## ⚠️ Bekannte Issues

### 1. 27 Tests failen (KRITISCH) 🔴

> 📊 **Vollständige Analyse:** Siehe [TEST-STATUS.md](./TEST-STATUS.md)

**Status:**
- ✅ TypeScript `kurzname` Fix implementiert
- ✅ Test-Struktur analysiert & dokumentiert
- 🔴 Tests noch nicht ausgeführt (warten auf Ergebnisse)
- 📋 6 Fehler-Hypothesen aufgestellt

**Vermutete Ursachen:**
1. Import-Path-Resolution (`@shared/*` Aliases)
2. JSON-Import in Tests
3. Mock-Timing-Probleme
4. Async Timeouts (18 Chunks parallel)
5. HappyDOM Limitations
6. Test-Logic-Errors

**Nächste Schritte:**
1. 🔴 **JETZT:** Tests ausführen → `npm run test:ui`
2. 🔄 Fehler kategorisieren (siehe TEST-STATUS.md)
3. 🔄 Fixes implementieren (TDD!)
4. 🔄 Test-Run-Ergebnisse dokumentieren

---

### 2. Alte Services nicht aufgeräumt
**Betroffen:**
- `ClubDataService.ts` (alt)
- `LigaDiscoveryService.ts` (alt)
- Eventuell alte Components in `v2/`

**TODO:**
- Nach erfolgreichen Tests aufräumen
- Imports in alten Components prüfen
- Entscheiden: Löschen oder Legacy-Support?

---

### 3. Dokumentation war fragmentiert
**Problem:**
- Viele Dokumente im Root-Ordner
- Keine klare Single Source of Truth
- Duplikate und veraltete Informationen

**Lösung (in Arbeit):**
- ✅ Dokumentation konsolidiert in `docs/`
- ✅ Alte Dokumente werden nach `docs/archive/` verschoben
- ✅ Diese PROJECT-STATUS.md als zentrale Quelle

---

### 4. Minibasketball-Regeln noch nicht integriert
**Dokumente vorhanden:**
- Spielberichtsbogen (PDF)
- Spielregeln (PDF)
- Gebührenordnung (PDF)

**TODO:**
- Domain `minibasketball/` erstellen
- Spielberichtsbogen-Erfassung (8 Achtel)
- Regel-Assistent (U8/U10/U12)
- Einsatzzeit-Tracker

---

## 🗺️ Roadmap

### Phase 3: Tests zum Laufen bringen (JETZT - Prio 1)
**Zeitrahmen:** Diese Woche

1. ✅ TypeScript-Fehler fixen
2. 🔄 Tests durchlaufen lassen & debuggen
3. 🔄 Alle Tests grün machen
4. 🔄 Coverage auf ≥85% bringen

---

### Phase 4: Dokumentation & Cleanup (JETZT - Prio 2)
**Zeitrahmen:** Diese Woche

1. ✅ PROJECT-STATUS.md konsolidieren
2. 🔄 Alte Dokumente nach `docs/archive/` verschieben
3. 🔄 Veraltete Services entfernen
4. 🔄 README-Dateien aktualisieren

---

### Phase 5: Scouting-Domain (TDD! 🧪)
**Zeitrahmen:** 2-3 Wochen

**Features (mit TDD-Workflow):**
```
1. Spieler-Erfassung (fremde Spieler)
   ├─ Test: Temporäre Datenspeicherung
   ├─ Test: Automatischer Cleanup nach Altersklasse
   └─ Test: DSGVO-konforme Löschung

2. Consent-Dialog (eigene Spieler)
   ├─ Test: Eltern-Consent-Flow
   ├─ Test: Consent-Status-Tracking
   └─ Test: Consent-Widerruf

3. Export-Flow
   ├─ Test: Daten-Paket-Generierung
   ├─ Test: Export-Download
   └─ Test: Löschung beim Scouter

4. Cleanup-Job
   ├─ Test: Altersklassen-Logik (U8/U10/U12)
   ├─ Test: Saisonende-Cleanup
   └─ Test: Manueller Cleanup
```

**TDD-Prozess:**
```
RED Phase:    Test schreiben → Test läuft rot
GREEN Phase:  Minimal Code → Test wird grün
REFACTOR:     Code optimieren → Tests bleiben grün
```

---

### Phase 6: Team-Dashboard (3-4 Wochen)
**Features:**
- Liga-Tabelle (vollständig, eigenes Team highlighted)
- Nächstes Spiel (Card mit Gegner-Info)
- Team-Stats (Mitglieder, TNA, Bewertungen, Trikots)
- Neue Spieler Warnung (aus API)
- CSV-Import Spieler/Trikots
- Team-Einstellungen

---

### Phase 7: Minibasketball-Integration (4 Wochen)
**Features:**
- Spielberichtsbogen-Erfassung (8 Achtel)
- Regel-Assistent (U8/U10/U12 Unterschiede)
- Einsatzzeit-Tracker
- Automatische Regelvalidierung
- PDF-Export

---

### Phase 8: Einsatzplanung (6 Wochen)
**Features:**
- 8-Achtel-Editor (Drag & Drop)
- DBB-Regelvalidierung (Mindestpausen, Balance)
- Spieler-Bewertungen-Integration
- Team-Score-Berechnung
- Optimierungs-Vorschläge
- Ersatz-Vorschläge bei Ausfall

---

### Phase 9: Spieltag-Features (6 Wochen)
**Features:**
- Timer & Live-Tracking (10 Min Viertel, Achtel-Timer)
- Spiel-Statistiken (Punkte, Fouls, MVP)
- Schnelle Wechsel (One-Click Substitution)
- Wechsel-Historie
- PDF-Export (Spielbericht, Einsatzplan)

---

### Phase 10: Training & Analysen (4 Wochen)
**Features:**
- Training-Tracking (Anwesenheit, Übungen, Fortschritt)
- Benchmark-Analysen (Liga-Durchschnitt, gemeinsame Gegner)
- Performance-Metriken (Team, Spieler, Saison)
- Daten-Export (CSV, PDF, Dashboard)

---

## 🧠 Kritisches Wissen

### 1. Warum ES Module Imports statt Fetch?
```typescript
// ❌ FALSCH: Fetch aus public/
const chunk = await fetch('/data/clubs-chunks/clubs-chunk-0.json');

// ✅ RICHTIG: ES Module Import
const chunk = await import('@shared/data/clubs-chunks/clubs-chunk-0.json');
```

**Begründung:**
- Vite optimiert ES Modules (Tree-Shaking, Code-Splitting)
- Type-Safety mit TypeScript
- Kein Racing bei Build-Time
- Bessere Performance

---

### 2. Warum Singleton für ClubDataLoader?
```typescript
// Export als Singleton
export const clubDataLoader = new ClubDataLoader();
```

**Begründung:**
- Cache wird geteilt über alle Components
- Chunks nur 1x laden
- Performance-Vorteil
- Einfaches Mocking mit `vi.mock()` möglich

---

### 3. Warum kurzname optional?
```typescript
kurzname?: string; // Optional!
kurzname: clubData.verein.kurzname ?? clubData.verein.name // Fallback
```

**Begründung:**
- DBB-Daten sind inkonsistent
- Manche Vereine haben keinen Kurzname
- Type-Safe mit TypeScript

---

### 4. Integration-Tests vs. Unit-Tests für ClubDataLoader
**Entscheidung:** Integration-Tests mit echten Chunks

**Warum:**
- Vitest kann dynamische `import()` schwer mocken
- Echte Daten = echte Bugs gefunden
- Performance ist akzeptabel (~200ms)
- Datenintegrität wird mitgetestet

---

### 5. Zwei Onboarding-Flows?
**Simplified (NEU):**
- 5 Schritte
- Lokale Daten
- Keine API-Calls
- Schneller für User

**V2 (BBB-API):**
- 10 Schritte
- Direkte DBB-Integration
- Vollständige Liga-Daten
- Für fortgeschrittene Nutzung

**Beide bleiben verfügbar!**
- User kann wählen
- V2 für volle Liga-Integration
- Simplified für schnellen Start

---

### 6. DBB API Mapping (Wichtig!)
**Siehe:** [DBB-API-EVALUATION.md](./DBB-API-EVALUATION.md)

**Kern-Mapping:**
```typescript
// DBB API → PWA Database
{
  teamId: string        → teams.extern_team_id
  clubId: string        → vereine.extern_verein_id
  matchId: string       → spiele.extern_spiel_id
  playerId?: string     → spieler.extern_spieler_id
}
```

**Team-Typ:**
```typescript
team_typ: 'eigen' | 'gegner'
```

Unterscheidet:
- Eigene Teams (User erstellt/markiert)
- Gegner-Teams (aus API importiert)

---

### 7. DSGVO-Compliance
**Kritisch für Scouting:**

**Öffentliche DBB-Daten:**
- ✅ KEIN Consent nötig
- Vereine, Teams, Ligen, Tabellen

**Temporäre Scouting-Daten (fremde Spieler):**
- ⚠️ Automatischer Cleanup nach Altersklasse
- U8/U10: Nach 2 Saisons
- U12+: Nach 3 Saisons
- KEINE Export-Option

**Persistente Scouting-Daten (eigene Spieler):**
- ⚠️ Consent-Dialog (Eltern/Volljährige)
- Export-Option
- Löschung auf Anfrage
- Dokumentation der Einwilligung

---

### 8. WCAG AAA Accessibility
**Immer beachten:**
- ✅ ARIA-Labels auf allen interaktiven Elementen
- ✅ Keyboard-Navigation (Tab, Enter, Space)
- ✅ Kontrast-Ratio ≥7:1 (AAA)
- ✅ Focus-Indicators sichtbar
- ✅ Screen-Reader Support

**Test mit:**
```bash
npm install -D jest-axe
# In Tests: expect(container).toHaveNoViolations()
```

---

### 9. Test-Mocking-Strategie
```typescript
// ⚠️ WICHTIG: Mock VOR dem Import!
vi.mock('@shared/services/ClubDataLoader', () => ({
  clubDataLoader: {
    loadAllClubs: vi.fn()
  }
}));

// DANN erst importieren
import { SimplifiedVereinStep } from './SimplifiedVereinStep';
```

**Reihenfolge ist kritisch!**

---

### 10. Datenbank-Migration
**Bei Schema-Änderungen:**
```typescript
// database.ts
const DB_VERSION = 6; // Increment!

this.version(6).stores({
  // Neue/geänderte Tabellen
});
```

**IndexedDB löscht alte Version automatisch!**
- Backup-Strategie planen
- Migrations-Script für User-Daten

---

## 👨‍💻 Entwickler-Workflow

### Setup (First Time)
```bash
cd basketball-app
npm install
npm run playwright:install
```

### Development
```bash
npm run dev               # Vite Dev Server (http://localhost:5173)
npm run test:watch        # Tests im Watch Mode
npm run test:ui           # Vitest UI (beste DX!)
```

### Testing
```bash
# Unit Tests
npm test                  # Einmal durchlaufen
npm run test:coverage     # Mit Coverage

# Contract Tests
./run-tests.sh pact       # PACT Tests

# E2E Tests
npm run test:e2e          # Headless
npm run test:e2e:headed   # Mit Browser
npm run test:e2e:ui       # Playwright UI

# Alle Tests (CI)
npm run test:all          # Unit + E2E
```

### Build
```bash
npm run build            # Production Build
npm run preview          # Preview Build
```

### Code Quality
```bash
npm run lint             # ESLint
npm run lint -- --fix    # Auto-Fix
```

---

## 📚 Wichtige Dateien - Quick Reference

### Konfiguration
```
vite.config.ts           # Vite + PWA + Aliases
vitest.config.ts         # Vitest + HappyDOM
tsconfig.json            # TypeScript + Paths
playwright.config.ts     # E2E Tests
```

### Datenbank
```
src/shared/db/database.ts              # ✅ Dexie Schema v5
```

### Services (Neu)
```
src/shared/services/ClubDataLoader.ts  # ✅ Club-Daten aus Chunks
src/shared/services/BBBApiService.ts   # ✅ REST API Wrapper
src/shared/services/BBBSyncService.ts  # ✅ Liga-Sync
```

### Services (Bestehend)
```
src/shared/services/UserService.ts     # ✅ Trainer-Accounts
src/shared/services/TeamService.ts     # ✅ Team-CRUD
src/shared/services/SpielerService.ts  # ✅ Spieler + Bewertungen
src/shared/services/SpielService.ts    # ✅ Spiele-CRUD
```

### Components (Onboarding)
```
src/domains/onboarding/components/
  ├── SimplifiedOnboardingContainer.tsx   # ✅ Neuer Flow
  ├── SimplifiedVereinStep.tsx            # ✅ Verein-Auswahl
  ├── SimplifiedTeamStep.tsx              # ✅ Team-Auswahl
  └── v2/                                 # ✅ BBB-API Flow
```

### Stores
```
src/domains/onboarding/onboarding-simple.store.ts  # ✅ Simplified
src/domains/onboarding/onboarding-v2.store.ts      # ✅ V2
```

### Daten
```
src/shared/data/clubs-chunks/
  ├── clubs-metadata.json              # ✅ Metadata (9000+ Clubs)
  └── clubs-chunk-[0-17].json          # ✅ 18 Chunks
```

### Tests
```
tests/unit/shared/services/
  ├── ClubDataLoader.test.ts           # ✅ 30+ Tests
  ├── BBBApiService.test.ts            # ✅ 18 Tests
  └── BBBSyncService.test.ts           # ✅ 14 Tests

tests/unit/domains/onboarding/
  ├── SimplifiedVereinStep.test.tsx    # ✅ 20+ Tests
  └── SimplifiedTeamStep.test.tsx      # ✅ 15 Tests

tests/contract/
  └── BBBSyncService.pact.test.ts      # ✅ 6 Contracts
```

---

## 🆘 Troubleshooting

### Tests failen mit "Cannot find module"
```bash
# Prüfe tsconfig.json UND vitest.config.ts
# Beide müssen identische Aliases haben!

# tsconfig.json
{
  "paths": {
    "@shared/*": ["./src/shared/*"]
  }
}

# vitest.config.ts
resolve: {
  alias: {
    '@shared': path.resolve(__dirname, './src/shared')
  }
}
```

---

### "kurzname ist möglicherweise nicht definiert"
```typescript
// ✅ Fix: Optional machen + Nullish Coalescing
interface ClubData {
  verein: {
    kurzname?: string; // Optional!
  };
}

kurzname: clubData.verein.kurzname ?? clubData.verein.name
```

---

### Mocks funktionieren nicht
```typescript
// ⚠️ WICHTIG: Mock VOR Import!
vi.mock('@shared/services/ClubDataLoader');
// DANN ERST:
import { SimplifiedVereinStep } from './SimplifiedVereinStep';
```

---

### Vite kann Chunks nicht finden
```typescript
// ❌ FALSCH: Fetch
await fetch('/data/clubs-chunks/clubs-chunk-0.json');

// ✅ RICHTIG: Import
await import('@shared/data/clubs-chunks/clubs-chunk-0.json');
```

---

### Datenbank-Version-Konflikt
```javascript
// Im Browser Console:
localStorage.clear()
indexedDB.deleteDatabase('BasketballPWA')
// Dann Seite neu laden
```

---

## 📌 Git-Commit-Strategie

### Conventional Commits
```bash
feat:     Neue Features
fix:      Bug-Fixes
test:     Tests hinzufügen/ändern
refactor: Code-Refactoring
docs:     Dokumentation
chore:    Build/Config-Änderungen
```

### Beispiele
```bash
git commit -m "feat: add ClubDataLoader service with chunk caching"
git commit -m "test: add unit tests for SimplifiedVereinStep"
git commit -m "fix: make kurzname optional in ClubData interface"
git commit -m "docs: consolidate project documentation"
git commit -m "refactor: extract search logic to useMemo hook"
```

---

## 🎯 Definitions of Done

### Feature ist fertig wenn:
- [ ] Tests geschrieben (TDD: RED-GREEN-REFACTOR)
- [ ] Code implementiert
- [ ] Alle Tests grün
- [ ] Coverage ≥85% für neue Dateien
- [ ] Dokumentation aktualisiert
- [ ] Accessibility geprüft (axe-core)
- [ ] Code reviewed
- [ ] In main gemerged

### Release ist fertig wenn:
- [ ] Alle Tests grün (Unit + Integration + E2E)
- [ ] Total Coverage ≥85%
- [ ] Keine WCAG AA Violations
- [ ] Performance-Budgets eingehalten
- [ ] Changelog aktualisiert
- [ ] Version gebumpt
- [ ] Git Tag erstellt

---

## 📞 Kontakt & Resources

### DBB Basketball Bund
- Website: https://www.basketball-bund.de
- TeamSL: https://www.basketball-bund.net
- REST API: https://www.basketball-bund.net/rest/
- Spielregeln: https://www.basketball-bund.de/regeln

### Dokumentation (Externe)
- React: https://react.dev
- TypeScript: https://www.typescriptlang.org
- Vitest: https://vitest.dev
- Playwright: https://playwright.dev
- Dexie: https://dexie.org
- Testing Library: https://testing-library.com

### Dokumentation (Intern)
- [DBB-API-EVALUATION.md](./DBB-API-EVALUATION.md) - API-Details & Mapping
- [TECHNICAL-DECISIONS.md](./TECHNICAL-DECISIONS.md) - TDRs
- [QUICKSTART.md](./QUICKSTART.md) - Chat-Wechsel Template
- [tests/README.md](../tests/README.md) - Test-Strategie

---

## 💡 Wichtige Hinweise

### Für Chat-Wechsel
Diese Datei enthält ALLES was du brauchst!

**Template für neuen Chat:**
```
Hallo! Ich arbeite an der Basketball Team Manager PWA.

Lies bitte für Kontext:
1. docs/development/PROJECT-STATUS.md (diese Datei)
2. docs/development/QUICKSTART.md

Aktueller Stand:
- ClubDataLoader Service implementiert ✅
- Simplified Onboarding Flow implementiert ✅
- 65+ Tests geschrieben, 27 failen noch ⚠️
- TypeScript kurzname-Fix deployed ✅

Nächste Aufgabe:
[Beschreibe hier was du als nächstes tun willst]

Meine Frage:
[Stelle hier deine Frage]
```

---

### Änderungs-Historie
```
v2.0.0-dev (23.10.2025)
- ✅ Konsolidierte Dokumentation erstellt
- ✅ ClubDataLoader Service implementiert
- ✅ Simplified Onboarding Flow (5 Schritte)
- ✅ 65+ Tests geschrieben
- ⚠️ 27 Tests failen noch (TypeScript kurzname-Fix deployed)

v1.2.3 (13.10.2025)
- ✅ CORS-Proxy mit Fallback
- ✅ Robuste Liga-ID Extraktion
- ✅ 15 neue Tests für Tabellen-Validierung

v1.2.2 (12.10.2025)
- ✅ Security-Updates

v1.2.1 (11.10.2025)
- ✅ Header-Filtering
- ✅ Liga-Name Parsing

v1.2.0 (10.10.2025)
- ✅ Spielplan & BBB-Integration
- ✅ BBBParserService
- ✅ BBBApiService
- ✅ BBBSyncService

v1.1.0 (09.10.2025)
- ✅ Spieler-Domain
- ✅ 9-Skill-Bewertungssystem

v1.0.0 (08.10.2025)
- ✅ MVP Release
- ✅ Datenbank v4
- ✅ Onboarding Flow
- ✅ Team Management
```

---

**Letzte Aktualisierung:** 23. Oktober 2025  
**Nächster Meilenstein:** Alle Tests grün + Scouting-Domain mit TDD  
**Status:** 🚧 Aktive Entwicklung

---

**🚀 Let's build something great!**
