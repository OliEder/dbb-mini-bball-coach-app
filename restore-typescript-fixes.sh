#!/bin/bash

echo "🔧 Wiederherstellen der wichtigsten TypeScript-Fixes..."

# Fix 1: debug-spielplan.ts
cat > basketball-app/src/debug-spielplan.ts << 'EOF'
import { db } from '@/shared/db/database';

// Debug-Script für IndexedDB und Spielplan
async function debugSpielplan() {
  console.log('🔍 Debugging Spielplan & IndexedDB...\n');
  
  try {
    // 1. Prüfe Spiele in DB
    const spiele = await db.spiele.toArray();
    console.log(`📊 Spiele in IndexedDB: ${spiele.length}`);
    
    if (spiele.length > 0) {
      console.log('\n🎯 Erste 3 Spiele:');
      spiele.slice(0, 3).forEach((spiel, i) => {
        console.log(`  ${i+1}. ${spiel.heim} vs ${spiel.gast}`);
        console.log(`     Team-ID: ${spiel.team_id}`);
        console.log(`     Datum: ${spiel.datum}`);
        console.log(`     Status: ${spiel.status}`);
      });
    }
    
    // 2. Prüfe Teams
    const teams = await db.teams.toArray();
    console.log(`\n👥 Teams in IndexedDB: ${teams.length}`);
    teams.forEach(team => {
      console.log(`  - ${team.name} (ID: ${team.team_id})`);  // FIX: team_id statt id
    });
    
    // 3. Prüfe Duplikate
    const spieleByKey = new Map();
    let duplicates = 0;
    
    spiele.forEach(spiel => {
      const key = `${spiel.heim}-${spiel.gast}-${spiel.datum}`;
      if (spieleByKey.has(key)) {
        duplicates++;
        console.log(`\n⚠️ Duplikat gefunden: ${key}`);
      }
      spieleByKey.set(key, spiel);
    });
    
    if (duplicates > 0) {
      console.log(`\n❌ ${duplicates} Duplikate gefunden!`);
    } else {
      console.log('\n✅ Keine Duplikate gefunden');
    }
    
    // 4. Clear-Funktion für Tests
    console.log('\n💡 Zum Löschen aller Spiele: await db.spiele.clear()');
    console.log('💡 Zum Löschen aller Daten: await db.delete()');
    
  } catch (error) {
    console.error('❌ Fehler:', error);
  }
}

// Führe Debug aus
debugSpielplan();
EOF

# Fix 2: debug-helpers.ts
cat > basketball-app/src/utils/debug-helpers.ts << 'EOF'
// Debug Helper für Spielplan-Problem
// Füge dies in die Browser Console ein oder temporär in deine App

import { db } from '@/shared/db/database';
import type { Spiel } from '@/shared/types';

export async function debugSpielplanIssue() {
  console.group('🔍 Spielplan Debug');
  
  // 1. Check was in DB ist
  const spiele = await db.spiele.toArray();
  const teams = await db.teams.toArray();
  
  console.log(`📊 Daten in IndexedDB:`);
  console.log(`   - ${spiele.length} Spiele`);
  console.log(`   - ${teams.length} Teams`);
  
  // 2. Check nach Duplikaten
  const uniqueGames = new Set();
  const duplicates: Spiel[] = [];  // FIX: Explizit typisiert
  
  spiele.forEach(spiel => {
    const key = `${spiel.heim}-${spiel.gast}-${spiel.datum}`;
    if (uniqueGames.has(key)) {
      duplicates.push(spiel);
    }
    uniqueGames.add(key);
  });
  
  if (duplicates.length > 0) {
    console.warn(`⚠️ ${duplicates.length} Duplikate gefunden:`, duplicates);
  }
  
  // 3. Check Team-Zuordnung
  if (teams.length > 0 && spiele.length > 0) {
    const teamId = teams[0].team_id;  // FIX: team_id statt id
    const teamSpiele = spiele.filter(s => s.team_id === teamId);
    console.log(`🎯 Spiele für Team ${teams[0].name}: ${teamSpiele.length}`);
  }
  
  console.groupEnd();
  
  return { spiele, teams, duplicates };
}

// Funktion zum Bereinigen
export async function clearSpielplanData() {
  const confirm = window.confirm('Alle Spielplan-Daten löschen?');
  if (confirm) {
    await db.spiele.clear();
    console.log('✅ Spielplan-Daten gelöscht');
    window.location.reload(); // UI neu laden
  }
}

// Automatisch ausführen
debugSpielplanIssue();
EOF

echo "✅ TypeScript-Fixes wiederhergestellt!"
echo ""
echo "📋 Nächste Schritte:"
echo "1. git add basketball-app/src/debug-spielplan.ts basketball-app/src/utils/debug-helpers.ts"
echo "2. git commit -m \"fix: TypeScript Property-Fehler behoben\""
echo "3. Weitere Fixes wiederherstellen"
