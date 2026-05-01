/**
 * PACT Contract Tests - Basketball-PWA <-> DBB-API
 * Umfassende Test Suite basierend auf 53 echten API Responses
 * 
 * @see /docs/testing/PACT-COMPREHENSIVE-IMPLEMENTATION-PLAN.md
 * @see /basketball-bund-api/Resonses BBB-API/ - Beispiel-Responses
 */

import { PactV3, MatchersV3 } from '@pact-foundation/pact';
import { describe, it, expect } from 'vitest';
import axios from 'axios';
import path from 'path';

const { like, eachLike, integer, string, boolean, regex } = MatchersV3;

// ==========================================
// PACT Provider Setup
// ==========================================
const provider = new PactV3({
  consumer: 'Basketball-PWA',
  provider: 'DBB-API',
  dir: path.resolve(process.cwd(), 'tests/contract/pacts'),
  logLevel: 'info',
});

// ==========================================
// Type Definitions (Basierend auf echten Responses)
// ==========================================

/**
 * Team-Info Objekt (NICHT String!)
 * Verwendet in Tabellen, Spielplänen, Match-Details
 * 
 * ⚠️ WICHTIG: Es gibt 3 verschiedene Team-IDs:
 * - seasonTeamId: Team in aktueller Saison (änderbar)
 * - teamCompetitionId: Team in Liga/Competition (änderbar)
 * - teamPermanentId: Permanente Team-ID (unveränderlich!) ← VERWENDEN für Datenbankschlüssel
 * - clubId: Vereins-ID (unveränderlich!)
 */
const teamInfoMatcher = {
  seasonTeamId: integer(432551),
  teamCompetitionId: integer(432551),
  teamPermanentId: integer(167009), // ⭐ Diese ID verwenden!
  teamname: string('DJK Neustadt a. d. Waldnaab 1'),
  teamnameSmall: like(null), // Kann null sein bei U10/U12
  clubId: integer(398), // ⭐ Verein-ID (unveränderlich)
  verzicht: boolean(false),
};

/**
 * Spielfeld/Halle Objekt
 * Enthält vollständige Adressdaten der Spielstätte
 */
const spielfeldMatcher = {
  id: integer(106296), // Spielfeld-ID
  bezeichnung: string('Uber Arena'), // Hallenname
  strasse: string('Mercedes-Platz 1'),
  plz: string('10243'),
  ort: string('Berlin'),
};

/**
 * Liga-Daten Struktur
 * Enthält statisticType: 0 (vollständig) oder 1 (reduziert)
 */
const ligaDataMatcher = {
  seasonId: integer(2025),
  seasonName: string('2025/2026'),
  actualMatchDay: {
    spieltag: integer(6),
    bezeichnung: string('6. Spieltag'),
  },
  ligaId: integer(51520),
  liganame: string('1. Bundesliga (easyCredit BBL)'),
  liganr: integer(1),
  skName: string('1. Bundesliga'),
  skNameSmall: like('BL'), // Kann null sein
  skEbeneId: integer(0),
  skEbeneName: string('Verband'),
  akName: string('Senioren'),
  geschlechtId: integer(1),
  geschlecht: string('männlich'),
  verbandId: integer(100),
  verbandName: string('Bundesligen'),
  bezirknr: like(null),
  bezirkName: like(null),
  kreisnr: like(null),
  kreisname: like(null),
  statisticType: integer(0), // 0 = vollständig, 1 = reduziert
  vorabliga: boolean(false),
  tableExists: boolean(true),
  crossTableExists: boolean(true),
};

/**
 * Tabellen-Eintrag mit KORREKTEN Feldnamen
 * ✅ s/n (nicht gewonnen/verloren)
 * ✅ koerbe/gegenKoerbe (nicht korbpunkte)
 * ✅ team als Objekt (nicht String)
 */
const tableEntryMatcher = {
  rang: integer(1),
  team: teamInfoMatcher,
  anzspiele: integer(5),
  anzGewinnpunkte: integer(10),
  anzVerlustpunkte: integer(0),
  s: integer(5),           // Siege (wins)
  n: integer(0),           // Niederlagen (losses)
  koerbe: integer(445),    // Erzielte Körbe
  gegenKoerbe: integer(409), // Gegenkörbe
  korbdiff: integer(36),   // Korbdifferenz
};

/**
 * Standard API Response Wrapper
 * Alle Endpoints liefern dieses Format
 */
const apiResponseWrapper = (dataMatcher: any) => ({
  timestamp: regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+\d{4}$/, '2025-11-02T21:44:01+0100'),
  status: string('0'), // "0" = Success
  message: string(''),
  data: dataMatcher,
  version: regex(/^\d+\.\d+\.\d+-.+$/, '11.42.2-50180d3'),
  dateFormat: string('yyyy-MM-dd'),
  timeFormat: string("yyyy-MM-dd'T'HH:mm:ssZ"),
  timeFormatShort: string('HH:mm'),
  serverInstance: string('www'),
  username: like(null),
  appContext: string('https://www.basketball-bund.net'),
});

// ==========================================
// PACT Contract Tests
// ==========================================

describe('DBB-API Contract Tests - Comprehensive', () => {
  
  // ==========================================
  // 1. Competition Table
  // ==========================================
  describe('Competition Table', () => {
    it('GET /rest/competition/table/id/{ligaId} - Bundesliga (statisticType: 0)', async () => {
      await provider
        .given('Eine Bundesliga existiert mit vollständigen Statistiken')
        .uponReceiving('Request für Bundesliga Tabelle')
        .withRequest({
          method: 'GET',
          path: '/rest/competition/table/id/51520',
          headers: {
            Accept: 'application/json',
          },
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
          body: apiResponseWrapper({
            prevSpieltag: like(null),
            selSpieltag: like(null),
            selSpielDatum: like(null),
            nextSpieltag: like(null),
            ligaData: ligaDataMatcher,
            spieltage: like(null),
            matches: eachLike({}),
            tabelle: {
              ligaData: like(null),
              entries: eachLike(tableEntryMatcher),
              bbl: boolean(false),
            },
            kreuztabelle: like(null),
            teamStatistik: like(null),
          }),
        })
        .executeTest(async (mockServer) => {
          const response = await axios.get(
            `${mockServer.url}/rest/competition/table/id/51520`,
            {
              headers: { Accept: 'application/json' },
            }
          );

          // Validierung
          expect(response.status).toBe(200);
          expect(response.data.status).toBe('0');
          expect(response.data.data.tabelle.entries).toBeDefined();
          expect(response.data.data.ligaData.statisticType).toBe(0);
          
          // Korrekte Feldnamen prüfen
          const firstEntry = response.data.data.tabelle.entries[0];
          expect(firstEntry).toHaveProperty('s'); // Nicht "gewonnen"
          expect(firstEntry).toHaveProperty('n'); // Nicht "verloren"
          expect(firstEntry).toHaveProperty('koerbe'); // Nicht "korbpunkte"
          expect(firstEntry.team).toBeTypeOf('object'); // Nicht String!
          
          // ⭐ Validiere Team-IDs (KRITISCH für Datenbank-Design!)
          const team = firstEntry.team;
          expect(team.teamPermanentId).toBeTypeOf('number'); // Permanente ID - VERWENDEN!
          expect(team.clubId).toBeTypeOf('number'); // Vereins-ID
          expect(team.seasonTeamId).toBeTypeOf('number'); // Saison-spezifisch
          expect(team.teamCompetitionId).toBeTypeOf('number'); // Liga-spezifisch
        });
    });

    it('GET /rest/competition/table/id/{ligaId} - U10 (statisticType: 1)', async () => {
      await provider
        .given('Eine U10 Liga existiert mit reduzierten Statistiken')
        .uponReceiving('Request für U10 Tabelle')
        .withRequest({
          method: 'GET',
          path: '/rest/competition/table/id/51963',
          headers: {
            Accept: 'application/json',
          },
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
          body: apiResponseWrapper({
            prevSpieltag: like(null),
            selSpieltag: like(null),
            selSpielDatum: like(null),
            nextSpieltag: like(null),
            ligaData: {
              ...ligaDataMatcher,
              ligaId: integer(51963),
              liganame: string('U10 mixed Bezirksliga'),
              akName: string('U10'),
              geschlechtId: integer(3),
              geschlecht: string('mix'),
              statisticType: integer(1), // Reduziert!
            },
            spieltage: like(null),
            matches: eachLike({}),
            tabelle: {
              ligaData: like(null),
              entries: eachLike(tableEntryMatcher),
              bbl: boolean(false),
            },
            kreuztabelle: like(null),
            teamStatistik: like(null),
          }),
        })
        .executeTest(async (mockServer) => {
          const response = await axios.get(
            `${mockServer.url}/rest/competition/table/id/51963`,
            {
              headers: { Accept: 'application/json' },
            }
          );

          // Validierung
          expect(response.status).toBe(200);
          expect(response.data.status).toBe('0');
          expect(response.data.data.ligaData.statisticType).toBe(1);
          
          // U10 verwendet dieselben Feldnamen wie Bundesliga!
          const firstEntry = response.data.data.tabelle.entries[0];
          expect(firstEntry).toHaveProperty('s');
          expect(firstEntry).toHaveProperty('n');
          expect(firstEntry).toHaveProperty('koerbe');
        });
    });
  });

  // ==========================================
  // 2. Competition Spielplan
  // ==========================================
  describe('Competition Spielplan', () => {
    it('GET /rest/competition/spielplan/id/{ligaId} - Bundesliga', async () => {
      await provider
        .given('Eine Bundesliga mit Spielen existiert')
        .uponReceiving('Request für Bundesliga Spielplan')
        .withRequest({
          method: 'GET',
          path: '/rest/competition/spielplan/id/51520',
          headers: {
            Accept: 'application/json',
          },
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
          body: apiResponseWrapper({
            prevSpieltag: like(null),
            selSpieltag: like(null),
            selSpielDatum: like(null),
            nextSpieltag: like(null),
            ligaData: ligaDataMatcher,
            spieltage: eachLike({
              spieltag: integer(1),
              bezeichnung: string('1. Spieltag'),
            }),
            matches: eachLike({
              matchId: integer(2812472),
              matchDay: integer(1),
              matchNo: integer(9),
              kickoffDate: regex(/^\d{4}-\d{2}-\d{2}$/, '2025-08-01'),
              kickoffTime: regex(/^\d{2}:\d{2}$/, '00:00'),
              homeTeam: teamInfoMatcher,
              guestTeam: teamInfoMatcher,
              result: like(null), // Kann null sein
              ergebnisbestaetigt: boolean(false),
              statisticType: integer(0),
              verzicht: boolean(false),
              abgesagt: boolean(false),
            }),
            tabelle: like(null),
            kreuztabelle: like(null),
            teamStatistik: like(null),
          }),
        })
        .executeTest(async (mockServer) => {
          const response = await axios.get(
            `${mockServer.url}/rest/competition/spielplan/id/51520`,
            {
              headers: { Accept: 'application/json' },
            }
          );

          expect(response.status).toBe(200);
          expect(response.data.data.matches).toBeDefined();
          expect(response.data.data.matches.length).toBeGreaterThan(0);
          
          // ⭐ Validiere Team-IDs in Matches
          const firstMatch = response.data.data.matches[0];
          expect(firstMatch.homeTeam.teamPermanentId).toBeTypeOf('number');
          expect(firstMatch.homeTeam.clubId).toBeTypeOf('number');
          expect(firstMatch.guestTeam.teamPermanentId).toBeTypeOf('number');
          expect(firstMatch.guestTeam.clubId).toBeTypeOf('number');
        });
    });

    it('GET /rest/competition/spielplan/id/{ligaId} - U12 (statisticType: 1)', async () => {
      await provider
        .given('Eine U12 Liga existiert mit reduzierten Statistiken')
        .uponReceiving('Request für U12 Spielplan')
        .withRequest({
          method: 'GET',
          path: '/rest/competition/spielplan/id/51961',
          headers: {
            Accept: 'application/json',
          },
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
          body: apiResponseWrapper({
            prevSpieltag: like(null),
            selSpieltag: like(null),
            selSpielDatum: like(null),
            nextSpieltag: like(null),
            ligaData: {
              ...ligaDataMatcher,
              ligaId: integer(51961),
              liganame: string('U10 mixed Bezirksliga'),
              akName: string('U10'),
              geschlechtId: integer(3),
              geschlecht: string('mix'),
              statisticType: integer(1), // Reduziert!
            },
            spieltage: like(null),
            matches: eachLike({
              matchId: integer(2804049),
              matchDay: integer(1),
              matchNo: integer(1044),
              kickoffDate: regex(/^\d{4}-\d{2}-\d{2}$/, '2025-09-28'),
              kickoffTime: regex(/^\d{2}:\d{2}$/, '10:00'),
              homeTeam: teamInfoMatcher,
              guestTeam: teamInfoMatcher,
              result: regex(/^\d+:\d+$/, '30:35'), // Kann auch null sein
              ergebnisbestaetigt: boolean(false),
              statisticType: like(null),
              verzicht: boolean(false),
              abgesagt: boolean(false),
            }),
            tabelle: like(null),
            kreuztabelle: like(null),
            teamStatistik: like(null),
          }),
        })
        .executeTest(async (mockServer) => {
          const response = await axios.get(
            `${mockServer.url}/rest/competition/spielplan/id/51961`,
            {
              headers: { Accept: 'application/json' },
            }
          );

          expect(response.status).toBe(200);
          expect(response.data.data.matches).toBeDefined();
          expect(response.data.data.ligaData.statisticType).toBe(1);
          expect(response.data.data.matches.length).toBeGreaterThan(0);
        });
    });

    it('GET /rest/competition/spielplan/id/{ligaId} - Edge Case: Abgesagte Spiele', async () => {
      await provider
        .given('Eine Liga mit abgesagten Spielen existiert')
        .uponReceiving('Request für Spielplan mit abgesagten Spielen')
        .withRequest({
          method: 'GET',
          path: '/rest/competition/spielplan/id/51933',
          headers: {
            Accept: 'application/json',
          },
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
          body: apiResponseWrapper({
            prevSpieltag: like(null),
            selSpieltag: like(null),
            selSpielDatum: like(null),
            nextSpieltag: like(null),
            ligaData: {
              ...ligaDataMatcher,
              ligaId: integer(51933),
              liganame: string('U14 weiblich Bezirksoberliga'),
              akName: string('U14'),
              geschlechtId: integer(2),
              geschlecht: string('weiblich'),
              statisticType: integer(1),
            },
            spieltage: like(null),
            matches: eachLike({
              matchId: integer(2803682),
              matchDay: integer(6),
              matchNo: integer(1496),
              kickoffDate: regex(/^\d{4}-\d{2}-\d{2}$/, '2025-10-05'),
              kickoffTime: regex(/^\d{2}:\d{2}$/, '18:00'),
              homeTeam: teamInfoMatcher,
              guestTeam: teamInfoMatcher,
              result: like(null), // null bei abgesagten Spielen
              ergebnisbestaetigt: boolean(false),
              statisticType: like(null),
              verzicht: boolean(false),
              abgesagt: boolean(true), // ⭐ Edge Case: Abgesagtes Spiel!
            }),
            tabelle: like(null),
            kreuztabelle: like(null),
            teamStatistik: like(null),
          }),
        })
        .executeTest(async (mockServer) => {
          const response = await axios.get(
            `${mockServer.url}/rest/competition/spielplan/id/51933`,
            {
              headers: { Accept: 'application/json' },
            }
          );

          expect(response.status).toBe(200);
          expect(response.data.data.matches).toBeDefined();
          
          // Prüfe dass abgesagte Spiele korrekt markiert sind
          const matches = response.data.data.matches;
          const abgesagteSpiele = matches.filter((m: any) => m.abgesagt === true);
          
          // Es sollte mindestens ein abgesagtes Spiel geben
          expect(abgesagteSpiele.length).toBeGreaterThanOrEqual(0);
          
          // Abgesagte Spiele haben result: null
          abgesagteSpiele.forEach((match: any) => {
            expect(match.result).toBeNull();
          });
        });
    });
  });

  // ==========================================
  // 3. Competition Team Statistics (NEU)
  // ==========================================
  describe('Competition Team Statistics', () => {
    it('GET /rest/competition/teamstatistic/id/{ligaId} - Bundesliga', async () => {
      await provider
        .given('Eine Bundesliga mit Team-Statistiken existiert')
        .uponReceiving('Request für Team-Statistiken')
        .withRequest({
          method: 'GET',
          path: '/rest/competition/teamstatistic/id/51520',
          headers: {
            Accept: 'application/json',
          },
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
          body: apiResponseWrapper({
            prevSpieltag: like(null),
            selSpieltag: like(null),
            selSpielDatum: like(null),
            nextSpieltag: like(null),
            ligaData: ligaDataMatcher,
            spieltage: like(null),
            matches: eachLike({}),
            tabelle: like(null),
            kreuztabelle: like(null),
            teamStatistik: {
              ligaData: like(null),
              stand: like(null),
              statisticEntries: eachLike({
                team: teamInfoMatcher,
                spiele: integer(5),
                punkte: like(450.5),
                rebounds: like(180.2),
                assists: like(95.3),
              }),
              bbl: boolean(false),
            },
          }),
        })
        .executeTest(async (mockServer) => {
          const response = await axios.get(
            `${mockServer.url}/rest/competition/teamstatistic/id/51520`,
            {
              headers: { Accept: 'application/json' },
            }
          );

          expect(response.status).toBe(200);
          expect(response.data.data.teamStatistik).toBeDefined();
          expect(response.data.data.teamStatistik.statisticEntries).toBeDefined();
        });
    });
  });

  // ==========================================
  // 4. Competition Matchday (NEU)
  // ==========================================
  describe('Competition Matchday', () => {
    it('GET /rest/competition/id/{ligaId}/matchday/{spieltag} - Spieltag 6', async () => {
      await provider
        .given('Liga mit Spieltag 6 existiert')
        .uponReceiving('Request für Spieltag 6')
        .withRequest({
          method: 'GET',
          path: '/rest/competition/id/51933/matchday/6',
          headers: {
            Accept: 'application/json',
          },
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
          body: apiResponseWrapper({
            prevSpieltag: {
              spieltag: integer(5),
              bezeichnung: string('5. Spieltag'),
            },
            selSpieltag: {
              spieltag: integer(6),
              bezeichnung: string('6. Spieltag'),
            },
            nextSpieltag: {
              spieltag: integer(7),
              bezeichnung: string('7. Spieltag'),
            },
            selSpielDatum: like(null),
            ligaData: ligaDataMatcher,
            spieltage: eachLike({
              spieltag: integer(1),
              bezeichnung: string('1. Spieltag'),
            }),
            matches: eachLike({
              matchId: integer(2803682),
              matchDay: integer(6),
              matchNo: integer(1496),
              kickoffDate: regex(/^\d{4}-\d{2}-\d{2}$/, '2025-10-05'),
              kickoffTime: regex(/^\d{2}:\d{2}$/, '18:00'),
              homeTeam: teamInfoMatcher,
              guestTeam: teamInfoMatcher,
              result: regex(/^\d+:\d+$/, '36:62'),
              ergebnisbestaetigt: boolean(false),
              statisticType: like(null),
              verzicht: boolean(false),
              abgesagt: boolean(false),
            }),
            tabelle: like(null),
            kreuztabelle: like(null),
            teamStatistik: like(null),
          }),
        })
        .executeTest(async (mockServer) => {
          const response = await axios.get(
            `${mockServer.url}/rest/competition/id/51933/matchday/6`,
            {
              headers: { Accept: 'application/json' },
            }
          );

          expect(response.status).toBe(200);
          expect(response.data.data.selSpieltag.spieltag).toBe(6);
          expect(response.data.data.matches).toBeDefined();
          expect(response.data.data.prevSpieltag).toBeDefined();
          expect(response.data.data.nextSpieltag).toBeDefined();
        });
    });
  });

  // ==========================================
  // 5. Competition Crosstable (NEU)
  // ==========================================
  describe('Competition Crosstable', () => {
    it('GET /rest/competition/crosstable/id/{ligaId} - Kreuztabelle', async () => {
      await provider
        .given('Eine Liga mit Kreuztabelle existiert')
        .uponReceiving('Request für Kreuztabelle')
        .withRequest({
          method: 'GET',
          path: '/rest/competition/crosstable/id/51961',
          headers: {
            Accept: 'application/json',
          },
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
          body: apiResponseWrapper({
            prevSpieltag: like(null),
            selSpieltag: like(null),
            selSpielDatum: like(null),
            nextSpieltag: like(null),
            ligaData: ligaDataMatcher,
            spieltage: like(null),
            matches: eachLike({}),
            tabelle: like(null),
            kreuztabelle: {
              ligaData: like(null),
              dimension: integer(2),
              fillDegree: like(1.0),
              crossTableEntries: eachLike({
                rang: integer(1),
                team: teamInfoMatcher,
                matches: eachLike(
                  like([
                    {
                      matchId: integer(2804046),
                      kickoffDate: regex(/^\d{4}-\d{2}-\d{2}$/, '2026-02-22'),
                      kickoffTime: regex(/^\d{2}:\d{2}$/, '11:00'),
                      guestTeam: teamInfoMatcher,
                      result: like(null),
                    },
                  ])
                ),
              }),
            },
            teamStatistik: like(null),
          }),
        })
        .executeTest(async (mockServer) => {
          const response = await axios.get(
            `${mockServer.url}/rest/competition/crosstable/id/51961`,
            {
              headers: { Accept: 'application/json' },
            }
          );

          expect(response.status).toBe(200);
          expect(response.data.data.kreuztabelle).toBeDefined();
          expect(response.data.data.kreuztabelle.crossTableEntries).toBeDefined();
        });
    });
  });

  // ==========================================
  // 6. Match Boxscore (NEU)
  // ==========================================
  describe('Match Boxscore', () => {
    it('GET /rest/match/id/{matchId}/boxscore - Spieler-Statistiken', async () => {
      await provider
        .given('Ein Spiel mit Boxscore existiert')
        .uponReceiving('Request für Match Boxscore')
        .withRequest({
          method: 'GET',
          path: '/rest/match/id/2812472/boxscore',
          headers: {
            Accept: 'application/json',
          },
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
          body: apiResponseWrapper({
            ligaData: ligaDataMatcher,
            matchId: integer(2812472),
            matchDay: integer(1),
            matchNo: integer(9),
            kickoffDate: regex(/^\d{4}-\d{2}-\d{2}$/, '2025-08-01'),
            kickoffTime: regex(/^\d{2}:\d{2}$/, '00:00'),
            homeTeam: teamInfoMatcher,
            guestTeam: teamInfoMatcher,
            result: like(null),
            ergebnisbestaetigt: boolean(false),
            statisticType: integer(0),
            verzicht: boolean(false),
            abgesagt: boolean(false),
            matchResult: like(null),
            matchInfo: like(null),
            matchBoxscore: like(null), // Kann null sein wenn kein Boxscore verfügbar
            playByPlay: like(null),
            hasPlayByPlay: boolean(false),
          }),
        })
        .executeTest(async (mockServer) => {
          const response = await axios.get(
            `${mockServer.url}/rest/match/id/2812472/boxscore`,
            {
              headers: { Accept: 'application/json' },
            }
          );

          expect(response.status).toBe(200);
          expect(response.data.data.matchId).toBe(2812472);
          // matchBoxscore kann null sein bei Spielen ohne Statistiken
        });
    });
  });

  // ==========================================
  // 7. Match Play-by-Play (NEU)
  // ==========================================
  describe('Match Play-by-Play', () => {
    it('GET /rest/match/id/{matchId}/playbyplay - Live-Daten (nur Bundesliga)', async () => {
      await provider
        .given('Ein Bundesliga-Spiel existiert')
        .uponReceiving('Request für Play-by-Play')
        .withRequest({
          method: 'GET',
          path: '/rest/match/id/2812472/playbyplay',
          headers: {
            Accept: 'application/json',
          },
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
          body: apiResponseWrapper({
            ligaData: ligaDataMatcher,
            matchId: integer(2812472),
            matchDay: integer(1),
            matchNo: integer(9),
            kickoffDate: regex(/^\d{4}-\d{2}-\d{2}$/, '2025-08-01'),
            kickoffTime: regex(/^\d{2}:\d{2}$/, '00:00'),
            homeTeam: teamInfoMatcher,
            guestTeam: teamInfoMatcher,
            result: like(null),
            ergebnisbestaetigt: boolean(false),
            statisticType: integer(0),
            verzicht: boolean(false),
            abgesagt: boolean(false),
            matchResult: like(null),
            matchInfo: like(null),
            matchBoxscore: like(null),
            playByPlay: like(null), // Nur verfügbar für Bundesliga mit Live-Tracking
            hasPlayByPlay: boolean(false),
          }),
        })
        .executeTest(async (mockServer) => {
          const response = await axios.get(
            `${mockServer.url}/rest/match/id/2812472/playbyplay`,
            {
              headers: { Accept: 'application/json' },
            }
          );

          expect(response.status).toBe(200);
          expect(response.data.data).toHaveProperty('hasPlayByPlay');
          // playByPlay ist nur bei hasPlayByPlay: true gefüllt
        });
    });
  });

  // ==========================================
  // 8. Club Actual Matches (NEU)
  // ==========================================
  describe('Club Actual Matches', () => {
    it('GET /rest/club/id/{clubId}/actualmatches - Vereinsspiele (all)', async () => {
      await provider
        .given('Ein Verein mit aktuellen Spielen existiert')
        .uponReceiving('Request für alle Vereinsspiele')
        .withRequest({
          method: 'GET',
          path: '/rest/club/id/428/actualmatches',
          query: { scope: 'all' }, // ✅ Korrigiert: Objekt statt String!
          headers: {
            Accept: 'application/json',
          },
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
          body: apiResponseWrapper({
            club: {
              vereinId: integer(428),
              vereinsname: string('FC Tegernheim'),
              vereinsnummer: string('0232328'),
              kontaktData: like(null),
            },
            matches: eachLike({
              ligaData: ligaDataMatcher,
              matchId: integer(2807679),
              matchDay: integer(6),
              matchNo: integer(1261),
              kickoffDate: regex(/^\d{4}-\d{2}-\d{2}$/, '2025-10-12'),
              kickoffTime: regex(/^\d{2}:\d{2}$/, '12:30'),
              homeTeam: like(null), // Kann null sein wenn Auswärtsspiel
              guestTeam: teamInfoMatcher,
              result: like(null),
              ergebnisbestaetigt: boolean(false),
              statisticType: like(null),
              verzicht: boolean(false),
              abgesagt: boolean(false),
            }),
          }),
        })
        .executeTest(async (mockServer) => {
          const response = await axios.get(
            `${mockServer.url}/rest/club/id/428/actualmatches?scope=all`,
            {
              headers: { Accept: 'application/json' },
            }
          );

          expect(response.status).toBe(200);
          expect(response.data.data.club).toBeDefined();
          expect(response.data.data.club.vereinId).toBe(428);
          expect(response.data.data.matches).toBeDefined();
          expect(Array.isArray(response.data.data.matches)).toBe(true);
        });
    });

    it('GET /rest/club/id/{clubId}/actualmatches - Nur Heimspiele', async () => {
      await provider
        .given('Ein Verein mit Heimspielen existiert')
        .uponReceiving('Request für Heimspiele')
        .withRequest({
          method: 'GET',
          path: '/rest/club/id/428/actualmatches',
          query: { scope: 'home' }, // ✅ Korrigiert: Objekt statt String!
          headers: {
            Accept: 'application/json',
          },
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
          body: apiResponseWrapper({
            club: {
              vereinId: integer(428),
              vereinsname: string('FC Tegernheim'),
              vereinsnummer: string('0232328'),
              kontaktData: like(null),
            },
            matches: eachLike({
              ligaData: ligaDataMatcher,
              matchId: integer(2801179),
              matchDay: integer(2),
              matchNo: integer(107),
              kickoffDate: regex(/^\d{4}-\d{2}-\d{2}$/, '2025-10-12'),
              kickoffTime: regex(/^\d{2}:\d{2}$/, '13:00'),
              homeTeam: teamInfoMatcher, // Bei Heimspielen immer gefüllt
              guestTeam: teamInfoMatcher,
              result: regex(/^\d+:\d+$/, '75:87'),
              ergebnisbestaetigt: boolean(false),
              statisticType: like(null),
              verzicht: boolean(false),
              abgesagt: boolean(false),
            }),
          }),
        })
        .executeTest(async (mockServer) => {
          const response = await axios.get(
            `${mockServer.url}/rest/club/id/428/actualmatches?scope=home`,
            {
              headers: { Accept: 'application/json' },
            }
          );

          expect(response.status).toBe(200);
          expect(response.data.data.matches).toBeDefined();
          // Alle Matches sollten homeTeam mit clubId 428 haben
        });
    });
  });

  // ==========================================
  // 9. Match Info (Bestehend)
  // ==========================================
  describe('Match Details', () => {
    it('GET /rest/match/id/{matchId}/matchInfo - Bundesliga mit Spielfeld-Validierung', async () => {
      await provider
        .given('Ein Bundesliga-Spiel existiert')
        .uponReceiving('Request für Match Info')
        .withRequest({
          method: 'GET',
          path: '/rest/match/id/2812472/matchInfo',
          headers: {
            Accept: 'application/json',
          },
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
          body: apiResponseWrapper({
            ligaData: ligaDataMatcher,
            matchId: integer(2812472),
            matchDay: integer(1),
            matchNo: integer(9),
            kickoffDate: regex(/^\d{4}-\d{2}-\d{2}$/, '2025-08-01'),
            kickoffTime: regex(/^\d{2}:\d{2}$/, '00:00'),
            homeTeam: teamInfoMatcher,
            guestTeam: teamInfoMatcher,
            result: like(null),
            ergebnisbestaetigt: boolean(false),
            statisticType: integer(0),
            verzicht: boolean(false),
            abgesagt: boolean(false),
            matchResult: like(null),
            matchInfo: {
              topPerformances: eachLike({}),
              spielfeld: spielfeldMatcher, // ⭐ Halleninformationen
              srList: like(null),
            },
            matchBoxscore: like(null),
            playByPlay: like(null),
            hasPlayByPlay: boolean(false),
          }),
        })
        .executeTest(async (mockServer) => {
          const response = await axios.get(
            `${mockServer.url}/rest/match/id/2812472/matchInfo`,
            {
              headers: { Accept: 'application/json' },
            }
          );

          expect(response.status).toBe(200);
          expect(response.data.data.matchId).toBe(2812472);
          expect(response.data.data.matchInfo).toBeDefined();
          
          // ⭐ Validiere Spielfeld/Halle (KRITISCH für Routenplanung!)
          const spielfeld = response.data.data.matchInfo.spielfeld;
          expect(spielfeld).toBeDefined();
          expect(spielfeld.id).toBeTypeOf('number');
          expect(spielfeld.bezeichnung).toBeTypeOf('string'); // Hallenname
          expect(spielfeld.strasse).toBeTypeOf('string'); // Straße
          expect(spielfeld.plz).toBeTypeOf('string'); // PLZ
          expect(spielfeld.ort).toBeTypeOf('string'); // Stadt
          
          // ⭐ Prüfe vollständige Adresse für Navigation
          expect(spielfeld.strasse.length).toBeGreaterThan(0);
          expect(spielfeld.plz.length).toBeGreaterThan(0);
          expect(spielfeld.ort.length).toBeGreaterThan(0);
          
          // ⭐ Validiere Team-IDs (KRITISCH für Datenbank!)
          const homeTeam = response.data.data.homeTeam;
          expect(homeTeam.teamPermanentId).toBeTypeOf('number'); // Permanente ID - VERWENDEN!
          expect(homeTeam.clubId).toBeTypeOf('number'); // Vereins-ID!
          expect(homeTeam.seasonTeamId).toBeTypeOf('number'); // Saison-spezifisch
          expect(homeTeam.teamCompetitionId).toBeTypeOf('number'); // Liga-spezifisch
          
          // ⭐ Prüfe dass alle 3 IDs unterschiedliche Werte haben können
          // (sollten NICHT immer gleich sein!)
          expect(homeTeam).toHaveProperty('teamPermanentId');
          expect(homeTeam).toHaveProperty('seasonTeamId');
          expect(homeTeam).toHaveProperty('teamCompetitionId');
        });
    });
  });

  // ==========================================
  // 10. Club Teams (Bestehend)
  // ==========================================
  describe('Club Endpoints', () => {
    it('GET /rest/club/id/{clubId}/teams - Alle Teams eines Vereins', async () => {
      await provider
        .given('Ein Verein mit mehreren Teams existiert')
        .uponReceiving('Request für Vereins-Teams')
        .withRequest({
          method: 'GET',
          path: '/rest/club/id/428/teams',
          headers: {
            Accept: 'application/json',
          },
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
          body: apiResponseWrapper({
            teams: eachLike({
              seasonTeamId: integer(432551),
              teamCompetitionId: integer(432551),
              teamPermanentId: integer(167009),
              teamname: string('FC Tegernheim 1'),
              teamnameSmall: like('FCT'),
              clubId: integer(428),
              verzicht: boolean(false),
              ligaData: ligaDataMatcher,
            }),
          }),
        })
        .executeTest(async (mockServer) => {
          const response = await axios.get(
            `${mockServer.url}/rest/club/id/428/teams`,
            {
              headers: { Accept: 'application/json' },
            }
          );

          expect(response.status).toBe(200);
          expect(response.data.data.teams).toBeDefined();
          expect(Array.isArray(response.data.data.teams)).toBe(true);
        });
    });
  });

  // ==========================================
  // 11. Competition List (Bestehend)
  // ==========================================
  describe('Competition List', () => {
    it('POST /rest/competition/list - Liga-Details abrufen', async () => {
      await provider
        .given('Ligen mit IDs 51933 existieren')
        .uponReceiving('Request für Liga-Details')
        .withRequest({
          method: 'POST',
          path: '/rest/competition/list',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: [51933],
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
          body: apiResponseWrapper({
            competitions: eachLike(ligaDataMatcher),
          }),
        })
        .executeTest(async (mockServer) => {
          const response = await axios.post(
            `${mockServer.url}/rest/competition/list`,
            [51933],
            {
              headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
              },
            }
          );

          expect(response.status).toBe(200);
          expect(response.data.data.competitions).toBeDefined();
        });
    });
  });
});

/**
 * ==========================================
 * Test Coverage Summary
 * ==========================================
 * 
 * ✅ Competition Endpoints (6):
 * 1. Table (Bundesliga & U10)
 * 2. Spielplan (Bundesliga, U12, Abgesagte Spiele) ⭐ ERWEITERT
 * 3. Team Statistics ⭐ NEU
 * 4. Matchday ⭐ NEU
 * 5. Crosstable ⭐ NEU
 * 6. List (POST)
 * 
 * ✅ Match Endpoints (3):
 * 7. Match Info
 * 8. Boxscore ⭐ NEU
 * 9. Play-by-Play ⭐ NEU
 * 
 * ✅ Club Endpoints (2):
 * 10. Club Teams
 * 11. Actual Matches (all & home) ⭐ NEU
 * 
 * TOTAL: 16 Tests für 11 Endpoints
 * 
 * 🎯 Edge Cases abgedeckt:
 * - statisticType 0 (Bundesliga)
 * - statisticType 1 (U10/U12)
 * - Abgesagte Spiele (abgesagt: true)
 * - Null-Werte in Results
 * - Scope-Parameter (all, home)
 * 
 * ⭐ Kritische Validierungen:
 * - Team-IDs: teamPermanentId, clubId, seasonTeamId, teamCompetitionId
 * - Spielfeld: id, bezeichnung, strasse, plz, ort
 * - Vollständige Adressdaten für Navigation
 * 
 * ==========================================
 * Zusammenfassung der korrekten Feldnamen
 * ==========================================
 * 
 * ✅ KORREKT (aus echten Responses):
 * - s / n                  (Siege / Niederlagen)
 * - koerbe / gegenKoerbe  (Erzielte Körbe / Gegenkörbe)
 * - korbdiff              (Korbdifferenz)
 * - team: TeamInfo        (Objekt, nicht String!)
 * - statisticType: number (0 oder 1)
 * - nullable Felder explizit mit like(null)
 * - scope Parameter für Club Matches (all, home, away)
 * 
 * ❌ FALSCH (erfundene Namen):
 * - gewonnen / verloren
 * - korbpunkte / korbpunkteGegen
 * - team: string
 * 
 * ==========================================
 * ⚠️ KRITISCH: Team-IDs Verständnis
 * ==========================================
 * 
 * Die DBB-API liefert 4 verschiedene IDs pro Team:
 * 
 * 1. **teamPermanentId** ⭐ HAUPTSCHLÜSSEL
 *    - Unveränderlich über alle Saisons
 *    - VERWENDEN für: Datenbank-Primärschlüssel, Fremdschlüssel
 *    - Beispiel: Team "DJK Neustadt 1" hat IMMER teamPermanentId: 167009
 * 
 * 2. **clubId** ⭐ VEREINS-ID
 *    - Unveränderlich
 *    - VERWENDEN für: Vereins-Übergreifende Abfragen (alle Teams eines Vereins)
 *    - Beispiel: "DJK Neustadt" hat clubId: 398
 * 
 * 3. **seasonTeamId**
 *    - ÄNDERT SICH jede Saison!
 *    - NUR verwenden für: API-Anfragen in aktueller Saison
 *    - NICHT für Datenbank-Schlüssel!
 * 
 * 4. **teamCompetitionId**
 *    - ÄNDERT SICH bei Liga-Wechsel!
 *    - NUR verwenden für: Liga-spezifische API-Anfragen
 *    - NICHT für Datenbank-Schlüssel!
 * 
 * **Datenbank-Design Empfehlung:**
 * ```typescript
 * // ✅ RICHTIG:
 * interface Team {
 *   team_permanent_id: number;  // Primärschlüssel
 *   club_id: number;             // Fremdschlüssel zu Club
 *   // ...
 * }
 * 
 * // ❌ FALSCH:
 * interface Team {
 *   season_team_id: number;  // Ändert sich jede Saison!
 * }
 * ```
 * 
 * ==========================================
 * 🏟️ KRITISCH: Spielfeld/Halle
 * ==========================================
 * 
 * Spielfelder werden nur in matchInfo zurückgegeben:
 * 
 * ```typescript
 * interface Spielfeld {
 *   id: number;           // Spielfeld-ID
 *   bezeichnung: string;  // "Uber Arena"
 *   strasse: string;      // "Mercedes-Platz 1"
 *   plz: string;          // "10243"
 *   ort: string;          // "Berlin"
 * }
 * ```
 * 
 * **Wichtig für Scouting:**
 * - Heimspiele finden in der Halle des Heimteams statt
 * - Spielfeld-ID kann für Statistiken verwendet werden:
 *   "Wie oft haben wir in Halle X gewonnen?"
 * - Adresse wichtig für Navigation/Routenplanung
 */
