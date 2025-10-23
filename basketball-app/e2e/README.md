# E2E & Accessibility Tests - Installation & Ausführung

## 📦 Installation

### 1. Fehlende Dependencies installieren

```bash
# @axe-core/playwright für Accessibility-Tests
npm install --save-dev @axe-core/playwright

# Playwright Browser installieren (falls noch nicht geschehen)
npm run playwright:install
```

## 🧪 Tests ausführen

### E2E-Tests (Playwright)
```bash
# Simplified Onboarding Flow (NEU!)
npx playwright test e2e/onboarding-simplified.spec.ts

# Accessibility-Tests
npx playwright test e2e/accessibility.spec.ts

# Alle E2E-Tests
npm run test:e2e

# Mit UI (interaktiv)
npm run test:e2e:ui

# Mit Debug
npm run test:e2e:debug

# Im Browser sichtbar (headed mode)
npm run test:e2e:headed
```

## 📊 Test-Übersicht

### ✅ Simplified Onboarding E2E (`e2e/onboarding-simplified.spec.ts`)
**Testet:** Neuer vereinfachter Onboarding-Flow (5 Schritte!)

**Flow:**
1. Welcome
2. User (Vorname, Nachname)
3. Verein (mit Filter + Suche)
4. Team (Multi-Select)
5. Completion → Dashboard

**Testfälle:**
- ✅ Vollständiger Durchlauf (Welcome → Dashboard-Redirect)
- ✅ Verband-Filter funktioniert
- ✅ Verein-Suche (Echtzeit-Filterung)
- ✅ Alphabetische Sortierung
- ✅ Multi-Team-Auswahl
- ✅ Progress Bar (1-5 von 5)
- ✅ Zurück-Navigation
- ✅ Session Persistence
- ✅ Responsive (Mobile/Tablet)

**Erwartung:**
- Alle Tests grün ✅
- Ladezeit Vereinsliste <5s
- Suche: Live-Filterung <300ms
- **0 API-Calls** (alle Daten lokal!)

---

### ✅ Accessibility-Tests (`e2e/accessibility.spec.ts`)
**Testet:** WCAG 2.1 AA + automatisierbare AAA-Regeln

**Getestete Steps:**
- Welcome
- User
- Verein (mit Filter & Suche)
- Team

**WCAG AA (vollständig):**
- ✅ Keine Violations in allen Steps
- ✅ Farbkontraste (4.5:1)
- ✅ Heading-Hierarchie
- ✅ ARIA-Labels & Roles
- ✅ Form-Label-Verknüpfungen

**Keyboard-Navigation:**
- ✅ Tab-Navigation
- ✅ Shift+Tab (rückwärts)
- ✅ Pfeiltasten (Radio-Buttons)
- ✅ Space (Checkboxen)
- ✅ Enter (Buttons)

**Fokus-Management:**
- ✅ Logische Fokus-Reihenfolge
- ✅ Sichtbarer Fokus-Indikator
- ✅ Disabled Buttons aus Tab-Order

**ARIA & Semantik:**
- ✅ ARIA Live-Regions (Suchergebnisse)
- ✅ ARIA-Busy (Loading States)
- ✅ Landmark-Regions
- ✅ Progressbar (aria-valuenow/min/max)

**AAA (automatisiert):**
- ✅ Erweiterte Kontraste (7:1) - getrackt
- ✅ Touch-Targets (min 44x44px) - getrackt

**Weitere Prüfungen:**
- ✅ 200% Zoom ohne horizontale Scrollbar
- ✅ Responsive auf allen Viewports

**Erwartung:**
- **0 WCAG AA Violations** ✅
- Alle Keyboard-Flows funktionieren
- Fokus immer sichtbar und logisch

---

## 🗑️ Archivierte Tests

Im Ordner `zu-loeschen/` befinden sich veraltete Tests:
- `onboarding.spec.ts` - Alter Flow mit BBB-URL-Import
- `onboarding-v3.spec.ts` - V3 mit 10 Steps (veraltet)
- `bbb-integration.spec.ts` - BBB API Tests (nicht mehr relevant)

**Diese Tests werden nicht mehr ausgeführt und können nach Review gelöscht werden.**

---

## 🎯 Quality Gates (CI/CD)

### Für Pull Requests:
```yaml
✅ E2E-Tests: 100% grün (simplified + accessibility)
✅ Accessibility: 0 AA Violations
✅ Performance: <5s Vereinsliste laden
✅ Keine API-Calls im Onboarding
✅ Session Persistence funktioniert
```

## 📝 Test-Reports

### Nach Test-Ausführung:
```bash
# Playwright HTML-Report
npx playwright show-report
```

### Test-Ergebnisse:
- **Playwright**: `playwright-report/index.html`
- **Screenshots**: `test-results/` (bei Failures)
- **Videos**: `test-results/` (bei Failures)

## 🐛 Tests debuggen

### Playwright Debug:
```bash
# Mit Inspector
npx playwright test --debug e2e/onboarding-simplified.spec.ts

# Einzelner Test
npx playwright test -g "sollte kompletten vereinfachten Flow"

# Mit Trace
npx playwright test --trace on

# Nur failed Tests
npx playwright test --last-failed
```

### Browser öffnen:
```bash
# Headed Mode (Browser sichtbar)
npx playwright test --headed

# Slow Motion (langsamer für Debugging)
npx playwright test --headed --slow-mo=1000
```

### Store-State prüfen:
```javascript
// In E2E-Test:
await page.evaluate(() => {
  const store = window.__SIMPLE_ONBOARDING_STORE__;
  console.log(store.getState());
});
```

## 📚 Weitere Dokumentation

- **Simplified Onboarding**: `SIMPLIFIED_ONBOARDING.md`
- **React Router Migration**: `REACT_ROUTER_MIGRATION.md`
- **Club-Daten Struktur**: `docs/DBB_CLUB_DATA.md`
- **Playwright Docs**: https://playwright.dev/
- **axe-core Docs**: https://github.com/dequelabs/axe-core

## ✅ Checkliste vor Commit

- [ ] `npm run test:e2e` läuft erfolgreich
- [ ] Keine neuen Accessibility-Violations
- [ ] Keine API-Calls im Onboarding
- [ ] Performance: Vereinsliste <5s
- [ ] Session Persistence funktioniert

## 🚀 Continuous Integration

Tests laufen automatisch bei:
- ✅ Push auf `main`
- ✅ Pull Requests
- ✅ Vor jedem Release

**Failure = Keine Merge möglich!**

## 📊 Test-Abdeckung

| Test Suite | Tests | Status |
|------------|-------|--------|
| Simplified Onboarding | 10 | ✅ |
| Accessibility | 20 | ✅ |
| **Gesamt** | **30** | **✅** |

## 💡 Tipps

**Test läuft langsam?**
```bash
# Parallel ausführen (Standard: workers=4)
npx playwright test --workers=8
```

**Nur bestimmte Browser testen:**
```bash
# Nur Chromium
npx playwright test --project=chromium

# Nur Mobile
npx playwright test --project=mobile
```

**CI-Modus lokal testen:**
```bash
# Wie in GitHub Actions
npx playwright test --forbid-only --reporter=dot
```

## 🔧 Troubleshooting

**Tests schlagen fehl: "Vereine nicht geladen"**
- Prüfe: `public/data/clubs-chunks/clubs-index.json` existiert
- Lösung: `cd scripts/dbb-scraper && npm run build-chunks`

**Tests schlagen fehl: "Store not found"**
- Store wird im Browser-Window exponiert
- Check: `window.__SIMPLE_ONBOARDING_STORE__` in DevTools

**Accessibility-Tests schlagen fehl:**
- Run `npx playwright test accessibility.spec.ts --ui`
- Prüfe Violations im Report
- Fix HTML/CSS entsprechend WCAG-Guidelines
