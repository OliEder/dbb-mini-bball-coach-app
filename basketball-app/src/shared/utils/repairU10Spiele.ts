/**
 * DB Repair Script - Fix U10 Spiele
 * 
 * Problem:
 * - U10-Spiele haben nur team_id, nicht heim_team_id/gast_team_id
 * - Dashboard/Spielplan findet sie nicht
 * 
 * Lösung:
 * - Findet alle Spiele mit team_id aber ohne heim/gast IDs
 * - Setzt heim_team_id oder gast_team_id basierend auf ist_heimspiel
 */

import { db } from '@/shared/db/database';

export async function repairU10Spiele(): Promise<void> {
  console.log('🔧 Starting DB Repair: U10 Spiele...');
  
  try {
    // 1. Finde alle Spiele mit team_id aber ohne heim_team_id UND gast_team_id
    const alleSpiele = await db.spiele.toArray();
    
    const brokenSpiele = alleSpiele.filter(spiel => 
      spiel.team_id && 
      (!spiel.heim_team_id || spiel.heim_team_id === '') &&
      (!spiel.gast_team_id || spiel.gast_team_id === '')
    );
    
    console.log('📊 Gefundene defekte Spiele:', brokenSpiele.length);
    
    if (brokenSpiele.length === 0) {
      console.log('✅ Keine defekten Spiele gefunden - alles OK!');
      return;
    }
    
    // 2. Repariere jedes Spiel
    let repaired = 0;
    
    for (const spiel of brokenSpiele) {
      const istHeim = spiel.ist_heimspiel ?? true; // Fallback: Heimspiel
      
      const updates: Partial<typeof spiel> = {};
      
      if (istHeim) {
        // Heimspiel → setze heim_team_id
        updates.heim_team_id = spiel.team_id;
        console.log(`  🏠 ${spiel.heim} vs ${spiel.gast} → heim_team_id gesetzt`);
      } else {
        // Auswärtsspiel → setze gast_team_id
        updates.gast_team_id = spiel.team_id;
        console.log(`  🚌 ${spiel.heim} vs ${spiel.gast} → gast_team_id gesetzt`);
      }
      
      await db.spiele.update(spiel.spiel_id, updates);
      repaired++;
    }
    
    console.log(`✅ DB Repair abgeschlossen: ${repaired} Spiele repariert`);
    
    // 3. Validierung
    const validation = await db.spiele.toArray();
    const stillBroken = validation.filter(spiel => 
      spiel.team_id && 
      (!spiel.heim_team_id || spiel.heim_team_id === '') &&
      (!spiel.gast_team_id || spiel.gast_team_id === '')
    );
    
    if (stillBroken.length > 0) {
      console.warn('⚠️ Noch', stillBroken.length, 'defekte Spiele vorhanden!');
    } else {
      console.log('✅ Alle Spiele erfolgreich repariert!');
    }
    
  } catch (error) {
    console.error('❌ DB Repair fehlgeschlagen:', error);
    throw error;
  }
}

// Expose für Console
if (typeof window !== 'undefined') {
  (window as any).repairU10Spiele = repairU10Spiele;
}
