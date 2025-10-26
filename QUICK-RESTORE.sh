#!/bin/bash

echo "🚨 QUICK RESTORE - Alle wichtigen Fixes"
echo "========================================"
echo ""

# TypeScript Config Fix
echo "📝 Fixing tsconfig.json..."
cd basketball-app
cat > tsconfig.patch << 'EOF'
--- tsconfig.json	original
+++ tsconfig.json	fixed
@@ -19,9 +19,8 @@
     "noUnusedParameters": false,
     "noFallthroughCasesInSwitch": true,
 
-    /* Paths */
-    "baseUrl": ".",
+    /* Paths - ohne baseUrl */
     "paths": {
       "@/*": ["./src/*"],
       "@domains/*": ["./src/domains/*"],
       "@shared/*": ["./src/shared/*"]
EOF

# Vite Config für GitHub Pages
echo "📝 Fixing vite.config.ts..."
cat > vite.config.patch << 'EOF'
--- vite.config.ts	original
+++ vite.config.ts	fixed
@@ -6,6 +6,8 @@
 // https://vitejs.dev/config/
 export default defineConfig({
+  // GitHub Pages base path
+  base: process.env.BASE_URL || '/dbb-mini-bball-coach-app/',
   plugins: [
     react(),
     VitePWA({
EOF

# BBBApiService Fix
echo "📝 Fixing BBBApiService..."
cat > src/domains/bbb-api/services/BBBApiService.fix << 'EOF'
// In getCompetitionTable() Methode - Zeile ~240
// ALT:
const entries = tableData.tabelle?.entries || tableData.entries || [];

// NEU:
let teams = data.teams || data.tabelle?.entries || data.entries || [];

// Zusätzlich: Deutsche Feldnamen mappen
if (Array.isArray(teams) && teams.length > 0 && teams[0].platzierung !== undefined) {
  teams = teams.map((team: any) => ({
    position: team.platzierung || 0,
    teamId: team.teamId || 0,
    teamName: team.teamname || '',
    clubId: team.clubId || team.teamId || 0,
    clubName: team.teamname?.split(' ')[0] || 'Unknown',
    games: team.spiele || 0,
    wins: team.gewonnen || 0,
    losses: team.verloren || 0,
    points: team.punkte || 0,
    scoredPoints: team.korbpunkteGemacht || 0,
    concededPoints: team.korbpunkteGegen || 0,
    pointsDifference: team.differenz || 0
  }));
}
EOF

# TypeScript Guide
echo "📝 Creating TypeScript Guide..."
cat > docs/development/TYPESCRIPT-GUIDE.md << 'EOF'
# TypeScript Guide - Basketball Team Manager

**Status:** ✅ Aktiv

## ⚠️ WICHTIG: Häufigste Fehler vermeiden

### 🔴 Alle IDs folgen dem Pattern `{entity}_id`

```typescript
// ❌ FALSCH
team.id
spieler.id

// ✅ RICHTIG  
team.team_id
spieler.spieler_id
spiel.spiel_id
verein.verein_id
```

### Arrays immer typisieren

```typescript
// ❌ FALSCH
const duplicates = [];

// ✅ RICHTIG
const duplicates: Spiel[] = [];
```

### Database Tables sind Plural

```typescript
db.teams      // nicht db.team
db.spiele     // nicht db.spiel
db.spieler    // nicht db.player
```
EOF

echo ""
echo "✅ DONE! Wichtigste Fixes vorbereitet"
echo ""
echo "📋 TODO:"
echo "1. Patches manuell anwenden (Dateien sind als .patch/.fix erstellt)"
echo "2. TypeScript-Fehler in debug-spielplan.ts und debug-helpers.ts fixen"
echo "3. Alles committen"
echo ""
echo "🔧 Quick Commands:"
echo "  npm run build        # Build testen"
echo "  git add -A          # Alles stagen"
echo "  git commit -m 'fix: Restore TypeScript and build fixes'"
echo "  git push"
