/**
 * Simplified Team Step
 * 
 * - Zeigt Teams des gewählten Vereins
 * - Multi-Select möglich
 */

import React, { useState, useEffect } from 'react';
import { Users, Loader2, AlertCircle } from 'lucide-react';
import { clubDataLoader } from '@shared/services/ClubDataLoader';
import type { Team } from '@shared/types';

interface SimplifiedTeamStepProps {
  clubId: string;
  clubName: string;
  onNext: (teams: Team[]) => void;
  onBack: () => void;
}

export const SimplifiedTeamStep: React.FC<SimplifiedTeamStepProps> = ({
  clubId,
  clubName,
  onNext,
  onBack
}) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamIds, setSelectedTeamIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load teams for club
  useEffect(() => {
    const loadTeams = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const loadedTeams = await clubDataLoader.loadTeamsForClub(clubId);
        setTeams(loadedTeams);
      } catch (err) {
        console.error('Failed to load teams:', err);
        setError((err as Error).message || 'Teams konnten nicht geladen werden');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadTeams();
  }, [clubId]);

  const handleToggleTeam = (teamId: string) => {
    const newSelected = new Set(selectedTeamIds);
    if (newSelected.has(teamId)) {
      newSelected.delete(teamId);
    } else {
      newSelected.add(teamId);
    }
    setSelectedTeamIds(newSelected);
  };

  const handleSubmit = () => {
    const selectedTeams = teams.filter(t => selectedTeamIds.has(t.team_id));
    if (selectedTeams.length > 0) {
      onNext(selectedTeams);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Teams werden geladen...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md bg-white rounded-lg shadow-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Fehler beim Laden</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={onBack}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              ← Zurück
            </button>
            <button
              onClick={() => window.location.reload()}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Neu laden
            </button>
          </div>
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
            Wähle deine Teams
          </h1>
          <p className="text-gray-600">
            {clubName}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {teams.length} {teams.length === 1 ? 'Team' : 'Teams'} verfügbar
          </p>
        </div>

        {/* Teams List */}
        {teams.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-gray-300 rounded-lg mb-6">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-600 mb-2">Keine Teams gefunden</p>
            <p className="text-sm text-gray-500">
              Für diesen Verein sind noch keine Teams hinterlegt.
            </p>
          </div>
        ) : (
          <div className="mb-6 max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
            <div className="divide-y divide-gray-200">
              {teams.map((team) => (
                <label
                  key={team.team_id}
                  className={`flex items-start p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                    selectedTeamIds.has(team.team_id) ? 'bg-blue-50' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedTeamIds.has(team.team_id)}
                    onChange={() => handleToggleTeam(team.team_id)}
                    className="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500 rounded"
                  />
                  <div className="ml-3 flex-1">
                    <p className="font-medium text-gray-900">{team.name}</p>
                    {team.liga_name && (
                      <p className="text-sm text-gray-500">{team.liga_name}</p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Selection Summary */}
        {selectedTeamIds.size > 0 && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>{selectedTeamIds.size}</strong> {selectedTeamIds.size === 1 ? 'Team' : 'Teams'} ausgewählt
            </p>
          </div>
        )}

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
            disabled={selectedTeamIds.size === 0}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Weiter →
          </button>
        </div>
      </div>
    </div>
  );
};
