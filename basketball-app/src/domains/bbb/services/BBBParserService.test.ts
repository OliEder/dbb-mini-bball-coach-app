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
});
