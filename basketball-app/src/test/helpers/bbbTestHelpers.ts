/**
 * Test Helpers für BBB API Mocks
 *
 * Generiert realistische Mock-Daten für DBB REST API Responses
 */

import type {
  DBBTableResponse,
  DBBTabellenEintrag,
  DBBSpielplanResponse,
  DBBSpielplanEintrag,
  DBBMatchInfoResponse,
} from '@/shared/types';

/**
 * Erstellt Mock Table Response
 */
export function createMockTableResponse(
  ligaId: number,
  teams: Array<{
    teamId: number;
    teamName: string;
    clubId: number;
    clubName: string;
  }>
): DBBTableResponse {
  const tableEntries: DBBTabellenEintrag[] = teams.map((team, index) => ({
    position: index + 1,
    teamId: team.teamId,
    teamName: team.teamName,
    clubId: team.clubId,
    clubName: team.clubName,
    games: 10,
    wins: 10 - index,
    losses: index,
    points: (10 - index) * 2,
    scoredPoints: 400 - index * 10,
    concededPoints: 300 + index * 10,
    pointsDifference: 100 - index * 20,
  }));

  return {
    ligaId,
    liganame: 'U10 Bezirksliga Test',
    teams: tableEntries,
  };
}

/**
 * Erstellt Mock Spielplan Response
 */
export function createMockSpielplanResponse(
  ligaId: number,
  games: Array<{
    matchId: number;
    homeTeamId: number;
    homeTeamName: string;
    awayTeamId: number;
    awayTeamName: string;
  }>
): DBBSpielplanResponse {
  const spielplanEntries: DBBSpielplanEintrag[] = games.map((game, index) => ({
    matchId: game.matchId,
    gameNumber: index + 1,
    gameDay: Math.floor(index / 5) + 1,
    date: `2025-09-${String(index + 1).padStart(2, '0')}`,
    time: '10:00',
    homeTeam: {
      teamId: game.homeTeamId,
      teamName: game.homeTeamName,
      clubId: Math.floor(game.homeTeamId / 10),
      clubName: game.homeTeamName.split(' ')[0] + ' ' + game.homeTeamName.split(' ')[1],
    },
    awayTeam: {
      teamId: game.awayTeamId,
      teamName: game.awayTeamName,
      clubId: Math.floor(game.awayTeamId / 10),
      clubName: game.awayTeamName.split(' ')[0] + ' ' + game.awayTeamName.split(' ')[1],
    },
    venue: {
      name: 'Sporthalle Test',
      address: 'Teststraße 1, 12345 Teststadt',
    },
    status: 'scheduled',
  }));

  return {
    ligaId,
    liganame: 'U10 Bezirksliga Test',
    games: spielplanEntries,
  };
}

/**
 * Erstellt Mock Match Info Response
 */
export function createMockMatchInfoResponse(matchId: number): DBBMatchInfoResponse {
  return {
    matchId,
    gameNumber: 1,
    date: '2025-09-01',
    time: '10:00',
    ligaId: 12345,
    homeTeam: {
      teamId: 111,
      teamName: 'SV Postbauer U10',
      clubId: 10,
      clubName: 'SV Postbauer',
      coach: 'Max Mustermann',
      players: [
        {
          playerId: 1001,
          firstName: 'Max',
          lastName: 'Spieler',
          jerseyNumber: 10,
          tnaNumber: '123',
        },
      ],
    },
    awayTeam: {
      teamId: 222,
      teamName: 'TSV Neumarkt U10',
      clubId: 20,
      clubName: 'TSV Neumarkt',
      coach: 'Anna Schmidt',
      players: [
        {
          playerId: 2001,
          firstName: 'Anna',
          lastName: 'Spielerin',
          jerseyNumber: 5,
          tnaNumber: '456',
        },
      ],
    },
    venue: {
      name: 'Sporthalle Test',
      address: 'Teststraße 1',
      city: 'Teststadt',
      zipCode: '12345',
    },
    score: {
      home: 45,
      away: 42,
    },
    referees: ['Ref 1', 'Ref 2'],
  };
}
