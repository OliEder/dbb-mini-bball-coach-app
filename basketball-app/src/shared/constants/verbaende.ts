/**
 * Statische Basketball-Verbände (DBB)
 * 
 * ⚠️ AUTOMATISCH GENERIERT - NICHT MANUELL BEARBEITEN!
 * 
 * Generiert von: scripts/update-verbaende.js
 * Datum: 2025-10-22
 * Saison: 2025/2026
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

/**
 * Landesverbände (IDs 1-16)
 * Geografisch organisiert nach Bundesländern
 */
export const LANDESVERBAENDE: VerbandOption[] = [
  {
    id: 1,
    label: 'Baden-Württemberg',
    beschreibung: 'Basketball-Verband Baden-Württemberg',
    kategorie: 'landesverband'
  },
  {
    id: 2,
    label: 'Bayern',
    beschreibung: 'Basketball-Verband Bayern',
    kategorie: 'landesverband'
  },
  {
    id: 3,
    label: 'Berlin',
    beschreibung: 'Basketball-Verband Berlin',
    kategorie: 'landesverband'
  },
  {
    id: 4,
    label: 'Bremen',
    beschreibung: 'Basketball-Verband Bremen',
    kategorie: 'landesverband'
  },
  {
    id: 5,
    label: 'Hamburg',
    beschreibung: 'Basketball-Verband Hamburg',
    kategorie: 'landesverband'
  },
  {
    id: 6,
    label: 'Hessen',
    beschreibung: 'Basketball-Verband Hessen',
    kategorie: 'landesverband'
  },
  {
    id: 7,
    label: 'Niedersachsen',
    beschreibung: 'Basketball-Verband Niedersachsen',
    kategorie: 'landesverband'
  },
  {
    id: 8,
    label: 'Rheinland-Pfalz',
    beschreibung: 'Basketball-Verband Rheinland-Pfalz',
    kategorie: 'landesverband'
  },
  {
    id: 9,
    label: 'Saarland',
    beschreibung: 'Basketball-Verband Saarland',
    kategorie: 'landesverband'
  },
  {
    id: 10,
    label: 'Schleswig-Holstein',
    beschreibung: 'Basketball-Verband Schleswig-Holstein',
    kategorie: 'landesverband'
  },
  {
    id: 11,
    label: 'Nordrhein-Westfalen',
    beschreibung: 'Basketball-Verband Nordrhein-Westfalen',
    kategorie: 'landesverband'
  },
  {
    id: 12,
    label: 'Mecklenburg-Vorpommern',
    beschreibung: 'Basketball-Verband Mecklenburg-Vorpommern',
    kategorie: 'landesverband'
  },
  {
    id: 13,
    label: 'Sachsen-Anhalt',
    beschreibung: 'Basketball-Verband Sachsen-Anhalt',
    kategorie: 'landesverband'
  },
  {
    id: 14,
    label: 'Brandenburg',
    beschreibung: 'Basketball-Verband Brandenburg',
    kategorie: 'landesverband'
  },
  {
    id: 15,
    label: 'Sachsen',
    beschreibung: 'Basketball-Verband Sachsen',
    kategorie: 'landesverband'
  },
  {
    id: 16,
    label: 'Thüringen',
    beschreibung: 'Basketball-Verband Thüringen',
    kategorie: 'landesverband'
  },
];

export const BUNDESLIGEN: VerbandOption[] = [
  { id: 100, label: 'Bundesligen', beschreibung: '1. und 2. Basketball-Bundesliga', kategorie: 'bundesliga' },
];

export const DEUTSCHE_MEISTERSCHAFTEN: VerbandOption[] = [
  { id: 29, label: 'Deutsche Meisterschaften', beschreibung: 'Bundesweite Meisterschaftswettbewerbe', kategorie: 'deutsche_meisterschaft' },
];

export const REGIONALLIGEN: VerbandOption[] = [
  { id: 30, label: 'Regionalliga Nord', beschreibung: 'Überregionale Liga', kategorie: 'regionalliga' },
  { id: 32, label: 'Regionalliga Südost', beschreibung: 'Überregionale Liga', kategorie: 'regionalliga' },
  { id: 31, label: 'Regionalliga Südwest', beschreibung: 'Überregionale Liga', kategorie: 'regionalliga' },
  { id: 33, label: 'Regionalliga West', beschreibung: 'Überregionale Liga', kategorie: 'regionalliga' },
];

export const ROLLSTUHLBASKETBALL: VerbandOption[] = [
  { id: 40, label: 'Deutscher Rollstuhlbasketball', beschreibung: 'Rollstuhlbasketball-Wettbewerbe', kategorie: 'rollstuhl' },
];


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
