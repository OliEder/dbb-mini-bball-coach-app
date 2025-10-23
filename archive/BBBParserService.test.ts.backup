/**
 * BBBParserService Tests
 * 
 * Test-Driven Development für BBB HTML-Parsing
 * Nutzt echte JSP-Dateien aus test-data/bbb/
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { BBBParserService } from './BBBParserService';

describe('BBBParserService', () => {
  let service: BBBParserService;

  beforeEach(() => {
    service = new BBBParserService();
  });

  describe('extractLigaId', () => {
    it('should extract liga_id from spielplan URL', () => {
      const url = 'https://www.basketball-bund.net/public/spielplan_list.jsp?print=1&liga_id=51961';
      const result = service.extractLigaId(url);
      
      expect(result).toBe('51961');
    });

    it('should extract liga_id from tabelle URL', () => {
      const url = 'https://www.basketball-bund.net/liga/statistik_team.jsp?liga_id=51961';
      const result = service.extractLigaId(url);
      
      expect(result).toBe('51961');
    });

    it('should extract liga_id from ergebnisse URL', () => {
      const url = 'https://www.basketball-bund.net/public/ergebnisse.jsp?liga_id=51961';
      const result = service.extractLigaId(url);
      
      expect(result).toBe('51961');
    });

    it('should return null for invalid URL', () => {
      const url = 'https://invalid.com/no-liga-id';
      const result = service.extractLigaId(url);
      
      expect(result).toBeNull();
    });

    it('should return null for malformed URL', () => {
      const url = 'not-a-valid-url';
      const result = service.extractLigaId(url);
      
      expect(result).toBeNull();
    });

    it('should handle URL with multiple query parameters', () => {
      const url = 'https://www.basketball-bund.net/public/spielplan_list.jsp?print=1&viewDescKey=sport.dbb.liga.SpielplanViewPublic/index.jsp_&liga_id=12345&other=param';
      const result = service.extractLigaId(url);
      
      expect(result).toBe('12345');
    });

    it('should extract ligaId parameter (camelCase variant)', () => {
      const url = 'https://www.basketball-bund.net/public/spielplan_list.jsp?ligaId=51961';
      const result = service.extractLigaId(url);
      
      expect(result).toBe('51961');
    });

    it('should extract LIGA_ID parameter (uppercase variant)', () => {
      const url = 'https://www.basketball-bund.net/public/spielplan_list.jsp?LIGA_ID=51961';
      const result = service.extractLigaId(url);
      
      expect(result).toBe('51961');
    });

    it('should prefer liga_id over other variants', () => {
      const url = 'https://www.basketball-bund.net/public/spielplan_list.jsp?liga_id=12345&ligaId=99999';
      const result = service.extractLigaId(url);
      
      expect(result).toBe('12345');
    });
  });

  describe('buildUrls', () => {
    it('should build all three URLs from liga_id', () => {
      const ligaId = '51961';
      const result = service.buildUrls(ligaId);

      expect(result.spielplan_url).toContain('spielplan_list.jsp');
      expect(result.spielplan_url).toContain('liga_id=51961');
      
      expect(result.tabelle_url).toContain('statistik_team.jsp');
      expect(result.tabelle_url).toContain('liga_id=51961');
      
      expect(result.ergebnisse_url).toContain('ergebnisse.jsp');
      expect(result.ergebnisse_url).toContain('liga_id=51961');
    });

    it('should include print parameter', () => {
      const ligaId = '12345';
      const result = service.buildUrls(ligaId);

      expect(result.spielplan_url).toContain('print=1');
      expect(result.tabelle_url).toContain('print=1');
      expect(result.ergebnisse_url).toContain('print=1');
    });

    it('should use correct base URL', () => {
      const ligaId = '99999';
      const result = service.buildUrls(ligaId);

      expect(result.spielplan_url).toMatch(/^https:\/\/www\.basketball-bund\.net/);
      expect(result.tabelle_url).toMatch(/^https:\/\/www\.basketball-bund\.net/);
      expect(result.ergebnisse_url).toMatch(/^https:\/\/www\.basketball-bund\.net/);
    });
  });

  describe('parseLigaName (private method access via mock)', () => {
    // Test über die öffentliche getMockData Methode
    it('should parse liga information from mock data', async () => {
      const mockUrl = 'https://www.basketball-bund.net/public/spielplan_list.jsp?liga_id=51961';
      
      // In DEV mode gibt getMockData zurück
      const result = await service.parseLigaFromUrl(mockUrl);

      expect(result.liga).toBeDefined();
      expect(result.liga.liga_id).toBe('51961');
      expect(result.liga.liga_name).toBeTruthy();
      expect(result.liga.saison).toMatch(/\d{4}\/\d{4}/);
      expect(result.liga.altersklasse).toMatch(/U\d{1,2}/);
    });
  });

  describe('parseTeamName (via mock data)', () => {
    it('should parse team names with numbers correctly', async () => {
      const mockUrl = 'https://www.basketball-bund.net/public/spielplan_list.jsp?liga_id=51961';
      const result = await service.parseLigaFromUrl(mockUrl);

      const teams = result.teams;
      expect(teams.length).toBeGreaterThan(0);

      // Prüfe Team-Format
      teams.forEach(team => {
        expect(team.team_name).toBeTruthy();
        expect(team.verein_name).toBeTruthy();
        expect(typeof team.team_name).toBe('string');
        expect(typeof team.verein_name).toBe('string');
      });
    });

    it('should separate verein name from team number', async () => {
      const mockUrl = 'https://www.basketball-bund.net/public/spielplan_list.jsp?liga_id=51961';
      const result = await service.parseLigaFromUrl(mockUrl);

      // Finde Team mit Nummer
      const teamMitNummer = result.teams.find(t => t.team_name.match(/\s\d+$/));
      
      if (teamMitNummer) {
        // Verein-Name sollte keine abschließende Zahl haben
        expect(teamMitNummer.verein_name).not.toMatch(/\s\d+$/);
        // Team-Name sollte die Zahl haben
        expect(teamMitNummer.team_name).toMatch(/\s\d+$/);
      }
    });
  });

  describe('parseSpieleFromTable (via mock data)', () => {
    it('should parse spiele with all required fields', async () => {
      const mockUrl = 'https://www.basketball-bund.net/public/spielplan_list.jsp?liga_id=51961';
      const result = await service.parseLigaFromUrl(mockUrl);

      expect(result.spiele.length).toBeGreaterThan(0);

      result.spiele.forEach(spiel => {
        expect(spiel.spielnr).toBeGreaterThan(0);
        expect(spiel.spieltag).toBeGreaterThan(0);
        expect(spiel.datum).toMatch(/\d{4}-\d{2}-\d{2}/);
        expect(spiel.uhrzeit).toMatch(/\d{2}:\d{2}/);
        expect(spiel.heim_team).toBeTruthy();
        expect(spiel.gast_team).toBeTruthy();
      });
    });

    it('should have unique spielnummern', async () => {
      const mockUrl = 'https://www.basketball-bund.net/public/spielplan_list.jsp?liga_id=51961';
      const result = await service.parseLigaFromUrl(mockUrl);

      const spielnummern = result.spiele.map(s => s.spielnr);
      const uniqueNummern = new Set(spielnummern);

      expect(uniqueNummern.size).toBe(spielnummern.length);
    });

    it('should parse datum in ISO format YYYY-MM-DD', async () => {
      const mockUrl = 'https://www.basketball-bund.net/public/spielplan_list.jsp?liga_id=51961';
      const result = await service.parseLigaFromUrl(mockUrl);

      result.spiele.forEach(spiel => {
        const dateParts = spiel.datum.split('-');
        expect(dateParts).toHaveLength(3);
        
        const [year, month, day] = dateParts;
        expect(parseInt(year)).toBeGreaterThan(2020);
        expect(parseInt(month)).toBeGreaterThanOrEqual(1);
        expect(parseInt(month)).toBeLessThanOrEqual(12);
        expect(parseInt(day)).toBeGreaterThanOrEqual(1);
        expect(parseInt(day)).toBeLessThanOrEqual(31);
      });
    });

    it('should parse uhrzeit in HH:MM format', async () => {
      const mockUrl = 'https://www.basketball-bund.net/public/spielplan_list.jsp?liga_id=51961';
      const result = await service.parseLigaFromUrl(mockUrl);

      result.spiele.forEach(spiel => {
        const timeParts = spiel.uhrzeit.split(':');
        expect(timeParts).toHaveLength(2);
        
        const [hour, minute] = timeParts.map(Number);
        expect(hour).toBeGreaterThanOrEqual(0);
        expect(hour).toBeLessThan(24);
        expect(minute).toBeGreaterThanOrEqual(0);
        expect(minute).toBeLessThan(60);
      });
    });
  });

  describe('parseLigaFromUrl - Integration', () => {
    it('should return complete parse result', async () => {
      const mockUrl = 'https://www.basketball-bund.net/public/spielplan_list.jsp?liga_id=51961';
      const result = await service.parseLigaFromUrl(mockUrl);

      // Liga
      expect(result.liga).toBeDefined();
      expect(result.liga.liga_id).toBe('51961');
      expect(result.liga.liga_name).toBeTruthy();
      expect(result.liga.saison).toMatch(/\d{4}\/\d{4}/);
      expect(result.liga.altersklasse).toMatch(/U\d{1,2}/);

      // Teams
      expect(result.teams).toBeInstanceOf(Array);
      expect(result.teams.length).toBeGreaterThan(0);

      // Spiele
      expect(result.spiele).toBeInstanceOf(Array);
      expect(result.spiele.length).toBeGreaterThan(0);

      // URLs
      expect(result.spielplan_url).toContain('liga_id=51961');
      expect(result.tabelle_url).toContain('liga_id=51961');
      expect(result.ergebnisse_url).toContain('liga_id=51961');
    });

    it('should throw error for invalid liga_id', async () => {
      const invalidUrl = 'https://www.basketball-bund.net/invalid';
      
      await expect(service.parseLigaFromUrl(invalidUrl)).rejects.toThrow('Keine gültige Liga-ID');
    });

    it('should include region if parseable', async () => {
      const mockUrl = 'https://www.basketball-bund.net/public/spielplan_list.jsp?liga_id=51961';
      const result = await service.parseLigaFromUrl(mockUrl);

      // Mock-Daten haben Region "Oberpfalz"
      expect(result.liga.region).toBeTruthy();
    });

    it('should include spielklasse if parseable', async () => {
      const mockUrl = 'https://www.basketball-bund.net/public/spielplan_list.jsp?liga_id=51961';
      const result = await service.parseLigaFromUrl(mockUrl);

      // Mock-Daten haben Spielklasse "Bezirksliga"
      expect(result.liga.spielklasse).toBeTruthy();
    });
  });

  describe('Mock Data Consistency', () => {
    it('should have consistent team names across spiele', async () => {
      const mockUrl = 'https://www.basketball-bund.net/public/spielplan_list.jsp?liga_id=51961';
      const result = await service.parseLigaFromUrl(mockUrl);

      const teamNames = new Set(result.teams.map(t => t.team_name));
      
      result.spiele.forEach(spiel => {
        // Heim-Team sollte in der Team-Liste sein
        const heimExists = Array.from(teamNames).some(name => 
          name.includes(spiel.heim_team) || spiel.heim_team.includes(name)
        );
        expect(heimExists).toBeTruthy();

        // Gast-Team sollte in der Team-Liste sein
        const gastExists = Array.from(teamNames).some(name => 
          name.includes(spiel.gast_team) || spiel.gast_team.includes(name)
        );
        expect(gastExists).toBeTruthy();
      });
    });

    it('should have realistic spieltage (1-22)', async () => {
      const mockUrl = 'https://www.basketball-bund.net/public/spielplan_list.jsp?liga_id=51961';
      const result = await service.parseLigaFromUrl(mockUrl);

      result.spiele.forEach(spiel => {
        expect(spiel.spieltag).toBeGreaterThan(0);
        expect(spiel.spieltag).toBeLessThanOrEqual(22);
      });
    });

    it('should have realistic spielnummern (1000-9999)', async () => {
      const mockUrl = 'https://www.basketball-bund.net/public/spielplan_list.jsp?liga_id=51961';
      const result = await service.parseLigaFromUrl(mockUrl);

      result.spiele.forEach(spiel => {
        expect(spiel.spielnr).toBeGreaterThan(1000);
        expect(spiel.spielnr).toBeLessThan(10000);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty liga_id gracefully', async () => {
      const emptyUrl = 'https://www.basketball-bund.net/public/spielplan_list.jsp?liga_id=';
      
      await expect(service.parseLigaFromUrl(emptyUrl)).rejects.toThrow();
    });

    it('should handle URL without protocol', () => {
      const url = 'www.basketball-bund.net/public/spielplan_list.jsp?liga_id=51961';
      const result = service.extractLigaId(url);
      
      expect(result).toBeNull();
    });

    it('should handle liga_id with leading zeros', () => {
      const url = 'https://www.basketball-bund.net/public/spielplan_list.jsp?liga_id=00123';
      const result = service.extractLigaId(url);
      
      expect(result).toBe('00123');
    });
  });

  describe('URL Generation', () => {
    it('should generate valid URLs', () => {
      const ligaId = '51961';
      const urls = service.buildUrls(ligaId);

      // Alle URLs sollten valid sein
      expect(() => new URL(urls.spielplan_url)).not.toThrow();
      expect(() => new URL(urls.tabelle_url)).not.toThrow();
      expect(() => new URL(urls.ergebnisse_url)).not.toThrow();
    });

    it('should use different paths for each URL type', () => {
      const ligaId = '51961';
      const urls = service.buildUrls(ligaId);

      expect(urls.spielplan_url).toContain('/public/spielplan_list.jsp');
      expect(urls.tabelle_url).toContain('/liga/statistik_team.jsp');
      expect(urls.ergebnisse_url).toContain('/public/ergebnisse.jsp');
    });

    it('should include viewDescKey for spielplan and tabelle', () => {
      const ligaId = '51961';
      const urls = service.buildUrls(ligaId);

      expect(urls.spielplan_url).toContain('viewDescKey=');
      expect(urls.tabelle_url).toContain('viewDescKey=');
    });
  });

  describe('parseTabelleHtml - NEW: Parse teams from Tabelle first', () => {
    it('should parse teams from tabelle HTML', () => {
      // Simuliere eine einfache Tabellen-Struktur
      const tabelleHtml = `
        <table class="sportView">
          <tr>
            <td class="sportItemEven" align="center"><NOBR>1</NOBR></td>
            <td class="sportItemEven"><NOBR>DJK Neustadt a. d. Waldnaab 1</NOBR></td>
          </tr>
          <tr>
            <td class="sportItemOdd" align="center"><NOBR>2</NOBR></td>
            <td class="sportItemOdd"><NOBR>TSV 1880 Schwandorf</NOBR></td>
          </tr>
          <tr>
            <td class="sportItemEven" align="center"><NOBR>3</NOBR></td>
            <td class="sportItemEven"><NOBR>TB Weiden Basketball</NOBR></td>
          </tr>
        </table>
      `;
      
      const teams = service.parseTeamsFromTabelle(tabelleHtml);
      
      expect(teams).toHaveLength(3);
      expect(teams[0].team_name).toBe('DJK Neustadt a. d. Waldnaab 1');
      expect(teams[1].team_name).toBe('TSV 1880 Schwandorf');
      expect(teams[2].team_name).toBe('TB Weiden Basketball');
    });

    it('should handle teams without numbers correctly', () => {
      const tabelleHtml = `
        <table class="sportView">
          <tr>
            <td class="sportItemEven" align="center"><NOBR>1</NOBR></td>
            <td class="sportItemEven"><NOBR>TSV 1880 Schwandorf</NOBR></td>
          </tr>
        </table>
      `;
      
      const teams = service.parseTeamsFromTabelle(tabelleHtml);
      
      expect(teams).toHaveLength(1);
      expect(teams[0].team_name).toBe('TSV 1880 Schwandorf');
      expect(teams[0].verein_name).toBe('TSV 1880 Schwandorf');
    });

    it('should handle teams with numbers correctly', () => {
      const tabelleHtml = `
        <table class="sportView">
          <tr>
            <td class="sportItemEven" align="center"><NOBR>1</NOBR></td>
            <td class="sportItemEven"><NOBR>Regensburg Baskets 1</NOBR></td>
          </tr>
        </table>
      `;
      
      const teams = service.parseTeamsFromTabelle(tabelleHtml);
      
      expect(teams).toHaveLength(1);
      expect(teams[0].team_name).toBe('Regensburg Baskets 1');
      expect(teams[0].verein_name).toBe('Regensburg Baskets');
    });

    it('should skip header rows', () => {
      const tabelleHtml = `
        <table class="sportView">
          <tr>
            <td class="sportViewHeader">Rang&nbsp;</td>
            <td class="sportViewHeader">Name&nbsp;</td>
          </tr>
          <tr>
            <td class="sportItemEven" align="center"><NOBR>1</NOBR></td>
            <td class="sportItemEven"><NOBR>Team A</NOBR></td>
          </tr>
        </table>
      `;
      
      const teams = service.parseTeamsFromTabelle(tabelleHtml);
      
      expect(teams).toHaveLength(1);
      expect(teams[0].team_name).toBe('Team A');
    });

    it('should skip title rows with sportViewTitle class', () => {
      const tabelleHtml = `
        <table class="sportView">
          <tr>
            <td class="sportViewTitle">Tabelle - U10 mixed Bezirksliga</td>
          </tr>
          <tr>
            <td class="sportItemEven" align="center"><NOBR>1</NOBR></td>
            <td class="sportItemEven"><NOBR>Team A</NOBR></td>
          </tr>
        </table>
      `;
      
      const teams = service.parseTeamsFromTabelle(tabelleHtml);
      
      expect(teams).toHaveLength(1);
      expect(teams[0].team_name).toBe('Team A');
    });

    it('should skip rows without sportItemEven or sportItemOdd class', () => {
      const tabelleHtml = `
        <table class="sportView">
          <tr>
            <td class="someOtherClass">Not a team</td>
            <td class="someOtherClass">Also not a team</td>
          </tr>
          <tr>
            <td class="sportItemEven" align="center"><NOBR>1</NOBR></td>
            <td class="sportItemEven"><NOBR>Real Team</NOBR></td>
          </tr>
        </table>
      `;
      
      const teams = service.parseTeamsFromTabelle(tabelleHtml);
      
      expect(teams).toHaveLength(1);
      expect(teams[0].team_name).toBe('Real Team');
    });

    it('should validate team names (min 3 chars, no numbers-only)', () => {
      const tabelleHtml = `
        <table class="sportView">
          <tr>
            <td class="sportItemEven" align="center"><NOBR>1</NOBR></td>
            <td class="sportItemEven"><NOBR>AB</NOBR></td>
          </tr>
          <tr>
            <td class="sportItemOdd" align="center"><NOBR>2</NOBR></td>
            <td class="sportItemOdd"><NOBR>123</NOBR></td>
          </tr>
          <tr>
            <td class="sportItemEven" align="center"><NOBR>3</NOBR></td>
            <td class="sportItemEven"><NOBR>Valid Team</NOBR></td>
          </tr>
        </table>
      `;
      
      const teams = service.parseTeamsFromTabelle(tabelleHtml);
      
      // Sollte nur "Valid Team" parsen
      expect(teams).toHaveLength(1);
      expect(teams[0].team_name).toBe('Valid Team');
    });

    it('should return empty array for invalid HTML', () => {
      const invalidHtml = '<div>No table here</div>';
      const teams = service.parseTeamsFromTabelle(invalidHtml);
      
      expect(teams).toEqual([]);
    });

    it('should handle empty table', () => {
      const emptyHtml = '<table class="sportView"></table>';
      const teams = service.parseTeamsFromTabelle(emptyHtml);
      
      expect(teams).toEqual([]);
    });
  });

  describe('parseLigaFromUrl - NEW: Should fetch Tabelle first', () => {
    it('should parse tabelle before spielplan in mock data', async () => {
      const mockUrl = 'https://www.basketball-bund.net/public/spielplan_list.jsp?liga_id=51961';
      const result = await service.parseLigaFromUrl(mockUrl);

      // Teams sollten aus der Tabelle stammen (eindeutig)
      expect(result.teams).toBeDefined();
      expect(result.teams.length).toBeGreaterThan(0);
      
      // Jedes Team sollte einen eindeutigen Namen haben
      const teamNames = result.teams.map(t => t.team_name);
      const uniqueNames = new Set(teamNames);
      expect(uniqueNames.size).toBe(teamNames.length);
    });
  });

  describe('parseErgebnisseFromHtml - NEW: Parse vollständige Spiele from ergebnisse.jsp', () => {
    it('should parse vollständige Spiele from ergebnisse HTML', () => {
      const ergebnisseHtml = `
        <table class="sportView">
          <tr>
            <td class="sportItemEven" align="center"><NOBR>1048</NOBR></td>
            <td class="sportItemEven" align="center"><NOBR>2</NOBR></td>
            <td class="sportItemEven"><NOBR>05.10.2025 14:00</NOBR></td>
            <td class="sportItemEven">TSV 1880 Schwandorf</td>
            <td class="sportItemEven">Regensburg Baskets 2</td>
            <td class="sportItemEven" align="center"><NOBR>57 : 38</NOBR></td>
          </tr>
        </table>
      `;
      
      const ergebnisse = service.parseErgebnisseFromHtml(ergebnisseHtml);
      
      expect(ergebnisse).toHaveLength(1);
      expect(ergebnisse[0].spielnr).toBe(1048);
      expect(ergebnisse[0].heim_team).toBe('TSV 1880 Schwandorf');
      expect(ergebnisse[0].gast_team).toBe('Regensburg Baskets 2');
      expect(ergebnisse[0].heim_score).toBe(57);
      expect(ergebnisse[0].gast_score).toBe(38);
      expect(ergebnisse[0].is_finished).toBe(true);
    });

    it('should handle multiple scores', () => {
      const ergebnisseHtml = `
        <table class="sportView">
          <tr>
            <td class="sportItemEven" align="center"><NOBR>1041</NOBR></td>
            <td class="sportItemEven" align="center"><NOBR>1</NOBR></td>
            <td class="sportItemEven"><NOBR>28.09.2025 10:00</NOBR></td>
            <td class="sportItemEven">Team A</td>
            <td class="sportItemEven">Team B</td>
            <td class="sportItemEven" align="center"><NOBR>45 : 38</NOBR></td>
          </tr>
          <tr>
            <td class="sportItemOdd" align="center"><NOBR>1042</NOBR></td>
            <td class="sportItemOdd" align="center"><NOBR>1</NOBR></td>
            <td class="sportItemOdd"><NOBR>28.09.2025 12:00</NOBR></td>
            <td class="sportItemOdd">Team C</td>
            <td class="sportItemOdd">Team D</td>
            <td class="sportItemOdd" align="center"><NOBR>52 : 49</NOBR></td>
          </tr>
        </table>
      `;
      
      const ergebnisse = service.parseErgebnisseFromHtml(ergebnisseHtml);
      
      expect(ergebnisse).toHaveLength(2);
      expect(ergebnisse[0].spielnr).toBe(1041);
      expect(ergebnisse[0].heim_score).toBe(45);
      expect(ergebnisse[0].gast_score).toBe(38);
      expect(ergebnisse[1].spielnr).toBe(1042);
      expect(ergebnisse[1].heim_score).toBe(52);
      expect(ergebnisse[1].gast_score).toBe(49);
    });

    it('should skip header rows', () => {
      const ergebnisseHtml = `
        <table class="sportView">
          <tr>
            <td class="sportViewHeader">Nr.</td>
            <td class="sportViewHeader">Endstand</td>
          </tr>
          <tr>
            <td class="sportItemEven" align="center"><NOBR>1048</NOBR></td>
            <td class="sportItemEven" align="center"><NOBR>1</NOBR></td>
            <td class="sportItemEven"><NOBR>28.09.2025 10:00</NOBR></td>
            <td class="sportItemEven">Team A</td>
            <td class="sportItemEven">Team B</td>
            <td class="sportItemEven" align="center"><NOBR>57 : 38</NOBR></td>
          </tr>
        </table>
      `;
      
      const ergebnisse = service.parseErgebnisseFromHtml(ergebnisseHtml);
      
      expect(ergebnisse).toHaveLength(1);
    });

    it('should handle missing scores gracefully', () => {
      const ergebnisseHtml = `
        <table class="sportView">
          <tr>
            <td class="sportItemEven" align="center"><NOBR>1048</NOBR></td>
            <td class="sportItemEven" align="center"><NOBR>1</NOBR></td>
            <td class="sportItemEven"><NOBR>28.09.2025 10:00</NOBR></td>
            <td class="sportItemEven">Team A</td>
            <td class="sportItemEven">Team B</td>
            <td class="sportItemEven" align="center"><NOBR></NOBR></td>
          </tr>
        </table>
      `;
      
      const ergebnisse = service.parseErgebnisseFromHtml(ergebnisseHtml);
      
      expect(ergebnisse).toHaveLength(0);
    });

    it('should return empty array for no results', () => {
      const emptyHtml = '<table class="sportView"></table>';
      const ergebnisse = service.parseErgebnisseFromHtml(emptyHtml);
      
      expect(ergebnisse).toHaveLength(0);
    });

    it('should handle different score formats', () => {
      const ergebnisseHtml = `
        <table class="sportView">
          <tr>
            <td class="sportItemEven" align="center"><NOBR>1041</NOBR></td>
            <td class="sportItemEven" align="center"><NOBR>1</NOBR></td>
            <td class="sportItemEven"><NOBR>28.09.2025 10:00</NOBR></td>
            <td class="sportItemEven">Team A</td>
            <td class="sportItemEven">Team B</td>
            <td class="sportItemEven" align="center"><NOBR>100:99</NOBR></td>
          </tr>
        </table>
      `;
      
      const ergebnisse = service.parseErgebnisseFromHtml(ergebnisseHtml);
      
      expect(ergebnisse[0].heim_score).toBe(100);
      expect(ergebnisse[0].gast_score).toBe(99);
    });
  });

  describe('parseSpielplanHtml - Liga Name Parsing', () => {
    it('should parse liga name from sportViewTitle', () => {
      // Wird über parseLigaFromUrl getestet
      const mockUrl = 'https://www.basketball-bund.net/public/spielplan_list.jsp?liga_id=51961';
      
      // In Mock-Daten
      service.parseLigaFromUrl(mockUrl).then(result => {
        expect(result.liga.liga_name).toContain('Bezirksliga');
        expect(result.liga.liga_name).toContain('Oberpfalz');
      });
    });
  });

  describe('parseTabellenDaten - NEW: Parse und validiere Tabellen-Statistiken', () => {
    it('should parse complete tabelle with all fields', () => {
      const tabelleHtml = `
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
        </table>
      `;
      
      const tabelle = service.parseTabellenDaten(tabelleHtml);
      
      expect(tabelle).toHaveLength(1);
      expect(tabelle[0]).toMatchObject({
        rang: 1,
        team_name: 'DJK Neustadt a. d. Waldnaab 1',
        verein_name: 'DJK Neustadt a. d. Waldnaab',
        spiele: 1,
        siege: 1,
        niederlagen: 0,
        punkte: 2,
        koerbe_plus: 48,
        koerbe_minus: 19,
        diff: 29
      });
    });

    it('should parse multiple teams correctly', () => {
      const tabelleHtml = `
        <table class="sportView">
          <tr>
            <td class="sportItemEven" align="center"><NOBR>1</NOBR></td>
            <td class="sportItemEven"><NOBR>Team A</NOBR></td>
            <td class="sportItemEven" align="center"><NOBR>5</NOBR></td>
            <td class="sportItemEven" align="center"><NOBR>4/1</NOBR></td>
            <td class="sportItemEven" align="center"><NOBR>8</NOBR></td>
            <td class="sportItemEven" align="center"><NOBR>350 : 300</NOBR></td>
            <td class="sportItemEven" align="center"><NOBR>50</NOBR></td>
          </tr>
          <tr>
            <td class="sportItemOdd" align="center"><NOBR>2</NOBR></td>
            <td class="sportItemOdd"><NOBR>Team B</NOBR></td>
            <td class="sportItemOdd" align="center"><NOBR>5</NOBR></td>
            <td class="sportItemOdd" align="center"><NOBR>3/2</NOBR></td>
            <td class="sportItemOdd" align="center"><NOBR>6</NOBR></td>
            <td class="sportItemOdd" align="center"><NOBR>320 : 310</NOBR></td>
            <td class="sportItemOdd" align="center"><NOBR>10</NOBR></td>
          </tr>
        </table>
      `;
      
      const tabelle = service.parseTabellenDaten(tabelleHtml);
      
      expect(tabelle).toHaveLength(2);
      expect(tabelle[0].rang).toBe(1);
      expect(tabelle[1].rang).toBe(2);
    });

    it('should validate siege + niederlagen = spiele', () => {
      const tabelleHtml = `
        <table class="sportView">
          <tr>
            <td class="sportItemEven" align="center"><NOBR>1</NOBR></td>
            <td class="sportItemEven"><NOBR>Team A</NOBR></td>
            <td class="sportItemEven" align="center"><NOBR>10</NOBR></td>
            <td class="sportItemEven" align="center"><NOBR>7/3</NOBR></td>
            <td class="sportItemEven" align="center"><NOBR>14</NOBR></td>
            <td class="sportItemEven" align="center"><NOBR>500 : 450</NOBR></td>
            <td class="sportItemEven" align="center"><NOBR>50</NOBR></td>
          </tr>
        </table>
      `;
      
      const tabelle = service.parseTabellenDaten(tabelleHtml);
      
      expect(tabelle).toHaveLength(1);
      // Validierung: Siege + Niederlagen muss Spiele ergeben
      expect(tabelle[0].siege + tabelle[0].niederlagen).toBe(tabelle[0].spiele);
    });

    it('should validate diff = koerbe_plus - koerbe_minus', () => {
      const tabelleHtml = `
        <table class="sportView">
          <tr>
            <td class="sportItemEven" align="center"><NOBR>1</NOBR></td>
            <td class="sportItemEven"><NOBR>Team A</NOBR></td>
            <td class="sportItemEven" align="center"><NOBR>5</NOBR></td>
            <td class="sportItemEven" align="center"><NOBR>3/2</NOBR></td>
            <td class="sportItemEven" align="center"><NOBR>6</NOBR></td>
            <td class="sportItemEven" align="center"><NOBR>250 : 200</NOBR></td>
            <td class="sportItemEven" align="center"><NOBR>50</NOBR></td>
          </tr>
        </table>
      `;
      
      const tabelle = service.parseTabellenDaten(tabelleHtml);
      
      expect(tabelle).toHaveLength(1);
      // Validierung: Diff muss Körbe Plus - Körbe Minus sein
      expect(tabelle[0].diff).toBe(tabelle[0].koerbe_plus - tabelle[0].koerbe_minus);
    });

    it('should validate punkte = siege * 2', () => {
      const tabelleHtml = `
        <table class="sportView">
          <tr>
            <td class="sportItemEven" align="center"><NOBR>1</NOBR></td>
            <td class="sportItemEven"><NOBR>Team A</NOBR></td>
            <td class="sportItemEven" align="center"><NOBR>8</NOBR></td>
            <td class="sportItemEven" align="center"><NOBR>5/3</NOBR></td>
            <td class="sportItemEven" align="center"><NOBR>10</NOBR></td>
            <td class="sportItemEven" align="center"><NOBR>400 : 380</NOBR></td>
            <td class="sportItemEven" align="center"><NOBR>20</NOBR></td>
          </tr>
        </table>
      `;
      
      const tabelle = service.parseTabellenDaten(tabelleHtml);
      
      expect(tabelle).toHaveLength(1);
      // Validierung: Punkte = Siege * 2 (Basketball-Punktesystem)
      expect(tabelle[0].punkte).toBe(tabelle[0].siege * 2);
    });

    it('should handle team without games (0 spiele)', () => {
      const tabelleHtml = `
        <table class="sportView">
          <tr>
            <td class="sportItemEven" align="center"><NOBR>7</NOBR></td>
            <td class="sportItemEven"><NOBR>Regensburg Baskets 1</NOBR></td>
            <td class="sportItemEven" align="center"><NOBR>0</NOBR></td>
            <td class="sportItemEven" align="center"><NOBR>0/0</NOBR></td>
            <td class="sportItemEven" align="center"><NOBR>0</NOBR></td>
            <td class="sportItemEven" align="center"><NOBR>0 : 0</NOBR></td>
            <td class="sportItemEven" align="center"><NOBR>0</NOBR></td>
          </tr>
        </table>
      `;
      
      const tabelle = service.parseTabellenDaten(tabelleHtml);
      
      expect(tabelle).toHaveLength(1);
      expect(tabelle[0]).toMatchObject({
        rang: 7,
        spiele: 0,
        siege: 0,
        niederlagen: 0,
        punkte: 0,
        koerbe_plus: 0,
        koerbe_minus: 0,
        diff: 0
      });
    });

    it('should skip header rows', () => {
      const tabelleHtml = `
        <table class="sportView">
          <tr>
            <td class="sportViewHeader">Rang</td>
            <td class="sportViewHeader">Name</td>
            <td class="sportViewHeader">Spiele</td>
          </tr>
          <tr>
            <td class="sportItemEven" align="center"><NOBR>1</NOBR></td>
            <td class="sportItemEven"><NOBR>Team A</NOBR></td>
            <td class="sportItemEven" align="center"><NOBR>5</NOBR></td>
            <td class="sportItemEven" align="center"><NOBR>3/2</NOBR></td>
            <td class="sportItemEven" align="center"><NOBR>6</NOBR></td>
            <td class="sportItemEven" align="center"><NOBR>250 : 200</NOBR></td>
            <td class="sportItemEven" align="center"><NOBR>50</NOBR></td>
          </tr>
        </table>
      `;
      
      const tabelle = service.parseTabellenDaten(tabelleHtml);
      
      expect(tabelle).toHaveLength(1);
      expect(tabelle[0].team_name).toBe('Team A');
    });

    it('should handle negative diff correctly', () => {
      const tabelleHtml = `
        <table class="sportView">
          <tr>
            <td class="sportItemEven" align="center"><NOBR>5</NOBR></td>
            <td class="sportItemEven"><NOBR>Schwaches Team</NOBR></td>
            <td class="sportItemEven" align="center"><NOBR>5</NOBR></td>
            <td class="sportItemEven" align="center"><NOBR>1/4</NOBR></td>
            <td class="sportItemEven" align="center"><NOBR>2</NOBR></td>
            <td class="sportItemEven" align="center"><NOBR>200 : 300</NOBR></td>
            <td class="sportItemEven" align="center"><NOBR>-100</NOBR></td>
          </tr>
        </table>
      `;
      
      const tabelle = service.parseTabellenDaten(tabelleHtml);
      
      expect(tabelle).toHaveLength(1);
      expect(tabelle[0].diff).toBe(-100);
      expect(tabelle[0].koerbe_minus).toBeGreaterThan(tabelle[0].koerbe_plus);
    });

    it('should return empty array for invalid HTML', () => {
      const invalidHtml = '<div>No table here</div>';
      const tabelle = service.parseTabellenDaten(invalidHtml);
      
      expect(tabelle).toEqual([]);
    });

    it('should return empty array for empty table', () => {
      const emptyHtml = '<table class="sportView"></table>';
      const tabelle = service.parseTabellenDaten(emptyHtml);
      
      expect(tabelle).toEqual([]);
    });

    it('should handle teams with numbers in name correctly', () => {
      const tabelleHtml = `
        <table class="sportView">
          <tr>
            <td class="sportItemEven" align="center"><NOBR>1</NOBR></td>
            <td class="sportItemEven"><NOBR>TSV 1880 Schwandorf</NOBR></td>
            <td class="sportItemEven" align="center"><NOBR>3</NOBR></td>
            <td class="sportItemEven" align="center"><NOBR>2/1</NOBR></td>
            <td class="sportItemEven" align="center"><NOBR>4</NOBR></td>
            <td class="sportItemEven" align="center"><NOBR>150 : 140</NOBR></td>
            <td class="sportItemEven" align="center"><NOBR>10</NOBR></td>
          </tr>
        </table>
      `;
      
      const tabelle = service.parseTabellenDaten(tabelleHtml);
      
      expect(tabelle).toHaveLength(1);
      expect(tabelle[0].team_name).toBe('TSV 1880 Schwandorf');
      expect(tabelle[0].verein_name).toBe('TSV 1880 Schwandorf');
    });

    it('should validate all entries have consistent data', () => {
      const tabelleHtml = `
        <table class="sportView">
          <tr>
            <td class="sportItemEven" align="center"><NOBR>1</NOBR></td>
            <td class="sportItemEven"><NOBR>Team A</NOBR></td>
            <td class="sportItemEven" align="center"><NOBR>10</NOBR></td>
            <td class="sportItemEven" align="center"><NOBR>8/2</NOBR></td>
            <td class="sportItemEven" align="center"><NOBR>16</NOBR></td>
            <td class="sportItemEven" align="center"><NOBR>600 : 500</NOBR></td>
            <td class="sportItemEven" align="center"><NOBR>100</NOBR></td>
          </tr>
          <tr>
            <td class="sportItemOdd" align="center"><NOBR>2</NOBR></td>
            <td class="sportItemOdd"><NOBR>Team B</NOBR></td>
            <td class="sportItemOdd" align="center"><NOBR>10</NOBR></td>
            <td class="sportItemOdd" align="center"><NOBR>6/4</NOBR></td>
            <td class="sportItemOdd" align="center"><NOBR>12</NOBR></td>
            <td class="sportItemOdd" align="center"><NOBR>550 : 520</NOBR></td>
            <td class="sportItemOdd" align="center"><NOBR>30</NOBR></td>
          </tr>
        </table>
      `;
      
      const tabelle = service.parseTabellenDaten(tabelleHtml);
      
      // Validiere alle Einträge
      tabelle.forEach(eintrag => {
        expect(eintrag.siege + eintrag.niederlagen).toBe(eintrag.spiele);
        expect(eintrag.diff).toBe(eintrag.koerbe_plus - eintrag.koerbe_minus);
        expect(eintrag.punkte).toBe(eintrag.siege * 2);
        expect(eintrag.rang).toBeGreaterThan(0);
        expect(eintrag.team_name).toBeTruthy();
      });
    });
  });
});
