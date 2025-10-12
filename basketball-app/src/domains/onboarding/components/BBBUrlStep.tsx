/**
 * BBB URL Step - SCHRITT 2 (nach Welcome)
 * 
 * User gibt BBB-Liga-URL ein
 * Parser extrahiert automatisch Liga, Vereine und Teams
 */

import React, { useState } from 'react';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { bbbParserService } from '@/domains/bbb/services/BBBParserService';
import { ArrowRight, ArrowLeft, Link2, Loader2, CheckCircle, AlertCircle, Info } from 'lucide-react';

export function BBBUrlStep() {
  const { bbb_url, setBBBUrl, setParsedLigaData, setStep, canProceed } = useOnboardingStore();
  
  const [url, setUrl] = useState(bbb_url || '');
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState('');
  const [parseResult, setParseResult] = useState<{
    liga_name: string;
    team_count: number;
    spiele_count: number;
  } | null>(null);

  const handleChange = (value: string) => {
    setUrl(value);
    setBBBUrl(value);
    if (error) setError('');
    if (parseResult) setParseResult(null);
  };

  const handleParse = async () => {
    if (!url.trim()) {
      setError('Bitte gib eine URL ein');
      return;
    }

    setParsing(true);
    setError('');

    try {
      const result = await bbbParserService.parseLigaFromUrl(url);
      
      // Speichern im Store
      setParsedLigaData(result);
      
      // Success-Anzeige
      setParseResult({
        liga_name: result.liga.liga_name,
        team_count: result.teams.length,
        spiele_count: result.spiele.length,
      });
      
    } catch (err) {
      console.error('BBB Parse Error:', err);
      setError((err as Error).message);
    } finally {
      setParsing(false);
    }
  };

  const handleNext = () => {
    if (canProceed()) {
      setStep('team_select');
    }
  };

  const handleBack = () => {
    setStep('welcome');
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Spielplan importieren
      </h2>
      <p className="text-gray-600 mb-6">
        Gib die URL deiner Liga von basketball-bund.net ein.
        Alle Team- und Spielplan-Daten werden automatisch importiert.
      </p>

      {/* Info Box */}
      <div className="alert-info mb-6">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <p className="font-medium mb-2">So findest du die URL:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Gehe zu <strong>basketball-bund.net</strong></li>
              <li>Suche deine Liga (z.B. "U10 Oberpfalz")</li>
              <li>Öffne <strong>Spielplan</strong>, <strong>Tabelle</strong> oder <strong>Ergebnisse</strong></li>
              <li>Kopiere die URL aus der Adressleiste</li>
            </ol>
            <p className="mt-3 text-primary-700 font-medium">
              ✅ Die App erkennt automatisch alle drei URLs (Spielplan, Tabelle, Ergebnisse)
            </p>
          </div>
        </div>
      </div>

      {/* URL Input */}
      <div className="mb-6">
        <label htmlFor="bbb-url" className="label label-required">
          Basketball-Bund.net Liga-URL
        </label>
        <div className="relative">
          <input
            id="bbb-url"
            type="url"
            value={url}
            onChange={(e) => handleChange(e.target.value)}
            className={error ? 'input input-error pr-10' : 'input pr-10'}
            placeholder="https://www.basketball-bund.net/..."
            aria-invalid={!!error}
            aria-describedby={error ? 'bbb-url-error' : 'bbb-url-help'}
            disabled={parsing}
            autoFocus
          />
          <Link2 
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" 
            aria-hidden="true"
          />
        </div>
        {error ? (
          <p id="bbb-url-error" className="mt-1 text-sm text-error-600" role="alert">
            {error}
          </p>
        ) : (
          <p id="bbb-url-help" className="mt-1 text-sm text-gray-500">
            Funktioniert mit Spielplan-, Tabellen- oder Ergebnisse-URLs
          </p>
        )}
      </div>

      {/* Example URL */}
      <details className="mb-6 text-sm">
        <summary className="cursor-pointer text-primary-600 hover:text-primary-700 font-medium">
          Beispiel-URL anzeigen
        </summary>
        <div className="mt-2 p-3 bg-gray-50 rounded border border-gray-200 font-mono text-xs break-all">
          https://www.basketball-bund.net/public/spielplan_list.jsp?print=1&liga_id=51961
        </div>
      </details>

      {/* Parse Button */}
      {url && !parseResult && (
        <button
          type="button"
          onClick={handleParse}
          disabled={parsing}
          className="btn-primary inline-flex items-center gap-2 mb-6"
        >
          {parsing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              Lade Liga-Daten...
            </>
          ) : (
            <>
              <Link2 className="w-4 h-4" aria-hidden="true" />
              Liga-Daten laden
            </>
          )}
        </button>
      )}

      {/* Parse Result */}
      {parseResult && (
        <div className="p-4 rounded-lg border-2 bg-success-50 border-success-600 mb-6">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-6 h-6 text-success-600 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-success-900 mb-2">
                ✅ Liga erfolgreich geladen!
              </h3>
              <dl className="space-y-1 text-sm text-success-800">
                <div>
                  <dt className="inline font-medium">Liga:</dt>
                  <dd className="inline ml-2">{parseResult.liga_name}</dd>
                </div>
                <div>
                  <dt className="inline font-medium">Teams:</dt>
                  <dd className="inline ml-2">{parseResult.team_count} gefunden</dd>
                </div>
                <div>
                  <dt className="inline font-medium">Spiele:</dt>
                  <dd className="inline ml-2">{parseResult.spiele_count} im Spielplan</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      )}

      {/* DEV Mode Hinweis */}
      {import.meta.env.DEV && (
        <div className="alert-warning mb-6">
          <p className="text-sm">
            <strong>Development Mode:</strong> Es werden Demo-Daten verwendet.
            In Production wird die echte BBB-Website geparst.
          </p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between gap-4 pt-4">
        <button
          type="button"
          onClick={handleBack}
          className="btn-secondary inline-flex items-center gap-2"
          disabled={parsing}
        >
          <ArrowLeft className="w-5 h-5" aria-hidden="true" />
          Zurück
        </button>

        <button
          type="button"
          onClick={handleNext}
          className="btn-primary inline-flex items-center gap-2"
          disabled={!canProceed()}
        >
          Weiter
          <ArrowRight className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
