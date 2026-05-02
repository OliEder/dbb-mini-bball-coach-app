/**
 * Onboarding Layout
 * 
 * KORRIGIERT: Neuer Progress-Flow mit BBB-Import zuerst
 */

import React from 'react';
import { CheckCircle, Circle } from 'lucide-react';

type OnboardingStep = 
  | 'welcome' 
  | 'bbb_url' 
  | 'team_select' 
  | 'spieler' 
  | 'trikots' 
  | 'complete';

interface OnboardingLayoutProps {
  currentStep: OnboardingStep;
  children: React.ReactNode;
}

const STEPS = [
  { id: 'welcome' as const, label: 'Willkommen' },
  { id: 'bbb_url' as const, label: 'Liga importieren' },
  { id: 'team_select' as const, label: 'Team wählen' },
  { id: 'spieler' as const, label: 'Spieler' },
  { id: 'trikots' as const, label: 'Trikots' },
  { id: 'complete' as const, label: 'Fertig' },
];

export function OnboardingLayout({ currentStep, children }: OnboardingLayoutProps) {
  const currentIndex = STEPS.findIndex(s => s.id === currentStep);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      {/* Skip to main content */}
      <a href="#onboarding-content" className="skip-link">
        Zum Hauptinhalt springen
      </a>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-900 mb-2">
            Basketball Team Manager
          </h1>
          <p className="text-lg text-primary-700">
            Lass uns dein Team einrichten!
          </p>
        </header>

        {/* Progress Indicator */}
        <nav 
          aria-label="Onboarding Fortschritt"
          className="mb-12"
        >
          <ol className="flex items-center justify-center space-x-2 md:space-x-4">
            {STEPS.map((step, index) => {
              const isComplete = index < currentIndex;
              const isCurrent = index === currentIndex;
              const isUpcoming = index > currentIndex;

              return (
                <li
                  key={step.id}
                  className="flex items-center"
                >
                  <div className="flex flex-col items-center">
                    {/* Step Indicator */}
                    <div
                      className={`
                        flex items-center justify-center w-10 h-10 rounded-full
                        transition-all duration-200
                        ${isComplete && 'bg-success-600 text-white'}
                        ${isCurrent && 'bg-primary-600 text-white ring-4 ring-primary-200'}
                        ${isUpcoming && 'bg-gray-200 text-gray-500'}
                      `}
                      aria-current={isCurrent ? 'step' : undefined}
                    >
                      {isComplete ? (
                        <CheckCircle 
                          className="w-6 h-6" 
                          aria-label="Abgeschlossen"
                        />
                      ) : (
                        <Circle 
                          className="w-6 h-6"
                          aria-label={isCurrent ? 'Aktuell' : 'Ausstehend'}
                        />
                      )}
                    </div>

                    {/* Step Label - Only show on desktop */}
                    <span
                      className={`
                        hidden md:block mt-2 text-sm font-medium
                        ${isComplete && 'text-success-700'}
                        ${isCurrent && 'text-primary-900'}
                        ${isUpcoming && 'text-gray-500'}
                      `}
                    >
                      {step.label}
                    </span>
                  </div>

                  {/* Connector Line */}
                  {index < STEPS.length - 1 && (
                    <div
                      className={`
                        w-8 md:w-16 h-1 mx-2
                        ${index < currentIndex ? 'bg-success-600' : 'bg-gray-200'}
                      `}
                      aria-hidden="true"
                    />
                  )}
                </li>
              );
            })}
          </ol>

          {/* Current Step Label - Mobile */}
          <p className="md:hidden text-center mt-4 text-lg font-medium text-primary-900">
            {STEPS[currentIndex]?.label}
          </p>
        </nav>

        {/* Main Content */}
        <main
          id="onboarding-content"
          className="max-w-2xl mx-auto"
        >
          <div className="card">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="text-center mt-8 text-sm text-primary-700">
          <p>
            Du kannst den Onboarding-Prozess jederzeit unterbrechen.
            Deine Eingaben werden automatisch gespeichert.
          </p>
        </footer>
      </div>
    </div>
  );
}
