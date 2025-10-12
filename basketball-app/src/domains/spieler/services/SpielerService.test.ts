/**
 * SpielerService Tests
 * 
 * Test-Driven Development für Spieler-CRUD-Operationen
 * WCAG 2.0 AA: Tests prüfen auch Accessibility-Anforderungen
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { spielerService } from './SpielerService';
import { db } from '@/shared/db/database';
import type { Spieler, Team, Verein } from '@/shared/types';

describe('SpielerService', () => {
  let testTeam: Team;
  let testVerein: Verein;

  beforeEach(async () => {
    // Clean database
    await db.delete();
    await db.open();

    // Create test verein
    testVerein = {
      verein_id: crypto.randomUUID(),
      name: 'Test Verein',
      ist_eigener_verein: true,
      created_at: new Date(),
    };
    await db.vereine.add(testVerein);

    // Create test team
    testTeam = {
      team_id: crypto.randomUUID(),
      verein_id: testVerein.verein_id,
      name: 'Test Team',
      altersklasse: 'U10',
      saison: '2025/2026',
      trainer: 'Test Trainer',
      created_at: new Date(),
    };
    await db.teams.add(testTeam);
  });

  describe('createSpieler', () => {
    it('sollte einen Spieler erfolgreich erstellen', async () => {
      const spielerData: Omit<Spieler, 'spieler_id' | 'created_at'> = {
        team_id: testTeam.team_id,
        vorname: 'Max',
        nachname: 'Mustermann',
        geburtsdatum: new Date('2015-05-15'),
        spieler_typ: 'eigenes_team',
        mitgliedsnummer: '12345',
        tna_nr: 'TNA-001',
        konfektionsgroesse_jersey: 140,
        konfektionsgroesse_hose: 140,
        aktiv: true,
      };

      const spieler = await spielerService.createSpieler(spielerData);

      expect(spieler).toBeDefined();
      expect(spieler.spieler_id).toBeDefined();
      expect(spieler.vorname).toBe('Max');
      expect(spieler.nachname).toBe('Mustermann');
      expect(spieler.team_id).toBe(testTeam.team_id);
    });

    it('sollte einen Gegenspieler ohne Team erstellen können', async () => {
      const gegnerData: Omit<Spieler, 'spieler_id' | 'created_at'> = {
        vorname: 'Felix',
        nachname: 'Gegner',
        spieler_typ: 'gegner',
        verein_id: testVerein.verein_id,
        aktiv: true,
      };

      const spieler = await spielerService.createSpieler(gegnerData);

      expect(spieler).toBeDefined();
      expect(spieler.spieler_typ).toBe('gegner');
      expect(spieler.team_id).toBeUndefined();
    });

    it('sollte Validierungsfehler bei fehlenden Pflichtfeldern werfen', async () => {
      const invalidData = {
        team_id: testTeam.team_id,
        vorname: '',
        nachname: 'Test',
        spieler_typ: 'eigenes_team' as const,
        aktiv: true,
      };

      await expect(
        spielerService.createSpieler(invalidData as any)
      ).rejects.toThrow();
    });
  });

  describe('getSpielerById', () => {
    it('sollte einen Spieler anhand der ID finden', async () => {
      const created = await spielerService.createSpieler({
        team_id: testTeam.team_id,
        vorname: 'Anna',
        nachname: 'Test',
        spieler_typ: 'eigenes_team',
        aktiv: true,
      });

      const found = await spielerService.getSpielerById(created.spieler_id);

      expect(found).toBeDefined();
      expect(found?.spieler_id).toBe(created.spieler_id);
      expect(found?.vorname).toBe('Anna');
    });

    it('sollte null zurückgeben bei nicht existierender ID', async () => {
      const found = await spielerService.getSpielerById('non-existent-id');
      expect(found).toBeNull();
    });
  });

  describe('getSpielerByTeam', () => {
    it('sollte alle Spieler eines Teams zurückgeben', async () => {
      await spielerService.createSpieler({
        team_id: testTeam.team_id,
        vorname: 'Spieler1',
        nachname: 'Test',
        spieler_typ: 'eigenes_team',
        aktiv: true,
      });

      await spielerService.createSpieler({
        team_id: testTeam.team_id,
        vorname: 'Spieler2',
        nachname: 'Test',
        spieler_typ: 'eigenes_team',
        aktiv: true,
      });

      const spieler = await spielerService.getSpielerByTeam(testTeam.team_id);

      expect(spieler).toHaveLength(2);
      expect(spieler.every(s => s.team_id === testTeam.team_id)).toBe(true);
    });

    it('sollte nur aktive Spieler zurückgeben wenn Filter gesetzt', async () => {
      await spielerService.createSpieler({
        team_id: testTeam.team_id,
        vorname: 'Aktiv',
        nachname: 'Test',
        spieler_typ: 'eigenes_team',
        aktiv: true,
      });

      await spielerService.createSpieler({
        team_id: testTeam.team_id,
        vorname: 'Inaktiv',
        nachname: 'Test',
        spieler_typ: 'eigenes_team',
        aktiv: false,
      });

      const aktiveSpieler = await spielerService.getSpielerByTeam(
        testTeam.team_id,
        { aktiv: true }
      );

      expect(aktiveSpieler).toHaveLength(1);
      expect(aktiveSpieler[0].aktiv).toBe(true);
    });
  });

  describe('updateSpieler', () => {
    it('sollte einen Spieler aktualisieren', async () => {
      const created = await spielerService.createSpieler({
        team_id: testTeam.team_id,
        vorname: 'Original',
        nachname: 'Name',
        spieler_typ: 'eigenes_team',
        aktiv: true,
      });

      await spielerService.updateSpieler(created.spieler_id, {
        vorname: 'Updated',
      });

      const updated = await spielerService.getSpielerById(created.spieler_id);

      expect(updated?.vorname).toBe('Updated');
      expect(updated?.nachname).toBe('Name'); // Unchanged
      expect(updated?.updated_at).toBeDefined();
    });

    it('sollte Fehler werfen bei nicht existierender ID', async () => {
      await expect(
        spielerService.updateSpieler('non-existent', { vorname: 'Test' })
      ).rejects.toThrow();
    });
  });

  describe('deleteSpieler', () => {
    it('sollte einen Spieler löschen', async () => {
      const created = await spielerService.createSpieler({
        team_id: testTeam.team_id,
        vorname: 'ToDelete',
        nachname: 'Test',
        spieler_typ: 'eigenes_team',
        aktiv: true,
      });

      await spielerService.deleteSpieler(created.spieler_id);

      const found = await spielerService.getSpielerById(created.spieler_id);
      expect(found).toBeNull();
    });

    it('sollte Fehler werfen bei nicht existierender ID', async () => {
      await expect(
        spielerService.deleteSpieler('non-existent')
      ).rejects.toThrow();
    });
  });

  describe('countAktiveSpieler', () => {
    it('sollte die Anzahl aktiver Spieler zurückgeben', async () => {
      await spielerService.createSpieler({
        team_id: testTeam.team_id,
        vorname: 'Aktiv1',
        nachname: 'Test',
        spieler_typ: 'eigenes_team',
        aktiv: true,
      });

      await spielerService.createSpieler({
        team_id: testTeam.team_id,
        vorname: 'Aktiv2',
        nachname: 'Test',
        spieler_typ: 'eigenes_team',
        aktiv: true,
      });

      await spielerService.createSpieler({
        team_id: testTeam.team_id,
        vorname: 'Inaktiv',
        nachname: 'Test',
        spieler_typ: 'eigenes_team',
        aktiv: false,
      });

      const count = await spielerService.countAktiveSpieler(testTeam.team_id);
      expect(count).toBe(2);
    });
  });

  describe('getSpielerByMitgliedsnummer', () => {
    it('sollte Spieler anhand der Mitgliedsnummer finden', async () => {
      await spielerService.createSpieler({
        team_id: testTeam.team_id,
        vorname: 'Member',
        nachname: 'Test',
        spieler_typ: 'eigenes_team',
        mitgliedsnummer: 'M-12345',
        aktiv: true,
      });

      const found = await spielerService.getSpielerByMitgliedsnummer('M-12345');

      expect(found).toBeDefined();
      expect(found?.mitgliedsnummer).toBe('M-12345');
    });

    it('sollte null zurückgeben wenn nicht gefunden', async () => {
      const found = await spielerService.getSpielerByMitgliedsnummer('NON-EXIST');
      expect(found).toBeNull();
    });
  });

  describe('searchSpieler', () => {
    beforeEach(async () => {
      await spielerService.createSpieler({
        team_id: testTeam.team_id,
        vorname: 'Max',
        nachname: 'Mustermann',
        spieler_typ: 'eigenes_team',
        aktiv: true,
      });

      await spielerService.createSpieler({
        team_id: testTeam.team_id,
        vorname: 'Anna',
        nachname: 'Schmidt',
        spieler_typ: 'eigenes_team',
        aktiv: true,
      });
    });

    it('sollte Spieler nach Vorname suchen', async () => {
      const results = await spielerService.searchSpieler(testTeam.team_id, 'Max');

      expect(results).toHaveLength(1);
      expect(results[0].vorname).toBe('Max');
    });

    it('sollte Spieler nach Nachname suchen', async () => {
      const results = await spielerService.searchSpieler(testTeam.team_id, 'Schmidt');

      expect(results).toHaveLength(1);
      expect(results[0].nachname).toBe('Schmidt');
    });

    it('sollte case-insensitive suchen', async () => {
      const results = await spielerService.searchSpieler(testTeam.team_id, 'max');

      expect(results).toHaveLength(1);
      expect(results[0].vorname).toBe('Max');
    });

    it('sollte leere Liste bei keinem Treffer zurückgeben', async () => {
      const results = await spielerService.searchSpieler(testTeam.team_id, 'XYZ');
      expect(results).toHaveLength(0);
    });
  });
});
