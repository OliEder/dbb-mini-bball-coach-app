# Implementation Roadmap - Basketball PWA v2.0

**Status:** Phase 1 - Datenbank & Basis-Services ✅  
**Datum:** 14. Oktober 2025

---

## ✅ ABGESCHLOSSEN

### 1. Datenbank erweitert (v5)
- [x] USER-Tabelle hinzugefügt
- [x] Teams: `extern_team_id`, `team_typ`, `user_id`
- [x] Vereine: `extern_verein_id`
- [x] Spieler: `extern_spieler_id`, `team_id` PFLICHT, `trikotnummer`, `tna_letzten_drei`
- [x] Spiele: `extern_spiel_id`, `liga_id`, `heim_team_id`, `gast_team_id`

### 2. Types erweitert
- [x] `User` Interface
- [x] `TeamTyp` Enum ('eigen' | 'gegner')
- [x] DBB API Types (WAM, Table, Spielplan, MatchInfo)

### 3. Services erstellt
- [x] UserService (User-Verwaltung)
- [x] BBBApiService (REST API Wrapper mit CORS-Fallback)

---

## ✅ Phase 2: BBBSyncService (ABGESCHLOSSEN)

**Status:** Implementiert mit vollständiger Test-Suite ✅  
**Datum:** 14. Oktober 2025

### Implementierte Features

- [x] BBBSyncService vollständig implementiert
- [x] Liga-Sync (Tabelle + Spielplan + Venues)
- [x] Team-Sync mit Verein-Erstellung
- [x] Spieler-Extraktion aus Match-Info
- [x] Team-Markierung als "eigen"
- [x] Batch-Processing mit Rate-Limiting

### Test-Coverage
- [x] Unit-Tests für BBBSyncService (14 Tests)
- [x] Unit-Tests für BBBApiService (18 Tests)
- [x] PACT Contract-Tests (optional, 6 Contracts)
- [x] Fehlerbehandlung und Edge-Cases
- [x] Test-Dokumentation

---

## 🚧 NEXT STEPS (In dieser Reihenfolge)

### Phase 3: Onboarding Flow v2 (DRINGEND)

**Location:** `src/domains/onboarding/`

**Steps:**
1. `WelcomeStep.tsx` - Übersicht
2. `UserStep.tsx` - Vor-/Nachname
3. `VerbandStep.tsx` - Verband wählen (API-Call #1)
4. `AltersklassenStep.tsx` - Multi-Select (API-Call #2)
5. `GebietStep.tsx` - Gebiet wählen (API-Call #3)
6. `LigenLoadingStep.tsx` - Auto-Load (API-Calls #4-N)
7. `VereinStep.tsx` - Verein aus geladenen Teams
8. `TeamStep.tsx` - Multi-Select eigene Teams
9. `SyncStep.tsx` - Tabelle + Spielplan sync
10. `TeamSelectionStep.tsx` - Aktives Team wählen

**State:** `onboardingStore.ts` (Zustand)

---

### Phase 4: Team-Dashboard (WICHTIG)

**Datei:** `src/domains/dashboard/TeamDashboard.tsx`

**Komponenten:**
- `LigaTabelle` - Vollständige Tabelle, eigenes Team highlighted
- `NaechstesSpiel` - Card mit Gegner-Info
- `TeamStats` - Mitglieder-Statistiken:
  - Anzahl mit/ohne TNA
  - Anzahl mit/ohne Bewertung
  - Übersicht Trikots
- `NeueSpiel

er` - Warnung wenn neue Spieler aus API
- `Aktionen`:
  - CSV-Import Spieler/Trikots
  - Manuelles Anlegen
  - Team-Einstellungen

---

### Phase 5: Weitere Services

#### TeamService erweitern
```typescript
// Neue Methoden:
async findByExternId(externId: string): Promise<Team | undefined>
async getTeamsByUser(userId: string): Promise<Team[]>
async markAsOwnTeam(teamId: string, userId: string): Promise<void>
```

#### VereinService erstellen
```typescript
async findByExternId(externId: string): Promise<Verein | undefined>
async findByName(name: string): Promise<Verein | undefined>
async createFromDBB(data: DBBTeamInfo): Promise<Verein>
```

#### SpielService erweitern
```typescript
async findByExternId(externId: string): Promise<Spiel | undefined>
async getSpieleMitEigenerBeteiligung(teamId: string): Promise<Spiel[]>
async getNextSpiel(teamId: string): Promise<Spiel | undefined>
```

#### HalleService erweitern
```typescript
async createFromMatchInfo(venue: DBBVenue): Promise<Halle>
async findByName(name: string): Promise<Halle | undefined>
```

---

## 📊 Dashboard Features (Detailliert)

### Liga-Tabelle
```tsx
<LigaTabelle>
  {teams.map(team => (
    <TabellenZeile 
      key={team.id}
      team={team}
      isOwnTeam={team.team_id === ownTeamId}  // Highlight!
    />
  ))}
</LigaTabelle>
```

### Nächstes Spiel
```tsx
<NaechstesSpiel>
  <SpielInfo>
    Datum: {spiel.datum}
    Gegner: {spiel.gegner}
    Halle: {spiel.halle}
  </SpielInfo>
  <BenchmarkButton onClick={() => showBenchmark(spiel.gegner_id)}>
    Vergleichswerte anzeigen
  </BenchmarkButton>
</NaechstesSpiel>
```

### Team-Statistiken
```tsx
<TeamStats>
  <Stat label="Spieler gesamt" value={spieler.length} />
  <Stat label="Mit TNA" value={mitTNA} />
  <Stat label="Mit Bewertung" value={mitBewertung} />
  <Stat label="Trikots" value={trikots.length} />
</TeamStats>
```

### Neue Spieler Warnung
```tsx
{neueSpiel

er.length > 0 && (
  <Alert variant="info">
    ℹ️ {neueSpieler.length} neue Spieler aus API gefunden:
    <ul>
      {neueSpieler.map(s => <li>{s.name}</li>)}
    </ul>
    <Button onClick={importSpieler}>Importieren</Button>
  </Alert>
)}
```

---

## 🔍 Benchmark-Berechnung (Aus Spielplan!)

**NICHT** via Crosstable, sondern aus Spielplan-Ergebnissen:

```typescript
/**
 * Findet gemeinsame Gegner im Spielplan
 */
async function findCommonOpponents(
  ownTeamId: string,
  nextOpponentId: string
): Promise<BenchmarkResult[]> {
  // 1. Alle Spiele des eigenen Teams
  const ownGames = await spielService.getSpieleMitBeteiligung(ownTeamId);
  
  // 2. Alle Spiele des nächsten Gegners
  const opponentGames = await spielService.getSpieleMitBeteiligung(nextOpponentId);
  
  // 3. Finde gemeinsame Gegner
  const ownOpponents = ownGames.map(g => 
    g.heim_team_id === ownTeamId ? g.gast_team_id : g.heim_team_id
  );
  
  const opponentOpponents = opponentGames.map(g =>
    g.heim_team_id === nextOpponentId ? g.gast_team_id : g.heim_team_id
  );
  
  const commonOpponents = ownOpponents.filter(id => 
    opponentOpponents.includes(id)
  );
  
  // 4. Berechne Vergleichswerte
  return commonOpponents.map(oppId => ({
    opponent: teamService.getTeam(oppId),
    ownResult: getResult(ownGames, oppId),
    nextOpponentResult: getResult(opponentGames, oppId),
    analysis: analyzeResults(...)
  }));
}
```

---

## 🧹 Refactoring (Später)

Nach Implementierung der neuen Features:

1. **Alte Onboarding-Steps prüfen**
   - Sind URL-basierte Steps noch nötig?
   - Löschen wenn obsolet

2. **BBBParserService prüfen**
   - HTML-Parsing noch nötig?
   - Eventuell für Legacy-Support behalten

3. **Ungenutzte Domains**
   - Analyse welche nicht mehr aufgerufen werden
   - Entscheidung: Löschen oder behalten

---

## ✅ Commit-Empfehlung

**Nach jeder Phase einen Commit:**

```bash
# Phase 1
git add .
git commit -m "feat: Database v5 + User & BBBApi Services

- Added USER table for trainer accounts
- Extended TEAMS with extern_team_id, team_typ, user_id
- Extended VEREINE, SPIELER, SPIELE with extern IDs
- Created UserService for trainer management
- Created BBBApiService with CORS fallback
- Prepared for guided onboarding flow v2

Breaking Changes: Database v5 migration required
Migration: Auto-reset on first launch"

# Phase 2 (BBBSyncService)
git commit -m "feat: BBBSyncService for liga data synchronization"

# Phase 3 (Onboarding v2)
git commit -m "feat: Guided onboarding flow v2 with filter selection"

# Phase 4 (Dashboard)
git commit -m "feat: Team dashboard with liga table and stats"
```

---

## 📝 Notizen

### CORS-Proxy Strategie
3 Proxies mit Fallback:
1. corsproxy.io (Primary)
2. cors-anywhere.herokuapp.com
3. allorigins.win

### Rate-Limiting
- Max 10 parallele Requests
- 300ms Delay zwischen Batches

### Venue-Sync
- Aus MatchInfo für jedes Spiel
- Deduplizierung nach Name
- Auto-Create wenn nicht vorhanden

---

**Status:** Bereit für Phase 2 (BBBSyncService)  
**Geschätzter Aufwand:** 3-4 Stunden pro Phase  
**Priorität:** Phase 2 > Phase 3 > Phase 4
