/**
 * Gebiet Step - Onboarding v2
 * 
 * Auswahl des Gebiets (Bezirk/Kreis) (API-Call #3)
 */

import React, { useEffect, useState } from 'react';
import { Map, Loader2, AlertCircle, Search } from 'lucide-react';
import type { WamFilterOption } from '@shared/types';
import { BBBApiService } from '@domains/bbb-api/services/BBBApiService';

interface GebietStepProps {
  verbandId: number;
  altersklassenIds: number[];
  initialSelection?: string | null;
  onNext: (gebietId: string) => void;
  onBack: () => void;
}

export const GebietStep: React.FC<GebietStepProps> = ({ 
  verbandId,
  altersklassenIds,
  initialSelection = null, 
  onNext, 
  onBack 
}) => {
  const [gebiete, setGebiete] = useState<WamFilterOption[]>([]);
  const [selectedGebiet, setSelectedGebiet] = useState<string | null>(initialSelection);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const apiService = new BBBApiService();
  
  useEffect(() => {
    loadGebiete();
  }, [verbandId, altersklassenIds]);
  
  const loadGebiete = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // API call mit ausgewähltem Verband und Altersklassen
      const response = await apiService.getWamData({
        token: 2,
        verbandIds: [verbandId],
        gebietIds: [],
        ligatypIds: [],
        akgGeschlechtIds: [],
        altersklasseIds: altersklassenIds,
        spielklasseIds: [],
        sortBy: 0
      });
      
      if (response.data.gebiete) {
        // Sortiere Gebiete alphabetisch
        const sortedGebiete = response.data.gebiete.sort((a: WamFilterOption, b: WamFilterOption) => {
          const nameA = getGebietDisplayName(a);
          const nameB = getGebietDisplayName(b);
          return nameA.localeCompare(nameB);
        });
        setGebiete(sortedGebiete);
        
        // Wenn nur ein Gebiet verfügbar, automatisch auswählen
        if (sortedGebiete.length === 1) {
          setSelectedGebiet(sortedGebiete[0].id as string);
        }
      }
    } catch (err) {
      console.error('Fehler beim Laden der Gebiete:', err);
      setError('Gebiete konnten nicht geladen werden. Bitte versuchen Sie es später erneut.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const getGebietDisplayName = (gebiet: WamFilterOption): string => {
    // Kombiniere Bezirk und Kreis für bessere Anzeige
    const parts = [];
    if (gebiet.bezirk) parts.push(gebiet.bezirk);
    if (gebiet.kreis) parts.push(gebiet.kreis);
    if (gebiet.label) parts.push(gebiet.label);
    
    return parts.length > 0 ? parts.join(' - ') : `Gebiet ${gebiet.id}`;
  };
  
  const filteredGebiete = gebiete.filter(gebiet => {
    if (!searchTerm) return true;
    const displayName = getGebietDisplayName(gebiet).toLowerCase();
    return displayName.includes(searchTerm.toLowerCase());
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedGebiet !== null) {
      onNext(selectedGebiet);
    }
  };
  
  const groupedGebiete = filteredGebiete.reduce((acc, gebiet) => {
    const key = gebiet.bezirk || 'Sonstige';
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(gebiet);
    return acc;
  }, {} as Record<string, WamFilterOption[]>);
  
  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto p-6">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Lade verfügbare Gebiete...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="max-w-lg mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-2" />
            <div>
              <h3 className="font-semibold text-red-800">Fehler</h3>
              <p className="text-red-700">{error}</p>
              <button
                onClick={loadGebiete}
                className="mt-3 text-sm text-red-600 underline hover:no-underline"
              >
                Erneut versuchen
              </button>
            </div>
          </div>
        </div>
        
        <div className="mt-6 text-center">
          <button
            onClick={onBack}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md 
                       hover:bg-gray-300 transition-colors"
          >
            ← Zurück
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-lg mx-auto p-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <Map className="h-8 w-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Wählen Sie Ihr Gebiet
        </h2>
        <p className="text-gray-600">
          In welchem Bezirk oder Kreis ist Ihr Verein aktiv?
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
        {/* Suchfeld bei vielen Gebieten */}
        {gebiete.length > 10 && (
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Gebiet suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md 
                          focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}
        
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {Object.keys(groupedGebiete).length > 1 ? (
            // Gruppierte Darstellung bei mehreren Bezirken
            Object.entries(groupedGebiete).map(([bezirk, gebieteInBezirk]) => (
              <div key={bezirk}>
                <h3 className="font-semibold text-sm text-gray-600 mb-2 uppercase tracking-wider">
                  {bezirk}
                </h3>
                {gebieteInBezirk.map((gebiet) => (
                  <label
                    key={gebiet.id}
                    className={`flex items-start p-3 ml-4 mb-2 border-2 rounded-lg cursor-pointer 
                               transition-all hover:bg-gray-50
                               ${selectedGebiet === gebiet.id 
                                 ? 'border-blue-500 bg-blue-50' 
                                 : 'border-gray-200'}`}
                  >
                    <input
                      type="radio"
                      name="gebiet"
                      value={gebiet.id}
                      checked={selectedGebiet === gebiet.id}
                      onChange={() => setSelectedGebiet(gebiet.id as string)}
                      className="mt-1 mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">
                        {gebiet.kreis || gebiet.label || `Gebiet ${gebiet.id}`}
                      </div>
                      {gebiet.hits > 0 && (
                        <div className="text-sm text-gray-600 mt-1">
                          {gebiet.hits} Ligen verfügbar
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            ))
          ) : (
            // Flache Liste bei nur einem Bezirk
            filteredGebiete.map((gebiet) => (
              <label
                key={gebiet.id}
                className={`flex items-start p-4 border-2 rounded-lg cursor-pointer 
                           transition-all hover:bg-gray-50
                           ${selectedGebiet === gebiet.id 
                             ? 'border-blue-500 bg-blue-50' 
                             : 'border-gray-200'}`}
              >
                <input
                  type="radio"
                  name="gebiet"
                  value={gebiet.id}
                  checked={selectedGebiet === gebiet.id}
                  onChange={() => setSelectedGebiet(gebiet.id as string)}
                  className="mt-1 mr-3"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-800">
                    {getGebietDisplayName(gebiet)}
                  </div>
                  {gebiet.hits > 0 && (
                    <div className="text-sm text-gray-600 mt-1">
                      {gebiet.hits} Ligen verfügbar
                    </div>
                  )}
                </div>
              </label>
            ))
          )}
        </div>
        
        {filteredGebiete.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? 'Keine Gebiete gefunden' : 'Keine Gebiete verfügbar'}
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
            disabled={selectedGebiet === null}
            className={`px-6 py-2 font-semibold rounded-md transition-colors 
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                       ${selectedGebiet !== null
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
