#!/bin/bash
# Import-Pfad Fix: Relative → @/ Imports
# Basketball Team Manager PWA

set -e

echo "🔧 Import-Pfade werden angepasst..."
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
FIXED_COUNT=0

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔄 Passe Import-Pfade an..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Funktion zum Fixen der Imports in einer Datei
fix_imports() {
    local file="$1"
    local changed=0
    
    # Backup erstellen
    cp "$file" "$file.bak"
    
    # Relative Imports durch @/ ersetzen
    # Pattern 1: ./Service → @/domains/.../services/Service
    # Pattern 2: ../../../shared/ → @/shared/
    # Pattern 3: ../../shared/ → @/shared/
    # Pattern 4: ../shared/ → @/shared/
    
    # Für Domain-Tests: ./Service → @/domains/DOMAIN/services/Service
    if [[ "$file" == *"/tests/unit/domains/"* ]] || [[ "$file" == *"/tests/integration/domains/"* ]]; then
        # Extrahiere Domain-Namen aus Pfad
        DOMAIN=$(echo "$file" | sed -n 's|.*/domains/\([^/]*\)/.*|\1|p')
        
        # ./ imports
        sed -i.tmp "s|from '\./\([^']*\)'|from '@/domains/$DOMAIN/services/\1'|g" "$file"
        sed -i.tmp 's|from "\./\([^"]*\)"|from "@/domains/'"$DOMAIN"'/services/\1"|g' "$file"
    fi
    
    # Shared imports (für alle Tests)
    sed -i.tmp "s|from '\.\./\.\./\.\./shared/\([^']*\)'|from '@/shared/\1'|g" "$file"
    sed -i.tmp "s|from '\.\./\.\./shared/\([^']*\)'|from '@/shared/\1'|g" "$file"
    sed -i.tmp "s|from '\.\./shared/\([^']*\)'|from '@/shared/\1'|g" "$file"
    
    sed -i.tmp 's|from "\.\./\.\./\.\./shared/\([^"]*\)"|from "@/shared/\1"|g' "$file"
    sed -i.tmp 's|from "\.\./\.\./shared/\([^"]*\)"|from "@/shared/\1"|g' "$file"
    sed -i.tmp 's|from "\.\./shared/\([^"]*\)"|from "@/shared/\1"|g' "$file"
    
    # Domains imports
    sed -i.tmp "s|from '\.\./\.\./\.\./\.\./domains/\([^']*\)'|from '@/domains/\1'|g" "$file"
    sed -i.tmp "s|from '\.\./\.\./\.\./domains/\([^']*\)'|from '@/domains/\1'|g" "$file"
    sed -i.tmp "s|from '\.\./\.\./domains/\([^']*\)'|from '@/domains/\1'|g" "$file"
    sed -i.tmp "s|from '\.\./domains/\([^']*\)'|from '@/domains/\1'|g" "$file"
    
    sed -i.tmp 's|from "\.\./\.\./\.\./\.\./domains/\([^"]*\)"|from "@/domains/\1"|g' "$file"
    sed -i.tmp 's|from "\.\./\.\./\.\./domains/\([^"]*\)"|from "@/domains/\1"|g' "$file"
    sed -i.tmp 's|from "\.\./\.\./domains/\([^"]*\)"|from "@/domains/\1"|g' "$file"
    sed -i.tmp 's|from "\.\./domains/\([^"]*\)"|from "@/domains/\1"|g' "$file"
    
    # Prüfe ob Änderungen gemacht wurden
    if ! diff -q "$file" "$file.bak" > /dev/null 2>&1; then
        changed=1
        rm "$file.bak"
        rm "$file.tmp" 2>/dev/null || true
        echo "   ✓ $(basename $file)"
        FIXED_COUNT=$((FIXED_COUNT + 1))
    else
        # Keine Änderungen, Backup wiederherstellen
        mv "$file.bak" "$file"
        rm "$file.tmp" 2>/dev/null || true
    fi
    
    return $changed
}

# Fixe alle Test-Dateien
echo "1️⃣  Unit Tests in /tests/unit/"
find tests/unit -name "*.test.ts" -o -name "*.test.tsx" 2>/dev/null | while read -r file; do
    if [ -f "$file" ]; then
        fix_imports "$file" || true
    fi
done
echo ""

echo "2️⃣  Integration Tests in /tests/integration/"
find tests/integration -name "*.test.ts" -o -name "*.integration.test.ts" 2>/dev/null | while read -r file; do
    if [ -f "$file" ]; then
        fix_imports "$file" || true
    fi
done
echo ""

echo "3️⃣  Contract Tests in /tests/contract/"
find tests/contract -name "*.test.ts" -o -name "*.pact.test.ts" 2>/dev/null | while read -r file; do
    if [ -f "$file" ]; then
        fix_imports "$file" || true
    fi
done
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Import-Pfade angepasst!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 $FIXED_COUNT Dateien geändert"
echo ""
echo "⚠️  NÄCHSTER SCHRITT:"
echo "   Tests ausführen:"
echo "   npm run test"
echo ""
echo "   Oder mit UI:"
echo "   npm run test:ui"
echo ""
