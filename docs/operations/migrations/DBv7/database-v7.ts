// ============================================
// database.ts v7.0 - Team-Liga-Relationships
// ============================================

import Dexie, { type EntityTable } from 'dexie';
import type {
  Team,
  TeamLigaParticipation,
  Liga,
  Verein,
  Spiel,
  Spieler,
  Halle,
  LigaTabelle,
  User,
} from '../types';

/**
 * Database Version History:
 * - v1-v5: Initial development
 * - v6: Removed team_id from Spiel (team_id → heim_team_id/gast_team_id)
 * - v7: Team-Liga-Relationships (team_liga_participations table)
 */
const DB_VERSION = 7;

class BasketballDatabase extends Dexie {
  // Tables
  teams!: EntityTable<Team, 'team_id'>;
  team_liga_participations!: EntityTable<TeamLigaParticipation, 'participation_id'>;
  ligen!: EntityTable<Liga, 'liga_id'>;
  vereine!: EntityTable<Verein, 'verein_id'>;
  spiele!: EntityTable<Spiel, 'spiel_id'>;
  spieler!: EntityTable<Spieler, 'spieler_id'>;
  hallen!: EntityTable<Halle, 'halle_id'>;
  liga_tabellen!: EntityTable<LigaTabelle, 'id'>;
  users!: EntityTable<User, 'user_id'>;

  constructor() {
    super('basketball-app');

    // ============================================
    // v7.0 Schema - Team-Liga-Relationships
    // ============================================
    this.version(DB_VERSION).stores({
      // Teams - Permanente Entität (ohne Liga/Saison)
      teams: `
        team_id,
        extern_permanent_id,
        verein_id,
        name,
        team_typ,
        user_id,
        [extern_permanent_id+verein_id],
        [user_id+team_typ],
        created_at
      `,

      // TeamLigaParticipations - Team spielt in Liga (NEU in v7.0)
      team_liga_participations: `
        participation_id,
        team_id,
        liga_id,
        extern_season_team_id,
        altersklasse,
        saison,
        ist_aktiv,
        [team_id+liga_id],
        [team_id+saison],
        [team_id+ist_aktiv],
        created_at
      `,

      // Ligen
      ligen: `
        liga_id,
        bbb_liga_id,
        name,
        saison,
        altersklasse,
        sync_am,
        created_at
      `,

      // Vereine
      vereine: `
        verein_id,
        extern_verein_id,
        name,
        ort,
        ist_eigener_verein,
        created_at
      `,

      // Spiele (v6.0: team_id entfernt)
      spiele: `
        spiel_id,
        extern_spiel_id,
        liga_id,
        heim_team_id,
        gast_team_id,
        datum,
        uhrzeit,
        halle_id,
        ist_heimspiel,
        status,
        altersklasse,
        [heim_team_id+datum],
        [gast_team_id+datum],
        [liga_id+datum],
        [liga_id+status],
        created_at
      `,

      // Spieler
      spieler: `
        spieler_id,
        extern_spieler_id,
        team_id,
        vorname,
        nachname,
        trikotnummer,
        spieler_typ,
        aktiv,
        [team_id+aktiv],
        created_at
      `,

      // Hallen
      hallen: `
        halle_id,
        name,
        strasse,
        plz,
        ort,
        sync_am,
        created_at
      `,

      // Liga-Tabellen
      liga_tabellen: `
        id,
        ligaid,
        teamname,
        platz,
        spiele,
        siege,
        niederlagen,
        punkte,
        [ligaid+teamname],
        [ligaid+platz],
        syncam
      `,

      // Users
      users: `
        user_id,
        name,
        email,
        vereinsname,
        created_at
      `,
    });
  }
}

// Singleton-Instanz
export const db = new BasketballDatabase();

// ============================================
// Helper Functions für v7.0
// ============================================

/**
 * Holt Team mit aktueller Participation
 */
export async function getTeamMitAktuellerParticipation(teamId: string) {
  const team = await db.teams.get(teamId);
  if (!team) return null;

  const participation = await db.team_liga_participations
    .where('[team_id+ist_aktiv]')
    .equals([teamId, true])
    .first();

  return {
    ...team,
    current_liga_id: participation?.liga_id,
    current_altersklasse: participation?.altersklasse,
    current_saison: participation?.saison,
    current_participation_id: participation?.participation_id,
  };
}

/**
 * Holt alle Participations eines Teams
 */
export async function getTeamParticipations(teamId: string) {
  return await db.team_liga_participations
    .where('team_id')
    .equals(teamId)
    .sortBy('created_at');
}

/**
 * Holt aktive Participation (aktuelle Saison)
 */
export async function getAktiveParticipation(teamId: string) {
  return await db.team_liga_participations
    .where('[team_id+ist_aktiv]')
    .equals([teamId, true])
    .first();
}

/**
 * Setzt alle Participations eines Teams auf inaktiv
 */
export async function deactivateAllParticipations(teamId: string) {
  const participations = await db.team_liga_participations
    .where('team_id')
    .equals(teamId)
    .toArray();

  await Promise.all(
    participations.map(p =>
      db.team_liga_participations.update(p.participation_id, {
        ist_aktiv: false,
      })
    )
  );
}

/**
 * Holt Teams einer Liga (über Participations)
 */
export async function getTeamsInLiga(ligaId: string) {
  const participations = await db.team_liga_participations
    .where('liga_id')
    .equals(ligaId)
    .toArray();

  const teamIds = participations.map(p => p.team_id);
  
  return await db.teams
    .where('team_id')
    .anyOf(teamIds)
    .toArray();
}

export default db;
