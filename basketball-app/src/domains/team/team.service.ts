/**
 * Team Service
 * 
 * Domain Service für Team-Verwaltung
 * CRUD-Operationen mit Dexie Database
 */

import { db } from '@shared/db/database';
import type { Team, UUID, Altersklasse } from '@shared/types';
import { v4 as uuidv4 } from 'uuid';

export interface CreateTeamDTO {
  verein_id: UUID;
  name: string;
  altersklasse: Altersklasse;
  saison: string;
  trainer: string;
  leistungsorientiert?: boolean;
  bbb_mannschafts_id?: string;
}

export interface UpdateTeamDTO {
  name?: string;
  altersklasse?: Altersklasse;
  saison?: string;
  trainer?: string;
  leistungsorientiert?: boolean;
  bbb_mannschafts_id?: string;
}

export class TeamService {
  /**
   * Erstellt ein neues Team
   */
  async createTeam(dto: CreateTeamDTO): Promise<Team> {
    const team: Team = {
      team_id: uuidv4(),
      verein_id: dto.verein_id,
      name: dto.name,
      altersklasse: dto.altersklasse,
      saison: dto.saison,
      trainer: dto.trainer,
      leistungsorientiert: dto.leistungsorientiert,
      bbb_mannschafts_id: dto.bbb_mannschafts_id,
      created_at: new Date()
    };

    await db.teams.add(team);
    return team;
  }

  /**
   * Holt alle Teams
   */
  async getAllTeams(): Promise<Team[]> {
    return await db.teams.toArray();
  }

  /**
   * Holt ein Team by ID
   */
  async getTeamById(team_id: UUID): Promise<Team | undefined> {
    return await db.teams.get(team_id);
  }

  /**
   * Holt alle Teams eines Vereins
   */
  async getTeamsByVerein(verein_id: UUID): Promise<Team[]> {
    return await db.teams.where('verein_id').equals(verein_id).toArray();
  }

  /**
   * Holt alle Teams einer Saison
   */
  async getTeamsBySaison(saison: string): Promise<Team[]> {
    return await db.teams.where('saison').equals(saison).toArray();
  }

  /**
   * Holt alle Teams einer Altersklasse
   */
  async getTeamsByAltersklasse(altersklasse: Altersklasse): Promise<Team[]> {
    return await db.teams.where('altersklasse').equals(altersklasse).toArray();
  }

  /**
   * Aktualisiert ein Team
   */
  async updateTeam(team_id: UUID, dto: UpdateTeamDTO): Promise<Team> {
    const existingTeam = await this.getTeamById(team_id);
    if (!existingTeam) {
      throw new Error(`Team mit ID ${team_id} nicht gefunden`);
    }

    const updatedTeam: Team = {
      ...existingTeam,
      ...dto
    };

    await db.teams.put(updatedTeam);
    return updatedTeam;
  }

  /**
   * Löscht ein Team
   */
  async deleteTeam(team_id: UUID): Promise<void> {
    await db.teams.delete(team_id);
  }

  /**
   * Prüft ob ein Team existiert
   */
  async exists(team_id: UUID): Promise<boolean> {
    const team = await this.getTeamById(team_id);
    return team !== undefined;
  }

  /**
   * Zählt alle Teams
   */
  async count(): Promise<number> {
    return await db.teams.count();
  }

  /**
   * Validiert Team-Name (eindeutig pro Verein + Saison)
   */
  async validateTeamName(verein_id: UUID, saison: string, name: string, excludeTeamId?: UUID): Promise<boolean> {
    const existingTeams = await db.teams
      .where('[verein_id+saison]')
      .equals([verein_id, saison])
      .toArray();

    return !existingTeams.some(
      team => team.name === name && team.team_id !== excludeTeamId
    );
  }
}

// Singleton Instance
export const teamService = new TeamService();
