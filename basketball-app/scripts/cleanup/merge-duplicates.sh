#!/bin/bash

# Basketball Team Manager - Intelligentes Duplikate-Merge-System
# Zweck: Findet Duplikate, vergleicht sie und bietet Merge-Optionen

set -e

# Farben
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Funktionen
log_success() { echo -e "${GREEN}✓ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }
log_error() { echo -e "${RED}✗ $1${NC}"; }
log_info() { echo -e "${BLUE}ℹ $1${NC}"; }
log_question() { echo -e "${CYAN}❓ $1${NC}"; }

# Header
echo "=================================================="
echo "  Basketball Team Manager"
echo "  Intelligentes Duplikate-Merge-System"
echo "=================================================="
echo ""

# Base directory
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$BASE_DIR"

# Backup erstellen
BACKUP_DIR="backups/merge-duplicates-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
log_success "Backup-Verzeichnis erstellt: $BACKUP_DIR"

# Temporäres Verzeichnis für Merge-Operationen
TEMP_DIR="$BACKUP_DIR/temp"
mkdir -p "$TEMP_DIR"

# Duplikate-Liste (basierend auf PROJECT-STRUCTURE.md)
declare -A DUPLICATES=(
    ["PROJECT-STATUS.md"]="docs/PROJECT-STATUS.md docs/development/PROJECT-STATUS.md"
    ["TEST-CONSOLIDATION-LOG.md"]="docs/TEST-CONSOLIDATION-LOG.md docs/testing/TEST-CONSOLIDATION-LOG.md"
)

# Funktionen
compare_files() {
    local file1="$1"
    local file2="$2"
    
    if [ ! -f "$file1" ]; then
        echo "MISSING_1"
        return
    fi
    
    if [ ! -f "$file2" ]; then
        echo "MISSING_2"
        return
    fi
    
    # Sind die Dateien identisch?
    if cmp -s "$file1" "$file2"; then
        echo "IDENTICAL"
        return
    fi
    
    echo "DIFFERENT"
}

get_file_info() {
    local file="$1"
    
    if [ ! -f "$file" ]; then
        echo "Existiert nicht"
        return
    fi
    
    local size=$(du -h "$file" | cut -f1)
    local lines=$(wc -l < "$file")
    local modified=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M" "$file" 2>/dev/null || stat -c "%y" "$file" | cut -d'.' -f1)
    
    echo "  Größe: $size | Zeilen: $lines | Geändert: $modified"
}

show_diff() {
    local file1="$1"
    local file2="$2"
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "DIFF zwischen den Dateien:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    diff -u "$file1" "$file2" | head -100 || true
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
}

merge_files() {
    local file1="$1"
    local file2="$2"
    local target="$3"
    local strategy="$4"
    
    case "$strategy" in
        "keep1")
            cp "$file1" "$target"
            log_success "Datei 1 behalten: $file1 → $target"
            ;;
        "keep2")
            cp "$file2" "$target"
            log_success "Datei 2 behalten: $file2 → $target"
            ;;
        "concat")
            echo "# Merged File: $(date)" > "$target"
            echo "" >> "$target"
            echo "## Content from: $file1" >> "$target"
            echo "" >> "$target"
            cat "$file1" >> "$target"
            echo "" >> "$target"
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >> "$target"
            echo "" >> "$target"
            echo "## Content from: $file2" >> "$target"
            echo "" >> "$target"
            cat "$file2" >> "$target"
            log_success "Dateien konkateniert: $target"
            log_warning "⚠️  ACHTUNG: Manuelle Nachbearbeitung erforderlich!"
            ;;
        "manual")
            log_info "Öffne Editor für manuelles Merge..."
            # Kopiere beide Dateien nebeneinander
            cp "$file1" "$TEMP_DIR/$(basename $file1).1"
            cp "$file2" "$TEMP_DIR/$(basename $file2).2"
            # Öffne in VS Code (falls verfügbar)
            if command -v code &> /dev/null; then
                code --diff "$file1" "$file2"
                log_info "VS Code Diff geöffnet. Bitte manuell mergen und in $target speichern."
            else
                log_warning "VS Code nicht gefunden. Bitte manuell mergen:"
                echo "  Datei 1: $file1"
                echo "  Datei 2: $file2"
                echo "  Ziel: $target"
            fi
            read -p "Drücke Enter wenn Merge abgeschlossen ist..."
            ;;
    esac
}

# Hauptlogik
echo ""
echo "Schritt 1: Suche nach Duplikaten..."
echo ""

FOUND_DUPLICATES=0

for basename in "${!DUPLICATES[@]}"; do
    files=(${DUPLICATES[$basename]})
    file1="${files[0]}"
    file2="${files[1]}"
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📄 Duplikat gefunden: $basename"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    # Prüfe ob Dateien existieren
    if [ ! -f "$file1" ] && [ ! -f "$file2" ]; then
        log_warning "Beide Dateien existieren nicht. Überspringe."
        continue
    fi
    
    if [ ! -f "$file1" ]; then
        log_warning "Datei 1 existiert nicht: $file1"
        log_info "Nur Datei 2 vorhanden: $file2"
        continue
    fi
    
    if [ ! -f "$file2" ]; then
        log_warning "Datei 2 existiert nicht: $file2"
        log_info "Nur Datei 1 vorhanden: $file1"
        continue
    fi
    
    FOUND_DUPLICATES=$((FOUND_DUPLICATES + 1))
    
    # Zeige Datei-Infos
    echo "Datei 1: $file1"
    get_file_info "$file1"
    echo ""
    echo "Datei 2: $file2"
    get_file_info "$file2"
    echo ""
    
    # Vergleiche Dateien
    comparison=$(compare_files "$file1" "$file2")
    
    case "$comparison" in
        "IDENTICAL")
            log_success "Dateien sind identisch!"
            echo ""
            log_question "Was möchtest du tun?"
            echo "  [1] Datei 1 behalten, Datei 2 löschen (Standard)"
            echo "  [2] Datei 2 behalten, Datei 1 löschen"
            echo "  [b] Beide behalten (keine Änderung)"
            echo "  [s] Überspringen"
            echo ""
            read -p "Deine Wahl [1]: " choice
            choice=${choice:-1}
            
            case "$choice" in
                1)
                    cp "$file1" "$BACKUP_DIR/$(basename $file1).backup"
                    cp "$file2" "$BACKUP_DIR/$(basename $file2).backup"
                    rm "$file2"
                    log_success "Datei 2 gelöscht: $file2"
                    ;;
                2)
                    cp "$file1" "$BACKUP_DIR/$(basename $file1).backup"
                    cp "$file2" "$BACKUP_DIR/$(basename $file2).backup"
                    rm "$file1"
                    log_success "Datei 1 gelöscht: $file1"
                    ;;
                b)
                    log_info "Beide Dateien behalten"
                    ;;
                s)
                    log_info "Übersprungen"
                    ;;
            esac
            ;;
            
        "DIFFERENT")
            log_warning "Dateien sind UNTERSCHIEDLICH!"
            
            # Zeige Diff
            show_diff "$file1" "$file2"
            
            echo ""
            log_question "Merge-Strategie wählen:"
            echo "  [1] Datei 1 behalten (neuere Struktur)"
            echo "  [2] Datei 2 behalten (ältere Struktur)"
            echo "  [c] Konkatenieren (beide Inhalte zusammenfügen)"
            echo "  [m] Manuelles Merge (Editor öffnen)"
            echo "  [d] Diff nochmal anzeigen"
            echo "  [b] Beide behalten (keine Änderung)"
            echo "  [s] Überspringen"
            echo ""
            read -p "Deine Wahl [m]: " choice
            choice=${choice:-m}
            
            # Backup erstellen
            cp "$file1" "$BACKUP_DIR/$(basename $file1).1.backup"
            cp "$file2" "$BACKUP_DIR/$(basename $file2).2.backup"
            
            case "$choice" in
                1)
                    merge_files "$file1" "$file2" "$file2" "keep1"
                    rm "$file1" 2>/dev/null || true
                    ;;
                2)
                    merge_files "$file1" "$file2" "$file2" "keep2"
                    rm "$file1" 2>/dev/null || true
                    ;;
                c)
                    merge_files "$file1" "$file2" "$file2" "concat"
                    rm "$file1" 2>/dev/null || true
                    log_warning "⚠️  Bitte Datei manuell nachbearbeiten: $file2"
                    ;;
                m)
                    merge_files "$file1" "$file2" "$file2" "manual"
                    ;;
                d)
                    show_diff "$file1" "$file2"
                    # Frage nochmal
                    read -p "Merge-Strategie [m]: " choice
                    choice=${choice:-m}
                    case "$choice" in
                        1|2|c|m) merge_files "$file1" "$file2" "$file2" "keep$choice" ;;
                        b) log_info "Beide behalten" ;;
                        s) log_info "Übersprungen" ;;
                    esac
                    ;;
                b)
                    log_info "Beide Dateien behalten"
                    ;;
                s)
                    log_info "Übersprungen"
                    ;;
            esac
            ;;
    esac
    
    echo ""
done

# Zusammenfassung
echo ""
echo "=================================================="
echo "  Merge abgeschlossen!"
echo "=================================================="
echo ""
log_success "Backup erstellt in: $BACKUP_DIR"
log_info "Gefundene Duplikate: $FOUND_DUPLICATES"
echo ""
echo "Nächste Schritte:"
echo "1. Prüfe die Merge-Ergebnisse"
echo "2. Bei Bedarf: Manuelle Nachbearbeitung"
echo "3. Teste die Anwendung"
echo "4. Commit die Änderungen"
echo ""
echo "Bei Problemen: Backup in $BACKUP_DIR verfügbar"
echo "=================================================="
