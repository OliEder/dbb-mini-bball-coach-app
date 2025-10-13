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
  // ⭐ NEW: Ergebnis-Felder
  heim_score?: number;
  gast_score?: number;
  is_finished?: boolean;
}

export interface BBBTabellenEintrag {
  rang: number;
  team_name: string;
  verein_name: string;
  spiele: number;
  siege: number;
  niederlagen: number;
  punkte: number;
  koerbe_plus: number;
  koerbe_minus: number;
  diff: number;
}

export interface BBBParseResult {
  liga: BBBLigaInfo;
  teams: BBBTeamInfo[];
  spiele: BBBSpielInfo[];
  tabelle: BBBTabellenEintrag[];  // ⭐ NEW: Vollständige Tabellen-Daten
  spielplan_url: string;
  tabelle_url: string;
  ergebnisse_url: string;
}

export class BBBParserService {
  private readonly BBB_BASE = 'https://www.basketball-bund.net';

  /**
   * Extrahiert Liga-ID aus jeder BBB-URL (Spielplan, Tabelle oder Ergebnisse)
   * Unterstützt verschiedene Parameter-Varianten: liga_id, ligaId, LIGA_ID
   */
  extractLigaId(url: string): string | null {
    try {
      const parsed = new URL(url);
      
      // Versuche verschiedene Parameter-Varianten
      const ligaId = 
        parsed.searchParams.get('liga_id') ||
        parsed.searchParams.get('ligaId') ||
        parsed.searchParams.get('LIGA_ID');
      
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
   * ⭐ NEUE STRATEGIE: Zuerst Tabelle parsen für eindeutige Team-Namen
   * 1. Fetch Tabelle (tabelle.jsp) → Eindeutige Teams
   * 2. Fetch Ergebnisse (ergebnisse.jsp) → Scores
   * 3. Fetch Spielplan (spielplan_list.jsp) → Spiele
   * 4. Merge Ergebnisse mit Spielen
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
      // ⭐ NEUE REIHENFOLGE: Tabelle → Ergebnisse → Spielplan
      const tabelleHtml = await this.fetchViaProxy(urls.tabelle_url);
      const teams = this.parseTeamsFromTabelle(tabelleHtml);
      const tabellenDaten = this.parseTabellenDaten(tabelleHtml);  // ⭐ NEW: Parse auch die Tabellen-Stats
      
      const ergebnisseHtml = await this.fetchViaProxy(urls.ergebnisse_url);
      const ergebnisSpiele = this.parseErgebnisseFromHtml(ergebnisseHtml);
      
      const spielplanHtml = await this.fetchViaProxy(urls.spielplan_url);
      return this.parseSpielplanHtml(spielplanHtml, ligaId, urls, teams, ergebnisSpiele, tabellenDaten);
      
    } catch (error) {
      console.error('BBB Parse Error:', error);
      throw new Error(`Konnte Liga-Daten nicht laden: ${(error as Error).message}`);
    }
  }

  /**
   * Fetch via CORS-Proxy (für Production)
   * Nutzt mehrere Fallback-Proxies für höhere Zuverlässigkeit
   */
  private async fetchViaProxy(url: string): Promise<string> {
    // Liste von CORS-Proxies mit Fallback-Mechanismus
    const proxies = [
      // Primary: corsproxy.io (zuverlässiger als allorigins)
      `https://corsproxy.io/?${encodeURIComponent(url)}`,
      // Fallback 1: cors-anywhere Heroku (kann rate-limited sein)
      `https://cors-anywhere.herokuapp.com/${url}`,
      // Fallback 2: allorigins (manchmal instabil)
      `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    ];
    
    let lastError: Error | null = null;
    
    // Versuche jeden Proxy nacheinander
    for (const proxyUrl of proxies) {
      try {
        const response = await fetch(proxyUrl, {
          signal: AbortSignal.timeout(10000), // 10s timeout
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.text();
      } catch (error) {
        console.warn(`CORS-Proxy failed: ${proxyUrl}`, error);
        lastError = error as Error;
        // Versuche nächsten Proxy
        continue;
      }
    }
    
    // Alle Proxies fehlgeschlagen
    throw new Error(`Alle CORS-Proxies fehlgeschlagen: ${lastError?.message || 'Unbekannter Fehler'}`);
  }

  /**
   * Parst Spielplan-HTML
   * 
   * @param html - Spielplan HTML
   * @param ligaId - Liga-ID
   * @param urls - Generated URLs
   * @param teams - ⭐ Optional: Teams aus Tabelle (bevorzugt)
   * @param ergebnisSpiele - ⭐ Optional: Vollständige Spiele aus ergebnisse.jsp
   * @param tabellenDaten - ⭐ Optional: Tabellen-Statistiken aus tabelle.jsp
   */
  private parseSpielplanHtml(
    html: string,
    ligaId: string,
    urls: ReturnType<typeof this.buildUrls>,
    teams?: BBBTeamInfo[],
    ergebnisSpiele?: BBBSpielInfo[],
    tabellenDaten?: BBBTabellenEintrag[]
  ): BBBParseResult {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Parse Liga-Name aus sportViewTitle
    // Format: "Spielplan - U10 mixed Bezirksliga (U10 Oberpfalz; Liganr.: 1040)"
    const titleElement = doc.querySelector('.sportViewTitle');
    const titleText = titleElement?.textContent?.trim() || '';
    
    // Entferne "Spielplan - " oder "Tabelle - " Präfix
    const cleanTitle = titleText.replace(/^(Spielplan|Tabelle)\s*-\s*/, '').trim();
    const title = cleanTitle || 'Unbekannte Liga';
    
    const ligaInfo = this.parseLigaName(title);

    // ⭐ NEUE STRATEGIE: Verwende Teams aus Tabelle, falls verfügbar
    // Fallback: Parse Teams aus Spielplan (alte Methode)
    const finalTeams = teams && teams.length > 0 
      ? teams 
      : this.parseTeamsFromTable(doc);

    // Parse Spiele
    let spiele = this.parseSpieleFromTable(doc);
    
    // ⭐ Merge Ergebnisse mit Spielen (Fügt auch Spiele hinzu, die nur in Ergebnissen sind!)
    if (ergebnisSpiele && ergebnisSpiele.length > 0) {
      spiele = this.mergeErgebnisseWithSpiele(spiele, ergebnisSpiele);
    }

    return {
      liga: {
        liga_id: ligaId,
        liga_name: ligaInfo.name,
        saison: ligaInfo.saison,
        altersklasse: ligaInfo.altersklasse,
        region: ligaInfo.region,
        spielklasse: ligaInfo.spielklasse,
      },
      teams: finalTeams,
      spiele,
      tabelle: tabellenDaten || [],  // ⭐ NEW: Tabellen-Daten hinzufügen
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
   * ⭐ NEW: Parst Teams aus der Tabelle (bevorzugte Methode)
   * Die Tabelle ist die zuverlässigste Quelle, da jedes Team nur einmal vorkommt
   * 
   * @param html - HTML der Tabellen-Seite (tabelle.jsp)
   * @returns Array von eindeutigen Teams
   */
  public parseTeamsFromTabelle(html: string): BBBTeamInfo[] {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    const teams: BBBTeamInfo[] = [];
    
    // Finde nur die Tabellenzeilen mit echten Daten
    // Diese haben die Klassen "sportItemEven" oder "sportItemOdd"
    const dataRows = doc.querySelectorAll('tr');
    
    dataRows.forEach(row => {
      const cells = row.querySelectorAll('td');
      
      // Skip Zeilen ohne genug Zellen
      if (cells.length < 2) return;
      
      // Prüfe ob es eine Daten-Zeile ist (sportItemEven oder sportItemOdd)
      const hasDataClass = Array.from(cells).some(cell => 
        cell.className.includes('sportItemEven') || cell.className.includes('sportItemOdd')
      );
      
      // Skip wenn keine Daten-Zeile
      if (!hasDataClass) return;
      
      // Skip Header-Zeilen (haben sportViewHeader Klasse)
      const hasHeader = Array.from(cells).some(cell => 
        cell.className.includes('sportViewHeader') || cell.className.includes('sportViewTitle')
      );
      if (hasHeader) return;
      
      // Tabellen-Format: | Rang | Name | Spiele | W/L | Pkte | Körbe | Diff. |
      // Die zweite Spalte (Index 1) enthält den Team-Namen
      if (cells.length >= 2) {
        const teamCell = cells[1];
        const teamName = teamCell?.textContent?.trim();
        
        // Prüfe ob es ein gültiger Team-Name ist
        // (mindestens 3 Zeichen, keine Zahlen-Only)
        if (teamName && teamName.length >= 3 && !/^\d+$/.test(teamName)) {
          const teamInfo = this.parseTeamName(teamName);
          teams.push(teamInfo);
        }
      }
    });
    
    return teams;
  }

  /**
   * ⭐ NEW: Parst Tabellen-Daten aus der Tabelle
   * 
   * @param html - HTML der Tabellen-Seite (tabelle.jsp)
   * @returns Array von Tabellen-Einträgen
   */
  public parseTabellenDaten(html: string): Array<{
    rang: number;
    team_name: string;
    verein_name: string;
    spiele: number;
    siege: number;
    niederlagen: number;
    punkte: number;
    koerbe_plus: number;
    koerbe_minus: number;
    diff: number;
  }> {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    const eintraege: Array<{
      rang: number;
      team_name: string;
      verein_name: string;
      spiele: number;
      siege: number;
      niederlagen: number;
      punkte: number;
      koerbe_plus: number;
      koerbe_minus: number;
      diff: number;
    }> = [];
    
    // Finde nur Daten-Zeilen
    const dataRows = doc.querySelectorAll('tr');
    
    dataRows.forEach(row => {
      const cells = row.querySelectorAll('td');
      
      // Skip wenn nicht genug Zellen
      if (cells.length < 7) return;
      
      // Prüfe ob es eine Daten-Zeile ist
      const hasDataClass = Array.from(cells).some(cell => 
        cell.className.includes('sportItemEven') || cell.className.includes('sportItemOdd')
      );
      if (!hasDataClass) return;
      
      try {
        // Format: | Rang | Name | Spiele | W/L | Pkte | Körbe | Diff. |
        const rang = parseInt(cells[0]?.textContent?.trim() || '0', 10);
        const teamName = cells[1]?.textContent?.trim() || '';
        const spiele = parseInt(cells[2]?.textContent?.trim() || '0', 10);
        const wl = cells[3]?.textContent?.trim() || '0/0';
        const punkte = parseInt(cells[4]?.textContent?.trim() || '0', 10);
        const koerbe = cells[5]?.textContent?.trim() || '0 : 0';
        const diff = parseInt(cells[6]?.textContent?.trim() || '0', 10);
        
        // Parse W/L (Format: "1/0")
        const [siege, niederlagen] = wl.split('/').map(n => parseInt(n.trim(), 10));
        
        // Parse Körbe (Format: "57 : 38")
        const koerbeMatch = koerbe.match(/(\d+)\s*:\s*(\d+)/);
        const koerbePlus = koerbeMatch ? parseInt(koerbeMatch[1], 10) : 0;
        const koerbeMinus = koerbeMatch ? parseInt(koerbeMatch[2], 10) : 0;
        
        if (rang > 0 && teamName) {
          const teamInfo = this.parseTeamName(teamName);
          
          eintraege.push({
            rang,
            team_name: teamInfo.team_name,
            verein_name: teamInfo.verein_name,
            spiele,
            siege: siege || 0,
            niederlagen: niederlagen || 0,
            punkte,
            koerbe_plus: koerbePlus,
            koerbe_minus: koerbeMinus,
            diff
          });
        }
      } catch (error) {
        console.warn('Failed to parse tabelle row:', error);
      }
    });
    
    return eintraege;
  }

  /**
   * ⭐ NEW: Parst Ergebnisse aus der Ergebnisse-Seite
   * Gibt VOLLSTÄNDIGE Spiel-Informationen zurück, nicht nur Scores!
   * 
   * @param html - HTML der Ergebnisse-Seite (ergebnisse.jsp)
   * @returns Array von abgeschlossenen Spielen mit Ergebnissen
   */
  public parseErgebnisseFromHtml(html: string): BBBSpielInfo[] {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    const ergebnisse: BBBSpielInfo[] = [];
    
    // Finde nur Daten-Zeilen mit sportItemEven/sportItemOdd
    const dataRows = doc.querySelectorAll('tr');
    
    dataRows.forEach(row => {
      const cells = row.querySelectorAll('td');
      
      // Skip Zeilen ohne genug Zellen
      if (cells.length < 6) return;
      
      // Prüfe ob es eine Daten-Zeile ist
      const hasDataClass = Array.from(cells).some(cell => 
        cell.className.includes('sportItemEven') || cell.className.includes('sportItemOdd')
      );
      if (!hasDataClass) return;
      
      try {
        // Format: | Nr | Spieltag | Datum | Heim | Gast | Endstand | Halbzeit | Vor Verl. |
        const spielnrText = cells[0]?.textContent?.trim().replace(/\s/g, '');
        const spieltagText = cells[1]?.textContent?.trim();
        const datumZeitText = cells[2]?.textContent?.trim();
        const heimTeam = cells[3]?.textContent?.trim();
        const gastTeam = cells[4]?.textContent?.trim();
        const endstandText = cells[5]?.textContent?.trim();
        
        if (!spielnrText || !endstandText || !heimTeam || !gastTeam) return;
        
        const spielnr = parseInt(spielnrText, 10);
        const spieltag = parseInt(spieltagText || '0', 10);
        
        // Parse Datum und Uhrzeit
        const [datum, uhrzeit] = this.parseDatumUhrzeit(datumZeitText || '');
        
        // Parse Endstand (Format: "57 : 38")
        const scoreMatch = endstandText.match(/(\d+)\s*:\s*(\d+)/);
        if (scoreMatch && !isNaN(spielnr)) {
          const heimScore = parseInt(scoreMatch[1], 10);
          const gastScore = parseInt(scoreMatch[2], 10);
          
          ergebnisse.push({
            spielnr,
            spieltag,
            datum,
            uhrzeit,
            heim_team: heimTeam,
            gast_team: gastTeam,
            heim_score: heimScore,
            gast_score: gastScore,
            is_finished: true
          });
        }
      } catch (error) {
        console.warn('Failed to parse ergebnis row:', error);
      }
    });
    
    return ergebnisse;
  }

  /**
   * ⭐ NEW: Fügt Ergebnisse zu Spielen hinzu und merged beide Listen
   * 
   * Strategie:
   * 1. Spiele aus Spielplan als Basis nehmen
   * 2. Ergebnisse hinzufügen (falls Spielnr existiert)
   * 3. Neue Spiele aus Ergebnissen hinzufügen (falls in Spielplan fehlen)
   * 
   * @param spielplanSpiele - Spiele aus Spielplan (können unvollständig sein)
   * @param ergebnisSpiele - Spiele aus Ergebnissen (immer vollständig mit Scores)
   * @returns Vollständige Spiel-Liste mit allen Ergebnissen
   */
  private mergeErgebnisseWithSpiele(
    spielplanSpiele: BBBSpielInfo[],
    ergebnisSpiele: BBBSpielInfo[]
  ): BBBSpielInfo[] {
    // Erstelle Map für schnellen Lookup
    const ergebnisMap = new Map<number, BBBSpielInfo>();
    ergebnisSpiele.forEach(spiel => {
      ergebnisMap.set(spiel.spielnr, spiel);
    });
    
    // 1. Update Spielplan-Spiele mit Ergebnissen
    const updatedSpiele = spielplanSpiele.map(spiel => {
      const ergebnis = ergebnisMap.get(spiel.spielnr);
      
      if (ergebnis) {
        // Merge: Spielplan-Daten + Ergebnis-Scores
        return {
          ...spiel,
          heim_score: ergebnis.heim_score,
          gast_score: ergebnis.gast_score,
          is_finished: true
        };
      }
      
      return spiel;
    });
    
    // 2. Füge Spiele aus Ergebnissen hinzu, die im Spielplan fehlen
    const spielplanNummern = new Set(spielplanSpiele.map(s => s.spielnr));
    const neueSpiele = ergebnisSpiele.filter(spiel => !spielplanNummern.has(spiel.spielnr));
    
    // Log für Debugging
    if (neueSpiele.length > 0) {
      console.log(`ℹ️ ${neueSpiele.length} Spiele aus Ergebnissen hinzugefügt, die im Spielplan fehlen`);
    }
    
    // 3. Kombiniere beide Listen und sortiere nach Spielnummer
    return [...updatedSpiele, ...neueSpiele].sort((a, b) => a.spielnr - b.spielnr);
  }

  /**
   * @deprecated Verwende parseTeamsFromTabelle() stattdessen
   * Extrahiert Teams aus der Spielplan-Tabelle (weniger zuverlässig)
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
   * ⭐ Verwendet jetzt realistische Team-Namen aus der echten Tabelle
   */
  private getMockData(ligaId: string, urls: ReturnType<typeof this.buildUrls>): BBBParseResult {
    // Simuliere Tabellen-HTML und parse daraus die Teams UND Tabellen-Daten
    const mockTabelleHtml = `
      <table class="sportView">
        <tr>
          <td class="sportItemEven" align="center"><NOBR>1</NOBR></td>
          <td class="sportItemEven"><NOBR>DJK Neustadt a. d. Waldnaab 1</NOBR></td>
          <td class="sportItemEven" align="center"><NOBR>1</NOBR></td>
          <td class="sportItemEven" align="center"><NOBR>1/0</NOBR></td>
          <td class="sportItemEven" align="center"><NOBR>2</NOBR></td>
          <td class="sportItemEven" align="center"><NOBR>48 : 19</NOBR></td>
          <td class="sportItemEven" align="center"><NOBR>29</NOBR></td>
        </tr>
        <tr>
          <td class="sportItemOdd" align="center"><NOBR>2</NOBR></td>
          <td class="sportItemOdd"><NOBR>TSV 1880 Schwandorf</NOBR></td>
          <td class="sportItemOdd" align="center"><NOBR>1</NOBR></td>
          <td class="sportItemOdd" align="center"><NOBR>1/0</NOBR></td>
          <td class="sportItemOdd" align="center"><NOBR>2</NOBR></td>
          <td class="sportItemOdd" align="center"><NOBR>57 : 38</NOBR></td>
          <td class="sportItemOdd" align="center"><NOBR>19</NOBR></td>
        </tr>
        <tr>
          <td class="sportItemEven" align="center"><NOBR>3</NOBR></td>
          <td class="sportItemEven"><NOBR>TB Weiden Basketball</NOBR></td>
          <td class="sportItemEven" align="center"><NOBR>1</NOBR></td>
          <td class="sportItemEven" align="center"><NOBR>1/0</NOBR></td>
          <td class="sportItemEven" align="center"><NOBR>2</NOBR></td>
          <td class="sportItemEven" align="center"><NOBR>35 : 30</NOBR></td>
          <td class="sportItemEven" align="center"><NOBR>5</NOBR></td>
        </tr>
        <tr>
          <td class="sportItemOdd" align="center"><NOBR>4</NOBR></td>
          <td class="sportItemOdd"><NOBR>Regensburg Baskets 1</NOBR></td>
          <td class="sportItemOdd" align="center"><NOBR>0</NOBR></td>
          <td class="sportItemOdd" align="center"><NOBR>0/0</NOBR></td>
          <td class="sportItemOdd" align="center"><NOBR>0</NOBR></td>
          <td class="sportItemOdd" align="center"><NOBR>0 : 0</NOBR></td>
          <td class="sportItemOdd" align="center"><NOBR>0</NOBR></td>
        </tr>
        <tr>
          <td class="sportItemEven" align="center"><NOBR>5</NOBR></td>
          <td class="sportItemEven"><NOBR>TV Amberg-Sulzbach BSG 2</NOBR></td>
          <td class="sportItemEven" align="center"><NOBR>1</NOBR></td>
          <td class="sportItemEven" align="center"><NOBR>0/1</NOBR></td>
          <td class="sportItemEven" align="center"><NOBR>0</NOBR></td>
          <td class="sportItemEven" align="center"><NOBR>30 : 35</NOBR></td>
          <td class="sportItemEven" align="center"><NOBR>-5</NOBR></td>
        </tr>
        <tr>
          <td class="sportItemOdd" align="center"><NOBR>6</NOBR></td>
          <td class="sportItemOdd"><NOBR>Regensburg Baskets 2</NOBR></td>
          <td class="sportItemOdd" align="center"><NOBR>1</NOBR></td>
          <td class="sportItemOdd" align="center"><NOBR>0/1</NOBR></td>
          <td class="sportItemOdd" align="center"><NOBR>0</NOBR></td>
          <td class="sportItemOdd" align="center"><NOBR>38 : 57</NOBR></td>
          <td class="sportItemOdd" align="center"><NOBR>-19</NOBR></td>
        </tr>
        <tr>
          <td class="sportItemEven" align="center"><NOBR>7</NOBR></td>
          <td class="sportItemEven"><NOBR>Fibalon Baskets Neumarkt</NOBR></td>
          <td class="sportItemEven" align="center"><NOBR>1</NOBR></td>
          <td class="sportItemEven" align="center"><NOBR>0/1</NOBR></td>
          <td class="sportItemEven" align="center"><NOBR>0</NOBR></td>
          <td class="sportItemEven" align="center"><NOBR>19 : 48</NOBR></td>
          <td class="sportItemEven" align="center"><NOBR>-29</NOBR></td>
        </tr>
      </table>
    `;
    
    // Parse Teams UND Tabellen-Daten aus simulierter Tabelle
    const teams = this.parseTeamsFromTabelle(mockTabelleHtml);
    const tabellenDaten = this.parseTabellenDaten(mockTabelleHtml);
    
    return {
      liga: {
        liga_id: ligaId,
        liga_name: 'U10 mixed Bezirksliga (U10 Oberpfalz; Liganr.: 1040)',
        saison: '2025/2026',
        altersklasse: 'U10',
        region: 'Oberpfalz',
        spielklasse: 'Bezirksliga',
      },
      teams,
      tabelle: tabellenDaten,  // ⭐ NEW: Tabellen-Daten hinzufügen
      spiele: [
        {
          spielnr: 1041,
          spieltag: 1,
          datum: '2025-09-28',
          uhrzeit: '12:00',
          heim_team: 'TSV 1880 Schwandorf',
          gast_team: 'TB Weiden Basketball',
          halle: 'Turnhalle Schwandorf',
          heim_score: 57,
          gast_score: 38,
          is_finished: true,
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
