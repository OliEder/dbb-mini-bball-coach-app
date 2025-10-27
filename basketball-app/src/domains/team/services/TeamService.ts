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
import type { Team, UUID, CreateTeamInput, Spiel } from '@/shared/types';
import { spielService } from '@/domains/spiel';

/**
 * Team-Statistiken für Übersicht
 */
export interface TeamStats {
  spielerCount: number;
  spieleCount: number;
  naechstesSpiel?: Spiel;
  tabellenplatz?: number;
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
      altersklasse_id: input.altersklasse_id,
      geschlecht: input.geschlecht,
      saison: input.saison,
      trainer: input.trainer,
      team_typ: input.team_typ ?? 'eigen',  // Default: 'eigen'
      liga_id: input.liga_id,
      liga_name: input.liga_name,
      leistungsorientiert: input.leistungsorientiert,
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
   * ✅ NEU: Holt Team-Statistiken für Übersicht
   * 
   * Liefert:
   * - Anzahl Spieler
   * - Anzahl Spiele
   * - Nächstes geplantes Spiel
   * - Tabellenplatz (wenn vorhanden)
   */
  async getTeamStats(teamId: string): Promise<TeamStats> {
    // Parallel alle Daten laden für bessere Performance
    const [spielerCount, spiele, team] = await Promise.all([
      db.spieler.where('team_id').equals(teamId).count(),
      spielService.getSpiele(teamId),  // ✅ v6.0: SpielService verwenden
      db.teams.get(teamId)
    ]);

    // Nächstes geplantes Spiel finden
    const now = new Date();
    const naechstesSpiel = spiele
      .filter(s => s.status === 'geplant' && s.datum > now)
      .sort((a, b) => a.datum.getTime() - b.datum.getTime())[0];

    // Tabellenplatz (optional, nur wenn Liga vorhanden)
    let tabellenplatz: number | undefined;
    
    if (team?.liga_id && team?.name) {
      const tabellenEintrag = await db.liga_tabellen
        .where('[ligaid+teamname]')
        .equals([team.liga_id, team.name])
        .first();
      
      tabellenplatz = tabellenEintrag?.platz;
    }

    return {
      spielerCount,
      spieleCount: spiele.length,  // ✅ v6.0: Länge des Arrays
      naechstesSpiel,
      tabellenplatz
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
   * ✅ v6.0: Verwendet SpielService
   */
  async countGames(team_id: UUID): Promise<number> {
    const spiele = await spielService.getSpiele(team_id);
    return spiele.length;
  }
}

// Singleton Export
export const teamService = new TeamService();
