# 🚨 SECURITY FIX - SOFORT

## Kritische Vulnerabilities gefunden!

### 1. happy-dom (CRITICAL - RCE)

**Problem:**
- VM Context Escape → Remote Code Execution möglich
- Betrifft: Test-Environment

**Fix:**
```bash
npm install happy-dom@latest --save-dev
```

**Breaking Changes:** Ja (v15 → v20)
- Aber nur im Test-Environment
- Geringes Risiko

---

### 2. esbuild/vite (MODERATE)

**Problem:**
- Development Server kann Requests lesen
- Betrifft: Nur Development (nicht Production!)

**Fix:**
```bash
npm install vite@latest --save-dev
```

**Breaking Changes:** Ja (v5 → v7)
- Build-Tool-Änderungen möglich
- Nach Update testen!

---

## ✅ SICHERE FIX-STRATEGIE

### Schritt 1: Happy-DOM (CRITICAL) SOFORT

```bash
cd basketball-app

# Backup current state
git add .
git commit -m "chore: Before security updates"

# Fix happy-dom (Critical)
npm install happy-dom@latest --save-dev

# Test sofort
npm test

# Wenn Tests OK:
git add package.json package-lock.json
git commit -m "security: Update happy-dom (fix CRITICAL RCE vulnerability)"
```

**Erwartung:** ✅ Tests sollten funktionieren (nur Test-Env betroffen)

---

### Schritt 2: Vite (MODERATE) - Mit Vorsicht

```bash
# Vite Major Update (v5 → v7)
npm install vite@latest --save-dev

# Vitest & Plugins aktualisieren (Kompatibilität)
npm install vitest@latest @vitest/ui@latest --save-dev
npm install vite-plugin-pwa@latest --save-dev

# Testen
npm test
npm run build
npm run dev

# Wenn alles OK:
git add package.json package-lock.json
git commit -m "security: Update vite to v7 (fix moderate vulnerability)"
```

**Mögliche Breaking Changes:**
- Config-Änderungen in `vite.config.ts`
- Plugin-APIs geändert
- Build-Output-Struktur

---

## 🔍 Vite v7 Breaking Changes prüfen

Nach dem Update prüfen:

1. **vite.config.ts** - Config-Format
2. **Build funktioniert** - `npm run build`
3. **Dev-Server** - `npm run dev`
4. **PWA-Plugin** - Service Worker generiert
5. **Tests** - `npm test`

---

## ⚡ QUICK FIX (Empfohlen)

```bash
cd basketball-app

# 1. CRITICAL Fix (sicher)
npm install happy-dom@latest --save-dev
npm test

# 2. Moderate Fix (mit Breaking Changes)
npm install vite@latest vitest@latest @vitest/ui@latest vite-plugin-pwa@latest --save-dev

# 3. Alle Tests
npm test
npm run build
npm run dev

# 4. Wenn alles läuft
git add .
git commit -m "security: Fix CRITICAL (happy-dom) and MODERATE (vite) vulnerabilities"
```

---

## 🛡️ Production Impact

**WICHTIG:**
- ❌ happy-dom: NUR Tests betroffen (nicht Production!)
- ❌ vite/esbuild: NUR Development (nicht Production!)
- ✅ **Production Build ist NICHT betroffen!**

**Trotzdem fixen:**
- Development-Sicherheit wichtig
- Supply-Chain-Attacken möglich
- CI/CD-Pipelines betroffen

---

## 📋 Checklist

- [ ] Backup: `git commit`
- [ ] Fix happy-dom: `npm install happy-dom@latest -D`
- [ ] Tests: `npm test` ✅
- [ ] Fix vite: `npm install vite@latest -D`
- [ ] Build: `npm run build` ✅
- [ ] Dev: `npm run dev` ✅
- [ ] Commit: `git commit -m "security: ..."`

---

## 🚀 Alternative: Force Fix (Risiko)

```bash
# ACHTUNG: Breaking Changes!
npm audit fix --force

# Danach INTENSIV testen:
npm test
npm run build
npm run dev
npm run test:e2e
```

**Risiko:** Kann Breaking Changes einführen, die nicht sofort offensichtlich sind.

---

## ✅ Empfehlung

**JETZT machen (5-10 Minuten):**

1. Happy-DOM Update (CRITICAL, geringes Risiko)
2. Vite Update (MODERATE, höheres Risiko aber testbar)
3. Alle Tests ausführen
4. Wenn OK: Committen

**Soll ich dir beim Debugging helfen falls etwas nicht funktioniert?**
