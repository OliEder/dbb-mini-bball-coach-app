/**
 * Welcome Step - Erster Schritt im Onboarding
 */

import React from 'react';
import { Trophy, Users, Calendar, BarChart } from 'lucide-react';
import { useOnboardingStore } from '@/stores/onboardingStore';

export function WelcomeStep() {
  const nextStep = useOnboardingStore(state => state.nextStep);

  const features = [
    {
      icon: Users,
      title: 'Team Management',
      description: 'Verwalte deine Spieler und Teams'
    },
    {
      icon: Calendar,
      title: 'Spielplan',
      description: 'Behalte alle Spiele im Blick'
    },
    {
      icon: Trophy,
      title: 'Live Spielbogen',
      description: 'Erfasse Spielstatistiken in Echtzeit'
    },
    {
      icon: BarChart,
      title: 'Statistiken',
      description: 'Analysiere die Entwicklung deines Teams'
    }
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-100 rounded-full mb-4">
          <span className="text-4xl">🏀</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Willkommen zur Basketball Trainer App
        </h1>
        <p className="text-lg text-gray-600">
          Deine digitale Unterstützung für erfolgreiches Coaching
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div
              key={index}
              className="bg-white p-4 rounded-lg border border-gray-200 hover:border-orange-300 transition-colors"
            >
              <Icon className="w-8 h-8 text-orange-500 mb-2" />
              <h3 className="font-semibold text-gray-900 mb-1">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-600">
                {feature.description}
              </p>
            </div>
          );
        })}
      </div>

      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <p className="text-sm text-blue-800">
          <strong>Tipp:</strong> Die Einrichtung dauert nur wenige Minuten. 
          Du kannst deine Liga-Daten direkt vom DBB importieren!
        </p>
      </div>

      <button
        onClick={() => nextStep()}
        className="w-full bg-orange-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
      >
        Los geht's! 🚀
      </button>
    </div>
  );
}
