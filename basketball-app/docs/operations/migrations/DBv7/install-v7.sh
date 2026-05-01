#!/bin/bash
# DB v7.0 Installation Script
# Kopiert alle Files an die richtigen Stellen

set -e

PROJECT_ROOT="/Users/oliver-marcuseder/Documents/00-Privat/Basketball-Apps/basketball-app"

echo "🚀 Installing DB v7.0..."

# Prüfe ob Projekt-Verzeichnis existiert
if [ ! -d "$PROJECT_ROOT" ]; then
  echo "❌ Projekt-Verzeichnis nicht gefunden: $PROJECT_ROOT"
  exit 1
fi

# Backup erstellen
echo "📦 Creating backup..."
BACKUP_DIR="$PROJECT_ROOT/backups/v6-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup alte Files
if [ -f "$PROJECT_ROOT/src/shared/types/index.ts" ]; then
  cp "$PROJECT_ROOT/src/shared/types/index.ts" "$BACKUP_DIR/"
fi
if [ -f "$PROJECT_ROOT/src/shared/db/database.ts" ]; then
  cp "$PROJECT_ROOT/src/shared/db/database.ts" "$BACKUP_DIR/"
fi
if [ -f "$PROJECT_ROOT/src/domains/bbb-api/services/BBBSyncService.ts" ]; then
  cp "$PROJECT_ROOT/src/domains/bbb-api/services/BBBSyncService.ts" "$BACKUP_DIR/"
fi

echo "✅ Backup created: $BACKUP_DIR"

# Installiere neue Files
echo "📝 Installing new files..."

# 1. Types (WICHTIG: Manual merge nötig!)
echo "⚠️  Types müssen MANUELL gemerged werden!"
echo "    Kopiere types-v7.ts Inhalt in: $PROJECT_ROOT/src/shared/types/index.ts"
echo "    (Team Interface ersetzen, TeamLigaParticipation hinzufügen)"

# 2. Database Schema
echo "📊 Installing database.ts..."
cp database-v7.ts "$PROJECT_ROOT/src/shared/db/database.ts"

# 3. BBBSyncService
echo "🔄 Installing BBBSyncService.ts..."
cp BBBSyncService-v7.ts "$PROJECT_ROOT/src/domains/bbb-api/services/BBBSyncService.ts"

# 4. Dokumentation
echo "📚 Installing documentation..."
mkdir -p "$PROJECT_ROOT/docs/migrations"
cp DB-V7-MIGRATION.md "$PROJECT_ROOT/docs/migrations/"
cp TEST-PLAN-V7.md "$PROJECT_ROOT/docs/migrations/"
cp QUICK-START-V7.md "$PROJECT_ROOT/docs/migrations/"

echo ""
echo "✅ Installation complete!"
echo ""
echo "⚠️  WICHTIG: Manual Steps:"
echo "1. Merge types-v7.ts in src/shared/types/index.ts"
echo "2. Run tests: npm test"
echo "3. Update consumers (TeamService, SpielService, etc.)"
echo "4. See QUICK-START-V7.md for details"
echo ""
echo "📚 Documentation:"
echo "   - $PROJECT_ROOT/docs/migrations/QUICK-START-V7.md"
echo "   - $PROJECT_ROOT/docs/migrations/DB-V7-MIGRATION.md"
echo "   - $PROJECT_ROOT/docs/migrations/TEST-PLAN-V7.md"
