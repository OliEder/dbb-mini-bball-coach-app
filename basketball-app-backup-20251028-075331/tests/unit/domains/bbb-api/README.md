# BBB API Integration Tests

**Datum:** 25. Oktober 2025  
**Status:** ✅ Tests erstellt

---

## 📋 Test-Übersicht

### Unit Tests

#### 1. BBBApiService.test.ts
**Pfad:** `tests/unit/domains/bbb-api/BBBApiService.test.ts`

**Testet:**
- ✅ Korrektes Mapping von deutschen API-Feldnamen zu internen Strukturen
- ✅ Tabelle-Endpoint: `rang`, `teamname`, `s`, `n`, `koerbe`, `gegenKoerbe`
- ✅ Spielplan-Endpoint: `matchId`, `kickoffDate`, `result` parsing
- ✅ CORS Proxy Fallback-Logik
- ✅ Error Handling bei API-Fehlern
- ✅ Graceful Handling von fehlenden Daten

**Testfälle:**
- `should correctly map German API response to internal structure` (Tabelle)
- `should correctly map German API response to internal structure` (Spielplan)
- `should handle missing tabelle.entries gracefully`
- `should handle missing venue gracefully`
- `should parse result string correctly` (`"42:38"` → `homeScore: 42, awayScore: 38`)
- `should try multiple CORS proxies on failure`
- `should handle API errors`

**Wichtige Erkenntnisse:**
```typescript
// API Response (Deutsch!)
{
  rang: 1,                    // position
  team: {
    seasonTeamId: 432555,     // teamId
    teamname: "..."           // teamName (klein!)
  },
  anzspiele: 4,               // games
  s: 4,                       // wins (Siege!)
  n: 0,                       // losses (Niederlagen!)
  koerbe: 362,                // scoredPoints
  gegenKoerbe: 271            // concededPoints
}
```

---

#### 2. BBBSyncService.test.ts
**Pfad:** `tests/unit/domains/bbb-api/BBBSyncService.test.ts`

**Testet:**
- ✅ Liga-Sync erstellt Liga mit korrekter `bbb_liga_id` (String!)
- ✅ Liga-Sync speichert `liga_id` (UUID) in Spielen
- ✅ Teams werden mit `extern_team_id` erstellt
- ✅ Keine Team-Duplikate bei Re-Sync
- ✅ Error wenn Liga nicht gefunden wird

**Testfälle:**
- `should sync liga with correct data structures`
- `should store liga_id in Spiele`
- `should throw error if Liga not found when syncing Spielplan`
- `should create Liga with correct bbb_liga_id`
- `should update existing Liga on re-sync`
- `should create Team with extern_team_id`
- `should not create duplicate Teams`

**Wichtige Validierungen:**
```typescript
// Liga-ID muss in Spielen gespeichert sein!
expect(spiel.liga_id).toBeDefined();
expect(spiel.liga_id).toBe(liga.liga_id); // UUID!

// extern_team_id muss gesetzt sein
expect(team.extern_team_id).toBe('432555');
```

---

### Integration Tests

#### 3. team-merge.test.ts
**Pfad:** `tests/integration/onboarding/team-merge.test.ts`

**Testet:**
- ✅ Kompletter Merge-Flow im Onboarding
- ✅ User-Team erhält `extern_team_id` vom Sync-Team
- ✅ Spiele werden auf User-Team umgebogen
- ✅ Sync-Team wird gelöscht (kein Duplikat)
- ✅ Spiele sind nach Merge über `team_id` findbar

**Testfälle:**
- `should merge User-Team with Sync-Team and update Spiele references`
- `should find Spiele by team_id after merge`

**Kritischer Flow:**
```typescript
// 1. User erstellt Team (ohne extern_team_id)
const userTeam = { name: 'Team A', /* no extern_team_id */ };

// 2. Sync erstellt Team (mit extern_team_id)
const syncTeam = { name: 'Team A', extern_team_id: '123' };

// 3. Merge
await db.teams.update(userTeam.team_id, {
  extern_team_id: syncTeam.extern_team_id
});

// 4. Update Spiele
for (const spiel of heimSpiele) {
  await db.spiele.update(spiel.spiel_id, {
    heim_team_id: userTeam.team_id
  });
}

// 5. Delete Sync-Team
await db.teams.delete(syncTeam.team_id);
```

---

## 🚀 Tests ausführen

```bash
# Alle Tests
npm test

# Nur Unit Tests
npm test tests/unit

# Nur Integration Tests
npm test tests/integration

# Spezifischer Test
npm test tests/unit/domains/bbb-api/BBBApiService.test.ts

# Mit Coverage
npm test -- --coverage
```

---

## ✅ Test Coverage Ziele

| Component | Unit Tests | Integration Tests | Coverage Target |
|-----------|------------|-------------------|-----------------|
| BBBApiService | ✅ | - | 90% |
| BBBSyncService | ✅ | ✅ | 85% |
| Onboarding Team-Merge | - | ✅ | 80% |
| TabellenService | 🔜 TODO | - | 85% |

---

## 🔜 Fehlende Tests (TODO)

### Unit Tests
- [ ] TabellenService.test.ts
  - `loadTabelleForTeam()` mit Team → Spiele → Liga lookup
  - `berechneTabelleAusSpiele()` Logik
  - Error Handling

### Integration Tests
- [ ] Vollständiger Liga-Sync E2E
  - Von API-Call bis DB-Speicherung
  - Mit echten API-Response-Beispielen
- [ ] Onboarding Complete Flow
  - User-Input → BBB-Sync → Team-Merge → Dashboard

### E2E Tests
- [ ] Onboarding mit BBB-Import (Playwright)
  - URL eingeben → Sync → Dashboard zeigt Spiele

---

## 📚 Test Data

**API Response Examples:**
```
basketball-bund-api/Resonses BBB-API/
├── Tabelle_LigaID51961.json
├── Spielplan_LigaID51961.json
└── MatchInfo_MatchID2804049.json
```

**Verwendung in Tests:**
```typescript
import tabelleResponse from '@/basketball-bund-api/Resonses BBB-API/Tabelle_LigaID51961.json';

mockBBBApiService.getTabelle.mockResolvedValueOnce(tabelleResponse);
```

---

## 🐛 Test-Driven Bug Prevention

**Lessons Learned aus diesem Bug:**

1. **Immer echte API-Responses testen**
   ```typescript
   // ❌ FALSCH: Angenommene Struktur
   expect(team.teamName).toBe('...');
   
   // ✅ RICHTIG: Echte API-Struktur
   expect(team.teamname).toBe('...'); // Klein!
   ```

2. **Datenbank-Constraints validieren**
   ```typescript
   // Spiele MÜSSEN liga_id haben!
   expect(spiel.liga_id).toBeDefined();
   expect(spiel.liga_id).not.toBe('');
   ```

3. **Team-Merge kritisch testen**
   ```typescript
   // Nach Merge: Nur 1 Team übrig!
   const teams = await db.teams.toArray();
   expect(teams).toHaveLength(1);
   ```

4. **Referenz-Integrität prüfen**
   ```typescript
   // Spiele zeigen auf User-Team, nicht Sync-Team!
   expect(spiel.heim_team_id).toBe(userTeam.team_id);
   expect(spiel.heim_team_id).not.toBe(syncTeam.team_id);
   ```

---

## 🎯 Test Execution Checklist

Vor jedem Release:

- [ ] Alle Unit Tests grün
- [ ] Alle Integration Tests grün
- [ ] Coverage ≥ 85% für BBB-Integration
- [ ] Keine TypeScript-Fehler
- [ ] Manual Test: Onboarding durchlaufen
- [ ] Manual Test: Spiele im Dashboard sichtbar

---

**Erstellt:** 25. Oktober 2025  
**Author:** AI Assistant (Claude)  
**Review:** Oliver Marcuseder
