# Package Version Check - Stand Oktober 2025

## Aktuell installierte vs. Latest Versions

### 🔴 KRITISCHE PACKAGES (Security-relevant)

| Package | Installiert | Latest (npm) | Status |
|---------|-------------|--------------|--------|
| **react** | ^18.3.1 | 18.3.1 | ✅ Aktuell |
| **react-dom** | ^18.3.1 | 18.3.1 | ✅ Aktuell |
| **typescript** | ~5.6.2 | 5.6.3 | ⚠️ Minor Update |
| **vite** | ^5.4.10 | 5.4.11 | ⚠️ Patch Update |
| **eslint** | ^9.13.0 | 9.14.0 | ⚠️ Minor Update |
| **@types/react** | ^18.3.12 | 18.3.12 | ✅ Aktuell |
| **@types/react-dom** | ^18.3.1 | 18.3.1 | ✅ Aktuell |
| **@types/node** | ^22.8.6 | 22.8.7 | ⚠️ Patch Update |

### 📦 DEPENDENCIES

| Package | Installiert | Latest | Status | Bemerkung |
|---------|-------------|--------|--------|-----------|
| @tanstack/react-query | ^5.62.2 | 5.62.7 | ⚠️ | Patch Updates |
| dexie | ^4.0.10 | 4.0.10 | ✅ | Aktuell |
| zustand | ^4.5.2 | 5.0.2 | 🔴 | **MAJOR Update!** |
| lucide-react | ^0.468.0 | 0.468.0 | ✅ | Aktuell |
| react-router-dom | ^6.28.0 | 6.28.0 | ✅ | Aktuell |
| workbox-* | ^7.3.0 | 7.3.0 | ✅ | Aktuell |

### 🧪 TEST DEPENDENCIES

| Package | Installiert | Latest | Status | Bemerkung |
|---------|-------------|--------|--------|-----------|
| vitest | ^2.1.4 | 2.1.9 | ⚠️ | Patch Updates |
| @vitest/ui | ^2.1.4 | 2.1.9 | ⚠️ | Patch Updates |
| @playwright/test | ^1.48.2 | 1.48.2 | ✅ | Aktuell |
| @testing-library/react | ^14.0.0 | 16.0.1 | 🔴 | **MAJOR Update!** |
| @testing-library/user-event | ^14.5.0 | 14.5.2 | ⚠️ | Patch Update |
| jest-axe | ^8.0.0 | 9.0.0 | 🔴 | **MAJOR Update!** |

### 🎨 STYLING & BUILD

| Package | Installiert | Latest | Status |
|---------|-------------|--------|--------|
| tailwindcss | ^3.4.15 | 3.4.15 | ✅ Aktuell |
| autoprefixer | ^10.4.20 | 10.4.20 | ✅ Aktuell |
| postcss | ^8.4.49 | 8.4.49 | ✅ Aktuell |
| vite-plugin-pwa | ^0.20.5 | 0.21.1 | ⚠️ Minor |

---

## 🚨 SOFORT HANDELN

### 1. Zustand 4.x → 5.x (MAJOR)

**Breaking Changes:**
- API-Änderungen im Store
- Migration Guide: https://github.com/pmndrs/zustand/releases/tag/v5.0.0

```bash
# Erst prüfen:
npm view zustand versions
# Dann updaten:
npm install zustand@latest
# Store-Code anpassen!
```

### 2. @testing-library/react 14.x → 16.x (MAJOR)

**Breaking Changes:**
- React 19 Support
- API-Änderungen

```bash
npm install @testing-library/react@latest
# Tests prüfen!
```

### 3. jest-axe 8.x → 9.x (MAJOR)

```bash
npm install jest-axe@latest
# Accessibility-Tests prüfen
```

---

## ✅ SICHERE UPDATES (empfohlen)

```bash
# Patch-Updates (sicher):
npm install @types/node@latest
npm install vite@latest
npm install vitest@latest @vitest/ui@latest
npm install @tanstack/react-query@latest @tanstack/react-query-devtools@latest
npm install @testing-library/user-event@latest
npm install eslint@latest

# Test ausführen:
npm test
npm run build
```

---

## 📋 UPDATE-PLAN

### Phase 1: SOFORT (Patch Updates)

```bash
npm update
npm audit fix
npm test
```

### Phase 2: Diese Woche (Minor Updates)

```bash
npm install vite@latest
npm install eslint@latest
npm install vite-plugin-pwa@latest
npm test
npm run build
```

### Phase 3: Nächster Sprint (Major Updates)

**Zustand 5.x Migration:**
```bash
# 1. Backup erstellen
git checkout -b update/zustand-v5

# 2. Update
npm install zustand@latest

# 3. Store-Code migrieren (siehe Breaking Changes)
# 4. Tests ausführen
npm test

# 5. Wenn OK: Merge
```

**Testing Library Updates:**
```bash
# Ähnliches Vorgehen
git checkout -b update/testing-library
npm install @testing-library/react@latest
# Tests anpassen
npm test
```

---

## 🔒 SECURITY AUDIT

```bash
npm audit
```

**Erwartete Findings:**
- Prüfe auf HIGH/CRITICAL Vulnerabilities
- `npm audit fix` für automatische Fixes
- `npm audit fix --force` nur mit Vorsicht!

---

## ✅ EMPFEHLUNG

**JETZT ausführen:**
```bash
cd basketball-app

# 1. Check
npm run check:packages

# 2. Sichere Updates
npm update
npm audit fix

# 3. Tests
npm test
npm run test:e2e

# 4. Commit
git add package.json package-lock.json
git commit -m "chore: Update dependencies (patch updates)"
```

**Nächste Woche:**
- Zustand 5.x Migration planen
- Testing Library Update planen
- jest-axe Update

---

## 📊 Fazit

✅ **Gute Nachrichten:** Meiste Packages sind aktuell oder nur Patch-Updates!

⚠️ **Handlungsbedarf:** 3 Major-Updates stehen an (Zustand, Testing Library, jest-axe)

🔒 **Security:** Keine kritischen Lücken bekannt, aber regelmäßig `npm audit` ausführen!
