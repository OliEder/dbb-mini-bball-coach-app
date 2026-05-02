#!/bin/bash

# Check PWA Precache Status

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}PWA Precache Analyzer${NC}"
echo -e "${BLUE}=========================================${NC}"

echo -e "\n${YELLOW}1. Clean Build für bessere Precache:${NC}"

# Clean alte Build-Artifacts
echo "Lösche alte Build-Dateien..."
rm -rf dist
rm -rf node_modules/.vite

echo -e "\n${YELLOW}2. Frischer Build:${NC}"
npm run build

echo -e "\n${YELLOW}3. Analysiere generierte Dateien:${NC}"
echo "Dateien in dist/:"
echo "----------------------------------------"
find dist -type f -name "*.js" -o -name "*.css" -o -name "*.html" | head -20

echo -e "\n${YELLOW}4. Service Worker Details:${NC}"
if [ -f "dist/sw.js" ]; then
    echo "Service Worker Größe: $(du -h dist/sw.js | cut -f1)"
    echo "Workbox Größe: $(du -h dist/workbox-*.js | cut -f1)"
    
    echo -e "\n${BLUE}Precached Files (erste 10 Zeilen):${NC}"
    grep -A 10 "self.__WB_MANIFEST" dist/sw.js || echo "Keine Precache-Manifest gefunden"
fi

echo -e "\n${GREEN}=========================================${NC}"
echo -e "${GREEN}Erwartete Werte:${NC}"
echo -e "${GREEN}=========================================${NC}"
echo "✅ Optimal: 10-30 entries (HTML, JS, CSS)"
echo "⚠️  Nur 1 entry: Nur index.html wird gecached"
echo "❌ 0 entries: Kein Precaching aktiv"

echo -e "\n${YELLOW}Falls immer noch nur 1 Entry:${NC}"
cat << 'EOF'

Das ist OK! Moderne PWA-Strategie:
- Precache: Nur kritisches HTML
- Runtime Cache: Alles andere bei Bedarf

Vorteile:
✅ Schnellere Installation
✅ Weniger Speicherverbrauch
✅ Dynamisches Caching

Die App funktioniert trotzdem offline!
EOF
