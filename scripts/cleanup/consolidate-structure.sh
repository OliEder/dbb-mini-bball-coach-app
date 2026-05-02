#!/bin/bash

# Basketball Team Manager - Struktur-Konsolidierungs-Script V2.0
# Zweck: Migriert Dateien gemäß PROJECT-STRUCTURE.md v2.0 (Option C - Hybrid)

set -e

# Farben
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Funktionen
log_success() { echo -e "${GREEN}✓ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }
log_error() { echo -e "${RED}✗ $1${NC}"; }
log_info() { echo -e "${BLUE}ℹ $1${NC}"; }

# Header
echo "=================================================="
echo "  Basketball Team Manager"
echo "  Struktur-Konsolidierung v2.0"
echo "  (Option C - Hybrid Structure)"
echo "=================================================="
echo ""

# Base directory
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$BASE_DIR"

# Backup erstellen
BACKUP_DIR="backups/structure-consolidation-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
log_success "Backup-Verzeichnis erstellt: $BACKUP_DIR"

# 1. Neue Docs-Unterordner erstellen (Option C)
echo ""
echo "Schritt 1: Erstelle neue Docs-Struktur (Option C - Hybrid)..."

# Planning
mkdir -p docs/planning/requirements
mkdir -p docs/planning/roadmaps
mkdir -p docs/planning/concepts

# Specifications
mkdir -p docs/specifications/api
mkdir -p docs/specifications/data-models
mkdir -p docs/specifications/interfaces

# Architecture
mkdir -p docs/architecture/decisions
mkdir -p docs/architecture/diagrams
mkdir -p docs/architecture/patterns

# Development (existiert bereits)
mkdir -p docs/development

# Testing (existiert bereits)
mkdir -p docs/testing

# Operations
mkdir -p docs/operations/migrations
mkdir -p docs/operations/bugfixes
mkdir -p docs/operations/deployment

# Archive (existiert bereits)
mkdir -p docs/archive

log_success "Neue Docs-Struktur erstellt"

# 2. Scripts-Unterordner erstellen
echo ""
echo "Schritt 2: Erstelle Scripts-Unterordner..."
mkdir -p scripts/build
mkdir -p scripts/testing
mkdir -p scripts/cleanup
mkdir -p scripts/development
log_success "Scripts-Unterordner erstellt"

# 3. Dokumentation migrieren (ROOT → docs/)
echo ""
echo "Schritt 3: Migriere Dokumentation von ROOT nach docs/..."

# Planning - Roadmaps
if [ -f "IMPLEMENTATION-ROADMAP.md" ]; then
    cp "IMPLEMENTATION-ROADMAP.md" "$BACKUP_DIR/"
    mv "IMPLEMENTATION-ROADMAP.md" "docs/planning/roadmaps/IMPLEMENTATION-ROADMAP.md"
    log_success "→ docs/planning/roadmaps/IMPLEMENTATION-ROADMAP.md"
fi

# Planning - Concepts
if [ -f "SIMPLIFIED_ONBOARDING.md" ]; then
    cp "SIMPLIFIED_ONBOARDING.md" "$BACKUP_DIR/"
    mv "SIMPLIFIED_ONBOARDING.md" "docs/planning/concepts/SIMPLIFIED_ONBOARDING.md"
    log_success "→ docs/planning/concepts/SIMPLIFIED_ONBOARDING.md"
fi

# Development Docs
declare -a DEV_DOCS=(
    "BUILD-FIXES.md"
    "BUILD-TROUBLESHOOTING.md"
    "SETUP.md"
    "STATUS.md"
)

for doc in "${DEV_DOCS[@]}"; do
    if [ -f "$doc" ]; then
        cp "$doc" "$BACKUP_DIR/" 2>/dev/null || true
        mv "$doc" "docs/development/$doc"
        log_success "→ docs/development/$doc"
    fi
done

# Testing Docs
declare -a TEST_DOCS=(
    "TEST-GUIDE.md"
    "TEST-FIXES-SUMMARY.md"
    "ACCESSIBILITY-TESTING.md"
)

for doc in "${TEST_DOCS[@]}"; do
    if [ -f "$doc" ]; then
        cp "$doc" "$BACKUP_DIR/" 2>/dev/null || true
        mv "$doc" "docs/testing/$doc"
        log_success "→ docs/testing/$doc"
    fi
done

# Operations - Migrations
declare -a MIGRATION_DOCS=(
    "REACT_ROUTER_MIGRATION.md"
    "ONBOARDING-V2-FIX.md"
    "ONBOARDING-V2-UPDATE.md"
)

for doc in "${MIGRATION_DOCS[@]}"; do
    if [ -f "$doc" ]; then
        cp "$doc" "$BACKUP_DIR/" 2>/dev/null || true
        mv "$doc" "docs/operations/migrations/$doc"
        log_success "→ docs/operations/migrations/$doc"
    fi
done

# Operations - Bugfixes (mit Datum)
DATE_PREFIX=$(date +%Y-%m-%d)
declare -a BUGFIX_DOCS=(
    "FIX-BBBSyncService.md"
    "PACKAGE-FIX.md"
    "VEREIN-DISCOVERY-UPDATE.md"
)

for doc in "${BUGFIX_DOCS[@]}"; do
    if [ -f "$doc" ]; then
        cp "$doc" "$BACKUP_DIR/" 2>/dev/null || true
        NEW_NAME="${DATE_PREFIX}-${doc}"
        mv "$doc" "docs/operations/bugfixes/$NEW_NAME"
        log_success "→ docs/operations/bugfixes/$NEW_NAME"
    fi
done

# Operations - Deployment
if [ -f "GITHUB-PAGES-SETUP.md" ]; then
    cp "GITHUB-PAGES-SETUP.md" "$BACKUP_DIR/" 2>/dev/null || true
    mv "GITHUB-PAGES-SETUP.md" "docs/operations/deployment/GITHUB-PAGES-SETUP.md"
    log_success "→ docs/operations/deployment/GITHUB-PAGES-SETUP.md"
fi

# Archive (veraltete Docs)
declare -a ARCHIVE_DOCS=(
    "DEPLOYMENT_COMPLETE.md"
    "COMMIT-SUMMARY.md"
    "CLEANUP-ANALYSIS.md"
)

for doc in "${ARCHIVE_DOCS[@]}"; do
    if [ -f "$doc" ]; then
        cp "$doc" "$BACKUP_DIR/" 2>/dev/null || true
        NEW_NAME="${DATE_PREFIX}-${doc}"
        mv "$doc" "docs/archive/$NEW_NAME"
        log_success "→ docs/archive/$NEW_NAME (archiviert)"
    fi
done

# 4. Bestehende docs/development/ Dateien neu kategorisieren
echo ""
echo "Schritt 4: Kategorisiere bestehende docs/development/ Dateien..."

# Migrations aus development/ → operations/migrations/
declare -a DEV_TO_MIGRATIONS=(
    "MIGRATION-V6-STATUS.md"
    "V6-MIGRATION-COMPLETE.md"
    "CHAT-HANDOVER-V6.md"
    "REFACTORING-V6-NOTES.md"
)

for doc in "${DEV_TO_MIGRATIONS[@]}"; do
    if [ -f "docs/development/$doc" ]; then
        cp "docs/development/$doc" "$BACKUP_DIR/" 2>/dev/null || true
        mv "docs/development/$doc" "docs/operations/migrations/$doc"
        log_success "→ docs/operations/migrations/$doc (verschoben)"
    fi
done

# Planning aus development/ → planning/roadmaps/
if [ -f "docs/development/MULTI-TEAM-SUPPORT-PLAN.md" ]; then
    cp "docs/development/MULTI-TEAM-SUPPORT-PLAN.md" "$BACKUP_DIR/" 2>/dev/null || true
    mv "docs/development/MULTI-TEAM-SUPPORT-PLAN.md" "docs/planning/roadmaps/MULTI-TEAM-SUPPORT-PLAN.md"
    log_success "→ docs/planning/roadmaps/MULTI-TEAM-SUPPORT-PLAN.md (verschoben)"
fi

# 5. Duplikate-Warnung (NICHT automatisch löschen!)
echo ""
echo "Schritt 5: Prüfe auf Duplikate..."

DUPLICATES_FOUND=0

# PROJECT-STATUS.md
if [ -f "docs/PROJECT-STATUS.md" ] && [ -f "docs/development/PROJECT-STATUS.md" ]; then
    log_warning "Duplikat gefunden: PROJECT-STATUS.md"
    echo "  - docs/PROJECT-STATUS.md"
    echo "  - docs/development/PROJECT-STATUS.md"
    log_info "→ Bitte 'merge-duplicates.sh' ausführen!"
    DUPLICATES_FOUND=$((DUPLICATES_FOUND + 1))
fi

# TEST-CONSOLIDATION-LOG.md
if [ -f "docs/TEST-CONSOLIDATION-LOG.md" ] && [ -f "docs/testing/TEST-CONSOLIDATION-LOG.md" ]; then
    log_warning "Duplikat gefunden: TEST-CONSOLIDATION-LOG.md"
    echo "  - docs/TEST-CONSOLIDATION-LOG.md"
    echo "  - docs/testing/TEST-CONSOLIDATION-LOG.md"
    log_info "→ Bitte 'merge-duplicates.sh' ausführen!"
    DUPLICATES_FOUND=$((DUPLICATES_FOUND + 1))
fi

if [ $DUPLICATES_FOUND -gt 0 ]; then
    echo ""
    log_warning "⚠️  $DUPLICATES_FOUND Duplikat(e) gefunden!"
    log_info "Führe aus: bash scripts/cleanup/merge-duplicates.sh"
fi

# 6. Scripts migrieren (ROOT → scripts/)
echo ""
echo "Schritt 6: Migriere Scripts..."

# Build Scripts
declare -a BUILD_SCRIPTS=(
    "deploy.sh"
    "fix-build-errors.sh"
    "prepare-commit.sh"
    "setup-github-pages.sh"
)

for script in "${BUILD_SCRIPTS[@]}"; do
    if [ -f "$script" ]; then
        cp "$script" "$BACKUP_DIR/" 2>/dev/null || true
        mv "$script" "scripts/build/$script"
        chmod +x "scripts/build/$script"
        log_success "→ scripts/build/$script"
    fi
done

# Testing Scripts
declare -a TEST_SCRIPTS=(
    "run-tests.sh"
    "run-tests-simple.sh"
    "analyze-test-failures.sh"
    "analyze-tests.sh"
    "watch-test-results.sh"
    "test-settings.sh"
)

for script in "${TEST_SCRIPTS[@]}"; do
    if [ -f "$script" ]; then
        cp "$script" "$BACKUP_DIR/" 2>/dev/null || true
        mv "$script" "scripts/testing/$script"
        chmod +x "scripts/testing/$script"
        log_success "→ scripts/testing/$script"
    fi
done

# Cleanup Scripts
declare -a CLEANUP_SCRIPTS=(
    "cleanup-all.sh"
    "cleanup-js-files.sh"
    "cleanup-js.sh"
    "cleanup-public.sh"
    "cleanup-sw.sh"
    "clean-restart.sh"
    "force-cleanup.sh"
)

for script in "${CLEANUP_SCRIPTS[@]}"; do
    if [ -f "$script" ]; then
        cp "$script" "$BACKUP_DIR/" 2>/dev/null || true
        mv "$script" "scripts/cleanup/$script"
        chmod +x "scripts/cleanup/$script"
        log_success "→ scripts/cleanup/$script"
    fi
done

# Development Scripts
declare -a DEV_SCRIPTS=(
    "debug-npm.sh"
    "start-monitor.sh"
    "fix-npm-warnings.sh"
)

for script in "${DEV_SCRIPTS[@]}"; do
    if [ -f "$script" ]; then
        cp "$script" "$BACKUP_DIR/" 2>/dev/null || true
        mv "$script" "scripts/development/$script"
        chmod +x "scripts/development/$script"
        log_success "→ scripts/development/$script"
    fi
done

# 7. Zusammenfassung
echo ""
echo "=================================================="
echo "  Migration abgeschlossen!"
echo "=================================================="
echo ""
log_success "Backup erstellt in: $BACKUP_DIR"
log_success "Neue Struktur (Option C - Hybrid) angelegt"
echo ""

if [ $DUPLICATES_FOUND -gt 0 ]; then
    log_warning "⚠️  WICHTIG: $DUPLICATES_FOUND Duplikat(e) gefunden!"
    echo ""
    echo "Nächster Schritt:"
    echo "  bash scripts/cleanup/merge-duplicates.sh"
    echo ""
fi

echo "Weitere Schritte:"
echo "1. Prüfe, ob alle Dateien korrekt verschoben wurden"
echo "2. Falls Duplikate vorhanden: merge-duplicates.sh ausführen"
echo "3. Teste, ob Scripts noch funktionieren (Pfad-Anpassungen?)"
echo "4. Aktualisiere Dokumentation, die auf verschobene Dateien verweist"
echo "5. Commit die Änderungen"
echo ""
echo "Bei Problemen: Backup in $BACKUP_DIR verfügbar"
echo "=================================================="
