#!/bin/bash
# Test-Migration: /src/ → /tests/
# Basketball Team Manager PWA

set -e

echo "🧪 Test-Migration wird durchgeführt..."
echo "═══════════════════════════════════════"
echo ""

# Prüfe ob wir im Root sind
if [ ! -f "PROJECT-STRUCTURE.md" ]; then
    echo "❌ Fehler: Muss im Projekt-Root ausgeführt werden!"
    exit 1
fi

echo "✓ Projekt-Root erkannt"
echo ""

# Zähler
MOVED_COUNT=0

# Erstelle Zielverzeichnisse
echo "📁 Erstelle Zielverzeichnisse..."
mkdir -p tests/unit/domains/spieler/services
mkdir -p tests/unit/domains/spielplan/services
mkdir -p tests/unit/domains/team/services
mkdir -p tests/unit/domains/verein/services
mkdir -p tests/unit/shared/services
mkdir -p tests/unit/shared/db
mkdir -p tests/integration/domains/spieler
mkdir -p tests/integration/domains/spielplan
mkdir -p tests/integration/shared/services
mkdir -p tests/contract/shared/services
echo "✅ Verzeichnisse erstellt"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚚 Verschiebe Tests..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Spieler-Domain
echo "1️⃣  Spieler-Domain"
if [ -f "src/domains/spieler/services/SpielerService.test.ts" ]; then
    mv src/domains/spieler/services/SpielerService.test.ts tests/unit/domains/spieler/services/
    echo "   ✓ SpielerService.test.ts"
    MOVED_COUNT=$((MOVED_COUNT + 1))
fi

if [ -f "src/domains/spieler/services/SpielerService.integration.test.ts" ]; then
    mv src/domains/spieler/services/SpielerService.integration.test.ts tests/integration/domains/spieler/
    echo "   ✓ SpielerService.integration.test.ts"
    MOVED_COUNT=$((MOVED_COUNT + 1))
fi
echo ""

# Spielplan-Domain
echo "2️⃣  Spielplan-Domain"
if [ -f "src/domains/spielplan/services/SpielService.test.ts" ]; then
    mv src/domains/spielplan/services/SpielService.test.ts tests/unit/domains/spielplan/services/
    echo "   ✓ SpielService.test.ts"
    MOVED_COUNT=$((MOVED_COUNT + 1))
fi

if [ -f "src/domains/spielplan/services/SpielService.integration.test.ts" ]; then
    mv src/domains/spielplan/services/SpielService.integration.test.ts tests/integration/domains/spielplan/
    echo "   ✓ SpielService.integration.test.ts"
    MOVED_COUNT=$((MOVED_COUNT + 1))
fi
echo ""

# Team-Domain
echo "3️⃣  Team-Domain"
if [ -f "src/domains/team/services/TeamService.test.ts" ]; then
    mv src/domains/team/services/TeamService.test.ts tests/unit/domains/team/services/
    echo "   ✓ TeamService.test.ts"
    MOVED_COUNT=$((MOVED_COUNT + 1))
fi
echo ""

# Verein-Domain
echo "4️⃣  Verein-Domain"
if [ -f "src/domains/verein/services/VereinService.test.ts" ]; then
    mv src/domains/verein/services/VereinService.test.ts tests/unit/domains/verein/services/
    echo "   ✓ VereinService.test.ts"
    MOVED_COUNT=$((MOVED_COUNT + 1))
fi
echo ""

# Shared Services
echo "5️⃣  Shared Services"
if [ -d "src/shared/services/__tests__" ]; then
    if [ -f "src/shared/services/__tests__/BBBApiService.test.ts" ]; then
        mv src/shared/services/__tests__/BBBApiService.test.ts tests/unit/shared/services/
        echo "   ✓ BBBApiService.test.ts"
        MOVED_COUNT=$((MOVED_COUNT + 1))
    fi
    
    if [ -f "src/shared/services/__tests__/BBBSyncService.test.ts" ]; then
        mv src/shared/services/__tests__/BBBSyncService.test.ts tests/unit/shared/services/
        echo "   ✓ BBBSyncService.test.ts"
        MOVED_COUNT=$((MOVED_COUNT + 1))
    fi
    
    if [ -f "src/shared/services/__tests__/BBBSyncService.integration.test.ts" ]; then
        mv src/shared/services/__tests__/BBBSyncService.integration.test.ts tests/integration/shared/services/
        echo "   ✓ BBBSyncService.integration.test.ts"
        MOVED_COUNT=$((MOVED_COUNT + 1))
    fi
    
    if [ -f "src/shared/services/__tests__/BBBSyncService.pact.test.ts" ]; then
        mv src/shared/services/__tests__/BBBSyncService.pact.test.ts tests/contract/shared/services/
        echo "   ✓ BBBSyncService.pact.test.ts"
        MOVED_COUNT=$((MOVED_COUNT + 1))
    fi
    
    # README auch verschieben
    if [ -f "src/shared/services/__tests__/README.md" ]; then
        mv src/shared/services/__tests__/README.md tests/unit/shared/services/
        echo "   ✓ README.md"
    fi
    
    # Leeren __tests__ Ordner entfernen
    rmdir src/shared/services/__tests__ 2>/dev/null || true
fi
echo ""

# Shared DB
echo "6️⃣  Shared DB"
if [ -d "src/shared/db/__tests__" ]; then
    if [ -f "src/shared/db/__tests__/database-v7.test.ts" ]; then
        mv src/shared/db/__tests__/database-v7.test.ts tests/unit/shared/db/
        echo "   ✓ database-v7.test.ts"
        MOVED_COUNT=$((MOVED_COUNT + 1))
    fi
    
    # Leeren __tests__ Ordner entfernen
    rmdir src/shared/db/__tests__ 2>/dev/null || true
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Migration abgeschlossen!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 $MOVED_COUNT Tests verschoben"
echo ""
echo "⚠️  NÄCHSTER SCHRITT:"
echo "   Import-Pfade anpassen:"
echo "   bash scripts/testing/fix-test-imports.sh"
echo ""
