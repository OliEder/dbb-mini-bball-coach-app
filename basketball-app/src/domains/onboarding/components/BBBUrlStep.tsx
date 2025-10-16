/**
 * BBB URL Step - Liga-Import aus basketball-bund.net
 */

import React, { useState } from 'react';
import { Globe, AlertCircle, Loader, CheckCircle } from 'lucide-react';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { BBBApiService } from '@/domains/bbb-api/services/BBBApiService';

export function BBBUrlStep() {
  const { nextStep, previousStep, setBbbUrl, bbb_url } = useOnboardingStore();
  const [url, setUrl] = useState(bbb_url || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [validUrl, setValidUrl] = useState(false);

  const validateUrl = (inputUrl: string): number | null => {
    // Extract Liga ID using the static method from BBBApiService
    const ligaId = BBBApiService.extractLigaId(inputUrl);
    
    if (!ligaId) {
      // Check if it's at least a basketball-bund.net URL
      if (!inputUrl.includes('basketball-bund.net')) {
        setError('Bitte gib eine URL von basketball-bund.net ein');
        return null;
      }
      setError('Keine Liga-ID in der URL gefunden. Bitte verwende eine Liga-Seite.');
      return null;
    }
    
    return ligaId;
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    setError('');
    setValidUrl(false);
    
    // Clear error when typing
    if (newUrl && newUrl.length > 10) {
      const ligaId = validateUrl(newUrl);
      if (ligaId) {
        setValidUrl(true);
      }
    }
  };

  const handleSubmit = async () => {
    const ligaId = validateUrl(url);
    
    if (!ligaId) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Save URL and Liga ID
      setBbbUrl(url);
      
      // Store Liga ID for next step
      localStorage.setItem('onboarding_liga_id', ligaId.toString());
      
      // Proceed to team selection
      nextStep();
    } catch (err) {
      setError('Fehler beim Verarbeiten der URL. Bitte versuche es erneut.');
      console.error('Error processing URL:', err);
    } finally {
      setLoading(false);
    }
  };

  const sampleUrls = [
    'https://www.basketball-bund.net/index.jsp?Action=101&liga_id=51961',
    'https://www.basketball-bund.net/liga/tabelle.jsp?ligaid=51961',
    'https://www.basketball-bund.net/public/ergebnisse.jsp?liga_id=51961'
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Liga-Import aus basketball-bund.net
        </h2>
        <p className="text-gray-600">
          Kopiere die URL deiner Liga von basketball-bund.net, um Teams und Spielplan zu importieren.
        </p>
      </div>

      <div className="mb-6">
        <label htmlFor="bbb-url" className="block text-sm font-medium text-gray-700 mb-2">
          Liga-URL
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Globe className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="bbb-url"
            type="url"
            value={url}
            onChange={handleUrlChange}
            placeholder="https://www.basketball-bund.net/..."
            className={`block w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-orange-500 focus:border-orange-500 ${
              error ? 'border-red-300' : validUrl ? 'border-green-300' : 'border-gray-300'
            }`}
            disabled={loading}
          />
          {validUrl && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
          )}
        </div>
        {error && (
          <div className="mt-2 flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>

      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h3 className="font-semibold text-gray-700 mb-2">Wo finde ich die URL?</h3>
        <ol className="text-sm text-gray-600 space-y-1">
          <li>1. Gehe zu <a href="https://www.basketball-bund.net" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline">basketball-bund.net</a></li>
          <li>2. Navigiere zu deiner Liga (über "Ergebnisse" oder "Ligen")</li>
          <li>3. Kopiere die URL aus der Adressleiste deines Browsers</li>
        </ol>
      </div>

      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Beispiel-URLs:</h4>
        <div className="space-y-2">
          {sampleUrls.map((sampleUrl, index) => (
            <button
              key={index}
              onClick={() => {
                setUrl(sampleUrl);
                setError('');
                setValidUrl(true);
              }}
              className="block w-full text-left text-xs text-gray-500 hover:text-orange-500 hover:bg-orange-50 p-2 rounded transition-colors truncate"
            >
              {sampleUrl}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={previousStep}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Zurück
        </button>
        <button
          onClick={handleSubmit}
          disabled={!url || loading || !validUrl}
          className="flex-1 bg-orange-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-orange-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {loading ? (
            <>
              <Loader className="w-5 h-5 mr-2 animate-spin" />
              Lade Liga-Daten...
            </>
          ) : (
            'Weiter'
          )}
        </button>
      </div>
    </div>
  );
}
