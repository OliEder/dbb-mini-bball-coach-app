#!/bin/bash

# Basketball PWA - Cleanup veralteter .js Dateien
# 
# Diese Dateien sind Kompilate, die nicht mehr benötigt werden,
# da TypeScript mit "noEmit": true konfiguriert ist.

echo "🗑️  Lösche veraltete .js Dateien..."

# Spieler Domain
rm -f src/domains/spieler/services/SpielerService.js
rm -f src/domains/spieler/services/SpielerService.test.js
rm -f src/domains/spieler/services/SpielerService.integration.test.js

# Team Domain  
rm -f src/domains/team/services/TeamService.js
rm -f src/domains/team/services/TeamService.test.js

# Spielplan Domain
rm -f src/domains/spielplan/services/SpielService.js
rm -f src/domains/spielplan/services/SpielService.test.js
rm -f src/domains/spielplan/services/SpielService.integration.test.js

# Verein Domain
rm -f src/domains/verein/services/VereinService.js

# BBB Domain
rm -f src/domains/bbb/services/BBBParserService.js

echo "✅ Cleanup abgeschlossen"
echo ""
echo "Hinweis: Die .ts Dateien sind die Source of Truth."
echo "Vite verarbeitet TypeScript direkt ohne .js Ausgabe."
