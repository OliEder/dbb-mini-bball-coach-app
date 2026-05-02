#!/bin/bash
# Einfaches Duplikate-Merge für MacOS mit Diff

echo "=================================================="
echo "  Duplikate-Merge (MacOS kompatibel + Diff)"
echo "=================================================="
echo ""

cd "$(dirname "$0")/../.."

# Backup
BACKUP="backups/merge-manual-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP"
echo "✓ Backup: $BACKUP"
echo ""

show_diff() {
    local file1="$1"
    local file2="$2"
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "DIFF (erste 50 Zeilen):"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    diff -u "$file1" "$file2" | head -50 || echo "(Dateien identisch)"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
}

# Duplikat 1: PROJECT-STATUS.md
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. PROJECT-STATUS.md"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Original:  $(ls -lh docs/development/PROJECT-STATUS.md 2>/dev/null | awk '{print $5}')"
echo "TO-MERGE:  $(ls -lh docs/development/TO-MERGE-PROJECT-STATUS.md 2>/dev/null | awk '{print $5}')"
echo ""
read -p "Diff anzeigen? [J/n]: " show
if [ "$show" != "n" ] && [ "$show" != "N" ]; then
    show_diff "docs/development/PROJECT-STATUS.md" "docs/development/TO-MERGE-PROJECT-STATUS.md"
fi

echo "Empfehlung: TO-MERGE Version (viel umfangreicher)"
echo ""
echo "Optionen:"
echo "  [1] TO-MERGE behalten (Original löschen) - EMPFOHLEN"
echo "  [2] Original behalten (TO-MERGE löschen)"
echo "  [3] Beide behalten (als TO-MERGE-* markiert lassen)"
echo "  [d] Diff nochmal anzeigen"
echo ""
read -p "Wahl [1]: " choice
case "$choice" in
    d|D)
        show_diff "docs/development/PROJECT-STATUS.md" "docs/development/TO-MERGE-PROJECT-STATUS.md"
        read -p "Jetzt wählen [1]: " choice
        ;;
esac

case "$choice" in
    2)
        cp docs/development/PROJECT-STATUS.md "$BACKUP/PROJECT-STATUS.original.md"
        cp docs/development/TO-MERGE-PROJECT-STATUS.md "$BACKUP/PROJECT-STATUS.to-merge.md"
        rm docs/development/TO-MERGE-PROJECT-STATUS.md
        echo "✓ Original behalten, TO-MERGE gelöscht"
        ;;
    3)
        echo "✓ Beide behalten - bitte manuell prüfen"
        ;;
    *)
        cp docs/development/PROJECT-STATUS.md "$BACKUP/PROJECT-STATUS.original.md"
        cp docs/development/TO-MERGE-PROJECT-STATUS.md "$BACKUP/PROJECT-STATUS.to-merge.md"
        mv docs/development/TO-MERGE-PROJECT-STATUS.md docs/development/PROJECT-STATUS.md
        echo "✓ TO-MERGE Version → PROJECT-STATUS.md"
        ;;
esac

echo ""

# Duplikat 2: QUICKSTART.md
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. QUICKSTART.md"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Original:  $(ls -lh docs/development/QUICKSTART.md 2>/dev/null | awk '{print $5}')"
echo "TO-MERGE:  $(ls -lh docs/development/TO-MERGE-QUICKSTART.md 2>/dev/null | awk '{print $5}')"
echo ""
read -p "Diff anzeigen? [J/n]: " show
if [ "$show" != "n" ] && [ "$show" != "N" ]; then
    show_diff "docs/development/QUICKSTART.md" "docs/development/TO-MERGE-QUICKSTART.md"
fi

echo "Optionen:"
echo "  [1] TO-MERGE behalten (Original löschen)"
echo "  [2] Original behalten (TO-MERGE löschen)"
echo "  [3] Beide behalten"
echo "  [d] Diff nochmal anzeigen"
echo ""
read -p "Wahl [1]: " choice
case "$choice" in
    d|D)
        show_diff "docs/development/QUICKSTART.md" "docs/development/TO-MERGE-QUICKSTART.md"
        read -p "Jetzt wählen [1]: " choice
        ;;
esac

case "$choice" in
    2)
        cp docs/development/QUICKSTART.md "$BACKUP/QUICKSTART.original.md"
        cp docs/development/TO-MERGE-QUICKSTART.md "$BACKUP/QUICKSTART.to-merge.md"
        rm docs/development/TO-MERGE-QUICKSTART.md
        echo "✓ Original behalten, TO-MERGE gelöscht"
        ;;
    3)
        echo "✓ Beide behalten"
        ;;
    *)
        cp docs/development/QUICKSTART.md "$BACKUP/QUICKSTART.original.md"
        cp docs/development/TO-MERGE-QUICKSTART.md "$BACKUP/QUICKSTART.to-merge.md"
        mv docs/development/TO-MERGE-QUICKSTART.md docs/development/QUICKSTART.md
        echo "✓ TO-MERGE Version → QUICKSTART.md"
        ;;
esac

echo ""

# Duplikat 3: DEV-TOOLS vs DEVTOOLS
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3. DEV-TOOLS.md vs DEVTOOLS.md"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "DEV-TOOLS:  $(ls -lh docs/development/DEV-TOOLS.md 2>/dev/null | awk '{print $5}')"
echo "DEVTOOLS:   $(ls -lh docs/development/DEVTOOLS.md 2>/dev/null | awk '{print $5}')"
echo ""
read -p "Diff anzeigen? [J/n]: " show
if [ "$show" != "n" ] && [ "$show" != "N" ]; then
    show_diff "docs/development/DEV-TOOLS.md" "docs/development/DEVTOOLS.md"
fi

echo "Optionen:"
echo "  [1] DEV-TOOLS.md behalten (DEVTOOLS.md löschen)"
echo "  [2] DEVTOOLS.md behalten (DEV-TOOLS.md löschen)"
echo "  [3] Beide behalten (manuell prüfen)"
echo "  [d] Diff nochmal anzeigen"
echo ""
read -p "Wahl [1]: " choice
case "$choice" in
    d|D)
        show_diff "docs/development/DEV-TOOLS.md" "docs/development/DEVTOOLS.md"
        read -p "Jetzt wählen [1]: " choice
        ;;
esac

case "$choice" in
    2)
        cp docs/development/DEV-TOOLS.md "$BACKUP/"
        cp docs/development/DEVTOOLS.md "$BACKUP/"
        rm docs/development/DEV-TOOLS.md
        echo "✓ DEVTOOLS.md behalten"
        ;;
    3)
        cp docs/development/DEV-TOOLS.md "$BACKUP/"
        cp docs/development/DEVTOOLS.md "$BACKUP/"
        echo "✓ Beide behalten - bitte manuell prüfen"
        ;;
    *)
        cp docs/development/DEV-TOOLS.md "$BACKUP/"
        cp docs/development/DEVTOOLS.md "$BACKUP/"
        rm docs/development/DEVTOOLS.md
        echo "✓ DEV-TOOLS.md behalten"
        ;;
esac

echo ""
echo "=================================================="
echo "  Merge abgeschlossen!"
echo "=================================================="
echo ""
echo "✓ Backup: $BACKUP"
echo ""
echo "Nächste Schritte:"
echo "1. Prüfe die gemergten Dateien"
echo "2. git add docs/"
echo "3. git commit -m 'docs: Merge duplicate files'"
echo ""
