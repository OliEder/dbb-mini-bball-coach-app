/**
 * Club Data Loader Service
 * 
 * Lädt Club-Daten aus den lokalen JSON-Chunks (src/shared/data/clubs-chunks/)
 * Kein Fetch nötig - direkte ES Module Imports
 */

import type { Verein, Team } from '@shared/types';

// Import metadata
import metadata from '@shared/data/clubs-chunks/clubs-metadata.json';

// Dynamischer Import aller Chunks
const CHUNK_COUNT = 18; // 0-17

// Neue Struktur basierend auf realer JSON-Datenstruktur
export interface ClubDataFromJSON {
  clubId: string;
  vereinsname: string;
  vereinsnummer?: string;
  vereinsnameKurz?: string;
  verbaende: number[];
  kontaktData?: any;
  teams?: Array<{
    teamPermanentId?: string;
    teamname: string;
    teamnameSmall?: string;
    teamAkjId?: number;
    teamAkj?: string;
    teamGenderId?: number;
    teamGender?: string;
    teamNumber?: number;
    seasons?: Array<{
      seasonId?: number;
      seasonName?: string;
      ligen?: Array<{
        teamCompetitionId?: string;
        ligaId?: string;
        liganame?: string;
        akName?: string;
        geschlechtId?: number;
        geschlecht?: string;
      }>;
    }>;
  }>;
}

export interface ClubEntry {
  verein: Verein;
  clubId: string;
  teams?: Team[];
}

class ClubDataLoader {
  private chunksCache: Map<number, any[]> = new Map();
  private allClubs: ClubEntry[] | null = null;

  /**
   * Lädt einen spezifischen Chunk
   */
  private async loadChunk(chunkIndex: number): Promise<any[]> {
    if (this.chunksCache.has(chunkIndex)) {
      return this.chunksCache.get(chunkIndex)!;
    }

    try {
      // Dynamischer Import des Chunks
      const chunk = await import(`@shared/data/clubs-chunks/clubs-chunk-${chunkIndex}.json`);
      const chunkData = chunk.default || chunk;
      
      // clubs ist ein Array in der JSON-Struktur
      const clubs = chunkData.clubs || [];
      this.chunksCache.set(chunkIndex, clubs);
      return clubs;
    } catch (error) {
      console.error(`Failed to load chunk ${chunkIndex}:`, error);
      return [];
    }
  }

  /**
   * Lädt ALLE Vereine aus allen Chunks
   * Cached das Ergebnis für Performance
   */
  async loadAllClubs(): Promise<ClubEntry[]> {
    if (this.allClubs) {
      return this.allClubs;
    }

    const allClubs: ClubEntry[] = [];

    // Lade alle Chunks parallel
    const chunkPromises = Array.from({ length: CHUNK_COUNT }, (_, i) => this.loadChunk(i));
    const chunks = await Promise.all(chunkPromises);

    // Verarbeite alle Clubs
    for (const chunkData of chunks) {
      // chunkData ist jetzt ein Array von Clubs
      if (!Array.isArray(chunkData)) {
        console.warn('Chunk data is not an array, skipping');
        continue;
      }

      for (const clubData of chunkData) {
        if (!clubData || !clubData.clubId) {
          console.warn('Invalid club data, skipping:', clubData);
          continue;
        }

        const verein: Verein = {
          verein_id: clubData.clubId, // clubId aus der Struktur
          name: clubData.vereinsname || 'Unbekannt',
          kurzname: clubData.vereinsnameKurz ?? clubData.vereinsname,
          verband_ids: clubData.verbaende || [],
          ist_eigener_verein: false,
          created_at: new Date()
        };

        allClubs.push({
          verein,
          clubId: clubData.clubId
        });
      }
    }

    // Alphabetisch sortieren (case-insensitive mit deutscher Locale)
    allClubs.sort((a, b) => 
      a.verein.name.localeCompare(b.verein.name, 'de', { sensitivity: 'base' })
    );

    this.allClubs = allClubs;
    return allClubs;
  }

  /**
   * Sucht Vereine nach Name oder Kurzname
   */
  async searchClubs(query: string): Promise<ClubEntry[]> {
    const allClubs = await this.loadAllClubs();
    
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      return allClubs;
    }

    const searchTerm = trimmedQuery.toLowerCase();
    return allClubs.filter(({ verein }) =>
      verein.name.toLowerCase().includes(searchTerm) ||
      verein.kurzname?.toLowerCase().includes(searchTerm)
    );
  }

  /**
   * Filtert Vereine nach Verband
   */
  async filterByVerband(verbandId: number | null): Promise<ClubEntry[]> {
    const allClubs = await this.loadAllClubs();
    
    if (verbandId === null) {
      return allClubs;
    }

    return allClubs.filter(({ verein }) =>
      verein.verband_ids?.includes(verbandId)
    );
  }

  /**
   * Kombiniert Filter und Suche
   */
  async searchAndFilter(query: string, verbandId: number | null): Promise<ClubEntry[]> {
    const allClubs = await this.loadAllClubs();
    
    let filtered = allClubs;

    // Verband-Filter
    if (verbandId !== null) {
      filtered = filtered.filter(({ verein }) =>
        verein.verband_ids?.includes(verbandId)
      );
    }

    // Suche
    const trimmedQuery = query.trim();
    if (trimmedQuery) {
      const searchTerm = trimmedQuery.toLowerCase();
      filtered = filtered.filter(({ verein }) =>
        verein.name.toLowerCase().includes(searchTerm) ||
        verein.kurzname?.toLowerCase().includes(searchTerm)
      );
    }

    return filtered;
  }

  /**
   * Lädt Teams für einen spezifischen Club
   */
  async loadTeamsForClub(clubId: string): Promise<Team[]> {
    // Finde den Chunk, der diesen Club enthält
    for (let i = 0; i < CHUNK_COUNT; i++) {
      const chunkData = await this.loadChunk(i);
      
      // Suche den Club im Array
      const clubData = chunkData.find(club => club.clubId === clubId);
      
      if (clubData && clubData.teams) {
        const teams: Team[] = clubData.teams.map((teamData: any) => ({
          team_id: teamData.teamPermanentId || `team_${Math.random()}`,
          verein_id: clubData.clubId,
          name: teamData.teamname || 'Unbekanntes Team',
          liga_id: teamData.seasons?.[0]?.ligen?.[0]?.ligaId || '',
          liga_name: teamData.seasons?.[0]?.ligen?.[0]?.liganame || '',
          altersklasse_id: teamData.teamAkjId || 0,
          geschlecht: teamData.teamGenderId === 1 ? 'male' : teamData.teamGenderId === 2 ? 'female' : 'mixed',
          saison: '2024/2025',
          team_typ: 'eigen',
          created_at: new Date()
        }));

        // Alphabetisch sortieren
        teams.sort((a, b) => a.name.localeCompare(b.name));
        return teams;
      }
    }

    return [];
  }

  /**
   * Gibt Metadaten zurück
   */
  getMetadata() {
    return metadata.metadata;
  }

  /**
   * Reset Cache (für Tests)
   */
  clearCache() {
    this.chunksCache.clear();
    this.allClubs = null;
  }
}

// Singleton Instance
export const clubDataLoader = new ClubDataLoader();
