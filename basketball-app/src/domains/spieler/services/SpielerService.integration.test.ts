/**
 * SpielerService Integration Tests (PACT-Style)
 * 
 * Diese Tests prüfen das Zusammenspiel zwischen:
 * - SpielerService (Consumer)
 * - Database Layer (Provider)
 * 
 * PACT-Prinzipien:
 * - Testen gegen echte Datenbank
 * - Prüfen von Contracts/Interfaces
 * - Verifizieren von Erwartungen
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { spielerService } from './SpielerService';
import { db } from '@/shared/db/database';
import type { Spieler, Team, Verein } from '@/shared/types';

describe('SpielerService Integration Tests', () => {
  let testTeam: Team;
  let testVerein: Verein;

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
      altersklasse: 'U12',
      saison: '2025/2026',
      trainer: 'Integration Trainer',
      created_at: new Date(),
    };
    await db.teams.add(testTeam);
  });

  afterEach(async () => {
    // Cleanup: Delete database after each test
    await db.delete();
  });

  describe('Contract: createSpieler → Database', () => {
    it('sollte Contract für vollständigen Spieler erfüllen', async () => {
      // Given: Vollständiger Spieler mit allen optionalen Feldern
      const spielerData = {
        team_id: testTeam.team_id,
        vorname: 'Contract',
        nachname: 'Test',
        geburtsdatum: new Date('2013-03-15'),
        spieler_typ: 'eigenes_team' as const,
        mitgliedsnummer: 'CT-123',
        tna_nr: 'TNA-CT-001',
        konfektionsgroesse_jersey: 152,
        konfektionsgroesse_hose: 152,
        aktiv: true,
      };

      // When: Service erstellt Spieler
      const created = await spielerService.createSpieler(spielerData);

      // Then: Database sollte Spieler mit allen Feldern gespeichert haben
      const fromDb = await db.spieler.get(created.spieler_id);

      expect(fromDb).toBeDefined();
      expect(fromDb?.vorname).toBe(spielerData.vorname);
      expect(fromDb?.nachname).toBe(spielerData.nachname);
      expect(fromDb?.team_id).toBe(spielerData.team_id);
      expect(fromDb?.mitgliedsnummer).toBe(spielerData.mitgliedsnummer);
      expect(fromDb?.tna_nr).toBe(spielerData.tna_nr);
      expect(fromDb?.konfektionsgroesse_jersey).toBe(spielerData.konfektionsgroesse_jersey);
      expect(fromDb?.konfektionsgroesse_hose).toBe(spielerData.konfektionsgroesse_hose);
      expect(fromDb?.spieler_id).toBe(created.spieler_id);
      expect(fromDb?.created_at).toBeDefined();
    });

    it('sollte Contract für minimalen Spieler erfüllen', async () => {
      // Given: Minimaler Spieler nur mit Pflichtfeldern
      const minimalData = {
        team_id: testTeam.team_id,
        vorname: 'Min',
        nachname: 'Test',
        spieler_typ: 'eigenes_team' as const,
        aktiv: true,
      };

      // When: Service erstellt minimalen Spieler
      const created = await spielerService.createSpieler(minimalData);

      // Then: Database sollte nur Pflichtfelder haben
      const fromDb = await db.spieler.get(created.spieler_id);

      expect(fromDb).toBeDefined();
      expect(fromDb?.vorname).toBe(minimalData.vorname);
      expect(fromDb?.mitgliedsnummer).toBeUndefined();
      expect(fromDb?.tna_nr).toBeUndefined();
      expect(fromDb?.geburtsdatum).toBeUndefined();
    });
  });

  describe('Contract: getSpielerByTeam → Database', () => {
    it('sollte alle Spieler eines Teams zurückgeben', async () => {
      // Given: Mehrere Spieler im Team
      const spieler1 = await spielerService.createSpieler({
        team_id: testTeam.team_id,
        vorname: 'Player1',
        nachname: 'Test',
        spieler_typ: 'eigenes_team',
        aktiv: true,
      });

      const spieler2 = await spielerService.createSpieler({
        team_id: testTeam.team_id,
        vorname: 'Player2',
        nachname: 'Test',
        spieler_typ: 'eigenes_team',
        aktiv: true,
      });

      // When: Service lädt alle Spieler
      const result = await spielerService.getSpielerByTeam(testTeam.team_id);

      // Then: Alle Spieler sollten zurückgegeben werden
      expect(result).toHaveLength(2);
      expect(result.map(s => s.spieler_id)).toContain(spieler1.spieler_id);
      expect(result.map(s => s.spieler_id)).toContain(spieler2.spieler_id);
    });

    it('sollte Filter korrekt an Database weitergeben', async () => {
      // Given: Aktive und inaktive Spieler
      await spielerService.createSpieler({
        team_id: testTeam.team_id,
        vorname: 'Active',
        nachname: 'Test',
        spieler_typ: 'eigenes_team',
        aktiv: true,
      });

      await spielerService.createSpieler({
        team_id: testTeam.team_id,
        vorname: 'Inactive',
        nachname: 'Test',
        spieler_typ: 'eigenes_team',
        aktiv: false,
      });

      // When: Service filtert nach aktiven Spielern
      const aktive = await spielerService.getSpielerByTeam(testTeam.team_id, {
        aktiv: true,
      });

      // Then: Nur aktive Spieler sollten zurückgegeben werden
      expect(aktive).toHaveLength(1);
      expect(aktive[0].aktiv).toBe(true);
    });
  });

  describe('Contract: updateSpieler → Database', () => {
    it('sollte partielle Updates korrekt durchführen', async () => {
      // Given: Existierender Spieler
      const original = await spielerService.createSpieler({
        team_id: testTeam.team_id,
        vorname: 'Original',
        nachname: 'Name',
        spieler_typ: 'eigenes_team',
        aktiv: true,
      });

      // When: Service aktualisiert nur den Vornamen
      await spielerService.updateSpieler(original.spieler_id, {
        vorname: 'Updated',
      });

      // Then: Database sollte nur Vorname aktualisiert haben
      const updated = await db.spieler.get(original.spieler_id);

      expect(updated?.vorname).toBe('Updated');
      expect(updated?.nachname).toBe('Name'); // Unverändert
      expect(updated?.updated_at).toBeDefined();
    });

    it('sollte Fehler bei nicht existierendem Spieler werfen', async () => {
      // Given: Nicht existierende ID
      const nonExistentId = crypto.randomUUID();

      // When/Then: Service sollte Fehler werfen
      await expect(
        spielerService.updateSpieler(nonExistentId, { vorname: 'Test' })
      ).rejects.toThrow();
    });
  });

  describe('Contract: deleteSpieler → Database', () => {
    it('sollte Spieler aus Database entfernen', async () => {
      // Given: Existierender Spieler
      const spieler = await spielerService.createSpieler({
        team_id: testTeam.team_id,
        vorname: 'ToDelete',
        nachname: 'Test',
        spieler_typ: 'eigenes_team',
        aktiv: true,
      });

      // When: Service löscht Spieler
      await spielerService.deleteSpieler(spieler.spieler_id);

      // Then: Database sollte Spieler nicht mehr haben
      const fromDb = await db.spieler.get(spieler.spieler_id);
      expect(fromDb).toBeUndefined();
    });
  });

  describe('Contract: Concurrent Operations', () => {
    it('sollte gleichzeitige Operationen korrekt verarbeiten', async () => {
      // Given: Mehrere gleichzeitige Create-Operationen
      const promises = Array.from({ length: 10 }, (_, i) =>
        spielerService.createSpieler({
          team_id: testTeam.team_id,
          vorname: `Concurrent${i}`,
          nachname: 'Test',
          spieler_typ: 'eigenes_team',
          aktiv: true,
        })
      );

      // When: Alle Operationen parallel ausführen
      const results = await Promise.all(promises);

      // Then: Alle Spieler sollten korrekt erstellt worden sein
      expect(results).toHaveLength(10);
      
      const allSpieler = await spielerService.getSpielerByTeam(testTeam.team_id);
      expect(allSpieler).toHaveLength(10);

      // Verify all IDs are unique
      const ids = new Set(results.map(s => s.spieler_id));
      expect(ids.size).toBe(10);
    });
  });

  describe('Contract: Data Integrity', () => {
    it('sollte Datenintegrität bei komplexen Szenarien wahren', async () => {
      // Given: Create → Update → Search → Delete Workflow
      
      // 1. Create
      const created = await spielerService.createSpieler({
        team_id: testTeam.team_id,
        vorname: 'Integrity',
        nachname: 'Test',
        spieler_typ: 'eigenes_team',
        mitgliedsnummer: 'INT-001',
        aktiv: true,
      });

      // 2. Verify Create
      let fromDb = await db.spieler.get(created.spieler_id);
      expect(fromDb?.mitgliedsnummer).toBe('INT-001');

      // 3. Update
      await spielerService.updateSpieler(created.spieler_id, {
        mitgliedsnummer: 'INT-002',
        tna_nr: 'TNA-INT',
      });

      // 4. Verify Update
      fromDb = await db.spieler.get(created.spieler_id);
      expect(fromDb?.mitgliedsnummer).toBe('INT-002');
      expect(fromDb?.tna_nr).toBe('TNA-INT');

      // 5. Search
      const searchResult = await spielerService.getSpielerByMitgliedsnummer('INT-002');
      expect(searchResult?.spieler_id).toBe(created.spieler_id);

      // 6. Delete
      await spielerService.deleteSpieler(created.spieler_id);

      // 7. Verify Delete
      fromDb = await db.spieler.get(created.spieler_id);
      expect(fromDb).toBeUndefined();
    });
  });

  describe('Contract: Error Handling', () => {
    it('sollte Validierungsfehler korrekt propagieren', async () => {
      // Given: Invalide Daten (leerer Vorname)
      const invalidData = {
        team_id: testTeam.team_id,
        vorname: '',
        nachname: 'Test',
        spieler_typ: 'eigenes_team' as const,
        aktiv: true,
      };

      // When/Then: Service sollte Validierungsfehler werfen
      await expect(
        spielerService.createSpieler(invalidData)
      ).rejects.toThrow('Vorname ist erforderlich');

      // Verify: Database sollte nichts gespeichert haben
      const allSpieler = await db.spieler.toArray();
      expect(allSpieler).toHaveLength(0);
    });

    it('sollte Database-Fehler korrekt behandeln', async () => {
      // Given: Spieler erstellen
      const spieler = await spielerService.createSpieler({
        team_id: testTeam.team_id,
        vorname: 'Error',
        nachname: 'Test',
        spieler_typ: 'eigenes_team',
        aktiv: true,
      });

      // When: Database schließen und Operation versuchen
      await db.close();

      // Then: Sollte Fehler werfen
      await expect(
        spielerService.getSpielerById(spieler.spieler_id)
      ).rejects.toThrow();

      // Cleanup: Database wieder öffnen für afterEach
      await db.open();
    });
  });
});
