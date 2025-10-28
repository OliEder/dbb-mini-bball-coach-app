#!/bin/bash

# NPM Version Debug Script
# Findet alle npm Installationen und zeigt, welche aktiv ist

echo "========================================="
echo "NPM Installation Debugger"
echo "========================================="

echo -e "\n1. Aktuelle npm Version und Pfad:"
echo "   Version: $(npm -v)"
echo "   Pfad: $(which npm)"

echo -e "\n2. Alle npm Installationen auf dem System:"
echo "   Suche nach npm executables..."
find / -name npm -type f 2>/dev/null | head -10 || true

echo -e "\n3. PATH Variable:"
echo "$PATH" | tr ':' '\n' | nl

echo -e "\n4. Prüfe auf nvm (Node Version Manager):"
if command -v nvm &> /dev/null; then
    echo "   ✓ nvm ist installiert"
    nvm ls
else
    echo "   ✗ nvm nicht gefunden"
fi

echo -e "\n5. Prüfe auf Homebrew npm:"
if command -v brew &> /dev/null; then
    echo "   ✓ Homebrew ist installiert"
    brew list | grep -E "node|npm" || echo "   Kein node/npm via Homebrew"
else
    echo "   ✗ Homebrew nicht gefunden"
fi

echo -e "\n6. Node und npm Versionen:"
echo "   Node: $(node -v)"
echo "   npm: $(npm -v)"
echo "   npx: $(npx -v)"

echo -e "\n7. npm root Verzeichnisse:"
echo "   Global: $(npm root -g)"
echo "   Local: $(npm root)"

echo -e "\n========================================="
echo "LÖSUNGSVORSCHLÄGE:"
echo "========================================="
echo
echo "Option 1: Wenn du nvm verwendest:"
echo "   nvm install-latest-npm"
echo
echo "Option 2: Wenn du Homebrew verwendest:"
echo "   brew update && brew upgrade node"
echo
echo "Option 3: Direkte Installation (override):"
echo "   curl -qL https://www.npmjs.com/install.sh | sh"
echo
echo "Option 4: Terminal neu starten:"
echo "   exec $SHELL -l"
echo
