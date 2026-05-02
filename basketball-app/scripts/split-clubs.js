#!/usr/bin/env node
/**
 * BBB Club Data Splitter v1.0
 * 
 * Splittet clubs-germany.json in:
 * - clubs-metadata.json (Sitemap, ~150KB)
 * - clubs-chunk-0.json, clubs-chunk-1.json, ... (je ~2-3MB)
 * 
 * Strategie:
 * - 100 Clubs pro Chunk (sortiert nach clubId)
 * - Metadata enthält Pointer auf Detail-Files
 * - Keine Duplikate (Range-basiert, nicht Verband-basiert)
 * 
 * Usage:
 *   npm run split:clubs
 */

const fs = require('fs');
const path = require('path');

const CHUNK_SIZE = 100; // Clubs pro Chunk
const INPUT_FILE = path.join(
  __dirname, '..', 'basketball-app', 'src', 'shared', 'data', 
  'clubs-germany.json'
);
const OUTPUT_DIR = path.join(
  __dirname, '..', 'basketball-app', 'src', 'shared', 'data'
);
const CHUNK_DIR = path.join(OUTPUT_DIR, 'chunks');

const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  const timestamp = new Date().toLocaleTimeString('de-DE');
  console.log(`${colors.cyan}[${timestamp}]${colors.reset} ${colors[color]}${message}${colors.reset}`);
}

/**
 * Lade Master-Datei
 */
function loadMasterFile() {
  log('📥 Lade Master-Datei...', 'blue');
  
  if (!fs.existsSync(INPUT_FILE)) {
    throw new Error(`Master-Datei nicht gefunden: ${INPUT_FILE}`);
  }
  
  const data = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));
  
  log(`   ✅ ${data.clubs.length} Clubs geladen`, 'green');
  log(`   📊 ${data.metadata.totalTeams} Teams`, 'cyan');
  log(`   📊 ${data.metadata.verbaende.length} Verbände`, 'cyan');
  
  return data;
}

/**
 * Erstelle Chunk-Directory
 */
function ensureChunkDir() {
  if (!fs.existsSync(CHUNK_DIR)) {
    fs.mkdirSync(CHUNK_DIR, { recursive: true });
    log(`📁 Chunk-Directory erstellt: ${CHUNK_DIR}`, 'cyan');
  }
}

/**
 * Split in Chunks
 */
function splitIntoChunks(clubs) {
  log('\n📦 Erstelle Chunks...', 'blue');
  log(`   ${CHUNK_SIZE} Clubs pro Chunk`, 'yellow');
  
  // Sortiere nach clubId (numerisch)
  const sortedClubs = [...clubs].sort((a, b) => 
    parseInt(a.clubId) - parseInt(b.clubId)
  );
  
  const chunks = [];
  for (let i = 0; i < sortedClubs.length; i += CHUNK_SIZE) {
    chunks.push(sortedClubs.slice(i, i + CHUNK_SIZE));
  }
  
  log(`   ✅ ${chunks.length} Chunks erstellt`, 'green');
  return chunks;
}

/**
 * Erstelle Metadata (Sitemap)
 */
function createMetadata(clubs, chunks, masterMetadata) {
  log('\n📋 Erstelle Metadata...', 'blue');
  
  const index = {};
  
  // Erstelle Index: chunk-file → clubIds
  chunks.forEach((chunk, chunkIndex) => {
    const filename = `clubs-chunk-${chunkIndex}.json`;
    const clubIds = chunk.map(c => c.clubId);
    const verbaende = new Set();
    
    chunk.forEach(c => {
      c.verbaende.forEach(v => verbaende.add(v));
    });
    
    index[filename] = {
      clubIds: clubIds,
      clubCount: chunk.length,
      verbaende: Array.from(verbaende).sort((a, b) => a - b)
    };
  });
  
  // Erstelle lightweight Club-Liste
  const clubsList = clubs.map((club, idx) => {
    const chunkIndex = Math.floor(idx / CHUNK_SIZE);
    
    return {
      clubId: club.clubId,
      vereinsname: club.vereinsname,
      vereinsnummer: club.vereinsnummer,
      verbaende: club.verbaende,
      teamCount: club.teams.length,
      detailFile: `chunks/clubs-chunk-${chunkIndex}.json`
    };
  });
  
  const metadata = {
    metadata: {
      generatedAt: new Date().toISOString(),
      sourceFile: 'clubs-germany.json',
      totalClubs: clubs.length,
      totalChunks: chunks.length,
      chunkSize: CHUNK_SIZE,
      verbaende: masterMetadata.verbaende,
      note: 'Sitemap: Nutze detailFile für volle Club-Daten'
    },
    clubs: clubsList,
    index: index
  };
  
  log(`   ✅ Metadata erstellt`, 'green');
  log(`   📊 ${clubsList.length} Clubs`, 'cyan');
  log(`   📊 ${chunks.length} Chunks`, 'cyan');
  
  return metadata;
}

/**
 * Speichere Chunks
 */
function saveChunks(chunks) {
  log('\n💾 Speichere Chunks...', 'blue');
  
  const chunkSizes = [];
  
  chunks.forEach((chunk, index) => {
    const filename = `clubs-chunk-${index}.json`;
    const filepath = path.join(CHUNK_DIR, filename);
    
    const chunkData = {
      metadata: {
        chunkId: index,
        clubCount: chunk.length,
        generatedAt: new Date().toISOString()
      },
      clubs: chunk
    };
    
    const json = JSON.stringify(chunkData, null, 2);
    fs.writeFileSync(filepath, json, 'utf8');
    
    const sizeKB = (Buffer.byteLength(json, 'utf8') / 1024).toFixed(2);
    chunkSizes.push(parseFloat(sizeKB));
    
    if ((index + 1) % 5 === 0 || index === chunks.length - 1) {
      log(`   ✅ Chunk ${index}: ${sizeKB} KB (${chunk.length} Clubs)`, 'green');
    }
  });
  
  const avgSize = (chunkSizes.reduce((a, b) => a + b, 0) / chunkSizes.length).toFixed(2);
  const totalSize = chunkSizes.reduce((a, b) => a + b, 0).toFixed(2);
  
  log(`\n   📊 Durchschnitt: ${avgSize} KB pro Chunk`, 'cyan');
  log(`   📊 Gesamt: ${totalSize} KB (${(totalSize / 1024).toFixed(2)} MB)`, 'cyan');
  
  return { avgSize, totalSize };
}

/**
 * Speichere Metadata
 */
function saveMetadata(metadata) {
  log('\n💾 Speichere Metadata...', 'blue');
  
  const filepath = path.join(OUTPUT_DIR, 'clubs-metadata.json');
  const json = JSON.stringify(metadata, null, 2);
  fs.writeFileSync(filepath, json, 'utf8');
  
  const sizeKB = (Buffer.byteLength(json, 'utf8') / 1024).toFixed(2);
  log(`   ✅ ${sizeKB} KB`, 'green');
  log(`   📁 ${filepath}`, 'cyan');
  
  return { sizeKB };
}

/**
 * Cleanup alte Chunks
 */
function cleanupOldChunks() {
  if (!fs.existsSync(CHUNK_DIR)) return;
  
  const files = fs.readdirSync(CHUNK_DIR);
  const chunkFiles = files.filter(f => f.startsWith('clubs-chunk-') && f.endsWith('.json'));
  
  if (chunkFiles.length > 0) {
    log(`\n🗑️  Lösche ${chunkFiles.length} alte Chunks...`, 'yellow');
    chunkFiles.forEach(f => fs.unlinkSync(path.join(CHUNK_DIR, f)));
  }
}

/**
 * Validation
 */
function validateSplit(masterData, metadata, chunks) {
  log('\n✅ Validierung...', 'blue');
  
  const masterClubIds = new Set(masterData.clubs.map(c => c.clubId));
  const chunkClubIds = new Set(chunks.flat().map(c => c.clubId));
  const metadataClubIds = new Set(metadata.clubs.map(c => c.clubId));
  
  // Prüfe: Alle Clubs vorhanden?
  if (masterClubIds.size !== chunkClubIds.size) {
    throw new Error('Chunks haben nicht alle Clubs!');
  }
  
  if (masterClubIds.size !== metadataClubIds.size) {
    throw new Error('Metadata hat nicht alle Clubs!');
  }
  
  // Prüfe: Keine Duplikate?
  const allChunkClubIds = chunks.flat().map(c => c.clubId);
  if (allChunkClubIds.length !== new Set(allChunkClubIds).size) {
    throw new Error('Duplikate in Chunks gefunden!');
  }
  
  log('   ✅ Alle Clubs vorhanden', 'green');
  log('   ✅ Keine Duplikate', 'green');
  log('   ✅ Metadata konsistent', 'green');
}

/**
 * Main
 */
function main() {
  log('╔════════════════════════════════════════════╗', 'bold');
  log('║  BBB Club Data Splitter v1.0               ║', 'bold');
  log('╚════════════════════════════════════════════╝', 'bold');
  
  const startTime = Date.now();
  
  try {
    // 1. Lade Master
    const masterData = loadMasterFile();
    
    // 2. Cleanup alte Chunks
    cleanupOldChunks();
    
    // 3. Erstelle Chunk-Dir
    ensureChunkDir();
    
    // 4. Split
    const chunks = splitIntoChunks(masterData.clubs);
    
    // 5. Erstelle Metadata
    const metadata = createMetadata(masterData.clubs, chunks, masterData.metadata);
    
    // 6. Speichere Chunks
    const chunkStats = saveChunks(chunks);
    
    // 7. Speichere Metadata
    const metadataStats = saveMetadata(metadata);
    
    // 8. Validierung
    validateSplit(masterData, metadata, chunks);
    
    // Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    log('\n' + '═'.repeat(50), 'bold');
    log('✅ SPLIT ERFOLGREICH!', 'green');
    log('═'.repeat(50), 'bold');
    log(`⏱️  Dauer: ${duration} Sekunden`, 'cyan');
    log(`📦 Chunks: ${chunks.length} × ~${chunkStats.avgSize} KB`, 'cyan');
    log(`📋 Metadata: ${metadataStats.sizeKB} KB`, 'cyan');
    log(`💾 Gesamt: ${(parseFloat(chunkStats.totalSize) + parseFloat(metadataStats.sizeKB)).toFixed(2)} KB`, 'cyan');
    log('═'.repeat(50) + '\n', 'bold');
    
    log('📁 Output:', 'blue');
    log(`   ${OUTPUT_DIR}/clubs-metadata.json`, 'cyan');
    log(`   ${CHUNK_DIR}/clubs-chunk-0.json`, 'cyan');
    log(`   ${CHUNK_DIR}/clubs-chunk-1.json`, 'cyan');
    log(`   ...`, 'cyan');
    
  } catch (error) {
    log(`\n❌ Fehler: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

main();
