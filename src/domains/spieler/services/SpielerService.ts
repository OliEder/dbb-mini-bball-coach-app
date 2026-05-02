/**
 * SpielerService - Domain Service für Spieler-Management
 * 
 * Domain-Driven Design:
 * - Zentrale Business-Logik für Spieler
 * - CRUD-Operationen mit Validierung
 * - Type-safe mit strikten Interfaces
 * 
 * WCAG 2.0 AA:
 * - Fehlerbehandlung mit klaren Meldungen
 * - Konsistente Datenstrukturen für UI
 */

import { db } from '@/shared/db/database';
import type { Spieler } from '@/shared/types';

export interface SpielerFilter {
  aktiv?: boolean;
  spieler_typ?: Spieler['spieler_typ'];
}

class SpielerService {
  /**
   * Erstellt einen neuen Spieler
   * 
   * @throws Error bei Validierungsfehlern
   */
  async createSpieler(
    data: Omit<Spieler, 'spieler_id' | 'created_at'>
  ): Promise<Spieler> {
    // Validation
    this.validateSpieler(data);

    const spieler: Spieler = {
      ...data,
      spieler_id: crypto.randomUUID(),
      created_at: new Date(),
    };

    await db.spieler.add(spieler);
    return spieler;
  }

  /**
   * Sucht einen Spieler anhand der ID
   */
  async getSpielerById(spielerId: string): Promise<Spieler | null> {
    const spieler = await db.spieler.get(spielerId);
    return spieler || null;
  }

  /**
   * Gibt alle Spieler eines Teams zurück
   * 
   * @param teamId - Team-ID
   * @param filter - Optionale Filter (aktiv, spieler_typ)
   */
  async getSpielerByTeam(
    teamId: string,
    filter?: SpielerFilter
  ): Promise<Spieler[]> {
    let query = db.spieler.where({ team_id: teamId });

    let spieler = await query.toArray();

    // Apply filters
    if (filter?.aktiv !== undefined) {
      spieler = spieler.filter(s => s.aktiv === filter.aktiv);
    }

    if (filter?.spieler_typ) {
      spieler = spieler.filter(s => s.spieler_typ === filter.spieler_typ);
    }

    return spieler;
  }

  /**
   * Aktualisiert einen Spieler
   * 
   * @throws Error wenn Spieler nicht gefunden
   */
  async updateSpieler(
    spielerId: string,
    updates: Partial<Omit<Spieler, 'spieler_id' | 'created_at'>>
  ): Promise<void> {
    const existing = await this.getSpielerById(spielerId);
    if (!existing) {
      throw new Error(`Spieler mit ID ${spielerId} nicht gefunden`);
    }

    const updated = {
      ...updates,
      updated_at: new Date(),
    };

    await db.spieler.update(spielerId, updated);
  }

  /**
   * Löscht einen Spieler
   * 
   * @throws Error wenn Spieler nicht gefunden
   */
  async deleteSpieler(spielerId: string): Promise<void> {
    const existing = await this.getSpielerById(spielerId);
    if (!existing) {
      throw new Error(`Spieler mit ID ${spielerId} nicht gefunden`);
    }

    await db.spieler.delete(spielerId);
  }

  /**
   * Zählt aktive Spieler eines Teams
   * 
   * Nutzt team_id Index und filtert dann nach aktiv
   */
  async countAktiveSpieler(teamId: string): Promise<number> {
    const count = await db.spieler
      .where('team_id')
      .equals(teamId)
      .and(s => s.aktiv === true)
      .count();
    
    return count;
  }

  /**
   * Sucht einen Spieler anhand der Mitgliedsnummer
   */
  async getSpielerByMitgliedsnummer(
    mitgliedsnummer: string
  ): Promise<Spieler | null> {
    const spieler = await db.spieler
      .where({ mitgliedsnummer })
      .first();

    return spieler || null;
  }

  /**
   * Sucht Spieler anhand eines Suchbegriffs (Vor- oder Nachname)
   * 
   * WCAG 2.0 AA: Case-insensitive Suche für bessere UX
   */
  async searchSpieler(
    teamId: string,
    searchTerm: string
  ): Promise<Spieler[]> {
    const allSpieler = await this.getSpielerByTeam(teamId);
    const lowerSearchTerm = searchTerm.toLowerCase();

    return allSpieler.filter(
      s =>
        s.vorname.toLowerCase().includes(lowerSearchTerm) ||
        s.nachname.toLowerCase().includes(lowerSearchTerm)
    );
  }

  /**
   * Validiert Spieler-Daten
   * 
   * @throws Error bei Validierungsfehlern
   */
  private validateSpieler(
    data: Omit<Spieler, 'spieler_id' | 'created_at'>
  ): void {
    if (!data.vorname || data.vorname.trim().length === 0) {
      throw new Error('Vorname ist erforderlich');
    }

    if (!data.nachname || data.nachname.trim().length === 0) {
      throw new Error('Nachname ist erforderlich');
    }

    if (!data.spieler_typ) {
      throw new Error('Spieler-Typ ist erforderlich');
    }

    // Für eigenes Team: Team-ID ist Pflicht
    if (data.spieler_typ === 'eigenes_team' && !data.team_id) {
      throw new Error('Team-ID ist für eigene Spieler erforderlich');
    }

    // Für Gegner: Verein-ID ist empfohlen
    if (data.spieler_typ === 'gegner' && !data.verein_id && !data.team_id) {
      console.warn('Gegner ohne Verein- oder Team-Zuordnung');
    }
  }
}

// Singleton Export
export const spielerService = new SpielerService();
