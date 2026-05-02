/**
 * Unit Tests: SimplifiedTeamStep Component (v3 — Multi-Team)
 *
 * Testet die Team-Auswahl-Komponente mit Checkbox-basierter Mehrfachauswahl.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SimplifiedTeamStep } from '@/domains/onboarding/components/SimplifiedTeamStep';
import type { VRClub, VRTeam } from '@/domains/onboarding/onboarding-simple.store';

const mockTeam1: VRTeam = { teamPermanentId: 167889, altersklasse: 'Senioren I', geschlecht: 'm', teamNumber: 1 };
const mockTeam2: VRTeam = { teamPermanentId: 167890, altersklasse: 'U16', geschlecht: 'm', teamNumber: 1 };

const mockClub: VRClub = {
  clubId: 4468,
  name: 'Fibalon Baskets Neumarkt',
  verbandId: 2,
  verbandName: 'Bayern',
  lat: null,
  lng: null,
  geocodedFrom: null,
  logoUrl: null,
  lastCrawled: '2026-04-14T00:00:00.000Z',
  halls: [],
  teams: [mockTeam1, mockTeam2],
};

// Mock the store — use importOriginal to preserve non-mocked exports (e.g. formatTeamLabel)
vi.mock('@/domains/onboarding/onboarding-simple.store', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/domains/onboarding/onboarding-simple.store')>();
  return {
    ...actual,
    useSimpleOnboardingStore: vi.fn(() => ({
      selectedClub: mockClub,
      selectedTeams: [],
      toggleTeam: vi.fn(),
    })),
  };
});

import { useSimpleOnboardingStore } from '@/domains/onboarding/onboarding-simple.store';

describe('SimplifiedTeamStep', () => {
  const mockOnNext = vi.fn();
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useSimpleOnboardingStore as any).mockReturnValue({
      selectedClub: mockClub,
      selectedTeams: [],
      toggleTeam: vi.fn(),
    });
  });

  describe('Rendering', () => {
    it('zeigt Team-Liste aus dem Verein', () => {
      render(<SimplifiedTeamStep onNext={mockOnNext} onBack={mockOnBack} />);
      expect(screen.getByText(/Senioren I Herren/i)).toBeInTheDocument();
      expect(screen.getByText(/U16 Herren/i)).toBeInTheDocument();
    });

    it('zeigt Vereins-Name im Header', () => {
      render(<SimplifiedTeamStep onNext={mockOnNext} onBack={mockOnBack} />);
      expect(screen.getByText('Fibalon Baskets Neumarkt')).toBeInTheDocument();
    });

    it('zeigt Meldung wenn kein Verein Teams hat', () => {
      (useSimpleOnboardingStore as any).mockReturnValue({
        selectedClub: { ...mockClub, teams: [] },
        selectedTeams: [],
        toggleTeam: vi.fn(),
      });

      render(<SimplifiedTeamStep onNext={mockOnNext} onBack={mockOnBack} />);
      expect(screen.getByText(/keine teams gefunden/i)).toBeInTheDocument();
    });

    it('Weiter-Button ist disabled ohne Auswahl', () => {
      render(<SimplifiedTeamStep onNext={mockOnNext} onBack={mockOnBack} />);
      expect(screen.getByRole('button', { name: /weiter/i })).toBeDisabled();
    });

    it('Weiter-Button ist enabled mit mindestens einem ausgewählten Team', () => {
      (useSimpleOnboardingStore as any).mockReturnValue({
        selectedClub: mockClub,
        selectedTeams: [mockTeam1],
        toggleTeam: vi.fn(),
      });

      render(<SimplifiedTeamStep onNext={mockOnNext} onBack={mockOnBack} />);
      expect(screen.getByRole('button', { name: /weiter/i })).not.toBeDisabled();
    });

    it('zeigt Anzahl ausgewählter Teams', () => {
      (useSimpleOnboardingStore as any).mockReturnValue({
        selectedClub: mockClub,
        selectedTeams: [mockTeam1, mockTeam2],
        toggleTeam: vi.fn(),
      });

      render(<SimplifiedTeamStep onNext={mockOnNext} onBack={mockOnBack} />);
      expect(screen.getByText(/2 Teams ausgewählt/i)).toBeInTheDocument();
    });
  });

  describe('Team-Auswahl (Multi)', () => {
    it('verwendet Checkboxen statt Radio-Buttons', () => {
      render(<SimplifiedTeamStep onNext={mockOnNext} onBack={mockOnBack} />);
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes).toHaveLength(2);
    });

    it('ruft toggleTeam auf bei Checkbox-Klick', async () => {
      const toggleTeam = vi.fn();
      (useSimpleOnboardingStore as any).mockReturnValue({
        selectedClub: mockClub,
        selectedTeams: [],
        toggleTeam,
      });

      render(<SimplifiedTeamStep onNext={mockOnNext} onBack={mockOnBack} />);
      const checkboxes = screen.getAllByRole('checkbox');
      await userEvent.click(checkboxes[0]);

      expect(toggleTeam).toHaveBeenCalledWith(mockTeam1);
    });

    it('ruft onNext mit allen ausgewählten Teams auf', async () => {
      (useSimpleOnboardingStore as any).mockReturnValue({
        selectedClub: mockClub,
        selectedTeams: [mockTeam1, mockTeam2],
        toggleTeam: vi.fn(),
      });

      render(<SimplifiedTeamStep onNext={mockOnNext} onBack={mockOnBack} />);
      await userEvent.click(screen.getByRole('button', { name: /weiter/i }));

      expect(mockOnNext).toHaveBeenCalledWith([mockTeam1, mockTeam2]);
    });

    it('zeigt teamPermanentId als ID', () => {
      render(<SimplifiedTeamStep onNext={mockOnNext} onBack={mockOnBack} />);
      expect(screen.getByText('ID: 167889')).toBeInTheDocument();
    });

    it('markiert ausgewählte Teams als checked', () => {
      (useSimpleOnboardingStore as any).mockReturnValue({
        selectedClub: mockClub,
        selectedTeams: [mockTeam1],
        toggleTeam: vi.fn(),
      });

      render(<SimplifiedTeamStep onNext={mockOnNext} onBack={mockOnBack} />);
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes[0]).toBeChecked();
      expect(checkboxes[1]).not.toBeChecked();
    });
  });

  describe('Navigation', () => {
    it('Zurück-Button ruft onBack auf', async () => {
      render(<SimplifiedTeamStep onNext={mockOnNext} onBack={mockOnBack} />);
      await userEvent.click(screen.getByRole('button', { name: /zurück/i }));
      expect(mockOnBack).toHaveBeenCalled();
    });
  });
});
