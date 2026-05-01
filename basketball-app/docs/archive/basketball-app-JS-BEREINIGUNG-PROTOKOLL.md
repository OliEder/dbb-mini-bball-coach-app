# JavaScript Bereinigung - Basketball PWA

**Datum:** 12. Oktober 2025  
**Grund:** TypeScript-Projekt, .js Dateien sind veraltet

---

## ❌ Gelöschte Dateien

### Root-Level (Duplikate)
- `src/App.js` → Ersetzt durch `src/App.tsx`
- `src/main.js` → Ersetzt durch `src/main.tsx`

### Shared (Duplikate)
- `src/shared/db/database.js` → Ersetzt durch `src/shared/db/database.ts`
- `src/shared/types/index.js` → Ersetzt durch `src/shared/types/index.ts`
- `src/shared/services/csv-import.service.js` → Veraltet

### Stores
- `src/stores/appStore.js` → Veraltet
- `src/stores/onboardingStore.js` → Veraltet

### Domains - BBB
- `src/domains/bbb/services/BBBParserService.js` → Veraltet

### Domains - Dashboard
- `src/domains/dashboard/Dashboard.js` → Veraltet

### Domains - Onboarding (Komponenten)
- `src/domains/onboarding/components/BBBUrlStep.js` → Veraltet
- `src/domains/onboarding/components/CompleteStep.js` → Veraltet
- `src/domains/onboarding/components/OnboardingContainer.js` → Veraltet
- `src/domains/onboarding/components/OnboardingLayout.js` → Veraltet
- `src/domains/onboarding/components/SpielerImportStep.js` → Veraltet
- `src/domains/onboarding/components/TeamSelectStep.js` → Veraltet
- `src/domains/onboarding/components/TrikotImportStep.js` → Veraltet
- `src/domains/onboarding/components/WelcomeStep.js` → Veraltet

### Domains - Onboarding (Services & Stores)
- `src/domains/onboarding/onboarding.store.js` → Veraltet
- `src/domains/onboarding/services/CSVImportService.js` → Veraltet

### Domains - Spieler (Komponenten)
- `src/domains/spieler/components/SpielerForm.js` → Veraltet
- `src/domains/spieler/components/SpielerListe.js` → Veraltet
- `src/domains/spieler/components/SpielerVerwaltung.js` → Veraltet

### Domains - Spieler (Services & Tests)
- `src/domains/spieler/services/SpielerService.js` → Ersetzt durch `.ts`
- `src/domains/spieler/services/SpielerService.test.js` → Ersetzt durch `.test.ts`
- `src/domains/spieler/services/SpielerService.integration.test.js` → Ersetzt durch `.integration.test.ts`

### Domains - Spielplan (Komponenten)
- `src/domains/spielplan/components/SpielplanListe.js` → Veraltet

### Domains - Spielplan (Services & Tests)
- `src/domains/spielplan/services/SpielService.js` → Ersetzt durch `.ts`
- `src/domains/spielplan/services/SpielService.test.js` → Ersetzt durch `.test.ts`
- `src/domains/spielplan/services/SpielService.integration.test.js` → Ersetzt durch `.integration.test.ts`

### Domains - Team (Services & Tests)
- `src/domains/team/services/TeamService.js` → Ersetzt durch `.ts`
- `src/domains/team/services/TeamService.test.js` → Ersetzt durch `.test.ts`
- `src/domains/team/team.service.js` → Duplikat
- `src/domains/team/team.store.js` → Veraltet

### Domains - Verein (Services)
- `src/domains/verein/services/VereinService.js` → Veraltet
- `src/domains/verein/verein.service.js` → Duplikat
- `src/domains/verein/verein.store.js` → Veraltet

### Test
- `src/test/setup.js` → Ersetzt durch `.ts`

---

## ✅ Behalten (TypeScript Source)

Alle `.ts` und `.tsx` Dateien sind die aktuellen Source-Dateien.

---

**Gesamt:** 37 .js Dateien gelöscht
