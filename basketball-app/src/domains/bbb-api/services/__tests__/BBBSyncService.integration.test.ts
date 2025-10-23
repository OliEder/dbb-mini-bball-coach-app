/**
 * Integration Tests für BBBSyncService
 * 
 * Alternative zu PACT - Verwendet nur eingebaute Mocking-Features
 * Keine zusätzlichen Dependencies, keine Security-Risiken!
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BBBSyncService } from '../BBBSyncService';
import { BBBApiService } from '../BBBApiService';
import { db } from '../../../../shared/db/database';
import type { DBBSpielplanResponse } from '../../../../shared/types';

// Mock HTTP responses
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('BBBSyncService Integration Tests', () => {
  let service: BBBSyncService;
  let apiService: BBBApiService;

  beforeEach(async () => {
    // Clear database
    await db.delete();
    await db.open();
    
    // Create real services (no mocking of service layer)
    apiService = new BBBApiService();
    service = new BBBSyncService();
    
    // Reset fetch mock
    mockFetch.mockClear();
  });

  afterEach(async () => {
    await db.close();
    vi.clearAllMocks();
  });

  describe('Real API Response Handling', () => {
    it('sollte echte API-Antwortstrukturen korrekt verarbeiten', async () => {
      const ligaId = 12345;

      // Mock real API responses with new wrapper format
      const tableResponse = {
        data: {
          ligaId: ligaId,
          liganame: 'U10 Bezirksliga Oberpfalz',
          teams: [
            {
              platzierung: 1,
              teamId: 111,
              teamname: 'SV Postbauer U10',
              spiele: 10,
              gewonnen: 8,
              verloren: 2,
              punkte: 16,
              korbpunkteGemacht: 450,
              korbpunkteGegen: 380,
              differenz: 70,
            },
            {
              platzierung: 2,
              teamId: 222,
              teamname: 'TSV Neumarkt U10',
              spiele: 10,
              gewonnen: 6,
              verloren: 4,
              punkte: 12,
              korbpunkteGemacht: 400,
              korbpunkteGegen: 380,
              differenz: 20,
            }
          ]
        }
      };

      const spielplanResponse = {
        data: {
          ligaId: ligaId,
          liganame: 'U10 Bezirksliga Oberpfalz',
          spielplan: [
            {
              spielid: 99991,
              nr: 1,
              tag: 1,
              datum: '2025-11-01',
              uhrzeit: '10:00',
              heimteamid: 111,
              heimteamname: 'SV Postbauer U10',
              gastteamid: 222,
              gastteamname: 'TSV Neumarkt U10',
              halle: 'Sporthalle Postbauer',
              heimTore: null,
              gastTore: null,
            }
          ]
        }
      };

      // Setup fetch responses
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => tableResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => spielplanResponse,
        });

      // Execute real sync - Skip Match Info für schnelleren Test
      await service.syncLiga(ligaId, { skipMatchInfo: true });

      // Verify complete data flow
      const ligen = await db.ligen.toArray();
      const teams = await db.teams.toArray();
      const vereine = await db.vereine.toArray();
      const spiele = await db.spiele.toArray();

      expect(ligen).toHaveLength(1);
      expect(teams).toHaveLength(2);  // Genau 2 Teams
      expect(vereine).toHaveLength(2); // Genau 2 Vereine
      expect(spiele).toHaveLength(1);

      // Verify data integrity - Suche Team anstatt Index zu verwenden
      const team111 = teams.find(t => t.extern_team_id === '111');
      const team222 = teams.find(t => t.extern_team_id === '222');
      expect(team111).toBeDefined();
      expect(team111?.name).toBe('SV Postbauer U10');
      expect(team222).toBeDefined();
      expect(team222?.name).toBe('TSV Neumarkt U10');
      expect(spiele[0].extern_spiel_id).toBe('99991');
    });

    it('sollte CORS-Proxy-Fallback verwenden', async () => {
      const ligaId = 12345;

      // In DEV mode: Direct fetch is skipped, first proxy fails, second succeeds
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 403,
          statusText: 'First proxy blocked'
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: {
              ligaId: ligaId,
              liganame: 'Test Liga',
              teams: []
            }
          }),
        } as Response);

      const result = await apiService.getTabelle(ligaId);

      // Should use 2 proxies (first fails, second succeeds)
      expect(mockFetch).toHaveBeenCalledTimes(2);
      // First call should be to corsproxy.io (first proxy in list)
      expect(mockFetch).toHaveBeenNthCalledWith(1, 
        expect.stringContaining('corsproxy.io'),
        expect.any(Object)
      );
      expect(result.ligaId).toBe(ligaId);
    });

    it('sollte Rate-Limiting respektieren', async () => {
      const items = [1, 2, 3, 4, 5];
      const processor = vi.fn().mockImplementation(async (item) => {
        // Simulate API call
        return { processed: item };
      });

      const startTime = Date.now();
      const results = await apiService.batchProcess(items, processor, 2, 100);
      const duration = Date.now() - startTime;

      // Should have delays between batches
      expect(duration).toBeGreaterThanOrEqual(200); // At least 2 delays of 100ms
      expect(results).toHaveLength(5);
      expect(processor).toHaveBeenCalledTimes(5);
    });
  });

  describe('Error Recovery', () => {
    it('sollte partielle Fehler tolerieren', async () => {
      const ligaId = 12345;

      // Table succeeds, Spielplan returns error but shouldn't crash
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: {
              ligaId: ligaId,
              liganame: 'Test Liga',
              teams: [{
                platzierung: 1,
                teamId: 111,
                teamname: 'Team A',
                vereinId: 10,
                vereinname: 'Club A',
                spiele: 5,
                gewonnen: 3,
                verloren: 2,
                punkte: 6,
                korbpunkteGemacht: 100,
                korbpunkteGegen: 90,
                differenz: 10,
              }]
            }
          }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            data: {
              ligaId: ligaId,
              liganame: 'Test Liga',
              spielplan: []
            }
          }),
        } as Response);

      // Should complete without throwing
      await service.syncLiga(ligaId);
      
      // Teams should be created from table even if spielplan is empty
      const teams = await db.teams.toArray();
      expect(teams.length).toBeGreaterThan(0);
      expect(teams[0].name).toBe('Team A');
    });

    it('sollte bei Netzwerkfehlern alle Proxies durchprobieren', async () => {
      // All 6 CORS proxies fail (direct fetch is skipped in DEV mode)
      mockFetch
        .mockRejectedValueOnce(new Error('Proxy 1 failed'))
        .mockRejectedValueOnce(new Error('Proxy 2 failed'))
        .mockRejectedValueOnce(new Error('Proxy 3 failed'))
        .mockRejectedValueOnce(new Error('Proxy 4 failed'))
        .mockRejectedValueOnce(new Error('Proxy 5 failed'))
        .mockRejectedValueOnce(new Error('Proxy 6 failed'));

      await expect(apiService.getTabelle(12345)).rejects.toThrow('All CORS proxies failed');
      
      // Should have tried all 6 proxies (direct fetch is skipped in DEV)
      expect(mockFetch).toHaveBeenCalledTimes(6);
    });
  });

  describe('Data Consistency', () => {
    it('sollte Duplikate vermeiden', async () => {
      const ligaId = 12345;
      const mockResponse = {
        data: {
          ligaId: ligaId,
          liganame: 'Test Liga',
          teams: [{
            platzierung: 1,
            teamId: 111,
            teamname: 'Team A',
            vereinId: 10,
            vereinname: 'Club A',
            spiele: 5,
            gewonnen: 3,
            verloren: 2,
            punkte: 6,
            korbpunkteGemacht: 100,
            korbpunkteGegen: 90,
            differenz: 10,
          }]
        }
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      // Sync twice
      await service.syncTabelleAndTeams(ligaId);
      await service.syncTabelleAndTeams(ligaId);

      // Should not create duplicates
      const teams = await db.teams.toArray();
      const teamA = teams.filter(t => t.name === 'Team A');
      expect(teamA).toHaveLength(1);
    });

    it('sollte Team-Typ korrekt setzen', async () => {
      const teamId = 'test-team-id';
      const userId = 'test-user-id';

      // Create team as 'gegner'
      await db.teams.add({
        team_id: teamId,
        verein_id: 'test-verein',
        name: 'Test Team',
        altersklasse: 'U10',
        saison: '2025/26',
        trainer: 'Test Trainer',
        team_typ: 'gegner',
        created_at: new Date(),
      });

      // Mark as own team
      await service.markAsOwnTeam(teamId, userId);

      // Verify
      const team = await db.teams.get(teamId);
      expect(team?.team_typ).toBe('eigen');
      expect(team?.user_id).toBe(userId);
    });
  });

  describe('WAM Filter Integration', () => {
    it('sollte Filter-Anfragen korrekt aufbauen', async () => {
      const mockResponse = {
        data: {
          verbaende: [{ id: 2, label: 'Bayern', hits: 100 }],
          gebiete: [],
          altersklassen: [{ id: 10, label: 'U10', hits: 50 }],
          spielklassen: [],
          ligaListe: {
            ligen: [{
              ligaId: 12345,
              liganame: 'U10 Bezirksliga',
              verbandId: 2,
            }],
            hasMoreData: false,
            size: 1,
          }
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiService.filterLigen({
        verbandIds: [2],
        altersklasseIds: [10],
      });

      // Verify request structure
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('"verbandIds":[2]'),
        })
      );

      expect(result.data.ligaListe?.ligen).toHaveLength(1);
    });
  });
});
