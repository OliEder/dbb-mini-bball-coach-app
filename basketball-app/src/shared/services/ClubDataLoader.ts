/**
 * Club Data Loader Service
 * 
 * Lädt Club-Daten aus den lokalen JSON-Chunks (src/shared/data/clubs-chunks/)
 * Kein Fetch nötig - direkte ES Module Imports
 */

import type { Verein, Altersklasse } from '@shared/types';

/**
 * Transfer-Objekt für Teams im Onboarding-Flow.
 *
 * Enthält neben den Team-Basis-Feldern auch die Participation-Daten
 * (altersklasse, saison, liga_id, …) die beim Abschluss des Onboardings
 * für die Erstellung von TeamLigaParticipation benötigt werden.
 *
 * Dieses Objekt wird NICHT direkt in die DB geschrieben.
 */
export interface TeamWithParticipationData {
  /** Temporäre ID (= teamPermanentId aus BBB), nur für Frontend-Tracking */
  team_id: string;
  /** Permanente BBB-Team-ID (teamPermanentId) */
  extern_permanent_id?: string;
  verein_id: string;
  name: string;
  kurzname?: string;
  team_nummer?: number;
  geschlecht?: string;
  trainer?: string;
  team_typ: 'eigen' | 'gegner';
  created_at: Date;
  // Participation-Daten
  altersklasse: Altersklasse;
  altersklasse_id?: number;
  saison: string;
  liga_id?: string;
  liga_name?: string;
  /** Saison-spezifische Team-ID (teamCompetitionId aus BBB) */
  extern_team_id?: string;
}

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
  teams?: TeamWithParticipationData[];
}

class ClubDataLoader {
  /**
   * Extrahiert Altersklasse aus teamAkj String
   * Beispiele: "U10", "U12", "U21", "U23", "Herren", "Damen"
   * Fallback: "U12" für ungültige Werte
   */
  private extractAltersklasse(teamAkj: string | undefined): Altersklasse {
    if (!teamAkj) return 'U12';

    // Prüfe auf UXX Pattern (U7 bis U23)
    const match = teamAkj.match(/U(\d{1,2})/);
    if (match) {
      const altersklasse = `U${match[1]}`;
      const validAltersklassen = [
        'U7', 'U8', 'U9',
        'U10', 'U11', 'U12', 'U13',
        'U14', 'U15', 'U16', 'U17',
        'U18', 'U19', 'U20', 'U21', 'U23'
      ];
      if (validAltersklassen.includes(altersklasse)) {
        return altersklasse as any;
      }
    }

    // Prüfe auf Senioren (Herren/Damen/Senioren)
    const seniorenPattern = /(Herren|Damen|Senioren)/i;
    if (seniorenPattern.test(teamAkj)) {
      return 'Senioren';
    }

    // Fallback
    console.warn(`Could not extract Altersklasse from teamAkj: "${teamAkj}", using U12 as fallback`);
    return 'U12';
  }

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
  async loadTeamsForClub(clubId: string): Promise<TeamWithParticipationData[]> {
    // Finde den Chunk, der diesen Club enthält
    for (let i = 0; i < CHUNK_COUNT; i++) {
      const chunkData = await this.loadChunk(i);

      // Suche den Club im Array
      const clubData = chunkData.find((club: any) => club.clubId === clubId);

      if (clubData && clubData.teams) {
        const teams: TeamWithParticipationData[] = clubData.teams.map((teamData: any) => {
          const saison = teamData.seasons?.[0]?.seasonName || '2024/2025';
          const permanentId = teamData.teamPermanentId || `team_${Math.random()}`;

          return {
            team_id: permanentId,
            extern_permanent_id: permanentId,
            verein_id: clubData.clubId,
            name: teamData.teamname || 'Unbekanntes Team',
            kurzname: teamData.teamnameSmall || undefined,
            team_nummer: teamData.teamNumber || undefined,
            geschlecht: teamData.teamGenderId === 1 ? 'male' : teamData.teamGenderId === 2 ? 'female' : 'mixed',
            team_typ: 'eigen' as const,
            created_at: new Date(),
            // Participation-Daten
            altersklasse: this.extractAltersklasse(teamData.teamAkj),
            altersklasse_id: teamData.teamAkjId || undefined,
            saison,
            liga_id: teamData.seasons?.[0]?.ligen?.[0]?.ligaId || undefined,
            liga_name: teamData.seasons?.[0]?.ligen?.[0]?.liganame || undefined,
            extern_team_id: teamData.seasons?.[0]?.ligen?.[0]?.teamCompetitionId || undefined,
          };
        });

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
