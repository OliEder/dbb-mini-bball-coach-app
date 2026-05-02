# 🏗️ Implementation Roadmap - Basketball PWA

**Version:** 2.0  
**Stand:** 30. Oktober 2025  
**Status:** Phase 1-2 abgeschlossen, Phase 3 aktiv

---

## ✅ ABGESCHLOSSEN

### Phase 1: Datenbank & Basis-Services (Oktober 2025)
- [x] Datenbank v7.0 (Team Liga Participation Historisierung)
- [x] User-Tabelle & UserService
- [x] BBBApiService mit CORS-Fallback
- [x] BBBSyncService mit vollständiger Liga-Sync
- [x] ClubDataLoader (~9.000 Vereine)
- [x] CSVImportService konsolidiert
- [x] TypeScript Types vollständig

### Phase 2: Onboarding & Multi-Team (Oktober 2025)
- [x] Simplified Onboarding Flow (5 Schritte)
- [x] Multi-Team Support implementiert
- [x] Team-Switcher Component
- [x] Team-Übersicht Dashboard
- [x] 145+ Tests geschrieben
- [x] Service Cleanup (DDD-konform)

---

## 🚧 AKTIV - Phase 3: Dashboard-Features

**Ziel:** Vollständiges Team-Dashboard mit Liga-Integration  
**Deadline:** Mitte November 2025

### 3.1 Liga-Tabelle Component ⚡ PRIORITÄT
**File:** `src/domains/dashboard/components/LigaTabelle.tsx`

**Features:**
- [ ] Vollständige Tabellen-Anzeige
- [ ] Eigenes Team highlighted
- [ ] Sortierung (Platz, Punkte, Tordiff)
- [ ] Responsive Design (Mobile-First)
- [ ] Loading & Error States

**Datenquelle:**
```typescript
// Aus liga_tabellen Tabelle
await db.liga_tabellen
  .where('ligaid')
  .equals(team.liga_id)
  .sortBy('platz');
```

**UI-Design:**
```tsx
<LigaTabelle ligaId={team.liga_id} currentTeamId={team.team_id}>
  <table>
    <thead>
      <tr>
        <th>Platz</th>
        <th>Team</th>
        <th>Spiele</th>
        <th>Punkte</th>
        <th>+/-</th>
      </tr>
    </thead>
    <tbody>
      {teams.map(t => (
        <tr className={t.team_id === currentTeamId ? 'bg-blue-50' : ''}>
          <td>{t.platz}</td>
          <td>{t.teamname}</td>
          <td>{t.spiele}</td>
          <td>{t.punkte}</td>
          <td>{t.tordifferenz}</td>
        </tr>
      ))}
    </tbody>
  </table>
</LigaTabelle>
```

---

### 3.2 Nächstes Spiel Card
**File:** `src/domains/dashboard/components/NaechstesSpiel.tsx`

**Features:**
- [ ] Anzeige des nächsten geplanten Spiels
- [ ] Gegner-Info mit Tabellenplatz
- [ ] Datum, Uhrzeit, Halle
- [ ] "Benchmark anzeigen" Button (→ Phase 4)
- [ ] Countdown bis Spiel

**Datenquelle:**
```typescript
const nextSpiel = await db.spiele
  .where('[team_id+datum]')
  .between([teamId, new Date()], [teamId, Infinity])
  .first();

// Hole Gegner-Daten
const gegnerTeam = await teamService.getTeamById(
  nextSpiel.heim_team_id === teamId 
    ? nextSpiel.gast_team_id 
    : nextSpiel.heim_team_id
);
```

---

### 3.3 Team-Statistiken Widget
**File:** `src/domains/dashboard/components/TeamStats.tsx`

**Metriken:**
- [ ] Spieler gesamt
- [ ] Spieler mit TNA
- [ ] Spieler mit Bewertung
- [ ] Trikots verfügbar
- [ ] Nächstes Training (optional, Phase 4)

**Datenquelle:**
```typescript
const stats = {
  spielerCount: await db.spieler.where('team_id').equals(teamId).count(),
  mitTNA: await db.spieler
    .where('[team_id+tna_nr]')
    .between([teamId, 1], [teamId, Infinity])
    .count(),
  mitBewertung: await db.bewertungen
    .where('spieler_id')
    .anyOf(spielerIds)
    .count(),
  trikots: await db.trikots.where('team_id').equals(teamId).count()
};
```

---

### 3.4 Spielplan-Übersicht
**File:** `src/domains/spielplan/components/SpielplanListe.tsx`

**Features:**
- [ ] Vergangene & kommende Spiele
- [ ] Filter: Heim/Auswärts/Alle
- [ ] Status-Badge (geplant, laufend, beendet)
- [ ] Ergebnis-Anzeige
- [ ] Click → Spiel-Details

---

### 3.5 Quick Actions
**File:** `src/domains/dashboard/components/QuickActions.tsx`

**Aktionen:**
- [ ] CSV-Import Spieler
- [ ] CSV-Import Trikots
- [ ] Spieler manuell anlegen
- [ ] Liga neu synchronisieren
- [ ] Team-Einstellungen

---

## 🔮 GEPLANT - Phase 4: Services erweitern

### 4.1 SpielService erweitern
**File:** `src/domains/spielplan/services/SpielService.ts`

**Neue Methoden:**
```typescript
// Benchmark-relevante Abfragen
async getCommonOpponents(
  ownTeamId: string, 
  opponentTeamId: string
): Promise<Team[]>

async getResultAgainstOpponent(
  teamId: string, 
  opponentId: string
): Promise<SpielErgebnis | null>

// Spielplan-Statistiken
async getTeamStatistics(teamId: string): Promise<{
  gespielt: number;
  gewonnen: number;
  verloren: number;
  unentschieden: number;
  toreGeschossen: number;
  toreKassiert: number;
}>
```

---

### 4.2 BenchmarkService (NEU)
**File:** `src/domains/analyse/services/BenchmarkService.ts`

**Zweck:** Berechnung von Benchmark-Daten aus Spielplan

**Methoden:**
```typescript
async findCommonOpponents(
  ownTeamId: string,
  nextOpponentId: string
): Promise<BenchmarkResult[]>

async analyzeTrends(teamId: string): Promise<TrendAnalysis>

async predictOutcome(
  teamId: string,
  opponentId: string
): Promise<PredictionResult>
```

**Algorithmus:**
```typescript
// 1. Hole alle Spiele beider Teams
const ownGames = await spielService.getSpieleMitBeteiligung(ownTeamId);
const opponentGames = await spielService.getSpieleMitBeteiligung(nextOpponentId);

// 2. Finde gemeinsame Gegner
const ownOpponents = extractOpponents(ownGames, ownTeamId);
const opponentOpponents = extractOpponents(opponentGames, nextOpponentId);
const commonOpponents = intersection(ownOpponents, opponentOpponents);

// 3. Vergleiche Ergebnisse
for (const oppId of commonOpponents) {
  const ownResult = getResult(ownGames, oppId);
  const opponentResult = getResult(opponentGames, oppId);
  
  // Analyse: Wer hat besser abgeschnitten?
  const comparison = compareResults(ownResult, opponentResult);
}
```

---

### 4.3 HalleService erweitern
**File:** `src/domains/spielplan/services/HalleService.ts`

**Neue Methoden:**
```typescript
async findByName(name: string): Promise<Halle | undefined>
async createFromMatchInfo(venue: DBBVenue): Promise<Halle>
async getSpieleMitHalle(halleId: string): Promise<Spiel[]>
```

---

## 📋 Implementierungs-Checkliste

### Phase 3: Dashboard (Aktuell)
- [ ] **LigaTabelle Component** (3-4h)
  - [ ] Tests schreiben (TDD)
  - [ ] Component implementieren
  - [ ] Styling (Tailwind)
  - [ ] Integration in Dashboard

- [ ] **NaechstesSpiel Card** (2-3h)
  - [ ] Tests schreiben
  - [ ] Component implementieren
  - [ ] Gegner-Info laden
  - [ ] Integration in Dashboard

- [ ] **TeamStats Widget** (2h)
  - [ ] Tests schreiben
  - [ ] Component implementieren
  - [ ] Metriken berechnen
  - [ ] Integration in Dashboard

- [ ] **SpielplanListe** (3-4h)
  - [ ] Tests schreiben
  - [ ] Component implementieren
  - [ ] Filter-Logik
  - [ ] Integration in Dashboard

- [ ] **QuickActions** (1-2h)
  - [ ] Tests schreiben
  - [ ] Component implementieren
  - [ ] Action-Handler
  - [ ] Integration in Dashboard

### Phase 4: Services (Nächste Woche)
- [ ] **SpielService erweitern** (4-5h)
- [ ] **BenchmarkService erstellen** (6-8h)
- [ ] **HalleService erweitern** (2-3h)
- [ ] **Integration Tests** (3-4h)

---

## 🧪 Test-Strategie

### Unit Tests (pro Component)
```typescript
describe('LigaTabelle', () => {
  it('should render table with teams', () => {});
  it('should highlight current team', () => {});
  it('should sort by platz', () => {});
  it('should handle empty state', () => {});
  it('should handle loading state', () => {});
});
```

### Integration Tests
```typescript
describe('Dashboard Integration', () => {
  it('should load all data on mount', () => {});
  it('should refresh data on team switch', () => {});
  it('should handle sync trigger', () => {});
});
```

### E2E Tests (Playwright)
```typescript
test('Dashboard displays complete team data', async ({ page }) => {
  // Navigate to dashboard
  // Verify all widgets are visible
  // Check data accuracy
});
```

---

## 📊 Performance-Ziele

### Loading Times
- **Initial Dashboard Load:** <2s
- **Team Switch:** <500ms
- **Liga Sync:** <5s (3 Proxies)

### Optimierungen
- [ ] Liga-Tabelle cachen (5 Min TTL)
- [ ] Spielplan nur bei Änderungen neu laden
- [ ] Team-Stats cachen
- [ ] Lazy-Loading für Spielplan-Liste (>20 Spiele)

---

## 🚀 Deployment-Strategie

### Nach Phase 3 (Dashboard):
```bash
# 1. Tests grün
npm run test

# 2. Build
npm run build

# 3. Lighthouse Check
npm run lighthouse

# 4. Deploy
# (Details in /docs/operations/deployment/GITHUB-PAGES-SETUP.md)
```

### Feature-Flags (Optional)
```typescript
const FEATURE_FLAGS = {
  BENCHMARK: false,      // Phase 4
  TRAINING: false,       // Phase 4
  ADVANCED_STATS: false  // Phase 5
};
```

---

## 🔗 Verwandte Dokumentation

- [FEATURE-ROADMAP.md](./FEATURE-ROADMAP.md) - Langfristige Feature-Planung
- [MULTI-TEAM-SUPPORT-PLAN.md](./MULTI-TEAM-SUPPORT-PLAN.md) - Multi-Team Details
- [PROJECT-STATUS.md](../../development/PROJECT-STATUS.md) - Aktueller Dev-Status

---

## 📝 Commit-Empfehlungen

**Nach Phase 3 (Dashboard):**
```bash
git add .
git commit -m "feat: Complete team dashboard with liga table and stats

Components:
- LigaTabelle: Display league standings with highlighting
- NaechstesSpiel: Next game card with opponent info
- TeamStats: Team metrics widget
- SpielplanListe: Game schedule overview
- QuickActions: Quick access to common tasks

Tests: 45+ new tests, coverage >85%
Performance: Dashboard loads <2s

Closes #XX"
```

**Nach Phase 4 (Services):**
```bash
git commit -m "feat: Extended services for benchmarking and analytics

Services:
- SpielService: Common opponents, team statistics
- BenchmarkService: Algorithm for opponent comparison
- HalleService: Venue management

Tests: 30+ new tests, integration tests included

Prepares for Phase 5 (Einsatzplanung)"
```

---

**Nächster Schritt:** LigaTabelle Component implementieren (TDD)  
**Geschätzter Zeitaufwand Phase 3:** 15-20 Stunden  
**Deadline:** Mitte November 2025
