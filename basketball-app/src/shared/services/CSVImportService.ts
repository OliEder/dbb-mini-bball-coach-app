/**
 * CSV Import Service
 * 
 * Konsolidierte Version - Kombiniert beste Features beider Vorgänger
 * - Robust CSV parsing mit Papaparse
 * - Import von Spielern und Trikots
 * - Validierung und Template-Generierung
 */

import Papa from 'papaparse';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/shared/db/database';
import type {
  UUID,
  Spieler,
  Trikot,
  SpielerCSVRow,
  TrikotCSVRow,
  Erziehungsberechtigte,
  SpielerErziehungsberechtigte
} from '@/shared/types';

export interface CSVImportResult<T> {
  success: boolean;
  data: T[];
  errors: string[];
  warnings: string[];
}

export class CSVImportService {
  /**
   * Importiert Spieler aus CSV
   * 
   * Erwartete Spalten:
   * - vorname (Pflicht)
   * - nachname (Pflicht)
   * - geburtsdatum (Optional, Format: DD.MM.YYYY oder YYYY-MM-DD)
   * - tna_nr (Optional)
   * - konfektionsgroesse_jersey (Optional)
   * - konfektionsgroesse_hose (Optional)
   * - erz_vorname (Optional)
   * - erz_nachname (Optional)
   * - erz_telefon (Optional)
   * - erz_email (Optional)
   */
  async importSpieler(file: File, team_id: UUID): Promise<CSVImportResult<Spieler>> {
    return new Promise((resolve) => {
      Papa.parse<SpielerCSVRow>(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim().toLowerCase().replace(/\s+/g, '_'),
        dynamicTyping: false,
        complete: async (results) => {
          const errors: string[] = [];
          const warnings: string[] = [];
          const spieler: Spieler[] = [];
          const erzMapping = new Map<string, Erziehungsberechtigte>();

          for (let i = 0; i < results.data.length; i++) {
            const row = results.data[i];
            const rowNum = i + 2; // +2 weil Excel bei 1 startet und Header-Row

            // Validate required fields
            if (!row.vorname?.trim()) {
              errors.push(`Zeile ${rowNum}: Vorname fehlt`);
              continue;
            }

            if (!row.nachname?.trim()) {
              errors.push(`Zeile ${rowNum}: Nachname fehlt`);
              continue;
            }

            // Parse geburtsdatum
            let geburtsdatum: Date | undefined;
            if (row.geburtsdatum) {
              geburtsdatum = this.parseDate(row.geburtsdatum);
              if (!geburtsdatum) {
                warnings.push(`Zeile ${rowNum}: Geburtsdatum '${row.geburtsdatum}' ungültig`);
              }
            }

            // Parse Konfektionsgrößen
            const jersey = row.konfektionsgroesse_jersey 
              ? parseInt(row.konfektionsgroesse_jersey, 10)
              : undefined;
            const hose = row.konfektionsgroesse_hose
              ? parseInt(row.konfektionsgroesse_hose, 10)
              : undefined;

            const spieler_id = uuidv4();

            // Create Spieler
            const newSpieler: Spieler = {
              spieler_id,
              team_id,
              vorname: row.vorname.trim(),
              nachname: row.nachname.trim(),
              geburtsdatum,
              spieler_typ: 'eigenes_team',
              tna_nr: row.tna_nr?.trim() || undefined,
              konfektionsgroesse_jersey: jersey,
              konfektionsgroesse_hose: hose,
              aktiv: true,
              created_at: new Date(),
            };

            spieler.push(newSpieler);

            // Handle Erziehungsberechtigte
            if (row.erz_email?.trim() || row.erz_telefon?.trim()) {
              const erzKey = row.erz_email?.trim().toLowerCase() || row.erz_telefon?.trim();
              
              let erz: Erziehungsberechtigte;
              if (erzKey && erzMapping.has(erzKey)) {
                erz = erzMapping.get(erzKey)!;
              } else {
                if (!row.erz_telefon?.trim()) {
                  warnings.push(`Zeile ${rowNum}: Erziehungsberechtigter ohne Telefonnummer`);
                  continue;
                }

                erz = {
                  erz_id: uuidv4(),
                  vorname: row.erz_vorname?.trim() || '',
                  nachname: row.erz_nachname?.trim() || '',
                  telefon_mobil: row.erz_telefon.trim(),
                  email: row.erz_email?.trim() || '',
                  datenschutz_akzeptiert: false,
                  created_at: new Date(),
                };

                if (erzKey) {
                  erzMapping.set(erzKey, erz);
                }
              }

              const beziehung: SpielerErziehungsberechtigte = {
                se_id: uuidv4(),
                spieler_id: newSpieler.spieler_id,
                erz_id: erz.erz_id,
                beziehung: 'Sonstiges',
                ist_notfallkontakt: true,
                abholberechtigt: true,
                created_at: new Date(),
              };

              await db.erziehungsberechtigte.put(erz);
              await db.spieler_erziehungsberechtigte.add(beziehung);
            }
          }

          // Bulk insert Spieler
          if (spieler.length > 0) {
            await db.spieler.bulkAdd(spieler);
          }

          resolve({
            success: errors.length === 0,
            data: spieler,
            errors,
            warnings,
          });
        },
        error: (error) => {
          resolve({
            success: false,
            data: [],
            errors: [`CSV Parse Error: ${error.message}`],
            warnings: [],
          });
        }
      });
    });
  }

  /**
   * Importiert Trikots aus CSV
   * 
   * Erwartete Spalten:
   * - art (Pflicht): "Wendejersey" oder "Hose"
   * - nummer (Optional): Trikot-Nummer
   * - groesse (Pflicht): xs, s, m, l, xl, etc.
   * - eu_groesse (Pflicht): 116-170
   * - farbe_dunkel (Optional)
   * - farbe_hell (Optional)
   */
  async importTrikots(file: File, team_id: UUID): Promise<CSVImportResult<Trikot>> {
    return new Promise((resolve) => {
      Papa.parse<TrikotCSVRow>(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim().toLowerCase().replace(/\s+/g, '_'),
        complete: async (results) => {
          const errors: string[] = [];
          const warnings: string[] = [];
          const trikots: Trikot[] = [];

          for (let i = 0; i < results.data.length; i++) {
            const row = results.data[i];
            const rowNum = i + 2;

            // Validate art
            if (!row.art?.trim()) {
              errors.push(`Zeile ${rowNum}: Art fehlt`);
              continue;
            }

            const art = row.art.trim();
            if (art !== 'Wendejersey' && art !== 'Hose') {
              errors.push(`Zeile ${rowNum}: Art muss 'Wendejersey' oder 'Hose' sein`);
              continue;
            }

            // Validate groesse
            if (!row.groesse?.trim()) {
              errors.push(`Zeile ${rowNum}: Größe fehlt`);
              continue;
            }

            // Validate eu_groesse
            if (!row.eu_groesse) {
              errors.push(`Zeile ${rowNum}: EU-Größe fehlt`);
              continue;
            }

            const eu_groesse = parseInt(row.eu_groesse, 10);
            if (isNaN(eu_groesse) || eu_groesse < 116 || eu_groesse > 170) {
              errors.push(`Zeile ${rowNum}: EU-Größe muss zwischen 116 und 170 liegen`);
              continue;
            }

            const trikot: Trikot = {
              trikot_id: uuidv4(),
              team_id,
              art: art as 'Wendejersey' | 'Hose',
              nummer: row.nummer?.trim() || undefined,
              groesse: row.groesse.trim() as any,
              eu_groesse,
              farbe_dunkel: row.farbe_dunkel?.trim() || undefined,
              farbe_hell: row.farbe_hell?.trim() || undefined,
              status: 'verfügbar',
              created_at: new Date(),
            };

            trikots.push(trikot);
          }

          // Bulk insert
          if (trikots.length > 0) {
            await db.trikots.bulkAdd(trikots);
          }

          resolve({
            success: errors.length === 0,
            data: trikots,
            errors,
            warnings,
          });
        },
        error: (error) => {
          resolve({
            success: false,
            data: [],
            errors: [`CSV Parse Error: ${error.message}`],
            warnings: [],
          });
        }
      });
    });
  }

  /**
   * Validiert CSV-Datei Format für Spieler
   */
  async validateSpielerCSV(file: File): Promise<{ valid: boolean; errors: string[] }> {
    try {
      const parseResult = await this.parseCSV<SpielerCSVRow>(file);
      const errors: string[] = [];

      if (parseResult.data.length === 0) {
        errors.push('CSV-Datei ist leer');
      }

      if (parseResult.meta.fields) {
        const requiredFields = ['vorname', 'nachname'];
        const missingFields = requiredFields.filter(
          field => !parseResult.meta.fields?.includes(field)
        );

        if (missingFields.length > 0) {
          errors.push(`Fehlende Spalten: ${missingFields.join(', ')}`);
        }
      }

      return {
        valid: errors.length === 0,
        errors
      };
    } catch (error) {
      return {
        valid: false,
        errors: [`Parsing-Fehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`]
      };
    }
  }

  /**
   * Validiert Trikot CSV-Datei Format
   */
  async validateTrikotCSV(file: File): Promise<{ valid: boolean; errors: string[] }> {
    try {
      const parseResult = await this.parseCSV<TrikotCSVRow>(file);
      const errors: string[] = [];

      if (parseResult.data.length === 0) {
        errors.push('CSV-Datei ist leer');
      }

      if (parseResult.meta.fields) {
        const requiredFields = ['art', 'groesse', 'eu_groesse'];
        const missingFields = requiredFields.filter(
          field => !parseResult.meta.fields?.includes(field)
        );

        if (missingFields.length > 0) {
          errors.push(`Fehlende Spalten: ${missingFields.join(', ')}`);
        }
      }

      return {
        valid: errors.length === 0,
        errors
      };
    } catch (error) {
      return {
        valid: false,
        errors: [`Parsing-Fehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`]
      };
    }
  }

  /**
   * Generiert CSV-Template für Spieler
   */
  generateSpielerTemplate(): string {
    const headers = [
      'vorname',
      'nachname',
      'geburtsdatum',
      'tna_nr',
      'konfektionsgroesse_jersey',
      'konfektionsgroesse_hose',
      'erz_vorname',
      'erz_nachname',
      'erz_telefon',
      'erz_email',
    ];

    const example = [
      'Max',
      'Mustermann',
      '2015-03-15',
      '12345678',
      '140',
      '140',
      'Maria',
      'Mustermann',
      '0170 1234567',
      'maria@example.com',
    ];

    return Papa.unparse([headers, example]);
  }

  /**
   * Generiert CSV-Template für Trikots
   */
  generateTrikotTemplate(): string {
    const headers = [
      'art',
      'nummer',
      'groesse',
      'eu_groesse',
      'farbe_dunkel',
      'farbe_hell',
    ];

    const examples = [
      ['Wendejersey', '4', 'm', '140', 'blau', 'weiß'],
      ['Hose', '', 'm', '140', '', ''],
    ];

    return Papa.unparse([headers, ...examples]);
  }

  /**
   * Hilfsfunktion: CSV parsen
   */
  private async parseCSV<T>(file: File): Promise<Papa.ParseResult<T>> {
    return new Promise((resolve, reject) => {
      Papa.parse<T>(file, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        transformHeader: (header) => header.trim().toLowerCase(),
        complete: (results) => resolve(results),
        error: (error) => reject(error)
      });
    });
  }

  /**
   * Hilfsfunktion: Datum parsen (DD.MM.YYYY oder YYYY-MM-DD)
   */
  private parseDate(dateString: string): Date | undefined {
    const cleaned = dateString.trim();
    
    // DD.MM.YYYY
    if (cleaned.includes('.')) {
      const [day, month, year] = cleaned.split('.');
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return isNaN(date.getTime()) ? undefined : date;
    }
    
    // YYYY-MM-DD
    if (cleaned.includes('-')) {
      const date = new Date(cleaned);
      return isNaN(date.getTime()) ? undefined : date;
    }
    
    return undefined;
  }
}

// Singleton Export
export const csvImportService = new CSVImportService();
