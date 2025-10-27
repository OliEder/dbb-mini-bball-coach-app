/**
 * BBBApiService - Wrapper für DBB REST API
 * Basis-URL: https://www.basketball-bund.net
 * 
 * Test-Mode: Deaktiviert CORS-Fallback für PACT-Tests
 */

import type {
  WamFilterRequest,
  WamDataResponse,
  WamLigaEintrag,
  DBBTableResponse,
  DBBTabellenEintrag,
  DBBSpielplanResponse,
  DBBSpielplanEintrag,
  DBBMatchInfoResponse,
  DBBPlayerDetailsResponse
} from '../../../shared/types';

/**
 * Konfiguration für BBBApiService
 */
export interface BBBApiConfig {
  /**
   * Base URL für API-Calls
   * Default: https://www.basketball-bund.net
   * Test-Mode: URL des PACT Mock-Servers
   */
  baseUrl?: string;

  /**
   * Test-Mode: Deaktiviert CORS-Fallback
   * Nötig für PACT-Tests, da Mock-Server keine CORS-Proxies braucht
   * Default: false
   */
  testMode?: boolean;
}

export class BBBApiService {
  private readonly BASE_URL: string;
  private readonly testMode: boolean;

  /**
   * Constructor mit optionaler Konfiguration
   * 
   * @example Production
   * ```typescript
   * const api = new BBBApiService();
   * ```
   * 
   * @example PACT Tests
   * ```typescript
   * const api = new BBBApiService({ 
   *   baseUrl: mockProvider.url,
   *   testMode: true 
   * });
   * ```
   */
  constructor(config?: BBBApiConfig) {
    this.BASE_URL = config?.baseUrl || 'https://www.basketball-bund.net';
    this.testMode = config?.testMode || false;
    
    if (this.testMode) {
      console.log('🧪 BBBApiService in TEST MODE - CORS fallback disabled');
      console.log('🧪 Base URL:', this.BASE_URL);
    }
  }

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
   * 
   * Production Mode:
   * - Direkter Fetch zu basketball-bund.net funktioniert NICHT (CORS blocked)
   * - Nutzt IMMER CORS-Proxies für externe APIs
   * 
   * Test Mode:
   * - Direkter fetch ohne CORS-Proxies (für PACT Mock-Server)
   * - Keine Fallback-Logik
   */
  private async fetchWithFallback(url: string, options?: RequestInit): Promise<Response> {
    // 🧪 TEST MODE: Direkter fetch ohne CORS-Fallback
    if (this.testMode) {
      console.log('🧪 Test mode: Direct fetch to', url);
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response;
    }

    // 🚀 PRODUCTION MODE: CORS-Fallback
    console.log('🔄 Using CORS proxy for:', url);

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

    const apiResponse: any = await response.json();
    
    // Die API gibt ein Wrapper-Objekt zurück: { data: { ligaListe: {...} } }
    // Aber das ist schon das korrekte Format für WamDataResponse
    return apiResponse;
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
    
    const apiResponse: any = await response.json();
    console.log('🔍 RAW API Response (Tabelle) - First 1000 chars:', JSON.stringify(apiResponse).substring(0, 1000));
    
    // Die API gibt verschiedene Strukturen zurück, je nach Version
    // Neue API: { data: { ligaId, liganame, teams: [...] } }
    // Alte API: { data: { tabelle: { entries: [...] } } }
    const data = apiResponse.data || apiResponse;
    
    // Suche nach Teams in verschiedenen möglichen Pfaden
    let teams = data.teams || data.tabelle?.entries || data.entries || [];
    let ligaIdFromResponse = data.ligaId || data.ligaData?.ligaId || ligaId;
    let liganameFromResponse = data.liganame || data.ligaData?.liganame || '';
    
    // Wenn teams ein Array ist und deutsche Feldnamen hat (platzierung, gewonnen, verloren)
    if (Array.isArray(teams) && teams.length > 0 && teams[0].platzierung !== undefined) {
      console.log('🔍 Found teams with German field names, mapping...');
      teams = teams.map((team: any) => ({
        position: team.platzierung || 0,
        teamId: team.teamId || 0,
        teamName: team.teamname || '',
        clubId: team.clubId || team.teamId || 0, // clubId often missing, use teamId as fallback
        clubName: team.teamname?.split(' ')[0] || 'Unknown',
        games: team.spiele || 0,
        wins: team.gewonnen || 0,
        losses: team.verloren || 0,
        points: team.punkte || 0,
        scoredPoints: team.korbpunkteGemacht || 0,
        concededPoints: team.korbpunkteGegen || 0,
        pointsDifference: team.differenz || 0
      }));
    }
    // Wenn teams bereits englische Feldnamen hat (durch alte Mapping-Logik)
    else if (Array.isArray(teams) && teams.length > 0 && teams[0].team) {
      console.log('🔍 Found teams with nested structure, mapping...');
      teams = teams
        .filter((entry: any) => entry && entry.team)
        .map((entry: any) => ({
          position: entry.rang || 0,
          teamId: entry.team?.seasonTeamId || 0,
          teamName: entry.team?.teamname || '',
          clubId: entry.team?.clubId || entry.team?.seasonTeamId || 0,
          clubName: entry.team?.teamname?.split(' ')[0] || entry.team?.teamname || 'Unknown',
          games: entry.anzspiele || 0,
          wins: entry.s || 0,
          losses: entry.n || 0,
          points: entry.anzGewinnpunkte || 0,
          scoredPoints: entry.koerbe || 0,
          concededPoints: entry.gegenKoerbe || 0,
          pointsDifference: entry.korbdiff || 0
        }));
    }
    
    console.log(`🔍 Mapped ${teams.length} teams`);
    
    // Validiere gemappte Daten - aber sei weniger strikt
    const validTeams = teams.filter((team: any) => {
      // Basis-Validierung: teamName muss vorhanden sein
      if (!team.teamName || team.teamName.trim() === '') {
        console.warn('Team without name:', team);
        return false;
      }
      
      // Akzeptiere Teams auch ohne clubId (wird oft nicht mitgeliefert)
      if (!team.clubId) {
        team.clubId = team.teamId || 0;
      }
      if (!team.clubName) {
        team.clubName = team.teamName.split(' ')[0] || 'Unknown';
      }
      
      return true;
    });
    
    // Warnung bei leeren Teams (kann valide sein für neue Ligen)
    if (validTeams.length === 0 && teams.length > 0) {
      console.warn('No valid teams after filtering:', { ligaId, originalCount: teams.length });
    }
    
    if (validTeams.length !== teams.length && teams.length > 0) {
      console.warn(`Filtered out ${teams.length - validTeams.length} invalid entries`);
    }
    
    const result = {
      ligaId: ligaIdFromResponse,
      liganame: liganameFromResponse,
      teams: validTeams
    };
    
    console.log('✅ Returning DBBTableResponse:', { 
      ligaId: result.ligaId, 
      liganame: result.liganame, 
      teamCount: result.teams.length 
    });
    
    return result;
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
    
    const apiResponse: any = await response.json();
    console.log('🔍 RAW API Response (Spielplan):', JSON.stringify(apiResponse).substring(0, 500));
    
    // Die API gibt ein Wrapper-Objekt zurück: { data: { spielplan: [...] } } oder { data: { matches: [...] } }
    const spielplanData = apiResponse.data || apiResponse;
    console.log('🔍 Spielplan Data:', spielplanData);
    
    // Versuche verschiedene Properties
    const games = spielplanData.spielplan || spielplanData.matches || [];
    console.log('🔍 Spielplan games:', games);
    
    // Mappe API-Format zu unserem internen Format
    // Filter ungültige Spiele (ohne Teams) + defensive null-checks
    const mappedGames: DBBSpielplanEintrag[] = games
      .filter((match: any) => match && match.homeTeam && match.guestTeam) // Filter invalid entries
      .map((match: any) => ({
        matchId: match.matchId || 0,
        gameNumber: match.matchNo || 0,
        gameDay: match.matchDay || 0,
        date: match.kickoffDate || '',
        time: match.kickoffTime || '',
        homeTeam: {
          teamId: match.homeTeam?.seasonTeamId || 0,
          teamName: match.homeTeam?.teamname || 'Unknown'
        },
        awayTeam: {
          teamId: match.guestTeam?.seasonTeamId || 0,
          teamName: match.guestTeam?.teamname || 'Unknown'
        },
        venue: match.venue ? {
          name: match.venue
        } : undefined,
        status: match.result ? 'finished' : 'scheduled',
        homeScore: match.result ? parseInt(match.result.split(':')[0]) : undefined,
        awayScore: match.result ? parseInt(match.result.split(':')[1]) : undefined
      }));
    
    return {
      ligaId: spielplanData.ligaData?.ligaId || spielplanData.ligaId || ligaId,
      liganame: spielplanData.ligaData?.liganame || spielplanData.liganame || '',
      games: mappedGames
    };
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
    
    const apiResponse: any = await response.json();
    
    // Die API gibt ein Wrapper-Objekt zurück: { data: { ... } }
    const matchData = apiResponse.data || apiResponse;
    
    // Mappe API-Format zu unserem internen Format
    return {
      matchId: matchId,
      gameNumber: parseInt(matchData.spielNr) || 0,
      date: matchData.datum,
      time: matchData.uhrzeit,
      ligaId: 0, // Nicht verfügbar
      homeTeam: {
        teamId: 0, // Nicht verfügbar
        teamName: matchData.heimmannschaft || '',
        clubId: 0,
        clubName: (matchData.heimmannschaft || '').split(' ')[0] || matchData.heimmannschaft || 'Unknown',
        players: (matchData.heimSpielerList || []).map((s: any) => ({
          playerId: parseInt(s.spielerNr) || 0,
          firstName: s.vorname || '',
          lastName: s.nachname || '',
          tnaNumber: s.tnaLetzten3
        }))
      },
      awayTeam: {
        teamId: 0, // Nicht verfügbar
        teamName: matchData.gastmannschaft || '',
        clubId: 0,
        clubName: (matchData.gastmannschaft || '').split(' ')[0] || matchData.gastmannschaft || 'Unknown',
        players: (matchData.gastSpielerList || []).map((s: any) => ({
          playerId: parseInt(s.spielerNr) || 0,
          firstName: s.vorname || '',
          lastName: s.nachname || '',
          tnaNumber: s.tnaLetzten3
        }))
      },
      venue: matchData.ort ? {
        name: matchData.ort
      } : undefined,
      score: (matchData.heimErgebnis !== null && matchData.gastErgebnis !== null) ? {
        home: matchData.heimErgebnis,
        away: matchData.gastErgebnis
      } : undefined,
      referees: [
        matchData.schiedsrichter1,
        matchData.schiedsrichter2
      ].filter(Boolean)
    };
  }

  /**
   * GET /rest/player/id/{playerId}/details
   * 
   * Ruft detaillierte Informationen zu einem Spieler ab.
   * 
   * @param playerId - Die eindeutige Spieler-ID aus der DBB API
   * @returns Promise mit Spieler-Details
   * @throws Error wenn playerId ungültig ist oder API-Call fehlschlägt
   * 
   * @example
   * ```typescript
   * const details = await service.getSpielerDetails(12345);
   * console.log(details.fullName); // "Max Mustermann"
   * ```
   */
  async getSpielerDetails(playerId: number): Promise<DBBPlayerDetailsResponse> {
    // Validierung: Spieler-ID muss positive Zahl sein
    if (!playerId || playerId <= 0 || !Number.isInteger(playerId)) {
      throw new Error('Invalid player ID: must be a positive integer');
    }

    // API-Call mit CORS-Fallback
    const response = await this.fetchWithFallback(
      `${this.BASE_URL}/rest/player/id/${playerId}/details`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    // Response zu JSON parsen
    const data = await response.json();
    
    // Rückgabe mit Type-Safety
    return data;
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

// Singleton-Instanz für Production
export const bbbApiService = new BBBApiService();
