/**
 * Club Data Service
 * 
 * Lädt und verwaltet lokale Club-Daten aus den generierten Chunks
 * Eliminiert API-Calls für Verein-/Team-Suche im Onboarding
 */

import clubsMetadata from '@shared/data/clubs-chunks/clubs-metadata.json';

export interface ClubMetadata {
  id: string;
  name: string;
  verbandIds: number[];
  teamCount: number;
}

export interface ClubIndex {
  [clubId: string]: {
    chunkIndex: number;
    position: number;
    name: string;
    verbaende: number[];
  };
}

export interface ChunkMetadata {
  chunkIndex: number;
  file: string;
  clubsCount: number;
  clubIds: string[];
  verbaende: number[];
  range: { start: number; end: number };
}

export interface ClubsMetadataFile {
  metadata: {
    totalClubs: number;
    chunksCount: number;
    chunkSize: number;
    generatedAt: string;
    crawledAt: string;
    verbaende: number[];
  };
  index: ClubIndex;
  chunks: ChunkMetadata[];
  clubs: ClubMetadata[];
}

export interface Club {
  clubId: string;
  vereinsname: string;
  vereinsnummer: string;
  verbaende: number[];
  kontaktData: any | null;
  teams: Team[];
}

export interface Team {
  teamPermanentId: string;
  teamname: string;
  teamnameSmall: string | null;
  teamAkjId: number;
  teamAkj: string;
  teamGenderId: number;
  teamGender: string;
  teamNumber: number;
  seasons: Season[];
}

export interface Season {
  seasonId: number;
  seasonName: string;
  ligen: Liga[];
}

export interface Liga {
  teamCompetitionId: string;
  ligaId: string;
  liganame: string;
  akName: string;
}

/**
 * ClubDataService - Singleton für Club-Daten-Zugriff
 */
class ClubDataService {
  private metadata: ClubsMetadataFile;
  private chunkCache: Map<number, Club[]> = new Map();

  constructor() {
    this.metadata = clubsMetadata as ClubsMetadataFile;
  }

  /**
   * Suche Clubs nach Name (für Autocomplete/Search)
   */
  searchClubs(searchTerm: string, verbandIds?: number[]): ClubMetadata[] {
    const term = searchTerm.toLowerCase().trim();
    
    if (!term) {
      return verbandIds 
        ? this.metadata.clubs.filter(c => 
            c.verbandIds.some(v => verbandIds.includes(v))
          )
        : this.metadata.clubs;
    }

    return this.metadata.clubs.filter(club => {
      const matchesName = club.name.toLowerCase().includes(term);
      const matchesVerband = verbandIds 
        ? club.verbandIds.some(v => verbandIds.includes(v))
        : true;
      
      return matchesName && matchesVerband;
    });
  }

  /**
   * Hole Club-Details mit Teams (lädt Chunk bei Bedarf)
   */
  async getClubDetails(clubId: string): Promise<Club | null> {
    const indexEntry = this.metadata.index[clubId];
    
    if (!indexEntry) {
      console.warn(`Club ${clubId} not found in index`);
      return null;
    }

    // Prüfe Cache
    const cachedChunk = this.chunkCache.get(indexEntry.chunkIndex);
    if (cachedChunk) {
      return cachedChunk[indexEntry.position] || null;
    }

    // Lade Chunk
    try {
      const chunk = await this.loadChunk(indexEntry.chunkIndex);
      return chunk[indexEntry.position] || null;
    } catch (error) {
      console.error(`Failed to load chunk ${indexEntry.chunkIndex}:`, error);
      return null;
    }
  }

  /**
   * Lade einen Chunk (mit Caching)
   */
  private async loadChunk(chunkIndex: number): Promise<Club[]> {
    // Prüfe Cache
    if (this.chunkCache.has(chunkIndex)) {
      return this.chunkCache.get(chunkIndex)!;
    }

    // Lazy Import des Chunks
    const chunkModule = await import(
      `@shared/data/clubs-chunks/clubs-chunk-${chunkIndex}.json`
    );

    const clubs = chunkModule.default.clubs || chunkModule.clubs;
    
    // Cache für zukünftige Zugriffe
    this.chunkCache.set(chunkIndex, clubs);
    
    return clubs;
  }

  /**
   * Hole Chunk-Metadaten
   */
  getChunkMetadata(chunkIndex: number): ChunkMetadata | undefined {
    return this.metadata.chunks[chunkIndex];
  }

  /**
   * Filtere Clubs nach Verbänden
   */
  getClubsByVerbaende(verbandIds: number[]): ClubMetadata[] {
    return this.metadata.clubs.filter(club =>
      club.verbandIds.some(v => verbandIds.includes(v))
    );
  }

  /**
   * Statistiken
   */
  getStats() {
    return {
      totalClubs: this.metadata.metadata.totalClubs,
      totalChunks: this.metadata.metadata.chunksCount,
      verbaende: this.metadata.metadata.verbaende,
      generatedAt: this.metadata.metadata.generatedAt,
      cacheSize: this.chunkCache.size
    };
  }

  /**
   * Cache leeren (für Memory Management)
   */
  clearCache() {
    this.chunkCache.clear();
  }
}

// Singleton Export
export const clubDataService = new ClubDataService();
