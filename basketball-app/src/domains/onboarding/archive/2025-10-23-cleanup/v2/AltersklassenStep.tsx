/**
 * Altersklassen Step - Onboarding v2
 * 
 * Multi-Select für Altersklassen (API-Call #2)
 */

import React, { useEffect, useState } from 'react';
import { Users, Loader2, AlertCircle, Info } from 'lucide-react';
import type { WamFilterOption } from '@shared/types';
import { BBBApiService } from '@domains/bbb-api/services/BBBApiService';

interface AltersklassenStepProps {
  verbandId: number;
  initialSelection?: number[];
  onNext: (altersklassenIds: number[]) => void;
  onBack: () => void;
}

export const AltersklassenStep: React.FC<AltersklassenStepProps> = ({ 
  verbandId,
  initialSelection = [], 
  onNext, 
  onBack 
}) => {
  const [altersklassen, setAltersklassen] = useState<WamFilterOption[]>([]);
  const [selectedAltersklassen, setSelectedAltersklassen] = useState<number[]>(initialSelection);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const apiService = new BBBApiService();
  
  useEffect(() => {
    loadAltersklassen();
  }, [verbandId]);
  
  const loadAltersklassen = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // API call mit ausgewähltem Verband
      const response = await apiService.getWamData({
        token: 1,
        verbandIds: [verbandId],
        gebietIds: [],
        ligatypIds: [],
        akgGeschlechtIds: [],
        altersklasseIds: [],
        spielklasseIds: [],
        sortBy: 0
      });
      
      if (response.data.altersklassen) {
        // Sortiere Altersklassen nach Label
        const sortedAK = response.data.altersklassen.sort((a: WamFilterOption, b: WamFilterOption) => {
          const labelA = a.label || '';
          const labelB = b.label || '';
          return labelA.localeCompare(labelB);
        });
        setAltersklassen(sortedAK);
      }
    } catch (err) {
      console.error('Fehler beim Laden der Altersklassen:', err);
      setError('Altersklassen konnten nicht geladen werden. Bitte versuchen Sie es später erneut.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleToggle = (altersklasseId: number) => {
    setSelectedAltersklassen(prev => {
      if (prev.includes(altersklasseId)) {
        return prev.filter(id => id !== altersklasseId);
      } else {
        return [...prev, altersklasseId];
      }
    });
  };
  
  const handleSelectAll = () => {
    if (selectedAltersklassen.length === altersklassen.length) {
      setSelectedAltersklassen([]);
    } else {
      setSelectedAltersklassen(altersklassen.map(ak => ak.id as number));
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAltersklassen.length > 0) {
      onNext(selectedAltersklassen);
    }
  };
  
  const isMiniklasse = (label?: string): boolean => {
    if (!label) return false;
    return ['U8', 'U10', 'U12'].some(ak => label.includes(ak));
  };
  
  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto p-6">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Lade verfügbare Altersklassen...</p>
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
                onClick={loadAltersklassen}
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
          <Users className="h-8 w-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Wählen Sie die Altersklassen
        </h2>
        <p className="text-gray-600">
          Für welche Altersklassen möchten Sie Teams verwalten?
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
        {/* Info-Box für Minibasketball */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-semibold text-blue-800 mb-1">
                Minibasketball-Fokus
              </p>
              <p className="text-blue-700">
                Diese App ist speziell für Mini-Basketball (U8, U10, U12) optimiert 
                mit DBB-Regel-Validierung für Einsatzzeiten.
              </p>
            </div>
          </div>
        </div>
        
        {/* Select All Option */}
        {altersklassen.length > 0 && (
          <div className="mb-4 pb-4 border-b">
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {selectedAltersklassen.length === altersklassen.length 
                ? 'Alle abwählen' 
                : 'Alle auswählen'}
            </button>
          </div>
        )}
        
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {altersklassen.map((ak) => (
            <label
              key={ak.id}
              className={`flex items-center p-3 rounded-lg cursor-pointer 
                         transition-all hover:bg-gray-50
                         ${selectedAltersklassen.includes(ak.id as number)
                           ? 'bg-blue-50' 
                           : ''}`}
            >
              <input
                type="checkbox"
                checked={selectedAltersklassen.includes(ak.id as number)}
                onChange={() => handleToggle(ak.id as number)}
                className="mr-3 h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-800">
                  {ak.label || `Altersklasse ${ak.id}`}
                  {isMiniklasse(ak.label) && (
                    <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                      Minibasketball
                    </span>
                  )}
                </div>
                {ak.hits > 0 && (
                  <div className="text-sm text-gray-600">
                    {ak.hits} Ligen verfügbar
                  </div>
                )}
              </div>
            </label>
          ))}
        </div>
        
        {altersklassen.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Keine Altersklassen verfügbar
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
            disabled={selectedAltersklassen.length === 0}
            className={`px-6 py-2 font-semibold rounded-md transition-colors 
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                       ${selectedAltersklassen.length > 0
                         ? 'bg-blue-600 text-white hover:bg-blue-700' 
                         : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
          >
            Weiter →
          </button>
        </div>
      </form>
      
      {selectedAltersklassen.length > 0 && (
        <div className="mt-4 text-center text-sm text-gray-600">
          {selectedAltersklassen.length} Altersklasse{selectedAltersklassen.length !== 1 ? 'n' : ''} ausgewählt
        </div>
      )}
    </div>
  );
};
