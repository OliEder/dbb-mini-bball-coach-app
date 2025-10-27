/**
 * TeamSwitcher - Multi-Team Navigation
 * 
 * Dropdown-Component zum Wechseln zwischen Teams
 * Erscheint nur wenn mehrere Teams vorhanden sind
 * 
 * WCAG 2.0 AA:
 * - Keyboard Navigation (Tab, Enter, Escape)
 * - ARIA Labels und Roles
 * - Focus Management
 * - Touch Targets min. 44x44px
 */

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { teamService } from '@/domains/team/services/TeamService';
import type { Team } from '@/shared/types';

export const TeamSwitcher: React.FC = () => {
  const { currentTeamId, myTeamIds, switchTeam } = useAppStore();
  const [teams, setTeams] = useState<Team[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadTeams();
  }, [myTeamIds]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close dropdown on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const loadTeams = async () => {
    setIsLoading(true);
    try {
      // Hole alle Teams anhand der IDs
      const loadedTeams = await Promise.all(
        myTeamIds.map(id => teamService.getTeamById(id))
      );
      setTeams(loadedTeams.filter(Boolean) as Team[]);
    } catch (error) {
      console.error('Failed to load teams:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTeamSwitch = (teamId: string) => {
    switchTeam(teamId);
    setIsOpen(false);
    // Trigger page reload to update dashboard
    window.location.reload();
  };

  const handleKeyDown = (event: React.KeyboardEvent, teamId: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleTeamSwitch(teamId);
    }
  };

  // Nur anzeigen wenn mehrere Teams
  if (teams.length <= 1) return null;

  const currentTeam = teams.find(t => t.team_id === currentTeamId);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg animate-pulse">
        <div className="h-4 w-32 bg-gray-300 rounded"></div>
      </div>
    );
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Team wechseln"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="font-medium text-gray-900">
          {currentTeam?.name || 'Team wählen'}
        </span>
        <ChevronDown 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div 
          className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
          role="listbox"
          aria-label="Verfügbare Teams"
        >
          <div className="py-2 max-h-96 overflow-y-auto">
            {teams.map(team => (
              <button
                key={team.team_id}
                onClick={() => handleTeamSwitch(team.team_id)}
                onKeyDown={(e) => handleKeyDown(e, team.team_id)}
                className={`
                  w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors
                  min-h-[44px] focus:outline-none focus:bg-blue-50
                  ${team.team_id === currentTeamId ? 'bg-blue-50' : ''}
                `}
                role="option"
                aria-selected={team.team_id === currentTeamId}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{team.name}</p>
                    <p className="text-sm text-gray-500">
                      {team.altersklasse} • {team.saison}
                    </p>
                  </div>
                  {team.team_id === currentTeamId && (
                    <Check className="w-5 h-5 text-blue-600" aria-hidden="true" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
