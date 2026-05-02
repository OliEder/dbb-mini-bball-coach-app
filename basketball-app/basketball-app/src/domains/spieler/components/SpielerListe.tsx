/**
 * SpielerListe - Übersicht aller Spieler eines Teams
 * 
 * WCAG 2.0 AA Compliance:
 * - Keyboard Navigation (Tab, Enter, Space)
 * - Screen Reader Support (aria-labels, roles)
 * - Touch Targets min. 44x44px
 * - Kontrastverhältnis 4.5:1
 * - Focus Indicators (2px outline, 2px offset)
 */

import React, { useState, useEffect } from 'react';
import { spielerService } from '../services/SpielerService';
import type { Spieler } from '@/shared/types';
import { Users, Search, Plus, Edit2, Trash2, UserCheck, UserX } from 'lucide-react';

interface SpielerListeProps {
  teamId: string;
  onEdit?: (spieler: Spieler) => void;
  onAdd?: () => void;
}

export function SpielerListe({ teamId, onEdit, onAdd }: SpielerListeProps) {
  const [spieler, setSpieler] = useState<Spieler[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAktiv, setFilterAktiv] = useState<boolean | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSpieler();
  }, [teamId, filterAktiv]);

  const loadSpieler = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filter = filterAktiv !== undefined ? { aktiv: filterAktiv } : undefined;
      const data = await spielerService.getSpielerByTeam(teamId, filter);
      
      setSpieler(data);
    } catch (err) {
      setError('Fehler beim Laden der Spieler');
      console.error('Error loading spieler:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    
    if (term.trim().length === 0) {
      await loadSpieler();
      return;
    }

    try {
      const results = await spielerService.searchSpieler(teamId, term);
      setSpieler(results);
    } catch (err) {
      console.error('Error searching spieler:', err);
    }
  };

  const handleDelete = async (spielerId: string) => {
    if (!confirm('Möchten Sie diesen Spieler wirklich löschen?')) {
      return;
    }

    try {
      await spielerService.deleteSpieler(spielerId);
      await loadSpieler();
    } catch (err) {
      setError('Fehler beim Löschen des Spielers');
      console.error('Error deleting spieler:', err);
    }
  };

  const formatGeburtsdatum = (date?: Date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('de-DE');
  };

  const getAlter = (geburtsdatum?: Date): string => {
    if (!geburtsdatum) return '-';
    const today = new Date();
    const birthDate = new Date(geburtsdatum);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return `${age} Jahre`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div 
          className="animate-pulse text-gray-400"
          role="status"
          aria-live="polite"
        >
          Lade Spieler...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-8 h-8 text-primary-600" aria-hidden="true" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Spieler
            </h2>
            <p className="text-sm text-gray-600">
              {spieler.length} Spieler gefunden
            </p>
          </div>
        </div>
        
        {onAdd && (
          <button
            onClick={onAdd}
            className="btn-primary"
            aria-label="Neuen Spieler hinzufügen"
          >
            <Plus className="w-5 h-5" aria-hidden="true" />
            <span>Spieler hinzufügen</span>
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div 
          className="alert-error" 
          role="alert"
          aria-live="assertive"
        >
          {error}
        </div>
      )}

      {/* Search and Filter */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <label htmlFor="spieler-search" className="sr-only">
              Spieler suchen
            </label>
            <div className="relative">
              <Search 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                aria-hidden="true"
              />
              <input
                id="spieler-search"
                type="text"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Spieler suchen..."
                className="input-field pl-10"
                aria-label="Nach Spielern suchen"
              />
            </div>
          </div>

          {/* Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilterAktiv(undefined)}
              className={filterAktiv === undefined ? 'btn-primary' : 'btn-secondary'}
              aria-pressed={filterAktiv === undefined}
              aria-label="Alle Spieler anzeigen"
            >
              Alle
            </button>
            <button
              onClick={() => setFilterAktiv(true)}
              className={filterAktiv === true ? 'btn-primary' : 'btn-secondary'}
              aria-pressed={filterAktiv === true}
              aria-label="Nur aktive Spieler anzeigen"
            >
              <UserCheck className="w-4 h-4" aria-hidden="true" />
              Aktiv
            </button>
            <button
              onClick={() => setFilterAktiv(false)}
              className={filterAktiv === false ? 'btn-primary' : 'btn-secondary'}
              aria-pressed={filterAktiv === false}
              aria-label="Nur inaktive Spieler anzeigen"
            >
              <UserX className="w-4 h-4" aria-hidden="true" />
              Inaktiv
            </button>
          </div>
        </div>
      </div>

      {/* Spieler Liste */}
      {spieler.length === 0 ? (
        <div className="card text-center py-12">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" aria-hidden="true" />
          <p className="text-gray-600">
            {searchTerm ? 'Keine Spieler gefunden' : 'Noch keine Spieler vorhanden'}
          </p>
          {onAdd && !searchTerm && (
            <button
              onClick={onAdd}
              className="btn-primary mt-4"
              aria-label="Ersten Spieler hinzufügen"
            >
              <Plus className="w-5 h-5" aria-hidden="true" />
              <span>Ersten Spieler hinzufügen</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {spieler.map((s) => (
            <article
              key={s.spieler_id}
              className="card hover:shadow-lg transition-shadow"
              aria-labelledby={`spieler-name-${s.spieler_id}`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 
                    id={`spieler-name-${s.spieler_id}`}
                    className="text-lg font-semibold text-gray-900"
                  >
                    {s.vorname} {s.nachname}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {getAlter(s.geburtsdatum)}
                  </p>
                </div>
                
                {/* Status Badge */}
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    s.aktiv
                      ? 'bg-success-100 text-success-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                  aria-label={s.aktiv ? 'Aktiver Spieler' : 'Inaktiver Spieler'}
                >
                  {s.aktiv ? 'Aktiv' : 'Inaktiv'}
                </span>
              </div>

              {/* Details */}
              <dl className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <dt className="text-gray-600">Geburtsdatum:</dt>
                  <dd className="font-medium text-gray-900">
                    {formatGeburtsdatum(s.geburtsdatum)}
                  </dd>
                </div>
                
                {s.mitgliedsnummer && (
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Mitgliedsnr:</dt>
                    <dd className="font-medium text-gray-900">
                      {s.mitgliedsnummer}
                    </dd>
                  </div>
                )}
                
                {s.tna_nr && (
                  <div className="flex justify-between">
                    <dt className="text-gray-600">TNA:</dt>
                    <dd className="font-medium text-gray-900">
                      {s.tna_nr}
                    </dd>
                  </div>
                )}
                
                {s.konfektionsgroesse_jersey && (
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Trikot:</dt>
                    <dd className="font-medium text-gray-900">
                      {s.konfektionsgroesse_jersey}
                    </dd>
                  </div>
                )}
              </dl>

              {/* Actions */}
              <div className="flex gap-2 pt-3 border-t border-gray-200">
                {onEdit && (
                  <button
                    onClick={() => onEdit(s)}
                    className="flex-1 btn-secondary text-sm"
                    aria-label={`${s.vorname} ${s.nachname} bearbeiten`}
                  >
                    <Edit2 className="w-4 h-4" aria-hidden="true" />
                    <span>Bearbeiten</span>
                  </button>
                )}
                
                <button
                  onClick={() => handleDelete(s.spieler_id)}
                  className="btn-secondary text-sm text-error-600 hover:bg-error-50"
                  aria-label={`${s.vorname} ${s.nachname} löschen`}
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
