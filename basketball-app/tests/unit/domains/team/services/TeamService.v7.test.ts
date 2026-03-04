/**
 * TeamService v7.0 Tests
 * 
 * Tests für TeamLigaParticipation Support
 * 
 * TDD: RED Phase - Tests zuerst schreiben!
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { teamService } from '@/domains/team/services/TeamService';
import { db } from '@/shared/db/database';
import type { Team, TeamLigaParticipation } from '@/shared/types';

describe('TeamService v7.0 - TeamLigaParticipation', () => {
  const testUserId = 'test-user-v7';
  const testVereinId = 'verein-v7';

  // v7.0 Team (vereinfacht, ohne altersklasse/saison/liga_id)
  const testTeam: Team = {
    team_id: 'team-v7-1',
    extern_permanent_id: 'perm-001',
    verein_id: testVereinId,
    name: 'TSV Pilsach U12',
    geschlecht: 'mixed',
    trainer: 'Max Mustermann',
    team_typ: 'eigen',
    user_id: testUserId,
    created_at: new Date('2025-09-01')
  };

  // Participations für verschiedene Saisons
  const participation2425: TeamLigaParticipation = {
    id: 1,
    team_id: testTeam.team_id,
    extern_team_id: 'season-2024-25-001',
    saison: '2024/25',
    altersklasse: 'U12',
    altersklasse_id: 12,
    liga_id: 'liga-2024-25',
    liga_name: 'U12 Bezirksliga Oberpfalz',
    leistungsorientiert: false,
    ist_aktiv: false, // Alte Saison
    created_at: new Date('2024-09-01')
  };

  const participation2526: TeamLigaParticipation = {
    id: 2,
    team_id: testTeam.team_id,
    extern_team_id: 'season-2025-26-001',
    saison: '2025/26',
    altersklasse: 'U13', // Team ist aufgestiegen!
    altersklasse_id: 13,
    liga_id: 'liga-2025-26',
    liga_name: 'U13 Bezirksliga Oberpfalz',
    leistungsorientiert: false,
    ist_aktiv: true, // Aktuelle Saison
    created_at: new Date('2025-09-01')
  };

  beforeEach(async () => {
    // Clear DB
    await db.teams.clear();
    await db.team_liga_participations.clear();
    await db.spieler.clear();
    await db.spiele.clear();
    await db.liga_tabellen.clear();

    // Insert Test Data
    await db.teams.add(testTeam);
    await db.team_liga_participations.bulkAdd([
      participation2425,
      participation2526
    ]);
  });

  afterEach(async () => {
    await db.teams.clear();
    await db.team_liga_participations.clear();
    await db.spieler.clear();
    await db.spiele.clear();
    await db.liga_tabellen.clear();
  });

  describe('getActiveParticipation', () => {
    it('should return active participation', async () => {
      const result = await teamService.getActiveParticipation(testTeam.team_id);

      expect(result).toBeDefined();
      expect(result?.team_id).toBe(testTeam.team_id);
      expect(result?.saison).toBe('2025/26');
      expect(result?.altersklasse).toBe('U13');
      expect(result?.ist_aktiv).toBe(true);
    });

    it('should return undefined if no active participation', async () => {
      // Set both participations to inactive
      await db.team_liga_participations.update(1, { ist_aktiv: false });
      await db.team_liga_participations.update(2, { ist_aktiv: false });

      const result = await teamService.getActiveParticipation(testTeam.team_id);

      expect(result).toBeUndefined();
    });

    it('should return undefined for non-existent team', async () => {
      const result = await teamService.getActiveParticipation('non-existent');

      expect(result).toBeUndefined();
    });
  });

  describe('getAllParticipations', () => {
    it('should return all participations for team', async () => {
      const result = await teamService.getAllParticipations(testTeam.team_id);

      expect(result).toHaveLength(2);
      expect(result[0].saison).toBe('2025/26'); // Neueste zuerst
      expect(result[1].saison).toBe('2024/25');
    });

    it('should return empty array for team without participations', async () => {
      const newTeam: Team = {
        ...testTeam,
        team_id: 'team-no-participation',
        name: 'New Team'
      };
      await db.teams.add(newTeam);

      const result = await teamService.getAllParticipations(newTeam.team_id);

      expect(result).toHaveLength(0);
    });

    it('should return empty array for non-existent team', async () => {
      const result = await teamService.getAllParticipations('non-existent');

      expect(result).toHaveLength(0);
    });

    it('should return participations sorted by created_at descending', async () => {
      const result = await teamService.getAllParticipations(testTeam.team_id);

      expect(result[0].created_at.getTime()).toBeGreaterThan(
        result[1].created_at.getTime()
      );
    });
  });

  describe('getTeamStats with Participation', () => {
    beforeEach(async () => {
      // Add Spieler
      await db.spieler.bulkAdd([
        {
          spieler_id: 'spieler-1',
          team_id: testTeam.team_id,
          verein_id: testVereinId,
          vorname: 'Max',
          nachname: 'Mustermann',
          spieler_typ: 'eigenes_team',
          aktiv: true,
          created_at: new Date()
        },
        {
          spieler_id: 'spieler-2',
          team_id: testTeam.team_id,
          verein_id: testVereinId,
          vorname: 'Lisa',
          nachname: 'Musterfrau',
          spieler_typ: 'eigenes_team',
          aktiv: true,
          created_at: new Date()
        }
      ]);

      // Add Spiele (heim_team_id/gast_team_id in v6.0)
      const futureDate1 = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const futureDate2 = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

      await db.spiele.bulkAdd([
        {
          spiel_id: 'spiel-1',
          liga_id: participation2526.liga_id,
          spielplan_id: 'spielplan-1',
          heim_team_id: testTeam.team_id,
          gast_team_id: 'other-team',
          datum: futureDate1,
          spielnr: 1,
          spieltag: 1,
          status: 'geplant',
          created_at: new Date()
        },
        {
          spiel_id: 'spiel-2',
          liga_id: participation2526.liga_id,
          spielplan_id: 'spielplan-1',
          heim_team_id: 'other-team',
          gast_team_id: testTeam.team_id,
          datum: futureDate2,
          spielnr: 2,
          spieltag: 2,
          status: 'geplant',
          created_at: new Date()
        }
      ]);
    });

    it('should include participation data in stats', async () => {
      const stats = await teamService.getTeamStats(testTeam.team_id);

      expect(stats.spielerCount).toBe(2);
      expect(stats.spieleCount).toBe(2);
      expect(stats.altersklasse).toBe('U13'); // From active participation
      expect(stats.saison).toBe('2025/26');
      expect(stats.liga_name).toBe('U13 Bezirksliga Oberpfalz');
    });

    it('should find next planned game', async () => {
      const stats = await teamService.getTeamStats(testTeam.team_id);

      expect(stats.naechstesSpiel).toBeDefined();
      expect(stats.naechstesSpiel?.spiel_id).toBe('spiel-1');
    });

    it('should return undefined for altersklasse if no active participation', async () => {
      // Make all participations inactive
      await db.team_liga_participations.update(2, { ist_aktiv: false });

      const stats = await teamService.getTeamStats(testTeam.team_id);

      expect(stats.altersklasse).toBeUndefined();
      expect(stats.saison).toBeUndefined();
      expect(stats.liga_name).toBeUndefined();
    });

    it('should work for team with no participations', async () => {
      const newTeam: Team = {
        ...testTeam,
        team_id: 'team-no-part',
        name: 'Team without Participation'
      };
      await db.teams.add(newTeam);

      const stats = await teamService.getTeamStats(newTeam.team_id);

      expect(stats.spielerCount).toBe(0);
      expect(stats.spieleCount).toBe(0);
      expect(stats.altersklasse).toBeUndefined();
      expect(stats.saison).toBeUndefined();
    });
  });

  describe('createTeam with Participation', () => {
    it('should create team and participation together', async () => {
      const input = {
        verein_id: testVereinId,
        name: 'New Team U10',
        geschlecht: 'mixed' as const,
        trainer: 'John Doe',
        team_typ: 'eigen' as const,
        user_id: testUserId,
        
        // Participation Data
        saison: '2025/26',
        altersklasse: 'U10' as const,
        altersklasse_id: 10,
        liga_id: 'liga-u10',
        liga_name: 'U10 Bezirksliga'
      };

      const team = await teamService.createTeamWithParticipation(input);

      // Verify Team
      expect(team.name).toBe(input.name);
      expect(team.team_typ).toBe('eigen');

      // Verify Participation was created
      const participation = await teamService.getActiveParticipation(team.team_id);
      expect(participation).toBeDefined();
      expect(participation?.saison).toBe(input.saison);
      expect(participation?.altersklasse).toBe(input.altersklasse);
      expect(participation?.ist_aktiv).toBe(true);
    });

    it('should set extern_permanent_id if provided', async () => {
      const input = {
        verein_id: testVereinId,
        extern_permanent_id: 'perm-new-team',
        name: 'New Team with Perm ID',
        geschlecht: 'mixed' as const,
        trainer: 'Jane Doe',
        team_typ: 'eigen' as const,
        user_id: testUserId,
        saison: '2025/26',
        altersklasse: 'U12' as const
      };

      const team = await teamService.createTeamWithParticipation(input);

      expect(team.extern_permanent_id).toBe('perm-new-team');
    });
  });

  describe('updateParticipation', () => {
    it('should update existing participation', async () => {
      await teamService.updateParticipation(participation2526.id!, {
        liga_name: 'Updated Liga Name',
        leistungsorientiert: true
      });

      const updated = await db.team_liga_participations.get(participation2526.id!);

      expect(updated?.liga_name).toBe('Updated Liga Name');
      expect(updated?.leistungsorientiert).toBe(true);
    });

    it('should not affect other fields when updating', async () => {
      await teamService.updateParticipation(participation2526.id!, {
        liga_name: 'New Name'
      });

      const updated = await db.team_liga_participations.get(participation2526.id!);

      expect(updated?.saison).toBe(participation2526.saison);
      expect(updated?.altersklasse).toBe(participation2526.altersklasse);
      expect(updated?.ist_aktiv).toBe(participation2526.ist_aktiv);
    });
  });

  describe('addParticipation', () => {
    it('should add new participation for existing team', async () => {
      const newParticipation = {
        team_id: testTeam.team_id,
        extern_team_id: 'season-2026-27-001',
        saison: '2026/27',
        altersklasse: 'U14' as const,
        altersklasse_id: 14,
        liga_id: 'liga-2026-27',
        liga_name: 'U14 Bezirksliga',
        ist_aktiv: false
      };

      const result = await teamService.addParticipation(newParticipation);

      expect(result.id).toBeDefined();
      expect(result.team_id).toBe(testTeam.team_id);
      expect(result.saison).toBe('2026/27');

      // Verify it was added to DB
      const participations = await teamService.getAllParticipations(testTeam.team_id);
      expect(participations).toHaveLength(3);
    });

    it('should set ist_aktiv to false by default if not provided', async () => {
      const newParticipation = {
        team_id: testTeam.team_id,
        saison: '2026/27',
        altersklasse: 'U14' as const
      };

      const result = await teamService.addParticipation(newParticipation);

      expect(result.ist_aktiv).toBe(false);
    });
  });

  describe('setActiveParticipation', () => {
    it('should set one participation as active and others as inactive', async () => {
      // Verify initial state
      const before = await teamService.getAllParticipations(testTeam.team_id);
      expect(before.find(p => p.id === participation2526.id)?.ist_aktiv).toBe(true);

      // Change active participation
      await teamService.setActiveParticipation(testTeam.team_id, participation2425.id!);

      // Verify new state
      const after = await teamService.getAllParticipations(testTeam.team_id);
      expect(after.find(p => p.id === participation2425.id)?.ist_aktiv).toBe(true);
      expect(after.find(p => p.id === participation2526.id)?.ist_aktiv).toBe(false);
    });

    it('should throw error if participation does not belong to team', async () => {
      const otherTeam: Team = {
        ...testTeam,
        team_id: 'other-team',
        name: 'Other Team'
      };
      await db.teams.add(otherTeam);

      const otherParticipation: TeamLigaParticipation = {
        id: 99,
        team_id: otherTeam.team_id,
        saison: '2025/26',
        altersklasse: 'U12',
        ist_aktiv: true,
        created_at: new Date()
      };
      await db.team_liga_participations.add(otherParticipation);

      await expect(
        teamService.setActiveParticipation(testTeam.team_id, 99)
      ).rejects.toThrow();
    });
  });
});
