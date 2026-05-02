#!/bin/bash

# Basketball Team Manager - TO-SORT Cleanup
# Zweck: Kategorisiert und verschiebt Dateien aus docs/TO-SORT/

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log_success() { echo -e "${GREEN}✓ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }
log_info() { echo -e "${BLUE}ℹ $1${NC}"; }
log_question() { echo -e "${CYAN}❓ $1${NC}"; }

echo "=================================================="
echo "  Basketball Team Manager"
echo "  TO-SORT Cleanup & Kategorisierung"
echo "=================================================="
echo ""

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$BASE_DIR"

# Backup
BACKUP_DIR="backups/to-sort-cleanup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR/TO-SORT"
log_success "Backup: $BACKUP_DIR"

# Backup kompletten TO-SORT Ordner
cp -r docs/TO-SORT/* "$BACKUP_DIR/TO-SORT/" 2>/dev/null || true

# Zähler
MOVED=0
SKIPPED=0

echo ""
log_info "Analysiere docs/TO-SORT/ Ordner..."
echo ""

# Datei-Kategorisierung mit Ziel-Pfaden
declare -A FILE_MAP

# Testing
FILE_MAP["ACCESSIBILITY-TESTING.md"]="docs/testing/"
FILE_MAP["TEST-FIXES-SUMMARY.md"]="docs/testing/"
FILE_MAP["TEST-GUIDE.md"]="docs/testing/"
FILE_MAP["TEST-KONZEPT.md"]="docs/testing/"

# Development
FILE_MAP["BUILD-FIXES.md"]="docs/development/"
FILE_MAP["BUILD-TROUBLESHOOTING.md"]="docs/development/"
FILE_MAP["SETUP.md"]="docs/development/"
FILE_MAP["STATUS.md"]="docs/development/"
FILE_MAP["entwicklungs-prompt.md"]="docs/development/"

# Operations - Migrations
FILE_MAP["ONBOARDING-V2-FIX.md"]="docs/operations/migrations/"
FILE_MAP["ONBOARDING-V2-UPDATE.md"]="docs/operations/migrations/"
FILE_MAP["ONBOARDING_V3_MIGRATION.md"]="docs/operations/migrations/"
FILE_MAP["REACT_ROUTER_MIGRATION.md"]="docs/operations/migrations/"
FILE_MAP["PACT-V16-UPGRADE.md"]="docs/operations/migrations/"

# Operations - Bugfixes (mit Datum)
FILE_MAP["FIX-BBBSyncService.md"]="docs/operations/bugfixes/2025-10-30-BBBSyncService.md"
FILE_MAP["PACKAGE-FIX.md"]="docs/operations/bugfixes/2025-10-30-Package.md"
FILE_MAP["VEREIN-DISCOVERY-UPDATE.md"]="docs/operations/bugfixes/2025-10-30-VereinDiscovery.md"

# Operations - Deployment
FILE_MAP["GITHUB-PAGES-SETUP.md"]="docs/operations/deployment/"
FILE_MAP["GITHUB_PAGES_OLIEEDER.md"]="docs/operations/deployment/"

# Planning - Roadmaps
FILE_MAP["IMPLEMENTATION-ROADMAP.md"]="docs/planning/roadmaps/"
FILE_MAP["RELEASE-NOTES.md"]="docs/planning/roadmaps/"
FILE_MAP["CHANGELOG.md"]="docs/planning/roadmaps/"

# Planning - Concepts
FILE_MAP["SIMPLIFIED_ONBOARDING.md"]="docs/planning/concepts/"
FILE_MAP["CRAWLER-AUTOMATION-OVERVIEW.md"]="docs/planning/concepts/"
FILE_MAP["CRAWLER-AUTOMATION.md"]="docs/planning/concepts/"
FILE_MAP["CRAWLER-BULK.md"]="docs/planning/concepts/"
FILE_MAP["CRAWLER-COMPARISON.md"]="docs/planning/concepts/"
FILE_MAP["CRAWLER-OPTIMIZATIONS.md"]="docs/planning/concepts/"
FILE_MAP["CRAWLER-QUICKSTART.md"]="docs/planning/concepts/"
FILE_MAP["CRAWLER-V2-ABLAUF.md"]="docs/planning/concepts/"
FILE_MAP["CRAWLER-V2-EXPLAINED.md"]="docs/planning/concepts/"
FILE_MAP["CRAWLER-V2-MERGE-LOGIC.md"]="docs/planning/concepts/"
FILE_MAP["CRAWLER-V2-README.md"]="docs/planning/concepts/"
FILE_MAP["CRAWLER-V2-SEQUENZ.md"]="docs/planning/concepts/"
FILE_MAP["CRAWLER-V2-STRUKTUR.md"]="docs/planning/concepts/"
FILE_MAP["CRAWLER-V2-USECASES.md"]="docs/planning/concepts/"
FILE_MAP["SPLIT-CLUBS.md"]="docs/planning/concepts/"
FILE_MAP["STATISCHE-VERBAENDE.md"]="docs/planning/concepts/"

# Planning - Requirements
FILE_MAP["datenschutzerklarung.md"]="docs/planning/requirements/"

# Archive (mit Datum)
FILE_MAP["CLEANUP-ANALYSIS.md"]="docs/archive/2025-10-30-CLEANUP-ANALYSIS.md"
FILE_MAP["COMMIT-SUMMARY.md"]="docs/archive/2025-10-30-COMMIT-SUMMARY.md"
FILE_MAP["COMMIT_GITHUB_PAGES.md"]="docs/archive/2025-10-30-COMMIT_GITHUB_PAGES.md"
FILE_MAP["COMMIT_MESSAGE.md"]="docs/archive/2025-10-30-COMMIT_MESSAGE.md"
FILE_MAP["DEPLOYMENT_COMPLETE.md"]="docs/archive/2025-10-30-DEPLOYMENT_COMPLETE.md"
FILE_MAP["DOCS-CLEANUP-COMPLETE.md"]="docs/archive/2025-10-30-DOCS-CLEANUP-COMPLETE.md"
FILE_MAP["DOCS-CLEANUP-PLAN.md"]="docs/archive/2025-10-30-DOCS-CLEANUP-PLAN.md"
FILE_MAP["GIT-COMMIT-READY.md"]="docs/archive/2025-10-30-GIT-COMMIT-READY.md"
FILE_MAP["SECURITY-NOTICE.md"]="docs/archive/2025-10-30-SECURITY-NOTICE.md"
FILE_MAP["SECURITY-UPDATE-v1.2.2.md"]="docs/archive/2025-10-30-SECURITY-UPDATE.md"
FILE_MAP["DOCUMENTATION-INDEX.md"]="docs/archive/2025-10-30-DOCUMENTATION-INDEX.md"
FILE_MAP["README Kopie.md"]="docs/archive/2025-10-30-README-Kopie.md"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Verschiebe kategorisierte Dateien..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

for source_file in "${!FILE_MAP[@]}"; do
    target_path="${FILE_MAP[$source_file]}"
    source_path="docs/TO-SORT/$source_file"
    
    if [ ! -f "$source_path" ]; then
        continue
    fi
    
    # Wenn Ziel ein Ordner ist, Dateiname anhängen
    if [[ "$target_path" == */ ]]; then
        target_full="$target_path$source_file"
    else
        target_full="$target_path"
    fi
    
    # Kategorie bestimmen
    category=$(echo "$target_path" | cut -d'/' -f2)
    
    echo "📄 $source_file"
    echo "   → $target_full"
    
    # Verschiebe Datei
    mv "$source_path" "$target_full" 2>/dev/null && {
        log_success "  ✓ Verschoben"
        MOVED=$((MOVED + 1))
    } || {
        log_warning "  ✗ Fehler beim Verschieben"
    }
    
    echo ""
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Verschiebe Unterordner..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# DBv7 Ordner → operations/migrations/
if [ -d "docs/TO-SORT/DBv7" ]; then
    log_info "DBv7/ → docs/operations/migrations/DBv7/"
    mv "docs/TO-SORT/DBv7" "docs/operations/migrations/" 2>/dev/null && {
        log_success "  ✓ Verschoben"
    } || {
        log_warning "  ✗ Ordner existiert bereits oder Fehler"
    }
fi

# Konzepte Ordner → planning/concepts/
if [ -d "docs/TO-SORT/Konzepte" ]; then
    log_info "Konzepte/ → docs/planning/concepts/Konzepte/"
    mv "docs/TO-SORT/Konzepte" "docs/planning/concepts/" 2>/dev/null && {
        log_success "  ✓ Verschoben"
    } || {
        log_warning "  ✗ Ordner existiert bereits oder Fehler"
    }
fi

# requirements Ordner → planning/requirements/
if [ -d "docs/TO-SORT/requirements" ]; then
    log_info "requirements/ → docs/planning/requirements/requirements/"
    mv "docs/TO-SORT/requirements" "docs/planning/requirements/" 2>/dev/null && {
        log_success "  ✓ Verschoben"
    } || {
        log_warning "  ✗ Ordner existiert bereits oder Fehler"
    }
fi

# userflows Ordner → planning/requirements/
if [ -d "docs/TO-SORT/userflows" ]; then
    log_info "userflows/ → docs/planning/requirements/userflows/"
    mv "docs/TO-SORT/userflows" "docs/planning/requirements/" 2>/dev/null && {
        log_success "  ✓ Verschoben"
    } || {
        log_warning "  ✗ Ordner existiert bereits oder Fehler"
    }
fi

# development Ordner prüfen
if [ -d "docs/TO-SORT/development" ]; then
    log_warning "development/ Ordner gefunden - manuell prüfen!"
    log_info "  Pfad: docs/TO-SORT/development/"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Prüfe verbleibende Dateien in TO-SORT/"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

REMAINING=$(find docs/TO-SORT -type f -name "*.md" 2>/dev/null | wc -l)

if [ "$REMAINING" -gt 0 ]; then
    log_warning "⚠️  $REMAINING Datei(en) noch in TO-SORT/"
    echo ""
    echo "Verbleibende Dateien:"
    find docs/TO-SORT -type f -name "*.md" | while read file; do
        echo "  - $(basename $file)"
    done
    echo ""
    log_info "Bitte manuell kategorisieren!"
else
    log_success "Alle Dateien kategorisiert!"
    
    # TO-SORT löschen wenn leer
    if [ -z "$(ls -A docs/TO-SORT 2>/dev/null)" ]; then
        rmdir docs/TO-SORT 2>/dev/null && {
            log_success "TO-SORT/ Ordner gelöscht (leer)"
        }
    fi
fi

echo ""
echo "=================================================="
echo "  TO-SORT Cleanup abgeschlossen!"
echo "=================================================="
echo ""
log_success "Backup: $BACKUP_DIR"
log_info "Verschoben: $MOVED Dateien"

if [ "$REMAINING" -gt 0 ]; then
    log_warning "Verbleibend: $REMAINING Dateien (siehe oben)"
fi

echo ""
echo "Nächste Schritte:"
echo "1. Prüfe die verschobenen Dateien"
echo "2. Falls Duplikate: merge-duplicates.sh ausführen"
echo "3. Verbleibende Dateien manuell kategorisieren"
echo "4. Commit: git add . && git commit -m 'docs: Sort TO-SORT files'"
echo ""
echo "=================================================="
