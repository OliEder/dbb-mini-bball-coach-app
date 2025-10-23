/**
 * Team Select Step - Auswahl des eigenen Teams
 */

import React, { useEffect, useState } from 'react';
import { Users, Trophy, Target, Loader, AlertCircle } from 'lucide-react';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { bbbApiService } from '@/domains/bbb-api/services/BBBApiService';
import { bbbSyncService } from '@/domains/bbb-api/services/BBBSyncService';
import type { DBBTabellenEintrag } from '@/shared/types';

export function TeamSelectStep() {
  const { nextStep, previousStep, setTeam } = useOnboardingStore();
  const [teams, setTeams] = useState<DBBTabellenEintrag[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ligaName, setLigaName] = useState('');

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      setLoading(true);
      setError('');

      // Get Liga ID from localStorage (set in previous step)
      const ligaId = localStorage.getItem('onboarding_liga_id');
      if (!ligaId) {
        throw new Error('Keine Liga-ID gefunden. Bitte gehe zurück und gib die URL erneut ein.');
      }

      // Load teams from API
      const tableData = await bbbApiService.getTabelle(parseInt(ligaId));
      
      if (!tableData.teams || tableData.teams.length === 0) {
        throw new Error('Keine Teams in dieser Liga gefunden.');
      }

      setTeams(tableData.teams);
      setLigaName(tableData.liganame || 'Liga');
    } catch (err) {
      console.error('Error loading teams:', err);
      setError(err instanceof Error ? err.message : 'Fehler beim Laden der Teams');
    } finally {
      setLoading(false);
    }
  };

  const handleTeamSelect = async () => {
    if (!selectedTeamId) return;

    const selectedTeam = teams.find(t => t.teamId === selectedTeamId);
    if (!selectedTeam) return;

    try {
      setLoading(true);
      
      // Save selected team info
      const teamData = {
        teamId: selectedTeam.teamId,
        teamName: selectedTeam.teamName,
        clubId: selectedTeam.clubId,
        clubName: selectedTeam.clubName,
      };
      
      setTeam(teamData as any);
      
      // Store for later use
      localStorage.setItem('onboarding_team', JSON.stringify(teamData));
      
      // Start syncing in background (don't wait)
      const ligaId = localStorage.getItem('onboarding_liga_id');
      if (ligaId) {
        bbbSyncService.syncLiga(parseInt(ligaId), { skipMatchInfo: true }).catch(console.error);
      }
      
      nextStep();
    } catch (err) {
      console.error('Error selecting team:', err);
      setError('Fehler beim Speichern des Teams');
    } finally {
      setLoading(false);
    }
  };

  if (loading && teams.length === 0) {
    return (
      <div className="max-w-2xl mx-auto flex flex-col items-center justify-center py-12">
        <Loader className="w-8 h-8 text-orange-500 animate-spin mb-4" />
        <p className="text-gray-600">Lade Teams...</p>
      </div>
    );
  }

  if (error && teams.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-800">{error}</p>
              <button
                onClick={loadTeams}
                className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
              >
                Erneut versuchen
              </button>
            </div>
          </div>
        </div>
        <button
          onClick={previousStep}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Zurück
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Wähle dein Team
        </h2>
        <p className="text-gray-600">
          {ligaName && <span className="font-semibold">{ligaName}</span>}
          {ligaName && ' - '}
          {teams.length} Teams gefunden
        </p>
      </div>

      <div className="grid gap-3 mb-6 max-h-96 overflow-y-auto">
        {teams.map((team) => (
          <button
            key={team.teamId}
            onClick={() => setSelectedTeamId(team.teamId)}
            className={`text-left p-4 rounded-lg border-2 transition-all ${
              selectedTeamId === team.teamId
                ? 'border-orange-500 bg-orange-50'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
            disabled={loading}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">
                  {team.teamName}
                </h3>
                <p className="text-sm text-gray-600">
                  {team.clubName}
                </p>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="text-center">
                  <div className="flex items-center gap-1 text-gray-500">
                    <Trophy className="w-4 h-4" />
                    <span>Platz</span>
                  </div>
                  <p className="font-bold text-lg text-gray-900">
                    {team.position}
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-gray-500">Bilanz</div>
                  <p className="font-semibold">
                    {team.wins}-{team.losses}
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-gray-500">Punkte</div>
                  <p className="font-semibold">
                    {team.points}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Stats bar */}
            <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
              <span>{team.games} Spiele</span>
              <span>•</span>
              <span>{team.scoredPoints} : {team.concededPoints} Körbe</span>
              <span>•</span>
              <span className={team.pointsDifference > 0 ? 'text-green-600' : 'text-red-600'}>
                {team.pointsDifference > 0 ? '+' : ''}{team.pointsDifference} Diff
              </span>
            </div>
          </button>
        ))}
      </div>

      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <p className="text-sm text-blue-800">
          <strong>Tipp:</strong> Wähle das Team aus, das du trainierst. 
          Die App markiert dieses Team automatisch in allen Ansichten.
        </p>
      </div>

      <div className="flex gap-4">
        <button
          onClick={previousStep}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Zurück
        </button>
        <button
          onClick={handleTeamSelect}
          disabled={!selectedTeamId || loading}
          className="flex-1 bg-orange-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-orange-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {loading ? 'Speichere...' : 'Weiter'}
        </button>
      </div>
    </div>
  );
}
