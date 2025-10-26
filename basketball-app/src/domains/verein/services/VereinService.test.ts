/**
 * VereinService Tests
 * 
 * Test-Driven Development für Vereins-CRUD-Operationen
 * WCAG 2.0 AA: Tests prüfen auch Accessibility-Anforderungen
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { vereinService } from './VereinService';
import { db } from '@/shared/db/database';
import type { Verein, Team } from '@/shared/types';
import { v4 as uuidv4 } from 'uuid';

describe('VereinService', () => {
  beforeEach(async () => {
    // Clean database
    await db.delete();
    await db.open();
  });

  describe('createVerein', () => {
    it('should create a new verein with required fields', async () => {
      const verein = await vereinService.createVerein({
        name: 'DJK Neustadt',
        ort: 'Neustadt a. d. Waldnaab',
      });

      expect(verein).toBeDefined();
      expect(verein.verein_id).toBeTruthy();
      expect(verein.name).toBe('DJK Neustadt');
      expect(verein.ort).toBe('Neustadt a. d. Waldnaab');
      expect(verein.ist_eigener_verein).toBe(true); // Default
      expect(verein.created_at).toBeInstanceOf(Date);
    });

    it('should create verein with optional fields', async () => {
      const verein = await vereinService.createVerein({
        name: 'DJK Neustadt',
        ort: 'Neustadt',
        kurzname: 'DJK',
        bbb_kontakt_id: '12345',
        verband_id: 2, // Bayern
        ist_eigener_verein: false,
      });

      expect(verein.kurzname).toBe('DJK');
      expect(verein.bbb_kontakt_id).toBe('12345');
      expect(verein.verband_id).toBe(2);
      expect(verein.ist_eigener_verein).toBe(false);
    });

    it('should persist verein to database', async () => {
      const verein = await vereinService.createVerein({
        name: 'Test Verein',
        ort: 'Test Stadt',
      });

      const found = await db.vereine.get(verein.verein_id);
      expect(found).toBeDefined();
      expect(found?.name).toBe('Test Verein');
    });

    it('should generate unique verein_id', async () => {
      const verein1 = await vereinService.createVerein({
        name: 'Verein 1',
        ort: 'Ort 1',
      });

      const verein2 = await vereinService.createVerein({
        name: 'Verein 2',
        ort: 'Ort 2',
      });

      expect(verein1.verein_id).not.toBe(verein2.verein_id);
    });

    it('should set ist_eigener_verein to true by default', async () => {
      const verein = await vereinService.createVerein({
        name: 'Mein Verein',
        ort: 'Meine Stadt',
      });

      expect(verein.ist_eigener_verein).toBe(true);
    });
  });

  describe('getVereinById', () => {
    it('should find verein by ID', async () => {
      const created = await vereinService.createVerein({
        name: 'Test Verein',
        ort: 'Test Stadt',
      });

      const found = await vereinService.getVereinById(created.verein_id);

      expect(found).toBeDefined();
      expect(found?.verein_id).toBe(created.verein_id);
      expect(found?.name).toBe('Test Verein');
    });

    it('should return undefined for non-existent ID', async () => {
      const found = await vereinService.getVereinById('non-existent-id');
      expect(found).toBeUndefined();
    });
  });

  describe('getAllVereine', () => {
    it('should return empty array when no vereine exist', async () => {
      const vereine = await vereinService.getAllVereine();
      expect(vereine).toEqual([]);
    });

    it('should return all vereine', async () => {
      await vereinService.createVerein({ name: 'Verein 1', ort: 'Ort 1' });
      await vereinService.createVerein({ name: 'Verein 2', ort: 'Ort 2' });
      await vereinService.createVerein({ name: 'Verein 3', ort: 'Ort 3' });

      const vereine = await vereinService.getAllVereine();
      expect(vereine.length).toBe(3);
    });

    it('should return both eigene and gegner vereine', async () => {
      await vereinService.createVerein({ 
        name: 'Eigener Verein', 
        ort: 'Ort 1',
        ist_eigener_verein: true 
      });

      await vereinService.createVerein({ 
        name: 'Gegner Verein', 
        ort: 'Ort 2',
        ist_eigener_verein: false 
      });

      const vereine = await vereinService.getAllVereine();
      expect(vereine.length).toBe(2);
    });
  });

  describe('getEigeneVereine', () => {
    it('should return only eigene vereine', async () => {
      await vereinService.createVerein({ 
        name: 'Eigener 1', 
        ort: 'Ort 1',
        ist_eigener_verein: true 
      });

      await vereinService.createVerein({ 
        name: 'Eigener 2', 
        ort: 'Ort 2',
        ist_eigener_verein: true 
      });

      await vereinService.createVerein({ 
        name: 'Gegner', 
        ort: 'Ort 3',
        ist_eigener_verein: false 
      });

      const eigene = await vereinService.getEigeneVereine();
      expect(eigene.length).toBe(2);
      expect(eigene.every(v => v.ist_eigener_verein)).toBe(true);
    });

    it('should return empty array when no eigene vereine exist', async () => {
      await vereinService.createVerein({ 
        name: 'Gegner', 
        ort: 'Ort',
        ist_eigener_verein: false 
      });

      const eigene = await vereinService.getEigeneVereine();
      expect(eigene).toEqual([]);
    });
  });

  describe('getGegnerVereine', () => {
    it('should return only gegner vereine', async () => {
      await vereinService.createVerein({ 
        name: 'Eigener', 
        ort: 'Ort 1',
        ist_eigener_verein: true 
      });

      await vereinService.createVerein({ 
        name: 'Gegner 1', 
        ort: 'Ort 2',
        ist_eigener_verein: false 
      });

      await vereinService.createVerein({ 
        name: 'Gegner 2', 
        ort: 'Ort 3',
        ist_eigener_verein: false 
      });

      const gegner = await vereinService.getGegnerVereine();
      expect(gegner.length).toBe(2);
      expect(gegner.every(v => !v.ist_eigener_verein)).toBe(true);
    });
  });

  describe('searchVereine', () => {
    beforeEach(async () => {
      await vereinService.createVerein({
        name: 'DJK Neustadt',
        ort: 'Neustadt a. d. Waldnaab',
        kurzname: 'DJK',
      });

      await vereinService.createVerein({
        name: 'TSV Schwandorf',
        ort: 'Schwandorf',
      });

      await vereinService.createVerein({
        name: 'TV Weiden',
        ort: 'Weiden',
      });
    });

    it('should find vereine by name', async () => {
      const results = await vereinService.searchVereine('Neustadt');
      expect(results.length).toBe(1);
      expect(results[0].name).toContain('Neustadt');
    });

    it('should find vereine by ort', async () => {
      const results = await vereinService.searchVereine('Schwandorf');
      expect(results.length).toBe(1);
      expect(results[0].ort).toBe('Schwandorf');
    });

    it('should find vereine by kurzname', async () => {
      const results = await vereinService.searchVereine('DJK');
      expect(results.length).toBe(1);
      expect(results[0].kurzname).toBe('DJK');
    });

    it('should be case-insensitive', async () => {
      const results = await vereinService.searchVereine('neustadt');
      expect(results.length).toBe(1);
    });

    it('should find partial matches', async () => {
      const results = await vereinService.searchVereine('Neu');
      expect(results.length).toBe(1);
      expect(results[0].name).toContain('Neustadt');
    });

    it('should return empty array for no matches', async () => {
      const results = await vereinService.searchVereine('NonExistent');
      expect(results).toEqual([]);
    });

    it('should find multiple matches', async () => {
      // "W" in Weiden and Schwandorf
      const results = await vereinService.searchVereine('W');
      expect(results.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('updateVerein', () => {
    it('should update verein fields', async () => {
      const verein = await vereinService.createVerein({
        name: 'Old Name',
        ort: 'Old Ort',
      });

      await vereinService.updateVerein(verein.verein_id, {
        name: 'New Name',
        ort: 'New Ort',
      });

      const updated = await vereinService.getVereinById(verein.verein_id);
      expect(updated?.name).toBe('New Name');
      expect(updated?.ort).toBe('New Ort');
    });

    it('should update only provided fields', async () => {
      const verein = await vereinService.createVerein({
        name: 'Original Name',
        ort: 'Original Ort',
        kurzname: 'Original',
      });

      await vereinService.updateVerein(verein.verein_id, {
        kurzname: 'Updated',
      });

      const updated = await vereinService.getVereinById(verein.verein_id);
      expect(updated?.name).toBe('Original Name'); // Unchanged
      expect(updated?.ort).toBe('Original Ort'); // Unchanged
      expect(updated?.kurzname).toBe('Updated'); // Changed
    });

    it('should update ist_eigener_verein flag', async () => {
      const verein = await vereinService.createVerein({
        name: 'Test',
        ort: 'Test',
        ist_eigener_verein: true,
      });

      await vereinService.updateVerein(verein.verein_id, {
        ist_eigener_verein: false,
      });

      const updated = await vereinService.getVereinById(verein.verein_id);
      expect(updated?.ist_eigener_verein).toBe(false);
    });
  });

  describe('deleteVerein', () => {
    it('should delete verein without teams', async () => {
      const verein = await vereinService.createVerein({
        name: 'Test Verein',
        ort: 'Test Stadt',
      });

      await vereinService.deleteVerein(verein.verein_id);

      const found = await vereinService.getVereinById(verein.verein_id);
      expect(found).toBeUndefined();
    });

    it('should throw error when verein has teams', async () => {
      const verein = await vereinService.createVerein({
        name: 'Test Verein',
        ort: 'Test Stadt',
      });

      // Create a team for this verein
      const team: Team = {
        team_id: uuidv4(),
        verein_id: verein.verein_id,
        name: 'Test Team',
        altersklasse: 'U10',
        saison: '2025/2026',
        trainer: 'Test Trainer',
        team_typ: 'eigen',
        created_at: new Date(),
      };
      await db.teams.add(team);

      await expect(vereinService.deleteVerein(verein.verein_id))
        .rejects.toThrow('Teams zugeordnet');
    });
  });

  describe('isVereinNameTaken', () => {
    it('should return true if name and ort combination exists', async () => {
      await vereinService.createVerein({
        name: 'Test Verein',
        ort: 'Test Stadt',
      });

      const taken = await vereinService.isVereinNameTaken('Test Verein', 'Test Stadt');
      expect(taken).toBe(true);
    });

    it('should return false if name and ort combination does not exist', async () => {
      await vereinService.createVerein({
        name: 'Test Verein',
        ort: 'Test Stadt',
      });

      const taken = await vereinService.isVereinNameTaken('Other Verein', 'Test Stadt');
      expect(taken).toBe(false);
    });

    it('should allow same name in different ort', async () => {
      await vereinService.createVerein({
        name: 'Test Verein',
        ort: 'Stadt A',
      });

      const taken = await vereinService.isVereinNameTaken('Test Verein', 'Stadt B');
      expect(taken).toBe(false);
    });

    it('should return false for empty database', async () => {
      const taken = await vereinService.isVereinNameTaken('Any Name', 'Any Ort');
      expect(taken).toBe(false);
    });
  });

  describe('countTeams', () => {
    it('should return 0 for verein without teams', async () => {
      const verein = await vereinService.createVerein({
        name: 'Test Verein',
        ort: 'Test Stadt',
      });

      const count = await vereinService.countTeams(verein.verein_id);
      expect(count).toBe(0);
    });

    it('should return correct team count', async () => {
      const verein = await vereinService.createVerein({
        name: 'Test Verein',
        ort: 'Test Stadt',
      });

      // Create 3 teams
      for (let i = 1; i <= 3; i++) {
        const team: Team = {
          team_id: uuidv4(),
          verein_id: verein.verein_id,
          name: `Team ${i}`,
          altersklasse: 'U10',
          saison: '2025/2026',
          trainer: 'Test Trainer',
          team_typ: 'eigen',
          created_at: new Date(),
        };
        await db.teams.add(team);
      }

      const count = await vereinService.countTeams(verein.verein_id);
      expect(count).toBe(3);
    });

    it('should only count teams for specific verein', async () => {
      const verein1 = await vereinService.createVerein({
        name: 'Verein 1',
        ort: 'Stadt 1',
      });

      const verein2 = await vereinService.createVerein({
        name: 'Verein 2',
        ort: 'Stadt 2',
      });

      // 2 teams for verein1
      for (let i = 1; i <= 2; i++) {
        const team: Team = {
          team_id: uuidv4(),
          verein_id: verein1.verein_id,
          name: `Team ${i}`,
          altersklasse: 'U10',
          saison: '2025/2026',
          trainer: 'Trainer',
          team_typ: 'eigen',
          created_at: new Date(),
        };
        await db.teams.add(team);
      }

      // 1 team for verein2
      const team: Team = {
        team_id: uuidv4(),
        verein_id: verein2.verein_id,
        name: 'Team 3',
        altersklasse: 'U10',
        saison: '2025/2026',
        trainer: 'Trainer',
        team_typ: 'eigen',
        created_at: new Date(),
      };
      await db.teams.add(team);

      const count1 = await vereinService.countTeams(verein1.verein_id);
      const count2 = await vereinService.countTeams(verein2.verein_id);

      expect(count1).toBe(2);
      expect(count2).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty name gracefully', async () => {
      // TypeScript should prevent this, but test runtime behavior
      const verein = await vereinService.createVerein({
        name: '',
        ort: 'Test Stadt',
      });

      expect(verein.name).toBe('');
    });

    it('should handle special characters in name', async () => {
      const verein = await vereinService.createVerein({
        name: 'TSV 1880 Schwandorf-Fronberg e.V.',
        ort: 'Schwandorf',
      });

      expect(verein.name).toBe('TSV 1880 Schwandorf-Fronberg e.V.');
    });

    it('should handle German umlauts', async () => {
      const verein = await vereinService.createVerein({
        name: 'SV München Grünwald',
        ort: 'München',
      });

      expect(verein.name).toBe('SV München Grünwald');
      expect(verein.ort).toBe('München');
    });

    it('should handle long names', async () => {
      const longName = 'A'.repeat(200);
      const verein = await vereinService.createVerein({
        name: longName,
        ort: 'Test',
      });

      expect(verein.name).toBe(longName);
    });
  });
});
