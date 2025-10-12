/**
 * Welcome Step - KORRIGIERT
 * 
 * Erklärt den BBB-basierten Onboarding-Prozess
 */

import React from 'react';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { ArrowRight, Link2, Users, ShirtIcon, Trophy } from 'lucide-react';

export function WelcomeStep() {
  const setStep = useOnboardingStore(state => state.setStep);

  const handleStart = () => {
    setStep('bbb_url');
  };

  return (
    <div className="text-center">
      <div className="mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-100 rounded-full mb-4">
          <Trophy className="w-10 h-10 text-primary-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Willkommen beim Basketball Team Manager!
        </h2>
        <p className="text-lg text-gray-600">
          Lass uns zusammen dein Team einrichten.
        </p>
      </div>

      {/* Feature Overview */}
      <div className="grid gap-4 mb-8 text-left">
        <div className="flex items-start gap-3 p-4 bg-primary-50 rounded-lg">
          <Link2 className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">
              Automatischer Import von basketball-bund.net
            </h3>
            <p className="text-sm text-gray-600">
              Eine URL genügt! Wir importieren automatisch deine Liga, alle Teams, 
              den vollständigen Spielplan und Gegner-Informationen.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 bg-primary-50 rounded-lg">
          <Users className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">
              Spieler & Trikots per CSV
            </h3>
            <p className="text-sm text-gray-600">
              Einfacher CSV-Import für deine Spieler-Liste und Trikot-Verwaltung.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 bg-primary-50 rounded-lg">
          <ShirtIcon className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">
              Offline-Fähig & DSGVO-konform
            </h3>
            <p className="text-sm text-gray-600">
              Alle Daten bleiben auf deinem Gerät. Funktioniert auch ohne Internet.
            </p>
          </div>
        </div>
      </div>

      {/* What's Next */}
      <div className="alert-info mb-6">
        <h3 className="font-semibold mb-2">
          Was erwartet dich:
        </h3>
        <ul className="text-left text-sm space-y-1">
          <li>✅ <strong>Liga importieren</strong> – Eine basketball-bund.net URL eingeben</li>
          <li>✅ <strong>Team wählen</strong> – Dein Team aus der Liste auswählen</li>
          <li>✅ <strong>Spieler importieren</strong> – CSV-Datei hochladen</li>
          <li>✅ <strong>Trikots importieren</strong> – CSV-Datei hochladen</li>
          <li>✅ <strong>Fertig!</strong> – Spielplan ist automatisch synchronisiert</li>
        </ul>
      </div>

      {/* Start Button */}
      <button
        onClick={handleStart}
        className="btn-primary inline-flex items-center gap-2"
        type="button"
      >
        Los geht's!
        <ArrowRight className="w-5 h-5" aria-hidden="true" />
      </button>

      <p className="mt-4 text-sm text-gray-500">
        Geschätzte Dauer: 3-5 Minuten
      </p>
    </div>
  );
}
