# TypeScript, CORS & Mock-Daten - Bug Fixes

**Datum:** 2025-10-24  
**Autor:** AI-Assisted Development  
**Status:** ✅ Behoben  
**Betroffene Dateien:**
- `src/shared/types/index.ts`
- `src/domains/verein/services/VereinService.ts`
- `src/domains/team/services/TeamService.ts`
- `src/domains/bbb-api/services/BBBSyncService.ts`
- `src/domains/bbb-api/services/BBBApiService.ts`
- `src/domains/onboarding/onboarding-simple.store.ts`
- `src/domains/onboarding/components/SimplifiedVereinStep.tsx`
- `src/shared/services/ClubDataLoader.ts`
- `src/domains/spielplan/services/TabellenService.ts`
- `src/domains/dashboard/Dashboard.tsx`

---

## Zusammenfassung

Serie von kritischen Fixes für Production-Readiness:
1. **TypeScript-Fehler** - Fehlende Required-Fields bei Input-Types
2. **CORS-Problem** - Direkter API-Fetch schlug in Preview/Production fehl
3. **Mock-Daten-Maskierung** - E2E-Tests und Production zeigten Fake-Daten
4. **Liga-Sync Silent Failures** - Fehler wurden verschluckt ohne User-Feedback

---

## 🔴 Fehler #1: TypeScript Build-Fehler - Missing Input Type

### Problem
```
error TS2304: Cannot find name 'DBBSpielplanEintrag'.
```

### Root Cause
`BBBApiService.ts` nutzte den Type `DBBSpielplanEintrag`, hatte ihn aber nicht importiert.

### Lösung
```typescript
// ❌ Vorher
import type {
  WamFilterRequest,
  // ... andere Imports
  DBBSpielplanResponse,
  // DBBSpielplanEintrag fehlte!
} from '../../../shared/types';

// ✅ Nachher
import type {
  WamFilterRequest,
  // ... andere Imports
  DBBSpielplanResponse,
  DBBSpielplanEintrag,  // ← Hinzugefügt
} from '../../../shared/types';
```

### Prevention
- **Pre-commit Hook:** `tsc --noEmit` vor jedem Commit ausführen
- **CI/CD:** Build-Step sollte TypeScript-Errors catchen
- **IDE:** Nutze TypeScript Language Server für Real-Time-Feedback

---

## 🔴 Fehler #2: Missing Required Fields in Input Types

### Problem
Services erstellten Entities ohne Required-Fields:
- `Verein` braucht `ort: string` (REQUIRED)
- `Team` braucht `trainer: string` (REQUIRED)

### Root Cause
Input-Types waren dezentral definiert und inkonsistent. Services hatten eigene lokale Interfaces ohne alle Required-Fields.

### Lösung

**1. Input-Types zentralisiert:**
```typescript
// ✅ src/shared/types/index.ts
export interface CreateVereinInput {
  name: string;
  ort: string;  // REQUIRED
  kurzname?: string;
  ist_eigener_verein?: boolean;
  // ... weitere optionale Fields
}

export interface CreateTeamInput {
  verein_id: UUID;
  name: string;
  altersklasse: Altersklasse;
  saison: string;
  trainer: string;  // REQUIRED
  // ... weitere optionale Fields
}
```

**2. Services angepasst:**
```typescript
// ❌ Vorher - BBBSyncService
verein = {
  verein_id: crypto.randomUUID(),
  name: data.clubName,
  // ort fehlt! ❌
  ist_eigener_verein: false,
  created_at: new Date(),
};

// ✅ Nachher
verein = {
  verein_id: crypto.randomUUID(),
  name: data.clubName,
  ort: '', // Unknown for API-synced clubs
  ist_eigener_verein: false,
  created_at: new Date(),
};
```

**3. Optional Chaining für optionale Properties:**
```typescript
// ❌ Vorher
verein.kurzname.toLowerCase()  // Crash wenn undefined!

// ✅ Nachher
verein.kurzname?.toLowerCase()  // Safe
```

### Prevention
- **Strict TypeScript:** `strict: true` in tsconfig.json
- **Centralized Types:** Alle Input-Types in `shared/types/`
- **Type Guards:** Validierung vor DB-Insert
- **Tests:** Unit-Tests sollten Missing-Fields catchen

---

## 🔴 Fehler #3: CORS-Proxy nicht in Preview/Production

### Problem
In Preview (Vercel/Netlify) schlugen API-Requests fehl:
- Direkte Requests zu `basketball-bund.net` → CORS blocked (rot im Network-Tab)
- CORS-Proxies funktionierten (grün)
- Aber Code versuchte trotzdem erst direkten Fetch

### Root Cause
Die Logik war **invertiert**:
```typescript
// ❌ Vorher - FALSCH!
if (import.meta.env.DEV) {
  console.log('Using CORS proxy immediately');
} else {
  // Production: Versuche direkt ← Das schlug fehl!
  try { await fetch(url) }
}
```

**Problem:** Preview ist PRODUCTION-Build → `DEV = false` → direkter Fetch → CORS-Fehler!

### Lösung
```typescript
// ✅ Nachher - CORS-Proxy IMMER nutzen
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

### Prevention
- **Test in Production-like Environment:** Preview-Deployments testen
- **Keine DEV-Checks für External APIs:** CORS-Probleme existieren überall
- **Monitoring:** Log erfolgreiche/fehlgeschlagene Proxies
- **Fallback-Chain:** Multiple CORS-Proxies als Backup

---

## 🔴 Fehler #4: Mock-Daten maskieren Production-Probleme

### Problem
**Beobachtung:**
- Preview zeigt Tabelle mit 7 Teams
- IndexedDB ist leer (keine Spiele, keine Tabelle)
- E2E-Tests sind grün
- **Aber:** Es sind Mock-Daten, keine echten API-Daten!

**Impact:**
- User sieht Fake-Daten statt echtem Status
- E2E-Tests nutzlos (testen nicht die API-Integration)
- Liga-Sync-Fehler werden nicht bemerkt

### Root Cause
```typescript
// ❌ TabellenService.loadTabelleForTeam()
async loadTabelleForTeam(teamId: string): Promise<TabellenEintrag[]> {
  // 1. Versuche aus DB zu laden
  if (dbTabelle.length === 0) {
    // 2. Fallback zu Mock-Daten ← Problem!
    return this.getMockTabellenDaten();
  }
}
```

**Warum ist das falsch?**
- Mock-Daten gehören NICHT in Production-Code als Fallback
- E2E-Tests mit Mocks = nutzlos
- User-Feedback fehlt: "Warum keine echten Daten?"

### Lösung

**1. Mock-Daten aus Production-Fallback entfernt:**
```typescript
// ✅ Nachher
async loadTabelleForTeam(teamId: string): Promise<TabellenEintrag[]> {
  // ... Versuche DB-Laden
  
  if (dbTabelle.length === 0) {
    console.warn('⚠️ Keine Tabellendaten verfügbar');
    return []; // Leer, nicht Mocks!
  }
}
```

**2. Mock-Daten für Tests isoliert:**
```typescript
// ❌ Vorher
private getMockTabellenDaten() { ... }

// ✅ Nachher - Public für Tests
getMockTabellenDatenForTests() { 
  // ⚠️ NUR in Tests verwenden!
  return [...];
}
```

**3. UI-Feedback verbessert:**
```tsx
// ✅ Dashboard zeigt jetzt Status
{tabelle.length === 0 && team.liga_id && (
  <div className="alert-warning">
    <h3>📦 Keine Tabellendaten verfügbar</h3>
    <p>Synchronisiere die Liga-Daten, um die aktuelle Tabelle zu laden.</p>
    <button onClick={handleSync}>
      Jetzt synchronisieren
    </button>
  </div>
)}
```

### Prevention
- **Mock-Daten NUR in Tests:** Unit/Integration, nicht E2E
- **E2E mit echter API:** Mindestens 1 Test mit Real-API-Call
- **Status-Feedback:** UI muss Empty-States zeigen
- **Smoke Tests:** Nach Deployment echte API-Calls testen

---

## 🔴 Fehler #5: Liga-Sync Silent Failures

### Problem
Liga-Sync lief beim Onboarding, aber:
- Fehler wurden verschluckt (Fire-and-Forget Promise)
- Keine DB-Daten trotz "Onboarding complete"
- User hatte keine Möglichkeit, das zu debuggen

```typescript
// ❌ Vorher - Fire-and-Forget
bbbSyncService.syncLiga(ligaId, { skipMatchInfo: true })
  .then(() => console.log('✅ Success'))
  .catch((error) => {
    console.warn('⚠️ Failed:', error);
    // Fehler wird verschluckt! ❌
  });
```

### Root Cause
- **Non-blocking Async:** Promise wurde nicht awaited
- **Error Swallowing:** catch() ohne User-Feedback
- **Missing Logging:** Keine Details über Sync-Status

### Lösung
```typescript
// ✅ Nachher - Blockierend mit Logging
try {
  await bbbSyncService.syncLiga(ligaId, { skipMatchInfo: true });
  console.log('✅ Liga-Sync erfolgreich abgeschlossen');
  
  // Zeige Stats
  const spieleCount = await db.spiele.count();
  const tabelleCount = await db.liga_tabellen.count();
  console.log('📈 Sync-Stats:', { spieleCount, tabelleCount });
} catch (syncError) {
  console.error('❌ Liga-Sync fehlgeschlagen:', syncError);
  // User-Hinweis, aber blockiere Onboarding nicht
  console.warn('⚠️ Liga-Daten können später über Sync-Button nachgeladen werden');
}
```

**Verbesserungen:**
- ✅ `await` statt Fire-and-Forget
- ✅ Detailliertes Error-Logging
- ✅ Sync-Stats nach Erfolg
- ✅ User-Hinweis bei Fehler (Console + UI-Banner)

### Prevention
- **Keine Fire-and-Forget bei kritischen Operations**
- **Comprehensive Logging:** Success + Failure + Stats
- **User-Feedback:** UI muss Status anzeigen (Spinner, Error-Banner)
- **Retry-Mechanismus:** Bei temporären Fehlern (Rate-Limits, Timeouts)

---

## 📊 Betroffene Flows & Sequenzen

### Flow 1: Onboarding → Liga-Sync
```
┌──────────────────────────────────────────────────────────┐
│  Onboarding Store                                        │
│  ─────────────────────────────────────────────────────  │
│  1. User wählt Team mit liga_id                         │
│  2. Team wird in DB erstellt                            │
│  3. Liga-Sync wird gestartet (await!)                   │
│     ├─ Success: Stats loggen                            │
│     └─ Error: Loggen + User-Hinweis                     │
│  4. Onboarding complete (immer, auch bei Sync-Error)    │
└──────────────────────────────────────────────────────────┘
```

**Änderungen:**
- ❌ Vorher: Fire-and-Forget (Fehler verschluckt)
- ✅ Nachher: Blockierendes await mit Error-Handling

### Flow 2: Dashboard → Tabelle laden
```
┌──────────────────────────────────────────────────────────┐
│  TabellenService.loadTabelleForTeam()                   │
│  ─────────────────────────────────────────────────────  │
│  Priority 1: Berechne aus Spielergebnissen in DB       │
│     ├─ Spiele vorhanden → Tabelle berechnen ✅          │
│     └─ Keine Spiele → weiter                            │
│  Priority 2: Lade aus liga_tabellen                     │
│     ├─ Tabelle vorhanden → Return ✅                     │
│     └─ Keine Tabelle → weiter                           │
│  Priority 3: Return LEER                                │
│     └─ UI zeigt: "Keine Daten + Sync-Button"           │
└──────────────────────────────────────────────────────────┘
```

**Änderungen:**
- ❌ Vorher: Priority 3 = Mock-Daten
- ✅ Nachher: Priority 3 = Leer (UI zeigt Status)

### Flow 3: API-Fetch mit CORS-Proxy
```
┌──────────────────────────────────────────────────────────┐
│  BBBApiService.fetchWithFallback()                      │
│  ─────────────────────────────────────────────────────  │
│  1. Check: ist localhost?                               │
│     └─ Ja: Direkter Fetch (kein CORS-Problem)          │
│  2. Nein: CORS-Proxy nutzen (IMMER)                     │
│     ├─ Proxy 1: corsproxy.io → versuchen               │
│     ├─ Proxy 2: cors.sh → fallback                     │
│     └─ ... weitere Proxies                              │
│  3. Alle fehlgeschlagen: Error werfen                   │
└──────────────────────────────────────────────────────────┘
```

**Änderungen:**
- ❌ Vorher: In Production direkte Requests (CORS-Fail)
- ✅ Nachher: IMMER CORS-Proxy (außer localhost)

---

## 📝 Lessons Learned

### 1. TypeScript Strict Mode ist nicht optional
**Problem:** Fehlende Required-Fields wurden erst zur Runtime entdeckt  
**Lösung:** `strict: true` + Pre-commit Hooks  
**Erkenntnis:** TypeScript-Errors sollten Build brechen, nicht warnen

### 2. DEV vs PREVIEW vs PRODUCTION
**Problem:** `import.meta.env.DEV` ist false in Preview → falsches Verhalten  
**Lösung:** Keine Environment-Checks für External-API-Calls  
**Erkenntnis:** Preview = Production-Build, nicht Dev-Build

### 3. Mock-Daten maskieren Probleme
**Problem:** E2E-Tests grün, aber API-Integration kaputt  
**Lösung:** Mock-Daten NUR in Unit/Integration-Tests  
**Erkenntnis:** E2E muss echte API-Calls testen

### 4. Silent Failures sind gefährlich
**Problem:** Liga-Sync schlug fehl, aber User sah nichts  
**Lösung:** Comprehensive Logging + User-Feedback  
**Erkenntnis:** Kritische Ops brauchen await + Error-Handling + UI-Feedback

### 5. Empty States sind Features
**Problem:** User sieht Fake-Daten statt echtem Status  
**Lösung:** UI zeigt "Keine Daten" + Handlungsaufforderung  
**Erkenntnis:** Leere Zustände sind Gelegenheiten für User-Guidance

---

## 🎯 Nächste Schritte

### Kurzfristig
- [x] TypeScript-Build-Fehler behoben
- [x] CORS-Proxy-Fixes deployed
- [x] Mock-Daten aus Production entfernt
- [x] Liga-Sync Error-Handling verbessert
- [ ] Preview-Deployment testen
- [ ] E2E-Tests mit echter API durchführen

### Mittelfristig
- [ ] Pre-commit Hook: `tsc --noEmit`
- [ ] CI/CD: TypeScript-Check als Blocker
- [ ] Monitoring: CORS-Proxy Success-Rates tracken
- [ ] Retry-Logik für Liga-Sync (Rate-Limits)

### Langfristig
- [ ] Verein-Refactoring: ClubDataLoader als Single Source of Truth
- [ ] API-Mock-Service für deterministische E2E-Tests
- [ ] Error-Tracking: Sentry/LogRocket Integration
- [ ] Performance-Monitoring: Sync-Dauer tracken

---

## 🔗 Verwandte Dokumentation

- **Technical Decisions:** [TECHNICAL-DECISIONS.md](../development/TECHNICAL-DECISIONS.md)
- **Project Status:** [PROJECT-STATUS.md](../development/PROJECT-STATUS.md)
- **Test Status:** [TEST-STATUS.md](../development/TEST-STATUS.md)

---

**Navigation:**
- [← Zurück zu Bug-Fixes](./README.md)
- [Development Docs](../development/)
