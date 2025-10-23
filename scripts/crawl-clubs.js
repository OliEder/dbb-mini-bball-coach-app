#!/usr/bin/env node
/**
 * BBB Club Crawler v3
 * 
 * KORREKTE Struktur: Club → Teams → Seasons → Ligen
 * 
 * Prozess:
 * 1. Lade ALLE Ligen (ohne Saison-Filter!)
 * 2. Extrahiere Teams aus Tabellen, gruppiere nach Club/Team/Season
 * 3. Lade Team-Details (teamAkj ist FIX!)
 * 4. Ergänze fehlende Kontaktdaten
 * 5. Transformiere Maps → Arrays und speichere
 */

const fs = require('fs');
const path = require('path');

// Config
const args = process.argv.slice(2);
const verbandIdArg = args.find(arg => arg.startsWith('--verband='));

const VERBAND_ID = verbandIdArg 
  ? parseInt(verbandIdArg.split('=')[1]) 
  : null;

if (!VERBAND_ID) {
  console.error('❌ Fehler: Verband muss angegeben werden!');
  console.log('\nUsage: npm run crawl:clubs -- --verband=2');
  console.log('\nBeispiele:');
  console.log('  --verband=2   Bayern');
  console.log('  --verband=1   Baden-Württemberg');
  console.log('  --verband=10  NRW');
  console.log('\nOptionen:');
  console.log('  --skip-kontakt     Überspringe Kontaktdaten-Check (schneller)');
  console.log('  --force            Ignoriere Cache, crawle immer');
  process.exit(1);
}

const SKIP_KONTAKT = args.some(arg => arg === '--skip-kontakt');
const FORCE_CRAWL = args.some(arg => arg === '--force');

const BASE_URL = 'https://www.basketball-bund.net';
const OUTPUT_FILE = path.join(
  __dirname, '..', 'basketball-app', 'src', 'shared', 'data', 
  'clubs-germany.json'
);

const DELAY_MS = 100;
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Schritt 1: Lade alle Ligen (OHNE Saison-Filter!)
 */
async function loadAllLigen() {
  log('\n📋 Schritt 1: Lade alle Ligen...', 'blue');
  
  const allLigen = [];
  let startIndex = 0;
  const pageSize = 10;
  let hasMore = true;
  
  while (hasMore) {
    try {
      const url = `${BASE_URL}/rest/wam/liga/list?startAtIndex=${startIndex}`;
      log(`   Lade Seite ${Math.floor(startIndex / pageSize) + 1}...`, 'cyan');
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: 0,
          verbandIds: [VERBAND_ID],
          gebietIds: [],
          ligatypIds: [],
          akgGeschlechtIds: [],
          altersklasseIds: [],
          spielklasseIds: []
          // KEIN saison Parameter! Wir wollen ALLE Saisons
        })
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      
      if (data.data && data.data.ligen && data.data.ligen.length > 0) {
        allLigen.push(...data.data.ligen);
        log(`   ✓ ${data.data.ligen.length} Ligen (Gesamt: ${allLigen.length})`, 'green');
        startIndex += pageSize;
        await sleep(DELAY_MS);
        
        if (!data.data.hasMoreData) hasMore = false;
      } else {
        hasMore = false;
      }
      
      if (startIndex >= 1000) {
        log('   ⚠️  Safety limit (1000)', 'yellow');
        hasMore = false;
      }
      
    } catch (error) {
      log(`   ❌ Fehler: ${error.message}`, 'red');
      hasMore = false;
    }
  }
  
  log(`\n✅ ${allLigen.length} Ligen geladen`, 'green');
  return allLigen;
}

/**
 * Schritt 2: Extrahiere Teams und gruppiere nach Club → Team → Season
 */
async function extractAndGroupTeams(ligen) {
  log('\n🏀 Schritt 2: Extrahiere Teams und gruppiere...', 'blue');
  
  // Hierarchie: Map<clubId, Club>
  // Club.teams: Map<teamPermanentId, Team>
  // Team.seasons: Map<seasonId, Season>
  const clubsMap = new Map();
  
  let processedCount = 0;
  const seasonIds = new Set();
  
  for (const liga of ligen) {
    try {
      processedCount++;
      
      if (processedCount % 50 === 0) {
        log(`   ${processedCount}/${ligen.length} Ligen verarbeitet`, 'cyan');
      }
      
      const url = `${BASE_URL}/rest/competition/table/id/${liga.ligaId}`;
      const response = await fetch(url);
      
      if (!response.ok) continue;
      
      const data = await response.json();
      
      // ligaData aus Tabelle hat korrekte seasonId!
      const ligaData = data.data?.ligaData || liga;
      
      if (!ligaData.seasonId) {
        log(`   ⚠️  Liga ${liga.ligaId} hat keine seasonId`, 'yellow');
        continue;
      }
      
      seasonIds.add(ligaData.seasonId);
      
      if (data.data?.tabelle?.entries) {
        data.data.tabelle.entries.forEach(entry => {
          if (!entry.team?.clubId || !entry.team?.teamPermanentId) return;
          
          const clubId = entry.team.clubId.toString();
          const teamPermanentId = entry.team.teamPermanentId.toString();
          const seasonId = ligaData.seasonId;
          
          // Club initialisieren
          if (!clubsMap.has(clubId)) {
            clubsMap.set(clubId, {
              clubId: clubId,
              vereinsname: null,
              vereinsnummer: null,
              kontaktData: null,
              verbaende: [VERBAND_ID],
              teams: new Map()
            });
          }
          
          const club = clubsMap.get(clubId);
          
          // Team initialisieren
          if (!club.teams.has(teamPermanentId)) {
            club.teams.set(teamPermanentId, {
              teamPermanentId: teamPermanentId,
              teamname: entry.team.teamname,
              teamnameSmall: entry.team.teamnameSmall,
              teamAkjId: null,    // Wird von /team/.../matches gesetzt
              teamAkj: null,      // ← FIX! Einmal setzen, nie überschreiben
              teamGenderId: null,
              teamGender: null,
              teamNumber: null,
              seasons: new Map()
            });
          }
          
          const team = club.teams.get(teamPermanentId);
          
          // Season initialisieren
          if (!team.seasons.has(seasonId)) {
            team.seasons.set(seasonId, {
              seasonId: seasonId,
              seasonName: ligaData.seasonName,
              ligen: []
            });
          }
          
          const season = team.seasons.get(seasonId);
          
          // Liga hinzufügen
          season.ligen.push({
            teamCompetitionId: entry.team.teamCompetitionId?.toString() || null,
            ligaId: ligaData.ligaId.toString(),
            liganame: ligaData.liganame,
            akName: ligaData.akName,        // Liga-AK (kann höher sein!)
            geschlechtId: ligaData.geschlechtId,
            geschlecht: ligaData.geschlecht
          });
        });
      }
      
      await sleep(DELAY_MS);
      
    } catch (error) {
      // Silent fail
    }
  }
  
  log(`\n✅ Gruppierung abgeschlossen:`, 'green');
  log(`   Clubs: ${clubsMap.size}`, 'cyan');
  log(`   Teams: ${Array.from(clubsMap.values()).reduce((sum, c) => sum + c.teams.size, 0)}`, 'cyan');
  log(`   Seasons: ${seasonIds.size} (${Array.from(seasonIds).sort().join(', ')})`, 'cyan');
  
  return clubsMap;
}

/**
 * Schritt 3: Lade Team-Details (teamAkj ist FIX!)
 */
async function loadTeamDetails(clubsMap) {
  log('\n📞 Schritt 3: Lade Team-Details (teamAkj)...', 'blue');
  
  const allTeams = [];
  for (const club of clubsMap.values()) {
    for (const team of club.teams.values()) {
      allTeams.push({ club, team });
    }
  }
  
  let processedCount = 0;
  
  for (const { club, team } of allTeams) {
    try {
      processedCount++;
      
      if (processedCount % 50 === 0) {
        log(`   ${processedCount}/${allTeams.length} Teams`, 'cyan');
      }
      
      const url = `${BASE_URL}/rest/team/id/${team.teamPermanentId}/matches`;
      const response = await fetch(url);
      
      if (!response.ok) continue;
      
      const data = await response.json();
      
      // Team-Daten (NUR wenn noch null!)
      if (data.data?.team) {
        const teamData = data.data.team;
        
        // teamAkj ist PERMANENT - nur einmal setzen!
        if (!team.teamAkj && teamData.teamAkj) {
          team.teamAkjId = teamData.teamAkjId;
          team.teamAkj = teamData.teamAkj;
        }
        
        if (!team.teamGender && teamData.teamGender) {
          team.teamGenderId = teamData.teamGenderId;
          team.teamGender = teamData.teamGender;
        }
        
        if (!team.teamNumber && teamData.teamNumber) {
          team.teamNumber = teamData.teamNumber;
        }
        
        // Club-Daten (NUR wenn noch null!)
        if (teamData.club) {
          const clubData = teamData.club;
          
          if (!club.vereinsname && clubData.vereinsname) {
            club.vereinsname = clubData.vereinsname;
          }
          
          if (!club.vereinsnummer && clubData.vereinsnummer) {
            club.vereinsnummer = clubData.vereinsnummer;
          }
          
          if (!club.kontaktData && clubData.kontaktData) {
            club.kontaktData = clubData.kontaktData;
          }
        }
      }
      
      await sleep(DELAY_MS);
      
    } catch (error) {
      // Silent fail
    }
  }
  
  log(`\n✅ Team-Details geladen`, 'green');
  return clubsMap;
}

/**
 * Schritt 4: Ergänze fehlende Kontaktdaten
 */
async function loadMissingKontaktData(clubsMap) {
  if (SKIP_KONTAKT) {
    log('\n⏭️  Schritt 4: Kontaktdaten übersprungen (--skip-kontakt)', 'yellow');
    return clubsMap;
  }
  
  log('\n📞 Schritt 4: Ergänze fehlende Kontaktdaten...', 'blue');
  
  const clubsWithoutKontakt = Array.from(clubsMap.values())
    .filter(c => !c.kontaktData);
  
  log(`   ${clubsWithoutKontakt.length} Clubs ohne kontaktData`, 'cyan');
  
  let processedCount = 0;
  let successCount = 0;
  
  for (const club of clubsWithoutKontakt) {
    try {
      processedCount++;
      
      if (processedCount % 20 === 0) {
        log(`   ${processedCount}/${clubsWithoutKontakt.length} Clubs`, 'cyan');
      }
      
      const url = `${BASE_URL}/rest/club/id/${club.clubId}/actualmatches`;
      const response = await fetch(url);
      
      if (!response.ok) continue;
      
      const data = await response.json();
      
      if (data.data?.club?.kontaktData) {
        club.kontaktData = data.data.club.kontaktData;
        successCount++;
      }
      
      await sleep(DELAY_MS);
      
    } catch (error) {
      // Silent fail
    }
  }
  
  log(`\n✅ ${successCount} kontaktData ergänzt`, 'green');
  return clubsMap;
}

/**
 * Schritt 5: Transformiere Maps → Arrays und speichere
 */
function transformAndSave(clubsMap) {
  log('\n💾 Schritt 5: Transformiere und speichere...', 'blue');
  
  // Sammle alle Verbaende
  const allVerbaende = new Set();
  for (const club of clubsMap.values()) {
    club.verbaende.forEach(v => allVerbaende.add(v));
  }
  
  // Konvertiere Maps zu Arrays
  const clubs = Array.from(clubsMap.values()).map(club => {
    const teams = Array.from(club.teams.values()).map(team => {
      const seasons = Array.from(team.seasons.values())
        .map(season => ({
          seasonId: season.seasonId,
          seasonName: season.seasonName,
          ligen: season.ligen
        }))
        .sort((a, b) => b.seasonId - a.seasonId); // Neueste zuerst
      
      return {
        teamPermanentId: team.teamPermanentId,
        teamname: team.teamname,
        teamnameSmall: team.teamnameSmall,
        teamAkjId: team.teamAkjId,
        teamAkj: team.teamAkj,
        teamGenderId: team.teamGenderId,
        teamGender: team.teamGender,
        teamNumber: team.teamNumber,
        seasons: seasons
      };
    }).sort((a, b) => (a.teamNumber || 0) - (b.teamNumber || 0)); // Nach Nummer
    
    return {
      clubId: club.clubId,
      vereinsname: club.vereinsname,
      vereinsnummer: club.vereinsnummer,
      kontaktData: club.kontaktData,
      verbaende: club.verbaende,
      teams: teams
    };
  }).sort((a, b) => {
    const nameA = a.vereinsname || a.clubId;
    const nameB = b.vereinsname || b.clubId;
    return nameA.localeCompare(nameB);
  }); // Alphabetisch
  
  const totalTeams = clubs.reduce((sum, c) => sum + c.teams.length, 0);
  const totalSeasons = new Set(
    clubs.flatMap(c => 
      c.teams.flatMap(t => 
        t.seasons.map(s => s.seasonId)
      )
    )
  ).size;
  
  // Lade existierende Metadata für Merge
  let existingMetadata = {};
  if (fs.existsSync(OUTPUT_FILE)) {
    try {
      const existing = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
      existingMetadata = existing.metadata || {};
    } catch (error) {
      // Ignore
    }
  }
  
  // Update verbandLastCrawled
  const verbandLastCrawled = existingMetadata.verbandLastCrawled || {};
  verbandLastCrawled[VERBAND_ID] = {
    timestamp: new Date().toISOString(),
    ligaCount: clubs.reduce((sum, c) => 
      sum + c.teams.reduce((tsum, t) => 
        tsum + t.seasons.reduce((ssum, s) => ssum + s.ligen.length, 0)
      , 0)
    , 0)
  };
  
  const output = {
    metadata: {
      crawledAt: new Date().toISOString(),
      totalClubs: clubs.length,
      totalTeams: totalTeams,
      totalSeasons: totalSeasons,
      verbaende: Array.from(allVerbaende).sort((a, b) => a - b),
      verbandLastCrawled: verbandLastCrawled,
      note: 'Struktur: Club → Teams → Seasons → Ligen'
    },
    clubs: clubs
  };
  
  const dir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf8');
  
  const sizeKB = (fs.statSync(OUTPUT_FILE).size / 1024).toFixed(2);
  log(`\n✅ Gespeichert: ${OUTPUT_FILE}`, 'green');
  log(`   Dateigröße: ${sizeKB} KB`, 'cyan');
  log(`   Clubs: ${clubs.length}`, 'cyan');
  log(`   Teams: ${totalTeams}`, 'cyan');
  log(`   Seasons: ${totalSeasons}`, 'cyan');
}

/**
 * Lade existierende Daten (falls vorhanden)
 */
function loadExistingData() {
  if (!fs.existsSync(OUTPUT_FILE)) {
    log('📂 Keine existierende Datei gefunden - Erstcrawl', 'yellow');
    return null;
  }
  
  try {
    const content = fs.readFileSync(OUTPUT_FILE, 'utf8');
    const data = JSON.parse(content);
    log(`📂 Existierende Daten geladen: ${data.clubs.length} Clubs`, 'cyan');
    return data;
  } catch (error) {
    log(`⚠️  Fehler beim Laden: ${error.message}`, 'yellow');
    return null;
  }
}

/**
 * Erstelle Backup der existierenden Datei
 */
function createBackup() {
  if (!fs.existsSync(OUTPUT_FILE)) return;
  
  const timestamp = Date.now();
  const backupFile = OUTPUT_FILE.replace('.json', `.backup-${timestamp}.json`);
  
  try {
    fs.copyFileSync(OUTPUT_FILE, backupFile);
    log(`✅ Backup erstellt: ${path.basename(backupFile)}`, 'green');
  } catch (error) {
    log(`⚠️  Backup fehlgeschlagen: ${error.message}`, 'yellow');
  }
}

/**
 * Merge neue Daten mit existierenden Daten
 */
function mergeWithExisting(existingData, newClubsMap) {
  if (!existingData) return newClubsMap;
  
  log('\n🔄 Merge mit existierenden Daten...', 'blue');
  
  // Konvertiere existierende Clubs zu Map
  const mergedClubsMap = new Map();
  
  // Lade existierende Clubs
  existingData.clubs.forEach(club => {
    const clubMap = new Map();
    
    // Konvertiere Teams zu Map
    club.teams.forEach(team => {
      const seasonMap = new Map();
      
      // Konvertiere Seasons zu Map
      team.seasons.forEach(season => {
        seasonMap.set(season.seasonId, season);
      });
      
      clubMap.set(team.teamPermanentId, {
        ...team,
        seasons: seasonMap
      });
    });
    
    mergedClubsMap.set(club.clubId, {
      ...club,
      verbaende: club.verbaende || [],  // Fallback zu leerem Array
      teams: clubMap
    });
  });
  
  // Merge neue Daten
  let newClubs = 0;
  let newTeams = 0;
  let newSeasons = 0;
  
  for (const [clubId, newClub] of newClubsMap.entries()) {
    if (!mergedClubsMap.has(clubId)) {
      // Neuer Club
      mergedClubsMap.set(clubId, newClub);
      newClubs++;
    } else {
      // Existierender Club - Merge
      const existingClub = mergedClubsMap.get(clubId);
      
      // Füge Verband hinzu (wenn noch nicht vorhanden)
      if (!existingClub.verbaende.includes(VERBAND_ID)) {
        existingClub.verbaende.push(VERBAND_ID);
      }
      
      // Merge Club-Daten (nur null-Werte überschreiben)
      if (!existingClub.vereinsname && newClub.vereinsname) {
        existingClub.vereinsname = newClub.vereinsname;
      }
      if (!existingClub.vereinsnummer && newClub.vereinsnummer) {
        existingClub.vereinsnummer = newClub.vereinsnummer;
      }
      if (!existingClub.kontaktData && newClub.kontaktData) {
        existingClub.kontaktData = newClub.kontaktData;
      }
      
      // Merge Teams
      for (const [teamId, newTeam] of newClub.teams.entries()) {
        if (!existingClub.teams.has(teamId)) {
          // Neues Team
          existingClub.teams.set(teamId, newTeam);
          newTeams++;
        } else {
          // Existierendes Team - Merge Seasons
          const existingTeam = existingClub.teams.get(teamId);
          
          // Merge Team-Daten (nur null-Werte)
          if (!existingTeam.teamAkj && newTeam.teamAkj) {
            existingTeam.teamAkjId = newTeam.teamAkjId;
            existingTeam.teamAkj = newTeam.teamAkj;
          }
          if (!existingTeam.teamGender && newTeam.teamGender) {
            existingTeam.teamGenderId = newTeam.teamGenderId;
            existingTeam.teamGender = newTeam.teamGender;
          }
          if (!existingTeam.teamNumber && newTeam.teamNumber) {
            existingTeam.teamNumber = newTeam.teamNumber;
          }
          
          // Merge Seasons
          for (const [seasonId, newSeason] of newTeam.seasons.entries()) {
            if (!existingTeam.seasons.has(seasonId)) {
              // Neue Season
              existingTeam.seasons.set(seasonId, newSeason);
              newSeasons++;
            } else {
              // Existierende Season - Merge Ligen
              const existingSeason = existingTeam.seasons.get(seasonId);
              
              // Füge neue Ligen hinzu (dedupliziere nach ligaId)
              const existingLigaIds = new Set(
                existingSeason.ligen.map(l => l.ligaId)
              );
              
              newSeason.ligen.forEach(liga => {
                if (!existingLigaIds.has(liga.ligaId)) {
                  existingSeason.ligen.push(liga);
                }
              });
            }
          }
        }
      }
    }
  }
  
  log(`   Neue Clubs: ${newClubs}`, 'cyan');
  log(`   Neue Teams: ${newTeams}`, 'cyan');
  log(`   Neue Seasons: ${newSeasons}`, 'cyan');
  log(`✅ Merge abgeschlossen`, 'green');
  
  return mergedClubsMap;
}

/**
 * Main
 */
/**
 * Prüfe ob Verband gecrawlt werden muss
 */
function shouldCrawlVerband(existingData) {
  if (FORCE_CRAWL) {
    log('🔄 Force-Crawl aktiviert', 'yellow');
    return true;
  }
  
  if (!existingData || !existingData.metadata || !existingData.metadata.verbandLastCrawled) {
    return true; // Erster Crawl
  }
  
  const lastCrawl = existingData.metadata.verbandLastCrawled[VERBAND_ID];
  if (!lastCrawl) {
    return true; // Verband noch nie gecrawlt
  }
  
  // Prüfe Alter
  const lastCrawlDate = new Date(lastCrawl.timestamp);
  const daysSince = (Date.now() - lastCrawlDate.getTime()) / (1000 * 60 * 60 * 24);
  
  if (daysSince < 7) {
    log(`⏭️  Verband ${VERBAND_ID} wurde vor ${daysSince.toFixed(1)} Tagen gecrawlt`, 'yellow');
    log(`   Letzter Crawl: ${lastCrawl.timestamp}`, 'cyan');
    log(`   Verwende --force zum erneuten Crawl`, 'cyan');
    return false;
  }
  
  return true;
}

async function main() {
  log('╔══════════════════════════════════════════╗', 'blue');
  log('║      BBB Club Crawler v3.1                ║', 'blue');
  log('╚══════════════════════════════════════════╝', 'blue');
  
  log(`\nVerband: ${VERBAND_ID}`, 'cyan');
  log(`Output: ${OUTPUT_FILE}`, 'cyan');
  if (SKIP_KONTAKT) log(`⚡ Fast-Mode: Kontaktdaten übersprungen`, 'yellow');
  if (FORCE_CRAWL) log(`🔄 Force-Mode: Cache ignoriert`, 'yellow');
  log(`Struktur: Club → Teams → Seasons → Ligen\n`, 'yellow');
  
  const startTime = Date.now();
  
  try {
    // Lade existierende Daten
    const existingData = loadExistingData();
    
    // Prüfe ob Crawl nötig
    if (!shouldCrawlVerband(existingData)) {
      log('\n✅ Verband muss nicht erneut gecrawlt werden', 'green');
      log('💡 Tipp: Nutze --force für erneuten Crawl', 'cyan');
      return;
    }
    
    // Erstelle Backup
    if (existingData) {
      createBackup();
    }
    
    // Crawle neue Daten
    const ligen = await loadAllLigen();
    if (ligen.length === 0) {
      log('\n❌ Keine Ligen gefunden!', 'red');
      return;
    }
    
    let clubsMap = await extractAndGroupTeams(ligen);
    clubsMap = await loadTeamDetails(clubsMap);
    clubsMap = await loadMissingKontaktData(clubsMap);
    
    // Merge mit existierenden Daten
    clubsMap = mergeWithExisting(existingData, clubsMap);
    
    // Speichere
    transformAndSave(clubsMap);
    
    const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(2);
    
    log('\n' + '═'.repeat(50), 'green');
    log(`✅ CRAWL ERFOLGREICH!`, 'green');
    log('═'.repeat(50), 'green');
    log(`Dauer: ${duration} Minuten`, 'cyan');
    log(`Ligen: ${ligen.length}`, 'cyan');
    
  } catch (error) {
    log(`\n❌ FEHLER: ${error.message}`, 'red');
    console.error(error);
  }
}

main();
