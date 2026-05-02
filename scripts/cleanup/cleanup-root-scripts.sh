#!/bin/bash

# Basketball Team Manager - Vollständiges ROOT Cleanup
# Zweck: Verschiebt/Archiviert ALLE nicht-essentiellen Dateien aus dem ROOT

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

log_success() { echo -e "${GREEN}✓ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }
log_error() { echo -e "${RED}✗ $1${NC}"; }
log_info() { echo -e "${BLUE}ℹ $1${NC}"; }

echo "=================================================="
echo "  Basketball Team Manager"
echo "  Vollständiges ROOT Cleanup"
echo "=================================================="
echo ""

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$BASE_DIR"

# Backup
BACKUP_DIR="backups/root-cleanup-full-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
log_success "Backup: $BACKUP_DIR"

# Zähler
MOVED=0
ARCHIVED=0

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. Verschiebe Scripts nach scripts/"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Development Scripts (Fix/Install/Upgrade)
declare -A DEV_SCRIPTS=(
    ["fix-console-correct.js"]="scripts/development/"
    ["fix-find-stores.js"]="scripts/development/"
    ["fix-indexeddb-direct.js"]="scripts/development/"
    ["fix-team-id.js"]="scripts/development/"
    ["fix-install.sh"]="scripts/development/"
    ["fix-loading-dashboard.sh"]="scripts/development/"
    ["fix-pwa-glob-warning.sh"]="scripts/development/"
    ["install-pact.sh"]="scripts/development/"
    ["remove-pact.sh"]="scripts/development/"
    ["upgrade-pact.sh"]="scripts/development/"
    ["security-fix.sh"]="scripts/development/"
    ["analyze-pwa-cache.sh"]="scripts/development/"
)

for file in "${!DEV_SCRIPTS[@]}"; do
    target="${DEV_SCRIPTS[$file]}"
    if [ -f "$file" ]; then
        cp "$file" "$BACKUP_DIR/" 2>/dev/null || true
        mv "$file" "$target$file"
        [ "${file##*.}" = "sh" ] && chmod +x "$target$file"
        log_success "$file → $target"
        MOVED=$((MOVED + 1))
    fi
done

# Build Scripts
declare -A BUILD_SCRIPTS=(
    ["quick-build-fix.sh"]="scripts/build/"
)

for file in "${!BUILD_SCRIPTS[@]}"; do
    target="${BUILD_SCRIPTS[$file]}"
    if [ -f "$file" ]; then
        cp "$file" "$BACKUP_DIR/" 2>/dev/null || true
        mv "$file" "$target$file"
        chmod +x "$target$file"
        log_success "$file → $target"
        MOVED=$((MOVED + 1))
    fi
done

# Cleanup Scripts
declare -A CLEANUP_SCRIPTS=(
    ["fix-glob-nuclear.sh"]="scripts/cleanup/"
    ["upgrade-and-cleanup.sh"]="scripts/cleanup/"
)

for file in "${!CLEANUP_SCRIPTS[@]}"; do
    target="${CLEANUP_SCRIPTS[$file]}"
    if [ -f "$file" ]; then
        cp "$file" "$BACKUP_DIR/" 2>/dev/null || true
        mv "$file" "$target$file"
        chmod +x "$target$file"
        log_success "$file → $target"
        MOVED=$((MOVED + 1))
    fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. Archiviere Backup-Configs"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Backup Vite Configs
mkdir -p "backups/old-configs"

declare -a BACKUP_CONFIGS=(
    "vite.config.aggressive-cache.ts"
    "vite.config.backup.ts"
    "vite.config.minimal-pwa.ts"
    "vite.config.minimal.ts"
    "vite.config.d.ts"
    "vite.config.js"
)

for file in "${BACKUP_CONFIGS[@]}"; do
    if [ -f "$file" ]; then
        cp "$file" "$BACKUP_DIR/" 2>/dev/null || true
        mv "$file" "backups/old-configs/$file"
        log_success "$file → backups/old-configs/ (archiviert)"
        ARCHIVED=$((ARCHIVED + 1))
    fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3. Verschiebe Test/Prototype-Dateien"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test HTML Dateien
mkdir -p "prototypes/test-pages"

declare -a TEST_FILES=(
    "test-bbb-sync.html"
    "index-manual-sw.html"
)

for file in "${TEST_FILES[@]}"; do
    if [ -f "$file" ]; then
        cp "$file" "$BACKUP_DIR/" 2>/dev/null || true
        mv "$file" "prototypes/test-pages/$file"
        log_success "$file → prototypes/test-pages/"
        MOVED=$((MOVED + 1))
    fi
done

# Temporäre Fixes
if [ -f "temp-fetch-fix.ts" ]; then
    cp "temp-fetch-fix.ts" "$BACKUP_DIR/" 2>/dev/null || true
    mv "temp-fetch-fix.ts" "backups/old-configs/temp-fetch-fix.ts"
    log_success "temp-fetch-fix.ts → backups/old-configs/ (archiviert)"
    ARCHIVED=$((ARCHIVED + 1))
fi

# Test Output
if [ -f "test-output.txt" ]; then
    cp "test-output.txt" "$BACKUP_DIR/" 2>/dev/null || true
    mv "test-output.txt" "test-data/test-output.txt"
    log_success "test-output.txt → test-data/"
    MOVED=$((MOVED + 1))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4. Prüfe verbleibende nicht-essentielle Dateien"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Liste essentielle Dateien (sollen im ROOT bleiben)
declare -a ESSENTIAL=(
    "package.json"
    "package-lock.json"
    "tsconfig.json"
    "tsconfig.node.json"
    "tsconfig.tsbuildinfo"
    "tsconfig.node.tsbuildinfo"
    "vite.config.ts"
    "vitest.config.ts"
    "playwright.config.ts"
    "tailwind.config.js"
    "postcss.config.js"
    "eslint.config.js"
    ".gitignore"
    ".rebuild-trigger"
    "index.html"
    "README.md"
    "PROJECT-STRUCTURE.md"
)

# Finde verbleibende Dateien (keine Ordner, keine versteckten, keine essentiellen)
echo "Verbleibende nicht-essentielle Dateien im ROOT:"
echo ""

REMAINING=0
while IFS= read -r -d '' file; do
    basename=$(basename "$file")
    
    # Prüfe ob essentiell
    is_essential=false
    for essential in "${ESSENTIAL[@]}"; do
        if [ "$basename" = "$essential" ]; then
            is_essential=true
            break
        fi
    done
    
    if [ "$is_essential" = false ]; then
        log_warning "  $basename"
        REMAINING=$((REMAINING + 1))
    fi
done < <(find . -maxdepth 1 -type f ! -name ".*" -print0)

if [ $REMAINING -gt 0 ]; then
    echo ""
    log_warning "⚠️  $REMAINING Datei(en) noch im ROOT - bitte manuell prüfen!"
else
    echo ""
    log_success "Keine verbleibenden nicht-essentiellen Dateien!"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5. Root-Struktur nach Cleanup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "Dateien im ROOT:"
ls -1 | grep -v "^\." | head -20

echo ""
echo "=================================================="
echo "  Cleanup abgeschlossen!"
echo "=================================================="
echo ""
log_success "Backup: $BACKUP_DIR"
log_info "Verschoben: $MOVED Dateien"
log_info "Archiviert: $ARCHIVED Dateien"

if [ $REMAINING -gt 0 ]; then
    log_warning "Verbleibend: $REMAINING Dateien (siehe oben)"
fi

echo ""
echo "Nächste Schritte:"
echo "1. Prüfe, ob alles korrekt verschoben wurde"
echo "2. Teste, ob die Anwendung noch funktioniert"
echo "3. Bei Problemen: Backup in $BACKUP_DIR"
echo "4. Commit: git add . && git commit -m 'chore: Clean up root directory'"
echo ""
echo "=================================================="
