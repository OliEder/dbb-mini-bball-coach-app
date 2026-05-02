// Vereinfachtes Fix-Script ohne Import
// Nutzt IndexedDB direkt

async function fixTeamIdDirectly() {
  console.log('🔍 Öffne IndexedDB direkt...');
  
  // Öffne IndexedDB direkt
  const request = indexedDB.open('BasketballApp');
  
  request.onsuccess = async function(event) {
    const db = event.target.result;
    console.log('✅ Datenbank geöffnet:', db.name);
    
    // Liste alle Object Stores
    const storeNames = db.objectStoreNames;
    console.log('Object Stores:', Array.from(storeNames));
    
    // Starte Transaktion
    const transaction = db.transaction(['teams', 'spiele'], 'readwrite');
    const teamsStore = transaction.objectStore('teams');
    const spieleStore = transaction.objectStore('spiele');
    
    // Hole Teams
    const teamsRequest = teamsStore.getAll();
    teamsRequest.onsuccess = async function() {
      const teams = teamsRequest.result;
      console.log('Teams gefunden:', teams);
      
      const fibalon = teams.find(t => 
        t.name === 'Fibalon Baskets Neumarkt' || 
        t.name?.includes('Fibalon')
      );
      
      if (!fibalon) {
        console.error('❌ Fibalon Team nicht gefunden');
        return;
      }
      
      console.log('✅ Fibalon gefunden:', fibalon);
      
      // Hole Spiele
      const spieleRequest = spieleStore.getAll();
      spieleRequest.onsuccess = function() {
        const spiele = spieleRequest.result;
        console.log(`📊 ${spiele.length} Spiele gefunden`);
        
        // Finde Fibalon-Spiele
        const fibalonSpiele = spiele.filter(s => 
          s.heim === 'Fibalon Baskets Neumarkt' || 
          s.gast === 'Fibalon Baskets Neumarkt'
        );
        
        console.log(`🎯 ${fibalonSpiele.length} Fibalon-Spiele gefunden`);
        
        // Update team_id
        let updateCount = 0;
        fibalonSpiele.forEach(spiel => {
          // Update das Spiel
          spiel.team_id = fibalon.id || fibalon.team_id;
          spiel.ist_heimspiel = spiel.heim === 'Fibalon Baskets Neumarkt';
          
          const updateRequest = spieleStore.put(spiel);
          updateRequest.onsuccess = () => {
            updateCount++;
            if (updateCount === fibalonSpiele.length) {
              console.log(`✅ ${updateCount} Spiele aktualisiert!`);
              console.log('🔄 Seite wird neu geladen...');
              setTimeout(() => location.reload(), 2000);
            }
          };
        });
        
        if (fibalonSpiele.length === 0) {
          console.log('⚠️ Keine Spiele zum Updaten gefunden');
        }
      };
    };
  };
  
  request.onerror = function() {
    console.error('❌ Fehler beim Öffnen der Datenbank');
  };
}

// Ausführen
fixTeamIdDirectly();
