/**
 * SpielplanListe - Übersicht aller Spiele eines Teams
 * 
 * WCAG 2.0 AA Compliance:
 * - Keyboard Navigation (Tab, Enter, Space)
 * - Screen Reader Support (aria-labels, roles)
 * - Touch Targets min. 44x44px
 * - Kontrastverhältnis 4.5:1
 * - Focus Indicators (2px outline, 2px offset)
 */

import React, { useState, useEffect } from 'react';
import { spielService } from '../services/SpielService';
import type { Spiel } from '@/shared/types';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Home as HomeIcon, 
  Plane,
  Trophy,
  Filter,
  CheckCircle,
  Circle,
  XCircle
} from 'lucide-react';

interface SpielplanListeProps {
  teamId: string;
  teamName: string;
}

type FilterType = 'alle' | 'heimspiele' | 'auswaertsspiele' | 'geplant' | 'abgeschlossen';

export function SpielplanListe({ teamId, teamName }: SpielplanListeProps) {
  const [spiele, setSpiele] = useState<Spiel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<FilterType>('alle');
  const [stats, setStats] = useState({
    total: 0,
    geplant: 0,
    abgeschlossen: 0,
    heimspiele: 0,
    auswaertsspiele: 0,
    siege: 0,
    niederlagen: 0,
  });

  useEffect(() => {
    loadSpiele();
    loadStats();
  }, [teamId, filterType]);

  const loadSpiele = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let filter = {};
      
      if (filterType === 'heimspiele') {
        filter = { ist_heimspiel: true };
      } else if (filterType === 'auswaertsspiele') {
        filter = { ist_heimspiel: false };
      } else if (filterType === 'geplant') {
        filter = { status: 'geplant' };
      } else if (filterType === 'abgeschlossen') {
        filter = { status: 'abgeschlossen' };
      }
      
      const data = await spielService.getSpieleByTeam(teamId, filter);
      setSpiele(data);
    } catch (err) {
      setError('Fehler beim Laden des Spielplans');
      console.error('Error loading spiele:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const teamStats = await spielService.getTeamStatistik(teamId);
      setStats(teamStats);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const formatDatum = (date: Date): string => {
    return new Date(date).toLocaleDateString('de-DE', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getStatusInfo = (status: Spiel['status']) => {
    switch (status) {
      case 'geplant':
        return { icon: Circle, color: 'text-gray-400', label: 'Geplant' };
      case 'live':
        return { icon: Circle, color: 'text-primary-600', label: 'Live' };
      case 'abgeschlossen':
        return { icon: CheckCircle, color: 'text-success-600', label: 'Beendet' };
      case 'abgesagt':
        return { icon: XCircle, color: 'text-error-600', label: 'Abgesagt' };
    }
  };

  const filterButtons: { id: FilterType; label: string; icon: React.ReactNode }[] = [
    { id: 'alle', label: 'Alle', icon: <Calendar className="w-4 h-4" /> },
    { id: 'heimspiele', label: 'Heim', icon: <HomeIcon className="w-4 h-4" /> },
    { id: 'auswaertsspiele', label: 'Auswärts', icon: <Plane className="w-4 h-4" /> },
    { id: 'geplant', label: 'Geplant', icon: <Circle className="w-4 h-4" /> },
    { id: 'abgeschlossen', label: 'Beendet', icon: <CheckCircle className="w-4 h-4" /> },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div 
          className="animate-pulse text-gray-400"
          role="status"
          aria-live="polite"
        >
          Lade Spielplan...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="w-8 h-8 text-primary-600" aria-hidden="true" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Spielplan
            </h2>
            <p className="text-sm text-gray-600">
              {spiele.length} {spiele.length === 1 ? 'Spiel' : 'Spiele'} gefunden
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div 
          className="alert-error" 
          role="alert"
          aria-live="assertive"
        >
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-600">Spiele gesamt</div>
        </div>
        
        <div className="card text-center">
          <div className="text-2xl font-bold text-primary-600">{stats.geplant}</div>
          <div className="text-sm text-gray-600">Noch anstehend</div>
        </div>
        
        <div className="card text-center">
          <div className="text-2xl font-bold text-success-600">{stats.siege}</div>
          <div className="text-sm text-gray-600">Siege</div>
        </div>
        
        <div className="card text-center">
          <div className="text-2xl font-bold text-error-600">{stats.niederlagen}</div>
          <div className="text-sm text-gray-600">Niederlagen</div>
        </div>
      </div>

      {/* Filter */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-5 h-5 text-gray-600" aria-hidden="true" />
          <span className="font-medium text-gray-900">Filter:</span>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {filterButtons.map((btn) => (
            <button
              key={btn.id}
              onClick={() => setFilterType(btn.id)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                transition-colors
                ${filterType === btn.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
              aria-pressed={filterType === btn.id}
              aria-label={`Filter: ${btn.label}`}
            >
              {btn.icon}
              <span>{btn.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Spiele Liste */}
      {spiele.length === 0 ? (
        <div className="card text-center py-12">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" aria-hidden="true" />
          <p className="text-gray-600">
            Keine Spiele gefunden
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {spiele.map((spiel) => {
            const StatusIcon = getStatusInfo(spiel.status).icon;
            const isOwnTeamHome = spiel.ist_heimspiel;
            const ownScore = isOwnTeamHome ? spiel.ergebnis_heim : spiel.ergebnis_gast;
            const oppScore = isOwnTeamHome ? spiel.ergebnis_gast : spiel.ergebnis_heim;
            const hasResult = ownScore !== undefined && oppScore !== undefined;
            const isWin = hasResult && ownScore! > oppScore!;
            const isDraw = hasResult && ownScore === oppScore;
            
            return (
              <article
                key={spiel.spiel_id}
                className="card hover:shadow-lg transition-shadow"
                aria-labelledby={`spiel-${spiel.spiel_id}-title`}
              >
                <div className="flex items-center gap-4">
                  {/* Status Icon */}
                  <div className="flex-shrink-0">
                    <StatusIcon 
                      className={`w-6 h-6 ${getStatusInfo(spiel.status).color}`}
                      aria-label={getStatusInfo(spiel.status).label}
                    />
                  </div>

                  {/* Heim/Auswärts Icon */}
                  <div className="flex-shrink-0">
                    {spiel.ist_heimspiel ? (
                      <div 
                        className="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center"
                        title="Heimspiel"
                      >
                        <HomeIcon className="w-5 h-5 text-success-600" aria-hidden="true" />
                      </div>
                    ) : (
                      <div 
                        className="w-10 h-10 bg-warning-100 rounded-lg flex items-center justify-center"
                        title="Auswärtsspiel"
                      >
                        <Plane className="w-5 h-5 text-warning-600" aria-hidden="true" />
                      </div>
                    )}
                  </div>

                  {/* Spielinfo */}
                  <div className="flex-1 min-w-0">
                    <h3 
                      id={`spiel-${spiel.spiel_id}-title`}
                      className="font-semibold text-gray-900"
                    >
                      {spiel.heim} vs {spiel.gast}
                    </h3>
                    
                    <div className="flex flex-wrap gap-3 text-sm text-gray-600 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" aria-hidden="true" />
                        {formatDatum(spiel.datum)}
                      </span>
                      
                      {spiel.uhrzeit && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" aria-hidden="true" />
                          {spiel.uhrzeit} Uhr
                        </span>
                      )}
                      
                      {spiel.spielnr && (
                        <span className="font-medium">
                          Spiel #{spiel.spielnr}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Ergebnis */}
                  {hasResult && (
                    <div className="flex-shrink-0">
                      <div 
                        className={`
                          px-4 py-2 rounded-lg font-bold text-lg
                          ${isWin ? 'bg-success-100 text-success-700' : ''}
                          ${isDraw ? 'bg-gray-100 text-gray-700' : ''}
                          ${!isWin && !isDraw ? 'bg-error-100 text-error-700' : ''}
                        `}
                        aria-label={`Ergebnis: ${ownScore} zu ${oppScore}`}
                      >
                        {ownScore}:{oppScore}
                        {isWin && <Trophy className="w-4 h-4 inline ml-2" aria-hidden="true" />}
                      </div>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
