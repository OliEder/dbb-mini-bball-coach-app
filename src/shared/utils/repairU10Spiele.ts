/**
 * DB Repair Script - Validate Spiele (v6.0)
 * 
 * ✅ v6.0 Update: team_id wurde aus Spiel-Entity entfernt!
 * 
 * Neuer Zweck:
 * - Findet alle Spiele OHNE heim_team_id UND gast_team_id (Fehlerfall)
 * - Solche Spiele sollten nicht existieren nach v6.0 Migration
 * 
 * @deprecated After v6.0 migration, all games should have team references
 */

import { db } from '@/shared/db/database';

export async function repairU10Spiele(): Promise<void> {
  console.log('🔧 Starting DB Validation: Spiele (v6.0)...');
  
  try {
    // ✅ v6.0: Finde alle Spiele OHNE Team-Referenzen (Fehlerfall!)
    const alleSpiele = await db.spiele.toArray();
    
    const brokenSpiele = alleSpiele.filter(spiel => 
      (!spiel.heim_team_id || spiel.heim_team_id === '') &&
      (!spiel.gast_team_id || spiel.gast_team_id === '')
    );
    
    console.log('📊 Gefundene defekte Spiele:', brokenSpiele.length);
    
    if (brokenSpiele.length === 0) {
      console.log('✅ Keine defekten Spiele gefunden - alles OK!');
      return;
    }
    
    // ⚠️ v6.0: Spiele OHNE Team-Referenzen sind ein Fehler!
    console.error('❌ Gefundene Spiele ohne heim_team_id UND gast_team_id:');
    brokenSpiele.forEach(spiel => {
      console.error(`  - ${spiel.heim} vs ${spiel.gast} (${spiel.datum})`);
      console.error(`    Spiel-ID: ${spiel.spiel_id}`);
    });
    
    console.warn('💡 Diese Spiele sollten manuell repariert oder gelöscht werden!');
    console.warn('💡 Vermutlich fehlerhafte Daten aus altem Sync.');
    
  } catch (error) {
    console.error('❌ DB Validation fehlgeschlagen:', error);
    throw error;
  }
}

// Expose für Console
if (typeof window !== 'undefined') {
  (window as any).repairU10Spiele = repairU10Spiele;
}
