/**
 * Dashboard - Hauptansicht nach Onboarding
 * 
 * Domain-Driven Design:
 * - Orchestriert verschiedene Domain-Komponenten
 * - Zentrale Navigation
 * 
 * Phase 2: Multi-Team Support
 * - TeamSwitcher im Header
 * - TeamOverview View
 * - Dynamischer Team-Wechsel
 * 
 * WCAG 2.0 AA:
 * - Keyboard Navigation
 * - Screen Reader Support
 * - Touch Targets min. 44x44px
 */

import React, { useEffect, useState } from 'react';
import { useAppStore } from '@/stores/appStore';
import { teamService } from '@/domains/team/services/TeamService';
import { bbbSyncService } from '@/domains/bbb-api/services/BBBSyncService';
import { db } from '@/shared/db/database';
import { Home, Users, Calendar, ShirtIcon, BarChart3, Settings, RefreshCw, Layers } from 'lucide-react';
import type { Team } from '@/shared/types';
import { SpielerVerwaltung } from '@/domains/spieler/components/SpielerVerwaltung';
import { SpielplanListe } from '@/domains/spielplan/components/SpielplanListe';
import { TabellenAnsicht, type TabellenEintrag } from '@/domains/spielplan/components/TabellenAnsicht';
import { tabellenService } from '@/domains/spielplan/services/TabellenService';
import { TeamSwitcher } from '@/shared/components/TeamSwitcher';
import { TeamOverview } from './components/TeamOverview';
import { debugTeamData } from '@/shared/utils/debugTeamData';
import { repairU10Spiele } from '@/shared/utils/repairU10Spiele';

type View = 'overview' | 'teams' | 'spieler' | 'spielplan' | 'tabelle' | 'statistik' | 'einstellungen';

export function Dashboard() {
  const currentTeamId = useAppStore(state => state.currentTeamId);
  const myTeamIds = useAppStore(state => state.myTeamIds);
  const [team, setTeam] = useState<Team | null>(null);
  const [currentView, setCurrentView] = useState<View>('overview');
  const [stats, setStats] = useState({
    spieler: 0,
    trikots: 0,
    spiele: 0,
  });
  const [tabelle, setTabelle] = useState<TabellenEintrag[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isInitialSync, setIsInitialSync] = useState(false);

  useEffect(() => {
    loadData();
  }, [currentTeamId]);

  // ⭐ Auto-Sync beim ersten Laden (wenn online)
  useEffect(() => {
    const performInitialSync = async () => {
      // Nur beim ersten Laden UND wenn online
      if (!navigator.onLine || isInitialSync) {
        return;
      }

      try {
        // Hole alle Teams des Users
        const allTeams = await Promise.all(
          myTeamIds.map(id => teamService.getTeamById(id))
        );

        // Sammle alle eindeutigen Liga-IDs
        const ligaIds = new Set<number>();
        for (const team of allTeams) {
          if (team?.liga_id) {
            const ligaIdMatch = team.liga_id.match(/\d+/);
            if (ligaIdMatch) {
              ligaIds.add(parseInt(ligaIdMatch[0], 10));
            }
          }
        }

        if (ligaIds.size === 0) {
          console.log('⚠️ Keine Ligen zum Synchronisieren gefunden');
          return;
        }

        // Prüfe ob Sync nötig ist (letzte Sync > 6 Stunden her)
        const lastSyncKey = 'last-auto-sync';
        const lastSync = localStorage.getItem(lastSyncKey);
        const sixHoursAgo = Date.now() - 6 * 60 * 60 * 1000;

        if (lastSync && parseInt(lastSync) > sixHoursAgo) {
          console.log('✅ Sync nicht nötig - letzter Sync vor', Math.round((Date.now() - parseInt(lastSync)) / 1000 / 60), 'Minuten');
          return;
        }

        console.log('🔄 Starte automatischen Liga-Sync für', ligaIds.size, 'Ligen...');
        setIsInitialSync(true);

        // Synchronisiere alle Ligen
        for (const ligaId of Array.from(ligaIds)) {
          try {
            console.log('🎯 Auto-Sync Liga:', ligaId);
            await bbbSyncService.syncLiga(ligaId, { skipMatchInfo: true });
            console.log('✅ Liga', ligaId, 'synchronisiert');
          } catch (error) {
            console.error('❌ Auto-Sync fehlgeschlagen für Liga', ligaId, ':', error);
            // Weiter mit nächster Liga
          }

          // Rate-Limiting
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Speichere Sync-Zeitpunkt
        localStorage.setItem(lastSyncKey, Date.now().toString());

        console.log('✅ Auto-Sync abgeschlossen');

        // Daten neu laden
        await loadData();

      } catch (error) {
        console.error('❌ Auto-Sync fehlgeschlagen:', error);
      } finally {
        setIsInitialSync(false);
      }
    };

    // Starte nach 1 Sekunde (damit UI zuerst geladen wird)
    const timer = setTimeout(performInitialSync, 1000);
    return () => clearTimeout(timer);
  }, [myTeamIds]); // Nur bei Änderung der Team-IDs

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

  const handleSync = async () => {
    if (!team?.liga_id || isSyncing) return;
    
    setIsSyncing(true);
    
    try {
      // Extrahiere Liga-ID
      const ligaIdMatch = team.liga_id.match(/\d+/);
      if (!ligaIdMatch) {
        console.error('Keine gültige Liga-ID gefunden');
        return;
      }
      
      const ligaId = parseInt(ligaIdMatch[0], 10);
      console.log('🔄 Starte manuellen Liga-Sync:', ligaId);
      
      await bbbSyncService.syncLiga(ligaId, { skipMatchInfo: true });
      
      console.log('✅ Liga-Sync erfolgreich');
      
      // Daten neu laden
      await loadData();
      
    } catch (error) {
      console.error('❌ Liga-Sync fehlgeschlagen:', error);
      alert('Sync fehlgeschlagen: ' + (error as Error).message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleTeamSelected = () => {
    // Nach Team-Wechsel zur Übersicht
    setCurrentView('overview');
  };

  const handleDebug = async () => {
    console.log('🔍 Starte Team-Daten Debug...');
    await debugTeamData();
    console.log('✅ Debug abgeschlossen - siehe Console-Ausgabe oben');
  };

  const handleRepair = async () => {
    if (!confirm('🔧 Möchtest du die U10-Spiele reparieren? Dies setzt fehlende heim_team_id/gast_team_id Felder.')) {
      return;
    }
    
    console.log('🔧 Starte DB Repair...');
    try {
      await repairU10Spiele();
      alert('✅ Repair erfolgreich! Lade Seite neu...');
      await loadData(); // Daten neu laden
    } catch (error) {
      console.error('❌ Repair fehlgeschlagen:', error);
      alert('❌ Repair fehlgeschlagen: ' + (error as Error).message);
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

  // ⭐ Loading State während Auto-Sync
  if (isInitialSync) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div 
          className="text-center"
          role="status"
          aria-live="polite"
        >
          <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Synchronisiere Liga-Daten...
          </h2>
          <p className="text-gray-600">
            Dies kann einen Moment dauern.
          </p>
        </div>
      </div>
    );
  }

  const navigationItems = [
    { id: 'overview' as View, label: 'Übersicht', icon: Home },
    ...(myTeamIds.length > 1 ? [{ id: 'teams' as View, label: 'Meine Teams', icon: Layers }] : []),
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
          <div className="flex items-center justify-between gap-4">
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
            
            <div className="flex items-center gap-3">
              {/* ✅ TeamSwitcher */}
              <TeamSwitcher />
              
              {/* Debug & Repair Buttons (Development) */}
              {process.env.NODE_ENV === 'development' && (
                <div className="flex gap-2">
                  <button
                    onClick={handleDebug}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors min-h-[44px]"
                    title="Debug Team-Daten"
                  >
                    🔍 Debug
                  </button>
                  <button
                    onClick={handleRepair}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors min-h-[44px]"
                    title="U10-Spiele reparieren"
                  >
                    🔧 Repair
                  </button>
                </div>
              )}
              
              {/* Sync Button */}
              {team.liga_id && (
                <button
                  onClick={handleSync}
                  disabled={isSyncing}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
                  title="Liga-Daten synchronisieren"
                >
                  <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">{isSyncing ? 'Synchronisiere...' : 'Sync'}</span>
                </button>
              )}
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
                    border-b-2 transition-colors whitespace-nowrap min-h-[44px]
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

        {/* ✅ Team Overview View */}
        {currentView === 'teams' && (
          <TeamOverview onTeamSelect={handleTeamSelected} />
        )}

        {currentView === 'spieler' && (
          <SpielerVerwaltung teamId={team.team_id} />
        )}

        {currentView === 'spielplan' && (
          <SpielplanListe teamId={team.team_id} teamName={team.name} />
        )}

        {currentView === 'tabelle' && (
          <div className="space-y-4">
            {/* Status-Banner wenn keine Daten */}
            {tabelle.length === 0 && team.liga_id && (
              <div className="alert-warning">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold mb-1">
                      📦 Keine Tabellendaten verfügbar
                    </h3>
                    <p className="text-sm">
                      Synchronisiere die Liga-Daten, um die aktuelle Tabelle zu laden.
                    </p>
                  </div>
                  <button
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="btn-primary"
                  >
                    <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? 'Lädt...' : 'Jetzt synchronisieren'}
                  </button>
                </div>
              </div>
            )}
            
            {/* Info wenn keine Liga-ID */}
            {!team.liga_id && (
              <div className="alert-info">
                <h3 className="font-semibold mb-1">
                  ℹ️ Keine Liga zugeordnet
                </h3>
                <p className="text-sm">
                  Diesem Team ist keine Liga zugeordnet. Tabellendaten können nicht geladen werden.
                </p>
              </div>
            )}
            
            <TabellenAnsicht 
              eintraege={tabelle}
              eigenerVerein={team.name}
              title={`Tabelle - ${team.altersklasse} ${team.saison}`}
            />
          </div>
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
    </div>
  );
}
