/**
 * Unit Tests für BBBSyncService (v7.0)
 *
 * Testet die Synchronisations-Logik mit der DBB API
 * v7.0: Team + TeamLigaParticipation separate entities
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BBBSyncService } from '@/domains/bbb-api/services/BBBSyncService';
import { bbbApiService } from '@/domains/bbb-api/services/BBBApiService';
import { db } from '@/shared/db/database';
import type {
  DBBTableResponse,
  DBBTeamMatchesResponse,
} from '@/shared/types';
import { createMockTableResponse, createMockSpielplanResponse } from '@/test/helpers/bbbTestHelpers';

// Mock BBBApiService — muss auf den Domain-Pfad zeigen, den BBBSyncService importiert
vi.mock('@/domains/bbb-api/services/BBBApiService');

describe('BBBSyncService (v7.0)', () => {
  let service: BBBSyncService;

  beforeEach(async () => {
    // Clear database
    await db.delete();
    await db.open();

    // Inject den gemockten bbbApiService via Konstruktor
    // `as any` nötig: vi.mock erstellt ein Partial-Mock das nicht alle BBBApiService-Methoden implementiert
    service = new BBBSyncService(bbbApiService as any);

    // Reset all mocks
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await db.close();
  });

  describe('syncLiga (v7.0)', () => {
    it('sollte eine komplette Liga synchronisieren', async () => {
      const ligaId = 12345;

      // Mock Tabelle Response
      const mockTableResponse = createMockTableResponse(ligaId, [
        {
          teamId: 111,
          teamName: 'SV Postbauer U10',
          clubId: 10,
          clubName: 'SV Postbauer',
        },
        {
          teamId: 222,
          teamName: 'TSV Neumarkt U10',
          clubId: 20,
          clubName: 'TSV Neumarkt',
        }
      ]);

      // Mock Spielplan Response
      const mockSpielplanResponse = createMockSpielplanResponse(ligaId, [
        {
          matchId: 99991,
          homeTeamId: 111,
          homeTeamName: 'SV Postbauer U10',
          awayTeamId: 222,
          awayTeamName: 'TSV Neumarkt U10',
        }
      ]);

      // Setup mocks
      vi.mocked(bbbApiService.getTabelle).mockResolvedValue(mockTableResponse);
      vi.mocked(bbbApiService.getSpielplan).mockResolvedValue(mockSpielplanResponse);

      // Execute sync (returns void in v7.0)
      await service.syncLiga(ligaId, { skipMatchInfo: true });

      // Verify Liga created
      const liga = await db.ligen.where('bbb_liga_id').equals(String(ligaId)).first();
      expect(liga).toBeDefined();
      expect(liga?.name).toBe('U10 Bezirksliga Test');

      // v7.0: Verify Teams created (without altersklasse/saison on Team)
      const teams = await db.teams.toArray();
      expect(teams).toHaveLength(2);

      // v7.0: Teams should NOT have altersklasse/saison
      teams.forEach(team => {
        expect((team as any).altersklasse).toBeUndefined();
        expect((team as any).saison).toBeUndefined();
      });

      // v7.0: Verify TeamLigaParticipations created
      const participations = await db.team_liga_participations.toArray();
      expect(participations).toHaveLength(2);

      // v7.0: Participations SHOULD have altersklasse/saison
      participations.forEach(p => {
        expect(p.saison).toBeDefined();
        expect(p.altersklasse).toBeDefined();
        expect(p.ist_aktiv).toBe(true);
        expect(p.extern_team_id).toBeDefined();
      });

      // Verify Spiele created
      const spiele = await db.spiele.toArray();
      expect(spiele).toHaveLength(1);
      expect(spiele[0].liga_id).toBe(liga?.liga_id);
    });

    it('sollte liga_id in Spiele speichern', async () => {
      const ligaId = 12345;

      const mockTableResponse = createMockTableResponse(ligaId, [
        { teamId: 111, teamName: 'Team A', clubId: 10, clubName: 'Club A' },
        { teamId: 222, teamName: 'Team B', clubId: 20, clubName: 'Club B' },
      ]);

      const mockSpielplanResponse = createMockSpielplanResponse(ligaId, [
        {
          matchId: 99991,
          homeTeamId: 111,
          homeTeamName: 'Team A',
          awayTeamId: 222,
          awayTeamName: 'Team B',
        }
      ]);

      vi.mocked(bbbApiService.getTabelle).mockResolvedValue(mockTableResponse);
      vi.mocked(bbbApiService.getSpielplan).mockResolvedValue(mockSpielplanResponse);

      await service.syncLiga(ligaId, { skipMatchInfo: true });

      const spiele = await db.spiele.toArray();
      expect(spiele).toHaveLength(1);

      const liga = await db.ligen.where('bbb_liga_id').equals(String(ligaId)).first();
      expect(spiele[0].liga_id).toBe(liga?.liga_id);
    });
  });

  describe('Altersklassen-Extraktion (v7.0)', () => {
    it('sollte U10 aus Liga-Name extrahieren', () => {
      const altersklasse = service['extractAltersklasseFromLiganame']('U10 Bezirksliga Oberpfalz');
      expect(altersklasse).toBe('U10');
    });

    it('sollte U21 aus Liga-Name extrahieren', () => {
      const altersklasse = service['extractAltersklasseFromLiganame']('Herren U21 Regionalliga Bayern');
      expect(altersklasse).toBe('U21');
    });

    it('sollte Senioren zurückgeben wenn keine Altersklasse in Jugend-Format', () => {
      const altersklasse = service['extractAltersklasseFromLiganame']('Herren Regionalliga Bayern');
      expect(altersklasse).toBe('Senioren');
    });
  });

  describe('createOrFindTeam (v7.0)', () => {
    it('sollte Team mit extern_permanent_id erstellen', async () => {
      // Benötigt Verein in DB
      const verein = {
        verein_id: crypto.randomUUID(),
        name: 'SV Postbauer',
        ort: '',
        ist_eigener_verein: false,
        created_at: new Date(),
      };
      await db.vereine.add(verein);

      const team = await service['createOrFindTeam']({
        teamPermanentId: 111,
        teamName: 'SV Postbauer U10',
        vereinId: verein.verein_id,
      });

      expect(team).toBeDefined();

      // v7.0: Verify Team (without altersklasse/saison)
      const dbTeam = await db.teams.get(team.team_id);
      expect(dbTeam).toBeDefined();
      expect((dbTeam as any).altersklasse).toBeUndefined();
      expect((dbTeam as any).saison).toBeUndefined();

      // v7.0: extern_permanent_id ist gesetzt
      expect(dbTeam?.extern_permanent_id).toBe('111');

      // v7.0: createOrFindTeam erstellt KEINE Participation (das macht createOrUpdateParticipation)
      const participations = await db.team_liga_participations.toArray();
      expect(participations).toHaveLength(0);
    });

    it('sollte keine duplizierten Teams erstellen', async () => {
      const verein = {
        verein_id: crypto.randomUUID(),
        name: 'SV Postbauer',
        ort: '',
        ist_eigener_verein: false,
        created_at: new Date(),
      };
      await db.vereine.add(verein);

      const teamData = {
        teamPermanentId: 111,
        teamName: 'SV Postbauer U10',
        vereinId: verein.verein_id,
      };

      // Create team first time
      const team1 = await service['createOrFindTeam'](teamData);

      // Try to create same team again
      const team2 = await service['createOrFindTeam'](teamData);

      // Same team_id returned
      expect(team1.team_id).toBe(team2.team_id);

      // Only 1 team in DB
      const teams = await db.teams.toArray();
      expect(teams).toHaveLength(1);
    });

    it('sollte gleichen Team für gleiche teamPermanentId zurückgeben', async () => {
      const verein = {
        verein_id: crypto.randomUUID(),
        name: 'SV Postbauer',
        ort: '',
        ist_eigener_verein: false,
        created_at: new Date(),
      };
      await db.vereine.add(verein);

      // Same permanent ID but different season team name (simulates cross-season)
      const team1 = await service['createOrFindTeam']({
        teamPermanentId: 111,
        teamName: 'SV Postbauer U10',
        vereinId: verein.verein_id,
      });

      const team2 = await service['createOrFindTeam']({
        teamPermanentId: 111,
        teamName: 'SV Postbauer U11', // Name may change season to season
        vereinId: verein.verein_id,
      });

      // Same permanent team
      expect(team1.team_id).toBe(team2.team_id);

      // Only 1 team in DB
      const teams = await db.teams.toArray();
      expect(teams).toHaveLength(1);
    });
  });

  describe('Altersklasse und Saison Extraktion (v7.0)', () => {
    it('sollte Team-Altersklasse aus Team-Namen extrahieren, nicht von Liga', async () => {
      const ligaId = 12345;

      const mockTableResponse = createMockTableResponse(ligaId, [
        {
          teamId: 111,
          teamName: 'SV Postbauer U12', // Team name says U12
          clubId: 10,
          clubName: 'SV Postbauer',
        }
      ]);
      mockTableResponse.liganame = 'U10 Bezirksliga'; // Liga says U10

      const mockSpielplanResponse = createMockSpielplanResponse(ligaId, []);

      vi.mocked(bbbApiService.getTabelle).mockResolvedValue(mockTableResponse);
      vi.mocked(bbbApiService.getSpielplan).mockResolvedValue(mockSpielplanResponse);

      await service.syncLiga(ligaId, { skipMatchInfo: true });

      const participations = await db.team_liga_participations.toArray();
      expect(participations).toHaveLength(1);

      // v7.0: Should use team name (U12), not liga name (U10)
      expect(participations[0].altersklasse).toBe('U12');
    });
  });

  describe('syncSpielplanForTeam (v7.0)', () => {

    it('sollte getTeamMatches aufrufen und Spiele speichern', async () => {
      const teamPermanentId = 167889;

      // Erstelle Verein + Team + Liga in DB (Voraussetzung für Spiel-Sync)
      const vereinId = crypto.randomUUID();
      await db.vereine.add({
        verein_id: vereinId,
        name: 'TSV Neumarkt',
        ort: '',
        ist_eigener_verein: false,
        created_at: new Date(),
      });
      const teamId = crypto.randomUUID();
      await db.teams.add({
        team_id: teamId,
        name: 'TSV Neumarkt U14',
        team_typ: 'eigen',
        verein_id: vereinId,
        trainer: 'Test Trainer',
        extern_permanent_id: String(teamPermanentId),
        created_at: new Date(),
      });
      const gastTeamId = crypto.randomUUID();
      await db.teams.add({
        team_id: gastTeamId,
        name: 'SV Postbauer U14',
        team_typ: 'gegner',
        verein_id: vereinId,
        trainer: '',
        extern_permanent_id: '999',
        created_at: new Date(),
      });
      const ligaId = crypto.randomUUID();
      await db.ligen.add({
        liga_id: ligaId,
        name: 'U14 Bayernliga',
        bbb_liga_id: '47653',
        saison: '2024/25',
        altersklasse: 'U14',
        created_at: new Date(),
      });

      const mockResponse: DBBTeamMatchesResponse = {
        teamId: teamPermanentId,
        teamName: 'TSV Neumarkt U14',
        matches: [
          {
            matchId: 11111,
            gameNumber: 1,
            gameDay: 1,
            date: '2024-10-05',
            time: '15:00',
            ligaId: 47653,
            liganame: 'U14 Bayernliga',
            homeTeam: {
              teamId: 12345,
              teamPermanentId: teamPermanentId,
              teamName: 'TSV Neumarkt U14',
              clubId: 100,
            },
            awayTeam: {
              teamId: 67890,
              teamPermanentId: 999,
              teamName: 'SV Postbauer U14',
              clubId: 200,
            },
            status: 'finished',
            homeScore: 80,
            awayScore: 60,
          },
        ],
      };

      vi.mocked(bbbApiService.getTeamMatches).mockResolvedValue(mockResponse);

      await service.syncSpielplanForTeam(teamPermanentId);

      expect(bbbApiService.getTeamMatches).toHaveBeenCalledWith(teamPermanentId);

      const spiele = await db.spiele.toArray();
      expect(spiele).toHaveLength(1);
      expect(spiele[0].extern_spiel_id).toBe('11111');
    });

    it('sollte auf getSpielplan fallen wenn getTeamMatches fehlschlägt', async () => {
      const teamPermanentId = 167889;
      const fallbackLigaId = 47653;

      vi.mocked(bbbApiService.getTeamMatches).mockRejectedValue(new Error('API error'));

      // syncSpielplan needs a liga in DB — set it up
      await db.ligen.add({
        liga_id: crypto.randomUUID(),
        name: 'U14 Bayernliga',
        bbb_liga_id: String(fallbackLigaId),
        saison: '2024/25',
        altersklasse: 'U14',
        created_at: new Date(),
      });

      const mockSpielplan = createMockSpielplanResponse(fallbackLigaId, []);
      vi.mocked(bbbApiService.getSpielplan).mockResolvedValue(mockSpielplan);
      vi.mocked(bbbApiService.getTabelle).mockResolvedValue(createMockTableResponse(fallbackLigaId, []));

      await service.syncSpielplanForTeam(teamPermanentId, { fallbackLigaIds: [fallbackLigaId] });

      expect(bbbApiService.getTeamMatches).toHaveBeenCalledWith(teamPermanentId);
      expect(bbbApiService.getSpielplan).toHaveBeenCalledWith(fallbackLigaId);
    });

    it('sollte Fehler werfen bei teamPermanentId <= 0', async () => {
      await expect(service.syncSpielplanForTeam(0)).rejects.toThrow();
      await expect(service.syncSpielplanForTeam(-1)).rejects.toThrow();
    });
  });

  describe('syncTabelleAndTeams (v7.0)', () => {
    it('sollte Tabellendaten korrekt speichern', async () => {
      const ligaId = 12345;

      const mockTableResponse: DBBTableResponse = {
        ligaId,
        liganame: 'U10 Bezirksliga',
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
          }
        ]
      };

      vi.mocked(bbbApiService.getTabelle).mockResolvedValue(mockTableResponse);

      await service['syncTabelleAndTeams'](ligaId);

      // Verify liga_tabellen entry
      const tabellen = await db.liga_tabellen.toArray();
      expect(tabellen).toHaveLength(1);
      expect(tabellen[0].teamname).toBe('SV Postbauer U10');
      expect(tabellen[0].platz).toBe(1);
      expect(tabellen[0].siege).toBe(8);
    });
  });
});
