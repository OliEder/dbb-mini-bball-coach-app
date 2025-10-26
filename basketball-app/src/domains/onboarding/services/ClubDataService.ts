/**
 * Club Data Service
 * 
 * Lädt und cached lokale Club-Metadaten (clubs-metadata.json)
 * Unterstützt Suche und Filterung ohne API-Calls
 */

export interface ClubMetadata {
  id: string; // "club-{verband_id}-{verein_id}"
  name: string;
  verbandIds: number[];
  teamCount: number;
  chunkFile: string; // "club-data-{verband_id}-{verein_id}.json"
}

export interface ClubsMetadata {
  version: string;
  generatedAt: string;
  stats: {
    totalClubs: number;
    totalTeams: number;
    verbandCount: number;
  };
  clubs: ClubMetadata[];
}

class ClubDataService {
  private metadata: ClubsMetadata | null = null;
  private loading: Promise<void> | null = null;

  /**
   * Lädt clubs-metadata.json einmalig
   */
  async loadMetadata(): Promise<void> {
    if (this.metadata) return;
    
    if (this.loading) {
      await this.loading;
      return;
    }

    this.loading = (async () => {
      try {
        const response = await fetch('/data/clubs-metadata.json');
        if (!response.ok) {
          throw new Error(`Failed to load clubs metadata: ${response.status}`);
        }
        this.metadata = await response.json();
      } catch (error) {
        console.error('[ClubDataService] Failed to load metadata:', error);
        throw error;
      } finally {
        this.loading = null;
      }
    })();

    await this.loading;
  }

  /**
   * Gibt alle Clubs zurück
   */
  async getAllClubs(): Promise<ClubMetadata[]> {
    await this.loadMetadata();
    return this.metadata?.clubs || [];
  }

  /**
   * Sucht Clubs nach Name (case-insensitive)
   */
  async searchClubs(query: string, verbandIds?: number[]): Promise<ClubMetadata[]> {
    await this.loadMetadata();
    
    const normalizedQuery = query.toLowerCase().trim();
    if (!normalizedQuery) {
      return this.getClubsByVerbaende(verbandIds);
    }

    let clubs = this.metadata?.clubs || [];
    
    // Filter nach Verbänden
    if (verbandIds && verbandIds.length > 0) {
      clubs = clubs.filter(club => 
        club.verbandIds.some(vId => verbandIds.includes(vId))
      );
    }

    // Suche im Namen
    return clubs.filter(club => 
      club.name.toLowerCase().includes(normalizedQuery)
    );
  }

  /**
   * Filtert Clubs nach Verbänden
   */
  async getClubsByVerbaende(verbandIds?: number[]): Promise<ClubMetadata[]> {
    await this.loadMetadata();
    
    if (!verbandIds || verbandIds.length === 0) {
      return this.metadata?.clubs || [];
    }

    return (this.metadata?.clubs || []).filter(club =>
      club.verbandIds.some(vId => verbandIds.includes(vId))
    );
  }

  /**
   * Lädt vollständige Club-Daten aus Chunk
   */
  async loadClubDetails(clubId: string): Promise<any> {
    await this.loadMetadata();
    
    const club = this.metadata?.clubs.find(c => c.id === clubId);
    if (!club) {
      throw new Error(`Club not found: ${clubId}`);
    }

    try {
      const response = await fetch(`/data/${club.chunkFile}`);
      if (!response.ok) {
        throw new Error(`Failed to load club details: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`[ClubDataService] Failed to load club details for ${clubId}:`, error);
      throw error;
    }
  }

  /**
   * Gibt Stats zurück
   */
  getStats() {
    return this.metadata?.stats || {
      totalClubs: 0,
      totalTeams: 0,
      verbandCount: 0
    };
  }

  /**
   * Reset (für Tests)
   */
  reset() {
    this.metadata = null;
    this.loading = null;
  }
}

export const clubDataService = new ClubDataService();
