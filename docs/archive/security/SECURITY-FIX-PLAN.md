# 🚨 Security Fix - Ausführungsplan

## ✅ Was wurde geändert (package.json):

```diff
- "happy-dom": "^15.8.3"     → "^15.11.8"   (CRITICAL FIX)
- "vite": "^5.4.10"           → "^6.0.7"     (MODERATE FIX + MAJOR)
- "vitest": "^2.1.4"          → "^2.1.8"     (Compatibility)
- "@vitest/ui": "^2.1.4"      → "^2.1.8"     (Compatibility)
- "vite-plugin-pwa": "^0.20.5" → "^0.21.1"   (Compatibility)
```

## 🚀 Nächste Schritte

### 1. Installation ausführen

```bash
cd basketball-app

# Cleanup (sicher gehen dass alles frisch ist)
rm -rf node_modules package-lock.json

# Neu installieren
npm install
```

**Erwartung:** Installation sollte durchlaufen ohne Fehler

---

### 2. Tests ausführen

```bash
# Unit Tests
npm test

# Build
npm run build

# Dev Server (kurz testen)
npm run dev
# → Browser: http://localhost:5173
# → App sollte laden
```

**Prüfpunkte:**
- ✅ Tests laufen durch
- ✅ Build erfolgreich
- ✅ Dev-Server startet
- ✅ App lädt im Browser

---

### 3. Mögliche Breaking Changes (Vite v5 → v6)

Falls Fehler auftreten, prüfe:

#### vite.config.ts

**Vite v6 Änderungen:**
- Environment API neu
- Plugin-API Updates
- Config-Struktur

**Falls Fehler:**
```typescript
// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  // Neue v6 Config hier
  // Siehe: https://vitejs.dev/guide/migration.html
});
```

#### Plugin-Kompatibilität

Falls `vite-plugin-pwa` Fehler wirft:
```bash
# Neueste PWA-Plugin-Version
npm install vite-plugin-pwa@latest --save-dev
```

---

### 4. Security Audit erneut prüfen

```bash
npm audit
```

**Erwartete Ausgabe:**
```
found 0 vulnerabilities  ✅
```

**Falls immer noch Vulnerabilities:**
- Prüfe welche
- `npm audit fix` (wenn safe)
- `npm audit fix --force` (nur wenn nötig)

---

### 5. E2E Tests (optional, aber empfohlen)

```bash
npm run test:e2e
```

**Falls Playwright-Browser fehlen:**
```bash
npm run playwright:install
npm run test:e2e
```

---

## 🔍 Troubleshooting

### Problem: Vite Config Fehler

**Fehlermeldung:** "Invalid config ..." oder "Plugin ... is not compatible"

**Lösung:**
1. Prüfe `vite.config.ts`
2. Vergleiche mit Vite v6 Docs: https://vitejs.dev/guide/
3. Update Plugin-Versionen

---

### Problem: Build Fehler

**Fehlermeldung:** "Build failed ..."

**Lösung:**
```bash
# Cleanup
rm -rf dist
rm -rf node_modules/.vite

# Neu bauen
npm run build
```

---

### Problem: Tests schlagen fehl

**Fehlermeldung:** "Test failed ..." oder "happy-dom ..."

**Lösung:**
1. Prüfe `vitest.config.ts` - Environment-Config
2. Falls nötig: `happy-dom` Config anpassen

---

### Problem: PWA funktioniert nicht

**Fehlermeldung:** "Service Worker ..."

**Lösung:**
```bash
# PWA Plugin neu generieren
npm run build
# Prüfe ob manifest.webmanifest & sw.js generiert wurden
```

---

## ✅ Success Criteria

Alle diese Punkte müssen ✅ sein:

- [ ] `npm install` erfolgreich
- [ ] `npm audit` → 0 vulnerabilities
- [ ] `npm test` → alle Tests grün
- [ ] `npm run build` → erfolgreich
- [ ] `npm run dev` → App lädt
- [ ] `npm run test:e2e` → E2E Tests grün (optional)

---

## 📋 Nach erfolgreicher Installation

### Git Commit

```bash
git add package.json package-lock.json
git commit -m "security: Fix CRITICAL (happy-dom RCE) and MODERATE (vite) vulnerabilities

- Update happy-dom: 15.8.3 → 15.11.8 (CRITICAL: VM Context Escape)
- Update vite: 5.4.10 → 6.0.7 (MODERATE: Dev Server vulnerability)
- Update vitest/ui: 2.1.4 → 2.1.8 (compatibility)
- Update vite-plugin-pwa: 0.20.5 → 0.21.1 (compatibility)

All tests passing ✅
npm audit: 0 vulnerabilities ✅"
```

---

## 🎯 Next Steps

Nach erfolgreichem Security-Fix:

1. ✅ Security-Update abgeschlossen
2. 🚀 Weiter mit Onboarding Schritt 4 (AltersklassenStep)
3. 📅 Wöchentlich `npm run check:packages` ausführen

---

## 🆘 Bei Problemen

Wenn irgendetwas nicht funktioniert:
1. Poste die **exakte Fehlermeldung**
2. Zeige die **betroffene Datei**
3. Ich helfe beim Debugging!

**Bereit zum Start?** 🚀

```bash
cd basketball-app
rm -rf node_modules package-lock.json
npm install
```
