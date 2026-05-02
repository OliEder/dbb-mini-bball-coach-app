#!/bin/bash

# Fix für npm install Probleme
echo "🔧 Bereinige und installiere Dependencies..."

# Schritt 1: package-lock.json löschen (neu generieren)
echo "📦 Entferne package-lock.json für sauberen Neustart..."
rm -f package-lock.json

# Schritt 2: Node modules cache bereinigen
echo "🗑️ Bereinige npm cache..."
npm cache clean --force

# Schritt 3: Installiere mit overrides
echo "📦 Installiere Dependencies mit overrides..."
npm install

# Schritt 4: Falls das fehlschlägt, versuche alternative Installation
if [ $? -ne 0 ]; then
    echo "⚠️ Standard Installation fehlgeschlagen. Versuche alternative Methode..."
    
    # Nur die wirklich fehlenden Dependencies installieren
    echo "📦 Installiere fehlende Dependencies einzeln..."
    npm install workbox-build@7.3.0 --save-dev --legacy-peer-deps
    npm install source-map@0.7.4 --save-dev --legacy-peer-deps
    
    # Dann normale Installation
    npm install --legacy-peer-deps
fi

echo "✅ Installation abgeschlossen!"

# Überprüfe ob wichtige Pakete vorhanden sind
echo "🔍 Überprüfe Installation..."
if [ -f "node_modules/vitest/package.json" ]; then
    echo "✓ Vitest installiert"
else
    echo "✗ Vitest fehlt"
fi

if [ -f "node_modules/workbox-build/package.json" ]; then
    echo "✓ Workbox-build installiert"
else
    echo "✗ Workbox-build fehlt"
fi

echo "🚀 Fertig! Versuche jetzt: npm run test:ui"
