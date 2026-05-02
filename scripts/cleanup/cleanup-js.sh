#!/bin/bash
# Basketball PWA - JS Bereinigung Script
# Löscht alle veralteten .js Dateien

# Root Level
rm -f src/App.js
rm -f src/main.js

# Shared
rm -f src/shared/db/database.js
rm -f src/shared/types/index.js
rm -f src/shared/services/csv-import.service.js

# Stores
rm -f src/stores/appStore.js
rm -f src/stores/onboardingStore.js

# BBB
rm -f src/domains/bbb/services/BBBParserService.js

# Dashboard
rm -f src/domains/dashboard/Dashboard.js

# Onboarding
rm -f src/domains/onboarding/components/BBBUrlStep.js
rm -f src/domains/onboarding/components/CompleteStep.js
rm -f src/domains/onboarding/components/OnboardingContainer.js
rm -f src/domains/onboarding/components/OnboardingLayout.js
rm -f src/domains/onboarding/components/SpielerImportStep.js
rm -f src/domains/onboarding/components/TeamSelectStep.js
rm -f src/domains/onboarding/components/TrikotImportStep.js
rm -f src/domains/onboarding/components/WelcomeStep.js
rm -f src/domains/onboarding/onboarding.store.js
rm -f src/domains/onboarding/services/CSVImportService.js

# Spieler
rm -f src/domains/spieler/components/SpielerForm.js
rm -f src/domains/spieler/components/SpielerListe.js
rm -f src/domains/spieler/components/SpielerVerwaltung.js
rm -f src/domains/spieler/services/SpielerService.js
rm -f src/domains/spieler/services/SpielerService.test.js
rm -f src/domains/spieler/services/SpielerService.integration.test.js

# Spielplan
rm -f src/domains/spielplan/components/SpielplanListe.js
rm -f src/domains/spielplan/services/SpielService.js
rm -f src/domains/spielplan/services/SpielService.test.js
rm -f src/domains/spielplan/services/SpielService.integration.test.js

# Team
rm -f src/domains/team/services/TeamService.js
rm -f src/domains/team/services/TeamService.test.js
rm -f src/domains/team/team.service.js
rm -f src/domains/team/team.store.js

# Verein
rm -f src/domains/verein/services/VereinService.js
rm -f src/domains/verein/verein.service.js
rm -f src/domains/verein/verein.store.js

# Test
rm -f src/test/setup.js

echo "✅ 37 .js Dateien gelöscht"
echo "Projekt nutzt jetzt ausschließlich TypeScript (.ts/.tsx)"
