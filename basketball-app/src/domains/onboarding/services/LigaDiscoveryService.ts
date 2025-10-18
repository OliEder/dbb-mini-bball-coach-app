/**
 * Liga-basierte Verein Discovery
 * 
 * Implementiert die Logik aus dem Python POC für bessere Verein-Erkennung
 */

import type { 
  WamFilterRequest,
  WamDataResponse,
  WamLigaEintrag,
  DBBTableResponse,
  DBBTabellenEintrag
} from '@shared/types';

interface LigaEbene {
  skEbeneId: number;
  skEbeneName: string; // "Verband", "Bezirk", "Kreis"
}

interface ExtendedLigaInfo extends WamLigaEintrag {
  ebene?: LigaEbene;
  hierachyPath?: string; // z.B. "Bayern/Oberpfalz/Regensburg"
}

export class LigaDiscoveryService {
  /**
   * Holt ALLE Ligen eines Verbands mit Paginierung
   * (wie im Python POC)
   */
  static async discoverAllLigen(
    apiService: any,
    verbandId: number,
    altersklassenIds?: number[]
  ): Promise<ExtendedLigaInfo[]> {
    const allLigen: ExtendedLigaInfo[] = [];
    let hasMoreData = true;
    let start = 0;
    const pageSize = 50;
    
    while (hasMoreData) {
      try {
        const response = await apiService.getWamData({
          token: 3,
          verbandIds: [verbandId],
          gebietIds: [],
          ligatypIds: [],
          akgGeschlechtIds: [],
          altersklasseIds: altersklassenIds || [],
          spielklasseIds: [],
          sortBy: 1,
          start: start,
          size: pageSize
        });
        
        if (response.data?.ligaListe?.ligen) {
          const ligen = response.data.ligaListe.ligen;
          
          // Erweitere mit Hierarchie-Info
          const extendedLigen = ligen.map((liga: WamLigaEintrag) => {
            const extended: ExtendedLigaInfo = { ...liga };
            
            // Bestimme Ebene basierend auf Liga-Eigenschaften
            if (liga.skName) {
              if (liga.skName.toLowerCase().includes('verband')) {
                extended.ebene = { skEbeneId: 0, skEbeneName: 'Verband' };
              } else if (liga.skName.toLowerCase().includes('bezirk') || liga.bezirkName) {
                extended.ebene = { skEbeneId: 1, skEbeneName: 'Bezirk' };
              } else if (liga.skName.toLowerCase().includes('kreis')) {
                extended.ebene = { skEbeneId: 2, skEbeneName: 'Kreis' };
              }
            }
            
            // Baue Hierarchie-Pfad
            const pathParts = [liga.verbandName];
            if (liga.bezirkName) pathParts.push(liga.bezirkName);
            // Kreis-Info könnte in skName enthalten sein
            extended.hierachyPath = pathParts.join('/');
            
            return extended;
          });
          
          allLigen.push(...extendedLigen);
          
          // Prüfe ob es weitere Daten gibt
          hasMoreData = response.data.ligaListe.hasMoreData || false;
          start += pageSize;
          
          // Sicherheits-Limit
          if (start > 500) {
            console.warn('Stopping pagination at 500 items');
            break;
          }
        } else {
          hasMoreData = false;
        }
      } catch (error) {
        console.error(`Error loading ligen page ${start}:`, error);
        hasMoreData = false;
      }
    }
    
    return allLigen;
  }
  
  /**
   * Extrahiert Vereine aus Teams (wie im Python POC)
   */
  static extractVereineFromTeams(teamsByLiga: Map<string, DBBTabellenEintrag[]>): Map<string, {
    name: string;
    clubIds: Set<number>;
    teams: string[];
    teamCount: number;
  }> {
    const vereineMap = new Map();
    
    // Pattern für Team-Nummern (aus Python POC)
    const teamNumberPatterns = [
      /\s+([1-9]\d*)$/,     // "FC Bayern 2"
      /\s+([IVX]+)$/,       // "FC Bayern II"
      /\s+(\d+)\.$/,        // "FC Bayern 1."
      /\s+([A-Z])$/,        // "FC Bayern B"
      /\s+U\d{1,2}$/,       // "FC Bayern U12"
      /\s+[mwMW]\d*$/,      // "FC Bayern m" oder "w2"
    ];
    
    teamsByLiga.forEach((teams) => {
      teams.forEach((team) => {
        // Verwende clubName als Basis
        let vereinsName = team.clubName;
        
        // Normalisiere den Namen
        vereinsName = vereinsName.trim();
        
        if (!vereineMap.has(vereinsName)) {
          vereineMap.set(vereinsName, {
            name: vereinsName,
            clubIds: new Set<number>(),
            teams: [],
            teamCount: 0
          });
        }
        
        const verein = vereineMap.get(vereinsName);
        verein.clubIds.add(team.clubId);
        verein.teams.push(team.teamName);
        verein.teamCount++;
      });
    });
    
    return vereineMap;
  }
  
  /**
   * Gruppiert Ligen nach Hierarchie für bessere Übersicht
   */
  static groupLigenByHierarchy(ligen: ExtendedLigaInfo[]): Map<string, ExtendedLigaInfo[]> {
    const grouped = new Map<string, ExtendedLigaInfo[]>();
    
    ligen.forEach(liga => {
      const key = liga.hierachyPath || 'Sonstige';
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(liga);
    });
    
    return grouped;
  }
}
