/**
 * Completion Step
 * 
 * Zeigt Erfolgs-Message und navigiert automatisch zum Dashboard
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

interface CompletionStepProps {
  onComplete: () => Promise<void>;
}

export const CompletionStep: React.FC<CompletionStepProps> = ({ onComplete }) => {
  const navigate = useNavigate();
  const [isCompleting, setIsCompleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  useEffect(() => {
    const complete = async () => {
      if (isCompleting) return;
      
      setIsCompleting(true);
      
      try {
        await onComplete();
        
        // Kurze Verzögerung für UX
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 1500);
      } catch (err) {
        console.error('Failed to complete onboarding:', err);
        setError((err as Error).message);
        setIsCompleting(false);
      }
    };

    complete();
  }, [onComplete, navigate, isCompleting]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Fehler beim Abschließen
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Neu laden
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
        {/* Success Icon */}
        <div className="mb-6 animate-bounce">
          <CheckCircle className="w-20 h-20 mx-auto text-green-500" />
        </div>

        {/* Success Message */}
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Geschafft! 🎉
        </h1>
        
        <p className="text-lg text-gray-600 mb-6">
          Dein Team ist eingerichtet und bereit.
        </p>

        {/* Loading Indicator */}
        <div className="flex items-center justify-center space-x-2 text-blue-600">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-ping" />
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-ping" style={{ animationDelay: '0.2s' }} />
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-ping" style={{ animationDelay: '0.4s' }} />
        </div>
        
        <p className="text-sm text-gray-500 mt-4">
          Zum Dashboard wird weitergeleitet...
        </p>
      </div>
    </div>
  );
};
