/**
 * SpielService - Domain Service für Spiel-Management (DBv7)
 * 
 * Domain-Driven Design:
 * - Zentrale Business-Logik für Spiele
 * - CRUD-Operationen mit Validierung
 * - BBB-Integration Support
 * 
 * ✅ DBv7: Integration mit team_liga_participations
 * - Spiele werden über aktive Liga-Participations gefiltert
 * - Unterstützt Multi-Saison/Multi-Liga Szenarien
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
   * Gibt Liga-IDs von aktiven Team-Participations zurück
   * 
   * ✅ DBv7: Verwendet team_liga_participations
   * ✅ v7.1 HOTFIX: Simple Index statt Compound
   * 
   * @param teamId - Team-ID
   * @returns Array von Liga-IDs (leer wenn keine aktiven Participations)
   */
  async getAktiveParticipationLigaIds(teamId: string): Promise<string[]> {
    // ✅ v7.1: Use simple team_id index, then filter by ist_aktiv
    const allParticipations = await db.team_liga_participations
      .where('team_id')
      .equals(teamId)
      .toArray();
    
    // Filter for active participations
    const participations = allParticipations.filter(p => p.ist_aktiv === true);

    return participations
      .map(p => p.liga_id)
      .filter((id): id is string => id !== undefined);
  }

  /**
   * Gibt alle Spiele eines Teams zurück (DBv7-kompatibel)
   * 
   * ✅ DBv7: Lädt Spiele über aktive team_liga_participations
   * 
   * @param teamId - Team-ID
   * @returns Spiele sortiert nach Datum
   */
  async getSpiele(teamId: string): Promise<Spiel[]> {
    // 1. Hole aktive Liga-IDs für Team
    const ligaIds = await this.getAktiveParticipationLigaIds(teamId);

    if (ligaIds.length === 0) {
      return [];
    }

    // 2. Lade Spiele aus allen aktiven Ligen
    const spieleByLiga = await Promise.all(
      ligaIds.map(ligaId => this.getSpielByLiga(ligaId))
    );

    // 3. Flatten & Filtere nach Team (heim oder gast)
    const allSpiele = spieleByLiga.flat();
    const teamSpiele = allSpiele.filter(
      s => s.heim_team_id === teamId || s.gast_team_id === teamId
    );

    // 4. Deduplizieren (falls Team in mehreren Ligen)
    const spieleMap = new Map<string, Spiel>();
    teamSpiele.forEach(spiel => {
      spieleMap.set(spiel.spiel_id, spiel);
    });

    // 5. Sortiere nach Datum
    const spiele = Array.from(spieleMap.values());
    spiele.sort((a, b) => new Date(a.datum).getTime() - new Date(b.datum).getTime());

    return spiele;
  }

  /**
   * Gibt alle Spiele einer Liga zurück
   * 
   * ✅ DBv7: Lädt alle Spiele einer Liga (für Benchmark-Analyse)
   * 
   * @param ligaId - Liga-ID
   * @returns Spiele sortiert nach Datum
   */
  async getSpielByLiga(ligaId: string): Promise<Spiel[]> {
    const spiele = await db.spiele
      .where('liga_id')
      .equals(ligaId)
      .toArray();

    // Sort by date
    spiele.sort((a, b) => new Date(a.datum).getTime() - new Date(b.datum).getTime());

    return spiele;
  }

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
   * Gibt alle Spiele eines Teams zurück (Backward Compatibility)
   * 
   * ✅ DBv7: Alias für getSpiele() mit zusätzlichen Filtern
   * 
   * @param teamId - Team-ID
   * @param filter - Optionale Filter (ist_heimspiel, status, spielplan_id)
   */
  async getSpieleByTeam(
    teamId: string,
    filter?: SpielFilter
  ): Promise<Spiel[]> {
    // Nutze neue getSpiele() Methode
    let spiele = await this.getSpiele(teamId);

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
   * ✅ v6.0: Verwendet getSpieleByTeam() und filtert
   */
  async countSpieleByStatus(
    teamId: string,
    status: SpielStatus
  ): Promise<number> {
    const spiele = await this.getSpieleByTeam(teamId, { status });
    return spiele.length;
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
   * ✅ v6.0: team_id nicht mehr required, stattdessen heim_team_id/gast_team_id
   * 
   * @throws Error bei Validierungsfehlern
   */
  private validateSpiel(
    data: Omit<Spiel, 'spiel_id' | 'created_at'>
  ): void {
    if (!data.heim_team_id && !data.gast_team_id) {
      throw new Error('Mindestens heim_team_id oder gast_team_id ist erforderlich');
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
