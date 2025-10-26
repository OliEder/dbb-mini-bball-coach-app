/**
 * Welcome Step - Onboarding v2
 * 
 * Begrüßung und Übersicht des Onboarding-Prozesses
 */

import React from 'react';
import { Users, Calendar, Trophy, CheckCircle } from 'lucide-react';

interface WelcomeStepProps {
  onNext: () => void;
}

export const WelcomeStep: React.FC<WelcomeStepProps> = ({ onNext }) => {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Willkommen beim Basketball Team Manager
        </h1>
        <p className="text-lg text-gray-600">
          Verwalten Sie Ihre Mini-Basketball Teams einfach und effizient
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">
          Was Sie mit dieser App können:
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-start">
            <Users className="h-6 w-6 text-blue-500 mt-1 mr-3 flex-shrink-0" />
            <div>
              <h3 className="font-semibold">Team-Verwaltung</h3>
              <p className="text-gray-600">
                Verwalten Sie Spieler, Trikots und Einsatzzeiten gemäß DBB-Regeln
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <Calendar className="h-6 w-6 text-green-500 mt-1 mr-3 flex-shrink-0" />
            <div>
              <h3 className="font-semibold">Spielplan-Integration</h3>
              <p className="text-gray-600">
                Automatischer Import von Liga-Daten und Spielplänen aus basketball-bund.net
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <Trophy className="h-6 w-6 text-orange-500 mt-1 mr-3 flex-shrink-0" />
            <div>
              <h3 className="font-semibold">Live-Spieltag</h3>
              <p className="text-gray-600">
                Einsatzplanung und Live-Tracking während des Spiels mit DBB-Regelvalidierung
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold text-blue-800 mb-3">
          Der Einrichtungsprozess
        </h2>
        <ol className="space-y-2 text-blue-700">
          <li className="flex items-center">
            <CheckCircle className="h-4 w-4 mr-2" />
            <span>1. Persönliche Daten eingeben</span>
          </li>
          <li className="flex items-center">
            <CheckCircle className="h-4 w-4 mr-2" />
            <span>2. Verband und Liga auswählen</span>
          </li>
          <li className="flex items-center">
            <CheckCircle className="h-4 w-4 mr-2" />
            <span>3. Verein und Teams festlegen</span>
          </li>
          <li className="flex items-center">
            <CheckCircle className="h-4 w-4 mr-2" />
            <span>4. Liga-Daten synchronisieren</span>
          </li>
        </ol>
        <p className="mt-3 text-sm text-blue-600">
          ⏱️ Geschätzte Dauer: 5-10 Minuten
        </p>
      </div>

      <div className="text-center">
        <button
          onClick={onNext}
          className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg 
                     hover:bg-blue-700 transition-colors focus:outline-none 
                     focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Los geht's →
        </button>
        
        <p className="mt-4 text-sm text-gray-500">
          Alle Daten werden lokal auf Ihrem Gerät gespeichert
        </p>
      </div>
    </div>
  );
};
