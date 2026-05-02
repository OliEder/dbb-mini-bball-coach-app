#!/bin/bash

# Import Path Validator
# Prüft auf veraltete Import-Pfade nach Service Cleanup

echo "🔍 Scanning for obsolete import paths..."

ERRORS=0

# 1. Check for old bbb-api imports
echo "Checking for @/domains/bbb-api imports..."
if grep -r "from '@/domains/bbb-api" src/ 2>/dev/null; then
    echo "❌ Found obsolete bbb-api imports!"
    echo "   Should be: @/shared/services/BBBApiService or BBBSyncService"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ No bbb-api imports found"
fi

# 2. Check for old spiel domain imports (removed, use spielplan)
echo "Checking for @/domains/spiel imports (not spielplan)..."
if grep -r "from '@/domains/spiel[^p]" src/ 2>/dev/null || grep -r 'from "@/domains/spiel[^p]' src/ 2>/dev/null; then
    echo "❌ Found obsolete spiel domain imports!"
    echo "   Should be: @/domains/spielplan"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ No spiel domain imports found"
fi

# 3. Summary
echo ""
echo "===================="
if [ $ERRORS -eq 0 ]; then
    echo "✅ All imports are clean!"
    exit 0
else
    echo "❌ Found $ERRORS import issues!"
    echo ""
    echo "Fix with:"
    echo "  @/domains/bbb-api → @/shared/services"
    echo "  @/domains/spiel → @/domains/spielplan"
    exit 1
fi
