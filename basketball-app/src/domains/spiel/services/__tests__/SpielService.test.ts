/**
 * SpielService Unit Tests
 * 
 * TDD RED Phase: Diese Tests definieren das gewünschte Verhalten
 * 
 * Zweck: 
 * - Spiel gehört KEINEM Team (team_id entfernt)
 * - SpielService kapselt Logik zum Filtern von Spielen nach Team
 * - Unterstützt Edge Case: Internes Spiel (beide Teams sind eigene Teams)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SpielService } from '../SpielService';
import { db } from '@/shared/db/database';
import type { Spiel, Team, Verein } from '@/shared/types';

// Mock Database
vi.mock('@/shared/db/database', () => ({
  db: {
    spiele: {
      toArray: vi.fn(),
      where: vi.fn(),
    },
    teams: {
      get: vi.fn(),
    },
  },
}));

describe('SpielService', () => {
  let spielService: SpielService;
  
  // Test Data
  const team1Id = 'team-1-uuid';
  const team2Id = 'team-2-uuid';
  const team3Id = 'team-3-uuid';
  
  const mockTeam1: Team = {
    team_id: team1Id,
    verein_id: 'verein-1',
    name: 'TV Pilsach U10',
    altersklasse: 'U10',
    saison: '2025/2026',
    trainer: 'Max Mustermann',
    team_typ: 'eigen',
    created_at: new Date(),
  };
  
  const mockTeam2: Team = {
    team_id: team2Id,
    verein_id: 'verein-1',
    name: 'TV Pilsach U12',
    altersklasse: 'U12',
    saison: '2025/2026',
    trainer: 'Max Mustermann',
    team_typ: 'eigen',
    created_at: new Date(),
  };
  
  const mockTeam3: Team = {
    team_id: team3Id,
    verein_id: 'verein-2',
    name: 'DJK Amberg U10',
    altersklasse: 'U10',
    saison: '2025/2026',
    trainer: 'Erika Musterfrau',
    team_typ: 'gegner',
    created_at: new Date(),
  };
  
  // Test Spiele ohne team_id!
  const mockSpiele: Omit<Spiel, 'team_id'>[] = [
    {
      spiel_id: 'spiel-1',
      datum: new Date('2025-11-01'),
      uhrzeit: '10:00',
      heim_team_id: team1Id,
      gast_team_id: team3Id,
      heim: 'TV Pilsach U10',
      gast: 'DJK Amberg U10',
      ist_heimspiel: true,
      status: 'geplant',
      altersklasse: 'U10',
      created_at: new Date(),
    },
    {
      spiel_id: 'spiel-2',
      datum: new Date('2025-11-08'),
      uhrzeit: '14:00',
      heim_team_id: team3Id,
      gast_team_id: team1Id,
      heim: 'DJK Amberg U10',
      gast: 'TV Pilsach U10',
      ist_heimspiel: false,
      status: 'geplant',
      altersklasse: 'U10',
      created_at: new Date(),
    },
    {
      // ⭐ EDGE CASE: Internes Spiel (beide Teams sind eigene Teams)
      spiel_id: 'spiel-3',
      datum: new Date('2025-11-15'),
      uhrzeit: '10:00',
      heim_team_id: team1Id, // TV Pilsach U10
      gast_team_id: team2Id, // TV Pilsach U12
      heim: 'TV Pilsach U10',
      gast: 'TV Pilsach U12',
      ist_heimspiel: true, // Aus Sicht von U10
      status: 'geplant',
      altersklasse: 'U10',
      created_at: new Date(),
    },
    {
      spiel_id: 'spiel-4',
      datum: new Date('2025-11-22'),
      uhrzeit: '16:00',
      heim_team_id: 'other-team',
      gast_team_id: 'another-team',
      heim: 'Anderes Team',
      gast: 'Noch ein Team',
      ist_heimspiel: false,
      status: 'geplant',
      altersklasse: 'U12',
      created_at: new Date(),
    },
  ];
  
  beforeEach(() => {
    vi.clearAllMocks();
    spielService = new SpielService();
    
    // Setup Mock: toArray gibt alle Spiele zurück
    vi.mocked(db.spiele.toArray).mockResolvedValue(mockSpiele as Spiel[]);
    
    // Setup Mock: teams.get gibt entsprechendes Team zurück
    vi.mocked(db.teams.get).mockImplementation(async (id: string) => {
      if (id === team1Id) return mockTeam1;
      if (id === team2Id) return mockTeam2;
      if (id === team3Id) return mockTeam3;
      return undefined;
    });
  });
  
  describe('getSpiele', () => {
    it('should return all Spiele for a team (Heim OR Gast)', async () => {
      const result = await spielService.getSpiele(team1Id);
      
      // Team 1 spielt in: spiel-1 (Heim), spiel-2 (Gast), spiel-3 (Heim)
      expect(result).toHaveLength(3);
      expect(result.map(s => s.spiel_id)).toEqual(
        expect.arrayContaining(['spiel-1', 'spiel-2', 'spiel-3'])
      );
    });
    
    it('should handle internes Spiel correctly - beide Teams finden das Spiel', async () => {
      // Team 1 (U10) findet internes Spiel
      const resultTeam1 = await spielService.getSpiele(team1Id);
      expect(resultTeam1.map(s => s.spiel_id)).toContain('spiel-3');
      
      // Team 2 (U12) findet ebenfalls internes Spiel
      const resultTeam2 = await spielService.getSpiele(team2Id);
      expect(resultTeam2).toHaveLength(1); // Nur spiel-3
      expect(resultTeam2[0].spiel_id).toBe('spiel-3');
    });
    
    it('should return empty array if team has no games', async () => {
      const result = await spielService.getSpiele('nonexistent-team-id');
      expect(result).toEqual([]);
    });
    
    it('should sort games by date ascending', async () => {
      const result = await spielService.getSpiele(team1Id);
      
      // Prüfe ob sortiert (ältestes zuerst)
      const dates = result.map(s => s.datum.getTime());
      const sortedDates = [...dates].sort((a, b) => a - b);
      expect(dates).toEqual(sortedDates);
    });
  });
  
  describe('getHeimSpiele', () => {
    it('should return only Heimspiele for a team', async () => {
      const result = await spielService.getHeimSpiele(team1Id);
      
      // Team 1 hat: spiel-1 (Heim), spiel-3 (Heim)
      expect(result).toHaveLength(2);
      expect(result.every(s => s.heim_team_id === team1Id)).toBe(true);
    });
    
    it('should return empty array if team has no Heimspiele', async () => {
      // Team 2 spielt nur als Gast (spiel-3)
      const result = await spielService.getHeimSpiele(team2Id);
      expect(result).toEqual([]);
    });
  });
  
  describe('getAuswaertsSpiele', () => {
    it('should return only Auswärtsspiele for a team', async () => {
      const result = await spielService.getAuswaertsSpiele(team1Id);
      
      // Team 1 hat: spiel-2 (Gast)
      expect(result).toHaveLength(1);
      expect(result[0].spiel_id).toBe('spiel-2');
      expect(result[0].gast_team_id).toBe(team1Id);
    });
    
    it('should return empty array if team has no Auswärtsspiele', async () => {
      // Test mit einem Team, das gar nicht in den Mock-Daten ist
      const result = await spielService.getAuswaertsSpiele('nonexistent-team');
      expect(result).toEqual([]);
    });
  });
  
  describe('getUpcomingSpiele', () => {
    it('should return only geplante Spiele sorted by date', async () => {
      const result = await spielService.getUpcomingSpiele(team1Id);
      
      expect(result.every(s => s.status === 'geplant')).toBe(true);
      expect(result).toHaveLength(3); // alle 3 Spiele von Team 1 sind geplant
    });
    
    it('should limit results if limit parameter is provided', async () => {
      const result = await spielService.getUpcomingSpiele(team1Id, 2);
      
      expect(result).toHaveLength(2);
    });
  });
  
  describe('getCompletedSpiele', () => {
    it('should return only abgeschlossene Spiele', async () => {
      // Add completed game
      const completedSpiel: Omit<Spiel, 'team_id'> = {
        spiel_id: 'spiel-completed',
        datum: new Date('2025-10-01'),
        uhrzeit: '10:00',
        heim_team_id: team1Id,
        gast_team_id: team3Id,
        heim: 'TV Pilsach U10',
        gast: 'DJK Amberg U10',
        ist_heimspiel: true,
        status: 'abgeschlossen',
        ergebnis_heim: 45,
        ergebnis_gast: 38,
        altersklasse: 'U10',
        created_at: new Date(),
      };
      
      vi.mocked(db.spiele.toArray).mockResolvedValue([
        ...mockSpiele as Spiel[],
        completedSpiel as Spiel
      ]);
      
      const result = await spielService.getCompletedSpiele(team1Id);
      
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('abgeschlossen');
      expect(result[0].spiel_id).toBe('spiel-completed');
    });
  });
  
  describe('isInternesSpiel', () => {
    it('should return true if both teams are eigene Teams', async () => {
      const spiel = mockSpiele[2]; // spiel-3: team1 vs team2
      const result = await spielService.isInternesSpiel(spiel as Spiel);
      
      expect(result).toBe(true);
    });
    
    it('should return false if only one team is eigenes Team', async () => {
      const spiel = mockSpiele[0]; // spiel-1: team1 vs team3 (gegner)
      const result = await spielService.isInternesSpiel(spiel as Spiel);
      
      expect(result).toBe(false);
    });
    
    it('should return false if neither team is found', async () => {
      const spiel = mockSpiele[3]; // spiel-4: other teams
      const result = await spielService.isInternesSpiel(spiel as Spiel);
      
      expect(result).toBe(false);
    });
  });
});
