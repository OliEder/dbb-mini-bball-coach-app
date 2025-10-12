/**
 * CSVImportService Tests
 * 
 * Test-Driven Development für CSV-Import
 * Nutzt echte CSV-Dateien aus test-data/csv/
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CSVImportService } from './CSVImportService';
import { db } from '@/shared/db/database';
import { v4 as uuidv4 } from 'uuid';

describe('CSVImportService', () => {
  let service: CSVImportService;
  let testTeamId: string;

  beforeEach(async () => {
    service = new CSVImportService();
    testTeamId = uuidv4();
    
    // Clean database
    await db.delete();
    await db.open();
  });

  afterEach(async () => {
    await db.delete();
  });

  describe('generateSpielerTemplate', () => {
    it('should generate valid CSV template', () => {
      const template = service.generateSpielerTemplate();

      expect(template).toBeTruthy();
      expect(template).toContain('vorname');
      expect(template).toContain('nachname');
      expect(template).toContain('geburtsdatum');
      expect(template).toContain('tna_nr');
      expect(template).toContain('konfektionsgroesse_jersey');
      expect(template).toContain('konfektionsgroesse_hose');
    });

    it('should include erziehungsberechtigte fields', () => {
      const template = service.generateSpielerTemplate();

      expect(template).toContain('erz_vorname');
      expect(template).toContain('erz_nachname');
      expect(template).toContain('erz_telefon');
      expect(template).toContain('erz_email');
    });

    it('should include example row', () => {
      const template = service.generateSpielerTemplate();
      const lines = template.split('\n');

      expect(lines.length).toBeGreaterThanOrEqual(2); // Header + Example
      expect(lines[1]).toBeTruthy(); // Example row exists
    });
  });

  describe('generateTrikotTemplate', () => {
    it('should generate valid CSV template', () => {
      const template = service.generateTrikotTemplate();

      expect(template).toBeTruthy();
      expect(template).toContain('art');
      expect(template).toContain('nummer');
      expect(template).toContain('groesse');
      expect(template).toContain('eu_groesse');
      expect(template).toContain('farbe_dunkel');
      expect(template).toContain('farbe_hell');
    });

    it('should include example rows', () => {
      const template = service.generateTrikotTemplate();
      const lines = template.split('\n');

      expect(lines.length).toBeGreaterThanOrEqual(2); // Header + Examples
      expect(lines[1]).toContain('Wendejersey');
    });

    it('should show Wendejersey and Hose examples', () => {
      const template = service.generateTrikotTemplate();

      expect(template).toContain('Wendejersey');
      expect(template).toContain('Hose');
    });
  });

  describe('importSpieler', () => {
    it('should import spieler from valid CSV', async () => {
      const csvContent = `vorname,nachname,geburtsdatum,tna_nr,konfektionsgroesse_jersey,konfektionsgroesse_hose
Max,Mustermann,2015-03-15,12345678,140,140
Lisa,Beispiel,2014-08-20,87654321,134,134`;

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const file = new File([blob], 'spieler.csv', { type: 'text/csv' });

      const result = await service.importSpieler(file, testTeamId);

      expect(result.success).toBe(true);
      expect(result.data.length).toBe(2);
      expect(result.errors.length).toBe(0);
    });

    it('should validate required fields', async () => {
      const csvContent = `vorname,nachname
,Mustermann
Max,`;

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const file = new File([blob], 'spieler.csv', { type: 'text/csv' });

      const result = await service.importSpieler(file, testTeamId);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.includes('Vorname fehlt'))).toBe(true);
      expect(result.errors.some(e => e.includes('Nachname fehlt'))).toBe(true);
    });

    it('should parse geburtsdatum correctly', async () => {
      const csvContent = `vorname,nachname,geburtsdatum
Max,Mustermann,2015-03-15`;

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const file = new File([blob], 'spieler.csv', { type: 'text/csv' });

      const result = await service.importSpieler(file, testTeamId);

      expect(result.success).toBe(true);
      expect(result.data[0].geburtsdatum).toBeInstanceOf(Date);
      expect(result.data[0].geburtsdatum?.getFullYear()).toBe(2015);
    });

    it('should warn on invalid geburtsdatum', async () => {
      const csvContent = `vorname,nachname,geburtsdatum
Max,Mustermann,invalid-date`;

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const file = new File([blob], 'spieler.csv', { type: 'text/csv' });

      const result = await service.importSpieler(file, testTeamId);

      expect(result.success).toBe(true); // Import succeeds
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('Geburtsdatum');
      expect(result.data[0].geburtsdatum).toBeUndefined();
    });

    it('should parse konfektionsgroessen as numbers', async () => {
      const csvContent = `vorname,nachname,konfektionsgroesse_jersey,konfektionsgroesse_hose
Max,Mustermann,140,140`;

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const file = new File([blob], 'spieler.csv', { type: 'text/csv' });

      const result = await service.importSpieler(file, testTeamId);

      expect(result.success).toBe(true);
      expect(result.data[0].konfektionsgroesse_jersey).toBe(140);
      expect(result.data[0].konfektionsgroesse_hose).toBe(140);
      expect(typeof result.data[0].konfektionsgroesse_jersey).toBe('number');
    });

    it('should set spieler_typ to eigenes_team', async () => {
      const csvContent = `vorname,nachname
Max,Mustermann`;

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const file = new File([blob], 'spieler.csv', { type: 'text/csv' });

      const result = await service.importSpieler(file, testTeamId);

      expect(result.data[0].spieler_typ).toBe('eigenes_team');
    });

    it('should set aktiv to true by default', async () => {
      const csvContent = `vorname,nachname
Max,Mustermann`;

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const file = new File([blob], 'spieler.csv', { type: 'text/csv' });

      const result = await service.importSpieler(file, testTeamId);

      expect(result.data[0].aktiv).toBe(true);
    });

    it('should assign correct team_id', async () => {
      const csvContent = `vorname,nachname
Max,Mustermann`;

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const file = new File([blob], 'spieler.csv', { type: 'text/csv' });

      const result = await service.importSpieler(file, testTeamId);

      expect(result.data[0].team_id).toBe(testTeamId);
    });

    it('should trim whitespace from names', async () => {
      const csvContent = `vorname,nachname
  Max  ,  Mustermann  `;

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const file = new File([blob], 'spieler.csv', { type: 'text/csv' });

      const result = await service.importSpieler(file, testTeamId);

      expect(result.data[0].vorname).toBe('Max');
      expect(result.data[0].nachname).toBe('Mustermann');
    });

    it('should handle empty optional fields', async () => {
      const csvContent = `vorname,nachname,tna_nr,konfektionsgroesse_jersey
Max,Mustermann,,`;

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const file = new File([blob], 'spieler.csv', { type: 'text/csv' });

      const result = await service.importSpieler(file, testTeamId);

      expect(result.success).toBe(true);
      expect(result.data[0].tna_nr).toBeUndefined();
      expect(result.data[0].konfektionsgroesse_jersey).toBeUndefined();
    });
  });

  describe('importSpieler - Erziehungsberechtigte', () => {
    it('should create erziehungsberechtigte when email provided', async () => {
      const csvContent = `vorname,nachname,erz_vorname,erz_nachname,erz_telefon,erz_email
Max,Mustermann,Maria,Mustermann,01701234567,maria@example.com`;

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const file = new File([blob], 'spieler.csv', { type: 'text/csv' });

      const result = await service.importSpieler(file, testTeamId);

      expect(result.success).toBe(true);
      
      // Check Erziehungsberechtigte created
      const erz = await db.erziehungsberechtigte.toArray();
      expect(erz.length).toBe(1);
      expect(erz[0].vorname).toBe('Maria');
      expect(erz[0].email).toBe('maria@example.com');
    });

    it('should warn when erziehungsberechtigte has no phone', async () => {
      const csvContent = `vorname,nachname,erz_email
Max,Mustermann,maria@example.com`;

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const file = new File([blob], 'spieler.csv', { type: 'text/csv' });

      const result = await service.importSpieler(file, testTeamId);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('Telefonnummer');
    });

    it('should reuse erziehungsberechtigte with same email', async () => {
      const csvContent = `vorname,nachname,erz_vorname,erz_nachname,erz_telefon,erz_email
Max,Mustermann,Maria,Mustermann,01701234567,maria@example.com
Lisa,Mustermann,Maria,Mustermann,01701234567,maria@example.com`;

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const file = new File([blob], 'spieler.csv', { type: 'text/csv' });

      const result = await service.importSpieler(file, testTeamId);

      expect(result.success).toBe(true);
      
      // Should have only 1 Erziehungsberechtigte (reused)
      const erz = await db.erziehungsberechtigte.toArray();
      expect(erz.length).toBe(1);

      // But 2 relationships
      const relations = await db.spieler_erziehungsberechtigte.toArray();
      expect(relations.length).toBe(2);
    });

    it('should create spieler_erziehungsberechtigte relationship', async () => {
      const csvContent = `vorname,nachname,erz_vorname,erz_nachname,erz_telefon,erz_email
Max,Mustermann,Maria,Mustermann,01701234567,maria@example.com`;

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const file = new File([blob], 'spieler.csv', { type: 'text/csv' });

      const result = await service.importSpieler(file, testTeamId);

      const relations = await db.spieler_erziehungsberechtigte.toArray();
      expect(relations.length).toBe(1);
      expect(relations[0].spieler_id).toBe(result.data[0].spieler_id);
      expect(relations[0].ist_notfallkontakt).toBe(true);
      expect(relations[0].abholberechtigt).toBe(true);
    });
  });

  describe('importTrikots', () => {
    it('should import trikots from valid CSV', async () => {
      const csvContent = `art,nummer,groesse,eu_groesse,farbe_dunkel,farbe_hell
Wendejersey,4,m,140,blau,weiß
Hose,,m,140,,`;

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const file = new File([blob], 'trikots.csv', { type: 'text/csv' });

      const result = await service.importTrikots(file, testTeamId);

      expect(result.success).toBe(true);
      expect(result.data.length).toBe(2);
      expect(result.errors.length).toBe(0);
    });

    it('should validate required art field', async () => {
      const csvContent = `art,groesse,eu_groesse
,m,140`;

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const file = new File([blob], 'trikots.csv', { type: 'text/csv' });

      const result = await service.importTrikots(file, testTeamId);

      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.includes('Art fehlt'))).toBe(true);
    });

    it('should validate art values', async () => {
      const csvContent = `art,groesse,eu_groesse
InvalidArt,m,140`;

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const file = new File([blob], 'trikots.csv', { type: 'text/csv' });

      const result = await service.importTrikots(file, testTeamId);

      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.includes('Wendejersey') || e.includes('Hose'))).toBe(true);
    });

    it('should validate groesse field', async () => {
      const csvContent = `art,groesse,eu_groesse
Wendejersey,,140`;

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const file = new File([blob], 'trikots.csv', { type: 'text/csv' });

      const result = await service.importTrikots(file, testTeamId);

      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.includes('Größe fehlt'))).toBe(true);
    });

    it('should validate eu_groesse range', async () => {
      const csvContent = `art,groesse,eu_groesse
Wendejersey,m,200`;

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const file = new File([blob], 'trikots.csv', { type: 'text/csv' });

      const result = await service.importTrikots(file, testTeamId);

      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.includes('116 und 170'))).toBe(true);
    });

    it('should parse eu_groesse as number', async () => {
      const csvContent = `art,groesse,eu_groesse
Wendejersey,m,140`;

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const file = new File([blob], 'trikots.csv', { type: 'text/csv' });

      const result = await service.importTrikots(file, testTeamId);

      expect(result.data[0].eu_groesse).toBe(140);
      expect(typeof result.data[0].eu_groesse).toBe('number');
    });

    it('should set status to verfügbar', async () => {
      const csvContent = `art,groesse,eu_groesse
Wendejersey,m,140`;

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const file = new File([blob], 'trikots.csv', { type: 'text/csv' });

      const result = await service.importTrikots(file, testTeamId);

      expect(result.data[0].status).toBe('verfügbar');
    });

    it('should handle optional nummer field', async () => {
      const csvContent = `art,nummer,groesse,eu_groesse
Wendejersey,4,m,140
Hose,,m,140`;

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const file = new File([blob], 'trikots.csv', { type: 'text/csv' });

      const result = await service.importTrikots(file, testTeamId);

      expect(result.data[0].nummer).toBe('4');
      expect(result.data[1].nummer).toBeUndefined();
    });

    it('should handle optional farbe fields', async () => {
      const csvContent = `art,groesse,eu_groesse,farbe_dunkel,farbe_hell
Wendejersey,m,140,blau,weiß
Hose,m,140,,`;

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const file = new File([blob], 'trikots.csv', { type: 'text/csv' });

      const result = await service.importTrikots(file, testTeamId);

      expect(result.data[0].farbe_dunkel).toBe('blau');
      expect(result.data[0].farbe_hell).toBe('weiß');
      expect(result.data[1].farbe_dunkel).toBeUndefined();
    });

    it('should trim whitespace', async () => {
      const csvContent = `art,nummer,groesse,eu_groesse
  Wendejersey  ,  4  ,  m  ,140`;

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const file = new File([blob], 'trikots.csv', { type: 'text/csv' });

      const result = await service.importTrikots(file, testTeamId);

      expect(result.data[0].art).toBe('Wendejersey');
      expect(result.data[0].nummer).toBe('4');
      expect(result.data[0].groesse).toBe('m');
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed CSV gracefully', async () => {
      const csvContent = `This is not a valid CSV`;

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const file = new File([blob], 'invalid.csv', { type: 'text/csv' });

      const result = await service.importSpieler(file, testTeamId);

      // Should not throw, but return error
      expect(result.success).toBeDefined();
    });

    it('should handle empty CSV file', async () => {
      const csvContent = ``;

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const file = new File([blob], 'empty.csv', { type: 'text/csv' });

      const result = await service.importSpieler(file, testTeamId);

      expect(result.data.length).toBe(0);
    });

    it('should handle CSV with only headers', async () => {
      const csvContent = `vorname,nachname`;

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const file = new File([blob], 'headers-only.csv', { type: 'text/csv' });

      const result = await service.importSpieler(file, testTeamId);

      expect(result.data.length).toBe(0);
      expect(result.success).toBe(true);
    });
  });
});
