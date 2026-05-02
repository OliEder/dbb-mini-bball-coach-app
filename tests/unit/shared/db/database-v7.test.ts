/**
 * Database v7.0 Tests - Team-Liga-Relationships
 * 
 * RED Phase: Diese Tests schlagen zunächst fehl!
 * Implementierung erfolgt nach TDD-Ansatz
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Dexie from 'dexie';
import type { Team, TeamLigaParticipation, Altersklasse } from '../../types';

describe('Database v7.0 - Team-Liga-Relationships', () => {
  let testDb: Dexie;

  beforeEach(async () => {
    // Test-DB mit v7.0 Schema
    testDb = new Dexie('TestBasketballPWA');
    
    testDb.version(7).stores({
      teams: `
        team_id,
        extern_permanent_id,
        verein_id,
        name,
        team_typ,
        [extern_permanent_id+verein_id],
        [user_id+team_typ],
        created_at
      `,
      team_liga_participations: `
        participation_id,
        team_id,
        liga_id,
        extern_season_team_id,
        altersklasse,
        saison,
        ist_aktiv,
        [team_id+liga_id],
        [team_id+saison],
        [team_id+ist_aktiv],
        created_at
      `
    });

    await testDb.open();
  });

  afterEach(async () => {
    await testDb.delete();
  });

  describe('Team Schema v7.0', () => {
    it('Team sollte extern_permanent_id haben (nicht extern_team_id)', async () => {
      const team: Team = {
        team_id: crypto.randomUUID(),
        extern_permanent_id: '123456', // ✅ NEU: teamPermanentId
        verein_id: crypto.randomUUID(),
        name: 'FC Tegernheim U12',
        trainer: 'Max Mustermann',
        team_typ: 'eigen',
        created_at: new Date(),
      };

      await testDb.table('teams').add(team);
      const saved = await testDb.table('teams').get(team.team_id);

      expect(saved).toBeDefined();
      expect(saved.extern_permanent_id).toBe('123456');
      expect(saved).not.toHaveProperty('extern_team_id'); // ❌ Alte Property
    });

    it('Team sollte KEINE altersklasse, saison, liga_id haben', async () => {
      const team: Team = {
        team_id: crypto.randomUUID(),
        extern_permanent_id: '123456',
        verein_id: crypto.randomUUID(),
        name: 'FC Tegernheim U12',
        trainer: 'Max Mustermann',
        team_typ: 'eigen',
        created_at: new Date(),
      };

      await testDb.table('teams').add(team);
      const saved = await testDb.table('teams').get(team.team_id);

      // Diese Properties sollten NICHT existieren
      expect(saved).not.toHaveProperty('altersklasse');
      expect(saved).not.toHaveProperty('saison');
      expect(saved).not.toHaveProperty('liga_id');
    });

    it('Team sollte über extern_permanent_id dedupliziert werden', async () => {
      const team1: Team = {
        team_id: crypto.randomUUID(),
        extern_permanent_id: '123456',
        verein_id: crypto.randomUUID(),
        name: 'FC Tegernheim U12',
        trainer: 'Max Mustermann',
        team_typ: 'eigen',
        created_at: new Date(),
      };

      await testDb.table('teams').add(team1);

      // Suche über extern_permanent_id
      const found = await testDb.table('teams')
        .where('extern_permanent_id')
        .equals('123456')
        .first();

      expect(found).toBeDefined();
      expect(found.team_id).toBe(team1.team_id);
    });
  });

  describe('TeamLigaParticipation Schema', () => {
    it('sollte TeamLigaParticipation erstellen können', async () => {
      const teamId = crypto.randomUUID();
      
      // Erst Team erstellen
      const team: Team = {
        team_id: teamId,
        extern_permanent_id: '123456',
        verein_id: crypto.randomUUID(),
        name: 'FC Tegernheim U12',
        trainer: 'Max Mustermann',
        team_typ: 'eigen',
        created_at: new Date(),
      };

      await testDb.table('teams').add(team);

      // Dann Participation erstellen
      const participation: TeamLigaParticipation = {
        participation_id: crypto.randomUUID(),
        team_id: teamId,
        liga_id: 'liga-123',
        extern_season_team_id: 'season-team-456',
        altersklasse: 'U12' as Altersklasse,
        saison: '2024/25',
        ist_aktiv: true,
        created_at: new Date(),
      };

      await testDb.table('team_liga_participations').add(participation);
      const saved = await testDb.table('team_liga_participations')
        .get(participation.participation_id);

      expect(saved).toBeDefined();
      expect(saved.team_id).toBe(teamId);
      expect(saved.altersklasse).toBe('U12');
      expect(saved.saison).toBe('2024/25');
      expect(saved.ist_aktiv).toBe(true);
    });

    it('sollte aktive Participation für Team finden', async () => {
      const teamId = crypto.randomUUID();

      const team: Team = {
        team_id: teamId,
        extern_permanent_id: '123456',
        verein_id: crypto.randomUUID(),
        name: 'FC Tegernheim U12',
        trainer: 'Max Mustermann',
        team_typ: 'eigen',
        created_at: new Date(),
      };

      await testDb.table('teams').add(team);

      // Aktive Participation
      const activeParticipation: TeamLigaParticipation = {
        participation_id: crypto.randomUUID(),
        team_id: teamId,
        liga_id: 'liga-123',
        extern_season_team_id: 'season-team-456',
        altersklasse: 'U12' as Altersklasse,
        saison: '2024/25',
        ist_aktiv: true,
        created_at: new Date(),
      };

      // Inaktive Participation (alte Saison)
      const inactiveParticipation: TeamLigaParticipation = {
        participation_id: crypto.randomUUID(),
        team_id: teamId,
        liga_id: 'liga-999',
        extern_season_team_id: 'season-team-999',
        altersklasse: 'U11' as Altersklasse,
        saison: '2023/24',
        ist_aktiv: false,
        created_at: new Date(),
      };

      await testDb.table('team_liga_participations').bulkAdd([
        activeParticipation,
        inactiveParticipation
      ]);

      // Suche aktive Participation (Filter im Code, da boolean nicht in Compound-Index)
      const allParticipations = await testDb.table('team_liga_participations')
        .where('team_id')
        .equals(teamId)
        .toArray();
      
      const found = allParticipations.find(p => p.ist_aktiv === true);

      expect(found).toBeDefined();
      expect(found!.ist_aktiv).toBe(true);
      expect(found!.saison).toBe('2024/25');
      expect(found!.altersklasse).toBe('U12');
    });

    it('sollte Team in mehreren Ligen/Saisons spielen können', async () => {
      const teamId = crypto.randomUUID();

      const team: Team = {
        team_id: teamId,
        extern_permanent_id: '123456',
        verein_id: crypto.randomUUID(),
        name: 'FC Tegernheim',
        trainer: 'Max Mustermann',
        team_typ: 'eigen',
        created_at: new Date(),
      };

      await testDb.table('teams').add(team);

      // Participations für verschiedene Saisons
      const participations: TeamLigaParticipation[] = [
        {
          participation_id: crypto.randomUUID(),
          team_id: teamId,
          liga_id: 'liga-U11-2023',
          extern_season_team_id: 'season-1',
          altersklasse: 'U11' as Altersklasse,
          saison: '2023/24',
          ist_aktiv: false,
          created_at: new Date(),
        },
        {
          participation_id: crypto.randomUUID(),
          team_id: teamId,
          liga_id: 'liga-U12-2024',
          extern_season_team_id: 'season-2',
          altersklasse: 'U12' as Altersklasse,
          saison: '2024/25',
          ist_aktiv: true,
          created_at: new Date(),
        }
      ];

      await testDb.table('team_liga_participations').bulkAdd(participations);

      // Alle Participations für Team
      const allParticipations = await testDb.table('team_liga_participations')
        .where('team_id')
        .equals(teamId)
        .toArray();

      expect(allParticipations).toHaveLength(2);
      expect(allParticipations.map(p => p.altersklasse)).toContain('U11');
      expect(allParticipations.map(p => p.altersklasse)).toContain('U12');
    });

    it('sollte Compound-Index [team_id+liga_id] nutzen', async () => {
      const teamId = crypto.randomUUID();
      const ligaId = 'liga-123';

      const team: Team = {
        team_id: teamId,
        extern_permanent_id: '123456',
        verein_id: crypto.randomUUID(),
        name: 'FC Tegernheim U12',
        trainer: 'Max Mustermann',
        team_typ: 'eigen',
        created_at: new Date(),
      };

      await testDb.table('teams').add(team);

      const participation: TeamLigaParticipation = {
        participation_id: crypto.randomUUID(),
        team_id: teamId,
        liga_id: ligaId,
        extern_season_team_id: 'season-team-456',
        altersklasse: 'U12' as Altersklasse,
        saison: '2024/25',
        ist_aktiv: true,
        created_at: new Date(),
      };

      await testDb.table('team_liga_participations').add(participation);

      // Suche über Compound-Index
      const found = await testDb.table('team_liga_participations')
        .where('[team_id+liga_id]')
        .equals([teamId, ligaId])
        .first();

      expect(found).toBeDefined();
      expect(found.team_id).toBe(teamId);
      expect(found.liga_id).toBe(ligaId);
    });
  });

  describe('Multi-Season Support', () => {
    it('sollte Team-History über mehrere Saisons tracken', async () => {
      const teamId = crypto.randomUUID();

      const team: Team = {
        team_id: teamId,
        extern_permanent_id: '123456',
        verein_id: crypto.randomUUID(),
        name: 'FC Tegernheim',
        trainer: 'Max Mustermann',
        team_typ: 'eigen',
        created_at: new Date(),
      };

      await testDb.table('teams').add(team);

      // Saison 2022/23: U10 Kreisliga
      const participation1: TeamLigaParticipation = {
        participation_id: crypto.randomUUID(),
        team_id: teamId,
        liga_id: 'liga-U10-kreisliga',
        extern_season_team_id: 'season-1',
        altersklasse: 'U10' as Altersklasse,
        saison: '2022/23',
        ist_aktiv: false,
        created_at: new Date(),
      };

      // Saison 2023/24: U11 Bezirksliga (aufgestiegen)
      const participation2: TeamLigaParticipation = {
        participation_id: crypto.randomUUID(),
        team_id: teamId,
        liga_id: 'liga-U11-bezirksliga',
        extern_season_team_id: 'season-2',
        altersklasse: 'U11' as Altersklasse,
        saison: '2023/24',
        ist_aktiv: false,
        created_at: new Date(),
      };

      // Saison 2024/25: U12 Bezirksoberliga (wieder aufgestiegen)
      const participation3: TeamLigaParticipation = {
        participation_id: crypto.randomUUID(),
        team_id: teamId,
        liga_id: 'liga-U12-bezirksoberliga',
        extern_season_team_id: 'season-3',
        altersklasse: 'U12' as Altersklasse,
        saison: '2024/25',
        ist_aktiv: true,
        created_at: new Date(),
      };

      await testDb.table('team_liga_participations').bulkAdd([
        participation1,
        participation2,
        participation3
      ]);

      // Alle Saisons für Team
      const history = await testDb.table('team_liga_participations')
        .where('team_id')
        .equals(teamId)
        .sortBy('saison');

      expect(history).toHaveLength(3);
      expect(history[0].saison).toBe('2022/23');
      expect(history[1].saison).toBe('2023/24');
      expect(history[2].saison).toBe('2024/25');
      expect(history[2].ist_aktiv).toBe(true);
    });
  });
});
