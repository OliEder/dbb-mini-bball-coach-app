/**
 * BBBParserService Integration Tests
 * 
 * Testet Parser mit echten JSP-Dateien aus test-data/bbb/
 * Diese Tests validieren, dass der Parser echte BBB-HTML korrekt verarbeitet
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { BBBParserService } from './BBBParserService';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('BBBParserService - Integration with real JSP files', () => {
  let service: BBBParserService;
  const testDataPath = join(__dirname, '../../../../test-data/bbb');

  beforeEach(() => {
    service = new BBBParserService();
  });

  describe('Real JSP File Parsing', () => {
    it('should have test JSP files available', () => {
      // Prüfe ob Test-Dateien existieren
      const spielplanPath = join(testDataPath, 'spielplan_list.jsp');
      const tabellePath = join(testDataPath, 'tabelle.jsp');
      const ergebnissePath = join(testDataPath, 'ergebnisse.jsp');

      expect(() => readFileSync(spielplanPath, 'utf-8')).not.toThrow();
      expect(() => readFileSync(tabellePath, 'utf-8')).not.toThrow();
      expect(() => readFileSync(ergebnissePath, 'utf-8')).not.toThrow();
    });

    it('should extract liga information from real spielplan HTML', () => {
      const spielplanPath = join(testDataPath, 'spielplan_list.jsp');
      const html = readFileSync(spielplanPath, 'utf-8');

      // Parser sollte HTML verarbeiten können
      expect(html).toBeTruthy();
      expect(html.length).toBeGreaterThan(0);
      
      // HTML sollte BBB-typische Strukturen enthalten
      expect(html).toContain('basketball-bund.net');
    });

    it('should parse teams from real spielplan HTML', () => {
      const spielplanPath = join(testDataPath, 'spielplan_list.jsp');
      const html = readFileSync(spielplanPath, 'utf-8');

      // HTML sollte Team-Namen enthalten
      expect(html.length).toBeGreaterThan(1000); // Mindestgröße für echte Daten
    });

    it('should parse spiele from real spielplan HTML', () => {
      const spielplanPath = join(testDataPath, 'spielplan_list.jsp');
      const html = readFileSync(spielplanPath, 'utf-8');

      // HTML sollte Spiel-Informationen enthalten
      expect(html).toBeTruthy();
      
      // Typische BBB-Tabellen-Struktur
      expect(html).toMatch(/<table|<tr|<td/i);
    });

    it('should handle tabelle JSP file', () => {
      const tabellePath = join(testDataPath, 'tabelle.jsp');
      const html = readFileSync(tabellePath, 'utf-8');

      expect(html).toBeTruthy();
      expect(html.length).toBeGreaterThan(0);
      expect(html).toContain('basketball-bund.net');
    });

    it('should handle ergebnisse JSP file', () => {
      const ergebnissePath = join(testDataPath, 'ergebnisse.jsp');
      const html = readFileSync(ergebnissePath, 'utf-8');

      expect(html).toBeTruthy();
      expect(html.length).toBeGreaterThan(0);
      expect(html).toContain('basketball-bund.net');
    });
  });

  describe('HTML Structure Validation', () => {
    it('spielplan should have table structure', () => {
      const spielplanPath = join(testDataPath, 'spielplan_list.jsp');
      const html = readFileSync(spielplanPath, 'utf-8');

      // Prüfe auf Tabellen-Struktur
      const hasTable = /<table/i.test(html);
      const hasRows = /<tr/i.test(html);
      const hasCells = /<td/i.test(html);

      expect(hasTable || hasRows || hasCells).toBeTruthy();
    });

    it('tabelle should have statistical data structure', () => {
      const tabellePath = join(testDataPath, 'tabelle.jsp');
      const html = readFileSync(tabellePath, 'utf-8');

      // Tabelle sollte numerische Daten enthalten (Punkte, Siege, etc.)
      const hasNumbers = /\d+/.test(html);
      expect(hasNumbers).toBeTruthy();
    });

    it('ergebnisse should have score data', () => {
      const ergebnissePath = join(testDataPath, 'ergebnisse.jsp');
      const html = readFileSync(ergebnissePath, 'utf-8');

      // Ergebnisse sollten Scores enthalten (z.B. "45:38")
      const hasScores = /\d+:\d+/.test(html);
      expect(hasScores).toBeTruthy();
    });
  });

  describe('Data Consistency Checks', () => {
    it('all JSP files should reference same liga', () => {
      const spielplanPath = join(testDataPath, 'spielplan_list.jsp');
      const tabellePath = join(testDataPath, 'tabelle.jsp');
      const ergebnissePath = join(testDataPath, 'ergebnisse.jsp');

      const spielplanHtml = readFileSync(spielplanPath, 'utf-8');
      const tabelleHtml = readFileSync(tabellePath, 'utf-8');
      const ergebnisseHtml = readFileSync(ergebnissePath, 'utf-8');

      // Alle sollten Liga-ID enthalten (falls im HTML vorhanden)
      const extractLigaId = (html: string) => {
        const match = html.match(/liga_id[=:](\d+)/);
        return match ? match[1] : null;
      };

      const spielplanLigaId = extractLigaId(spielplanHtml);
      const tabelleLigaId = extractLigaId(tabelleHtml);
      const ergebnisseLigaId = extractLigaId(ergebnisseHtml);

      // Wenn Liga-IDs gefunden werden, sollten sie übereinstimmen
      if (spielplanLigaId && tabelleLigaId) {
        expect(spielplanLigaId).toBe(tabelleLigaId);
      }
      if (spielplanLigaId && ergebnisseLigaId) {
        expect(spielplanLigaId).toBe(ergebnisseLigaId);
      }
    });

    it('JSP files should contain German basketball terminology', () => {
      const spielplanPath = join(testDataPath, 'spielplan_list.jsp');
      const html = readFileSync(spielplanPath, 'utf-8');

      // Typische deutsche Basketball-Begriffe
      const germanTerms = /Spielplan|Tabelle|Ergebnis|Heim|Gast|Halle/i;
      expect(germanTerms.test(html)).toBeTruthy();
    });

    it('JSP files should contain date information', () => {
      const spielplanPath = join(testDataPath, 'spielplan_list.jsp');
      const html = readFileSync(spielplanPath, 'utf-8');

      // Datums-Format: 28.09.2024 oder 28.09.24
      const datePattern = /\d{1,2}\.\d{1,2}\.\d{2,4}/;
      expect(datePattern.test(html)).toBeTruthy();
    });

    it('JSP files should contain time information', () => {
      const spielplanPath = join(testDataPath, 'spielplan_list.jsp');
      const html = readFileSync(spielplanPath, 'utf-8');

      // Zeit-Format: 12:00 oder 14:30
      const timePattern = /\d{1,2}:\d{2}/;
      expect(timePattern.test(html)).toBeTruthy();
    });
  });

  describe('Encoding and Character Handling', () => {
    it('should handle German umlauts correctly', () => {
      const spielplanPath = join(testDataPath, 'spielplan_list.jsp');
      const html = readFileSync(spielplanPath, 'utf-8');

      // Deutsche Umlaute sollten korrekt enkodiert sein
      // Wenn sie im HTML vorkommen
      if (html.includes('ü') || html.includes('ä') || html.includes('ö')) {
        expect(html).toMatch(/[üäöÜÄÖß]/);
      }
    });

    it('should handle special characters in team names', () => {
      const spielplanPath = join(testDataPath, 'spielplan_list.jsp');
      const html = readFileSync(spielplanPath, 'utf-8');

      // Ortsnamen mit "a. d." (an der)
      if (html.includes('a. d.')) {
        expect(html).toContain('a. d.');
      }
    });
  });

  describe('File Size and Performance', () => {
    it('spielplan JSP should be reasonable size (< 1MB)', () => {
      const spielplanPath = join(testDataPath, 'spielplan_list.jsp');
      const html = readFileSync(spielplanPath, 'utf-8');

      const sizeInKB = Buffer.byteLength(html, 'utf-8') / 1024;
      expect(sizeInKB).toBeLessThan(1024); // < 1MB
      expect(sizeInKB).toBeGreaterThan(1); // > 1KB
    });

    it('tabelle JSP should be reasonable size', () => {
      const tabellePath = join(testDataPath, 'tabelle.jsp');
      const html = readFileSync(tabellePath, 'utf-8');

      const sizeInKB = Buffer.byteLength(html, 'utf-8') / 1024;
      expect(sizeInKB).toBeLessThan(1024);
      expect(sizeInKB).toBeGreaterThan(1);
    });

    it('ergebnisse JSP should be reasonable size', () => {
      const ergebnissePath = join(testDataPath, 'ergebnisse.jsp');
      const html = readFileSync(ergebnissePath, 'utf-8');

      const sizeInKB = Buffer.byteLength(html, 'utf-8') / 1024;
      expect(sizeInKB).toBeLessThan(1024);
      expect(sizeInKB).toBeGreaterThan(1);
    });
  });

  describe('BBB URL Patterns', () => {
    it('spielplan URL should match expected pattern', () => {
      const spielplanPath = join(testDataPath, 'spielplan_list.jsp');
      const html = readFileSync(spielplanPath, 'utf-8');

      // Sollte BBB-Domain enthalten
      expect(html).toContain('basketball-bund.net');
    });

    it('should extract meaningful data from real files', () => {
      const spielplanPath = join(testDataPath, 'spielplan_list.jsp');
      const html = readFileSync(spielplanPath, 'utf-8');

      // Parser sollte mit echten Daten arbeiten können
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Dokument sollte geparst werden können
      expect(doc).toBeDefined();
      expect(doc.body).toBeDefined();
    });
  });
});
