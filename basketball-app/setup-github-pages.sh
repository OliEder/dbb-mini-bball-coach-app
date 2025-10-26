#!/bin/bash

echo "🚀 GitHub Pages Setup für Basketball Team Manager PWA"
echo "=================================================="
echo ""

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

<<<<<<< HEAD
# Deine tatsächlichen Repository-Daten
GITHUB_USER="OliEder"
REPO_NAME="dbb-mini-bball-coach-app"
SUBFOLDER="basketball-app"

echo "Repository: $REPO_NAME"
echo "GitHub User: $GITHUB_USER"
echo "Subfolder: $SUBFOLDER"
=======
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
>>>>>>> c34e0aed0d7e14b9cafc932553a10e4d944f8f84
echo ""

echo "📋 Checklist für GitHub Pages:"
echo "------------------------------"
echo ""

<<<<<<< HEAD
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
=======
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
>>>>>>> c34e0aed0d7e14b9cafc932553a10e4d944f8f84
echo "   1. Gehe zu: https://github.com/$GITHUB_USER/$REPO_NAME/settings/pages"
echo "   2. Source: GitHub Actions"
echo "   3. Save"
echo ""

<<<<<<< HEAD
echo "4️⃣ Workflow Permissions setzen"
=======
echo "5️⃣ Workflow Permissions setzen"
>>>>>>> c34e0aed0d7e14b9cafc932553a10e4d944f8f84
echo "   1. Gehe zu: https://github.com/$GITHUB_USER/$REPO_NAME/settings/actions"
echo "   2. Workflow permissions: Read and write permissions"
echo "   3. Save"
echo ""

<<<<<<< HEAD
echo "5️⃣ Workflows anpassen für Subfolder"
echo "   Die Workflows müssen angepasst werden, da die App im Subfolder ist!"
echo ""

=======
>>>>>>> c34e0aed0d7e14b9cafc932553a10e4d944f8f84
echo "6️⃣ Erste Deployment ausführen"
echo "   1. Gehe zu: https://github.com/$GITHUB_USER/$REPO_NAME/actions"
echo "   2. Wähle 'Deploy to GitHub Pages & Run Crawler'"
echo "   3. Klicke 'Run workflow' → 'Run workflow'"
echo ""

echo "7️⃣ Nach ca. 2-3 Minuten ist die App verfügbar unter:"
echo -e "${GREEN}   https://$GITHUB_USER.github.io/$REPO_NAME/${NC}"
echo ""

<<<<<<< HEAD
echo "⚠️  WICHTIG: Subfolder-Struktur"
echo "   Da die App im Subfolder 'basketball-app' liegt,"
echo "   müssen die GitHub Actions angepasst werden!"
=======
echo "📊 Optional: Crawler manuell starten"
echo "   1. Gehe zu: https://github.com/$GITHUB_USER/$REPO_NAME/actions"
echo "   2. Wähle 'Club Data Crawler'"
echo "   3. Klicke 'Run workflow'"
echo ""

echo "✅ Fertig! Die GitHub Actions werden automatisch:"
echo "   - Bei jedem Push auf 'main' die App deployen"
echo "   - Wöchentlich die Club-Daten aktualisieren"
>>>>>>> c34e0aed0d7e14b9cafc932553a10e4d944f8f84
echo ""

# Create deployment status file
cat > github-pages-status.md << EOF
# GitHub Pages Deployment Status

## URLs
- **Live App:** https://$GITHUB_USER.github.io/$REPO_NAME/
- **Repository:** https://github.com/$GITHUB_USER/$REPO_NAME
- **Actions:** https://github.com/$GITHUB_USER/$REPO_NAME/actions
<<<<<<< HEAD
- **Settings:** https://github.com/$GITHUB_USER/$REPO_NAME/settings/pages

## Repository-Struktur
- Hauptrepository: dbb-mini-bball-coach-app
- App-Verzeichnis: basketball-app/
=======
>>>>>>> c34e0aed0d7e14b9cafc932553a10e4d944f8f84

## Workflows
- **Deploy:** Automatisch bei Push auf main
- **Crawler:** Sonntags 2 Uhr UTC

## Setup Checklist
<<<<<<< HEAD
- [x] Repository existiert
- [ ] Code gepusht
- [ ] GitHub Pages aktiviert (Source: GitHub Actions)
- [ ] Workflow Permissions gesetzt
- [ ] Workflows für Subfolder angepasst
=======
- [ ] Repository erstellt
- [ ] Code gepusht
- [ ] GitHub Pages aktiviert (Source: GitHub Actions)
- [ ] Workflow Permissions gesetzt
>>>>>>> c34e0aed0d7e14b9cafc932553a10e4d944f8f84
- [ ] Erstes Deployment durchgeführt
- [ ] App ist erreichbar

## Letzte Aktualisierung
$(date)
EOF

echo -e "${GREEN}Status-Datei erstellt: github-pages-status.md${NC}"
echo ""
echo "🎯 Nächste Schritte:"
<<<<<<< HEAD
echo "   1. Workflows für Subfolder anpassen"
echo "   2. Änderungen pushen"
echo "   3. GitHub Pages aktivieren"
=======
echo "   1. Führe die Schritte oben aus"
echo "   2. Überprüfe github-pages-status.md"
echo "   3. Teste die Live-App"
>>>>>>> c34e0aed0d7e14b9cafc932553a10e4d944f8f84
