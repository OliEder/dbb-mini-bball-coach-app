import { db } from '@/shared/db/database';

// Debug-Script für IndexedDB und Spielplan
// ✅ v6.0: Updated for new schema (team_id removed from Spiel)
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
        console.log(`     Heim-Team-ID: ${spiel.heim_team_id || 'N/A'}`);
        console.log(`     Gast-Team-ID: ${spiel.gast_team_id || 'N/A'}`);
        console.log(`     Datum: ${spiel.datum}`);
        console.log(`     Status: ${spiel.status}`);
      });
    }
    
    // 2. Prüfe Teams
    const teams = await db.teams.toArray();
    console.log(`\n👥 Teams in IndexedDB: ${teams.length}`);
    teams.forEach(team => {
      console.log(`  - ${team.name} (ID: ${team.team_id})`);
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
