# E2E Tests mit Playwright

## Installation

```bash
npm install
npm run playwright:install
```

## Tests ausführen

### Alle E2E Tests
```bash
npm run test:e2e
```

### E2E Tests mit UI (empfohlen für Entwicklung)
```bash
npm run test:e2e:ui
```

### E2E Tests im Browser sichtbar
```bash
npm run test:e2e:headed
```

### E2E Tests debuggen
```bash
npm run test:e2e:debug
```

## Test-Überwachung

Um die Test-Ergebnisse live zu überwachen:

```bash
# Terminal 1: Tests im Watch-Mode
npm run test:watch

# Terminal 2: Test-Watcher
npm run watch:tests
```

Der Test-Watcher zeigt:
- ✅ Erfolgreiche Tests
- ❌ Fehlgeschlagene Tests mit Details
- 📊 Statistiken
- 🎉 Verbesserungen/Verschlechterungen

## Test-Struktur

```
e2e/
├── onboarding.spec.ts     # Onboarding Flow Tests
├── spielplan.spec.ts      # Spielplan Tests (TODO)
├── mannschaft.spec.ts     # Mannschaftsverwaltung Tests (TODO)
└── spiel.spec.ts          # Spieltag Tests (TODO)
```

## Onboarding Tests

Die Onboarding Tests prüfen:
1. **Welcome Screen** - Begrüßung und Start
2. **BBB URL Import** - Liga-URL eingeben und validieren
3. **Team Selection** - Team aus Liga auswählen
4. **Spieler Import** - CSV-Upload und Verarbeitung
5. **Trikot Import** - CSV-Upload und Verarbeitung
6. **Completion** - Abschluss und Speicherung

### Test-Kategorien

- **Happy Path**: Vollständiger erfolgreicher Durchlauf
- **Validation**: Eingabevalidierung und Fehlermeldungen
- **Navigation**: Vor/Zurück-Navigation
- **Persistence**: Datenspeicherung in IndexedDB
- **Responsive**: Mobile, Tablet, Desktop Views
- **Error Handling**: Fehlerbehandlung bei ungültigen Daten

## Best Practices

1. **Page Object Model** verwenden für wiederverwendbare Selektoren
2. **Helper Functions** für häufige Aktionen
3. **Mock API Responses** für konsistente Tests
4. **Clear State** vor jedem Test (IndexedDB löschen)
5. **Descriptive Test Names** in Deutsch für bessere Lesbarkeit

## Debugging

### Screenshots bei Fehlern
Automatisch im `test-results/` Verzeichnis

### Videos bei Fehlern
```bash
npx playwright show-trace test-results/[trace-file].zip
```

### Browser DevTools
```bash
npm run test:e2e:debug
# Setzt Breakpoint mit: await page.pause()
```

## CI/CD Integration

Die Tests sind für GitHub Actions vorbereitet:

```yaml
- name: Install Playwright
  run: npm run playwright:install
  
- name: Run E2E Tests
  run: npm run test:e2e
  
- name: Upload Test Results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```
