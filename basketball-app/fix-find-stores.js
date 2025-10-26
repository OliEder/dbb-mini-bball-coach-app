// Script um die korrekten Store-Namen zu finden und dann zu fixen

// Schritt 1: Finde die korrekten Store-Namen
async function findAndFixSpiele() {
  console.log('🔍 Suche Datenbank-Struktur...');
  
  // Öffne IndexedDB
  const dbRequest = indexedDB.open('BasketballApp');
  
  dbRequest.onsuccess = function(e) {
    const db = e.target.result;
    console.log('✅ Datenbank geöffnet:', db.name);
    console.log('📊 Version:', db.version);
    
    // Liste alle Object Stores
    const storeNames = Array.from(db.objectStoreNames);
    console.log('📦 Object Stores:', storeNames);
    
    // Finde die richtigen Store-Namen
    const teamStore = storeNames.find(name => 
      name.includes('team') || name.includes('Team')
    );
    const spielStore = storeNames.find(name => 
      name.includes('spiel') || name.includes('Spiel') || name.includes('game')
    );
    
    console.log('Team Store:', teamStore);
    console.log('Spiel Store:', spielStore);
    
    if (!teamStore || !spielStore) {
      console.error('❌ Stores nicht gefunden!');
      console.log('Verfügbare Stores:', storeNames);
      return;
    }
    
    // Jetzt mit den richtigen Namen arbeiten
    const tx = db.transaction([teamStore, spielStore], 'readwrite');
    
    // Hole Teams
    tx.objectStore(teamStore).getAll().onsuccess = function(e) {
      const teams = e.target.result;
      console.log(`📊 ${teams.length} Teams gefunden`);
      
      const myTeam = teams.find(t => 
        t.name === 'Fibalon Baskets Neumarkt' || 
        t.name?.includes('Fibalon')
      );
      
      if (!myTeam) {
        console.error('❌ Fibalon Team nicht gefunden!');
        console.log('Verfügbare Teams:', teams.map(t => t.name));
        return;
      }
      
      console.log('✅ Team gefunden:', myTeam);
      const teamId = myTeam.id || myTeam.team_id;
      console.log('Team ID:', teamId);
      
      // Hole und update Spiele
      const spieleStore = tx.objectStore(spielStore);
      spieleStore.getAll().onsuccess = function(e) {
        const spiele = e.target.result;
        console.log(`📊 ${spiele.length} Spiele gefunden`);
        
        let updateCount = 0;
        let fibalonCount = 0;
        
        spiele.forEach(spiel => {
          // Debug: Erste paar Spiele anzeigen
          if (updateCount < 3) {
            console.log('Beispiel Spiel:', {
              heim: spiel.heim,
              gast: spiel.gast,
              team_id: spiel.team_id
            });
          }
          
          if (spiel.heim === 'Fibalon Baskets Neumarkt' || 
              spiel.gast === 'Fibalon Baskets Neumarkt') {
            fibalonCount++;
            
            // Update nur wenn team_id falsch ist
            if (spiel.team_id !== teamId) {
              spiel.team_id = teamId;
              spiel.ist_heimspiel = spiel.heim === 'Fibalon Baskets Neumarkt';
              spieleStore.put(spiel);
              updateCount++;
            }
          }
        });
        
        console.log(`🎯 ${fibalonCount} Fibalon-Spiele gefunden`);
        console.log(`✅ ${updateCount} Spiele aktualisiert!`);
        
        if (updateCount > 0) {
          console.log('🔄 Seite wird in 2 Sekunden neu geladen...');
          setTimeout(() => location.reload(), 2000);
        } else {
          console.log('ℹ️ Keine Updates nötig - team_id ist bereits korrekt');
        }
      };
    };
    
    tx.onerror = function(e) {
      console.error('❌ Transaction Error:', e);
    };
  };
  
  dbRequest.onerror = function(e) {
    console.error('❌ Database Error:', e);
  };
}

// Ausführen
findAndFixSpiele();
