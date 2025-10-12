/**
 * TeamService Unit Tests
 * 
 * Test-Driven Development für Team CRUD Operations
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { teamService } from './TeamService';
import { db, resetDatabase } from '@/shared/db/database';
import { v4 as uuidv4 } from 'uuid';
import type { Verein } from '@/shared/types';

describe('TeamService', () => {
  let testVerein: Verein;

  beforeEach(async () => {
    // Reset database before each test
    await resetDatabase();

    // Create test verein
    testVerein = {
      verein_id: uuidv4(),
      name: 'Test Basketballclub',
      ort: 'Teststadt',
      ist_eigener_verein: true,
      created_at: new Date(),
    };
    await db.vereine.add(testVerein);
  });

  describe('createTeam', () => {
    it('should create a new team with valid input', async () => {
      const input = {
        verein_id: testVerein.verein_id,
        name: 'U10 mixed',
        altersklasse: 'U10' as const,
        saison: '2025/2026',
        trainer: 'Max Mustermann',
      };

      const team = await teamService.createTeam(input);

      expect(team).toBeDefined();
      expect(team.team_id).toBeDefined();
      expect(team.name).toBe(input.name);
      expect(team.altersklasse).toBe(input.altersklasse);
      expect(team.saison).toBe(input.saison);
      expect(team.trainer).toBe(input.trainer);
      expect(team.verein_id).toBe(testVerein.verein_id);
      expect(team.created_at).toBeInstanceOf(Date);
    });

    it('should create team with optional leistungsorientiert flag', async () => {
      const input = {
        verein_id: testVerein.verein_id,
        name: 'U12 Leistung',
        altersklasse: 'U12' as const,
        saison: '2025/2026',
        trainer: 'Max Mustermann',
        leistungsorientiert: true,
      };

      const team = await teamService.createTeam(input);

      expect(team.leistungsorientiert).toBe(true);
    });

    it('should persist team to database', async () => {
      const input = {
        verein_id: testVerein.verein_id,
        name: 'U10 mixed',
        altersklasse: 'U10' as const,
        saison: '2025/2026',
        trainer: 'Max Mustermann',
      };

      const team = await teamService.createTeam(input);
      const retrieved = await db.teams.get(team.team_id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe(input.name);
    });
  });

  describe('getTeamById', () => {
    it('should return team when it exists', async () => {
      const team = await teamService.createTeam({
        verein_id: testVerein.verein_id,
        name: 'U10 mixed',
        altersklasse: 'U10' as const,
        saison: '2025/2026',
        trainer: 'Max Mustermann',
      });

      const retrieved = await teamService.getTeamById(team.team_id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.team_id).toBe(team.team_id);
    });

    it('should return undefined when team does not exist', async () => {
      const nonExistentId = uuidv4();
      const retrieved = await teamService.getTeamById(nonExistentId);

      expect(retrieved).toBeUndefined();
    });
  });

  describe('getTeamsByVerein', () => {
    it('should return all teams of a verein', async () => {
      await teamService.createTeam({
        verein_id: testVerein.verein_id,
        name: 'U10 mixed',
        altersklasse: 'U10' as const,
        saison: '2025/2026',
        trainer: 'Trainer 1',
      });

      await teamService.createTeam({
        verein_id: testVerein.verein_id,
        name: 'U12 mixed',
        altersklasse: 'U12' as const,
        saison: '2025/2026',
        trainer: 'Trainer 2',
      });

      const teams = await teamService.getTeamsByVerein(testVerein.verein_id);

      expect(teams).toHaveLength(2);
      expect(teams.every(t => t.verein_id === testVerein.verein_id)).toBe(true);
    });

    it('should return empty array when verein has no teams', async () => {
      const emptyVerein: Verein = {
        verein_id: uuidv4(),
        name: 'Empty Club',
        ort: 'Nowhere',
        ist_eigener_verein: false,
        created_at: new Date(),
      };
      await db.vereine.add(emptyVerein);

      const teams = await teamService.getTeamsByVerein(emptyVerein.verein_id);

      expect(teams).toHaveLength(0);
    });
  });

  describe('getTeamsBySaison', () => {
    it('should return all teams of a specific saison', async () => {
      await teamService.createTeam({
        verein_id: testVerein.verein_id,
        name: 'U10 Team 1',
        altersklasse: 'U10' as const,
        saison: '2025/2026',
        trainer: 'Trainer 1',
      });

      await teamService.createTeam({
        verein_id: testVerein.verein_id,
        name: 'U10 Team 2',
        altersklasse: 'U10' as const,
        saison: '2025/2026',
        trainer: 'Trainer 2',
      });

      await teamService.createTeam({
        verein_id: testVerein.verein_id,
        name: 'U10 Old',
        altersklasse: 'U10' as const,
        saison: '2024/2025',
        trainer: 'Trainer 3',
      });

      const teams = await teamService.getTeamsBySaison('2025/2026');

      expect(teams).toHaveLength(2);
      expect(teams.every(t => t.saison === '2025/2026')).toBe(true);
    });
  });

  describe('updateTeam', () => {
    it('should update team properties', async () => {
      const team = await teamService.createTeam({
        verein_id: testVerein.verein_id,
        name: 'U10 mixed',
        altersklasse: 'U10' as const,
        saison: '2025/2026',
        trainer: 'Old Trainer',
      });

      await teamService.updateTeam(team.team_id, {
        trainer: 'New Trainer',
        leistungsorientiert: true,
      });

      const updated = await teamService.getTeamById(team.team_id);

      expect(updated?.trainer).toBe('New Trainer');
      expect(updated?.leistungsorientiert).toBe(true);
      expect(updated?.name).toBe('U10 mixed'); // Unchanged
    });
  });

  describe('deleteTeam', () => {
    it('should delete team from database', async () => {
      const team = await teamService.createTeam({
        verein_id: testVerein.verein_id,
        name: 'U10 mixed',
        altersklasse: 'U10' as const,
        saison: '2025/2026',
        trainer: 'Max Mustermann',
      });

      await teamService.deleteTeam(team.team_id);

      const retrieved = await teamService.getTeamById(team.team_id);
      expect(retrieved).toBeUndefined();
    });

    it('should cascade delete related data', async () => {
      const team = await teamService.createTeam({
        verein_id: testVerein.verein_id,
        name: 'U10 mixed',
        altersklasse: 'U10' as const,
        saison: '2025/2026',
        trainer: 'Max Mustermann',
      });

      // Add related spieler
      await db.spieler.add({
        spieler_id: uuidv4(),
        team_id: team.team_id,
        vorname: 'Test',
        nachname: 'Spieler',
        spieler_typ: 'eigenes_team',
        aktiv: true,
        created_at: new Date(),
      });

      // Add related trikot
      await db.trikots.add({
        trikot_id: uuidv4(),
        team_id: team.team_id,
        art: 'Wendejersey',
        groesse: 'm',
        eu_groesse: 140,
        status: 'verfügbar',
        created_at: new Date(),
      });

      await teamService.deleteTeam(team.team_id);

      const spielerCount = await db.spieler.where({ team_id: team.team_id }).count();
      const trikotCount = await db.trikots.where({ team_id: team.team_id }).count();

      expect(spielerCount).toBe(0);
      expect(trikotCount).toBe(0);
    });
  });

  describe('isTeamNameTaken', () => {
    it('should return true if team name exists in same verein and saison', async () => {
      await teamService.createTeam({
        verein_id: testVerein.verein_id,
        name: 'U10 mixed',
        altersklasse: 'U10' as const,
        saison: '2025/2026',
        trainer: 'Max Mustermann',
      });

      const isTaken = await teamService.isTeamNameTaken(
        testVerein.verein_id,
        'U10 mixed',
        '2025/2026'
      );

      expect(isTaken).toBe(true);
    });

    it('should return false if team name does not exist', async () => {
      const isTaken = await teamService.isTeamNameTaken(
        testVerein.verein_id,
        'Non-existent Team',
        '2025/2026'
      );

      expect(isTaken).toBe(false);
    });

    it('should allow same name in different saison', async () => {
      await teamService.createTeam({
        verein_id: testVerein.verein_id,
        name: 'U10 mixed',
        altersklasse: 'U10' as const,
        saison: '2024/2025',
        trainer: 'Max Mustermann',
      });

      const isTaken = await teamService.isTeamNameTaken(
        testVerein.verein_id,
        'U10 mixed',
        '2025/2026'
      );

      expect(isTaken).toBe(false);
    });
  });

  describe('countPlayers', () => {
    it('should return correct player count', async () => {
      const team = await teamService.createTeam({
        verein_id: testVerein.verein_id,
        name: 'U10 mixed',
        altersklasse: 'U10' as const,
        saison: '2025/2026',
        trainer: 'Max Mustermann',
      });

      // Add 3 players
      for (let i = 0; i < 3; i++) {
        await db.spieler.add({
          spieler_id: uuidv4(),
          team_id: team.team_id,
          vorname: `Spieler${i}`,
          nachname: 'Test',
          spieler_typ: 'eigenes_team',
          aktiv: true,
          created_at: new Date(),
        });
      }

      const count = await teamService.countPlayers(team.team_id);
      expect(count).toBe(3);
    });
  });

  describe('countGames', () => {
    it('should return correct game count', async () => {
      const team = await teamService.createTeam({
        verein_id: testVerein.verein_id,
        name: 'U10 mixed',
        altersklasse: 'U10' as const,
        saison: '2025/2026',
        trainer: 'Max Mustermann',
      });

      // Add 2 games
      for (let i = 0; i < 2; i++) {
        await db.spiele.add({
          spiel_id: uuidv4(),
          team_id: team.team_id,
          datum: new Date(),
          heim: 'Team A',
          gast: 'Team B',
          ist_heimspiel: true,
          status: 'geplant',
          altersklasse: 'U10',
          created_at: new Date(),
        });
      }

      const count = await teamService.countGames(team.team_id);
      expect(count).toBe(2);
    });
  });
});
