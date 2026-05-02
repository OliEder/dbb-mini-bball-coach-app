/**
 * Verein Service
 * 
 * Domain Service für Vereins-Verwaltung
 * CRUD-Operationen mit Dexie Database
 */

import { db } from '@shared/db/database';
import type { Verein, UUID } from '@shared/types';
import { v4 as uuidv4 } from 'uuid';

export interface CreateVereinDTO {
  name: string;
  kurzname?: string;
  ort?: string;
  ist_eigener_verein: boolean;
  bbb_kontakt_id?: string;
  verband_id?: number;
}

export interface UpdateVereinDTO {
  name?: string;
  kurzname?: string;
  ort?: string;
  ist_eigener_verein?: boolean;
  bbb_kontakt_id?: string;
  verband_id?: number;
  sync_am?: Date;
}

export class VereinService {
  /**
   * Erstellt einen neuen Verein
   */
  async createVerein(dto: CreateVereinDTO): Promise<Verein> {
    const verein: Verein = {
      verein_id: uuidv4(),
      name: dto.name,
      kurzname: dto.kurzname,
      ort: dto.ort,
      ist_eigener_verein: dto.ist_eigener_verein,
      bbb_kontakt_id: dto.bbb_kontakt_id,
      verband_id: dto.verband_id,
      created_at: new Date()
    };

    await db.vereine.add(verein);
    return verein;
  }

  /**
   * Holt alle Vereine
   */
  async getAllVereine(): Promise<Verein[]> {
    return await db.vereine.toArray();
  }

  /**
   * Holt einen Verein by ID
   */
  async getVereinById(verein_id: UUID): Promise<Verein | undefined> {
    return await db.vereine.get(verein_id);
  }

  /**
   * Holt den eigenen Verein
   */
  async getEigenerVerein(): Promise<Verein | undefined> {
    return await db.vereine.where('ist_eigener_verein').equals(1).first();
  }

  /**
   * Holt alle Gegner-Vereine
   */
  async getGegnerVereine(): Promise<Verein[]> {
    return await db.vereine.where('ist_eigener_verein').equals(0).toArray();
  }

  /**
   * Sucht Vereine nach Name
   */
  async searchByName(query: string): Promise<Verein[]> {
    const allVereine = await this.getAllVereine();
    const lowerQuery = query.toLowerCase();
    
    return allVereine.filter(verein => 
      verein.name.toLowerCase().includes(lowerQuery) ||
      verein.kurzname?.toLowerCase().includes(lowerQuery) ||
      verein.ort?.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Aktualisiert einen Verein
   */
  async updateVerein(verein_id: UUID, dto: UpdateVereinDTO): Promise<Verein> {
    const existingVerein = await this.getVereinById(verein_id);
    if (!existingVerein) {
      throw new Error(`Verein mit ID ${verein_id} nicht gefunden`);
    }

    const updatedVerein: Verein = {
      ...existingVerein,
      ...dto
    };

    await db.vereine.put(updatedVerein);
    return updatedVerein;
  }

  /**
   * Löscht einen Verein
   */
  async deleteVerein(verein_id: UUID): Promise<void> {
    // Prüfe ob Teams existieren
    const teams = await db.teams.where('verein_id').equals(verein_id).count();
    if (teams > 0) {
      throw new Error('Verein kann nicht gelöscht werden, da noch Teams zugeordnet sind');
    }

    await db.vereine.delete(verein_id);
  }

  /**
   * Prüft ob ein Verein existiert
   */
  async exists(verein_id: UUID): Promise<boolean> {
    const verein = await this.getVereinById(verein_id);
    return verein !== undefined;
  }

  /**
   * Zählt alle Vereine
   */
  async count(): Promise<number> {
    return await db.vereine.count();
  }

  /**
   * Validiert Vereins-Name (eindeutig)
   */
  async validateVereinName(name: string, excludeVereinId?: UUID): Promise<boolean> {
    const existingVereine = await db.vereine.where('name').equals(name).toArray();
    
    return !existingVereine.some(
      verein => verein.verein_id !== excludeVereinId
    );
  }
}

// Singleton Instance
export const vereinService = new VereinService();
