/**
 * BBBApiService Unit Tests
 * 
 * Testet das korrekte Mapping von deutschen API-Feldnamen zu internen Strukturen
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BBBApiService } from '@/shared/services/BBBApiService';

describe('BBBApiService', () => {
  let apiService: BBBApiService;

  beforeEach(() => {
    apiService = new BBBApiService();
    // Mock fetch globally
    global.fetch = vi.fn();
  });

  describe('getTabelle()', () => {
    it('should correctly map German API response to internal structure', async () => {
      // ARRANGE - Echte API Response Structure (Deutsch!)
      const mockApiResponse = {
        timestamp: '2025-10-25T02:53:08+0200',
        status: '0',
        message: '',
        data: {
          ligaData: {
            ligaId: 51961,
            liganame: 'U10 mixed Bezirksliga',
            seasonId: 2025,
            seasonName: '2025/2026'
          },
          tabelle: {
            entries: [
              {
                rang: 1,
                team: {
                  seasonTeamId: 432555,
                  teamCompetitionId: 432555,
                  teamPermanentId: 164793,
                  teamname: 'Fibalon Baskets Neumarkt',
                  teamnameSmall: 'FIB',
                  clubId: 4087,
                  verzicht: false
                },
                anzspiele: 4,
                anzGewinnpunkte: 8,
                anzVerlustpunkte: 0,
                s: 4,
                n: 0,
                koerbe: 362,
                gegenKoerbe: 271,
                korbdiff: 91
              },
              {
                rang: 2,
                team: {
                  seasonTeamId: 432551,
                  teamname: 'DJK Neustadt a. d. Waldnaab 1',
                  clubId: 4083
                },
                anzspiele: 3,
                s: 2,
                n: 1,
                koerbe: 250,
                gegenKoerbe: 200,
                korbdiff: 50
              }
            ]
          }
        }
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse
      });

      // ACT
      const result = await apiService.getTabelle(51961);

      // ASSERT
      expect(result).toBeDefined();
      expect(result.ligaId).toBe(51961);
      expect(result.liganame).toBe('U10 mixed Bezirksliga');
      expect(result.teams).toHaveLength(2);

      // Erstes Team
      const firstTeam = result.teams[0];
      expect(firstTeam.position).toBe(1);
      expect(firstTeam.teamId).toBe(432555);        // seasonTeamId
      expect(firstTeam.teamPermanentId).toBe(164793); // teamPermanentId korrekt gemappt
      expect(firstTeam.teamName).toBe('Fibalon Baskets Neumarkt');
      expect(firstTeam.clubId).toBe(4087);
      expect(firstTeam.clubName).toBe('Fibalon'); // Erstes Wort
      expect(firstTeam.games).toBe(4);
      expect(firstTeam.wins).toBe(4);
      expect(firstTeam.losses).toBe(0);
      expect(firstTeam.points).toBe(8);
      expect(firstTeam.scoredPoints).toBe(362);
      expect(firstTeam.concededPoints).toBe(271);
      expect(firstTeam.pointsDifference).toBe(91);

      // Zweites Team
      const secondTeam = result.teams[1];
      expect(secondTeam.position).toBe(2);
      expect(secondTeam.teamId).toBe(432551);
      expect(secondTeam.teamName).toBe('DJK Neustadt a. d. Waldnaab 1');
      expect(secondTeam.wins).toBe(2);
      expect(secondTeam.losses).toBe(1);
    });

    it('should handle missing tabelle.entries gracefully', async () => {
      // ARRANGE
      const mockApiResponse = {
        status: '0',
        data: {
          ligaData: {
            ligaId: 51961,
            liganame: 'Test Liga'
          },
          tabelle: {}
        }
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse
      });

      // ACT
      const result = await apiService.getTabelle(51961);

      // ASSERT
      expect(result.teams).toEqual([]);
    });

    it('should handle API errors', async () => {
      // ARRANGE
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      // ACT & ASSERT
      await expect(apiService.getTabelle(51961)).rejects.toThrow();
    });
  });

  describe('getSpielplan()', () => {
    it('should correctly map German API response to internal structure', async () => {
      // ARRANGE
      const mockApiResponse = {
        timestamp: '2025-10-25T02:53:08+0200',
        status: '0',
        data: {
          ligaData: {
            ligaId: 51961,
            liganame: 'U10 mixed Bezirksliga'
          },
          matches: [
            {
              matchId: 2804049,
              matchDay: 6,
              matchNo: 1496,
              kickoffDate: '2025-10-05',
              kickoffTime: '18:00',
              homeTeam: {
                seasonTeamId: 432549,
                teamname: 'TV Amberg-Sulzbach BSG 2',
                clubId: 428
              },
              guestTeam: {
                seasonTeamId: 432552,
                teamname: 'TB Weiden Basketball',
                clubId: 429
              },
              result: null,
              ergebnisbestaetigt: false,
              verzicht: false,
              abgesagt: false
            },
            {
              matchId: 2804050,
              matchDay: 1,
              matchNo: 1497,
              kickoffDate: '2024-10-12',
              kickoffTime: '10:30',
              homeTeam: {
                seasonTeamId: 432555,
                teamname: 'Fibalon Baskets Neumarkt'
              },
              guestTeam: {
                seasonTeamId: 432551,
                teamname: 'DJK Neustadt a. d. Waldnaab 1'
              },
              result: '19:48',
              ergebnisbestaetigt: true
            }
          ]
        }
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse
      });

      // ACT
      const result = await apiService.getSpielplan(51961);

      // ASSERT
      expect(result.games).toHaveLength(2);

      // Geplantes Spiel
      const scheduledGame = result.games[0];
      expect(scheduledGame.matchId).toBe(2804049);
      expect(scheduledGame.gameNumber).toBe(1496);
      expect(scheduledGame.gameDay).toBe(6);
      expect(scheduledGame.date).toBe('2025-10-05');
      expect(scheduledGame.time).toBe('18:00');
      expect(scheduledGame.homeTeam.teamId).toBe(432549);
      expect(scheduledGame.homeTeam.teamName).toBe('TV Amberg-Sulzbach BSG 2');
      expect(scheduledGame.awayTeam.teamId).toBe(432552);
      expect(scheduledGame.awayTeam.teamName).toBe('TB Weiden Basketball');
      expect(scheduledGame.status).toBe('scheduled');
      expect(scheduledGame.homeScore).toBeUndefined();
      expect(scheduledGame.awayScore).toBeUndefined();

      // Abgeschlossenes Spiel
      const finishedGame = result.games[1];
      expect(finishedGame.matchId).toBe(2804050);
      expect(finishedGame.status).toBe('finished');
      expect(finishedGame.homeScore).toBe(19);
      expect(finishedGame.awayScore).toBe(48);
    });

    it('should handle missing venue gracefully', async () => {
      // ARRANGE
      const mockApiResponse = {
        status: '0',
        data: {
          matches: [
            {
              matchId: 123,
              matchDay: 1,
              matchNo: 1,
              kickoffDate: '2025-10-05',
              kickoffTime: '18:00',
              homeTeam: {
                seasonTeamId: 1,
                teamname: 'Team A'
              },
              guestTeam: {
                seasonTeamId: 2,
                teamname: 'Team B'
              },
              result: null
            }
          ]
        }
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse
      });

      // ACT
      const result = await apiService.getSpielplan(51961);

      // ASSERT
      expect(result.games[0].venue).toBeUndefined();
    });

    it('should parse result string correctly', async () => {
      // ARRANGE
      const mockApiResponse = {
        status: '0',
        data: {
          matches: [
            {
              matchId: 123,
              matchDay: 1,
              matchNo: 1,
              kickoffDate: '2025-10-05',
              kickoffTime: '18:00',
              homeTeam: { seasonTeamId: 1, teamname: 'A' },
              guestTeam: { seasonTeamId: 2, teamname: 'B' },
              result: '42:38'
            }
          ]
        }
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse
      });

      // ACT
      const result = await apiService.getSpielplan(51961);

      // ASSERT
      expect(result.games[0].homeScore).toBe(42);
      expect(result.games[0].awayScore).toBe(38);
    });
  });

  describe('getTeamMatches', () => {
    it('sollte Team-Matches-Daten abrufen und mappen', async () => {
      const mockData = {
        data: {
          team: {
            teamId: 167889,
            teamName: 'Test Baskets',
          },
          matches: [
            {
              ligaData: {
                ligaId: 47653,
                liganame: 'Bayernliga Herren Mitte',
              },
              matchId: 1001,
              matchNo: 1,
              matchDay: 1,
              kickoffDate: '2025-10-04',
              kickoffTime: '19:30',
              homeTeam: {
                seasonTeamId: 405995,
                teamPermanentId: 167889,
                teamname: 'Test Baskets',
                clubId: 4468,
              },
              guestTeam: {
                seasonTeamId: 397879,
                teamPermanentId: 154164,
                teamname: 'TSV Gegner',
                clubId: 1422,
              },
              result: '93:74',
            },
          ],
        },
      };

      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue(mockData),
      };
      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const result = await apiService.getTeamMatches(167889);

      expect(result.teamId).toBe(167889);
      expect(result.teamName).toBe('Test Baskets');
      expect(result.matches).toHaveLength(1);
      expect(result.matches[0]).toMatchObject({
        matchId: 1001,
        gameNumber: 1,
        gameDay: 1,
        ligaId: 47653,
        liganame: 'Bayernliga Herren Mitte',
        homeTeam: {
          teamId: 405995,
          teamPermanentId: 167889,
          teamName: 'Test Baskets',
          clubId: 4468,
        },
        awayTeam: {
          teamId: 397879,
          teamPermanentId: 154164,
          teamName: 'TSV Gegner',
          clubId: 1422,
        },
        status: 'finished',
        homeScore: 93,
        awayScore: 74,
      });
    });

    it('sollte Fehler werfen bei ungültiger teamPermanentId', async () => {
      await expect(apiService.getTeamMatches(0)).rejects.toThrow('Invalid team permanent ID');
      await expect(apiService.getTeamMatches(-1)).rejects.toThrow('Invalid team permanent ID');
    });

    it('sollte leere matches-Liste handhaben', async () => {
      const mockData = {
        data: { team: { teamId: 1, teamName: 'Test' }, matches: [] },
      };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockData),
      });

      const result = await apiService.getTeamMatches(1);
      expect(result.matches).toHaveLength(0);
    });
  });

  describe('CORS Proxy Handling', () => {
    it('should route requests via corsproxy.io', async () => {
      // ARRANGE
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: '0',
          data: {
            ligaData: { ligaId: 123, liganame: 'Test' },
            tabelle: { entries: [] }
          }
        })
      });

      // ACT
      const result = await apiService.getTabelle(123);

      // ASSERT
      expect(result).toBeDefined();
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('corsproxy.io'),
        expect.anything()
      );
    });

    it('should include the target URL encoded in the proxy URL', async () => {
      // ARRANGE
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: '0',
          data: {
            ligaData: { ligaId: 123, liganame: 'Test' },
            tabelle: { entries: [] }
          }
        })
      });

      // ACT
      await apiService.getTabelle(123);

      // ASSERT
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('basketball-bund.net'),
        expect.anything()
      );
    });

    it('should throw on proxy failure', async () => {
      // ARRANGE
      (global.fetch as any).mockRejectedValue(new Error('Proxy failed'));

      // ACT & ASSERT
      await expect(apiService.getTabelle(123)).rejects.toThrow();
    });
  });
});
