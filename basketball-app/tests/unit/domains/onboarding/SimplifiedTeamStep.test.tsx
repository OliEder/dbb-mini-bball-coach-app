/**
 * Unit Tests: SimplifiedTeamStep Component (v2)
 *
 * Testet die Team-Auswahl-Komponente mit dem neuen clubs.json-basierten Store.
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

// Mock the store
vi.mock('@/domains/onboarding/onboarding-simple.store', () => ({
  useSimpleOnboardingStore: vi.fn(() => ({
    selectedClub: mockClub,
    selectedTeam: null,
    setSelectedTeam: vi.fn(),
  })),
}));

import { useSimpleOnboardingStore } from '@/domains/onboarding/onboarding-simple.store';

describe('SimplifiedTeamStep', () => {
  const mockOnNext = vi.fn();
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useSimpleOnboardingStore as any).mockReturnValue({
      selectedClub: mockClub,
      selectedTeam: null,
      setSelectedTeam: vi.fn(),
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
        selectedTeam: null,
        setSelectedTeam: vi.fn(),
      });

      render(<SimplifiedTeamStep onNext={mockOnNext} onBack={mockOnBack} />);
      expect(screen.getByText(/keine teams gefunden/i)).toBeInTheDocument();
    });

    it('Weiter-Button ist disabled ohne Auswahl', () => {
      render(<SimplifiedTeamStep onNext={mockOnNext} onBack={mockOnBack} />);
      expect(screen.getByRole('button', { name: /weiter/i })).toBeDisabled();
    });

    it('Weiter-Button ist enabled mit Auswahl', () => {
      (useSimpleOnboardingStore as any).mockReturnValue({
        selectedClub: mockClub,
        selectedTeam: mockTeam1,
        setSelectedTeam: vi.fn(),
      });

      render(<SimplifiedTeamStep onNext={mockOnNext} onBack={mockOnBack} />);
      expect(screen.getByRole('button', { name: /weiter/i })).not.toBeDisabled();
    });
  });

  describe('Team-Auswahl', () => {
    it('ruft setSelectedTeam auf bei Radio-Klick', async () => {
      const setSelectedTeam = vi.fn();
      (useSimpleOnboardingStore as any).mockReturnValue({
        selectedClub: mockClub,
        selectedTeam: null,
        setSelectedTeam,
      });

      render(<SimplifiedTeamStep onNext={mockOnNext} onBack={mockOnBack} />);
      const radios = screen.getAllByRole('radio');
      await userEvent.click(radios[0]);

      expect(setSelectedTeam).toHaveBeenCalledWith(mockTeam1);
    });

    it('ruft onNext mit ausgewähltem Team auf', async () => {
      (useSimpleOnboardingStore as any).mockReturnValue({
        selectedClub: mockClub,
        selectedTeam: mockTeam1,
        setSelectedTeam: vi.fn(),
      });

      render(<SimplifiedTeamStep onNext={mockOnNext} onBack={mockOnBack} />);
      await userEvent.click(screen.getByRole('button', { name: /weiter/i }));

      expect(mockOnNext).toHaveBeenCalledWith(mockTeam1);
    });

    it('zeigt teamPermanentId als ID', () => {
      render(<SimplifiedTeamStep onNext={mockOnNext} onBack={mockOnBack} />);
      expect(screen.getByText('ID: 167889')).toBeInTheDocument();
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
