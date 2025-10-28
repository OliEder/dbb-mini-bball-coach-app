#!/bin/bash

# ENDGÜLTIGER Fix für die nervige Glob Warning

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${RED}=========================================${NC}"
echo -e "${RED}GLOB WARNING - NUCLEAR FIX${NC}"
echo -e "${RED}=========================================${NC}"

echo -e "\n${YELLOW}1. Dependencies komplett neu installieren:${NC}"

# Alles löschen
echo "Lösche node_modules und Lock-Files..."
rm -rf node_modules
rm -rf package-lock.json
rm -rf dist
rm -rf .vite

echo -e "\n${YELLOW}2. Cache komplett clearen:${NC}"
npm cache clean --force

echo -e "\n${YELLOW}3. Explizit glob installieren (Fix für undefined):${NC}"
npm install --save-dev glob@latest

echo -e "\n${YELLOW}4. Alle Dependencies neu installieren:${NC}"
npm install

echo -e "\n${YELLOW}5. Build testen:${NC}"
npm run build

echo -e "\n${GREEN}=========================================${NC}"
echo -e "${GREEN}ALTERNATIVE: PWA komplett deaktivieren${NC}"
echo -e "${GREEN}=========================================${NC}"

cat << 'EOF' > vite.config.no-pwa.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// OHNE PWA - Nur zum Testen
export default defineConfig(() => {
  const base = process.env.BASE_URL || '/dbb-mini-bball-coach-app/';
  
  return {
    base,
    plugins: [
      react(),
      // PWA deaktiviert!
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@domains': path.resolve(__dirname, './src/domains'),
        '@shared': path.resolve(__dirname, './src/shared')
      }
    },
    build: {
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            dexie: ['dexie'],
            ui: ['lucide-react']
          }
        }
      }
    },
    optimizeDeps: {
      exclude: ['lucide-react']
    }
  };
});
EOF

echo -e "\n${YELLOW}Falls immer noch Probleme:${NC}"
echo "1. PWA temporär deaktivieren:"
echo "   cp vite.config.no-pwa.ts vite.config.ts"
echo ""
echo "2. Oder alternatives PWA Plugin:"
echo "   npm uninstall vite-plugin-pwa"
echo "   npm install @vite-pwa/plugin"
echo ""
echo -e "${GREEN}Die App funktioniert auch ohne Precaching!${NC}"
