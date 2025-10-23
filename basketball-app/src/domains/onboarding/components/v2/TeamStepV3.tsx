/**
 * Team Step v3 - Onboarding (Lokale Club-Daten)
 * 
 * Lädt Teams aus Club-Chunk (Lazy Loading)
 * Kein API-Call mehr nötig!
 */

import React, { useState, useEffect } from 'react';
import { Users, Check, Loader2, Info } from 'lucide-react';
import { clubDataService, type Club, type Team } from '@shared/services/ClubDataService';
import type { Team as DBTeam } from '@shared/types';

interface TeamStepV3Props {
  clubId: string;
  clubName: string;
  selectedVerbaende: number[];
  initialSelection?: DBTeam[];
  onNext: (teams: DBTeam[]) => void;
  onBack: () => void;
}

export const TeamStepV3: React.FC<TeamStepV3Props> = ({
  clubId,
  clubName,
  selectedVerbaende,
  initialSelection = [],
  onNext,
  onBack
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [club, setClub] = useState<Club | null>(null);
  const [selectedTeamIds, setSelectedTeamIds] = useState<Set<string>>(
    new Set(initialSelection.map(t => t.extern_team_id).filter(Boolean) as string[])
  );

  // Lade Club-Details aus Chunk
  useEffect(() => {
    const loadClubData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const clubData = await clubDataService.getClubDetails(clubId);
        
        if (!clubData) {
          setError('Club-Daten konnten nicht geladen werden');
          return;
        }
        
        setClub(clubData);
      } catch (err) {
        console.error('Failed to load club data:', err);
        setError('Fehler beim Laden der Club-Daten');
      } finally {
        setLoading(false);
      }
    };

    loadClubData();
  }, [clubId]);

  // Filtere Teams nach gewählten Verbänden + aktuelle Saison
  const filteredTeams = React.useMemo(() => {
    if (!club) return [];
    
    return club.teams.filter(team => {
      // Teams mit Ligen in den gewählten Verbänden
      // (Liga → Verband Mapping müsste aus den Daten kommen)
      
      // Für jetzt: Alle Teams anzeigen
      // TODO: Verband-Filter wenn Liga-Daten erweitert werden
      return true;
    }).sort((a, b) => {
      // Sortiere nach Altersklasse (U10 vor U12 vor U14...)
      return a.teamAkjId - b.teamAkjId;
    });
  }, [club, selectedVerbaende]);

  const toggleTeam = (teamId: string) => {
    const newSelection = new Set(selectedTeamIds);
    if (newSelection.has(teamId)) {
      newSelection.delete(teamId);
    } else {
      newSelection.add(teamId);
    }
    setSelectedTeamIds(newSelection);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedTeamIds.size === 0) {
      alert('Bitte wählen Sie mindestens ein Team aus');
      return;
    }

    if (!club) return;

    // Erstelle DB-Team-Objekte
    const teams: DBTeam[] = Array.from(selectedTeamIds)
      .map(teamId => {
        const team = club.teams.find(t => t.teamPermanentId === teamId);
        if (!team) return null;

        return {
          team_id: crypto.randomUUID(),
          extern_team_id: team.teamPermanentId,
          verein_id: '', // Wird später gesetzt
          name: team.teamname,
          altersklasse: team.teamAkj,
          geschlecht: team.teamGender === 'm' ? 'männlich' : 'weiblich',
          ist_eigenes_team: true,
          created_at: new Date()
        } as DBTeam;
      })
      .filter(Boolean) as DBTeam[];

    onNext(teams);
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Lade Teams für {clubName}...</p>
          <p className="text-sm text-gray-500 mt-2">
            Chunk wird geladen (Lazy Loading)
          </p>
        </div>
      </div>
    );
  }

  if (error || !club) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-red-800 font-semibold mb-2">Fehler</h3>
          <p className="text-red-700">{error || 'Club nicht gefunden'}</p>
          <button
            onClick={onBack}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            ← Zurück zur Vereinsauswahl
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <Users className="h-8 w-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Wählen Sie Ihre Teams
        </h2>
        <p className="text-gray-600">
          {clubName}
        </p>
        <p className="text-sm text-gray-500 mt-1">
          {filteredTeams.length} {filteredTeams.length === 1 ? 'Team' : 'Teams'} verfügbar
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
        {/* Info-Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-semibold text-blue-800 mb-1">
                Multi-Team Support
              </p>
              <p className="text-blue-700">
                Sie können mehrere Teams auswählen (z.B. U10 + U12).
                Sie können später zwischen Teams wechseln.
              </p>
            </div>
          </div>
        </div>

        {/* Teams-Liste */}
        <div className="space-y-2 max-h-96 overflow-y-auto mb-6">
          {filteredTeams.map((team) => {
            const isSelected = selectedTeamIds.has(team.teamPermanentId);
            const currentSeason = team.seasons[0]; // Neueste Saison
            
            return (
              <label
                key={team.teamPermanentId}
                className={`flex items-start p-4 border-2 rounded-lg cursor-pointer 
                           transition-all hover:bg-gray-50
                           ${isSelected 
                             ? 'border-blue-500 bg-blue-50' 
                             : 'border-gray-200'}`}
              >
                <div className="flex items-start flex-1">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleTeam(team.teamPermanentId)}
                    className="mt-1 mr-3"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">
                      {team.teamname}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-gray-700 mr-2">
                        {team.teamAkj}
                      </span>
                      <span className="text-gray-500">
                        {team.teamGender === 'm' ? 'Männlich' : 'Weiblich'}
                      </span>
                      {currentSeason && (
                        <span className="ml-2 text-gray-500">
                          • {currentSeason.ligen.length} {currentSeason.ligen.length === 1 ? 'Liga' : 'Ligen'}
                        </span>
                      )}
                    </div>
                    {currentSeason && currentSeason.ligen.length > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        {currentSeason.ligen[0].liganame}
                      </div>
                    )}
                  </div>
                  {isSelected && (
                    <Check className="h-5 w-5 text-blue-600 flex-shrink-0 mt-1" />
                  )}
                </div>
              </label>
            );
          })}

          {filteredTeams.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>Keine Teams gefunden für die gewählten Verbände</p>
              <button
                type="button"
                onClick={onBack}
                className="mt-4 text-blue-600 hover:underline"
              >
                ← Anderen Verein wählen
              </button>
            </div>
          )}
        </div>

        {/* Auswahl-Summary */}
        {selectedTeamIds.size > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-green-800">
              <Check className="inline h-4 w-4 mr-1" />
              {selectedTeamIds.size} {selectedTeamIds.size === 1 ? 'Team' : 'Teams'} ausgewählt
            </p>
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
            disabled={selectedTeamIds.size === 0}
            className={`px-6 py-2 font-semibold rounded-md transition-colors 
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                       ${selectedTeamIds.size > 0
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
