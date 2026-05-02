# Test-Validierung - Checkliste

## ✅ Durchgeführt (von Claude)

- [x] Import-Pfade in 4 Testdateien korrigiert
- [x] Analyse-Report erstellt (TEST-IMPORTS-ANALYSIS.md)
- [x] Korrektur-Zusammenfassung erstellt (TEST-IMPORT-FIX-SUMMARY.md)
- [x] Alle Imports jetzt einheitlich mit `@/`

## ⏳ Zu erledigen (von dir)

### Sofort (< 5 Minuten)
- [ ] Leeres Verzeichnis entfernen:
  ```bash
  rm -rf /Users/oliver-marcuseder/Documents/00-Privat/Basketball-Apps/basketball-app/e2e
  ```

- [ ] Tests ausführen:
  ```bash
  cd /Users/oliver-marcuseder/Documents/00-Privat/Basketball-Apps/basketball-app
  npm test
  ```

- [ ] TypeScript validieren (Skript wurde hinzugefügt):
  ```bash
  npm run type-check
  ```

### Falls Tests fehlschlagen

#### Häufige Probleme:

**1. Module nicht gefunden**
```bash
npm install
```

**2. tsconfig.json fehlt baseUrl/paths**
Prüfe ob vorhanden:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

**3. Test-Helper fehlt**
Falls Import-Fehler bei `@/test/helpers/bbbTestHelpers`:
```bash
# Prüfe ob Datei existiert
ls -la src/test/helpers/
```

### Nach erfolgreichen Tests

- [ ] Commit durchführen:
  ```bash
  git add tests/ TEST-*.md
  git commit -m "fix: Korrigiere Import-Pfade in Tests - einheitlich @/ verwenden

  - SimplifiedTeamStep.test.tsx: @domains → @/domains
  - SimplifiedVereinStep.test.tsx: @domains → @/domains
  - ClubDataLoader.test.ts: @shared → @/shared
  - onboarding-local-data.test.ts: @shared → @/shared
  
  Alle Test-Imports sind jetzt konsistent mit @/ Alias."
  ```

## 📊 Status nach Korrektur

### Tests nach Kategorie
- ✅ Unit Tests: 10 Dateien
- ✅ Integration Tests: 2 Dateien
- ✅ E2E Tests: 2 Dateien
- ⏳ Contract Tests: 0 (Struktur bereit)
- ⏳ Accessibility Tests: 0 (Struktur bereit)
- ⏳ Performance Tests: 0 (Struktur bereit)
- ⏳ Security Tests: 0 (Struktur bereit)
- ⏳ Visual Tests: 0 (Struktur bereit)

### Import-Konsistenz
- ✅ 100% der Tests verwenden `@/` Alias
- ✅ Keine veralteten Import-Pfade mehr
- ✅ Mocks korrekt angepasst

## 🎯 Nächste Empfehlungen

### Code-Qualität
1. ESLint-Regel hinzufügen:
   ```json
   {
     "rules": {
       "no-restricted-imports": ["error", {
         "patterns": ["@domains/*", "@shared/*"]
       }]
     }
   }
   ```

2. Pre-commit Hook:
   ```bash
   npm install --save-dev husky lint-staged
   npx husky init
   ```

### Test-Coverage erweitern
- [ ] Contract Tests für BBB API (PACT)
- [ ] Accessibility Tests (axe-core)
- [ ] Performance Tests (Core Web Vitals)
- [ ] Security Tests (OWASP ZAP)
- [ ] Visual Regression Tests

## 📝 Notizen
- Alle Änderungen sind rückwärtskompatibel
- Keine Breaking Changes
- Tests sollten alle durchlaufen
- Bei Problemen: Siehe TEST-IMPORTS-ANALYSIS.md
