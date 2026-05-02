#!/bin/bash

# Migration von Homebrew zu nativen Version Managern
# für Node.js und Python

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}Migration zu nativen Version Managern${NC}"
echo -e "${BLUE}=========================================${NC}"

echo -e "\n${YELLOW}Aktuelle Situation:${NC}"
echo "Node: $(node -v)"
echo "npm: $(npm -v)"
echo "Python: $(python3 --version)"
echo "which node: $(which node)"
echo "which npm: $(which npm)"
echo "which python3: $(which python3)"

echo -e "\n${GREEN}=========================================${NC}"
echo -e "${GREEN}OPTION 1: Node.js mit nvm (empfohlen)${NC}"
echo -e "${GREEN}=========================================${NC}"

cat << 'EOF'

NVM (Node Version Manager) ist der Standard für Node.js Entwicklung:
✅ Mehrere Node-Versionen parallel
✅ Einfacher Wechsel zwischen Versionen
✅ Projekt-spezifische Node-Versionen (.nvmrc)
✅ Native npm Updates funktionieren

Installation:
------------
# 1. Homebrew Node/npm entfernen (optional, aber sauberer):
brew uninstall --ignore-dependencies node@20 node

# 2. NVM installieren:
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash

# 3. Terminal neu starten oder:
source ~/.zshrc

# 4. Node LTS installieren:
nvm install --lts
nvm use --lts
nvm alias default lts/*

# 5. npm auf neueste Version:
nvm install-latest-npm

# 6. Verify:
node -v  # sollte v20.x.x oder v22.x.x sein
npm -v   # sollte 10.9+ oder 11.x sein

EOF

echo -e "\n${GREEN}=========================================${NC}"
echo -e "${GREEN}OPTION 2: Node.js mit Volta (modern)${NC}"
echo -e "${GREEN}=========================================${NC}"

cat << 'EOF'

Volta ist moderner und schneller als nvm:
✅ In Rust geschrieben (sehr schnell)
✅ Automatisches Version-Switching
✅ Global Tools Management
✅ Windows/Mac/Linux Support

Installation:
------------
# 1. Volta installieren:
curl https://get.volta.sh | bash

# 2. Terminal neu starten

# 3. Node installieren:
volta install node@latest
volta install npm@latest

# 4. Projekt-spezifisch pinnen:
cd your-project
volta pin node@20
volta pin npm@11

EOF

echo -e "\n${BLUE}=========================================${NC}"
echo -e "${BLUE}Python mit pyenv oder uv${NC}"
echo -e "${BLUE}=========================================${NC}"

cat << 'EOF'

OPTION A: pyenv (klassisch, bewährt)
-------------------------------------
# Installation:
curl https://pyenv.run | bash

# Zu .zshrc hinzufügen:
export PYENV_ROOT="$HOME/.pyenv"
command -v pyenv >/dev/null || export PATH="$PYENV_ROOT/bin:$PATH"
eval "$(pyenv init -)"

# Python installieren:
pyenv install 3.12.0
pyenv global 3.12.0

OPTION B: uv (modern, von Ruff-Team, SEHR schnell)
---------------------------------------------------
# Installation:
curl -LsSf https://astral.sh/uv/install.sh | sh

# Python installieren:
uv python install 3.12
uv python pin 3.12

# Virtual Environments:
uv venv
source .venv/bin/activate
uv pip install -r requirements.txt

EOF

echo -e "\n${YELLOW}=========================================${NC}"
echo -e "${YELLOW}Cleanup-Script für Homebrew Node/Python${NC}"
echo -e "${YELLOW}=========================================${NC}"

cat << 'CLEANUP' > cleanup-homebrew-dev.sh
#!/bin/bash
# WARNUNG: Dieses Script entfernt Homebrew Node/Python!
# Nur ausführen, wenn du sicher bist!

echo "Dieses Script wird Homebrew Node und Python entfernen."
echo "Stelle sicher, dass du vorher nvm/volta und pyenv/uv installiert hast!"
read -p "Fortfahren? (y/n) " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Node/npm von Homebrew entfernen
    brew uninstall --ignore-dependencies node@20 node npm
    brew uninstall --ignore-dependencies python@3.11 python@3.12 python@3.13
    
    # Cleanup
    brew cleanup
    
    echo "Homebrew Dev-Tools entfernt!"
    echo "Jetzt Terminal neu starten und native Tools nutzen!"
fi
CLEANUP

chmod +x cleanup-homebrew-dev.sh

echo -e "\n${GREEN}=========================================${NC}"
echo -e "${GREEN}Empfohlene Reihenfolge:${NC}"
echo -e "${GREEN}=========================================${NC}"
echo
echo "1. NVM für Node.js installieren (siehe oben)"
echo "2. uv für Python installieren (super schnell!)"
echo "3. Terminal neu starten"
echo "4. Node und Python Versionen installieren"
echo "5. Optional: Homebrew Node/Python entfernen mit ./cleanup-homebrew-dev.sh"
echo
echo -e "${YELLOW}Tipp: Behalte Homebrew für System-Tools (git, wget, etc.)${NC}"
echo -e "${YELLOW}      aber nutze Version Manager für Programmiersprachen!${NC}"
