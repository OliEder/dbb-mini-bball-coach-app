/**
 * Settings Component - App-Einstellungen mit Reset und Backup
 * 
 * Features:
 * - App-Reset mit mehrfacher Bestätigung
 * - Daten-Backup (Export als JSON)
 * - Daten-Wiederherstellung (Import von JSON)
 * - GDPR-konform
 * 
 * WCAG 2.0 AA:
 * - Klare Warnungen
 * - Große Touch-Targets
 * - Keyboard-Navigation
 */

import React, { useState } from 'react';
import { 
  Settings, 
  AlertTriangle, 
  Download, 
  Upload, 
  RefreshCcw,
  Shield,
  Info,
  CheckCircle,
  XCircle,
  Trash2,
  Save
} from 'lucide-react';
import { db } from '@/shared/db/database';
import { useAppStore } from '@/stores/appStore';
import { useNavigate } from 'react-router-dom';

export function SettingsView() {
  const navigate = useNavigate();
  const reset = useAppStore(state => state.reset);
  
  // Reset States
  const [showResetWarning, setShowResetWarning] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  
  // Backup States
  const [backupStatus, setBackupStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [backupMessage, setBackupMessage] = useState('');
  
  // Import States
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [importMessage, setImportMessage] = useState('');

  // 🗑️ RESET FUNKTIONEN
  const handleResetClick = () => {
    setShowResetWarning(true);
    setResetConfirmText('');
  };

  const handleResetCancel = () => {
    setShowResetWarning(false);
    setResetConfirmText('');
  };

  const handleResetConfirm = async () => {
    // Doppelte Sicherheit: User muss "RESET" eintippen
    if (resetConfirmText !== 'RESET') {
      setBackupMessage('Bitte tippen Sie RESET zur Bestätigung');
      return;
    }

    setIsResetting(true);
    
    try {
      // Optional: Auto-Backup vor Reset
      await createBackup(true);
      
      // Database löschen
      await db.delete();
      await db.open();
      
      // LocalStorage löschen
      localStorage.clear();
      sessionStorage.clear();
      
      // Store reset
      reset();
      
      // Zur Startseite navigieren
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
      
    } catch (error) {
      console.error('Reset fehlgeschlagen:', error);
      setBackupMessage('Reset fehlgeschlagen. Bitte versuchen Sie es erneut.');
      setIsResetting(false);
    }
  };

  // 💾 BACKUP FUNKTIONEN
  const createBackup = async (silent = false) => {
    try {
      if (!silent) {
        setBackupStatus('idle');
        setBackupMessage('Erstelle Backup...');
      }

      // Sammle alle Daten
      const backupData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        appVersion: '2.0.0',
        data: {
          teams: await db.teams.toArray(),
          spieler: await db.spieler.toArray(),
          spiele: await db.spiele.toArray(),
          liga_tabellen: await db.liga_tabellen.toArray(),
          einsaetze: await db.einsaetze.toArray(),
        },
        store: {
          currentTeamId: useAppStore.getState().currentTeamId,
          myTeamIds: useAppStore.getState().myTeamIds,
          hasCompletedOnboarding: useAppStore.getState().hasCompletedOnboarding,
        }
      };

      // JSON erstellen
      const json = JSON.stringify(backupData, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      
      // Download triggern
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const date = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `basketball-app-backup-${date}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      if (!silent) {
        setBackupStatus('success');
        setBackupMessage('Backup erfolgreich erstellt!');
        setTimeout(() => setBackupStatus('idle'), 3000);
      }
      
      return true;
    } catch (error) {
      console.error('Backup fehlgeschlagen:', error);
      if (!silent) {
        setBackupStatus('error');
        setBackupMessage('Backup fehlgeschlagen: ' + (error as Error).message);
      }
      return false;
    }
  };

  // 📥 IMPORT FUNKTIONEN
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportStatus('idle');
    setImportMessage('Importiere Backup...');

    try {
      // Datei lesen
      const text = await file.text();
      const backupData = JSON.parse(text);

      // Validierung
      if (!backupData.version || !backupData.data) {
        throw new Error('Ungültiges Backup-Format');
      }

      // Warnung bei altem Backup
      const backupDate = new Date(backupData.timestamp);
      const daysSinceBackup = Math.floor((Date.now() - backupDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceBackup > 30) {
        if (!confirm(`Dieses Backup ist ${daysSinceBackup} Tage alt. Trotzdem importieren?`)) {
          setImportStatus('idle');
          return;
        }
      }

      // Datenbank leeren
      await db.teams.clear();
      await db.spieler.clear();
      await db.spiele.clear();
      await db.liga_tabellen.clear();
      await db.einsaetze.clear();

      // Daten importieren
      if (backupData.data.teams?.length > 0) {
        await db.teams.bulkAdd(backupData.data.teams);
      }
      if (backupData.data.spieler?.length > 0) {
        await db.spieler.bulkAdd(backupData.data.spieler);
      }
      if (backupData.data.spiele?.length > 0) {
        await db.spiele.bulkAdd(backupData.data.spiele);
      }
      if (backupData.data.liga_tabellen?.length > 0) {
        await db.liga_tabellen.bulkAdd(backupData.data.liga_tabellen);
      }
      if (backupData.data.einsaetze?.length > 0) {
        await db.einsaetze.bulkAdd(backupData.data.einsaetze);
      }

      // Store wiederherstellen
      if (backupData.store) {
        const appStore = useAppStore.getState();
        if (backupData.store.myTeamIds) {
          appStore.setMyTeams(backupData.store.myTeamIds);
        }
        if (backupData.store.currentTeamId) {
          appStore.setCurrentTeam(backupData.store.currentTeamId);
        }
        appStore.completeOnboarding();
      }

      setImportStatus('success');
      setImportMessage('Backup erfolgreich importiert! Seite wird neu geladen...');
      
      // Neu laden nach 2 Sekunden
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error) {
      console.error('Import fehlgeschlagen:', error);
      setImportStatus('error');
      setImportMessage('Import fehlgeschlagen: ' + (error as Error).message);
    }

    // Input zurücksetzen
    event.target.value = '';
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Settings className="w-6 h-6" />
        Einstellungen
      </h2>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm text-blue-800">
              Hier können Sie Ihre App-Daten verwalten. Erstellen Sie regelmäßig Backups, 
              um Ihre Daten zu sichern. Der Reset löscht alle Daten unwiderruflich.
            </p>
          </div>
        </div>
      </div>

      {/* Backup Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Datensicherung
        </h3>

        <div className="space-y-4">
          {/* Backup erstellen */}
          <div>
            <button
              onClick={() => createBackup()}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-5 h-5" />
              Backup erstellen
            </button>
            {backupStatus === 'success' && (
              <p className="mt-2 text-sm text-green-600 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                {backupMessage}
              </p>
            )}
            {backupStatus === 'error' && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <XCircle className="w-4 h-4" />
                {backupMessage}
              </p>
            )}
          </div>

          {/* Backup wiederherstellen */}
          <div>
            <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer inline-flex">
              <Upload className="w-5 h-5" />
              Backup wiederherstellen
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>
            {importStatus === 'success' && (
              <p className="mt-2 text-sm text-green-600 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                {importMessage}
              </p>
            )}
            {importStatus === 'error' && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <XCircle className="w-4 h-4" />
                {importMessage}
              </p>
            )}
            <p className="mt-2 text-xs text-gray-500">
              Wählen Sie eine zuvor erstellte Backup-Datei (.json)
            </p>
          </div>
        </div>
      </div>

      {/* Reset Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          Gefährliche Aktionen
        </h3>

        {!showResetWarning ? (
          <div>
            <button
              onClick={handleResetClick}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-5 h-5" />
              App zurücksetzen
            </button>
            <p className="mt-2 text-sm text-gray-600">
              Löscht alle Daten und setzt die App auf den Anfangszustand zurück.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Warnung */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertTriangle className="w-6 h-6 text-red-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-900">Achtung: Alle Daten werden gelöscht!</h4>
                  <p className="text-sm text-red-700 mt-1">
                    Diese Aktion kann nicht rückgängig gemacht werden. Alle Teams, Spieler, 
                    Spielpläne und sonstige Daten werden unwiderruflich gelöscht.
                  </p>
                  <p className="text-sm text-red-700 mt-2 font-semibold">
                    Ein automatisches Backup wird vor dem Reset erstellt.
                  </p>
                </div>
              </div>
            </div>

            {/* Bestätigung */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tippen Sie <span className="font-bold text-red-600">RESET</span> zur Bestätigung:
              </label>
              <input
                type="text"
                value={resetConfirmText}
                onChange={(e) => setResetConfirmText(e.target.value)}
                placeholder="RESET eingeben"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                disabled={isResetting}
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleResetConfirm}
                disabled={resetConfirmText !== 'RESET' || isResetting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isResetting ? (
                  <>
                    <RefreshCcw className="w-5 h-5 animate-spin inline mr-2" />
                    Reset läuft...
                  </>
                ) : (
                  'Jetzt zurücksetzen'
                )}
              </button>
              <button
                onClick={handleResetCancel}
                disabled={isResetting}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 transition-colors"
              >
                Abbrechen
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Weitere Einstellungen können hier ergänzt werden */}
      <div className="mt-8 text-sm text-gray-500 text-center">
        Basketball Team Manager v2.0.0 • © 2025
      </div>
    </div>
  );
}
