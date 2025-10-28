#!/bin/bash

# Fix für PWA Glob Warning

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}PWA Glob Warning Fix${NC}"
echo -e "${BLUE}=========================================${NC}"

echo -e "\n${YELLOW}1. Workbox und PWA Plugin updaten:${NC}"
echo "Installiere neueste kompatible Versionen..."

# Update workbox und vite-plugin-pwa
npm install --save-dev vite-plugin-pwa@latest workbox-build@latest workbox-core@latest workbox-precaching@latest

echo -e "\n${GREEN}✅ Dependencies updated${NC}"

echo -e "\n${YELLOW}2. Build testen:${NC}"
npm run build

echo -e "\n${GREEN}=========================================${NC}"
echo -e "${GREEN}Alternative Fixes falls immer noch Warnungen:${NC}"
echo -e "${GREEN}=========================================${NC}"

cat << 'EOF'

Falls die Warnung immer noch auftritt, probiere:

OPTION 1: Minimale PWA Config (in vite.config.ts)
---------------------------------------------------
workbox: {
  globPatterns: [],  // Keine automatischen globs
  runtimeCaching: [
    // ... deine Cache-Strategien
  ]
}

OPTION 2: Mode auf 'injectManifest' wechseln
----------------------------------------------
VitePWA({
  strategies: 'injectManifest',
  srcDir: 'src',
  filename: 'sw.ts',
  // Dann musst du einen eigenen Service Worker schreiben
})

OPTION 3: Glob komplett deaktivieren
-------------------------------------
workbox: {
  globDirectory: 'dist',
  globPatterns: [], // Leeres Array
  globIgnores: ['**/*'],
}

EOF

echo -e "\n${BLUE}Info: Die Warnung ist harmlos und beeinträchtigt die PWA-Funktionalität nicht!${NC}"
echo -e "${BLUE}      Der Service Worker funktioniert trotzdem.${NC}"
