/**
 * Unit Tests für BBBApiService
 * 
 * Testet den REST API Wrapper mit CORS-Fallback
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BBBApiService } from '../BBBApiService';
import type {
  WamFilterRequest,
  WamDataResponse,
  DBBTableResponse,
  DBBSpielplanResponse,
  DBBMatchInfoResponse,
} from '../../../../shared/types';

// Mock fetch
global.fetch = vi.fn();

describe('BBBApiService', () => {
  let service: BBBApiService;

  beforeEach(() => {
    service = new BBBApiService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchWithFallback', () => {
    it('sollte direkte Anfrage versuchen', async () => {
      const mockResponse = { ok: true, json: vi.fn().mockResolvedValue({ data: 'test' }) };
      vi.mocked(global.fetch).mockResolvedValueOnce(mockResponse as any);

      const result = await (service as any).fetchWithFallback('https://test.com');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://test.com',
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        })
      );
      expect(result).toBe(mockResponse);
    });

    it('sollte CORS-Proxies als Fallback verwenden', async () => {
      // Direct request fails
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error('CORS error'));

      // First proxy fails
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Proxy 1 error'));

      // Second proxy succeeds
      const mockResponse = { ok: true, json: vi.fn().mockResolvedValue({ data: 'test' }) };
      vi.mocked(global.fetch).mockResolvedValueOnce(mockResponse as any);

      const result = await (service as any).fetchWithFallback('https://test.com');

      // Should have tried direct + 2 proxies
      expect(global.fetch).toHaveBeenCalledTimes(3);
      expect(global.fetch).toHaveBeenNthCalledWith(2, 
        expect.stringContaining('corsproxy.io'),
        expect.any(Object)
      );
      expect(result).toBe(mockResponse);
    });

    it('sollte Fehler werfen wenn alle Proxies fehlschlagen', async () => {
      // All requests fail
      vi.mocked(global.fetch)
        .mockRejectedValueOnce(new Error('Direct fail'))
        .mockRejectedValueOnce(new Error('Proxy 1 fail'))
        .mockRejectedValueOnce(new Error('Proxy 2 fail'))
        .mockRejectedValueOnce(new Error('Proxy 3 fail'));

      await expect(
        (service as any).fetchWithFallback('https://test.com')
      ).rejects.toThrow('All CORS proxies failed');
    });
  });

  describe('filterLigen', () => {
    it('sollte vollständigen Filter mit Defaults erstellen', async () => {
      const mockResponse: WamDataResponse = {
        data: {
          verbaende: [],
          gebiete: [],
          altersklassen: [],
          spielklassen: [],
          ligaListe: {
            ligen: [],
            hasMoreData: false,
            size: 0,
          }
        }
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      } as any);

      const result = await service.filterLigen({
        verbandIds: [2],
        altersklasseIds: [10],
      });

      // Verify request body includes defaults
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: 0,
            verbandIds: [2],
            gebietIds: [],
            ligatypIds: [],
            akgGeschlechtIds: [],
            altersklasseIds: [10],
            spielklasseIds: [],
            sortBy: 1,
          }),
        })
      );

      expect(result).toEqual(mockResponse);
    });
  });

  describe('getTabelle', () => {
    it('sollte Tabellen-Daten abrufen', async () => {
      const ligaId = 12345;
      const mockResponse: DBBTableResponse = {
        ligaId: ligaId,
        liganame: 'Test Liga',
        teams: [],
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      } as any);

      const result = await service.getTabelle(ligaId);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/rest/competition/table/id/${ligaId}`),
        expect.any(Object)
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getSpielplan', () => {
    it('sollte Spielplan-Daten abrufen', async () => {
      const ligaId = 12345;
      const mockResponse: DBBSpielplanResponse = {
        ligaId: ligaId,
        liganame: 'Test Liga',
        games: [],
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      } as any);

      const result = await service.getSpielplan(ligaId);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/rest/competition/spielplan/id/${ligaId}`),
        expect.any(Object)
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getMatchInfo', () => {
    it('sollte Match-Info-Daten abrufen', async () => {
      const matchId = 99991;
      const mockResponse: DBBMatchInfoResponse = {
        matchId: matchId,
        gameNumber: 1,
        date: '2025-11-01',
        time: '10:00',
        ligaId: 12345,
        homeTeam: {
          teamId: 111,
          teamName: 'Team A',
          clubId: 10,
          clubName: 'Club A',
          players: [],
        },
        awayTeam: {
          teamId: 222,
          teamName: 'Team B',
          clubId: 20,
          clubName: 'Club B',
          players: [],
        },
      };

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse),
      } as any);

      const result = await service.getMatchInfo(matchId);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/rest/match/id/${matchId}/matchInfo`),
        expect.any(Object)
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('batchProcess', () => {
    it('sollte Items in Batches verarbeiten', async () => {
      const items = [1, 2, 3, 4, 5];
      const processor = vi.fn().mockImplementation(async (item) => item * 2);

      const results = await service.batchProcess(items, processor, 2, 10);

      // Should process in batches of 2
      expect(processor).toHaveBeenCalledTimes(5);
      expect(results).toEqual([2, 4, 6, 8, 10]);
    });

    it('sollte Delay zwischen Batches einhalten', async () => {
      const items = [1, 2, 3, 4, 5];
      const processor = vi.fn().mockImplementation(async (item) => item * 2);
      const delayMs = 50;

      const start = Date.now();
      await service.batchProcess(items, processor, 2, delayMs);
      const duration = Date.now() - start;

      // Should have 2 delays (3 batches: [1,2], [3,4], [5])
      expect(duration).toBeGreaterThanOrEqual(delayMs * 2);
    });

    it('sollte Fehler in Batch-Items propagieren', async () => {
      const items = [1, 2, 3];
      const processor = vi.fn()
        .mockResolvedValueOnce(2)
        .mockRejectedValueOnce(new Error('Process error'))
        .mockResolvedValueOnce(6);

      await expect(
        service.batchProcess(items, processor, 3, 0)
      ).rejects.toThrow('Process error');
    });

    it('sollte mit leerem Array umgehen können', async () => {
      const items: number[] = [];
      const processor = vi.fn();

      const results = await service.batchProcess(items, processor, 10, 0);

      expect(processor).not.toHaveBeenCalled();
      expect(results).toEqual([]);
    });

    it('sollte mit großen Batch-Größen umgehen können', async () => {
      const items = [1, 2, 3];
      const processor = vi.fn().mockImplementation(async (item) => item * 2);

      const results = await service.batchProcess(items, processor, 100, 0);

      // Should process all in one batch
      expect(processor).toHaveBeenCalledTimes(3);
      expect(results).toEqual([2, 4, 6]);
    });
  });

  describe('CORS Proxy URLs', () => {
    it('sollte korrekte Proxy-URLs erstellen', () => {
      const proxies = (service as any).CORS_PROXIES;
      const testUrl = 'https://test.com/api';

      expect(proxies[0] + encodeURIComponent(testUrl)).toContain('corsproxy.io');
      expect(proxies.some(p => p.includes('cors-anywhere.herokuapp.com'))).toBeTruthy();
      expect(proxies.some(p => p.includes('allorigins.win'))).toBeTruthy();
    });
  });

  describe('validateTabellenEintrag', () => {
    it('sollte gültigen Eintrag validieren', () => {
      const validEntry = {
        position: 1,
        teamId: 123,
        teamName: 'Team A',
        clubId: 456,
        clubName: 'Club A',
        games: 10,
        wins: 7,
        losses: 3,
        points: 14,
        scoredPoints: 500,
        concededPoints: 450,
        pointsDifference: 50,
      };
      
      expect(BBBApiService.validateTabellenEintrag(validEntry)).toBe(true);
    });

    it('sollte Einträge mit fehlenden Feldern ablehnen', () => {
      const invalidEntry = {
        position: 1,
        teamName: 'Team A',
        // teamId fehlt
      };
      
      expect(BBBApiService.validateTabellenEintrag(invalidEntry)).toBe(false);
    });

    it('sollte Einträge mit falschen Typen ablehnen', () => {
      const invalidEntry = {
        position: '1', // sollte number sein
        teamId: 123,
        teamName: 'Team A',
        clubId: 456,
        clubName: 'Club A',
        games: 10,
        wins: 7,
        losses: 3,
        points: 14,
        scoredPoints: 500,
        concededPoints: 450,
        pointsDifference: 50,
      };
      
      expect(BBBApiService.validateTabellenEintrag(invalidEntry)).toBe(false);
    });

    it('sollte Plausibilitätsprüfungen durchführen', () => {
      const invalidEntry = {
        position: 0, // sollte >= 1 sein
        teamId: 123,
        teamName: 'Team A',
        clubId: 456,
        clubName: 'Club A',
        games: 10,
        wins: 11, // mehr Siege als Spiele!
        losses: 0,
        points: 22,
        scoredPoints: 500,
        concededPoints: 450,
        pointsDifference: 50,
      };
      
      expect(BBBApiService.validateTabellenEintrag(invalidEntry)).toBe(false);
    });

    it('sollte falsche Punktedifferenz erkennen', () => {
      const invalidEntry = {
        position: 1,
        teamId: 123,
        teamName: 'Team A',
        clubId: 456,
        clubName: 'Club A',
        games: 10,
        wins: 7,
        losses: 3,
        points: 14,
        scoredPoints: 500,
        concededPoints: 450,
        pointsDifference: 100, // sollte 50 sein
      };
      
      expect(BBBApiService.validateTabellenEintrag(invalidEntry)).toBe(false);
    });

    it('sollte negative Werte ablehnen', () => {
      const invalidEntry = {
        position: 1,
        teamId: 123,
        teamName: 'Team A',
        clubId: 456,
        clubName: 'Club A',
        games: -1, // negativ!
        wins: 0,
        losses: 0,
        points: 0,
        scoredPoints: 0,
        concededPoints: 0,
        pointsDifference: 0,
      };
      
      expect(BBBApiService.validateTabellenEintrag(invalidEntry)).toBe(false);
    });

    it('sollte leere Team-Namen ablehnen', () => {
      const invalidEntry = {
        position: 1,
        teamId: 123,
        teamName: '   ', // nur Whitespace
        clubId: 456,
        clubName: 'Club A',
        games: 10,
        wins: 7,
        losses: 3,
        points: 14,
        scoredPoints: 500,
        concededPoints: 450,
        pointsDifference: 50,
      };
      
      expect(BBBApiService.validateTabellenEintrag(invalidEntry)).toBe(false);
    });

    it('sollte null und undefined ablehnen', () => {
      expect(BBBApiService.validateTabellenEintrag(null)).toBe(false);
      expect(BBBApiService.validateTabellenEintrag(undefined)).toBe(false);
      expect(BBBApiService.validateTabellenEintrag({})).toBe(false);
    });

    it('sollte Unentschieden korrekt berücksichtigen', () => {
      const validEntry = {
        position: 1,
        teamId: 123,
        teamName: 'Team A',
        clubId: 456,
        clubName: 'Club A',
        games: 10,
        wins: 7,
        losses: 2,
        points: 15, // 7*2 + 1*1 (1 Unentschieden)
        scoredPoints: 500,
        concededPoints: 450,
        pointsDifference: 50,
      };
      
      expect(BBBApiService.validateTabellenEintrag(validEntry)).toBe(true);
    });
  });

  describe('extractLigaId', () => {
    it('sollte Liga-ID aus Standard-Parameter extrahieren', () => {
      const url = 'https://www.basketball-bund.net/ergebnisse.jsp?liga_id=51961';
      expect(BBBApiService.extractLigaId(url)).toBe(51961);
    });

    it('sollte Liga-ID aus alternativer Schreibweise extrahieren', () => {
      const url = 'https://www.basketball-bund.net/page?ligaid=51961&view=table';
      expect(BBBApiService.extractLigaId(url)).toBe(51961);
    });

    it('sollte Liga-ID aus REST API URL extrahieren', () => {
      const url = 'https://www.basketball-bund.net/rest/competition/id/51961/table';
      expect(BBBApiService.extractLigaId(url)).toBe(51961);
    });

    it('sollte Liga-ID aus komplexer URL mit mehreren Parametern extrahieren', () => {
      const url = 'https://www.basketball-bund.net/public/ergebnisse.jsp?print=1&viewDescKey=sport.dbb.liga.ErgebnisseViewPublic%2Findex.jsp_&liga_id=51961';
      expect(BBBApiService.extractLigaId(url)).toBe(51961);
    });

    it('sollte null zurückgeben wenn keine Liga-ID gefunden', () => {
      const url = 'https://www.basketball-bund.net/home';
      expect(BBBApiService.extractLigaId(url)).toBeNull();
    });

    it('sollte ungültige Liga-IDs ablehnen', () => {
      expect(BBBApiService.extractLigaId('?liga_id=abc')).toBeNull();
      expect(BBBApiService.extractLigaId('?liga_id=-123')).toBeNull();
      expect(BBBApiService.extractLigaId('?liga_id=0')).toBeNull();
    });

    it('sollte mit ungültigen URLs umgehen können', () => {
      expect(BBBApiService.extractLigaId('')).toBeNull();
      expect(BBBApiService.extractLigaId('not-a-url')).toBeNull();
      expect(BBBApiService.extractLigaId('javascript:alert(1)')).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('sollte Netzwerkfehler behandeln', async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error('Network error'));

      await expect(service.getTabelle(12345)).rejects.toThrow();
    });

    it('sollte Timeout behandeln', async () => {
      // Simulate timeout
      vi.mocked(global.fetch).mockImplementation(
        () => new Promise((_, reject) => {
          setTimeout(() => reject(new Error('AbortError')), 100);
        })
      );

      await expect(service.getTabelle(12345)).rejects.toThrow();
    });

    it('sollte ungültige JSON-Antworten behandeln', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
      } as any);

      await expect(service.getTabelle(12345)).rejects.toThrow('Invalid JSON');
    });
  });
});
