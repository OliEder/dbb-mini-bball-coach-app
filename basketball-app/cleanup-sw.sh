#!/bin/bash
# Basketball PWA - Service Worker Cleanup
# Entfernt registrierte Service Worker im Browser

echo "🧹 Service Worker Cleanup"
echo "========================"
echo ""
echo "Bitte folgende Schritte manuell im Browser durchführen:"
echo ""
echo "1. Öffne Chrome DevTools (F12)"
echo "2. Gehe zu 'Application' Tab"
echo "3. Links: 'Service Workers'"
echo "4. Klicke 'Unregister' bei allen Service Workers"
echo "5. Links: 'Storage'"
echo "6. Klicke 'Clear site data'"
echo "7. Schließe alle Browser-Tabs der App"
echo "8. Starte Dev-Server neu:"
echo ""
echo "   npm run dev"
echo ""
echo "✅ Dev-Server läuft jetzt OHNE Service Worker!"
echo "   (Service Worker wird nur im Production Build aktiviert)"
