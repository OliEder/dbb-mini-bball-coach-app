# arc42 Architekturdokumentation — BenchBoss (Basketball Team Manager)

**Version:** 2.1 (DBv7)  
**Stand:** Mai 2026  
**Autor:** Oliver Marcuseder

---

## 1. Einführung und Ziele

### 1.1 Aufgabenstellung

BenchBoss ist eine Progressive Web App (PWA) für Minibasketball-Trainer (Zielgruppe: U8–U16). Sie ermöglicht die Verwaltung von Teams, Spielern, Spielplänen und Liga-Synchronisation mit der DBB-REST-API — vollständig offline-fähig, ohne Backend-Server und ohne User-Accounts.

### 1.2 Wesentliche Features

| Feature | Beschreibung |
|---|---|
| Onboarding | Trainer wählt Verein und Teams (lokal oder via BBB-API) |
| Spielerverwaltung | CRUD, Bewertungen, Trikots, CSV-Import |
| Spielplan | Spiele, Ergebnisse, Liga-Tabelle |
| BBB-Sync | Automatische Liga-Synchronisation mit basketball-bund.net |
| Multi-Team | Trainer kann mehrere Teams gleichzeitig verwalten |
| Offline | Vollständige Funktionalität ohne Internetverbindung |

### 1.3 Qualitätsziele

| Priorität | Qualitätsmerkmal | Konkrete Ausprägung |
|---|---|---|
| 1 | **Privacy** | Keine zentralen Server, alle Daten lokal in IndexedDB (DSGVO-konform) |
| 2 | **Offline-Fähigkeit** | App funktioniert vollständig ohne Internet |
| 3 | **Performance** | App-Start < 2s, Such-Reaktion < 100ms |
| 4 | **Wartbarkeit** | DDD-Struktur, TDD, TypeScript-strict |

### 1.4 Stakeholder

| Stakeholder | Erwartung |
|---|---|
| Minibasketball-Trainer | Einfache Verwaltung von Team & Spielplan, offline nutzbar |
| Entwickler | Klare Domain-Grenzen, testbarer Code, keine Tech-Schulden |
| DBB | Keine missbräuchliche API-Nutzung (Rate-Limiting beachten) |

---

## 2. Randbedingungen

### 2.1 Technische Randbedingungen

| Bedingung | Beschreibung |
|---|---|
| Kein Backend | Die App funktioniert ohne eigenen Server |
| Browser-only | Läuft als PWA im Browser (Chrome, Safari, Firefox) |
| IndexedDB | Einziger Persistenz-Layer (Dexie.js als Abstraktion) |
| CORS-Einschränkung | DBB-API erlaubt keine direkten Browser-Requests → CORS-Proxy nötig |
| Apple Silicon | Entwicklung auf macOS ARM64 (M-Chip) |

### 2.2 Organisatorische Randbedingungen

- Einzelentwickler-Projekt (Oliver Marcuseder)
- Open Source (GitHub: `OliEder/dbb-mini-bball-coach-app`)
- Deployment via GitHub Pages

---

## 3. Kontextabgrenzung

### 3.1 Fachlicher Kontext

```
┌─────────────────────────────────────────────────────┐
│                  BenchBoss (PWA)                    │
│                                                     │
│  Trainer ──→ Onboarding ──→ Dashboard               │
│                 │                │                  │
│              Verein/Team    Spielplan/Tabelle        │
└─────────────────────────────────────────────────────┘
        │                              │
        ▼                              ▼
  clubs.json                   DBB REST API
  (Vereinsregister,         (basketball-bund.net)
   GitHub Pages,             via corsproxy.io
   CORS-frei)
```

### 3.2 Technischer Kontext

| Nachbarsystem | Richtung | Protokoll | Beschreibung |
|---|---|---|---|
| `basketball-bund.net` REST API | Ausgehend | HTTPS via CORS-Proxy | Liga-, Tabellen-, Spielplan-, Team-Match-Daten |
| `corsproxy.io` | Ausgehend | HTTPS | CORS-Proxy für DBB-API |
| `olieder.github.io/basketball-vereinsregister-deutschland` | Ausgehend | HTTPS (kein Proxy) | `clubs.json` — Vereinsregister mit `teamPermanentId` |
| IndexedDB (Browser) | Beidseitig | Dexie.js | Lokale Datenpersistenz |
| GitHub Pages | Ausgehend | HTTPS | Deployment/Hosting |

---

## 4. Lösungsstrategie

### Kernentscheidungen

1. **Offline-First mit IndexedDB:** Alle Daten lokal. Die DBB-API ist nur für den initialen Sync und manuelle Updates nötig.

2. **Domain-Driven Design:** Der Code ist in fachliche Domains aufgeteilt (`bbb-api`, `spieler`, `spielplan`, `team`, `verein`, `onboarding`, `dashboard`). Jede Domain kapselt Service, Components und Tests.

3. **Kein Backend, keine Accounts:** Maximale Privacy. Daten verlassen das Gerät nur durch den optionalen DBB-Sync.

4. **PWA mit Service Worker:** App ist installierbar und funktioniert offline via Workbox/vite-plugin-pwa.

5. **Technologie-Stack:** React 19 + TypeScript (strict) + Vite + Tailwind CSS + Zustand + Dexie.js

---

## 5. Bausteinsicht

### 5.1 Ebene 1 — Gesamtsystem

```
src/
├── domains/          # Fachliche Domains (DDD)
├── shared/           # Domainübergreifende Teile
│   ├── db/           # Dexie-Datenbank
│   ├── types/        # Zentrale TypeScript-Typen
│   ├── services/     # Shared Services (BBBApiService, etc.)
│   ├── data/         # Statische Club-Daten (18 JSON-Chunks)
│   └── components/   # Shared UI (DevTools, TeamSwitcher)
├── stores/           # Globale Zustand-Stores (appStore)
├── App.tsx           # Root-Komponente + Routing
└── main.tsx          # Entry Point + SW-Registrierung
```

### 5.2 Ebene 2 — Domains

#### `bbb-api` — DBB REST API Integration

**Verantwortung:** Kommunikation mit basketball-bund.net, Transformation in lokale Datenstrukturen.

```
bbb-api/services/
├── BBBApiService.ts          # HTTP-Client, CORS-Proxy-Logik, Rate-Limiting
├── BBBSyncService.ts         # Liga-Sync-Orchestrierung (DBv7, Participations)
└── __tests__/
    ├── BBBApiService.test.ts              # 18 Unit-Tests
    ├── BBBSyncService.test.ts             # 14 Unit-Tests
    ├── BBBSyncService.integration.test.ts # Integration-Tests
    └── BBBSyncService.pact.test.ts        # 6 Pact Contract-Tests
```

**Schlüssel-APIs:**
```typescript
// Liga komplett synchronisieren
await bbbSyncService.syncLiga(ligaId: number, options?: SyncOptions)

// Alle Spiele eines Teams (alle Ligen + Pokal) via teamPermanentId
await bbbApiService.getTeamMatches(teamPermanentId: number): Promise<DBBTeamMatchesResponse>

// Spielplan-Sync über Team-Endpunkt (primär), Fallback auf liga-basiert
await bbbSyncService.syncSpielplanForTeam(teamPermanentId: number, options?: { fallbackLigaIds?: number[] })

// Tabelle abrufen
await bbbApiService.getTabelle(ligaId: number): Promise<DBBTableResponse>

// Spielplan abrufen (Fallback)
await bbbApiService.getSpielplan(ligaId: number): Promise<SpielplanResponse>
```

**Besonderheiten:**
- CORS-Proxy (`corsproxy.io`) wird immer genutzt (außer localhost)
- Rate-Limiting: max. 10 parallele Requests, 300ms Delay
- 3-fach CORS-Proxy-Fallback
- `GET /rest/team/id/{teamPermanentId}/matches` liefert alle Spiele einer Saison in einem einzigen Call (Liga + Pokal)

---

#### `onboarding` — Erster-Start-Flow

**Verantwortung:** Ersteinrichtung (Trainer-Name, Vereinsauswahl via Vereinsregister, Team-Auswahl, BBB-Sync via `teamPermanentId`).

```
onboarding/
├── components/
│   ├── SimplifiedOnboardingContainer.tsx  # 5-Schritte-Flow
│   ├── WelcomeStep.tsx
│   ├── UserStep.tsx
│   ├── SimplifiedVereinStep.tsx           # Suche via clubs.json (client-seitig)
│   ├── SimplifiedTeamStep.tsx             # Teams aus selectedClub.teams[]
│   └── CompletionStep.tsx
└── onboarding-simple.store.ts             # Zustand-Store: clubs.json-basiert
```

**Flow:**
```
Welcome → User (Name) → Verein (Suche in clubs.json) → Team → Completion
                              ↓
                   clubs.json wird einmalig von
                   olieder.github.io/basketball-vereinsregister-deutschland
                   geladen und gecacht (CORS-frei, GitHub Pages)
                              ↓
                   selectedTeam.teamPermanentId → gespeichert als extern_permanent_id
                              ↓
                   BBBSyncService.syncSpielplanForTeam(teamPermanentId)
```

**Schlüssel-Exports des Stores:**
```typescript
VRClub       // Vereinsregister-Verein mit teams[]
VRTeam       // { teamPermanentId, altersklasse, geschlecht, teamNumber }
searchClubs(clubs: VRClub[], query: string): VRClub[]  // pure function, testbar
useSimpleOnboardingStore()  // Zustand-Store
```

---

#### `spieler` — Spielerverwaltung

**Verantwortung:** CRUD für Spieler, Bewertungen, Trikots, CSV-Import.

```
spieler/
├── components/
│   ├── SpielerVerwaltung.tsx
│   ├── SpielerListe.tsx
│   └── SpielerForm.tsx
└── services/
    └── SpielerService.ts
```

**SpielerService-API:**
```typescript
createSpieler(data): Promise<Spieler>
getSpielerByTeam(teamId, filter?): Promise<Spieler[]>
updateSpieler(id, data): Promise<void>
deleteSpieler(id): Promise<void>
```

---

#### `spielplan` — Spielplan & Ergebnisse

**Verantwortung:** Spiele anzeigen, Ergebnisse erfassen, Liga-Tabelle berechnen.

```
spielplan/
├── components/
│   ├── SpielplanListe.tsx
│   └── TabellenAnsicht.tsx
└── services/
    ├── SpielService.ts      # DBv7: Spiele via team_liga_participations
    └── TabellenService.ts   # Tabellen-Berechnung aus Spielergebnissen
```

**Wichtig (DBv7):** Spiele haben keine direkte `team_id` mehr. Die Zuordnung erfolgt über `heim_team_id`/`gast_team_id` und aktive `TeamLigaParticipations`.

---

#### `team` — Teamverwaltung

**Verantwortung:** Teams erstellen, finden, Participations verwalten.

```
team/
├── services/
│   └── TeamService.ts   # DBv7-konform, inkl. createTeamWithParticipation()
└── team.store.ts        # Zustand-Store für aktives Team
```

---

#### `verein` — Vereinsverwaltung

**Verantwortung:** Vereine anlegen (eigene + Gegner), DBB-Verknüpfung.

```
verein/
├── services/
│   └── VereinService.ts
└── verein.store.ts
```

---

#### `user` — Trainer-Account

**Verantwortung:** Genau ein User pro App-Instanz (der Trainer).

```
user/services/
└── UserService.ts   # createUser, getCurrentUser, updateUser
```

---

#### `dashboard` — Hauptansicht

**Verantwortung:** Übersicht nach dem Onboarding (Nächstes Spiel, Tabelle, Team-Switch).

---

### 5.3 Shared-Bereich

| Modul | Inhalt |
|---|---|
| `shared/db/database.ts` | Dexie-Instanz, Schema-Definition v9 (DBv7.2) |
| `shared/types/index.ts` | Alle zentralen TypeScript-Interfaces und Enums (inkl. `DBBTeamMatchEintrag`, `DBBTeamMatchesResponse`) |
| `stores/appStore.ts` | Globaler Zustand: aktives Team, myTeamIds |

---

## 6. Laufzeitsicht

### 6.1 Szenario: Onboarding (Erststart)

```
1. main.tsx lädt → SW registriert (PROD only)
2. App.tsx prüft appStore: kein currentTeamId?
3. → SimplifiedOnboardingContainer rendern
4. Schritt 3 (Verein): useSimpleOnboardingStore.loadClubs()
      → fetch clubs.json von GitHub Pages (einmalig, gecacht)
      → CORS-Proxy nicht nötig (GitHub Pages: Access-Control-Allow-Origin: *)
5. Trainer tippt → searchClubs(clubs, query) filtert client-seitig (substring, case-insensitive)
6. Trainer wählt Verein → selectedClub.teams[] anzeigen
7. Trainer wählt Team → selectedTeam.teamPermanentId gespeichert
8. Completion: Verein + Team in IndexedDB anlegen
      → Team.extern_permanent_id = teamPermanentId
      → BBBSyncService.syncSpielplanForTeam(teamPermanentId)
          → BBBApiService.getTeamMatches(teamPermanentId)  // ein Call für alle Ligen + Pokal
          → Fallback: getSpielplan(ligaId) falls Team-Endpunkt schlägt fehl
9. Dexie schreibt Spiele in IndexedDB
10. appStore.setMyTeamIds([...]) → Redirect zu Dashboard
```

### 6.2 Szenario: Liga-Sync

```
BBBSyncService.syncLiga(ligaId)
  → BBBApiService.getTabelle(ligaId)    // via corsproxy.io
  → für jeden Team-Eintrag:
      createOrFindTeam() via extern_permanent_id
      createOrUpdateParticipation() in team_liga_participations
  → BBBApiService.getSpielplan(ligaId)
  → für jedes Spiel:
      Upsert in db.spiele (via extern_spiel_id)

BBBSyncService.syncSpielplanForTeam(teamPermanentId, { fallbackLigaIds? })
  → BBBApiService.getTeamMatches(teamPermanentId)   // alle Spiele in einem Call
  → für jedes Spiel: Upsert in db.spiele
  → bei Fehler: Fallback auf syncSpielplan(ligaId) pro fallbackLigaId
```

### 6.3 Szenario: Spielplan anzeigen

```
SpielplanListe rendern
  → SpielService.getSpiele(teamId)
      → db.team_liga_participations.where('team_id').equals(teamId)
      → filter: ist_aktiv === true
      → liga_ids sammeln
      → db.spiele where heim_team_id oder gast_team_id in team.ids oder liga_id in liga_ids
  → Spiele sortiert nach Datum rendern
```

---

## 7. Verteilungssicht

```
GitHub Repository
    │
    ▼
GitHub Actions (deploy.yml)
    │  npm run build → dist/
    ▼
GitHub Pages
    │  https://olieeder.github.io/dbb-mini-bball-coach-app/
    ▼
Browser (PWA)
    ├── Service Worker (Workbox) → Offline-Cache
    └── IndexedDB (Dexie) → Lokale Daten
```

**Hosting:** GitHub Pages (kein eigener Server)  
**CI/CD:** GitHub Actions (`deploy.yml` auf Push zu `main`)  
**CNAME:** Eigene Domain konfigurierbar via `public/CNAME`

---

## 8. Querschnittliche Konzepte

### 8.1 Datenpersistenz (Dexie / IndexedDB)

Alle Anwendungsdaten leben in einer einzigen Dexie-Datenbank (`BasketballPWA`, Version 9). Migrationen werden über Dexie's eingebautes Versions-System abgewickelt.

**Wichtige Schema-Entscheidung (v7.0 Breaking Change):**

| Vor v7 | Ab v7 |
|---|---|
| `team.altersklasse` | → `TeamLigaParticipation.altersklasse` |
| `team.saison` | → `TeamLigaParticipation.saison` |
| `team.liga_id` | → `TeamLigaParticipation.liga_id` |
| `team.extern_team_id` | → `team.extern_permanent_id` (saisonübergreifend) |

Ein Team ist die permanente Organisation. Die Saison-/Liga-Zuordnung erfolgt über `TeamLigaParticipation`.

### 8.2 State Management (Zustand)

| Store | Datei | Inhalt |
|---|---|---|
| `appStore` | `src/stores/appStore.ts` | `currentTeamId`, `myTeamIds`, `switchTeam()` |
| `onboardingStore` | `domains/onboarding/onboarding-simple.store.ts` | Onboarding-Schritte, Zwischenergebnisse |
| `teamStore` | `domains/team/team.store.ts` | Team-Details für aktives Team |
| `vereinStore` | `domains/verein/verein.store.ts` | Vereins-Cache |

### 8.3 CORS-Proxy-Strategie

Die DBB-API erlaubt keine direkten Browser-Requests (CORS). Lösung: `corsproxy.io` wird **immer** genutzt (außer `localhost`/`127.0.0.1`). Es gibt 3 Proxy-Fallbacks. Direkte Fetches wurden entfernt (TDR-017).

### 8.4 Teststrategien

| Ebene | Framework | Beispiele |
|---|---|---|
| Unit-Tests | Vitest + Testing Library | SpielerService, TeamService, Stores, `searchClubs`, `getTeamMatches` |
| Integration-Tests | Vitest + fake-indexeddb | SpielerService.integration, BBBSyncService.integration |
| Contract-Tests | Pact v16 | BBBSyncService.pact (6 Contracts) |
| E2E-Tests | Playwright | App-Flows (Onboarding, Navigation) |

**Gesamt:** 302 Tests pass (Stand Mai 2026), 4 bekannte Fehler:
- 1 Pact-Infrastruktur-Bug (`messageConsumerPact` fehlt in Pact v16, TS-03)
- 3 BBBSyncService-Tests machen echte HTTP-Requests ohne Mock (pre-existing)

### 8.5 Offline / PWA

- Service Worker via `vite-plugin-pwa` (Workbox)
- Registrierung nur in PROD (`import.meta.env.PROD`)
- Cache-Strategien für Assets und API-Responses
- `clubs.json` wird beim ersten Onboarding-Aufruf von GitHub Pages geladen und im Zustand-Store gecacht — Vereinssuche im laufenden Betrieb offline möglich (nach initialem Laden)

### 8.6 Typsystem

Alle zentralen Types in `src/shared/types/index.ts` (Single Source of Truth). Input-Types (`CreateTeamInput`, `CreateVereinInput`) ebenfalls zentralisiert (TDR-016). TypeScript im strict-Mode.

---

## 9. Architekturentscheidungen

Alle Entscheidungen sind als TDRs dokumentiert in [`decisions/TECHNICAL-DECISIONS.md`](decisions/TECHNICAL-DECISIONS.md).

**Kurzübersicht:**

| TDR | Entscheidung |
|---|---|
| TDR-001 | ES Module Imports für Club-Chunks (statt fetch) |
| TDR-002 | Singleton Pattern für ClubDataLoader |
| TDR-006 | Zustand statt Redux |
| TDR-007 | Dexie statt nativer IndexedDB |
| TDR-009 | Tailwind CSS statt CSS Modules |
| TDR-010 | Vite + SWC statt Webpack |
| TDR-011 | PWA mit vite-plugin-pwa (Workbox) |
| TDR-012 | Keine User-Accounts, lokale Datenhaltung |
| TDR-017 | CORS-Proxy immer aktiv (außer localhost) |
| TDR-018 | Mock-Daten nur in Tests, nie in Production |

---

## 10. Qualitätsszenarien

| Szenario | Stimulus | Erwartetes Verhalten |
|---|---|---|
| App ohne Internet öffnen | Kein Netzwerk | Alle lokalen Daten verfügbar, BBB-Sync-Button zeigt Fehlermeldung |
| Vereinssuche mit 9.000 Einträgen | Trainer tippt 3 Buchstaben | Ergebnisse erscheinen < 100ms (lokale Suche, kein HTTP) |
| DBB-API nicht erreichbar | corsproxy.io down | Fehlerhinweis, App weiter nutzbar mit lokalen Daten |
| Neue Saison | team.saison ändert sich | Neue `TeamLigaParticipation` anlegen, altes Team bleibt erhalten |
| Großes Team (20 Spieler) | 20 Spieler in DB | Alle CRUD-Operationen funktionieren, Liste rendert in < 50ms |

---

## 11. Technische Schulden und Risiken

| ID | Beschreibung | Priorität | Status |
|---|---|---|---|
| TS-01 | `shared/services/BBBSyncService.ts` gelöscht ✅ | Mittel | Erledigt (Mai 2026) |
| TS-02 | `domains/spiel/` gelöscht ✅ | Mittel | Erledigt (Mai 2026) |
| TS-03 | Pact v16 Bug: `messageConsumerPact` fehlt → Pact-Tests laufen nicht | Hoch | Bekannt, Workaround: Tests excluded |
| TS-04 | `onboarding/services/ClubDataService.ts` und `LigaDiscoveryService.ts` gelöscht ✅ | Niedrig | Erledigt (Mai 2026) |
| TS-05 | `domains/team/team.service.ts` gelöscht ✅ | Mittel | Erledigt (Mai 2026) |
| TS-06 | `shared/services/BBBApiService.ts` hat redundante `getTeamMatches`-Kopie | Niedrig | Offen — kann gelöscht werden, sobald BBBApiService-Tests auf Domain-Pfad umgestellt sind |

---

## Glossar

| Begriff | Bedeutung |
|---|---|
| DBB | Deutscher Basketball Bund |
| BBB | basketball-bund.net (DBB REST API) |
| Participation | `TeamLigaParticipation` — Zuordnung eines Teams zu einer Liga/Saison |
| extern_permanent_id | Saisonübergreifende Team-ID aus der DBB-API |
| extern_team_id | Saison-spezifische Team-ID (in `TeamLigaParticipation`) |
| TDR | Technical Decision Record |
| PWA | Progressive Web App |
| CORS | Cross-Origin Resource Sharing |
