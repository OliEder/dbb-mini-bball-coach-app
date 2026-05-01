# BBB API Base-URL via Umgebungsvariable Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Die hardcodierte `https://api.benchboss.de` URL im `BBBApiService` durch eine Vite-Umgebungsvariable (`VITE_BBB_API_URL`) ersetzen, sodass lokal ein Vite-Proxy für CORS-freie Entwicklung genutzt wird und Production weiterhin direkt gegen `https://api.benchboss.de` arbeitet.

**Architecture:** Der `BBBApiService`-Constructor liest `import.meta.env.VITE_BBB_API_URL` als Fallback statt der hardcodierten URL. Lokal zeigt die Variable auf `/api` — Vite leitet `/api/*` per Proxy an `https://api.benchboss.de/*` weiter, damit CORS kein Problem ist. In Production (GitHub Pages Build) bleibt `VITE_BBB_API_URL` auf `https://api.benchboss.de`.

**Tech Stack:** Vite (proxy config), TypeScript (`import.meta.env`), `.env.development` / `.env.production`

---

## File Map

| File | Aktion | Verantwortlichkeit |
|---|---|---|
| `src/shared/services/BBBApiService.ts` | Modify (Zeile 60) | Liest `VITE_BBB_API_URL` statt hardcoded URL |
| `vite.config.ts` | Modify | Fügt `server.proxy` für `/api` → `https://api.benchboss.de` hinzu |
| `.env.development` | Create | `VITE_BBB_API_URL=/api` für lokale Entwicklung |
| `.env.production` | Create | `VITE_BBB_API_URL=https://api.benchboss.de` für Production-Build |
| `tests/unit/shared/services/BBBApiService.test.ts` | Modify | Ergänzt Test für Env-Variable-Fallback |

---

## Task 1: Test für Env-Variable-Fallback schreiben

**Files:**
- Modify: `tests/unit/shared/services/BBBApiService.test.ts`

- [ ] **Step 1: Failing test schreiben**

Füge in `BBBApiService.test.ts` eine neue `describe`-Block **nach** dem bestehenden `'CORS Proxy Handling'`-Block ein:

```typescript
describe('Base URL Configuration', () => {
  it('should use VITE_BBB_API_URL env variable when no config provided', async () => {
    // ARRANGE
    const originalEnv = (import.meta as any).env;
    (import.meta as any).env = { 
      ...originalEnv, 
      VITE_BBB_API_URL: 'https://custom.example.com' 
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: '0',
        data: {
          ligaData: { ligaId: 1, liganame: 'Test' },
          tabelle: { entries: [] }
        }
      })
    });

    const service = new BBBApiService();

    // ACT
    await service.getTabelle(1);

    // ASSERT
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('https://custom.example.com')
    );

    // CLEANUP
    (import.meta as any).env = originalEnv;
  });

  it('should fall back to https://api.benchboss.de when VITE_BBB_API_URL not set', async () => {
    // ARRANGE
    const originalEnv = (import.meta as any).env;
    (import.meta as any).env = { ...originalEnv, VITE_BBB_API_URL: undefined };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: '0',
        data: {
          ligaData: { ligaId: 1, liganame: 'Test' },
          tabelle: { entries: [] }
        }
      })
    });

    const service = new BBBApiService();

    // ACT
    await service.getTabelle(1);

    // ASSERT
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('https://api.benchboss.de')
    );

    // CLEANUP
    (import.meta as any).env = originalEnv;
  });
});
```

- [ ] **Step 2: Test ausführen — muss FAIL**

```bash
npx vitest run tests/unit/shared/services/BBBApiService.test.ts
```

Erwartetes Ergebnis: `FAIL` — `Base URL Configuration` Tests schlagen fehl, weil `BBBApiService` noch `import.meta.env` nicht liest.

---

## Task 2: BBBApiService auf VITE_BBB_API_URL umstellen

**Files:**
- Modify: `src/shared/services/BBBApiService.ts:59-67`

- [ ] **Step 1: Constructor anpassen**

Ersetze in `BBBApiService.ts` Zeile 59–67:

```typescript
// VORHER:
constructor(config?: BBBApiConfig) {
  this.BASE_URL = config?.baseUrl || 'https://api.benchboss.de';
  this.testMode = config?.testMode || false;
  
  if (this.testMode) {
    console.log('🧪 BBBApiService in TEST MODE - CORS fallback disabled');
    console.log('🧪 Base URL:', this.BASE_URL);
  }
}

// NACHHER:
constructor(config?: BBBApiConfig) {
  this.BASE_URL = config?.baseUrl 
    ?? import.meta.env.VITE_BBB_API_URL 
    ?? 'https://api.benchboss.de';
  this.testMode = config?.testMode ?? false;
  
  if (this.testMode) {
    console.log('🧪 BBBApiService in TEST MODE - CORS fallback disabled');
    console.log('🧪 Base URL:', this.BASE_URL);
  }
}
```

- [ ] **Step 2: Tests ausführen — müssen PASS**

```bash
npx vitest run tests/unit/shared/services/BBBApiService.test.ts
```

Erwartetes Ergebnis: Alle Tests `PASS` (inkl. neue `Base URL Configuration` Tests).

- [ ] **Step 3: Commit**

```bash
git add src/shared/services/BBBApiService.ts tests/unit/shared/services/BBBApiService.test.ts
git commit -m "feat: read BBB API base URL from VITE_BBB_API_URL env variable"
```

---

## Task 3: .env-Dateien anlegen

**Files:**
- Create: `.env.development`
- Create: `.env.production`

- [ ] **Step 1: `.env.development` anlegen**

```
# Lokale Entwicklung: Vite-Proxy übernimmt den Request → kein CORS-Problem
VITE_BBB_API_URL=/api
```

- [ ] **Step 2: `.env.production` anlegen**

```
# Production (GitHub Pages): direkt gegen api.benchboss.de
VITE_BBB_API_URL=https://api.benchboss.de
```

- [ ] **Step 3: `.gitignore` prüfen**

Sicherstellen, dass `.env.development` und `.env.production` **nicht** in `.gitignore` ausgeschlossen sind (diese Dateien enthalten keine Secrets und sollen versioniert werden).

```bash
grep "\.env" .gitignore
```

Falls dort ein generisches `.env*` steht: Ausnahmen eintragen:
```
.env*.local
!.env.development
!.env.production
```

- [ ] **Step 4: Commit**

```bash
git add .env.development .env.production .gitignore
git commit -m "feat: add env files for BBB API URL (dev=proxy, prod=direct)"
```

---

## Task 4: Vite-Proxy für lokale Entwicklung einrichten

**Files:**
- Modify: `vite.config.ts`

- [ ] **Step 1: `server.proxy` hinzufügen**

In `vite.config.ts`, innerhalb von `return { ... }` nach dem `base`-Feld einfügen:

```typescript
return {
  base,
  server: {
    proxy: {
      '/api': {
        target: 'https://api.benchboss.de',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  plugins: [
    // ... bestehende plugins bleiben unverändert
  ],
  // ... rest bleibt unverändert
};
```

- [ ] **Step 2: Dev-Server neu starten und manuell testen**

```bash
npm run dev
```

Im Browser `http://localhost:5173` öffnen — in der DevTools Console sollten **keine** `Failed to load resource: Es wurde kein Server mit dem angegebenen Hostnamen gefunden`-Fehler mehr für `api.benchboss.de` erscheinen.

- [ ] **Step 3: Type-Check**

```bash
npx tsc --noEmit
```

Erwartetes Ergebnis: Keine Fehler.

- [ ] **Step 4: Alle Tests ausführen**

```bash
npx vitest run
```

Erwartetes Ergebnis: `319 passed` (Pact-Test weiterhin bekannter Library-Bug, zählt nicht).

- [ ] **Step 5: Commit**

```bash
git add vite.config.ts
git commit -m "feat: add Vite proxy /api -> api.benchboss.de for local dev"
```

---

## Self-Review

**Spec coverage:**
- ✅ Env-Variable `VITE_BBB_API_URL` eingeführt (Task 2)
- ✅ Lokal: `/api` → Proxy → `api.benchboss.de` (Tasks 3+4)
- ✅ Production: direkte URL via `.env.production` (Task 3)
- ✅ Tests für neues Verhalten (Task 1)
- ✅ Bestehende Tests bleiben grün (Task 2 Step 2)
- ✅ `config?.baseUrl` Override für PACT-Tests bleibt erhalten (höchste Priorität in `??`-Chain)

**Placeholder scan:** Keine TBDs oder offenen Punkte.

**Type consistency:** `BBBApiConfig.baseUrl?: string` unverändert. `import.meta.env.VITE_BBB_API_URL` ist `string | undefined` — passt zur `??`-Chain.
