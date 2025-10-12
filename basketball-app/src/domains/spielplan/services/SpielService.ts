/**
 * SpielService - Domain Service für Spiel-Management
 * 
 * Domain-Driven Design:
 * - Zentrale Business-Logik für Spiele
 * - CRUD-Operationen mit Validierung
 * - BBB-Integration Support
 * 
 * WCAG 2.0 AA:
 * - Fehlerbehandlung mit klaren Meldungen
 * - Konsistente Datenstrukturen für UI
 */

import { db } from '@/shared/db/database';
import type { Spiel, SpielStatus } from '@/shared/types';

export interface SpielFilter {
  ist_heimspiel?: boolean;
  status?: SpielStatus;
  spielplan_id?: string;
}

class SpielService {
  /**
   * Erstellt ein neues Spiel
   * 
   * @throws Error bei Validierungsfehlern
   */
  async createSpiel(
    data: Omit<Spiel, 'spiel_id' | 'created_at'>
  ): Promise<Spiel> {
    // Validation
    this.validateSpiel(data);

    const spiel: Spiel = {
      ...data,
      spiel_id: crypto.randomUUID(),
      created_at: new Date(),
    };

    await db.spiele.add(spiel);
    return spiel;
  }

  /**
   * Sucht ein Spiel anhand der ID
   */
  async getSpielById(spielId: string): Promise<Spiel | null> {
    const spiel = await db.spiele.get(spielId);
    return spiel || null;
  }

  /**
   * Gibt alle Spiele eines Teams zurück
   * 
   * @param teamId - Team-ID
   * @param filter - Optionale Filter (ist_heimspiel, status, spielplan_id)
   */
  async getSpieleByTeam(
    teamId: string,
    filter?: SpielFilter
  ): Promise<Spiel[]> {
    let query = db.spiele.where({ team_id: teamId });

    let spiele = await query.toArray();

    // Apply filters
    if (filter?.ist_heimspiel !== undefined) {
      spiele = spiele.filter(s => s.ist_heimspiel === filter.ist_heimspiel);
    }

    if (filter?.status) {
      spiele = spiele.filter(s => s.status === filter.status);
    }

    if (filter?.spielplan_id) {
      spiele = spiele.filter(s => s.spielplan_id === filter.spielplan_id);
    }

    // Sort by date
    spiele.sort((a, b) => new Date(a.datum).getTime() - new Date(b.datum).getTime());

    return spiele;
  }

  /**
   * Gibt das nächste anstehende Spiel zurück
   */
  async getNextSpiel(teamId: string): Promise<Spiel | null> {
    const now = new Date();
    
    const spiele = await this.getSpieleByTeam(teamId, {
      status: 'geplant',
    });

    // Filter for future games and get the nearest one
    const futureSpiele = spiele.filter(s => new Date(s.datum) > now);
    
    if (futureSpiele.length === 0) {
      return null;
    }

    return futureSpiele[0]; // Already sorted by date
  }

  /**
   * Aktualisiert ein Spiel
   * 
   * @throws Error wenn Spiel nicht gefunden
   */
  async updateSpiel(
    spielId: string,
    updates: Partial<Omit<Spiel, 'spiel_id' | 'created_at'>>
  ): Promise<void> {
    const existing = await this.getSpielById(spielId);
    if (!existing) {
      throw new Error(`Spiel mit ID ${spielId} nicht gefunden`);
    }

    await db.spiele.update(spielId, updates);
  }

  /**
   * Löscht ein Spiel
   * 
   * @throws Error wenn Spiel nicht gefunden
   */
  async deleteSpiel(spielId: string): Promise<void> {
    const existing = await this.getSpielById(spielId);
    if (!existing) {
      throw new Error(`Spiel mit ID ${spielId} nicht gefunden`);
    }

    await db.spiele.delete(spielId);
  }

  /**
   * Sucht ein Spiel anhand der BBB-Spielnummer
   * 
   * Wichtig für BBB-Sync: Spielnummer ist eindeutig pro Spielplan
   */
  async getSpielBySpielNummer(
    spielplanId: string,
    spielnr: number
  ): Promise<Spiel | null> {
    const spiel = await db.spiele
      .where({ spielplan_id: spielplanId, spielnr })
      .first();

    return spiel || null;
  }

  /**
   * Zählt Spiele nach Status
   */
  async countSpieleByStatus(
    teamId: string,
    status: SpielStatus
  ): Promise<number> {
    return db.spiele
      .where({ team_id: teamId, status })
      .count();
  }

  /**
   * Gibt Spielstatistiken für ein Team zurück
   */
  async getTeamStatistik(teamId: string): Promise<{
    total: number;
    geplant: number;
    abgeschlossen: number;
    heimspiele: number;
    auswaertsspiele: number;
    siege: number;
    niederlagen: number;
  }> {
    const allSpiele = await this.getSpieleByTeam(teamId);
    
    const stats = {
      total: allSpiele.length,
      geplant: allSpiele.filter(s => s.status === 'geplant').length,
      abgeschlossen: allSpiele.filter(s => s.status === 'abgeschlossen').length,
      heimspiele: allSpiele.filter(s => s.ist_heimspiel).length,
      auswaertsspiele: allSpiele.filter(s => !s.ist_heimspiel).length,
      siege: 0,
      niederlagen: 0,
    };

    // Calculate wins/losses from completed games
    const completed = allSpiele.filter(s => s.status === 'abgeschlossen');
    completed.forEach(spiel => {
      if (spiel.ergebnis_heim !== undefined && spiel.ergebnis_gast !== undefined) {
        const isWin = spiel.ist_heimspiel
          ? spiel.ergebnis_heim > spiel.ergebnis_gast
          : spiel.ergebnis_gast > spiel.ergebnis_heim;
        
        if (isWin) {
          stats.siege++;
        } else {
          stats.niederlagen++;
        }
      }
    });

    return stats;
  }

  /**
   * Validiert Spiel-Daten
   * 
   * @throws Error bei Validierungsfehlern
   */
  private validateSpiel(
    data: Omit<Spiel, 'spiel_id' | 'created_at'>
  ): void {
    if (!data.team_id) {
      throw new Error('Team-ID ist erforderlich');
    }

    if (!data.datum) {
      throw new Error('Datum ist erforderlich');
    }

    if (!data.heim || data.heim.trim().length === 0) {
      throw new Error('Heimteam ist erforderlich');
    }

    if (!data.gast || data.gast.trim().length === 0) {
      throw new Error('Gastteam ist erforderlich');
    }

    if (!data.altersklasse) {
      throw new Error('Altersklasse ist erforderlich');
    }

    if (!data.status) {
      throw new Error('Status ist erforderlich');
    }
  }
}

// Singleton Export
export const spielService = new SpielService();
