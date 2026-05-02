# Test-Plan für DB v7.0 - Team-Liga-Relationships

**Datum:** 29. Oktober 2025  
**Status:** 🧪 Testing Plan

---

## 🎯 Test-Scope

### Breaking Changes zu testen:
1. Team-Deduplizierung über `teamPermanentId`
2. Team ohne `altersklasse`, `saison`, `liga_id`
3. Neue Tabelle `team_liga_participations`
4. BBBSyncService Refactoring
5. Spiel-Queries mit Participations

---

## 🧪 Unit Tests

### 1. BBBSyncService.test.ts

```typescript
describe('BBBSyncService v7.0', () => {
  describe('createOrFindTeam', () => {
    it('should create team with teamPermanentId', async () => {
      const team = await service.createOrFindTeam({
        teamPermanentId: 186126,
        teamName: 'FC Tegernheim U12',
        vereinId: 'verein-123',
      });

      expect(team.extern_permanent_id).toBe('186126');
      expect(team.name).toBe('FC Tegernheim U12');
      expect(team).not.toHaveProperty('altersklasse'); // ✅ v7.0
      expect(team).not.toHaveProperty('saison');        // ✅ v7.0
      expect(team).not.toHaveProperty('liga_id');       // ✅ v7.0
    });

    it('should deduplicate team by teamPermanentId', async () => {
      // Create first time
      const team1 = await service.createOrFindTeam({
        teamPermanentId: 186126,
        teamName: 'FC Tegernheim U12',
        vereinId: 'verein-123',
      });

      // Create again with same permanentId but different name
      const team2 = await service.createOrFindTeam({
        teamPermanentId: 186126,
        teamName: 'FC Tegernheim U12 2024/25', // Name geändert!
        vereinId: 'verein-123',
      });

      expect(team1.team_id).toBe(team2.team_id); // ✅ Same team!
      expect(team2.name).toBe('FC Tegernheim U12 2024/25'); // Name updated
    });
  });

  describe('createOrUpdateParticipation', () => {
    it('should create team-liga participation', async () => {
      const participation = await service.createOrUpdateParticipation({
        teamId: 'team-123',
        ligaId: 'liga-456',
        seasonTeamId: 432429,
        altersklasse: 'U12',
        saison: '2024/25',
      });

      expect(participation.team_id).toBe('team-123');
      expect(participation.liga_id).toBe('liga-456');
      expect(participation.extern_season_team_id).toBe('432429');
      expect(participation.altersklasse).toBe('U12');
      expect(participation.saison).toBe('2024/25');
      expect(participation.ist_aktiv).toBe(true);
    });

    it('should deduplicate participation by team+liga', async () => {
      const part1 = await service.createOrUpdateParticipation({
        teamId: 'team-123',
        ligaId: 'liga-456',
        seasonTeamId: 432429,
        altersklasse: 'U12',
        saison: '2024/25',
      });

      // Same team+liga, different seasonTeamId
      const part2 = await service.createOrUpdateParticipation({
        teamId: 'team-123',
        ligaId: 'liga-456',
        seasonTeamId: 999999, // Geändert!
        altersklasse: 'U12',
        saison: '2024/25',
      });

      expect(part1.participation_id).toBe(part2.participation_id); // Same!
      expect(part2.extern_season_team_id).toBe('999999'); // Updated
    });
  });

  describe('findTeamByPermanentId', () => {
    it('should find team by permanent id', async () => {
      await service.createOrFindTeam({
        teamPermanentId: 186126,
        teamName: 'FC Tegernheim U12',
        vereinId: 'verein-123',
      });

      const found = await service.findTeamByPermanentId(186126);
      
      expect(found).toBeDefined();
      expect(found?.extern_permanent_id).toBe('186126');
    });

    it('should return undefined for non-existent permanent id', async () => {
      const found = await service.findTeamByPermanentId(999999);
      expect(found).toBeUndefined();
    });
  });

  describe('syncTabelleAndTeams', () => {
    it('should sync teams with participations', async () => {
      // Mock API response
      mockApiResponse({
        liganame: 'U12 männlich Bezirksoberliga 2024/25',
        teams: [
          {
            team: {
              seasonTeamId: 432429,
              teamCompetitionId: 432429,
              teamPermanentId: 186126,
              teamname: 'FC Tegernheim U12',
              clubId: 428,
              clubName: 'FC Tegernheim',
            },
            rang: 1,
            s: 4,
            n: 0,
          }
        ]
      });

      await service.syncTabelleAndTeams(51961);

      // Check Team
      const team = await db.teams
        .where('extern_permanent_id')
        .equals('186126')
        .first();

      expect(team).toBeDefined();
      expect(team?.name).toBe('FC Tegernheim U12');
      expect(team).not.toHaveProperty('altersklasse'); // ✅ v7.0

      // Check Participation
      const participation = await db.team_liga_participations
        .where('team_id')
        .equals(team!.team_id)
        .first();

      expect(participation).toBeDefined();
      expect(participation?.altersklasse).toBe('U12');
      expect(participation?.saison).toBe('2024/25');
      expect(participation?.extern_season_team_id).toBe('432429');
    });
  });

  describe('Multi-Season Scenario', () => {
    it('should track team across multiple seasons', async () => {
      const teamPermanentId = 186126;
      
      // Season 2024/25 - U12 Bezirksliga
      await service.syncTabelleAndTeams(51961); // Liga 51961
      
      const team = await db.teams
        .where('extern_permanent_id')
        .equals(teamPermanentId.toString())
        .first();

      // Check first participation
      const part1 = await db.team_liga_participations
        .where('team_id')
        .equals(team!.team_id)
        .first();

      expect(part1?.saison).toBe('2024/25');
      expect(part1?.altersklasse).toBe('U12');

      // Season 2025/26 - U12 Bezirksoberliga (aufgestiegen!)
      await service.syncTabelleAndTeams(99999); // Liga 99999 (neue Saison)

      // Check second participation
      const participations = await db.team_liga_participations
        .where('team_id')
        .equals(team!.team_id)
        .toArray();

      expect(participations.length).toBe(2); // ✅ Zwei Saisons!
      expect(participations[0].saison).toBe('2024/25');
      expect(participations[1].saison).toBe('2025/26');
    });
  });
});
```

---

## 🔗 Integration Tests

### 1. Full Liga Sync with Participations

```typescript
describe('Integration: Full Liga Sync v7.0', () => {
  it('should sync complete liga with teams and participations', async () => {
    await service.syncLiga(51961);

    // Check Liga
    const liga = await db.ligen
      .where('bbb_liga_id')
      .equals('51961')
      .first();

    expect(liga).toBeDefined();

    // Check Teams
    const teams = await db.teams.toArray();
    expect(teams.length).toBeGreaterThan(0);

    // Check Participations
    for (const team of teams) {
      const participations = await db.team_liga_participations
        .where('team_id')
        .equals(team.team_id)
        .toArray();

      expect(participations.length).toBeGreaterThan(0);
      expect(participations[0].altersklasse).toBeDefined();
      expect(participations[0].saison).toBeDefined();
    }

    // Check Spiele
    const spiele = await db.spiele
      .where('liga_id')
      .equals(liga!.liga_id)
      .toArray();

    expect(spiele.length).toBeGreaterThan(0);

    // Verify Teams in Spiele have Participations
    for (const spiel of spiele) {
      if (spiel.heim_team_id) {
        const heimPart = await db.team_liga_participations
          .where('[team_id+liga_id]')
          .equals([spiel.heim_team_id, liga!.liga_id])
          .first();

        expect(heimPart).toBeDefined();
      }
    }
  });
});
```

---

## 🎭 E2E Tests (Playwright)

### 1. Onboarding mit v7.0 Teams

```typescript
test('should complete onboarding with v7.0 team structure', async ({ page }) => {
  // 1. Enter BBB URL
  await page.goto('/onboarding');
  await page.fill('input[name="bbbUrl"]', 'https://www.basketball-bund.net/wam/tabelle/id/51961');
  await page.click('button:has-text("Weiter")');

  // 2. Wait for sync
  await page.waitForSelector('text=Tabelle geladen');

  // 3. Select team
  await page.click('text=FC Tegernheim U12');
  await page.click('button:has-text("Team auswählen")');

  // 4. Complete onboarding
  await page.click('button:has-text("Fertig")');

  // 5. Verify Team in DB
  const team = await db.teams.toCollection().first();
  expect(team?.extern_permanent_id).toBe('186126');
  expect(team).not.toHaveProperty('altersklasse'); // ✅ v7.0

  // 6. Verify Participation
  const participation = await db.team_liga_participations
    .where('team_id')
    .equals(team!.team_id)
    .first();

  expect(participation).toBeDefined();
  expect(participation?.altersklasse).toBe('U12');
});
```

---

## 🔍 Manual Testing Checklist

### Database Structure
- [ ] `teams` table has no `altersklasse`, `saison`, `liga_id`
- [ ] `teams` table has `extern_permanent_id` (not `extern_team_id`)
- [ ] `team_liga_participations` table exists
- [ ] Compound indices work: `[team_id+liga_id]`, `[team_id+ist_aktiv]`

### BBB Sync
- [ ] Team wird über `teamPermanentId` dedupliziert
- [ ] Team-Name kann sich ändern ohne neue Team-Entity
- [ ] Participation wird pro Liga erstellt
- [ ] Spiele referenzieren Teams korrekt

### Multi-Season
- [ ] Ein Team kann in mehreren Saisons spielen
- [ ] Alte Participations bleiben erhalten
- [ ] `ist_aktiv` flag wird korrekt gesetzt

### UI
- [ ] Dashboard zeigt Team-Daten korrekt (aus Participation)
- [ ] Team-Wechsel funktioniert
- [ ] Spiele werden korrekt angezeigt

---

## 🚀 Test Execution Order

1. **Unit Tests** - BBBSyncService Methods
   ```bash
   npm test -- BBBSyncService.v7
   ```

2. **Integration Tests** - Full Liga Sync
   ```bash
   npm test -- integration/liga-sync-v7
   ```

3. **Database Tests** - Schema Validation
   ```bash
   npm test -- database.v7
   ```

4. **E2E Tests** - Onboarding Flow
   ```bash
   npm run test:e2e -- onboarding-v7
   ```

5. **Manual Testing** - Dashboard & UI
   - Open app in browser
   - Complete onboarding
   - Verify data in DevTools → IndexedDB

---

## ✅ Success Criteria

- [ ] Alle Unit Tests grün
- [ ] Alle Integration Tests grün
- [ ] Alle E2E Tests grün
- [ ] Onboarding funktioniert mit v7.0 Schema
- [ ] Teams werden korrekt dedupliziert
- [ ] Participations werden erstellt
- [ ] Spiele zeigen korrekte Team-Daten
- [ ] Multi-Season Tracking funktioniert

---

**Status:** 📋 Bereit für Implementation  
**Next:** Unit Tests schreiben (RED)
