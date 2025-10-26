#!/bin/bash

echo "🚀 GitHub Pages Setup für Basketball Team Manager PWA"
echo "=================================================="
echo ""

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Deine tatsächlichen Repository-Daten
GITHUB_USER="OliEder"
REPO_NAME="dbb-mini-bball-coach-app"
SUBFOLDER="basketball-app"

echo "Repository: $REPO_NAME"
echo "GitHub User: $GITHUB_USER"
echo "Subfolder: $SUBFOLDER"
echo ""

echo "📋 Checklist für GitHub Pages:"
echo "------------------------------"
echo ""

echo "✅ 1️⃣ Repository existiert bereits"
echo "   https://github.com/$GITHUB_USER/$REPO_NAME"
echo ""

echo "2️⃣ Code aktualisieren"
echo -e "${YELLOW}cd basketball-app${NC}"
echo -e "${YELLOW}git add -A${NC}"
echo -e "${YELLOW}git commit -m \"feat: GitHub Pages deployment\"${NC}"
echo -e "${YELLOW}git push${NC}"
echo ""

echo "3️⃣ GitHub Pages aktivieren"
echo "   1. Gehe zu: https://github.com/$GITHUB_USER/$REPO_NAME/settings/pages"
echo "   2. Source: GitHub Actions"
echo "   3. Save"
echo ""

echo "4️⃣ Workflow Permissions setzen"
echo "   1. Gehe zu: https://github.com/$GITHUB_USER/$REPO_NAME/settings/actions"
echo "   2. Workflow permissions: Read and write permissions"
echo "   3. Save"
echo ""

echo "5️⃣ Workflows anpassen für Subfolder"
echo "   Die Workflows müssen angepasst werden, da die App im Subfolder ist!"
echo ""

echo "6️⃣ Erste Deployment ausführen"
echo "   1. Gehe zu: https://github.com/$GITHUB_USER/$REPO_NAME/actions"
echo "   2. Wähle 'Deploy to GitHub Pages & Run Crawler'"
echo "   3. Klicke 'Run workflow' → 'Run workflow'"
echo ""

echo "7️⃣ Nach ca. 2-3 Minuten ist die App verfügbar unter:"
echo -e "${GREEN}   https://$GITHUB_USER.github.io/$REPO_NAME/${NC}"
echo ""

echo "⚠️  WICHTIG: Subfolder-Struktur"
echo "   Da die App im Subfolder 'basketball-app' liegt,"
echo "   müssen die GitHub Actions angepasst werden!"
echo ""

# Create deployment status file
cat > github-pages-status.md << EOF
# GitHub Pages Deployment Status

## URLs
- **Live App:** https://$GITHUB_USER.github.io/$REPO_NAME/
- **Repository:** https://github.com/$GITHUB_USER/$REPO_NAME
- **Actions:** https://github.com/$GITHUB_USER/$REPO_NAME/actions
- **Settings:** https://github.com/$GITHUB_USER/$REPO_NAME/settings/pages

## Repository-Struktur
- Hauptrepository: dbb-mini-bball-coach-app
- App-Verzeichnis: basketball-app/

## Workflows
- **Deploy:** Automatisch bei Push auf main
- **Crawler:** Sonntags 2 Uhr UTC

## Setup Checklist
- [x] Repository existiert
- [ ] Code gepusht
- [ ] GitHub Pages aktiviert (Source: GitHub Actions)
- [ ] Workflow Permissions gesetzt
- [ ] Workflows für Subfolder angepasst
- [ ] Erstes Deployment durchgeführt
- [ ] App ist erreichbar

## Letzte Aktualisierung
$(date)
EOF

echo -e "${GREEN}Status-Datei erstellt: github-pages-status.md${NC}"
echo ""
echo "🎯 Nächste Schritte:"
echo "   1. Workflows für Subfolder anpassen"
echo "   2. Änderungen pushen"
echo "   3. GitHub Pages aktivieren"
