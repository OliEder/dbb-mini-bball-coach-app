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
        altersklasse: 'U10',  // ✅ Extrahiert aus Liga-Namen
      });
      // Saison wird aus aktuellem Datum berechnet (z.B. 2025/26 wenn Test im Aug-Dez 2025 läuft)

      // Verify Vereine created
      const vereine = await db.vereine.toArray();
      expect(vereine).toHaveLength(2);
      expect(vereine.find(v => v.name === 'SV Postbauer')).toBeDefined();
      expect(vereine.find(v => v.name === 'TSV Neumarkt')).toBeDefined();

      // Verify Teams created
      const teams = await db.teams.toArray();
      expect(teams).toHaveLength(2);
      const svTeam = teams.find(t => t.name === 'SV Postbauer U10');
      expect(svTeam).toBeDefined();
      expect(svTeam).toMatchObject({
        extern_team_id: '111',
        team_typ: 'gegner', // Default
        altersklasse: 'U10',  // ✅ Von Liga übernommen
      });
      // Saison wird von Liga übernommen (dynamisch basierend auf Datum)

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
        altersklasse: 'U10',  // ✅ Von Liga übernommen
      });
      // Saison ist nicht im Spiel-Entity

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
        saison: '2025/26',  // Beliebiger Wert für Test
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

  describe('Altersklasse und Saison Extraktion', () => {
    it('sollte Altersklasse aus Liga-Namen extrahieren', async () => {
      const testCases = [
        { liganame: 'U14 männlich Bezirksoberliga', expectedAK: 'U14' },
        { liganame: 'U16 weiblich Landesliga', expectedAK: 'U16' },
        { liganame: 'U10 mixed Bezirksliga', expectedAK: 'U10' },
        { liganame: 'U8 Minibasketball', expectedAK: 'U8' },
      ];

      for (const testCase of testCases) {
        await db.delete();
        await db.open();

        vi.mocked(bbbApiService.getTabelle).mockResolvedValue({
          ligaId: 12345,
          liganame: testCase.liganame,
          teams: [],
        } as DBBTableResponse);

        vi.mocked(bbbApiService.getSpielplan).mockResolvedValue({
          ligaId: 12345,
          liganame: testCase.liganame,
          games: [],
        } as DBBSpielplanResponse);

        await service.syncLiga(12345, { skipMatchInfo: true });

        // ✅ Korrekter Weg um erste Liga zu holen
        const ligen = await db.ligen.toArray();
        expect(ligen.length).toBeGreaterThan(0);
        expect(ligen[0].altersklasse).toBe(testCase.expectedAK);
      }
    });

    it('sollte Saison aus Liga-Namen extrahieren', async () => {
      const testCases = [
        { liganame: 'U14 männlich 2024/25 Bezirksoberliga', expectedSaison: '2024/25' },
        { liganame: 'U16 weiblich 2025-26 Landesliga', expectedSaison: '2025/26' },
        { liganame: 'U10 mixed 2023/2024 Bezirksliga', expectedSaison: '2023/24' },
      ];

      for (const testCase of testCases) {
        await db.delete();
        await db.open();

        vi.mocked(bbbApiService.getTabelle).mockResolvedValue({
          ligaId: 12345,
          liganame: testCase.liganame,
          teams: [],
        } as DBBTableResponse);

        vi.mocked(bbbApiService.getSpielplan).mockResolvedValue({
          ligaId: 12345,
          liganame: testCase.liganame,
          games: [],
        } as DBBSpielplanResponse);

        await service.syncLiga(12345, { skipMatchInfo: true });

        // ✅ Korrekter Weg um erste Liga zu holen
        const ligen = await db.ligen.toArray();
        expect(ligen.length).toBeGreaterThan(0);
        expect(ligen[0].saison).toBe(testCase.expectedSaison);
      }
    });

    it('sollte Fallback-Saison verwenden wenn nicht im Namen', async () => {
      vi.mocked(bbbApiService.getTabelle).mockResolvedValue({
        ligaId: 12345,
        liganame: 'U10 Bezirksliga Oberpfalz',  // Keine Saison im Namen
        teams: [],
      } as DBBTableResponse);

      vi.mocked(bbbApiService.getSpielplan).mockResolvedValue({
        ligaId: 12345,
        liganame: 'U10 Bezirksliga Oberpfalz',
        games: [],
      } as DBBSpielplanResponse);

      await service.syncLiga(12345, { skipMatchInfo: true });

      // ✅ Korrekter Weg um erste Liga zu holen
      const ligen = await db.ligen.toArray();
      expect(ligen.length).toBeGreaterThan(0);
      // Sollte aktuelle Saison basierend auf Datum haben
      expect(ligen[0].saison).toMatch(/\d{4}\/\d{2}/);
    });

    it('sollte Team-Altersklasse aus Team-Namen extrahieren, nicht von Liga', async () => {
      // ✅ WICHTIGER TEST: U12-Team in U14-Liga (hochspielen)
      await db.delete();
      await db.open();

      const ligaName = 'U14 männlich Bezirksoberliga';
      const teamName = 'SV Postbauer U12';  // U12 Team spielt in U14 Liga hoch!

      vi.mocked(bbbApiService.getTabelle).mockResolvedValue({
        ligaId: 12345,
        liganame: ligaName,
        teams: [
          {
            position: 1,
            teamId: 111,
            teamName: teamName,
            clubId: 10,
            clubName: 'SV Postbauer',
            games: 10,
            wins: 8,
            losses: 2,
            points: 16,
            scoredPoints: 450,
            concededPoints: 380,
            pointsDifference: 70,
          }
        ]
      } as DBBTableResponse);

      vi.mocked(bbbApiService.getSpielplan).mockResolvedValue({
        ligaId: 12345,
        liganame: ligaName,
        games: [],
      } as DBBSpielplanResponse);

      await service.syncLiga(12345, { skipMatchInfo: true });

      // Verify Liga hat U14
      const liga = await db.ligen.toArray();
      expect(liga[0].altersklasse).toBe('U14');

      // Verify Team hat U12 (nicht U14!)
      const team = await db.teams.toArray();
      expect(team[0].altersklasse).toBe('U12');  // ✅ Von Team-Namen!
      expect(team[0].name).toBe(teamName);

      // Verify Saison ist von Liga übernommen
      expect(team[0].saison).toBe(liga[0].saison);
    });
  });
});
