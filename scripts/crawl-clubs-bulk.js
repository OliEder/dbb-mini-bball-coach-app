#!/usr/bin/env node
/**
 * BBB Club Crawler - BULK Strategy v2.0
 * 
 * Basiert auf dem funktionierenden Incremental Crawler
 * Unterschied: Lädt ALLE Verbände auf einmal (kein verbandIds Filter)
 * 
 * Prozess (identisch zu Incremental):
 * 1. Lade ALLE Ligen (OHNE verbandIds Filter!)
 * 2. Extrahiere Teams aus Tabellen → dedupliziert in clubsMap
 * 3. Lade Team-Details (teamAkj) für eindeutige Teams
 * 4. Ergänze fehlende Kontaktdaten
 * 
 * Vorteil: Teams die in mehreren Verbänden spielen werden nur EINMAL abgerufen!
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const SKIP_KONTAKT = args.some(arg => arg === '--skip-kontakt');

const BASE_URL = 'https://www.basketball-bund.net';
const OUTPUT_FILE = path.join(
  __dirname, '..', 'basketball-app', 'src', 'shared', 'data', 
  'clubs-germany.json'
);

const DELAY_MS = 50;  // Schneller als Incremental
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  bold: '\x1b[1m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  const timestamp = new Date().toLocaleTimeString('de-DE');
  console.log(`${colors.cyan}[${timestamp}]${colors.reset} ${colors[color]}${message}${colors.reset}`);
}

/**
 * Schritt 1: Lade ALLE Ligen (OHNE Verband-Filter!)
 */
async function loadAllLigen() {
  log('\n📋 Schritt 1: Lade ALLE Ligen...', 'blue');
  
  const allLigen = [];
  let startIndex = 0;
  const pageSize = 10;
  let hasMore = true;
  
  while (hasMore) {
    try {
      const url = `${BASE_URL}/rest/wam/liga/list?startAtIndex=${startIndex}`;
      
      if (startIndex % 100 === 0) {
        log(`   Seite ${Math.floor(startIndex / pageSize) + 1}... (${allLigen.length} Ligen)`, 'cyan');
      }
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: 0
          // KEIN verbandIds! = ALLE Verbände
          // KEIN saison! = ALLE Saisons
        })
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      
      if (data.data && data.data.ligen && data.data.ligen.length > 0) {
        allLigen.push(...data.data.ligen);
        startIndex += pageSize;
        await sleep(DELAY_MS);
        
        if (!data.data.hasMoreData) hasMore = false;
      } else {
        hasMore = false;
      }
      
      // Safety limit
      if (startIndex >= 3000) {
        log('   ⚠️  Safety limit (3000)', 'yellow');
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
 * (1:1 vom Incremental Crawler übernommen)
 */
async function extractAndGroupTeams(ligen) {
  log('\n🏀 Schritt 2: Extrahiere Teams und gruppiere...', 'blue');
  log('   (Teams werden dedupliziert!)', 'yellow');
  
  const clubsMap = new Map();
  let processedCount = 0;
  const seasonIds = new Set();
  const verbandIds = new Set();
  
  for (const liga of ligen) {
    try {
      processedCount++;
      
      if (processedCount % 100 === 0) {
        log(`   ${processedCount}/${ligen.length} Ligen | Clubs: ${clubsMap.size}`, 'cyan');
      }
      
      const url = `${BASE_URL}/rest/competition/table/id/${liga.ligaId}`;
      const response = await fetch(url);
      
      if (!response.ok) continue;
      
      const data = await response.json();
      const ligaData = data.data?.ligaData || liga;
      
      if (!ligaData.seasonId) continue;
      
      seasonIds.add(ligaData.seasonId);
      verbandIds.add(liga.verbandId);
      
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
              verbaende: new Set(),  // Set für Deduplizierung
              teams: new Map()
            });
          }
          
          const club = clubsMap.get(clubId);
          club.verbaende.add(liga.verbandId);  // Verband hinzufügen
          
          // Team initialisieren (dedupliziert über teamPermanentId!)
          if (!club.teams.has(teamPermanentId)) {
            club.teams.set(teamPermanentId, {
              teamPermanentId: teamPermanentId,
              teamname: entry.team.teamname,
              teamnameSmall: entry.team.teamnameSmall,
              teamAkjId: null,
              teamAkj: null,  // ← FIX! Einmal setzen, nie überschreiben
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
            akName: ligaData.akName,
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
  
  const totalTeams = Array.from(clubsMap.values())
    .reduce((sum, c) => sum + c.teams.size, 0);
  
  log(`\n✅ Gruppierung abgeschlossen:`, 'green');
  log(`   Clubs: ${clubsMap.size}`, 'cyan');
  log(`   Teams (unique): ${totalTeams}`, 'cyan');
  log(`   Seasons: ${seasonIds.size} (${Array.from(seasonIds).sort().join(', ')})`, 'cyan');
  log(`   Verbände: ${verbandIds.size} (${Array.from(verbandIds).sort((a,b) => a-b).join(', ')})`, 'cyan');
  
  return clubsMap;
}

/**
 * Schritt 3: Lade Team-Details (teamAkj ist FIX!)
 * (1:1 vom Incremental Crawler übernommen)
 */
async function loadTeamDetails(clubsMap, startTime) {
  log('\n📞 Schritt 3: Lade Team-Details...', 'blue');
  
  const allTeams = [];
  for (const club of clubsMap.values()) {
    for (const team of club.teams.values()) {
      allTeams.push({ club, team });
    }
  }
  
  log(`   ${allTeams.length} eindeutige Teams (keine Duplikate!)`, 'yellow');
  
  let processedCount = 0;
  
  for (const { club, team } of allTeams) {
    try {
      processedCount++;
      
      if (processedCount % 50 === 0) {
        const percent = ((processedCount / allTeams.length) * 100).toFixed(1);
        const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
        log(`   ${processedCount}/${allTeams.length} Teams (${percent}%) | ${elapsed} min`, 'cyan');
      }
      
      const url = `${BASE_URL}/rest/team/id/${team.teamPermanentId}/matches`;
      const response = await fetch(url);
      
      if (!response.ok) continue;
      
      const data = await response.json();
      
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
 * (1:1 vom Incremental Crawler übernommen)
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
      
      if (processedCount % 50 === 0) {
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
 * Schritt 5: Transformiere und speichere
 */
function transformAndSave(clubsMap) {
  log('\n💾 Schritt 5: Transformiere und speichere...', 'blue');
  
  // Sammle alle Verbände
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
        .sort((a, b) => b.seasonId - a.seasonId);
      
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
    });
    
    return {
      clubId: club.clubId,
      vereinsname: club.vereinsname,
      vereinsnummer: club.vereinsnummer,
      verbaende: Array.from(club.verbaende).sort((a, b) => a - b),
      kontaktData: club.kontaktData,
      teams: teams
    };
  });
  
  // Sortiere Clubs nach Name
  clubs.sort((a, b) => (a.vereinsname || '').localeCompare(b.vereinsname || ''));
  
  // Zähle Totals
  const totalTeams = clubs.reduce((sum, c) => sum + c.teams.length, 0);
  const totalSeasons = clubs.reduce((sum, c) => 
    sum + c.teams.reduce((tsum, t) => tsum + t.seasons.length, 0)
  , 0);
  
  const output = {
    metadata: {
      crawledAt: new Date().toISOString(),
      crawlStrategy: 'bulk',
      totalClubs: clubs.length,
      totalTeams: totalTeams,
      totalSeasons: totalSeasons,
      verbaende: Array.from(allVerbaende).sort((a, b) => a - b),
      note: 'Bulk-Crawl: Alle Verbände, Teams dedupliziert'
    },
    clubs: clubs
  };
  
  // Backup
  if (fs.existsSync(OUTPUT_FILE)) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = OUTPUT_FILE.replace('.json', `.backup-${timestamp}.json`);
    fs.copyFileSync(OUTPUT_FILE, backupFile);
    log(`   💾 Backup: ${path.basename(backupFile)}`, 'cyan');
  }
  
  // Save
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf8');
  
  log(`\n✅ Gespeichert: ${OUTPUT_FILE}`, 'green');
  log(`   Clubs: ${clubs.length}`, 'cyan');
  log(`   Teams: ${totalTeams}`, 'cyan');
  log(`   Seasons: ${totalSeasons}`, 'cyan');
  log(`   Verbände: ${Array.from(allVerbaende).sort((a,b) => a-b).join(', ')}`, 'cyan');
}

/**
 * Main
 */
async function main() {
  log('╔════════════════════════════════════════════╗', 'bold');
  log('║  BBB Club Crawler - BULK Strategy v2.0    ║', 'bold');
  log('╚════════════════════════════════════════════╝', 'bold');
  
  log(`\nOutput: ${OUTPUT_FILE}`, 'cyan');
  if (SKIP_KONTAKT) log(`⚡ Fast-Mode: Kontaktdaten übersprungen`, 'yellow');
  log(`🎯 Strategie: Deduplizierung nach teamPermanentId\n`, 'yellow');
  
  const startTime = Date.now();
  
  try {
    // Schritt 1-5
    const ligen = await loadAllLigen();
    const clubsMap = await extractAndGroupTeams(ligen);
    await loadTeamDetails(clubsMap, startTime);
    await loadMissingKontaktData(clubsMap);
    transformAndSave(clubsMap);
    
    // Summary
    const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(2);
    
    log('\n' + '═'.repeat(50), 'bold');
    log('✅ BULK CRAWL ERFOLGREICH!', 'green');
    log('═'.repeat(50), 'bold');
    log(`⏱️  Dauer: ${duration} Minuten`, 'cyan');
    log('═'.repeat(50) + '\n', 'bold');
    
  } catch (error) {
    log(`\n❌ Fehler: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

main();
