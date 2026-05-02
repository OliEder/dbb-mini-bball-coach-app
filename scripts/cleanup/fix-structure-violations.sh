#!/bin/bash
# Basketball Team Manager - Struktur-Korrektur
# Behebt die identifizierten Abweichungen von PROJECT-STRUCTURE.md

set -e

echo "🔧 Basketball Team Manager - Struktur-Korrektur"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Prüfe ob wir im Root-Verzeichnis sind
if [ ! -f "PROJECT-STRUCTURE.md" ]; then
    echo "❌ Fehler: Muss im Root-Verzeichnis des Projekts ausgeführt werden!"
    echo "   cd /Users/oliver-marcuseder/Documents/00-Privat/Basketball-Apps/basketball-app"
    echo "   bash scripts/cleanup/fix-structure-violations.sh"
    exit 1
fi

echo "✓ Projekt-Root erkannt"
echo ""

# 1. E2E Tests verschieben
echo "📁 [1/6] Verschiebe E2E Tests..."
if [ -d "e2e" ]; then
    mkdir -p tests/e2e
    if [ "$(ls -A e2e)" ]; then
        mv e2e/* tests/e2e/ 2>/dev/null || true
    fi
    rmdir e2e 2>/dev/null || true
    echo "✅ E2E Tests verschoben: e2e/ → tests/e2e/"
else
    echo "⏭️  E2E Verzeichnis bereits verschoben"
fi
echo ""

# 2. Test-Verzeichnisse erstellen
echo "📁 [2/6] Erstelle fehlende Test-Verzeichnisse..."
mkdir -p tests/contract/pacts
mkdir -p tests/visual
mkdir -p tests/security
mkdir -p tests/performance
mkdir -p tests/accessibility
echo "✅ Test-Verzeichnisse erstellt"
echo ""

# 3. Scripts organisieren
echo "📁 [3/6] Organisiere Scripts..."
MOVED_SCRIPTS=0

[ -f "scripts/fix-node-modules.sh" ] && mv scripts/fix-node-modules.sh scripts/cleanup/ && echo "   ✓ fix-node-modules.sh" && MOVED_SCRIPTS=$((MOVED_SCRIPTS+1))
[ -f "scripts/run-all-tests.sh" ] && mv scripts/run-all-tests.sh scripts/testing/ && echo "   ✓ run-all-tests.sh" && MOVED_SCRIPTS=$((MOVED_SCRIPTS+1))
[ -f "scripts/test-analysis.sh" ] && mv scripts/test-analysis.sh scripts/testing/ && echo "   ✓ test-analysis.sh" && MOVED_SCRIPTS=$((MOVED_SCRIPTS+1))
[ -f "scripts/test-monitor-native.js" ] && mv scripts/test-monitor-native.js scripts/testing/ && echo "   ✓ test-monitor-native.js" && MOVED_SCRIPTS=$((MOVED_SCRIPTS+1))
[ -f "scripts/test-monitor.js" ] && mv scripts/test-monitor.js scripts/testing/ && echo "   ✓ test-monitor.js" && MOVED_SCRIPTS=$((MOVED_SCRIPTS+1))
[ -f "scripts/test-watcher.ts" ] && mv scripts/test-watcher.ts scripts/testing/ && echo "   ✓ test-watcher.ts" && MOVED_SCRIPTS=$((MOVED_SCRIPTS+1))

[ $MOVED_SCRIPTS -gt 0 ] && echo "✅ $MOVED_SCRIPTS Scripts organisiert" || echo "⏭️  Scripts bereits organisiert"
echo ""

# 4. Falsche package.json entfernen
echo "🗑️  [4/6] Entferne falsche package.json..."
REMOVED=0
[ -f "scripts/package.json" ] && rm scripts/package.json && echo "   ✓ scripts/package.json" && REMOVED=$((REMOVED+1))
[ -f "scripts/package-lock.json" ] && rm scripts/package-lock.json && echo "   ✓ scripts/package-lock.json" && REMOVED=$((REMOVED+1))
[ $REMOVED -gt 0 ] && echo "✅ Aufgeräumt" || echo "⏭️  Bereits sauber"
echo ""

# 5. Architecture Dateien verschieben
echo "📁 [5/6] Organisiere Architecture..."
MOVED=0
[ -f "docs/architecture/basketball-erd.mermaid" ] && mkdir -p docs/architecture/diagrams && mv docs/architecture/basketball-erd.mermaid docs/architecture/diagrams/ && echo "   ✓ basketball-erd.mermaid" && MOVED=$((MOVED+1))
[ -f "docs/architecture/datenstruktur.puml" ] && mkdir -p docs/architecture/diagrams && mv docs/architecture/datenstruktur.puml docs/architecture/diagrams/ && echo "   ✓ datenstruktur.puml" && MOVED=$((MOVED+1))
[ -f "docs/architecture/datenbank-schema-update_v3.md" ] && mkdir -p docs/specifications/data-models && mv docs/architecture/datenbank-schema-update_v3.md docs/specifications/data-models/ && echo "   ✓ datenbank-schema-update_v3.md" && MOVED=$((MOVED+1))
[ $MOVED -gt 0 ] && echo "✅ Architecture organisiert" || echo "⏭️  Bereits organisiert"
echo ""

# 6. .DS_Store entfernen
echo "🗑️  [6/6] Entferne .DS_Store..."
DS_COUNT=$(find . -name ".DS_Store" -type f 2>/dev/null | wc -l | tr -d ' ')
if [ "$DS_COUNT" -gt 0 ]; then
    find . -name ".DS_Store" -type f -delete 2>/dev/null
    echo "✅ $DS_COUNT Dateien entfernt"
    grep -q "^\.DS_Store$" .gitignore 2>/dev/null || echo ".DS_Store" >> .gitignore
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Automatische Korrektur abgeschlossen!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⚠️  MANUELLE NACHARBEIT:"
echo ""
echo "1. Duplikate mergen:"
echo "   cp -r docs/bugfixes/* docs/operations/bugfixes/ && rm -rf docs/bugfixes/"
echo "   cp -r docs/migrations/* docs/operations/migrations/ && rm -rf docs/migrations/"
echo ""
echo "2. Dateien konsolidieren:"
echo "   • docs/development/STATUS.md prüfen"
echo "   • docs/development/TO-MERGE-QUICKSTART.md integrieren"
echo ""
echo "Details: docs/development/STRUCTURE-VIOLATIONS.md"
