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

    // âœ… Initialize services with test mode to disable CORS fallback
    apiService = new BBBApiService({
      baseUrl: provider.url,
      testMode: true  // Deaktiviert CORS-Fallback!
    });
    service = new BBBSyncService(apiService);
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
      
      // Expected Response with Matchers (mit data-Wrapper und deutschen Feldnamen)
      const expectedResponse = {
        data: {
          ligaId: like(ligaId),
          liganame: like('U10 Bezirksliga Oberpfalz'),
          teams: eachLike({
            platzierung: like(1),
            teamId: like(111),
            teamname: like('SV Postbauer U10'),
            vereinId: like(10),
            vereinname: like('SV Postbauer'),
            spiele: like(10),
            gewonnen: like(8),
            verloren: like(2),
            punkte: like(16),
            korbpunkteGemacht: like(450),
            korbpunkteGegen: like(380),
            differenz: like(70),
          }),
        },
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
          // ✅ Create API service with testMode enabled
          const testApiService = new BBBApiService({
            baseUrl: mockService.url,
            testMode: true
          });

          // Execute
          const result = await testApiService.getTabelle(ligaId);

          // Verify
          expect(result.ligaId).toBe(ligaId);
          expect(result.teams).toHaveLength(1);
          expect(result.teams[0].teamName).toBe('SV Postbauer U10');
        });
    });

    it('sollte Spielplan-Daten gemäß Contract abrufen', async () => {
      const ligaId = 12345;
      
      // Expected Response with Matchers (mit data-Wrapper und deutschen Feldnamen)
      const expectedResponse = {
        data: {
          ligaId: like(ligaId),
          liganame: like('U10 Bezirksliga Oberpfalz'),
          spielplan: eachLike({
            matchId: like(99991),         // ✅ Englische Namen für einfacheres Mapping
            matchNo: like(1),
            matchDay: like(1),
            kickoffDate: like('2025-11-01'),
            kickoffTime: like('10:00'),
            homeTeam: {
              seasonTeamId: like(111),
              teamname: like('SV Postbauer U10')
            },
            guestTeam: {
              seasonTeamId: like(222),
              teamname: like('TSV Neumarkt U10')
            },
            venue: like('Sporthalle Postbauer'),
            result: like(null),
          }),
        },
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
          // ✅ Create API service with testMode enabled
          const testApiService = new BBBApiService({
            baseUrl: mockService.url,
            testMode: true
          });

          const result = await testApiService.getSpielplan(ligaId);

          expect(result.ligaId).toBe(ligaId);
          expect(result.games).toHaveLength(1);
          expect(result.games[0].homeTeam.teamName).toBe('SV Postbauer U10');
        });
    });

    it('sollte Match-Info-Daten gemäß Contract abrufen', async () => {
      const matchId = 99991;
      
      // Expected Response with Matchers (mit data-Wrapper und deutschen Feldnamen)
      const expectedResponse = {
        data: {
          spielNr: like('1'),
          datum: like('2025-11-01'),
          uhrzeit: like('10:00'),
          heimmannschaft: like('SV Postbauer U10'),
          gastmannschaft: like('TSV Neumarkt U10'),
          ort: like('Sporthalle Postbauer'),
          heimErgebnis: like(null),
          gastErgebnis: like(null),
          heimSpielerList: eachLike({
            spielerNr: like('10'),
            vorname: like('Max'),
            nachname: like('Mustermann'),
            tnaLetzten3: like('123'),
          }),
          gastSpielerList: like([]),
          schiedsrichter1: like('Referee 1'),
          schiedsrichter2: like('Referee 2'),
        },
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
          // ✅ Create API service with testMode enabled
          const testApiService = new BBBApiService({
            baseUrl: mockService.url,
            testMode: true
          });

          const result = await testApiService.getMatchInfo(matchId);

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
          // ✅ Create API service with testMode enabled
          const testApiService = new BBBApiService({
            baseUrl: mockService.url,
            testMode: true
          });

          await expect(testApiService.getTabelle(invalidLigaId)).rejects.toThrow();
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
          // ✅ Create API service with testMode enabled
          const testApiService = new BBBApiService({
            baseUrl: mockService.url,
            testMode: true
          });

          await expect(testApiService.getTabelle(ligaId)).rejects.toThrow();
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
          // ✅ Create API service with testMode enabled
          const testApiService = new BBBApiService({
            baseUrl: mockService.url,
            testMode: true
          });

          const result = await testApiService.filterLigen({
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
