#!/bin/bash

# Fix Node Modules Script
# Löst das Problem mit fehlenden Dependencies
echo "🔧 Fixing Node Modules..."

# Schritt 1: Fehlende Dependencies direkt installieren
echo "📦 Installing missing dependencies..."
npm install source-map@^0.7.4 strip-literal@^2.1.2 --save-dev --force

# Schritt 2: Workbox-build und seine Dependencies sicherstellen
echo "📦 Ensuring workbox-build dependencies..."
npm install workbox-build@^7.3.1 --save-dev --force

# Schritt 3: Deduplizieren
echo "🔄 Deduplicating packages..."
npm dedupe

# Schritt 4: Überprüfen
echo "✅ Verifying installation..."
if [ -f "node_modules/source-map/package.json" ]; then
    echo "✓ source-map installed"
else
    echo "✗ source-map missing"
fi

if [ -f "node_modules/strip-literal/package.json" ]; then
    echo "✓ strip-literal installed"
else
    echo "✗ strip-literal missing"
fi

echo "🚀 Done! Try running tests now with: npm run test:ui"
