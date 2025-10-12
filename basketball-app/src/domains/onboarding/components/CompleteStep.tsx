/**
 * Complete Step - Finalisierung des Onboardings
 * 
 * FINALISIERT: Führt CSV-Importe mit echten Team-IDs aus
 * 
 * Speichert automatisch:
 * - Verein (aus BBB-Daten)
 * - Liga (aus BBB-Daten)
 * - Team (mit Verweis auf Verein + Liga)
 * - Spielplan (mit allen Spielen + BBB-URLs)
 * - Spieler (aus CSV)
 * - Trikots (aus CSV)
 */

import React, { useState, useEffect } from 'react';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useAppStore } from '@/stores/appStore';
import { teamService } from '@/domains/team/services/TeamService';
import { vereinService } from '@/domains/verein/services/VereinService';
import { csvImportService } from '../services/CSVImportService';
import { db } from '@/shared/db/database';
import { v4 as uuidv4 } from 'uuid';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import type { Verein, Liga, Team, Spielplan, Spiel, Altersklasse } from '@/shared/types';

export function CompleteStep() {
  const { 
    parsed_liga_data, 
    selected_team_name,
    trainer_name,
    spieler_csv,
    trikot_csv,
    reset: resetOnboarding 
  } = useOnboardingStore();
  
  const { completeOnboarding, setCurrentTeam } = useAppStore();
  
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    
    const runFinalize = async () => {
      if (mounted) {
        await finalize();
      }
    };
    
    runFinalize();
    
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Bewusst leer - soll nur einmal beim Mount laufen

  const finalize = async () => {
    try {
      if (!parsed_liga_data || !selected_team_name || !trainer_name) {
        throw new Error('Onboarding-Daten unvollständig');
      }

      if (!spieler_csv || !trikot_csv) {
        throw new Error('CSV-Dateien fehlen');
      }

      const selectedTeamData = parsed_liga_data.teams.find(
        t => t.team_name === selected_team_name
      );

      if (!selectedTeamData) {
        throw new Error('Gewähltes Team nicht gefunden');
      }

      // SCHRITT 1: Verein erstellen/finden
      setProgress('Erstelle Verein...');
      
      let verein: Verein;
      const existingVerein = await db.vereine
        .where({ name: selectedTeamData.verein_name })
        .first();

      if (existingVerein) {
        verein = existingVerein;
      } else {
        verein = await vereinService.createVerein({
          name: selectedTeamData.verein_name,
          ort: selectedTeamData.verein_ort || 'Unbekannt',
          ist_eigener_verein: true,
        });
      }

      // SCHRITT 2: Liga erstellen/finden
      setProgress('Erstelle Liga...');
      
      let liga: Liga;
      const existingLiga = await db.ligen
        .where({ bbb_liga_id: parsed_liga_data.liga.liga_id })
        .first();

      if (existingLiga) {
        liga = existingLiga;
      } else {
        liga = {
          liga_id: uuidv4(),
          bbb_liga_id: parsed_liga_data.liga.liga_id,
          verband_id: 2, // Bayern
          name: parsed_liga_data.liga.liga_name,
          saison: parsed_liga_data.liga.saison,
          altersklasse: parsed_liga_data.liga.altersklasse as Altersklasse,
          spielklasse: parsed_liga_data.liga.spielklasse,
          region: parsed_liga_data.liga.region,
          sync_am: new Date(),
          created_at: new Date(),
        };
        await db.ligen.add(liga);
      }

      // SCHRITT 3: Team erstellen
      setProgress('Erstelle Team...');
      
      const team: Team = await teamService.createTeam({
        verein_id: verein.verein_id,
        name: selected_team_name,
        altersklasse: parsed_liga_data.liga.altersklasse as Altersklasse,
        saison: parsed_liga_data.liga.saison,
        trainer: trainer_name,
        leistungsorientiert: parsed_liga_data.liga.altersklasse === 'U12' ? false : undefined,
      });

      // SCHRITT 4: Spielplan erstellen
      setProgress('Erstelle Spielplan...');
      
      const spielplan: Spielplan = {
        spielplan_id: uuidv4(),
        team_id: team.team_id,
        saison: parsed_liga_data.liga.saison,
        liga: parsed_liga_data.liga.liga_name,
        altersklasse: parsed_liga_data.liga.altersklasse,
        bbb_spielplan_url: parsed_liga_data.spielplan_url,
        bbb_tabelle_url: parsed_liga_data.tabelle_url,
        bbb_ergebnisse_url: parsed_liga_data.ergebnisse_url,
        liga_nr_offiziell: parsed_liga_data.liga.liga_id,
        syncam: new Date(),
        created_at: new Date(),
      };
      await db.spielplaene.add(spielplan);

      // SCHRITT 5: Spiele erstellen
      setProgress(`Importiere ${parsed_liga_data.spiele.length} Spiele...`);
      
      const spiele: Spiel[] = parsed_liga_data.spiele.map(spielInfo => ({
        spiel_id: uuidv4(),
        spielplan_id: spielplan.spielplan_id,
        team_id: team.team_id,
        spielnr: spielInfo.spielnr,
        spieltag: spielInfo.spieltag,
        datum: new Date(spielInfo.datum),
        uhrzeit: spielInfo.uhrzeit,
        heim: spielInfo.heim_team,
        gast: spielInfo.gast_team,
        ist_heimspiel: spielInfo.heim_team === selected_team_name,
        status: 'geplant',
        altersklasse: parsed_liga_data.liga.altersklasse as Altersklasse,
        created_at: new Date(),
      }));

      await db.spiele.bulkAdd(spiele);

      // SCHRITT 6: Liga-Teilnahme für alle Teams erstellen
      setProgress('Registriere Teams in Liga...');
      
      for (const teamInfo of parsed_liga_data.teams) {
        // Finde oder erstelle Verein für jedes Team
        let teamVerein: Verein;
        const existingTeamVerein = await db.vereine
          .where({ name: teamInfo.verein_name })
          .first();

        if (existingTeamVerein) {
          teamVerein = existingTeamVerein;
        } else {
          teamVerein = await vereinService.createVerein({
            name: teamInfo.verein_name,
            ort: teamInfo.verein_ort || 'Unbekannt',
            ist_eigener_verein: teamInfo.team_name === selected_team_name,
          });
        }

        // Liga-Teilnahme
        await db.liga_teilnahmen.add({
          teilnahme_id: uuidv4(),
          liga_id: liga.liga_id,
          verein_id: teamVerein.verein_id,
          team_id: teamInfo.team_name === selected_team_name ? team.team_id : undefined,
          created_at: new Date(),
        });
      }

      // SCHRITT 7: Spieler importieren (JETZT mit echtem Team-ID!)
      setProgress('Importiere Spieler...');
      
      const spielerImport = await csvImportService.importSpieler(spieler_csv, team.team_id);
      
      if (!spielerImport.success) {
        console.warn('Spieler-Import Fehler:', spielerImport.errors);
        // Nicht abbrechen, aber warnen
      }

      // SCHRITT 8: Trikots importieren (JETZT mit echtem Team-ID!)
      setProgress('Importiere Trikots...');
      
      const trikotImport = await csvImportService.importTrikots(trikot_csv, team.team_id);
      
      if (!trikotImport.success) {
        console.warn('Trikot-Import Fehler:', trikotImport.errors);
        // Nicht abbrechen, aber warnen
      }

      // SCHRITT 9: App State aktualisieren
      setProgress('Finalisiere...');
      setCurrentTeam(team.team_id);
      completeOnboarding();
      resetOnboarding();

      setStatus('success');

      // SCHRITT 10: Nach 2 Sekunden zum Dashboard
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 2000);
      
    } catch (err) {
      console.error('Onboarding finalization failed:', err);
      setError((err as Error).message);
      setStatus('error');
    }
  };

  return (
    <div className="text-center">
      {status === 'processing' && (
        <>
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-100 rounded-full mb-6 animate-pulse">
            <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Dein Team wird eingerichtet...
          </h2>
          <p className="text-gray-600 mb-4">
            {progress}
          </p>
          <div className="w-full max-w-xs mx-auto bg-gray-200 rounded-full h-2 overflow-hidden">
            <div className="bg-primary-600 h-2 rounded-full animate-pulse" style={{ width: '70%' }} />
          </div>
        </>
      )}

      {status === 'success' && (
        <>
          <div className="inline-flex items-center justify-center w-20 h-20 bg-success-100 rounded-full mb-6">
            <CheckCircle className="w-10 h-10 text-success-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            🎉 Fertig!
          </h2>
          <p className="text-lg text-gray-600 mb-4">
            Dein Team wurde erfolgreich eingerichtet.
          </p>
          
          <div className="inline-block p-4 bg-primary-50 rounded-lg mb-6 text-left">
            <dl className="space-y-2">
              <div>
                <dt className="text-sm font-medium text-primary-700">Team:</dt>
                <dd className="text-lg font-bold text-primary-900">{selected_team_name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-primary-700">Liga:</dt>
                <dd className="text-primary-900">{parsed_liga_data?.liga.liga_name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-primary-700">Saison:</dt>
                <dd className="text-primary-900">{parsed_liga_data?.liga.saison}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-primary-700">Spiele:</dt>
                <dd className="text-primary-900">{parsed_liga_data?.spiele.length} importiert</dd>
              </div>
            </dl>
          </div>

          <p className="text-sm text-gray-500">
            Du wirst automatisch zum Dashboard weitergeleitet...
          </p>
        </>
      )}

      {status === 'error' && (
        <>
          <div className="inline-flex items-center justify-center w-20 h-20 bg-error-100 rounded-full mb-6">
            <AlertCircle className="w-10 h-10 text-error-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Fehler aufgetreten
          </h2>
          <p className="text-gray-600 mb-4">
            Beim Einrichten deines Teams ist ein Fehler aufgetreten.
          </p>
          
          <div className="alert-error mb-6 text-left">
            <p className="font-medium mb-1">Details:</p>
            <p className="text-sm">{error}</p>
          </div>

          <button
            type="button"
            onClick={finalize}
            className="btn-primary"
          >
            Erneut versuchen
          </button>
        </>
      )}
    </div>
  );
}
