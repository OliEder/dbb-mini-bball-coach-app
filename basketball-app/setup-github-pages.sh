#!/bin/bash

echo "🚀 GitHub Pages Setup für Basketball Team Manager PWA"
echo "=================================================="
echo ""

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}❌ Kein Git Repository gefunden!${NC}"
    echo "Führe 'git init' aus oder wechsle ins richtige Verzeichnis."
    exit 1
fi

# Get repository info
REPO_URL=$(git config --get remote.origin.url 2>/dev/null)
if [ -z "$REPO_URL" ]; then
    REPO_NAME="basketball-app"
    GITHUB_USER="DEIN-USERNAME"
    echo -e "${YELLOW}⚠️  Kein Remote-Repository konfiguriert${NC}"
else
    # Extract from URL
    REPO_NAME=$(basename -s .git "$REPO_URL")
    GITHUB_USER=$(echo "$REPO_URL" | sed -e 's/.*github.com[:\/]\([^\/]*\).*/\1/')
fi

echo "Repository: $REPO_NAME"
echo "GitHub User: $GITHUB_USER"
echo ""

echo "📋 Checklist für GitHub Pages:"
echo "------------------------------"
echo ""

echo "1️⃣ Repository auf GitHub erstellen"
echo "   https://github.com/new"
echo "   Name: $REPO_NAME"
echo ""

echo "2️⃣ Remote hinzufügen (falls noch nicht vorhanden)"
echo -e "${YELLOW}git remote add origin https://github.com/$GITHUB_USER/$REPO_NAME.git${NC}"
echo ""

echo "3️⃣ Code pushen"
echo -e "${YELLOW}git add -A${NC}"
echo -e "${YELLOW}git commit -m \"Initial commit with GitHub Pages setup\"${NC}"
echo -e "${YELLOW}git push -u origin main${NC}"
echo ""

echo "4️⃣ GitHub Pages aktivieren"
echo "   1. Gehe zu: https://github.com/$GITHUB_USER/$REPO_NAME/settings/pages"
echo "   2. Source: GitHub Actions"
echo "   3. Save"
echo ""

echo "5️⃣ Workflow Permissions setzen"
echo "   1. Gehe zu: https://github.com/$GITHUB_USER/$REPO_NAME/settings/actions"
echo "   2. Workflow permissions: Read and write permissions"
echo "   3. Save"
echo ""

echo "6️⃣ Erste Deployment ausführen"
echo "   1. Gehe zu: https://github.com/$GITHUB_USER/$REPO_NAME/actions"
echo "   2. Wähle 'Deploy to GitHub Pages & Run Crawler'"
echo "   3. Klicke 'Run workflow' → 'Run workflow'"
echo ""

echo "7️⃣ Nach ca. 2-3 Minuten ist die App verfügbar unter:"
echo -e "${GREEN}   https://$GITHUB_USER.github.io/$REPO_NAME/${NC}"
echo ""

echo "📊 Optional: Crawler manuell starten"
echo "   1. Gehe zu: https://github.com/$GITHUB_USER/$REPO_NAME/actions"
echo "   2. Wähle 'Club Data Crawler'"
echo "   3. Klicke 'Run workflow'"
echo ""

echo "✅ Fertig! Die GitHub Actions werden automatisch:"
echo "   - Bei jedem Push auf 'main' die App deployen"
echo "   - Wöchentlich die Club-Daten aktualisieren"
echo ""

# Create deployment status file
cat > github-pages-status.md << EOF
# GitHub Pages Deployment Status

## URLs
- **Live App:** https://$GITHUB_USER.github.io/$REPO_NAME/
- **Repository:** https://github.com/$GITHUB_USER/$REPO_NAME
- **Actions:** https://github.com/$GITHUB_USER/$REPO_NAME/actions

## Workflows
- **Deploy:** Automatisch bei Push auf main
- **Crawler:** Sonntags 2 Uhr UTC

## Setup Checklist
- [ ] Repository erstellt
- [ ] Code gepusht
- [ ] GitHub Pages aktiviert (Source: GitHub Actions)
- [ ] Workflow Permissions gesetzt
- [ ] Erstes Deployment durchgeführt
- [ ] App ist erreichbar

## Letzte Aktualisierung
$(date)
EOF

echo -e "${GREEN}Status-Datei erstellt: github-pages-status.md${NC}"
echo ""
echo "🎯 Nächste Schritte:"
echo "   1. Führe die Schritte oben aus"
echo "   2. Überprüfe github-pages-status.md"
echo "   3. Teste die Live-App"
