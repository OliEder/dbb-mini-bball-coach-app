/**
 * Dashboard Sync Strategy Tests
 *
 * Stellt sicher, dass der Sync korrekt zwischen:
 * - Liga-Sync (wenn liga_id in Participation vorhanden)
 * - Team-Endpoint-Sync (wenn nur extern_permanent_id vorhanden, kein liga_id)
 * unterscheidet.
 *
 * Regression-Test für Bug: nach Onboarding-Neubau wird keine Participation
 * mit liga_id angelegt → Sync schlug mit "Keine Liga zugeordnet" fehl,
 * obwohl ein Team-Endpoint-Sync über teamPermanentId möglich wäre.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolveSyncStrategy, executeSyncForTeam } from '@/domains/dashboard/syncStrategy';
import type { Team, TeamLigaParticipation } from '@/shared/types';

// --- Mock-Daten ---

const teamWithPermanentIdOnly: Team = {
  team_id: 'team-1',
  name: 'Fibalon Baskets Neumarkt',
  verein_id: 'verein-1',
  geschlecht: 'male',
  trainer: 'Max Mustermann',
  team_typ: 'eigen',
  extern_permanent_id: '167889',
  erstellt_am: new Date().toISOString(),
  aktualisiert_am: new Date().toISOString(),
};

const teamWithLigaParticipation: Team = {
  ...teamWithPermanentIdOnly,
  team_id: 'team-2',
  extern_permanent_id: '167889',
};

const participationWithLiga: TeamLigaParticipation = {
  id: 1,
  team_id: 'team-2',
  liga_id: 'liga-47653',
  saison: '2025/26',
  altersklasse: 'Senioren',
  ist_aktiv: true,
  created_at: new Date(),
};

const participationWithoutLiga: TeamLigaParticipation = {
  id: 2,
  team_id: 'team-1',
  liga_id: '',
  saison: '2025/26',
  altersklasse: 'Senioren',
  ist_aktiv: true,
  created_at: new Date(),
};

// --- Tests ---

describe('resolveSyncStrategy', () => {
  it('wählt team-endpoint wenn keine liga_id in Participation', () => {
    const strategy = resolveSyncStrategy(teamWithPermanentIdOnly, null);
    expect(strategy.type).toBe('team-endpoint');
    expect(strategy.teamPermanentId).toBe(167889);
  });

  it('wählt team-endpoint wenn Participation liga_id leer ist', () => {
    const strategy = resolveSyncStrategy(teamWithPermanentIdOnly, participationWithoutLiga);
    expect(strategy.type).toBe('team-endpoint');
    expect(strategy.teamPermanentId).toBe(167889);
  });

  it('wählt liga-sync wenn Participation eine gültige liga_id hat', () => {
    const strategy = resolveSyncStrategy(teamWithLigaParticipation, participationWithLiga);
    expect(strategy.type).toBe('liga-sync');
    expect(strategy.ligaId).toBe(47653);
  });

  it('wirft Fehler wenn weder liga_id noch extern_permanent_id vorhanden', () => {
    const teamOhneIds: Team = {
      ...teamWithPermanentIdOnly,
      extern_permanent_id: undefined,
    };
    expect(() => resolveSyncStrategy(teamOhneIds, null)).toThrow(
      'Kein Sync möglich: weder liga_id noch extern_permanent_id'
    );
  });
});

describe('executeSyncForTeam', () => {
  const mockSyncSpielplanForTeam = vi.fn().mockResolvedValue(undefined);
  const mockSyncLiga = vi.fn().mockResolvedValue(undefined);
  const mockGetTeamById = vi.fn();
  const mockGetActiveParticipation = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ruft syncSpielplanForTeam auf wenn kein liga_id vorhanden', async () => {
    mockGetTeamById.mockResolvedValue(teamWithPermanentIdOnly);
    mockGetActiveParticipation.mockResolvedValue(null);

    await executeSyncForTeam('team-1', {
      getTeamById: mockGetTeamById,
      getActiveParticipation: mockGetActiveParticipation,
      syncSpielplanForTeam: mockSyncSpielplanForTeam,
      syncLiga: mockSyncLiga,
    });

    expect(mockSyncSpielplanForTeam).toHaveBeenCalledWith(167889);
    expect(mockSyncLiga).not.toHaveBeenCalled();
  });

  it('ruft syncLiga auf wenn liga_id in Participation vorhanden', async () => {
    mockGetTeamById.mockResolvedValue(teamWithLigaParticipation);
    mockGetActiveParticipation.mockResolvedValue(participationWithLiga);

    await executeSyncForTeam('team-2', {
      getTeamById: mockGetTeamById,
      getActiveParticipation: mockGetActiveParticipation,
      syncSpielplanForTeam: mockSyncSpielplanForTeam,
      syncLiga: mockSyncLiga,
    });

    expect(mockSyncLiga).toHaveBeenCalledWith(47653, { skipMatchInfo: true });
    expect(mockSyncSpielplanForTeam).not.toHaveBeenCalled();
  });

  it('wirft Fehler wenn Team nicht gefunden', async () => {
    mockGetTeamById.mockResolvedValue(null);

    await expect(
      executeSyncForTeam('team-999', {
        getTeamById: mockGetTeamById,
        getActiveParticipation: mockGetActiveParticipation,
        syncSpielplanForTeam: mockSyncSpielplanForTeam,
        syncLiga: mockSyncLiga,
      })
    ).rejects.toThrow('Team team-999 nicht gefunden');
  });
});
