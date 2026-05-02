const fs = require('fs').promises;
const path = require('path');

/**
 * ============================================================
 * SPLIT CLUBS DATA
 * ============================================================
 * 
 * Teilt clubs-germany.json in handliche Chunks auf:
 * 
 * 1. clubs-metadata.json
 *    └─ Lightweight Index (nur IDs, Namen, Verbände)
 *       → Für schnelles Suchen/Filtern in der App
 * 
 * 2. clubs-chunk-X.json
 *    └─ 100 Clubs pro Chunk (mit allen Details)
 *       → Lazy Loading in der App
 * 
 * ============================================================
 */

const CHUNK_SIZE = 100;
const INPUT_FILE = path.join(__dirname, '../basketball-app/src/shared/data/clubs-germany.json');
const OUTPUT_DIR = path.join(__dirname, '../basketball-app/src/shared/data/clubs-chunks');

// Farben für Terminal-Output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  gray: '\x1b[90m'
};

function log(msg, color = 'reset') {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  console.log(`${colors.gray}[${timestamp}]${colors.reset} ${colors[color]}${msg}${colors.reset}`);
}

/**
 * Erstellt Club-Index (für Autocomplete/Search)
 */
function createClubList(clubs) {
  return clubs.map(club => ({
    id: club.clubId,
    name: club.vereinsname,
    verbandIds: club.verbaende,
    teamCount: club.teams.length
  }));
}

/**
 * Erstellt Sitemap-Index (Club → Chunk Mapping)
 */
function createSitemap(clubs, chunksCount) {
  const index = {};
  const chunkMetadata = [];
  
  // Erstelle Chunks-Metadaten
  for (let i = 0; i < chunksCount; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min((i + 1) * CHUNK_SIZE, clubs.length);
    const chunkClubs = clubs.slice(start, end);
    
    // Verbände in diesem Chunk (alle eindeutigen)
    const verbaendeSet = new Set();
    chunkClubs.forEach(c => c.verbaende.forEach(v => verbaendeSet.add(v)));
    const verbaende = [...verbaendeSet].sort((a, b) => a - b);
    
    // Club-IDs in diesem Chunk
    const clubIds = chunkClubs.map(c => c.clubId);
    
    chunkMetadata.push({
      chunkIndex: i,
      file: `clubs-chunk-${i}.json`,
      clubsCount: chunkClubs.length,
      clubIds,
      verbaende,
      range: { start, end: end - 1 }
    });
    
    // Index: Club-ID → Chunk
    chunkClubs.forEach((club, position) => {
      index[club.clubId] = {
        chunkIndex: i,
        position,
        name: club.vereinsname,
        verbaende: club.verbaende
      };
    });
  }
  
  return { index, chunkMetadata };
}

/**
 * Teilt Clubs in Chunks auf
 */
function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Formatiert Dateigröße (Bytes → KB/MB)
 */
function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Hauptfunktion
 */
async function splitClubsData() {
  const startTime = Date.now();
  
  try {
    // 1. Lade clubs-germany.json
    log('\n📂 Lade clubs-germany.json...', 'blue');
    const rawData = await fs.readFile(INPUT_FILE, 'utf8');
    const data = JSON.parse(rawData);
    
    const clubs = data.clubs || [];
    const metadata = data.metadata || {};
    
    log(`✅ ${clubs.length.toLocaleString()} Clubs geladen`, 'green');
    log(`   Originaldatei: ${formatFileSize(Buffer.byteLength(rawData))}`, 'gray');
    
    // 2. Erstelle Output-Verzeichnis
    log('\n📁 Erstelle Output-Verzeichnis...', 'blue');
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    
    // 3. Erstelle Sitemap-Index
    log('\n🗺️  Erstelle Sitemap-Index...', 'blue');
    
    const chunksCount = Math.ceil(clubs.length / CHUNK_SIZE);
    const { index, chunkMetadata } = createSitemap(clubs, chunksCount);
    const clubList = createClubList(clubs);
    
    const metadataIndex = {
      metadata: {
        ...metadata,
        totalClubs: clubs.length,
        chunksCount,
        chunkSize: CHUNK_SIZE,
        generatedAt: new Date().toISOString()
      },
      index,        // Club-ID → Chunk Mapping
      chunks: chunkMetadata,  // Chunk-Übersicht
      clubs: clubList         // Lightweight Liste (Autocomplete)
    };
    
    const metadataPath = path.join(OUTPUT_DIR, 'clubs-metadata.json');
    await fs.writeFile(
      metadataPath,
      JSON.stringify(metadataIndex, null, 2),
      'utf8'
    );
    
    const metadataSize = (await fs.stat(metadataPath)).size;
    log(`✅ clubs-metadata.json erstellt (${formatFileSize(metadataSize)})`, 'green');
    
    // 4. Erstelle Chunks
    log('\n📦 Erstelle Chunks...', 'blue');
    const chunks = chunkArray(clubs, CHUNK_SIZE);
    
    let totalChunkSize = 0;
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const chunkData = {
        metadata: {
          chunkIndex: i,
          totalChunks: chunks.length,
          clubsInChunk: chunk.length,
          range: {
            start: i * CHUNK_SIZE,
            end: Math.min((i + 1) * CHUNK_SIZE - 1, clubs.length - 1)
          }
        },
        clubs: chunk
      };
      
      const chunkPath = path.join(OUTPUT_DIR, `clubs-chunk-${i}.json`);
      await fs.writeFile(
        chunkPath,
        JSON.stringify(chunkData, null, 2),
        'utf8'
      );
      
      const chunkSize = (await fs.stat(chunkPath)).size;
      totalChunkSize += chunkSize;
      
      log(`   ✓ Chunk ${i}: ${chunk.length} Clubs (${formatFileSize(chunkSize)})`, 'gray');
    }
    
    // 5. Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    const totalSize = metadataSize + totalChunkSize;
    const compressionRatio = ((1 - totalSize / Buffer.byteLength(rawData)) * 100).toFixed(1);
    
    log('\n✅ Split abgeschlossen!', 'green');
    log(`   Dauer: ${duration}s`, 'gray');
    log(`   Chunks erstellt: ${chunks.length}`, 'gray');
    log(`   Metadata: ${formatFileSize(metadataSize)}`, 'gray');
    log(`   Chunks gesamt: ${formatFileSize(totalChunkSize)}`, 'gray');
    log(`   Total: ${formatFileSize(totalSize)}`, 'gray');
    log(`   Kompression: ${compressionRatio}% kleiner`, 'yellow');
    
    log(`\n📂 Dateien gespeichert in:`, 'blue');
    log(`   ${OUTPUT_DIR}`, 'gray');
    
  } catch (error) {
    log(`\n❌ Fehler beim Split: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// CLI
if (require.main === module) {
  log('\n🏀 Basketball Deutschland - Club Data Splitter', 'blue');
  log('================================================\n', 'blue');
  
  splitClubsData()
    .then(() => {
      log('\n✅ Fertig!', 'green');
      process.exit(0);
    })
    .catch(error => {
      log(`\n❌ Unerwarteter Fehler: ${error.message}`, 'red');
      console.error(error);
      process.exit(1);
    });
}

module.exports = { splitClubsData };
