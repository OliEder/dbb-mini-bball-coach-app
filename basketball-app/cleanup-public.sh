#!/bin/bash
cd /Users/oliver-marcuseder/Documents/00-Privat/Basketball-Apps/basketball-app

# Verschiebe restliche Crawler-Daten
for file in public/assets/clubs-chunk-*.js; do
  if [ -f "$file" ]; then
    filename=$(basename "$file")
    mv "$file" "public/data/clubs/$filename"
    echo "✅ Verschoben: $filename"
  fi
done

# Lösche Build-Artefakte
rm -f public/assets/index-*.js
rm -f public/assets/vendor-*.js
rm -f public/assets/dexie-*.js
rm -f public/assets/ui-*.js
rm -f public/assets/VereinService-*.js
rm -f public/assets/*.css

# Lösche leeren assets Ordner
rmdir public/assets 2>/dev/null && echo "✅ public/assets/ gelöscht" || echo "⚠️ public/assets/ nicht leer oder existiert nicht"

echo ""
echo "✅ Cleanup abgeschlossen!"
echo ""
echo "Jetzt ausführen:"
echo "  rm -rf dist"
echo "  BASE_URL=/dbb-mini-bball-coach-app/ npm run build"
