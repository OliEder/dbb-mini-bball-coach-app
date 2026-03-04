/**
 * Onboarding Team-Merge Integration Test (v7.0)
 *
 * Testet den kompletten Flow:
 * 1. User erstellt Team im Onboarding (mit Participation)
 * 2. Liga-Sync erstellt Sync-Team mit gleichen Namen + extern_permanent_id
 * 3. Teams werden gemergt (extern_permanent_id übernommen)
 * 4. Spiele werden auf User-Team umgebogen
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '@/shared/db/database';
import type { Team, TeamLigaParticipation, Spiel } from '@/shared/types';

describe('Onboarding Team-Merge Integration (v7.0)', () => {
  beforeEach(async () => {
    await db.teams.clear();
    await db.team_liga_participations.clear();
    await db.spiele.clear();
    await db.ligen.clear();
    await db.vereine.clear();
  });

  afterEach(async () => {
    await db.teams.clear();
    await db.team_liga_participations.clear();
    await db.spiele.clear();
    await db.ligen.clear();
    await db.vereine.clear();
  });

  it('should merge User-Team with Sync-Team and update Spiele references', async () => {
    // ARRANGE
    // 1. Liga
    const liga = {
      liga_id: crypto.randomUUID(),
      bbb_liga_id: '51961',
      name: 'U10 mixed Bezirksliga',
      saison: '2025/26',
      altersklasse: 'U10' as const,
      created_at: new Date(),
      sync_am: new Date(),
    };
    await db.ligen.add(liga);

    // 2. Verein
    const verein = {
      verein_id: crypto.randomUUID(),
      extern_verein_id: '4087',
      name: 'Fibalon',
      ort: 'Neumarkt',
      ist_eigener_verein: true,
      created_at: new Date(),
    };
    await db.vereine.add(verein);

    // 3. User-Team (v7.0: ohne altersklasse/saison auf Team)
    const userTeamId = crypto.randomUUID();
    const userTeam: Team = {
      team_id: userTeamId,
      verein_id: verein.verein_id,
      name: 'Fibalon Baskets Neumarkt',
      trainer: 'Test Trainer',
      team_typ: 'eigen',
      created_at: new Date(),
    };
    await db.teams.add(userTeam);

    // User-Team bekommt eine Participation (v7.0!)
    const userParticipation: Omit<TeamLigaParticipation, 'id'> = {
      team_id: userTeamId,
      liga_id: liga.liga_id,
      altersklasse: 'U10',
      saison: '2025/26',
      ist_aktiv: true,
      created_at: new Date(),
    };
    await db.team_liga_participations.add(userParticipation);

    // 4. Sync-Team (v7.0: mit extern_permanent_id, ohne v6-Felder)
    const syncTeamId = crypto.randomUUID();
    const syncTeam: Team = {
      team_id: syncTeamId,
      extern_permanent_id: '432555', // ⭐ Von API: teamPermanentId
      verein_id: verein.verein_id,
      name: 'Fibalon Baskets Neumarkt',
      trainer: '',
      team_typ: 'gegner',
      created_at: new Date(),
    };
    await db.teams.add(syncTeam);

    // Sync-Team bekommt auch eine Participation
    const syncParticipationData: Omit<TeamLigaParticipation, 'id'> = {
      team_id: syncTeamId,
      liga_id: liga.liga_id,
      extern_team_id: '432555',
      altersklasse: 'U10',
      saison: '2025/26',
      ist_aktiv: true,
      created_at: new Date(),
    };
    await db.team_liga_participations.add(syncParticipationData);

    // 5. Spiele referenzieren Sync-Team
    const heimSpiel: Spiel = {
      spiel_id: crypto.randomUUID(),
      extern_spiel_id: '2804049',
      liga_id: liga.liga_id,
      spielnr: 1,
      spieltag: 1,
      datum: new Date('2025-10-05'),
      uhrzeit: '18:00',
      heim_team_id: syncTeamId,
      gast_team_id: crypto.randomUUID(),
      heim: 'Fibalon Baskets Neumarkt',
      gast: 'Gegner Team',
      ist_heimspiel: true,
      status: 'geplant',
      created_at: new Date(),
    };
    await db.spiele.add(heimSpiel);

    const gastSpiel: Spiel = {
      spiel_id: crypto.randomUUID(),
      extern_spiel_id: '2804050',
      liga_id: liga.liga_id,
      spielnr: 2,
      spieltag: 2,
      datum: new Date('2025-10-12'),
      uhrzeit: '10:30',
      heim_team_id: crypto.randomUUID(),
      gast_team_id: syncTeamId,
      heim: 'Gegner Team',
      gast: 'Fibalon Baskets Neumarkt',
      ist_heimspiel: false,
      status: 'geplant',
      created_at: new Date(),
    };
    await db.spiele.add(gastSpiel);

    // ACT - Merge Logic (v7.0: via extern_permanent_id)
    // 1. Finde Sync-Team mit gleicher Name + extern_permanent_id
    const foundSyncTeam = await db.teams
      .where('name')
      .equals(userTeam.name)
      .and(team => team.extern_permanent_id !== undefined && team.team_id !== userTeamId)
      .first();

    expect(foundSyncTeam).toBeDefined();
    expect(foundSyncTeam?.extern_permanent_id).toBe('432555');

    // 2. Übernehme extern_permanent_id vom Sync-Team
    await db.teams.update(userTeamId, {
      extern_permanent_id: foundSyncTeam!.extern_permanent_id,
      team_typ: 'eigen',
    });

    // 3. Update Participation: übernehme extern_team_id
    const userPart = await db.team_liga_participations
      .where('team_id').equals(userTeamId).first();
    const syncPart = await db.team_liga_participations
      .where('team_id').equals(syncTeamId).first();

    if (userPart && syncPart?.extern_team_id) {
      await db.team_liga_participations.update(userPart.id!, {
        extern_team_id: syncPart.extern_team_id,
      });
    }

    // 4. Update Spiele-Referenzen
    const spieleAsHeim = await db.spiele
      .where('heim_team_id')
      .equals(syncTeamId)
      .toArray();

    const spieleAsGast = await db.spiele
      .where('gast_team_id')
      .equals(syncTeamId)
      .toArray();

    for (const spiel of spieleAsHeim) {
      await db.spiele.update(spiel.spiel_id, { heim_team_id: userTeamId });
    }

    for (const spiel of spieleAsGast) {
      await db.spiele.update(spiel.spiel_id, { gast_team_id: userTeamId });
    }

    // 5. Lösche Sync-Team
    await db.teams.delete(syncTeamId);

    // ASSERT
    // User-Team hat jetzt extern_permanent_id
    const mergedTeam = await db.teams.get(userTeamId);
    expect(mergedTeam?.extern_permanent_id).toBe('432555');
    expect(mergedTeam?.team_typ).toBe('eigen');

    // User-Participation hat extern_team_id
    const mergedParticipation = await db.team_liga_participations
      .where('team_id').equals(userTeamId).first();
    expect(mergedParticipation?.extern_team_id).toBe('432555');

    // Sync-Team ist gelöscht
    const deletedSyncTeam = await db.teams.get(syncTeamId);
    expect(deletedSyncTeam).toBeUndefined();

    // Spiele referenzieren jetzt User-Team
    const updatedHeimSpiel = await db.spiele.get(heimSpiel.spiel_id);
    expect(updatedHeimSpiel?.heim_team_id).toBe(userTeamId);

    const updatedGastSpiel = await db.spiele.get(gastSpiel.spiel_id);
    expect(updatedGastSpiel?.gast_team_id).toBe(userTeamId);

    // Nur 1 Team übrig
    const allTeams = await db.teams.toArray();
    expect(allTeams).toHaveLength(1);
    expect(allTeams[0].team_id).toBe(userTeamId);
  });

  it('should find Spiele by heim_team_id and gast_team_id after merge', async () => {
    // ARRANGE
    const liga = {
      liga_id: crypto.randomUUID(),
      bbb_liga_id: '51961',
      name: 'Test Liga',
      saison: '2025/26',
      altersklasse: 'U10' as const,
      created_at: new Date(),
      sync_am: new Date(),
    };
    await db.ligen.add(liga);

    const verein = {
      verein_id: crypto.randomUUID(),
      name: 'Test Verein',
      ort: 'Test',
      ist_eigener_verein: true,
      created_at: new Date(),
    };
    await db.vereine.add(verein);

    const userTeamId = crypto.randomUUID();
    const userTeam: Team = {
      team_id: userTeamId,
      verein_id: verein.verein_id,
      name: 'Test Team',
      trainer: 'Trainer',
      team_typ: 'eigen',
      created_at: new Date(),
    };
    await db.teams.add(userTeam);

    // Erstelle Spiele MIT user team als heim/gast (nach Merge!)
    const heimSpiel: Spiel = {
      spiel_id: crypto.randomUUID(),
      extern_spiel_id: '123',
      liga_id: liga.liga_id,
      spielnr: 1,
      spieltag: 1,
      datum: new Date(),
      uhrzeit: '18:00',
      heim_team_id: userTeamId,
      gast_team_id: crypto.randomUUID(),
      heim: 'Test Team',
      gast: 'Gegner',
      ist_heimspiel: true,
      status: 'geplant',
      created_at: new Date(),
    };
    await db.spiele.add(heimSpiel);

    const gastSpiel: Spiel = {
      spiel_id: crypto.randomUUID(),
      extern_spiel_id: '124',
      liga_id: liga.liga_id,
      spielnr: 2,
      spieltag: 2,
      datum: new Date(),
      uhrzeit: '10:30',
      heim_team_id: crypto.randomUUID(),
      gast_team_id: userTeamId,
      heim: 'Gegner',
      gast: 'Test Team',
      ist_heimspiel: false,
      status: 'geplant',
      created_at: new Date(),
    };
    await db.spiele.add(gastSpiel);

    // ACT - Finde Spiele wie TabellenService (v7.0)
    const foundHeimSpiele = await db.spiele
      .where('heim_team_id')
      .equals(userTeamId)
      .toArray();

    const foundGastSpiele = await db.spiele
      .where('gast_team_id')
      .equals(userTeamId)
      .toArray();

    const alleSpiele = [...foundHeimSpiele, ...foundGastSpiele];

    // ASSERT
    expect(alleSpiele).toHaveLength(2);
    expect(alleSpiele[0].liga_id).toBe(liga.liga_id);
    expect(alleSpiele[1].liga_id).toBe(liga.liga_id);
  });
});
