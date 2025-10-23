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

import React, { useState, useEffect } from 'react';
import { Trash2, AlertTriangle, RefreshCw, Database, ChevronDown, ChevronRight } from 'lucide-react';
import { resetDatabase, db } from '@/shared/db/database';

export function DevTools() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showDbInspector, setShowDbInspector] = useState(false);
  const [dbStats, setDbStats] = useState<Record<string, number>>({});
  
  // Real API Mode Toggle (stored in localStorage)
  const [useRealApi, setUseRealApi] = useState(() => {
    return localStorage.getItem('dev_use_real_api') === 'true';
  });

  const toggleRealApi = () => {
    const newValue = !useRealApi;
    setUseRealApi(newValue);
    localStorage.setItem('dev_use_real_api', String(newValue));
    
    // Dispatch custom event damit Services reagieren können
    window.dispatchEvent(new CustomEvent('dev-api-mode-changed', { 
      detail: { useRealApi: newValue } 
    }));
    
    console.log(`🔄 API Mode changed: ${newValue ? 'REAL API' : 'MOCK DATA'}`);
  };

  // Nur im Dev-Mode anzeigen
  // Prüfe auf Development Environment
  const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development' || process.env.NODE_ENV === 'development';
  
  console.log('DevTools Check:', {
    'import.meta.env.DEV': import.meta.env.DEV,
    'import.meta.env.MODE': import.meta.env.MODE,
    'isDev': isDev
  });
  
  useEffect(() => {
    if (isDev && showDbInspector) {
      loadDbStats();
    }
  }, [isDev, showDbInspector]);

  const loadDbStats = async () => {
    try {
      const stats: Record<string, number> = {
        vereine: await db.vereine.count(),
        teams: await db.teams.count(),
        spieler: await db.spieler.count(),
        spiele: await db.spiele.count(),
        trikots: await db.trikots.count(),
        ligen: await db.ligen.count(),
        liga_teilnahmen: await db.liga_teilnahmen.count(),
        liga_tabellen: await db.liga_tabellen.count(),
        spielplaene: await db.spielplaene.count(),
      };
      setDbStats(stats);
    } catch (error) {
      console.error('Failed to load DB stats:', error);
    }
  };
  
  // Immer anzeigen während wir debuggen
  // TODO: Später wieder auf isDev-Check setzen
  if (false) { // Temporär deaktiviert für Debugging
    return null;
  }

  const handleQuickReset = async () => {
    if (!confirm('⚠️ ACHTUNG: Alle Daten werden gelöscht!\n\nDies kann nicht rückgängig gemacht werden.')) {
      return;
    }
    
    setResetting(true);
    
    try {
      await resetDatabase();
      localStorage.clear();
      sessionStorage.clear();
      console.log('✅ Quick Reset complete - Reloading...');
      window.location.href = '/';
    } catch (error) {
      console.error('❌ Reset failed:', error);
      alert('Reset fehlgeschlagen: ' + (error as Error).message);
      setResetting(false);
    }
  };

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
      <div className="bg-white border-2 border-yellow-500 rounded-b-lg shadow-xl p-4 min-w-[320px]">
        <h3 className="font-bold text-gray-900 mb-3 text-sm flex items-center justify-between">
          <span>Development Tools</span>
          <span className="text-xs font-normal text-gray-500">v1.0</span>
        </h3>

        {/* API Mode Toggle */}
        <div className="mb-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">API Mode</span>
            <button
              onClick={toggleRealApi}
              className={`
                relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                ${useRealApi ? 'bg-blue-600' : 'bg-gray-300'}
              `}
              type="button"
              role="switch"
              aria-checked={useRealApi}
              aria-label="Toggle Real API Mode"
            >
              <span
                className={`
                  inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                  ${useRealApi ? 'translate-x-6' : 'translate-x-1'}
                `}
              />
            </button>
          </div>
          <div className="text-xs space-y-1">
            <div className="flex items-center gap-2">
              <span className={useRealApi ? 'font-bold text-blue-700' : 'text-gray-500'}>
                ⚡ Real API
              </span>
              <span className="text-gray-400">|</span>
              <span className={!useRealApi ? 'font-bold text-gray-700' : 'text-gray-500'}>
                🎭 Mock Data
              </span>
            </div>
            <p className="text-gray-600 italic">
              {useRealApi 
                ? 'Verwendet echte DBB-API (CORS-Proxies)' 
                : 'Verwendet lokale Mock-Daten'}
            </p>
          </div>
        </div>

        {/* DB Inspector Toggle */}
        <button
          onClick={() => setShowDbInspector(!showDbInspector)}
          className="w-full mb-3 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium text-gray-700 flex items-center justify-between"
          type="button"
        >
          <span className="flex items-center gap-2">
            <Database className="w-4 h-4" aria-hidden="true" />
            DB Inspector
          </span>
          {showDbInspector ? (
            <ChevronDown className="w-4 h-4" aria-hidden="true" />
          ) : (
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          )}
        </button>

        {/* DB Stats */}
        {showDbInspector && (
          <div className="mb-3 p-3 bg-gray-50 rounded text-xs space-y-1">
            {Object.entries(dbStats).map(([table, count]) => (
              <div key={table} className="flex justify-between">
                <span className="text-gray-600">{table}:</span>
                <span className="font-mono font-bold text-gray-900">{count}</span>
              </div>
            ))}
            <button
              onClick={loadDbStats}
              className="mt-2 w-full px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 text-xs flex items-center justify-center gap-1"
              type="button"
            >
              <RefreshCw className="w-3 h-3" aria-hidden="true" />
              Aktualisieren
            </button>
          </div>
        )}

        {/* Quick Actions */}
        <div className="space-y-2 mb-3">
          <button
            onClick={handleQuickReset}
            disabled={resetting}
            className="w-full px-3 py-2 bg-red-50 hover:bg-red-100 border border-red-200 rounded text-sm font-medium text-red-700 flex items-center justify-center gap-2 transition-colors"
            type="button"
            title="Schnelles Zurücksetzen mit Bestätigung"
          >
            {resetting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" />
                Lösche...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" aria-hidden="true" />
                Quick Reset
              </>
            )}
          </button>
        </div>

        {/* Reset Button */}
        {!showConfirm ? (
          <details className="group">
            <summary className="cursor-pointer list-none">
              <div className="w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium text-gray-700 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600" aria-hidden="true" />
                  Erweiterte Optionen
                </span>
                <ChevronRight className="w-4 h-4 group-open:rotate-90 transition-transform" aria-hidden="true" />
              </div>
            </summary>
            <div className="mt-2 p-3 bg-gray-50 rounded space-y-2">
              <button
                onClick={() => setShowConfirm(true)}
                className="w-full btn-danger inline-flex items-center justify-center gap-2 text-sm"
                type="button"
              >
                <Trash2 className="w-4 h-4" aria-hidden="true" />
                Alle Daten löschen (mit Info)
              </button>
            </div>
          </details>
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
        <p className="text-xs text-gray-500 mt-3 text-center border-t border-gray-200 pt-3">
          Diese Tools sind nur im Dev-Mode sichtbar
        </p>
      </div>
    </div>
  );
}
