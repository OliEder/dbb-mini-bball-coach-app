/**
 * Accessibility Tests für Dashboard
 *
 * Testet WCAG 2.1 AA:
 * - axe-core für automatische Prüfung
 * - Zugängliche Button-Namen
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility: Dashboard', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });

    // Skip if redirected away from dashboard (e.g. not yet onboarded)
    const url = page.url();
    if (!url.includes('/dashboard')) {
      test.skip();
    }
  });

  test('sollte keine kritischen WCAG AA Violations haben (Dashboard)', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    const criticalViolations = accessibilityScanResults.violations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    );

    expect(criticalViolations).toEqual([]);
  });

  test('sollte zugängliche Button-Namen haben (Dashboard)', async ({ page }) => {
    const buttons = page.getByRole('button');
    const count = await buttons.count();

    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      const accessibleName = await button.getAttribute('aria-label')
        ?? await button.textContent();

      expect(
        accessibleName?.trim().length,
        `Button ${i} hat keinen zugänglichen Namen`
      ).toBeGreaterThan(0);
    }
  });
});
