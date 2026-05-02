#!/bin/bash
# Test Migration Script
# Verschiebt alle Tests von src/ nach tests/

set -e

echo "🔍 Test-Migration von src/ nach tests/"
echo "========================================"

BASE_DIR="/Users/oliver-marcuseder/Documents/00-Privat/Basketball-Apps/basketball-app"
cd "$BASE_DIR"

# Phase 1: Duplikate löschen
echo ""
echo "Phase 1: Lösche Duplikate in src/ (Tests existieren bereits in tests/)"
echo "-----------------------------------------------------------------------"

# BBB-API Tests (existieren bereits in tests/)
if [ -d "src/domains/bbb-api/services/__tests__" ]; then
    echo "✓ Lösche src/domains/bbb-api/services/__tests__/"
    rm -rf src/domains/bbb-api/services/__tests__/
fi

if [ -d "src/shared/services/__tests__" ]; then
    echo "✓ Lösche src/shared/services/__tests__/"
    rm -rf src/shared/services/__tests__/
fi

# TeamService Test (existiert bereits in tests/)
if [ -f "src/domains/team/services/TeamService.test.ts" ]; then
    echo "✓ Lösche src/domains/team/services/TeamService.test.ts"
    rm src/domains/team/services/TeamService.test.ts
fi

# Phase 2: Verbleibende Tests migrieren
echo ""
echo "Phase 2: Migriere verbleibende Tests"
echo "------------------------------------"

# Spiel Tests
if [ -d "src/domains/spiel/services/__tests__" ]; then
    echo "✓ Migriere Spiel Tests"
    mkdir -p tests/unit/domains/spiel/services
    mv src/domains/spiel/services/__tests__/*.test.ts tests/unit/domains/spiel/services/ 2>/dev/null || true
    rmdir src/domains/spiel/services/__tests__ 2>/dev/null || true
fi

# Spieler Tests
if [ -f "src/domains/spieler/services/SpielerService.test.ts" ]; then
    echo "✓ Migriere Spieler Unit Test"
    mkdir -p tests/unit/domains/spieler/services
    mv src/domains/spieler/services/SpielerService.test.ts tests/unit/domains/spieler/services/
fi

if [ -f "src/domains/spieler/services/SpielerService.integration.test.ts" ]; then
    echo "✓ Migriere Spieler Integration Test"
    mkdir -p tests/integration/spieler
    mv src/domains/spieler/services/SpielerService.integration.test.ts tests/integration/spieler/
fi

# Spielplan Tests
if [ -f "src/domains/spielplan/services/SpielService.test.ts" ]; then
    echo "✓ Migriere Spielplan Unit Test"
    mkdir -p tests/unit/domains/spielplan/services
    mv src/domains/spielplan/services/SpielService.test.ts tests/unit/domains/spielplan/services/
fi

if [ -f "src/domains/spielplan/services/SpielService.integration.test.ts" ]; then
    echo "✓ Migriere Spielplan Integration Test"
    mkdir -p tests/integration/spielplan
    mv src/domains/spielplan/services/SpielService.integration.test.ts tests/integration/spielplan/
fi

# Verein Tests
if [ -f "src/domains/verein/services/VereinService.test.ts" ]; then
    echo "✓ Migriere Verein Test"
    mkdir -p tests/unit/domains/verein/services
    mv src/domains/verein/services/VereinService.test.ts tests/unit/domains/verein/services/
fi

# Database Tests
if [ -d "src/shared/db/__tests__" ]; then
    echo "✓ Migriere Database Tests"
    mkdir -p tests/unit/shared/db
    mv src/shared/db/__tests__/*.test.ts tests/unit/shared/db/ 2>/dev/null || true
    rmdir src/shared/db/__tests__ 2>/dev/null || true
fi

# Test Helpers
if [ -d "src/test/helpers" ]; then
    echo "✓ Migriere Test Helpers"
    mkdir -p tests/helpers
    cp -r src/test/helpers/* tests/helpers/ 2>/dev/null || true
fi

echo ""
echo "✅ Migration abgeschlossen!"
echo ""
echo "Nächste Schritte:"
echo "1. Prüfe ob alle Tests korrekt migriert wurden:"
echo "   find tests -name '*.test.ts' | wc -l"
echo ""
echo "2. Prüfe ob src/ keine Tests mehr enthält:"
echo "   find src -name '*.test.ts' -o -name '__tests__'"
echo ""
echo "3. TypeScript prüfen:"
echo "   npm run type-check"
echo ""
echo "4. Tests ausführen:"
echo "   npm test"
