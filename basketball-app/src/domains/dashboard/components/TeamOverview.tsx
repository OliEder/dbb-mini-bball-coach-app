/**
 * TeamOverview - Multi-Team Dashboard View
 * 
 * Zeigt alle Teams des Trainers mit Key-Metrics
 * Grid-Layout mit Team-Karten
 * 
 * WCAG 2.0 AA:
 * - Keyboard Navigation
 * - Focus States
 * - Screen Reader Support
 * - Touch Targets min. 44x44px
 */

import React, { useState, useEffect } from 'react';
import { Users, Calendar, TrendingUp, ChevronRight } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { teamService, type TeamStats } from '@/domains/team/services/TeamService';
import type { Team } from '@/shared/types';

interface TeamCardData extends Team {
  stats: TeamStats;
}

interface TeamOverviewProps {
  onTeamSelect?: (teamId: string) => void;
}

export const TeamOverview: React.FC<TeamOverviewProps> = ({ onTeamSelect }) => {
  const { myTeamIds, switchTeam } = useAppStore();
  const [teams, setTeams] = useState<TeamCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTeamsWithStats();
  }, [myTeamIds]);

  const loadTeamsWithStats = async () => {
    setIsLoading(true);
    try {
      const teamsData = await Promise.all(
        myTeamIds.map(async (teamId) => {
          const [team, stats] = await Promise.all([
            teamService.getTeamById(teamId),
            teamService.getTeamStats(teamId)
          ]);
          
          return team ? { ...team, stats } : null;
        })
      );
      
      setTeams(teamsData.filter(Boolean) as TeamCardData[]);
    } catch (error) {
      console.error('Failed to load teams:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenTeam = (teamId: string) => {
    switchTeam(teamId);
    if (onTeamSelect) {
      onTeamSelect(teamId);
    }
    // Reload page to update dashboard
    window.location.reload();
  };

  const handleKeyDown = (event: React.KeyboardEvent, teamId: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleOpenTeam(teamId);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
            <div className="h-32 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Meine Teams
        </h2>
        <p className="text-gray-600">
          {teams.length} {teams.length === 1 ? 'Team' : 'Teams'} verwaltet
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map(team => (
          <button
            key={team.team_id}
            onClick={() => handleOpenTeam(team.team_id)}
            onKeyDown={(e) => handleKeyDown(e, team.team_id)}
            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-all text-left group focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={`Team ${team.name} öffnen`}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {team.name}
                </h3>
                <p className="text-sm text-gray-500">
                  {team.altersklasse} • {team.saison}
                </p>
              </div>
              <ChevronRight 
                className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" 
                aria-hidden="true"
              />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="w-4 h-4 text-blue-600" aria-hidden="true" />
                </div>
                <div>
                  <div className="text-xl font-bold text-gray-900">
                    {team.stats.spielerCount}
                  </div>
                  <div className="text-xs text-gray-500">Spieler</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4 text-green-600" aria-hidden="true" />
                </div>
                <div>
                  <div className="text-xl font-bold text-gray-900">
                    {team.stats.spieleCount}
                  </div>
                  <div className="text-xs text-gray-500">Spiele</div>
                </div>
              </div>
            </div>

            {/* Liga-Info */}
            {team.liga_name && (
              <div className="mb-4 p-2 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-700">{team.liga_name}</div>
                {team.stats.tabellenplatz && (
                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                    <TrendingUp className="w-3 h-3" aria-hidden="true" />
                    Platz {team.stats.tabellenplatz}
                  </div>
                )}
              </div>
            )}

            {/* Nächstes Spiel */}
            {team.stats.naechstesSpiel && (
              <div className="pt-4 border-t border-gray-200">
                <div className="text-xs text-gray-500 mb-1">Nächstes Spiel</div>
                <div className="text-sm font-medium text-gray-900">
                  {new Date(team.stats.naechstesSpiel.datum).toLocaleDateString('de-DE', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })}
                </div>
                <div className="text-sm text-gray-600">
                  {team.stats.naechstesSpiel.heim} vs. {team.stats.naechstesSpiel.gast}
                </div>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
