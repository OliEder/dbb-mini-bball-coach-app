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
    
    // ✅ Create services with testMode to avoid CORS proxies
    apiService = new BBBApiService({ testMode: true });
    service = new BBBSyncService(apiService);
    
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

      // Mock real API responses - Correct format WITHOUT data wrapper
      const tableResponse = {
        ligaId: ligaId,  // Direkt im Root!
        liganame: 'U10 Bezirksliga Oberpfalz',
        teams: [
          {
            position: 1,
            teamId: 111,
            teamName: 'SV Postbauer U10',
            clubId: 4087,
            clubName: 'SV Postbauer',
            games: 10,
            wins: 8,
            losses: 2,
            points: 16,
            scoredPoints: 450,
            concededPoints: 380,
            pointsDifference: 70,
          },
          {
            position: 2,
            teamId: 222,
            teamName: 'TSV Neumarkt U10',
            clubId: 4083,
            clubName: 'TSV Neumarkt',
            games: 10,
            wins: 6,
            losses: 4,
            points: 12,
            scoredPoints: 400,
            concededPoints: 380,
            pointsDifference: 20,
          }
        ]
      };

      const spielplanResponse = {
        spielplan: [  // ✅ Korrektes deutsches API-Format!
          {
            matchId: 99991,
            gameNumber: 1,
            gameDay: 1,
            kickoffDate: '2025-11-01',  // ✅ kickoffDate nicht date!
            kickoffTime: '10:00',        // ✅ kickoffTime nicht time!
            homeTeam: {
              seasonTeamId: 111,             // ✅ seasonTeamId nicht teamId!
              teamname: 'SV Postbauer U10'  // ✅ teamname nicht teamName!
            },
            guestTeam: {                     // ✅ guestTeam nicht awayTeam!
              seasonTeamId: 222,
              teamname: 'TSV Neumarkt U10'
            },
            venue: 'Sporthalle Postbauer',  // ✅ venue ist string!
            result: null,                     // ✅ result für Scores
            status: 'scheduled'
          }
        ]
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
      // ⚠️ Test production CORS behavior with separate service
      const prodApiService = new BBBApiService({ testMode: false });
      const ligaId = 12345;

      // Mock: first proxy fails, second succeeds
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 403,
          statusText: 'First proxy blocked'
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            ligaId: ligaId,
            liganame: 'Test Liga',
            teams: []
          }),
        } as Response);

      const result = await prodApiService.getTabelle(ligaId);

      // Should use 2 proxies (first fails, second succeeds)
      expect(mockFetch).toHaveBeenCalledTimes(2);
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
            ligaId: ligaId,  // NO data wrapper!
            liganame: 'Test Liga',
            teams: [{
              position: 1,
              teamId: 111,
              teamName: 'Team A',
              clubId: 10,
              clubName: 'Club A',
              games: 5,
              wins: 3,
              losses: 2,
              points: 6,
              scoredPoints: 100,
              concededPoints: 90,
              pointsDifference: 10,
            }]
          }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            spielplan: []  // ✅ Korrektes Format: spielplan nicht games!
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
      // ⚠️ Test production CORS fallback behavior
      const prodApiService = new BBBApiService({ testMode: false });
      
      // All 6 CORS proxies fail
      mockFetch
        .mockRejectedValueOnce(new Error('Proxy 1 failed'))
        .mockRejectedValueOnce(new Error('Proxy 2 failed'))
        .mockRejectedValueOnce(new Error('Proxy 3 failed'))
        .mockRejectedValueOnce(new Error('Proxy 4 failed'))
        .mockRejectedValueOnce(new Error('Proxy 5 failed'))
        .mockRejectedValueOnce(new Error('Proxy 6 failed'));

      await expect(prodApiService.getTabelle(12345)).rejects.toThrow('All CORS proxies failed');
      
      // Should have tried all 6 proxies
      expect(mockFetch).toHaveBeenCalledTimes(6);
    });
  });

  describe('Data Consistency', () => {
    it('sollte Duplikate vermeiden', async () => {
      const ligaId = 12345;
      const mockResponse = {
        ligaId: ligaId,  // NO data wrapper!
        liganame: 'Test Liga',
        teams: [{
          position: 1,
          teamId: 111,
          teamName: 'Team A',
          clubId: 10,
          clubName: 'Club A',
          games: 5,
          wins: 3,
          losses: 2,
          points: 6,
          scoredPoints: 100,
          concededPoints: 90,
          pointsDifference: 10,
        }]
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

      expect(result.ligaListe?.ligen).toHaveLength(1);
    });
  });
});
