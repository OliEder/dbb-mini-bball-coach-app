/**
 * SpielService Tests
 * 
 * Test-Driven Development für Spiel-CRUD-Operationen
 * WCAG 2.0 AA: Tests prüfen auch Accessibility-Anforderungen
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { spielService } from './SpielService';
import { db } from '@/shared/db/database';
import type { Spiel, Team, Verein, Spielplan, Halle } from '@/shared/types';

describe('SpielService', () => {
  let testTeam: Team;
  let gegnerTeam: Team;
  let testVerein: Verein;
  let gegnerVerein: Verein;
  let testSpielplan: Spielplan;
  let testHalle: Halle;

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

    // Create gegner verein
    gegnerVerein = {
      verein_id: crypto.randomUUID(),
      name: 'Gegner Verein',
      ist_eigener_verein: false,
      created_at: new Date(),
    };
    await db.vereine.add(gegnerVerein);

    // Create test team
    testTeam = {
      team_id: crypto.randomUUID(),
      verein_id: testVerein.verein_id,
      name: 'Test Team',
      altersklasse: 'U10',
      saison: '2025/2026',
      trainer: 'Test Trainer',
      team_typ: 'eigen',
      created_at: new Date(),
    };
    await db.teams.add(testTeam);

    // Create gegner team
    gegnerTeam = {
      team_id: crypto.randomUUID(),
      verein_id: gegnerVerein.verein_id,
      name: 'Gegner Team',
      altersklasse: 'U10',
      saison: '2025/2026',
      trainer: 'Gegner Trainer',
      team_typ: 'gegner',
      created_at: new Date(),
    };
    await db.teams.add(gegnerTeam);

    // Create test spielplan
    testSpielplan = {
      spielplan_id: crypto.randomUUID(),
      team_id: testTeam.team_id,
      saison: '2025/2026',
      liga: 'Bezirksliga Oberpfalz',
      altersklasse: 'U10',
      created_at: new Date(),
    };
    await db.spielplaene.add(testSpielplan);

    // Create test halle
    testHalle = {
      halle_id: crypto.randomUUID(),
      name: 'Test Halle',
      strasse: 'Teststraße 1',
      plz: '12345',
      ort: 'Teststadt',
      created_at: new Date(),
    };
    await db.hallen.add(testHalle);
  });

  describe('createSpiel', () => {
    it('sollte ein Heimspiel erfolgreich erstellen', async () => {
      const spielData: Omit<Spiel, 'spiel_id' | 'created_at'> = {
        spielplan_id: testSpielplan.spielplan_id,
        heim_team_id: testTeam.team_id,  // ✅ v6.0: Heimteam-ID
        gast_team_id: gegnerTeam.team_id, // ✅ v6.0: Gastteam-ID
        spielnr: 1,
        spieltag: 1,
        datum: new Date('2025-11-15'),
        uhrzeit: '14:00',
        heim: testTeam.name,
        gast: 'Gegner Team',
        halle_id: testHalle.halle_id,
        ist_heimspiel: true,
        status: 'geplant',
        altersklasse: 'U10',
      };

      const spiel = await spielService.createSpiel(spielData);

      expect(spiel).toBeDefined();
      expect(spiel.spiel_id).toBeDefined();
      expect(spiel.ist_heimspiel).toBe(true);
      expect(spiel.status).toBe('geplant');
    });

    it('sollte ein Auswärtsspiel erstellen können', async () => {
      const spielData: Omit<Spiel, 'spiel_id' | 'created_at'> = {
        heim_team_id: gegnerTeam.team_id, // ✅ v6.0: Gastgeber ist Gegner
        gast_team_id: testTeam.team_id,   // ✅ v6.0: Wir sind Gast
        datum: new Date('2025-11-22'),
        uhrzeit: '16:00',
        heim: 'Gegner Team',
        gast: testTeam.name,
        ist_heimspiel: false,
        status: 'geplant',
        altersklasse: 'U10',
      };

      const spiel = await spielService.createSpiel(spielData);

      expect(spiel).toBeDefined();
      expect(spiel.ist_heimspiel).toBe(false);
    });

    it('sollte Validierungsfehler bei fehlenden Pflichtfeldern werfen', async () => {
      const invalidData = {
        // ❌ Keine heim_team_id oder gast_team_id!
        datum: new Date(),
        heim: '',
        gast: 'Test',
        ist_heimspiel: true,
        status: 'geplant' as const,
        altersklasse: 'U10' as const,
      };

      await expect(
        spielService.createSpiel(invalidData as any)
      ).rejects.toThrow();
    });
  });

  describe('getSpielById', () => {
    it('sollte ein Spiel anhand der ID finden', async () => {
      const created = await spielService.createSpiel({
        heim_team_id: testTeam.team_id,
        gast_team_id: gegnerTeam.team_id,
        datum: new Date('2025-11-15'),
        heim: testTeam.name,
        gast: 'Gegner',
        ist_heimspiel: true,
        status: 'geplant',
        altersklasse: 'U10',
      });

      const found = await spielService.getSpielById(created.spiel_id);

      expect(found).toBeDefined();
      expect(found?.spiel_id).toBe(created.spiel_id);
    });

    it('sollte null zurückgeben bei nicht existierender ID', async () => {
      const found = await spielService.getSpielById('non-existent-id');
      expect(found).toBeNull();
    });
  });

  describe('getSpieleByTeam', () => {
    it('sollte alle Spiele eines Teams zurückgeben', async () => {
      await spielService.createSpiel({
        heim_team_id: testTeam.team_id,
        gast_team_id: gegnerTeam.team_id,
        datum: new Date('2025-11-15'),
        heim: testTeam.name,
        gast: 'Gegner 1',
        ist_heimspiel: true,
        status: 'geplant',
        altersklasse: 'U10',
      });

      await spielService.createSpiel({
        heim_team_id: gegnerTeam.team_id,
        gast_team_id: testTeam.team_id,
        datum: new Date('2025-11-22'),
        heim: 'Gegner 2',
        gast: testTeam.name,
        ist_heimspiel: false,
        status: 'geplant',
        altersklasse: 'U10',
      });

      const spiele = await spielService.getSpieleByTeam(testTeam.team_id);

      expect(spiele).toHaveLength(2);
    });

    it('sollte nur Heimspiele zurückgeben wenn Filter gesetzt', async () => {
      await spielService.createSpiel({
        heim_team_id: testTeam.team_id,
        gast_team_id: gegnerTeam.team_id,
        datum: new Date('2025-11-15'),
        heim: testTeam.name,
        gast: 'Gegner 1',
        ist_heimspiel: true,
        status: 'geplant',
        altersklasse: 'U10',
      });

      await spielService.createSpiel({
        heim_team_id: gegnerTeam.team_id,
        gast_team_id: testTeam.team_id,
        datum: new Date('2025-11-22'),
        heim: 'Gegner 2',
        gast: testTeam.name,
        ist_heimspiel: false,
        status: 'geplant',
        altersklasse: 'U10',
      });

      const heimspiele = await spielService.getSpieleByTeam(testTeam.team_id, {
        ist_heimspiel: true,
      });

      expect(heimspiele).toHaveLength(1);
      expect(heimspiele[0].ist_heimspiel).toBe(true);
    });

    it('sollte nach Status filtern', async () => {
      await spielService.createSpiel({
        heim_team_id: testTeam.team_id,
        gast_team_id: gegnerTeam.team_id,
        datum: new Date('2025-11-15'),
        heim: testTeam.name,
        gast: 'Gegner',
        ist_heimspiel: true,
        status: 'geplant',
        altersklasse: 'U10',
      });

      await spielService.createSpiel({
        heim_team_id: testTeam.team_id,
        gast_team_id: gegnerTeam.team_id,
        datum: new Date('2025-10-01'),
        heim: testTeam.name,
        gast: 'Gegner 2',
        ist_heimspiel: true,
        status: 'abgeschlossen',
        altersklasse: 'U10',
        ergebnis_heim: 45,
        ergebnis_gast: 38,
      });

      const geplant = await spielService.getSpieleByTeam(testTeam.team_id, {
        status: 'geplant',
      });

      expect(geplant).toHaveLength(1);
      expect(geplant[0].status).toBe('geplant');
    });
  });

  describe('getNextSpiel', () => {
    it('sollte das nächste anstehende Spiel zurückgeben', async () => {
      const now = new Date();
      const future1 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // +7 Tage
      const future2 = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // +14 Tage

      await spielService.createSpiel({
        heim_team_id: testTeam.team_id,
        gast_team_id: gegnerTeam.team_id,
        datum: future2,
        heim: testTeam.name,
        gast: 'Gegner 2',
        ist_heimspiel: true,
        status: 'geplant',
        altersklasse: 'U10',
      });

      const nextSpiel = await spielService.createSpiel({
        heim_team_id: testTeam.team_id,
        gast_team_id: gegnerTeam.team_id,
        datum: future1,
        heim: testTeam.name,
        gast: 'Gegner 1',
        ist_heimspiel: true,
        status: 'geplant',
        altersklasse: 'U10',
      });

      const result = await spielService.getNextSpiel(testTeam.team_id);

      expect(result).toBeDefined();
      expect(result?.spiel_id).toBe(nextSpiel.spiel_id);
    });

    it('sollte null zurückgeben wenn keine zukünftigen Spiele', async () => {
      const past = new Date('2025-01-01');

      await spielService.createSpiel({
        heim_team_id: testTeam.team_id,
        gast_team_id: gegnerTeam.team_id,
        datum: past,
        heim: testTeam.name,
        gast: 'Gegner',
        ist_heimspiel: true,
        status: 'abgeschlossen',
        altersklasse: 'U10',
      });

      const result = await spielService.getNextSpiel(testTeam.team_id);
      expect(result).toBeNull();
    });
  });

  describe('updateSpiel', () => {
    it('sollte ein Spiel aktualisieren', async () => {
      const created = await spielService.createSpiel({
        heim_team_id: testTeam.team_id,
        gast_team_id: gegnerTeam.team_id,
        datum: new Date('2025-11-15'),
        heim: testTeam.name,
        gast: 'Gegner',
        ist_heimspiel: true,
        status: 'geplant',
        altersklasse: 'U10',
      });

      await spielService.updateSpiel(created.spiel_id, {
        status: 'abgeschlossen',
        ergebnis_heim: 50,
        ergebnis_gast: 42,
      });

      const updated = await spielService.getSpielById(created.spiel_id);

      expect(updated?.status).toBe('abgeschlossen');
      expect(updated?.ergebnis_heim).toBe(50);
      expect(updated?.ergebnis_gast).toBe(42);
    });

    it('sollte Fehler werfen bei nicht existierender ID', async () => {
      await expect(
        spielService.updateSpiel('non-existent', { status: 'live' })
      ).rejects.toThrow();
    });
  });

  describe('deleteSpiel', () => {
    it('sollte ein Spiel löschen', async () => {
      const created = await spielService.createSpiel({
        heim_team_id: testTeam.team_id,
        gast_team_id: gegnerTeam.team_id,
        datum: new Date('2025-11-15'),
        heim: testTeam.name,
        gast: 'Gegner',
        ist_heimspiel: true,
        status: 'geplant',
        altersklasse: 'U10',
      });

      await spielService.deleteSpiel(created.spiel_id);

      const found = await spielService.getSpielById(created.spiel_id);
      expect(found).toBeNull();
    });
  });

  describe('getSpielBySpielNummer', () => {
    it('sollte Spiel anhand der BBB-Spielnummer finden', async () => {
      await spielService.createSpiel({
        spielplan_id: testSpielplan.spielplan_id,
        heim_team_id: testTeam.team_id,
        gast_team_id: gegnerTeam.team_id,
        spielnr: 42,
        datum: new Date('2025-11-15'),
        heim: testTeam.name,
        gast: 'Gegner',
        ist_heimspiel: true,
        status: 'geplant',
        altersklasse: 'U10',
      });

      const found = await spielService.getSpielBySpielNummer(
        testSpielplan.spielplan_id,
        42
      );

      expect(found).toBeDefined();
      expect(found?.spielnr).toBe(42);
    });

    it('sollte null zurückgeben wenn nicht gefunden', async () => {
      const found = await spielService.getSpielBySpielNummer(
        testSpielplan.spielplan_id,
        999
      );
      expect(found).toBeNull();
    });
  });

  describe('countSpieleByStatus', () => {
    it('sollte Spiele nach Status zählen', async () => {
      await spielService.createSpiel({
        heim_team_id: testTeam.team_id,
        gast_team_id: gegnerTeam.team_id,
        datum: new Date('2025-11-15'),
        heim: testTeam.name,
        gast: 'Gegner 1',
        ist_heimspiel: true,
        status: 'geplant',
        altersklasse: 'U10',
      });

      await spielService.createSpiel({
        heim_team_id: testTeam.team_id,
        gast_team_id: gegnerTeam.team_id,
        datum: new Date('2025-11-22'),
        heim: testTeam.name,
        gast: 'Gegner 2',
        ist_heimspiel: true,
        status: 'geplant',
        altersklasse: 'U10',
      });

      await spielService.createSpiel({
        heim_team_id: testTeam.team_id,
        gast_team_id: gegnerTeam.team_id,
        datum: new Date('2025-10-01'),
        heim: testTeam.name,
        gast: 'Gegner 3',
        ist_heimspiel: true,
        status: 'abgeschlossen',
        altersklasse: 'U10',
      });

      const geplantCount = await spielService.countSpieleByStatus(
        testTeam.team_id,
        'geplant'
      );
      const abgeschlossenCount = await spielService.countSpieleByStatus(
        testTeam.team_id,
        'abgeschlossen'
      );

      expect(geplantCount).toBe(2);
      expect(abgeschlossenCount).toBe(1);
    });
  });
});
