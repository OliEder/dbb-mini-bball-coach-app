/**
 * Simplified Verein Step
 * 
 * - Optionaler Verband-Filter
 * - Suchfeld
 * - Alphabetisch sortierte Liste aller Vereine
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Search, Building2, ChevronDown, Loader2 } from 'lucide-react';
import { clubDataLoader, type ClubEntry } from '@shared/services/ClubDataLoader';
import type { Verein } from '@shared/types';

interface SimplifiedVereinStepProps {
  verbandFilter: number | null;
  onVerbandFilterChange: (verbandId: number | null) => void;
  onNext: (verein: Verein, clubId: string) => void;
  onBack: () => void;
}

const VERBAENDE = [
  { id: null, name: 'Alle Verbände' },
  { id: 1, name: 'Baden-Württemberg' },
  { id: 2, name: 'Bayern' },
  { id: 3, name: 'Berlin' },
  { id: 4, name: 'Brandenburg' },
  { id: 5, name: 'Bremen' },
  { id: 6, name: 'Hamburg' },
  { id: 7, name: 'Hessen' },
  { id: 8, name: 'Mecklenburg-Vorpommern' },
  { id: 9, name: 'Niedersachsen' },
  { id: 10, name: 'Nordrhein-Westfalen' },
  { id: 11, name: 'Rheinland-Pfalz' },
  { id: 12, name: 'Saarland' },
  { id: 13, name: 'Sachsen' },
  { id: 14, name: 'Sachsen-Anhalt' },
  { id: 15, name: 'Schleswig-Holstein' },
  { id: 16, name: 'Thüringen' }
];

export const SimplifiedVereinStep: React.FC<SimplifiedVereinStepProps> = ({
  verbandFilter,
  onVerbandFilterChange,
  onNext,
  onBack
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVerein, setSelectedVerein] = useState<Verein | null>(null);
  const [vereine, setVereine] = useState<ClubEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load alle Vereine
  useEffect(() => {
    const loadVereine = async () => {
      setIsLoading(true);
      setLoadError(null);
      
      try {
        const allClubs = await clubDataLoader.loadAllClubs();
        setVereine(allClubs);
      } catch (error) {
        console.error('Failed to load vereine:', error);
        setLoadError('Vereine konnten nicht geladen werden');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadVereine();
  }, []);

  // Filter + Search
  const filteredVereine = useMemo(() => {
    let filtered = vereine;
    
    // Verband-Filter
    if (verbandFilter !== null) {
      filtered = filtered.filter(({ verein }) => 
        verein.verband_ids?.includes(verbandFilter)
      );
    }
    
    // Search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(({ verein }) =>
        verein.name.toLowerCase().includes(query) ||
        verein.kurzname?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [vereine, verbandFilter, searchQuery]);

  const handleSubmit = () => {
    if (selectedVerein) {
      const entry = vereine.find(v => v.verein.verein_id === selectedVerein.verein_id);
      if (entry) {
        onNext(entry.verein, entry.clubId);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Vereine werden geladen...</p>
          <p className="text-sm text-gray-500 mt-2">
            Bitte habe einen Moment Geduld
          </p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="text-red-600 mb-4">⚠️</div>
          <h2 className="text-xl font-bold mb-2">Fehler beim Laden</h2>
          <p className="text-gray-600 mb-4">{loadError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Neu laden
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Wähle deinen Verein
          </h1>
          <p className="text-gray-600">
            {vereine.length.toLocaleString()} Vereine verfügbar
          </p>
        </div>

        {/* Verband Filter (Optional) */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Verband (optional)
          </label>
          <div className="relative">
            <select
              value={verbandFilter || ''}
              onChange={(e) => onVerbandFilterChange(e.target.value ? Number(e.target.value) : null)}
              className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              {VERBAENDE.map(v => (
                <option key={v.id || 'all'} value={v.id || ''}>
                  {v.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Search */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Verein suchen
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="z.B. Bayern München"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4 text-sm text-gray-600">
          {filteredVereine.length === vereine.length ? (
            <span>Alle {vereine.length.toLocaleString()} Vereine</span>
          ) : (
            <span>{filteredVereine.length.toLocaleString()} von {vereine.length.toLocaleString()} Vereinen</span>
          )}
        </div>

        {/* Vereine List */}
        <div className="mb-6 max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
          {filteredVereine.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Keine Vereine gefunden</p>
              <p className="text-sm mt-1">Versuche einen anderen Suchbegriff</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredVereine.map(({ verein, clubId }) => (
                <label
                  key={verein.verein_id}
                  className={`flex items-center p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                    selectedVerein?.verein_id === verein.verein_id ? 'bg-blue-50' : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="verein"
                    checked={selectedVerein?.verein_id === verein.verein_id}
                    onChange={() => setSelectedVerein(verein)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="ml-3 flex-1">
                    <p className="font-medium text-gray-900">{verein.name}</p>
                    {verein.kurzname !== verein.name && (
                      <p className="text-sm text-gray-500">{verein.kurzname}</p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            ← Zurück
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedVerein}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Weiter →
          </button>
        </div>
      </div>
    </div>
  );
};
