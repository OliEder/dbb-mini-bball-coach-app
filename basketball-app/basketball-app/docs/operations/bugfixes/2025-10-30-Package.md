# 🔧 Package.json Fix - Schritt-für-Schritt

## Problem
- `@dexie/react-hooks` existiert nicht im npm-Registry
- Wird im Code auch gar nicht verwendet!

## Lösung

### Schritt 1: Entferne das Problem-Package aus package.json

```bash
cd basketball-app
```

Öffne `package.json` und **entferne** diese Zeile unter `dependencies`:
```json
"@dexie/react-hooks": "^1.1.7",  // ❌ LÖSCHEN
```

### Schritt 2: Cleanup

```bash
rm -rf node_modules package-lock.json
```

### Schritt 3: Installiere Accessibility-Packages

Füge zu `package.json` unter `devDependencies` hinzu:

```json
"devDependencies": {
  // ... existing packages
  "jest-axe": "^8.0.0",
  "axe-core": "^4.10.0",
  "@testing-library/jest-dom": "^6.1.0",
  "@testing-library/react": "^14.0.0",
  "@testing-library/user-event": "^14.5.0"
}
```

### Schritt 4: Installieren

```bash
npm install
```

## Oder: Automatisch per CLI

```bash
cd basketball-app

# 1. Problem-Package entfernen
npm uninstall @dexie/react-hooks

# 2. Cleanup
rm -rf node_modules package-lock.json

# 3. Accessibility-Packages installieren
npm install --save-dev jest-axe@^8.0.0 axe-core@^4.10.0 @testing-library/jest-dom@^6.1.0 @testing-library/react@^14.0.0 @testing-library/user-event@^14.5.0

# 4. Alles neu installieren
npm install
```

## Danach: Test Setup

```typescript
// src/test/setup.ts
import { expect } from 'vitest';
import { toHaveNoViolations } from 'jest-axe';
import '@testing-library/jest-dom';

expect.extend(toHaveNoViolations);
```

## Tests ausführen

```bash
npm run test
```

Sollte jetzt funktionieren! ✅
