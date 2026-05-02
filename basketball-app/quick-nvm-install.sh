#!/bin/bash

# Quick Fix für dein aktuelles npm Problem
# Installiert nvm und migriert von Homebrew Node zu nvm

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Quick Fix: npm 11.6.2 mit nvm${NC}"
echo -e "${GREEN}================================${NC}"

echo -e "\n${YELLOW}Schritt 1: NVM installieren${NC}"
echo "Führe aus:"
echo
echo "curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash"
echo

echo -e "\n${YELLOW}Schritt 2: Terminal Config updaten${NC}"
echo "Füge zu ~/.zshrc hinzu (falls nicht automatisch passiert):"
echo
cat << 'EOF'
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
EOF
echo

echo -e "\n${YELLOW}Schritt 3: Terminal neu laden${NC}"
echo "source ~/.zshrc"
echo

echo -e "\n${YELLOW}Schritt 4: Node LTS installieren${NC}"
echo "nvm install --lts"
echo "nvm use --lts"
echo "nvm alias default lts/*"
echo

echo -e "\n${YELLOW}Schritt 5: NPM upgraden${NC}"
echo "nvm install-latest-npm"
echo

echo -e "\n${YELLOW}Schritt 6: Verifizieren${NC}"
echo "node -v  # sollte v20.18.x oder v22.x zeigen"
echo "npm -v   # sollte 11.6.2 oder neuer zeigen"
echo

echo -e "\n${GREEN}================================${NC}"
echo -e "${GREEN}Copy-Paste Commands:${NC}"
echo -e "${GREEN}================================${NC}"
echo
echo "# Alles in einem:"
echo 'curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash && source ~/.zshrc && nvm install --lts && nvm use --lts && nvm alias default lts/* && nvm install-latest-npm'
echo

echo -e "\n${YELLOW}Optional: Homebrew Node deaktivieren${NC}"
echo "Wenn alles funktioniert, kannst du Homebrew Node entfernen:"
echo "brew unlink node@20"
echo "# Oder komplett entfernen:"
echo "brew uninstall --ignore-dependencies node@20"
