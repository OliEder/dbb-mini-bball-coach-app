import React from 'react';
import { Users } from 'lucide-react';
import {
  useSimpleOnboardingStore,
  type VRTeam,
} from '../onboarding-simple.store';

interface SimplifiedTeamStepProps {
  onNext: (team: VRTeam) => void;
  onBack: () => void;
}

function formatTeamLabel(team: VRTeam): string {
  const ak = team.altersklasse || 'Unbekannt';
  const geschlecht =
    team.geschlecht === 'm'
      ? 'Herren'
      : team.geschlecht === 'w'
      ? 'Damen'
      : '';
  const num = team.teamNumber && team.teamNumber > 1 ? ` ${team.teamNumber}` : '';
  return `${ak}${geschlecht ? ' ' + geschlecht : ''}${num}`.trim();
}

export const SimplifiedTeamStep: React.FC<SimplifiedTeamStepProps> = ({
  onNext,
  onBack,
}) => {
  const { selectedClub, selectedTeam, setSelectedTeam } = useSimpleOnboardingStore();

  const teams = selectedClub?.teams || [];

  const handleSubmit = () => {
    if (selectedTeam) onNext(selectedTeam);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Wähle dein Team
          </h1>
          <p className="text-gray-600">{selectedClub?.name}</p>
          <p className="text-sm text-gray-500 mt-1">
            {teams.length} {teams.length === 1 ? 'Team' : 'Teams'} verfügbar
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
                    selectedTeam?.teamPermanentId === team.teamPermanentId ? 'bg-blue-50' : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="team"
                    checked={selectedTeam?.teamPermanentId === team.teamPermanentId}
                    onChange={() => setSelectedTeam(team)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
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
            disabled={!selectedTeam}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Weiter →
          </button>
        </div>
      </div>
    </div>
  );
};
