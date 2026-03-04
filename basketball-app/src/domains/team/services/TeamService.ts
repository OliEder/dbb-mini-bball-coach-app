/**
 * Team Service
 * 
 * Domain Service für Team-Management
 * CRUD-Operationen auf der Database
 * 
 * Phase 2: Multi-Team Support
 * - getMyTeams() - Alle Teams eines Trainers
 * - getTeamStats() - Statistiken für Team-Übersicht
 */

import { v4 as uuidv4 } from 'uuid';
import { db } from '@/shared/db/database';
import type { Team, TeamLigaParticipation, UUID, CreateTeamInput, Spiel, Altersklasse } from '@/shared/types';
import { spielService } from '@/domains/spielplan/services/SpielService';

/**
 * Team-Statistiken für Übersicht (v7.0)
 */
export interface TeamStats {
  spielerCount: number;
  spieleCount: number;
  naechstesSpiel?: Spiel;
  tabellenplatz?: number;
  // v7.0: Participation-Daten
  altersklasse?: Altersklasse;
  saison?: string;
  liga_name?: string;
}

export class TeamService {
  /**
   * Erstellt ein neues Team (v7.0)
   * 
   * ⚠️ DEPRECATED: Verwende createTeamWithParticipation() für neue Teams!
   * Diese Methode erstellt nur das Team ohne Participation.
   */
  async createTeam(input: CreateTeamInput): Promise<Team> {
    const team: Team = {
      team_id: uuidv4(),
      extern_permanent_id: input.extern_permanent_id,
      verein_id: input.verein_id,
      name: input.name,
      geschlecht: input.geschlecht,
      trainer: input.trainer,
      team_typ: input.team_typ ?? 'eigen',  // Default: 'eigen'
      user_id: input.user_id,
      created_at: new Date(),
    };

    await db.teams.add(team);
    return team;
  }

  /**
   * Findet Team by ID
   */
  async getTeamById(team_id: UUID): Promise<Team | undefined> {
    return await db.teams.get(team_id);
  }

  /**
   * Alle Teams eines Vereins
   */
  async getTeamsByVerein(verein_id: UUID): Promise<Team[]> {
    return await db.teams.where({ verein_id }).toArray();
  }

  /**
   * Alle Teams einer Saison (v7.0)
   * 
   * ⚠️ DEPRECATED: Teams haben keine saison mehr!
   * Verwende getTeamsByActiveSaison() oder filter via Participations.
   */
  async getTeamsBySaison(saison: string): Promise<Team[]> {
    // v7.0: Filter via TeamLigaParticipations
    const participations = await db.team_liga_participations
      .where('saison')
      .equals(saison)
      .toArray();
    
    const teamIds = participations.map(p => p.team_id);
    return await db.teams.bulkGet(teamIds).then(teams => teams.filter(Boolean) as Team[]);
  }

  /**
   * Alle Teams
   */
  async getAllTeams(): Promise<Team[]> {
    return await db.teams.toArray();
  }

  /**
   * ✅ NEU: Holt alle Teams des Trainers (eigene Teams)
   * 
   * Filtert nach:
   * - user_id (Trainer)
   * - team_typ = 'eigen'
   * 
   * Sortiert nach created_at (älteste zuerst)
   */
  async getMyTeams(userId: string): Promise<Team[]> {
    if (!userId) {
      return [];
    }

    return await db.teams
      .where('[user_id+team_typ]')
      .equals([userId, 'eigen'])
      .sortBy('created_at');
  }

  /**
   * ✅ v7.0: Holt Team-Statistiken für Übersicht
   * 
   * Liefert:
   * - Anzahl Spieler
   * - Anzahl Spiele
   * - Nächstes geplantes Spiel
   * - Tabellenplatz (wenn vorhanden)
   * - Participation-Daten (altersklasse, saison, liga_name)
   */
  async getTeamStats(teamId: string): Promise<TeamStats> {
    // Parallel alle Daten laden für bessere Performance
    const [spielerCount, spiele, team, participation] = await Promise.all([
      db.spieler.where('team_id').equals(teamId).count(),
      spielService.getSpiele(teamId),
      db.teams.get(teamId),
      this.getActiveParticipation(teamId) // v7.0: Active Participation laden
    ]);

    // Nächstes geplantes Spiel finden
    const now = new Date();
    const naechstesSpiel = spiele
      .filter(s => s.status === 'geplant' && s.datum > now)
      .sort((a, b) => a.datum.getTime() - b.datum.getTime())[0];

    // Tabellenplatz (v7.0: über Participation)
    let tabellenplatz: number | undefined;
    
    if (participation?.liga_id && team?.name) {
      const tabellenEintrag = await db.liga_tabellen
        .where('[ligaid+teamname]')
        .equals([participation.liga_id, team.name])
        .first();
      
      tabellenplatz = tabellenEintrag?.platz;
    }

    return {
      spielerCount,
      spieleCount: spiele.length,
      naechstesSpiel,
      tabellenplatz,
      // v7.0: Participation-Daten
      altersklasse: participation?.altersklasse,
      saison: participation?.saison,
      liga_name: participation?.liga_name,
    };
  }

  /**
   * Aktualisiert ein Team
   */
  async updateTeam(team_id: UUID, updates: Partial<Omit<Team, 'team_id' | 'created_at'>>): Promise<void> {
    await db.teams.update(team_id, updates);
  }

  /**
   * Löscht ein Team
   * 
   * ⚠️ WARNUNG: Löscht auch alle zugehörigen Daten:
   * - Spieler
   * - Trikots  
   * - Einsätze (der gelöschten Spieler)
   * 
   * ✅ v6.0: Spiele werden NICHT gelöscht (existieren unabhängig)
   */
  async deleteTeam(team_id: UUID): Promise<void> {
    // Hole alle Spieler-IDs für späteres Einsätze-Löschen
    const spielerIds = (await db.spieler.where({ team_id }).toArray()).map(s => s.spieler_id);
    
    // Transaction: Team, Spieler, Trikots, Einsätze
    await db.transaction('rw', db.teams, db.spieler, db.trikots, db.einsaetze, async () => {
      // Lösche Team
      await db.teams.delete(team_id);
      
      // Lösche Spieler
      await db.spieler.where({ team_id }).delete();
      
      // Lösche Trikots
      await db.trikots.where({ team_id }).delete();
      
      // Lösche Einsätze der gelöschten Spieler
      for (const spieler_id of spielerIds) {
        await db.einsaetze.where({ spieler_id }).delete();
      }
    });
  }

  /**
   * Prüft ob Team-Name bereits existiert (v7.0)
   * 
   * @param verein_id Verein UUID
   * @param name Team-Name
   * @returns true wenn Team-Name im Verein existiert
   */
  async isTeamNameTaken(verein_id: UUID, name: string): Promise<boolean> {
    const existing = await db.teams
      .where({ verein_id, name })
      .first();
    
    return !!existing;
  }

  /**
   * Zählt Spieler in einem Team
   */
  async countPlayers(team_id: UUID): Promise<number> {
    return await db.spieler.where({ team_id }).count();
  }

  /**
   * Zählt Spiele eines Teams
   * ✅ v6.0: Verwendet SpielService
   */
  async countGames(team_id: UUID): Promise<number> {
    const spiele = await spielService.getSpiele(team_id);
    return spiele.length;
  }

  // ========== v7.0 METHODS: TeamLigaParticipation Support ==========

  /**
   * v7.0: Lädt die aktive Participation für ein Team
   * 
   * v7.1 HOTFIX: Verwendet Simple-Index statt Compound-Index
   * 
   * @param teamId Team UUID
   * @returns Aktive TeamLigaParticipation oder undefined
   */
  async getActiveParticipation(teamId: UUID): Promise<TeamLigaParticipation | undefined> {
    // ✅ v7.1: Use simple team_id index, then filter by ist_aktiv
    const participations = await db.team_liga_participations
      .where('team_id')
      .equals(teamId)
      .toArray();
    
    // Filter for active participation
    return participations.find(p => p.ist_aktiv === true);
  }

  /**
   * v7.0: Lädt alle Participations für ein Team (Historie)
   * 
   * Sortiert nach created_at (neueste zuerst)
   * 
   * @param teamId Team UUID
   * @returns Array von TeamLigaParticipation (sortiert)
   */
  async getAllParticipations(teamId: UUID): Promise<TeamLigaParticipation[]> {
    return await db.team_liga_participations
      .where('team_id')
      .equals(teamId)
      .reverse()
      .sortBy('created_at');
  }

  /**
   * v7.0: Erstellt Team + Participation zusammen
   * 
   * @param input Team + Participation Daten
   * @returns Erstelltes Team
   */
  async createTeamWithParticipation(
    input: Omit<Team, 'team_id' | 'created_at' | 'updated_at'> & {
      saison: string;
      altersklasse: Altersklasse;
      altersklasse_id?: number;
      liga_id?: string;
      liga_name?: string;
      extern_team_id?: string;
      leistungsorientiert?: boolean;
    }
  ): Promise<Team> {
    const teamId = uuidv4();
    
    const team: Team = {
      team_id: teamId,
      extern_permanent_id: input.extern_permanent_id,
      verein_id: input.verein_id,
      name: input.name,
      geschlecht: input.geschlecht,
      trainer: input.trainer,
      team_typ: input.team_typ ?? 'eigen',
      user_id: input.user_id,
      created_at: new Date(),
    };

    const participation: Omit<TeamLigaParticipation, 'id'> = {
      team_id: teamId,
      extern_team_id: input.extern_team_id,
      saison: input.saison,
      altersklasse: input.altersklasse,
      altersklasse_id: input.altersklasse_id,
      liga_id: input.liga_id,
      liga_name: input.liga_name,
      leistungsorientiert: input.leistungsorientiert,
      ist_aktiv: true, // Neue Participation ist standardmäßig aktiv
      created_at: new Date(),
    };

    // Transaction: Team + Participation
    await db.transaction('rw', db.teams, db.team_liga_participations, async () => {
      await db.teams.add(team);
      await db.team_liga_participations.add(participation);
    });

    return team;
  }

  /**
   * v7.0: Aktualisiert eine Participation
   * 
   * @param participationId Participation ID
   * @param updates Zu aktualisierende Felder
   */
  async updateParticipation(
    participationId: number,
    updates: Partial<Omit<TeamLigaParticipation, 'id' | 'team_id' | 'created_at'>>
  ): Promise<void> {
    await db.team_liga_participations.update(participationId, updates);
  }

  /**
   * v7.0: Fügt neue Participation hinzu
   * 
   * @param participation Participation-Daten
   * @returns Erstellte Participation mit ID
   */
  async addParticipation(
    participation: Omit<TeamLigaParticipation, 'id' | 'created_at'>
  ): Promise<TeamLigaParticipation> {
    const data: Omit<TeamLigaParticipation, 'id'> = {
      ...participation,
      ist_aktiv: participation.ist_aktiv ?? false, // Default: false
      created_at: new Date(),
    };

    const id = await db.team_liga_participations.add(data);
    
    return {
      ...data,
      id: id as number,
    };
  }

  /**
   * v7.0: Setzt eine Participation als aktiv (alle anderen werden inaktiv)
   * 
   * @param teamId Team UUID
   * @param participationId Participation ID die aktiv werden soll
   */
  async setActiveParticipation(teamId: UUID, participationId: number): Promise<void> {
    // Verify participation belongs to team
    const participation = await db.team_liga_participations.get(participationId);
    if (!participation || participation.team_id !== teamId) {
      throw new Error('Participation does not belong to team');
    }

    // Transaction: Set all to inactive, then set one to active
    await db.transaction('rw', db.team_liga_participations, async () => {
      // Set all participations of this team to inactive
      const allParticipations = await db.team_liga_participations
        .where('team_id')
        .equals(teamId)
        .toArray();
      
      for (const p of allParticipations) {
        await db.team_liga_participations.update(p.id, { ist_aktiv: false });
      }

      // Set target participation to active
      await db.team_liga_participations.update(participationId, { ist_aktiv: true });
    });
  }
}

// Singleton Export
export const teamService = new TeamService();
