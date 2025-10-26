/**
 * Verein Step v3 - Onboarding (Lokale Club-Daten)
 * 
 * Nutzt lokale clubs-metadata.json statt API-Calls
 * Schnellere Suche, Offline-fähig
 */

import React, { useState, useMemo } from 'react';
import { Building2, Search, Info, Users, MapPin } from 'lucide-react';
import { clubDataService, type ClubMetadata } from '@shared/services/ClubDataService';
import type { Verein } from '@shared/types';

interface VereinStepV3Props {
  selectedVerbaende: number[]; // Aus VerbandStep
  initialSelection?: Verein | null;
  onNext: (verein: Verein, clubId: string) => void;
  onBack: () => void;
}

export const VereinStepV3: React.FC<VereinStepV3Props> = ({ 
  selectedVerbaende,
  initialSelection,
  onNext, 
  onBack 
}) => {
  const [selectedClubId, setSelectedClubId] = useState<string | null>(
    initialSelection?.extern_verein_id || null
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [newVereinName, setNewVereinName] = useState('');
  
  // Lade Clubs für gewählte Verbände (aus lokalen Daten!)
  const clubs = useMemo(() => {
    if (searchTerm) {
      return clubDataService.searchClubs(searchTerm, selectedVerbaende);
    }
    return clubDataService.getClubsByVerbaende(selectedVerbaende);
  }, [selectedVerbaende, searchTerm]);

  // Sortiere nach Team-Anzahl (größere Vereine zuerst)
  const sortedClubs = useMemo(() => {
    return [...clubs].sort((a, b) => b.teamCount - a.teamCount);
  }, [clubs]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedClubId) return;
    
    // Neuer Verein anlegen
    if (selectedClubId === '__new__') {
      if (!newVereinName.trim()) {
        alert('Bitte geben Sie einen Vereinsnamen ein');
        return;
      }
      
      const vereinData: Verein = {
        verein_id: crypto.randomUUID(),
        extern_verein_id: undefined,
        name: newVereinName.trim(),
        ist_eigener_verein: true,
        created_at: new Date()
      };
      
      onNext(vereinData, '__new__');
      return;
    }
    
    // Bestehender Verein
    const selectedClub = clubs.find(c => c.id === selectedClubId);
    if (!selectedClub) return;
    
    const vereinData: Verein = {
      verein_id: crypto.randomUUID(),
      extern_verein_id: selectedClubId,
      name: selectedClub.name,
      ist_eigener_verein: true,
      created_at: new Date()
    };
    
    onNext(vereinData, selectedClubId);
  };

  const stats = clubDataService.getStats();
  
  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <Building2 className="h-8 w-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Wählen Sie Ihren Verein
        </h2>
        <p className="text-gray-600">
          {sortedClubs.length} Vereine gefunden
          {selectedVerbaende.length > 0 && ` (aus ${selectedVerbaende.length} ${selectedVerbaende.length === 1 ? 'Verband' : 'Verbänden'})`}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          🚀 Lokale Daten • {stats.totalClubs.toLocaleString()} Clubs • Offline-fähig
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
        {/* Info-Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-semibold text-blue-800 mb-1">
                Verein nicht gefunden?
              </p>
              <p className="text-blue-700">
                Nutzen Sie die Suche oder wählen Sie "Neuen Verein anlegen"
              </p>
            </div>
          </div>
        </div>
        
        {/* Suchfeld */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Verein suchen (z.B. Bayern, München, ...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md 
                        focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>
        </div>
        
        {/* Vereine-Liste */}
        <div className="space-y-2 max-h-96 overflow-y-auto mb-6">
          {sortedClubs.slice(0, 50).map((club) => (
            <label
              key={club.id}
              className={`flex items-start p-4 border-2 rounded-lg cursor-pointer 
                         transition-all hover:bg-gray-50
                         ${selectedClubId === club.id 
                           ? 'border-blue-500 bg-blue-50' 
                           : 'border-gray-200'}`}
            >
              <input
                type="radio"
                name="verein"
                value={club.id}
                checked={selectedClubId === club.id}
                onChange={() => setSelectedClubId(club.id)}
                className="mt-1 mr-3"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-800">
                  {club.name}
                </div>
                <div className="text-sm text-gray-600 mt-1 flex items-center gap-3">
                  <span className="flex items-center">
                    <Users className="inline h-3 w-3 mr-1" />
                    {club.teamCount} {club.teamCount === 1 ? 'Team' : 'Teams'}
                  </span>
                  {club.verbandIds.length > 1 && (
                    <span className="flex items-center text-gray-500">
                      <MapPin className="inline h-3 w-3 mr-1" />
                      {club.verbandIds.length} Verbände
                    </span>
                  )}
                </div>
              </div>
            </label>
          ))}
          
          {sortedClubs.length > 50 && (
            <div className="text-center py-2 text-sm text-gray-500">
              ... und {sortedClubs.length - 50} weitere Vereine.
              <br />
              Nutzen Sie die Suche, um gezielt zu filtern.
            </div>
          )}
          
          {/* Option: Neuen Verein anlegen */}
          <div className="border-t pt-4 mt-4">
            <label
              className={`flex items-start p-4 border-2 rounded-lg cursor-pointer 
                         transition-all hover:bg-gray-50 border-dashed
                         ${selectedClubId === '__new__' 
                           ? 'border-green-500 bg-green-50' 
                           : 'border-gray-300'}`}
            >
              <input
                type="radio"
                name="verein"
                value="__new__"
                checked={selectedClubId === '__new__'}
                onChange={() => setSelectedClubId('__new__')}
                className="mt-1 mr-3"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-800">
                  ➕ Neuen Verein anlegen
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Falls Ihr Verein nicht in der Liste ist
                </div>
              </div>
            </label>
          </div>
        </div>
        
        {sortedClubs.length === 0 && searchTerm && (
          <div className="text-center py-8 text-gray-500">
            <p className="mb-2">Kein Verein gefunden für "{searchTerm}"</p>
            <button
              type="button"
              onClick={() => {
                setSelectedClubId('__new__');
                setNewVereinName(searchTerm);
              }}
              className="text-blue-600 hover:underline"
            >
              → Neuen Verein "{searchTerm}" anlegen
            </button>
          </div>
        )}
        
        {/* Neuer Verein Formular */}
        {selectedClubId === '__new__' && (
          <div className="border-t pt-4 mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vereinsname *
            </label>
            <input
              type="text"
              placeholder="z.B. FC Musterstadt e.V."
              value={newVereinName}
              onChange={(e) => setNewVereinName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md 
                        focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              autoFocus
            />
          </div>
        )}
        
        <div className="mt-8 flex justify-between">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md 
                       hover:bg-gray-300 transition-colors focus:outline-none 
                       focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            ← Zurück
          </button>
          
          <button
            type="submit"
            disabled={!selectedClubId || (selectedClubId === '__new__' && !newVereinName.trim())}
            className={`px-6 py-2 font-semibold rounded-md transition-colors 
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                       ${(selectedClubId && (selectedClubId !== '__new__' || newVereinName.trim()))
                         ? 'bg-blue-600 text-white hover:bg-blue-700' 
                         : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
          >
            Weiter →
          </button>
        </div>
      </form>
    </div>
  );
};
