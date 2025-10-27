/**
 * SpielService - Domain Service für Spiel-Entität
 * 
 * WICHTIG: Spiel hat KEINE team_id mehr!
 * - Spiele gehören konzeptionell keinem Team
 * - Service kapselt Filterlogik basierend auf heim_team_id/gast_team_id
 * - Unterstützt Edge Case: Internes Spiel (beide Teams sind eigene Teams)
 */

import { db } from '@/shared/db/database';
import type { Spiel } from '@/shared/types';

export class SpielService {
  /**
   * Gibt alle Spiele zurück, an denen das Team beteiligt ist
   * (Heim ODER Gast)
   */
  async getSpiele(teamId: string): Promise<Spiel[]> {
    // Hole alle Spiele
    const alleSpiele = await db.spiele.toArray();
    
    // Filtere nach Team (Heim ODER Gast)
    const teamSpiele = alleSpiele.filter(spiel => 
      spiel.heim_team_id === teamId || spiel.gast_team_id === teamId
    );
    
    // Sortiere nach Datum (älteste zuerst)
    return teamSpiele.sort((a, b) => a.datum.getTime() - b.datum.getTime());
  }
  
  /**
   * Gibt nur Heimspiele des Teams zurück
   */
  async getHeimSpiele(teamId: string): Promise<Spiel[]> {
    const alleSpiele = await this.getSpiele(teamId);
    return alleSpiele.filter(spiel => spiel.heim_team_id === teamId);
  }
  
  /**
   * Gibt nur Auswärtsspiele des Teams zurück
   */
  async getAuswaertsSpiele(teamId: string): Promise<Spiel[]> {
    const alleSpiele = await this.getSpiele(teamId);
    return alleSpiele.filter(spiel => spiel.gast_team_id === teamId);
  }
  
  /**
   * Gibt kommende Spiele (geplant) zurück
   */
  async getUpcomingSpiele(teamId: string, limit?: number): Promise<Spiel[]> {
    const alleSpiele = await this.getSpiele(teamId);
    const geplant = alleSpiele.filter(spiel => spiel.status === 'geplant');
    
    if (limit) {
      return geplant.slice(0, limit);
    }
    
    return geplant;
  }
  
  /**
   * Gibt abgeschlossene Spiele zurück
   */
  async getCompletedSpiele(teamId: string): Promise<Spiel[]> {
    const alleSpiele = await this.getSpiele(teamId);
    return alleSpiele.filter(spiel => spiel.status === 'abgeschlossen');
  }
  
  /**
   * Prüft ob Spiel ein internes Spiel ist
   * (beide Teams sind eigene Teams)
   */
  async isInternesSpiel(spiel: Spiel): Promise<boolean> {
    if (!spiel.heim_team_id || !spiel.gast_team_id) {
      return false;
    }
    
    // Hole beide Teams parallel
    const [heimTeam, gastTeam] = await Promise.all([
      db.teams.get(spiel.heim_team_id),
      db.teams.get(spiel.gast_team_id)
    ]);
    
    // Beide Teams müssen eigene Teams sein
    return heimTeam?.team_typ === 'eigen' && gastTeam?.team_typ === 'eigen';
  }
}

export const spielService = new SpielService();
