/**
 * Team Service Tests - Multi-Team Support
 * 
 * Tests für neue Multi-Team Funktionalität
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { teamService } from '@/domains/team/services/TeamService';
import { db } from '@/shared/db/database';
import type { Team, Spieler, Spiel } from '@/shared/types';

describe('TeamService - Multi-Team Support', () => {
  // Test User ID
  const testUserId = 'test-user-123';
  
  // Test Teams
  const team1: Team = {
    team_id: 'team-1',
    verein_id: 'verein-1',
    name: 'U12 Team A',
    altersklasse: 'U12',
    altersklasse_id: '12',
    geschlecht: 'mixed',
    saison: '2025/2026',  // ✅ Aktuelle Saison
    trainer: 'Max Mustermann',
    team_typ: 'eigen',
    user_id: testUserId,
    created_at: new Date('2025-09-01')
  };

  const team2: Team = {
    team_id: 'team-2',
    verein_id: 'verein-1',
    name: 'U10 Team B',
    altersklasse: 'U10',
    altersklasse_id: '10',
    geschlecht: 'mixed',
    saison: '2025/2026',  // ✅ Aktuelle Saison
    trainer: 'Max Mustermann',
    team_typ: 'eigen',
    user_id: testUserId,
    created_at: new Date('2025-09-01')
  };

  const team3: Team = {
    team_id: 'team-3',
    verein_id: 'verein-2',
    name: 'U12 Gegner',
    altersklasse: 'U12',
    altersklasse_id: '12',
    geschlecht: 'mixed',
    saison: '2025/2026',  // ✅ Aktuelle Saison
    trainer: 'Andere Trainer',
    team_typ: 'gegner',
    user_id: null,
    created_at: new Date('2025-09-01')
  };

  beforeEach(async () => {
    // Setup: Testdaten in DB einfügen
    await db.teams.bulkAdd([team1, team2, team3]);
  });

  afterEach(async () => {
    // Cleanup: Alle Testdaten löschen
    await db.teams.clear();
    await db.spieler.clear();
    await db.spiele.clear();
    await db.liga_tabellen.clear();
  });

  describe('getMyTeams', () => {
    it('should return all teams for user', async () => {
      const teams = await teamService.getMyTeams(testUserId);
      
      expect(teams).toHaveLength(2);
      expect(teams.map(t => t.team_id)).toContain('team-1');
      expect(teams.map(t => t.team_id)).toContain('team-2');
      expect(teams.map(t => t.team_id)).not.toContain('team-3'); // Gegner-Team nicht
    });

    it('should return empty array for user without teams', async () => {
      const teams = await teamService.getMyTeams('other-user');
      
      expect(teams).toHaveLength(0);
    });

    it('should only return eigen teams', async () => {
      // Füge ein Gegner-Team mit gleicher user_id hinzu (sollte nicht passieren, aber zur Sicherheit)
      const gegnerTeam: Team = {
        ...team1,
        team_id: 'team-4',
        team_typ: 'gegner',
        user_id: testUserId
      };
      await db.teams.add(gegnerTeam);
      
      const teams = await teamService.getMyTeams(testUserId);
      
      // Sollte nur die 2 "eigen" Teams zurückgeben, nicht das Gegner-Team
      expect(teams).toHaveLength(2);
      expect(teams.every(t => t.team_typ === 'eigen')).toBe(true);
    });

    it('should order teams by created_at', async () => {
      // Team mit späterem Datum hinzufügen
      const newestTeam: Team = {
        ...team1,
        team_id: 'team-newest',
        name: 'Neuestes Team',
        created_at: new Date('2025-10-01')
      };
      await db.teams.add(newestTeam);
      
      const teams = await teamService.getMyTeams(testUserId);
      
      expect(teams).toHaveLength(3);
      // Erstes Team sollte das älteste sein
      expect(teams[0].team_id).toBe('team-1');
    });
  });

  describe('getTeamStats', () => {
    beforeEach(async () => {
      // Setup: Spieler hinzufügen
      const spieler: Spieler[] = [
        {
          spieler_id: 'spieler-1',
          team_id: 'team-1',
          vorname: 'Max',
          nachname: 'Müller',
          geburtsdatum: '2012-05-15',
          trikotnummer: 7,
          position: 'Guard',
          created_at: new Date()
        },
        {
          spieler_id: 'spieler-2',
          team_id: 'team-1',
          vorname: 'Anna',
          nachname: 'Schmidt',
          geburtsdatum: '2012-08-20',
          trikotnummer: 12,
          position: 'Forward',
          created_at: new Date()
        }
      ];
      await db.spieler.bulkAdd(spieler);

      // Setup: Spiele hinzufügen ✅ v6.0: mit heim_team_id/gast_team_id
      const spiele: Spiel[] = [
        {
          spiel_id: 'spiel-1',
          heim_team_id: 'team-1',      // ✅ v6.0
          gast_team_id: 'team-3',      // ✅ v6.0
          datum: new Date('2025-10-15'),  // Vergangenes Spiel (heute ist 27.10.)
          heim: 'U12 Team A',
          gast: 'Gegner 1',
          ist_heimspiel: true,
          status: 'abgeschlossen',  // ✅ Fixed: beendet → abgeschlossen
          altersklasse: 'U12',
          created_at: new Date()
        },
        {
          spiel_id: 'spiel-2',
          heim_team_id: 'team-1',      // ✅ v6.0
          gast_team_id: 'team-3',      // ✅ v6.0
          datum: new Date('2025-11-01'),  // Zukünftiges Spiel
          heim: 'U12 Team A',
          gast: 'Gegner 2',
          ist_heimspiel: true,
          status: 'geplant',
          altersklasse: 'U12',
          created_at: new Date()
        },
        {
          spiel_id: 'spiel-3',
          heim_team_id: 'team-3',      // ✅ v6.0: Gegner ist Heim
          gast_team_id: 'team-1',      // ✅ v6.0: Team-1 ist Gast
          datum: new Date('2025-11-15'),  // Zukünftiges Spiel
          heim: 'Gegner 3',
          gast: 'U12 Team A',
          ist_heimspiel: false,         // ✅ v6.0: Auswärtsspiel!
          status: 'geplant',
          altersklasse: 'U12',
          created_at: new Date()
        }
      ];
      await db.spiele.bulkAdd(spiele);
    });

    it('should return correct player count', async () => {
      const stats = await teamService.getTeamStats('team-1');
      
      expect(stats.spielerCount).toBe(2);
    });

    it('should return correct game count', async () => {
      const stats = await teamService.getTeamStats('team-1');
      
      expect(stats.spieleCount).toBe(3);
    });

    it('should return next game', async () => {
      const stats = await teamService.getTeamStats('team-1');
      
      expect(stats.naechstesSpiel).toBeDefined();
      expect(stats.naechstesSpiel?.spiel_id).toBe('spiel-2'); // Erstes zukünftiges Spiel
      expect(stats.naechstesSpiel?.datum.toISOString()).toBe(new Date('2025-11-01').toISOString());
    });

    it('should return undefined for next game if no future games', async () => {
      // Lösche alle zukünftigen Spiele
      await db.spiele.where('spiel_id').anyOf(['spiel-2', 'spiel-3']).delete();
      
      const stats = await teamService.getTeamStats('team-1');
      
      expect(stats.naechstesSpiel).toBeUndefined();
    });

    it('should return table position if available', async () => {
      // Füge Tabellen-Eintrag hinzu
      // Erst Liga-Info zum Team hinzufügen
      await db.teams.update('team-1', {
        liga_id: 'liga-1',
        liga_name: 'Kreisliga U12'
      });

      // ✅ Tabellen-Eintrag mit expliziter ID
      const tabellenEintrag = {
        id: 1,  // ✅ Explizite ID
        ligaid: 'liga-1',
        teamname: 'U12 Team A',
        platz: 3,
        spiele: 5,
        gewonnen: 3,
        verloren: 2,
        punkte: 6,
        korb_plus: 250,
        korb_minus: 220
      };
      await db.liga_tabellen.add(tabellenEintrag);
      
      const stats = await teamService.getTeamStats('team-1');
      
      expect(stats.tabellenplatz).toBe(3);
    });

    it('should return undefined for table position if not available', async () => {
      const stats = await teamService.getTeamStats('team-1');
      
      expect(stats.tabellenplatz).toBeUndefined();
    });

    it('should return zero counts for team without data', async () => {
      const stats = await teamService.getTeamStats('team-2');
      
      expect(stats.spielerCount).toBe(0);
      expect(stats.spieleCount).toBe(0);
      expect(stats.naechstesSpiel).toBeUndefined();
      expect(stats.tabellenplatz).toBeUndefined();
    });
  });

  describe('edge cases', () => {
    it('should handle non-existent team in getTeamStats', async () => {
      const stats = await teamService.getTeamStats('non-existent');
      
      expect(stats.spielerCount).toBe(0);
      expect(stats.spieleCount).toBe(0);
    });

    it('should handle null user_id in getMyTeams', async () => {
      const teams = await teamService.getMyTeams(null as any);
      
      expect(teams).toHaveLength(0);
    });
  });
});
