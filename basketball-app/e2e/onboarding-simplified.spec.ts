/**
 * E2E Tests für Simplified Onboarding
 * 
 * Schlanker Flow:
 * 1. Welcome
 * 2. User
 * 3. Verein (mit Filter + Suche)
 * 4. Team
 * 5. Completion → Dashboard
 */

import { test, expect } from '@playwright/test';

test.describe('Simplified Onboarding', () => {
  
  test.beforeEach(async ({ page }) => {
    // Clear storage
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      indexedDB.deleteDatabase('BasketballPWA_v4');
    });
    await page.reload();
  });

  test('sollte kompletten vereinfachten Flow durchlaufen', async ({ page }) => {
    // 1. Welcome
    await page.goto('/onboarding');
    await expect(page.getByRole('heading', { name: /willkommen/i })).toBeVisible();
    await page.getByRole('button', { name: /los geht/i }).click();
    
    // 2. User
    await expect(page.getByRole('heading', { name: /über dich/i })).toBeVisible();
    await page.getByLabel(/vorname/i).fill('Max');
    await page.getByLabel(/nachname/i).fill('Mustermann');
    await page.getByRole('button', { name: /weiter/i }).click();
    
    // 3. Verein (sollte direkt laden)
    await expect(page.getByRole('heading', { name: /wähle deinen verein/i })).toBeVisible({ timeout: 10000 });
    
    // Warte auf Vereine geladen
    await expect(page.getByText(/vereine verfügbar/i)).toBeVisible({ timeout: 10000 });
    
    // Suche nach Verein
    const searchInput = page.getByPlaceholder(/verein suchen/i);
    await searchInput.fill('München');
    await page.waitForTimeout(500);
    
    // Wähle ersten Verein
    await page.locator('input[type="radio"]').first().check();
    await page.getByRole('button', { name: /weiter/i }).click();
    
    // 4. Team
    await expect(page.getByRole('heading', { name: /wähle deine teams/i })).toBeVisible({ timeout: 10000 });
    
    // Warte auf Teams
    await expect(page.getByText(/verfügbar/i)).toBeVisible({ timeout: 5000 });
    
    // Wähle erstes Team
    await page.locator('input[type="checkbox"]').first().check();
    await page.getByRole('button', { name: /weiter/i }).click();
    
    // 5. Completion & Redirect
    await expect(page.getByText(/geschafft/i)).toBeVisible({ timeout: 5000 });
    await expect(page).toHaveURL('/dashboard', { timeout: 5000 });
  });

  test('sollte Verband-Filter funktionieren', async ({ page }) => {
    await page.goto('/onboarding');
    
    // Skip to Verein
    await page.evaluate(() => {
      const store = (window as any).__SIMPLE_ONBOARDING_STORE__;
      if (store) {
        store.setState({
          currentStep: 'verein',
          user: { vorname: 'Test', nachname: 'User' }
        });
      }
    });
    await page.reload();
    
    // Warte auf Load
    await expect(page.getByText(/vereine verfügbar/i)).toBeVisible({ timeout: 10000 });
    
    // Merke ursprüngliche Anzahl
    const allCountText = await page.getByText(/vereine verfügbar/i).textContent();
    const allCount = parseInt(allCountText?.match(/\d+/)?.[0] || '0');
    
    // Wähle Bayern
    await page.locator('select').selectOption({ label: /bayern/i });
    await page.waitForTimeout(500);
    
    // Gefilterte Anzahl sollte kleiner sein
    const filteredCountText = await page.getByText(/von.*vereine/i).textContent();
    const filteredCount = parseInt(filteredCountText?.match(/\d+/)?.[0] || '0');
    
    expect(filteredCount).toBeLessThan(allCount);
    expect(filteredCount).toBeGreaterThan(0);
  });

  test('sollte Suche funktionieren', async ({ page }) => {
    await page.goto('/onboarding');
    
    // Skip to Verein
    await page.evaluate(() => {
      const store = (window as any).__SIMPLE_ONBOARDING_STORE__;
      if (store) {
        store.setState({
          currentStep: 'verein',
          user: { vorname: 'Test', nachname: 'User' }
        });
      }
    });
    await page.reload();
    
    await expect(page.getByText(/vereine verfügbar/i)).toBeVisible({ timeout: 10000 });
    
    // Suche
    await page.getByPlaceholder(/verein suchen/i).fill('Bayern München');
    await page.waitForTimeout(500);
    
    // Ergebnisse gefiltert
    const results = page.locator('input[type="radio"]');
    const count = await results.count();
    
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThan(50);
  });

  test('sollte alphabetische Sortierung haben', async ({ page }) => {
    await page.goto('/onboarding');
    
    await page.evaluate(() => {
      const store = (window as any).__SIMPLE_ONBOARDING_STORE__;
      if (store) {
        store.setState({
          currentStep: 'verein',
          user: { vorname: 'Test', nachname: 'User' }
        });
      }
    });
    await page.reload();
    
    await expect(page.getByText(/vereine verfügbar/i)).toBeVisible({ timeout: 10000 });
    
    // Hole erste 5 Vereine
    const labels = page.locator('label').filter({ has: page.locator('input[type="radio"]') });
    const first5 = await labels.locator('p').nth(0).allTextContents();
    
    // Prüfe alphabetische Sortierung
    for (let i = 0; i < first5.length - 1; i++) {
      expect(first5[i].localeCompare(first5[i + 1])).toBeLessThanOrEqual(0);
    }
  });

  test('sollte Multi-Team-Auswahl erlauben', async ({ page }) => {
    await page.goto('/onboarding');
    
    // Complete flow to team step
    await page.getByRole('button', { name: /los geht/i }).click();
    await page.getByLabel(/vorname/i).fill('Test');
    await page.getByLabel(/nachname/i).fill('User');
    await page.getByRole('button', { name: /weiter/i }).click();
    
    await expect(page.getByText(/vereine verfügbar/i)).toBeVisible({ timeout: 10000 });
    await page.locator('input[type="radio"]').first().check();
    await page.getByRole('button', { name: /weiter/i }).click();
    
    await expect(page.getByRole('heading', { name: /wähle deine teams/i })).toBeVisible({ timeout: 10000 });
    
    // Select multiple teams
    const checkboxes = page.locator('input[type="checkbox"]');
    const count = await checkboxes.count();
    
    if (count >= 2) {
      await checkboxes.nth(0).check();
      await checkboxes.nth(1).check();
      
      // Should show count
      await expect(page.getByText(/2.*teams.*ausgewählt/i)).toBeVisible();
    }
  });

  test('sollte Progress Bar korrekt anzeigen', async ({ page }) => {
    await page.goto('/onboarding');
    
    // Check steps
    await expect(page.getByText(/schritt 1 von 5/i)).toBeVisible();
    
    await page.getByRole('button', { name: /los geht/i }).click();
    await expect(page.getByText(/schritt 2 von 5/i)).toBeVisible();
    
    await page.getByLabel(/vorname/i).fill('Test');
    await page.getByLabel(/nachname/i).fill('User');
    await page.getByRole('button', { name: /weiter/i }).click();
    
    await expect(page.getByText(/schritt 3 von 5/i)).toBeVisible();
  });

  test('sollte zurück navigieren können', async ({ page }) => {
    await page.goto('/onboarding');
    
    // Go forward
    await page.getByRole('button', { name: /los geht/i }).click();
    await page.getByLabel(/vorname/i).fill('Test');
    await page.getByLabel(/nachname/i).fill('User');
    await page.getByRole('button', { name: /weiter/i }).click();
    
    await expect(page.getByText(/vereine verfügbar/i)).toBeVisible({ timeout: 10000 });
    
    // Go back
    await page.getByRole('button', { name: /zurück/i }).click();
    await expect(page.getByRole('heading', { name: /über dich/i })).toBeVisible();
    
    // Data should be preserved
    await expect(page.getByLabel(/vorname/i)).toHaveValue('Test');
  });

  test('sollte Session Persistence haben', async ({ page }) => {
    await page.goto('/onboarding');
    await page.getByRole('button', { name: /los geht/i }).click();
    await page.getByLabel(/vorname/i).fill('Session');
    await page.getByLabel(/nachname/i).fill('Test');
    await page.getByRole('button', { name: /weiter/i }).click();
    
    // Reload
    await page.reload();
    
    // Should be at Verein step
    await expect(page.getByRole('heading', { name: /wähle deinen verein/i })).toBeVisible({ timeout: 10000 });
  });

  test('sollte responsive sein', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/onboarding');
    await page.getByRole('button', { name: /los geht/i }).click();
    await page.getByLabel(/vorname/i).fill('Mobile');
    await page.getByLabel(/nachname/i).fill('User');
    await page.getByRole('button', { name: /weiter/i }).click();
    
    await expect(page.getByRole('heading', { name: /wähle deinen verein/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByPlaceholder(/verein suchen/i)).toBeVisible();
  });
});
