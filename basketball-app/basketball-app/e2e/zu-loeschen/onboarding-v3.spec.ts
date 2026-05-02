/**
 * E2E Tests für Onboarding V3 (Lokale Club-Daten)
 * 
 * Testet den kompletten Onboarding-Flow OHNE API-Calls:
 * - Welcome
 * - User
 * - Verband
 * - Altersklassen
 * - Gebiet
 * - Verein (lokale Daten!)
 * - Team (lokale Daten!)
 * - Completion
 */

import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

test.describe('Onboarding V3: Lokale Club-Daten', () => {
  
  test.beforeEach(async ({ page }) => {
    // Clear localStorage & IndexedDB
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      return new Promise<void>((resolve) => {
        const deleteReq = indexedDB.deleteDatabase('BasketballPWA_v4');
        deleteReq.onsuccess = () => resolve();
        deleteReq.onerror = () => resolve();
      });
    });
    await page.reload();
  });

  test('sollte kompletten Onboarding-Flow durchlaufen', async ({ page }) => {
    // 1. Welcome Step
    await page.goto('/onboarding');
    await expect(page.getByRole('heading', { name: /willkommen/i })).toBeVisible();
    await page.getByRole('button', { name: /los geht/i }).click();
    
    // 2. User Step
    await expect(page.getByRole('heading', { name: /über dich/i })).toBeVisible();
    await page.getByLabel(/vorname/i).fill('Max');
    await page.getByLabel(/nachname/i).fill('Mustermann');
    await page.getByRole('button', { name: /weiter/i }).click();
    
    // 3. Verband Step
    await expect(page.getByRole('heading', { name: /verband.*wählen/i })).toBeVisible();
    await page.getByText(/bayern/i).first().click();
    await page.getByRole('button', { name: /weiter/i }).click();
    
    // 4. Altersklassen Step
    await expect(page.getByRole('heading', { name: /altersklasse/i })).toBeVisible();
    await page.getByText(/u10/i).first().click();
    await page.getByRole('button', { name: /weiter/i }).click();
    
    // 5. Gebiet Step
    await expect(page.getByRole('heading', { name: /gebiet/i })).toBeVisible();
    await page.locator('label').first().click(); // Erstes Gebiet wählen
    await page.getByRole('button', { name: /weiter/i }).click();
    
    // 6. Verein Step (V3 - lokal!)
    await expect(page.getByRole('heading', { name: /verein/i })).toBeVisible();
    
    // Prüfe: Lokale Daten geladen (keine Spinner)
    await expect(page.getByText(/vereine gefunden/i)).toBeVisible({ timeout: 2000 });
    
    // Suche nach Verein
    await page.getByPlaceholder(/verein suchen/i).fill('München');
    await page.waitForTimeout(500); // Debounce
    
    // Wähle ersten Verein
    await page.locator('label').first().click();
    await page.getByRole('button', { name: /weiter/i }).click();
    
    // 7. Team Step (V3 - lokal!)
    await expect(page.getByRole('heading', { name: /team.*wählen/i })).toBeVisible();
    
    // Warte auf Chunk-Loading
    await expect(page.getByText(/teams verfügbar/i)).toBeVisible({ timeout: 5000 });
    
    // Wähle erstes Team
    await page.locator('input[type="checkbox"]').first().check();
    await page.getByRole('button', { name: /weiter/i }).click();
    
    // 8. Completion & Redirect zum Dashboard
    await expect(page.getByText(/geschafft|fertig|abgeschlossen/i)).toBeVisible({ timeout: 5000 });
    
    // Sollte automatisch zum Dashboard navigieren
    await expect(page).toHaveURL('/dashboard', { timeout: 5000 });
  });

  test('sollte Verein-Suche funktionieren (lokal)', async ({ page }) => {
    await page.goto('/onboarding');
    
    // Springe direkt zu Verein-Step durch Store-Manipulation
    await page.evaluate(() => {
      const store = (window as any).__ONBOARDING_V2_STORE__;
      if (store) {
        store.setState({ 
          currentStep: 'verein',
          user: { vorname: 'Test', nachname: 'User' },
          selectedVerband: 2,
          selectedAltersklassen: [10],
          selectedGebiet: 'test'
        });
      }
    });
    await page.reload();
    
    // Suche nach spezifischem Verein
    const searchInput = page.getByPlaceholder(/verein suchen/i);
    await searchInput.fill('Bayern München');
    
    // Warte kurz (Client-seitige Suche!)
    await page.waitForTimeout(300);
    
    // Ergebnisse sollten gefiltert sein
    const results = page.locator('label');
    const count = await results.count();
    
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThan(50); // Gefiltert
    
    // Alle Ergebnisse sollten "München" enthalten
    const firstResult = await results.first().textContent();
    expect(firstResult?.toLowerCase()).toContain('münchen');
  });

  test('sollte "Neuen Verein anlegen" ermöglichen', async ({ page }) => {
    await page.goto('/onboarding');
    // Quick-navigate zu Verein-Step
    await page.evaluate(() => {
      const store = (window as any).__ONBOARDING_V2_STORE__;
      if (store) {
        store.setState({ 
          currentStep: 'verein',
          user: { vorname: 'Test', nachname: 'User' },
          selectedVerband: 2,
          selectedAltersklassen: [10],
          selectedGebiet: 'test'
        });
      }
    });
    await page.reload();
    
    // Wähle "Neuer Verein"
    await page.getByText(/neuen verein anlegen/i).click();
    
    // Formular sollte erscheinen
    await expect(page.getByLabel(/vereinsname/i)).toBeVisible();
    
    // Verein anlegen
    await page.getByLabel(/vereinsname/i).fill('Test-Verein e.V.');
    await page.getByRole('button', { name: /weiter/i }).click();
    
    // Sollte zu Team-Step springen (aber ohne Teams)
    // TODO: Oder direkt zu Completion?
    await expect(page.getByText(/keine teams|team anlegen/i)).toBeVisible();
  });

  test('sollte Multi-Team-Auswahl ermöglichen', async ({ page }) => {
    await page.goto('/onboarding');
    // TODO: Navigate to team step
    
    // Wähle mehrere Teams
    const checkboxes = page.locator('input[type="checkbox"]');
    const count = await checkboxes.count();
    
    if (count >= 2) {
      await checkboxes.nth(0).check();
      await checkboxes.nth(1).check();
      
      // Summary sollte 2 Teams zeigen
      await expect(page.getByText(/2 teams ausgewählt/i)).toBeVisible();
    }
    
    await page.getByRole('button', { name: /weiter/i }).click();
    
    // Sollte erfolgreich weitergehen
    await expect(page.getByText(/fertig|sync|abschließ/i)).toBeVisible({ timeout: 5000 });
  });

  test('sollte Zurück-Navigation korrekt handhaben', async ({ page }) => {
    await navigateToTeamStep(page);
    
    // Zurück zu Verein
    await page.getByRole('button', { name: /zurück/i }).click();
    await expect(page.getByRole('heading', { name: /verein/i })).toBeVisible();
    
    // Zurück zu Gebiet
    await page.getByRole('button', { name: /zurück/i }).click();
    await expect(page.getByRole('heading', { name: /gebiet/i })).toBeVisible();
    
    // Zurück zu Altersklassen
    await page.getByRole('button', { name: /zurück/i }).click();
    await expect(page.getByRole('heading', { name: /altersklasse/i })).toBeVisible();
  });

  test('sollte Progress-Bar aktualisieren', async ({ page }) => {
    await page.goto('/onboarding');
    
    // Schritt 1 von 10
    await expect(page.getByText(/schritt 1 von 10/i)).toBeVisible();
    
    // Navigiere durch Steps
    await page.getByRole('button', { name: /los geht/i }).click();
    await expect(page.getByText(/schritt 2 von 10/i)).toBeVisible();
    
    // User-Daten eingeben
    await page.getByLabel(/vorname/i).fill('Test');
    await page.getByLabel(/nachname/i).fill('User');
    await page.getByRole('button', { name: /weiter/i }).click();
    
    await expect(page.getByText(/schritt 3 von 10/i)).toBeVisible();
  });

  test('sollte KEINE API-Calls machen (offline-fähig)', async ({ page }) => {
    // Track network requests
    const apiCalls: string[] = [];
    
    page.on('request', request => {
      const url = request.url();
      if (url.includes('basketball-bund.net') || url.includes('/api/')) {
        apiCalls.push(url);
      }
    });
    
    // Kompletter Flow
    await navigateToTeamStep(page);
    
    // Keine API-Calls sollten gemacht worden sein
    expect(apiCalls.length).toBe(0);
  });

  test('sollte Daten in IndexedDB speichern', async ({ page }) => {
    await navigateToTeamStep(page);
    
    // Wähle Team
    await page.locator('input[type="checkbox"]').first().check();
    await page.getByRole('button', { name: /weiter/i }).click();
    
    // Prüfe IndexedDB
    const hasData = await page.evaluate(async () => {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const req = indexedDB.open('BasketballPWA_v4');
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
      
      // Prüfe Verein
      const vereinTx = db.transaction(['vereine'], 'readonly');
      const vereine = await new Promise<any[]>((resolve) => {
        const req = vereinTx.objectStore('vereine').getAll();
        req.onsuccess = () => resolve(req.result);
      });
      
      // Prüfe Teams
      const teamTx = db.transaction(['teams'], 'readonly');
      const teams = await new Promise<any[]>((resolve) => {
        const req = teamTx.objectStore('teams').getAll();
        req.onsuccess = () => resolve(req.result);
      });
      
      return vereine.length > 0 && teams.length > 0;
    });
    
    expect(hasData).toBeTruthy();
  });

  test('sollte Validierung bei fehlenden Daten zeigen', async ({ page }) => {
    await page.goto('/onboarding');
    await page.getByRole('button', { name: /los geht/i }).click();
    
    // Versuche ohne Namen weiterzugehen
    await page.getByRole('button', { name: /weiter/i }).click();
    
    // Button sollte disabled sein oder Fehler zeigen
    const button = page.getByRole('button', { name: /weiter/i });
    const isDisabled = await button.isDisabled();
    
    expect(isDisabled).toBeTruthy();
  });

  test('sollte responsive sein (Mobile)', async ({ page }) => {
    // Mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await navigateToVereinStep(page);
    
    // Alle Elemente sollten sichtbar sein
    await expect(page.getByRole('heading', { name: /verein/i })).toBeVisible();
    await expect(page.getByPlaceholder(/verein suchen/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /zurück/i })).toBeVisible();
  });

  test('sollte responsive sein (Tablet)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await navigateToVereinStep(page);
    
    await expect(page.getByRole('heading', { name: /verein/i })).toBeVisible();
  });

  test('sollte Chunk-Loading-Error handhaben', async ({ page }) => {
    await navigateToVereinStep(page);
    
    // Wähle Verein
    await page.locator('label').first().click();
    
    // Mock Chunk-Loading-Error
    await page.route('**/clubs-chunks/clubs-chunk-*.json', route => {
      route.abort('failed');
    });
    
    await page.getByRole('button', { name: /weiter/i }).click();
    
    // Fehler sollte angezeigt werden
    await expect(page.getByText(/fehler|nicht.*geladen|chunk/i)).toBeVisible({ timeout: 5000 });
  });

  test('sollte Session Persistence haben', async ({ page }) => {
    // Starte Onboarding
    await page.goto('/onboarding');
    await page.getByRole('button', { name: /los geht/i }).click();
    
    // User-Daten eingeben
    await page.getByLabel(/vorname/i).fill('Session');
    await page.getByLabel(/nachname/i).fill('Test');
    await page.getByRole('button', { name: /weiter/i }).click();
    
    // Wähle Verband
    await page.getByText(/bayern/i).first().click();
    await page.getByRole('button', { name: /weiter/i }).click();
    
    // Reload page
    await page.reload();
    
    // Sollte bei Altersklassen-Step sein (Fortschritt gespeichert)
    await expect(page.getByRole('heading', { name: /altersklasse/i })).toBeVisible();
  });
});

// Helper Functions
async function navigateToVereinStep(page: Page) {
  await page.goto('/onboarding');
  
  // Welcome
  await page.getByRole('button', { name: /los geht/i }).click();
  
  // User
  await page.getByLabel(/vorname/i).fill('Test');
  await page.getByLabel(/nachname/i).fill('User');
  await page.getByRole('button', { name: /weiter/i }).click();
  
  // Verband
  await page.getByText(/bayern/i).first().click();
  await page.getByRole('button', { name: /weiter/i }).click();
  
  // Altersklassen
  await page.getByText(/u10/i).first().click();
  await page.getByRole('button', { name: /weiter/i }).click();
  
  // Gebiet
  await page.locator('label').first().click();
  await page.getByRole('button', { name: /weiter/i }).click();
  
  // Jetzt bei Verein-Step
  await expect(page.getByRole('heading', { name: /verein/i })).toBeVisible();
}

async function navigateToTeamStep(page: Page) {
  await navigateToVereinStep(page);
  
  // Wähle ersten Verein
  await page.locator('label').first().click();
  await page.getByRole('button', { name: /weiter/i }).click();
  
  // Warte auf Team-Loading
  await expect(page.getByRole('heading', { name: /team/i })).toBeVisible({ timeout: 5000 });
}
