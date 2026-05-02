/**
 * Unit Tests: SimplifiedVereinStep Component (v2)
 *
 * Testet die Vereinsauswahl-Komponente mit dem neuen clubs.json-basierten Store.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SimplifiedVereinStep } from '@/domains/onboarding/components/SimplifiedVereinStep';
import type { VRClub } from '@/domains/onboarding/onboarding-simple.store';

// Mock the store
vi.mock('@/domains/onboarding/onboarding-simple.store', () => {
  const mockClubs: VRClub[] = [
    {
      clubId: 4468,
      name: 'Fibalon Baskets Neumarkt',
      verbandId: 2,
      verbandName: 'Bayern',
      lat: 49.28,
      lng: 11.46,
      geocodedFrom: 'Neumarkt',
      logoUrl: null,
      lastCrawled: '2026-04-14T00:00:00.000Z',
      halls: [],
      teams: [{ teamPermanentId: 167889, altersklasse: 'Senioren I', geschlecht: 'm', teamNumber: 1 }],
    },
    {
      clubId: 9999,
      name: 'Alba Berlin',
      verbandId: 3,
      verbandName: 'Berlin',
      lat: 52.5,
      lng: 13.4,
      geocodedFrom: 'Berlin',
      logoUrl: null,
      lastCrawled: '2026-04-14T00:00:00.000Z',
      halls: [],
      teams: [],
    },
  ];

  const mockStore = {
    clubs: mockClubs,
    clubsLoaded: true,
    clubsError: null,
    searchQuery: '',
    selectedClub: null,
    loadClubs: vi.fn().mockResolvedValue(undefined),
    setSearchQuery: vi.fn(),
    setSelectedClub: vi.fn(),
  };

  return {
    useSimpleOnboardingStore: vi.fn(() => mockStore),
    searchClubs: (clubs: VRClub[], query: string) => {
      if (!query.trim()) return clubs;
      const q = query.toLowerCase();
      return clubs.filter((c) => c.name.toLowerCase().includes(q));
    },
  };
});

import { useSimpleOnboardingStore } from '@/domains/onboarding/onboarding-simple.store';

describe('SimplifiedVereinStep', () => {
  const mockOnNext = vi.fn();
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store mock to default state
    (useSimpleOnboardingStore as any).mockReturnValue({
      clubs: [
        {
          clubId: 4468,
          name: 'Fibalon Baskets Neumarkt',
          verbandId: 2,
          verbandName: 'Bayern',
          lat: 49.28,
          lng: 11.46,
          geocodedFrom: 'Neumarkt',
          logoUrl: null,
          lastCrawled: '2026-04-14T00:00:00.000Z',
          halls: [],
          teams: [{ teamPermanentId: 167889, altersklasse: 'Senioren I', geschlecht: 'm', teamNumber: 1 }],
        },
        {
          clubId: 9999,
          name: 'Alba Berlin',
          verbandId: 3,
          verbandName: 'Berlin',
          lat: 52.5,
          lng: 13.4,
          geocodedFrom: 'Berlin',
          logoUrl: null,
          lastCrawled: '2026-04-14T00:00:00.000Z',
          halls: [],
          teams: [],
        },
      ],
      clubsLoaded: true,
      clubsError: null,
      searchQuery: '',
      selectedClub: null,
      loadClubs: vi.fn().mockResolvedValue(undefined),
      setSearchQuery: vi.fn(),
      setSelectedClub: vi.fn(),
    });
  });

  describe('Ladestate', () => {
    it('zeigt Ladeanzeige wenn clubs noch nicht geladen', () => {
      (useSimpleOnboardingStore as any).mockReturnValue({
        clubs: [],
        clubsLoaded: false,
        clubsError: null,
        searchQuery: '',
        selectedClub: null,
        loadClubs: vi.fn(),
        setSearchQuery: vi.fn(),
        setSelectedClub: vi.fn(),
      });

      render(<SimplifiedVereinStep onNext={mockOnNext} onBack={mockOnBack} />);
      expect(screen.getByText(/vereine werden geladen/i)).toBeInTheDocument();
    });

    it('zeigt Fehlermeldung bei Ladefehler', () => {
      (useSimpleOnboardingStore as any).mockReturnValue({
        clubs: [],
        clubsLoaded: false,
        clubsError: 'Vereine konnten nicht geladen werden. Bitte erneut versuchen.',
        searchQuery: '',
        selectedClub: null,
        loadClubs: vi.fn(),
        setSearchQuery: vi.fn(),
        setSelectedClub: vi.fn(),
      });

      render(<SimplifiedVereinStep onNext={mockOnNext} onBack={mockOnBack} />);
      expect(screen.getByText(/vereine konnten nicht geladen werden/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /erneut versuchen/i })).toBeInTheDocument();
    });

    it('zeigt Vereinsliste nach erfolgreichem Laden', () => {
      render(<SimplifiedVereinStep onNext={mockOnNext} onBack={mockOnBack} />);
      expect(screen.getByText('Fibalon Baskets Neumarkt')).toBeInTheDocument();
      expect(screen.getByText('Alba Berlin')).toBeInTheDocument();
    });
  });

  describe('Vereinsauswahl', () => {
    it('rendert Suchfeld', () => {
      render(<SimplifiedVereinStep onNext={mockOnNext} onBack={mockOnBack} />);
      expect(screen.getByPlaceholderText(/baskets neumarkt/i)).toBeInTheDocument();
    });

    it('rendert Weiter-Button als disabled ohne Auswahl', () => {
      render(<SimplifiedVereinStep onNext={mockOnNext} onBack={mockOnBack} />);
      const button = screen.getByRole('button', { name: /weiter/i });
      expect(button).toBeDisabled();
    });

    it('ruft setSelectedClub auf wenn Verein gewählt wird', async () => {
      const setSelectedClub = vi.fn();
      (useSimpleOnboardingStore as any).mockReturnValue({
        clubs: [
          {
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
            teams: [],
          },
        ],
        clubsLoaded: true,
        clubsError: null,
        searchQuery: '',
        selectedClub: null,
        loadClubs: vi.fn(),
        setSearchQuery: vi.fn(),
        setSelectedClub,
      });

      render(<SimplifiedVereinStep onNext={mockOnNext} onBack={mockOnBack} />);

      const radio = screen.getByRole('radio');
      await userEvent.click(radio);

      expect(setSelectedClub).toHaveBeenCalledWith(
        expect.objectContaining({ clubId: 4468 })
      );
    });

    it('ruft onNext auf wenn Verein ausgewählt und Weiter geklickt', async () => {
      const selectedClub: VRClub = {
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
        teams: [],
      };

      (useSimpleOnboardingStore as any).mockReturnValue({
        clubs: [selectedClub],
        clubsLoaded: true,
        clubsError: null,
        searchQuery: '',
        selectedClub,
        loadClubs: vi.fn(),
        setSearchQuery: vi.fn(),
        setSelectedClub: vi.fn(),
      });

      render(<SimplifiedVereinStep onNext={mockOnNext} onBack={mockOnBack} />);

      const button = screen.getByRole('button', { name: /weiter/i });
      await userEvent.click(button);

      expect(mockOnNext).toHaveBeenCalledWith(selectedClub);
    });
  });

  describe('Navigation', () => {
    it('Zurück-Button ruft onBack auf', async () => {
      render(<SimplifiedVereinStep onNext={mockOnNext} onBack={mockOnBack} />);
      await userEvent.click(screen.getByRole('button', { name: /zurück/i }));
      expect(mockOnBack).toHaveBeenCalled();
    });
  });
});
