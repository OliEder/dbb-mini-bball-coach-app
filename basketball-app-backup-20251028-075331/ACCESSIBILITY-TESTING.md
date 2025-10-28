# Accessibility Testing Setup - KORRIGIERT

## ⚠️ Problem mit package.json

Es gibt ein Problem mit `@dexie/react-hooks` in den dependencies - dieser Package existiert nicht im npm-Registry.

## Schritt-für-Schritt Installation

### 1. Erst Dexie-Problem beheben

Prüfen welcher der korrekte Package ist:
```bash
# Option A: dexie-react-hooks (ohne @)
npm info dexie-react-hooks

# Option B: Vielleicht gar nicht benötigt?
# Dexie hat eingebaute React-Hooks seit v4
```

### 2. package.json korrigieren

**Vorher:**
```json
"dependencies": {
  "@dexie/react-hooks": "^1.1.7",  // ❌ Existiert nicht!
  "dexie": "^4.0.10",
}
```

**Nachher (Option A):**
```json
"dependencies": {
  "dexie": "^4.0.10",
  "dexie-react-hooks": "^1.1.7",  // ✅ Ohne @
}
```

**Nachher (Option B - empfohlen):**
```json
"dependencies": {
  "dexie": "^4.0.10",  // ✅ Hat bereits eingebaute React-Hooks
}
```

Dann Imports ändern von:
```typescript
// Alt:
import { useLiveQuery } from '@dexie/react-hooks';

// Neu:
import { useLiveQuery } from 'dexie-react-hooks';
```

### 3. node_modules & package-lock löschen

```bash
cd basketball-app
rm -rf node_modules package-lock.json
```

### 4. Accessibility-Packages installieren

```bash
npm install --save-dev jest-axe@^8.0.0 axe-core@^4.10.0 @testing-library/jest-dom@^6.1.0
```

### 5. Alle Packages neu installieren

```bash
npm install
```

## Alternative: Manuelle package.json Bearbeitung

Füge direkt in `package.json` unter `devDependencies` hinzu:

```json
"devDependencies": {
  // ... bestehende packages
  "jest-axe": "^8.0.0",
  "axe-core": "^4.10.0",
  "@testing-library/jest-dom": "^6.1.0",
  "@testing-library/react": "^14.0.0",
  "@testing-library/user-event": "^14.5.0"
}
```

Dann:
```bash
npm install
```

## Test Setup erweitern

```typescript
// src/test/setup.ts
import { expect } from 'vitest';
import { toHaveNoViolations } from 'jest-axe';
import '@testing-library/jest-dom';

// Erweitere expect mit axe-Matcher
expect.extend(toHaveNoViolations);
```

## Verwendung in Tests

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

it('sollte keine Accessibility-Violations haben', async () => {
  const { container } = render(<MyComponent />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## Troubleshooting

### Error: "@dexie/react-hooks not found"

**Lösung 1:** Package-Name korrigieren
```bash
npm uninstall @dexie/react-hooks
npm install dexie-react-hooks
```

**Lösung 2:** Dexie v4 nutzt eingebaute Hooks
```typescript
// Kein Extra-Package nötig!
import { useLiveQuery } from 'dexie';
```

### Error: "peer dependency vitest@3.2.4"

```bash
# Vitest auf konsistente Version bringen
npm install --save-dev vitest@^2.1.9 @vitest/ui@^2.1.9 @vitest/coverage-v8@^2.1.9
```

## Nächste Schritte

1. **Dexie-Problem beheben**
2. **Accessibility-Packages installieren**
3. **Tests ausführen:** `npm run test`
4. **Für alle Komponenten Tests erstellen**
