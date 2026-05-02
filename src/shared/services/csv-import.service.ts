/**
 * CSV Import Service
 * 
 * Service für den Import von CSV-Dateien (Spieler & Trikots)
 * Verwendet Papaparse für robustes CSV-Parsing
 */

import Papa from 'papaparse';
import type { SpielerCSVRow, TrikotCSVRow, Spieler, Trikot, UUID } from '@shared/types';
import { db } from '@shared/db/database';
import { v4 as uuidv4 } from 'uuid';

export interface CSVImportResult<T> {
  success: boolean;
  imported: T[];
  errors: Array<{ row: number; error: string }>;
  skipped: number;
}

export interface SpielerImportOptions {
  team_id: UUID;
  skipDuplicates?: boolean;
}

export interface TrikotImportOptions {
  team_id: UUID;
}

export class CSVImportService {
  /**
   * Parst CSV-Datei
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
   * Importiert Spieler aus CSV
   * 
   * Erwartete Spalten:
   * - vorname (Pflicht)
   * - nachname (Pflicht)
   * - geburtsdatum (Optional, Format: DD.MM.YYYY oder YYYY-MM-DD)
   * - tna_nr (Optional)
   * - konfektionsgroesse_jersey (Optional, z.B. 140)
   * - konfektionsgroesse_hose (Optional, z.B. 140)
   * - erz_vorname (Optional)
   * - erz_nachname (Optional)
   * - erz_telefon (Optional)
   * - erz_email (Optional)
   */
  async importSpieler(
    file: File, 
    options: SpielerImportOptions
  ): Promise<CSVImportResult<Spieler>> {
    try {
      const parseResult = await this.parseCSV<SpielerCSVRow>(file);
      
      const imported: Spieler[] = [];
      const errors: Array<{ row: number; error: string }> = [];
      let skipped = 0;

      for (let i = 0; i < parseResult.data.length; i++) {
        const row = parseResult.data[i];
        const rowNumber = i + 2; // +2 wegen Header und 1-basiert

        try {
          // Validierung
          if (!row.vorname || !row.nachname) {
            errors.push({ 
              row: rowNumber, 
              error: 'Vorname und Nachname sind Pflichtfelder' 
            });
            skipped++;
            continue;
          }

          // Duplikatsprüfung
          if (options.skipDuplicates) {
            const existingSpieler = await db.spieler
              .where('[vorname+nachname]')
              .equals([row.vorname, row.nachname])
              .and(s => s.team_id === options.team_id)
              .first();

            if (existingSpieler) {
              skipped++;
              continue;
            }
          }

          // Geburtsdatum parsen
          let geburtsdatum: Date | undefined;
          if (row.geburtsdatum) {
            geburtsdatum = this.parseDate(row.geburtsdatum);
          }

          // Spieler erstellen
          const spieler: Spieler = {
            spieler_id: uuidv4(),
            team_id: options.team_id,
            vorname: row.vorname.trim(),
            nachname: row.nachname.trim(),
            geburtsdatum,
            spieler_typ: 'eigenes_team',
            tna_nr: row.tna_nr?.trim(),
            konfektionsgroesse_jersey: row.konfektionsgroesse_jersey ? 
              parseInt(String(row.konfektionsgroesse_jersey)) : undefined,
            konfektionsgroesse_hose: row.konfektionsgroesse_hose ? 
              parseInt(String(row.konfektionsgroesse_hose)) : undefined,
            aktiv: true,
            created_at: new Date()
          };

          await db.spieler.add(spieler);
          imported.push(spieler);

          // Erziehungsberechtigte anlegen (falls Daten vorhanden)
          if (row.erz_vorname && row.erz_nachname && row.erz_telefon && row.erz_email) {
            const erz_id = uuidv4();
            
            await db.erziehungsberechtigte.add({
              erz_id,
              vorname: row.erz_vorname.trim(),
              nachname: row.erz_nachname.trim(),
              telefon_mobil: row.erz_telefon.trim(),
              email: row.erz_email.trim(),
              datenschutz_akzeptiert: true, // Bei CSV-Import angenommen
              created_at: new Date()
            });

            // Verknüpfung erstellen
            await db.spieler_erziehungsberechtigte.add({
              se_id: uuidv4(),
              spieler_id: spieler.spieler_id,
              erz_id,
              beziehung: 'Mutter', // Default, kann später angepasst werden
              ist_notfallkontakt: true,
              abholberechtigt: true,
              created_at: new Date()
            });
          }

        } catch (error) {
          errors.push({ 
            row: rowNumber, 
            error: error instanceof Error ? error.message : 'Unbekannter Fehler' 
          });
          skipped++;
        }
      }

      return {
        success: errors.length === 0,
        imported,
        errors,
        skipped
      };

    } catch (error) {
      throw new Error(`CSV-Import fehlgeschlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
    }
  }

  /**
   * Importiert Trikots aus CSV
   * 
   * Erwartete Spalten:
   * - art (Pflicht: "Wendejersey" oder "Hose")
   * - nummer (Optional, nur bei Jersey)
   * - groesse (Pflicht: z.B. "xs", "s", "m")
   * - eu_groesse (Pflicht: z.B. 140)
   * - farbe_dunkel (Optional)
   * - farbe_hell (Optional)
   */
  async importTrikots(
    file: File,
    options: TrikotImportOptions
  ): Promise<CSVImportResult<Trikot>> {
    try {
      const parseResult = await this.parseCSV<TrikotCSVRow>(file);
      
      const imported: Trikot[] = [];
      const errors: Array<{ row: number; error: string }> = [];
      let skipped = 0;

      for (let i = 0; i < parseResult.data.length; i++) {
        const row = parseResult.data[i];
        const rowNumber = i + 2;

        try {
          // Validierung
          if (!row.art || !row.groesse || !row.eu_groesse) {
            errors.push({ 
              row: rowNumber, 
              error: 'Art, Größe und EU-Größe sind Pflichtfelder' 
            });
            skipped++;
            continue;
          }

          // Art validieren
          const art = row.art.trim();
          if (art !== 'Wendejersey' && art !== 'Hose') {
            errors.push({ 
              row: rowNumber, 
              error: 'Art muss "Wendejersey" oder "Hose" sein' 
            });
            skipped++;
            continue;
          }

          // Trikot erstellen
          const trikot: Trikot = {
            trikot_id: uuidv4(),
            team_id: options.team_id,
            art: art as 'Wendejersey' | 'Hose',
            nummer: row.nummer?.trim(),
            groesse: row.groesse.trim().toLowerCase() as any,
            eu_groesse: parseInt(String(row.eu_groesse)),
            farbe_dunkel: row.farbe_dunkel?.trim(),
            farbe_hell: row.farbe_hell?.trim(),
            status: 'verfügbar',
            created_at: new Date()
          };

          await db.trikots.add(trikot);
          imported.push(trikot);

        } catch (error) {
          errors.push({ 
            row: rowNumber, 
            error: error instanceof Error ? error.message : 'Unbekannter Fehler' 
          });
          skipped++;
        }
      }

      return {
        success: errors.length === 0,
        imported,
        errors,
        skipped
      };

    } catch (error) {
      throw new Error(`CSV-Import fehlgeschlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
    }
  }

  /**
   * Hilfsfunktion: Datum parsen
   */
  private parseDate(dateString: string): Date | undefined {
    // Format: DD.MM.YYYY oder YYYY-MM-DD
    const cleaned = dateString.trim();
    
    // DD.MM.YYYY
    if (cleaned.includes('.')) {
      const [day, month, year] = cleaned.split('.');
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    
    // YYYY-MM-DD
    if (cleaned.includes('-')) {
      return new Date(cleaned);
    }
    
    return undefined;
  }

  /**
   * Validiert CSV-Datei Format
   */
  async validateSpielerCSV(file: File): Promise<{ valid: boolean; errors: string[] }> {
    try {
      const parseResult = await this.parseCSV<SpielerCSVRow>(file);
      const errors: string[] = [];

      if (parseResult.data.length === 0) {
        errors.push('CSV-Datei ist leer');
      }

      // Prüfe Header
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

      // Prüfe Header
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
}

// Singleton Instance
export const csvImportService = new CSVImportService();
