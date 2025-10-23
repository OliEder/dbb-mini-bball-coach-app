/**
 * E2E Tests für Onboarding Flow
 * 
 * Testet den kompletten Onboarding-Prozess:
 * - Welcome Screen
 * - BBB URL Import
 * - Team Selection
 * - Spieler CSV Import  
 * - Trikot CSV Import
 * - Completion
 */

import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

test.describe('Onboarding Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear IndexedDB before each test
    await page.goto('/');
    await page.evaluate(() => {
      return new Promise<void>((resolve) => {
        const deleteReq = indexedDB.deleteDatabase('BasketballPWA_v4');
        deleteReq.onsuccess = () => resolve();
        deleteReq.onerror = () => resolve();
      });
    });
    await page.reload();
  });

  test('sollte den Welcome Screen zeigen', async ({ page }) => {
    await page.goto('/');
    
    // Check welcome screen is visible
    await expect(page.getByRole('heading', { name: /willkommen/i })).toBeVisible();
    await expect(page.getByText(/basketball trainer app/i)).toBeVisible();
    
    // Check start button
    const startButton = page.getByRole('button', { name: /los geht/i });
    await expect(startButton).toBeVisible();
  });

  test('sollte zum BBB URL Step navigieren', async ({ page }) => {
    await page.goto('/');
    
    // Click start button
    await page.getByRole('button', { name: /los geht/i }).click();
    
    // Should navigate to BBB URL step
    await expect(page.getByRole('heading', { name: /liga-import/i })).toBeVisible();
    await expect(page.getByPlaceholder(/basketball-bund\.net/i)).toBeVisible();
  });

  test('sollte BBB URL validieren', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /los geht/i }).click();
    
    // Enter invalid URL
    const urlInput = page.getByPlaceholder(/basketball-bund\.net/i);
    await urlInput.fill('https://invalid-url.com');
    
    const weiterButton = page.getByRole('button', { name: /weiter/i });
    await weiterButton.click();
    
    // Should show error
    await expect(page.getByText(/ungültige.*url/i)).toBeVisible();
    
    // Enter valid URL
    await urlInput.clear();
    await urlInput.fill('https://www.basketball-bund.net/index.jsp?Action=101&liga_id=51961');
    
    await weiterButton.click();
    
    // Should proceed to team selection
    await expect(page.getByRole('heading', { name: /team.*auswählen/i })).toBeVisible();
  });

  test('sollte Team-Auswahl ermöglichen', async ({ page }) => {
    await navigateToBBBStep(page);
    
    // Mock API response for teams
    await page.route('**/rest/competition/table/id/*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ligaId: 51961,
          liganame: 'U10 Testliga',
          teams: [
            {
              position: 1,
              teamId: 111,
              teamName: 'SV Postbauer U10',
              clubId: 10,
              clubName: 'SV Postbauer',
              games: 10,
              wins: 8,
              losses: 2,
              points: 16,
              scoredPoints: 450,
              concededPoints: 380,
              pointsDifference: 70,
            },
            {
              position: 2,
              teamId: 222,
              teamName: 'TSV Neumarkt U10',
              clubId: 20,
              clubName: 'TSV Neumarkt',
              games: 10,
              wins: 6,
              losses: 4,
              points: 12,
              scoredPoints: 420,
              concededPoints: 400,
              pointsDifference: 20,
            }
          ]
        })
      });
    });
    
    // Submit URL
    await page.getByRole('button', { name: /weiter/i }).click();
    
    // Wait for teams to load
    await page.waitForSelector('text=SV Postbauer U10');
    
    // Select first team
    await page.getByText('SV Postbauer U10').click();
    
    // Continue
    await page.getByRole('button', { name: /weiter/i }).click();
    
    // Should navigate to Spieler import
    await expect(page.getByRole('heading', { name: /spieler.*import/i })).toBeVisible();
  });

  test('sollte CSV-Dateien hochladen können', async ({ page }) => {
    await navigateToSpielerStep(page);
    
    // Create test CSV content
    const spielerCSV = `vorname,nachname,geburtsdatum,trikotnummer
Max,Mustermann,2015-03-15,4
Tim,Test,2015-06-20,7
Lisa,Beispiel,2015-01-10,11`;
    
    // Upload Spieler CSV
    const spielerInput = page.locator('input[type="file"]').first();
    await spielerInput.setInputFiles({
      name: 'spieler.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(spielerCSV)
    });
    
    // Should show preview
    await expect(page.getByText(/3 spieler gefunden/i)).toBeVisible();
    
    // Continue to Trikots
    await page.getByRole('button', { name: /weiter/i }).click();
    
    // Should be on Trikot step
    await expect(page.getByRole('heading', { name: /trikot.*import/i })).toBeVisible();
    
    // Create trikot CSV
    const trikotCSV = `art,nummer,groesse,farbe_dunkel,farbe_hell
Wendejersey,4,s,rot,weiß
Wendejersey,7,s,rot,weiß
Wendejersey,11,m,rot,weiß`;
    
    // Upload Trikot CSV
    const trikotInput = page.locator('input[type="file"]').nth(1);
    await trikotInput.setInputFiles({
      name: 'trikots.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(trikotCSV)
    });
    
    // Should show preview
    await expect(page.getByText(/3 trikots gefunden/i)).toBeVisible();
    
    // Complete onboarding
    await page.getByRole('button', { name: /abschließen/i }).click();
    
    // Should show completion screen
    await expect(page.getByRole('heading', { name: /fertig/i })).toBeVisible();
  });

  test('sollte Zurück-Navigation ermöglichen', async ({ page }) => {
    await navigateToBBBStep(page);
    
    // Go back to welcome
    await page.getByRole('button', { name: /zurück/i }).click();
    await expect(page.getByRole('heading', { name: /willkommen/i })).toBeVisible();
    
    // Go forward again
    await page.getByRole('button', { name: /los geht/i }).click();
    await expect(page.getByRole('heading', { name: /liga-import/i })).toBeVisible();
  });

  test('sollte Progress-Indicator aktualisieren', async ({ page }) => {
    await page.goto('/');
    
    // Check initial progress (Step 1 of 6)
    await expect(page.getByText(/schritt 1/i)).toBeVisible();
    
    // Navigate through steps
    await page.getByRole('button', { name: /los geht/i }).click();
    await expect(page.getByText(/schritt 2/i)).toBeVisible();
  });

  test('sollte Daten in IndexedDB speichern', async ({ page }) => {
    // Complete full onboarding
    await completeOnboarding(page);
    
    // Check data was saved
    const hasData = await page.evaluate(async () => {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const req = indexedDB.open('BasketballPWA_v4');
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
      
      const tx = db.transaction(['teams'], 'readonly');
      const teams = await new Promise<any[]>((resolve) => {
        const req = tx.objectStore('teams').getAll();
        req.onsuccess = () => resolve(req.result);
      });
      
      return teams.length > 0;
    });
    
    expect(hasData).toBeTruthy();
  });

  test('sollte bei Fehlern Fehlermeldungen zeigen', async ({ page }) => {
    await navigateToSpielerStep(page);
    
    // Upload invalid CSV
    const invalidCSV = 'this,is,not,valid,csv\ndata';
    const input = page.locator('input[type="file"]').first();
    await input.setInputFiles({
      name: 'invalid.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(invalidCSV)
    });
    
    // Should show error
    await expect(page.getByText(/fehler beim import/i)).toBeVisible();
  });

  test('sollte responsive sein', async ({ page, viewport }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // All elements should be visible
    await expect(page.getByRole('heading', { name: /willkommen/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /los geht/i })).toBeVisible();
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.getByRole('heading', { name: /willkommen/i })).toBeVisible();
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.getByRole('heading', { name: /willkommen/i })).toBeVisible();
  });
});

// Helper functions
async function navigateToBBBStep(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: /los geht/i }).click();
  
  const urlInput = page.getByPlaceholder(/basketball-bund\.net/i);
  await urlInput.fill('https://www.basketball-bund.net/index.jsp?Action=101&liga_id=51961');
}

async function navigateToSpielerStep(page: Page) {
  await navigateToBBBStep(page);
  
  // Mock API and select team
  await page.route('**/rest/competition/table/id/*', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ligaId: 51961,
        liganame: 'U10 Testliga',
        teams: [{
          position: 1,
          teamId: 111,
          teamName: 'SV Postbauer U10',
          clubId: 10,
          clubName: 'SV Postbauer',
          games: 10,
          wins: 8,
          losses: 2,
          points: 16,
          scoredPoints: 450,
          concededPoints: 380,
          pointsDifference: 70,
        }]
      })
    });
  });
  
  await page.getByRole('button', { name: /weiter/i }).click();
  await page.waitForSelector('text=SV Postbauer U10');
  await page.getByText('SV Postbauer U10').click();
  await page.getByRole('button', { name: /weiter/i }).click();
}

async function completeOnboarding(page: Page) {
  await navigateToSpielerStep(page);
  
  // Upload Spieler CSV
  const spielerCSV = `vorname,nachname,geburtsdatum,trikotnummer
Max,Mustermann,2015-03-15,4`;
  
  const spielerInput = page.locator('input[type="file"]').first();
  await spielerInput.setInputFiles({
    name: 'spieler.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(spielerCSV)
  });
  
  await page.getByRole('button', { name: /weiter/i }).click();
  
  // Upload Trikot CSV
  const trikotCSV = `art,nummer,groesse,farbe_dunkel,farbe_hell
Wendejersey,4,s,rot,weiß`;
  
  const trikotInput = page.locator('input[type="file"]').nth(1);
  await trikotInput.setInputFiles({
    name: 'trikots.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(trikotCSV)
  });
  
  await page.getByRole('button', { name: /abschließen/i }).click();
}
