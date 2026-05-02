// Korrigiertes Fix-Script für Browser Console
// Der Import muss ohne '.js' Extension sein

async function fixTeamIdMismatch() {
  // Hole DB - KORREKTER IMPORT
  const { db } = window; // Die DB ist global verfügbar in der App
  
  // Falls db nicht global ist, versuche:
  // const db = window.db || window.database || window.DB;
  
  if (!db) {
    console.error('❌ Datenbank nicht gefunden. Versuche alternativen Ansatz...');
    return;
  }
  
  // 1. Hole das lokale Team (mit UUID)
  const teams = await db.teams.toArray();
  console.log('Lokale Teams:', teams);
  
  if (teams.length === 0) {
    console.error('Keine Teams gefunden!');
    return;
  }
  
  const localTeam = teams.find(t => t.name === 'Fibalon Baskets Neumarkt') || teams[0];
  console.log(`Lokales Team: ${localTeam.name} (ID: ${localTeam.id || localTeam.team_id})`);
  
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
    const teamId = localTeam.id || localTeam.team_id;
    await db.spiele.update(spiel.spiel_id, {
      team_id: teamId, // Setze lokale UUID
      ist_heimspiel: spiel.heim === localTeam.name // Korrigiere auch ist_heimspiel
    });
    updated++;
  }
  
  console.log(`✅ ${updated} Spiele aktualisiert mit korrekter team_id`);
  
  // 5. Reload die Seite
  if (updated > 0) {
    console.log('Seite wird in 2 Sekunden neu geladen...');
    setTimeout(() => location.reload(), 2000);
  }
}

// Ausführen
fixTeamIdMismatch();
