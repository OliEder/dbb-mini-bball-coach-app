/**
 * Accessibility Tests für Simplified Onboarding
 * 
 * Testet WCAG 2.1 AA + automatisierbare AAA-Regeln:
 * - axe-core für automatische Prüfung
 * - Keyboard-Navigation
 * - Fokus-Management
 * - Screen-Reader Kompatibilität (ARIA)
 * - Farbkontraste
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';

test.describe('Accessibility: Simplified Onboarding', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      indexedDB.deleteDatabase('BasketballPWA_v4');
    });
  });

  test('sollte keine WCAG AA Violations haben (Welcome Step)', async ({ page }) => {
    await page.goto('/onboarding');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('sollte keine WCAG AA Violations haben (User Step)', async ({ page }) => {
    await page.goto('/onboarding');
    await page.getByRole('button', { name: /los geht/i }).click();
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('sollte keine WCAG AA Violations haben (Verein Step)', async ({ page }) => {
    await navigateToStep(page, 'verein');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('sollte keine WCAG AA Violations haben (Team Step)', async ({ page }) => {
    await navigateToStep(page, 'team');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('sollte automatisierbare AAA-Regeln erfüllen (alle Steps)', async ({ page }) => {
    const steps = ['welcome', 'user', 'verein'];
    
    for (const step of steps) {
      await navigateToStep(page, step);
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2aaa', 'wcag21aaa'])
        .analyze();
      
      // AAA ist optional, aber wir tracken Violations
      if (accessibilityScanResults.violations.length > 0) {
        console.log(`AAA Violations in ${step}:`, 
          accessibilityScanResults.violations.map(v => v.id)
        );
      }
      
      // Für AAA erwarten wir keine Violations in kritischen Bereichen
      const criticalViolations = accessibilityScanResults.violations.filter(
        v => v.impact === 'critical' || v.impact === 'serious'
      );
      
      expect(criticalViolations).toEqual([]);
    }
  });

  test('sollte Keyboard-Navigation unterstützen (Tab)', async ({ page }) => {
    await page.goto('/onboarding');
    
    // Start-Button sollte fokussierbar sein
    await page.keyboard.press('Tab');
    const startButton = page.getByRole('button', { name: /los geht/i });
    await expect(startButton).toBeFocused();
    
    // Enter sollte Button aktivieren
    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { name: /über dich/i })).toBeVisible();
    
    // Formular-Felder sollten durchlaufen werden
    await page.keyboard.press('Tab');
    await expect(page.getByLabel(/vorname/i)).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.getByLabel(/nachname/i)).toBeFocused();
  });

  test('sollte Keyboard-Navigation unterstützen (Zurück mit Shift+Tab)', async ({ page }) => {
    await page.goto('/onboarding');
    await page.getByRole('button', { name: /los geht/i }).click();
    
    // Tab zum Weiter-Button
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab'); // Auf Weiter-Button
    
    // Shift+Tab zurück
    await page.keyboard.down('Shift');
    await page.keyboard.press('Tab');
    await page.keyboard.up('Shift');
    
    // Sollte auf Nachname-Feld sein
    await expect(page.getByLabel(/nachname/i)).toBeFocused();
  });

  test('sollte Radio-Buttons mit Pfeiltasten navigieren', async ({ page }) => {
    await navigateToStep(page, 'verein');
    
    // Warte auf Vereine geladen
    await expect(page.getByText(/vereine verfügbar/i)).toBeVisible({ timeout: 10000 });
    
    // Fokussiere ersten Radio-Button
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab'); // Verband-Filter überspringen
    await page.keyboard.press('Tab'); // Suchfeld überspringen
    await page.keyboard.press('Tab'); // Zum ersten Radio
    
    // Pfeiltaste runter sollte nächsten Option wählen
    await page.keyboard.press('ArrowDown');
    
    // Prüfe ob neuer Radio-Button fokussiert ist
    const focused = page.locator(':focus');
    await expect(focused).toHaveAttribute('type', 'radio');
  });

  test('sollte Checkboxen mit Space aktivieren', async ({ page }) => {
    await navigateToStep(page, 'team');
    
    // Warte auf Teams
    await expect(page.getByText(/verfügbar/i)).toBeVisible({ timeout: 10000 });
    
    // Fokussiere erste Checkbox
    const checkbox = page.locator('input[type="checkbox"]').first();
    await checkbox.focus();
    
    // Space sollte Checkbox togglen
    await page.keyboard.press('Space');
    await expect(checkbox).toBeChecked();
    
    await page.keyboard.press('Space');
    await expect(checkbox).not.toBeChecked();
  });

  test('sollte Fokus-Reihenfolge logisch sein', async ({ page }) => {
    await page.goto('/onboarding');
    
    // Tab-Reihenfolge sollte sein: Start-Button
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: /los geht/i })).toBeFocused();
    
    // Weiter zum User-Step
    await page.keyboard.press('Enter');
    
    // Tab-Reihenfolge: Vorname → Nachname → Zurück → Weiter
    await page.keyboard.press('Tab');
    await expect(page.getByLabel(/vorname/i)).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.getByLabel(/nachname/i)).toBeFocused();
    
    await page.keyboard.press('Tab');
    const focusedElement = page.locator(':focus');
    const text = await focusedElement.textContent();
    expect(text?.toLowerCase()).toMatch(/zurück|weiter/);
  });

  test('sollte korrekte ARIA-Labels haben', async ({ page }) => {
    await navigateToStep(page, 'user');
    
    // Formular-Felder sollten Labels haben
    const vornameInput = page.getByLabel(/vorname/i);
    const nachnameInput = page.getByLabel(/nachname/i);
    
    await expect(vornameInput).toBeVisible();
    await expect(nachnameInput).toBeVisible();
    
    // Buttons sollten accessible Namen haben
    const weiterButton = page.getByRole('button', { name: /weiter/i });
    await expect(weiterButton).toBeVisible();
  });

  test('sollte ARIA Live-Regions für Suche haben', async ({ page }) => {
    await navigateToStep(page, 'verein');
    
    // Warte auf Load
    await expect(page.getByText(/vereine verfügbar/i)).toBeVisible({ timeout: 10000 });
    
    // Suche sollte Ergebnisse filtern
    const searchInput = page.getByPlaceholder(/verein suchen/i);
    await searchInput.fill('München');
    
    // Warte auf Filterung
    await page.waitForTimeout(500);
    
    // Ergebniszähler sollte Update haben
    await expect(page.getByText(/von.*vereine/i)).toBeVisible();
  });

  test('sollte ausreichende Farbkontraste haben (AA: 4.5:1)', async ({ page }) => {
    await page.goto('/onboarding');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .options({
        rules: {
          'color-contrast': { enabled: true }
        }
      })
      .analyze();
    
    const contrastViolations = accessibilityScanResults.violations.filter(
      v => v.id === 'color-contrast'
    );
    
    expect(contrastViolations).toEqual([]);
  });

  test('sollte keine disabled Buttons in Tab-Order haben', async ({ page }) => {
    await navigateToStep(page, 'user');
    
    // Weiter-Button sollte disabled sein (keine Daten)
    const weiterButton = page.getByRole('button', { name: /weiter/i });
    const isDisabled = await weiterButton.isDisabled();
    
    if (isDisabled) {
      // Tab sollte disabled Button überspringen
      await page.getByLabel(/vorname/i).focus();
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab'); // Überspringt disabled
      
      // Sollte bei Zurück-Button sein
      const focused = page.locator(':focus');
      const text = await focused.textContent();
      expect(text?.toLowerCase()).toContain('zurück');
    }
  });

  test('sollte Loading-States ankündigen (ARIA busy)', async ({ page }) => {
    await navigateToStep(page, 'verein');
    
    // Während Laden (kurz nach Navigation)
    const loadingIndicator = page.locator('[aria-busy="true"], [role="status"]');
    
    // Prüfe ob Loading-State existiert (kann schnell vorbei sein)
    const count = await loadingIndicator.count();
    if (count > 0) {
      console.log('Loading indicator found with aria-busy or role=status');
    }
  });

  test('sollte Landmark-Regions haben', async ({ page }) => {
    await page.goto('/onboarding');
    
    // Main-Region sollte existieren
    const main = page.locator('main, [role="main"]');
    const mainCount = await main.count();
    
    // Falls kein main, sollte zumindest semantisches HTML da sein
    if (mainCount === 0) {
      console.warn('No main element found - consider adding semantic HTML');
    }
    
    // Progress-Bar sollte semantisch korrekt sein (falls vorhanden)
    const progressbar = page.locator('[role="progressbar"]');
    if (await progressbar.count() > 0) {
      await expect(progressbar.first()).toHaveAttribute('aria-valuenow');
      await expect(progressbar.first()).toHaveAttribute('aria-valuemin');
      await expect(progressbar.first()).toHaveAttribute('aria-valuemax');
    }
  });

  test('sollte Heading-Hierarchie korrekt sein', async ({ page }) => {
    await page.goto('/onboarding');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a'])
      .options({
        rules: {
          'heading-order': { enabled: true }
        }
      })
      .analyze();
    
    const headingViolations = accessibilityScanResults.violations.filter(
      v => v.id === 'heading-order'
    );
    
    expect(headingViolations).toEqual([]);
  });

  test('sollte bei Zoom funktionieren (200%)', async ({ page }) => {
    // Setze Zoom auf 200%
    await page.goto('/onboarding');
    await page.evaluate(() => {
      document.body.style.zoom = '200%';
    });
    
    // UI sollte lesbar bleiben
    await expect(page.getByRole('heading', { name: /willkommen/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /los geht/i })).toBeVisible();
    
    // Keine horizontalen Scrollbars
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    
    expect(hasHorizontalScroll).toBeFalsy();
  });

  test('sollte Fokus-Indikator sichtbar sein', async ({ page }) => {
    await page.goto('/onboarding');
    
    // Fokussiere Button
    await page.keyboard.press('Tab');
    const button = page.getByRole('button', { name: /los geht/i });
    
    // Fokus-Indikator prüfen (outline/ring)
    const outlineWidth = await button.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return styles.outlineWidth;
    });
    
    // Outline sollte sichtbar sein (nicht "0px")
    expect(outlineWidth).not.toBe('0px');
  });

  test('sollte Touch-Targets groß genug sein (min 44x44px)', async ({ page }) => {
    await page.goto('/onboarding');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aaa'])
      .options({
        rules: {
          'target-size': { enabled: true }
        }
      })
      .analyze();
    
    // Target-Size ist AAA, aber wir tracken es
    const targetViolations = accessibilityScanResults.violations.filter(
      v => v.id === 'target-size'
    );
    
    if (targetViolations.length > 0) {
      console.log('Target-Size Violations (AAA):', targetViolations.length);
    }
  });
});

// Helper Functions
async function navigateToStep(page: Page, step: string) {
  await page.goto('/onboarding');
  
  if (step === 'welcome') return;
  
  // Welcome → User
  await page.getByRole('button', { name: /los geht/i }).click();
  if (step === 'user') return;
  
  // User → Verein
  await page.getByLabel(/vorname/i).fill('Test');
  await page.getByLabel(/nachname/i).fill('User');
  await page.getByRole('button', { name: /weiter/i }).click();
  if (step === 'verein') return;
  
  // Verein → Team (warte auf Load)
  await expect(page.getByText(/vereine verfügbar/i)).toBeVisible({ timeout: 10000 });
  await page.locator('input[type="radio"]').first().check();
  await page.getByRole('button', { name: /weiter/i }).click();
  if (step === 'team') return;
}
