/**
 * Unit Tests: SimplifiedVereinStep Component
 * 
 * Testet die Vereinsauswahl-Component mit gemocktem ClubDataLoader
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SimplifiedVereinStep } from '@domains/onboarding/components/SimplifiedVereinStep';
import type { Verein } from '@shared/types';

// Mock ClubDataLoader - WICHTIG: Vor dem Import!
vi.mock('@shared/services/ClubDataLoader', () => ({
  clubDataLoader: {
    loadAllClubs: vi.fn(),
    clearCache: vi.fn()
  }
}));

// Nach dem Mock importieren
import { clubDataLoader } from '@shared/services/ClubDataLoader';

const createMockVerein = (id: string, name: string, kurzname: string, verbandIds: number[]): Verein => ({
  verein_id: id,
  name,
  kurzname,
  verband_ids: verbandIds,
  ist_eigener_verein: false,
  created_at: new Date()
});

const mockClubs = [
  {
    verein: createMockVerein('V001', 'FC Bayern München Basketball', 'Bayern München', [2]),
    clubId: 'club_001'
  },
  {
    verein: createMockVerein('V002', 'Alba Berlin', 'Alba', [3]),
    clubId: 'club_002'
  },
  {
    verein: createMockVerein('V003', 'MHP Riesen Ludwigsburg', 'Ludwigsburg', [1]),
    clubId: 'club_003'
  }
];

describe('SimplifiedVereinStep', () => {
  const mockOnNext = vi.fn();
  const mockOnBack = vi.fn();
  const mockOnVerbandFilterChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(clubDataLoader.loadAllClubs).mockResolvedValue(mockClubs);
  });

  describe('Rendering & Loading States', () => {
    it('zeigt Loading-State beim initialen Laden', () => {
      render(
        <SimplifiedVereinStep
          verbandFilter={null}
          onVerbandFilterChange={mockOnVerbandFilterChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByText(/Vereine werden geladen/i)).toBeInTheDocument();
    });

    it('zeigt Vereinsliste nach erfolgreichem Laden', async () => {
      render(
        <SimplifiedVereinStep
          verbandFilter={null}
          onVerbandFilterChange={mockOnVerbandFilterChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('FC Bayern München Basketball')).toBeInTheDocument();
      });

      expect(screen.getByText('Alba Berlin')).toBeInTheDocument();
      expect(screen.getByText('MHP Riesen Ludwigsburg')).toBeInTheDocument();
    });

    it('zeigt Error-State bei Lade-Fehler', async () => {
      vi.mocked(clubDataLoader.loadAllClubs).mockRejectedValue(new Error('Network error'));

      render(
        <SimplifiedVereinStep
          verbandFilter={null}
          onVerbandFilterChange={mockOnVerbandFilterChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Fehler beim Laden/i)).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: /Neu laden/i })).toBeInTheDocument();
    });
  });

  describe('Verband-Filter', () => {
    it('zeigt Verband-Dropdown', async () => {
      render(
        <SimplifiedVereinStep
          verbandFilter={null}
          onVerbandFilterChange={mockOnVerbandFilterChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('FC Bayern München Basketball')).toBeInTheDocument();
      });

      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
    });

    it('filtert Vereine nach Verband', async () => {
      const user = userEvent.setup();

      const { rerender } = render(
        <SimplifiedVereinStep
          verbandFilter={null}
          onVerbandFilterChange={mockOnVerbandFilterChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('FC Bayern München Basketball')).toBeInTheDocument();
      });

      const select = screen.getByRole('combobox');
      await user.selectOptions(select, '2');

      expect(mockOnVerbandFilterChange).toHaveBeenCalledWith(2);

      // Rerender mit neuem Filter
      rerender(
        <SimplifiedVereinStep
          verbandFilter={2}
          onVerbandFilterChange={mockOnVerbandFilterChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('FC Bayern München Basketball')).toBeInTheDocument();
      });

      expect(screen.queryByText('Alba Berlin')).not.toBeInTheDocument();
    });
  });

  describe('Suche', () => {
    it('zeigt Suchfeld', async () => {
      render(
        <SimplifiedVereinStep
          verbandFilter={null}
          onVerbandFilterChange={mockOnVerbandFilterChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/z.B. Bayern München/i)).toBeInTheDocument();
      });
    });

    it('filtert Vereine nach Suchbegriff', async () => {
      const user = userEvent.setup();

      render(
        <SimplifiedVereinStep
          verbandFilter={null}
          onVerbandFilterChange={mockOnVerbandFilterChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('FC Bayern München Basketball')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/z.B. Bayern München/i);
      await user.type(searchInput, 'Alba');

      await waitFor(() => {
        expect(screen.getByText('Alba Berlin')).toBeInTheDocument();
      });

      expect(screen.queryByText('FC Bayern München Basketball')).not.toBeInTheDocument();
    });

    it('ist case-insensitive', async () => {
      const user = userEvent.setup();

      render(
        <SimplifiedVereinStep
          verbandFilter={null}
          onVerbandFilterChange={mockOnVerbandFilterChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('FC Bayern München Basketball')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/z.B. Bayern München/i);
      await user.type(searchInput, 'MÜNCHEN');

      await waitFor(() => {
        expect(screen.getByText('FC Bayern München Basketball')).toBeInTheDocument();
      });
    });

    it('zeigt "Keine Vereine gefunden" bei leerem Ergebnis', async () => {
      const user = userEvent.setup();

      render(
        <SimplifiedVereinStep
          verbandFilter={null}
          onVerbandFilterChange={mockOnVerbandFilterChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('FC Bayern München Basketball')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/z.B. Bayern München/i);
      await user.type(searchInput, 'Nicht existierender Verein XYZ');

      await waitFor(() => {
        expect(screen.getByText(/Keine Vereine gefunden/i)).toBeInTheDocument();
      });
    });
  });

  describe('Vereinsauswahl', () => {
    it('erlaubt Auswahl eines Vereins', async () => {
      const user = userEvent.setup();

      render(
        <SimplifiedVereinStep
          verbandFilter={null}
          onVerbandFilterChange={mockOnVerbandFilterChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('FC Bayern München Basketball')).toBeInTheDocument();
      });

      const albaRadio = screen.getByRole('radio', { name: /Alba Berlin/i });
      await user.click(albaRadio);

      expect(albaRadio).toBeChecked();
    });

    it('hebt ausgewählten Verein visuell hervor', async () => {
      const user = userEvent.setup();

      render(
        <SimplifiedVereinStep
          verbandFilter={null}
          onVerbandFilterChange={mockOnVerbandFilterChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('FC Bayern München Basketball')).toBeInTheDocument();
      });

      const albaLabel = screen.getByText('Alba Berlin').closest('label');
      expect(albaLabel).not.toHaveClass('bg-blue-50');

      const albaRadio = screen.getByRole('radio', { name: /Alba Berlin/i });
      await user.click(albaRadio);

      expect(albaLabel).toHaveClass('bg-blue-50');
    });
  });

  describe('Navigation', () => {
    it('Zurück-Button ruft onBack auf', async () => {
      const user = userEvent.setup();

      render(
        <SimplifiedVereinStep
          verbandFilter={null}
          onVerbandFilterChange={mockOnVerbandFilterChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('FC Bayern München Basketball')).toBeInTheDocument();
      });

      const backButton = screen.getByRole('button', { name: /Zurück/i });
      await user.click(backButton);

      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });

    it('Weiter-Button ist disabled ohne Auswahl', async () => {
      render(
        <SimplifiedVereinStep
          verbandFilter={null}
          onVerbandFilterChange={mockOnVerbandFilterChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('FC Bayern München Basketball')).toBeInTheDocument();
      });

      const nextButton = screen.getByRole('button', { name: /Weiter/i });
      expect(nextButton).toBeDisabled();
    });

    it('Weiter-Button ist enabled mit Auswahl', async () => {
      const user = userEvent.setup();

      render(
        <SimplifiedVereinStep
          verbandFilter={null}
          onVerbandFilterChange={mockOnVerbandFilterChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('FC Bayern München Basketball')).toBeInTheDocument();
      });

      const albaRadio = screen.getByRole('radio', { name: /Alba Berlin/i });
      await user.click(albaRadio);

      const nextButton = screen.getByRole('button', { name: /Weiter/i });
      expect(nextButton).not.toBeDisabled();
    });

    it('Weiter-Button ruft onNext mit Verein und ClubId', async () => {
      const user = userEvent.setup();

      render(
        <SimplifiedVereinStep
          verbandFilter={null}
          onVerbandFilterChange={mockOnVerbandFilterChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Alba Berlin')).toBeInTheDocument();
      });

      const albaRadio = screen.getByRole('radio', { name: /Alba Berlin/i });
      await user.click(albaRadio);

      const nextButton = screen.getByRole('button', { name: /Weiter/i });
      await user.click(nextButton);

      expect(mockOnNext).toHaveBeenCalledWith(
        expect.objectContaining({
          verein_id: 'V002',
          name: 'Alba Berlin',
          kurzname: 'Alba'
        }),
        'club_002'
      );
    });
  });

  describe('Accessibility', () => {
    it('hat korrekte ARIA-Labels', async () => {
      render(
        <SimplifiedVereinStep
          verbandFilter={null}
          onVerbandFilterChange={mockOnVerbandFilterChange}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('FC Bayern München Basketball')).toBeInTheDocument();
      });

      expect(screen.getByRole('combobox')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getAllByRole('radio')).toHaveLength(3);
    });
  });
});
