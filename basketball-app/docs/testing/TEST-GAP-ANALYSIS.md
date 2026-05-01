# 📊 Test-Gap-Analyse - Basketball PWA

**Datum:** 03. November 2025  
**Status:** 🔴 KRITISCH - Massive Test-Lücken identifiziert  
**Ziel:** Systematische Test-Coverage für kritische DBv7 Migration

---

## 🚨 Executive Summary

**Aktuelle Situation:**
- ✅ **20 Test-Dateien** vorhanden (Unit, Integration, Contract, E2E)
- ✅ **178/194 Tests** bestehen (91.75%)
- 🔴 **Massive Lücken** in kritischen Bereichen
- 🔴 **E2E-Tests fast komplett verloren** (nur 2 übrig)
- 🔴 **Keine UI-Component-Tests** außer 2 Onboarding-Steps
- 🔴 **Viele Domänen ungetestet** (Einsatzplanung, Trikots, Training, etc.)

**Risiko für DBv7 Migration:** 🔴 **HOCH**
- Team-Services haben Tests, aber andere kritische Services nicht
- Keine E2E-Tests für kritische User Journeys
- UI-Changes werden nicht validiert

---

## 📁 IST-Zustand: Existierende Tests

### ✅ Unit Tests (15 Dateien)

#### Domains - Onboarding (4 Tests)
- ✅ `SimplifiedTeamStep.test.tsx` - UI Component (16 Tests)
- ✅ `SimplifiedVereinStep.test.tsx` - UI Component (16 Tests)
- ✅ `CSVImportService.test.ts` - Service (33 Tests)
- ✅ `onboarding-simple.store.test.ts` - Store (Tests?)

#### Domains - Spieler (1 Test)
- ✅ `SpielerService.test.ts` - Service

#### Domains - Spielplan (1 Test)  
- ✅ `SpielService.test.ts` - Service

#### Domains - Team (2 Tests)
- ✅ `TeamService.test.ts` - Multi-Team (8 Tests) 🔴 RED
- ✅ `TeamService.v7.test.ts` - DBv7 (8 Tests) 🔴 RED

#### Domains - Verein (1 Test)
- ✅ `VereinService.test.ts` - Service

#### Shared - DB (1 Test)
- ✅ `database-v7.test.ts` - DBv7 Migration (8 Tests)

#### Shared - Services (3 Tests)
- ✅ `BBBApiService.test.ts` - API Integration
- ✅ `BBBSyncService.test.ts` - Sync Logic
- ✅ `ClubDataLoader.test.ts` - Data Loading (31 Tests)

#### Shared - Utils (1 Test)
- ✅ `urlUtils.test.ts` - URL Parsing (13 Tests)

#### Stores (1 Test)
- ✅ `appStore.test.ts` - Global State (12 Tests)

---

### ✅ Integration Tests (4 Dateien)

- ✅ `onboarding-local-data.test.ts` - Onboarding Flow (16 Tests)
- ✅ `team-merge.test.ts` - Team Merging (2 Tests)
- ✅ `SpielerService.integration.test.ts` - Spieler CRUD
- ✅ `SpielService.integration.test.ts` - Spiel CRUD (9 Tests)

---

### ✅ Contract Tests (1 Datei)

- ✅ `BBBApi.comprehensive.pact.test.ts` - API Contract (15 Tests)

---

### ✅ E2E Tests (2 Dateien) 🔴 KRITISCH WENIG

- ✅ `accessibility.spec.ts` - WCAG AA Compliance
- ✅ `onboarding-simplified.spec.ts` - Simplified Onboarding

---

## 🔴 GAPS: Fehlende Tests

### 🚨 Priority 1: KRITISCHE Services ohne Tests

#### Einsatzplanung Domain (0 Tests!)
**Risiko:** 🔴 **SEHR HOCH** - Kern-Feature!
- ❌ `EinsatzplanService.ts` - Spieler-Rotation Logic
- ❌ `BalanceCalculator.ts` - Team-Balance Berechnungen
- ❌ `RotationsEngine.ts` - Automatische Rotation
- ❌ `FairnessValidator.ts` - DBB-Regel Validierung

**Warum kritisch:**
- **Core Feature** der App (Spieler-Einsatzplanung)
- **Komplexe Business Logic** (min. 2 Achtel spielen, 2 aussetzen)
- **DBB-Regel-Konformität** muss garantiert sein
- Falsche Rotation = Regelverstoß im echten Spiel!

---

#### Trikot Domain (0 Tests!)
**Risiko:** 🟡 **MITTEL**
- ❌ `TrikotService.ts` - Trikot-Verwaltung
- ❌ `TrikotZuteilung.ts` - Spieler-Trikot-Zuordnung

**Warum wichtig:**
- Trikot-Konflikte vor Spiel erkennen
- Verfügbarkeits-Tracking

---

#### Training Domain (0 Tests!)
**Risiko:** 🟡 **MITTEL**
- ❌ `TrainingService.ts` - Training-Verwaltung
- ❌ `AnwesenheitsTracker.ts` - Anwesenheits-Tracking

---

#### User Domain (0 Tests!)
**Risiko:** 🟢 **NIEDRIG** (einfacher Service)
- ❌ `UserService.ts` - User/Trainer Management

---

#### Liga/Tabellen Domain (0 Tests!)
**Risiko:** 🟡 **MITTEL**
- ❌ `TabellenService.ts` - Liga-Tabellen
- ❌ `LigaDiscoveryService.ts` - Liga Discovery
- ❌ `ClubDataService.ts` - Club Data Handling

**Hinweis:** `ClubDataLoader.test.ts` existiert (shared/services), aber Domain-Services ungetestet!

---

### 🚨 Priority 2: UI-Component-Tests

**Risiko:** 🔴 **HOCH** - Fast keine Coverage!

#### Dashboard (0 Tests!)
- ❌ `Dashboard.tsx` - Main Dashboard
- ❌ `TeamCard.tsx` - Team Overview Card
- ❌ `NextGameCard.tsx` - Nächstes Spiel

#### Spielplan (0 Tests!)
- ❌ `SpielplanList.tsx` - Spielplan Liste
- ❌ `SpielDetails.tsx` - Spiel-Details View

#### Spieler (0 Tests!)
- ❌ `SpielerList.tsx` - Spieler-Liste
- ❌ `SpielerDetails.tsx` - Spieler-Details
- ❌ `SpielerForm.tsx` - Spieler-Formular

#### Einsatzplanung (0 Tests!)  
- ❌ `EinsatzplanEditor.tsx` - Einsatzplan Editor
- ❌ `RotationVisualizer.tsx` - Rotation-Visualisierung
- ❌ `BalanceIndicator.tsx` - Balance-Anzeige

#### Team (0 Tests!)
- ❌ `TeamList.tsx` - Team-Übersicht
- ❌ `TeamForm.tsx` - Team-Formular
- ❌ `TeamSettings.tsx` - Team-Einstellungen

#### Shared Components (0 Tests!)
- ❌ `Modal.tsx`
- ❌ `Button.tsx`
- ❌ `Input.tsx`
- ❌ `Select.tsx`
- ❌ `Dropdown.tsx`

**Aktuell getestet:**
- ✅ `SimplifiedTeamStep.test.tsx` (16 Tests)
- ✅ `SimplifiedVereinStep.test.tsx` (16 Tests)

---

### 🚨 Priority 3: E2E User Journeys

**Risiko:** 🔴 **KRITISCH** - Fast alles fehlt!

**Aktuell:**
- ✅ Onboarding Flow (1 E2E-Test)
- ✅ Accessibility (1 E2E-Test)

**Fehlend:**

#### Critical User Journeys (0 Tests!)
- ❌ **Spieler hinzufügen** (CSV Import + Manual)
- ❌ **Spiel erstellen** + Einsatzplan
- ❌ **Rotation während Spiel** (Live-Modus)
- ❌ **Team-Wechsel** (Multi-Team Flow)
- ❌ **Liga-Sync** (BBB Import)
- ❌ **Spielberichtsbogen Export**

#### Regression Tests (0 Tests!)
- ❌ DBv7 Migration (Team → TeamLigaParticipation)
- ❌ Multi-Team Support
- ❌ Offline-Funktionalität (Service Worker)
- ❌ Session Persistence

#### Mobile E2E (0 Tests!)
- ❌ Touch-Gesten
- ❌ Mobile Navigation
- ❌ Responsive Layouts

---

## 📊 Coverage-Analyse

### Geschätzte Coverage nach Bereichen

| Bereich | Coverage | Status | Priorität |
|---------|----------|--------|-----------|
| **Services** | ~45% | 🟡 | 🔴 HIGH |
| **UI Components** | ~5% | 🔴 | 🔴 HIGH |
| **E2E Journeys** | ~10% | 🔴 | 🔴 HIGH |
| **Business Logic** | ~60% | 🟡 | 🔴 HIGH |
| **Utils** | ~80% | ✅ | 🟢 LOW |
| **Stores** | ~40% | 🟡 | 🟡 MEDIUM |
| **Integration** | ~30% | 🔴 | 🔴 HIGH |

### Gesamt-Coverage: **~35%** 🔴

**Ziel:** **≥85%**

---

## 🎯 Priorisierungs-Matrix

### Phase 1: SOFORT (Diese Woche) 🔴

**Ziel:** DBv7 Migration absichern + Kritische Features

1. **TeamService Tests grün** (GREEN Phase)
   - 16 RED-Tests fixen
   - DBv7 Participation Logic validieren

2. **Einsatzplanung Services** (NEU)
   - `EinsatzplanService.test.ts` - Rotation Logic
   - `FairnessValidator.test.ts` - DBB-Regel-Konformität
   - Integration Test: Kompletter Einsatzplan-Workflow

3. **Critical E2E Journey** (NEU)
   - `spieler-management.spec.ts` - Spieler hinzufügen/bearbeiten
   - `einsatzplan-erstellen.spec.ts` - Kompletter Einsatzplan-Flow

**Estimated:** 2-3 Tage (16 Std)

---

### Phase 2: WICHTIG (Nächste 2 Wochen) 🟡

**Ziel:** Service-Coverage auf 80%

4. **Fehlende Service Tests** (NEU)
   - `TrikotService.test.ts`
   - `TrainingService.test.ts`
   - `UserService.test.ts`
   - `TabellenService.test.ts`
   - `LigaDiscoveryService.test.ts`

5. **UI Component Tests** (NEU)
   - Dashboard Components (5 Tests)
   - Spielplan Components (3 Tests)
   - Spieler Components (4 Tests)
   - Shared Components (5 Tests)

6. **E2E Regression Tests** (NEU)
   - Multi-Team Workflow
   - Offline-Modus
   - Liga-Sync Complete

**Estimated:** 1 Woche (40 Std)

---

### Phase 3: NICE-TO-HAVE (Später) 🟢

7. **Visual Regression Tests**
   - Chromatic/Percy Setup
   - Screenshot-Vergleiche

8. **Performance Tests**
   - Lighthouse CI
   - Bundle-Size Tracking

9. **Mutation Tests**
   - Stryker Setup
   - Business Logic Coverage

**Estimated:** 1 Woche (40 Std)

---

## 🏗️ Implementierungs-Strategie

### Test-Pyramide (Ziel)

```
        /\
       /  \     10% E2E (User Journeys)
      /----\
     /      \   20% Integration (Service ↔ DB)
    /--------\
   /          \ 70% Unit (Business Logic)
  /____________\
```

**Aktuell:** Invertiert! Zu viel E2E verloren, zu wenig Unit.

---

### TDD-Workflow

Für **alle neuen Tests:**

```
1. RED: Test schreiben (failend)
2. GREEN: Minimale Implementation
3. REFACTOR: Code cleanup
4. DOCUMENT: Test-Doku + Coverage-Update
```

---

### Parallel-Strategie

**Team-Aufteilung** (falls mehrere Entwickler):
- **Track 1:** Service Tests (Backend Logic)
- **Track 2:** UI Component Tests (Frontend)
- **Track 3:** E2E Tests (User Journeys)

**Solo-Entwicklung:**
- Priorisierung nach Matrix oben
- 1 Feature = 1 Service Test + 1 Integration Test + 1 E2E Test

---

## 📋 Checkliste für jede neue Feature

Bevor ein Feature als "fertig" gilt:

- [ ] **Unit Tests** (Service + Business Logic)
- [ ] **Integration Test** (Service ↔ Database)
- [ ] **UI Component Test** (React Component)
- [ ] **E2E Test** (Critical User Journey)
- [ ] **Contract Test** (falls API involved)
- [ ] **Accessibility Test** (WCAG AA)
- [ ] **Performance Test** (Lighthouse Score)
- [ ] **Documentation** (Test-Strategie im README)

---

## 🎓 Test-Best-Practices

### DO ✅

- **Tests zuerst** (TDD)
- **Kleine, fokussierte Tests** (1 Assertion)
- **Sprechende Namen** (`should calculate balance correctly`)
- **AAA-Pattern** (Arrange, Act, Assert)
- **Mock externe Dependencies** (APIs, DB)
- **Test alle Edge Cases** (null, undefined, empty, negative)
- **Integration Tests für kritische Flows**
- **E2E für Happy Path + Critical Journeys**

### DON'T ❌

- **Keine Tests für Getter/Setter** (trivial)
- **Keine Tests für externe Libraries** (z.B. Dexie)
- **Keine Snapshot-Tests** (fragil)
- **Keine brittle Selectors** (use data-testid)
- **Keine langsame E2E** (parallelisieren!)
- **Keine Tests ohne Assertion** (sinnlos)

---

## 📊 Test-Reporting

### Coverage-Reports

```bash
# Unit Test Coverage
npm run test:coverage

# E2E Coverage
npm run test:e2e:coverage

# Gesamt-Report
npm run test:all:coverage
```

**Ziel-Metriken:**
- **Statements:** ≥85%
- **Branches:** ≥80%
- **Functions:** ≥85%
- **Lines:** ≥85%

---

## 🚦 Quality Gates

### Für jeden PR:

- ✅ **Alle Tests grün**
- ✅ **Coverage ≥85%**
- ✅ **Keine Accessibility Violations**
- ✅ **Lighthouse Score ≥90**
- ✅ **Keine TypeScript Errors**
- ✅ **Keine ESLint Warnings**

### Für Release:

- ✅ **Alle Priority 1 Tests** (DBv7, Einsatzplanung, Critical E2E)
- ✅ **Coverage ≥85%**
- ✅ **E2E Tests ≥20**
- ✅ **Manual Smoke Test** (Prod-like Environment)

---

## 📝 Next Actions

### Sofort (Heute/Morgen):

1. ✅ **TeamService Tests grün** (GREEN Phase)
2. 📝 **Einsatzplanung Test-Plan** erstellen
3. 📝 **E2E Critical Journey Spec** schreiben

### Diese Woche:

4. 🧪 **EinsatzplanService.test.ts** implementieren
5. 🧪 **FairnessValidator.test.ts** implementieren
6. 🎭 **spieler-management.spec.ts** E2E Test
7. 🎭 **einsatzplan-erstellen.spec.ts** E2E Test

### Nächste 2 Wochen:

8. 🧪 Fehlende Service Tests (5 Services)
9. 🎨 UI Component Tests (17 Components)
10. 🎭 E2E Regression Suite (6 Tests)

---

## 🔗 Referenzen

- **Bestehende Tests:** `/tests/` Directory
- **Test-Strategie:** `/docs/testing/TESTING-STRATEGY.md` (TODO)
- **TDD-Guide:** `/docs/testing/TDD-GUIDE.md` (TODO)
- **E2E-Patterns:** `/docs/testing/E2E-PATTERNS.md` (TODO)

---

**Erstellt:** 03.11.2025  
**Autor:** Claude + Oliver  
**Status:** 🔴 Action Required - Massive Lücken identifiziert  
**Review Date:** Wöchentlich aktualisieren
