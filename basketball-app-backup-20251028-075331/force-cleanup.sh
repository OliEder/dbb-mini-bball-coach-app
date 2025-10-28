#!/bin/bash

echo "🧹 Force Cleanup & Reinstall..."

# 1. Alle Node-Prozesse killen
echo "1️⃣ Killing Node processes..."
pkill -9 node 2>/dev/null || true
pkill -9 vite 2>/dev/null || true

# 2. Warten
sleep 2

# 3. Aggressive Löschung mit sudo
echo "2️⃣ Force removing node_modules..."
sudo rm -rf node_modules 2>/dev/null || true

# 4. Lockfiles löschen
echo "3️⃣ Removing lock files..."
rm -f package-lock.json
rm -f package-lock*.json

# 5. npm cache leeren
echo "4️⃣ Cleaning npm cache..."
npm cache clean --force

# 6. Neuinstallation
echo "5️⃣ Fresh install..."
npm install

echo "✅ Done! Try: npm test"
