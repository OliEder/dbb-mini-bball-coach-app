/**
 * Unit Tests für BBBSyncService
 * 
 * Testet die Synchronisations-Logik mit der DBB API
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BBBSyncService } from '../BBBSyncService';
import { bbbApiService } from '../BBBApiService';
import { db } from '../../../../shared/db/database';
import type {
  Liga,
  Team,
  Verein,
  Spiel,
  DBBTableResponse,
  DBBSpielplanResponse,
  DBBMatchInfoResponse,
} from '../../../../shared/types';

// Mock BBBApiService
vi.mock('../BBBApiService');

describe('BBBSyncService', () => {
  let service: BBBSyncService;

  beforeEach(async () => {
    // Clear database
    await db.delete();
    await db.open();
    
    service = new BBBSyncService();
    
    // Reset all mocks
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await db.close();
  });

  describe('syncLiga', () => {
    it('sollte eine komplette Liga synchronisieren', async () => {
      const ligaId = 12345;
      
      // Mock Tabelle Response
      const mockTableResponse: DBBTableResponse = {
        ligaId: ligaId,
        liganame: 'U10 Bezirksliga Oberpfalz',
        teams: [
          {
            position: 1,
            teamId: 111,
            teamName: 'SV Postbauer U10',
            clubId: 10,
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
            clubId: 20,
            clubName: 'TSV Neumarkt',
            games: 10,
            wins: 7,
            losses: 3,
            points: 14,
            scoredPoints: 420,
            concededPoints: 390,
            pointsDifference: 30,
          }
        ]
      };

      // Mock Spielplan Response
      const mockSpielplanResponse: DBBSpielplanResponse = {
        ligaId: ligaId,
        liganame: 'U10 Bezirksliga Oberpfalz',
        games: [
          {
            matchId: 99991,
            gameNumber: 1,
            gameDay: 1,
            date: '2025-11-01',
            time: '10:00',
            homeTeam: {
              teamId: 111,
              teamName: 'SV Postbauer U10',
              clubId: 10,
              clubName: 'SV Postbauer',
            },
            awayTeam: {
              teamId: 222,
              teamName: 'TSV Neumarkt U10',
              clubId: 20,
              clubName: 'TSV Neumarkt',
            },
            venue: {
              name: 'Sporthalle Postbauer',
              address: 'Hauptstraße 10, 92353 Postbauer-Heng',
            },
            status: 'scheduled',
            homeScore: undefined,
            awayScore: undefined,
          }
        ]
      };

      // Mock MatchInfo Response
      const mockMatchInfoResponse: DBBMatchInfoResponse = {
        matchId: 99991,
        gameNumber: 1,
        date: '2025-11-01',
        time: '10:00',
        ligaId: ligaId,
        homeTeam: {
          teamId: 111,
          teamName: 'SV Postbauer U10',
          clubId: 10,
          clubName: 'SV Postbauer',
          coach: 'Oliver Marcuseder',
          players: [
            {
              playerId: 1001,
              firstName: 'Max',
              lastName: 'Mustermann',
              jerseyNumber: 4,
              tnaNumber: '123',
            },
            {
              playerId: 1002,
              firstName: 'Tim',
              lastName: 'Test',
              jerseyNumber: 7,
              tnaNumber: '456',
            }
          ]
        },
        awayTeam: {
          teamId: 222,
          teamName: 'TSV Neumarkt U10',
          clubId: 20,
          clubName: 'TSV Neumarkt',
          coach: 'Hans Trainer',
          players: []
        },
        venue: {
          name: 'Sporthalle Postbauer',
          address: 'Hauptstraße 10',
          city: 'Postbauer-Heng',
          zipCode: '92353',
        },
      };

      // Setup mocks
      vi.mocked(bbbApiService.getTabelle).mockResolvedValue(mockTableResponse);
      vi.mocked(bbbApiService.getSpielplan).mockResolvedValue(mockSpielplanResponse);
      vi.mocked(bbbApiService.getMatchInfo).mockResolvedValue(mockMatchInfoResponse);

      // Execute - Skip Match Info für Unit Test
      await service.syncLiga(ligaId, { skipMatchInfo: true });

      // Verify Liga created
      const ligen = await db.ligen.toArray();
      expect(ligen).toHaveLength(1);
      expect(ligen[0]).toMatchObject({
        name: 'U10 Bezirksliga Oberpfalz',
        bbb_liga_id: '12345',
      });

      // Verify Vereine created
      const vereine = await db.vereine.toArray();
      expect(vereine).toHaveLength(2);
      expect(vereine.find(v => v.name === 'SV Postbauer')).toBeDefined();
      expect(vereine.find(v => v.name === 'TSV Neumarkt')).toBeDefined();

      // Verify Teams created
      const teams = await db.teams.toArray();
      expect(teams).toHaveLength(2);
      expect(teams.find(t => t.name === 'SV Postbauer U10')).toMatchObject({
        extern_team_id: '111',
        team_typ: 'gegner', // Default
      });

      // Verify Spielplan created
      const spiele = await db.spiele.toArray();
      expect(spiele).toHaveLength(1);
      expect(spiele[0]).toMatchObject({
        extern_spiel_id: '99991',
        spielnr: 1,
        spieltag: 1,
        heim: 'SV Postbauer U10',
        gast: 'TSV Neumarkt U10',
        status: 'geplant',
      });

      // Verify Halle created
      const hallen = await db.hallen.toArray();
      expect(hallen).toHaveLength(1);
      expect(hallen[0]).toMatchObject({
        name: 'Sporthalle Postbauer',
        strasse: 'Hauptstraße 10',
        plz: '92353',
        ort: 'Postbauer-Heng',
      });

      // Spieler werden nicht erstellt, da skipMatchInfo: true
    });

    it('sollte Fehler abfangen und loggen', async () => {
      const ligaId = 99999;
      const consoleSpy = vi.spyOn(console, 'error');

      // Mock API error
      vi.mocked(bbbApiService.getTabelle).mockRejectedValue(
        new Error('Network error')
      );

      // Execute and expect error
      await expect(service.syncLiga(ligaId)).rejects.toThrow('Network error');

      // Verify error was logged
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to sync Liga'),
        expect.any(Error)
      );
    });
  });

  describe('markAsOwnTeam', () => {
    it('sollte ein Team als "eigen" markieren', async () => {
      const teamId = 'test-team-id';
      const userId = 'test-user-id';

      // Create team
      const team: Team = {
        team_id: teamId,
        verein_id: 'test-verein',
        name: 'Test Team',
        altersklasse: 'U10',
        saison: '2025/26',
        trainer: 'Test Trainer',
        team_typ: 'gegner',
        created_at: new Date(),
      };
      await db.teams.add(team);

      // Execute
      await service.markAsOwnTeam(teamId, userId);

      // Verify
      const updatedTeam = await db.teams.get(teamId);
      expect(updatedTeam).toMatchObject({
        team_typ: 'eigen',
        user_id: userId,
      });
    });
  });

  describe('markMultipleAsOwnTeams', () => {
    it('sollte mehrere Teams als "eigen" markieren', async () => {
      const userId = 'test-user-id';

      // Create teams
      const team1: Team = {
        team_id: 'team-1',
        verein_id: 'test-verein',
        name: 'Team 1',
        altersklasse: 'U10',
        saison: '2025/26',
        trainer: 'Trainer 1',
        team_typ: 'gegner',
        created_at: new Date(),
      };

      const team2: Team = {
        team_id: 'team-2',
        verein_id: 'test-verein',
        name: 'Team 2',
        altersklasse: 'U12',
        saison: '2025/26',
        trainer: 'Trainer 2',
        team_typ: 'gegner',
        created_at: new Date(),
      };

      await db.teams.bulkAdd([team1, team2]);

      // Execute
      await service.markMultipleAsOwnTeams(['team-1', 'team-2'], userId);

      // Verify
      const teams = await db.teams
        .where('user_id')
        .equals(userId)
        .toArray();

      expect(teams).toHaveLength(2);
      teams.forEach(team => {
        expect(team.team_typ).toBe('eigen');
        expect(team.user_id).toBe(userId);
      });
    });
  });

  describe('syncTabelleAndTeams', () => {
    it('sollte Tabellendaten korrekt speichern', async () => {
      const ligaId = 12345;

      // Mock Response
      const mockResponse: DBBTableResponse = {
        ligaId: ligaId,
        liganame: 'Test Liga',
        teams: [
          {
            position: 1,
            teamId: 111,
            teamName: 'Team A',
            clubId: 10,
            clubName: 'Club A',
            games: 5,
            wins: 4,
            losses: 1,
            points: 8,
            scoredPoints: 200,
            concededPoints: 150,
            pointsDifference: 50,
          }
        ]
      };

      vi.mocked(bbbApiService.getTabelle).mockResolvedValue(mockResponse);

      // Execute
      await service.syncTabelleAndTeams(ligaId);

      // Verify Tabellen-Eintrag
      const tabellenEintrag = await db.liga_tabellen.toArray();
      expect(tabellenEintrag).toHaveLength(1);
      expect(tabellenEintrag[0]).toMatchObject({
        teamname: 'Team A',
        platz: 1,
        spiele: 5,
        siege: 4,
        niederlagen: 1,
        punkte: 8,
        korbe_erzielt: 200,
        korbe_erhalten: 150,
        korb_differenz: 50,
      });
    });
  });

  describe('getLigenForSync', () => {
    it('sollte mehrere Ligen nacheinander synchronisieren', async () => {
      const ligaIds = [111, 222, 333];

      // Mock responses
      ligaIds.forEach(ligaId => {
        vi.mocked(bbbApiService.getTabelle).mockResolvedValueOnce({
          ligaId,
          liganame: `Liga ${ligaId}`,
          teams: [],
        } as DBBTableResponse);

        vi.mocked(bbbApiService.getSpielplan).mockResolvedValueOnce({
          ligaId,
          liganame: `Liga ${ligaId}`,
          games: [],
        } as DBBSpielplanResponse);
      });

      // Execute
      await service.getLigenForSync(ligaIds);

      // Verify all Ligen created
      const ligen = await db.ligen.toArray();
      expect(ligen).toHaveLength(3);
      expect(ligen.map(l => l.name)).toEqual(
        expect.arrayContaining([
          'Liga 111',
          'Liga 222',
          'Liga 333',
        ])
      );
    });
  });
});
