/**
 * BBB Integration E2E Tests
 * 
 * Testet die Integration mit der BBB API
 */

import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

test.describe('BBB API Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Clear IndexedDB
    await page.goto('/');
    await page.evaluate(() => {
      return indexedDB.deleteDatabase('BasketballPWA_v4');
    });
    await page.reload();
  });

  test('sollte Liga-Daten aus BBB URL laden', async ({ page }) => {
    // Mock BBB API responses
    await page.route('**/rest/competition/table/id/51961', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ligaId: 51961,
          liganame: 'U10 Bezirksliga Oberpfalz Süd',
          teams: [
            {
              position: 1,
              teamId: 111,
              teamName: 'SV Postbauer U10',
              clubId: 10,
              clubName: 'SV Postbauer-Heng',
              games: 12,
              wins: 10,
              losses: 2,
              points: 20,
              scoredPoints: 580,
              concededPoints: 420,
              pointsDifference: 160,
            },
            {
              position: 2,
              teamId: 222,
              teamName: 'TSV Neumarkt U10',
              clubId: 20,
              clubName: 'TSV 1860 Neumarkt',
              games: 12,
              wins: 9,
              losses: 3,
              points: 18,
              scoredPoints: 560,
              concededPoints: 450,
              pointsDifference: 110,
            },
            {
              position: 3,
              teamId: 333,
              teamName: 'DJK Allersburg U10',
              clubId: 30,
              clubName: 'DJK Allersburg',
              games: 12,
              wins: 7,
              losses: 5,
              points: 14,
              scoredPoints: 490,
              concededPoints: 470,
              pointsDifference: 20,
            }
          ]
        })
      });
    });

    await page.route('**/rest/competition/spielplan/id/51961', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ligaId: 51961,
          liganame: 'U10 Bezirksliga Oberpfalz Süd',
          games: [
            {
              matchId: 99991,
              gameNumber: 1,
              gameDay: 1,
              date: '2025-11-01',
              time: '10:00',
              homeTeam: {
                teamId: 111,
                teamName: 'SV Postbauer U10',
                clubId: 10,
                clubName: 'SV Postbauer-Heng',
              },
              awayTeam: {
                teamId: 222,
                teamName: 'TSV Neumarkt U10',
                clubId: 20,
                clubName: 'TSV 1860 Neumarkt',
              },
              venue: {
                name: 'Sporthalle Postbauer',
                address: 'Hauptstraße 10, 92353 Postbauer-Heng',
              },
              status: 'scheduled',
              homeScore: null,
              awayScore: null,
            }
          ]
        })
      });
    });

    // Start onboarding
    await page.goto('/');
    await page.getByRole('button', { name: /los geht/i }).click();
    
    // Enter BBB URL
    const urlInput = page.getByPlaceholder(/basketball-bund\.net/i);
    await urlInput.fill('https://www.basketball-bund.net/index.jsp?Action=101&liga_id=51961');
    await page.getByRole('button', { name: /weiter/i }).click();
    
    // Wait for teams to load
    await page.waitForSelector('text=SV Postbauer U10');
    
    // Verify all teams are displayed
    await expect(page.getByText('SV Postbauer U10')).toBeVisible();
    await expect(page.getByText('TSV Neumarkt U10')).toBeVisible();
    await expect(page.getByText('DJK Allersburg U10')).toBeVisible();
    
    // Verify team stats are shown
    await expect(page.getByText('10 Siege')).toBeVisible();
    await expect(page.getByText('2 Niederlagen')).toBeVisible();
    
    // Select SV Postbauer
    await page.getByText('SV Postbauer U10').click();
    await expect(page.getByText('SV Postbauer U10')).toHaveClass(/selected/);
    
    // Continue
    await page.getByRole('button', { name: /weiter/i }).click();
    
    // Should be on Spieler import step
    await expect(page.getByRole('heading', { name: /spieler.*import/i })).toBeVisible();
  });

  test('sollte CORS-Fehler behandeln', async ({ page }) => {
    // Simulate CORS error
    await page.route('**/rest/competition/**', async route => {
      await route.abort('failed');
    });
    
    await page.goto('/');
    await page.getByRole('button', { name: /los geht/i }).click();
    
    // Enter BBB URL
    const urlInput = page.getByPlaceholder(/basketball-bund\.net/i);
    await urlInput.fill('https://www.basketball-bund.net/index.jsp?Action=101&liga_id=51961');
    await page.getByRole('button', { name: /weiter/i }).click();
    
    // Should show error message
    await expect(page.getByText(/fehler beim laden/i)).toBeVisible();
    await expect(page.getByText(/cors/i)).toBeVisible();
    
    // Retry button should be visible
    await expect(page.getByRole('button', { name: /erneut versuchen/i })).toBeVisible();
  });

  test('sollte Liga-ID aus verschiedenen URL-Formaten extrahieren', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /los geht/i }).click();
    
    const urlInput = page.getByPlaceholder(/basketball-bund\.net/i);
    const weiterButton = page.getByRole('button', { name: /weiter/i });
    
    // Test different URL formats
    const urlFormats = [
      'https://www.basketball-bund.net/index.jsp?Action=101&liga_id=51961',
      'https://www.basketball-bund.net/liga/tabelle.jsp?ligaid=51961',
      'https://www.basketball-bund.net/public/ergebnisse.jsp?print=1&liga_id=51961',
      'basketball-bund.net/rest/competition/id/51961/table',
    ];
    
    for (const url of urlFormats) {
      await urlInput.clear();
      await urlInput.fill(url);
      
      // Should extract liga_id=51961
      await expect(page.locator('[data-liga-id="51961"]')).toBeVisible();
    }
  });

  test('sollte Spielplan synchronisieren', async ({ page }) => {
    // Mock spielplan with multiple games
    await page.route('**/rest/competition/spielplan/id/51961', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ligaId: 51961,
          liganame: 'U10 Bezirksliga Oberpfalz Süd',
          games: Array.from({ length: 10 }, (_, i) => ({
            matchId: 99990 + i,
            gameNumber: i + 1,
            gameDay: Math.floor(i / 2) + 1,
            date: `2025-11-${String(i + 1).padStart(2, '0')}`,
            time: i % 2 === 0 ? '10:00' : '14:00',
            homeTeam: {
              teamId: i % 2 === 0 ? 111 : 222,
              teamName: i % 2 === 0 ? 'SV Postbauer U10' : 'TSV Neumarkt U10',
              clubId: i % 2 === 0 ? 10 : 20,
              clubName: i % 2 === 0 ? 'SV Postbauer-Heng' : 'TSV 1860 Neumarkt',
            },
            awayTeam: {
              teamId: i % 2 === 0 ? 222 : 111,
              teamName: i % 2 === 0 ? 'TSV Neumarkt U10' : 'SV Postbauer U10',
              clubId: i % 2 === 0 ? 20 : 10,
              clubName: i % 2 === 0 ? 'TSV 1860 Neumarkt' : 'SV Postbauer-Heng',
            },
            venue: {
              name: i % 2 === 0 ? 'Sporthalle Postbauer' : 'Sporthalle Neumarkt',
              address: i % 2 === 0 
                ? 'Hauptstraße 10, 92353 Postbauer-Heng'
                : 'Sportstraße 5, 92318 Neumarkt',
            },
            status: i < 5 ? 'finished' : 'scheduled',
            homeScore: i < 5 ? 50 + Math.floor(Math.random() * 20) : null,
            awayScore: i < 5 ? 45 + Math.floor(Math.random() * 20) : null,
          }))
        })
      });
    });
    
    // Complete onboarding with team selection
    // ... (similar to previous test)
    
    // Navigate to Spielplan after onboarding
    await page.goto('/spielplan');
    
    // Verify games are displayed
    await expect(page.getByText('10 Spiele')).toBeVisible();
    await expect(page.getByText('5 gespielt')).toBeVisible();
    await expect(page.getByText('5 ausstehend')).toBeVisible();
    
    // Check venue information
    await expect(page.getByText('Sporthalle Postbauer')).toBeVisible();
    await expect(page.getByText('Sporthalle Neumarkt')).toBeVisible();
  });

  test('sollte CSV-Templates bereitstellen', async ({ page }) => {
    await navigateToSpielerStep(page);
    
    // Download template button should be visible
    const downloadButton = page.getByRole('button', { name: /vorlage herunterladen/i });
    await expect(downloadButton).toBeVisible();
    
    // Click download
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      downloadButton.click()
    ]);
    
    // Verify download
    expect(download.suggestedFilename()).toBe('spieler-vorlage.csv');
    
    // Read downloaded content
    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    
    await new Promise<void>((resolve) => {
      stream.on('data', (chunk: Buffer) => chunks.push(chunk));
      stream.on('end', () => resolve());
    });
    
    const content = Buffer.concat(chunks).toString('utf-8');
    
    // Verify CSV headers
    expect(content).toContain('vorname');
    expect(content).toContain('nachname');
    expect(content).toContain('geburtsdatum');
    expect(content).toContain('trikotnummer');
  });

  test('sollte Fortschritt speichern und wiederherstellen', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /los geht/i }).click();
    
    // Enter BBB URL
    const urlInput = page.getByPlaceholder(/basketball-bund\.net/i);
    await urlInput.fill('https://www.basketball-bund.net/index.jsp?liga_id=51961');
    
    // Reload page
    await page.reload();
    
    // Should restore to same step with data
    await expect(page.getByPlaceholder(/basketball-bund\.net/i)).toHaveValue(
      'https://www.basketball-bund.net/index.jsp?liga_id=51961'
    );
  });

  test('sollte Validierungsfehler anzeigen', async ({ page }) => {
    await navigateToSpielerStep(page);
    
    // Upload CSV with invalid data
    const invalidCSV = `vorname,nachname,geburtsdatum,trikotnummer
,Mustermann,2015-03-15,4
Tim,,2015-06-20,7
Lisa,Beispiel,invalid-date,11
Max,Test,2015-01-10,999`;
    
    const input = page.locator('input[type="file"]').first();
    await input.setInputFiles({
      name: 'spieler.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(invalidCSV)
    });
    
    // Should show validation errors
    await expect(page.getByText(/vorname fehlt/i)).toBeVisible();
    await expect(page.getByText(/nachname fehlt/i)).toBeVisible();
    await expect(page.getByText(/ungültiges datum/i)).toBeVisible();
    await expect(page.getByText(/trikotnummer.*ungültig/i)).toBeVisible();
    
    // Should not allow to continue
    const weiterButton = page.getByRole('button', { name: /weiter/i });
    await expect(weiterButton).toBeDisabled();
  });
});

// Helper function
async function navigateToSpielerStep(page: Page) {
  // Mock API responses
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
  
  await page.goto('/');
  await page.getByRole('button', { name: /los geht/i }).click();
  
  const urlInput = page.getByPlaceholder(/basketball-bund\.net/i);
  await urlInput.fill('https://www.basketball-bund.net/index.jsp?liga_id=51961');
  await page.getByRole('button', { name: /weiter/i }).click();
  
  await page.waitForSelector('text=SV Postbauer U10');
  await page.getByText('SV Postbauer U10').click();
  await page.getByRole('button', { name: /weiter/i }).click();
}
