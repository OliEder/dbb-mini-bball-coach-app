/**
 * Verband Step - Onboarding v2
 * 
 * Auswahl des Basketball-Verbands (STATISCH - kein API-Call)
 */

import React, { useState } from 'react';
import { MapPin, Info } from 'lucide-react';
import { 
  LANDESVERBAENDE,
  BUNDESLIGEN,
  DEUTSCHE_MEISTERSCHAFTEN,
  REGIONALLIGEN,
  ROLLSTUHLBASKETBALL,
  DEFAULT_VERBAND_ID,
  type VerbandOption 
} from '@shared/constants/verbaende';

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
  const [selectedVerband, setSelectedVerband] = useState<number | null>(
    initialSelection || null
  );
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedVerband !== null) {
      onNext(selectedVerband);
    }
  };
  
  const renderVerbandCard = (verband: VerbandOption) => (
    <label
      key={verband.id}
      className={`flex items-start p-3 border-2 rounded-lg cursor-pointer 
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
        onChange={() => setSelectedVerband(verband.id)}
        className="mt-1 mr-3"
      />
      <div className="flex-1">
        <div className="font-semibold text-gray-800">
          {verband.label}
        </div>
        {verband.beschreibung && (
          <div className="text-sm text-gray-500 mt-0.5">
            {verband.beschreibung}
          </div>
        )}
      </div>
    </label>
  );
  
  const renderGroup = (
    title: string, 
    verbaende: VerbandOption[], 
    color: string = 'blue',
    description?: string
  ) => {
    if (verbaende.length === 0) return null;
    
    const colorClasses = {
      blue: 'bg-blue-500',
      orange: 'bg-orange-500',
      green: 'bg-green-500',
      purple: 'bg-purple-500',
      gray: 'bg-gray-500'
    };
    
    return (
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <h3 className="font-semibold text-gray-700 mb-2 flex items-center">
          <span className={`inline-block w-2 h-2 ${colorClasses[color as keyof typeof colorClasses]} rounded-full mr-2`}></span>
          {title}
        </h3>
        {description && (
          <p className="text-xs text-gray-500 mb-3 ml-4">{description}</p>
        )}
        <div className="space-y-2">
          {verbaende.map(renderVerbandCard)}
        </div>
      </div>
    );
  };
  
  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="text-center mb-6">
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
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Info-Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start">
          <Info className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <strong>Für Mini-Basketball:</strong> Wählen Sie in der Regel Ihren 
            <strong> Landesverband</strong> (Bundesland). Die anderen Kategorien sind 
            für überregionale Wettbewerbe.
          </div>
        </div>
        
        {/* Landesverbände - Hauptkategorie */}
        {renderGroup(
          'Landesverbände',
          LANDESVERBAENDE,
          'blue',
          'Ihr Bundesland - hier finden die meisten Mini-Basketball-Spiele statt'
        )}
        
        {/* Weitere Kategorien */}
        <details className="bg-gray-50 rounded-lg border border-gray-200">
          <summary className="px-4 py-3 cursor-pointer font-semibold text-gray-700 hover:bg-gray-100">
            Überregionale Verbände anzeigen
          </summary>
          <div className="p-4 space-y-4">
            {renderGroup(
              'Bundesligen',
              BUNDESLIGEN,
              'orange',
              '1. und 2. Basketball-Bundesliga'
            )}
            
            {renderGroup(
              'Deutsche Meisterschaften',
              DEUTSCHE_MEISTERSCHAFTEN,
              'green',
              'Bundesweite Meisterschaftswettbewerbe'
            )}
            
            {renderGroup(
              'Regionalligen',
              REGIONALLIGEN,
              'purple',
              'Überregionale Ligen (Nord, Süd, West, Ost)'
            )}
            
            {renderGroup(
              'Rollstuhlbasketball',
              ROLLSTUHLBASKETBALL,
              'gray',
              'Rollstuhlbasketball-Wettbewerbe'
            )}
          </div>
        </details>
        
        {/* Buttons */}
        <div className="flex justify-between pt-4">
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
