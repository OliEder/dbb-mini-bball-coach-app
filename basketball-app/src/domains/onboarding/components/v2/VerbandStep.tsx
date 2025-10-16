/**
 * Verband Step - Onboarding v2
 * 
 * Auswahl des Basketball-Verbands (API-Call #1)
 */

import React, { useEffect, useState } from 'react';
import { MapPin, Loader2, AlertCircle } from 'lucide-react';
import type { WamFilterOption } from '@shared/types';
import { BBBApiService } from '@domains/bbb-api/services/BBBApiService';

interface VerbandStepProps {
  initialSelection?: number | null;
  onNext: (verbandId: number) => void;
  onBack: () => void;
}

export const VerbandStep: React.FC<VerbandStepProps> = ({ 
  initialSelection, 
  onNext, 
  onBack 
}) => {
  const [verbaende, setVerbaende] = useState<WamFilterOption[]>([]);
  const [selectedVerband, setSelectedVerband] = useState<number | null>(initialSelection || null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const apiService = new BBBApiService();
  
  useEffect(() => {
    loadVerbaende();
  }, []);
  
  const loadVerbaende = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Initial API call to get all Verbände
      const response = await apiService.getWamData({
        token: 0,
        verbandIds: [],
        gebietIds: [],
        ligatypIds: [],
        akgGeschlechtIds: [],
        altersklasseIds: [],
        spielklasseIds: [],
        sortBy: 0
      });
      
      if (response.data.verbaende) {
        setVerbaende(response.data.verbaende);
        
        // Vorauswahl Bayern wenn nur ein Verband vorhanden
        if (response.data.verbaende.length === 1) {
          setSelectedVerband(response.data.verbaende[0].id as number);
        }
        // Vorauswahl Bayern (ID = 2) wenn vorhanden
        else {
          const bayern = response.data.verbaende.find((v: WamFilterOption) => v.id === 2);
          if (bayern && !initialSelection) {
            setSelectedVerband(2);
          }
        }
      }
    } catch (err) {
      console.error('Fehler beim Laden der Verbände:', err);
      setError('Verbände konnten nicht geladen werden. Bitte versuchen Sie es später erneut.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedVerband !== null) {
      onNext(selectedVerband);
    }
  };
  
  const getVerbandDescription = (id: number): string => {
    // Bekannte Verbände mit Beschreibungen
    const descriptions: Record<number, string> = {
      2: 'Bayerischer Basketball Verband - Umfasst alle Vereine in Bayern',
      3: 'Basketball Baden-Württemberg - Vereine aus Baden-Württemberg',
      4: 'Berliner Basketball-Verband - Hauptstadt-Basketball',
      5: 'Hamburger Basketball-Verband - Basketball in der Hansestadt',
      // Weitere können ergänzt werden
    };
    return descriptions[id] || '';
  };
  
  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto p-6">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Lade verfügbare Verbände...</p>
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
                onClick={loadVerbaende}
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
          <MapPin className="h-8 w-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Wählen Sie Ihren Verband
        </h2>
        <p className="text-gray-600">
          In welchem Basketball-Verband ist Ihr Verein organisiert?
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
        <div className="space-y-3">
          {verbaende.map((verband) => (
            <label
              key={verband.id}
              className={`flex items-start p-4 border-2 rounded-lg cursor-pointer 
                         transition-all hover:bg-gray-50
                         ${selectedVerband === verband.id 
                           ? 'border-blue-500 bg-blue-50' 
                           : 'border-gray-200'}`}
            >
              <input
                type="radio"
                name="verband"
                value={verband.id}
                checked={selectedVerband === verband.id}
                onChange={() => setSelectedVerband(verband.id as number)}
                className="mt-1 mr-3"
              />
              <div className="flex-1">
                <div className="font-semibold text-gray-800">
                  {verband.label || `Verband ${verband.id}`}
                </div>
                {verband.hits > 0 && (
                  <div className="text-sm text-gray-600 mt-1">
                    {verband.hits} Ligen verfügbar
                  </div>
                )}
                {getVerbandDescription(verband.id as number) && (
                  <div className="text-sm text-gray-500 mt-1">
                    {getVerbandDescription(verband.id as number)}
                  </div>
                )}
              </div>
            </label>
          ))}
        </div>
        
        {verbaende.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Keine Verbände verfügbar
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
            disabled={selectedVerband === null}
            className={`px-6 py-2 font-semibold rounded-md transition-colors 
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                       ${selectedVerband !== null
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
