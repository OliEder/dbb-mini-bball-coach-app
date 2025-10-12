/**
 * Basketball PWA - Dexie Database v4.0
 * 
 * WICHTIG: Version 4.0 - Compound-Indizes für Performance
 * Alte Versionen werden automatisch gelöscht!
 */

import Dexie, { type EntityTable } from 'dexie';
import type {
  Verein,
  Team,
  Spieler,
  SpielerBewertung,
  Erziehungsberechtigte,
  SpielerErziehungsberechtigte,
  Halle,
  Liga,
  LigaTeilnahme,
  Spielplan,
  Spiel,
  LigaErgebnis,
  LigaTabelle,
  Trikot,
  SpielerEinsatz,
  AchtelStatistik,
  Training,
  TrainingTeilnahme,
  ProbetrainingTeilnehmer,
  ProbetrainingHistorie,
  SpielerNotiz,
  SaisonArchiv
} from '../types';

const DB_NAME = 'BasketballPWA';
const DB_VERSION = 4; // Compound-Indizes hinzugefügt!

/**
 * Database Schema
 */
class BasketballDatabase extends Dexie {
  // Tabellen-Definitionen
  vereine!: EntityTable<Verein, 'verein_id'>;
  teams!: EntityTable<Team, 'team_id'>;
  spieler!: EntityTable<Spieler, 'spieler_id'>;
  bewertungen!: EntityTable<SpielerBewertung, 'bewertung_id'>;
  erziehungsberechtigte!: EntityTable<Erziehungsberechtigte, 'erz_id'>;
  spieler_erziehungsberechtigte!: EntityTable<SpielerErziehungsberechtigte, 'se_id'>;
  hallen!: EntityTable<Halle, 'halle_id'>;
  ligen!: EntityTable<Liga, 'liga_id'>;
  liga_teilnahmen!: EntityTable<LigaTeilnahme, 'teilnahme_id'>;
  spielplaene!: EntityTable<Spielplan, 'spielplan_id'>;
  spiele!: EntityTable<Spiel, 'spiel_id'>;
  liga_ergebnisse!: EntityTable<LigaErgebnis, 'id'>;
  liga_tabellen!: EntityTable<LigaTabelle, 'id'>;
  trikots!: EntityTable<Trikot, 'trikot_id'>;
  einsaetze!: EntityTable<SpielerEinsatz, 'einsatz_id'>;
  achtel_statistiken!: EntityTable<AchtelStatistik, 'achtel_stat_id'>;
  trainings!: EntityTable<Training, 'training_id'>;
  training_teilnahmen!: EntityTable<TrainingTeilnahme, 'teilnahme_id'>;
  probetraining_teilnehmer!: EntityTable<ProbetrainingTeilnehmer, 'probe_id'>;
  probetraining_historie!: EntityTable<ProbetrainingHistorie, 'historie_id'>;
  spieler_notizen!: EntityTable<SpielerNotiz, 'notiz_id'>;
  saison_archive!: EntityTable<SaisonArchiv, 'archiv_id'>;

  constructor() {
    super(DB_NAME);
    
    // Version 4: Compound-Indizes für Performance
    this.version(DB_VERSION).stores({
      // ========== VEREINE & TEAMS ==========
      vereine: 'verein_id, name, ist_eigener_verein, bbb_kontakt_id',
      teams: 'team_id, verein_id, name, saison, altersklasse, bbb_mannschafts_id, [verein_id+name+saison]',
      
      // ========== SPIELER ==========
      spieler: 'spieler_id, team_id, verein_id, spieler_typ, [vorname+nachname], aktiv, tna_nr, mitgliedsnummer, [team_id+aktiv]',
      bewertungen: 'bewertung_id, spieler_id, bewertungs_typ, saison, [saison+altersklasse], gueltig_ab',
      erziehungsberechtigte: 'erz_id, [vorname+nachname], email',
      spieler_erziehungsberechtigte: 'se_id, spieler_id, erz_id, ist_notfallkontakt',
      
      // ========== HALLEN & LIGEN ==========
      hallen: 'halle_id, verein_id, name, ort, bbb_halle_id',
      ligen: 'liga_id, bbb_liga_id, saison, altersklasse, name',
      liga_teilnahmen: 'teilnahme_id, liga_id, verein_id, team_id',
      
      // ========== SPIELPLAN & SPIELE (BBB-Integration) ==========
      spielplaene: 'spielplan_id, team_id, saison, bbb_spielplan_url',
      spiele: 'spiel_id, spielplan_id, team_id, datum, spielnr, spieltag, status, [team_id+datum], [spielplan_id+spielnr], [team_id+status]',
      liga_ergebnisse: 'id, ligaid, spielnr, datum, [heimteam+gastteam]',
      liga_tabellen: 'id, ligaid, teamname, [ligaid+platz]',
      
      // ========== TRIKOTS ==========
      trikots: 'trikot_id, team_id, art, status, nummer, [team_id+art]',
      
      // ========== EINSATZPLANUNG ==========
      einsaetze: 'einsatz_id, spiel_id, spieler_id, [spiel_id+position]',
      achtel_statistiken: 'achtel_stat_id, spiel_id, achtel_nummer, [spiel_id+achtel_nummer]',
      
      // ========== TRAINING & PROBETRAINING ==========
      trainings: 'training_id, team_id, datum, ist_probetraining, [team_id+datum]',
      training_teilnahmen: 'teilnahme_id, training_id, spieler_id, [training_id+spieler_id]',
      probetraining_teilnehmer: 'probe_id, vorname, status, aufgenommen_als_spieler_id',
      probetraining_historie: 'historie_id, probe_id, training_id, datum',
      
      // ========== NOTIZEN & ARCHIV ==========
      spieler_notizen: 'notiz_id, spieler_id, datum, kategorie, vertraulich',
      saison_archive: 'archiv_id, team_id, saison, archiviert_am'
    });

    // Migration von älteren Versionen
    this.on('versionchange', (event) => {
      console.log('🔄 Database version change detected:', event);
    });
  }
}

// Singleton Instance
export const db = new BasketballDatabase();

/**
 * Database Initialization mit Auto-Reset bei Version-Mismatch
 */
export async function initializeDatabase(): Promise<void> {
  try {
    // Prüfe ob alte Version existiert
    const existingDbs = await indexedDB.databases();
    const basketballDb = existingDbs.find(db => db.name === DB_NAME);
    
    if (basketballDb && basketballDb.version && basketballDb.version < DB_VERSION) {
      console.warn('⚠️  Alte Datenbank-Version gefunden:', basketballDb.version);
      console.log('🔄 Führe automatischen Reset durch...');
      await resetDatabase();
    }

    await db.open();
    console.log(`✅ Basketball PWA Database v${DB_VERSION}.0 initialized`);
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    throw error;
  }
}

/**
 * Database Reset (löscht ALLE Daten!)
 */
export async function resetDatabase(): Promise<void> {
  console.log('🗑️  Lösche alte Datenbank...');
  
  try {
    // Schließe aktive Verbindung
    db.close();
    
    // Lösche Datenbank
    await Dexie.delete(DB_NAME);
    
    // Lösche auch LocalStorage-Daten
    localStorage.removeItem('basketball-app');
    localStorage.removeItem('basketball-onboarding');
    
    console.log('✅ Datenbank erfolgreich gelöscht');
    
    // Öffne neu
    await db.open();
    console.log(`✅ Neue Datenbank v${DB_VERSION}.0 erstellt`);
    
  } catch (error) {
    console.error('❌ Reset fehlgeschlagen:', error);
    throw error;
  }
}

/**
 * Prüft ob Onboarding nötig ist
 */
export async function needsOnboarding(): Promise<boolean> {
  try {
    const teamCount = await db.teams.count();
    return teamCount === 0;
  } catch {
    return true;
  }
}

/**
 * Export/Import Helpers
 */
export async function exportDatabase(): Promise<string> {
  const data = {
    version: DB_VERSION,
    exported_at: new Date().toISOString(),
    data: {
      vereine: await db.vereine.toArray(),
      teams: await db.teams.toArray(),
      spieler: await db.spieler.toArray(),
      bewertungen: await db.bewertungen.toArray(),
      erziehungsberechtigte: await db.erziehungsberechtigte.toArray(),
      spieler_erziehungsberechtigte: await db.spieler_erziehungsberechtigte.toArray(),
      hallen: await db.hallen.toArray(),
      ligen: await db.ligen.toArray(),
      liga_teilnahmen: await db.liga_teilnahmen.toArray(),
      spielplaene: await db.spielplaene.toArray(),
      spiele: await db.spiele.toArray(),
      liga_ergebnisse: await db.liga_ergebnisse.toArray(),
      liga_tabellen: await db.liga_tabellen.toArray(),
      trikots: await db.trikots.toArray(),
      einsaetze: await db.einsaetze.toArray(),
      achtel_statistiken: await db.achtel_statistiken.toArray(),
      trainings: await db.trainings.toArray(),
      training_teilnahmen: await db.training_teilnahmen.toArray(),
      probetraining_teilnehmer: await db.probetraining_teilnehmer.toArray(),
      probetraining_historie: await db.probetraining_historie.toArray(),
      spieler_notizen: await db.spieler_notizen.toArray(),
      saison_archive: await db.saison_archive.toArray(),
    }
  };
  
  return JSON.stringify(data, null, 2);
}

export async function importDatabase(jsonData: string): Promise<void> {
  const backup = JSON.parse(jsonData);
  
  if (!backup.data) {
    throw new Error('Ungültiges Backup-Format');
  }
  
  await db.transaction('rw', 
    db.vereine,
    db.teams,
    db.spieler,
    db.bewertungen,
    db.erziehungsberechtigte,
    db.spieler_erziehungsberechtigte,
    db.hallen,
    db.ligen,
    db.liga_teilnahmen,
    db.spielplaene,
    db.spiele,
    db.liga_ergebnisse,
    db.liga_tabellen,
    db.trikots,
    db.einsaetze,
    db.achtel_statistiken,
    db.trainings,
    db.training_teilnahmen,
    db.probetraining_teilnehmer,
    db.probetraining_historie,
    db.spieler_notizen,
    db.saison_archive,
    async () => {
      // Clear all tables
      await Promise.all([
        db.vereine.clear(),
        db.teams.clear(),
        db.spieler.clear(),
        db.bewertungen.clear(),
        db.erziehungsberechtigte.clear(),
        db.spieler_erziehungsberechtigte.clear(),
        db.hallen.clear(),
        db.ligen.clear(),
        db.liga_teilnahmen.clear(),
        db.spielplaene.clear(),
        db.spiele.clear(),
        db.liga_ergebnisse.clear(),
        db.liga_tabellen.clear(),
        db.trikots.clear(),
        db.einsaetze.clear(),
        db.achtel_statistiken.clear(),
        db.trainings.clear(),
        db.training_teilnahmen.clear(),
        db.probetraining_teilnehmer.clear(),
        db.probetraining_historie.clear(),
        db.spieler_notizen.clear(),
        db.saison_archive.clear(),
      ]);
      
      // Import data
      const data = backup.data;
      if (data.vereine?.length) await db.vereine.bulkAdd(data.vereine);
      if (data.teams?.length) await db.teams.bulkAdd(data.teams);
      if (data.spieler?.length) await db.spieler.bulkAdd(data.spieler);
      if (data.bewertungen?.length) await db.bewertungen.bulkAdd(data.bewertungen);
      if (data.erziehungsberechtigte?.length) await db.erziehungsberechtigte.bulkAdd(data.erziehungsberechtigte);
      if (data.spieler_erziehungsberechtigte?.length) await db.spieler_erziehungsberechtigte.bulkAdd(data.spieler_erziehungsberechtigte);
      if (data.hallen?.length) await db.hallen.bulkAdd(data.hallen);
      if (data.ligen?.length) await db.ligen.bulkAdd(data.ligen);
      if (data.liga_teilnahmen?.length) await db.liga_teilnahmen.bulkAdd(data.liga_teilnahmen);
      if (data.spielplaene?.length) await db.spielplaene.bulkAdd(data.spielplaene);
      if (data.spiele?.length) await db.spiele.bulkAdd(data.spiele);
      if (data.liga_ergebnisse?.length) await db.liga_ergebnisse.bulkAdd(data.liga_ergebnisse);
      if (data.liga_tabellen?.length) await db.liga_tabellen.bulkAdd(data.liga_tabellen);
      if (data.trikots?.length) await db.trikots.bulkAdd(data.trikots);
      if (data.einsaetze?.length) await db.einsaetze.bulkAdd(data.einsaetze);
      if (data.achtel_statistiken?.length) await db.achtel_statistiken.bulkAdd(data.achtel_statistiken);
      if (data.trainings?.length) await db.trainings.bulkAdd(data.trainings);
      if (data.training_teilnahmen?.length) await db.training_teilnahmen.bulkAdd(data.training_teilnahmen);
      if (data.probetraining_teilnehmer?.length) await db.probetraining_teilnehmer.bulkAdd(data.probetraining_teilnehmer);
      if (data.probetraining_historie?.length) await db.probetraining_historie.bulkAdd(data.probetraining_historie);
      if (data.spieler_notizen?.length) await db.spieler_notizen.bulkAdd(data.spieler_notizen);
      if (data.saison_archive?.length) await db.saison_archive.bulkAdd(data.saison_archive);
      
      console.log('✅ Database import complete');
    }
  );
}
