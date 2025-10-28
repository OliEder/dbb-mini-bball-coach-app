# Multi-Team Support - Implementation Plan

**Status:** 🚧 In Planung  
**Datum:** 27.10.2025  
**Phase:** 2 von 4 (nach Altersklassen-Fix)

---

## 🎯 Ziel

**Problem:** Trainer können im Onboarding mehrere Teams auswählen, aber die App verwaltet nur EIN aktives Team.

**Lösung:** Vollständiger Multi-Team Support mit:
- Mehrere Teams pro Trainer verwalten
- Team-Switcher für schnellen Wechsel
- Team-Übersicht mit Key-Metrics
- Persistente Team-Auswahl

---

## ✅ Phase 1: Abgeschlossen (Altersklassen-Fix)

### Was wurde erreicht?

1. **Type Definition erweitert** (`/src/shared/types/index.ts`)
   ```typescript
   export type Altersklasse = 
     | 'U7' | 'U8' | 'U9' | 'U10' | 'U11' | 'U12' | 'U13' 
     | 'U14' | 'U15' | 'U16' | 'U17' | 'U18' | 'U19' | 'U20' 
     | 'U21' | 'U23'   // ✅ NEU
     | 'Senioren';     // ✅ NEU
   ```

2. **BBBSyncService erweitert** (`/src/domains/bbb-api/services/BBBSyncService.ts`)
   - `extractAltersklasseFromLiganame()` - erkennt U21, U23, Senioren
   - `extractAltersklasseFromTeamname()` - erkennt U21, U23, Senioren
   - Pattern-Matching für "Herren", "Damen" → `Senioren`

3. **ClubDataLoader erweitert** (`/src/shared/services/ClubDataLoader.ts`)
   - Neue Methode `extractAltersklasse()` mit Validierung
   - Korrekte Extraktion aus `teamAkj`

4. **Tests vollständig** (7 neue Tests, 2 angepasst)
   - ✅ Alle Tests grün

---

## 🚀 Phase 2: Multi-Team Support (NÄCHSTER SCHRITT)

### Übersicht der Änderungen

```
1. App Store erweitern        (myTeamIds: UUID[])
2. TeamService erweitern       (getMyTeams(), switchTeam())
3. Team-Switcher Component     (Dropdown im Header)
4. Team-Übersicht View         (Dashboard-View: 'teams')
5. Onboarding anpassen         (Multiple Teams speichern)
```

---

## 📋 Detaillierter Implementierungsplan

### 1️⃣ App Store erweitern (TDD: RED → GREEN → REFACTOR)

**File:** `/src/stores/appStore.ts`

#### RED: Test schreiben
```typescript
// /tests/unit/stores/appStore.test.ts (NEU)
describe('AppStore - Multi-Team Support', () => {
  it('should store multiple team IDs', () => {
    const { setMyTeams, myTeamIds } = useAppStore.getState();
    const teamIds = ['team-1', 'team-2', 'team-3'];
    
    setMyTeams(teamIds);
    
    expect(useAppStore.getState().myTeamIds).toEqual(teamIds);
    expect(useAppStore.getState().myTeamIds.length).toBe(3);
  });

  it('should switch current team', () => {
    const { setMyTeams, switchTeam, currentTeamId } = useAppStore.getState();
    const teamIds = ['team-1', 'team-2', 'team-3'];
    
    setMyTeams(teamIds);
    switchTeam('team-2');
    
    expect(useAppStore.getState().currentTeamId).toBe('team-2');
  });

  it('should not switch to non-existent team', () => {
    const { setMyTeams, switchTeam, currentTeamId } = useAppStore.getState();
    const teamIds = ['team-1', 'team-2'];
    
    setMyTeams(teamIds);
    switchTeam('team-1');
    
    // Versuche zu nicht-existierendem Team zu wechseln
    switchTeam('team-999');
    
    // Sollte beim aktuellen Team bleiben
    expect(useAppStore.getState().currentTeamId).toBe('team-1');
  });
});
```

#### GREEN: Implementation
```typescript
// /src/stores/appStore.ts
interface AppStore {
  // Current State
  currentTeamId: UUID | null;
  myTeamIds: UUID[];  // ✅ NEU: Liste aller eigenen Teams
  hasCompletedOnboarding: boolean;
  
  // Actions
  setCurrentTeam: (teamId: UUID) => void;
  setMyTeams: (teamIds: UUID[]) => void;      // ✅ NEU
  switchTeam: (teamId: UUID) => void;          // ✅ NEU
  completeOnboarding: () => void;
  reset: () => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      currentTeamId: null,
      myTeamIds: [],  // ✅ NEU

      setCurrentTeam: (teamId) => set({ currentTeamId: teamId }),

      setMyTeams: (teamIds) => set({ 
        myTeamIds: teamIds,
        // Wenn noch kein Team aktiv, setze erstes Team
        currentTeamId: get().currentTeamId || teamIds[0] || null
      }),

      switchTeam: (teamId) => {
        // ✅ Nur zu Team wechseln wenn es in myTeamIds ist
        const { myTeamIds } = get();
        if (myTeamIds.includes(teamId)) {
          set({ currentTeamId: teamId });
        } else {
          console.warn(`Cannot switch to team ${teamId} - not in myTeamIds`);
        }
      },

      completeOnboarding: () => set({ hasCompletedOnboarding: true }),

      reset: () => set({
        currentTeamId: null,
        myTeamIds: [],  // ✅ NEU
        hasCompletedOnboarding: false
      })
    }),
    {
      name: 'basketball-app'
    }
  )
);
```

#### REFACTOR: Code optimieren
- Type-Safety prüfen
- Edge-Cases testen (leere Arrays, null-Werte)
- Persistence testen (localStorage)

---

### 2️⃣ TeamService erweitern

**File:** `/src/domains/team/services/TeamService.ts`

```typescript
// Neue Methoden hinzufügen
class TeamService {
  /**
   * Holt alle Teams des Trainers
   */
  async getMyTeams(userId: string): Promise<Team[]> {
    return await db.teams
      .where('[user_id+team_typ]')
      .equals([userId, 'eigen'])
      .toArray();
  }

  /**
   * Holt Team-Statistiken (für Übersicht)
   */
  async getTeamStats(teamId: string): Promise<{
    spielerCount: number;
    spieleCount: number;
    naechstesSpiel?: Spiel;
    tabellenplatz?: number;
  }> {
    const [spielerCount, spieleCount, naechstesSpiel] = await Promise.all([
      db.spieler.where('team_id').equals(teamId).count(),
      db.spiele.where('team_id').equals(teamId).count(),
      db.spiele
        .where('team_id')
        .equals(teamId)
        .filter(s => s.status === 'geplant' && s.datum > new Date())
        .sortBy('datum')
        .then(spiele => spiele[0])
    ]);

    // Tabellenplatz aus liga_tabellen holen (optional)
    const team = await db.teams.get(teamId);
    let tabellenplatz: number | undefined;
    
    if (team?.liga_id) {
      const tabellenEintrag = await db.liga_tabellen
        .where('[ligaid+teamname]')
        .equals([team.liga_id, team.name])
        .first();
      tabellenplatz = tabellenEintrag?.platz;
    }

    return {
      spielerCount,
      spieleCount,
      naechstesSpiel,
      tabellenplatz
    };
  }
}
```

---

### 3️⃣ Team-Switcher Component (UI)

**File:** `/src/shared/components/TeamSwitcher.tsx` (NEU)

```typescript
import React, { useState, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { teamService } from '@/domains/team/services/TeamService';
import type { Team } from '@/shared/types';

export const TeamSwitcher: React.FC = () => {
  const { currentTeamId, myTeamIds, switchTeam } = useAppStore();
  const [teams, setTeams] = useState<Team[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTeams();
  }, [myTeamIds]);

  const loadTeams = async () => {
    setIsLoading(true);
    try {
      // Hole alle Teams anhand der IDs
      const loadedTeams = await Promise.all(
        myTeamIds.map(id => teamService.getTeamById(id))
      );
      setTeams(loadedTeams.filter(Boolean) as Team[]);
    } catch (error) {
      console.error('Failed to load teams:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTeamSwitch = (teamId: string) => {
    switchTeam(teamId);
    setIsOpen(false);
  };

  // Nur anzeigen wenn mehrere Teams
  if (teams.length <= 1) return null;

  const currentTeam = teams.find(t => t.team_id === currentTeamId);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        aria-label="Team wechseln"
        aria-expanded={isOpen}
      >
        <span className="font-medium text-gray-900">
          {currentTeam?.name || 'Team wählen'}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Overlay zum Schließen */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          
          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
            <div className="py-2">
              {teams.map(team => (
                <button
                  key={team.team_id}
                  onClick={() => handleTeamSwitch(team.team_id)}
                  className={`
                    w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors
                    ${team.team_id === currentTeamId ? 'bg-blue-50' : ''}
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{team.name}</p>
                      <p className="text-sm text-gray-500">
                        {team.altersklasse} • {team.saison}
                      </p>
                    </div>
                    {team.team_id === currentTeamId && (
                      <Check className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
```

**Tests:** `/tests/unit/shared/components/TeamSwitcher.test.tsx`

---

### 4️⃣ Team-Übersicht View (Dashboard)

**File:** `/src/domains/dashboard/components/TeamOverview.tsx` (NEU)

```typescript
import React, { useState, useEffect } from 'react';
import { Users, Calendar, TrendingUp, ChevronRight } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { teamService } from '@/domains/team/services/TeamService';
import type { Team } from '@/shared/types';

interface TeamCardData extends Team {
  stats: {
    spielerCount: number;
    spieleCount: number;
    naechstesSpiel?: {
      datum: Date;
      gegner: string;
    };
    tabellenplatz?: number;
  };
}

export const TeamOverview: React.FC = () => {
  const { myTeamIds, switchTeam } = useAppStore();
  const [teams, setTeams] = useState<TeamCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTeamsWithStats();
  }, [myTeamIds]);

  const loadTeamsWithStats = async () => {
    setIsLoading(true);
    try {
      const teamsData = await Promise.all(
        myTeamIds.map(async (teamId) => {
          const [team, stats] = await Promise.all([
            teamService.getTeamById(teamId),
            teamService.getTeamStats(teamId)
          ]);
          
          return team ? { ...team, stats } : null;
        })
      );
      
      setTeams(teamsData.filter(Boolean) as TeamCardData[]);
    } catch (error) {
      console.error('Failed to load teams:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenTeam = (teamId: string) => {
    switchTeam(teamId);
    // Navigation zur Übersicht (wird vom Parent-Dashboard gehandhabt)
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="card animate-pulse">
            <div className="h-32 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Meine Teams
        </h2>
        <p className="text-gray-600">
          {teams.length} {teams.length === 1 ? 'Team' : 'Teams'} verwaltet
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map(team => (
          <button
            key={team.team_id}
            onClick={() => handleOpenTeam(team.team_id)}
            className="card hover:shadow-lg transition-all text-left group"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {team.name}
                </h3>
                <p className="text-sm text-gray-500">
                  {team.altersklasse} • {team.saison}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <div className="text-xl font-bold text-gray-900">
                    {team.stats.spielerCount}
                  </div>
                  <div className="text-xs text-gray-500">Spieler</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <div className="text-xl font-bold text-gray-900">
                    {team.stats.spieleCount}
                  </div>
                  <div className="text-xs text-gray-500">Spiele</div>
                </div>
              </div>
            </div>

            {/* Liga-Info */}
            {team.liga_name && (
              <div className="mb-4 p-2 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-700">{team.liga_name}</div>
                {team.stats.tabellenplatz && (
                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                    <TrendingUp className="w-3 h-3" />
                    Platz {team.stats.tabellenplatz}
                  </div>
                )}
              </div>
            )}

            {/* Nächstes Spiel */}
            {team.stats.naechstesSpiel && (
              <div className="pt-4 border-t border-gray-200">
                <div className="text-xs text-gray-500 mb-1">Nächstes Spiel</div>
                <div className="text-sm font-medium text-gray-900">
                  {new Date(team.stats.naechstesSpiel.datum).toLocaleDateString('de-DE', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })}
                </div>
                <div className="text-sm text-gray-600">
                  vs. {team.stats.naechstesSpiel.gegner}
                </div>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
```

---

### 5️⃣ Dashboard Integration

**File:** `/src/domains/dashboard/Dashboard.tsx`

```typescript
// Änderungen:

// 1. Neue View hinzufügen
type View = 'overview' | 'teams' | 'spieler' | 'spielplan' | 'tabelle' | 'statistik' | 'einstellungen';

// 2. TeamSwitcher importieren und einbauen
import { TeamSwitcher } from '@/shared/components/TeamSwitcher';

// 3. Navigation erweitern
const navigationItems = [
  { id: 'overview' as View, label: 'Übersicht', icon: Home },
  { id: 'teams' as View, label: 'Meine Teams', icon: Users },  // ✅ NEU
  { id: 'spieler' as View, label: 'Spieler', icon: Users },
  // ... rest
];

// 4. TeamSwitcher in Header
<header>
  <div className="flex items-center gap-3">
    <Home />
    <div>
      <h1>{team.name}</h1>
      <p>{team.altersklasse} • {team.saison}</p>
    </div>
  </div>
  
  <TeamSwitcher />  {/* ✅ NEU */}
  
  {team.liga_id && (
    <button onClick={handleSync}>Sync</button>
  )}
</header>

// 5. Teams-View rendern
{currentView === 'teams' && (
  <TeamOverview />
)}
```

---

### 6️⃣ Onboarding anpassen

**File:** `/src/domains/onboarding/components/SimplifiedOnboardingContainer.tsx`

```typescript
// Änderungen in handleTeamsSelected():

const handleTeamsSelected = async (selectedTeams: Team[]) => {
  setIsLoading(true);
  
  try {
    // 1. User erstellen
    const user = await createUser();
    
    // 2. ✅ Alle ausgewählten Teams als "eigen" markieren
    const teamIds = selectedTeams.map(t => t.team_id);
    
    await Promise.all(
      teamIds.map(async (teamId) => {
        // Team in DB als "eigen" markieren
        await db.teams.update(teamId, {
          team_typ: 'eigen',
          user_id: user.user_id,
          updated_at: new Date()
        });
      })
    );
    
    // 3. ✅ In Store speichern (ALLE Teams)
    useAppStore.getState().setMyTeams(teamIds);
    useAppStore.getState().setCurrentTeam(teamIds[0]);  // Erstes Team aktiv
    
    // 4. Onboarding abschließen
    useAppStore.getState().completeOnboarding();
    
    // 5. Optional: Liga-Sync für alle Teams
    // (Kann auch im Hintergrund passieren)
    
  } catch (error) {
    console.error('Onboarding failed:', error);
    // Error handling
  } finally {
    setIsLoading(false);
  }
};
```

---

## 🧪 Test-Strategie

### Unit Tests
1. ✅ `appStore.test.ts` - Multi-Team State Management
2. ✅ `TeamService.test.ts` - getMyTeams(), getTeamStats()
3. ✅ `TeamSwitcher.test.tsx` - Component Logic
4. ✅ `TeamOverview.test.tsx` - Component Logic

### Integration Tests
1. ✅ Onboarding mit mehreren Teams
2. ✅ Team-Wechsel mit Daten-Reload
3. ✅ Persistenz über Page-Reload

### E2E Tests (Playwright)
1. ✅ Kompletter Onboarding-Flow mit 3 Teams
2. ✅ Team-Switcher Interaktion
3. ✅ Team-Übersicht → Team öffnen → Daten korrekt

---

## 📦 Files Overview

### Neue Files
```
/src/stores/appStore.ts                                    [MODIFY]
/src/shared/components/TeamSwitcher.tsx                    [NEW]
/src/domains/team/services/TeamService.ts                  [MODIFY]
/src/domains/dashboard/components/TeamOverview.tsx         [NEW]
/src/domains/dashboard/Dashboard.tsx                       [MODIFY]
/src/domains/onboarding/components/SimplifiedOnboardingContainer.tsx [MODIFY]

/tests/unit/stores/appStore.test.ts                        [NEW]
/tests/unit/shared/components/TeamSwitcher.test.tsx        [NEW]
/tests/unit/domains/dashboard/TeamOverview.test.tsx        [NEW]
/tests/integration/multi-team-workflow.test.ts             [NEW]
/tests/e2e/multi-team-onboarding.spec.ts                   [NEW]
```

---

## ⚠️ Wichtige Hinweise

### Datenbank
- ✅ Keine Schema-Änderungen nötig!
- ✅ `team_typ` existiert bereits
- ✅ `user_id` existiert bereits
- ✅ Index `[user_id+team_typ]` existiert bereits

### Bestehende Features
- ✅ Alle existierenden Features bleiben funktional
- ✅ Single-Team Workflow funktioniert weiterhin
- ✅ Backward-Compatible (alte Daten funktionieren)

### Performance
- ⚠️ Bei vielen Teams (>10): Lazy-Loading in TeamOverview
- ⚠️ Team-Stats cachen (z.B. für 5 Minuten)

---

## 🎯 Acceptance Criteria

### Must Have
- [ ] Trainer kann mehrere Teams auswählen im Onboarding
- [ ] Team-Switcher zeigt alle Teams an
- [ ] Wechsel zwischen Teams funktioniert
- [ ] Team-Übersicht zeigt Key-Metrics
- [ ] Persistenz über Browser-Reload
- [ ] Alle Tests grün

### Nice to Have
- [ ] Team-Favoriten (Reihenfolge anpassen)
- [ ] Team-Archivierung (alte Saisons)
- [ ] Team-Farben für visuelle Unterscheidung

---

## 📝 Implementation Checklist

### Phase 2.1: Store & Services
- [ ] appStore erweitern + Tests
- [ ] TeamService erweitern + Tests
- [ ] Integration Tests

### Phase 2.2: UI Components
- [ ] TeamSwitcher Component + Tests
- [ ] TeamOverview Component + Tests
- [ ] Visual Regression Tests

### Phase 2.3: Dashboard Integration
- [ ] Dashboard erweitern (View + Navigation)
- [ ] TeamSwitcher einbauen
- [ ] E2E Tests

### Phase 2.4: Onboarding
- [ ] SimplifiedOnboardingContainer anpassen
- [ ] Multi-Team Speicherung
- [ ] E2E Onboarding Tests

---

## 🚀 Nächste Schritte

1. **Start:** `appStore.test.ts` schreiben (RED)
2. **Dann:** `appStore.ts` implementieren (GREEN)
3. **Dann:** Refactoring + Code-Review
4. **Weiter:** Punkt für Punkt nach Plan

---

**💡 Tipp für neuen Chat:**
Referenziere diese Datei mit:
```
"Bitte implementiere Phase 2 nach /docs/development/MULTI-TEAM-SUPPORT-PLAN.md
Start mit Schritt 1 (App Store erweitern) - TDD-konform."
```

---

**Ende der Dokumentation**
