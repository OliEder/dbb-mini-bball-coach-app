#!/usr/bin/env node
/**
 * BBB Club Crawler - ALL Verbände
 * 
 * Crawlt ALLE Basketball-Verbände in Deutschland:
 * - 16 Landesverbände (IDs 1-16)
 * - 1 Deutsche Meisterschaft (ID 29)
 * - 4 Regionalligen (IDs 30-33)
 * - Bundesligen (ID 100+)
 * 
 * VERWENDUNG:
 *   npm run crawl:clubs:all
 * 
 * CRON-JOB (empfohlen):
 *   - 1x pro Monat: 0 2 1 * * (jeden 1. um 02:00 Uhr)
 *   - 1x pro Quartal: 0 2 1 1,4,7,10 * (Jan/Apr/Jul/Okt)
 * 
 * LAUFZEIT: ~30-45 Minuten
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Verbände basierend auf STATISCHE-VERBAENDE.md
const VERBAENDE = {
  landesverbaende: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
  deutsche_meisterschaften: [29],
  regionalligen: [30, 31, 32, 33],
  bundesligen: [100] // Weitere IDs falls vorhanden
};

const ALL_VERBAND_IDS = [
  ...VERBAENDE.landesverbaende,
  ...VERBAENDE.deutsche_meisterschaften,
  ...VERBAENDE.regionalligen,
  ...VERBAENDE.bundesligen
];

const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  const timestamp = new Date().toISOString();
  console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`);
}

function getVerbandLabel(verbandId) {
  const labels = {
    1: 'Baden-Württemberg', 2: 'Bayern', 3: 'Berlin', 4: 'Brandenburg',
    5: 'Bremen', 6: 'Hamburg', 7: 'Hessen', 8: 'Mecklenburg-Vorpommern',
    9: 'Niedersachsen', 10: 'Nordrhein-Westfalen', 11: 'Rheinland-Pfalz',
    12: 'Saarland', 13: 'Sachsen', 14: 'Sachsen-Anhalt',
    15: 'Schleswig-Holstein', 16: 'Thüringen',
    29: 'Deutsche Meisterschaften',
    30: 'Regionalliga 1', 31: 'Regionalliga 2',
    32: 'Regionalliga 3', 33: 'Regionalliga 4',
    100: 'Bundesligen'
  };
  return labels[verbandId] || `Verband ${verbandId}`;
}

function crawlVerband(verbandId, index, total, skipKontakt = true) {
  const label = getVerbandLabel(verbandId);
  const progress = `[${index}/${total}]`;
  
  log(`${progress} Crawle Verband ${verbandId} (${label})...`, 'blue');
  
  try {
    const scriptPath = path.join(__dirname, 'crawl-clubs.js');
    const flags = skipKontakt ? '--skip-kontakt' : '';
    const command = `node "${scriptPath}" --verband=${verbandId} ${flags}`;
    
    const result = execSync(command, {
      stdio: 'pipe',
      cwd: __dirname,
      encoding: 'utf8'
    });
    
    // Prüfe ob übersprungen wurde
    if (result.includes('muss nicht erneut gecrawlt werden')) {
      log(`${progress} ⏭️  Verband ${verbandId} übersprungen (bereits aktuell)`, 'yellow');
      return { verbandId, label, success: true, skipped: true };
    }
    
    log(`${progress} ✅ Verband ${verbandId} erfolgreich`, 'green');
    return { verbandId, label, success: true, skipped: false };
    
  } catch (error) {
    log(`${progress} ❌ Fehler bei Verband ${verbandId}: ${error.message}`, 'red');
    return { verbandId, label, success: false, skipped: false, error: error.message };
  }
}

function printSummary(results, startTime) {
  const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(2);
  const successful = results.filter(r => r.success && !r.skipped).length;
  const skipped = results.filter(r => r.skipped).length;
  const failed = results.filter(r => !r.success).length;
  
  log('\n' + '═'.repeat(60), 'bold');
  log('📊 CRAWL ZUSAMMENFASSUNG', 'bold');
  log('═'.repeat(60), 'bold');
  
  log(`\n⏱️  Gesamtdauer: ${duration} Minuten`, 'cyan');
  log(`✅ Erfolgreich: ${successful}/${results.length}`, 'green');
  if (skipped > 0) {
    log(`⏭️  Übersprungen: ${skipped}/${results.length} (bereits aktuell)`, 'yellow');
  }
  
  if (failed > 0) {
    log(`❌ Fehlgeschlagen: ${failed}/${results.length}`, 'red');
    log('\nFehlgeschlagene Verbände:', 'yellow');
    results.filter(r => !r.success).forEach(r => {
      log(`   - ${r.verbandId}: ${r.label}`, 'yellow');
    });
  }
  
  // Finale Datei-Info
  const outputFile = path.join(
    __dirname, '..', 'basketball-app', 'src', 'shared', 'data',
    'clubs-germany.json'
  );
  
  if (fs.existsSync(outputFile)) {
    const stats = fs.statSync(outputFile);
    const sizeKB = (stats.size / 1024).toFixed(2);
    const data = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
    
    log('\n📁 Ausgabe-Datei:', 'cyan');
    log(`   Pfad: ${outputFile}`, 'reset');
    log(`   Größe: ${sizeKB} KB`, 'reset');
    log(`   Clubs: ${data.metadata.totalClubs}`, 'reset');
    log(`   Teams: ${data.metadata.totalTeams}`, 'reset');
    log(`   Seasons: ${data.metadata.totalSeasons}`, 'reset');
    log(`   Verbände: ${data.metadata.verbaende.join(', ')}`, 'reset');
  }
  
  log('\n' + '═'.repeat(60), 'bold');
  
  if (failed === 0) {
    log('✅ ALLE VERBÄNDE ERFOLGREICH GECRAWLT!', 'green');
  } else {
    log('⚠️  CRAWL MIT FEHLERN ABGESCHLOSSEN', 'yellow');
  }
  
  log('═'.repeat(60) + '\n', 'bold');
}

async function main() {
  log('╔══════════════════════════════════════════════════════════╗', 'bold');
  log('║      BBB Club Crawler - ALL Verbände                     ║', 'bold');
  log('╚══════════════════════════════════════════════════════════╝', 'bold');
  
  log(`\n🏀 Starte Crawl für ${ALL_VERBAND_IDS.length} Verbände...`, 'cyan');
  log(`⚡ Fast-Mode: Kontaktdaten übersprungen`, 'yellow');
  log(`💾 Smart-Caching: Verbände <7 Tage werden übersprungen`, 'yellow');
  log(`⏱️  Geschätzte Dauer: 5-45 Minuten (abhängig von Cache)\n`, 'yellow');
  
  const startTime = Date.now();
  const results = [];
  
  // Crawle alle Verbände sequenziell
  for (let i = 0; i < ALL_VERBAND_IDS.length; i++) {
    const verbandId = ALL_VERBAND_IDS[i];
    const result = crawlVerband(verbandId, i + 1, ALL_VERBAND_IDS.length);
    results.push(result);
    
    // Kurze Pause zwischen Verbänden
    if (i < ALL_VERBAND_IDS.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // Zusammenfassung
  printSummary(results, startTime);
  
  // Exit-Code
  const failed = results.filter(r => !r.success).length;
  process.exit(failed > 0 ? 1 : 0);
}

main();
