#!/usr/bin/env node
/**
 * Update-Script für statische Verbands-Daten
 * 
 * Holt die aktuelle Verbands-Liste von der DBB API und 
 * aktualisiert die statische Datei src/shared/constants/verbaende.ts
 * 
 * Usage:
 *   node scripts/update-verbaende.js
 * 
 * Sollte ausgeführt werden:
 * - 1x pro Saison (September/Oktober)
 * - Bei vermuteten Änderungen der Verbands-Struktur
 */

const fs = require('fs');
const path = require('path');

const API_URL = 'https://www.basketball-bund.net/rest/wam/data';

// Farben für Console Output
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function fetchVerbaende() {
  log('📡 Hole Verbands-Daten von DBB API...', 'blue');
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token: 0,
        verbandIds: [],
        gebietIds: [],
        ligatypIds: [],
        akgGeschlechtIds: [],
        altersklasseIds: [],
        spielklasseIds: [],
        sortBy: 0
      })
    });
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.data || !data.data.verbaende) {
      throw new Error('Unexpected API response structure');
    }
    
    log(`✅ ${data.data.verbaende.length} Verbände geladen`, 'green');
    return data.data.verbaende;
    
  } catch (error) {
    log(`❌ Fehler beim API-Call: ${error.message}`, 'red');
    throw error;
  }
}

function categorizeVerbaende(verbaende) {
  const categories = {
    landesverbaende: [],
    bundesligen: [],
    deutsche_meisterschaften: [],
    regionalligen: [],
    rollstuhlbasketball: [],
    sonstige: []
  };
  
  for (const verband of verbaende) {
    const id = verband.id;
    
    if (id >= 1 && id <= 16) {
      categories.landesverbaende.push(verband);
    } else if (id >= 100) {
      categories.bundesligen.push(verband);
    } else if (id === 29) {
      categories.deutsche_meisterschaften.push(verband);
    } else if (id >= 30 && id <= 33) {
      categories.regionalligen.push(verband);
    } else if (id >= 40 && id < 100) {
      categories.rollstuhlbasketball.push(verband);
    } else {
      categories.sonstige.push(verband);
    }
  }
  
  // Sort within categories
  for (const category in categories) {
    categories[category].sort((a, b) => {
      // Landesverbände nach ID, andere nach Label
      if (category === 'landesverbaende') {
        return a.id - b.id;
      }
      return a.label.localeCompare(b.label);
    });
  }
  
  return categories;
}

function generateTypeScriptCode(categories) {
  const now = new Date();
  const saison = `${now.getFullYear()}/${now.getFullYear() + 1}`;
  
  let code = `/**
 * Statische Basketball-Verbände (DBB)
 * 
 * ⚠️ AUTOMATISCH GENERIERT - NICHT MANUELL BEARBEITEN!
 * 
 * Generiert von: scripts/update-verbaende.js
 * Datum: ${now.toISOString().split('T')[0]}
 * Saison: ${saison}
 * 
 * Um zu aktualisieren: npm run update:verbaende
 * 
 * ID-Bereiche:
 * - 1-16: Landesverbände (Bundesländer)
 * - 29: Deutsche Meisterschaften
 * - 30-33: Regionalligen
 * - 40+: Rollstuhlbasketball & Spezialverbände
 * - 100+: Bundesligen
 */

export interface VerbandOption {
  id: number;
  label: string;
  beschreibung?: string;
  kategorie: 'landesverband' | 'bundesliga' | 'regionalliga' | 'deutsche_meisterschaft' | 'rollstuhl' | 'sonstige';
}

`;

  // Landesverbände
  code += `/**
 * Landesverbände (IDs 1-16)
 * Geografisch organisiert nach Bundesländern
 */
export const LANDESVERBAENDE: VerbandOption[] = [\n`;
  
  for (const verband of categories.landesverbaende) {
    code += `  {\n`;
    code += `    id: ${verband.id},\n`;
    code += `    label: '${verband.label}',\n`;
    code += `    beschreibung: 'Basketball-Verband ${verband.label}',\n`;
    code += `    kategorie: 'landesverband'\n`;
    code += `  },\n`;
  }
  
  code += `];\n\n`;

  // Weitere Kategorien...
  if (categories.bundesligen.length > 0) {
    code += `export const BUNDESLIGEN: VerbandOption[] = [\n`;
    for (const verband of categories.bundesligen) {
      code += `  { id: ${verband.id}, label: '${verband.label}', beschreibung: '1. und 2. Basketball-Bundesliga', kategorie: 'bundesliga' },\n`;
    }
    code += `];\n\n`;
  }

  if (categories.deutsche_meisterschaften.length > 0) {
    code += `export const DEUTSCHE_MEISTERSCHAFTEN: VerbandOption[] = [\n`;
    for (const verband of categories.deutsche_meisterschaften) {
      code += `  { id: ${verband.id}, label: '${verband.label}', beschreibung: 'Bundesweite Meisterschaftswettbewerbe', kategorie: 'deutsche_meisterschaft' },\n`;
    }
    code += `];\n\n`;
  }

  if (categories.regionalligen.length > 0) {
    code += `export const REGIONALLIGEN: VerbandOption[] = [\n`;
    for (const verband of categories.regionalligen) {
      code += `  { id: ${verband.id}, label: '${verband.label}', beschreibung: 'Überregionale Liga', kategorie: 'regionalliga' },\n`;
    }
    code += `];\n\n`;
  }

  if (categories.rollstuhlbasketball.length > 0) {
    code += `export const ROLLSTUHLBASKETBALL: VerbandOption[] = [\n`;
    for (const verband of categories.rollstuhlbasketball) {
      code += `  { id: ${verband.id}, label: '${verband.label}', beschreibung: 'Rollstuhlbasketball-Wettbewerbe', kategorie: 'rollstuhl' },\n`;
    }
    code += `];\n\n`;
  }

  if (categories.sonstige.length > 0) {
    log(`⚠️  ${categories.sonstige.length} unbekannte Verbände gefunden:`, 'yellow');
    categories.sonstige.forEach(v => log(`   - ID ${v.id}: ${v.label}`, 'yellow'));
  }

  // Hilfsfunktionen
  code += `
export const ALLE_VERBAENDE: VerbandOption[] = [
  ...LANDESVERBAENDE,
  ...BUNDESLIGEN,
  ...DEUTSCHE_MEISTERSCHAFTEN,
  ...REGIONALLIGEN,
  ...ROLLSTUHLBASKETBALL
];

export function findVerbandById(id: number): VerbandOption | undefined {
  return ALLE_VERBAENDE.find(v => v.id === id);
}

export function isLandesverband(verbandId: number): boolean {
  return verbandId >= 1 && verbandId <= 16;
}

export function getVerbandKategorie(verbandId: number): VerbandOption['kategorie'] {
  if (verbandId >= 1 && verbandId <= 16) return 'landesverband';
  if (verbandId === 29) return 'deutsche_meisterschaft';
  if (verbandId >= 30 && verbandId <= 33) return 'regionalliga';
  if (verbandId >= 40 && verbandId < 100) return 'rollstuhl';
  if (verbandId >= 100) return 'bundesliga';
  return 'sonstige';
}

/**
 * Kein Default-Verband - Nutzer muss bewusst auswählen
 */
export const DEFAULT_VERBAND_ID = null;

/**
 * Empfohlene Verbände für Mini-Basketball (primär Landesverbände)
 */
export const MINI_BASKETBALL_VERBAENDE = LANDESVERBAENDE;
`;

  return code;
}

async function main() {
  log('🏀 Basketball Verbands-Update Script\n', 'blue');
  
  try {
    const verbaende = await fetchVerbaende();
    
    log('\n📋 Kategorisiere Verbände...', 'blue');
    const categories = categorizeVerbaende(verbaende);
    
    log(`   Landesverbände: ${categories.landesverbaende.length}`, 'green');
    log(`   Bundesligen: ${categories.bundesligen.length}`, 'green');
    log(`   Deutsche Meisterschaften: ${categories.deutsche_meisterschaften.length}`, 'green');
    log(`   Regionalligen: ${categories.regionalligen.length}`, 'green');
    log(`   Rollstuhlbasketball: ${categories.rollstuhlbasketball.length}`, 'green');
    
    log('\n✍️  Generiere TypeScript Code...', 'blue');
    const code = generateTypeScriptCode(categories);
    
    const targetPath = path.join(__dirname, '..', 'basketball-app', 'src', 'shared', 'constants', 'verbaende.ts');
    log(`\n💾 Schreibe in: ${targetPath}`, 'blue');
    
    fs.writeFileSync(targetPath, code, 'utf8');
    
    log('\n✅ Verbands-Daten erfolgreich aktualisiert!', 'green');
    log(`📅 Nächstes Update empfohlen: September ${new Date().getFullYear() + 1}`, 'blue');
    
  } catch (error) {
    log(`\n❌ Fehler: ${error.message}`, 'red');
    process.exit(1);
  }
}

main();
