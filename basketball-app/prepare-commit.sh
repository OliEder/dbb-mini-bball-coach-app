#!/bin/bash
# Git Commit Script - TypeScript Fixes & Build Optimizations

echo "📋 Status der Änderungen anzeigen..."
git status

echo ""
echo "📦 Geänderte Dateien zum Commit hinzufügen..."

# Source Files
git add src/debug-spielplan.ts
git add src/utils/debug-helpers.ts
git add src/domains/bbb-api/services/BBBApiService.ts
git add src/domains/bbb-api/services/BBBSyncService.ts

# Config Files
git add tsconfig.json
git add vite.config.ts
git add .vscode/extensions.json
git add .vscode/settings.json

# Documentation
git add docs/development/TYPESCRIPT-GUIDE.md
git add docs/development/PROJECT-STATUS.md
git add docs/README.md
git add docs/bugfixes/2025-10-26-BBB-SYNC-FIX.md

# Test Files (falls vorhanden)
git add test-bbb-sync.html
git add COMMIT_MESSAGE.md

echo ""
echo "✅ Dateien staged. Bereit für Commit!"
echo ""
echo "📝 Commit-Message:"
echo "-----------------------------------"
cat COMMIT_MESSAGE.md | head -n 1
echo "-----------------------------------"
echo ""
echo "Führe aus:"
echo "  git commit -F COMMIT_MESSAGE.md"
echo ""
echo "Oder für einen kürzeren Commit:"
echo "  git commit -m \"fix: TypeScript-Fehler behoben und Build-Warnings eliminiert\""
echo ""
echo "Nach dem Commit:"
echo "  git push origin main"
