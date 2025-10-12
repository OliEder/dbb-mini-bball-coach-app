/**
 * Dev Tools Component
 * 
 * Nur sichtbar im Development Mode
 * Bietet Entwickler-Tools wie Database Reset
 * 
 * WCAG 2.0 AA:
 * - Klare Bestätigungsdialoge
 * - Warnfarben für destruktive Aktionen
 */

import React, { useState } from 'react';
import { Trash2, AlertTriangle, RefreshCw } from 'lucide-react';
import { resetDatabase } from '@/shared/db/database';

export function DevTools() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Nur im Dev-Mode anzeigen
  // Test-Environment wird als Production behandelt
  const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV;
  
  if (!isDev) {
    return null;
  }

  const handleReset = async () => {
    setResetting(true);
    
    try {
      // Datenbank löschen
      await resetDatabase();
      
      // LocalStorage leeren
      localStorage.clear();
      
      // SessionStorage leeren
      sessionStorage.clear();
      
      console.log('✅ Dev Reset complete - Reloading app...');
      
      // App neu laden (zum Onboarding)
      window.location.href = '/';
      
    } catch (error) {
      console.error('❌ Reset failed:', error);
      alert('Reset fehlgeschlagen: ' + (error as Error).message);
      setResetting(false);
      setShowConfirm(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Dev Tools Badge */}
      <div className="bg-yellow-500 text-white px-3 py-1 rounded-t-lg text-xs font-mono font-bold shadow-lg">
        🛠️ DEV MODE
      </div>
      
      {/* Tools Panel */}
      <div className="bg-white border-2 border-yellow-500 rounded-b-lg shadow-xl p-4 min-w-[280px]">
        <h3 className="font-bold text-gray-900 mb-3 text-sm">
          Development Tools
        </h3>

        {/* Reset Button */}
        {!showConfirm ? (
          <button
            onClick={() => setShowConfirm(true)}
            className="w-full btn-danger inline-flex items-center justify-center gap-2 text-sm"
            type="button"
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
            Alle Daten löschen
          </button>
        ) : (
          <div className="space-y-3">
            {/* Warning */}
            <div className="alert-error p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div className="text-sm">
                  <p className="font-bold mb-1">Achtung!</p>
                  <p>Dies löscht ALLE Daten:</p>
                  <ul className="list-disc list-inside mt-2 text-xs space-y-1">
                    <li>Datenbank (Teams, Spieler, etc.)</li>
                    <li>LocalStorage</li>
                    <li>SessionStorage</li>
                  </ul>
                  <p className="mt-2 font-bold">
                    Die App startet danach neu.
                  </p>
                </div>
              </div>
            </div>

            {/* Confirm Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={resetting}
                className="flex-1 btn-secondary text-sm"
                type="button"
              >
                Abbrechen
              </button>
              <button
                onClick={handleReset}
                disabled={resetting}
                className="flex-1 btn-danger inline-flex items-center justify-center gap-2 text-sm"
                type="button"
              >
                {resetting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" />
                    Lösche...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                    Bestätigen
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Info */}
        <p className="text-xs text-gray-500 mt-3 text-center">
          Diese Tools sind nur im Dev-Mode sichtbar
        </p>
      </div>
    </div>
  );
}
