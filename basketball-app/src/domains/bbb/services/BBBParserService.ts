/**
 * BBB Parser Service
 * 
 * Parser für basketball-bund.net HTML-Seiten
 * Extrahiert Liga-Informationen, Teams und Spielpläne
 */

export interface BBBLigaInfo {
  liga_id: string;
  liga_name: string;
  saison: string;
  altersklasse: string;
  region?: string;
  spielklasse?: string;
}

export interface BBBTeamInfo {
  team_name: string;
  verein_name: string;
  verein_ort?: string;
}

export interface BBBSpielInfo {
  spielnr: number;
  spieltag: number;
  datum: string;
  uhrzeit: string;
  heim_team: string;
  gast_team: string;
  halle?: string;
}

export interface BBBParseResult {
  liga: BBBLigaInfo;
  teams: BBBTeamInfo[];
  spiele: BBBSpielInfo[];
  spielplan_url: string;
  tabelle_url: string;
  ergebnisse_url: string;
}

export class BBBParserService {
  private readonly BBB_BASE = 'https://www.basketball-bund.net';

  /**
   * Extrahiert Liga-ID aus jeder BBB-URL (Spielplan, Tabelle oder Ergebnisse)
   */
  extractLigaId(url: string): string | null {
    try {
      const parsed = new URL(url);
      const ligaId = parsed.searchParams.get('liga_id');
      return ligaId;
    } catch {
      return null;
    }
  }

  /**
   * Generiert alle drei BBB-URLs aus der Liga-ID
   */
  buildUrls(ligaId: string): {
    spielplan_url: string;
    tabelle_url: string;
    ergebnisse_url: string;
  } {
    return {
      spielplan_url: `${this.BBB_BASE}/public/spielplan_list.jsp?print=1&viewDescKey=sport.dbb.liga.SpielplanViewPublic/index.jsp_&liga_id=${ligaId}`,
      tabelle_url: `${this.BBB_BASE}/liga/statistik_team.jsp?print=1&viewDescKey=sport.dbb.views.TeamStatView/templates/base_template.jsp_&liga_id=${ligaId}`,
      ergebnisse_url: `${this.BBB_BASE}/public/ergebnisse.jsp?print=1&viewDescKey=sport.dbb.liga.ErgebnisseViewPublic/index.jsp_&liga_id=${ligaId}`,
    };
  }

  /**
   * Parst komplette Liga-Informationen aus einer BBB-URL
   * 
   * ⚠️ CORS-Problem: Direct Fetch funktioniert nicht im Browser!
   * Lösung: Proxy-Server oder CORS-Proxy
   * Für MVP: Mock-Daten oder Server-Side Parsing
   */
  async parseLigaFromUrl(url: string): Promise<BBBParseResult> {
    const ligaId = this.extractLigaId(url);
    
    if (!ligaId) {
      throw new Error('Keine gültige Liga-ID in der URL gefunden');
    }

    const urls = this.buildUrls(ligaId);

    try {
      // ⚠️ CORS-Problem: BBB erlaubt kein Cross-Origin Fetching
      // Für MVP: Demo-Daten verwenden
      // In Production: Server-Side Proxy oder CORS-Anywhere
      
      // Workaround: Demo-Daten für Entwicklung
      if (import.meta.env.DEV) {
        console.warn('🚧 DEV MODE: Using mock BBB data');
        return this.getMockData(ligaId, urls);
      }

      // Production: Fetch via Proxy
      const html = await this.fetchViaProxy(urls.spielplan_url);
      return this.parseSpielplanHtml(html, ligaId, urls);
      
    } catch (error) {
      console.error('BBB Parse Error:', error);
      throw new Error(`Konnte Liga-Daten nicht laden: ${(error as Error).message}`);
    }
  }

  /**
   * Fetch via CORS-Proxy (für Production)
   */
  private async fetchViaProxy(url: string): Promise<string> {
    // Option 1: Eigener Proxy-Server
    // const proxyUrl = `https://your-proxy.com/fetch?url=${encodeURIComponent(url)}`;
    
    // Option 2: Public CORS-Proxy (nur für Demo!)
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    
    const response = await fetch(proxyUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.text();
  }

  /**
   * Parst Spielplan-HTML
   */
  private parseSpielplanHtml(
    html: string,
    ligaId: string,
    urls: ReturnType<typeof this.buildUrls>
  ): BBBParseResult {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Parse Liga-Name aus Titel
    const title = doc.querySelector('h1, h2, .title')?.textContent?.trim() || 'Unbekannte Liga';
    const ligaInfo = this.parseLigaName(title);

    // Parse Teams aus Tabelle
    const teams = this.parseTeamsFromTable(doc);

    // Parse Spiele
    const spiele = this.parseSpieleFromTable(doc);

    return {
      liga: {
        liga_id: ligaId,
        liga_name: ligaInfo.name,
        saison: ligaInfo.saison,
        altersklasse: ligaInfo.altersklasse,
        region: ligaInfo.region,
        spielklasse: ligaInfo.spielklasse,
      },
      teams,
      spiele,
      ...urls,
    };
  }

  /**
   * Parst Liga-Informationen aus dem Titel
   * Beispiel: "U10 mixed Oberpfalz Bezirksliga - Saison 2025/2026"
   */
  private parseLigaName(title: string): {
    name: string;
    saison: string;
    altersklasse: string;
    region?: string;
    spielklasse?: string;
  } {
    // Extrahiere Saison
    const saisonMatch = title.match(/(\d{4}\/\d{4})/);
    const saison = saisonMatch ? saisonMatch[1] : '2025/2026';

    // Extrahiere Altersklasse
    const altersklasseMatch = title.match(/U\d{1,2}/);
    const altersklasse = altersklasseMatch ? altersklasseMatch[0] : 'U10';

    // Extrahiere Region (z.B. Oberpfalz, Oberbayern)
    const regionKeywords = ['Oberpfalz', 'Oberbayern', 'Niederbayern', 'Mittelfranken', 'Oberfranken', 'Unterfranken', 'Schwaben'];
    const region = regionKeywords.find(r => title.includes(r));

    // Extrahiere Spielklasse
    const spielklasseKeywords = ['Bezirksliga', 'Kreisliga', 'Landesliga', 'Regionalliga'];
    const spielklasse = spielklasseKeywords.find(s => title.includes(s));

    return {
      name: title,
      saison,
      altersklasse,
      region,
      spielklasse,
    };
  }

  /**
   * Extrahiert Teams aus der Spielplan-Tabelle
   */
  private parseTeamsFromTable(doc: Document): BBBTeamInfo[] {
    const teams = new Map<string, BBBTeamInfo>();
    
    // Finde alle Tabellenzeilen mit Spielen
    const rows = doc.querySelectorAll('tr');
    
    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      if (cells.length < 4) return;

      // Typisches Format: | Nr | Datum | Heim | Gast | Halle |
      const heimCell = cells[2]?.textContent?.trim();
      const gastCell = cells[3]?.textContent?.trim();

      if (heimCell) {
        const teamInfo = this.parseTeamName(heimCell);
        teams.set(teamInfo.team_name, teamInfo);
      }

      if (gastCell) {
        const teamInfo = this.parseTeamName(gastCell);
        teams.set(teamInfo.team_name, teamInfo);
      }
    });

    return Array.from(teams.values());
  }

  /**
   * Parst Team-Namen und extrahiert Verein + Mannschaftsnummer
   * Beispiel: "DJK Neustadt a. d. Waldnaab 1" → Verein: "DJK Neustadt a. d. Waldnaab", Team: "...1"
   */
  private parseTeamName(fullName: string): BBBTeamInfo {
    // Entferne führende/trailing Whitespaces
    const trimmed = fullName.trim();

    // Extrahiere Verein (alles vor der letzten Zahl)
    const match = trimmed.match(/^(.+?)\s+(\d+)$/);
    
    if (match) {
      return {
        team_name: trimmed,
        verein_name: match[1].trim(),
      };
    }

    return {
      team_name: trimmed,
      verein_name: trimmed,
    };
  }

  /**
   * Parst Spiele aus der Tabelle
   */
  private parseSpieleFromTable(doc: Document): BBBSpielInfo[] {
    const spiele: BBBSpielInfo[] = [];
    const rows = doc.querySelectorAll('tr');

    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      if (cells.length < 5) return;

      try {
        // Typisches Format: | Nr | Tag | Datum Zeit | Heim | Gast | Halle |
        const spielnr = parseInt(cells[0]?.textContent?.trim() || '0', 10);
        const spieltag = parseInt(cells[1]?.textContent?.trim() || '0', 10);
        const datumZeit = cells[2]?.textContent?.trim() || '';
        const heim = cells[3]?.textContent?.trim() || '';
        const gast = cells[4]?.textContent?.trim() || '';
        const halle = cells[5]?.textContent?.trim();

        if (!spielnr || !heim || !gast) return;

        // Parse Datum und Uhrzeit
        const [datum, uhrzeit] = this.parseDatumUhrzeit(datumZeit);

        spiele.push({
          spielnr,
          spieltag,
          datum,
          uhrzeit,
          heim_team: heim,
          gast_team: gast,
          halle,
        });
      } catch (error) {
        console.warn('Failed to parse row:', error);
      }
    });

    return spiele;
  }

  /**
   * Parst Datum und Uhrzeit aus BBB-Format
   * Beispiel: "Sa., 28.09.2024, 12:00" → ["2024-09-28", "12:00"]
   */
  private parseDatumUhrzeit(text: string): [string, string] {
    // Format: "Sa., 28.09.2024, 12:00" oder "28.09.2024 12:00"
    const match = text.match(/(\d{2})\.(\d{2})\.(\d{4})[,\s]+(\d{2}):(\d{2})/);
    
    if (match) {
      const [, day, month, year, hour, minute] = match;
      return [
        `${year}-${month}-${day}`,
        `${hour}:${minute}`
      ];
    }

    // Fallback
    return ['2025-10-12', '12:00'];
  }

  /**
   * Mock-Daten für Development
   */
  private getMockData(ligaId: string, urls: ReturnType<typeof this.buildUrls>): BBBParseResult {
    return {
      liga: {
        liga_id: ligaId,
        liga_name: 'U10 mixed Oberpfalz Bezirksliga',
        saison: '2025/2026',
        altersklasse: 'U10',
        region: 'Oberpfalz',
        spielklasse: 'Bezirksliga',
      },
      teams: [
        {
          team_name: 'DJK Neustadt a. d. Waldnaab 1',
          verein_name: 'DJK Neustadt a. d. Waldnaab',
          verein_ort: 'Neustadt',
        },
        {
          team_name: 'Regensburg Baskets 2',
          verein_name: 'Regensburg Baskets',
          verein_ort: 'Regensburg',
        },
        {
          team_name: 'TSV 1880 Schwandorf 1',
          verein_name: 'TSV 1880 Schwandorf',
          verein_ort: 'Schwandorf',
        },
        {
          team_name: 'TB Weiden Basketball 1',
          verein_name: 'TB Weiden Basketball',
          verein_ort: 'Weiden',
        },
      ],
      spiele: [
        {
          spielnr: 1041,
          spieltag: 1,
          datum: '2025-09-28',
          uhrzeit: '12:00',
          heim_team: 'TSV 1880 Schwandorf 1',
          gast_team: 'TB Weiden Basketball 1',
          halle: 'Turnhalle Schwandorf',
        },
        {
          spielnr: 1042,
          spieltag: 1,
          datum: '2025-10-01',
          uhrzeit: '14:00',
          heim_team: 'DJK Neustadt a. d. Waldnaab 1',
          gast_team: 'Regensburg Baskets 2',
          halle: 'Gymnasium Neustadt',
        },
      ],
      ...urls,
    };
  }
}

// Singleton Export
export const bbbParserService = new BBBParserService();
