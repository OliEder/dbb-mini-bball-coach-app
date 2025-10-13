/**
 * Dashboard - Hauptansicht nach Onboarding
 * 
 * Domain-Driven Design:
 * - Orchestriert verschiedene Domain-Komponenten
 * - Zentrale Navigation
 * 
 * WCAG 2.0 AA:
 * - Keyboard Navigation
 * - Screen Reader Support
 * - Touch Targets min. 44x44px
 */

import React, { useEffect, useState } from 'react';
import { useAppStore } from '@/stores/appStore';
import { teamService } from '@/domains/team/services/TeamService';
import { db } from '@/shared/db/database';
import { Home, Users, Calendar, ShirtIcon, BarChart3, Settings } from 'lucide-react';
import type { Team } from '@/shared/types';
import { SpielerVerwaltung } from '@/domains/spieler/components/SpielerVerwaltung';
import { SpielplanListe } from '@/domains/spielplan/components/SpielplanListe';
import { TabellenAnsicht, type TabellenEintrag } from '@/domains/spielplan/components/TabellenAnsicht';
import { tabellenService } from '@/domains/spielplan/services/TabellenService';
import { DevTools } from '@/shared/components/DevTools';

type View = 'overview' | 'spieler' | 'spielplan' | 'tabelle' | 'statistik' | 'einstellungen';

export function Dashboard() {
  const currentTeamId = useAppStore(state => state.currentTeamId);
  const [team, setTeam] = useState<Team | null>(null);
  const [currentView, setCurrentView] = useState<View>('overview');
  const [stats, setStats] = useState({
    spieler: 0,
    trikots: 0,
    spiele: 0,
  });
  const [tabelle, setTabelle] = useState<TabellenEintrag[]>([]);

  useEffect(() => {
    loadData();
  }, [currentTeamId]);

  const loadData = async () => {
    if (!currentTeamId) return;

    const loadedTeam = await teamService.getTeamById(currentTeamId);
    if (loadedTeam) {
      setTeam(loadedTeam);
      
      const spielerCount = await db.spieler.where({ team_id: currentTeamId }).count();
      const trikotCount = await db.trikots.where({ team_id: currentTeamId }).count();
      const spieleCount = await db.spiele.where({ team_id: currentTeamId }).count();
      
      setStats({
        spieler: spielerCount,
        trikots: trikotCount,
        spiele: spieleCount,
      });

      // ⭐ Lade Tabellen-Daten aus der Datenbank
      try {
        const tabellenDaten = await tabellenService.loadTabelleForTeam(currentTeamId);
        setTabelle(tabellenDaten);
      } catch (error) {
        console.error('Error loading tabelle:', error);
      }
    }
  };

  if (!team) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div 
          className="text-center"
          role="status"
          aria-live="polite"
        >
          <div className="animate-pulse text-gray-400">
            Lade Dashboard...
          </div>
        </div>
      </div>
    );
  }

  const navigationItems = [
    { id: 'overview' as View, label: 'Übersicht', icon: Home },
    { id: 'spieler' as View, label: 'Spieler', icon: Users },
    { id: 'spielplan' as View, label: 'Spielplan', icon: Calendar },
    { id: 'tabelle' as View, label: 'Tabelle', icon: BarChart3 },
    { id: 'statistik' as View, label: 'Statistik', icon: BarChart3 },
    { id: 'einstellungen' as View, label: 'Einstellungen', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Home className="w-8 h-8 text-primary-600" aria-hidden="true" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {team.name}
                </h1>
                <p className="text-sm text-gray-600">
                  {team.altersklasse} • Saison {team.saison}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav 
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
          aria-label="Hauptnavigation"
        >
          <div className="flex gap-2 overflow-x-auto">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`
                    flex items-center gap-2 px-4 py-3 text-sm font-medium
                    border-b-2 transition-colors whitespace-nowrap
                    ${isActive
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                    }
                  `}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="w-5 h-5" aria-hidden="true" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'overview' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Übersicht
              </h2>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <button
                  onClick={() => setCurrentView('spieler')}
                  className="card hover:shadow-lg transition-shadow text-left"
                  aria-label={`${stats.spieler} Spieler - Zur Spielerverwaltung`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-primary-600" aria-hidden="true" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        {stats.spieler}
                      </div>
                      <div className="text-sm text-gray-600">
                        Spieler
                      </div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setCurrentView('spielplan')}
                  className="card hover:shadow-lg transition-shadow text-left"
                  aria-label={`${stats.spiele} Spiele - Zum Spielplan`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-warning-600" aria-hidden="true" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        {stats.spiele}
                      </div>
                      <div className="text-sm text-gray-600">
                        Spiele
                      </div>
                    </div>
                  </div>
                </button>

                <div className="card">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
                      <ShirtIcon className="w-6 h-6 text-success-600" aria-hidden="true" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        {stats.trikots}
                      </div>
                      <div className="text-sm text-gray-600">
                        Trikots
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Welcome Message */}
              <div className="alert-info">
                <h3 className="font-semibold mb-2">
                  🎉 Willkommen im Basketball Team Manager!
                </h3>
                <p className="text-sm">
                  Dein Team wurde erfolgreich eingerichtet. Nutze die Navigation oben, 
                  um Spieler zu verwalten, den Spielplan einzusehen oder Statistiken zu analysieren.
                </p>
              </div>
            </div>
          </div>
        )}

        {currentView === 'spieler' && (
          <SpielerVerwaltung teamId={team.team_id} />
        )}

        {currentView === 'spielplan' && (
          <SpielplanListe teamId={team.team_id} teamName={team.name} />
        )}

        {currentView === 'tabelle' && (
          <TabellenAnsicht 
            eintraege={tabelle}
            eigenerVerein={team.name}
            title={`Tabelle - ${team.altersklasse} ${team.saison}`}
          />
        )}

        {currentView === 'statistik' && (
          <div className="card text-center py-12">
            <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" aria-hidden="true" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Statistik
            </h3>
            <p className="text-gray-600">
              Die Statistik-Auswertung wird in Kürze verfügbar sein.
            </p>
          </div>
        )}

        {currentView === 'einstellungen' && (
          <div className="card text-center py-12">
            <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" aria-hidden="true" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Einstellungen
            </h3>
            <p className="text-gray-600">
              Die Einstellungen werden in Kürze verfügbar sein.
            </p>
          </div>
        )}
      </main>

      {/* Dev Tools - nur im Development Mode */}
      <DevTools />
    </div>
  );
}
