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
  DBBPlayerDetailsResponse,
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
    it('sollte direkte Anfrage versuchen (DEV: verwendet Proxy)', async () => {
      const mockResponse = { ok: true, json: vi.fn().mockResolvedValue({ data: 'test' }) };
      vi.mocked(global.fetch).mockResolvedValueOnce(mockResponse as any);

      const result = await (service as any).fetchWithFallback('https://test.com');

      // Im DEV-Modus wird direkt ein Proxy verwendet (kein direkter Call)
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('corsproxy.io'),
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        })
      );
      expect(result).toBe(mockResponse);
    });

    it('sollte CORS-Proxies als Fallback verwenden', async () => {
      // Im DEV-Modus: Erster Proxy fails (nicht ok)
      const badResponse = { ok: false };
      vi.mocked(global.fetch).mockResolvedValueOnce(badResponse as any);

      // Zweiter Proxy succeeds
      const mockResponse = { ok: true, json: vi.fn().mockResolvedValue({ data: 'test' }) };
      vi.mocked(global.fetch).mockResolvedValueOnce(mockResponse as any);

      const result = await (service as any).fetchWithFallback('https://test.com');

      // DEV-Modus: Kein direkter Call, sondern 2 Proxy-Versuche
      expect(global.fetch).toHaveBeenCalledTimes(2);
      // Erster Call sollte corsproxy.io sein
      expect(global.fetch).toHaveBeenNthCalledWith(1, 
        expect.stringContaining('corsproxy.io'),
        expect.any(Object)
      );
      // Zweiter Call sollte proxy.cors.sh sein
      expect(global.fetch).toHaveBeenNthCalledWith(2, 
        expect.stringContaining('proxy.cors.sh'),
        expect.any(Object)
      );
      expect(result).toBe(mockResponse);
    });

    it('sollte Fehler werfen wenn alle Proxies fehlschlagen', async () => {
      // Im DEV-Modus: Kein direkter Call, nur 6 Proxies
      // All 6 proxies fail
      for (let i = 0; i < 6; i++) {
        vi.mocked(global.fetch).mockRejectedValueOnce(new Error(`Proxy ${i+1} fail`));
      }

      await expect(
        (service as any).fetchWithFallback('https://test.com')
      ).rejects.toThrow('All CORS proxies failed');

      // DEV-Modus: Nur 6 Proxy-Versuche (kein direkter Call)
      expect(global.fetch).toHaveBeenCalledTimes(6);
    });
  });

  describe('filterLigen', () => {
    it('sollte vollständigen Filter mit Defaults erstellen', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          data: {
            ligaListe: {
              ligen: [],
              hasMoreData: false,
            },
          },
        }),
      };
      vi.mocked(global.fetch).mockResolvedValueOnce(mockResponse as any);

      const filter: Partial<WamFilterRequest> = {
        verbandIds: [1],
      };

      await service.filterLigen(filter);

      expect(global.fetch).toHaveBeenCalled();
      const fetchCall = vi.mocked(global.fetch).mock.calls[0];
      const body = JSON.parse(fetchCall[1]?.body as string);
      
      expect(body.token).toBe(0);
      expect(body.verbandIds).toEqual([1]);
      expect(body.gebietIds).toEqual([]);
      expect(body.sortBy).toBe(1);
    });
  });

  describe('getTabelle', () => {
    it('sollte Tabellen-Daten abrufen', async () => {
      const mockData = {
        data: {
          ligaId: 12345,
          liganame: 'Test Liga',
          teams: [
            {
              platzierung: 1,
              teamId: 1,
              teamname: 'Team A',
              spiele: 10,
              gewonnen: 8,
              verloren: 2,
              punkte: 16,
              korbpunkteGemacht: 800,
              korbpunkteGegen: 700,
              differenz: 100,
            },
          ],
        },
      };

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockData),
      };
      vi.mocked(global.fetch).mockResolvedValueOnce(mockResponse as any);

      const result = await service.getTabelle(12345);

      // Erwartet gemappte Daten
      expect(result.teams).toHaveLength(1);
      expect(result.teams[0]).toMatchObject({
        position: 1,
        teamId: 1,
        teamName: 'Team A',
        games: 10,
        wins: 8,
        losses: 2,
      });
    });
  });

  describe('getSpielplan', () => {
    it('sollte Spielplan-Daten abrufen', async () => {
      const mockData = {
        data: {
          ligaData: {
            ligaId: 12345,
            liganame: 'Test Liga'
          },
          matches: [
            {
              matchId: 1,
              matchNo: 1,
              matchDay: 1,
              kickoffDate: '2025-10-23',
              kickoffTime: '18:00',
              homeTeam: {
                seasonTeamId: 100,
                teamname: 'Home Team'
              },
              guestTeam: {
                seasonTeamId: 200,
                teamname: 'Away Team'
              },
              venue: 'Test Halle',
              result: null
            },
          ],
        },
      };

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockData),
      };
      vi.mocked(global.fetch).mockResolvedValueOnce(mockResponse as any);

      const result = await service.getSpielplan(12345);

      // Erwartet gemappte Daten
      expect(result.games).toHaveLength(1);
      expect(result.games[0]).toMatchObject({
        matchId: 1,
        gameNumber: 1,
        gameDay: 1,
        homeTeam: {
          teamId: 100,
          teamName: 'Home Team'
        },
        awayTeam: {
          teamId: 200,
          teamName: 'Away Team'
        },
        status: 'scheduled'
      });
    });
  });

  describe('getMatchInfo', () => {
    it('sollte Match-Info-Daten abrufen', async () => {
      const mockData = {
        data: {
          spielNr: '1',
          datum: '2025-10-23',
          uhrzeit: '18:00',
          heimmannschaft: 'Home Team',
          gastmannschaft: 'Away Team',
          ort: 'Test Venue',
          heimErgebnis: 80,
          gastErgebnis: 75,
          heimSpielerList: [
            {
              spielerNr: '10',
              vorname: 'Max',
              nachname: 'Mustermann',
              tnaLetzten3: '123',
            },
          ],
          gastSpielerList: [],
        },
      };

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockData),
      };
      vi.mocked(global.fetch).mockResolvedValueOnce(mockResponse as any);

      const result = await service.getMatchInfo(99991);

      // Erwartet gemappte Daten
      expect(result.homeTeam.players).toHaveLength(1);
      expect(result.homeTeam.players[0]).toMatchObject({
        playerId: 10,
        firstName: 'Max',
        lastName: 'Mustermann',
      });
    });
  });

  describe('batchProcess', () => {
    it('sollte Items in Batches verarbeiten', async () => {
      const items = [1, 2, 3, 4, 5];
      const processor = vi.fn().mockImplementation((x: number) => Promise.resolve(x * 2));

      const results = await service.batchProcess(items, processor, 2, 0);

      expect(results).toEqual([2, 4, 6, 8, 10]);
      expect(processor).toHaveBeenCalledTimes(5);
    });

    it('sollte Delay zwischen Batches einhalten', async () => {
      const items = [1, 2, 3];
      const processor = vi.fn().mockImplementation((x: number) => Promise.resolve(x));
      const delayMs = 100;

      const start = Date.now();
      await service.batchProcess(items, processor, 1, delayMs);
      const duration = Date.now() - start;

      // Sollte mindestens 2 * 100ms (2 Delays) dauern
      expect(duration).toBeGreaterThanOrEqual(200);
    });

    it('sollte Fehler in Batch-Items propagieren', async () => {
      const items = [1, 2];
      const processor = vi.fn().mockRejectedValue(new Error('Processing error'));

      await expect(
        service.batchProcess(items, processor, 1, 0)
      ).rejects.toThrow('Processing error');
    });

    it('sollte mit leerem Array umgehen können', async () => {
      const processor = vi.fn();
      const results = await service.batchProcess([], processor, 10, 0);

      expect(results).toEqual([]);
      expect(processor).not.toHaveBeenCalled();
    });

    it('sollte mit großen Batch-Größen umgehen können', async () => {
      const items = [1, 2, 3];
      const processor = vi.fn().mockImplementation((x: number) => Promise.resolve(x));

      await service.batchProcess(items, processor, 100, 0);

      expect(processor).toHaveBeenCalledTimes(3);
    });
  });

  describe('CORS Proxy URLs', () => {
    it('sollte korrekte Proxy-URLs erstellen', () => {
      const service = new BBBApiService();
      const proxies = (service as any).CORS_PROXIES;

      expect(proxies).toBeInstanceOf(Array);
      expect(proxies.length).toBeGreaterThan(0);
      
      // Jeder Proxy sollte https sein
      proxies.forEach((proxy: string) => {
        expect(proxy).toMatch(/^https:\/\//);
      });
    });
  });

  describe('validateTabellenEintrag', () => {
    it('sollte gültigen Eintrag validieren', () => {
      const entry = {
        position: 1,
        teamId: 123,
        teamName: 'Test Team',
        clubId: 456,
        clubName: 'Test Club',
        games: 10,
        wins: 7,
        losses: 3,
        points: 14,
        scoredPoints: 850,
        concededPoints: 800,
        pointsDifference: 50,
      };

      expect(BBBApiService.validateTabellenEintrag(entry)).toBe(true);
    });

    it('sollte Einträge mit fehlenden Feldern ablehnen', () => {
      const entry = {
        position: 1,
        teamId: 123,
        // teamName fehlt
      };

      expect(BBBApiService.validateTabellenEintrag(entry)).toBe(false);
    });

    it('sollte Einträge mit falschen Typen ablehnen', () => {
      const entry = {
        position: 'first', // Sollte number sein
        teamId: 123,
        teamName: 'Test',
        clubId: 456,
        clubName: 'Club',
        games: 10,
        wins: 7,
        losses: 3,
        points: 14,
        scoredPoints: 850,
        concededPoints: 800,
        pointsDifference: 50,
      };

      expect(BBBApiService.validateTabellenEintrag(entry)).toBe(false);
    });

    it('sollte Plausibilitätsprüfungen durchführen', () => {
      const entry = {
        position: 1,
        teamId: 123,
        teamName: 'Test Team',
        clubId: 456,
        clubName: 'Test Club',
        games: 10,
        wins: 8,
        losses: 5, // Siege + Niederlagen > Spiele!
        points: 16,
        scoredPoints: 850,
        concededPoints: 800,
        pointsDifference: 50,
      };

      expect(BBBApiService.validateTabellenEintrag(entry)).toBe(false);
    });

    it('sollte falsche Punktedifferenz erkennen', () => {
      const entry = {
        position: 1,
        teamId: 123,
        teamName: 'Test Team',
        clubId: 456,
        clubName: 'Test Club',
        games: 10,
        wins: 7,
        losses: 3,
        points: 14,
        scoredPoints: 850,
        concededPoints: 800,
        pointsDifference: 100, // Sollte 50 sein!
      };

      expect(BBBApiService.validateTabellenEintrag(entry)).toBe(false);
    });

    it('sollte negative Werte ablehnen', () => {
      const entry = {
        position: 1,
        teamId: 123,
        teamName: 'Test Team',
        clubId: 456,
        clubName: 'Test Club',
        games: -1, // Negativ!
        wins: 7,
        losses: 3,
        points: 14,
        scoredPoints: 850,
        concededPoints: 800,
        pointsDifference: 50,
      };

      expect(BBBApiService.validateTabellenEintrag(entry)).toBe(false);
    });

    it('sollte leere Team-Namen ablehnen', () => {
      const entry = {
        position: 1,
        teamId: 123,
        teamName: '', // Leer!
        clubId: 456,
        clubName: 'Test Club',
        games: 10,
        wins: 7,
        losses: 3,
        points: 14,
        scoredPoints: 850,
        concededPoints: 800,
        pointsDifference: 50,
      };

      expect(BBBApiService.validateTabellenEintrag(entry)).toBe(false);
    });

    it('sollte null und undefined ablehnen', () => {
      expect(BBBApiService.validateTabellenEintrag(null as any)).toBe(false);
      expect(BBBApiService.validateTabellenEintrag(undefined as any)).toBe(false);
    });

    it('sollte Unentschieden korrekt berücksichtigen', () => {
      const entry = {
        position: 1,
        teamId: 123,
        teamName: 'Test Team',
        clubId: 456,
        clubName: 'Test Club',
        games: 10,
        wins: 7,
        losses: 2,
        points: 15, // 7 Siege (14) + 1 Unentschieden (1)
        scoredPoints: 850,
        concededPoints: 800,
        pointsDifference: 50,
      };

      // Unentschieden sind erlaubt (wird nicht als Fehler gewertet)
      expect(BBBApiService.validateTabellenEintrag(entry)).toBe(true);
    });
  });

  describe('extractLigaId', () => {
    it('sollte Liga-ID aus Standard-Parameter extrahieren', () => {
      expect(BBBApiService.extractLigaId('https://example.com?liga_id=12345')).toBe(12345);
    });

    it('sollte Liga-ID aus alternativer Schreibweise extrahieren', () => {
      expect(BBBApiService.extractLigaId('https://example.com?ligaid=12345')).toBe(12345);
    });

    it('sollte Liga-ID aus REST API URL extrahieren', () => {
      expect(BBBApiService.extractLigaId('https://api.com/competition/id/12345')).toBe(12345);
    });

    it('sollte Liga-ID aus komplexer URL mit mehreren Parametern extrahieren', () => {
      expect(BBBApiService.extractLigaId('https://example.com?foo=bar&liga_id=12345&baz=qux')).toBe(12345);
    });

    it('sollte null zurückgeben wenn keine Liga-ID gefunden', () => {
      expect(BBBApiService.extractLigaId('https://example.com')).toBeNull();
      expect(BBBApiService.extractLigaId('https://example.com?foo=bar')).toBeNull();
    });

    it('sollte ungültige Liga-IDs ablehnen', () => {
      expect(BBBApiService.extractLigaId('https://example.com?liga_id=abc')).toBeNull();
      expect(BBBApiService.extractLigaId('https://example.com?liga_id=-123')).toBeNull();
    });

    it('sollte mit ungültigen URLs umgehen können', () => {
      expect(BBBApiService.extractLigaId('not a url')).toBeNull();
      expect(BBBApiService.extractLigaId('')).toBeNull();
    });
  });

  describe('getSpielerDetails', () => {
    it('sollte Spieler-Details abrufen', async () => {
      const mockData = {
        data: {
          playerId: 12345,
          fullName: 'Max Mustermann',
          birthDate: '2010-01-01',
        },
      };

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockData),
      };
      vi.mocked(global.fetch).mockResolvedValueOnce(mockResponse as any);

      const result = await service.getSpielerDetails(12345);

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
    });

    it('sollte mit fehlenden optionalen Feldern umgehen', async () => {
      const mockData = {
        data: {
          playerId: 12345,
          fullName: 'Max Mustermann',
          // birthDate fehlt
        },
      };

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockData),
      };
      vi.mocked(global.fetch).mockResolvedValueOnce(mockResponse as any);

      const result = await service.getSpielerDetails(12345);

      expect(result).toBeDefined();
      expect(result.data.playerId).toBe(12345);
    });

    it('sollte Fehler bei ungültiger Spieler-ID werfen', async () => {
      await expect(service.getSpielerDetails(0)).rejects.toThrow('Invalid player ID');
      await expect(service.getSpielerDetails(-1)).rejects.toThrow('Invalid player ID');
      await expect(service.getSpielerDetails(1.5)).rejects.toThrow('Invalid player ID');
    });

    it('sollte Fehler bei nicht gefundenem Spieler behandeln', async () => {
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Direct fail'));
      
      // Alle Proxies schlagen fehl
      for (let i = 0; i < 6; i++) {
        vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Not found'));
      }

      await expect(service.getSpielerDetails(99999)).rejects.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('sollte Netzwerkfehler behandeln', async () => {
      // Direct + alle Proxies schlagen fehl
      vi.mocked(global.fetch).mockRejectedValue(new Error('Network error'));

      await expect(
        (service as any).fetchWithFallback('https://test.com')
      ).rejects.toThrow('All CORS proxies failed');
    });

    it('sollte Timeout behandeln', async () => {
      // Simuliere Timeout: Alle Proxies schlagen mit Timeout-Error fehl
      for (let i = 0; i < 6; i++) {
        vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Timeout'));
      }

      // Das sollte nach allen Proxy-Versuchen mit Timeout fehlschlagen
      await expect(
        (service as any).fetchWithFallback('https://test.com')
      ).rejects.toThrow('All CORS proxies failed');
    });

    it('sollte ungültige JSON-Antworten behandeln', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
      };
      vi.mocked(global.fetch).mockResolvedValueOnce(mockResponse as any);

      await expect(service.getTabelle(12345)).rejects.toThrow('Invalid JSON');
    });
  });
});
