/**
 * Spieler Import Step - KORRIGIERT
 * 
 * CSV-Import für Spieler mit Validation und Feedback
 * Zurück-Button geht zu team_select
 */

import React, { useState } from 'react';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { csvImportService } from '../services/CSVImportService';
import { ArrowRight, ArrowLeft, Upload, Download, CheckCircle, AlertCircle } from 'lucide-react';

export function SpielerImportStep() {
  const { spieler_csv, setSpielerCSV, setStep, parsed_liga_data, selected_team_name } = useOnboardingStore();
  
  const [file, setFile] = useState<File | null>(spieler_csv || null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    count: number;
    errors: string[];
    warnings: string[];
  } | null>(null);

  // Team-ID wird später beim Complete-Step erstellt
  // Hier verwenden wir einen temporären Platzhalter
  const tempTeamId = 'temp-team-id';

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setSpielerCSV(selected);
      setResult(null);
    }
  };

  const handleDownloadTemplate = () => {
    const csv = csvImportService.generateSpielerTemplate();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'spieler_vorlage.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportPreview = async () => {
    if (!file) return;

    setImporting(true);
    try {
      // Validierungs-Import (wird später beim Complete nochmal ausgeführt)
      const importResult = await csvImportService.importSpieler(file, tempTeamId);
      
      setResult({
        success: importResult.success,
        count: importResult.data.length,
        errors: importResult.errors,
        warnings: importResult.warnings,
      });
    } catch (error) {
      setResult({
        success: false,
        count: 0,
        errors: [(error as Error).message],
        warnings: [],
      });
    } finally {
      setImporting(false);
    }
  };

  const handleNext = () => {
    setStep('trikots');
  };

  const handleBack = () => {
    setStep('team_select');
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Spieler importieren
      </h2>
      <p className="text-gray-600 mb-2">
        Importiere deine Spieler-Liste als CSV-Datei.
      </p>
      <p className="text-sm text-gray-500 mb-6">
        Team: <strong>{selected_team_name}</strong>
      </p>

      {/* Template Download */}
      <div className="alert-info mb-6">
        <p className="font-medium mb-2">Noch keine CSV-Datei?</p>
        <button
          type="button"
          onClick={handleDownloadTemplate}
          className="btn-secondary inline-flex items-center gap-2"
        >
          <Download className="w-4 h-4" aria-hidden="true" />
          Vorlage herunterladen
        </button>
      </div>

      {/* File Upload */}
      <div className="mb-6">
        <label htmlFor="spieler-csv" className="label label-required">
          CSV-Datei auswählen
        </label>
        <input
          id="spieler-csv"
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="block w-full text-sm text-gray-900 border-2 border-gray-300 rounded-lg cursor-pointer bg-white focus:outline-none focus:border-primary-600 file:mr-4 file:py-2 file:px-4 file:border-0 file:bg-primary-50 file:text-primary-700 file:font-medium hover:file:bg-primary-100"
        />
        {file && (
          <p className="mt-2 text-sm text-gray-600">
            <strong>Ausgewählt:</strong> {file.name}
          </p>
        )}
      </div>

      {/* Import Preview Button */}
      {file && !result && (
        <button
          type="button"
          onClick={handleImportPreview}
          disabled={importing}
          className="btn-primary inline-flex items-center gap-2 mb-6"
        >
          <Upload className="w-4 h-4" aria-hidden="true" />
          {importing ? 'Validiere...' : 'Vorschau & Validieren'}
        </button>
      )}

      {/* Import Result */}
      {result && (
        <div className={`p-4 rounded-lg border-2 mb-6 ${
          result.success ? 'bg-success-50 border-success-600' : 'bg-error-50 border-error-600'
        }`}>
          <div className="flex items-start gap-3">
            {result.success ? (
              <CheckCircle className="w-6 h-6 text-success-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-6 h-6 text-error-600 flex-shrink-0" />
            )}
            <div className="flex-1">
              <h3 className={`font-semibold mb-2 ${
                result.success ? 'text-success-900' : 'text-error-900'
              }`}>
                {result.success 
                  ? `✅ ${result.count} Spieler validiert!`
                  : '❌ Validierung fehlgeschlagen'
                }
              </h3>

              {result.success && (
                <p className="text-sm text-success-800 mb-2">
                  Die Spieler werden beim Abschluss des Onboardings importiert.
                </p>
              )}

              {result.errors.length > 0 && (
                <div className="mb-3">
                  <p className="font-medium text-error-900 mb-1">Fehler:</p>
                  <ul className="list-disc list-inside text-sm text-error-800 space-y-1">
                    {result.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.warnings.length > 0 && (
                <div>
                  <p className="font-medium text-warning-900 mb-1">Warnungen:</p>
                  <ul className="list-disc list-inside text-sm text-warning-800 space-y-1">
                    {result.warnings.map((warn, i) => (
                      <li key={i}>{warn}</li>
                    ))}
                  </ul>
                </div>
              )}

              {!result.success && (
                <button
                  type="button"
                  onClick={() => {
                    setResult(null);
                    setFile(null);
                  }}
                  className="mt-3 text-sm font-medium text-error-700 hover:text-error-800 underline"
                >
                  Andere Datei wählen
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between gap-4 pt-4">
        <button
          type="button"
          onClick={handleBack}
          className="btn-secondary inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" aria-hidden="true" />
          Zurück
        </button>

        <button
          type="button"
          onClick={handleNext}
          className="btn-primary inline-flex items-center gap-2"
          disabled={!result?.success}
        >
          Weiter
          <ArrowRight className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
