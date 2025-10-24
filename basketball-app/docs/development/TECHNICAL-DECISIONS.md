# 📝 Technical Decision Records (TDR)

Alle wichtigen technischen Entscheidungen dokumentiert.

---

## TDR-001: ES Module Imports statt Fetch für Chunks
**Datum:** 23.10.2025  
**Status:** ✅ Implementiert

### Context
Wir haben ~9.000 DBB-Vereine in 18 JSON-Chunks gesplittet. Wie laden wir diese optimal?

### Optionen
1. **Fetch aus /public/**
   - Pro: Einfach, bekannt
   - Con: Kein Tree-Shaking, kein Type-Safety, Race Conditions

2. **ES Module Imports** ✅
   - Pro: Vite-optimiert, Type-Safe, Code-Splitting
   - Con: Etwas komplexere Syntax

### Entscheidung
✅ **ES Module Imports**

```typescript
const chunk = await import(`@shared/data/clubs-chunks/clubs-chunk-${i}.json`);
```

### Begründung
- Vite optimiert ES Modules automatisch
- TypeScript kann Typen checken
- Bessere Performance durch Code-Splitting
- Keine Race Conditions beim Build

---

## TDR-002: Singleton Pattern für ClubDataLoader
**Datum:** 23.10.2025  
**Status:** ✅ Implementiert

### Context
Wie instanziieren wir den ClubDataLoader in der App?

### Optionen
1. **React Context Provider**
   - Pro: Dependency Injection, testbar
   - Con: Overhead, React-spezifisch

2. **Singleton Export** ✅
   - Pro: Einfach, globaler Cache, Framework-agnostisch
   - Con: Schwerer zu mocken (aber wir haben Lösung)

### Entscheidung
✅ **Singleton Export**

```typescript
class ClubDataLoader { /* ... */ }
export const clubDataLoader = new ClubDataLoader();
```

### Begründung
- Cache wird über alle Components geteilt
- Chunks nur 1x laden
- Einfaches Mocking mit Vitest möglich
- Performance-Vorteil

---

## TDR-003: kurzname als optional
**Datum:** 23.10.2025  
**Status:** ✅ Implementiert

### Context
DBB-Daten sind inkonsistent - manche Vereine haben keinen `kurzname`.

### Optionen
1. **kurzname pflicht + Fallback beim Parse**
   - Pro: Type-Safety
   - Con: Lügt über echte Datenstruktur

2. **kurzname optional + Nullish Coalescing** ✅
   - Pro: Ehrlich zu Daten, Type-Safe
   - Con: Etwas mehr Code

### Entscheidung
✅ **Optional + Fallback**

```typescript
interface ClubData {
  verein: {
    kurzname?: string; // Optional!
  };
}

kurzname: clubData.verein.kurzname ?? clubData.verein.name
```

### Begründung
- Ehrlich zur Datenstruktur
- Type-Safe
- Kein Crash bei fehlendem kurzname

---

## TDR-004: Integration-Tests statt Mocked-Unit-Tests für ClubDataLoader
**Datum:** 23.10.2025  
**Status:** ✅ Implementiert

### Context
Sollen wir JSON-Imports für ClubDataLoader-Tests mocken oder echte Daten verwenden?

### Optionen
1. **Mocked JSON-Imports**
   - Pro: Schneller, kontrolliert
   - Con: Mocking dynamischer Imports ist komplex in Vitest

2. **Echte Chunk-Daten (Integration-Test)** ✅
   - Pro: Testet echte Datenstruktur, robuster
   - Con: Langsamer, abhängig von Daten

### Entscheidung
✅ **Integration-Tests mit echten Daten**

```typescript
// Keine Mocks, echte Chunks werden geladen
const clubs = await clubDataLoader.loadAllClubs();
expect(clubs.length).toBeGreaterThan(0);
```

### Begründung
- Vitest kann dynamische Imports schwer mocken
- Integration-Tests finden mehr echte Bugs
- Performance ist akzeptabel (~200ms)
- Datenintegrität wird mitgetestet

---

## TDR-005: HappyDOM statt JSDOM
**Datum:** 23.10.2025  
**Status:** ✅ Implementiert

### Context
Welche DOM-Umgebung für Component-Tests?

### Optionen
1. **JSDOM**
   - Pro: Standard, viel genutzt
   - Con: Langsamer, größer

2. **HappyDOM** ✅
   - Pro: 2-3x schneller, kleiner
   - Con: Weniger Features (aber reicht für uns)

### Entscheidung
✅ **HappyDOM**

```typescript
// vitest.config.ts
test: {
  environment: 'happy-dom'
}
```

### Begründung
- Deutlich schnellere Tests
- Alle Features die wir brauchen vorhanden
- Weniger Dependencies

---

## TDR-006: Zustand statt Redux
**Datum:** Vor Projekt-Start  
**Status:** ✅ Implementiert

### Context
State Management für die App.

### Optionen
1. **Redux Toolkit**
   - Pro: Bewährt, DevTools
   - Con: Boilerplate, Overhead

2. **Zustand** ✅
   - Pro: Minimal, TypeScript-First
   - Con: Weniger Middleware

### Entscheidung
✅ **Zustand**

```typescript
export const useSimpleOnboardingStore = create<Store>((set) => ({
  currentStep: 'welcome',
  setStep: (step) => set({ currentStep: step })
}));
```

### Begründung
- Minimal Boilerplate
- Perfekt für kleine/mittlere Apps
- TypeScript-Native
- Keine Context-Provider nötig

---

## TDR-007: Dexie statt IndexedDB API
**Datum:** Vor Projekt-Start  
**Status:** ✅ Implementiert

### Context
Wie greifen wir auf IndexedDB zu?

### Optionen
1. **Native IndexedDB API**
   - Pro: Keine Dependencies
   - Con: Callback-Hell, komplex

2. **Dexie.js** ✅
   - Pro: Promise-basiert, TypeScript, Query-Builder
   - Con: Extra Dependency

### Entscheidung
✅ **Dexie.js**

```typescript
import Dexie from 'dexie';

class AppDatabase extends Dexie {
  vereine!: Dexie.Table<Verein, string>;
  teams!: Dexie.Table<Team, string>;
}
```

### Begründung
- Promise-basiert (kein Callback-Hell)
- TypeScript-Support
- Query-Builder
- Best Practice für IndexedDB

---

## TDR-008: TDD ab jetzt mandatory
**Datum:** 23.10.2025  
**Status:** ✅ Beschlossen

### Context
Wie entwickeln wir neue Features?

### Entscheidung
✅ **Strikte TDD-Praxis**

**Für alle neuen Features:**
1. RED: Test schreiben
2. GREEN: Minimal Code
3. REFACTOR: Optimieren

**Legacy Code:**
- Mit Tests absichern (nachträglich ok)
- Dann TDD für Änderungen

### Begründung
- Höhere Code-Qualität
- Weniger Bugs
- Bessere Architektur
- Dokumentation durch Tests

---

## TDR-009: Tailwind statt CSS Modules
**Datum:** Vor Projekt-Start  
**Status:** ✅ Implementiert

### Context
Styling-Strategie.

### Entscheidung
✅ **Tailwind CSS**

```tsx
<button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
  Weiter
</button>
```

### Begründung
- Utility-First = schneller
- Keine CSS-Dateien zu managen
- Tree-Shaking = kleine Bundles
- Responsive Design einfach

---

## TDR-010: Vite statt Webpack/CRA
**Datum:** Vor Projekt-Start  
**Status:** ✅ Implementiert

### Context
Build-Tool für React-App.

### Entscheidung
✅ **Vite + SWC**

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()]
});
```

### Begründung
- 10-100x schneller als Webpack
- Native ES Modules
- HMR in <50ms
- SWC = schnellster TS-Compiler

---

## TDR-011: PWA mit Service Worker
**Datum:** Vor Projekt-Start  
**Status:** ✅ Implementiert

### Context
App soll offline funktionieren.

### Entscheidung
✅ **vite-plugin-pwa (Workbox)**

```typescript
VitePWA({
  registerType: 'autoUpdate',
  workbox: {
    runtimeCaching: [/* ... */]
  }
})
```

### Begründung
- Offline-First Ansatz
- Service Worker automatisch generiert
- Cache-Strategien konfigurierbar
- Auto-Update

---

## TDR-012: Keine User-Accounts, Lokale Datenhaltung
**Datum:** Projekt-Anfang  
**Status:** ✅ Beschlossen

### Context
Brauchen wir einen Backend-Server mit User-Management?

### Entscheidung
✅ **Dezentrale Datenhaltung ohne Accounts**

**Architektur:**
- Alle Daten lokal in IndexedDB
- Kein User-Login
- Kein Backend (außer DBB-API)
- Optional: P2P-Sync später

### Begründung
- **DSGVO-konform:** Keine zentrale Datenspeicherung
- **Privacy:** Daten bleiben beim User
- **Offline-First:** Funktioniert ohne Internet
- **Einfacher:** Kein Auth-Flow, kein Server
- **Schneller:** Keine API-Latency

### Trade-offs
- ❌ Kein Multi-Device Sync (vorerst)
- ❌ Keine Team-Kollaboration (vorerst)
- ✅ Dafür: Maximale Privacy & Offline-Fähigkeit

---

## TDR-013: Migration zu TypeScript 7.0 (baseUrl entfernt)
**Datum:** 23.10.2025  
**Status:** ✅ Implementiert

### Context
TypeScript 7.0 hat `baseUrl` als deprecated markiert und entfernt. Unsere Konfiguration nutzte `baseUrl: "."` für Path-Aliases.

**Fehler:**
```
Die Option "baseUrl" ist veraltet und funktioniert in TypeScript 7.0 nicht mehr.
```

### Problem
```json
// Alt (funktioniert nicht mehr)
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@shared/*": ["./src/shared/*"]
    }
  }
}
```

### Lösung
✅ **baseUrl entfernen, Paths bleiben**

```json
// Neu (TypeScript 7.0 kompatibel)
{
  "compilerOptions": {
    "paths": {
      "@shared/*": ["./src/shared/*"],
      "@domains/*": ["./src/domains/*"],
      "@/*": ["./src/*"]
    }
  }
}
```

### Entscheidung
✅ **baseUrl aus tsconfig.json entfernen**

Paths funktionieren jetzt **relativ zum tsconfig.json** ohne baseUrl.

### Begründung
- TypeScript 7.0 Breaking Change
- Neue Syntax ist einfacher
- Paths sind jetzt explizit relativ
- Kompatibilität mit modernem TypeScript
- Vite/Vitest nutzen weiterhin die Paths

### Betroffene Dateien
1. ✅ `tsconfig.json` - baseUrl entfernt
2. ✅ `vite.config.ts` - nutzt weiterhin resolve.alias (unverändert)
3. ✅ `vitest.config.ts` - nutzt weiterhin resolve.alias (unverändert)

### Migration
```bash
# Einfach baseUrl-Zeile löschen, fertig!
# Paths bleiben identisch
```

---

## TDR-016: Input-Types Zentralisierung
**Datum:** 24. Oktober 2025  
**Status:** ✅ Implementiert

### Context
Services hatten lokale `CreateVereinInput` und `CreateTeamInput` Interfaces, die:
- Inkonsistent waren (fehlende Required-Fields)
- Duplikat-Code erzeugten
- TypeScript-Errors verursachten
- Schwer zu warten waren

### Optionen
1. **Lokale Interfaces beibehalten**
   - Pro: Jeder Service unabhängig
   - Con: Inkonsistenz, Duplikate

2. **Zentralisierung in shared/types** ✅
   - Pro: Single Source of Truth
   - Pro: Consistency
   - Pro: Type-Safety
   - Con: Mehr Coupling

### Entscheidung
✅ **Input-Types in `src/shared/types/index.ts` zentralisieren**

```typescript
// src/shared/types/index.ts
export interface CreateVereinInput {
  name: string;
  ort: string;  // REQUIRED!
  kurzname?: string;
  ist_eigener_verein?: boolean;
  // ...
}

export interface CreateTeamInput {
  verein_id: UUID;
  name: string;
  altersklasse: Altersklasse;
  saison: string;
  trainer: string;  // REQUIRED!
  // ...
}
```

### Begündung
- **Type-Safety:** Required-Fields werden durchgesetzt
- **Consistency:** Eine Definition für alle Services
- **Maintainability:** Änderungen nur an einer Stelle
- **Documentation:** Interface = Dokumentation

### Betroffene Dateien
- `shared/types/index.ts` - Input-Types hinzugefügt
- `domains/verein/services/VereinService.ts` - Import angepasst
- `domains/team/services/TeamService.ts` - Import angepasst
- `domains/bbb-api/services/BBBSyncService.ts` - `ort: ''` hinzugefügt
- `domains/onboarding/onboarding-simple.store.ts` - Required-Fields hinzugefügt

---

## TDR-017: CORS-Proxy Strategy
**Datum:** 24. Oktober 2025  
**Status:** ✅ Implementiert

### Context
API-Calls zu `basketball-bund.net` schlugen in Preview/Production fehl:
- Direkter Fetch → CORS blocked
- CORS-Proxies funktionierten
- Code versuchte trotzdem erst direkten Fetch

### Problem
```typescript
// ❌ Alte Logik
if (import.meta.env.DEV) {
  console.log('Using proxy');
} else {
  // Production: Versuche direkt ← CORS-Fail!
  await fetch(url);
}
```

**Warum schlug das fehl?**
- Preview = Production-Build → `DEV = false`
- Direkter Fetch → CORS-Error
- User sah fehlgeschlagene Requests

### Optionen
1. **DEV-Check beibehalten**
   - Pro: Schneller in Production (theoretisch)
   - Con: Funktioniert nicht (CORS!)

2. **CORS-Proxy IMMER nutzen** ✅
   - Pro: Funktioniert überall
   - Pro: Keine Environment-Checks
   - Pro: Predictable Behavior
   - Con: Langsamer (Proxy-Overhead)

### Entscheidung
✅ **CORS-Proxy IMMER nutzen (außer localhost)**

```typescript
private async fetchWithFallback(url: string, options?: RequestInit): Promise<Response> {
  // Skip nur für localhost
  if (url.includes('localhost') || url.includes('127.0.0.1')) {
    return await fetch(url, options);
  }

  console.log('🔄 Using CORS proxy for:', url);

  // DIREKT zu CORS-Proxies, kein direkter Fetch-Versuch
  for (const proxy of this.CORS_PROXIES) {
    try {
      const proxyUrl = proxy + encodeURIComponent(url);
      const response = await fetch(proxyUrl, { 
        ...options, 
        signal: AbortSignal.timeout(8000) 
      });
      
      if (response.ok) {
        console.log('✅ CORS proxy success:', proxy);
        return response;
      }
    } catch (error) {
      console.warn(`Proxy ${proxy} failed:`, error);
    }
  }
  
  throw new Error('All CORS proxies failed');
}
```

### Begündung
- **Works Everywhere:** Dev, Preview, Production
- **No Environment Magic:** Keine DEV-Checks
- **Predictable:** Gleiches Verhalten überall
- **Resilient:** Multiple Proxies als Fallback

### Betroffene Dateien
- `domains/bbb-api/services/BBBApiService.ts`

---

## TDR-018: Mock-Daten Strategy
**Datum:** 24. Oktober 2025  
**Status:** ✅ Implementiert

### Context
Production zeigte Fake-Tabelle statt echtem Status:
- Liga-Sync fehlgeschlagen
- DB leer
- UI zeigte Mock-Daten
- E2E-Tests nutzlos (testeten nicht echte API)

### Problem
```typescript
// ❌ Alte Logik
async loadTabelleForTeam(teamId: string) {
  const dbData = await loadFromDB();
  
  if (dbData.length === 0) {
    return this.getMockTabellenDaten(); // ← Problem!
  }
}
```

**Warum ist das falsch?**
- Mock-Daten maskieren Probleme
- E2E-Tests mit Mocks = nutzlos
- User sieht Fake-Daten statt echtem Status

### Optionen
1. **Mock-Daten als Fallback behalten**
   - Pro: UI sieht immer gut aus
   - Con: Maskiert Probleme
   - Con: E2E-Tests nutzlos

2. **Mock-Daten nur in Tests** ✅
   - Pro: Production zeigt echten Status
   - Pro: E2E testet echte API
   - Pro: User sieht was Sache ist
   - Con: Mehr Empty-States

### Entscheidung
✅ **Mock-Daten NUR in Unit/Integration-Tests, nicht in Production**

```typescript
// ✅ Production - Return LEER
async loadTabelleForTeam(teamId: string): Promise<TabellenEintrag[]> {
  // Priority 1: Berechne aus Spielen
  const calculated = await this.berechneTabelleAusSpiele(ligaId);
  if (calculated.length > 0) return calculated;
  
  // Priority 2: Lade aus DB
  const dbData = await this.loadTabelleFromDatabase(ligaId);
  if (dbData.length > 0) return dbData;
  
  // Priority 3: LEER - UI zeigt Status
  console.warn('⚠️ Keine Tabellendaten verfügbar');
  return [];
}

// ✅ Tests - Public Mock-Funktion
getMockTabellenDatenForTests(): TabellenEintrag[] {
  // ⚠️ NUR in Tests verwenden!
  return [...];
}
```

**UI zeigt jetzt Status:**
```tsx
{tabelle.length === 0 && team.liga_id && (
  <div className="alert-warning">
    <h3>📦 Keine Tabellendaten verfügbar</h3>
    <p>Synchronisiere die Liga-Daten, um die aktuelle Tabelle zu laden.</p>
    <button onClick={handleSync}>Jetzt synchronisieren</button>
  </div>
)}
```

### Begündung
- **Honest UI:** Zeigt echten Status
- **E2E-Tests:** Testen echte API-Integration
- **Better UX:** User weiß was zu tun ist
- **Debugging:** Probleme werden sichtbar

### Betroffene Dateien
- `domains/spielplan/services/TabellenService.ts` - Mock-Fallback entfernt
- `domains/dashboard/Dashboard.tsx` - Status-Banner hinzugefügt

---

## TDR-019: Liga-Sync Error-Handling
**Datum:** 24. Oktober 2025  
**Status:** ✅ Implementiert

### Context
Liga-Sync im Onboarding:
- Lief im Hintergrund (Fire-and-Forget)
- Fehler wurden verschluckt
- Keine DB-Daten trotz "Onboarding complete"
- User hatte keine Debug-Möglichkeit

### Problem
```typescript
// ❌ Fire-and-Forget
bbbSyncService.syncLiga(ligaId, { skipMatchInfo: true })
  .then(() => console.log('✅ Success'))
  .catch((error) => {
    console.warn('⚠️ Failed:', error);
    // Fehler wird verschluckt! ❌
  });
```

### Optionen
1. **Fire-and-Forget beibehalten**
   - Pro: Onboarding blockiert nicht
   - Con: Fehler unsichtbar
   - Con: Kein Debugging möglich

2. **Blockierendes await mit Logging** ✅
   - Pro: Fehler werden sichtbar
   - Pro: Stats werden geloggt
   - Pro: User-Feedback möglich
   - Con: Onboarding dauert länger

### Entscheidung
✅ **Blockierendes await + Comprehensive Logging**

```typescript
try {
  const ligaIdMatch = firstTeam.liga_id.match(/\d+/);
  if (!ligaIdMatch) {
    console.error('❌ Konnte Liga-ID nicht parsen:', firstTeam.liga_id);
  } else {
    const ligaId = parseInt(ligaIdMatch[0], 10);
    console.log('🎯 Extrahierte Liga-ID:', ligaId);
    
    // Blockierendes await
    try {
      await bbbSyncService.syncLiga(ligaId, { skipMatchInfo: true });
      console.log('✅ Liga-Sync erfolgreich abgeschlossen');
      
      // Zeige Stats
      const spieleCount = await db.spiele.count();
      const tabelleCount = await db.liga_tabellen.count();
      console.log('📈 Sync-Stats:', { spieleCount, tabelleCount });
    } catch (syncError) {
      console.error('❌ Liga-Sync fehlgeschlagen:', syncError);
      console.warn('⚠️ Liga-Daten können später über Sync-Button nachgeladen werden');
    }
  }
} catch (error) {
  console.error('❌ Liga-Sync Setup Fehler:', error);
}
```

### Begündung
- **Visibility:** Fehler werden geloggt
- **Debugging:** Stats zeigen was geklappt hat
- **User-Feedback:** Hinweis auf Sync-Button
- **Not Blocking:** Onboarding wird trotzdem abgeschlossen

### Betroffene Dateien
- `domains/onboarding/onboarding-simple.store.ts`

---

## Template für neue TDRs

```markdown
## TDR-XXX: [Titel]
**Datum:** [Datum]  
**Status:** 🔄 In Diskussion / ✅ Implementiert / ❌ Verworfen

### Context
[Beschreibe das Problem/die Situation]

### Optionen
1. **Option A**
   - Pro: ...
   - Con: ...

2. **Option B** ✅
   - Pro: ...
   - Con: ...

### Entscheidung
✅ **[Gewählte Option]**

[Code-Beispiel]

### Begründung
- Punkt 1
- Punkt 2
- Punkt 3
```

---

**Hinweis:** Bei jeder wichtigen technischen Entscheidung:
1. TDR schreiben
2. Im Team diskutieren
3. Entscheidung dokumentieren
4. Code implementieren

So gehen Entscheidungen nicht verloren! 🎯
