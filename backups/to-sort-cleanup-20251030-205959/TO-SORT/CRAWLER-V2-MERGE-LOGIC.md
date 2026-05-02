# BBB Club Crawler v2 - Merge-Logik (Pseudo-Code)

## Überblick

Die Merge-Logik sorgt dafür dass:
- Bestehende Daten erhalten bleiben
- Neue Daten hinzugefügt werden
- Keine Duplikate entstehen
- Nur null-Werte überschrieben werden

---

## Schritt 0: Lade existierende Daten

```javascript
let existingData = { clubs: [] };

if (fs.existsSync(OUTPUT_FILE)) {
  console.log('📂 Lade existierende Daten...');
  const fileContent = fs.readFileSync(OUTPUT_FILE, 'utf8');
  existingData = JSON.parse(fileContent);
  
  // Backup erstellen
  const timestamp = Date.now();
  const backupFile = OUTPUT_FILE.replace('.json', `.backup-${timestamp}.json`);
  fs.writeFileSync(backupFile, fileContent, 'utf8');
  console.log(`✅ Backup: ${backupFile}`);
}

// Konvertiere zu Map für schnelles Lookup
const clubsMap = new Map();

// Importiere bestehende Clubs
for (const club of existingData.clubs || []) {
  clubsMap.set(club.clubId, {
    ...club,
    seasons: new Map(
      club.seasons.map(s => [
        s.seasonId,
        {
          ...s,
          teams: new Map(s.teams.map(t => [t.teamPermanentId, t]))
        }
      ])
    )
  });
}

console.log(`📊 Bestehende Daten: ${clubsMap.size} Clubs`);
```

---

## Schritt 1: Sammle neue Daten aus Tabellen

```javascript
let newClubs = 0;
let newSeasons = 0;
let newTeams = 0;

for (const liga of ligen) {
  const tableResp = await fetch(`/competition/table/id/${liga.ligaId}`);
  const tableData = await tableResp.json();
  
  // WICHTIG: ligaData aus Tabelle (hat korrekte seasonId!)
  const ligaData = tableData.data.ligaData;
  
  for (const entry of tableData.data.tabelle.entries) {
    const clubId = entry.team.clubId.toString();
    const seasonId = ligaData.seasonId;
    const teamPermanentId = entry.team.teamPermanentId.toString();
    
    // 1. Club initialisieren ODER bestehenden holen
    if (!clubsMap.has(clubId)) {
      clubsMap.set(clubId, {
        clubId: clubId,
        vereinsname: null,
        vereinsnummer: null,
        kontaktData: null,
        verbaende: [VERBAND_ID],
        seasons: new Map()
      });
      newClubs++;
    }
    
    const club = clubsMap.get(clubId);
    
    // Verband hinzufügen wenn nicht vorhanden
    if (!club.verbaende.includes(VERBAND_ID)) {
      club.verbaende.push(VERBAND_ID);
    }
    
    // 2. Season initialisieren ODER bestehende holen
    if (!club.seasons.has(seasonId)) {
      club.seasons.set(seasonId, {
        seasonId: seasonId,
        seasonName: ligaData.seasonName,
        teams: new Map()
      });
      newSeasons++;
    }
    
    const season = club.seasons.get(seasonId);
    
    // 3. Team initialisieren ODER bestehendes holen
    if (!season.teams.has(teamPermanentId)) {
      season.teams.set(teamPermanentId, {
        teamPermanentId: teamPermanentId,
        teamname: entry.team.teamname,
        teamnameSmall: entry.team.teamnameSmall,
        teamAkjId: null,
        teamAkj: null,
        teamGenderId: null,
        teamGender: null,
        teamNumber: null,
        ligen: []
      });
      newTeams++;
    }
    
    const team = season.teams.get(teamPermanentId);
    
    // 4. Liga hinzufügen (prüfe Duplikate!)
    const ligaExists = team.ligen.some(l => 
      l.ligaId === ligaData.ligaId.toString()
    );
    
    if (!ligaExists) {
      team.ligen.push({
        teamCompetitionId: entry.team.teamCompetitionId?.toString() || null,
        ligaId: ligaData.ligaId.toString(),
        liganame: ligaData.liganame,
        akName: ligaData.akName,
        geschlechtId: ligaData.geschlechtId,
        geschlecht: ligaData.geschlecht
      });
    }
  }
}

console.log(`📊 Neu: ${newClubs} Clubs, ${newSeasons} Seasons, ${newTeams} Teams`);
```

---

## Schritt 2: Lade Team-Details und merge

```javascript
/**
 * Sichere Merge-Funktion
 * Überschreibt nur wenn target[key] === null und source[key] != null
 */
function safeMerge(target, source, key) {
  if (target[key] === null && source[key] != null) {
    target[key] = source[key];
  }
}

let teamDetailsLoaded = 0;

for (const club of clubsMap.values()) {
  for (const season of club.seasons.values()) {
    for (const team of season.teams.values()) {
      
      try {
        const resp = await fetch(`/team/id/${team.teamPermanentId}/matches`);
        const teamData = await resp.json();
        
        // MERGE Team-Daten (NUR wenn noch null!)
        if (teamData.data?.team) {
          const td = teamData.data.team;
          
          safeMerge(team, td, 'teamAkjId');
          safeMerge(team, td, 'teamAkj');
          safeMerge(team, td, 'teamGenderId');
          safeMerge(team, td, 'teamGender');
          safeMerge(team, td, 'teamNumber');
        }
        
        // MERGE Club-Daten (NUR wenn noch null!)
        if (teamData.data?.team?.club) {
          const cd = teamData.data.team.club;
          
          // WICHTIG: vereinId NICHT übernehmen (= clubId)
          safeMerge(club, cd, 'vereinsname');
          safeMerge(club, cd, 'vereinsnummer');
          safeMerge(club, cd, 'kontaktData');
        }
        
        teamDetailsLoaded++;
        await sleep(DELAY_MS);
        
      } catch (error) {
        // Silent fail - behalte bestehende Daten
      }
    }
  }
}

console.log(`✅ ${teamDetailsLoaded} Team-Details geladen`);
```

---

## Schritt 3: Lade fehlende Kontaktdaten

```javascript
let kontaktDataLoaded = 0;
const clubsNeedingKontakt = [];

// Sammle Clubs ohne kontaktData
for (const club of clubsMap.values()) {
  if (club.kontaktData === null) {
    clubsNeedingKontakt.push(club);
  }
}

console.log(`📞 ${clubsNeedingKontakt.length} Clubs ohne kontaktData`);

// Lade Kontaktdaten für jeden Club
for (const club of clubsNeedingKontakt) {
  try {
    const resp = await fetch(
      `/rest/club/id/${club.clubId}/actualmatches?justHome=true&rangeDays=20`
    );
    const clubData = await resp.json();
    
    // Ergänze kontaktData wenn vorhanden
    if (clubData.data?.club?.kontaktData) {
      club.kontaktData = clubData.data.club.kontaktData;
      kontaktDataLoaded++;
    }
    
    // Auch andere Club-Daten ergänzen (nur wenn null!)
    if (clubData.data?.club) {
      const cd = clubData.data.club;
      
      safeMerge(club, { name: cd.name }, 'vereinsname');
      safeMerge(club, cd, 'vereinsnummer');
    }
    
    await sleep(DELAY_MS);
    
  } catch (error) {
    // Silent fail
  }
}

console.log(`✅ ${kontaktDataLoaded} kontaktData ergänzt`);
```

---

## Schritt 4: Konvertiere Maps zu Arrays

```javascript
const output = {
  metadata: {
    crawledAt: new Date().toISOString(),
    totalClubs: clubsMap.size,
    totalSeasons: Array.from(clubsMap.values()).reduce(
      (sum, c) => sum + c.seasons.size, 0
    ),
    totalTeams: Array.from(clubsMap.values()).reduce(
      (sum, c) => sum + Array.from(c.seasons.values()).reduce(
        (s, season) => s + season.teams.size, 0
      ), 0
    ),
    verbaende: [...new Set(
      Array.from(clubsMap.values()).flatMap(c => c.verbaende)
    )].sort((a, b) => a - b),
    note: 'Struktur: Club → Seasons → Teams → Ligen',
    lastUpdated: {
      newClubs: newClubs,
      newSeasons: newSeasons,
      newTeams: newTeams,
      teamDetailsLoaded: teamDetailsLoaded,
      kontaktDataLoaded: kontaktDataLoaded
    }
  },
  clubs: Array.from(clubsMap.values())
    .map(club => ({
      ...club,
      seasons: Array.from(club.seasons.values())
        .map(season => ({
          ...season,
          teams: Array.from(season.teams.values())
        }))
        .sort((a, b) => b.seasonId - a.seasonId) // Neueste zuerst
    }))
    .sort((a, b) => {
      const nameA = a.vereinsname || a.clubId;
      const nameB = b.vereinsname || b.clubId;
      return nameA.localeCompare(nameB);
    })
};

// Speichere JSON
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf8');
```

---

## Wichtige Merge-Regeln

### ✅ DO's

1. **Bestehende Daten laden** - Als Basis nutzen
2. **Backup erstellen** - Vor jedem Schreibvorgang
3. **Maps nutzen** - Für schnelles Lookup (O(1))
4. **Nur null überschreiben** - `safeMerge()`-Funktion
5. **Duplikate prüfen** - `team.ligen.some(...)`
6. **Arrays erweitern** - `.push()` statt Überschreiben
7. **Silent fail** - Bei einzelnen API-Errors weitermachen
8. **Sortieren** - Seasons DESC, Clubs ASC

### ❌ DON'Ts

1. **NICHT vereinId übernehmen** - Ist identisch mit clubId
2. **NICHT bestehende Werte überschreiben** - Nur null!
3. **NICHT Duplikate hinzufügen** - Liga-Check!
4. **NICHT bei Error abbrechen** - Partial Updates OK
5. **NICHT ohne Backup speichern** - Safety first!

---

## Performance-Optimierung

### Maps vs Arrays

```javascript
// ❌ Langsam: O(n) für jedes Lookup
const club = clubs.find(c => c.clubId === id);

// ✅ Schnell: O(1) für jedes Lookup
const club = clubsMap.get(id);
```

### Batch-Updates

```javascript
// Teams in Batches verarbeiten (z.B. 10 parallel)
const BATCH_SIZE = 10;
for (let i = 0; i < teams.length; i += BATCH_SIZE) {
  const batch = teams.slice(i, i + BATCH_SIZE);
  await Promise.all(batch.map(loadTeamDetails));
}
```

---

## Beispiel-Output

```json
{
  "metadata": {
    "crawledAt": "2025-10-22T16:00:00Z",
    "totalClubs": 283,
    "totalSeasons": 2,
    "totalTeams": 900,
    "verbaende": [2, 9],
    "lastUpdated": {
      "newClubs": 5,
      "newSeasons": 1,
      "newTeams": 450,
      "teamDetailsLoaded": 450,
      "kontaktDataLoaded": 23
    }
  },
  "clubs": [...]
}
```

Zeigt genau was beim letzten Crawl passiert ist!
