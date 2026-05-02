#!/bin/bash

echo "🔧 Quick Build Fix"
echo "=================="
echo ""

# Farben
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Frage User nach Typ des Problems
echo "Was ist das Problem?"
echo "1) Preview zeigt alte Version"
echo "2) Build schlägt fehl"
echo "3) TypeScript-Fehler"
echo "4) Alles neu bauen (Nuclear Option)"
echo ""
read -p "Wähle (1-4): " choice

case $choice in
  1)
    echo ""
    echo "${YELLOW}Preview-Fix wird ausgeführt...${NC}"
    echo ""
    
    # Entferne alte Builds
    echo "🗑️  Removing old builds..."
    rm -rf dist
    rm -rf .vite
    
    # Entferne Service Worker Cache
    echo "⚙️  Removing service worker files..."
    rm -f public/sw.js
    rm -f public/workbox-*.js
    
    # Fresh Build
    echo "🏗️  Building..."
    npm run build
    
    if [ $? -eq 0 ]; then
      echo ""
      echo "${GREEN}✅ Build erfolgreich!${NC}"
      echo ""
      echo "Nächste Schritte:"
      echo "1. Im Browser: DevTools → Application → Clear Storage → Clear site data"
      echo "2. npm run preview"
    else
      echo ""
      echo "${RED}❌ Build fehlgeschlagen!${NC}"
      echo "Versuche: ./quick-build-fix.sh und wähle Option 4"
    fi
    ;;
    
  2)
    echo ""
    echo "${YELLOW}Build-Fix wird ausgeführt...${NC}"
    echo ""
    
    # Entferne TypeScript Cache
    echo "🗑️  Removing TypeScript cache..."
    rm -f tsconfig.tsbuildinfo
    rm -f tsconfig.node.tsbuildinfo
    rm -f vite.config.js
    
    # Entferne alte Builds
    echo "🗑️  Removing old builds..."
    rm -rf dist
    rm -rf .vite
    
    # Fresh Build
    echo "🏗️  Building..."
    npm run build
    
    if [ $? -eq 0 ]; then
      echo ""
      echo "${GREEN}✅ Build erfolgreich!${NC}"
    else
      echo ""
      echo "${RED}❌ Build fehlgeschlagen!${NC}"
      echo "Fehler könnten sein:"
      echo "- TypeScript-Fehler im Code"
      echo "- Fehlende Dependencies"
      echo ""
      echo "Versuche Option 4 für vollständigen Reset"
    fi
    ;;
    
  3)
    echo ""
    echo "${YELLOW}TypeScript-Fix wird ausgeführt...${NC}"
    echo ""
    
    # Entferne alle TypeScript Artefakte
    echo "🗑️  Removing TypeScript artifacts..."
    rm -f tsconfig.tsbuildinfo
    rm -f tsconfig.node.tsbuildinfo
    rm -f vite.config.js
    rm -rf dist
    
    # TypeScript Check
    echo "🔍 Running TypeScript check..."
    tsc -b
    
    if [ $? -eq 0 ]; then
      echo ""
      echo "${GREEN}✅ TypeScript OK!${NC}"
      echo ""
      echo "Versuche jetzt: npm run build"
    else
      echo ""
      echo "${RED}❌ TypeScript-Fehler gefunden!${NC}"
      echo "Behebe die Fehler im Code und versuche erneut."
    fi
    ;;
    
  4)
    echo ""
    echo "${YELLOW}Nuclear Option - Vollständiger Reset${NC}"
    echo "${RED}WARNUNG: Dies entfernt node_modules und alle Builds!${NC}"
    echo ""
    read -p "Fortfahren? (y/N): " confirm
    
    if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
      echo ""
      echo "🧹 Full cleanup..."
      
      # Vollständiges Cleanup
      rm -rf node_modules
      rm -rf dist
      rm -rf .vite
      rm -rf test-results
      rm -f tsconfig.tsbuildinfo
      rm -f tsconfig.node.tsbuildinfo
      rm -f vite.config.js
      rm -f package-lock.json
      
      echo "📦 Installing dependencies..."
      npm install
      
      if [ $? -eq 0 ]; then
        echo ""
        echo "🏗️  Building..."
        npm run build
        
        if [ $? -eq 0 ]; then
          echo ""
          echo "${GREEN}✅ Vollständiger Reset erfolgreich!${NC}"
        else
          echo ""
          echo "${RED}❌ Build fehlgeschlagen nach Reset!${NC}"
          echo "Das deutet auf Code-Fehler hin."
          echo ""
          echo "Prüfe:"
          echo "- npm run test"
          echo "- TypeScript-Fehler in IDE"
        fi
      else
        echo ""
        echo "${RED}❌ npm install fehlgeschlagen!${NC}"
        echo "Prüfe Internet-Verbindung und package.json"
      fi
    else
      echo "Abgebrochen."
    fi
    ;;
    
  *)
    echo "${RED}Ungültige Auswahl!${NC}"
    exit 1
    ;;
esac

echo ""
