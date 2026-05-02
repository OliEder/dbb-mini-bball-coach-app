/**
 * Tests für URL Utilities
 */

import { describe, it, expect } from 'vitest';
import { 
  extractLigaIdFromUrl, 
  normalizeBBBUrl, 
  BBBUrls,
  isBBBUrl
} from './urlUtils';

describe('extractLigaIdFromUrl', () => {
  describe('Query Parameter Extraktion', () => {
    it('sollte liga_id aus Query-Parametern extrahieren', () => {
      const testCases = [
        'https://www.basketball-bund.net/public/tabelle.jsp?liga_id=51961',
        'https://www.basketball-bund.net/public/ergebnisse.jsp?print=1&liga_id=51961',
        'https://www.basketball-bund.net/liga?liga_id=51961&view=table',
        '?liga_id=51961',
        'page.jsp?foo=bar&liga_id=51961&baz=qux',
      ];

      for (const url of testCases) {
        expect(extractLigaIdFromUrl(url)).toBe(51961);
      }
    });

    it('sollte verschiedene Parameter-Namen unterstützen', () => {
      expect(extractLigaIdFromUrl('?ligaid=12345')).toBe(12345);
      expect(extractLigaIdFromUrl('?ligaId=12345')).toBe(12345);
      expect(extractLigaIdFromUrl('?LigaId=12345')).toBe(12345);
      expect(extractLigaIdFromUrl('?id=12345')).toBe(12345);
    });
  });

  describe('Path-basierte Extraktion', () => {
    it('sollte Liga-ID aus URL-Pfad extrahieren', () => {
      const testCases = [
        ['https://www.basketball-bund.net/liga/51961', 51961],
        ['https://www.basketball-bund.net/rest/competition/table/id/51961', 51961],
        ['https://www.basketball-bund.net/competition/51961/table', 51961],
        ['/liga/12345/spielplan', 12345],
        ['/id/99999/', 99999],
      ];

      for (const [url, expected] of testCases) {
        expect(extractLigaIdFromUrl(url as string)).toBe(expected);
      }
    });
  });

  describe('Fehlerbehandlung', () => {
    it('sollte null bei ungültigen Eingaben zurückgeben', () => {
      expect(extractLigaIdFromUrl('')).toBe(null);
      expect(extractLigaIdFromUrl(null as any)).toBe(null);
      expect(extractLigaIdFromUrl(undefined as any)).toBe(null);
      expect(extractLigaIdFromUrl('https://example.com')).toBe(null);
      expect(extractLigaIdFromUrl('?liga_id=abc')).toBe(null);
      expect(extractLigaIdFromUrl('?liga_id=-123')).toBe(null);
      expect(extractLigaIdFromUrl('?liga_id=0')).toBe(null);
    });
  });

  describe('Komplexe URLs', () => {
    it('sollte Liga-ID aus komplexen BBB URLs extrahieren', () => {
      const complexUrl = 'https://www.basketball-bund.net/public/ergebnisse.jsp?print=1&viewDescKey=sport.dbb.liga.ErgebnisseViewPublic/index.jsp_&liga_id=51961';
      expect(extractLigaIdFromUrl(complexUrl)).toBe(51961);
    });

    it('sollte Liga-ID aus Team-Statistik URLs extrahieren', () => {
      const statsUrl = 'https://www.basketball-bund.net/liga/statistik_team.jsp?print=1&viewDescKey=sport.dbb.views.TeamStatView/templates/base_template.jsp_&liga_id=51961';
      expect(extractLigaIdFromUrl(statsUrl)).toBe(51961);
    });
  });
});

describe('normalizeBBBUrl', () => {
  it('sollte Protocol hinzufügen wenn fehlt', () => {
    expect(normalizeBBBUrl('www.basketball-bund.net/liga'))
      .toBe('https://www.basketball-bund.net/www.basketball-bund.net/liga');
  });

  it('sollte print Parameter entfernen', () => {
    const url = 'https://www.basketball-bund.net/tabelle.jsp?print=1&liga_id=123';
    expect(normalizeBBBUrl(url))
      .toBe('https://www.basketball-bund.net/tabelle.jsp?liga_id=123');
  });

  it('sollte trailing slash entfernen', () => {
    expect(normalizeBBBUrl('https://www.basketball-bund.net/'))
      .toBe('https://www.basketball-bund.net');
  });

  it('sollte leere Strings handhaben', () => {
    expect(normalizeBBBUrl('')).toBe('');
  });
});

describe('BBBUrls', () => {
  it('sollte korrekte REST API URLs generieren', () => {
    expect(BBBUrls.tabelle(51961))
      .toBe('https://www.basketball-bund.net/rest/competition/table/id/51961');
    
    expect(BBBUrls.spielplan(51961))
      .toBe('https://www.basketball-bund.net/rest/competition/spielplan/id/51961');
    
    expect(BBBUrls.matchInfo(12345))
      .toBe('https://www.basketball-bund.net/rest/match/id/12345/matchInfo');
    
    expect(BBBUrls.wamData())
      .toBe('https://www.basketball-bund.net/rest/wam/data');
  });
});

describe('isBBBUrl', () => {
  it('sollte BBB URLs erkennen', () => {
    expect(isBBBUrl('https://www.basketball-bund.net/liga')).toBe(true);
    expect(isBBBUrl('http://basketball-bund.net/test')).toBe(true);
    expect(isBBBUrl('https://dbb.basketball-bund.net/api')).toBe(true);
  });

  it('sollte nicht-BBB URLs ablehnen', () => {
    expect(isBBBUrl('https://google.com')).toBe(false);
    expect(isBBBUrl('https://example.com')).toBe(false);
    expect(isBBBUrl('')).toBe(false);
    expect(isBBBUrl(null as any)).toBe(false);
  });
});
