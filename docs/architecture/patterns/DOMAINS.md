# 🏗️ Domains-Übersicht - Basketball Team Manager

**Stand:** Mai 2026  
**Architektur:** Domain-Driven Design  
**Vollständige Dokumentation:** siehe [arc42.md](../arc42.md)

---

## 📋 Alle Domains

```
src/domains/
├── bbb-api/          ✅ DBB REST API Integration
├── dashboard/        ✅ Haupt-Dashboard
├── onboarding/       ✅ Vereins- & Team-Auswahl
├── spieler/          ✅ Spieler-Verwaltung
├── spielplan/        ✅ Spielplan & Ergebnisse
├── team/             ✅ Team-Verwaltung
├── user/             ✅ Trainer/User-Verwaltung
└── verein/           ✅ Vereins-Verwaltung
```

---

## 🔌 bbb-api (DBB REST API Integration)

### Zweck
Integration mit der DBB REST API (basketball-bund.net)

### Struktur
```
bbb-api/
└── services/
    ├── BBBApiService.ts                    # REST API Wrapper
    ├── BBBSyncService.ts                   # Liga-Synchronisation
    └── __tests__/
        ├── BBBApiService.test.ts           # 18 Tests
        ├── BBBSyncService.test.ts          # 14 Tests
        ├── BBBSyncService.integration.test.ts
        ├── BBBSyncService.pact.test.ts     # 6 PACT Contracts
        └── README.md
```

### Services

#### BBBApiService
**Datei:** `src/domains/bbb-api/services/BBBApiService.ts`

**Endpunkte:**
```typescript
// Liga-Suche (POST)
POST /rest/wam/data → LigaListeEintrag[]

// Tabelle (GET)
GET /rest/competition/table/id/{ligaId} → TabellenEintrag[]

// Spielplan (GET)
GET /rest/competition/spielplan/id/{ligaId} → SpielBasic[]

// Match-Info (GET)
GET /rest/match/id/{matchId}/matchInfo → MatchInfoResponse

// Kreuztabelle (GET)
GET /rest/competition/crosstable/id/{ligaId} → Kreuztabelle
```

**Features:**
- ✅ CORS-Proxy mit 3-fach Fallback
- ✅ Rate-Limiting (10 parallel, 300ms Delay)
- ✅ Batch-Processing
- ✅ Fehlerbehandlung
- ✅ 18 Unit-Tests + 6 PACT Contract-Tests

#### BBBSyncService
**Datei:** `src/domains/bbb-api/services/BBBSyncService.ts`

**API:**
```typescript
// Komplette Liga syncen
await bbbSyncService.syncLiga(ligaId);

// Team als "eigen" markieren
await bbbSyncService.markAsOwnTeam(teamId, userId);
```

**Workflow:**
1. Tabelle laden → Teams/Vereine erstellen
2. Spielplan laden → Spiele erstellen
3. Optional: Match-Info → Spieler extrahieren

---

## 📊 dashboard

### Zweck
Haupt-Dashboard mit Übersichten

### Status
🔄 TODO: Vollständige Dokumentation erstellen

### Vermutete Features
- Liga-Tabelle
- Nächstes Spiel
- Team-Statistiken
- Spieler-Übersicht

---

## 🚀 onboarding

### Zweck
Vereins- & Team-Auswahl beim ersten Start

### Struktur
```
onboarding/
├── components/
│   ├── SimplifiedOnboardingContainer.tsx   # ✅ 5-Schritte Flow
│   ├── SimplifiedVereinStep.tsx            # ✅ Verein-Auswahl
│   ├── SimplifiedTeamStep.tsx              # ✅ Team-Auswahl
│   └── v2/                                 # ✅ Legacy: BBB-API Flow (10 Schritte)
│       ├── OnboardingV2Container.tsx
│       ├── WelcomeStep.tsx
│       ├── UserStep.tsx
│       ├── VerbandStep.tsx
│       ├── AltersklassenStep.tsx
│       ├── GebietStep.tsx
│       ├── LigenLoadingStep.tsx
│       ├── VereinStep.tsx
│       ├── TeamStep.tsx
│       ├── SyncStep.tsx
│       └── TeamSelectionStep.tsx
├── services/
│   ├── ClubDataService.ts                  # ⚠️ Alt (wird durch ClubDataLoader ersetzt)
│   └── LigaDiscoveryService.ts             # ⚠️ Alt
├── onboarding-simple.store.ts              # ✅ Simplified Flow Store
└── onboarding-v2.store.ts                  # ✅ V2 Flow Store
```

### Flows

#### Simplified Flow (NEU ✨) - 5 Schritte
**Container:** `SimplifiedOnboardingContainer.tsx`  
**Store:** `onboarding-simple.store.ts`

**Workflow:**
```
1. Welcome    → Willkommen
2. User       → Vorname, Nachname
3. Verein     → Suche + Verband-Filter (optional)
4. Team       → Multi-Select
5. Completion → Dashboard
```

**Features:**
- ✅ ~9.000 Vereine durchsuchbar (lokal)
- ✅ Live-Suche (case-insensitive)
- ✅ Alphabetische Sortierung
- ✅ Verband-Filter (16 Landesverbände)
- ✅ Responsive Design

#### V2 Flow (BBB-API) - 10 Schritte
**Container:** `OnboardingV2Container.tsx`  
**Store:** `onboarding-v2.store.ts`

**Workflow:**
```
1. Welcome          → Willkommen
2. User             → Vorname, Nachname
3. Verband          → API-Call #1
4. Altersklassen    → API-Call #2
5. Gebiet           → API-Call #3
6. Ligen Loading    → API-Calls #4-N (Auto)
7. Verein           → Aus geladenen Teams
8. Team             → Multi-Select
9. Sync             → Tabelle + Spielplan
10. Team Selection  → Aktives Team
```

**Features:**
- ✅ Direkte DBB-Integration
- ✅ Schrittweise Filterung (minimale API-Calls)
- ✅ Vollständige Liga-Daten

---

## 👥 spieler

### Zweck
Spieler-Verwaltung & Bewertungen

### Status
🔄 TODO: Vollständige Dokumentation erstellen

### Vermutete Features
- Spieler-CRUD
- 9-Skill-Bewertungssystem
- CSV-Import
- TNA-Verwaltung
- Trikotnummern

---

## 📅 spielplan

### Zweck
Spielplan-Verwaltung & Ergebnisse

### Status
🔄 TODO: Vollständige Dokumentation erstellen

### Vermutete Features
- Spielplan-Ansicht
- Ergebnis-Eingabe
- Spiel-Details
- Liga-Tabelle

---

## 🏀 team

### Zweck
Team-Verwaltung

### Status
🔄 TODO: Vollständige Dokumentation erstellen

### Vermutete Features
- Team-CRUD
- Spieler-Zuordnung
- Team-Typ (eigen/gegner)
- Saison-Verwaltung

---

## 👤 user

### Zweck
Trainer/User-Verwaltung

### Status
🔄 TODO: Vollständige Dokumentation erstellen

### Vermutete Features
- User-CRUD
- Aktueller User
- User-Präferenzen

---

## 🏢 verein

### Zweck
Vereins-Verwaltung

### Status
🔄 TODO: Vollständige Dokumentation erstellen

### Vermutete Features
- Verein-CRUD
- Externe Verein-IDs (DBB)
- Kontakt-Daten

---

## 🧪 Tests

### Test-Verteilung
```
Domain-Tests (in __tests__ Ordnern):
├── bbb-api/services/__tests__/
│   ├── BBBApiService.test.ts               # 18 Tests
│   ├── BBBSyncService.test.ts              # 14 Tests
│   ├── BBBSyncService.integration.test.ts  # ? Tests
│   └── BBBSyncService.pact.test.ts         # 6 Contracts
│
└── (andere Domains: TODO dokumentieren)

tests/ Ordner (zentral):
├── unit/
│   ├── shared/services/
│   │   └── ClubDataLoader.test.ts          # 37 Tests
│   └── domains/onboarding/
│       ├── SimplifiedVereinStep.test.tsx   # ? Tests
│       └── SimplifiedTeamStep.test.tsx     # ? Tests
│
└── integration/
    └── onboarding-local-data.test.ts       # ? Tests
```

**Geschätzte Anzahl:** 145+ Tests  
**Aktueller Status:** 27 Tests failen (kurzname-Problem teilweise behoben)

---

## 📝 TODO: Vollständige Domain-Dokumentation

### Priorität 1 (Wichtig)
- [ ] dashboard/ vollständig dokumentieren
- [ ] spieler/ vollständig dokumentieren
- [ ] spielplan/ vollständig dokumentieren
- [ ] team/ vollständig dokumentieren
- [ ] user/ vollständig dokumentieren
- [ ] verein/ vollständig dokumentieren

### Priorität 2 (Nach Tests)
- [ ] Alle __tests__ Ordner inventarisieren
- [ ] Test-Coverage pro Domain
- [ ] Services pro Domain
- [ ] Components pro Domain
- [ ] Stores pro Domain

---

## 🚀 Nächste Schritte

1. **Tests durchlaufen lassen:**
   ```bash
   npm run test:ui
   ```

2. **Verbleibende Test-Errors fixen**

3. **Domain-Dokumentation vervollständigen:**
   - In jede Domain gehen
   - Services, Components, Stores inventarisieren
   - Tests zählen
   - Features dokumentieren

4. **Alte Services aufräumen:**
   - `ClubDataService.ts` → Löschen oder Migration
   - `LigaDiscoveryService.ts` → Löschen oder Migration

---

## 📚 Referenzen

- [PROJECT-STATUS.md](./PROJECT-STATUS.md) - Vollständige Projekt-Übersicht
- [DBB-API-EVALUATION.md](./DBB-API-EVALUATION.md) - API-Details & Mapping
- [TECHNICAL-DECISIONS.md](./TECHNICAL-DECISIONS.md) - TDRs

---

**Status:** 🚧 Teilweise dokumentiert  
**Nächster Schritt:** Tests laufen lassen + Domains vervollständigen
