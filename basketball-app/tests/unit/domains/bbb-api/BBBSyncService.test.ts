/**
 * BBBSyncService Unit Tests
 * 
 * Testet:
 * - Liga-Sync mit korrekten Datenstrukturen
 * - Team-Merge Logik
 * - Liga-ID Übergabe an Spiele
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BBBSyncService } from '@/domains/bbb-api/services/BBBSyncService';
import { db } from '@/shared/db/database';
import type { Liga, Team, Spiel } from '@/shared/types';

// Mock BBBApiService
const mockBBBApiService = {
  getTabelle: vi.fn(),
  getSpielplan: vi.fn(),
  getMatchInfo: vi.fn(),
  batchProcess: vi.fn()
};

describe('BBBSyncService', () => {
  let syncService: BBBSyncService;

  beforeEach(async () => {
    // Clear database
    await db.ligen.clear();
    await db.teams.clear();
    await db.vereine.clear();
    await db.spiele.clear();
    await db.liga_tabellen.clear();

    // Create service with mocked API
    syncService = new BBBSyncService(mockBBBApiService as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('syncLiga()', () => {
    it('should sync liga with correct data structures', async () => {
      // ARRANGE
      const ligaId = 51961;

      mockBBBApiService.getTabelle.mockResolvedValueOnce({
        ligaId: ligaId,
        liganame: 'U10 mixed Bezirksliga',
        teams: [
          {
            position: 1,
            teamId: 432555,
            teamName: 'Fibalon Baskets Neumarkt',
            clubId: 4087,
            clubName: 'Fibalon',
            games: 4,
            wins: 4,
            losses: 0,
            points: 8,
            scoredPoints: 362,
            concededPoints: 271,
            pointsDifference: 91
          }
        ]
      });

      mockBBBApiService.getSpielplan.mockResolvedValueOnce({
        games: [
          {
            matchId: 2804049,
            gameNumber: 1496,
            gameDay: 6,
            date: '2025-10-05',
            time: '18:00',
            homeTeam: {
              teamId: 432555,
              teamName: 'Fibalon Baskets Neumarkt'
            },
            awayTeam: {
              teamId: 432551,
              teamName: 'DJK Neustadt a. d. Waldnaab 1'
            },
            status: 'scheduled'
          }
        ]
      });

      // ACT
      await syncService.syncLiga(ligaId, { skipMatchInfo: true });

      // ASSERT
      const liga = await db.ligen
        .where('bbb_liga_id')
        .equals(ligaId.toString())
        .first();

      expect(liga).toBeDefined();
      expect(liga?.name).toBe('U10 mixed Bezirksliga');
      expect(liga?.bbb_liga_id).toBe(ligaId.toString());

      const teams = await db.teams.toArray();
      expect(teams.length).toBeGreaterThan(0);

      const team = teams.find(t => t.extern_team_id === '432555');
      expect(team).toBeDefined();
      expect(team?.name).toBe('Fibalon Baskets Neumarkt');
    });

    it('should store liga_id in Spiele', async () => {
      // ARRANGE
      const ligaId = 51961;

      mockBBBApiService.getTabelle.mockResolvedValueOnce({
        ligaId: ligaId,
        liganame: 'Test Liga',
        teams: [
          {
            position: 1,
            teamId: 432555,
            teamName: 'Team A',
            clubId: 4087,
            clubName: 'Club A',
            games: 1,
            wins: 1,
            losses: 0,
            points: 2,
            scoredPoints: 50,
            concededPoints: 40,
            pointsDifference: 10
          },
          {
            position: 2,
            teamId: 432551,
            teamName: 'Team B',
            clubId: 4083,
            clubName: 'Club B',
            games: 1,
            wins: 0,
            losses: 1,
            points: 0,
            scoredPoints: 40,
            concededPoints: 50,
            pointsDifference: -10
          }
        ]
      });

      mockBBBApiService.getSpielplan.mockResolvedValueOnce({
        games: [
          {
            matchId: 123456,
            gameNumber: 1,
            gameDay: 1,
            date: '2025-10-05',
            time: '18:00',
            homeTeam: {
              teamId: 432555,
              teamName: 'Team A'
            },
            awayTeam: {
              teamId: 432551,
              teamName: 'Team B'
            },
            status: 'scheduled'
          }
        ]
      });

      // ACT
      await syncService.syncLiga(ligaId, { skipMatchInfo: true });

      // ASSERT
      const spiele = await db.spiele.toArray();
      expect(spiele).toHaveLength(1);

      const spiel = spiele[0];
      expect(spiel.liga_id).toBeDefined();
      expect(spiel.liga_id).not.toBe('');

      // Verify liga_id matches the Liga UUID
      const liga = await db.ligen
        .where('bbb_liga_id')
        .equals(ligaId.toString())
        .first();

      expect(spiel.liga_id).toBe(liga?.liga_id);
    });

    it('should throw error if Liga not found when syncing Spielplan', async () => {
      // ARRANGE - Ensure DB is completely empty
      await db.ligen.clear();
      await db.teams.clear();
      
      // Verify Liga doesn't exist
      const ligaCheck = await db.ligen
        .where('bbb_liga_id')
        .equals('99999')
        .first();
      expect(ligaCheck).toBeUndefined();

      // Mock getSpielplan - will be called before Liga check fails
      mockBBBApiService.getSpielplan.mockResolvedValueOnce({
        games: [
          {
            matchId: 123,
            gameNumber: 1,
            gameDay: 1,
            date: '2025-10-05',
            time: '18:00',
            homeTeam: { teamId: 1, teamName: 'A' },
            awayTeam: { teamId: 2, teamName: 'B' },
            status: 'scheduled'
          }
        ]
      });

      // ACT & ASSERT - Liga 99999 doesn't exist in DB, should throw
      await expect(syncService.syncSpielplan(99999))
        .rejects
        .toThrow('Liga 99999 not found in DB');
    });
  });

  describe('Altersklassen-Extraktion', () => {
    it('should extract U10 from Liga name', async () => {
      mockBBBApiService.getTabelle.mockResolvedValueOnce({
        ligaId: 50000,
        liganame: 'U10 mixed Bezirksliga Oberpfalz',
        teams: []
      });

      mockBBBApiService.getSpielplan.mockResolvedValueOnce({ games: [] });

      await syncService.syncLiga(50000, { skipMatchInfo: true });

      const liga = await db.ligen.where('bbb_liga_id').equals('50000').first();
      expect(liga?.altersklasse).toBe('U10');
    });

    it('should extract U21 from Liga name', async () => {
      mockBBBApiService.getTabelle.mockResolvedValueOnce({
        ligaId: 50001,
        liganame: 'U21 männlich Regionalliga',
        teams: []
      });

      mockBBBApiService.getSpielplan.mockResolvedValueOnce({ games: [] });

      await syncService.syncLiga(50001, { skipMatchInfo: true });

      const liga = await db.ligen.where('bbb_liga_id').equals('50001').first();
      expect(liga?.altersklasse).toBe('U21');
    });

    it('should extract U23 from Liga name', async () => {
      mockBBBApiService.getTabelle.mockResolvedValueOnce({
        ligaId: 50002,
        liganame: 'U23 weiblich Bezirksoberliga',
        teams: []
      });

      mockBBBApiService.getSpielplan.mockResolvedValueOnce({ games: [] });

      await syncService.syncLiga(50002, { skipMatchInfo: true });

      const liga = await db.ligen.where('bbb_liga_id').equals('50002').first();
      expect(liga?.altersklasse).toBe('U23');
    });

    it('should handle Senioren Liga', async () => {
      mockBBBApiService.getTabelle.mockResolvedValueOnce({
        ligaId: 50003,
        liganame: 'Herren Bezirksliga Oberpfalz',
        teams: []
      });

      mockBBBApiService.getSpielplan.mockResolvedValueOnce({ games: [] });

      await syncService.syncLiga(50003, { skipMatchInfo: true });

      const liga = await db.ligen.where('bbb_liga_id').equals('50003').first();
      // Bei fehlender UXX Altersklasse sollte Fallback auf Senioren erfolgen
      expect(liga?.altersklasse).toBe('Senioren');
    });

    it('should handle Damen Liga as Senioren', async () => {
      mockBBBApiService.getTabelle.mockResolvedValueOnce({
        ligaId: 50004,
        liganame: 'Damen Regionalliga',
        teams: []
      });

      mockBBBApiService.getSpielplan.mockResolvedValueOnce({ games: [] });

      await syncService.syncLiga(50004, { skipMatchInfo: true });

      const liga = await db.ligen.where('bbb_liga_id').equals('50004').first();
      expect(liga?.altersklasse).toBe('Senioren');
    });
  });

  describe('createOrUpdateLiga()', () => {
    it('should create Liga with correct bbb_liga_id', async () => {
      // ARRANGE
      mockBBBApiService.getTabelle.mockResolvedValueOnce({
        ligaId: 51961,
        liganame: 'U10 mixed Bezirksliga',
        teams: []
      });

      mockBBBApiService.getSpielplan.mockResolvedValueOnce({
        games: []
      });

      // ACT
      await syncService.syncLiga(51961, { skipMatchInfo: true });

      // ASSERT
      const liga = await db.ligen
        .where('bbb_liga_id')
        .equals('51961')
        .first();

      expect(liga).toBeDefined();
      expect(liga?.bbb_liga_id).toBe('51961');
      expect(liga?.liga_id).toBeDefined();
      expect(liga?.liga_id).not.toBe('51961'); // UUID ≠ BBB ID
    });

    it('should update existing Liga on re-sync', async () => {
      // ARRANGE - First sync
      mockBBBApiService.getTabelle.mockResolvedValueOnce({
        ligaId: 51961,
        liganame: 'Old Name',
        teams: []
      });

      mockBBBApiService.getSpielplan.mockResolvedValueOnce({
        games: []
      });

      await syncService.syncLiga(51961, { skipMatchInfo: true });

      const ligaBefore = await db.ligen
        .where('bbb_liga_id')
        .equals('51961')
        .first();

      // ACT - Second sync with updated name
      mockBBBApiService.getTabelle.mockResolvedValueOnce({
        ligaId: 51961,
        liganame: 'New Name',
        teams: []
      });

      mockBBBApiService.getSpielplan.mockResolvedValueOnce({
        games: []
      });

      await syncService.syncLiga(51961, { skipMatchInfo: true });

      // ASSERT
      const ligaAfter = await db.ligen
        .where('bbb_liga_id')
        .equals('51961')
        .first();

      expect(ligaAfter?.liga_id).toBe(ligaBefore?.liga_id); // Same UUID
      expect(ligaAfter?.name).toBe('New Name'); // Updated name
    });
  });

  describe('createOrFindTeam()', () => {
    it('should create Team with extern_team_id', async () => {
      // ARRANGE
      mockBBBApiService.getTabelle.mockResolvedValueOnce({
        ligaId: 51961,
        liganame: 'Test Liga',
        teams: [
          {
            position: 1,
            teamId: 432555,
            teamName: 'Fibalon Baskets Neumarkt',
            clubId: 4087,
            clubName: 'Fibalon',
            games: 0,
            wins: 0,
            losses: 0,
            points: 0,
            scoredPoints: 0,
            concededPoints: 0,
            pointsDifference: 0
          }
        ]
      });

      mockBBBApiService.getSpielplan.mockResolvedValueOnce({
        games: []
      });

      // ACT
      await syncService.syncLiga(51961, { skipMatchInfo: true });

      // ASSERT
      const team = await db.teams
        .where('extern_team_id')
        .equals('432555')
        .first();

      expect(team).toBeDefined();
      expect(team?.name).toBe('Fibalon Baskets Neumarkt');
      expect(team?.extern_team_id).toBe('432555');
      expect(team?.team_typ).toBe('gegner'); // Default
    });

    it('should not create duplicate Teams', async () => {
      // ARRANGE - Mock responses for BOTH sync calls
      const mockTableResponse = {
        ligaId: 51961,
        liganame: 'Test Liga',
        teams: [
          {
            position: 1,
            teamId: 432555,
            teamName: 'Team A',
            clubId: 4087,
            clubName: 'Club A',
            games: 0,
            wins: 0,
            losses: 0,
            points: 0,
            scoredPoints: 0,
            concededPoints: 0,
            pointsDifference: 0
          }
        ]
      };

      const mockSpielplanResponse = {
        games: []
      };

      // First sync
      mockBBBApiService.getTabelle.mockResolvedValueOnce(mockTableResponse);
      mockBBBApiService.getSpielplan.mockResolvedValueOnce(mockSpielplanResponse);

      // Second sync
      mockBBBApiService.getTabelle.mockResolvedValueOnce(mockTableResponse);
      mockBBBApiService.getSpielplan.mockResolvedValueOnce(mockSpielplanResponse);

      // ACT - Sync twice
      await syncService.syncLiga(51961, { skipMatchInfo: true });
      await syncService.syncLiga(51961, { skipMatchInfo: true });

      // ASSERT
      const teams = await db.teams
        .where('extern_team_id')
        .equals('432555')
        .toArray();

      expect(teams).toHaveLength(1); // No duplicates
    });
  });
});
