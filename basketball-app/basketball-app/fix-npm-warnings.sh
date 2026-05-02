#!/bin/bash

# NPM Config Cleanup Script
# Entfernt veraltete npm Konfigurationen und fixt Warnungen

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}NPM Config Cleanup${NC}"
echo -e "${BLUE}=========================================${NC}"

echo -e "\n${YELLOW}1. Aktuelle npm Config anzeigen:${NC}"
echo "Relevante Einträge:"
npm config list | grep -E "always-auth|email" || echo "Keine problematischen Einträge gefunden"

echo -e "\n${YELLOW}2. Veraltete Config-Einträge entfernen:${NC}"

# Always-auth entfernen
echo "Entferne 'always-auth'..."
npm config delete always-auth 2>/dev/null || echo "  → already removed"

# Email aus user config entfernen (wird nicht mehr benötigt)
echo "Entferne 'email' aus user config..."
npm config delete email 2>/dev/null || echo "  → already removed"

echo -e "\n${GREEN}✅ Config bereinigt!${NC}"

echo -e "\n${YELLOW}3. Deprecated Package 'sourcemap-codec' fixen:${NC}"
echo "Dies kommt wahrscheinlich von einer Dependency."
echo "Checking welches Package es nutzt..."

# Check wer sourcemap-codec nutzt
echo -e "\n${BLUE}Packages die sourcemap-codec nutzen:${NC}"
npm ls sourcemap-codec 2>/dev/null || echo "Indirekte Dependency"

echo -e "\n${YELLOW}Lösungsoptionen:${NC}"
echo "1. npm update --depth 9999 (updated alle sub-dependencies)"
echo "2. npm dedupe (optimiert dependency tree)"
echo "3. Ignorieren (ist nur eine Warnung, kein Sicherheitsproblem)"

echo -e "\n${GREEN}=========================================${NC}"
echo -e "${GREEN}Empfohlene Aktionen:${NC}"
echo -e "${GREEN}=========================================${NC}"

cat << 'EOF'

# 1. Dependencies updaten und deduplizieren:
npm update
npm dedupe

# 2. Cache clearen für sauberen Start:
npm cache clean --force

# 3. Neu installieren (optional, wenn Probleme bleiben):
rm -rf node_modules package-lock.json
npm install

# 4. Check ob Warnungen weg sind:
npm install

EOF

echo -e "${YELLOW}Info: Die sourcemap-codec Warnung kommt vermutlich von Vite/Rollup${NC}"
echo -e "${YELLOW}      und wird mit deren nächstem Update automatisch gefixt.${NC}"
echo -e "${YELLOW}      Sie ist harmlos und beeinträchtigt nichts!${NC}"
