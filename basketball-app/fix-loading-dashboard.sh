#!/bin/bash

# Fix für "Lade Dashboard" Problem nach IndexedDB Löschung

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${RED}=========================================${NC}"
echo -e "${RED}FIX: Lade Dashboard Bug${NC}"
echo -e "${RED}=========================================${NC}"

echo -e "\n${YELLOW}Problem:${NC}"
echo "IndexedDB wurde gelöscht, aber localStorage hat noch alte Daten."
echo "App denkt Onboarding ist fertig, aber keine Daten vorhanden."

echo -e "\n${GREEN}Lösung 1: Browser komplett cleanen${NC}"
echo "1. Öffne: http://localhost:4173/dbb-mini-bball-coach-app/"
echo "2. DevTools → Application → Storage"
echo "3. 'Clear site data' Button klicken"
echo "4. Service Workers → Unregister alle"
echo "5. Hard Reload (Cmd+Shift+R)"

echo -e "\n${GREEN}Lösung 2: Manuell in Console${NC}"
cat << 'CONSOLE'
// In Browser Console eingeben:
localStorage.clear();
sessionStorage.clear();
location.reload();
CONSOLE

echo -e "\n${GREEN}Lösung 3: Dev Utils nutzen${NC}"
cat << 'CONSOLE'
// In Browser Console:
__DEV_UTILS__.reset();
CONSOLE

echo -e "\n${YELLOW}Jetzt neu builden und starten:${NC}"
echo "1. Ctrl+C um Server zu stoppen"
echo "2. Führe aus:"
echo ""
echo "rm -rf dist && npm run build && npm run preview"
echo ""
echo -e "${GREEN}Die App sollte dann mit dem Onboarding starten!${NC}"

