/**
 * Team Service
 * 
 * Domain Service für Team-Management
 * CRUD-Operationen auf der Database
 */

import { v4 as uuidv4 } from 'uuid';
import { db } from '@/shared/db/database';
import type { Team, UUID, Altersklasse } from '@/shared/types';

export interface CreateTeamInput {
  verein_id: UUID;
  name: string;
  altersklasse: Altersklasse;
  saison: string;
  trainer: string;
  leistungsorientiert?: boolean;
  bbb_mannschafts_id?: string;
}

export class TeamService {
  /**
   * Erstellt ein neues Team
   */
  async createTeam(input: CreateTeamInput): Promise<Team> {
    const team: Team = {
      team_id: uuidv4(),
      verein_id: input.verein_id,
      name: input.name,
      altersklasse: input.altersklasse,
      saison: input.saison,
      trainer: input.trainer,
      leistungsorientiert: input.leistungsorientiert,
      bbb_mannschafts_id: input.bbb_mannschafts_id,
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
   * Alle Teams einer Saison
   */
  async getTeamsBySaison(saison: string): Promise<Team[]> {
    return await db.teams.where({ saison }).toArray();
  }

  /**
   * Alle Teams
   */
  async getAllTeams(): Promise<Team[]> {
    return await db.teams.toArray();
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
   * - Spiele
   * - Einsatzpläne
   */
  async deleteTeam(team_id: UUID): Promise<void> {
    // Dexie transaction unterstützt max 6 Tables
    // Daher in 2 Transaktionen aufteilen
    
    // Transaction 1: Spiele & Einsätze
    const spiele = await db.spiele.where({ team_id }).toArray();
    const spielIds = spiele.map(s => s.spiel_id);
    
    if (spielIds.length > 0) {
      await db.transaction('rw', db.einsaetze, db.spiele, async () => {
        for (const spiel_id of spielIds) {
          await db.einsaetze.where({ spiel_id }).delete();
          await db.spiele.delete(spiel_id);
        }
      });
    }
    
    // Transaction 2: Team, Spieler, Trikots
    await db.transaction('rw', db.teams, db.spieler, db.trikots, async () => {
      await db.teams.delete(team_id);
      await db.spieler.where({ team_id }).delete();
      await db.trikots.where({ team_id }).delete();
    });
  }

  /**
   * Prüft ob Team-Name bereits existiert (im selben Verein + Saison)
   */
  async isTeamNameTaken(verein_id: UUID, name: string, saison: string): Promise<boolean> {
    const existing = await db.teams
      .where({ verein_id, name, saison })
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
   */
  async countGames(team_id: UUID): Promise<number> {
    return await db.spiele.where({ team_id }).count();
  }
}

// Singleton Export
export const teamService = new TeamService();
