/**
 * Tabellen Service - Verarbeitet Liga-Tabellen-Daten
 */

import { db } from '@/shared/db/database';
// TODO: BBBParserService fehlt - wird im Onboarding-Refactoring erstellt
// import { bbbParserService } from '@/domains/bbb-api/services/BBBParserService';
import type { Spiel } from '@/shared/types';

export interface TabellenEintrag {
  rang: number;
  team_name: string;
  verein_name: string;
  spiele: number;
  siege: number;
  niederlagen: number;
  punkte: number;
  koerbe_plus: number;
  koerbe_minus: number;
  diff: number;
}

class TabellenService {
  /**
   * ⭐ NEW: Berechnet Tabelle aus Spielergebnissen (PLAUSIBILITÄT!)
   * 
   * Logik:
   * - Siege/Niederlagen aus Spielergebnissen zählen
   * - Punkte: Sieg = 2 Pkt, Unentschieden = 1 Pkt
   * - Körbe: Summe aller eigenen vs. gegnerischen Punkte
   * - Differenz: Eigene Körbe - Gegnerische Körbe
   */
  async berechneTabelleAusSpiele(ligaId: string): Promise<TabellenEintrag[]> {
    try {
      // 1. Finde alle Teams in dieser Liga
      const teilnahmen = await db.liga_teilnahmen
        .where({ liga_id: ligaId })
        .toArray();
      
      if (teilnahmen.length === 0) {
        return [];
      }

      // 2. Hole alle Vereine
      const vereinIds = teilnahmen.map(t => t.verein_id);
      const vereine = await db.vereine.bulkGet(vereinIds);
      
      // 3. Erstelle Team-Map (Verein-Name → Team-Name)
      const teamMap = new Map<string, string>();
      for (const teilnahme of teilnahmen) {
        const verein = vereine.find(v => v?.verein_id === teilnahme.verein_id);
        if (verein) {
          // Verwende den Team-Namen aus der Liga-Teilnahme oder generiere ihn
          // Beispiel: "DJK Neustadt a. d. Waldnaab 1"
          teamMap.set(verein.name, verein.name);
        }
      }

      // 4. Lade ALLE abgeschlossenen Spiele dieser Liga
      const allSpiele = await db.spiele
        .where('status')
        .equals('abgeschlossen')
        .toArray();
      
      // Filtere nur Spiele, die zu Teams dieser Liga gehören
      const ligaSpiele = allSpiele.filter(spiel => {
        const heimInLiga = Array.from(teamMap.keys()).some(verein => 
          spiel.heim.includes(verein) || verein.includes(spiel.heim)
        );
        const gastInLiga = Array.from(teamMap.keys()).some(verein => 
          spiel.gast.includes(verein) || verein.includes(spiel.gast)
        );
        return heimInLiga && gastInLiga;
      });

      // 5. Berechne Statistiken für jedes Team
      const statistiken = new Map<string, {
        spiele: number;
        siege: number;
        niederlagen: number;
        unentschieden: number;
        koerbe_plus: number;
        koerbe_minus: number;
      }>();

      // Initialisiere Statistiken
      const alleTeamNamen = new Set<string>();
      ligaSpiele.forEach(spiel => {
        alleTeamNamen.add(spiel.heim);
        alleTeamNamen.add(spiel.gast);
      });

      alleTeamNamen.forEach(teamName => {
        statistiken.set(teamName, {
          spiele: 0,
          siege: 0,
          niederlagen: 0,
          unentschieden: 0,
          koerbe_plus: 0,
          koerbe_minus: 0
        });
      });

      // Berechne Statistiken aus Spielen
      ligaSpiele.forEach(spiel => {
        if (spiel.ergebnis_heim === undefined || spiel.ergebnis_gast === undefined) {
          return; // Skip Spiele ohne Ergebnis
        }

        const heimStats = statistiken.get(spiel.heim);
        const gastStats = statistiken.get(spiel.gast);

        if (!heimStats || !gastStats) return;

        // Spiele zählen
        heimStats.spiele++;
        gastStats.spiele++;

        // Körbe summieren
        heimStats.koerbe_plus += spiel.ergebnis_heim;
        heimStats.koerbe_minus += spiel.ergebnis_gast;
        gastStats.koerbe_plus += spiel.ergebnis_gast;
        gastStats.koerbe_minus += spiel.ergebnis_heim;

        // Siege/Niederlagen/Unentschieden
        if (spiel.ergebnis_heim > spiel.ergebnis_gast) {
          // Heimsieg
          heimStats.siege++;
          gastStats.niederlagen++;
        } else if (spiel.ergebnis_gast > spiel.ergebnis_heim) {
          // Gastssieg
          gastStats.siege++;
          heimStats.niederlagen++;
        } else {
          // Unentschieden
          heimStats.unentschieden++;
          gastStats.unentschieden++;
        }
      });

      // 6. Erstelle Tabellen-Einträge
      const eintraege: TabellenEintrag[] = [];
      
      statistiken.forEach((stats, teamName) => {
        // Berechne Punkte: Sieg = 2 Pkt, Unentschieden = 1 Pkt
        const punkte = stats.siege * 2 + stats.unentschieden * 1;
        const diff = stats.koerbe_plus - stats.koerbe_minus;

        // Parse Verein-Name aus Team-Name
        const match = teamName.match(/^(.+?)\s+(\d+)$/);
        const verein_name = match ? match[1].trim() : teamName;

        eintraege.push({
          rang: 0, // Wird später gesetzt
          team_name: teamName,
          verein_name,
          spiele: stats.spiele,
          siege: stats.siege,
          niederlagen: stats.niederlagen,
          punkte,
          koerbe_plus: stats.koerbe_plus,
          koerbe_minus: stats.koerbe_minus,
          diff
        });
      });

      // 7. Sortiere nach: Punkte > Differenz > Körbe Plus
      eintraege.sort((a, b) => {
        if (b.punkte !== a.punkte) return b.punkte - a.punkte;
        if (b.diff !== a.diff) return b.diff - a.diff;
        return b.koerbe_plus - a.koerbe_plus;
      });

      // 8. Setze Ränge
      eintraege.forEach((eintrag, index) => {
        eintrag.rang = index + 1;
      });

      return eintraege;
    } catch (error) {
      console.error('Error calculating tabelle from games:', error);
      return [];
    }
  }
  /**
   * ⭐ NEW: Lädt Tabellen-Daten aus der Datenbank für eine Liga
   */
  async loadTabelleFromDatabase(ligaId: string): Promise<TabellenEintrag[]> {
    try {
      const tabellenEintraege = await db.liga_tabellen
        .where({ ligaid: ligaId })
        .sortBy('platz');
      
      // Konvertiere LigaTabelle zu TabellenEintrag
      return tabellenEintraege.map(eintrag => ({
        rang: eintrag.platz,
        team_name: eintrag.teamname,
        verein_name: eintrag.teamname.match(/^(.+?)\s+(\d+)$/)?.[1] || eintrag.teamname,
        spiele: eintrag.spiele,
        siege: eintrag.siege,
        niederlagen: eintrag.niederlagen,
        punkte: eintrag.punkte,
        koerbe_plus: eintrag.korbe_erzielt,
        koerbe_minus: eintrag.korbe_erhalten,
        diff: eintrag.korb_differenz
      }));
    } catch (error) {
      console.error('Error loading tabelle from database:', error);
      return [];
    }
  }

  /**
   * ⭐ NEW: Lädt Tabellen-Daten für das aktuelle Team
   * Priorität: 1. Berechnung aus Spielen, 2. DB-Daten, 3. Mock-Daten
   */
  async loadTabelleForTeam(teamId: string): Promise<TabellenEintrag[]> {
    try {
      // Finde Spielplan für Team
      const spielplan = await db.spielplaene
        .where({ team_id: teamId })
        .first();
      
      if (!spielplan || !spielplan.liga_nr_offiziell) {
        return this.getMockTabellenDaten();
      }
      
      // Finde Liga
      const liga = await db.ligen
        .where({ bbb_liga_id: spielplan.liga_nr_offiziell })
        .first();
      
      if (!liga) {
        return this.getMockTabellenDaten();
      }
      
      // ⭐ PRIORITY 1: Berechne Tabelle aus Spielergebnissen (PLAUSIBILITÄT!)
      const berechnetTabelle = await this.berechneTabelleAusSpiele(liga.liga_id);
      
      if (berechnetTabelle.length > 0) {
        console.log('✅ Tabelle aus Spielergebnissen berechnet:', berechnetTabelle.length, 'Teams');
        return berechnetTabelle;
      }
      
      // PRIORITY 2: Lade aus Datenbank (Fallback)
      const dbTabelle = await this.loadTabelleFromDatabase(liga.liga_id);
      
      if (dbTabelle.length > 0) {
        console.log('ℹ️ Tabelle aus DB geladen (Fallback):', dbTabelle.length, 'Teams');
        return dbTabelle;
      }
      
      // PRIORITY 3: Mock-Daten (Fallback)
      return this.getMockTabellenDaten();
    } catch (error) {
      console.error('Error loading tabelle for team:', error);
      return this.getMockTabellenDaten();
    }
  }
  /**
   * Parst Tabellen-Daten aus BBB-HTML
   */
  async parseTabellenDaten(html: string): Promise<TabellenEintrag[]> {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    const eintraege: TabellenEintrag[] = [];
    
    // Finde nur Daten-Zeilen
    const dataRows = doc.querySelectorAll('tr');
    
    dataRows.forEach(row => {
      const cells = row.querySelectorAll('td');
      
      // Skip wenn nicht genug Zellen
      if (cells.length < 7) return;
      
      // Prüfe ob es eine Daten-Zeile ist
      const hasDataClass = Array.from(cells).some(cell => 
        cell.className.includes('sportItemEven') || cell.className.includes('sportItemOdd')
      );
      if (!hasDataClass) return;
      
      try {
        // Format: | Rang | Name | Spiele | W/L | Pkte | Körbe | Diff. |
        const rang = parseInt(cells[0]?.textContent?.trim() || '0', 10);
        const teamName = cells[1]?.textContent?.trim() || '';
        const spiele = parseInt(cells[2]?.textContent?.trim() || '0', 10);
        const wl = cells[3]?.textContent?.trim() || '0/0';
        const punkte = parseInt(cells[4]?.textContent?.trim() || '0', 10);
        const koerbe = cells[5]?.textContent?.trim() || '0 : 0';
        const diff = parseInt(cells[6]?.textContent?.trim() || '0', 10);
        
        // Parse W/L (Format: "1/0")
        const [siege, niederlagen] = wl.split('/').map(n => parseInt(n.trim(), 10));
        
        // Parse Körbe (Format: "57 : 38")
        const koerbeMatch = koerbe.match(/(\d+)\s*:\s*(\d+)/);
        const koerbePlus = koerbeMatch ? parseInt(koerbeMatch[1], 10) : 0;
        const koerbeMinus = koerbeMatch ? parseInt(koerbeMatch[2], 10) : 0;
        
        if (rang > 0 && teamName) {
          // Parse Team-Name um Verein zu extrahieren
          const match = teamName.trim().match(/^(.+?)\s+(\d+)$/);
          const verein_name = match ? match[1].trim() : teamName;
          
          eintraege.push({
            rang,
            team_name: teamName,
            verein_name,
            spiele,
            siege: siege || 0,
            niederlagen: niederlagen || 0,
            punkte,
            koerbe_plus: koerbePlus,
            koerbe_minus: koerbeMinus,
            diff
          });
        }
      } catch (error) {
        console.warn('Failed to parse tabelle row:', error);
      }
    });
    
    return eintraege;
  }

  /**
   * Lädt Tabellen-Daten von einer BBB-Tabellen-URL
   */
  async loadTabelleFromUrl(tabelleUrl: string): Promise<TabellenEintrag[]> {
    try {
      // In DEV: Lade echte Testdaten
      if (import.meta.env.DEV) {
        // Simuliere Tabellen-Daten
        return this.getMockTabellenDaten();
      }

      // Production: Fetch via Proxy
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(tabelleUrl)}`;
      const response = await fetch(proxyUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const html = await response.text();
      return await this.parseTabellenDaten(html);
    } catch (error) {
      console.error('Error loading tabelle:', error);
      throw error;
    }
  }

  /**
   * Mock-Daten für Development
   */
  private getMockTabellenDaten(): TabellenEintrag[] {
    return [
      {
        rang: 1,
        team_name: 'DJK Neustadt a. d. Waldnaab 1',
        verein_name: 'DJK Neustadt a. d. Waldnaab',
        spiele: 1,
        siege: 1,
        niederlagen: 0,
        punkte: 2,
        koerbe_plus: 48,
        koerbe_minus: 19,
        diff: 29
      },
      {
        rang: 2,
        team_name: 'TSV 1880 Schwandorf',
        verein_name: 'TSV 1880 Schwandorf',
        spiele: 1,
        siege: 1,
        niederlagen: 0,
        punkte: 2,
        koerbe_plus: 57,
        koerbe_minus: 38,
        diff: 19
      },
      {
        rang: 3,
        team_name: 'TB Weiden Basketball',
        verein_name: 'TB Weiden Basketball',
        spiele: 1,
        siege: 1,
        niederlagen: 0,
        punkte: 2,
        koerbe_plus: 35,
        koerbe_minus: 30,
        diff: 5
      },
      {
        rang: 4,
        team_name: 'Regensburg Baskets 1',
        verein_name: 'Regensburg Baskets',
        spiele: 0,
        siege: 0,
        niederlagen: 0,
        punkte: 0,
        koerbe_plus: 0,
        koerbe_minus: 0,
        diff: 0
      },
      {
        rang: 5,
        team_name: 'TV Amberg-Sulzbach BSG 2',
        verein_name: 'TV Amberg-Sulzbach BSG',
        spiele: 1,
        siege: 0,
        niederlagen: 1,
        punkte: 0,
        koerbe_plus: 30,
        koerbe_minus: 35,
        diff: -5
      },
      {
        rang: 6,
        team_name: 'Regensburg Baskets 2',
        verein_name: 'Regensburg Baskets',
        spiele: 1,
        siege: 0,
        niederlagen: 1,
        punkte: 0,
        koerbe_plus: 38,
        koerbe_minus: 57,
        diff: -19
      },
      {
        rang: 7,
        team_name: 'Fibalon Baskets Neumarkt',
        verein_name: 'Fibalon Baskets Neumarkt',
        spiele: 1,
        siege: 0,
        niederlagen: 1,
        punkte: 0,
        koerbe_plus: 19,
        koerbe_minus: 48,
        diff: -29
      }
    ];
  }
}

export const tabellenService = new TabellenService();
