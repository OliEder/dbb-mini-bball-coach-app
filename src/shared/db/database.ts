/**
 * Basketball PWA - Dexie Database v7.1
 * 
 * WICHTIG: Version 7.1 - HOTFIX für team_liga_participations Index
 * - Entfernt problematischen [team_id+ist_aktiv] Compound-Index
 * - ist_aktiv bleibt als Simple-Index (true/false Support)
 * 
 * v7.0: Team Liga Participation Historisierung
 * - Team Interface vereinfacht (permanente Properties)
 * - TeamLigaParticipation für Saison/Liga History
 * Alte Versionen werden automatisch migriert!
 */

import Dexie, { type EntityTable } from 'dexie';
import type {
  User,
  Verein,
  Team,
  TeamLigaParticipation,
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
const DB_VERSION = 9; // v7.2 HOTFIX: Force cache refresh

/**
 * Database Schema
 */
class BasketballDatabase extends Dexie {
  // Tabellen-Definitionen
  users!: EntityTable<User, 'user_id'>;
  vereine!: EntityTable<Verein, 'verein_id'>;
  teams!: EntityTable<Team, 'team_id'>;
  team_liga_participations!: EntityTable<TeamLigaParticipation, 'id'>;
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
    
    // Version 9: FORCE CACHE REFRESH (identical to v8)
    this.version(DB_VERSION).stores({
      // ========== USER (TRAINER) ==========
      users: 'user_id, name, email, created_at',
      
      // ========== VEREINE & TEAMS (v7.0 - BREAKING) ==========
      vereine: 'verein_id, extern_verein_id, name, ist_eigener_verein, bbb_kontakt_id',
      teams: 'team_id, extern_permanent_id, verein_id, user_id, name, geschlecht, team_typ, trainer, [verein_id+name], [user_id+team_typ]',
      
      // ✅ v7.1 HOTFIX: Removed [team_id+ist_aktiv] compound index
      // ist_aktiv as simple index works better with true/false values
      team_liga_participations: '++id, team_id, extern_team_id, saison, altersklasse, liga_id, ist_aktiv, [team_id+saison], [team_id+liga_id]',
      
      // ========== SPIELER ==========
      spieler: 'spieler_id, extern_spieler_id, team_id, verein_id, spieler_typ, [vorname+nachname], aktiv, tna_nr, mitgliedsnummer, [team_id+aktiv], trikotnummer',
      bewertungen: 'bewertung_id, spieler_id, bewertungs_typ, saison, [saison+altersklasse], gueltig_ab',
      erziehungsberechtigte: 'erz_id, [vorname+nachname], email',
      spieler_erziehungsberechtigte: 'se_id, spieler_id, erz_id, ist_notfallkontakt',
      
      // ========== HALLEN & LIGEN ==========
      hallen: 'halle_id, verein_id, name, ort, bbb_halle_id',
      ligen: 'liga_id, bbb_liga_id, saison, altersklasse, name',
      liga_teilnahmen: 'teilnahme_id, liga_id, verein_id, team_id',
      
      // ========== SPIELPLAN & SPIELE (BBB-Integration v6) ==========
      spielplaene: 'spielplan_id, team_id, saison, bbb_spielplan_url',
      spiele: 'spiel_id, extern_spiel_id, liga_id, spielplan_id, heim_team_id, gast_team_id, datum, spielnr, spieltag, status, [heim_team_id+datum], [gast_team_id+datum], [spielplan_id+spielnr], [liga_id+datum]',
      liga_ergebnisse: 'id, ligaid, spielnr, datum, [heimteam+gastteam]',
      liga_tabellen: 'id, ligaid, teamname, [ligaid+platz], [ligaid+teamname]',
      
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

    // Version 8: HOTFIX - Remove problematic compound index (LEGACY)
    this.version(8).stores({
      // ========== USER (TRAINER) ==========
      users: 'user_id, name, email, created_at',
      
      // ========== VEREINE & TEAMS (v7.0 - BREAKING) ==========
      vereine: 'verein_id, extern_verein_id, name, ist_eigener_verein, bbb_kontakt_id',
      teams: 'team_id, extern_permanent_id, verein_id, user_id, name, geschlecht, team_typ, trainer, [verein_id+name], [user_id+team_typ]',
      
      // ✅ v7.1 HOTFIX: Removed [team_id+ist_aktiv] compound index
      // ist_aktiv as simple index works better with true/false values
      team_liga_participations: '++id, team_id, extern_team_id, saison, altersklasse, liga_id, ist_aktiv, [team_id+saison], [team_id+liga_id]',
      
      // ========== SPIELER ==========
      spieler: 'spieler_id, extern_spieler_id, team_id, verein_id, spieler_typ, [vorname+nachname], aktiv, tna_nr, mitgliedsnummer, [team_id+aktiv], trikotnummer',
      bewertungen: 'bewertung_id, spieler_id, bewertungs_typ, saison, [saison+altersklasse], gueltig_ab',
      erziehungsberechtigte: 'erz_id, [vorname+nachname], email',
      spieler_erziehungsberechtigte: 'se_id, spieler_id, erz_id, ist_notfallkontakt',
      
      // ========== HALLEN & LIGEN ==========
      hallen: 'halle_id, verein_id, name, ort, bbb_halle_id',
      ligen: 'liga_id, bbb_liga_id, saison, altersklasse, name',
      liga_teilnahmen: 'teilnahme_id, liga_id, verein_id, team_id',
      
      // ========== SPIELPLAN & SPIELE (BBB-Integration v6) ==========
      spielplaene: 'spielplan_id, team_id, saison, bbb_spielplan_url',
      spiele: 'spiel_id, extern_spiel_id, liga_id, spielplan_id, heim_team_id, gast_team_id, datum, spielnr, spieltag, status, [heim_team_id+datum], [gast_team_id+datum], [spielplan_id+spielnr], [liga_id+datum]',
      liga_ergebnisse: 'id, ligaid, spielnr, datum, [heimteam+gastteam]',
      liga_tabellen: 'id, ligaid, teamname, [ligaid+platz], [ligaid+teamname]',
      
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

    // Version 7: Team Liga Participation Historisierung (LEGACY - Migration)
    this.version(7).stores({
      users: 'user_id, name, email, created_at',
      vereine: 'verein_id, extern_verein_id, name, ist_eigener_verein, bbb_kontakt_id',
      teams: 'team_id, extern_permanent_id, verein_id, user_id, name, geschlecht, team_typ, trainer, [verein_id+name], [user_id+team_typ]',
      team_liga_participations: '++id, team_id, extern_team_id, saison, altersklasse, liga_id, ist_aktiv, [team_id+saison], [team_id+liga_id], [team_id+ist_aktiv]',
      spieler: 'spieler_id, extern_spieler_id, team_id, verein_id, spieler_typ, [vorname+nachname], aktiv, tna_nr, mitgliedsnummer, [team_id+aktiv], trikotnummer',
      bewertungen: 'bewertung_id, spieler_id, bewertungs_typ, saison, [saison+altersklasse], gueltig_ab',
      erziehungsberechtigte: 'erz_id, [vorname+nachname], email',
      spieler_erziehungsberechtigte: 'se_id, spieler_id, erz_id, ist_notfallkontakt',
      hallen: 'halle_id, verein_id, name, ort, bbb_halle_id',
      ligen: 'liga_id, bbb_liga_id, saison, altersklasse, name',
      liga_teilnahmen: 'teilnahme_id, liga_id, verein_id, team_id',
      spielplaene: 'spielplan_id, team_id, saison, bbb_spielplan_url',
      spiele: 'spiel_id, extern_spiel_id, liga_id, spielplan_id, heim_team_id, gast_team_id, datum, spielnr, spieltag, status, [heim_team_id+datum], [gast_team_id+datum], [spielplan_id+spielnr], [liga_id+datum]',
      liga_ergebnisse: 'id, ligaid, spielnr, datum, [heimteam+gastteam]',
      liga_tabellen: 'id, ligaid, teamname, [ligaid+platz], [ligaid+teamname]',
      trikots: 'trikot_id, team_id, art, status, nummer, [team_id+art]',
      einsaetze: 'einsatz_id, spiel_id, spieler_id, [spiel_id+position]',
      achtel_statistiken: 'achtel_stat_id, spiel_id, achtel_nummer, [spiel_id+achtel_nummer]',
      trainings: 'training_id, team_id, datum, ist_probetraining, [team_id+datum]',
      training_teilnahmen: 'teilnahme_id, training_id, spieler_id, [training_id+spieler_id]',
      probetraining_teilnehmer: 'probe_id, vorname, status, aufgenommen_als_spieler_id',
      probetraining_historie: 'historie_id, probe_id, training_id, datum',
      spieler_notizen: 'notiz_id, spieler_id, datum, kategorie, vertraulich',
      saison_archive: 'archiv_id, team_id, saison, archiviert_am'
    }).upgrade(async tx => {
      console.log('⚠️  Migrating to v7.0: Team Liga Participation Historisierung...');
      
      // Migration v6→v7: Team Properties → TeamLigaParticipation
      const oldTeams = await tx.table('teams').toArray() as any[];
      console.log(`📊 Migriere ${oldTeams.length} Teams...`);
      
      for (const oldTeam of oldTeams) {
        // 1. Erstelle TeamLigaParticipation aus Team-Daten
        if (oldTeam.altersklasse && oldTeam.saison) {
          const participation = {
            team_id: oldTeam.team_id,
            extern_team_id: oldTeam.extern_team_id,
            saison: oldTeam.saison,
            altersklasse: oldTeam.altersklasse,
            altersklasse_id: oldTeam.altersklasse_id,
            liga_id: oldTeam.liga_id,
            liga_name: oldTeam.liga_name,
            leistungsorientiert: oldTeam.leistungsorientiert,
            ist_aktiv: true,
            created_at: new Date()
          };
          
          await tx.table('team_liga_participations').add(participation);
          console.log(`✅ Created Participation for Team ${oldTeam.name} (${oldTeam.saison})`);
        }
        
        // 2. Update Team: Remove old properties
        await tx.table('teams').update(oldTeam.team_id, {
          extern_permanent_id: oldTeam.extern_team_id,
          extern_team_id: undefined,
          altersklasse: undefined,
          altersklasse_id: undefined,
          saison: undefined,
          liga_id: undefined,
          liga_name: undefined,
          leistungsorientiert: undefined
        } as any);
      }
      
      console.log('✅ Migration v7.0 complete!');
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
    console.log('📦 Initialisiere Basketball Database...');
    
    // Prüfe ob alte Version existiert
    const existingDbs = await indexedDB.databases();
    const basketballDb = existingDbs.find(db => db.name === DB_NAME);
    
    if (basketballDb && basketballDb.version && basketballDb.version < DB_VERSION) {
      console.warn('⚠️  Alte Datenbank-Version gefunden:', basketballDb.version);
      console.log('🔄 Führe automatischen Reset durch...');
      await resetDatabase();
    }

    // Öffne Datenbank
    await db.open();
    
    // Validiere dass alle Tabellen existieren
    const tables = db.tables.map(t => t.name);
    console.log('🗃️ Verfügbare Tabellen:', tables);
    
    // Prüfe kritische Tabellen
    const criticalTables = ['vereine', 'teams', 'spieler', 'spiele', 'ligen'];
    const missingTables = criticalTables.filter(t => !tables.includes(t));
    
    if (missingTables.length > 0) {
      console.error('❌ Fehlende Tabellen:', missingTables);
      throw new Error(`Kritische Tabellen fehlen: ${missingTables.join(', ')}`);
    }
    
    console.log(`✅ Basketball PWA Database v${DB_VERSION}.0 initialized`);
    console.log(`✅ ${tables.length} Tabellen verfügbar`);
    
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    console.log('🔄 Versuche Reset und Neustart...');
    
    try {
      await resetDatabase();
      await db.open();
      console.log('✅ Database nach Reset erfolgreich initialisiert');
    } catch (resetError) {
      console.error('❌ Auch Reset fehlgeschlagen:', resetError);
      throw resetError;
    }
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
      team_liga_participations: await db.team_liga_participations.toArray(),
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
  
  const data = backup.data;
  
  // Dexie unterstützt max 5 Tabellen pro Transaction
  // Daher in viele kleine Transaktionen aufteilen
  
  // Transaction 1: Vereine, Teams, Team Participations, Spieler
  await db.transaction('rw', [db.vereine, db.teams, db.team_liga_participations, db.spieler, db.bewertungen], async () => {
    await db.vereine.clear();
    await db.teams.clear();
    await db.team_liga_participations.clear();
    await db.spieler.clear();
    await db.bewertungen.clear();
    
    if (data.vereine?.length) await db.vereine.bulkAdd(data.vereine);
    if (data.teams?.length) await db.teams.bulkAdd(data.teams);
    if (data.team_liga_participations?.length) await db.team_liga_participations.bulkAdd(data.team_liga_participations);
    if (data.spieler?.length) await db.spieler.bulkAdd(data.spieler);
    if (data.bewertungen?.length) await db.bewertungen.bulkAdd(data.bewertungen);
  });
  
  // Transaction 2: Trikots, Erziehungsberechtigte
  await db.transaction('rw', db.trikots, db.erziehungsberechtigte, db.spieler_erziehungsberechtigte, async () => {
    await db.trikots.clear();
    await db.erziehungsberechtigte.clear();
    await db.spieler_erziehungsberechtigte.clear();
    
    if (data.trikots?.length) await db.trikots.bulkAdd(data.trikots);
    if (data.erziehungsberechtigte?.length) await db.erziehungsberechtigte.bulkAdd(data.erziehungsberechtigte);
    if (data.spieler_erziehungsberechtigte?.length) await db.spieler_erziehungsberechtigte.bulkAdd(data.spieler_erziehungsberechtigte);
  });
  
  // Transaction 3: Hallen, Ligen, Liga-Teilnahmen
  await db.transaction('rw', db.hallen, db.ligen, db.liga_teilnahmen, async () => {
    await db.hallen.clear();
    await db.ligen.clear();
    await db.liga_teilnahmen.clear();
    
    if (data.hallen?.length) await db.hallen.bulkAdd(data.hallen);
    if (data.ligen?.length) await db.ligen.bulkAdd(data.ligen);
    if (data.liga_teilnahmen?.length) await db.liga_teilnahmen.bulkAdd(data.liga_teilnahmen);
  });
  
  // Transaction 4: Spielplan, Spiele
  await db.transaction('rw', db.spielplaene, db.spiele, async () => {
    await db.spielplaene.clear();
    await db.spiele.clear();
    
    if (data.spielplaene?.length) await db.spielplaene.bulkAdd(data.spielplaene);
    if (data.spiele?.length) await db.spiele.bulkAdd(data.spiele);
  });
  
  // Transaction 5: Liga-Ergebnisse, Tabellen, Einsätze
  await db.transaction('rw', db.liga_ergebnisse, db.liga_tabellen, db.einsaetze, db.achtel_statistiken, async () => {
    await db.liga_ergebnisse.clear();
    await db.liga_tabellen.clear();
    await db.einsaetze.clear();
    await db.achtel_statistiken.clear();
    
    if (data.liga_ergebnisse?.length) await db.liga_ergebnisse.bulkAdd(data.liga_ergebnisse);
    if (data.liga_tabellen?.length) await db.liga_tabellen.bulkAdd(data.liga_tabellen);
    if (data.einsaetze?.length) await db.einsaetze.bulkAdd(data.einsaetze);
    if (data.achtel_statistiken?.length) await db.achtel_statistiken.bulkAdd(data.achtel_statistiken);
  });
  
  // Transaction 6: Training, Teilnahmen
  await db.transaction('rw', db.trainings, db.training_teilnahmen, async () => {
    await db.trainings.clear();
    await db.training_teilnahmen.clear();
    
    if (data.trainings?.length) await db.trainings.bulkAdd(data.trainings);
    if (data.training_teilnahmen?.length) await db.training_teilnahmen.bulkAdd(data.training_teilnahmen);
  });
  
  // Transaction 7: Probetraining, Notizen, Archiv
  await db.transaction('rw', db.probetraining_teilnehmer, db.probetraining_historie, db.spieler_notizen, db.saison_archive, async () => {
    await db.probetraining_teilnehmer.clear();
    await db.probetraining_historie.clear();
    await db.spieler_notizen.clear();
    await db.saison_archive.clear();
    
    if (data.probetraining_teilnehmer?.length) await db.probetraining_teilnehmer.bulkAdd(data.probetraining_teilnehmer);
    if (data.probetraining_historie?.length) await db.probetraining_historie.bulkAdd(data.probetraining_historie);
    if (data.spieler_notizen?.length) await db.spieler_notizen.bulkAdd(data.spieler_notizen);
    if (data.saison_archive?.length) await db.saison_archive.bulkAdd(data.saison_archive);
  });
  
  console.log('✅ Database import complete');
}
