/**
 * Tests für VerbandStep
 * 
 * - Unit Tests: Funktionalität
 * - Accessibility Tests: axe-core (WCAG 2.0 AA)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { VerbandStep } from '../VerbandStep';
import { LANDESVERBAENDE } from '@shared/constants/verbaende';

expect.extend(toHaveNoViolations);

describe('VerbandStep', () => {
  const mockOnNext = vi.fn();
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('sollte Überschrift und Beschreibung anzeigen', () => {
      render(
        <VerbandStep
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByRole('heading', { name: /Wählen Sie Ihren Verband/i })).toBeInTheDocument();
      expect(screen.getByText(/In welchem Basketball-Verband ist Ihr Verein organisiert/i)).toBeInTheDocument();
    });

    it('sollte alle 16 Landesverbände anzeigen', () => {
      render(
        <VerbandStep
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      // Prüfe, dass alle Landesverbände vorhanden sind
      LANDESVERBAENDE.forEach(verband => {
        expect(screen.getByText(verband.label)).toBeInTheDocument();
      });
    });

    it('sollte Info-Box für Mini-Basketball anzeigen', () => {
      render(
        <VerbandStep
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByText(/Für Mini-Basketball/i)).toBeInTheDocument();
      expect(screen.getByText(/Landesverband/i)).toBeInTheDocument();
    });

    it('sollte Zurück- und Weiter-Buttons anzeigen', () => {
      render(
        <VerbandStep
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByRole('button', { name: /Zurück/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Weiter/i })).toBeInTheDocument();
    });
  });

  describe('Interaktion', () => {
    it('sollte KEINE Vorauswahl haben (DEFAULT_VERBAND_ID = null)', () => {
      render(
        <VerbandStep
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      // Kein Radio-Button sollte checked sein
      const radios = screen.getAllByRole('radio');
      radios.forEach(radio => {
        expect(radio).not.toBeChecked();
      });
    });

    it('sollte Weiter-Button initial disabled sein', () => {
      render(
        <VerbandStep
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      const weiterButton = screen.getByRole('button', { name: /Weiter/i });
      expect(weiterButton).toBeDisabled();
    });

    it('sollte Verband auswählen können', async () => {
      const user = userEvent.setup();
      
      render(
        <VerbandStep
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      // Bayern auswählen
      const bayernRadio = screen.getByLabelText(/Bayern/i);
      await user.click(bayernRadio);

      expect(bayernRadio).toBeChecked();
    });

    it('sollte Weiter-Button nach Auswahl aktivieren', async () => {
      const user = userEvent.setup();
      
      render(
        <VerbandStep
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      const weiterButton = screen.getByRole('button', { name: /Weiter/i });
      expect(weiterButton).toBeDisabled();

      // Bayern auswählen
      const bayernRadio = screen.getByLabelText(/Bayern/i);
      await user.click(bayernRadio);

      expect(weiterButton).not.toBeDisabled();
    });

    it('sollte onNext mit ausgewählter Verbands-ID aufrufen', async () => {
      const user = userEvent.setup();
      
      render(
        <VerbandStep
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      // Bayern (ID=2) auswählen
      const bayernRadio = screen.getByLabelText(/Bayern/i);
      await user.click(bayernRadio);

      // Weiter klicken
      const weiterButton = screen.getByRole('button', { name: /Weiter/i });
      await user.click(weiterButton);

      expect(mockOnNext).toHaveBeenCalledWith(2);
    });

    it('sollte onBack beim Zurück-Button aufrufen', async () => {
      const user = userEvent.setup();
      
      render(
        <VerbandStep
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      const zurueckButton = screen.getByRole('button', { name: /Zurück/i });
      await user.click(zurueckButton);

      expect(mockOnBack).toHaveBeenCalled();
    });

    it('sollte initialSelection vorauswählen', () => {
      render(
        <VerbandStep
          initialSelection={2} // Bayern
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      const bayernRadio = screen.getByLabelText(/Bayern/i);
      expect(bayernRadio).toBeChecked();

      // Weiter-Button sollte enabled sein
      const weiterButton = screen.getByRole('button', { name: /Weiter/i });
      expect(weiterButton).not.toBeDisabled();
    });

    it('sollte nur einen Verband gleichzeitig auswählen können', async () => {
      const user = userEvent.setup();
      
      render(
        <VerbandStep
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      // Bayern auswählen
      const bayernRadio = screen.getByLabelText(/Bayern/i);
      await user.click(bayernRadio);
      expect(bayernRadio).toBeChecked();

      // Berlin auswählen
      const berlinRadio = screen.getByLabelText(/Berlin/i);
      await user.click(berlinRadio);
      
      // Berlin sollte checked sein, Bayern nicht mehr
      expect(berlinRadio).toBeChecked();
      expect(bayernRadio).not.toBeChecked();
    });
  });

  describe('Überregionale Verbände', () => {
    it('sollte Details-Element für überregionale Verbände haben', () => {
      render(
        <VerbandStep
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      expect(screen.getByText(/Überregionale Verbände anzeigen/i)).toBeInTheDocument();
    });

    it('sollte überregionale Verbände beim Aufklappen zeigen', async () => {
      const user = userEvent.setup();
      
      render(
        <VerbandStep
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      // Bundesligen sollte initial nicht sichtbar sein
      expect(screen.queryByText('Bundesligen')).not.toBeInTheDocument();

      // Details aufklappen
      const summary = screen.getByText(/Überregionale Verbände anzeigen/i);
      await user.click(summary);

      // Jetzt sollten die Kategorien sichtbar sein
      await waitFor(() => {
        expect(screen.getByText('Bundesligen')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility (WCAG 2.0 AA)', () => {
    it('sollte keine axe-core Violations haben', async () => {
      const { container } = render(
        <VerbandStep
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('sollte accessible Labels für alle Radio-Buttons haben', () => {
      render(
        <VerbandStep
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      const radios = screen.getAllByRole('radio');
      radios.forEach(radio => {
        // Jeder Radio-Button braucht ein accessible Label
        expect(radio).toHaveAccessibleName();
      });
    });

    it('sollte disabled Button korrekt kennzeichnen', () => {
      render(
        <VerbandStep
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      const weiterButton = screen.getByRole('button', { name: /Weiter/i });
      expect(weiterButton).toHaveAttribute('disabled');
      expect(weiterButton).toHaveClass('cursor-not-allowed');
    });

    it('sollte Keyboard-Navigation unterstützen', async () => {
      const user = userEvent.setup();
      
      render(
        <VerbandStep
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      // Tab zur ersten Radio-Button-Gruppe
      await user.tab();
      
      // Pfeil-Tasten sollten zwischen Radio-Buttons navigieren
      const bayernRadio = screen.getByLabelText(/Bayern/i);
      bayernRadio.focus();
      
      await user.keyboard('[Space]');
      expect(bayernRadio).toBeChecked();
    });

    it('sollte Focus-Styles haben', () => {
      render(
        <VerbandStep
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      const weiterButton = screen.getByRole('button', { name: /Weiter/i });
      // Focus-Ring sollte in Klassen vorhanden sein
      expect(weiterButton.className).toMatch(/focus:ring/);
    });
  });

  describe('Edge Cases', () => {
    it('sollte mit undefined initialSelection umgehen', () => {
      render(
        <VerbandStep
          initialSelection={undefined}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      const radios = screen.getAllByRole('radio');
      radios.forEach(radio => {
        expect(radio).not.toBeChecked();
      });
    });

    it('sollte mit null initialSelection umgehen', () => {
      render(
        <VerbandStep
          initialSelection={null}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      const radios = screen.getAllByRole('radio');
      radios.forEach(radio => {
        expect(radio).not.toBeChecked();
      });
    });

    it('sollte Form-Submit verhindern (preventDefault)', async () => {
      const user = userEvent.setup();
      
      render(
        <VerbandStep
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      // Bayern auswählen
      const bayernRadio = screen.getByLabelText(/Bayern/i);
      await user.click(bayernRadio);

      // Enter-Taste im Form
      const form = screen.getByRole('button', { name: /Weiter/i }).closest('form');
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      form?.dispatchEvent(submitEvent);

      // onNext sollte aufgerufen werden
      expect(mockOnNext).toHaveBeenCalled();
    });
  });
});
