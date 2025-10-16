/**
 * BBBApiService - Wrapper für DBB REST API
 * Basis-URL: https://www.basketball-bund.net
 */

import type {
  WamFilterRequest,
  WamDataResponse,
  WamLigaEintrag,
  DBBTableResponse,
  DBBTabellenEintrag,
  DBBSpielplanResponse,
  DBBMatchInfoResponse
} from '../../../shared/types';

export class BBBApiService {
  private readonly BASE_URL = 'https://www.basketball-bund.net';

  /**
   * Extrahiert Liga-ID aus verschiedenen URL-Formaten
   * Unterstützt alle BBB URLs mit liga_id Parameter
   */
  static extractLigaId(url: string): number | null {
    try {
      // Verschiedene Patterns für Liga-ID
      const patterns = [
        /liga_id=([0-9]+)/i,           // Standard Parameter
        /ligaid=([0-9]+)/i,             // Alternative Schreibweise
        /liga=([0-9]+)/i,               // Kurzform
        /competition\/id\/([0-9]+)/i, // REST API Format
        /\/([0-9]+)\.html?$/i,        // HTML Dateiname
      ];

      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
          const id = parseInt(match[1], 10);
          if (!isNaN(id) && id > 0) {
            return id;
          }
        }
      }

      // Fallback: URLSearchParams
      try {
        const urlObj = new URL(url);
        const params = new URLSearchParams(urlObj.search);
        
        // Prüfe verschiedene Parameter-Namen
        const possibleParams = ['liga_id', 'ligaid', 'liga', 'id'];
        for (const param of possibleParams) {
          const value = params.get(param);
          if (value) {
            const id = parseInt(value, 10);
            if (!isNaN(id) && id > 0) {
              return id;
            }
          }
        }
      } catch (urlError) {
        // URL konnte nicht geparst werden, ignorieren
      }

      return null;
    } catch (error) {
      console.error('Error extracting Liga ID from URL:', error);
      return null;
    }
  }
  private readonly CORS_PROXIES = [
    'https://corsproxy.io/?',
    'https://proxy.cors.sh/',
    'https://cors.bridged.cc/',
    'https://cors-anywhere.herokuapp.com/',
    // Alternative CORS Proxies als Backup
    'https://thingproxy.freeboard.io/fetch/',
    // allorigins.win nur als letzter Fallback (oft 500er)
    'https://api.allorigins.win/raw?url='
  ];

  /**
   * Fetch mit CORS-Proxy Fallback
   */
  private async fetchWithFallback(url: string, options?: RequestInit): Promise<Response> {
    // Skip CORS proxies if URL is localhost (for testing)
    if (url.includes('localhost') || url.includes('127.0.0.1')) {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }
      return response;
    }

    // Versuche direkt (mit kürzerem Timeout)
    try {
      const response = await fetch(url, { 
        ...options, 
        signal: AbortSignal.timeout(5000) 
      });
      if (response.ok) {
        console.log('✅ Direct fetch success');
        return response;
      }
    } catch (error) {
      console.warn('Direct fetch failed, trying CORS proxies', error);
    }

    // Versuche CORS-Proxies mit besserer Fehlerbehandlung
    const errors: Array<{proxy: string, error: any}> = [];
    
    for (const proxy of this.CORS_PROXIES) {
      try {
        const proxyUrl = proxy + encodeURIComponent(url);
        console.log(`Trying proxy: ${proxy}`);
        
        const response = await fetch(proxyUrl, { 
          ...options, 
          signal: AbortSignal.timeout(8000) 
        });
        
        // Prüfe Status explizit
        if (response.ok) {
          console.log('✅ CORS proxy success:', proxy);
          return response;
        } else {
          errors.push({proxy, error: `Status ${response.status}`});
        }
      } catch (error) {
        errors.push({proxy, error});
        console.warn(`Proxy ${proxy} failed:`, error);
      }
    }

    // Detaillierte Fehlermeldung
    console.error('All CORS proxies failed:', errors);
    throw new Error(`All CORS proxies failed. Last error: ${JSON.stringify(errors)}`);
  }

  /**
   * POST /rest/wam/data - Filter-basierte Liga-Suche
   * Alias: getWamData für Kompatibilität
   */
  async filterLigen(filter: Partial<WamFilterRequest>): Promise<WamDataResponse> {
    return this.getWamData(filter);
  }
  
  /**
   * POST /rest/wam/data - Filter-basierte Liga-Suche
   */
  async getWamData(filter: Partial<WamFilterRequest>): Promise<WamDataResponse> {
    const fullFilter: WamFilterRequest = {
      token: 0,
      verbandIds: filter.verbandIds || [],
      gebietIds: filter.gebietIds || [],
      ligatypIds: filter.ligatypIds || [],
      akgGeschlechtIds: filter.akgGeschlechtIds || [],
      altersklasseIds: filter.altersklasseIds || [],
      spielklasseIds: filter.spielklasseIds || [],
      sortBy: filter.sortBy || 1,
    };

    const response = await this.fetchWithFallback(
      `${this.BASE_URL}/rest/wam/data`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullFilter)
      }
    );

    return await response.json();
  }

  /**
   * Validiert Tabellendaten nach Schema
   */
  static validateTabellenEintrag(entry: any): entry is DBBTabellenEintrag {
    if (!entry || typeof entry !== 'object') return false;
    
    // Pflichtfelder prüfen
    const requiredNumbers = [
      'position', 'teamId', 'clubId', 'games', 
      'wins', 'losses', 'points', 'scoredPoints', 
      'concededPoints', 'pointsDifference'
    ];
    
    for (const field of requiredNumbers) {
      if (typeof entry[field] !== 'number' || isNaN(entry[field])) {
        console.warn(`Invalid field ${field}:`, entry[field]);
        return false;
      }
    }
    
    // String-Felder
    if (typeof entry.teamName !== 'string' || !entry.teamName.trim()) {
      console.warn('Invalid teamName:', entry.teamName);
      return false;
    }
    if (typeof entry.clubName !== 'string' || !entry.clubName.trim()) {
      console.warn('Invalid clubName:', entry.clubName);
      return false;
    }
    
    // Plausibilitätsprüfungen
    if (entry.position < 1 || entry.position > 50) {
      console.warn('Invalid position:', entry.position);
      return false;
    }
    if (entry.games < 0 || entry.wins < 0 || entry.losses < 0) {
      console.warn('Negative games/wins/losses:', entry);
      return false;
    }
    if (entry.wins + entry.losses > entry.games) {
      console.warn('Wins + losses > games:', entry);
      return false;
    }
    if (entry.points !== (entry.wins * 2) + (entry.games - entry.wins - entry.losses)) {
      // Punkte = Siege*2 + Unentschieden*1
      console.warn('Invalid points calculation:', entry);
      // Nicht als Fehler werten, da es Sonderregeln geben kann
    }
    if (entry.pointsDifference !== entry.scoredPoints - entry.concededPoints) {
      console.warn('Invalid points difference:', entry);
      return false;
    }
    
    return true;
  }

  /**
   * GET /rest/competition/table/id/{ligaId}
   * Alias: getCompetitionTable für Kompatibilität
   */
  async getTabelle(ligaId: number): Promise<DBBTableResponse> {
    return this.getCompetitionTable(ligaId);
  }
  
  /**
   * GET /rest/competition/table/id/{ligaId}
   */
  async getCompetitionTable(ligaId: number): Promise<DBBTableResponse> {
    const response = await this.fetchWithFallback(
      `${this.BASE_URL}/rest/competition/table/id/${ligaId}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );
    
    const data = await response.json();
    
    // Validiere Tabellendaten
    if (data.teams && Array.isArray(data.teams)) {
      const validTeams = data.teams.filter((team: any) => {
        const isValid = BBBApiService.validateTabellenEintrag(team);
        if (!isValid) {
          console.error('Invalid table entry:', team);
        }
        return isValid;
      });
      
      if (validTeams.length !== data.teams.length) {
        console.warn(`Filtered out ${data.teams.length - validTeams.length} invalid entries`);
      }
      
      data.teams = validTeams;
    }
    
    return data;
  }

  /**
   * GET /rest/competition/spielplan/id/{ligaId}
   */
  async getSpielplan(ligaId: number): Promise<DBBSpielplanResponse> {
    const response = await this.fetchWithFallback(
      `${this.BASE_URL}/rest/competition/spielplan/id/${ligaId}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );
    return await response.json();
  }

  /**
   * GET /rest/match/id/{matchId}/matchInfo
   */
  async getMatchInfo(matchId: number): Promise<DBBMatchInfoResponse> {
    const response = await this.fetchWithFallback(
      `${this.BASE_URL}/rest/match/id/${matchId}/matchInfo`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );
    return await response.json();
  }

  /**
   * Batch-Verarbeitung mit Rate-Limiting
   */
  async batchProcess<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    batchSize: number = 10,
    delayMs: number = 300
  ): Promise<R[]> {
    const results: R[] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(processor));
      results.push(...batchResults);
      
      // Delay zwischen Batches (außer beim letzten)
      if (i + batchSize < items.length) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    
    return results;
  }
}

export const bbbApiService = new BBBApiService();
