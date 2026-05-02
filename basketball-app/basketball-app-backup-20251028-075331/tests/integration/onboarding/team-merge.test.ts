/**
 * Onboarding Team-Merge Integration Test
 * 
 * Testet den kompletten Flow:
 * 1. User erstellt Team im Onboarding
 * 2. Liga-Sync erstellt Sync-Team mit gleichen Namen
 * 3. Teams werden gemergt
 * 4. Spiele werden auf User-Team umgebogen
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '@/shared/db/database';
import type { Team, Spiel } from '@/shared/types';

describe('Onboarding Team-Merge Integration', () => {
  beforeEach(async () => {
    // Clear database
    await db.teams.clear();
    await db.spiele.clear();
    await db.ligen.clear();
    await db.vereine.clear();
  });

  afterEach(async () => {
    await db.teams.clear();
    await db.spiele.clear();
    await db.ligen.clear();
    await db.vereine.clear();
  });

  it('should merge User-Team with Sync-Team and update Spiele references', async () => {
    // ARRANGE
    // 1. Erstelle Liga
    const liga = {
      liga_id: crypto.randomUUID(),
      bbb_liga_id: '51961',
      name: 'U10 mixed Bezirksliga',
      saison: '2025/26',
      altersklasse: 'U10' as const,
      created_at: new Date(),
      sync_am: new Date()
    };
    await db.ligen.add(liga);

    // 2. Erstelle Verein
    const verein = {
      verein_id: crypto.randomUUID(),
      extern_verein_id: '4087',
      name: 'Fibalon',
      ort: 'Neumarkt',
      ist_eigener_verein: true,
      created_at: new Date()
    };
    await db.vereine.add(verein);

    // 3. User erstellt Team im Onboarding (OHNE extern_team_id!)
    const userTeam: Team = {
      team_id: crypto.randomUUID(),
      verein_id: verein.verein_id,
      name: 'Fibalon Baskets Neumarkt',
      trainer: 'Test Trainer',
      altersklasse: 'U10',
      saison: '2025/26',
      team_typ: 'eigen',
      created_at: new Date()
      // ⚠️ extern_team_id fehlt!
    };
    await db.teams.add(userTeam);

    // 4. Liga-Sync erstellt Sync-Team mit extern_team_id
    const syncTeam: Team = {
      team_id: crypto.randomUUID(),
      extern_team_id: '432555', // ⭐ Von API!
      verein_id: verein.verein_id,
      name: 'Fibalon Baskets Neumarkt',
      trainer: '',
      altersklasse: 'U10',
      saison: '2025/26',
      team_typ: 'gegner',
      created_at: new Date()
    };
    await db.teams.add(syncTeam);

    // 5. Spiele referenzieren Sync-Team
    const heimSpiel: Spiel = {
      spiel_id: crypto.randomUUID(),
      extern_spiel_id: '2804049',
      team_id: syncTeam.team_id,
      liga_id: liga.liga_id,
      spielnr: 1,
      spieltag: 1,
      datum: new Date('2025-10-05'),
      uhrzeit: '18:00',
      heim_team_id: syncTeam.team_id,
      gast_team_id: crypto.randomUUID(),
      heim: 'Fibalon Baskets Neumarkt',
      gast: 'Gegner Team',
      ist_heimspiel: true,
      status: 'geplant',
      altersklasse: 'U10',
      created_at: new Date()
    };
    await db.spiele.add(heimSpiel);

    const gastSpiel: Spiel = {
      spiel_id: crypto.randomUUID(),
      extern_spiel_id: '2804050',
      team_id: syncTeam.team_id,
      liga_id: liga.liga_id,
      spielnr: 2,
      spieltag: 2,
      datum: new Date('2025-10-12'),
      uhrzeit: '10:30',
      heim_team_id: crypto.randomUUID(),
      gast_team_id: syncTeam.team_id,
      heim: 'Gegner Team',
      gast: 'Fibalon Baskets Neumarkt',
      ist_heimspiel: false,
      status: 'geplant',
      altersklasse: 'U10',
      created_at: new Date()
    };
    await db.spiele.add(gastSpiel);

    // ACT - Merge Logic (wie im Onboarding)
    // 1. Finde Sync-Team mit gleicher Name
    const foundSyncTeam = await db.teams
      .where('name')
      .equals(userTeam.name)
      .and(team => team.extern_team_id !== undefined && team.team_id !== userTeam.team_id)
      .first();

    expect(foundSyncTeam).toBeDefined();
    expect(foundSyncTeam?.extern_team_id).toBe('432555');

    // 2. Übernehme extern_team_id
    await db.teams.update(userTeam.team_id, {
      extern_team_id: foundSyncTeam!.extern_team_id
    });

    // 3. Update Spiele-Referenzen
    const spieleAsHeim = await db.spiele
      .where('heim_team_id')
      .equals(syncTeam.team_id)
      .toArray();

    const spieleAsGast = await db.spiele
      .where('gast_team_id')
      .equals(syncTeam.team_id)
      .toArray();

    for (const spiel of spieleAsHeim) {
      await db.spiele.update(spiel.spiel_id, {
        heim_team_id: userTeam.team_id
      });
    }

    for (const spiel of spieleAsGast) {
      await db.spiele.update(spiel.spiel_id, {
        gast_team_id: userTeam.team_id
      });
    }

    // 4. Lösche Sync-Team
    await db.teams.delete(syncTeam.team_id);

    // ASSERT
    // User-Team hat jetzt extern_team_id
    const mergedTeam = await db.teams.get(userTeam.team_id);
    expect(mergedTeam?.extern_team_id).toBe('432555');

    // Sync-Team ist gelöscht
    const deletedSyncTeam = await db.teams.get(syncTeam.team_id);
    expect(deletedSyncTeam).toBeUndefined();

    // Spiele referenzieren jetzt User-Team
    const updatedHeimSpiel = await db.spiele.get(heimSpiel.spiel_id);
    expect(updatedHeimSpiel?.heim_team_id).toBe(userTeam.team_id);

    const updatedGastSpiel = await db.spiele.get(gastSpiel.spiel_id);
    expect(updatedGastSpiel?.gast_team_id).toBe(userTeam.team_id);

    // Nur 1 Team übrig
    const allTeams = await db.teams.toArray();
    expect(allTeams).toHaveLength(1);
    expect(allTeams[0].team_id).toBe(userTeam.team_id);
  });

  it('should find Spiele by team_id after merge', async () => {
    // ARRANGE
    const liga = {
      liga_id: crypto.randomUUID(),
      bbb_liga_id: '51961',
      name: 'Test Liga',
      saison: '2025/26',
      altersklasse: 'U10' as const,
      created_at: new Date(),
      sync_am: new Date()
    };
    await db.ligen.add(liga);

    const verein = {
      verein_id: crypto.randomUUID(),
      name: 'Test Verein',
      ort: 'Test',
      ist_eigener_verein: true,
      created_at: new Date()
    };
    await db.vereine.add(verein);

    const userTeam: Team = {
      team_id: crypto.randomUUID(),
      verein_id: verein.verein_id,
      name: 'Test Team',
      trainer: 'Trainer',
      altersklasse: 'U10',
      saison: '2025/26',
      team_typ: 'eigen',
      created_at: new Date()
    };
    await db.teams.add(userTeam);

    // Erstelle Spiele MIT user team_id (nach Merge!)
    await db.spiele.add({
      spiel_id: crypto.randomUUID(),
      extern_spiel_id: '123',
      team_id: userTeam.team_id,
      liga_id: liga.liga_id,
      spielnr: 1,
      spieltag: 1,
      datum: new Date(),
      uhrzeit: '18:00',
      heim_team_id: userTeam.team_id,
      gast_team_id: crypto.randomUUID(),
      heim: 'Test Team',
      gast: 'Gegner',
      ist_heimspiel: true,
      status: 'geplant',
      altersklasse: 'U10',
      created_at: new Date()
    });

    await db.spiele.add({
      spiel_id: crypto.randomUUID(),
      extern_spiel_id: '124',
      team_id: userTeam.team_id,
      liga_id: liga.liga_id,
      spielnr: 2,
      spieltag: 2,
      datum: new Date(),
      uhrzeit: '10:30',
      heim_team_id: crypto.randomUUID(),
      gast_team_id: userTeam.team_id,
      heim: 'Gegner',
      gast: 'Test Team',
      ist_heimspiel: false,
      status: 'geplant',
      altersklasse: 'U10',
      created_at: new Date()
    });

    // ACT - Finde Spiele wie TabellenService
    const heimSpiele = await db.spiele
      .where('heim_team_id')
      .equals(userTeam.team_id)
      .toArray();

    const gastSpiele = await db.spiele
      .where('gast_team_id')
      .equals(userTeam.team_id)
      .toArray();

    const alleSpiele = [...heimSpiele, ...gastSpiele];

    // ASSERT
    expect(alleSpiele).toHaveLength(2);
    expect(alleSpiele[0].liga_id).toBe(liga.liga_id);
    expect(alleSpiele[1].liga_id).toBe(liga.liga_id);
  });
});
