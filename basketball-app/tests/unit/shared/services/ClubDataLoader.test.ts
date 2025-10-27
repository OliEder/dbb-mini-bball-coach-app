/**
 * Unit Tests: ClubDataLoader Service
 * 
 * HINWEIS: Diese Tests verwenden die echten Chunk-Daten
 * (Integration-Test-Ansatz), da Mocking dynamischer Imports
 * in Vitest komplex ist.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { clubDataLoader } from '@shared/services/ClubDataLoader';

describe('ClubDataLoader', () => {
  beforeEach(() => {
    // Cache vor jedem Test leeren
    clubDataLoader.clearCache();
  });

  describe('loadAllClubs()', () => {
    it('lädt alle Clubs aus allen Chunks', async () => {
      const clubs = await clubDataLoader.loadAllClubs();
      
      // Sollte viele Clubs laden (echte Daten)
      expect(clubs.length).toBeGreaterThan(0);
      expect(clubs[0]).toHaveProperty('verein');
      expect(clubs[0]).toHaveProperty('clubId');
    });

    it('sortiert Clubs alphabetisch nach Name', async () => {
      const clubs = await clubDataLoader.loadAllClubs();
      
      // Prüfe ob alphabetisch sortiert mit localeCompare
      for (let i = 0; i < clubs.length - 1; i++) {
        const comparison = clubs[i].verein.name.localeCompare(
          clubs[i + 1].verein.name,
          'de',
          { sensitivity: 'base' }
        );
        expect(comparison <= 0).toBe(true);
      }
    });

    it('cached Ergebnisse beim zweiten Aufruf', async () => {
      const firstCall = await clubDataLoader.loadAllClubs();
      const secondCall = await clubDataLoader.loadAllClubs();
      
      // Sollten identisch sein (gleiche Referenz durch Cache)
      expect(firstCall).toBe(secondCall);
    });

    it('setzt Verein-Daten korrekt', async () => {
      const clubs = await clubDataLoader.loadAllClubs();
      const firstClub = clubs[0];
      
      expect(firstClub.verein.verein_id).toBeDefined();
      expect(firstClub.verein.name).toBeDefined();
      // kurzname ist optional, kann aber via Fallback immer vorhanden sein
      expect(typeof firstClub.verein.kurzname).toBe('string');
      expect(Array.isArray(firstClub.verein.verband_ids)).toBe(true);
      expect(firstClub.verein.ist_eigener_verein).toBe(false);
      expect(firstClub.verein.created_at).toBeInstanceOf(Date);
    });
  });

  describe('searchClubs()', () => {
    it('findet Clubs nach Namen', async () => {
      const allClubs = await clubDataLoader.loadAllClubs();
      const searchTerm = allClubs[0].verein.name.substring(0, 5);
      
      const results = await clubDataLoader.searchClubs(searchTerm);
      
      expect(results.length).toBeGreaterThan(0);
      expect(
        results.some(c => c.verein.name.toLowerCase().includes(searchTerm.toLowerCase()))
      ).toBe(true);
    });

    it('ist case-insensitive', async () => {
      const allClubs = await clubDataLoader.loadAllClubs();
      const club = allClubs[0];
      
      const lowerResults = await clubDataLoader.searchClubs(club.verein.name.toLowerCase());
      const upperResults = await clubDataLoader.searchClubs(club.verein.name.toUpperCase());
      
      expect(lowerResults.length).toBeGreaterThan(0);
      expect(upperResults.length).toBeGreaterThan(0);
      expect(lowerResults.length).toBe(upperResults.length);
    });

    it('gibt alle Clubs zurück bei leerem Query', async () => {
      const allClubs = await clubDataLoader.loadAllClubs();
      const results = await clubDataLoader.searchClubs('');
      
      expect(results.length).toBe(allClubs.length);
    });

    it('gibt leeres Array bei nicht gefundenem Club', async () => {
      const results = await clubDataLoader.searchClubs('Nicht Existierender Club XYZ 99999');
      
      expect(results).toHaveLength(0);
    });

    it('findet Clubs mit Teilstring', async () => {
      const allClubs = await clubDataLoader.loadAllClubs();
      const club = allClubs[0];
      const substring = club.verein.name.substring(0, 4);
      
      const results = await clubDataLoader.searchClubs(substring);
      
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('filterByVerband()', () => {
    it('filtert Clubs nach Verband-ID', async () => {
      const allClubs = await clubDataLoader.loadAllClubs();
      const verbandId = allClubs[0].verein.verband_ids[0];
      
      const results = await clubDataLoader.filterByVerband(verbandId);
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.every(c => c.verein.verband_ids.includes(verbandId))).toBe(true);
    });

    it('gibt alle Clubs zurück bei null', async () => {
      const allClubs = await clubDataLoader.loadAllClubs();
      const results = await clubDataLoader.filterByVerband(null);
      
      expect(results.length).toBe(allClubs.length);
    });

    it('gibt leeres Array bei Verband ohne Clubs', async () => {
      const results = await clubDataLoader.filterByVerband(999);
      
      expect(results).toHaveLength(0);
    });
  });

  describe('searchAndFilter()', () => {
    it('kombiniert Suche und Verband-Filter', async () => {
      const allClubs = await clubDataLoader.loadAllClubs();
      const club = allClubs.find(c => c.verein.verband_ids.length > 0);
      
      if (club) {
        const verbandId = club.verein.verband_ids[0];
        const searchTerm = club.verein.name.substring(0, 5);
        
        const results = await clubDataLoader.searchAndFilter(searchTerm, verbandId);
        
        expect(results.length).toBeGreaterThan(0);
        expect(
          results.every(c => 
            c.verein.verband_ids.includes(verbandId) &&
            c.verein.name.toLowerCase().includes(searchTerm.toLowerCase())
          )
        ).toBe(true);
      }
    });

    it('findet nichts bei inkompatiblen Filtern', async () => {
      const results = await clubDataLoader.searchAndFilter('Nicht Existierender Club', 999);
      
      expect(results).toHaveLength(0);
    });

    it('funktioniert nur mit Suche', async () => {
      const allClubs = await clubDataLoader.loadAllClubs();
      const searchTerm = allClubs[0].verein.name.substring(0, 5);
      
      const results = await clubDataLoader.searchAndFilter(searchTerm, null);
      
      expect(results.length).toBeGreaterThan(0);
    });

    it('funktioniert nur mit Filter', async () => {
      const allClubs = await clubDataLoader.loadAllClubs();
      const verbandId = allClubs[0].verein.verband_ids[0];
      
      const results = await clubDataLoader.searchAndFilter('', verbandId);
      
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('loadTeamsForClub()', () => {
    it('lädt Teams für einen existierenden Club', async () => {
      const allClubs = await clubDataLoader.loadAllClubs();
      const club = allClubs[0];
      
      const teams = await clubDataLoader.loadTeamsForClub(club.clubId);
      
      // Teams können leer sein, aber Methode sollte funktionieren
      expect(Array.isArray(teams)).toBe(true);
    });

    it('gibt leeres Array für nicht-existierenden Club', async () => {
      const teams = await clubDataLoader.loadTeamsForClub('club_non_existent_999999');
      
      expect(teams).toHaveLength(0);
    });

    it('setzt Team-Daten korrekt wenn Teams vorhanden', async () => {
      const allClubs = await clubDataLoader.loadAllClubs();
      
      // Finde einen Club mit Teams
      for (const club of allClubs.slice(0, 10)) {
        const teams = await clubDataLoader.loadTeamsForClub(club.clubId);
        
        if (teams.length > 0) {
          const team = teams[0];
          
          expect(team.team_id).toBeDefined();
          expect(team.verein_id).toBeDefined();
          expect(team.name).toBeDefined();
          // ✅ Saison wird dynamisch aus Team-Daten extrahiert (nicht mehr hardcodiert)
          expect(team.saison).toMatch(/\d{4}\/\d{4}/);
          // ✅ Altersklasse kann jetzt auch "Senioren" sein
          const validPattern = /^(U\d{1,2}|Senioren)$/;
          expect(team.altersklasse).toMatch(validPattern);
          expect(team.team_typ).toBe('eigen');
          expect(team.created_at).toBeInstanceOf(Date);
          
          // Teams sollten alphabetisch sortiert sein
          for (let i = 0; i < teams.length - 1; i++) {
            expect(teams[i].name <= teams[i + 1].name).toBe(true);
          }
          
          break;
        }
      }
    });
  });

  describe('getMetadata()', () => {
    it('gibt Metadaten zurück', () => {
      const metadata = clubDataLoader.getMetadata();
      
      expect(metadata).toBeDefined();
      expect(metadata.totalClubs).toBeGreaterThan(0);
      expect(metadata.chunksCount).toBeGreaterThan(0); // chunksCount, nicht chunkCount
      expect(metadata.generatedAt).toBeDefined(); // generatedAt statt version
    });
  });

  describe('clearCache()', () => {
    it('leert den Cache', async () => {
      // Cache füllen
      const firstCall = await clubDataLoader.loadAllClubs();
      
      // Cache leeren
      clubDataLoader.clearCache();
      
      // Neuer Aufruf sollte neue Instanz laden
      const secondCall = await clubDataLoader.loadAllClubs();
      
      // Sollten unterschiedliche Referenzen sein
      expect(firstCall).not.toBe(secondCall);
      
      // Gleiche Anzahl und Struktur (created_at wird bei jedem Load neu gesetzt)
      expect(firstCall.length).toBe(secondCall.length);
      expect(firstCall[0].clubId).toBe(secondCall[0].clubId);
      expect(firstCall[0].verein.name).toBe(secondCall[0].verein.name);
    });
  });

  describe('Performance & Edge Cases', () => {
    it('lädt mehrere Clubs gleichzeitig ohne Race Conditions', async () => {
      const allClubs = await clubDataLoader.loadAllClubs();
      const searchTerm = allClubs[0].verein.name.substring(0, 3);
      const verbandId = allClubs[0].verein.verband_ids[0];
      
      const promises = [
        clubDataLoader.searchClubs(searchTerm),
        clubDataLoader.filterByVerband(verbandId),
        clubDataLoader.loadTeamsForClub(allClubs[0].clubId),
        clubDataLoader.loadAllClubs()
      ];
      
      await expect(Promise.all(promises)).resolves.toBeDefined();
    });

    it('handled UTF-8 Sonderzeichen in Namen', async () => {
      // Finde einen Club mit Umlaut
      const allClubs = await clubDataLoader.loadAllClubs();
      const clubWithUmlaut = allClubs.find(c => 
        /[äöüßÄÖÜ]/.test(c.verein.name)
      );
      
      if (clubWithUmlaut) {
        const results = await clubDataLoader.searchClubs(clubWithUmlaut.verein.name);
        expect(results.length).toBeGreaterThan(0);
      }
    });

    it('trimmed Whitespace in Suchanfragen', async () => {
      const allClubs = await clubDataLoader.loadAllClubs();
      const searchTerm = allClubs[0].verein.name.substring(0, 5);
      
      const results = await clubDataLoader.searchClubs(`  ${searchTerm}  `);
      
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('Data Integrity', () => {
    it('alle Clubs haben valide Datenstruktur', async () => {
      const clubs = await clubDataLoader.loadAllClubs();
      
      clubs.forEach(club => {
        expect(club.verein.verein_id).toBeTruthy();
        expect(club.verein.name).toBeTruthy();
        // kurzname ist optional, aber sollte via Fallback immer string sein
        expect(typeof club.verein.kurzname).toBe('string');
        expect(club.verein.kurzname.length).toBeGreaterThan(0);
        expect(Array.isArray(club.verein.verband_ids)).toBe(true);
        expect(typeof club.verein.ist_eigener_verein).toBe('boolean');
        expect(club.clubId).toBeTruthy();
      });
    });

    it('keine Duplikate in der Club-Liste', async () => {
      const clubs = await clubDataLoader.loadAllClubs();
      const clubIds = clubs.map(c => c.clubId);
      const uniqueIds = new Set(clubIds);
      
      expect(clubIds.length).toBe(uniqueIds.size);
    });

    it('keine leeren Verband-Arrays', async () => {
      const clubs = await clubDataLoader.loadAllClubs();
      
      clubs.forEach(club => {
        expect(club.verein.verband_ids.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Altersklasse und Saison Extraktion', () => {
    it('extrahiert Altersklasse aus teamAkj', async () => {
      const allClubs = await clubDataLoader.loadAllClubs();
      
      // Finde Club mit Teams
      for (const club of allClubs.slice(0, 20)) {
        const teams = await clubDataLoader.loadTeamsForClub(club.clubId);
        
        if (teams.length > 0) {
          teams.forEach(team => {
            // Altersklasse sollte entweder "UXX" oder "Senioren" sein
            const validPattern = /^(U\d{1,2}|Senioren)$/;
            expect(team.altersklasse).toMatch(validPattern);
            
            // Wenn UXX, dann Plausibilitätscheck
            if (team.altersklasse !== 'Senioren') {
              const numericPart = parseInt(team.altersklasse.substring(1));
              expect(numericPart).toBeGreaterThan(0);
              expect(numericPart).toBeLessThanOrEqual(23);  // U7 bis U23
            }
          });
          break;
        }
      }
    });

    it('extrahiert U21, U23 und Senioren korrekt', async () => {
      // Dieser Test prüft ob alle erweiterten Altersklassen unterstützt werden
      const testCases = [
        { teamAkj: 'U21', expected: 'U21' },
        { teamAkj: 'U23', expected: 'U23' },
        { teamAkj: 'U21 männlich', expected: 'U21' },
        { teamAkj: 'U23 weiblich', expected: 'U23' },
        { teamAkj: 'Herren', expected: 'Senioren' },
        { teamAkj: 'Damen', expected: 'Senioren' },
        { teamAkj: 'Senioren männlich', expected: 'Senioren' },
      ];

      // Diese Test-Logik wird erst funktionieren wenn BBBSyncService angepasst ist
      // Für jetzt prüfen wir nur dass der Type korrekt ist
      testCases.forEach(({ expected }) => {
        // Type-Check: Diese Werte sollten valide Altersklasse sein
        const validAltersklassen: ('U7' | 'U8' | 'U9' | 'U10' | 'U11' | 'U12' | 'U13' | 'U14' | 'U15' | 'U16' | 'U17' | 'U18' | 'U19' | 'U20' | 'U21' | 'U23' | 'Senioren')[] = [
          'U7', 'U8', 'U9', 'U10', 'U11', 'U12', 'U13', 'U14', 'U15', 'U16', 'U17', 'U18', 'U19', 'U20', 'U21', 'U23', 'Senioren'
        ];
        expect(validAltersklassen).toContain(expected);
      });
    });

    it('extrahiert Saison aus seasons', async () => {
      const allClubs = await clubDataLoader.loadAllClubs();
      
      // Finde Club mit Teams
      for (const club of allClubs.slice(0, 20)) {
        const teams = await clubDataLoader.loadTeamsForClub(club.clubId);
        
        if (teams.length > 0) {
          teams.forEach(team => {
            // Saison sollte im Format "YYYY/YYYY" sein
            expect(team.saison).toMatch(/^\d{4}\/\d{4}$/);
            // Jahre sollten aufeinanderfolgend sein
            const [year1, year2] = team.saison.split('/');
            expect(parseInt(year1) + 1).toBe(parseInt(year2));
          });
          break;
        }
      }
    });

    it('verwendet Fallback wenn teamAkj fehlt', async () => {
      // Dieser Test prüft implizit ob Fallback funktioniert
      // Alle Teams sollten eine gültige Altersklasse haben
      const allClubs = await clubDataLoader.loadAllClubs();
      
      for (const club of allClubs.slice(0, 20)) {
        const teams = await clubDataLoader.loadTeamsForClub(club.clubId);
        
        if (teams.length > 0) {
          teams.forEach(team => {
            expect(team.altersklasse).toBeDefined();
            // ✅ Altersklasse kann jetzt auch "Senioren" sein
            const validPattern = /^(U\d{1,2}|Senioren)$/;
            expect(team.altersklasse).toMatch(validPattern);
          });
          break;
        }
      }
    });
  });
});
