/**
 * Sync Strategy für Dashboard
 *
 * Kapselt die Logik, welcher Sync-Pfad genutzt wird:
 * - team-endpoint: wenn nur extern_permanent_id bekannt (neuer Onboarding-Flow)
 * - liga-sync: wenn liga_id in Participation vorhanden (alter Flow / manuell gepflegt)
 */

import type { Team, TeamLigaParticipation } from '@/shared/types';

export type SyncStrategy =
  | { type: 'team-endpoint'; teamPermanentId: number }
  | { type: 'liga-sync'; ligaId: number };

/**
 * Ermittelt die Sync-Strategie anhand der verfügbaren Daten.
 * Wirft einen Fehler wenn weder liga_id noch extern_permanent_id vorhanden ist.
 */
export function resolveSyncStrategy(
  team: Team,
  participation: TeamLigaParticipation | null | undefined
): SyncStrategy {
  // Bevorzuge liga_id wenn vorhanden
  if (participation?.liga_id) {
    const match = participation.liga_id.match(/\d+/);
    if (match) {
      return { type: 'liga-sync', ligaId: parseInt(match[0], 10) };
    }
  }

  // Fallback: team-endpoint via extern_permanent_id
  if (team.extern_permanent_id) {
    const id = parseInt(team.extern_permanent_id, 10);
    if (!isNaN(id) && id > 0) {
      return { type: 'team-endpoint', teamPermanentId: id };
    }
  }

  throw new Error('Kein Sync möglich: weder liga_id noch extern_permanent_id');
}

export interface SyncDependencies {
  getTeamById: (teamId: string) => Promise<Team | null | undefined>;
  getActiveParticipation: (teamId: string) => Promise<TeamLigaParticipation | null | undefined>;
  syncSpielplanForTeam: (teamPermanentId: number) => Promise<void>;
  syncLiga: (ligaId: number, options?: { skipMatchInfo?: boolean }) => Promise<void>;
}

/**
 * Führt den korrekten Sync für ein Team aus.
 * Wählt automatisch zwischen Team-Endpoint und Liga-Sync.
 */
export async function executeSyncForTeam(
  teamId: string,
  deps: SyncDependencies
): Promise<void> {
  const team = await deps.getTeamById(teamId);
  if (!team) {
    throw new Error(`Team ${teamId} nicht gefunden`);
  }

  const participation = await deps.getActiveParticipation(teamId) ?? null;
  const strategy = resolveSyncStrategy(team, participation);

  if (strategy.type === 'team-endpoint') {
    await deps.syncSpielplanForTeam(strategy.teamPermanentId);
  } else {
    await deps.syncLiga(strategy.ligaId, { skipMatchInfo: true });
  }
}
