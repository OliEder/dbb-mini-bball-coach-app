#!/bin/bash

# Test Settings & Backup Feature

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}Test Settings & Backup Feature${NC}"
echo -e "${BLUE}=========================================${NC}"

echo -e "\n${YELLOW}1. Build App${NC}"
npm run build

echo -e "\n${YELLOW}2. Starte Preview${NC}"
echo -e "${GREEN}Die App startet gleich...${NC}"
echo ""
echo -e "${BLUE}So testest du das neue Feature:${NC}"
echo ""
echo "1. Gehe zu Dashboard → Einstellungen (⚙️)"
echo ""
echo "2. ${GREEN}Backup erstellen:${NC}"
echo "   - Klick auf 'Backup erstellen'"
echo "   - JSON-Datei wird heruntergeladen"
echo ""
echo "3. ${YELLOW}App zurücksetzen:${NC}"
echo "   - Klick auf 'App zurücksetzen'"
echo "   - Tippe 'RESET' zur Bestätigung"
echo "   - Auto-Backup wird erstellt"
echo "   - App startet neu beim Onboarding"
echo ""
echo "4. ${BLUE}Backup wiederherstellen:${NC}"
echo "   - Nach Onboarding → Einstellungen"
echo "   - 'Backup wiederherstellen'"
echo "   - JSON-Datei auswählen"
echo "   - Daten werden importiert"
echo ""
echo -e "${GREEN}Starte jetzt mit: npm run preview${NC}"

npm run preview
