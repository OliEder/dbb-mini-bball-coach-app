#!/bin/bash

# Clean Restart für Basketball App

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}Clean Restart Basketball App${NC}"
echo -e "${BLUE}=========================================${NC}"

echo -e "\n${YELLOW}1. Stoppe alle laufenden Prozesse${NC}"
echo "Bitte stoppe manuell mit Ctrl+C alle laufenden npm Prozesse"
echo "Press Enter wenn bereit..."
read

echo -e "\n${YELLOW}2. Lösche alte Build-Artefakte${NC}"
rm -rf dist
rm -rf node_modules/.vite
echo "✅ Build-Artefakte gelöscht"

echo -e "\n${YELLOW}3. Build App neu${NC}"
npm run build

echo -e "\n${YELLOW}4. Starte Preview${NC}"
echo -e "${RED}WICHTIG: Browser-Cleanup nötig!${NC}"
echo ""
echo "Im Browser (http://localhost:4173/dbb-mini-bball-coach-app/):"
echo "1. Öffne DevTools (F12)"
echo "2. Application Tab → Storage → Clear site data"
echo "3. Application Tab → Service Workers → Unregister alle"
echo "4. Hard Reload (Cmd+Shift+R / Ctrl+Shift+R)"
echo ""
echo -e "${GREEN}Starte Preview Server...${NC}"
npm run preview

