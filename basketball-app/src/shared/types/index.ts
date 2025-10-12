/**
 * Basketball PWA - Zentrale Type Definitions
 * 
 * Basiert auf Datenbank-Schema v4.0 (mit Compound-Indizes)
 * Domain-Driven Design mit strikten Types
 */

// ==================== BASIC TYPES ====================

export type UUID = string;

// ==================== ENUMS ====================

export type Altersklasse = 'U8' | 'U10' | 'U12' | 'U14' | 'U16' | 'U18';

export type SpielerTyp = 'eigenes_team' | 'gegner' | 'scouting' | 'probetraining';

export type BewertungsTyp = 'aktuell' | 'scouting' | 'archiv';

export type Beziehungstyp = 
  | 'Mutter' 
  | 'Vater' 
  | 'Vormund' 
  | 'Großmutter' 
  | 'Großvater' 
  | 'Pflegemutter' 
  | 'Pflegevater'
  | 'Sonstiges';

export type SpielStatus = 'geplant' | 'live' | 'abgeschlossen' | 'abgesagt';

export type SpielPhase = 'planung' | 'in_halle' | 'im_spiel' | 'nachbereitung';

export type EinsatzStatus = 'Im_Spiel' | 'Bank';

export type TrikotArt = 'Wendejersey' | 'Hose';

export type TrikotStatus = 'verfügbar' | 'im_einsatz' | 'defekt';

export type TrikotGroesse = '3xs' | '2xs' | 'xs' | 's' | 'm' | 'l' | 'xl' | '2xl' | '3xl';

export type Spieltyp = 'Ligaspiel' | 'Freundschaftsspiel' | 'Turnier';

export type ProbetrainingStatus = 'aktiv' | 'interessiert' | 'aufgenommen' | 'abgesagt';

export type NotizKategorie = 'Entwicklung' | 'Verhalten' | 'Gesundheit' | 'Elterngespräch';

// ==================== VEREIN ====================

export interface Verein {
  verein_id: UUID;
  bbb_kontakt_id?: string;
  verband_id?: number;  // 2 = Bayern
  name: string;
  kurzname?: string;
  ort?: string;
  ist_eigener_verein: boolean;
  sync_am?: Date;
  created_at: Date;
}

// ==================== TEAM ====================

export interface Team {
  team_id: UUID;
  verein_id: UUID;
  bbb_mannschafts_id?: string;
  name: string;
  altersklasse: Altersklasse;
  saison: string;  // z.B. "2025/2026"
  trainer: string;
  leistungsorientiert?: boolean;  // nur U12
  created_at: Date;
}

// ==================== SPIELER ====================

export interface Spieler {
  spieler_id: UUID;
  team_id?: UUID;  // Optional für Gegner
  verein_id?: UUID;  // Für Gegner-Tracking
  vorname: string;
  nachname: string;
  geburtsdatum?: Date;
  spieler_typ: SpielerTyp;
  mitgliedsnummer?: string;
  tna_nr?: string;
  konfektionsgroesse_jersey?: number;  // 116-170
  konfektionsgroesse_hose?: number;    // 116-170
  aktiv: boolean;
  created_at: Date;
  updated_at?: Date;
}

// ==================== SPIELER BEWERTUNG ====================

export interface SpielerBewertung {
  bewertung_id: UUID;
  spieler_id: UUID;
  bewertungs_typ: BewertungsTyp;
  saison: string;
  altersklasse: Altersklasse;
  gueltig_ab: Date;
  gueltig_bis?: Date;
  bewertet_von: string;
  
  // Bewertungsskalen (1-3, Default: 2)
  ballhandling_score: number;
  passen_fangen_score: number;
  spieluebersicht_score: number;
  teamplay_score: number;
  defense_score: number;
  laufbereitschaft_score: number;
  rebound_score: number;
  positionsflex_score: number;
  abschluss_score: number;
  
  gesamt_wert: number;  // Berechnet
  notizen?: string;
  created_at: Date;
  updated_at?: Date;
}

// ==================== ERZIEHUNGSBERECHTIGTE ====================

export interface Erziehungsberechtigte {
  erz_id: UUID;
  vorname: string;
  nachname: string;
  telefon_mobil: string;
  email: string;
  datenschutz_akzeptiert: boolean;
  created_at: Date;
  updated_at?: Date;
}

export interface SpielerErziehungsberechtigte {
  se_id: UUID;
  spieler_id: UUID;
  erz_id: UUID;
  beziehung: Beziehungstyp;
  ist_notfallkontakt: boolean;
  abholberechtigt: boolean;
  created_at: Date;
}

// ==================== HALLE ====================

export interface Halle {
  halle_id: UUID;
  bbb_halle_id?: string;
  name: string;
  strasse: string;
  plz: string;
  ort: string;
  verein_id?: UUID;
  anzahl_felder?: number;
  parken?: string;
  oepnv?: string;
  notizen?: string;
  sync_am?: Date;
  created_at: Date;
}

// ==================== LIGA ====================

export interface Liga {
  liga_id: UUID;
  bbb_liga_id?: string;
  verband_id?: number;
  name: string;
  saison: string;
  altersklasse: Altersklasse;
  spielklasse?: string;  // Bezirksliga, Kreisliga...
  region?: string;       // Oberpfalz, Oberbayern...
  sync_am?: Date;
  created_at: Date;
}

export interface LigaTeilnahme {
  teilnahme_id: UUID;
  liga_id: UUID;
  verein_id: UUID;
  team_id?: UUID;
  platzierung?: number;
  spiele?: number;
  siege?: number;
  niederlagen?: number;
  punkte?: number;
  created_at: Date;
}

// ==================== SPIELPLAN (BBB-Integration v4.0) ====================

export interface Spielplan {
  spielplan_id: UUID;
  team_id: UUID;
  saison: string;
  liga?: string;
  altersklasse?: string;
  
  // BBB-Integration v4.0 - Drei URL-Struktur
  bbb_spielplan_url?: string;
  bbb_tabelle_url?: string;
  bbb_ergebnisse_url?: string;
  liga_nr_offiziell?: string;
  syncam?: Date;
  
  created_at: Date;
}

// ==================== SPIEL ====================

export interface Spiel {
  spiel_id: UUID;
  spielplan_id?: UUID;
  team_id: UUID;
  
  // BBB-Integration v4.0
  spielnr?: number;
  spieltag?: number;
  
  datum: Date;
  uhrzeit?: string;
  heim: string;
  gast: string;
  halle_id?: UUID;
  ist_heimspiel: boolean;
  
  ergebnis_heim?: number;
  ergebnis_gast?: number;
  status: SpielStatus;
  
  altersklasse: Altersklasse;
  leistungsorientiert?: boolean;
  
  // Einsatzplanung-Statistiken
  durchschnitt_team_score?: number;
  balance_index?: number;
  
  notizen?: string;
  created_at: Date;
}

// ==================== LIGA ERGEBNISSE (für Benchmark) ====================

export interface LigaErgebnis {
  id: UUID;
  ligaid: UUID;
  spielnr?: number;
  heimteam: string;
  gastteam: string;
  ergebnis_heim: number;
  ergebnis_gast: number;
  datum: Date;
  syncam: Date;
}

// ==================== LIGA TABELLE ====================

export interface LigaTabelle {
  id: UUID;
  ligaid: UUID;
  teamname: string;
  platz: number;
  spiele: number;
  siege: number;
  niederlagen: number;
  punkte: number;
  korbe_erzielt: number;
  korbe_erhalten: number;
  korb_differenz: number;
  heim_siege: number;
  heim_niederlagen: number;
  auswaerts_siege: number;
  auswaerts_niederlagen: number;
  syncam: Date;
}

// ==================== TRIKOT ====================

export interface Trikot {
  trikot_id: UUID;
  team_id: UUID;
  art: TrikotArt;
  nummer?: string;
  groesse: TrikotGroesse;
  eu_groesse: number;  // 116-170
  farbe_dunkel?: string;
  farbe_hell?: string;
  status: TrikotStatus;
  besonderheiten?: string;
  created_at: Date;
}

// ==================== SPIELER EINSATZ ====================

export interface SpielerEinsatz {
  einsatz_id: UUID;
  spiel_id: UUID;
  spieler_id: UUID;
  jersey_id: UUID;
  hose_id: UUID;
  position: number;
  
  // 8 Achtel (Q1-1 bis Q4-2)
  q1_1: EinsatzStatus;
  q1_2: EinsatzStatus;
  q2_1: EinsatzStatus;
  q2_2: EinsatzStatus;
  q3_1: EinsatzStatus;
  q3_2: EinsatzStatus;
  q4_1: EinsatzStatus;
  q4_2: EinsatzStatus;
  
  // Berechnete Felder
  pausen: number;
  gespielt: number;
  
  created_at: Date;
  updated_at?: Date;
}

// ==================== ACHTEL STATISTIK ====================

export interface AchtelStatistik {
  achtel_stat_id: UUID;
  spiel_id: UUID;
  achtel_nummer: number;  // 1-8
  team_score: number;
  spieler_auf_feld: number;  // 3, 4 oder 5
  ballhandling_avg?: number;
  defense_avg?: number;
  berechnet_am: Date;
}

// ==================== TRAINING ====================

export interface Training {
  training_id: UUID;
  team_id: UUID;
  datum: Date;
  dauer_minuten: number;
  halle_id?: UUID;
  trainer: string;
  ist_probetraining: boolean;
  fokus?: string;
  notizen?: string;
  created_at: Date;
}

export interface TrainingTeilnahme {
  teilnahme_id: UUID;
  training_id: UUID;
  spieler_id: UUID;
  anwesend: boolean;
  entschuldigt?: boolean;
  notiz?: string;
}

// ==================== PROBETRAINING ====================

export interface ProbetrainingTeilnehmer {
  probe_id: UUID;
  vorname: string;
  nachname?: string;
  anzahl_teilnahmen: number;
  eltern_telefon?: string;
  status: ProbetrainingStatus;
  aufgenommen_als_spieler_id?: UUID;
  notizen?: string;
  created_at: Date;
}

export interface ProbetrainingHistorie {
  historie_id: UUID;
  probe_id: UUID;
  training_id: UUID;
  datum: Date;
  anwesend: boolean;
  notiz?: string;
}

// ==================== SPIELER NOTIZEN ====================

export interface SpielerNotiz {
  notiz_id: UUID;
  spieler_id: UUID;
  trainer: string;
  datum: Date;
  kategorie: NotizKategorie;
  text: string;
  vertraulich: boolean;
  created_at: Date;
}

// ==================== SAISON ARCHIV ====================

export interface SaisonArchiv {
  archiv_id: UUID;
  saison: string;
  team_id: UUID;
  team_snapshot: object;  // JSON
  statistiken: object;    // JSON
  archiviert_am: Date;
  archiviert_von: string;
}

// ==================== HELPER TYPES ====================

// CSV Import Types
export interface SpielerCSVRow {
  vorname: string;
  nachname: string;
  geburtsdatum?: string;
  tna_nr?: string;
  konfektionsgroesse_jersey?: string;
  konfektionsgroesse_hose?: string;
  erz_vorname?: string;
  erz_nachname?: string;
  erz_telefon?: string;
  erz_email?: string;
}

export interface TrikotCSVRow {
  art: string;
  nummer?: string;
  groesse: string;
  eu_groesse: string;
  farbe_dunkel?: string;
  farbe_hell?: string;
}

// BBB Parser Types
export interface BBBSpielData {
  nr: number;
  tag: number;
  datum: string;
  uhrzeit: string;
  heim: string;
  gast: string;
  halle: string;
}

export interface BBBTabellenEintrag {
  teamname: string;
  platz: number;
  spiele: number;
  siege: number;
  niederlagen: number;
  punkte: number;
  korbe_erzielt: number;
  korbe_erhalten: number;
}

// Onboarding State
export interface OnboardingState {
  step: 'welcome' | 'team' | 'verein' | 'spieler' | 'trikots' | 'spielplan' | 'complete';
  team?: Partial<Team>;
  verein?: Partial<Verein>;
  spieler_csv?: File;
  trikot_csv?: File;
  bbb_url?: string;
}
