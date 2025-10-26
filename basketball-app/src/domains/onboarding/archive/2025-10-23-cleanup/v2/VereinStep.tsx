/**
 * Verein Step - Onboarding v2
 * 
 * Auswahl des Vereins basierend auf geladenen Teams
 * Extrahiert Vereine aus Team-Namen (ähnlich wie Python POC)
 */

import React, { useEffect, useState, useMemo } from 'react';
import { Building2, Search, Info, Users } from 'lucide-react';
import type { Verein, Team, DBBTabellenEintrag } from '@shared/types';

interface VereinStepProps {
  teamsByLiga: Map<string, DBBTabellenEintrag[]>;
  initialSelection?: Verein | null;
  onNext: (verein: Verein) => void;
  onBack: () => void;
}

interface ExtractedVerein {
  name: string;
  teams: string[];
  teamIds: number[];
  clubIds: Set<number>;
}

export const VereinStep: React.FC<VereinStepProps> = ({ 
  teamsByLiga, 
  initialSelection,
  onNext, 
  onBack 
}) => {
  const [selectedVerein, setSelectedVerein] = useState<string | null>(
    initialSelection?.name || null
  );
  const [searchTerm, setSearchTerm] = useState('');
  
  // Extrahiere Vereine aus Team-Namen (wie im Python POC)
  const extractedVereine = useMemo(() => {
    const vereinsMap = new Map<string, ExtractedVerein>();
    
    // Pattern für Team-Nummern (wie im POC)
    const teamNumberPatterns = [
      /\s+([1-9]\d*)$/, // "FC Bayern 2"
      /\s+([IVX]+)$/,   // "FC Bayern II"
      /\s+(\d+)\.$/,     // "FC Bayern 1."
      /\s+([A-Z])$/      // "FC Bayern B"
    ];
    
    // Durchlaufe alle Teams aus allen Ligen
    teamsByLiga.forEach((teams) => {
      teams.forEach((team) => {
        let vereinsName = team.clubName;
        
        // Alternative: Extrahiere aus teamName wenn clubName nicht eindeutig
        if (vereinsName === team.teamName || !vereinsName) {
          vereinsName = team.teamName;
          
          // Entferne Team-Nummern/-Zusätze
          for (const pattern of teamNumberPatterns) {
            vereinsName = vereinsName.replace(pattern, '');
          }
        }
        
        // Normalisiere den Namen
        vereinsName = vereinsName.trim();
        
        if (!vereinsMap.has(vereinsName)) {
          vereinsMap.set(vereinsName, {
            name: vereinsName,
            teams: [],
            teamIds: [],
            clubIds: new Set()
          });
        }
        
        const verein = vereinsMap.get(vereinsName)!;
        verein.teams.push(team.teamName);
        verein.teamIds.push(team.teamId);
        verein.clubIds.add(team.clubId);
      });
    });
    
    // Sortiere nach Anzahl der Teams (größere Vereine zuerst)
    return Array.from(vereinsMap.values())
      .sort((a, b) => b.teams.length - a.teams.length);
  }, [teamsByLiga]);
  
  // Gefilterte Vereine basierend auf Suche
  const filteredVereine = extractedVereine.filter(verein => {
    if (!searchTerm) return true;
    return verein.name.toLowerCase().includes(searchTerm.toLowerCase());
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedVerein) return;
    
    const verein = extractedVereine.find(v => v.name === selectedVerein);
    if (!verein) return;
    
    // Erstelle Verein-Objekt für die DB
    const vereinData: Verein = {
      verein_id: crypto.randomUUID(),
      extern_verein_id: Array.from(verein.clubIds)[0]?.toString(),
      name: verein.name,
      ist_eigener_verein: true,
      created_at: new Date()
    };
    
    onNext(vereinData);
  };
  
  const getTotalTeams = (): number => {
    let total = 0;
    teamsByLiga.forEach(teams => {
      total += teams.length;
    });
    return total;
  };
  
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
          {extractedVereine.length} Vereine aus {getTotalTeams()} Teams gefunden
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
                Wählen Sie den ähnlichsten Verein oder scrollen Sie nach unten 
                für die Option "Neuen Verein anlegen".
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
              placeholder="Verein suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md 
                        focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        {/* Vereine-Liste */}
        <div className="space-y-2 max-h-96 overflow-y-auto mb-6">
          {filteredVereine.map((verein) => (
            <label
              key={verein.name}
              className={`flex items-start p-4 border-2 rounded-lg cursor-pointer 
                         transition-all hover:bg-gray-50
                         ${selectedVerein === verein.name 
                           ? 'border-blue-500 bg-blue-50' 
                           : 'border-gray-200'}`}
            >
              <input
                type="radio"
                name="verein"
                value={verein.name}
                checked={selectedVerein === verein.name}
                onChange={() => setSelectedVerein(verein.name)}
                className="mt-1 mr-3"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-800">
                  {verein.name}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  <Users className="inline h-3 w-3 mr-1" />
                  {verein.teams.length} {verein.teams.length === 1 ? 'Team' : 'Teams'}:
                  <span className="ml-1 text-gray-500">
                    {verein.teams.slice(0, 3).join(', ')}
                    {verein.teams.length > 3 && ` ... (+${verein.teams.length - 3})`}
                  </span>
                </div>
              </div>
            </label>
          ))}
          
          {/* Option: Neuen Verein anlegen */}
          <div className="border-t pt-2 mt-4">
            <label
              className={`flex items-start p-4 border-2 rounded-lg cursor-pointer 
                         transition-all hover:bg-gray-50 border-dashed
                         ${selectedVerein === '__new__' 
                           ? 'border-green-500 bg-green-50' 
                           : 'border-gray-300'}`}
            >
              <input
                type="radio"
                name="verein"
                value="__new__"
                checked={selectedVerein === '__new__'}
                onChange={() => setSelectedVerein('__new__')}
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
        
        {filteredVereine.length === 0 && searchTerm && (
          <div className="text-center py-8 text-gray-500">
            Kein Verein gefunden für "{searchTerm}"
          </div>
        )}
        
        {/* Neuer Verein Formular */}
        {selectedVerein === '__new__' && (
          <div className="border-t pt-4 mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vereinsname
            </label>
            <input
              type="text"
              placeholder="z.B. FC Musterstadt"
              className="w-full px-3 py-2 border border-gray-300 rounded-md 
                        focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) => {
                // Speichere als custom Verein
                // TODO: State für neuen Vereinsnamen
              }}
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
            disabled={!selectedVerein}
            className={`px-6 py-2 font-semibold rounded-md transition-colors 
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                       ${selectedVerein
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
