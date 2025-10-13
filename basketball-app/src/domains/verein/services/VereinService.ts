/**
 * Verein Service
 * 
 * Domain Service für Vereins-Management
 */

import { v4 as uuidv4 } from 'uuid';
import { db } from '@/shared/db/database';
import type { Verein, UUID } from '@/shared/types';

export interface CreateVereinInput {
  name: string;
  ort: string;
  kurzname?: string;
  ist_eigener_verein?: boolean;
  bbb_kontakt_id?: string;
  verband_id?: number;
}

export class VereinService {
  /**
   * Erstellt einen neuen Verein
   */
  async createVerein(input: CreateVereinInput): Promise<Verein> {
    const verein: Verein = {
      verein_id: uuidv4(),
      name: input.name,
      kurzname: input.kurzname,
      ort: input.ort,
      ist_eigener_verein: input.ist_eigener_verein ?? true,
      bbb_kontakt_id: input.bbb_kontakt_id,
      verband_id: input.verband_id,
      created_at: new Date(),
    };

    await db.vereine.add(verein);
    return verein;
  }

  /**
   * Findet Verein by ID
   */
  async getVereinById(verein_id: UUID): Promise<Verein | undefined> {
    return await db.vereine.get(verein_id);
  }

  /**
   * Alle Vereine
   */
  async getAllVereine(): Promise<Verein[]> {
    return await db.vereine.toArray();
  }

  /**
   * Nur eigene Vereine
   */
  async getEigeneVereine(): Promise<Verein[]> {
    return await db.vereine.filter(v => v.ist_eigener_verein === true).toArray();
  }

  /**
   * Gegner-Vereine
   */
  async getGegnerVereine(): Promise<Verein[]> {
    return await db.vereine.filter(v => v.ist_eigener_verein === false).toArray();
  }

  /**
   * Suche Verein by Name
   */
  async searchVereine(searchTerm: string): Promise<Verein[]> {
    const allVereine = await db.vereine.toArray();
    const lowerSearch = searchTerm.toLowerCase();
    
    return allVereine.filter(v => 
      v.name.toLowerCase().includes(lowerSearch) ||
      v.kurzname?.toLowerCase().includes(lowerSearch) ||
      v.ort?.toLowerCase().includes(lowerSearch)
    );
  }

  /**
   * Aktualisiert einen Verein
   */
  async updateVerein(verein_id: UUID, updates: Partial<Omit<Verein, 'verein_id' | 'created_at'>>): Promise<void> {
    await db.vereine.update(verein_id, updates);
  }

  /**
   * Löscht einen Verein
   * 
   * ⚠️ WARNUNG: Nur möglich wenn keine Teams mehr zugeordnet sind
   */
  async deleteVerein(verein_id: UUID): Promise<void> {
    const teams = await db.teams.where({ verein_id }).count();
    
    if (teams > 0) {
      throw new Error('Verein kann nicht gelöscht werden, da noch Teams zugeordnet sind');
    }
    
    await db.vereine.delete(verein_id);
  }

  /**
   * Prüft ob Vereins-Name bereits existiert
   */
  async isVereinNameTaken(name: string, ort: string): Promise<boolean> {
    const existing = await db.vereine
      .where({ name, ort })
      .first();
    
    return !!existing;
  }

  /**
   * Zählt Teams eines Vereins
   */
  async countTeams(verein_id: UUID): Promise<number> {
    return await db.teams.where({ verein_id }).count();
  }
}

// Singleton Export
export const vereinService = new VereinService();
