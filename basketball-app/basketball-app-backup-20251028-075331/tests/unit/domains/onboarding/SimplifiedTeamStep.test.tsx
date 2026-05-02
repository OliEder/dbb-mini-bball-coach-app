/**
 * Unit Tests: SimplifiedTeamStep Component
 * 
 * Testet die Team-Auswahl-Component mit gemocktem ClubDataLoader
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SimplifiedTeamStep } from '@domains/onboarding/components/SimplifiedTeamStep';
import type { Team } from '@shared/types';

// Mock ClubDataLoader - WICHTIG: Vor dem Import!
vi.mock('@shared/services/ClubDataLoader', () => ({
  clubDataLoader: {
    loadTeamsForClub: vi.fn()
  }
}));

// Nach dem Mock importieren
import { clubDataLoader } from '@shared/services/ClubDataLoader';

const createMockTeam = (
  id: string,
  vereinId: string,
  name: string,
  ligaName?: string
): Team => ({
  team_id: id,
  verein_id: vereinId,
  name,
  liga_id: ligaName ? 'liga_' + id : '',
  liga_name: ligaName || '',
  altersklasse_id: 1,
  geschlecht: 'male',
  saison: '2024/2025',
  team_typ: 'eigen',
  created_at: new Date()
});

const mockTeams = [
  createMockTeam('team_001', 'V001', '1. Herren', 'Basketball Bundesliga'),
  createMockTeam('team_002', 'V001', 'U19 NBBL', 'Nachwuchs Basketball Bundesliga'),
  createMockTeam('team_003', 'V001', 'U16 männlich', 'Jugend Basketball Bundesliga')
];

describe('SimplifiedTeamStep', () => {
  const mockOnNext = vi.fn();
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(clubDataLoader.loadTeamsForClub).mockResolvedValue(mockTeams);
  });

  describe('Rendering & Loading States', () => {
    it('zeigt Loading-State beim initialen Laden', () => {
      render(
        <SimplifiedTeamStep
          clubId="club_001"
          clubName="FC Bayern München Basketball"
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByText(/Teams werden geladen/i)).toBeInTheDocument();
    });

    it('zeigt Team-Liste nach erfolgreichem Laden', async () => {
      render(
        <SimplifiedTeamStep
          clubId="club_001"
          clubName="FC Bayern München Basketball"
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('1. Herren')).toBeInTheDocument();
      });

      expect(screen.getByText('U19 NBBL')).toBeInTheDocument();
      expect(screen.getByText('U16 männlich')).toBeInTheDocument();
    });

    it('zeigt Club-Name im Header', async () => {
      render(
        <SimplifiedTeamStep
          clubId="club_001"
          clubName="FC Bayern München Basketball"
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('FC Bayern München Basketball')).toBeInTheDocument();
      });
    });

    it('zeigt Error-State bei Lade-Fehler', async () => {
      vi.mocked(clubDataLoader.loadTeamsForClub).mockRejectedValue(new Error('Network error'));

      render(
        <SimplifiedTeamStep
          clubId="club_001"
          clubName="FC Bayern München Basketball"
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Fehler beim Laden/i)).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: /Neu laden/i })).toBeInTheDocument();
    });

    it('zeigt Meldung bei Verein ohne Teams', async () => {
      vi.mocked(clubDataLoader.loadTeamsForClub).mockResolvedValue([]);

      render(
        <SimplifiedTeamStep
          clubId="club_001"
          clubName="FC Bayern München Basketball"
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Keine Teams gefunden/i)).toBeInTheDocument();
      });

      expect(
        screen.getByText(/Für diesen Verein sind noch keine Teams hinterlegt/i)
      ).toBeInTheDocument();
    });
  });

  describe('Team-Auswahl', () => {
    it('erlaubt Multi-Select von Teams', async () => {
      const user = userEvent.setup();

      render(
        <SimplifiedTeamStep
          clubId="club_001"
          clubName="FC Bayern München Basketball"
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('1. Herren')).toBeInTheDocument();
      });

      const checkbox1 = screen.getByRole('checkbox', { name: /1\. Herren/i });
      const checkbox2 = screen.getByRole('checkbox', { name: /U19 NBBL/i });

      await user.click(checkbox1);
      await user.click(checkbox2);

      expect(checkbox1).toBeChecked();
      expect(checkbox2).toBeChecked();
    });

    it('kann Team-Auswahl wieder aufheben', async () => {
      const user = userEvent.setup();

      render(
        <SimplifiedTeamStep
          clubId="club_001"
          clubName="FC Bayern München Basketball"
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('1. Herren')).toBeInTheDocument();
      });

      const checkbox = screen.getByRole('checkbox', { name: /1\. Herren/i });

      await user.click(checkbox);
      expect(checkbox).toBeChecked();

      await user.click(checkbox);
      expect(checkbox).not.toBeChecked();
    });

    it('hebt ausgewählte Teams visuell hervor', async () => {
      const user = userEvent.setup();

      render(
        <SimplifiedTeamStep
          clubId="club_001"
          clubName="FC Bayern München Basketball"
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('1. Herren')).toBeInTheDocument();
      });

      const teamLabel = screen.getByText('1. Herren').closest('label');
      expect(teamLabel).not.toHaveClass('bg-blue-50');

      const checkbox = screen.getByRole('checkbox', { name: /1\. Herren/i });
      await user.click(checkbox);

      expect(teamLabel).toHaveClass('bg-blue-50');
    });

    it('zeigt Liga-Name wenn vorhanden', async () => {
      render(
        <SimplifiedTeamStep
          clubId="club_001"
          clubName="FC Bayern München Basketball"
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Basketball Bundesliga')).toBeInTheDocument();
      });

      expect(screen.getByText('Nachwuchs Basketball Bundesliga')).toBeInTheDocument();
      expect(screen.getByText('Jugend Basketball Bundesliga')).toBeInTheDocument();
    });
  });

  describe('Selection Summary', () => {
    it('zeigt Auswahl-Zusammenfassung', async () => {
      const user = userEvent.setup();

      render(
        <SimplifiedTeamStep
          clubId="club_001"
          clubName="FC Bayern München Basketball"
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('1. Herren')).toBeInTheDocument();
      });

      // Keine Zusammenfassung ohne Auswahl
      expect(screen.queryByText(/Team ausgewählt/i)).not.toBeInTheDocument();

      const checkbox1 = screen.getByRole('checkbox', { name: /1\. Herren/i });
      await user.click(checkbox1);

      // Mit 1 Team
      await waitFor(() => {
        // Text ist aufgeteilt: <strong>1</strong> Team ausgewählt
        const summaryContainer = screen.getByText('Team ausgewählt').parentElement;
        expect(summaryContainer).toHaveTextContent('1');
        expect(summaryContainer).toHaveTextContent('Team ausgewählt');
      });

      const checkbox2 = screen.getByRole('checkbox', { name: /U19 NBBL/i });
      await user.click(checkbox2);

      // Mit 2 Teams
      await waitFor(() => {
        // Text ist aufgeteilt: <strong>2</strong> Teams ausgewählt
        const summaryContainer = screen.getByText('Teams ausgewählt').parentElement;
        expect(summaryContainer).toHaveTextContent('2');
        expect(summaryContainer).toHaveTextContent('Teams ausgewählt');
      });
    });
  });

  describe('Navigation', () => {
    it('Zurück-Button ruft onBack auf', async () => {
      const user = userEvent.setup();

      render(
        <SimplifiedTeamStep
          clubId="club_001"
          clubName="FC Bayern München Basketball"
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('1. Herren')).toBeInTheDocument();
      });

      const backButton = screen.getByRole('button', { name: /Zurück/i });
      await user.click(backButton);

      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });

    it('Weiter-Button ist disabled ohne Auswahl', async () => {
      render(
        <SimplifiedTeamStep
          clubId="club_001"
          clubName="FC Bayern München Basketball"
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('1. Herren')).toBeInTheDocument();
      });

      const nextButton = screen.getByRole('button', { name: /Weiter/i });
      expect(nextButton).toBeDisabled();
    });

    it('Weiter-Button ist enabled mit Auswahl', async () => {
      const user = userEvent.setup();

      render(
        <SimplifiedTeamStep
          clubId="club_001"
          clubName="FC Bayern München Basketball"
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('1. Herren')).toBeInTheDocument();
      });

      const checkbox = screen.getByRole('checkbox', { name: /1\. Herren/i });
      await user.click(checkbox);

      const nextButton = screen.getByRole('button', { name: /Weiter/i });
      expect(nextButton).not.toBeDisabled();
    });

    it('Weiter-Button ruft onNext mit ausgewählten Teams', async () => {
      const user = userEvent.setup();

      render(
        <SimplifiedTeamStep
          clubId="club_001"
          clubName="FC Bayern München Basketball"
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('1. Herren')).toBeInTheDocument();
      });

      const checkbox1 = screen.getByRole('checkbox', { name: /1\. Herren/i });
      const checkbox2 = screen.getByRole('checkbox', { name: /U19 NBBL/i });

      await user.click(checkbox1);
      await user.click(checkbox2);

      const nextButton = screen.getByRole('button', { name: /Weiter/i });
      await user.click(nextButton);

      expect(mockOnNext).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            team_id: 'team_001',
            name: '1. Herren'
          }),
          expect.objectContaining({
            team_id: 'team_002',
            name: 'U19 NBBL'
          })
        ])
      );

      expect(mockOnNext).toHaveBeenCalledTimes(1);
    });
  });

  describe('Data Loading', () => {
    it('lädt Teams mit korrekter clubId', async () => {
      render(
        <SimplifiedTeamStep
          clubId="club_123"
          clubName="Test Verein"
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        expect(clubDataLoader.loadTeamsForClub).toHaveBeenCalledWith('club_123');
      });
    });
  });

  describe('Accessibility', () => {
    it('hat korrekte ARIA-Labels', async () => {
      render(
        <SimplifiedTeamStep
          clubId="club_001"
          clubName="FC Bayern München Basketball"
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('1. Herren')).toBeInTheDocument();
      });

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes).toHaveLength(3);

      expect(screen.getByRole('button', { name: /Zurück/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Weiter/i })).toBeInTheDocument();
    });
  });
});
