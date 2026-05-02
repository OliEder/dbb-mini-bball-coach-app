// Quick Fix für Team-ID Mismatch Problem
// Führe dies in der Browser Console aus:

async function fixTeamIdMismatch() {
  // Hole DB
  const { db } = await import('./src/shared/db/database.js');
  
  // 1. Hole das lokale Team (mit UUID)
  const teams = await db.teams.toArray();
  console.log('Lokale Teams:', teams);
  
  if (teams.length === 0) {
    console.error('Keine Teams gefunden!');
    return;
  }
  
  const localTeam = teams[0]; // Fibalon Baskets Neumarkt
  console.log(`Lokales Team: ${localTeam.name} (ID: ${localTeam.id})`);
  
  // 2. Hole alle Spiele
  const spiele = await db.spiele.toArray();
  console.log(`Gefundene Spiele: ${spiele.length}`);
  
  // 3. Finde Spiele die zum Team gehören (nach Namen)
  const teamSpiele = spiele.filter(spiel => 
    spiel.heim === localTeam.name || 
    spiel.gast === localTeam.name
  );
  
  console.log(`Spiele für ${localTeam.name}: ${teamSpiele.length}`);
  
  // 4. Update team_id für diese Spiele
  let updated = 0;
  for (const spiel of teamSpiele) {
    await db.spiele.update(spiel.spiel_id, {
      team_id: localTeam.id // Setze lokale UUID
    });
    updated++;
  }
  
  console.log(`✅ ${updated} Spiele aktualisiert mit korrekter team_id`);
  
  // 5. Reload die Seite
  if (updated > 0) {
    console.log('Seite wird neu geladen...');
    setTimeout(() => location.reload(), 1000);
  }
}

// Ausführen
fixTeamIdMismatch();
