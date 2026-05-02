import React from 'react';
import { Users } from 'lucide-react';
import {
  useSimpleOnboardingStore,
  formatTeamLabel,
  type VRTeam,
} from '../onboarding-simple.store';

interface SimplifiedTeamStepProps {
  onNext: (teams: VRTeam[]) => void;
  onBack: () => void;
}

export const SimplifiedTeamStep: React.FC<SimplifiedTeamStepProps> = ({
  onNext,
  onBack,
}) => {
  const { selectedClub, selectedTeams, toggleTeam } = useSimpleOnboardingStore();

  const teams = selectedClub?.teams || [];

  const handleSubmit = () => {
    if (selectedTeams.length > 0) onNext(selectedTeams);
  };

  const isSelected = (team: VRTeam) =>
    selectedTeams.some((t) => t.teamPermanentId === team.teamPermanentId);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Wähle deine Teams
          </h1>
          <p className="text-gray-600">{selectedClub?.name}</p>
          <p className="text-sm text-gray-500 mt-1">
            {teams.length} {teams.length === 1 ? 'Team' : 'Teams'} verfügbar
            {selectedTeams.length > 0 && (
              <span className="ml-2 font-medium text-blue-600">
                · {selectedTeams.length} {selectedTeams.length === 1 ? 'Team' : 'Teams'} ausgewählt
              </span>
            )}
          </p>
        </div>

        {teams.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-gray-300 rounded-lg mb-6">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-600">Keine Teams gefunden</p>
          </div>
        ) : (
          <div className="mb-6 max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
            <div className="divide-y divide-gray-200">
              {teams.map((team) => (
                <label
                  key={team.teamPermanentId}
                  className={`flex items-center p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                    isSelected(team) ? 'bg-blue-50' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected(team)}
                    onChange={() => toggleTeam(team)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded"
                  />
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">{formatTeamLabel(team)}</p>
                    <p className="text-sm text-gray-500">ID: {team.teamPermanentId}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            ← Zurück
          </button>
          <button
            onClick={handleSubmit}
            disabled={selectedTeams.length === 0}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Weiter →
          </button>
        </div>
      </div>
    </div>
  );
};
