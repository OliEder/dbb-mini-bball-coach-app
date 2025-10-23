/**
 * BBB Club Daten v2 - Neue Struktur
 * 
 * Club → Teams → Ligen (nested)
 */

export interface LigaInfo {
  teamCompetitionId: string | null;  // Saison-spezifische Team-ID für diese Liga
  seasonId: number | null;
  seasonName: string | null;
  ligaId: string;
  liganame: string;
  akName: string;  // Liga-Altersklasse (kann anders sein als Team!)
  geschlechtId: number;
  geschlecht: string;
}

export interface TeamInfo {
  teamPermanentId: string | null;
  teamname: string;
  teamnameSmall: string | null;
  altersklasse: string | null;  // Team-Altersklasse (z.B. U9)
  geschlecht: string | null;
  ligen: LigaInfo[];  // Team kann in mehreren Ligen spielen (z.B. U9 Team in U10 Liga)
}

export interface BBBClub {
  clubId: string;
  vereinsname: string | null;
  vereinsnummer: string | null;
  kontaktData: any | null;  // Kann null sein oder Kontakt-Objekt
  verbaende: number[];  // z.B. [2] für Bayern
  teams: TeamInfo[];
}

export interface BBBClubsData {
  metadata: {
    crawledAt: string;
    totalClubs: number;
    totalTeams: number;
    verbaende: number[];
    note: string;
  };
  clubs: BBBClub[];
}

/**
 * Hilfsfunktionen für Club-Suche
 */
export class ClubSearch {
  /**
   * Suche Clubs nach Name (fuzzy)
   */
  static searchByName(clubs: BBBClub[], query: string): BBBClub[] {
    const normalized = query.toLowerCase().trim();
    
    return clubs.filter(club => {
      const vereinsname = (club.vereinsname || '').toLowerCase();
      const vereinsnummer = (club.vereinsnummer || '').toLowerCase();
      
      return vereinsname.includes(normalized) ||
             vereinsnummer.includes(normalized);
    });
  }
  
  /**
   * Suche Club nach exakter clubId
   */
  static findById(clubs: BBBClub[], clubId: string): BBBClub | undefined {
    return clubs.find(c => c.clubId === clubId);
  }
  
  /**
   * Filtere Clubs nach Verband
   */
  static filterByVerband(clubs: BBBClub[], verbandId: number): BBBClub[] {
    return clubs.filter(club => club.verbaende.includes(verbandId));
  }
  
  /**
   * Filtere Clubs nach Altersklasse
   */
  static filterByAltersklasse(clubs: BBBClub[], altersklasse: string): BBBClub[] {
    return clubs.filter(club => 
      club.teams.some(team => team.altersklasse === altersklasse)
    );
  }
  
  /**
   * Finde alle Teams einer Altersklasse
   */
  static getTeamsByAltersklasse(clubs: BBBClub[], altersklasse: string): Array<{ club: BBBClub, team: TeamInfo }> {
    const results: Array<{ club: BBBClub, team: TeamInfo }> = [];
    
    clubs.forEach(club => {
      club.teams
        .filter(team => team.altersklasse === altersklasse)
        .forEach(team => results.push({ club, team }));
    });
    
    return results;
  }
}
