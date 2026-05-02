import React, { useEffect, useMemo } from 'react';
import { Search, Building2, Loader2 } from 'lucide-react';
import {
  useSimpleOnboardingStore,
  searchClubs,
  type VRClub,
} from '../onboarding-simple.store';

interface SimplifiedVereinStepProps {
  onNext: (club: VRClub) => void;
  onBack: () => void;
}

export const SimplifiedVereinStep: React.FC<SimplifiedVereinStepProps> = ({
  onNext,
  onBack,
}) => {
  const {
    clubs,
    clubsLoaded,
    clubsError,
    searchQuery,
    selectedClub,
    loadClubs,
    setSearchQuery,
    setSelectedClub,
  } = useSimpleOnboardingStore();

  useEffect(() => {
    loadClubs();
  }, [loadClubs]);

  const filtered = useMemo(
    () => searchClubs(clubs, searchQuery),
    [clubs, searchQuery]
  );

  const handleSubmit = () => {
    if (selectedClub) onNext(selectedClub);
  };

  if (!clubsLoaded && !clubsError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Vereine werden geladen...</p>
        </div>
      </div>
    );
  }

  if (clubsError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md bg-white rounded-lg shadow-lg p-6 text-center">
          <p className="text-gray-600 mb-4">{clubsError}</p>
          <button
            onClick={() => loadClubs()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Wähle deinen Verein
          </h1>
          <p className="text-gray-600">
            {clubs.length.toLocaleString()} Vereine verfügbar
          </p>
        </div>

        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="z.B. Baskets Neumarkt"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="mb-4 text-sm text-gray-600">
          {filtered.length === clubs.length
            ? `Alle ${clubs.length.toLocaleString()} Vereine`
            : `${filtered.length.toLocaleString()} von ${clubs.length.toLocaleString()} Vereinen`}
        </div>

        <div className="mb-6 max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Keine Vereine gefunden</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filtered.map((club) => (
                <label
                  key={club.clubId}
                  className={`flex items-center p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                    selectedClub?.clubId === club.clubId ? 'bg-blue-50' : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="verein"
                    checked={selectedClub?.clubId === club.clubId}
                    onChange={() => setSelectedClub(club)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">{club.name}</p>
                    <p className="text-sm text-gray-500">{club.verbandName}</p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            ← Zurück
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedClub}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Weiter →
          </button>
        </div>
      </div>
    </div>
  );
};
