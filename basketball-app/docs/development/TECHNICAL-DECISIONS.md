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
