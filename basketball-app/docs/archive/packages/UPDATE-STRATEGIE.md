# 🚀 Package Update Strategie - Priorisierung

## 📊 Ist-Zustand

- ✅ **17 Packages aktuell**
- 🔧 **4 Patch Updates** (sicher)
- 📦 **17 Minor Updates** (meist sicher)
- 🔴 **13 Major Updates** (Breaking Changes!)

---

## 🎯 3-Phasen-Plan

### PHASE 1: SOFORT (5-10 Minuten)

**Patch Updates - 100% sicher:**

```bash
cd basketball-app

npm install @pact-foundation/pact@^16.0.2 \
  @types/papaparse@^5.3.16 \
  autoprefixer@^10.4.21 \
  eslint-plugin-react-refresh@^0.4.24

npm test
npm run build
```

**Erwartung:** ✅ Keine Probleme

---

### PHASE 2: DIESE WOCHE (30-60 Minuten)

**Minor Updates - Meist sicher, aber testen:**

```bash
# 2.1 Development Tools (geringes Risiko)
npm install @eslint/js@^9.38.0 \
  eslint@^9.38.0 \
  @playwright/test@^1.56.1 \
  tsx@^4.20.6 \
  postcss@^8.5.6

npm test

# 2.2 Testing Libraries
npm install @testing-library/jest-dom@^6.9.1 \
  @testing-library/user-event@^14.6.1 \
  axe-core@^4.11.0

npm test

# 2.3 TypeScript & Parser
npm install typescript@^5.9.3 \
  @typescript-eslint/eslint-plugin@^8.46.2 \
  @typescript-eslint/parser@^8.46.2 \
  typescript-eslint@^8.46.2

npm test
npm run build

# 2.4 Application Dependencies (VORSICHT)
npm install @tanstack/react-query@^5.90.5 \
  @tanstack/react-query-devtools@^5.90.2 \
  dexie@^4.2.1 \
  lucide-react@^0.546.0 \
  papaparse@^5.5.3

npm test
npm run dev  # Kurz testen
```

---

### PHASE 3: NÄCHSTER SPRINT (2-4 Stunden)

**Major Updates - Breaking Changes, einzeln migrieren:**

#### 🔴 1. React 19 Migration (GROSS!)

**⚠️ ACHTUNG:** React 19 ist ein Major-Update mit vielen Breaking Changes!

```bash
# Backup erstellen
git checkout -b feature/react-19-migration

# React Core + Types
npm install react@^19.2.0 \
  react-dom@^19.2.0 \
  @types/react@^19.2.2 \
  @types/react-dom@^19.2.2

# Vite Plugin Update (für React 19 Support)
npm install @vitejs/plugin-react-swc@^4.1.0

# Tests & Build
npm test
npm run build
npm run dev

# Breaking Changes prüfen:
# - Neue Concurrent Features
# - useTransition / useDeferredValue Änderungen
# - StrictMode Behavior
# - Server Components Vorbereitung
```

**Migration Guide:** https://react.dev/blog/2024/04/25/react-19

---

#### 🔴 2. Zustand 5.x Migration

```bash
git checkout -b feature/zustand-v5

npm install zustand@^5.0.8

# Store-Code anpassen (Breaking Changes in API)
# Tests ausführen
npm test
```

**Migration Guide:** https://github.com/pmndrs/zustand/releases/tag/v5.0.0

---

#### 🔴 3. React Router 7 Migration

```bash
git checkout -b feature/react-router-v7

npm install react-router-dom@^7.9.4

# Router-Code anpassen
npm test
```

**Migration Guide:** https://reactrouter.com/upgrading/v6-to-v7

---

#### 🔴 4. Tailwind 4 Migration (SEHR GROSS!)

**⚠️ ACHTUNG:** Tailwind 4 ist komplette Neuschreibung!

```bash
git checkout -b feature/tailwind-v4

npm install tailwindcss@^4.1.15

# tailwind.config.js komplett umschreiben
# Alle Klassen prüfen (Breaking Changes!)
# CSS neu kompilieren
```

**Migration Guide:** https://tailwindcss.com/docs/upgrade-guide

---

#### 🔴 5. Kleinere Major Updates

```bash
# Jest-Axe
npm install jest-axe@^10.0.0
npm test  # Accessibility-Tests prüfen

# ESLint React Hooks
npm install eslint-plugin-react-hooks@^7.0.0
npm run lint

# Testing Library React
npm install @testing-library/react@^16.3.0
npm test

# @types/node
npm install @types/node@^24.9.1
npm test

# globals
npm install globals@^16.4.0
npm test
```

---

## ✅ EMPFEHLUNG

### JETZT sofort machen:

```bash
cd basketball-app

# 1. Patch Updates (5 Min)
npm install @pact-foundation/pact@^16.0.2 \
  @types/papaparse@^5.3.16 \
  autoprefixer@^10.4.21 \
  eslint-plugin-react-refresh@^0.4.24

# 2. Test & Commit
npm test
npm run build
git add package.json package-lock.json
git commit -m "chore: Patch updates (safe, no breaking changes)"
```

### Diese Woche:

1. ✅ Minor Updates durchführen (Development Tools zuerst)
2. ✅ Testen nach jedem Batch
3. ✅ Committen wenn Tests grün

### Nächsten Sprint planen:

1. 🔴 **React 19 Migration** (2-3 Stunden)
2. 🔴 **Zustand 5** (30 Min)
3. 🔴 **React Router 7** (1 Stunde)
4. 🔴 **Tailwind 4** (2-4 Stunden!)

---

## 🚫 NICHT JETZT machen:

- ❌ React 19 (zu komplex für schnellen Fix)
- ❌ Tailwind 4 (komplette CSS-Überarbeitung)
- ❌ React Router 7 (Routing-Änderungen)

**Diese brauchen dedizierte Feature-Branches & Zeit!**

---

## 💡 Alternative: Schrittweises Vorgehen

**Wenn Zeit knapp:**

1. **Nur Security-Fixes** (bereits gemacht ✅)
2. **Patch Updates** (JETZT, 5 Min)
3. **Rest später** wenn Feature-Entwicklung pausiert

**Dann weiter mit Onboarding Schritt 4!**

---

## 🎯 Deine Entscheidung

**Option A: Schnell weiter**
```bash
# Nur Patch Updates
npm install @pact-foundation/pact@^16.0.2 @types/papaparse@^5.3.16 autoprefixer@^10.4.21 eslint-plugin-react-refresh@^0.4.24
npm test
# → Dann Onboarding Schritt 4
```

**Option B: Gründlich**
```bash
# Alle Minor Updates
npm install [alle Minor Updates]
npm test
# → Dann Onboarding Schritt 4
```

**Option C: Maximale Modernität**
```bash
# Alle Updates inkl. React 19, Tailwind 4, etc.
# → 4-8 Stunden Arbeit!
```

---

**Was möchtest du?** 🤔

1. **Schnell weiter** (Patch + Onboarding)?
2. **Gründlich** (Minor + Onboarding)?
3. **Alles updaten** (Major Migrations)?
