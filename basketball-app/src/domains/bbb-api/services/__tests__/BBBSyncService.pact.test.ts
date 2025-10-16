/**
 * PACT Tests für BBBSyncService - Version 16 kompatibel
 * 
 * Contract Tests für die DBB REST API Integration
 * Updated für @pact-foundation/pact v16
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { PactV3, MatchersV3 } from '@pact-foundation/pact';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { BBBSyncService } from '../BBBSyncService';
import { BBBApiService, bbbApiService } from '../BBBApiService';
import { db } from '../../../../shared/db/database';
import type {
  DBBTableResponse,
  DBBSpielplanResponse,
  DBBMatchInfoResponse,
} from '../../../../shared/types';

const { like, eachLike } = MatchersV3;

// PACT v16 Provider Setup
const provider = new PactV3({
  consumer: 'Basketball-PWA',
  provider: 'DBB-API',
  logLevel: 'warn',
  dir: path.resolve(__dirname, '../../../../../pacts/contracts'),
});

describe('BBBSyncService PACT Tests v16', () => {
  let service: BBBSyncService;
  let apiService: BBBApiService;

  beforeAll(async () => {
    // Clear database
    await db.delete();
    await db.open();
  });

  afterEach(async () => {
    // Clear DB between tests
    await db.delete();
    await db.open();
  });

  afterAll(async () => {
    await db.close();
  });

  describe('Liga Sync Contract', () => {
    it('sollte Tabellen-Daten gemäß Contract abrufen', async () => {
      const ligaId = 12345;
      
      // Expected Response with Matchers
      const expectedResponse = {
        ligaId: like(ligaId),
        liganame: like('U10 Bezirksliga Oberpfalz'),
        teams: eachLike({
          position: like(1),
          teamId: like(111),
          teamName: like('SV Postbauer U10'),
          clubId: like(10),
          clubName: like('SV Postbauer'),
          games: like(10),
          wins: like(8),
          losses: like(2),
          points: like(16),
          scoredPoints: like(450),
          concededPoints: like(380),
          pointsDifference: like(70),
        }),
      };

      await provider
        .given('Liga exists with teams')
        .uponReceiving('a request for competition table')
        .withRequest({
          method: 'GET',
          path: `/rest/competition/table/id/${ligaId}`,
          headers: {
            'Accept': 'application/json',
          },
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: expectedResponse,
        })
        .executeTest(async (mockService) => {
          // Configure API service to use mock URL
          apiService = new BBBApiService();
          (apiService as any).BASE_URL = mockService.url;

          // Execute
          const result = await apiService.getTabelle(ligaId);

          // Verify
          expect(result.ligaId).toBe(ligaId);
          expect(result.teams).toHaveLength(1);
          expect(result.teams[0].teamName).toBe('SV Postbauer U10');
        });
    });

    it('sollte Spielplan-Daten gemäß Contract abrufen', async () => {
      const ligaId = 12345;
      
      // Expected Response with Matchers
      const expectedResponse = {
        ligaId: like(ligaId),
        liganame: like('U10 Bezirksliga Oberpfalz'),
        games: eachLike({
          matchId: like(99991),
          gameNumber: like(1),
          gameDay: like(1),
          date: like('2025-11-01'),
          time: like('10:00'),
          homeTeam: like({
            teamId: 111,
            teamName: 'SV Postbauer U10',
            clubId: 10,
            clubName: 'SV Postbauer',
          }),
          awayTeam: like({
            teamId: 222,
            teamName: 'TSV Neumarkt U10',
            clubId: 20,
            clubName: 'TSV Neumarkt',
          }),
          venue: like({
            name: 'Sporthalle Postbauer',
            address: 'Hauptstraße 10',
          }),
          status: like('scheduled'),
        }),
      };

      await provider
        .given('Liga has scheduled games')
        .uponReceiving('a request for competition spielplan')
        .withRequest({
          method: 'GET',
          path: `/rest/competition/spielplan/id/${ligaId}`,
          headers: {
            'Accept': 'application/json',
          },
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: expectedResponse,
        })
        .executeTest(async (mockService) => {
          apiService = new BBBApiService();
          (apiService as any).BASE_URL = mockService.url;

          const result = await apiService.getSpielplan(ligaId);

          expect(result.ligaId).toBe(ligaId);
          expect(result.games).toHaveLength(1);
          expect(result.games[0].homeTeam.teamName).toBe('SV Postbauer U10');
        });
    });

    it('sollte Match-Info-Daten gemäß Contract abrufen', async () => {
      const matchId = 99991;
      
      // Expected Response with Matchers
      const expectedResponse = {
        matchId: like(matchId),
        gameNumber: like(1),
        date: like('2025-11-01'),
        time: like('10:00'),
        ligaId: like(12345),
        homeTeam: like({
          teamId: 111,
          teamName: 'SV Postbauer U10',
          clubId: 10,
          clubName: 'SV Postbauer',
          coach: 'Oliver Marcuseder',
          players: eachLike({
            playerId: 1001,
            firstName: 'Max',
            lastName: 'Mustermann',
            jerseyNumber: 4,
            tnaNumber: '123',
          }),
        }),
        awayTeam: like({
          teamId: 222,
          teamName: 'TSV Neumarkt U10',
          clubId: 20,
          clubName: 'TSV Neumarkt',
          coach: 'Hans Trainer',
          players: [],
        }),
        venue: like({
          name: 'Sporthalle Postbauer',
          address: 'Hauptstraße 10',
          city: 'Postbauer-Heng',
          zipCode: '92353',
        }),
      };

      await provider
        .given('Match exists with full info')
        .uponReceiving('a request for match info')
        .withRequest({
          method: 'GET',
          path: `/rest/match/id/${matchId}/matchInfo`,
          headers: {
            'Accept': 'application/json',
          },
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: expectedResponse,
        })
        .executeTest(async (mockService) => {
          apiService = new BBBApiService();
          (apiService as any).BASE_URL = mockService.url;

          const result = await apiService.getMatchInfo(matchId);

          expect(result.matchId).toBe(matchId);
          expect(result.homeTeam.players).toHaveLength(1);
          expect(result.homeTeam.players[0].firstName).toBe('Max');
          expect(result.venue?.name).toBe('Sporthalle Postbauer');
        });
    });
  });

  describe('Error Handling Contract', () => {
    it('sollte 404 Fehler korrekt behandeln', async () => {
      const invalidLigaId = 99999;

      await provider
        .given('Liga does not exist')
        .uponReceiving('a request for non-existent liga')
        .withRequest({
          method: 'GET',
          path: `/rest/competition/table/id/${invalidLigaId}`,
        })
        .willRespondWith({
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            error: like('Liga not found'),
            code: like('LIGA_NOT_FOUND'),
          },
        })
        .executeTest(async (mockService) => {
          apiService = new BBBApiService();
          (apiService as any).BASE_URL = mockService.url;

          await expect(apiService.getTabelle(invalidLigaId)).rejects.toThrow();
        });
    });

    it('sollte Rate-Limiting respektieren', async () => {
      const ligaId = 12345;

      await provider
        .given('Rate limit exceeded')
        .uponReceiving('too many requests')
        .withRequest({
          method: 'GET',
          path: `/rest/competition/table/id/${ligaId}`,
        })
        .willRespondWith({
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60',
          },
          body: {
            error: like('Rate limit exceeded'),
            retryAfter: like(60),
          },
        })
        .executeTest(async (mockService) => {
          apiService = new BBBApiService();
          (apiService as any).BASE_URL = mockService.url;

          await expect(apiService.getTabelle(ligaId)).rejects.toThrow();
        });
    });
  });

  describe('WAM Filter Contract', () => {
    it('sollte Liga-Filter gemäß Contract senden', async () => {
      // Request
      const filterRequest = {
        token: 0,
        verbandIds: [2], // Bayern
        gebietIds: [],
        ligatypIds: [],
        akgGeschlechtIds: [],
        altersklasseIds: [10], // U10
        spielklasseIds: [],
        sortBy: 1,
      };

      // Expected Response with Matchers
      const expectedResponse = {
        data: {
          verbaende: eachLike({ 
            id: like(2), 
            label: like('Bayern'), 
            hits: like(100) 
          }),
          gebiete: [],
          altersklassen: eachLike({ 
            id: like(10), 
            label: like('U10'), 
            hits: like(50) 
          }),
          spielklassen: [],
          ligaListe: like({
            ligen: eachLike({
              ligaId: like(12345),
              liganame: like('U10 Bezirksliga Oberpfalz'),
              liganr: like(100),
              skName: like('Bezirksliga'),
              akName: like('U10'),
              geschlecht: like('mixed'),
              verbandId: like(2),
              verbandName: like('Bayern'),
              bezirknr: like(5),
              bezirkName: like('Oberpfalz'),
            }),
            hasMoreData: like(false),
            size: like(1),
          }),
        },
      };

      await provider
        .given('Filter options available')
        .uponReceiving('a request to filter ligen')
        .withRequest({
          method: 'POST',
          path: '/rest/wam/data',
          headers: {
            'Content-Type': 'application/json',
          },
          body: filterRequest,
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: expectedResponse,
        })
        .executeTest(async (mockService) => {
          apiService = new BBBApiService();
          (apiService as any).BASE_URL = mockService.url;

          const result = await apiService.filterLigen({
            verbandIds: [2],
            altersklasseIds: [10],
          });

          expect(result.data.ligaListe?.ligen).toHaveLength(1);
          expect(result.data.ligaListe?.ligen[0].liganame).toBe('U10 Bezirksliga Oberpfalz');
        });
    });
  });

  describe('Full Sync Integration', () => {
    it.skip('sollte komplette Liga synchronisieren', async () => {
      const ligaId = 12345;

      // Setup multiple endpoints
      await provider
        .given('Liga exists with full data')
        .uponReceiving('multiple requests for complete sync')
        .withRequest({
          method: 'GET',
          path: `/rest/competition/table/id/${ligaId}`,
          headers: {
            'Accept': 'application/json',
          },
        })
        .willRespondWith({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: {
            ligaId: ligaId,  // Actual value, not matcher
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
            }],
          },
        })
        .executeTest(async (mockService) => {
          // Mock den globalen bbbApiService
          const originalBaseUrl = (bbbApiService as any).BASE_URL;
          (bbbApiService as any).BASE_URL = mockService.url;
          
          try {
            service = new BBBSyncService();
            
            // Should create teams from table
            await service.syncTabelleAndTeams(ligaId);

            const teams = await db.teams.toArray();
            expect(teams).toHaveLength(1);
            expect(teams[0].name).toBe('Team A');
            
            const ligen = await db.ligen.toArray();
            expect(ligen).toHaveLength(1);
            expect(ligen[0].name).toBe('Test Liga');
          } finally {
            // Restore original
            (bbbApiService as any).BASE_URL = originalBaseUrl;
          }
        });
    });
  });
});
