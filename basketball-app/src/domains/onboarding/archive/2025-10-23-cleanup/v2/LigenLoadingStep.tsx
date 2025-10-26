/**
 * Ligen Loading Step - Onboarding v2
 * 
 * Automatisches Laden aller relevanten Ligen und deren Teams
 */

import React, { useEffect, useState } from 'react';
import { Trophy, Loader2, AlertCircle, CheckCircle, ChevronDown, ChevronRight } from 'lucide-react';
import type { WamLigaEintrag, DBBTabellenEintrag } from '@shared/types';
import { BBBApiService } from '@domains/bbb-api/services/BBBApiService';
import { BBBSyncService } from '@domains/bbb-api/services/BBBSyncService';

interface LigenLoadingStepProps {
  verbandId: number;
  altersklassenIds: number[];
  gebietId: string;
  onNext: (ligen: WamLigaEintrag[], teams: Map<string, DBBTabellenEintrag[]>) => void;
  onBack: () => void;
}

interface LoadingProgress {
  totalLigen: number;
  loadedLigen: number;
  currentLiga: string;
  phase: 'searching' | 'loading-teams' | 'complete' | 'error';
}

export const LigenLoadingStep: React.FC<LigenLoadingStepProps> = ({ 
  verbandId,
  altersklassenIds,
  gebietId,
  onNext, 
  onBack 
}) => {
  const [ligen, setLigen] = useState<WamLigaEintrag[]>([]);
  const [teamsByLiga, setTeamsByLiga] = useState<Map<string, DBBTabellenEintrag[]>>(new Map());
  const [progress, setProgress] = useState<LoadingProgress>({
    totalLigen: 0,
    loadedLigen: 0,
    currentLiga: '',
    phase: 'searching'
  });
  const [error, setError] = useState<string | null>(null);
  const [expandedLigen, setExpandedLigen] = useState<Set<number>>(new Set());
  
  const apiService = new BBBApiService();
  const syncService = new BBBSyncService(apiService);
  
  useEffect(() => {
    loadLigenAndTeams();
  }, [verbandId, altersklassenIds, gebietId]);
  
  const loadLigenAndTeams = async () => {
    try {
      setError(null);
      setProgress({
        totalLigen: 0,
        loadedLigen: 0,
        currentLiga: 'Suche Ligen...',
        phase: 'searching'
      });
      
      // 1. Lade alle Ligen basierend auf Filtern
      // NEU: Lade ALLE Ligen des Verbands für bessere Verein-Erkennung
      const ligenResponse = await apiService.getWamData({
        token: 3,
        verbandIds: [verbandId],
        gebietIds: gebietId ? [gebietId] : [],
        ligatypIds: [],
        akgGeschlechtIds: [],
        altersklasseIds: altersklassenIds,
        spielklasseIds: [],
        sortBy: 0
      });
      
      if (!ligenResponse.data.ligaListe?.ligen || ligenResponse.data.ligaListe.ligen.length === 0) {
        setError('Keine Ligen für die gewählten Filter gefunden.');
        setProgress(prev => ({ ...prev, phase: 'error' }));
        return;
      }
      
      const gefundeneLigen = ligenResponse.data.ligaListe.ligen;
      setLigen(gefundeneLigen);
      
      setProgress({
        totalLigen: gefundeneLigen.length,
        loadedLigen: 0,
        currentLiga: '',
        phase: 'loading-teams'
      });
      
      // 2. Lade Teams für jede Liga
      const newTeamsByLiga = new Map<string, DBBTabellenEintrag[]>();
      
      for (let i = 0; i < gefundeneLigen.length; i++) {
        const liga = gefundeneLigen[i];
        
        setProgress({
          totalLigen: gefundeneLigen.length,
          loadedLigen: i,
          currentLiga: liga.liganame,
          phase: 'loading-teams'
        });
        
        try {
          // Lade Tabelle für diese Liga
          const tabelleResponse = await apiService.getCompetitionTable(liga.ligaId);
          
          if (tabelleResponse.teams && tabelleResponse.teams.length > 0) {
            newTeamsByLiga.set(liga.ligaId.toString(), tabelleResponse.teams);
          }
          
          // Kleine Pause zwischen Requests
          await new Promise(resolve => setTimeout(resolve, 200));
          
        } catch (err) {
          console.warn(`Konnte Teams für Liga ${liga.liganame} nicht laden:`, err);
          // Fortfahren mit nächster Liga
        }
      }
      
      setTeamsByLiga(newTeamsByLiga);
      
      setProgress({
        totalLigen: gefundeneLigen.length,
        loadedLigen: gefundeneLigen.length,
        currentLiga: '',
        phase: 'complete'
      });
      
    } catch (err) {
      console.error('Fehler beim Laden der Ligen:', err);
      setError('Fehler beim Laden der Liga-Daten. Bitte versuchen Sie es später erneut.');
      setProgress(prev => ({ ...prev, phase: 'error' }));
    }
  };
  
  const toggleLigaExpansion = (ligaId: number) => {
    setExpandedLigen(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ligaId)) {
        newSet.delete(ligaId);
      } else {
        newSet.add(ligaId);
      }
      return newSet;
    });
  };
  
  const handleContinue = () => {
    if (ligen.length > 0) {
      onNext(ligen, teamsByLiga);
    }
  };
  
  const getProgressPercentage = (): number => {
    if (progress.totalLigen === 0) return 0;
    return Math.round((progress.loadedLigen / progress.totalLigen) * 100);
  };
  
  const renderLoadingState = () => (
    <div className="max-w-lg mx-auto p-6">
      <div className="text-center">
        <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">
          {progress.phase === 'searching' ? 'Suche Ligen...' : 'Lade Liga-Daten...'}
        </h3>
        
        {progress.phase === 'loading-teams' && (
          <>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>
            
            <p className="text-gray-600 mb-1">
              {progress.loadedLigen} von {progress.totalLigen} Ligen geladen
            </p>
            
            {progress.currentLiga && (
              <p className="text-sm text-gray-500">
                Lade: {progress.currentLiga}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
  
  const renderCompleteState = () => (
    <div className="max-w-2xl mx-auto p-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Ligen gefunden!
        </h2>
        <p className="text-gray-600">
          {ligen.length} Liga{ligen.length !== 1 ? 'n' : ''} mit insgesamt{' '}
          {Array.from(teamsByLiga.values()).reduce((sum, teams) => sum + teams.length, 0)} Teams
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="font-semibold text-lg mb-4">Gefundene Ligen:</h3>
        
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {ligen.map((liga) => {
            const teams = teamsByLiga.get(liga.ligaId.toString()) || [];
            const isExpanded = expandedLigen.has(liga.ligaId);
            
            return (
              <div key={liga.ligaId} className="border rounded-lg">
                <button
                  type="button"
                  onClick={() => toggleLigaExpansion(liga.ligaId)}
                  className="w-full p-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center text-left">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 mr-2 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-4 w-4 mr-2 text-gray-500" />
                    )}
                    <div>
                      <div className="font-medium">{liga.liganame}</div>
                      <div className="text-sm text-gray-600">
                        {liga.akName} • {liga.skName} • {teams.length} Teams
                      </div>
                    </div>
                  </div>
                  <Trophy className="h-5 w-5 text-gray-400" />
                </button>
                
                {isExpanded && teams.length > 0 && (
                  <div className="px-8 pb-3">
                    <div className="text-sm text-gray-600 space-y-1">
                      {teams.slice(0, 5).map((team) => (
                        <div key={team.teamId}>
                          {team.position}. {team.teamName} ({team.clubName})
                        </div>
                      ))}
                      {teams.length > 5 && (
                        <div className="text-gray-500 italic">
                          ... und {teams.length - 5} weitere Teams
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md 
                     hover:bg-gray-300 transition-colors focus:outline-none 
                     focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          ← Zurück
        </button>
        
        <button
          onClick={handleContinue}
          className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md 
                     hover:bg-blue-700 transition-colors focus:outline-none 
                     focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Weiter →
        </button>
      </div>
    </div>
  );
  
  const renderErrorState = () => (
    <div className="max-w-lg mx-auto p-6">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-2" />
          <div>
            <h3 className="font-semibold text-red-800">Fehler</h3>
            <p className="text-red-700">{error}</p>
            <button
              onClick={loadLigenAndTeams}
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
  
  if (progress.phase === 'error') {
    return renderErrorState();
  }
  
  if (progress.phase === 'complete') {
    return renderCompleteState();
  }
  
  return renderLoadingState();
};
