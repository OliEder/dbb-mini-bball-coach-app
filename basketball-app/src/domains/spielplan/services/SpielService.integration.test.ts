/**
 * SpielService Integration Tests (PACT-Style)
 * 
 * Diese Tests prüfen das Zusammenspiel zwischen:
 * - SpielService (Consumer)
 * - Database Layer (Provider)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { spielService } from './SpielService';
import { db } from '@/shared/db/database';
import type { Spiel, Team, Verein, Spielplan, Halle } from '@/shared/types';

describe('SpielService Integration Tests', () => {
  let testTeam: Team;
  let testVerein: Verein;
  let testSpielplan: Spielplan;
  let testHalle: Halle;

  beforeEach(async () => {
    // Setup: Clean database and create test data
    await db.delete();
    await db.open();

    testVerein = {
      verein_id: crypto.randomUUID(),
      name: 'Integration Test Verein',
      ist_eigener_verein: true,
      created_at: new Date(),
    };
    await db.vereine.add(testVerein);

    testTeam = {
      team_id: crypto.randomUUID(),
      verein_id: testVerein.verein_id,
      name: 'Integration Test Team',
      altersklasse: 'U10',
      saison: '2025/2026',
      trainer: 'Integration Trainer',
      created_at: new Date(),
    };
    await db.teams.add(testTeam);

    testSpielplan = {
      spielplan_id: crypto.randomUUID(),
      team_id: testTeam.team_id,
      saison: '2025/2026',
      liga: 'Bezirksliga',
      created_at: new Date(),
    };
    await db.spielplaene.add(testSpielplan);

    testHalle = {
      halle_id: crypto.randomUUID(),
      name: 'Test Halle',
      strasse: 'Teststr. 1',
      plz: '12345',
      ort: 'Teststadt',
      created_at: new Date(),
    };
    await db.hallen.add(testHalle);
  });

  afterEach(async () => {
    await db.delete();
  });

  describe('Contract: createSpiel → Database', () => {
    it('sollte Contract für vollständiges Spiel erfüllen', async () => {
      // Given: Vollständiges Spiel mit allen Feldern
      const spielData = {
        spielplan_id: testSpielplan.spielplan_id,
        team_id: testTeam.team_id,
        spielnr: 5,
        spieltag: 3,
        datum: new Date('2025-11-15'),
        uhrzeit: '14:00',
        heim: testTeam.name,
        gast: 'Gegner Team',
        halle_id: testHalle.halle_id,
        ist_heimspiel: true,
        status: 'geplant' as const,
        altersklasse: 'U10' as const,
      };

      // When: Service erstellt Spiel
      const created = await spielService.createSpiel(spielData);

      // Then: Database sollte Spiel mit allen Feldern gespeichert haben
      const fromDb = await db.spiele.get(created.spiel_id);

      expect(fromDb).toBeDefined();
      expect(fromDb?.spielnr).toBe(spielData.spielnr);
      expect(fromDb?.heim).toBe(spielData.heim);
      expect(fromDb?.gast).toBe(spielData.gast);
      expect(fromDb?.ist_heimspiel).toBe(true);
      expect(fromDb?.status).toBe('geplant');
      expect(fromDb?.halle_id).toBe(testHalle.halle_id);
    });

    it('sollte Contract für minimales Spiel erfüllen', async () => {
      // Given: Minimales Spiel nur mit Pflichtfeldern
      const minimalData = {
        team_id: testTeam.team_id,
        datum: new Date('2025-11-15'),
        heim: testTeam.name,
        gast: 'Gegner',
        ist_heimspiel: true,
        status: 'geplant' as const,
        altersklasse: 'U10' as const,
      };

      // When: Service erstellt minimales Spiel
      const created = await spielService.createSpiel(minimalData);

      // Then: Database sollte nur Pflichtfelder haben
      const fromDb = await db.spiele.get(created.spiel_id);

      expect(fromDb).toBeDefined();
      expect(fromDb?.spielnr).toBeUndefined();
      expect(fromDb?.uhrzeit).toBeUndefined();
      expect(fromDb?.halle_id).toBeUndefined();
    });
  });

  describe('Contract: getSpieleByTeam → Database', () => {
    it('sollte alle Spiele eines Teams chronologisch sortiert zurückgeben', async () => {
      // Given: Spiele in verschiedenen Daten
      const spiel1 = await spielService.createSpiel({
        team_id: testTeam.team_id,
        datum: new Date('2025-11-22'),
        heim: testTeam.name,
        gast: 'Gegner 2',
        ist_heimspiel: true,
        status: 'geplant',
        altersklasse: 'U10',
      });

      const spiel2 = await spielService.createSpiel({
        team_id: testTeam.team_id,
        datum: new Date('2025-11-15'),
        heim: 'Gegner 1',
        gast: testTeam.name,
        ist_heimspiel: false,
        status: 'geplant',
        altersklasse: 'U10',
      });

      // When: Service lädt alle Spiele
      const result = await spielService.getSpieleByTeam(testTeam.team_id);

      // Then: Spiele sollten chronologisch sortiert sein
      expect(result).toHaveLength(2);
      expect(result[0].spiel_id).toBe(spiel2.spiel_id); // Früheres Datum zuerst
      expect(result[1].spiel_id).toBe(spiel1.spiel_id);
    });

    it('sollte Filter korrekt an Database weitergeben', async () => {
      // Given: Heim- und Auswärtsspiele
      await spielService.createSpiel({
        team_id: testTeam.team_id,
        datum: new Date('2025-11-15'),
        heim: testTeam.name,
        gast: 'Gegner 1',
        ist_heimspiel: true,
        status: 'geplant',
        altersklasse: 'U10',
      });

      await spielService.createSpiel({
        team_id: testTeam.team_id,
        datum: new Date('2025-11-22'),
        heim: 'Gegner 2',
        gast: testTeam.name,
        ist_heimspiel: false,
        status: 'geplant',
        altersklasse: 'U10',
      });

      // When: Service filtert nach Heimspielen
      const heimspiele = await spielService.getSpieleByTeam(testTeam.team_id, {
        ist_heimspiel: true,
      });

      // Then: Nur Heimspiele sollten zurückgegeben werden
      expect(heimspiele).toHaveLength(1);
      expect(heimspiele[0].ist_heimspiel).toBe(true);
    });
  });

  describe('Contract: getNextSpiel → Database', () => {
    it('sollte das nächste zukünftige Spiel finden', async () => {
      // Given: Vergangene und zukünftige Spiele
      const now = new Date();
      const past = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const future1 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const future2 = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

      await spielService.createSpiel({
        team_id: testTeam.team_id,
        datum: past,
        heim: testTeam.name,
        gast: 'Past Game',
        ist_heimspiel: true,
        status: 'abgeschlossen',
        altersklasse: 'U10',
      });

      await spielService.createSpiel({
        team_id: testTeam.team_id,
        datum: future2,
        heim: testTeam.name,
        gast: 'Future 2',
        ist_heimspiel: true,
        status: 'geplant',
        altersklasse: 'U10',
      });

      const nextSpiel = await spielService.createSpiel({
        team_id: testTeam.team_id,
        datum: future1,
        heim: testTeam.name,
        gast: 'Future 1',
        ist_heimspiel: true,
        status: 'geplant',
        altersklasse: 'U10',
      });

      // When: Service sucht nächstes Spiel
      const result = await spielService.getNextSpiel(testTeam.team_id);

      // Then: Das nächste zukünftige Spiel sollte gefunden werden
      expect(result).toBeDefined();
      expect(result?.spiel_id).toBe(nextSpiel.spiel_id);
    });
  });

  describe('Contract: BBB-Integration', () => {
    it('sollte Spiel anhand BBB-Spielnummer finden', async () => {
      // Given: Spiele mit BBB-Spielnummern
      await spielService.createSpiel({
        spielplan_id: testSpielplan.spielplan_id,
        team_id: testTeam.team_id,
        spielnr: 42,
        datum: new Date('2025-11-15'),
        heim: testTeam.name,
        gast: 'Gegner',
        ist_heimspiel: true,
        status: 'geplant',
        altersklasse: 'U10',
      });

      // When: Service sucht nach Spielnummer
      const found = await spielService.getSpielBySpielNummer(
        testSpielplan.spielplan_id,
        42
      );

      // Then: Spiel sollte gefunden werden
      expect(found).toBeDefined();
      expect(found?.spielnr).toBe(42);
    });
  });

  describe('Contract: Team-Statistiken', () => {
    it('sollte Statistiken korrekt berechnen', async () => {
      // Given: Verschiedene Spiele
      await spielService.createSpiel({
        team_id: testTeam.team_id,
        datum: new Date('2025-11-15'),
        heim: testTeam.name,
        gast: 'Gegner 1',
        ist_heimspiel: true,
        status: 'abgeschlossen',
        altersklasse: 'U10',
        ergebnis_heim: 45,
        ergebnis_gast: 38,
      });

      await spielService.createSpiel({
        team_id: testTeam.team_id,
        datum: new Date('2025-11-22'),
        heim: 'Gegner 2',
        gast: testTeam.name,
        ist_heimspiel: false,
        status: 'abgeschlossen',
        altersklasse: 'U10',
        ergebnis_heim: 50,
        ergebnis_gast: 42,
      });

      await spielService.createSpiel({
        team_id: testTeam.team_id,
        datum: new Date('2025-11-29'),
        heim: testTeam.name,
        gast: 'Gegner 3',
        ist_heimspiel: true,
        status: 'geplant',
        altersklasse: 'U10',
      });

      // When: Service berechnet Statistiken
      const stats = await spielService.getTeamStatistik(testTeam.team_id);

      // Then: Statistiken sollten korrekt sein
      expect(stats.total).toBe(3);
      expect(stats.abgeschlossen).toBe(2);
      expect(stats.geplant).toBe(1);
      expect(stats.heimspiele).toBe(2);
      expect(stats.auswaertsspiele).toBe(1);
      expect(stats.siege).toBe(1); // Heimspiel gewonnen
      expect(stats.niederlagen).toBe(1); // Auswärtsspiel verloren
    });
  });

  describe('Contract: Concurrent Operations', () => {
    it('sollte gleichzeitige Operationen korrekt verarbeiten', async () => {
      // Given: Mehrere gleichzeitige Create-Operationen
      const promises = Array.from({ length: 10 }, (_, i) =>
        spielService.createSpiel({
          team_id: testTeam.team_id,
          datum: new Date(`2025-11-${15 + i}`),
          heim: testTeam.name,
          gast: `Gegner ${i}`,
          ist_heimspiel: i % 2 === 0,
          status: 'geplant',
          altersklasse: 'U10',
        })
      );

      // When: Alle Operationen parallel ausführen
      const results = await Promise.all(promises);

      // Then: Alle Spiele sollten korrekt erstellt worden sein
      expect(results).toHaveLength(10);
      
      const allSpiele = await spielService.getSpieleByTeam(testTeam.team_id);
      expect(allSpiele).toHaveLength(10);

      // Verify all IDs are unique
      const ids = new Set(results.map(s => s.spiel_id));
      expect(ids.size).toBe(10);
    });
  });

  describe('Contract: Data Integrity', () => {
    it('sollte Datenintegrität bei komplexen Workflows wahren', async () => {
      // Given: Create → Update → Filter → Stats Workflow
      
      // 1. Create
      const created = await spielService.createSpiel({
        team_id: testTeam.team_id,
        spielnr: 1,
        datum: new Date('2025-11-15'),
        heim: testTeam.name,
        gast: 'Gegner',
        ist_heimspiel: true,
        status: 'geplant',
        altersklasse: 'U10',
      });

      // 2. Verify Create
      let fromDb = await db.spiele.get(created.spiel_id);
      expect(fromDb?.status).toBe('geplant');

      // 3. Update (Spiel durchgeführt)
      await spielService.updateSpiel(created.spiel_id, {
        status: 'abgeschlossen',
        ergebnis_heim: 45,
        ergebnis_gast: 38,
      });

      // 4. Verify Update
      fromDb = await db.spiele.get(created.spiel_id);
      expect(fromDb?.status).toBe('abgeschlossen');
      expect(fromDb?.ergebnis_heim).toBe(45);

      // 5. Filter
      const abgeschlossen = await spielService.getSpieleByTeam(testTeam.team_id, {
        status: 'abgeschlossen',
      });
      expect(abgeschlossen).toHaveLength(1);

      // 6. Stats
      const stats = await spielService.getTeamStatistik(testTeam.team_id);
      expect(stats.abgeschlossen).toBe(1);
      expect(stats.siege).toBe(1); // Heimspiel gewonnen
    });
  });
});
