/**
 * Team Select Step - SCHRITT 3
 * 
 * User wählt sein Team aus den geparsten BBB-Daten
 * + Eingabe des Trainer-Namens
 */

import React, { useState } from 'react';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { ArrowRight, ArrowLeft, Users, MapPin } from 'lucide-react';

export function TeamSelectStep() {
  const { 
    parsed_liga_data, 
    selected_team_name,
    trainer_name,
    setSelectedTeam, 
    setTrainerName,
    setStep, 
    canProceed 
  } = useOnboardingStore();
  
  const [selectedTeam, setSelectedTeamState] = useState(selected_team_name || '');
  const [trainer, setTrainer] = useState(trainer_name || '');
  const [error, setError] = useState('');

  if (!parsed_liga_data) {
    // Sollte nicht passieren, aber Fallback
    return (
      <div className="alert-error">
        <p>Keine Liga-Daten gefunden. Bitte gehe zurück und lade die Liga-Daten erneut.</p>
      </div>
    );
  }

  const handleSelectTeam = (teamName: string) => {
    setSelectedTeamState(teamName);
    setSelectedTeam(teamName);
    if (error) setError('');
  };

  const handleTrainerChange = (value: string) => {
    setTrainer(value);
    setTrainerName(value);
    if (error) setError('');
  };

  const validate = (): boolean => {
    if (!selectedTeam) {
      setError('Bitte wähle dein Team aus');
      return false;
    }
    if (!trainer.trim()) {
      setError('Bitte gib deinen Namen ein');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (validate() && canProceed()) {
      setStep('spieler');
    }
  };

  const handleBack = () => {
    setStep('bbb_url');
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Wähle dein Team
      </h2>
      <p className="text-gray-600 mb-2">
        Welches Team trainierst du?
      </p>
      <p className="text-sm text-gray-500 mb-6">
        Liga: <strong>{parsed_liga_data.liga.liga_name}</strong>
      </p>

      {/* Team Liste */}
      <div className="space-y-2 mb-6">
        {parsed_liga_data.teams.map((team) => (
          <button
            key={team.team_name}
            type="button"
            onClick={() => handleSelectTeam(team.team_name)}
            className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
              selectedTeam === team.team_name
                ? 'border-primary-600 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
            aria-pressed={selectedTeam === team.team_name}
          >
            <div className="flex items-start gap-3">
              <Users
                className={`w-6 h-6 flex-shrink-0 ${
                  selectedTeam === team.team_name
                    ? 'text-primary-600'
                    : 'text-gray-400'
                }`}
                aria-hidden="true"
              />
              <div className="flex-1">
                <div className="font-semibold text-gray-900">
                  {team.team_name}
                </div>
                <div className="text-sm text-gray-600 flex items-center gap-1">
                  <MapPin className="w-3 h-3" aria-hidden="true" />
                  {team.verein_name}
                  {team.verein_ort && ` • ${team.verein_ort}`}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Trainer Name */}
      <div className="mb-6">
        <label htmlFor="trainer-name" className="label label-required">
          Dein Name (Trainer)
        </label>
        <input
          id="trainer-name"
          type="text"
          value={trainer}
          onChange={(e) => handleTrainerChange(e.target.value)}
          className="input"
          placeholder="Max Mustermann"
          aria-describedby="trainer-name-help"
        />
        <p id="trainer-name-help" className="mt-1 text-sm text-gray-500">
          Wird in der App als Trainer angezeigt.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="alert-error mb-6" role="alert">
          {error}
        </div>
      )}

      {/* Info */}
      <div className="alert-info mb-6">
        <p className="text-sm">
          <strong>Automatisch importiert:</strong> Verein, Liga-Informationen und vollständiger Spielplan
          mit allen {parsed_liga_data.spiele.length} Spielen werden automatisch übernommen.
        </p>
      </div>

      {/* Navigation */}
      <div className="flex justify-between gap-4 pt-4">
        <button
          type="button"
          onClick={handleBack}
          className="btn-secondary inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" aria-hidden="true" />
          Zurück
        </button>

        <button
          type="button"
          onClick={handleNext}
          className="btn-primary inline-flex items-center gap-2"
          disabled={!canProceed()}
        >
          Weiter
          <ArrowRight className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
