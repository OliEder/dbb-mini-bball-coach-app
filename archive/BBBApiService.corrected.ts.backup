/**
 * BBBApiService - Korrigiert für tatsächliche API-Struktur
 * Version: 2.0
 * Stand: 17.10.2025
 */

import type {
  ApiResponseWrapper,
  WamDataRequest,
  WamDataResponse,
  CompetitionTableResponse,
  CompetitionSpielplanResponse,
  MatchInfoResponse,
  TabellenEintrag,
  SpielplanEintrag,
  DBBTabellenEintrag,
  DBBSpielplanEintrag,
  DBBTableResponse,
  DBBSpielplanResponse,
  DBBMatchInfoResponse
} from '@shared/types/bbb-api-types';

export class BBBApiService {
  private readonly BASE_URL = 'https://www.basketball-bund.net';
  
  private readonly CORS_PROXIES = [
    'https://corsproxy.io/?',
    'https://proxy.cors.sh/',
    'https://cors.bridged.cc/',
  ];

  /**
   * Fetch mit CORS-Proxy Fallback
   */
  private async fetchWithFallback(url: string, options?: RequestInit): Promise<Response> {
    // Direkt-Versuch
    try {
      const response = await fetch(url, { 
        ...options, 
        signal: AbortSignal.timeout(5000) 
      });
      if (response.ok) return response;
    } catch (error) {
      console.warn('Direct fetch failed:', error);
    }

    // CORS-Proxy Fallback
    for (const proxy of this.CORS_PROXIES) {
      try {
        const proxyUrl = proxy + encodeURIComponent(url);
        const response = await fetch(proxyUrl, { 
          ...options, 
          signal: AbortSignal.timeout(8000) 
        });
        if (response.ok) return response;
      } catch (error) {
        console.warn(`Proxy ${proxy} failed:`, error);
      }
    }

    throw new Error('All fetch attempts failed');
  }

  /**
   * POST /rest/wam/data - Gefilterte Liga-Suche
   */
  async getWamData(filter: Partial<WamDataRequest>): Promise<WamDataResponse> {
    const fullFilter: WamDataRequest = {
      token: filter.token || 0,
      verbandIds: filter.verbandIds || [],
      gebietIds: filter.gebietIds || [],  // String Array!
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

    return await response.json() as WamDataResponse;
  }

  /**
   * GET /rest/competition/table/id/{ligaId}
   * Konvertiert deutsche API-Response zu englischen Interface-Namen
   */
  async getCompetitionTable(ligaId: number): Promise<DBBTableResponse> {
    const response = await this.fetchWithFallback(
      `${this.BASE_URL}/rest/competition/table/id/${ligaId}`
    );
    
    const apiResponse = await response.json() as CompetitionTableResponse;
    
    // Mappe deutsche Namen zu englischen
    return {
      ligaId: apiResponse.data.ligaId,
      liganame: apiResponse.data.liganame,
      teams: apiResponse.data.teams.map(team => this.mapTabellenEintragToDBB(team))
    };
  }

  /**
   * Alias für Backwards Compatibility
   */
  async getTabelle(ligaId: number): Promise<DBBTableResponse> {
    return this.getCompetitionTable(ligaId);
  }

  /**
   * GET /rest/competition/spielplan/id/{ligaId}
   * Konvertiert deutsche API-Response zu englischen Interface-Namen
   */
  async getSpielplan(ligaId: number): Promise<DBBSpielplanResponse> {
    const response = await this.fetchWithFallback(
      `${this.BASE_URL}/rest/competition/spielplan/id/${ligaId}`
    );
    
    const apiResponse = await response.json() as CompetitionSpielplanResponse;
    
    // Mappe deutsche Namen zu englischen
    return {
      ligaId: apiResponse.data.ligaId,
      liganame: apiResponse.data.liganame,
      games: apiResponse.data.spielplan.map(spiel => this.mapSpielplanEintragToDBB(spiel))
    };
  }

  /**
   * GET /rest/match/id/{matchId}/matchInfo
   * Konvertiert deutsche API-Response zu englischen Interface-Namen
   */
  async getMatchInfo(matchId: number): Promise<DBBMatchInfoResponse> {
    const response = await this.fetchWithFallback(
      `${this.BASE_URL}/rest/match/id/${matchId}/matchInfo`
    );
    
    const apiResponse = await response.json() as MatchInfoResponse;
    const data = apiResponse.data;
    
    // Mappe zu erwarteter Struktur
    return {
      matchId: matchId,
      gameNumber: parseInt(data.spielNr) || 0,
      date: data.datum,
      time: data.uhrzeit,
      ligaId: 0, // Nicht in Response verfügbar
      homeTeam: {
        teamId: 0, // Nicht verfügbar
        teamName: data.heimmannschaft,
        clubId: 0, // Nicht verfügbar
        clubName: this.extractClubFromTeamName(data.heimmannschaft),
        players: data.heimSpielerList.map((s, idx) => ({
          playerId: idx,
          firstName: s.vorname,
          lastName: s.nachname,
          jerseyNumber: parseInt(s.spielerNr) || undefined,
          tnaNumber: s.tnaLetzten3
        }))
      },
      awayTeam: {
        teamId: 0, // Nicht verfügbar
        teamName: data.gastmannschaft,
        clubId: 0, // Nicht verfügbar
        clubName: this.extractClubFromTeamName(data.gastmannschaft),
        players: data.gastSpielerList.map((s, idx) => ({
          playerId: idx,
          firstName: s.vorname,
          lastName: s.nachname,
          jerseyNumber: parseInt(s.spielerNr) || undefined,
          tnaNumber: s.tnaLetzten3
        }))
      },
      venue: {
        name: data.ort
      },
      score: (data.heimErgebnis !== null && data.gastErgebnis !== null) ? {
        home: data.heimErgebnis,
        away: data.gastErgebnis
      } : undefined,
      referees: [data.schiedsrichter1, data.schiedsrichter2].filter(Boolean) as string[]
    };
  }

  /**
   * Mappt deutschen TabellenEintrag zu englischem DBBTabellenEintrag
   */
  private mapTabellenEintragToDBB(entry: TabellenEintrag): DBBTabellenEintrag {
    // Extrahiere Club-Name aus Team-Name
    const clubName = this.extractClubFromTeamName(entry.teamname);
    
    return {
      position: entry.platzierung,
      teamId: entry.teamId,
      teamName: entry.teamname,
      clubId: entry.teamId, // Verwende teamId als Fallback
      clubName: clubName,
      games: entry.spiele,
      wins: entry.gewonnen,
      losses: entry.verloren,
      points: entry.punkte,
      scoredPoints: entry.korbpunkteGemacht,
      concededPoints: entry.korbpunkteGegen,
      pointsDifference: entry.differenz
    };
  }

  /**
   * Mappt deutschen SpielplanEintrag zu englischem DBBSpielplanEintrag
   */
  private mapSpielplanEintragToDBB(entry: SpielplanEintrag): DBBSpielplanEintrag {
    return {
      matchId: entry.spielid,
      gameNumber: entry.nr,
      gameDay: entry.tag,
      date: entry.datum,
      time: entry.uhrzeit,
      homeTeam: {
        teamId: entry.heimteamid,
        teamName: entry.heimteamname,
        clubName: this.extractClubFromTeamName(entry.heimteamname)
      },
      awayTeam: {
        teamId: entry.gastteamid,
        teamName: entry.gastteamname,
        clubName: this.extractClubFromTeamName(entry.gastteamname)
      },
      venue: {
        name: entry.halle
      },
      status: this.deriveStatus(entry.heimTore, entry.gastTore),
      homeScore: entry.heimTore || undefined,
      awayScore: entry.gastTore || undefined
    };
  }

  /**
   * Extrahiert Club-Name aus Team-Name
   */
  private extractClubFromTeamName(teamName: string): string {
    // Entferne Team-Nummern und -Zusätze
    const patterns = [
      /\s+([1-9]\d*)$/,     // "FC Bayern 2"
      /\s+([IVX]+)$/,       // "FC Bayern II"
      /\s+([A-Z])$/,        // "FC Bayern B"
      /\s+U\d{1,2}.*$/,     // "FC Bayern U12"
      /\s+[mwMW]\d*$/,      // "FC Bayern m2"
    ];
    
    let clubName = teamName;
    for (const pattern of patterns) {
      clubName = clubName.replace(pattern, '').trim();
    }
    
    return clubName;
  }

  /**
   * Leitet Status aus Ergebnis ab
   */
  private deriveStatus(heimTore: number | null, gastTore: number | null): string {
    if (heimTore !== null && gastTore !== null) {
      return 'finished';
    }
    // TODO: Datum prüfen für scheduled/live
    return 'scheduled';
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
      const batchResults = await Promise.all(
        batch.map(item => processor(item).catch(err => {
          console.error('Batch item failed:', err);
          return null;
        }))
      );
      results.push(...batchResults.filter(r => r !== null) as R[]);
      
      if (i + batchSize < items.length) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    
    return results;
  }

  /**
   * Extrahiert Liga-ID aus URL
   */
  static extractLigaId(url: string): number | null {
    const patterns = [
      /liga_id=([0-9]+)/i,
      /ligaid=([0-9]+)/i,
      /liga=([0-9]+)/i,
      /\/([0-9]+)\.html?$/i,
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

    return null;
  }
}

// Singleton Export
export const bbbApiService = new BBBApiService();
