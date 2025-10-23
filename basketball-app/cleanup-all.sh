#!/bin/bash

echo "🧹 Basketball App - Full Cleanup"
echo "================================"
echo ""

# Stop bei Fehler
set -e

# 1. Node Modules
echo "📦 Removing node_modules..."
rm -rf node_modules

# 2. Build Artefakte
echo "🗑️  Removing build artifacts..."
rm -rf dist
rm -rf .vite
rm -f tsconfig.tsbuildinfo
rm -f tsconfig.node.tsbuildinfo
rm -f vite.config.js

# 3. Test Artefakte
echo "🧪 Removing test artifacts..."
rm -rf test-results
rm -rf playwright-report
rm -rf .vitest

# 4. Cache Directories
echo "💾 Removing cache directories..."
rm -rf .cache
rm -rf .turbo
rm -rf .parcel-cache

# 5. Service Worker Files (falls vorhanden)
echo "⚙️  Removing service worker files..."
rm -f public/sw.js
rm -f public/workbox-*.js
rm -f src/sw.js

# 6. Lockfile (optional - nur wenn du auch npm ci machen willst)
# echo "🔒 Removing lockfile..."
# rm -f package-lock.json

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "📥 Now run: npm install"
echo "🏗️  Then run: npm run build"
echo ""
