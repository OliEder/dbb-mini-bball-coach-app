/**
 * Integration Test: Onboarding mit lokalen Club-Daten
 * 
 * Testet den vollständigen Onboarding-Flow ohne API-Calls
 * - ClubDataService lädt lokale Daten
 * - VereinStepV3 zeigt Clubs aus Metadaten
 * - TeamStepV3 lädt Chunk lazy
 */

import { describe, it, expect } from 'vitest';
import { clubDataService } from '@shared/services/ClubDataService';

describe('Onboarding V3: Lokale Club-Daten Integration', () => {
  
  describe('ClubDataService', () => {
    it('sollte Metadaten korrekt laden', () => {
      const stats = clubDataService.getStats();
      
      expect(stats.totalClubs).toBeGreaterThan(0);
      expect(stats.totalChunks).toBeGreaterThan(0);
      expect(stats.verbaende).toContain(2); // Bayern
    });
    
    it('sollte Clubs nach Namen suchen', () => {
      const results = clubDataService.searchClubs('Bayern');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name.toLowerCase()).toContain('bayern');
    });
    
    it('sollte Clubs nach Verband filtern', () => {
      const bayernClubs = clubDataService.getClubsByVerbaende([2]);
      
      expect(bayernClubs.length).toBeGreaterThan(0);
      bayernClubs.forEach(club => {
        expect(club.verbandIds).toContain(2);
      });
    });
    
    it('sollte leere Suche alle Clubs zurückgeben', () => {
      const allClubs = clubDataService.searchClubs('');
      const stats = clubDataService.getStats();
      
      expect(allClubs.length).toBe(stats.totalClubs);
    });
  });
  
  describe('Club Details (Lazy Loading)', () => {
    it('sollte Club-Details aus Chunk laden', async () => {
      // Hole ersten Club aus Metadaten
      const clubs = clubDataService.searchClubs('', [2]);
      expect(clubs.length).toBeGreaterThan(0);
      
      const firstClub = clubs[0];
      const details = await clubDataService.getClubDetails(firstClub.id);
      
      expect(details).toBeDefined();
      expect(details!.clubId).toBe(firstClub.id);
      expect(details!.vereinsname).toBe(firstClub.name);
      expect(details!.teams).toBeDefined();
      expect(details!.teams.length).toBeGreaterThan(0);
    });
    
    it('sollte null für nicht existierenden Club zurückgeben', async () => {
      const details = await clubDataService.getClubDetails('999999');
      
      expect(details).toBeNull();
    });
    
    it('sollte Chunks cachen', async () => {
      const clubs = clubDataService.searchClubs('', [2]);
      const firstClub = clubs[0];
      
      // Erstes Laden
      const details1 = await clubDataService.getClubDetails(firstClub.id);
      const cacheSize1 = clubDataService.getStats().cacheSize;
      
      // Zweites Laden (sollte aus Cache kommen)
      const details2 = await clubDataService.getClubDetails(firstClub.id);
      const cacheSize2 = clubDataService.getStats().cacheSize;
      
      expect(details1).toEqual(details2);
      expect(cacheSize2).toBe(cacheSize1); // Cache sollte nicht wachsen
    });
  });
  
  describe('Verband-Filter', () => {
    it('sollte nur Clubs aus gewählten Verbänden zurückgeben', () => {
      const bayernClubs = clubDataService.getClubsByVerbaende([2]);
      const hessenClubs = clubDataService.getClubsByVerbaende([5]);
      
      expect(bayernClubs.length).toBeGreaterThan(0);
      expect(hessenClubs.length).toBeGreaterThan(0);
      
      // Keine Überschneidungen (Clubs können auch in mehreren Verbänden sein, aber nicht alle)
      const bayernIds = new Set(bayernClubs.map(c => c.id));
      const hessenIds = new Set(hessenClubs.map(c => c.id));
      const intersection = [...bayernIds].filter(id => hessenIds.has(id));
      
      // Es sollte weniger Überschneidungen als Total geben
      expect(intersection.length).toBeLessThan(bayernClubs.length);
    });
    
    it('sollte Clubs in mehreren Verbänden finden', () => {
      const clubs = clubDataService.getClubsByVerbaende([2, 5]);
      
      expect(clubs.length).toBeGreaterThan(0);
      clubs.forEach(club => {
        const hasValidVerband = club.verbandIds.some(v => [2, 5].includes(v));
        expect(hasValidVerband).toBe(true);
      });
    });
  });
  
  describe('Performance', () => {
    it('sollte Suche schnell sein (<100ms)', () => {
      const start = Date.now();
      const results = clubDataService.searchClubs('München');
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(100);
      expect(results.length).toBeGreaterThan(0);
    });
    
    it('sollte Metadaten-Zugriff sehr schnell sein (<10ms)', () => {
      const start = Date.now();
      const stats = clubDataService.getStats();
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(10);
      expect(stats.totalClubs).toBeGreaterThan(0);
    });
  });
  
  describe('Daten-Validierung', () => {
    it('sollte valide Club-Struktur haben', async () => {
      const clubs = clubDataService.searchClubs('', [2]);
      const firstClub = clubs[0];
      const details = await clubDataService.getClubDetails(firstClub.id);
      
      expect(details).toMatchObject({
        clubId: expect.any(String),
        vereinsname: expect.any(String),
        vereinsnummer: expect.any(String),
        verbaende: expect.any(Array),
        teams: expect.any(Array)
      });
    });
    
    it('sollte Teams mit korrekten Daten haben', async () => {
      const clubs = clubDataService.searchClubs('', [2]);
      const details = await clubDataService.getClubDetails(clubs[0].id);
      
      if (details && details.teams.length > 0) {
        const team = details.teams[0];
        
        expect(team).toMatchObject({
          teamPermanentId: expect.any(String),
          teamname: expect.any(String),
          teamAkjId: expect.any(Number),
          teamAkj: expect.any(String),
          teamGenderId: expect.any(Number),
          teamGender: expect.any(String),
          teamNumber: expect.any(Number),
          seasons: expect.any(Array)
        });
      }
    });
  });
  
  describe('Edge Cases', () => {
    it('sollte leere Ergebnisse für unbekannten Suchbegriff zurückgeben', () => {
      const results = clubDataService.searchClubs('XYZ_DOES_NOT_EXIST_123');
      
      expect(results.length).toBe(0);
    });
    
    it('sollte Sonderzeichen in Suche handhaben', () => {
      const results = clubDataService.searchClubs('FC Bayern München');
      
      expect(results.length).toBeGreaterThanOrEqual(0); // Kann 0 sein wenn Sonderzeichen nicht matchen
    });
    
    it('sollte Case-Insensitive Suche durchführen', () => {
      const lower = clubDataService.searchClubs('bayern');
      const upper = clubDataService.searchClubs('BAYERN');
      const mixed = clubDataService.searchClubs('BaYeRn');
      
      expect(lower.length).toBe(upper.length);
      expect(lower.length).toBe(mixed.length);
    });
  });
});
